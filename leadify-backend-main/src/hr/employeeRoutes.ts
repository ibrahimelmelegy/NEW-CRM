import express from 'express';
import employeeController from './employeeController';
import departmentController from './departmentController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { EmployeePermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Employee
 *   description: Employee management — CRUD, documents, org chart, departments
 */

const router = express.Router();

// ─── Org Chart ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/hr/org-chart:
 *   get:
 *     summary: Get organization chart
 *     description: Returns hierarchical employee tree based on manager relationships
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization chart tree
 *       500:
 *         description: Server error
 */
router.get(
  '/org-chart',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_ORG_CHART, EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  employeeController.getOrgChart
);

// ─── Expiring Documents ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/hr/expiring-documents:
 *   get:
 *     summary: Get expiring employee documents
 *     description: Returns documents expiring within the specified number of days
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Return documents expiring within N days
 *     responses:
 *       200:
 *         description: List of expiring documents with employee details
 *       500:
 *         description: Server error
 */
router.get('/expiring-documents', authenticateUser, HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]), employeeController.getExpiringDocuments);

// ─── Employees CRUD ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/hr/employees:
 *   post:
 *     summary: Create an employee
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - hireDate
 *             properties:
 *               employeeNumber:
 *                 type: string
 *                 description: Auto-generated (EMP-0001) if not provided
 *               userId:
 *                 type: integer
 *                 description: Link to existing CRM user account
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               hireDate:
 *                 type: string
 *                 format: date
 *               terminationDate:
 *                 type: string
 *                 format: date
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *               jobTitle:
 *                 type: string
 *               managerId:
 *                 type: string
 *                 format: uuid
 *                 description: Reference to another employee
 *               employmentType:
 *                 type: string
 *                 enum: [FULL_TIME, PART_TIME, CONTRACT, INTERN]
 *                 default: FULL_TIME
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ON_LEAVE, TERMINATED, PROBATION]
 *                 default: ACTIVE
 *               salary:
 *                 type: number
 *               salaryFrequency:
 *                 type: string
 *                 enum: [MONTHLY, BIWEEKLY]
 *                 default: MONTHLY
 *               bankName:
 *                 type: string
 *               bankAccount:
 *                 type: string
 *               iqamaNumber:
 *                 type: string
 *               nationalId:
 *                 type: string
 *               passportNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/employees', authenticateUser, HasPermission([EmployeePermissionsEnum.CREATE_EMPLOYEES]), employeeController.createEmployee);

/**
 * @swagger
 * /api/hr/employees:
 *   get:
 *     summary: List employees
 *     description: Returns paginated employees with optional filters
 *     tags: [Employee]
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
 *         name: departmentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ON_LEAVE, TERMINATED, PROBATION]
 *       - in: query
 *         name: employmentType
 *         schema:
 *           type: string
 *           enum: [FULL_TIME, PART_TIME, CONTRACT, INTERN]
 *       - in: query
 *         name: managerId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, employee number, or job title
 *     responses:
 *       200:
 *         description: Paginated employee list with department and manager info
 *       500:
 *         description: Server error
 */
router.get('/employees', authenticateUser, HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]), employeeController.getEmployees);

/**
 * @swagger
 * /api/hr/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employee]
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
 *         description: Employee details with department, manager, and documents
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/employees/:id', authenticateUser, HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]), employeeController.getEmployeeById);

/**
 * @swagger
 * /api/hr/employees/{id}:
 *   put:
 *     summary: Update an employee
 *     tags: [Employee]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               hireDate:
 *                 type: string
 *                 format: date
 *               terminationDate:
 *                 type: string
 *                 format: date
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *               jobTitle:
 *                 type: string
 *               managerId:
 *                 type: string
 *                 format: uuid
 *               employmentType:
 *                 type: string
 *                 enum: [FULL_TIME, PART_TIME, CONTRACT, INTERN]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ON_LEAVE, TERMINATED, PROBATION]
 *               salary:
 *                 type: number
 *               salaryFrequency:
 *                 type: string
 *                 enum: [MONTHLY, BIWEEKLY]
 *               bankName:
 *                 type: string
 *               bankAccount:
 *                 type: string
 *               iqamaNumber:
 *                 type: string
 *               nationalId:
 *                 type: string
 *               passportNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.put('/employees/:id', authenticateUser, HasPermission([EmployeePermissionsEnum.EDIT_EMPLOYEES]), employeeController.updateEmployee);

// ─── Direct Reports ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/hr/employees/{id}/direct-reports:
 *   get:
 *     summary: Get direct reports
 *     description: Returns employees who report directly to the specified employee
 *     tags: [Employee]
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
 *         description: List of direct reports
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get(
  '/employees/:id/direct-reports',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  employeeController.getDirectReports
);

// ─── Employee Documents ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/hr/employees/{id}/documents:
 *   post:
 *     summary: Add employee document
 *     description: Upload a document record (contract, ID, visa, etc.) for an employee
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - fileUrl
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [CONTRACT, ID, CERTIFICATION, VISA, MEDICAL]
 *               fileUrl:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document added
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.post('/employees/:id/documents', authenticateUser, HasPermission([EmployeePermissionsEnum.EDIT_EMPLOYEES]), employeeController.addDocument);

/**
 * @swagger
 * /api/hr/employees/{id}/documents:
 *   get:
 *     summary: Get employee documents
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: List of employee documents
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/employees/:id/documents', authenticateUser, HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]), employeeController.getDocuments);

// ─── Departments ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/hr/departments:
 *   get:
 *     summary: List departments
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments
 *       500:
 *         description: Server error
 */
router.get('/departments', authenticateUser, HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]), departmentController.getDepartments);

/**
 * @swagger
 * /api/hr/departments/tree:
 *   get:
 *     summary: Get department tree
 *     description: Returns departments in a hierarchical tree structure
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department hierarchy tree
 *       500:
 *         description: Server error
 */
router.get('/departments/tree', authenticateUser, HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]), departmentController.getDepartmentTree);

/**
 * @swagger
 * /api/hr/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Employee]
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
 *         description: Department details
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/departments/:id', authenticateUser, HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]), departmentController.getDepartmentById);

/**
 * @swagger
 * /api/hr/departments:
 *   post:
 *     summary: Create department
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *                 description: Unique department code
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent department for nesting
 *               managerId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created
 *       400:
 *         description: Validation error or duplicate code
 *       500:
 *         description: Server error
 */
router.post('/departments', authenticateUser, HasPermission([EmployeePermissionsEnum.CREATE_EMPLOYEES]), departmentController.createDepartment);

/**
 * @swagger
 * /api/hr/departments/{id}:
 *   put:
 *     summary: Update department
 *     tags: [Employee]
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               managerId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/departments/:id', authenticateUser, HasPermission([EmployeePermissionsEnum.EDIT_EMPLOYEES]), departmentController.updateDepartment);

/**
 * @swagger
 * /api/hr/departments/{id}:
 *   delete:
 *     summary: Delete department
 *     tags: [Employee]
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
 *         description: Department deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/departments/:id', authenticateUser, HasPermission([EmployeePermissionsEnum.EDIT_EMPLOYEES]), departmentController.deleteDepartment);

export default router;
