import { Op, WhereOptions, Includeable } from 'sequelize';
import Task, { TaskStatus } from './taskModel';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

const userAttributes = ['id', 'name', 'profilePicture'];

const defaultIncludes: Includeable[] = [
  {
    model: User,
    as: 'assignee',
    attributes: userAttributes
  },
  {
    model: User,
    as: 'creator',
    attributes: userAttributes
  }
];

class TaskService {
  /**
   * List tasks with filters, search, sorting and pagination.
   */
  public async getTasks(query: any) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedTo,
      entityType,
      entityId,
      dueDateFrom,
      dueDateTo,
      search,
      sortBy = 'createdAt',
      sort = 'DESC'
    } = query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: WhereOptions = {};

    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }
    if (priority) {
      where.priority = Array.isArray(priority) ? { [Op.in]: priority } : priority;
    }
    if (assignedTo) {
      where.assignedTo = Number(assignedTo);
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (entityId) {
      where.entityId = entityId;
    }
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) (where.dueDate as any)[Op.gte] = new Date(dueDateFrom);
      if (dueDateTo) (where.dueDate as any)[Op.lte] = new Date(dueDateTo);
    }
    if (search) {
      where[Op.or as any] = [{ title: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }];
    }

    const allowedSortFields = ['createdAt', 'dueDate', 'priority', 'status', 'title', 'updatedAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { rows: docs, count: totalItems } = await Task.findAndCountAll({
      where,
      include: defaultIncludes,
      limit: Number(limit),
      offset,
      order: [[orderField, orderDir]],
      distinct: true
    });

    return {
      docs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit))
      }
    };
  }

  /**
   * Get a single task by ID with subtasks and associations.
   */
  public async getTaskById(id: number) {
    const task = await Task.findByPk(id, {
      include: [
        ...defaultIncludes,
        {
          model: Task,
          as: 'subtasks',
          include: [{ model: User, as: 'assignee', attributes: userAttributes }]
        },
        {
          model: Task,
          as: 'parentTask',
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    if (!task) throw new BaseError(ERRORS.TASK_NOT_FOUND);
    return task;
  }

  /**
   * Create a new task.
   */
  public async createTask(data: any, userId: number) {
    const task = await Task.create({
      ...data,
      createdBy: userId
    });

    return this.getTaskById(task.id);
  }

  /**
   * Update an existing task.
   */
  public async updateTask(id: number, data: any, userId: number) {
    const task = await this.taskOrError({ id });

    // If status is being changed to COMPLETED, set completedAt
    if (data.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      data.completedAt = new Date();
    }
    // If status is being changed away from COMPLETED, clear completedAt
    if (data.status && data.status !== TaskStatus.COMPLETED && task.status === TaskStatus.COMPLETED) {
      data.completedAt = null;
    }

    await task.update(data);
    return this.getTaskById(id);
  }

  /**
   * Delete a task and its subtasks.
   */
  public async deleteTask(id: number) {
    const task = await this.taskOrError({ id });

    // Delete subtasks first
    await Task.destroy({ where: { parentTaskId: id } });
    await task.destroy();
  }

  /**
   * Mark a task as completed.
   */
  public async completeTask(id: number, userId: number) {
    const task = await this.taskOrError({ id });

    if (task.status === TaskStatus.COMPLETED) {
      return this.getTaskById(id);
    }

    await task.update({
      status: TaskStatus.COMPLETED,
      completedAt: new Date()
    });

    return this.getTaskById(id);
  }

  /**
   * Get tasks assigned to a specific user with filters.
   */
  public async getMyTasks(userId: number, query: any) {
    return this.getTasks({ ...query, assignedTo: userId });
  }

  /**
   * Get all overdue tasks (past due date and not completed/cancelled).
   */
  public async getOverdueTasks() {
    const now = new Date();

    const tasks = await Task.findAll({
      where: {
        dueDate: { [Op.lt]: now },
        status: { [Op.notIn]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }
      },
      include: defaultIncludes,
      order: [['dueDate', 'ASC']]
    });

    return tasks;
  }

  /**
   * Get tasks linked to a specific entity (lead, deal, client, etc.).
   */
  public async getTasksByEntity(entityType: string, entityId: string) {
    const tasks = await Task.findAll({
      where: { entityType, entityId },
      include: defaultIncludes,
      order: [['createdAt', 'DESC']]
    });

    return tasks;
  }

  /**
   * Get task statistics, optionally filtered by user.
   */
  public async getTaskStats(userId?: number) {
    const where: WhereOptions = {};
    if (userId) {
      where.assignedTo = userId;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [totalCount, pendingCount, inProgressCount, completedCount, cancelledCount, overdueCount, dueTodayCount] = await Promise.all([
      Task.count({ where }),
      Task.count({ where: { ...where, status: TaskStatus.PENDING } }),
      Task.count({ where: { ...where, status: TaskStatus.IN_PROGRESS } }),
      Task.count({ where: { ...where, status: TaskStatus.COMPLETED } }),
      Task.count({ where: { ...where, status: TaskStatus.CANCELLED } }),
      Task.count({
        where: {
          ...where,
          dueDate: { [Op.lt]: now },
          status: { [Op.notIn]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }
        }
      }),
      Task.count({
        where: {
          ...where,
          dueDate: { [Op.between]: [startOfToday, endOfToday] },
          status: { [Op.notIn]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }
        }
      })
    ]);

    return {
      total: totalCount,
      byStatus: {
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        cancelled: cancelledCount
      },
      overdue: overdueCount,
      dueToday: dueTodayCount
    };
  }

  /**
   * Find a task or throw an error.
   */
  private async taskOrError(filter: WhereOptions, includes?: Includeable[]): Promise<Task> {
    const task = await Task.findOne({
      where: filter,
      include: includes || []
    });
    if (!task) throw new BaseError(ERRORS.TASK_NOT_FOUND);
    return task;
  }
}

export default new TaskService();
