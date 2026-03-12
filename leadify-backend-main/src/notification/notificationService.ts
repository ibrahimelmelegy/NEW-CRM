import Client from '../client/clientModel';
import Deal from '../deal/model/dealModel';
import { SortEnum } from '../lead/leadEnum';
import Opportunity from '../opportunity/opportunityModel';
import Project from '../project/models/projectModel';
import Proposal from '../proposal/models/proposalModel';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { NotificationReadEnums, NotificationTypeEnums } from './notificationEnum';
import Notification from './notificationModel';
import { io } from '../server';

class NotificationService {
  async getNotifications(input: Record<string, unknown>, user: User): Promise<unknown> {
    const page = input.page || 1;
    const limit = input.limit || 10;
    const offset = (page - 1) * limit;
    const { rows: notifications, count: totalItems } = await Notification.findAndCountAll({
      where: { userId: user?.id },
      limit,
      offset,
      order: [['createdAt', SortEnum.DESC]]
    });
    const unreadNotificationsCount = await Notification.count({
      where: { userId: user?.id, read: NotificationReadEnums.UN_READ }
    });

    return {
      unreadNotificationsCount,
      docs: notifications,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async updateNotificationsToRead(user: User): Promise<unknown> {
    await Notification.update(
      { read: NotificationReadEnums.READ },
      {
        where: { userId: user.id, read: NotificationReadEnums.UN_READ }
      }
    );
    try {
      io.emit('notification:read', { userId: user.id, readAll: true });
    } catch {}
  }

  async updateNotificationToClicked(id: string, user: User): Promise<unknown> {
    const notification = await Notification.findOne({
      where: { userId: user.id, id }
    });
    if (!notification) throw new BaseError(ERRORS.NOTIFICATION_NOT_FOUND);
    notification.read = NotificationReadEnums.CLICKED;
    await notification.save();
  }

  async sendAssignLeadNotification(input: Record<string, unknown>): Promise<unknown> {
    const notification = await Notification.create({
      ...input,
      body_en: 'New Lead assigned to you.',
      body_ar: 'New Lead assigned to you.',
      type: NotificationTypeEnums.LEAD_ASSIGNED
    });
    try {
      io.emit('lead:assigned', { leadId: input.target, assignedTo: input.userId });
    } catch {}
    try {
      io.emit('notification:new', { userId: input.userId, notification: { id: notification.id, type: NotificationTypeEnums.LEAD_ASSIGNED } });
    } catch {}
  }

  async sendAssignOpportunityNotification(input: Record<string, unknown>, opportunity: Opportunity, admin: User): Promise<unknown> {
    await Notification.create({
      ...input,
      body_en: `The Opportunity ${opportunity.name} at stage ${opportunity.stage}. Assigned by ${admin.name}.`,
      body_ar: `The Opportunity ${opportunity.name} at stage ${opportunity.stage}. Assigned by ${admin.name}.`,
      type: NotificationTypeEnums.OPPORTUNITY_ASSIGNED
    });
  }

  async sendProposalAssignUsersNotification(proposal: Proposal, users: number[]): Promise<unknown> {
    for (const user of users) {
      await Notification.create({
        userId: user,
        target: proposal.id,
        body_en: `Proposal ${proposal.title} assigned to you.`,
        body_ar: `Proposal ${proposal.title} assigned to you.`,
        type: NotificationTypeEnums.PROPOSAL_ASSIGNED
      });
    }
  }

  async sendApproveProposalNotification(proposal: Proposal): Promise<unknown> {
    for (const user of proposal.users) {
      await Notification.create({
        userId: user.id,
        target: proposal.id,
        body_en: `Proposal ${proposal.title} has been approved.`,
        body_ar: `Proposal ${proposal.title} has been approved.`,
        type: NotificationTypeEnums.PROPOSAL_APPROVED
      });
    }
  }

  async sendRejectProposalNotification(proposal: Proposal): Promise<unknown> {
    for (const user of proposal.users) {
      await Notification.create({
        userId: user.id,
        target: proposal.id,
        body_en: `Proposal ${proposal.title} has been rejected.`,
        body_ar: `Proposal ${proposal.title} has been rejected.`,
        type: NotificationTypeEnums.PROPOSAL_REJECTED
      });
    }
  }

  async sendAssignDealNotification(input: Record<string, unknown>, deal: Deal, admin: User): Promise<unknown> {
    const companyName = deal.companyName;
    const dealInfo = companyName ? `The Deal ${deal.name} for ${companyName} at stage ${deal.stage}` : `The Deal ${deal.name} at stage ${deal.stage}`;

    const message = `${dealInfo}. Assigned by ${admin.name}.`;

    await Notification.create({
      ...input,
      body_en: message,
      body_ar: message,
      type: NotificationTypeEnums.DEAL_ASSIGNED
    });
  }

  async sendAssignProjectNotification(input: Record<string, unknown>, project: Project, admin: User): Promise<unknown> {
    const category = project.category || 'Project';
    const clientName = project.client?.clientName || 'Unknown Client';
    const message = `The ${category} ${project.name} for Client ${clientName}. Assigned by ${admin.name}.`;

    await Notification.create({
      ...input,
      body_en: message,
      body_ar: message, // You can localize this to Arabic if needed
      type: NotificationTypeEnums.PROJECT_ASSIGNED
    });
  }

  async sendAssignClientNotification(input: Record<string, unknown>, client: Client, admin: User): Promise<unknown> {
    const clientType = client.clientType || 'Client';
    const clientName = client.clientName;
    const companyName = client.companyName;

    const message = companyName
      ? `The ${clientType} ${clientName} represents ${companyName}. Assigned by ${admin.name}.`
      : `The ${clientType} ${clientName}. Assigned by ${admin.name}.`;

    await Notification.create({
      ...input,
      body_en: message,
      body_ar: message, // Replace with Arabic translation if needed
      type: NotificationTypeEnums.CLIENT_ASSIGNED
    });
  }

  // Generic Notification Creator for System Events
  async createNotification(userId: number, title: string, body: string, metadata: Record<string, unknown> = {}): Promise<unknown> {
    return await Notification.create({
      userId,
      title: title, // Make sure Model has title or use body
      body_en: body,
      body_ar: body,
      type: 'SYSTEM_ALERT', // Need to make sure this fits enum or use generic
      ...metadata
    });
  }
}

export default new NotificationService();
