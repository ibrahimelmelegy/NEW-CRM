import { Includeable, Op, WhereOptions, fn, col, literal } from 'sequelize';
import ProjectManpower from './projectManpowerModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import manpowerService from '../manpower/manpowerService';
import { MissionEnum } from './projectManpowerEnum';
import Manpower from '../manpower/manpowerModel';
import Project from '../project/models/projectModel';
import projectService from '../project/projectService';
import User from '../user/userModel';
import { createActivityLog } from '../activity-logs/activityService';
import { clampPagination } from '../utils/pagination';

class ProjectManpowerService {
  public async createProjectManpower(data: any, user: User): Promise<ProjectManpower> {
    const { projectId, manpowerId, estimatedWorkDays, mission, otherCosts, otherCostsReason, actualWorkDays } = data;
    await projectService.validateProjectAccess(projectId, user);

    const project = await projectService.projectOrError({ id: projectId });
    const manpower = await manpowerService.manpowerOrError({ id: manpowerId });

    // Calculate mission weight
    const missionWeight = mission.reduce((totalWeight: number, missionItem: string) => {
      const missionValue = MissionEnum[missionItem as keyof typeof MissionEnum] || 0;
      return totalWeight + missionValue;
    }, 0);

    // Calculate costs
    const durationCost = manpower.dailyCost * estimatedWorkDays * missionWeight;

    const projectManpower = await ProjectManpower.create({
      projectId,
      manpowerId,
      estimatedWorkDays,
      actualWorkDays,
      mission,
      durationCost: parseFloat(durationCost.toFixed(2)),
      otherCosts,
      otherCostsReason
    });
    await projectService.recalculateProject(project);
    project.isCompleted && (await createActivityLog('project', 'update', project.id, user.id, null, 'Prject manpower got updated Successfully'));

    return this.projectManpowerById(projectManpower.id);
  }

  public async updateProjectManpower(id: string, data: any, user: User): Promise<ProjectManpower> {
    await projectService.validateProjectAccess(id, user);

    const projectManpower = await this.projectManpowerOrError({ id });
    const project = await projectService.projectOrError({ id: projectManpower.projectId });
    const manpower = await manpowerService.manpowerOrError({ id: projectManpower.manpowerId });

    // Recalculate costs if applicable
    if (data.estimatedWorkDays || data.mission || data.otherCosts) {
      const missionWeight = (data.mission || projectManpower.mission).reduce((totalWeight: number, missionItem: string) => {
        const missionValue = MissionEnum[missionItem as keyof typeof MissionEnum] || 0;
        return totalWeight + missionValue;
      }, 0);

      const durationCost = manpower.dailyCost * (data.estimatedWorkDays || projectManpower.estimatedWorkDays) * missionWeight;
      data.durationCost = parseFloat(durationCost.toFixed(2));
    }

    await projectManpower.update(data);
    await projectService.recalculateProject(project);
    project.isCompleted && (await createActivityLog('project', 'update', project.id, user.id, null, 'Prject manpower got updated Successfully'));
    return this.projectManpowerById(projectManpower.id);
  }

