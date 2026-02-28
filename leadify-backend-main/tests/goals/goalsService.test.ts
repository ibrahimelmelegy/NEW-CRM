
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import goalService from '../../src/goals/goalService';
import Goal from '../../src/goals/goalModel';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock('../../src/goals/goalModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

describe('GoalService', () => {
  const mockGoal: any = {
    id: 1,
    title: 'Q1 Revenue Target',
    description: 'Reach $100k in Q1',
    progress: 0,
    status: 'NOT_STARTED',
    parentGoalId: null,
    tenantId: 'tenant-1',
    dueDate: '2026-06-30',
    update: jest.fn(),
    destroy: jest.fn(),
    reload: (jest.fn() as jest.Mock<any>).mockImplementation(function (this: any) { return Promise.resolve(this); })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGoal.progress = 0;
    mockGoal.status = 'NOT_STARTED';
    mockGoal.parentGoalId = null;
    mockGoal.reload = (jest.fn() as jest.Mock<any>).mockImplementation(function (this: any) { return Promise.resolve(this); });
  });

  // --------------------------------------------------------------------------
  // CRUD
  // --------------------------------------------------------------------------
  describe('create', () => {
    it('should create a goal with tenantId', async () => {
      (Goal.create as jest.Mock<any>).mockResolvedValue(mockGoal);

      const result = await goalService.create({ title: 'Q1 Revenue Target' }, 'tenant-1');

      expect(Goal.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Q1 Revenue Target', tenantId: 'tenant-1' }));
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getAll', () => {
    it('should return paginated goals', async () => {
      (Goal.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockGoal], count: 1 });

      const result = await goalService.getAll({ page: 1 }, 'tenant-1');

      expect(result.docs).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
    });
  });

  describe('getById', () => {
    it('should return a goal by id', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(mockGoal);

      const result = await goalService.getById(1);

      expect(result).toBe(mockGoal);
    });
  });

  describe('update', () => {
    it('should update an existing goal', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(mockGoal);

      const result = await goalService.update(1, { title: 'Updated Goal' });

      expect(mockGoal.update).toHaveBeenCalledWith({ title: 'Updated Goal' });
      expect(result).toBe(mockGoal);
    });

    it('should return null when goal is not found', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await goalService.update(999, { title: 'X' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing goal', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(mockGoal);

      const result = await goalService.delete(1);

      expect(mockGoal.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when goal is not found', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await goalService.delete(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Business Logic
  // --------------------------------------------------------------------------
  describe('updateProgress', () => {
    it('should mark goal as COMPLETED when progress reaches 100', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(mockGoal);

      await goalService.updateProgress(1, 100);

      expect(mockGoal.update).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 100, status: 'COMPLETED' })
      );
    });

    it('should transition NOT_STARTED to IN_PROGRESS when progress > 0', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(mockGoal);

      await goalService.updateProgress(1, 30);

      expect(mockGoal.update).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 30, status: 'IN_PROGRESS' })
      );
    });

    it('should clamp progress to 0-100 range', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(mockGoal);

      await goalService.updateProgress(1, 150);

      expect(mockGoal.update).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 100 })
      );
    });

    it('should throw error when goal is not found', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(goalService.updateProgress(999, 50))
        .rejects.toThrow('Goal not found');
    });
  });

  describe('cascadeGoalProgress', () => {
    it('should recalculate parent progress from children averages', async () => {
      const parentGoal: any = {
        id: 10, progress: 0, status: 'NOT_STARTED', parentGoalId: null,
        update: jest.fn()
      };
      const childGoals = [
        { progress: 50 },
        { progress: 100 }
      ];

      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(parentGoal);
      (Goal.findAll as jest.Mock<any>).mockResolvedValue(childGoals);

      await goalService.cascadeGoalProgress(10);

      // Average of 50 and 100 = 75
      expect(parentGoal.update).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 75, status: 'IN_PROGRESS' })
      );
    });

    it('should do nothing when parent has no children', async () => {
      const parentGoal: any = { id: 10, progress: 0, status: 'NOT_STARTED', update: jest.fn() };
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(parentGoal);
      (Goal.findAll as jest.Mock<any>).mockResolvedValue([]);

      await goalService.cascadeGoalProgress(10);

      expect(parentGoal.update).not.toHaveBeenCalled();
    });
  });

  describe('checkMilestones', () => {
    it('should return crossed milestones when progress jumps past 25% and 50%', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue({ ...mockGoal, progress: 60, title: 'Test Goal' });

      const result = await goalService.checkMilestones(1, 10, 60);

      expect(result.crossedMilestones).toContain(25);
      expect(result.crossedMilestones).toContain(50);
      expect(result.crossedMilestones).not.toContain(75);
    });

    it('should return empty milestones when no threshold is crossed', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue({ ...mockGoal, progress: 30, title: 'Test Goal' });

      const result = await goalService.checkMilestones(1, 26, 30);

      expect(result.crossedMilestones).toHaveLength(0);
    });

    it('should throw error when goal is not found', async () => {
      (Goal.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(goalService.checkMilestones(999))
        .rejects.toThrow('Goal not found');
    });
  });

  describe('getGoalStats', () => {
    it('should return aggregated goal statistics', async () => {
      (Goal.count as jest.Mock<any>)
        .mockResolvedValueOnce(20)   // total
        .mockResolvedValueOnce(8)    // completed
        .mockResolvedValueOnce(7)    // inProgress
        .mockResolvedValueOnce(2);   // overdue
      (Goal.findOne as jest.Mock<any>).mockResolvedValue({ avgProgress: 45.5 });

      const result = await goalService.getGoalStats('tenant-1');

      expect(result.total).toBe(20);
      expect(result.completed).toBe(8);
      expect(result.inProgress).toBe(7);
      expect(result.overdue).toBe(2);
      expect(result.completionRate).toBe(40); // 8/20 * 100
    });
  });
});
