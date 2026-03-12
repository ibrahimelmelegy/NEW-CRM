import { Op, fn, col } from 'sequelize';
import { JobPosting, Applicant } from './recruitmentModel';
import Department from '../models/departmentModel';
import { clampPagination } from '../../utils/pagination';
import { io } from '../../server';

/** Valid forward stage progressions (REJECTED is allowed from any stage) */
const STAGE_ORDER: Array<Applicant['stage']> = ['APPLIED', 'SCREENING', 'INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED'];

class RecruitmentService {
  // ──────────── Job Postings CRUD ────────────
  async createPosting(data: Record<string, unknown>, tenantId?: string) {
    return JobPosting.create({ ...data, tenantId });
  }

  async getPostings(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) where.title = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await JobPosting.findAndCountAll({
      where,
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updatePosting(id: number, data: Record<string, unknown>) {
    const posting = await JobPosting.findByPk(id);
    if (!posting) return null;
    await posting.update(data);
    return posting;
  }

  async deletePosting(id: number) {
    const posting = await JobPosting.findByPk(id);
    if (!posting) return false;
    await posting.destroy();
    return true;
  }

  // ──────────── Applicants CRUD ────────────
  async createApplicant(data: Record<string, unknown>, tenantId?: string) {
    return Applicant.create({ ...data, tenantId });
  }

  async getApplicants(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.jobPostingId) where.jobPostingId = query.jobPostingId;
    if (query.stage) where.stage = query.stage;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await Applicant.findAndCountAll({
      where,
      include: [{ model: JobPosting, as: 'jobPosting', attributes: ['id', 'title'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateApplicant(id: number, data: Record<string, unknown>) {
    const applicant = await Applicant.findByPk(id);
    if (!applicant) return null;
    await applicant.update(data);
    return applicant;
  }

  async deleteApplicant(id: number) {
    const applicant = await Applicant.findByPk(id);
    if (!applicant) return false;
    await applicant.destroy();
    return true;
  }

  /* ───────────────────── Business Logic ───────────────────── */

  /**
   * Move an applicant to a new stage with validation.
   * - REJECTED is allowed from any stage.
   * - Forward progression only (no skipping backwards).
   * - Records the stage change timestamp in the experience JSONB field.
   */
  async moveApplicantStage(applicantId: number, newStage: Applicant['stage']) {
    const applicant = await Applicant.findByPk(applicantId);
    if (!applicant) throw new Error('Applicant not found');

    const currentStage = applicant.stage;

    // Prevent changes on terminal stages
    if (currentStage === 'HIRED') {
      throw new Error('Cannot change stage of a hired applicant');
    }
    if (currentStage === 'REJECTED' && newStage !== 'APPLIED') {
      throw new Error('Rejected applicants can only be moved back to APPLIED for reconsideration');
    }

    // REJECTED is allowed from any active stage
    if (newStage !== 'REJECTED') {
      const currentIndex = STAGE_ORDER.indexOf(currentStage);
      const newIndex = STAGE_ORDER.indexOf(newStage);

      if (newIndex < 0) {
        throw new Error(`Invalid stage: ${newStage}`);
      }
      if (newIndex <= currentIndex) {
        throw new Error(`Cannot move backwards from ${currentStage} to ${newStage}`);
      }
    }

    // Record stage transition timestamp in the experience JSONB
    const stageHistory = (applicant.experience as any)?.stageHistory || [];
    stageHistory.push({
      from: currentStage,
      to: newStage,
      timestamp: new Date().toISOString()
    });

    await applicant.update({
      stage: newStage,
      experience: { ...(applicant.experience || {}), stageHistory }
    });

    try {
      io.emit('recruitment:stage_changed', { id: applicantId, name: applicant.name, previousStage: currentStage, newStage });
    } catch (_ignored: unknown) { /* non-critical */ }
    if (newStage === 'HIRED') {
      try {
        io.emit('recruitment:hired', { id: applicantId, name: applicant.name, jobPostingId: applicant.jobPostingId });
      } catch (_ignored: unknown) { /* non-critical */ }
    }

    return applicant.reload();
  }

  /**
   * Check if an applicant with the same email already exists for a given job posting.
   * Returns the existing applicant if found, null otherwise.
   */
  async checkDuplicateApplicant(email: string, jobPostingId: number) {
    const existing = await Applicant.findOne({
      where: {
        email: { [Op.iLike]: email.trim() },
        jobPostingId
      }
    });
    return existing;
  }

  /**
   * Get the recruitment funnel for a job posting.
   * Returns count at each stage and conversion rates between consecutive stages.
   */
  async getRecruitmentFunnel(jobPostingId: number) {
    const stages: Applicant['stage'][] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED', 'REJECTED'];

    const counts = (await Applicant.findAll({
      where: { jobPostingId },
      attributes: ['stage', [fn('COUNT', col('id')), 'count']],
      group: ['stage'],
      raw: true
    })) as unknown as Array<{ stage: string; count: string }>;

    const stageCountMap: Record<string, number> = {};
    for (const row of counts) {
      stageCountMap[row.stage] = parseInt(row.count, 10);
    }

    const funnel = stages.map(stage => ({
      stage,
      count: stageCountMap[stage] || 0
    }));

    // Calculate conversion rates between forward-progression stages (excluding REJECTED)
    const forwardStages = funnel.filter(s => s.stage !== 'REJECTED');
    const conversions: Array<{ from: string; to: string; rate: number }> = [];
    for (let i = 0; i < forwardStages.length - 1; i++) {
      const fromCount = forwardStages[i].count;
      const toCount = forwardStages[i + 1].count;
      conversions.push({
        from: forwardStages[i].stage,
        to: forwardStages[i + 1].stage,
        rate: fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0
      });
    }

    const totalApplicants = Object.values(stageCountMap).reduce((a, b) => a + b, 0);
    const rejectedCount = stageCountMap['REJECTED'] || 0;

    return {
      jobPostingId,
      totalApplicants,
      funnel,
      conversions,
      rejectionRate: totalApplicants > 0 ? Math.round((rejectedCount / totalApplicants) * 100) : 0
    };
  }

  /**
   * Calculate the average number of days from APPLIED to HIRED for completed hires
   * within the specified date period.
   */
  async getTimeToHire(tenantId: string, period: { from: string; to: string }) {
    // Get all HIRED applicants in the given period by looking at their stageHistory
    const hiredApplicants = await Applicant.findAll({
      where: {
        tenantId,
        stage: 'HIRED',
        createdAt: { [Op.between]: [period.from, period.to] }
      },
      attributes: ['id', 'createdAt', 'experience'],
      raw: true
    });

    if (hiredApplicants.length === 0) {
      return { hires: 0, avgDaysToHire: null, minDays: null, maxDays: null };
    }

    const daysArray: number[] = [];

    for (const applicant of hiredApplicants) {
      const exp = applicant.experience as any;
      const stageHistory = exp?.stageHistory || [];

      // Find the HIRED transition timestamp
      const hiredEntry = stageHistory.find((h: any) => h.to === 'HIRED');
      const hiredDate = hiredEntry?.timestamp ? new Date(hiredEntry.timestamp) : null;
      const appliedDate = new Date(applicant.createdAt as any);

      if (hiredDate) {
        const diffMs = hiredDate.getTime() - appliedDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        daysArray.push(diffDays);
      }
    }

    if (daysArray.length === 0) {
      return { hires: hiredApplicants.length, avgDaysToHire: null, minDays: null, maxDays: null };
    }

    const avg = Math.round(daysArray.reduce((a, b) => a + b, 0) / daysArray.length);

    return {
      hires: hiredApplicants.length,
      avgDaysToHire: avg,
      minDays: Math.min(...daysArray),
      maxDays: Math.max(...daysArray)
    };
  }

  /**
   * Close a job posting. Sets status to CLOSED, records closedAt.
   * Optionally rejects all applicants who are not already HIRED or REJECTED.
   */
  async closePosting(postingId: number, rejectRemaining = true) {
    const posting = await JobPosting.findByPk(postingId);
    if (!posting) throw new Error('Job posting not found');

    if (posting.status === 'CLOSED') {
      throw new Error('Posting is already closed');
    }

    await posting.update({
      status: 'CLOSED',
      closingDate: new Date().toISOString().split('T')[0]
    });

    let rejectedCount = 0;

    if (rejectRemaining) {
      const [affected] = await Applicant.update(
        { stage: 'REJECTED' },
        {
          where: {
            jobPostingId: postingId,
            stage: { [Op.notIn]: ['HIRED', 'REJECTED'] }
          }
        }
      );
      rejectedCount = affected;
    }

    return { posting: await posting.reload(), rejectedCount };
  }

  /**
   * Comprehensive analytics for a single job posting.
   * Total applicants, per-stage breakdown, conversion rate, and time-to-fill estimate.
   */
  async getPostingAnalytics(postingId: number) {
    const posting = await JobPosting.findByPk(postingId);
    if (!posting) throw new Error('Job posting not found');

    const funnel = await this.getRecruitmentFunnel(postingId);

    // Time to fill: days from posting creation to first HIRED applicant
    let timeToFill: number | null = null;
    const firstHired = await Applicant.findOne({
      where: { jobPostingId: postingId, stage: 'HIRED' },
      order: [['updatedAt', 'ASC']],
      attributes: ['updatedAt'],
      raw: true
    });

    if (firstHired && posting.createdAt) {
      const diffMs = new Date(firstHired.updatedAt as any).getTime() - new Date(posting.createdAt as any).getTime();
      timeToFill = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    // Source breakdown
    const sourceCounts = (await Applicant.findAll({
      where: { jobPostingId: postingId, source: { [Op.ne]: null } },
      attributes: ['source', [fn('COUNT', col('id')), 'count']],
      group: ['source'],
      raw: true
    })) as unknown as Array<{ source: string; count: string }>;

    return {
      postingId,
      title: posting.title,
      status: posting.status,
      openPositions: posting.openPositions,
      ...funnel,
      timeToFillDays: timeToFill,
      sourceBreakdown: sourceCounts.map(s => ({ source: s.source, count: parseInt(s.count, 10) }))
    };
  }
}

export default new RecruitmentService();
