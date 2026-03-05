import Deal from './model/dealModel';
import { DealActivity } from '../activity-logs/model/dealActivities';
import User from '../user/userModel';
import Task from '../tasks/taskModel';
import Comment from '../comments/commentModel';
import Attachment from '../attachments/attachmentModel';
import DealDelivery from './model/dealDeliveryModel';
import Invoice from './model/invoiceMode';
import { Op } from 'sequelize';

class DealRoomService {
  async getDealRoom(dealId: string): Promise<unknown> {
    const deal = await Deal.findByPk(dealId, {
      include: [{ model: User, as: 'users' }]
    });
    if (!deal) throw new Error('Deal not found');

    // Get activities for timeline
    const activities = await DealActivity.findAll({
      where: { dealId },
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profilePicture'] }]
    });

    // Get tasks related to deal
    const tasks = await Task.findAll({
      where: {
        entityType: 'deal',
        entityId: dealId
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get comments
    const comments = await Comment.findAll({
      where: {
        entityType: 'deal',
        entityId: dealId
      },
      order: [['createdAt', 'DESC']],
      limit: 20,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profilePicture'] }]
    });

    // Get attachments
    const attachments = await Attachment.findAll({
      where: {
        entityType: 'deal',
        entityId: dealId
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Calculate health score
    const now = new Date();
    const dealAge = Math.floor((now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const lastActivity = activities[0]?.createdAt ? new Date(activities[0].createdAt) : null;
    const daysSinceActivity = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    const completedTasks = tasks.filter((t: unknown) => t.status === 'completed').length;
    const totalTasks = tasks.length;

    // Health: activity recency (30) + stage age (25) + engagement (25) + tasks (20)
    let healthScore = 0;

    // Activity recency (0-30)
    if (daysSinceActivity <= 2) healthScore += 30;
    else if (daysSinceActivity <= 7) healthScore += 20;
    else if (daysSinceActivity <= 14) healthScore += 10;

    // Stage age vs 30-day average (0-25)
    if (dealAge <= 15) healthScore += 25;
    else if (dealAge <= 30) healthScore += 20;
    else if (dealAge <= 60) healthScore += 10;

    // Engagement - activities count (0-25)
    if (activities.length >= 10) healthScore += 25;
    else if (activities.length >= 5) healthScore += 15;
    else if (activities.length >= 1) healthScore += 5;

    // Task completion (0-20)
    if (totalTasks > 0) {
      healthScore += Math.round((completedTasks / totalTasks) * 20);
    }

    // Timeline data
    const timeline = activities.map((a: unknown) => ({
      id: a.id,
      type: getActivityType(a.description || a.descripion),
      description: a.description || a.descripion,
      date: a.createdAt,
      user: a.user
    }));

    // Stakeholder map
    const sellerSide = (deal as any).users || [];

    return {
      deal: {
        id: deal.id,
        name: deal.name,
        stage: deal.stage,
        price: deal.price,
        createdAt: deal.createdAt,
        age: dealAge
      },
      healthScore,
      timeline,
      stakeholders: {
        sellers: sellerSide.map((u: unknown) => ({
          id: u.id,
          name: u.name,
          profilePicture: u.profilePicture,
          role: 'Sales Rep'
        }))
      },
      tasks: tasks.map((t: unknown) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate
      })),
      comments: comments.length,
      attachments: attachments.length,
      stats: {
        totalActivities: activities.length,
        daysSinceActivity,
        completedTasks,
        totalTasks
      }
    };
  }
}

function getActivityType(desc: string): string {
  if (!desc) return 'update';
  const lower = desc.toLowerCase();
  if (lower.includes('created') || lower.includes('new')) return 'create';
  if (lower.includes('email') || lower.includes('sent')) return 'email';
  if (lower.includes('call') || lower.includes('phone')) return 'call';
  if (lower.includes('meeting') || lower.includes('met')) return 'meeting';
  if (lower.includes('stage') || lower.includes('moved')) return 'stage';
  if (lower.includes('note') || lower.includes('comment')) return 'note';
  return 'update';
}

export default new DealRoomService();
