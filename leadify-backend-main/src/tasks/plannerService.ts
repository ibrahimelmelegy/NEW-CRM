import { Op } from 'sequelize';
import Task, { TaskStatus, TaskPriority } from './taskModel';
import FocusSession from './focusSessionModel';
import DailyHabit from './dailyHabitModel';

class PlannerService {
  // ─── Planner Tasks ──────────────────────────────────────────────────

  async getTasksByDate(userId: number, date: string) {
    return Task.findAll({
      where: {
        assignedTo: userId,
        entityType: 'planner',
        date
      },
      order: [['timeSlot', 'ASC']]
    });
  }

  async createTask(data: unknown, userId: number) {
    return Task.create({
      title: data.title,
      description: data.description || null,
      assignedTo: userId,
      createdBy: userId,
      status: TaskStatus.PENDING,
      priority: data.priority || TaskPriority.MEDIUM,
      entityType: 'planner',
      date: data.date,
      timeSlot: data.timeSlot || null,
      duration: data.duration || 60,
      category: data.category || 'work',
      tags: data.tags || []
    });
  }

  async updateTask(id: number, data: unknown, userId: number) {
    const task = await Task.findOne({ where: { id, assignedTo: userId, entityType: 'planner' } });
    if (!task) throw new Error('Task not found');

    if (data.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      data.completedAt = new Date();
    }
    await task.update(data);
    return task;
  }

  async toggleComplete(id: number, userId: number) {
    const task = await Task.findOne({ where: { id, assignedTo: userId, entityType: 'planner' } });
    if (!task) throw new Error('Task not found');

    const completed = task.status !== TaskStatus.COMPLETED;
    await task.update({
      status: completed ? TaskStatus.COMPLETED : TaskStatus.PENDING,
      completedAt: completed ? new Date() : null
    });
    return task;
  }

  async deleteTask(id: number, userId: number) {
    const task = await Task.findOne({ where: { id, assignedTo: userId, entityType: 'planner' } });
    if (!task) throw new Error('Task not found');
    await task.destroy();
    return { deleted: true };
  }

  async getStats(userId: number) {
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const [todayTotal, todayCompleted, weekTotal, weekCompleted] = await Promise.all([
      Task.count({ where: { assignedTo: userId, entityType: 'planner', date: today } }),
      Task.count({ where: { assignedTo: userId, entityType: 'planner', date: today, status: TaskStatus.COMPLETED } }),
      Task.count({
        where: {
          assignedTo: userId,
          entityType: 'planner',
          date: { [Op.between]: [startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]] }
        }
      }),
      Task.count({
        where: {
          assignedTo: userId,
          entityType: 'planner',
          date: { [Op.between]: [startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]] },
          status: TaskStatus.COMPLETED
        }
      })
    ]);

    return {
      today: { total: todayTotal, completed: todayCompleted, progress: todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0 },
      week: { total: weekTotal, completed: weekCompleted, progress: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0 }
    };
  }

  // ─── Focus Sessions ─────────────────────────────────────────────────

  async startFocus(data: unknown, userId: number) {
    return FocusSession.create({
      userId,
      taskId: data.taskId || null,
      taskTitle: data.taskTitle || data.title || null,
      startedAt: new Date(),
      duration: data.duration || 25,
      completed: false
    });
  }

  async endFocus(id: number, userId: number) {
    const session = await FocusSession.findOne({ where: { id, userId } });
    if (!session) throw new Error('Focus session not found');

    const now = new Date();
    const actualMinutes = Math.round((now.getTime() - session.startedAt.getTime()) / 60000);

    await session.update({
      endedAt: now,
      actualMinutes,
      completed: actualMinutes >= session.duration
    });
    return session;
  }

  async getFocusByDate(userId: number, date: string) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return FocusSession.findAll({
      where: {
        userId,
        startedAt: { [Op.gte]: startOfDay, [Op.lt]: endOfDay }
      },
      order: [['startedAt', 'DESC']]
    });
  }

  // ─── Daily Habits ───────────────────────────────────────────────────

  async getHabits(userId: number) {
    return DailyHabit.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']]
    });
  }

  async createHabit(data: unknown, userId: number) {
    return DailyHabit.create({
      userId,
      name: data.name,
      icon: data.icon || 'ph:check-circle'
    });
  }

  async toggleHabit(id: number, userId: number) {
    const habit = await DailyHabit.findOne({ where: { id, userId } });
    if (!habit) throw new Error('Habit not found');

    const today = new Date().toISOString().split('T')[0];
    const dates = [...(habit.completedDates || [])];
    const idx = dates.indexOf(today);

    if (idx >= 0) {
      dates.splice(idx, 1);
      habit.streak = Math.max(0, habit.streak - 1);
    } else {
      dates.push(today);
      habit.streak = habit.streak + 1;
    }

    await habit.update({ completedDates: dates, streak: habit.streak });
    return habit;
  }

  async deleteHabit(id: number, userId: number) {
    const habit = await DailyHabit.findOne({ where: { id, userId } });
    if (!habit) throw new Error('Habit not found');
    await habit.destroy();
    return { deleted: true };
  }
}

export default new PlannerService();
