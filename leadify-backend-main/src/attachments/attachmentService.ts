import Attachment from './attachmentModel';
import User from '../user/userModel';

class AttachmentService {
  async getAttachments(entityType: string, entityId: number) {
    const attachments = await Attachment.findAll({
      where: { entityType, entityId },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
    return { docs: attachments };
  }

  async createAttachment(data: { entityType: string; entityId: number; fileUrl: string; fileName: string; fileSize?: number; mimeType?: string }, userId: number) {
    return Attachment.create({ ...data, uploadedBy: userId });
  }

  async deleteAttachment(id: number, userId: number) {
    const attachment = await Attachment.findByPk(id);
    if (!attachment) throw new Error('Attachment not found');
    await attachment.destroy();
    return { deleted: true };
  }
}

export default new AttachmentService();
