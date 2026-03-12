import { Op } from 'sequelize';
import ProposalLog from './proposalLogModel';
import User from '../user/userModel';
import proposalService from '../proposal/proposalService';
import { clampPagination } from '../utils/pagination';

class ProposalLogService {
  public async createProposalLog(userId: number, proposalId: string, action: string): Promise<void> {
    await ProposalLog.create({ userId, proposalId, action });
  }

  public async getProposalLogs(query: Record<string, unknown>, user: User): Promise<any> {
    await proposalService.validateProposalAccess(query.proposalId, user);

    const { page, limit, offset } = clampPagination(query);

    const { rows: items, count: totalItems } = await ProposalLog.findAndCountAll({
      where: {
        proposalId: query.proposalId,
        ...(query.searchKey && {
          [Op.or]: [{ action: { [Op.iLike]: `%${query.searchKey}%` } }]
        })
      },
      limit,
      offset,
      include: [
        {
          model: User,
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return {
      docs: items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }
}

export default new ProposalLogService();
