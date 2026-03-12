import { Op, WhereOptions } from 'sequelize';
import Sequence, { SequenceEnrollment } from './sequenceModel';
import { clampPagination } from '../utils/pagination';

class SequenceService {
  async getSequences(query: Record<string, unknown>): Promise<any> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey, isActive } = query;

    const where: WhereOptions = {};

    if (searchKey) {
      (where as any)[Op.or] = [{ name: { [Op.iLike]: `%${searchKey}%` } }, { description: { [Op.iLike]: `%${searchKey}%` } }];
    }

    if (isActive !== undefined && isActive !== '') {
      (where as any).isActive = isActive === 'true' || isActive === true;
    }

    const { rows: docs, count: totalItems } = await Sequence.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async createSequence(data: Record<string, unknown>): Promise<Sequence> {
    return Sequence.create(data);
  }

  async updateSequence(id: string, data: Record<string, unknown>): Promise<Sequence> {
    const sequence = await Sequence.findByPk(id);
    if (!sequence) throw new Error('Sequence not found');
    return sequence.update(data);
  }

  async deleteSequence(id: string): Promise<void> {
    const sequence = await Sequence.findByPk(id);
    if (!sequence) throw new Error('Sequence not found');
    await SequenceEnrollment.destroy({ where: { sequenceId: id } });
    await sequence.destroy();
  }

  async enrollEntity(sequenceId: string, entityType: string, entityId: string): Promise<SequenceEnrollment> {
    const sequence = await Sequence.findByPk(sequenceId);
    if (!sequence) throw new Error('Sequence not found');

    return SequenceEnrollment.create({
      sequenceId,
      entityType,
      entityId,
      currentStep: 0,
      status: 'active',
      nextRunAt: new Date()
    });
  }

  async advanceStep(enrollmentId: string): Promise<SequenceEnrollment> {
    const enrollment = await SequenceEnrollment.findByPk(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    if (enrollment.status !== 'active') throw new Error('Enrollment is not active');

    const sequence = await Sequence.findByPk(enrollment.sequenceId);
    if (!sequence) throw new Error('Sequence not found');

    const nextStep = enrollment.currentStep + 1;
    if (nextStep >= sequence.steps.length) {
      return enrollment.update({ currentStep: nextStep, status: 'completed', nextRunAt: null });
    }

    const delayDays = sequence.steps[nextStep]?.delayDays || 0;
    const nextRunAt = new Date();
    nextRunAt.setDate(nextRunAt.getDate() + delayDays);

    return enrollment.update({ currentStep: nextStep, nextRunAt });
  }

  async pauseEnrollment(id: string): Promise<SequenceEnrollment> {
    const enrollment = await SequenceEnrollment.findByPk(id);
    if (!enrollment) throw new Error('Enrollment not found');
    return enrollment.update({ status: 'paused' });
  }

  async resumeEnrollment(id: string): Promise<SequenceEnrollment> {
    const enrollment = await SequenceEnrollment.findByPk(id);
    if (!enrollment) throw new Error('Enrollment not found');
    return enrollment.update({ status: 'active', nextRunAt: new Date() });
  }

  async getEnrollments(sequenceId: string): Promise<SequenceEnrollment[]> {
    return SequenceEnrollment.findAll({
      where: { sequenceId },
      order: [['createdAt', 'DESC']]
    });
  }

  async getStats(sequenceId: string): Promise<any> {
    const enrollments = await SequenceEnrollment.findAll({ where: { sequenceId } });
    const sequence = await Sequence.findByPk(sequenceId);

    return {
      totalEnrollments: enrollments.length,
      active: enrollments.filter(e => e.status === 'active').length,
      paused: enrollments.filter(e => e.status === 'paused').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      cancelled: enrollments.filter(e => e.status === 'cancelled').length,
      totalSteps: sequence?.steps?.length || 0
    };
  }
}

export default new SequenceService();
