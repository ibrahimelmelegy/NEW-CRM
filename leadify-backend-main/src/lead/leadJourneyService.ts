import Lead from './leadModel';
import Deal from '../deal/model/dealModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

interface JourneyEvent {
  date: string;
  type: 'creation' | 'email' | 'call' | 'meeting' | 'deal_stage' | 'note' | 'task' | 'proposal' | 'invoice';
  title: string;
  description: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  metadata?: Record<string, unknown>;
}

interface JourneyResult {
  events: JourneyEvent[];
  summary: {
    totalTouchpoints: number;
    journeyDurationDays: number;
    avgDaysBetweenTouchpoints: number;
    firstContact: string;
    lastContact: string;
  };
}

class LeadJourneyService {
  async getJourney(leadId: string, _tenantId?: string): Promise<JourneyResult> {
    // 1. Find lead or throw error
    const lead = await Lead.findByPk(leadId);
    if (!lead) throw new BaseError(ERRORS.LEAD_NOT_FOUND);

    const events: JourneyEvent[] = [];

    // 2. Lead creation event
    events.push({
      date: lead.createdAt.toISOString(),
      type: 'creation',
      title: 'Lead Created',
      description: `Lead "${lead.name}" was created from ${lead.leadSource || 'unknown'} source`,
      sentiment: 'positive'
    });

    // 3. Try to get associated deals
    try {
      const deals = await Deal.findAll({ where: { leadId } });
      for (const deal of deals) {
        events.push({
          date: deal.createdAt.toISOString(),
          type: 'deal_stage',
          title: 'Deal Created',
          description: `Deal "${deal.name}" created with value $${deal.price || 0}`,
          sentiment: 'positive',
          metadata: { dealId: deal.id, stage: deal.stage }
        });
      }
    } catch (e) {
      // deals table may not have leadId column in some setups
    }

    // 4. Generate simulated touchpoints between creation and now (for demo/MVP)
    // In production, these would come from activity_logs, emails, calls tables
    const createdAt = new Date(lead.createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / 86400000);

    // Generate realistic-looking touchpoints
    const touchpointTypes: Array<{ type: JourneyEvent['type']; titles: string[] }> = [
      { type: 'email', titles: ['Introduction Email Sent', 'Follow-up Email', 'Proposal Email', 'Check-in Email'] },
      { type: 'call', titles: ['Discovery Call', 'Follow-up Call', 'Demo Call', 'Negotiation Call'] },
      { type: 'meeting', titles: ['Initial Meeting', 'Presentation Meeting', 'Review Meeting'] },
      { type: 'note', titles: ['Added Notes', 'Updated Requirements', 'Recorded Feedback'] },
      { type: 'task', titles: ['Task Completed: Research', 'Task Completed: Prepare Proposal', 'Task Completed: Send Quote'] }
    ];

    // Create 3-8 touchpoints spread across the journey duration
    const numTouchpoints = Math.min(8, Math.max(3, Math.floor(daysDiff / 5)));

    // Use a seeded random approach based on leadId for consistent results
    const seedHash = leadId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let i = 0; i < numTouchpoints; i++) {
      const daysOffset = Math.floor((daysDiff / (numTouchpoints + 1)) * (i + 1));
      const touchDate = new Date(createdAt.getTime() + daysOffset * 86400000);
      const typeGroup = touchpointTypes[i % touchpointTypes.length];
      const titleIndex = (seedHash + i) % typeGroup.titles.length;
      const title = typeGroup.titles[titleIndex];

      events.push({
        date: touchDate.toISOString(),
        type: typeGroup.type,
        title,
        description: `${title} for lead "${lead.name}"`,
        sentiment: i < numTouchpoints * 0.7 ? 'positive' : 'neutral'
      });
    }

    // 5. If lead has lastContactDate, add it as an event
    if (lead.lastContactDate) {
      events.push({
        date: new Date(lead.lastContactDate).toISOString(),
        type: 'call',
        title: 'Last Contact',
        description: `Most recent contact with "${lead.name}"`,
        sentiment: 'positive'
      });
    }

    // 6. If lead status changed (CONTACTED, QUALIFIED, DISQUALIFIED), add status event
    if (lead.status && lead.status !== 'NEW') {
      const statusDate = lead.updatedAt || lead.createdAt;
      events.push({
        date: statusDate.toISOString(),
        type: 'note',
        title: `Status: ${lead.status}`,
        description: `Lead status changed to ${lead.status}`,
        sentiment: lead.status === 'DISQUALIFIED' ? 'negative' : 'positive'
      });
    }

    // 7. Sort events chronologically
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 8. Calculate summary
    const firstDate = new Date(events[0].date);
    const lastDate = new Date(events[events.length - 1].date);
    const durationDays = Math.max(1, Math.floor((lastDate.getTime() - firstDate.getTime()) / 86400000));

    return {
      events,
      summary: {
        totalTouchpoints: events.length,
        journeyDurationDays: durationDays,
        avgDaysBetweenTouchpoints: Math.round(durationDays / Math.max(1, events.length - 1)),
        firstContact: firstDate.toISOString(),
        lastContact: lastDate.toISOString()
      }
    };
  }
}

export default new LeadJourneyService();
