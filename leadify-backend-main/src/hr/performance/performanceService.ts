import { Op } from 'sequelize';
import PerformanceReview from './performanceModel';
import Employee from '../models/employeeModel';
import User from '../../user/userModel';
import { clampPagination } from '../../utils/pagination';
import { io } from '../../server';

class PerformanceService {
  async create(data: Record<string, unknown>, tenantId?: string) {
    return PerformanceReview.create({ ...data, tenantId });
  }

  async getAll(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.period) where.period = query.period;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.search) {
      where[Op.or] = [{ period: { [Op.iLike]: `%${query.search}%` } }];
    }

    const { rows, count } = await PerformanceReview.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'jobTitle', 'departmentId'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return PerformanceReview.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] }
      ]
    });
  }

  async update(id: number, data: Record<string, unknown>) {
    const review = await PerformanceReview.findByPk(id);
    if (!review) return null;
    await review.update(data);
    return this.getById(id);
  }

  async delete(id: number) {
    const review = await PerformanceReview.findByPk(id);
    if (!review) return false;
    await review.destroy();
    return true;
  }

  /* ───────────────────── Business Logic ───────────────────── */

  /**
   * Calculate the weighted-average overall rating from the review's JSONB `ratings` and `goals` fields.
   *
   * `ratings` is expected to be a map like: { competencies: { score: 4, weight: 30 }, values: { score: 3.5, weight: 20 }, ... }
   * `goals` is an array of: [{ title, status, weight }] where status COMPLETED/MET maps to full score.
   *
   * Returns the computed overall score (1-5) and saves it on the review.
   */
  async calculateOverallRating(reviewId: number) {
    const review = await PerformanceReview.findByPk(reviewId);
    if (!review) throw new Error('Review not found');

    let totalWeight = 0;
    let weightedSum = 0;

    // Process dimension ratings (JSONB object with score + weight per dimension)
    if (review.ratings && typeof review.ratings === 'object') {
      for (const key of Object.keys(review.ratings)) {
        const dimension = review.ratings[key];
        if (dimension && typeof dimension.score === 'number' && typeof dimension.weight === 'number') {
          weightedSum += dimension.score * dimension.weight;
          totalWeight += dimension.weight;
        }
      }
    }

    // Process goals (array with weight per goal; completed goals get score 5, others get 1)
    if (Array.isArray(review.goals)) {
      for (const goal of review.goals) {
        const weight = goal.weight || 0;
        const isCompleted = ['COMPLETED', 'MET', 'ACHIEVED'].includes((goal.status || '').toUpperCase());
        const goalScore = isCompleted ? 5 : 1;
        weightedSum += goalScore * weight;
        totalWeight += weight;
      }
    }

    const overallRating = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : null;

    if (overallRating !== null) {
      await review.update({ overallRating });
    }

    return { reviewId, overallRating, totalWeight };
  }

  /**
   * Distribution of employees across rating brackets for a given period.
   * Buckets: 1-2 = Needs Improvement, 2-3 = Meets Expectations, 3-4 = Exceeds, 4-5 = Outstanding.
   */
  async getPerformanceDistribution(tenantId: string, period: string) {
    const where: Record<string, unknown> = {
      tenantId,
      period,
      overallRating: { [Op.ne]: null }
    };

    const reviews = await PerformanceReview.findAll({
      where,
      attributes: ['overallRating'],
      raw: true
    });

    const distribution = {
      needsImprovement: 0, // 1.0 - 1.99
      meetsExpectations: 0, // 2.0 - 2.99
      exceeds: 0, // 3.0 - 3.99
      outstanding: 0 // 4.0 - 5.0
    };

    for (const r of reviews) {
      const rating = Number(r.overallRating);
      if (rating < 2) distribution.needsImprovement++;
      else if (rating < 3) distribution.meetsExpectations++;
      else if (rating < 4) distribution.exceeds++;
      else distribution.outstanding++;
    }

    const total = reviews.length;
    return {
      total,
      distribution,
      percentages:
        total > 0
          ? {
              needsImprovement: Math.round((distribution.needsImprovement / total) * 100),
              meetsExpectations: Math.round((distribution.meetsExpectations / total) * 100),
              exceeds: Math.round((distribution.exceeds / total) * 100),
              outstanding: Math.round((distribution.outstanding / total) * 100)
            }
          : null
    };
  }

  /**
   * Get performance reviews for all direct reports of a given manager for a specific period.
   * Returns individual review data plus team aggregate statistics.
   */
  async getTeamPerformance(managerId: string, period: string) {
    // Find all employees reporting to this manager
    const directReports = await Employee.findAll({
      where: { managerId },
      attributes: ['id', 'firstName', 'lastName', 'jobTitle']
    });

    if (directReports.length === 0) {
      return { directReports: [], reviews: [], stats: null };
    }

    const employeeIds = directReports.map(e => e.id);

    const reviews = await PerformanceReview.findAll({
      where: {
        employeeId: { [Op.in]: employeeIds },
        period
      },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'jobTitle'] }],
      order: [['overallRating', 'DESC']]
    });

    const ratings = reviews.map(r => Number(r.overallRating)).filter(r => !isNaN(r) && r > 0);

    const stats =
      ratings.length > 0
        ? {
            averageRating: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
            highestRating: Math.max(...ratings),
            lowestRating: Math.min(...ratings),
            reviewedCount: ratings.length,
            pendingCount: directReports.length - ratings.length
          }
        : null;

    return { directReports, reviews, stats };
  }

  /**
   * Compare an employee's performance across multiple periods.
   * Returns ratings by period and an overall trend indicator.
   */
  async comparePerformance(employeeId: number, periods: string[]) {
    const reviews = await PerformanceReview.findAll({
      where: {
        employeeId,
        period: { [Op.in]: periods }
      },
      attributes: ['id', 'period', 'overallRating', 'status'],
      order: [['period', 'ASC']],
      raw: true
    });

    const ratingsOverTime = reviews
      .filter(r => r.overallRating !== null)
      .map(r => ({
        period: r.period,
        rating: Number(r.overallRating),
        status: r.status
      }));

    // Determine trend based on linear progression of available ratings
    let trend: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
    if (ratingsOverTime.length >= 2) {
      const first = ratingsOverTime[0].rating;
      const last = ratingsOverTime[ratingsOverTime.length - 1].rating;
      const diff = last - first;
      if (diff > 0.3) trend = 'IMPROVING';
      else if (diff < -0.3) trend = 'DECLINING';
      else trend = 'STABLE';
    }

    return { employeeId, ratingsOverTime, trend };
  }

  /**
   * Submit a review for approval. Validates that required fields are present
   * and transitions status to SUBMITTED (mapped to COMPLETED in our status enum).
   * Prevents submission of already-completed/acknowledged reviews.
   */
  async submitReview(reviewId: number) {
    const review = await PerformanceReview.findByPk(reviewId);
    if (!review) throw new Error('Review not found');

    if (review.status === 'COMPLETED' || review.status === 'ACKNOWLEDGED') {
      throw new Error(`Review already ${review.status.toLowerCase()}, cannot re-submit`);
    }

    // Validate required fields
    const errors: string[] = [];
    if (!review.overallRating && !review.ratings) {
      errors.push('At least one rating dimension or overall rating is required');
    }
    if (!review.reviewDate) {
      errors.push('Review date is required');
    }
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }

    // If overallRating not explicitly set, compute it
    if (!review.overallRating && review.ratings) {
      await this.calculateOverallRating(reviewId);
    }

    await review.update({ status: 'COMPLETED' });
    try {
      io.emit('performance:submitted', { id: reviewId, employeeId: review.employeeId, status: 'COMPLETED' });
    } catch {}
    return this.getById(reviewId);
  }

  /**
   * Approve a submitted review. Sets status to ACKNOWLEDGED
   * and records the approver and approval timestamp in the comments.
   */
  async approveReview(reviewId: number, approverId: number) {
    const review = await PerformanceReview.findByPk(reviewId);
    if (!review) throw new Error('Review not found');

    if (review.status !== 'COMPLETED') {
      throw new Error('Only submitted (COMPLETED) reviews can be approved');
    }

    const approvalNote = `\n[Approved by user #${approverId} on ${new Date().toISOString()}]`;
    const updatedComments = (review.comments || '') + approvalNote;

    await review.update({
      status: 'ACKNOWLEDGED',
      comments: updatedComments
    });

    try {
      io.emit('performance:approved', { id: reviewId, employeeId: review.employeeId, approverId, status: 'ACKNOWLEDGED' });
    } catch {}
    return this.getById(reviewId);
  }
}

export default new PerformanceService();
