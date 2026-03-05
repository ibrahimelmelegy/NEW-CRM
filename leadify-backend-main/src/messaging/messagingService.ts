import { Op } from 'sequelize';
import Message from './messagingModel';
import { MessageDirection, MessageStatus, MessageProvider } from './messagingEnum';
import whatsappService from '../integration/whatsappService';
import User from '../user/userModel';

class MessagingService {
  async sendMessage(
    userId: number,
    contactPhone: string,
    contactName: string | undefined,
    content: string,
    provider: string = MessageProvider.WHATSAPP
  ) {
    const message = await Message.create({
      contactPhone,
      contactName,
      direction: MessageDirection.OUTBOUND,
      content,
      status: MessageStatus.PENDING,
      provider,
      userId
    });

    try {
      if (provider === MessageProvider.WHATSAPP) {
        const result = await whatsappService.sendMessage(contactPhone, content);
        await message.update({
          status: MessageStatus.SENT,
          externalId: result?.messages?.[0]?.id || null
        });
      }
    } catch (error) {
      await message.update({ status: MessageStatus.FAILED });
      throw error;
    }

    return message;
  }

  async getConversations(userId: number) {
    // Get distinct contacts with their latest message
    const messages = await Message.findAll({
      attributes: ['contactPhone', 'contactName'],
      where: { userId },
      group: ['contactPhone', 'contactName'],
      order: [[Message.sequelize!.fn('MAX', Message.sequelize!.col('createdAt')), 'DESC']],
      raw: true
    });

    // For each contact, get the latest message and unread count
    const conversations = await Promise.all(
      messages.map(async (m: any) => {
        const lastMessage = await Message.findOne({
          where: { contactPhone: m.contactPhone, userId },
          order: [['createdAt', 'DESC']]
        });

        const unreadCount = await Message.count({
          where: {
            contactPhone: m.contactPhone,
            userId,
            direction: MessageDirection.INBOUND,
            status: { [Op.ne]: MessageStatus.READ }
          }
        });

        return {
          contactPhone: m.contactPhone,
          contactName: m.contactName || m.contactPhone,
          lastMessage: lastMessage?.content || '',
          lastMessageTime: lastMessage?.createdAt,
          unreadCount
        };
      })
    );

    return conversations;
  }

  async getMessages(userId: number, contactPhone: string, page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    const { rows, count } = await Message.findAndCountAll({
      where: { userId, contactPhone },
      order: [['createdAt', 'ASC']],
      limit,
      offset,
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }]
    });

    return { messages: rows, total: count, page, limit };
  }

  async recordInboundMessage(contactPhone: string, content: string, externalId?: string) {
    // Find the user associated with this phone (from previous outbound messages)
    const lastOutbound = await Message.findOne({
      where: { contactPhone, direction: MessageDirection.OUTBOUND },
      order: [['createdAt', 'DESC']]
    });

    return Message.create({
      contactPhone,
      direction: MessageDirection.INBOUND,
      content,
      status: MessageStatus.DELIVERED,
      provider: MessageProvider.WHATSAPP,
      externalId,
      userId: lastOutbound?.userId || null
    });
  }

  async markAsRead(userId: number, contactPhone: string) {
    await Message.update(
      { status: MessageStatus.READ },
      {
        where: {
          userId,
          contactPhone,
          direction: MessageDirection.INBOUND,
          status: { [Op.ne]: MessageStatus.READ }
        }
      }
    );
  }
}

export default new MessagingService();
