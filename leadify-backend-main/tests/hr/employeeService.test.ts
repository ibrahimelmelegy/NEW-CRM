
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import employeeService from '../../src/hr/employeeService';
import Employee from '../../src/hr/models/employeeModel';
import Department from '../../src/hr/models/departmentModel';
import EmployeeDocument from '../../src/hr/models/employeeDocumentModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// Mocks
jest.mock('../../src/hr/models/employeeModel');
jest.mock('../../src/hr/models/departmentModel');
jest.mock('../../src/hr/models/employeeDocumentModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

describe('EmployeeService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. generateEmployeeNumber
    // --------------------------------------------------------------------------
    describe('generateEmployeeNumber', () => {
        it('should return EMP-0001 when no employees exist', async () => {
            (Employee.findOne as jest.Mock<any>).mockResolvedValue(null);

            const result = await employeeService.generateEmployeeNumber();
            expect(result).toBe('EMP-0001');
        });

        it('should increment from last employee number', async () => {
            (Employee.findOne as jest.Mock<any>).mockResolvedValue({ employeeNumber: 'EMP-0042' });

            const result = await employeeService.generateEmployeeNumber();
            expect(result).toBe('EMP-0043');
        });

        it('should handle missing employeeNumber on last record', async () => {
            (Employee.findOne as jest.Mock<any>).mockResolvedValue({ employeeNumber: null });

            const result = await employeeService.generateEmployeeNumber();
            expect(result).toBe('EMP-0001');
        });
    });

    // --------------------------------------------------------------------------
    // 2. createEmployee
    // --------------------------------------------------------------------------
    describe('createEmployee', () => {
        it('should create employee with auto-generated number', async () => {
            (Employee.findOne as jest.Mock<any>).mockResolvedValue(null); // For number generation
            const mockEmployee = { id: 1, employeeNumber: 'EMP-0001', firstName: 'John' };
            (Employee.create as jest.Mock<any>).mockResolvedValue(mockEmployee);

            const result = await employeeService.createEmployee({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@test.com',
            });

            expect(Employee.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    firstName: 'John',
                    employeeNumber: 'EMP-0001',
                })
            );
            expect(result).toEqual(mockEmployee);
        });
    });

    // --------------------------------------------------------------------------
    // 3. getEmployees
    // --------------------------------------------------------------------------
    describe('getEmployees', () => {
        it('should return paginated employees with defaults', async () => {
            const mockRows = [{ id: 1, firstName: 'John' }];
            (Employee.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 1 });

            const result = await employeeService.getEmployees({});

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 20,
                totalItems: 1,
                totalPages: 1,
            });
        });

        it('should filter by departmentId', async () => {
            (Employee.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await employeeService.getEmployees({ departmentId: 'dept-1' });

            expect(Employee.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ departmentId: 'dept-1' })
                })
            );
        });

        it('should filter by status', async () => {
            (Employee.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await employeeService.getEmployees({ status: 'ACTIVE' });

            expect(Employee.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: 'ACTIVE' })
                })
            );
        });

        it('should search across multiple fields', async () => {
            (Employee.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await employeeService.getEmployees({ search: 'john' });

            const callArgs = (Employee.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            // Op.or is a Symbol key, verify it exists in the where clause
            const symbolKeys = Object.getOwnPropertySymbols(callArgs.where);
            expect(symbolKeys.length).toBeGreaterThan(0); // Op.or symbol present
        });

        it('should apply custom sorting', async () => {
            (Employee.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await employeeService.getEmployees({ sortBy: 'firstName', sort: 'ASC' });

            expect(Employee.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: [['firstName', 'ASC']]
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 4. getEmployeeById
    // --------------------------------------------------------------------------
    describe('getEmployeeById', () => {
        it('should return employee with includes when found', async () => {
            const mockEmployee = { id: 1, firstName: 'John', department: { name: 'IT' } };
            (Employee.findByPk as jest.Mock<any>).mockResolvedValue(mockEmployee);

            const result = await employeeService.getEmployeeById('1');

            expect(result).toEqual(mockEmployee);
            expect(Employee.findByPk).toHaveBeenCalledWith('1', expect.objectContaining({
                include: expect.any(Array)
            }));
        });

        it('should throw NOT_FOUND when employee missing', async () => {
            (Employee.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(employeeService.getEmployeeById('999'))
                .rejects.toThrow();
        });
    });

    // --------------------------------------------------------------------------
    // 5. updateEmployee
    // --------------------------------------------------------------------------
    describe('updateEmployee', () => {
        it('should update employee successfully', async () => {
            const mockEmployee = {
                id: 1,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Employee.findByPk as jest.Mock<any>).mockResolvedValue(mockEmployee);

            const result = await employeeService.updateEmployee('1', { firstName: 'Jane' });

            expect(mockEmployee.update).toHaveBeenCalledWith({ firstName: 'Jane' });
        });

        it('should throw NOT_FOUND when employee missing', async () => {
            (Employee.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(employeeService.updateEmployee('999', {}))
                .rejects.toThrow();
        });
    });

    // --------------------------------------------------------------------------
    // 6. addDocument
    // --------------------------------------------------------------------------
    describe('addDocument', () => {
        it('should add document to existing employee', async () => {
            (Employee.findByPk as jest.Mock<any>).mockResolvedValue({ id: 1 });
            const mockDoc = { id: 1, name: 'Contract', employeeId: '1' };
            (EmployeeDocument.create as jest.Mock<any>).mockResolvedValue(mockDoc);

            const result = await employeeService.addDocument('1', { name: 'Contract', type: 'CONTRACT' });

            expect(EmployeeDocument.create).toHaveBeenCalledWith(
                expect.objectContaining({ employeeId: '1' })
            );
        });

        it('should throw NOT_FOUND for missing employee', async () => {
            (Employee.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(employeeService.addDocument('999', {}))
                .rejects.toThrow();
        });
    });
});
