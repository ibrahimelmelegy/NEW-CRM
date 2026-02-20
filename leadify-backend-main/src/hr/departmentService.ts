import Department from './models/departmentModel';
import Employee from './models/employeeModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { fn, col, Op } from 'sequelize';

class DepartmentService {
  async createDepartment(data: any) {
    const existing = await Department.findOne({ where: { code: data.code } });
    if (existing) throw new BaseError(ERRORS.NAME_ALREADY_EXISTS, 400, 'Department code already exists');
    return Department.create(data);
  }

  async getDepartments() {
    const departments = await Department.findAll({
      include: [
        { model: Department, as: 'parent', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });

    // Count employees per department
    const employeeCounts = await Employee.findAll({
      attributes: ['departmentId', [fn('COUNT', col('id')), 'employeeCount']],
      where: { departmentId: { [Op.ne]: null } },
      group: ['departmentId'],
      raw: true
    }) as any[];

    const countMap = new Map<string, number>();
    for (const row of employeeCounts) {
      countMap.set(row.departmentId, parseInt(row.employeeCount, 10));
    }

    return departments.map(dept => {
      const plain = dept.toJSON();
      return { ...plain, employeeCount: countMap.get(plain.id) || 0 };
    });
  }

  async getDepartmentById(id: string) {
    const department = await Department.findByPk(id, {
      include: [
        { model: Department, as: 'parent', attributes: ['id', 'name'] },
        { model: Department, as: 'children', attributes: ['id', 'name', 'code'] }
      ]
    });
    if (!department) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Department not found');
    return department;
  }

  async updateDepartment(id: string, data: any) {
    const department = await Department.findByPk(id);
    if (!department) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Department not found');

    if (data.code && data.code !== department.code) {
      const existing = await Department.findOne({ where: { code: data.code } });
      if (existing) throw new BaseError(ERRORS.NAME_ALREADY_EXISTS, 400, 'Department code already exists');
    }

    await department.update(data);
    return department;
  }

  async deleteDepartment(id: string) {
    const department = await Department.findByPk(id);
    if (!department) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Department not found');

    // Check if department has employees
    const employeeCount = await Employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Cannot delete department with assigned employees');
    }

    // Check if department has children
    const childCount = await Department.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Cannot delete department with sub-departments');
    }

    await department.destroy();
    return { deleted: true };
  }

  async getDepartmentTree() {
    const departments = await Department.findAll({
      order: [['name', 'ASC']],
      raw: true
    }) as any[];

    // Count employees per department
    const employeeCounts = await Employee.findAll({
      attributes: ['departmentId', [fn('COUNT', col('id')), 'employeeCount']],
      where: { departmentId: { [Op.ne]: null } },
      group: ['departmentId'],
      raw: true
    }) as any[];

    const countMap = new Map<string, number>();
    for (const row of employeeCounts) {
      countMap.set(row.departmentId, parseInt(row.employeeCount, 10));
    }

    const deptMap = new Map<string, any>();
    const roots: any[] = [];

    for (const dept of departments) {
      dept.children = [];
      dept.employeeCount = countMap.get(dept.id) || 0;
      deptMap.set(dept.id, dept);
    }

    for (const dept of deptMap.values()) {
      if (dept.parentId && deptMap.has(dept.parentId)) {
        deptMap.get(dept.parentId).children.push(dept);
      } else {
        roots.push(dept);
      }
    }

    return roots;
  }
}

export default new DepartmentService();
