
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import payrollService from '../../src/payroll/payrollService';
import PayrollRun, { PayrollRunStatus } from '../../src/payroll/models/payrollRunModel';
import Payslip from '../../src/payroll/models/payslipModel';
import SalaryStructure from '../../src/payroll/models/salaryStructureModel';
import Employee, { EmployeeStatus } from '../../src/hr/models/employeeModel';
import EndOfService, { EOSStatus } from '../../src/payroll/models/endOfServiceModel';

// Mocks
jest.mock('../../src/payroll/models/payrollRunModel');
jest.mock('../../src/payroll/models/payslipModel');
jest.mock('../../src/payroll/models/salaryStructureModel');
jest.mock('../../src/payroll/models/endOfServiceModel');
jest.mock('../../src/hr/models/employeeModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

describe('PayrollService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. Payroll Runs
    // --------------------------------------------------------------------------
    describe('createPayrollRun', () => {
        it('should create payroll run with DRAFT status', async () => {
            const mockRun = { id: 1, month: 1, year: 2026, status: PayrollRunStatus.DRAFT };
            (PayrollRun.create as jest.Mock<any>).mockResolvedValue(mockRun);

            const result = await payrollService.createPayrollRun({
                month: 1,
                year: 2026,
                tenantId: 'tenant-1',
            });

            expect(PayrollRun.create).toHaveBeenCalledWith({
                month: 1,
                year: 2026,
                status: PayrollRunStatus.DRAFT,
                tenantId: 'tenant-1',
            });
            expect(result).toEqual(mockRun);
        });
    });

    describe('getPayrollRuns', () => {
        it('should return paginated payroll runs', async () => {
            const mockRows = [{ id: 1, month: 1, year: 2026 }];
            (PayrollRun.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 1 });

            const result = await payrollService.getPayrollRuns({});

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 20,
                totalItems: 1,
                totalPages: 1,
            });
        });

        it('should filter by month and year', async () => {
            (PayrollRun.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await payrollService.getPayrollRuns({ month: 6, year: 2026 });

            expect(PayrollRun.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ month: 6, year: 2026 })
                })
            );
        });

        it('should filter by status', async () => {
            (PayrollRun.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await payrollService.getPayrollRuns({ status: PayrollRunStatus.APPROVED });

            expect(PayrollRun.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: PayrollRunStatus.APPROVED })
                })
            );
        });
    });

    describe('getPayrollRunById', () => {
        it('should return payroll run with payslips', async () => {
            const mockRun = {
                id: 1,
                month: 1,
                year: 2026,
                payslips: [{ id: 1, netSalary: 5000 }],
            };
            (PayrollRun.findByPk as jest.Mock<any>).mockResolvedValue(mockRun);

            const result = await payrollService.getPayrollRunById('1');

            expect(result).toEqual(mockRun);
            expect(PayrollRun.findByPk).toHaveBeenCalledWith('1', expect.objectContaining({
                include: expect.any(Array)
            }));
        });

        it('should throw when payroll run not found', async () => {
            (PayrollRun.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(payrollService.getPayrollRunById('999'))
                .rejects.toThrow('Payroll run not found');
        });
    });

    // --------------------------------------------------------------------------
    // 2. Approval Flow
    // --------------------------------------------------------------------------
    describe('approveRun', () => {
        it('should approve a calculated payroll run', async () => {
            const mockRun = {
                id: 1,
                status: PayrollRunStatus.CALCULATED,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (PayrollRun.findByPk as jest.Mock<any>).mockResolvedValue(mockRun);

            // Also mock getPayrollRunById for the return
            const getByIdSpy = jest.spyOn(payrollService, 'getPayrollRunById')
                .mockResolvedValue({ id: 1, status: PayrollRunStatus.APPROVED } as any);

            await payrollService.approveRun('1', 'user-1');

            expect(mockRun.update).toHaveBeenCalledWith({
                status: PayrollRunStatus.APPROVED,
                approvedBy: 'user-1',
            });

            getByIdSpy.mockRestore();
        });

        it('should reject approval of non-calculated run', async () => {
            const mockRun = { id: 1, status: PayrollRunStatus.DRAFT };
            (PayrollRun.findByPk as jest.Mock<any>).mockResolvedValue(mockRun);

            await expect(payrollService.approveRun('1', 'user-1'))
                .rejects.toThrow('Only calculated payroll runs can be approved');
        });
    });

    describe('processRun', () => {
        it('should process an approved payroll run', async () => {
            const mockRun = {
                id: 1,
                status: PayrollRunStatus.APPROVED,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (PayrollRun.findByPk as jest.Mock<any>).mockResolvedValue(mockRun);

            const getByIdSpy = jest.spyOn(payrollService, 'getPayrollRunById')
                .mockResolvedValue({ id: 1, status: PayrollRunStatus.PROCESSED } as any);

            await payrollService.processRun('1', 'user-1');

            expect(mockRun.update).toHaveBeenCalledWith({
                status: PayrollRunStatus.PROCESSED,
                processedBy: 'user-1',
            });

            getByIdSpy.mockRestore();
        });

        it('should reject processing of non-approved run', async () => {
            const mockRun = { id: 1, status: PayrollRunStatus.CALCULATED };
            (PayrollRun.findByPk as jest.Mock<any>).mockResolvedValue(mockRun);

            await expect(payrollService.processRun('1', 'user-1'))
                .rejects.toThrow('Only approved payroll runs can be processed');
        });
    });

    // --------------------------------------------------------------------------
    // 3. Salary Structures
    // --------------------------------------------------------------------------
    describe('createSalaryStructure', () => {
        it('should create salary structure and return with employee', async () => {
            const mockStructure = { id: 1 };
            (SalaryStructure.create as jest.Mock<any>).mockResolvedValue(mockStructure);
            (SalaryStructure.findByPk as jest.Mock<any>).mockResolvedValue({
                id: 1,
                basicSalary: 5000,
                employee: { firstName: 'John' },
            });

            const result = await payrollService.createSalaryStructure({
                employeeId: '1',
                basicSalary: 5000,
                effectiveDate: '2026-01-01',
            });

            expect(SalaryStructure.create).toHaveBeenCalled();
            expect(result!.basicSalary).toBe(5000);
        });
    });

    // --------------------------------------------------------------------------
    // 4. End of Service
    // --------------------------------------------------------------------------
    describe('approveEndOfService', () => {
        it('should approve a calculated EOS', async () => {
            const mockEos = {
                id: 1,
                status: EOSStatus.CALCULATED,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (EndOfService.findByPk as jest.Mock<any>).mockResolvedValue(mockEos);

            await payrollService.approveEndOfService('1');

            expect(mockEos.update).toHaveBeenCalledWith({ status: EOSStatus.APPROVED });
        });

        it('should reject approval of non-calculated EOS', async () => {
            const mockEos = { id: 1, status: EOSStatus.APPROVED };
            (EndOfService.findByPk as jest.Mock<any>).mockResolvedValue(mockEos);

            await expect(payrollService.approveEndOfService('1'))
                .rejects.toThrow('Only calculated EOS can be approved');
        });
    });

    describe('payEndOfService', () => {
        it('should mark an approved EOS as paid', async () => {
            const mockEos = {
                id: 1,
                status: EOSStatus.APPROVED,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (EndOfService.findByPk as jest.Mock<any>).mockResolvedValue(mockEos);

            await payrollService.payEndOfService('1');

            expect(mockEos.update).toHaveBeenCalledWith({ status: EOSStatus.PAID });
        });

        it('should reject payment of non-approved EOS', async () => {
            const mockEos = { id: 1, status: EOSStatus.CALCULATED };
            (EndOfService.findByPk as jest.Mock<any>).mockResolvedValue(mockEos);

            await expect(payrollService.payEndOfService('1'))
                .rejects.toThrow('Only approved EOS can be paid');
        });
    });
});
