import OpenAI from 'openai';
import Integration from '../integration/integrationModel';

class SummarizerService {
    private openai: OpenAI | null = null;

    private async getClient() {
        if (!this.openai) {
            const integration = await Integration.findOne({ where: { provider: 'openai', isActive: true } });
            const apiKey = integration?.config?.apiKey || process.env.OPENAI_API_KEY;

            if (apiKey) {
                this.openai = new OpenAI({ apiKey });
            }
        }
        return this.openai;
    }

    async summarizeMeeting(text: string) {
        const client = await this.getClient();
        if (!client) {
            throw new Error("OpenAI Key missing. Please configure it in Settings.");
        }

        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a professional meeting assistant. Summarize the following meeting notes into a structured JSON format with: 'summary', 'actionItems' (array), and 'decisions' (array)."
                },
                {
                    role: "user",
                    content: text
                }
            ],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content || '{}');
    }
}

export default new SummarizerService();
