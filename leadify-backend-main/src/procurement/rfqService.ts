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

class RFQService {
    async createRFQ(input: any, user: User): Promise<RFQ> {
        const transaction = await sequelize.transaction();
        try {
            const { items, ...rfqData } = input;

            const count = await RFQ.count();
            const rfqNumber = `RFQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

            const rfq = await RFQ.create({
                ...rfqData,
                rfqNumber,
                createdBy: user.id
            }, { transaction });

            if (items && Array.isArray(items)) {
                const rfqItems = items.map((item: any) => ({
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
            include: [
                { model: RFQItem },
                { model: RFQVendor, include: [Vendor] },
                { model: User, as: 'creator' }
            ]
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
            // TODO: Trigger Email Service Here
            return this.getRFQById(rfqId);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async addVendorResponse(rfqId: string, vendorId: number, input: any): Promise<RFQVendor> {
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

                const responseItems = items.map((item: any) => {
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
                    include: [
                        { model: Vendor },
                        { model: RFQVendorItem }
                    ]
                }
            ]
        });
        if (!rfq) throw new BaseError(ERRORS.RFQ_NOT_FOUND);
        return rfq;
    }

    async getRFQs(query: any): Promise<any> {
        const { page = 1, limit = 10 } = query;
        const offset = (Number(page) - 1) * Number(limit);

        const { rows: docs, count: totalItems } = await RFQ.findAndCountAll({
            include: [{ model: Project, attributes: ['name'] }],
            limit: Number(limit),
            offset: Number(offset),
            order: [['createdAt', 'DESC']]
        });

        return {
            docs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages: Math.ceil(totalItems / (Number(limit) || 10))
            }
        };
    }
}

export default new RFQService();
