import { Op } from 'sequelize';
import { clampPagination } from '../utils/pagination';
import Employee from './models/employeeModel';
import Department from './models/departmentModel';
import EmployeeDocument from './models/employeeDocumentModel';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { tenantWhere } from '../utils/tenantScope';

interface EmployeeQuery {
  page?: number;
  limit?: number;
  departmentId?: string;
  status?: string;
  search?: string;
  managerId?: string;
  employmentType?: string;
  sortBy?: string;
  sort?: string;
}

class EmployeeService {
  async generateEmployeeNumber(tenantId?: string): Promise<string> {
    const lastEmployee = await Employee.findOne({
      where: { ...(tenantId && { tenantId }) },
      order: [['createdAt', 'DESC']],
      attributes: ['employeeNumber']
    });

    if (!lastEmployee || !lastEmployee.employeeNumber) {
      return 'EMP-0001';
    }

    const lastNumber = parseInt(lastEmployee.employeeNumber.replace('EMP-', ''), 10);
    const nextNumber = lastNumber + 1;
    return `EMP-${nextNumber.toString().padStart(4, '0')}`;
  }

  async createEmployee(data: unknown) {
    const employeeNumber = await this.generateEmployeeNumber();
    const employee = await Employee.create({ ...data, employeeNumber });
    return employee;
  }

  async getEmployees(query: EmployeeQuery) {
    const { page, limit, offset } = clampPagination(query, 20);
    const { departmentId, status, search, managerId, employmentType, sortBy = 'createdAt', sort = 'DESC' } = query;

    const where: Record<string, unknown> = {};

    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;
    if (managerId) where.managerId = managerId;

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeNumber: { [Op.iLike]: `%${search}%` } },
        { jobTitle: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const { rows, count } = await Employee.findAndCountAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'jobTitle'] }
      ],
      order: [[sortBy, sort.toUpperCase()]],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getEmployeeById(id: string) {
    const employee = await Employee.findByPk(id, {
      include: [
        { model: Department, as: 'department' },
        { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'jobTitle', 'email'] },
        { model: Employee, as: 'directReports', attributes: ['id', 'firstName', 'lastName', 'jobTitle', 'status'] },
        { model: EmployeeDocument, as: 'documents' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'profilePicture'] }
      ]
    });

    if (!employee) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Employee not found');
    return employee;
  }

  async updateEmployee(id: string, data: unknown) {
    const employee = await Employee.findByPk(id);
    if (!employee) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Employee not found');
    await employee.update(data);
    return employee;
  }

  async deleteEmployee(id: string) {
    const employee = await Employee.findByPk(id);
    if (!employee) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Employee not found');
    await employee.destroy();
    return { deleted: true };
  }

  async getOrgChart() {
    const employees = await Employee.findAll({
      attributes: ['id', 'firstName', 'lastName', 'jobTitle', 'managerId', 'departmentId', 'status'],
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      where: { status: { [Op.ne]: 'TERMINATED' } },
      order: [['firstName', 'ASC']]
    });

    const employeeMap = new Map<string, any>();
    const roots: unknown[] = [];

    // Build map
    for (const emp of employees) {
      const plain = emp.toJSON();
      plain.children = [];
      employeeMap.set(plain.id, plain);
    }

    // Build tree
    for (const emp of employeeMap.values()) {
      if (emp.managerId && employeeMap.has(emp.managerId)) {
        employeeMap.get(emp.managerId).children.push(emp);
      } else {
        roots.push(emp);
      }
    }

    return roots;
  }

  async getByDepartment(departmentId: string) {
    return Employee.findAll({
      where: { departmentId },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      order: [['firstName', 'ASC']]
    });
  }

  async getDirectReports(managerId: string) {
    return Employee.findAll({
      where: { managerId },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      order: [['firstName', 'ASC']]
    });
  }

  // Documents
  async addDocument(employeeId: string, data: unknown) {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Employee not found');
    return EmployeeDocument.create({ ...data, employeeId });
  }

  async getDocuments(employeeId: string) {
    return EmployeeDocument.findAll({
      where: { employeeId },
      order: [['createdAt', 'DESC']]
    });
  }

  async getExpiringDocuments(days: number = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return EmployeeDocument.findAll({
      where: {
        expiryDate: {
          [Op.between]: [now, futureDate]
        }
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeNumber']
        }
      ],
      order: [['expiryDate', 'ASC']]
    });
  }
}

export default new EmployeeService();
