import { Op } from 'sequelize';
import { clampPagination } from '../utils/pagination';
import FieldCheckIn from './checkInModel';
import User from '../user/userModel';
import { sequelize } from '../config/db';

class FieldOpsService {
  async getCheckIns(query: unknown) {
    const { page, limit, offset } = clampPagination(query, 20);
    const { userId, type, startDate, endDate } = query;
    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }
    const { rows, count } = await FieldCheckIn.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async createCheckIn(data: unknown, userId: number) {
    return FieldCheckIn.create({
      ...data,
      userId
    });
  }

  async getUserHistory(userId: number) {
    return FieldCheckIn.findAll({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
  }

  async getTeamLocations() {
    // Get the latest check-in for each user
    const latestCheckIns = await sequelize.query(
      `
      SELECT DISTINCT ON ("userId") *
      FROM field_check_ins
      ORDER BY "userId", "createdAt" DESC
    `,
      {
        model: FieldCheckIn,
        mapToModel: true
      }
    );

    // Load user data for each check-in
    const checkInsWithUsers = await Promise.all(
      latestCheckIns.map(async checkIn => {
        const user = await User.findByPk(checkIn.userId, {
          attributes: ['id', 'name', 'email', 'profilePicture']
        });
        return {
          ...checkIn.toJSON(),
          user
        };
      })
    );

    return checkInsWithUsers;
  }
}

export default new FieldOpsService();
