import { Op, fn, col } from 'sequelize';
import Lead from '../lead/leadModel';
import Deal from '../deal/model/dealModel';
import Client from '../client/clientModel';
import Invoice from '../deal/model/invoiceMode';
import Opportunity from '../opportunity/opportunityModel';
import { DealActivity } from '../activity-logs/model/dealActivities';
import logger from '../config/logger';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  answer: string;
  context?: string;
  data?: any;
}

const CRM_SYSTEM_PROMPT = `You are a CRM data assistant for High Point CRM. You help users query and understand their CRM data.

Available CRM modules and their fields:
- Leads: id, name, companyName, email, phone, leadSource (REFERRAL/WEBSITE/EVENT/EMAIL/PHONE/SOCIAL_MEDIA/OTHER), status (NEW/CONTACTED/QUALIFIED/DISQUALIFIED/CONVERTED/LOST), score, lastContactDate, notes, createdAt
- Deals: id, name, companyName, price, contractType (Contract/PurchaseOrder), stage (PROGRESS/CANCELLED/CLOSED/CONVERTED), signatureDate, leadId, clientId, createdAt
- Clients: id, clientName, email, phoneNumber, companyName, clientType, industry, clientStatus (ACTIVE/INACTIVE), city, createdAt
- Opportunities: id, name, stage (DISCOVERY/PROPOSAL/NEGOTIATION/WON/LOST/CONVERTED), estimatedValue, expectedCloseDate, priority (VERY_HIGH/HIGH/MEDIUM/LOW/VERY_LOW), profit, leadId, clientId, createdAt
- Invoices: id, invoiceNumber, amount, invoiceDate, collected (boolean), collectedDate, dealId
- Deal Activities: id, description, status (create/update/assign/export/delete/approve/reject/archive), dealId, userId, createdAt

When the user asks a question, respond with a JSON object containing:
1. "intent": one of "count", "list", "sum", "average", "top", "recent", "status", "compare", "general"
2. "module": one of "leads", "deals", "clients", "opportunities", "invoices", "activities"
3. "filters": object with field names and values to filter by
4. "sort": { "field": string, "order": "ASC" | "DESC" } (optional)
5. "limit": number (optional, default 10)
6. "aggregation": "count" | "sum" | "avg" | "min" | "max" (optional)
7. "aggregationField": string (optional, field to aggregate)
8. "timeRange": { "field": string, "from": "ISO date", "to": "ISO date" } (optional)

IMPORTANT: Only respond with the JSON object. Do not include any other text.
If the question cannot be answered from CRM data, respond with: {"intent": "general", "module": "none", "answer": "your helpful response here"}`;

class AIChatService {
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  async askCRM(question: string, userId: number, tenantId?: string): Promise<ChatResponse> {
    const sessionKey = `${userId}_${tenantId || 'default'}`;

    // Get or create conversation history
    if (!this.conversationHistory.has(sessionKey)) {
      this.conversationHistory.set(sessionKey, []);
    }

    const history = this.conversationHistory.get(sessionKey)!;

    try {
      // Step 1: Use GPT to analyze the question and determine the query
      const queryPlan = await this.analyzeQuestion(question, history);

      if (!queryPlan) {
        return {
          answer: 'I could not understand your question. Try asking about leads, deals, clients, invoices, or opportunities.'
        };
      }

      // If it's a general question, return GPT's answer directly
      if (queryPlan.intent === 'general') {
        const answer = queryPlan.answer || 'I can help you with CRM data questions about leads, deals, clients, invoices, and opportunities.';
        this.addToHistory(history, question, answer);
        return { answer };
      }

      // Step 2: Execute the CRM query based on the plan
      const queryResult = await this.executeQuery(queryPlan);

      // Step 3: Generate a natural language response from the data
      const answer = await this.generateResponse(question, queryPlan, queryResult);

      this.addToHistory(history, question, answer);

      return {
        answer,
        data: queryResult
      };
    } catch (error) {
      logger.error({ error }, 'AIChatService error');
      // Fallback: try basic keyword matching
      try {
        const fallbackResult = await this.fallbackQuery(question);
        if (fallbackResult) {
          this.addToHistory(history, question, fallbackResult.answer);
          return fallbackResult;
        }
      } catch {
        // ignore fallback errors
      }
      return {
        answer:
          'I encountered an issue processing your question. Please try rephrasing it, or ask about specific metrics like deal counts, pipeline value, or lead status.'
      };
    }
  }

