import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import trainingService from './trainingService';

class TrainingController {
  // ──────────── Programs CRUD ────────────
  async createProgram(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await trainingService.createProgram(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getProgramById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await trainingService.getProgramById(Number(req.params.id));
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getPrograms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await trainingService.getPrograms(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async updateProgram(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await trainingService.updateProgram(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async deleteProgram(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await trainingService.deleteProgram(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  // ──────────── Enrollments CRUD ────────────
  async enroll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await trainingService.enroll(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getEnrollments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await trainingService.getEnrollments(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async updateEnrollment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await trainingService.updateEnrollment(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async deleteEnrollment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await trainingService.deleteEnrollment(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  // ──────────── Business Logic Endpoints ────────────
  async enrollWithCapacity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await trainingService.enrollWithCapacityCheck(
        Number(req.body.programId),
        Number(req.body.employeeId),
        tenantId
      );
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async completeTraining(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await trainingService.completeTraining(Number(req.params.id));
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getCompletionRate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await trainingService.getCompletionRate(Number(req.params.programId));
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getEmployeeHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await trainingService.getEmployeeTrainingHistory(Number(req.params.employeeId));
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await trainingService.getTrainingDashboard(tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async checkPrerequisites(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await trainingService.checkPrerequisites(
        Number(req.params.programId),
        Number(req.query.employeeId)
      );
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new TrainingController();
