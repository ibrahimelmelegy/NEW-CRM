import express from 'express';
import payrollController from './payrollController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { PayrollPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Payroll
 *   description: Payroll management — runs, payslips, salary structures, end-of-service (Saudi Labor Law)
 */

const router = express.Router();

// ─── Payroll Runs ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/payroll/runs:
 *   post:
 *     summary: Create payroll run
 *     description: Create a new payroll run for a specific month/year in DRAFT status
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - year
 *             properties:
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               year:
 *                 type: integer
 *                 example: 2026
 *     responses:
 *       201:
 *         description: Payroll run created in DRAFT status
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/runs', authenticateUser, HasPermission([PayrollPermissionsEnum.CREATE_PAYROLL_RUN]), payrollController.createPayrollRun);

/**
 * @swagger
 * /api/payroll/runs:
 *   get:
 *     summary: List payroll runs
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, CALCULATED, APPROVED, PROCESSED]
 *     responses:
 *       200:
 *         description: Paginated payroll run list
 *       500:
 *         description: Server error
 */
router.get('/runs', authenticateUser, HasPermission([PayrollPermissionsEnum.VIEW_PAYROLL]), payrollController.getPayrollRuns);

/**
 * @swagger
 * /api/payroll/runs/{id}:
 *   get:
 *     summary: Get payroll run by ID
 *     description: Returns payroll run with all payslips
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payroll run with payslips and employee details
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/runs/:id', authenticateUser, HasPermission([PayrollPermissionsEnum.VIEW_PAYROLL]), payrollController.getPayrollRunById);

/**
 * @swagger
 * /api/payroll/runs/{id}/calculate:
 *   patch:
 *     summary: Calculate payslips
 *     description: Generates payslips for all active employees using their salary structures. Calculates GOSI deductions, allowances, and net pay. Updates run status to CALCULATED.
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payslips calculated with totals
 *       404:
 *         description: Payroll run not found
 *       500:
 *         description: Server error
 */
router.patch('/runs/:id/calculate', authenticateUser, HasPermission([PayrollPermissionsEnum.CREATE_PAYROLL_RUN]), payrollController.calculatePayslips);

/**
 * @swagger
 * /api/payroll/runs/{id}/approve:
 *   patch:
 *     summary: Approve payroll run
 *     description: Approve a CALCULATED payroll run. Records approver.
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payroll run approved
 *       400:
 *         description: Run must be in CALCULATED status
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/runs/:id/approve', authenticateUser, HasPermission([PayrollPermissionsEnum.APPROVE_PAYROLL]), payrollController.approveRun);

/**
 * @swagger
 * /api/payroll/runs/{id}/process:
 *   patch:
 *     summary: Process payroll run
 *     description: Process an APPROVED payroll run for disbursement. Records processor.
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payroll run processed
 *       400:
 *         description: Run must be in APPROVED status
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/runs/:id/process', authenticateUser, HasPermission([PayrollPermissionsEnum.PROCESS_PAYROLL]), payrollController.processRun);

// ─── Payslips ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/payroll/payslips/{employeeId}:
 *   get:
 *     summary: Get employee payslips
 *     description: Returns paginated payslip history for a specific employee
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated payslip list with payroll run info
 *       500:
 *         description: Server error
 */
router.get('/payslips/:employeeId', authenticateUser, HasPermission([PayrollPermissionsEnum.VIEW_PAYSLIPS]), payrollController.getEmployeePayslips);

// ─── Salary Structures ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/payroll/salary-structures:
 *   get:
 *     summary: List salary structures
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by employee
 *     responses:
 *       200:
 *         description: Paginated salary structure list with employee info
 *       500:
 *         description: Server error
 */
router.get('/salary-structures', authenticateUser, HasPermission([PayrollPermissionsEnum.MANAGE_SALARY]), payrollController.getSalaryStructures);

/**
 * @swagger
 * /api/payroll/salary-structures:
 *   post:
 *     summary: Create salary structure
 *     description: Define compensation breakdown for an employee (basic + allowances + GOSI rates)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - basicSalary
 *               - effectiveDate
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               basicSalary:
 *                 type: number
 *               housingAllowance:
 *                 type: number
 *                 default: 0
 *               transportAllowance:
 *                 type: number
 *                 default: 0
 *               otherAllowances:
 *                 type: number
 *                 default: 0
 *               gosiEmployeeRate:
 *                 type: number
 *                 default: 0.0975
 *                 description: Employee GOSI rate (9.75% default)
 *               gosiEmployerRate:
 *                 type: number
 *                 default: 0.1175
 *                 description: Employer GOSI rate (11.75% default)
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Salary structure created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/salary-structures', authenticateUser, HasPermission([PayrollPermissionsEnum.MANAGE_SALARY]), payrollController.createSalaryStructure);

/**
 * @swagger
 * /api/payroll/salary-structures/{id}:
 *   put:
 *     summary: Update salary structure
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               basicSalary:
 *                 type: number
 *               housingAllowance:
 *                 type: number
 *               transportAllowance:
 *                 type: number
 *               otherAllowances:
 *                 type: number
 *               gosiEmployeeRate:
 *                 type: number
 *               gosiEmployerRate:
 *                 type: number
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Salary structure updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/salary-structures/:id', authenticateUser, HasPermission([PayrollPermissionsEnum.MANAGE_SALARY]), payrollController.updateSalaryStructure);

// ─── End of Service ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/payroll/end-of-service/{employeeId}:
 *   post:
 *     summary: Calculate end-of-service benefit
 *     description: Calculates end-of-service benefit using Saudi Labor Law formula. First 5 years at 0.5x monthly salary, remaining years at 1.0x.
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: End-of-service benefit calculated
 *       404:
 *         description: Employee or salary structure not found
 *       500:
 *         description: Server error
 */
router.post('/end-of-service/:employeeId', authenticateUser, HasPermission([PayrollPermissionsEnum.VIEW_PAYROLL]), payrollController.calculateEndOfService);

/**
 * @swagger
 * /api/payroll/end-of-service/{id}/approve:
 *   patch:
 *     summary: Approve end-of-service
 *     description: Approve a calculated end-of-service benefit
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: End-of-service approved
 *       400:
 *         description: Must be in CALCULATED status
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/end-of-service/:id/approve', authenticateUser, HasPermission([PayrollPermissionsEnum.APPROVE_PAYROLL]), payrollController.approveEndOfService);

/**
 * @swagger
 * /api/payroll/end-of-service/{id}/pay:
 *   patch:
 *     summary: Mark end-of-service as paid
 *     description: Mark an approved end-of-service benefit as paid
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: End-of-service marked as paid
 *       400:
 *         description: Must be in APPROVED status
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/end-of-service/:id/pay', authenticateUser, HasPermission([PayrollPermissionsEnum.PROCESS_PAYROLL]), payrollController.payEndOfService);

export default router;
