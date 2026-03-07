
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import leadScoringService from '../../src/leadScoring/leadScoringService';
import { LeadScoringRule, EntityScore, ScoreGrade } from '../../src/leadScoring/leadScoringModel';

// Mock models
jest.mock('../../src/leadScoring/leadScoringModel');
jest.mock('../../src/lead/leadModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/opportunity/opportunityModel');

describe('LeadScoringService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. createRule
    // --------------------------------------------------------------------------
    describe('createRule', () => {
        it('should create a scoring rule with createdBy set to userId', async () => {
            const data = {
                name: 'High-Value Leads',
                entityType: 'lead',
                criteria: [{ field: 'revenue', operator: 'greater_than', value: 100000, points: 20 }],
                isActive: true,
            };
            const mockCreated = { id: 1, ...data, createdBy: 5 };
            (LeadScoringRule.create as jest.Mock<any>).mockResolvedValue(mockCreated);

            const result = await leadScoringService.createRule(data, 5);

            expect(LeadScoringRule.create).toHaveBeenCalledWith({ ...data, createdBy: 5 });
            expect(result).toEqual(mockCreated);
        });
    });

    // --------------------------------------------------------------------------
    // 2. updateRule
    // --------------------------------------------------------------------------
    describe('updateRule', () => {
        it('should update an existing rule', async () => {
            const mockRule: any = {
                id: 1,
                name: 'Old Name',
                update: jest.fn().mockImplementation(() => Promise.resolve({ id: 1, name: 'New Name' })),
            };
            (LeadScoringRule.findByPk as jest.Mock<any>).mockResolvedValue(mockRule);

            const result = await leadScoringService.updateRule(1, { name: 'New Name' });

            expect(mockRule.update).toHaveBeenCalledWith({ name: 'New Name' });
        });

        it('should throw when rule not found', async () => {
            (LeadScoringRule.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(leadScoringService.updateRule(999, { name: 'X' }))
                .rejects.toThrow('Scoring rule not found');
        });
    });

    // --------------------------------------------------------------------------
    // 3. deleteRule
    // --------------------------------------------------------------------------
    describe('deleteRule', () => {
        it('should delete an existing rule and return { deleted: true }', async () => {
            const mockRule: any = {
                id: 1,
                destroy: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            (LeadScoringRule.findByPk as jest.Mock<any>).mockResolvedValue(mockRule);

            const result = await leadScoringService.deleteRule(1);

            expect(mockRule.destroy).toHaveBeenCalled();
            expect(result).toEqual({ deleted: true });
        });

        it('should throw when rule not found', async () => {
            (LeadScoringRule.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(leadScoringService.deleteRule(999))
                .rejects.toThrow('Scoring rule not found');
        });
    });

    // --------------------------------------------------------------------------
    // 4. getRules
    // --------------------------------------------------------------------------
    describe('getRules', () => {
        it('should return paginated rules', async () => {
            const mockRules = [
                { id: 1, name: 'Rule 1' },
                { id: 2, name: 'Rule 2' },
            ];
            (LeadScoringRule.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: mockRules,
                count: 2,
            });

            const result = await leadScoringService.getRules({ page: 1, limit: 10 });

            expect(LeadScoringRule.findAndCountAll).toHaveBeenCalled();
            expect(result.docs).toEqual(mockRules);
            expect(result.pagination.totalItems).toBe(2);
        });

        it('should filter by entityType when provided', async () => {
            (LeadScoringRule.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: [],
                count: 0,
            });

            await leadScoringService.getRules({ entityType: 'lead', page: 1, limit: 10 });

            expect(LeadScoringRule.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ entityType: 'lead' }),
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 5. evaluateCriteria (unit test for the scoring engine)
    // --------------------------------------------------------------------------
    describe('evaluateCriteria', () => {
        it('should return points when "equals" matches (case-insensitive)', () => {
            const criterion = { field: 'status', operator: 'equals' as const, value: 'HOT', points: 10 };
            const entity = { status: 'hot' };

            expect(leadScoringService.evaluateCriteria(entity, criterion)).toBe(10);
        });

        it('should return 0 when "equals" does not match', () => {
            const criterion = { field: 'status', operator: 'equals' as const, value: 'HOT', points: 10 };
            const entity = { status: 'cold' };

            expect(leadScoringService.evaluateCriteria(entity, criterion)).toBe(0);
        });

        it('should return points when "greater_than" matches', () => {
            const criterion = { field: 'revenue', operator: 'greater_than' as const, value: 50000, points: 15 };
            const entity = { revenue: 100000 };

            expect(leadScoringService.evaluateCriteria(entity, criterion)).toBe(15);
        });

        it('should return points when "contains" matches', () => {
            const criterion = { field: 'company', operator: 'contains' as const, value: 'tech', points: 5 };
            const entity = { company: 'TechCorp Solutions' };

            expect(leadScoringService.evaluateCriteria(entity, criterion)).toBe(5);
        });

        it('should return points when "is_not_empty" matches', () => {
            const criterion = { field: 'email', operator: 'is_not_empty' as const, value: null, points: 3 };
            const entity = { email: 'test@example.com' };

            expect(leadScoringService.evaluateCriteria(entity, criterion)).toBe(3);
        });

        it('should return points when "between" matches', () => {
            const criterion = { field: 'employees', operator: 'between' as const, value: [10, 100], points: 8 };
            const entity = { employees: 50 };

            expect(leadScoringService.evaluateCriteria(entity, criterion)).toBe(8);
        });

        it('should return 0 when field is missing from entity', () => {
            const criterion = { field: 'missing', operator: 'equals' as const, value: 'test', points: 10 };
            const entity = { other: 'data' };

            expect(leadScoringService.evaluateCriteria(entity, criterion)).toBe(0);
        });
    });

    // --------------------------------------------------------------------------
    // 6. getScore
    // --------------------------------------------------------------------------
    describe('getScore', () => {
        it('should return the stored score when found', async () => {
            const mockScore = { entityType: 'lead', entityId: '1', score: 75, grade: 'B' };
            (EntityScore.findOne as jest.Mock<any>).mockResolvedValue(mockScore);

            const result = await leadScoringService.getScore('lead', '1');

            expect(result).toEqual(mockScore);
        });

        it('should return default zero score when not found', async () => {
            (EntityScore.findOne as jest.Mock<any>).mockResolvedValue(null);

            const result = await leadScoringService.getScore('lead', '999');

            expect(result.score).toBe(0);
            expect(result.grade).toBe(ScoreGrade.F);
        });
    });

    // --------------------------------------------------------------------------
    // 7. getGradeThresholds
    // --------------------------------------------------------------------------
    describe('getGradeThresholds', () => {
        it('should return grade threshold definitions', () => {
            const thresholds = leadScoringService.getGradeThresholds();

            expect(thresholds.A.min).toBe(80);
            expect(thresholds.F.min).toBe(0);
            expect(thresholds.B.label).toBe('Warm');
        });
    });
});
