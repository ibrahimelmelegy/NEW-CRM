import { Op, fn, col, literal } from 'sequelize';
import Goal from './goalModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class GoalService {
  async create(data: any, tenantId?: string) {
    return Goal.create({ ...data, tenantId });
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.level) where.level = query.level;
    if (query.status) where.status = query.status;
    if (query.owner) where.owner = { [Op.iLike]: `%${query.owner}%` };
    if (query.search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } }
      ];
    }

    const { rows, count } = await Goal.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return Goal.findByPk(id);
  }

  async update(id: number, data: any) {
    const goal = await Goal.findByPk(id);
    if (!goal) return null;
    await goal.update(data);
    return goal;
  }

  async delete(id: number) {
    const goal = await Goal.findByPk(id);
    if (!goal) return false;
    await goal.destroy();
    return true;
  }

  /* ───────────────────── Business Logic ───────────────────── */

  /**
   * Update goal progress and auto-transition status.
   * - progress >= 100 => COMPLETED + completedAt timestamp
   * - progress > 0 and status NOT_STARTED => IN_PROGRESS
   * After updating, cascade to parent if this goal has a parentGoalId.
   */
  async updateProgress(goalId: number, progress: number, _userId?: number) {
    const goal = await Goal.findByPk(goalId);
    if (!goal) throw new Error('Goal not found');

    const clampedProgress = Math.max(0, Math.min(100, progress));
    const updateData: Record<string, any> = { progress: clampedProgress };

    if (clampedProgress >= 100 && goal.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED';
    } else if (clampedProgress > 0 && goal.status === 'NOT_STARTED') {
      updateData.status = 'IN_PROGRESS';
    }

    await goal.update(updateData);
    try { io.emit('goal:progress_updated', { id: goalId, title: goal.title, progress: clampedProgress, status: updateData.status || goal.status }); } catch {}
    if (clampedProgress >= 100) {
      try { io.emit('goal:completed', { id: goalId, title: goal.title }); } catch {}
    }

    // Check milestones after progress update
    await this.checkMilestones(goalId, goal.progress, clampedProgress);

    // Cascade to parent goal if applicable
    if (goal.parentGoalId) {
      await this.cascadeGoalProgress(goal.parentGoalId);
    }

    return goal.reload();
  }

  /**
   * Recalculate parent goal progress as the average of all its child goals.
   * Recursively updates up the ancestor chain.
   */
  async cascadeGoalProgress(parentGoalId: number) {
    const parent = await Goal.findByPk(parentGoalId);
    if (!parent) return;

    const children = await Goal.findAll({
      where: { parentGoalId },
      attributes: ['progress']
    });

    if (children.length === 0) return;

    const avgProgress = Math.round(
      children.reduce((sum, child) => sum + (child.progress || 0), 0) / children.length
    );

    const updateData: Record<string, any> = { progress: avgProgress };
    if (avgProgress >= 100 && parent.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED';
    } else if (avgProgress > 0 && parent.status === 'NOT_STARTED') {
      updateData.status = 'IN_PROGRESS';
    }

    await parent.update(updateData);

    // Continue cascading upward
    if (parent.parentGoalId) {
      await this.cascadeGoalProgress(parent.parentGoalId);
    }
  }

  /**
   * Aggregate goal statistics for a tenant (optionally filtered by owner).
   * Returns total, completed, in-progress, overdue counts, avg progress, completion rate.
   */
  async getGoalStats(tenantId: string, owner?: string) {
    const where: Record<string, any> = { tenantId };
    if (owner) where.owner = owner;

    const today = new Date().toISOString().split('T')[0];

    const [total, completed, inProgress, overdue, avgResult] = await Promise.all([
      Goal.count({ where }),
      Goal.count({ where: { ...where, status: 'COMPLETED' } }),
      Goal.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      Goal.count({
        where: {
          ...where,
          status: { [Op.ne]: 'COMPLETED' },
          dueDate: { [Op.lt]: today, [Op.ne]: null }
        }
      }),
      Goal.findOne({
        where,
        attributes: [[fn('AVG', col('progress')), 'avgProgress']],
        raw: true
      }) as Promise<any>
    ]);

    const avgProgress = parseFloat(avgResult?.avgProgress) || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      overdue,
      avgProgress: Math.round(avgProgress * 10) / 10,
      completionRate
    };
  }

  /**
   * Return goals whose dueDate has passed but are not yet completed.
   * Sorted by most overdue first (earliest dueDate first).
   */
  async getOverdueGoals(tenantId: string) {
    const today = new Date().toISOString().split('T')[0];

    return Goal.findAll({
      where: {
        tenantId,
        status: { [Op.ne]: 'COMPLETED' },
        dueDate: { [Op.lt]: today, [Op.ne]: null }
      },
      order: [['dueDate', 'ASC']]
    });
  }

  /**
   * Check if goal progress has crossed major milestones (25%, 50%, 75%, 100%).
   * Returns an array of crossed milestone thresholds.
   * In a real implementation, each crossed milestone would emit a notification/socket event.
   */
  async checkMilestones(goalId: number, previousProgress?: number, currentProgress?: number) {
    const goal = await Goal.findByPk(goalId);
    if (!goal) throw new Error('Goal not found');

    const prev = previousProgress ?? 0;
    const curr = currentProgress ?? goal.progress;

    const milestones = [25, 50, 75, 100];
    const crossedMilestones: number[] = [];

    for (const milestone of milestones) {
      if (prev < milestone && curr >= milestone) {
        crossedMilestones.push(milestone);
      }
    }

    // Emit socket event for each crossed milestone
    for (const milestone of crossedMilestones) {
      try { io.emit('goal:milestone_reached', { goalId, milestone, title: goal.title, currentProgress: curr }); } catch {}
    }

    return {
      goalId,
      title: goal.title,
      currentProgress: curr,
      crossedMilestones
    };
  }
}

export default new GoalService();
