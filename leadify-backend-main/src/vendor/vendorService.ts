import { Op, WhereOptions, where, cast, col } from 'sequelize';
import Vendor, { VendorTypeEnum } from './vendorModel';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { createActivityLog } from '../activity-logs/activityService';
import { clampPagination } from '../utils/pagination';

class VendorService {
  async createVendor(input: unknown, user: User): Promise<Vendor> {
    if (input.serviceType === '') input.serviceType = null;
    const vendor = await Vendor.create(input);
    await createActivityLog('vendor', 'create', vendor.id, user.id, null, 'Vendor created successfully');
    return vendor;
  }

  async updateVendor(id: string, input: unknown, user: User): Promise<Vendor> {
    if (input.serviceType === '') input.serviceType = null;
    const vendor = await this.vendorOrError({ id });
    vendor.set(input);
    await vendor.save();
    await createActivityLog('vendor', 'update', vendor.id, user.id, null, 'Vendor updated successfully');
    return vendor;
  }

  async deleteVendor(id: string, user: User): Promise<void> {
    const vendor = await this.vendorOrError({ id });
    await vendor.destroy();
    await createActivityLog('vendor', 'delete', Number(id), user.id, null, 'Vendor deleted successfully');
  }

  async vendorOrError(filter: WhereOptions): Promise<Vendor> {
    const vendor = await Vendor.findOne({ where: filter });
    if (!vendor) throw new BaseError(ERRORS.VENDOR_NOT_FOUND);
    return vendor;
  }

  async getVendors(query: unknown): Promise<unknown> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey } = query;

    const { rows: vendors, count: totalItems } = await Vendor.findAndCountAll({
      where: {
        ...(query.type && {
          type: query.type
        }),
        ...(searchKey && {
          [Op.or]: [
            { name: { [Op.iLike]: `%${searchKey}%` } },
            { commercialRegistration: { [Op.iLike]: `%${searchKey}%` } },
            { firstName: { [Op.iLike]: `%${searchKey}%` } },
            { lastName: { [Op.iLike]: `%${searchKey}%` } },
            { email: { [Op.iLike]: `%${searchKey}%` } },
            where(
              cast(col('"Vendor"."brands"'), 'TEXT'),
              { [Op.iLike]: `%${searchKey}%` }
            )
          ]
        })
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      docs: vendors,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async getVendorById(id: string): Promise<Vendor> {
    return await this.vendorOrError({ id });
  }

  async getAllVendors(): Promise<Vendor[]> {
    return await Vendor.findAll({ attributes: ['id', 'name'], order: [['name', 'ASC']] });
  }
}

export default new VendorService();
