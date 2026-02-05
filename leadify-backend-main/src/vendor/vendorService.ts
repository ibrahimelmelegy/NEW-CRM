import { Op, WhereOptions } from 'sequelize';
import Vendor, { VendorTypeEnum } from './vendorModel';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { createActivityLog } from '../activity-logs/activityService';

class VendorService {
    async createVendor(input: any, user: User): Promise<Vendor> {
        if (input.serviceType === "") input.serviceType = null;
        const vendor = await Vendor.create(input);
        await createActivityLog('vendor', 'create', vendor.id, user.id, null, 'Vendor created successfully');
        return vendor;
    }

    async updateVendor(id: string, input: any, user: User): Promise<Vendor> {
        if (input.serviceType === "") input.serviceType = null;
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

    async getVendors(query: any): Promise<any> {
        console.log('DEBUG: getVendors query:', query);
        const { page = 1, limit = 10, searchKey } = query;
        const offset = (Number(page) - 1) * Number(limit);

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
                        { lastName: { [Op.iLike]: `%${searchKey}%` } },
                        { email: { [Op.iLike]: `%${searchKey}%` } },
                        // Cast JSONB brands to text for searching
                        {
                            [Op.and]: [
                                // Simple text cast for partial match within the array string representation
                                require('sequelize').literal(`CAST("Vendor"."brands" AS TEXT) ILIKE '%${searchKey}%'`)
                            ]
                        }
                    ]
                })
            },
            limit: Number(limit),
            offset: Number(offset),
            order: [['createdAt', 'DESC']]
        });

        return {
            docs: vendors,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages: Math.ceil(totalItems / (Number(limit) || 10))
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
