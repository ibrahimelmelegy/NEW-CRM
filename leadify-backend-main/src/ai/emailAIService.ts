import OpenAI from 'openai';
import Integration from '../integration/integrationModel';

interface EmailContext {
  to?: string;
  toCompany?: string;
  purpose?: 'follow-up' | 'introduction' | 'proposal' | 'thank-you' | 'meeting-request' | 'custom';
  tone?: 'professional' | 'friendly' | 'formal' | 'casual';
  dealInfo?: {
    name?: string;
    price?: number;
    stage?: string;
  };
  clientInfo?: {
    name?: string;
    company?: string;
    industry?: string;
  };
  customInstructions?: string;
  senderName?: string;
  senderCompany?: string;
}

interface EmailReplyContext {
  thread: string;
  purpose?: string;
  tone?: string;
  dealInfo?: any;
  clientInfo?: any;
  senderName?: string;
}

interface EmailImproveRequest {
  draft: string;
  instruction: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

const PURPOSE_PROMPTS: Record<string, string> = {
  'follow-up': 'Write a follow-up email to continue the conversation and move the relationship forward.',
  introduction: 'Write an introduction email to establish a new business relationship.',
  proposal: 'Write an email presenting a business proposal or offer.',
  'thank-you': "Write a thank-you email expressing gratitude for the recipient's time or business.",
  'meeting-request': 'Write an email requesting a meeting to discuss business opportunities.',
  custom: 'Write an email based on the provided instructions.'
};

const TONE_DESCRIPTIONS: Record<string, string> = {
  professional: 'Use a professional, business-appropriate tone.',
  friendly: 'Use a warm, friendly but still professional tone.',
  formal: 'Use a very formal, corporate tone with proper salutations.',
  casual: 'Use a casual, conversational but respectful tone.'
};

class EmailAIService {
  private openai: OpenAI | null = null;

  private async getClient(): Promise<OpenAI | null> {
    if (!this.openai) {
      const integration = await Integration.findOne({ where: { provider: 'openai', isActive: true } });
      let apiKey = process.env.OPENAI_API_KEY;

      if (integration?.config?.apiKey) {
        try {
          const { decrypt } = require('../utils/encryption');
          apiKey = decrypt(integration.config.apiKey);
        } catch {
          apiKey = integration.config.apiKey;
        }
      }

      if (apiKey) {
        this.openai = new OpenAI({ apiKey });
      }
    }
    return this.openai;
  }

  async generateEmail(context: EmailContext): Promise<GeneratedEmail> {
    const client = await this.getClient();

    const purpose = context.purpose || 'follow-up';
    const tone = context.tone || 'professional';
    const purposePrompt = PURPOSE_PROMPTS[purpose] || PURPOSE_PROMPTS['custom'];
    const toneDesc = TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS['professional'];

    let contextDetails = '';
    if (context.to) contextDetails += `\nRecipient: ${context.to}`;
    if (context.toCompany) contextDetails += `\nRecipient's Company: ${context.toCompany}`;
    if (context.dealInfo) {
      contextDetails += `\nDeal: ${context.dealInfo.name || 'N/A'}`;
      if (context.dealInfo.price) contextDetails += `, Value: $${context.dealInfo.price.toLocaleString()}`;
      if (context.dealInfo.stage) contextDetails += `, Stage: ${context.dealInfo.stage}`;
    }
    if (context.clientInfo) {
      contextDetails += `\nClient: ${context.clientInfo.name || 'N/A'}`;
      if (context.clientInfo.company) contextDetails += `, Company: ${context.clientInfo.company}`;
      if (context.clientInfo.industry) contextDetails += `, Industry: ${context.clientInfo.industry}`;
    }
    if (context.customInstructions) contextDetails += `\nAdditional Instructions: ${context.customInstructions}`;
    if (context.senderName) contextDetails += `\nSender Name: ${context.senderName}`;
    if (context.senderCompany) contextDetails += `\nSender Company: ${context.senderCompany}`;

    const prompt = `${purposePrompt}\n${toneDesc}\n\nContext:${contextDetails}\n\nRespond with a JSON object with "subject" and "body" fields. The body should be the full email text (not including the subject). Do not include any markdown formatting in the email body.`;

    if (!client) {
      return this.generateEmailFallback(context);
    }

    try {
      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a professional email writing assistant for a CRM platform. Generate polished, effective business emails. Always respond with valid JSON containing "subject" and "body" fields.'
          },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-4o',
        temperature: 0.6,
        max_tokens: 800
      });

      const response = completion.choices[0].message.content?.trim();
      if (!response) return this.generateEmailFallback(context);

