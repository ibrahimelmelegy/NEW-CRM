import Attachment from './attachmentModel';
import User from '../user/userModel';

class AttachmentService {
  async getAttachments(entityType: string, entityId: number) {
    try {
      const where: Record<string, any> = {};
      if (entityType) where.entityType = entityType;
      if (entityId && !isNaN(entityId)) where.entityId = entityId;

      const attachments = await Attachment.findAll({
        where,
        include: [{ model: User, attributes: ['id', 'name'], required: false }],
        order: [['createdAt', 'DESC']],
        limit: 100
      });
      return { docs: attachments };
    } catch (error) {
      console.error('getAttachments error:', error);
      return { docs: [] };
    }
  }

  async createAttachment(
    data: { entityType: string; entityId: number; fileUrl: string; fileName: string; fileSize?: number; mimeType?: string },
    userId: number
  ) {
    return Attachment.create({ ...data, uploadedBy: userId });
  }

  async deleteAttachment(id: number, _userId: number) {
    const attachment = await Attachment.findByPk(id);
    if (!attachment) throw new Error('Attachment not found');
    await attachment.destroy();
    return { deleted: true };
  }
}

export default new AttachmentService();
