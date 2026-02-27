import { Op, fn, col } from 'sequelize';
import { TrainingProgram, TrainingEnrollment } from './trainingModel';
import Employee from '../models/employeeModel';
import { clampPagination } from '../../utils/pagination';
import { io } from '../../server';

class TrainingService {
  // ──────────── Programs CRUD ────────────
  async createProgram(data: any, tenantId?: string) {
    return TrainingProgram.create({ ...data, tenantId });
  }

  async getProgramById(id: number) {
    return TrainingProgram.findByPk(id, {
      include: [
        { model: TrainingEnrollment, as: 'enrollments', include: [
          { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'jobTitle'] }
        ]}
      ]
    });
  }

  async getPrograms(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) where.title = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await TrainingProgram.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateProgram(id: number, data: any) {
    const program = await TrainingProgram.findByPk(id);
    if (!program) return null;
    await program.update(data);
    return program;
  }

  async deleteProgram(id: number) {
    const program = await TrainingProgram.findByPk(id);
    if (!program) return false;
    await program.destroy();
    return true;
  }

  // ──────────── Enrollments CRUD ────────────
  async enroll(data: any, tenantId?: string) {
    return TrainingEnrollment.create({ ...data, tenantId });
  }

  async getEnrollments(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.programId) where.programId = query.programId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;

    const { rows, count } = await TrainingEnrollment.findAndCountAll({
      where,
      include: [
        { model: TrainingProgram, as: 'program', attributes: ['id', 'title', 'type', 'category'] },
        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'jobTitle'] }
      ],
      order: [['createdAt', 'DESC']],
      limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateEnrollment(id: number, data: any) {
    const enrollment = await TrainingEnrollment.findByPk(id);
    if (!enrollment) return null;
    if (data.status === 'COMPLETED' && !enrollment.completedAt) {
      data.completedAt = new Date();
    }
    await enrollment.update(data);
    return enrollment;
  }

  async deleteEnrollment(id: number) {
    const enrollment = await TrainingEnrollment.findByPk(id);
    if (!enrollment) return false;
    await enrollment.destroy();
    return true;
  }

  /* ───────────────────── Business Logic ───────────────────── */

  /**
   * Enroll an employee in a training program with capacity validation.
   * Checks maxParticipants on the program and throws if capacity is reached.
   * Also prevents duplicate enrollments for the same employee + program.
   */
  async enrollWithCapacityCheck(programId: number, employeeId: number, tenantId?: string) {
    const program = await TrainingProgram.findByPk(programId);
    if (!program) throw new Error('Training program not found');

    if (program.status !== 'ACTIVE') {
      throw new Error(`Cannot enroll in a program with status ${program.status}`);
    }

    // Check for duplicate enrollment
    const existingEnrollment = await TrainingEnrollment.findOne({
      where: {
        programId,
        employeeId,
        status: { [Op.notIn]: ['DROPPED', 'FAILED'] }
      }
    });
    if (existingEnrollment) {
      throw new Error('Employee is already enrolled in this program');
    }

    // Check capacity
    if (program.maxParticipants) {
      const currentEnrollmentCount = await TrainingEnrollment.count({
        where: {
          programId,
          status: { [Op.notIn]: ['DROPPED', 'FAILED'] }
        }
      });

      if (currentEnrollmentCount >= program.maxParticipants) {
        throw new Error(
          `Program is full (${currentEnrollmentCount}/${program.maxParticipants} participants)`
        );
      }
    }

    // Check prerequisites before enrolling
    await this.checkPrerequisites(programId, employeeId);

    const enrollment = await TrainingEnrollment.create({
      programId,
      employeeId,
      tenantId,
      status: 'ENROLLED',
      progress: 0
    });

    try { io.emit('training:enrolled', { id: enrollment.id, programId, employeeId, programTitle: program.title }); } catch {}
    return enrollment;
  }

  /**
   * Mark an enrollment as COMPLETED.
   * Sets completedAt and updates the enrollment's progress to 100%.
   */
  async completeTraining(enrollmentId: number) {
    const enrollment = await TrainingEnrollment.findByPk(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    if (enrollment.status === 'COMPLETED') {
      throw new Error('Training is already completed');
    }
    if (enrollment.status === 'DROPPED') {
      throw new Error('Cannot complete a dropped enrollment');
    }

    await enrollment.update({
      status: 'COMPLETED',
      progress: 100,
      completedAt: new Date()
    });

    try { io.emit('training:completed', { id: enrollmentId, programId: enrollment.programId, employeeId: enrollment.employeeId }); } catch {}
    return enrollment.reload();
  }

  /**
   * Calculate the completion rate for a specific training program.
   * Returns enrolled count, completed count, and percentage.
   */
  async getCompletionRate(programId: number) {
    const [totalEnrolled, completedCount] = await Promise.all([
      TrainingEnrollment.count({
        where: { programId, status: { [Op.notIn]: ['DROPPED'] } }
      }),
      TrainingEnrollment.count({
        where: { programId, status: 'COMPLETED' }
      })
    ]);

    return {
      programId,
      totalEnrolled,
      completedCount,
      completionRate: totalEnrolled > 0
        ? Math.round((completedCount / totalEnrolled) * 100)
        : 0
    };
  }

  /**
   * Get the full training history for a given employee.
   * Includes program details, completion status, dates, and scores.
   */
  async getEmployeeTrainingHistory(employeeId: number) {
    const enrollments = await TrainingEnrollment.findAll({
      where: { employeeId },
      include: [
        {
          model: TrainingProgram,
          as: 'program',
          attributes: ['id', 'title', 'type', 'category', 'durationHours', 'instructor']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const completed = enrollments.filter(e => e.status === 'COMPLETED').length;
    const inProgress = enrollments.filter(e => ['ENROLLED', 'IN_PROGRESS'].includes(e.status)).length;
    const totalHours = enrollments
      .filter(e => e.status === 'COMPLETED')
      .reduce((sum, e) => sum + ((e.program as any)?.durationHours || 0), 0);

    return {
      employeeId,
      enrollments,
      summary: {
        totalPrograms: enrollments.length,
        completed,
        inProgress,
        dropped: enrollments.filter(e => e.status === 'DROPPED').length,
        failed: enrollments.filter(e => e.status === 'FAILED').length,
        totalTrainingHours: totalHours
      }
    };
  }

  /**
   * Aggregate training dashboard data for a tenant.
   * Total programs, active enrollments, overall completion rate,
   * upcoming programs, and overdue completions.
   */
  async getTrainingDashboard(tenantId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalPrograms,
      activePrograms,
      activeEnrollments,
      completedEnrollments,
      totalEnrollments,
      upcomingPrograms,
      overdueEnrollments
    ] = await Promise.all([
      TrainingProgram.count({ where: { tenantId } }),
      TrainingProgram.count({ where: { tenantId, status: 'ACTIVE' } }),
      TrainingEnrollment.count({
        where: { tenantId, status: { [Op.in]: ['ENROLLED', 'IN_PROGRESS'] } }
      }),
      TrainingEnrollment.count({
        where: { tenantId, status: 'COMPLETED' }
      }),
      TrainingEnrollment.count({
        where: { tenantId, status: { [Op.notIn]: ['DROPPED'] } }
      }),
      TrainingProgram.findAll({
        where: {
          tenantId,
          status: 'ACTIVE',
          startDate: { [Op.gt]: today }
        },
        attributes: ['id', 'title', 'startDate', 'maxParticipants', 'type'],
        order: [['startDate', 'ASC']],
        limit: 10
      }),
      // Overdue: enrolled/in-progress in programs whose endDate has passed
      TrainingEnrollment.count({
        where: {
          tenantId,
          status: { [Op.in]: ['ENROLLED', 'IN_PROGRESS'] }
        },
        include: [{
          model: TrainingProgram,
          as: 'program',
          where: {
            endDate: { [Op.lt]: today, [Op.ne]: null }
          },
          attributes: []
        }]
      })
    ]);

    const overallCompletionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    // Top categories by enrollment
    const categoryCounts = await TrainingEnrollment.findAll({
      where: { tenantId },
      include: [{
        model: TrainingProgram,
        as: 'program',
        attributes: ['category'],
        where: { category: { [Op.ne]: null } }
      }],
      attributes: [
        [col('program.category'), 'category'],
        [fn('COUNT', col('TrainingEnrollment.id')), 'count']
      ],
      group: ['program.category'],
      order: [[fn('COUNT', col('TrainingEnrollment.id')), 'DESC']],
      limit: 5,
      raw: true
    }) as unknown as Array<{ category: string; count: string }>;

    return {
      totalPrograms,
      activePrograms,
      activeEnrollments,
      completedEnrollments,
      overallCompletionRate,
      overdueEnrollments,
      upcomingPrograms,
      topCategories: categoryCounts.map(c => ({
        category: c.category,
        enrollments: parseInt(c.count, 10)
      }))
    };
  }

  /**
   * Check if an employee has completed all prerequisite programs.
   * Prerequisites are stored as a JSONB array of program IDs in the program's description
   * or as a convention: programs with the same category and a lower ID are prerequisites.
   *
   * This implementation checks if the program has a `prerequisites` field in its
   * description metadata (stored as JSON in the description field, e.g., "prereqs:[1,2,3]")
   * or falls back to no prerequisites.
   */
  async checkPrerequisites(programId: number, employeeId: number) {
    const program = await TrainingProgram.findByPk(programId);
    if (!program) throw new Error('Training program not found');

    // Extract prerequisite program IDs from description (format: prereqs:[1,2,3])
    let prerequisiteIds: number[] = [];
    if (program.description) {
      const match = program.description.match(/prereqs:\[([0-9,\s]+)\]/);
      if (match) {
        prerequisiteIds = match[1].split(',').map((id: string) => parseInt(id.trim(), 10)).filter((n: number) => !isNaN(n));
      }
    }

    if (prerequisiteIds.length === 0) {
      return { met: true, missing: [] };
    }

    // Check which prerequisites the employee has completed
    const completedPrereqs = await TrainingEnrollment.findAll({
      where: {
        employeeId,
        programId: { [Op.in]: prerequisiteIds },
        status: 'COMPLETED'
      },
      attributes: ['programId'],
      raw: true
    });

    const completedIds = new Set(completedPrereqs.map((e: any) => e.programId));
    const missingIds = prerequisiteIds.filter(id => !completedIds.has(id));

    if (missingIds.length > 0) {
      // Fetch titles for a helpful error message
      const missingPrograms = await TrainingProgram.findAll({
        where: { id: { [Op.in]: missingIds } },
        attributes: ['id', 'title'],
        raw: true
      });

      const missingTitles = missingPrograms.map((p: any) => `"${p.title}" (ID: ${p.id})`).join(', ');
      throw new Error(`Prerequisites not met. Employee must first complete: ${missingTitles}`);
    }

    return { met: true, missing: [] };
  }
}

export default new TrainingService();
