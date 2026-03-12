import { sequelize } from '../config/db';
import User from '../user/userModel';
import RFQ, { RFQStatusEnum } from './models/rfqModel';
import RFQItem from './models/rfqItemModel';
import RFQVendor, { RFQVendorStatusEnum } from './models/rfqVendorModel';
import RFQVendorItem from './models/rfqVendorItemModel';
import Vendor from '../vendor/vendorModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import Project from '../project/models/projectModel';
import { clampPagination } from '../utils/pagination';
import notificationCenterService from '../notification/notificationCenterService';
import logger from '../config/logger';

class RFQService {
  async createRFQ(input: Record<string, unknown>, user: User): Promise<RFQ> {
    const transaction = await sequelize.transaction();
    try {
      const { items, ...rfqData } = input;

      const count = await RFQ.count();
      const rfqNumber = `RFQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

      const rfq = await RFQ.create(
        {
          ...rfqData,
          rfqNumber,
          createdBy: user.id
        },
        { transaction }
      );

      if (items && Array.isArray(items)) {
        const rfqItems = items.map(item => ({
          ...item,
          rfqId: rfq.id
        }));
        await RFQItem.bulkCreate(rfqItems, { transaction });
      }

      await transaction.commit();

      return await this.getRFQById(rfq.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getRFQById(id: string): Promise<RFQ> {
    const rfq = await RFQ.findByPk(id, {
      include: [{ model: RFQItem }, { model: RFQVendor, include: [Vendor] }, { model: User, as: 'creator' }]
    });
    if (!rfq) throw new BaseError(ERRORS.RFQ_NOT_FOUND); // Using generic not found for now
    return rfq;
  }

  async sendRFQToVendors(rfqId: string, vendorIds: number[]): Promise<RFQ> {
    const rfq = await this.getRFQById(rfqId);
    const transaction = await sequelize.transaction();

    try {
      const vendorsToAdd = vendorIds.map(vendorId => ({
        rfqId,
        vendorId,
        status: RFQVendorStatusEnum.PENDING
      }));

      await RFQVendor.bulkCreate(vendorsToAdd, { transaction });

      rfq.status = RFQStatusEnum.SENT;
      await rfq.save({ transaction });

      await transaction.commit();

      // Notify the RFQ creator that the RFQ has been sent to vendors
      try {
        if (rfq.createdBy) {
          await notificationCenterService.sendNotification({
            userId: rfq.createdBy,
            type: 'SYSTEM_ALERT',
            title: 'RFQ Sent to Vendors',
            message: `RFQ ${rfq.rfqNumber} has been sent to ${vendorIds.length} vendor(s).`,
            entityType: 'rfq',
            entityId: String(rfq.id),
            actionUrl: `/procurement/rfq/${rfq.id}`
          });
        }
      } catch (notifError) {
        logger.error({ err: notifError, rfqId }, 'Failed to send RFQ notification');
      }

      return this.getRFQById(rfqId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async addVendorResponse(rfqId: string, vendorId: number, input: Record<string, unknown>): Promise<RFQVendor> {
    const transaction = await sequelize.transaction();
    try {
      const rfqVendor = await RFQVendor.findOne({
        where: { rfqId, vendorId }
      });

      if (!rfqVendor) throw new Error('Vendor not invited to this RFQ');

      const { items, notes } = input;
      let totalOffer = 0;

      if (items && Array.isArray(items)) {
        // Delete existing response items if any
        await RFQVendorItem.destroy({ where: { rfqVendorId: rfqVendor.id }, transaction });

        const responseItems = items.map(item => {
          totalOffer += Number(item.price) || 0;
          return {
            rfqVendorId: rfqVendor.id,
            rfqItemId: item.rfqItemId,
            price: item.price,
            remarks: item.remarks
          };
        });

        await RFQVendorItem.bulkCreate(responseItems, { transaction });
      }

      rfqVendor.status = RFQVendorStatusEnum.RESPONDED;
      rfqVendor.totalOfferAmount = totalOffer;
      rfqVendor.notes = notes;
      await rfqVendor.save({ transaction });

      await transaction.commit();
      return rfqVendor;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getComparison(rfqId: string): Promise<any> {
    const rfq = await RFQ.findByPk(rfqId, {
      include: [
        { model: RFQItem },
        {
          model: RFQVendor,
          include: [{ model: Vendor }, { model: RFQVendorItem }]
        }
      ]
    });
    if (!rfq) throw new BaseError(ERRORS.RFQ_NOT_FOUND);
    return rfq;
  }

  async getRFQs(query: Record<string, unknown>): Promise<any> {
    const { page, limit, offset } = clampPagination(query);

    const { rows: docs, count: totalItems } = await RFQ.findAndCountAll({
      include: [{ model: Project, attributes: ['name'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }
}

export default new RFQService();
