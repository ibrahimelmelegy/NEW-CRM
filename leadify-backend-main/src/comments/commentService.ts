import Comment from './commentModel';
import User from '../user/userModel';

class CommentService {
  async getComments(entityType: string, entityId: number) {
    try {
      const comments = await Comment.findAll({
        where: { entityType, entityId },
        include: [{ model: User, attributes: ['id', 'name', 'profilePicture'], required: false }],
        order: [['createdAt', 'DESC']]
      });
      return { docs: comments };
    } catch (error) {
      return { docs: [] };
    }
  }

  async createComment(data: { entityType: string; entityId: number; content: string; parentId?: number }, userId: number) {
    return Comment.create({ ...data, userId });
  }

  async updateComment(id: number, content: string, userId: number) {
    const comment = await Comment.findByPk(id);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId) throw new Error('Not authorized');
    comment.content = content;
    await comment.save();
    return comment;
  }

  async deleteComment(id: number, userId: number) {
    const comment = await Comment.findByPk(id);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId) throw new Error('Not authorized');
    await comment.destroy();
    return { deleted: true };
  }
}

export default new CommentService();