  public async getProjectManpowers(query: any): Promise<any> {
    const { page, limit, offset } = clampPagination(query);

    const where: any = {
      ...(query.projectId && { projectId: query.projectId }),
      ...(query.manpowerId && { manpowerId: query.manpowerId }),
      ...(query.searchKey && {
        [Op.or]: [{ totalCost: { [Op.iLike]: `%${query.searchKey}%` } }]
      })
    };

    const { rows: manpowers, count: totalItems } = await ProjectManpower.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Manpower,
          as: 'manpower',
          attributes: ['name', 'phone', 'role', 'availabilityStatus', 'dailyCost']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'startDate', 'endDate', 'duration', 'resourceCount']
        }
      ]
    });

    return {
      docs: manpowers,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  public async projectManpowerById(id: string): Promise<ProjectManpower> {
    const projectManpower = await this.projectManpowerOrError({ id }, [
      {
        model: Manpower,
        as: 'manpower',
        attributes: ['name', 'phone']
      }
    ]);
    return projectManpower;
  }

  public async deleteProjectManpower(id: string, user: User): Promise<void> {
    const projectManpower = await this.projectManpowerOrError({ id });
    const project = await projectService.projectOrError({ id: projectManpower.projectId });
    await projectService.validateProjectAccess(id, user);
    await projectManpower.destroy();
    await projectService.recalculateProject(project);
    project.isCompleted && (await createActivityLog('project', 'update', project.id, user.id, null, 'Prject manpower got updated Successfully'));
  }

  /**
   * Utilization report: per-manpower aggregated data with over-allocation detection.
   * Returns each manpower resource, their total estimated days, total actual days,
   * project count, daily cost, and whether they are over-allocated (> maxCapacityDays).
   */
  public async getUtilizationReport(query: any): Promise<any> {
    const maxCapacityDays = Number(query.maxCapacityDays) || 22; // default ~1 month

    // Get all allocations grouped by manpower with aggregation
    const allocations = await ProjectManpower.findAll({
      attributes: [
        'manpowerId',
        [fn('SUM', col('estimatedWorkDays')), 'totalEstimatedDays'],
        [fn('SUM', col('actualWorkDays')), 'totalActualDays'],
        [fn('COUNT', col('ProjectManpower.id')), 'projectCount'],
        [fn('SUM', col('durationCost')), 'totalCost']
      ],
      group: ['manpowerId', 'manpower.id'],
      include: [
        {
          model: Manpower,
          as: 'manpower',
          attributes: ['id', 'name', 'phone', 'role', 'availabilityStatus', 'dailyCost', 'salary']
        }
      ],
      raw: false
    });

    const report = allocations.map((alloc: any) => {
      const totalEstimatedDays = Number(alloc.getDataValue('totalEstimatedDays')) || 0;
      const totalActualDays = Number(alloc.getDataValue('totalActualDays')) || 0;
      const projectCount = Number(alloc.getDataValue('projectCount')) || 0;
      const totalCost = Number(alloc.getDataValue('totalCost')) || 0;
      const utilization = maxCapacityDays > 0 ? Math.round((totalEstimatedDays / maxCapacityDays) * 100) : 0;
      const overAllocated = totalEstimatedDays > maxCapacityDays;

      return {
        manpowerId: alloc.manpowerId,
        manpower: alloc.manpower,
        totalEstimatedDays,
        totalActualDays,
        projectCount,
        totalCost,
        utilization,
        overAllocated,
        availableDays: Math.max(0, maxCapacityDays - totalEstimatedDays)
      };
    });

    // Sort by utilization descending (most allocated first)
    report.sort((a: any, b: any) => b.utilization - a.utilization);

    // Summary
    const totalResources = report.length;
    const overAllocatedCount = report.filter((r: any) => r.overAllocated).length;
    const avgUtilization = totalResources > 0
      ? Math.round(report.reduce((s: number, r: any) => s + r.utilization, 0) / totalResources)
      : 0;
    const totalAllocatedDays = report.reduce((s: number, r: any) => s + r.totalEstimatedDays, 0);

    return {
      summary: {
        totalResources,
        overAllocatedCount,
        avgUtilization,
        totalAllocatedDays,
        maxCapacityDays
      },
      resources: report
    };
  }

  /**
   * Get all allocations for a specific manpower resource, including project details.
   */
  public async getAllocationsByManpower(manpowerId: string): Promise<ProjectManpower[]> {
    return ProjectManpower.findAll({
      where: { manpowerId },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'startDate', 'endDate', 'duration']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async projectManpowerOrError(filter: WhereOptions, joinedTables?: Includeable[]): Promise<ProjectManpower> {
    const projectManpower = await ProjectManpower.findOne({ where: filter, include: joinedTables || [] });
    if (!projectManpower) throw new BaseError(ERRORS.PROJECT_MANPOWER_NOT_FOUND);
    return projectManpower;
  }
}

export default new ProjectManpowerService();
