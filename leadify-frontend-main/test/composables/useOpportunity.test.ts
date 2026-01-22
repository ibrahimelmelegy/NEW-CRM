import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOpportunities, createOpportunity, StageEnum, priorityEnum } from '../../composables/useOpportunity';

// Mock global useApiFetch since it's auto-imported in Nuxt
const mockUseApiFetch = vi.fn();
(global as any).useApiFetch = mockUseApiFetch;

// Mock ElNotification
vi.mock('element-plus', () => ({
    ElNotification: vi.fn(),
}));

describe('useOpportunity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getOpportunities', () => {
        it('should fetch opportunities successfully', async () => {
            // Arrange
            const mockData = {
                success: true,
                body: {
                    docs: [{ id: 1, name: 'Test Opp', stage: StageEnum.Discovery }],
                    pagination: { total: 1 },
                },
            };
            mockUseApiFetch.mockResolvedValue(mockData);

            // Act
            const result = await getOpportunities();

            // Assert
            expect(mockUseApiFetch).toHaveBeenCalledWith('opportunity');
            expect(result.opportunties).toHaveLength(1);
            expect(result.opportunties[0].name).toBe('Test Opp');
        });

        it('should fetch ALL opportunities when argument is true', async () => {
            // Arrange
            mockUseApiFetch.mockResolvedValue({ success: true, body: { docs: [] } });

            // Act
            await getOpportunities(true);

            // Assert
            expect(mockUseApiFetch).toHaveBeenCalledWith('opportunity?limit=1000');
        });

        it('should handle API errors gracefully', async () => {
            // Arrange
            mockUseApiFetch.mockResolvedValue({
                success: false,
                message: 'Server Error',
            });

            // Act
            const result = await getOpportunities();

            // Assert
            expect(result.opportunties).toEqual([]);
            expect(result.pagination.totalItems).toBe(0);
        });
    });

    describe('createOpportunity', () => {
        it('should create opportunity successfully', async () => {
            // Arrange
            const newOpp = {
                opportunities: {
                    name: 'New Deal',
                    stage: StageEnum.Proposal,
                    priority: priorityEnum.High,
                },
            };
            mockUseApiFetch.mockResolvedValue({ success: true });

            // Act
            await createOpportunity(newOpp);

            // Assert
            expect(mockUseApiFetch).toHaveBeenCalledWith('opportunity', 'POST', newOpp);
        });
    });
});