      try {
        let cleaned = response;
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        return {
          subject: parsed.subject || 'Follow Up',
          body: parsed.body || ''
        };
      } catch {
        // If JSON parsing fails, treat entire response as the body
        return {
          subject: `${purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('-', ' ')}`,
          body: response
        };
      }
    } catch (error) {
      console.error('Email generation error:', error);
      return this.generateEmailFallback(context);
    }
  }

  async suggestReply(emailThread: string, context?: EmailReplyContext): Promise<GeneratedEmail> {
    const client = await this.getClient();

    if (!client) {
      return {
        subject: 'Re: Your Message',
        body: 'Thank you for your email. I appreciate you reaching out and would like to follow up on the points you raised. Let me review the details and get back to you shortly.\n\nBest regards'
      };
    }

    let additionalContext = '';
    if (context?.dealInfo) {
      additionalContext += `\nRelated Deal: ${context.dealInfo.name || 'N/A'}`;
      if (context.dealInfo.price) additionalContext += ` (Value: $${context.dealInfo.price.toLocaleString()})`;
    }
    if (context?.clientInfo) {
      additionalContext += `\nClient: ${context.clientInfo.name || context.clientInfo.company || 'N/A'}`;
    }
    if (context?.senderName) {
      additionalContext += `\nReply from: ${context.senderName}`;
    }

    const tone = context?.tone || 'professional';
    const toneDesc = TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS['professional'];

    try {
      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a professional email assistant for a CRM platform. Suggest a reply to the email thread provided. ${toneDesc} Respond with valid JSON containing "subject" and "body" fields. The subject should start with "Re:".`
          },
          {
            role: 'user',
            content: `Email thread:\n${emailThread}\n${additionalContext ? `\nCRM Context:${additionalContext}` : ''}\n\nSuggest a professional reply.`
          }
        ],
        model: 'gpt-4o',
        temperature: 0.5,
        max_tokens: 600
      });

      const response = completion.choices[0].message.content?.trim();
      if (!response) {
        return { subject: 'Re: Your Message', body: 'Thank you for your email. I will review and respond shortly.' };
      }

      try {
        let cleaned = response;
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        return JSON.parse(cleaned);
      } catch {
        return { subject: 'Re: Your Message', body: response };
      }
    } catch (error) {
      console.error('Reply suggestion error:', error);
      return { subject: 'Re: Your Message', body: 'Thank you for your email. I will review and respond shortly.' };
    }
  }

  async improveEmail(draft: string, instruction: string): Promise<GeneratedEmail> {
    const client = await this.getClient();

    if (!client) {
      return { subject: '', body: draft };
    }

    try {
      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a professional email editor. Improve the given email draft based on the user\'s instruction. Respond with valid JSON containing "subject" and "body" fields. If the original has a subject line, improve it too.'
          },
          {
            role: 'user',
            content: `Original email:\n${draft}\n\nInstruction: ${instruction}\n\nPlease rewrite the email.`
          }
        ],
        model: 'gpt-4o',
        temperature: 0.5,
        max_tokens: 800
      });

      const response = completion.choices[0].message.content?.trim();
      if (!response) return { subject: '', body: draft };

      try {
        let cleaned = response;
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        return JSON.parse(cleaned);
      } catch {
        return { subject: '', body: response };
      }
    } catch (error) {
      console.error('Email improvement error:', error);
      return { subject: '', body: draft };
    }
  }

  private generateEmailFallback(context: EmailContext): GeneratedEmail {
    const recipientName = context.to || 'there';
    const senderName = context.senderName || 'the Team';
    const purpose = context.purpose || 'follow-up';

    const templates: Record<string, GeneratedEmail> = {
      'follow-up': {
        subject: `Following Up - ${context.dealInfo?.name || 'Our Conversation'}`,
        body: `Dear ${recipientName},\n\nI hope this message finds you well. I wanted to follow up on our recent conversation${context.dealInfo?.name ? ` regarding ${context.dealInfo.name}` : ''}.\n\nI believe there is a strong opportunity for us to work together, and I would love to discuss next steps at your convenience.\n\nPlease let me know a time that works for you.\n\nBest regards,\n${senderName}`
      },
      introduction: {
        subject: `Introduction - ${context.senderCompany || 'Business Opportunity'}`,
        body: `Dear ${recipientName},\n\nI hope this email finds you well. My name is ${senderName}${context.senderCompany ? ` from ${context.senderCompany}` : ''}.\n\nI am reaching out because I believe we could create significant value together${context.clientInfo?.industry ? ` in the ${context.clientInfo.industry} space` : ''}.\n\nI would welcome the opportunity to connect and explore how we might collaborate.\n\nLooking forward to hearing from you.\n\nBest regards,\n${senderName}`
      },
      proposal: {
        subject: `Proposal: ${context.dealInfo?.name || 'Partnership Opportunity'}`,
        body: `Dear ${recipientName},\n\nThank you for the opportunity to present our proposal${context.dealInfo?.name ? ` for ${context.dealInfo.name}` : ''}.\n\nBased on our discussions, I have prepared a tailored solution that addresses your key needs${context.dealInfo?.price ? ` with an investment of $${context.dealInfo.price.toLocaleString()}` : ''}.\n\nI would love to walk you through the details at your earliest convenience.\n\nBest regards,\n${senderName}`
      },
      'thank-you': {
        subject: 'Thank You',
        body: `Dear ${recipientName},\n\nI wanted to take a moment to express my sincere gratitude for your time and consideration.\n\nYour insights were very valuable, and I look forward to our continued collaboration.\n\nPlease do not hesitate to reach out if there is anything I can assist with.\n\nWarm regards,\n${senderName}`
      },
      'meeting-request': {
        subject: `Meeting Request - ${context.dealInfo?.name || 'Discussion'}`,
        body: `Dear ${recipientName},\n\nI would like to request a meeting to discuss ${context.dealInfo?.name || 'our potential collaboration'}.\n\nI am available this week and would be happy to work around your schedule. Would any of the following times work for you?\n\nPlease let me know your preference and I will send a calendar invitation.\n\nBest regards,\n${senderName}`
      },
      custom: {
        subject: 'Business Communication',
        body: `Dear ${recipientName},\n\n${context.customInstructions || 'I am writing to discuss a matter of mutual interest.'}\n\nPlease let me know your thoughts at your convenience.\n\nBest regards,\n${senderName}`
      }
    };

    return templates[purpose] || templates['follow-up'];
  }
}

export default new EmailAIService();
