import Playbook from './playbookModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

class PlaybookService {
  async getPlaybooks(tenantId?: string): Promise<Playbook[]> {
    await this.seedDefaults(tenantId);
    return Playbook.findAll({ where: tenantId ? { tenantId } : {}, order: [['createdAt', 'ASC']] });
  }

  async getPlaybookById(id: string): Promise<Playbook> {
    const pb = await Playbook.findByPk(id);
    if (!pb) throw new BaseError(ERRORS.NOT_FOUND);
    return pb;
  }

  async createPlaybook(data: any, tenantId?: string): Promise<Playbook> {
    return Playbook.create({ ...data, tenantId });
  }

  async updatePlaybook(id: string, data: any): Promise<Playbook> {
    const pb = await Playbook.findByPk(id);
    if (!pb) throw new BaseError(ERRORS.NOT_FOUND);
    await pb.update(data);
    return pb;
  }

  async deletePlaybook(id: string): Promise<void> {
    const pb = await Playbook.findByPk(id);
    if (!pb) throw new BaseError(ERRORS.NOT_FOUND);
    await pb.destroy();
  }

  private async seedDefaults(tenantId?: string): Promise<void> {
    const count = await Playbook.count({ where: tenantId ? { tenantId } : {} });
    if (count > 0) return;

    await Playbook.create({
      name: 'Standard Sales Playbook',
      description: 'A comprehensive step-by-step guide for the sales process',
      tenantId,
      stages: [
        {
          id: uuidv4(),
          name: 'Prospecting',
          description: 'Identify and research potential customers',
          order: 1,
          steps: [
            {
              id: uuidv4(),
              title: 'Research company background',
              description: 'Use LinkedIn, company website, and news to understand the prospect',
              estimatedMinutes: 20
            },
            { id: uuidv4(), title: 'Identify decision makers', description: 'Find key stakeholders and their roles', estimatedMinutes: 15 },
            { id: uuidv4(), title: 'Prepare outreach message', description: 'Craft a personalized intro message', estimatedMinutes: 10 },
            { id: uuidv4(), title: 'Send initial outreach', description: 'Email or call the prospect', estimatedMinutes: 5 }
          ],
          tips: ['Focus on value, not features', 'Personalize every outreach']
        },
        {
          id: uuidv4(),
          name: 'Qualification',
          description: 'Determine if the prospect is a good fit',
          order: 2,
          steps: [
            {
              id: uuidv4(),
              title: 'Conduct discovery call',
              description: 'Ask BANT questions (Budget, Authority, Need, Timeline)',
              estimatedMinutes: 30
            },
            { id: uuidv4(), title: 'Assess budget alignment', description: 'Ensure pricing matches prospect budget range', estimatedMinutes: 10 },
            { id: uuidv4(), title: 'Identify pain points', description: 'Document specific challenges the prospect faces', estimatedMinutes: 15 },
            { id: uuidv4(), title: 'Document qualification notes', description: 'Record findings in CRM', estimatedMinutes: 10 }
          ],
          tips: ['Listen more than you talk', 'Ask open-ended questions']
        },
        {
          id: uuidv4(),
          name: 'Proposal',
          description: 'Present your solution and value proposition',
          order: 3,
          steps: [
            { id: uuidv4(), title: 'Build custom proposal', description: 'Tailor the proposal to prospect needs', estimatedMinutes: 60 },
            { id: uuidv4(), title: 'Internal review', description: 'Have manager review proposal before sending', estimatedMinutes: 15 },
            { id: uuidv4(), title: 'Present proposal', description: 'Walk the prospect through the proposal live', estimatedMinutes: 45 },
            { id: uuidv4(), title: 'Handle objections', description: 'Address concerns and questions', estimatedMinutes: 20 }
          ],
          tips: ['Focus on ROI and outcomes', 'Use case studies from similar companies']
        },
        {
          id: uuidv4(),
          name: 'Negotiation',
          description: 'Work through terms and pricing',
          order: 4,
          steps: [
            { id: uuidv4(), title: 'Gather feedback', description: 'Understand what the prospect likes and wants changed', estimatedMinutes: 15 },
            { id: uuidv4(), title: 'Prepare negotiation strategy', description: 'Define your BATNA and acceptable ranges', estimatedMinutes: 20 },
            { id: uuidv4(), title: 'Negotiate terms', description: 'Work through pricing, timeline, and scope', estimatedMinutes: 30 },
            { id: uuidv4(), title: 'Send revised proposal', description: 'Update and resend based on negotiations', estimatedMinutes: 20 }
          ],
          tips: ['Never negotiate against yourself', 'Focus on value, not price']
        },
        {
          id: uuidv4(),
          name: 'Closing',
          description: 'Finalize the deal and onboard',
          order: 5,
          steps: [
            { id: uuidv4(), title: 'Send contract', description: 'Prepare and send final contract for signature', estimatedMinutes: 15 },
            { id: uuidv4(), title: 'Follow up on signature', description: 'Check in if contract not signed within 48h', estimatedMinutes: 5 },
            { id: uuidv4(), title: 'Confirm deal closed', description: 'Update CRM status and notify team', estimatedMinutes: 5 },
            { id: uuidv4(), title: 'Begin onboarding', description: 'Hand off to customer success team', estimatedMinutes: 30 }
          ],
          tips: ['Create urgency without pressure', 'Celebrate the win with your team']
        }
      ]
    });
  }
}

export default new PlaybookService();