  clearHistory(userId: number, tenantId?: string): void {
    const sessionKey = `${userId}_${tenantId || 'default'}`;
    this.conversationHistory.delete(sessionKey);
  }

  private addToHistory(history: ChatMessage[], question: string, answer: string): void {
    history.push({ role: 'user', content: question });
    history.push({ role: 'assistant', content: answer });

    // Keep only last 10 exchanges (20 messages)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  private async analyzeQuestion(question: string, history: ChatMessage[]): Promise<any> {
    try {
      const client = await this.getOpenAIClient();
      if (!client) {
        return this.analyzeQuestionFallback(question);
      }

      const messages: Record<string, any>[] = [
        { role: 'system', content: CRM_SYSTEM_PROMPT },
        ...history.slice(-6), // Include last 3 exchanges for context
        { role: 'user', content: question }
      ];

      const completion = await client.chat.completions.create({
        messages,
        model: 'gpt-4o',
        temperature: 0.1,
        max_tokens: 500
      });

      const response = completion.choices[0].message.content?.trim();
      if (!response) return null;

      try {
        // Clean response: strip markdown code fences if present
        let cleaned = response;
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        return JSON.parse(cleaned);
      } catch {
        return { intent: 'general', module: 'none', answer: response };
      }
    } catch (error) {
      logger.error({ error }, 'OpenAI analysis error');
      return this.analyzeQuestionFallback(question);
    }
  }

  private analyzeQuestionFallback(question: string): unknown {
    const q = question.toLowerCase();

    // Simple keyword-based intent detection
    if (q.includes('how many') || q.includes('count') || q.includes('total number')) {
      if (q.includes('deal')) return { intent: 'count', module: 'deals', filters: {} };
      if (q.includes('lead')) return { intent: 'count', module: 'leads', filters: {} };
      if (q.includes('client')) return { intent: 'count', module: 'clients', filters: {} };
      if (q.includes('invoice')) return { intent: 'count', module: 'invoices', filters: {} };
      if (q.includes('opportunit')) return { intent: 'count', module: 'opportunities', filters: {} };
    }

    if (q.includes('pipeline') || q.includes('total value') || q.includes('revenue')) {
      return { intent: 'sum', module: 'deals', filters: { stage: 'PROGRESS' }, aggregation: 'sum', aggregationField: 'price' };
    }

    if (q.includes('closed') && q.includes('deal')) {
      const timeRange = this.extractTimeRange(q);
      return { intent: 'count', module: 'deals', filters: { stage: 'CLOSED' }, timeRange };
    }

    if (q.includes('overdue') && q.includes('invoice')) {
      return { intent: 'list', module: 'invoices', filters: { collected: false, overdue: true } };
    }

    if (q.includes('top') && q.includes('client')) {
      return { intent: 'top', module: 'deals', filters: {}, sort: { field: 'price', order: 'DESC' }, limit: 5 };
    }

    if (q.includes('new') && q.includes('lead')) {
      const timeRange = this.extractTimeRange(q);
      return { intent: 'count', module: 'leads', filters: { status: 'NEW' }, timeRange };
    }

    if (q.includes('convert')) {
      return { intent: 'count', module: 'leads', filters: { status: 'CONVERTED' } };
    }

    return {
      intent: 'general',
      module: 'none',
      answer:
        'I can help with questions about your leads, deals, clients, invoices, and opportunities. Try asking "How many deals closed this month?" or "What is the total pipeline value?"'
    };
  }

