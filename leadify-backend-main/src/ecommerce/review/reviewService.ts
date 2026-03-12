import { Op } from 'sequelize';
import EcReview, { ReviewStatusEnum } from './reviewModel';
import CatalogProduct from '../../productCatalog/productModel';
import Client from '../../client/clientModel';
import { clampPagination } from '../../utils/pagination';

class ReviewService {
  async getReviews(query: Record<string, unknown>): Promise<any> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey, productId, clientId, status, ratingMin, ratingMax } = query;

    const where: any = {};

    if (productId) where.productId = productId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    if (ratingMin || ratingMax) {
      where.rating = {};
      if (ratingMin) where.rating[Op.gte] = Number(ratingMin);
      if (ratingMax) where.rating[Op.lte] = Number(ratingMax);
    }

    if (searchKey) {
      where[Op.or] = [{ title: { [Op.iLike]: `%${searchKey}%` } }, { comment: { [Op.iLike]: `%${searchKey}%` } }];
    }

    const { rows: docs, count: totalItems } = await EcReview.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: CatalogProduct, as: 'product' },
        { model: Client, as: 'client' }
      ],
      distinct: true
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

  async getReviewById(id: string): Promise<EcReview | null> {
    const review = await EcReview.findByPk(id, {
      include: [
        { model: CatalogProduct, as: 'product' },
        { model: Client, as: 'client' }
      ]
    });
    if (!review) throw new Error('Review not found');
    return review;
  }

  async getProductReviewStats(productId: string): Promise<any> {
    const reviews = await EcReview.findAll({
      where: { productId },
      attributes: ['rating'],
      raw: true
    });

    const totalReviews = reviews.length;
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    let ratingSum = 0;
    for (const review of reviews) {
      ratingSum += review.rating;
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    }

    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(2)) : 0;

    return {
      averageRating,
      totalReviews,
      ratingDistribution
    };
  }

  async createReview(data: Record<string, unknown>): Promise<EcReview> {
    return EcReview.create(data);
  }

  async approveReview(id: string): Promise<EcReview> {
    const review = await EcReview.findByPk(id);
    if (!review) throw new Error('Review not found');
    return review.update({ status: ReviewStatusEnum.APPROVED });
  }

  async rejectReview(id: string): Promise<EcReview> {
    const review = await EcReview.findByPk(id);
    if (!review) throw new Error('Review not found');
    return review.update({ status: ReviewStatusEnum.REJECTED });
  }

  async respondToReview(id: string, response: string): Promise<EcReview> {
    const review = await EcReview.findByPk(id);
    if (!review) throw new Error('Review not found');
    return review.update({ merchantResponse: response, respondedAt: new Date() });
  }

  async deleteReview(id: string): Promise<void> {
    const review = await EcReview.findByPk(id);
    if (!review) throw new Error('Review not found');
    await review.destroy();
  }
}

export default new ReviewService();
