
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import projectService from '../../src/project/projectService';
import Project from '../../src/project/models/projectModel';
import User from '../../src/user/userModel';
import clientService from '../../src/client/clientService';
import uploaderService from '../../src/uploader/uploader.service';
import ProjectManpower from '../../src/projectManpower/projectManpowerModel';
import { ProjectPermissionsEnum } from '../../src/role/roleEnum';
import { ERRORS } from '../../src/utils/error/errors';
import BaseError from '../../src/utils/error/base-http-exception';

// Mocks
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));
// Mocks
jest.mock('../../src/project/models/projectModel', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
        findAll: jest.fn(),
        belongsTo: jest.fn(),
        hasMany: jest.fn(),
    }
}));
jest.mock('../../src/user/userModel');
jest.mock('../../src/client/clientService');
jest.mock('../../src/uploader/uploader.service');
jest.mock('../../src/projectManpower/projectManpowerModel');
jest.mock('../../src/projectAsset/projectAssetModel');
jest.mock('../../src/project/models/peojectMaterial');
jest.mock('../../src/notification/notificationService');
jest.mock('../../src/activity-logs/activityService');
jest.mock('../../src/lead/leadService', () => ({
    leadOrError: (jest.fn() as jest.Mock<any>).mockResolvedValue({ status: 'NEW', update: jest.fn() })
}));
jest.mock('../../src/opportunity/opportunityService', () => ({
    opportunityOrError: (jest.fn() as jest.Mock<any>).mockResolvedValue({ stage: 'NEW', update: jest.fn() })
}));
jest.mock('../../src/deal/dealService', () => ({
    dealOrError: (jest.fn() as jest.Mock<any>).mockResolvedValue({ stage: 'NEW', update: jest.fn() })
}));

// Transaction Mock
const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
};
jest.mock('../../src/config/db', () => ({
    sequelize: {
        transaction: jest.fn(() => Promise.resolve(mockTransaction)),
    },
}));

describe('ProjectService', () => {

    const mockAdmin: any = {
        id: 1,
        role: { permissions: [ProjectPermissionsEnum.VIEW_GLOBAL_PROJECTS] }
    };

    const mockProjectData: any = {
        id: 'proj-1',
        isCompleted: false,
        manpowerTotalCost: 100,
        totalMaterialCost: 50,
        totalAssetsCost: 50,
        totalCarRentPerDuration: 0,
        accommodationCost: 0,
        foodCostPerDay: 0,
        managementAdditionPercentage: 0,
        set: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        $set: jest.fn(),
        destroy: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 1. createProject
    describe('createProject', () => {
        it('should create a new project and assign users', async () => {
            // Arrange
            const input: any = {
                basicInfo: {
                    clientId: 'client-1',
                    assignedUsersIds: [1, 2],
                    name: 'New Project'
                }
            };

            (Project.findOne as jest.Mock<any>).mockResolvedValue(null); // No existing incomplete project
            (Project.create as jest.Mock<any>).mockResolvedValue(mockProjectData);
            (User.findAll as jest.Mock<any>).mockResolvedValue([{ id: 1 }, { id: 2 }]);
            (Project.findByPk as jest.Mock<any>).mockResolvedValue(mockProjectData);

            // Act
            await projectService.createProject(input, mockAdmin);

            // Assert
            expect(clientService.clientOrError).toHaveBeenCalledWith({ id: 'client-1' });
            expect(Project.create).toHaveBeenCalled();
            expect(mockProjectData.$set).toHaveBeenCalledWith('assignedUsers', expect.any(Array), { transaction: mockTransaction });
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        it('should rollback transaction on error', async () => {
            const input: any = { basicInfo: {} };
            (Project.findOne as jest.Mock<any>).mockResolvedValue(null);
            (Project.create as jest.Mock<any>).mockRejectedValue(new Error('DB Error'));

            await expect(projectService.createProject(input, mockAdmin))
                .rejects.toThrow();

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });

    // 2. completeProjectCreation (Financials)
    describe('completeProjectCreation', () => {
        it('should calculate VAT, margin, and total cost correctly', async () => {
            // Arrange
            const input = { discount: 0, marginPercentage: 10 };
            // GrandTotal = 100 + 50 + 50 = 200
            // VAT 15% = 30
            // Margin 10% = 20
            // Total = 200 + 30 + 20 = 250

            (Project.findOne as jest.Mock<any>).mockResolvedValue(mockProjectData);

            // Act
            await projectService.completeProjectCreation('proj-1', input, mockAdmin);

            // Assert
            expect(mockProjectData.update).toHaveBeenCalledWith(expect.objectContaining({
                vat: 30,
                marginAmount: 20,
                totalCost: 250,
                isCompleted: true
            }));
        });
    });

    // 3. recalculateProject
    describe('recalculateProject', () => {
        it('should aggregate manpower costs and update project', async () => {
            // Arrange
            const manpowerMock = [
                {
                    estimatedWorkDays: 10,
                    durationCost: 100,
                    accommodationCostPerManpower: 0,
                    carRentPerManpower: 0,
                    otherCosts: 0,
                    update: jest.fn()
                }
            ];
            // Project food cost = 0, so foodAllowance = 0
            // Total per manpower = 100

            (ProjectManpower.findAll as jest.Mock<any>).mockResolvedValue(manpowerMock);

            // Act
            await projectService.recalculateProject(mockProjectData);

            // Assert
            expect(manpowerMock[0].update).toHaveBeenCalled();
            expect(mockProjectData.update).toHaveBeenCalledWith(expect.objectContaining({
                manpowerTotalCost: 100
            }));
        });
    });
});
