import express from 'express';
import employeeController from './employeeController';
import departmentController from './departmentController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { EmployeePermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// Org Chart
router.get(
  '/org-chart',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_ORG_CHART, EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  employeeController.getOrgChart
);

// Expiring documents
router.get(
  '/expiring-documents',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  employeeController.getExpiringDocuments
);

// Employees CRUD
router.post(
  '/employees',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.CREATE_EMPLOYEES]),
  employeeController.createEmployee
);

router.get(
  '/employees',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  employeeController.getEmployees
);

router.get(
  '/employees/:id',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  employeeController.getEmployeeById
);

router.put(
  '/employees/:id',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.EDIT_EMPLOYEES]),
  employeeController.updateEmployee
);

// Direct reports
router.get(
  '/employees/:id/direct-reports',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  employeeController.getDirectReports
);

// Employee Documents
router.post(
  '/employees/:id/documents',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.EDIT_EMPLOYEES]),
  employeeController.addDocument
);

router.get(
  '/employees/:id/documents',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  employeeController.getDocuments
);

// Departments
router.get(
  '/departments',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  departmentController.getDepartments
);

router.get(
  '/departments/tree',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  departmentController.getDepartmentTree
);

router.get(
  '/departments/:id',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.VIEW_EMPLOYEES]),
  departmentController.getDepartmentById
);

router.post(
  '/departments',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.CREATE_EMPLOYEES]),
  departmentController.createDepartment
);

router.put(
  '/departments/:id',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.EDIT_EMPLOYEES]),
  departmentController.updateDepartment
);

router.delete(
  '/departments/:id',
  authenticateUser,
  HasPermission([EmployeePermissionsEnum.EDIT_EMPLOYEES]),
  departmentController.deleteDepartment
);

export default router;
