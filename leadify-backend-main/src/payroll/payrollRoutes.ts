import express from 'express';
import payrollController from './payrollController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { PayrollPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// Payroll Runs
router.post('/runs', authenticateUser, HasPermission([PayrollPermissionsEnum.CREATE_PAYROLL_RUN]), payrollController.createPayrollRun);
router.get('/runs', authenticateUser, HasPermission([PayrollPermissionsEnum.VIEW_PAYROLL]), payrollController.getPayrollRuns);
router.get('/runs/:id', authenticateUser, HasPermission([PayrollPermissionsEnum.VIEW_PAYROLL]), payrollController.getPayrollRunById);
router.patch('/runs/:id/calculate', authenticateUser, HasPermission([PayrollPermissionsEnum.CREATE_PAYROLL_RUN]), payrollController.calculatePayslips);
router.patch('/runs/:id/approve', authenticateUser, HasPermission([PayrollPermissionsEnum.APPROVE_PAYROLL]), payrollController.approveRun);
router.patch('/runs/:id/process', authenticateUser, HasPermission([PayrollPermissionsEnum.PROCESS_PAYROLL]), payrollController.processRun);

// Payslips
router.get('/payslips/:employeeId', authenticateUser, HasPermission([PayrollPermissionsEnum.VIEW_PAYSLIPS]), payrollController.getEmployeePayslips);

// Salary Structures
router.get('/salary-structures', authenticateUser, HasPermission([PayrollPermissionsEnum.MANAGE_SALARY]), payrollController.getSalaryStructures);
router.post('/salary-structures', authenticateUser, HasPermission([PayrollPermissionsEnum.MANAGE_SALARY]), payrollController.createSalaryStructure);
router.put('/salary-structures/:id', authenticateUser, HasPermission([PayrollPermissionsEnum.MANAGE_SALARY]), payrollController.updateSalaryStructure);

// End of Service
router.post('/end-of-service/:employeeId', authenticateUser, HasPermission([PayrollPermissionsEnum.VIEW_PAYROLL]), payrollController.calculateEndOfService);
router.patch('/end-of-service/:id/approve', authenticateUser, HasPermission([PayrollPermissionsEnum.APPROVE_PAYROLL]), payrollController.approveEndOfService);
router.patch('/end-of-service/:id/pay', authenticateUser, HasPermission([PayrollPermissionsEnum.PROCESS_PAYROLL]), payrollController.payEndOfService);

export default router;
