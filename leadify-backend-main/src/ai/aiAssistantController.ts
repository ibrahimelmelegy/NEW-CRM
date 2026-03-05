import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import aiAssistantService from './aiAssistantService';

// ===================================================================
// Lead Quality Scoring
// ===================================================================
export const aiAssistantController = {
  /**
   * POST /api/ai/assistant/score-lead/:leadId
   * AI-powered lead quality score (1-100) with reasoning
   */
  async scoreLead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leadId } = req.params;
      if (!leadId) {
        res.status(400).json({ success: false, message: 'Lead ID is required' });
        return;
      }

      const result = await aiAssistantService.scoreLeadQuality(leadId as string);
      wrapResult(res, result);
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg === 'Lead not found') {
        res.status(404).json({ success: false, message: 'Lead not found' });
        return;
      }
      next(error);
    }
  },

  /**
   * POST /api/ai/assistant/generate-email
   * AI-powered email draft generation with context
   */
  async generateEmailDraft(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        recipientName,
        recipientCompany,
        senderName,
        dealName,
        dealStage,
        dealValue,
        purpose,
        tone,
        additionalContext
      } = req.body;

      if (!purpose) {
        res.status(400).json({
          success: false,
          message: 'Email purpose is required. Must be one of: follow-up, introduction, proposal, thank-you, meeting-request, cold-outreach, check-in'
        });
        return;
      }

      const validPurposes = ['follow-up', 'introduction', 'proposal', 'thank-you', 'meeting-request', 'cold-outreach', 'check-in'];
      if (!validPurposes.includes(purpose)) {
        res.status(400).json({
          success: false,
          message: `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`
        });
        return;
      }

      const validTones = ['professional', 'friendly', 'formal', 'casual'];
      if (tone && !validTones.includes(tone)) {
        res.status(400).json({
          success: false,
          message: `Invalid tone. Must be one of: ${validTones.join(', ')}`
        });
        return;
      }

      const result = await aiAssistantService.generateEmailDraft({
        recipientName,
        recipientCompany,
        senderName,
        dealName,
        dealStage,
        dealValue: dealValue ? Number(dealValue) : undefined,
        purpose,
        tone,
        additionalContext
      });

      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/ai/assistant/deal-probability/:dealId
   * AI-powered deal win probability estimation
   */
  async dealWinProbability(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dealId } = req.params;
      if (!dealId) {
        res.status(400).json({ success: false, message: 'Deal ID is required' });
        return;
      }

      const result = await aiAssistantService.calculateDealWinProbability(dealId as string);
      wrapResult(res, result);
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg === 'Deal not found') {
        res.status(404).json({ success: false, message: 'Deal not found' });
        return;
      }
      next(error);
    }
  },

  /**
   * GET /api/ai/assistant/suggestions/:entityType/:entityId
   * AI-powered smart suggestions for a given entity
   */
  async smartSuggestions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, entityId } = req.params;

      if (!entityType || !entityId) {
        res.status(400).json({ success: false, message: 'Entity type and ID are required' });
        return;
      }

      const validTypes = ['lead', 'deal', 'client'];
      if (!validTypes.includes(entityType as string)) {
        res.status(400).json({
          success: false,
          message: `Invalid entity type. Must be one of: ${validTypes.join(', ')}`
        });
        return;
      }

      const result = await aiAssistantService.getSmartSuggestions(
        entityType as 'lead' | 'deal' | 'client',
        entityId as string
      );

      wrapResult(res, result);
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('not found')) {
        res.status(404).json({ success: false, message: msg });
        return;
      }
      next(error);
    }
  }
};
