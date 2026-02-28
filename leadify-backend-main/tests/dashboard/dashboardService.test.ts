
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import dashboardService from '../../src/dashboard/dashboardService';
import Dashboard from '../../src/dashboard/dashboardModel';
import Lead from '../../src/lead/leadModel';
import Deal from '../../src/deal/model/dealModel';
import Opportunity from '../../src/opportunity/opportunityModel';
import User from '../../src/user/userModel';
import DailyTask from '../../src/dailyTask/dailyTaskModel';
import Project from '../../src/project/models/projectModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock('../../src/dashboard/dashboardModel');
jest.mock('../../src/lead/leadModel');
jest.mock('../../src/deal/model/dealModel');
jest.mock('../../src/opportunity/opportunityModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/dailyTask/dailyTaskModel');
jest.mock('../../src/project/models/projectModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/deal/model/invoiceMode');

describe('DashboardService', () => {
  const mockDashboard: any = {
    id: 1, name: 'My Dashboard', userId: 5, isDefault: false, isShared: false,
    update: jest.fn(),
    destroy: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // CRUD
  // --------------------------------------------------------------------------
  describe('createDashboard', () => {
    it('should create a dashboard for the given user', async () => {
      (Dashboard.create as jest.Mock<any>).mockResolvedValue(mockDashboard);

      const result = await dashboardService.createDashboard({ name: 'My Dashboard' }, 5);

      expect(Dashboard.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'My Dashboard', userId: 5 }));
      expect(result).toBe(mockDashboard);
    });
  });

  describe('updateDashboard', () => {
    it('should update a dashboard owned by the user', async () => {
      (Dashboard.findOne as jest.Mock<any>).mockResolvedValue(mockDashboard);

      await dashboardService.updateDashboard(1, { name: 'Updated' }, 5);

      expect(Dashboard.findOne).toHaveBeenCalledWith({ where: { id: 1, userId: 5 } });
      expect(mockDashboard.update).toHaveBeenCalledWith({ name: 'Updated' });
    });

    it('should throw DASHBOARD_NOT_FOUND when not owned by user', async () => {
      (Dashboard.findOne as jest.Mock<any>).mockResolvedValue(null);

      await expect(dashboardService.updateDashboard(1, { name: 'X' }, 999))
        .rejects.toThrow(BaseError);
    });
  });

  describe('deleteDashboard', () => {
    it('should delete a dashboard owned by the user', async () => {
      (Dashboard.findOne as jest.Mock<any>).mockResolvedValue(mockDashboard);

      await dashboardService.deleteDashboard(1, 5);

      expect(mockDashboard.destroy).toHaveBeenCalled();
    });

    it('should throw DASHBOARD_NOT_FOUND when not owned by user', async () => {
      (Dashboard.findOne as jest.Mock<any>).mockResolvedValue(null);

      await expect(dashboardService.deleteDashboard(1, 999))
        .rejects.toThrow(BaseError);
    });
  });

  describe('getDashboards', () => {
    it('should return dashboards for user including shared dashboards', async () => {
      (Dashboard.findAll as jest.Mock<any>).mockResolvedValue([mockDashboard]);

      const result = await dashboardService.getDashboards(5);

      expect(Dashboard.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getDashboardById', () => {
    it('should return a dashboard by id', async () => {
      (Dashboard.findByPk as jest.Mock<any>).mockResolvedValue(mockDashboard);

      const result = await dashboardService.getDashboardById(1);

      expect(result).toBe(mockDashboard);
    });

    it('should throw DASHBOARD_NOT_FOUND when not found', async () => {
      (Dashboard.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(dashboardService.getDashboardById(999))
        .rejects.toThrow(BaseError);
    });
  });

  describe('setDefault', () => {
    it('should unset all defaults and set the given dashboard as default', async () => {
      (Dashboard.update as jest.Mock<any>).mockResolvedValue([1]);
      (Dashboard.findOne as jest.Mock<any>).mockResolvedValue(mockDashboard);

      await dashboardService.setDefault(1, 5);

      expect(Dashboard.update).toHaveBeenCalledWith({ isDefault: false }, { where: { userId: 5, isDefault: true } });
      expect(mockDashboard.update).toHaveBeenCalledWith({ isDefault: true });
    });

    it('should throw DASHBOARD_NOT_FOUND when dashboard does not belong to user', async () => {
      (Dashboard.update as jest.Mock<any>).mockResolvedValue([0]);
      (Dashboard.findOne as jest.Mock<any>).mockResolvedValue(null);

      await expect(dashboardService.setDefault(1, 999))
        .rejects.toThrow(BaseError);
    });
  });

  // --------------------------------------------------------------------------
  // Executive Summary
  // --------------------------------------------------------------------------
  describe('getExecutiveSummary', () => {
    it('should return executive summary with revenue, deals, conversion rate', async () => {
      (Deal.findOne as jest.Mock<any>).mockResolvedValue({ totalRevenue: 50000 });
      (Deal.count as jest.Mock<any>).mockResolvedValue(10);
      (Lead.count as jest.Mock<any>)
        .mockResolvedValueOnce(100)   // totalLeads
        .mockResolvedValueOnce(25);   // convertedLeads
      (DailyTask.count as jest.Mock<any>).mockResolvedValue(5);
      (Project.count as jest.Mock<any>).mockResolvedValue(2);

      const result = await dashboardService.getExecutiveSummary();

      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('activeDeals');
      expect(result).toHaveProperty('conversionRate');
      expect(result).toHaveProperty('pendingTasks');
      expect(result).toHaveProperty('overdueItems');
    });
  });

  // --------------------------------------------------------------------------
  // Analytics
  // --------------------------------------------------------------------------
  describe('getWinLoss', () => {
    it('should return won and lost deal counts', async () => {
      (Deal.count as jest.Mock<any>)
        .mockResolvedValueOnce(15)  // won
        .mockResolvedValueOnce(5);  // lost

      const result = await dashboardService.getWinLoss();

      expect(result).toEqual({ won: 15, lost: 5 });
    });
  });

  describe('getActivitySummary', () => {
    it('should return activity counts for all entity types', async () => {
      (Lead.count as jest.Mock<any>).mockResolvedValue(10);
      (Opportunity.count as jest.Mock<any>).mockResolvedValue(5);
      (Deal.count as jest.Mock<any>)
        .mockResolvedValueOnce(8)   // newDeals
        .mockResolvedValueOnce(3);  // closedDeals
      (DailyTask.count as jest.Mock<any>).mockResolvedValue(12);

      const result = await dashboardService.getActivitySummary();

      expect(result).toHaveProperty('newLeads', 10);
      expect(result).toHaveProperty('newOpportunities', 5);
      expect(result).toHaveProperty('completedTasks', 12);
    });
  });
});
