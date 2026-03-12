import { Op } from 'sequelize';
import ESignature from './eSignatureModel';
import User from '../user/userModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

interface Recipient {
  name: string;
  email: string;
  role: string;
  status: string;
  signedAt: string | null;
}

class ESignatureService {
  async create(data: Record<string, unknown>, userId: number, tenantId?: string) {
    // Initialize recipients with PENDING status
    const recipients = (data.recipients || []).map((r: any) => ({
      name: r.name,
      email: r.email,
      role: r.role || 'SIGNER',
      status: 'PENDING',
      signedAt: null
    }));

    const record = await ESignature.create({
      ...data,
      recipients,
      status: 'PENDING',
      sentAt: new Date(),
      createdBy: userId,
      tenantId
    });
    try {
      io.emit('eSignature:created', { id: record.id, title: record.title });
    } catch (_ignored: unknown) { /* non-critical */ }
    return this.getById(record.id);
  }

  async getAll(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.title = { [Op.iLike]: `%${query.search}%` };
    }

    const { rows, count } = await ESignature.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email', 'profilePicture'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: string) {
    return ESignature.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email', 'profilePicture'] }]
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    const item = await ESignature.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return this.getById(item.id);
  }

  async delete(id: string) {
    const item = await ESignature.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  /**
   * Sign the document for a specific recipient by email.
   * Updates the recipient's status to SIGNED and sets signedAt.
   * If all recipients have signed, sets the overall status to SIGNED.
   */
  async sign(id: string, email: string) {
    const item = await ESignature.findByPk(id);
    if (!item) return null;
    if (item.status === 'EXPIRED' || item.status === 'DECLINED') return null;

    const recipients: Recipient[] = item.recipients || [];
    const recipientIdx = recipients.findIndex(r => r.email.toLowerCase() === email.toLowerCase());
    if (recipientIdx === -1) return null;

    recipients[recipientIdx].status = 'SIGNED';
    recipients[recipientIdx].signedAt = new Date().toISOString();

    const allSigned = recipients.every(r => r.status === 'SIGNED');
    const newStatus = allSigned ? 'SIGNED' : 'PENDING';

    await item.update({ recipients, status: newStatus });
    try {
      io.emit('eSignature:signed', { id: item.id, title: item.title, signer: email, allSigned });
    } catch (_ignored: unknown) { /* non-critical */ }
    return this.getById(item.id);
  }

  /**
   * Decline the document for a specific recipient by email.
   * Sets overall status to DECLINED.
   */
  async decline(id: string, email: string) {
    const item = await ESignature.findByPk(id);
    if (!item) return null;

    const recipients: Recipient[] = item.recipients || [];
    const recipientIdx = recipients.findIndex(r => r.email.toLowerCase() === email.toLowerCase());
    if (recipientIdx === -1) return null;

    recipients[recipientIdx].status = 'DECLINED';

    await item.update({ recipients, status: 'DECLINED' });
    try {
      io.emit('eSignature:declined', { id: item.id, title: item.title, decliner: email });
    } catch (_ignored: unknown) { /* non-critical */ }
    return this.getById(item.id);
  }

  /**
   * Resend a reminder for a pending e-signature request.
   * In a real system this would trigger an email; here it logs the event.
   */
  async resendReminder(id: string) {
    const item = await ESignature.findByPk(id);
    if (!item) return null;
    if (item.status !== 'PENDING') return null;

    const pendingRecipients = (item.recipients || []).filter((r: Recipient) => r.status === 'PENDING');
    try {
      io.emit('eSignature:reminder_sent', { id: item.id, title: item.title, pendingCount: pendingRecipients.length });
    } catch (_ignored: unknown) { /* non-critical */ }
    return { sent: true, pendingRecipients: pendingRecipients.length };
  }
}

export default new ESignatureService();
