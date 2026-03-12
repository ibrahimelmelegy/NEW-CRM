import DataLoader from 'dataloader';
import { Op } from 'sequelize';
import User from '../user/userModel';

export const createRoleUserCountLoader = () =>
  new DataLoader<string, number>(async roleIds => {
    try {
      const seq = User.sequelize;
      if (!seq) {
        return roleIds.map(() => 0);
      }

      const userCounts = await User.findAll({
        attributes: ['roleId', [seq.fn('COUNT', seq.col('id')), 'count']],
        where: { roleId: { [Op.in]: roleIds as string[] } },
        group: ['roleId'],
        raw: true
      });

      const userCountMap = new Map(userCounts.map((record: Record<string, unknown>) => [record.roleId, parseInt(record.count, 10)]));

      return roleIds.map(roleId => userCountMap.get(roleId) || 0);
    } catch {
      // If user count query fails, return 0 for all roles
      return roleIds.map(() => 0);
    }
  });
