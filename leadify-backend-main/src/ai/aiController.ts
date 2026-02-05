import { Request, Response } from 'express';
import aiService from './aiService';
import summarizerService from './summarizerService';

export const summarizeMeeting = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

        const summary = await summarizerService.summarizeMeeting(text);
        return res.status(200).json({ success: true, data: summary });
    } catch (error: any) {
        console.error('AI Summarizer Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const generateEmail = async (req: Request, res: Response) => {
    try {
        const { prompt, context } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Prompt is required' });
        }

        const emailContent = await aiService.generateEmail(prompt, context || {});

        return res.status(200).json({
            success: true,
            data: emailContent
        });
    } catch (error) {
        console.error('AI Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};
