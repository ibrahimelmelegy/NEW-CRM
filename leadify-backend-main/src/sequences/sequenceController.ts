import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import sequenceService from './sequenceService';

class SequenceController {
  public async getSequences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await sequenceService.getSequences(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async createSequence(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sequence = await sequenceService.createSequence({
        ...req.body,
        createdBy: String(req.user!.id)
      });
      wrapResult(res, sequence, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateSequence(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sequence = await sequenceService.updateSequence(req.params.id as string, req.body);
      wrapResult(res, sequence);
    } catch (error) {
      next(error);
    }
  }

  public async deleteSequence(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await sequenceService.deleteSequence(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  public async enrollEntity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrollment = await sequenceService.enrollEntity(req.params.id as string, req.body.entityType, req.body.entityId);
      wrapResult(res, enrollment, 201);
    } catch (error) {
      next(error);
    }
  }

  public async advanceStep(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrollment = await sequenceService.advanceStep(req.params.id as string);
      wrapResult(res, enrollment);
    } catch (error) {
      next(error);
    }
  }

  public async pauseEnrollment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrollment = await sequenceService.pauseEnrollment(req.params.id as string);
      wrapResult(res, enrollment);
    } catch (error) {
      next(error);
    }
  }

  public async resumeEnrollment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrollment = await sequenceService.resumeEnrollment(req.params.id as string);
      wrapResult(res, enrollment);
    } catch (error) {
      next(error);
    }
  }

  public async getEnrollments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrollments = await sequenceService.getEnrollments(req.params.id as string);
      wrapResult(res, enrollments);
    } catch (error) {
      next(error);
    }
  }

  public async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await sequenceService.getStats(req.params.id as string);
      wrapResult(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export default new SequenceController();
