
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

import Integration from '../integration/integrationModel';

class AIService {
    private openai: OpenAI | null = null;

    private async getClient() {
        if (!this.openai) {
            const integration = await Integration.findOne({ where: { provider: 'openai', isActive: true } });
            let apiKey = process.env.OPENAI_API_KEY;

            if (integration?.config?.apiKey) {
                try {
                    const { decrypt } = require('../utils/encryption');
                    apiKey = decrypt(integration.config.apiKey);
                } catch {
                    // Fallback: key may be unencrypted legacy data
                    apiKey = integration.config.apiKey;
                }
            }

            if (apiKey) {
                this.openai = new OpenAI({ apiKey });
            }
        }
        return this.openai;
    }

    async generateEmail(prompt: string, context: any): Promise<string> {
        try {
            const client = await this.getClient();
            if (!client) {
                return "Simulation: OpenAI Key missing. Please configure it in Settings.";
            }

            const completion = await client.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a professional sales assistant writing emails for High Point CRM." },
                    { role: "user", content: `Write a professional email based on this context: ${JSON.stringify(context)}. User prompt: ${prompt}` }
                ],
                model: "gpt-4o", // Upgraded to 4o
            });

            return completion.choices[0].message.content || 'No content generated';
        } catch (error) {
            console.error('OpenAI Error:', error);
            throw new Error('Failed to generate email');
        }
    }
}

export default new AIService();
