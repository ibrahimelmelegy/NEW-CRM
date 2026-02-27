import { Op, WhereOptions } from 'sequelize';
import EcCoupon, { CouponStatusEnum, CouponTypeEnum } from './couponModel';
import { clampPagination } from '../../utils/pagination';

interface ValidateCouponResult {
  valid: boolean;
  coupon?: EcCoupon;
  discount?: number;
  error?: string;
}

class CouponService {
  async getCoupons(query: any): Promise<any> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey, type, status } = query;

    const where: WhereOptions = {};

    if (searchKey) {
      (where as any)[Op.or] = [
        { code: { [Op.iLike]: `%${searchKey}%` } },
        { description: { [Op.iLike]: `%${searchKey}%` } }
      ];
    }

    if (type) {
      (where as any).type = type;
    }

    if (status) {
      (where as any).status = status;
    }

    const { rows: docs, count: totalItems } = await EcCoupon.findAndCountAll({
      where,
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

  async getCouponById(id: string): Promise<EcCoupon> {
    const coupon = await EcCoupon.findByPk(id);
    if (!coupon) throw new Error('Coupon not found');
    return coupon;
  }

  async validateCoupon(code: string, orderAmount: number, productIds?: string[]): Promise<ValidateCouponResult> {
    const coupon = await EcCoupon.findOne({ where: { code: code.toUpperCase() } });

    if (!coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    // Check status
    if (coupon.status !== CouponStatusEnum.ACTIVE) {
      return { valid: false, error: 'Coupon is not active' };
    }

    // Check expiry dates
    const now = new Date();
    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      return { valid: false, error: 'Coupon is not yet valid' };
    }
    if (coupon.validTo && now > new Date(coupon.validTo)) {
      return { valid: false, error: 'Coupon has expired' };
    }

    // Check usage limits
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    // Check minimum order amount
    if (Number(coupon.minOrderAmount) > 0 && orderAmount < Number(coupon.minOrderAmount)) {
      return { valid: false, error: `Minimum order amount is ${coupon.minOrderAmount}` };
    }

    // Check applicable products
    if (productIds && coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const hasApplicableProduct = productIds.some(pid => coupon.applicableProducts!.includes(pid));
      if (!hasApplicableProduct) {
        return { valid: false, error: 'Coupon is not applicable to the selected products' };
      }
    }

    // Calculate discount
    const discount = this.calculateDiscount(coupon, orderAmount);

    return { valid: true, coupon, discount };
  }

  async applyCoupon(code: string, orderAmount: number): Promise<ValidateCouponResult> {
    const validation = await this.validateCoupon(code, orderAmount);

    if (!validation.valid || !validation.coupon) {
      return validation;
    }

    // Increment usage count
    await validation.coupon.update({
      usedCount: validation.coupon.usedCount + 1
    });

    return validation;
  }

  async createCoupon(data: any): Promise<EcCoupon> {
    // Uppercase the code
    if (data.code) {
      data.code = data.code.toUpperCase().trim();
    }
    return EcCoupon.create(data);
  }

  async updateCoupon(id: string, data: any): Promise<EcCoupon> {
    const coupon = await EcCoupon.findByPk(id);
    if (!coupon) throw new Error('Coupon not found');

    // Uppercase the code if being updated
    if (data.code) {
      data.code = data.code.toUpperCase().trim();
    }

    return coupon.update(data);
  }

  async deleteCoupon(id: string): Promise<void> {
    const coupon = await EcCoupon.findByPk(id);
    if (!coupon) throw new Error('Coupon not found');
    await coupon.destroy();
  }

  private calculateDiscount(coupon: EcCoupon, orderAmount: number): number {
    let discount = 0;

    switch (coupon.type) {
      case CouponTypeEnum.PERCENTAGE:
        discount = (orderAmount * Number(coupon.value)) / 100;
        break;
      case CouponTypeEnum.FIXED:
        discount = Number(coupon.value);
        break;
      case CouponTypeEnum.FREE_SHIPPING:
        discount = 0; // Shipping discount handled at checkout level
        break;
    }

    // Cap discount at max discount amount if set
    if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
      discount = Number(coupon.maxDiscountAmount);
    }

    // Discount cannot exceed order amount
    if (discount > orderAmount) {
      discount = orderAmount;
    }

    return Math.round(discount * 100) / 100;
  }
}

export default new CouponService();
