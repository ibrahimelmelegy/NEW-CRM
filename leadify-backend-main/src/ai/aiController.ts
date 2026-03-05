import { Request, Response } from 'express';
import aiService from './aiService';
import summarizerService from './summarizerService';
import churnService from './churnService';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';
import User from '../user/userModel';

export const summarizeMeeting = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

    const summary = await summarizerService.summarizeMeeting(text);
    return wrapResult(res, summary);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
};

export const generateEmail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const emailContent = await aiService.generateEmail(prompt, context || {});

    return wrapResult(res, emailContent);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

export const getChurnDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await churnService.getChurnDashboard(req.user as User);
    return wrapResult(res, data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
};
