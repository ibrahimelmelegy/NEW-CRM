/**
 * useStaff - Unit Tests
 * =======================
 * Tests for composables/useStaff.ts
 */

import { describe, it, expect, vi } from 'vitest';
import {
    type Staff,
    StaffStatusEnums,
    staffStatuses
} from '@/composables/useStaff';

// Mock API
vi.mock('@/composables/useApiFetch', () => ({
    useApiFetch: vi.fn()
}));

describe('useStaff.ts', () => {

    // ============================================
    // StaffStatusEnums
    // ============================================
    describe('StaffStatusEnums', () => {
        it('should have correct values', () => {
            expect(StaffStatusEnums.ACTIVE).toBe('ACTIVE');
            expect(StaffStatusEnums.INACTIVE).toBe('INACTIVE');
        });

        it('should have 2 statuses', () => {
            expect(Object.values(StaffStatusEnums)).toHaveLength(2);
        });
    });

    // ============================================
    // staffStatuses Options
    // ============================================
    describe('staffStatuses', () => {
        it('should have 2 status options', () => {
            expect(staffStatuses).toHaveLength(2);
        });

        it('should have correct structure', () => {
            staffStatuses.forEach(status => {
                expect(status).toHaveProperty('label');
                expect(status).toHaveProperty('value');
            });
        });

        it('should include Active status', () => {
            const active = staffStatuses.find(s => s.value === StaffStatusEnums.ACTIVE);
            expect(active).toBeDefined();
            expect(active?.label).toBe('Active');
        });

        it('should include Inactive status', () => {
            const inactive = staffStatuses.find(s => s.value === StaffStatusEnums.INACTIVE);
            expect(inactive).toBeDefined();
            expect(inactive?.label).toBe('Inactive');
        });
    });

    // ============================================
    // Staff Interface
    // ============================================
    describe('Staff interface', () => {
        it('should create valid Staff object with required fields', () => {
            const staff: Staff = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+966501234567',
                status: StaffStatusEnums.ACTIVE,
                updatedAt: '2024-01-15'
            };

            expect(staff.name).toBe('John Doe');
            expect(staff.email).toBe('john@example.com');
            expect(staff.status).toBe(StaffStatusEnums.ACTIVE);
        });

        it('should allow optional id field', () => {
            const staff: Staff = {
                id: 'staff-123',
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '+966509876543',
                status: StaffStatusEnums.ACTIVE,
                updatedAt: '2024-01-20'
            };

            expect(staff.id).toBe('staff-123');
        });

        it('should allow optional profilePicture field', () => {
            const staff: Staff = {
                name: 'Alex Johnson',
                email: 'alex@example.com',
                phone: '+966501111111',
                status: StaffStatusEnums.INACTIVE,
                updatedAt: '2024-01-25',
                profilePicture: '/images/alex.jpg'
            };

            expect(staff.profilePicture).toBe('/images/alex.jpg');
        });

        it('should allow additional properties', () => {
            const staff: Staff = {
                name: 'Test Staff',
                email: 'test@example.com',
                phone: '123456',
                status: StaffStatusEnums.ACTIVE,
                updatedAt: '',
                role: 'Admin',
                department: 'Sales'
            };

            expect(staff.role).toBe('Admin');
            expect(staff.department).toBe('Sales');
        });
    });

    // ============================================
    // Status Transitions
    // ============================================
    describe('Status Transitions', () => {
        it('should allow status change from ACTIVE to INACTIVE', () => {
            const staff: Staff = {
                name: 'User',
                email: 'user@test.com',
                phone: '123',
                status: StaffStatusEnums.ACTIVE,
                updatedAt: ''
            };

            staff.status = StaffStatusEnums.INACTIVE;
            expect(staff.status).toBe(StaffStatusEnums.INACTIVE);
        });
    });
});