  private extractTimeRange(q: string): unknown | undefined {
    const now = new Date();
    if (q.includes('this month')) {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { field: 'createdAt', from: start.toISOString(), to: now.toISOString() };
    }
    if (q.includes('this week')) {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return { field: 'createdAt', from: start.toISOString(), to: now.toISOString() };
    }
    if (q.includes('today')) {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { field: 'createdAt', from: start.toISOString(), to: now.toISOString() };
    }
    if (q.includes('last month')) {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { field: 'createdAt', from: start.toISOString(), to: end.toISOString() };
    }
    return undefined;
  }

  private async executeQuery(plan: any): Promise<any> {
    const modelMap: Record<string, any> = {
      leads: Lead,
      deals: Deal,
      clients: Client,
      invoices: Invoice,
      opportunities: Opportunity,
      activities: DealActivity
    };

    const model = modelMap[plan.module];
    if (!model) return null;

    const where: Record<string, any> = {};

    // Apply filters
    if (plan.filters) {
      for (const [key, value] of Object.entries(plan.filters)) {
        if (key === 'overdue' && value === true) {
          // Special handling for overdue invoices
          where.collected = false;
          where.invoiceDate = { [Op.lt]: new Date() };
          continue;
        }
        if (value !== undefined && value !== null && value !== '') {
          where[key] = value;
        }
      }
    }

    // Apply time range
    if (plan.timeRange) {
      const { field, from, to } = plan.timeRange;
      const dateField = field || 'createdAt';
      where[dateField] = {};
      if (from) where[dateField][Op.gte] = new Date(from);
      if (to) where[dateField][Op.lte] = new Date(to);
    }

    const queryOptions: Record<string, any> = { where };

    // Execute based on intent
    switch (plan.intent) {
      case 'count':
        return { count: await model.count(queryOptions) };

      case 'sum':
      case 'average': {
        const aggField = plan.aggregationField || 'price';
        const aggFn = plan.intent === 'sum' ? fn('SUM', col(aggField)) : fn('AVG', col(aggField));
        const result = await model.findOne({
          where,
          attributes: [[aggFn, 'result']],
          raw: true
        });
        return {
          [plan.intent]: result?.result || 0,
          field: aggField
        };
      }

      case 'list':
      case 'recent': {
        const limit = plan.limit || 10;
        const order = plan.sort ? [[plan.sort.field, plan.sort.order]] : [['createdAt', 'DESC']];
        const items = await model.findAll({ where, order, limit, raw: true });
        return { items, total: items.length };
      }

      case 'top': {
        const limit = plan.limit || 5;
        const order = plan.sort ? [[plan.sort.field, plan.sort.order]] : [['createdAt', 'DESC']];

        if (plan.module === 'deals') {
          // Top clients by deal value
          const items = await Deal.findAll({
            where,
            include: [{ model: Client, as: 'client', attributes: ['clientName', 'companyName'] }],
            order: order as any,
            limit
          });
          return { items: items.map(i => i.toJSON()), total: items.length };
        }

        const items = await model.findAll({ where, order, limit, raw: true });
        return { items, total: items.length };
      }

      case 'status': {
        // Group by status/stage
        const groupField = plan.module === 'deals' ? 'stage' : plan.module === 'leads' ? 'status' : 'stage';
        const results = await model.findAll({
          where,
          attributes: [groupField, [fn('COUNT', col('id')), 'count']],
          group: [groupField],
          raw: true
        });
        return { breakdown: results };
      }

      default: {
        const items = await model.findAll({ where, limit: 10, raw: true });
        return { items, total: items.length };
      }
    }
  }

