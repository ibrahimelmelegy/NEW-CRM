import { Op } from 'sequelize';
import FieldCheckIn from './checkInModel';
import User from '../user/userModel';
import { sequelize } from '../config/db';

class FieldOpsService {
  async getCheckIns(query: any) {
    const { page = 1, limit = 20, userId, type, startDate, endDate } = query;
    const where: any = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { rows, count } = await FieldCheckIn.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    return {
      docs: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: count,
        totalPages: Math.ceil(count / Number(limit))
      }
    };
  }

  async createCheckIn(data: any, userId: number) {
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
