
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/workflow/workflowModel');
jest.mock('../../src/workflow/workflowExecutionModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/notification/notificationModel');
jest.mock('../../src/dailyTask/dailyTaskModel');
jest.mock('../../src/utils/emailHelper');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

import workflowService from '../../src/workflow/workflowService';
import WorkflowRule, { ConditionLogic } from '../../src/workflow/workflowModel';
import WorkflowExecution from '../../src/workflow/workflowExecutionModel';
import User from '../../src/user/userModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';
import { io } from '../../src/server';

describe('WorkflowService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. createRule
    // --------------------------------------------------------------------------
    describe('createRule', () => {
        it('should create a workflow rule and emit event', async () => {
            const mockRule = { id: 1, name: 'Test Rule', entityType: 'lead' };
            (WorkflowRule.create as jest.Mock<any>).mockResolvedValue(mockRule);

            const result = await workflowService.createRule(
                { name: 'Test Rule', entityType: 'lead' } as any,
                1
            );

            expect(result).toEqual(mockRule);
            expect(WorkflowRule.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Test Rule', createdBy: 1 })
            );
            expect(io.emit).toHaveBeenCalledWith('workflow:created', { id: 1, name: 'Test Rule' });
        });
    });

    // --------------------------------------------------------------------------
    // 2. updateRule
    // --------------------------------------------------------------------------
    describe('updateRule', () => {
        it('should update a workflow rule', async () => {
            const mockRule = {
                id: 1,
                name: 'Updated Rule',
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (WorkflowRule.findByPk as jest.Mock<any>).mockResolvedValue(mockRule);

            const result = await workflowService.updateRule(1, { name: 'Updated Rule' } as any);

            expect(mockRule.update).toHaveBeenCalledWith({ name: 'Updated Rule' });
            expect(io.emit).toHaveBeenCalledWith('workflow:updated', expect.any(Object));
        });

        it('should throw WORKFLOW_RULE_NOT_FOUND when rule does not exist', async () => {
            (WorkflowRule.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(workflowService.updateRule(999, {} as any))
                .rejects.toThrow(new BaseError(ERRORS.WORKFLOW_RULE_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 3. deleteRule
    // --------------------------------------------------------------------------
    describe('deleteRule', () => {
        it('should delete a rule and its executions', async () => {
            const mockRule = { id: 1, destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true) };
            (WorkflowRule.findByPk as jest.Mock<any>).mockResolvedValue(mockRule);
            (WorkflowExecution.destroy as jest.Mock<any>).mockResolvedValue(5);

            await workflowService.deleteRule(1);

            expect(WorkflowExecution.destroy).toHaveBeenCalledWith({ where: { workflowRuleId: 1 } });
            expect(mockRule.destroy).toHaveBeenCalled();
            expect(io.emit).toHaveBeenCalledWith('workflow:deleted', { id: 1 });
        });

        it('should throw WORKFLOW_RULE_NOT_FOUND when rule does not exist', async () => {
            (WorkflowRule.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(workflowService.deleteRule(999))
                .rejects.toThrow(new BaseError(ERRORS.WORKFLOW_RULE_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 4. getRules
    // --------------------------------------------------------------------------
    describe('getRules', () => {
        it('should return paginated rules', async () => {
            const mockRules = [{ id: 1, name: 'Rule 1' }];
            (WorkflowRule.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: mockRules,
                count: 1,
            });

            const result = await workflowService.getRules({ page: '1', limit: '20' });

            expect(result.docs).toEqual(mockRules);
            expect(result.pagination.totalItems).toBe(1);
            expect(result.pagination.page).toBe(1);
        });

        it('should apply entity type filter', async () => {
            (WorkflowRule.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await workflowService.getRules({ entityType: 'lead' });

            const callArgs = (WorkflowRule.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.entityType).toBe('lead');
        });

        it('should apply isActive filter', async () => {
            (WorkflowRule.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await workflowService.getRules({ isActive: 'true' });

            const callArgs = (WorkflowRule.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.isActive).toBe(true);
        });
    });

    // --------------------------------------------------------------------------
    // 5. getRuleById
    // --------------------------------------------------------------------------
    describe('getRuleById', () => {
        it('should return rule with recent executions', async () => {
            const mockRule = {
                id: 1,
                name: 'Rule 1',
                toJSON: (jest.fn() as jest.Mock<any>).mockReturnValue({ id: 1, name: 'Rule 1' }),
            };
            (WorkflowRule.findByPk as jest.Mock<any>).mockResolvedValue(mockRule);
            (WorkflowExecution.findAll as jest.Mock<any>).mockResolvedValue([{ id: 100 }]);

            const result = await workflowService.getRuleById(1);

            expect(result).toEqual(expect.objectContaining({ id: 1, name: 'Rule 1', executions: [{ id: 100 }] }));
        });

        it('should throw WORKFLOW_RULE_NOT_FOUND when rule does not exist', async () => {
            (WorkflowRule.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(workflowService.getRuleById(999))
                .rejects.toThrow(new BaseError(ERRORS.WORKFLOW_RULE_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 6. toggleRule
    // --------------------------------------------------------------------------
    describe('toggleRule', () => {
        it('should toggle rule active status', async () => {
            const mockRule = {
                id: 1,
                isActive: false,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (WorkflowRule.findByPk as jest.Mock<any>).mockResolvedValue(mockRule);

            await workflowService.toggleRule(1, true);

            expect(mockRule.update).toHaveBeenCalledWith({ isActive: true });
            expect(io.emit).toHaveBeenCalledWith('workflow:toggled', { id: 1, isActive: true });
        });

        it('should throw WORKFLOW_RULE_NOT_FOUND when rule does not exist', async () => {
            (WorkflowRule.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(workflowService.toggleRule(999, true))
                .rejects.toThrow(new BaseError(ERRORS.WORKFLOW_RULE_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 7. evaluateConditions
    // --------------------------------------------------------------------------
    describe('evaluateConditions', () => {
        it('should return true when no conditions', () => {
            const result = workflowService.evaluateConditions({}, null as any);
            expect(result).toBe(true);
        });

        it('should return true when all AND conditions match', () => {
            const entity = { status: 'ACTIVE', amount: 100 };
            const conditions = [
                { field: 'status', operator: 'equals', value: 'ACTIVE' },
                { field: 'amount', operator: 'greater_than', value: '50' },
            ];

            const result = workflowService.evaluateConditions(entity, conditions as any, ConditionLogic.AND);
            expect(result).toBe(true);
        });

        it('should return false when one AND condition fails', () => {
            const entity = { status: 'INACTIVE', amount: 100 };
            const conditions = [
                { field: 'status', operator: 'equals', value: 'ACTIVE' },
                { field: 'amount', operator: 'greater_than', value: '50' },
            ];

            const result = workflowService.evaluateConditions(entity, conditions as any, ConditionLogic.AND);
            expect(result).toBe(false);
        });

        it('should return true when one OR condition matches', () => {
            const entity = { status: 'INACTIVE', amount: 100 };
            const conditions = [
                { field: 'status', operator: 'equals', value: 'ACTIVE' },
                { field: 'amount', operator: 'greater_than', value: '50' },
            ];

            const result = workflowService.evaluateConditions(entity, conditions as any, ConditionLogic.OR);
            expect(result).toBe(true);
        });

        it('should evaluate contains operator case-insensitively', () => {
            const entity = { name: 'John Doe Smith' };
            const conditions = [
                { field: 'name', operator: 'contains', value: 'doe' },
            ];

            const result = workflowService.evaluateConditions(entity, conditions as any);
            expect(result).toBe(true);
        });

        it('should evaluate is_empty operator', () => {
            const entity = { name: '' };
            const conditions = [
                { field: 'name', operator: 'is_empty', value: '' },
            ];

            const result = workflowService.evaluateConditions(entity, conditions as any);
            expect(result).toBe(true);
        });

        it('should evaluate in operator', () => {
            const entity = { status: 'ACTIVE' };
            const conditions = [
                { field: 'status', operator: 'in', value: 'ACTIVE,PENDING' },
            ];

            const result = workflowService.evaluateConditions(entity, conditions as any);
            expect(result).toBe(true);
        });
    });

    // --------------------------------------------------------------------------
    // 8. resolveTemplate
    // --------------------------------------------------------------------------
    describe('resolveTemplate', () => {
        it('should replace template variables with entity values', () => {
            const template = 'Hello {{name}}, your deal {{dealName}} is worth {{amount}}';
            const entity = { name: 'John', dealName: 'Big Deal', amount: 5000 };

            const result = workflowService.resolveTemplate(template, entity);
            expect(result).toBe('Hello John, your deal Big Deal is worth 5000');
        });

        it('should handle nested values', () => {
            const template = 'Client: {{client.name}}';
            const entity = { client: { name: 'Acme Corp' } };

            const result = workflowService.resolveTemplate(template, entity);
            expect(result).toBe('Client: Acme Corp');
        });

        it('should replace missing values with empty string', () => {
            const template = 'Hello {{name}}, phone: {{phone}}';
            const entity = { name: 'John' };

            const result = workflowService.resolveTemplate(template, entity);
            expect(result).toBe('Hello John, phone: ');
        });
    });

    // --------------------------------------------------------------------------
    // 9. getTemplates
    // --------------------------------------------------------------------------
    describe('getTemplates', () => {
        it('should return workflow template definitions', () => {
            const templates = workflowService.getTemplates();
            expect(Array.isArray(templates)).toBe(true);
            expect(templates.length).toBeGreaterThan(0);
            expect(templates[0]).toHaveProperty('id');
            expect(templates[0]).toHaveProperty('name');
            expect(templates[0]).toHaveProperty('nodes');
            expect(templates[0]).toHaveProperty('edges');
        });
    });

    // --------------------------------------------------------------------------
    // 10. getExecutionDetail
    // --------------------------------------------------------------------------
    describe('getExecutionDetail', () => {
        it('should return execution detail', async () => {
            const mockExecution = { id: 100, workflowRuleId: 1, status: 'SUCCESS' };
            (WorkflowExecution.findByPk as jest.Mock<any>).mockResolvedValue(mockExecution);

            const result = await workflowService.getExecutionDetail(100);
            expect(result).toEqual(mockExecution);
        });

        it('should throw WORKFLOW_EXECUTION_NOT_FOUND when execution does not exist', async () => {
            (WorkflowExecution.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(workflowService.getExecutionDetail(999))
                .rejects.toThrow(new BaseError(ERRORS.WORKFLOW_EXECUTION_NOT_FOUND));
        });
    });
});