  private async generateResponse(question: string, plan: any, data: any): Promise<string> {
    try {
      const client = await this.getOpenAIClient();
      if (!client) {
        return this.formatResponseFallback(plan, data);
      }

      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              "You are a helpful CRM assistant. Given the user's question and query results, provide a concise, clear natural language answer. Use numbers, bullet points for lists, and be specific. Do not mention JSON or technical details. Keep responses under 200 words."
          },
          {
            role: 'user',
            content: `Question: "${question}"\n\nQuery Type: ${plan.intent}\nModule: ${plan.module}\nResults: ${JSON.stringify(data)}`
          }
        ],
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 400
      });

      return completion.choices[0].message.content || this.formatResponseFallback(plan, data);
    } catch {
      return this.formatResponseFallback(plan, data);
    }
  }

  private formatResponseFallback(plan: any, data: any): string {
    if (!data) return 'No data found for your query.';

    switch (plan.intent) {
      case 'count':
        return `There are **${data.count}** ${plan.module}${plan.filters?.stage ? ` with stage "${plan.filters.stage}"` : ''}${plan.filters?.status ? ` with status "${plan.filters.status}"` : ''}.`;

      case 'sum':
        return `The total ${data.field} for ${plan.module} is **$${Number(data.sum).toLocaleString()}**.`;

      case 'average':
        return `The average ${data.field} for ${plan.module} is **$${Number(data.average).toLocaleString()}**.`;

      case 'list':
      case 'recent':
      case 'top':
        if (data.items?.length > 0) {
          const names = data.items
            .slice(0, 5)
            .map(
              (item: any) =>
                `- ${item.name || item.clientName || item.invoiceNumber || 'Item'}${item.price ? ` ($${item.price.toLocaleString()})` : ''}${item.amount ? ` ($${item.amount.toLocaleString()})` : ''}`
            )
            .join('\n');
          return `Found **${data.total}** results:\n${names}`;
        }
        return `No ${plan.module} found matching your criteria.`;

      case 'status':
        if (data.breakdown?.length > 0) {
          const lines = data.breakdown
            .map((item: any) => {
              const key = Object.keys(item).find(k => k !== 'count') || 'status';
              return `- **${item[key]}**: ${item.count}`;
            })
            .join('\n');
          return `${plan.module} breakdown:\n${lines}`;
        }
        return `No status data available for ${plan.module}.`;

      default:
        return `Query completed. Found ${data.total || data.count || 0} results.`;
    }
  }

  private async fallbackQuery(question: string): Promise<ChatResponse | null> {
    const q = question.toLowerCase();

    if (q.includes('deal') && (q.includes('how many') || q.includes('count'))) {
      const count = await Deal.count();
      return { answer: `There are currently **${count}** deals in the system.` };
    }

    if (q.includes('lead') && (q.includes('how many') || q.includes('count'))) {
      const count = await Lead.count();
      return { answer: `There are currently **${count}** leads in the system.` };
    }

    if (q.includes('pipeline') || (q.includes('deal') && q.includes('value'))) {
      const result = await Deal.findOne({
        where: { stage: 'PROGRESS' },
        attributes: [[fn('SUM', col('price')), 'total']],
        raw: true
      });
      const total = (result as any)?.total || 0;
      return { answer: `The current pipeline value (deals in progress) is **$${Number(total).toLocaleString()}**.` };
    }

    if (q.includes('client') && (q.includes('how many') || q.includes('count'))) {
      const count = await Client.count();
      return { answer: `There are currently **${count}** clients in the system.` };
    }

    return null;
  }

  private async getOpenAIClient(): Promise<any> {
    // Access the private openai client through the aiService singleton
    // We mirror the getClient pattern
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const OpenAI = require('openai').default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Integration = require('../integration/integrationModel').default;

    const integration = await Integration.findOne({ where: { provider: 'openai', isActive: true } });
    let apiKey = process.env.OPENAI_API_KEY;

    if (integration?.config?.apiKey) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { decrypt } = require('../utils/encryption');
        apiKey = decrypt(integration.config.apiKey);
      } catch {
        apiKey = integration.config.apiKey;
      }
    }

    if (apiKey) {
      return new OpenAI({ apiKey });
    }
    return null;
  }
}

export default new AIChatService();
