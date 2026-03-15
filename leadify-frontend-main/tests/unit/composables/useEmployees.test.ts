/**
 * useEmployees - Unit Tests
 * ==========================
 * Tests for composables/useEmployees.ts
 *
 * The module provides:
 * - fetchEmployees, fetchEmployeeById, createEmployee, updateEmployee, deleteEmployee
 * - fetchOrgChart, fetchDirectReports
 * - fetchDepartments, fetchDepartmentTree, fetchDepartmentById, createDepartment, updateDepartment, deleteDepartment
 * - fetchEmployeeDocuments, addEmployeeDocument, fetchExpiringDocuments
 * - Helper functions: getEmployeeStatusType, getEmployeeStatusLabel, getEmploymentTypeLabel, getFullName
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);

import {
  fetchEmployees,
  fetchEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  fetchOrgChart,
  fetchDirectReports,
  fetchDepartments,
  fetchDepartmentTree,
  fetchDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  fetchEmployeeDocuments,
  addEmployeeDocument,
  fetchExpiringDocuments,
  getEmployeeStatusType,
  getEmployeeStatusLabel,
  getEmploymentTypeLabel,
  getDocumentTypeLabel,
  getFullName,
  EMPLOYMENT_TYPES,
  EMPLOYEE_STATUSES
} from '@/composables/useEmployees';

describe('useEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchEmployees
  // ============================================
  describe('fetchEmployees', () => {
    it('should fetch employees from correct endpoint', async () => {
      const mockDocs = [
        { id: 'emp-1', employeeNumber: 'EMP-001', firstName: 'John', lastName: 'Doe', email: 'john@example.com', hireDate: '2023-01-01', employmentType: 'FULL_TIME', status: 'ACTIVE' }
      ];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockDocs, pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } }, success: true });

      const result = await fetchEmployees();

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/employees');
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]?.firstName).toBe('John');
    });

    it('should include query params when provided', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchEmployees({ department: 'eng', status: 'ACTIVE' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('department=eng');
      expect(calledUrl).toContain('status=ACTIVE');
    });

    it('should return default empty result on API failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEmployees();

      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // ============================================
  // fetchEmployeeById
  // ============================================
  describe('fetchEmployeeById', () => {
    it('should fetch a single employee by ID', async () => {
      const mockEmployee = { id: 'emp-1', employeeNumber: 'EMP-001', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', hireDate: '2023-01-01', employmentType: 'FULL_TIME', status: 'ACTIVE' };
      mockUseApiFetch.mockResolvedValue({ body: mockEmployee, success: true });

      const result = await fetchEmployeeById('emp-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/employees/emp-1');
      expect(result).toEqual(mockEmployee);
    });

    it('should return null on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEmployeeById('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ============================================
  // createEmployee
  // ============================================
  describe('createEmployee', () => {
    it('should call POST with employee data', async () => {
      const data = { firstName: 'Alice', lastName: 'Wonder', email: 'alice@example.com', hireDate: '2024-01-01', employmentType: 'FULL_TIME', status: 'ACTIVE', employeeNumber: 'EMP-100' };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'emp-100', ...data } });

      await createEmployee(data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/employees', 'POST', data);
    });
  });

  // ============================================
  // updateEmployee
  // ============================================
  describe('updateEmployee', () => {
    it('should call PUT with correct ID and data', async () => {
      const data = { jobTitle: 'Senior Engineer' };
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await updateEmployee('emp-1', data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/employees/emp-1', 'PUT', data);
    });
  });

  // ============================================
  // deleteEmployee
  // ============================================
  describe('deleteEmployee', () => {
    it('should call DELETE with correct ID', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await deleteEmployee('emp-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/employees/emp-1', 'DELETE');
    });
  });

  // ============================================
  // fetchOrgChart
  // ============================================
  describe('fetchOrgChart', () => {
    it('should fetch org chart data', async () => {
      const mockChart = [{ id: 'emp-1', firstName: 'CEO', lastName: 'Person', status: 'ACTIVE', children: [] }];
      mockUseApiFetch.mockResolvedValue({ body: mockChart, success: true });

      const result = await fetchOrgChart();

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/org-chart');
      expect(result).toHaveLength(1);
    });

    it('should return empty array on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchOrgChart();
      expect(result).toEqual([]);
    });
  });

  // ============================================
  // fetchDirectReports
  // ============================================
  describe('fetchDirectReports', () => {
    it('should fetch direct reports for a manager', async () => {
      const mockReports = [
        { id: 'emp-2', employeeNumber: 'EMP-002', firstName: 'Bob', lastName: 'Report', email: 'bob@example.com', hireDate: '2023-01-01', employmentType: 'FULL_TIME', status: 'ACTIVE' }
      ];
      mockUseApiFetch.mockResolvedValue({ body: mockReports, success: true });

      const result = await fetchDirectReports('emp-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/employees/emp-1/direct-reports');
      expect(result).toHaveLength(1);
    });
  });

  // ============================================
  // Department functions
  // ============================================
  describe('fetchDepartments', () => {
    it('should fetch all departments', async () => {
      const mockDepts = [{ id: 'dept-1', name: 'Engineering', code: 'ENG' }];
      mockUseApiFetch.mockResolvedValue({ body: mockDepts, success: true });

      const result = await fetchDepartments();

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/departments');
      expect(result).toHaveLength(1);
    });
  });

  describe('fetchDepartmentTree', () => {
    it('should fetch departments as tree', async () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      await fetchDepartmentTree();

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/departments/tree');
    });
  });

  describe('createDepartment', () => {
    it('should call POST with department data', async () => {
      const data = { name: 'Marketing', code: 'MKT' };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'dept-2', ...data } });

      await createDepartment(data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/departments', 'POST', data);
    });
  });

  // ============================================
  // Employee Documents
  // ============================================
  describe('fetchEmployeeDocuments', () => {
    it('should fetch documents for an employee', async () => {
      const mockDocs = [{ id: 'edoc-1', employeeId: 'emp-1', name: 'Contract', type: 'CONTRACT', fileUrl: 'https://example.com/contract.pdf' }];
      mockUseApiFetch.mockResolvedValue({ body: mockDocs, success: true });

      const result = await fetchEmployeeDocuments('emp-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/employees/emp-1/documents');
      expect(result).toHaveLength(1);
    });

    it('should return empty array on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEmployeeDocuments('emp-1');
      expect(result).toEqual([]);
    });
  });

  describe('fetchExpiringDocuments', () => {
    it('should fetch expiring documents with default days', async () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      await fetchExpiringDocuments();

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/expiring-documents?days=30');
    });

    it('should use custom days parameter', async () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      await fetchExpiringDocuments(60);

      expect(mockUseApiFetch).toHaveBeenCalledWith('hr/expiring-documents?days=60');
    });
  });

  // ============================================
  // Helper functions
  // ============================================
  describe('getEmployeeStatusType', () => {
    it('should return success for ACTIVE', () => {
      expect(getEmployeeStatusType('ACTIVE')).toBe('success');
    });

    it('should return warning for ON_LEAVE', () => {
      expect(getEmployeeStatusType('ON_LEAVE')).toBe('warning');
    });

    it('should return danger for TERMINATED', () => {
      expect(getEmployeeStatusType('TERMINATED')).toBe('danger');
    });

    it('should return empty string for unknown status', () => {
      expect(getEmployeeStatusType('UNKNOWN')).toBe('');
    });
  });

  describe('getEmployeeStatusLabel', () => {
    it('should return the label for ACTIVE', () => {
      expect(getEmployeeStatusLabel('ACTIVE')).toBe('Active');
    });

    it('should return the status itself for unknown', () => {
      expect(getEmployeeStatusLabel('CUSTOM_STATUS')).toBe('CUSTOM_STATUS');
    });
  });

  describe('getEmploymentTypeLabel', () => {
    it('should return Full Time for FULL_TIME', () => {
      expect(getEmploymentTypeLabel('FULL_TIME')).toBe('Full Time');
    });

    it('should return Part Time for PART_TIME', () => {
      expect(getEmploymentTypeLabel('PART_TIME')).toBe('Part Time');
    });
  });

  describe('getFullName', () => {
    it('should concatenate first and last name', () => {
      expect(getFullName({ firstName: 'John', lastName: 'Doe' })).toBe('John Doe');
    });
  });

  describe('constants', () => {
    it('should have all employment types', () => {
      const values = EMPLOYMENT_TYPES.map(t => t.value);
      expect(values).toContain('FULL_TIME');
      expect(values).toContain('PART_TIME');
      expect(values).toContain('CONTRACT');
      expect(values).toContain('INTERN');
    });

    it('should have all employee statuses', () => {
      const values = EMPLOYEE_STATUSES.map(s => s.value);
      expect(values).toContain('ACTIVE');
      expect(values).toContain('TERMINATED');
    });
  });
});
