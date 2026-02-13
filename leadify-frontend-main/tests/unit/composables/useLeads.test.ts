/**
 * useLeads - Unit Tests
 * =======================
 * Tests for composables/useLeads.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    type Lead,
    LeadSourceEnums,
    LeadStatusEnums,
    leadSources,
    leadStates
} from '@/composables/useLeads';

// Mock the API fetch for testing CRUD functions
vi.mock('@/composables/useApiFetch', () => ({
    useApiFetch: vi.fn()
}));

describe('useLeads.ts', () => {

    // ============================================
    // Enums
    // ============================================
    describe('LeadSourceEnums', () => {
        it('should have correct values', () => {
            expect(LeadSourceEnums.REFERRAL).toBe('REFERRAL');
            expect(LeadSourceEnums.WEBSITE).toBe('WEBSITE');
            expect(LeadSourceEnums.EVENT).toBe('EVENT');
            expect(LeadSourceEnums.EMAIL).toBe('EMAIL');
            expect(LeadSourceEnums.OTHER).toBe('OTHER');
        });

        it('should have 5 sources', () => {
            const values = Object.values(LeadSourceEnums);
            expect(values).toHaveLength(5);
        });
    });

    describe('LeadStatusEnums', () => {
        it('should have correct values', () => {
            expect(LeadStatusEnums.NEW).toBe('NEW');
            expect(LeadStatusEnums.CONTACTED).toBe('CONTACTED');
            expect(LeadStatusEnums.QUALIFIED).toBe('QUALIFIED');
            expect(LeadStatusEnums.DISQUALIFIED).toBe('DISQUALIFIED');
        });

        it('should have 4 statuses', () => {
            const values = Object.values(LeadStatusEnums);
            expect(values).toHaveLength(4);
        });
    });

    // ============================================
    // Options Arrays
    // ============================================
    describe('leadSources', () => {
        it('should have 5 source options', () => {
            expect(leadSources).toHaveLength(5);
        });

        it('should have correct structure', () => {
            leadSources.forEach(source => {
                expect(source).toHaveProperty('label');
                expect(source).toHaveProperty('value');
                expect(typeof source.label).toBe('string');
            });
        });

        it('should include Referral option', () => {
            const referral = leadSources.find(s => s.value === LeadSourceEnums.REFERRAL);
            expect(referral).toBeDefined();
            expect(referral?.label).toBe('Referral');
        });
    });

    describe('leadStates', () => {
        it('should have 4 state options', () => {
            expect(leadStates).toHaveLength(4);
        });

        it('should have correct structure', () => {
            leadStates.forEach(state => {
                expect(state).toHaveProperty('label');
                expect(state).toHaveProperty('value');
                expect(typeof state.label).toBe('string');
            });
        });

        it('should include New state option', () => {
            const newState = leadStates.find(s => s.value === LeadStatusEnums.NEW);
            expect(newState).toBeDefined();
            expect(newState?.label).toBe('New');
        });

        it('should include Qualified state option', () => {
            const qualified = leadStates.find(s => s.value === LeadStatusEnums.QUALIFIED);
            expect(qualified).toBeDefined();
            expect(qualified?.label).toBe('Qualified');
        });
    });

    // ============================================
    // Lead Interface Type Check
    // ============================================
    describe('Lead interface', () => {
        it('should create valid Lead object', () => {
            const lead: Lead = {
                id: 'lead-123',
                name: 'Test Lead',
                companyName: 'Test Company',
                email: 'test@example.com',
                phone: '+966501234567',
                leadSource: LeadSourceEnums.WEBSITE,
                user: 1,
                notes: 'Test notes',
                status: LeadStatusEnums.NEW,
                createdAt: '2024-01-01',
                updatedAt: '2024-01-02'
            };

            expect(lead.id).toBe('lead-123');
            expect(lead.name).toBe('Test Lead');
            expect(lead.status).toBe(LeadStatusEnums.NEW);
        });

        it('should allow additional properties', () => {
            const lead: Lead = {
                id: 'lead-456',
                name: 'Another Lead',
                companyName: 'Company',
                email: 'email@test.com',
                phone: '123456',
                leadSource: 'OTHER',
                user: 2,
                notes: '',
                status: 'NEW',
                createdAt: '',
                updatedAt: '',
                customField: 'custom value'
            };

            expect(lead.customField).toBe('custom value');
        });
    });
});
