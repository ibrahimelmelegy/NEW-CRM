import { Op } from 'sequelize';
import KBArticle, { ArticleStatus } from './kbArticleModel';
import User from '../user/userModel';

class KBService {
  async createArticle(data: any, authorId?: number) {
    const slug = this.generateSlug(data.title);
    return KBArticle.create({ ...data, slug, authorId });
  }

  async updateArticle(id: string, data: any) {
    const article = await KBArticle.findByPk(id);
    if (!article) throw new Error('Article not found');
    if (data.title && data.title !== article.title) {
      data.slug = this.generateSlug(data.title);
    }
    return article.update(data);
  }

  async getArticles(query: any) {
    const { page = 1, limit = 20, search, category, status, tag } = query;
    const where: any = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;
    if (tag) where.tags = { [Op.contains]: [tag] };

    const offset = (Number(page) - 1) * Number(limit);
    const { rows, count } = await KBArticle.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'profilePicture'] }],
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: Number(limit),
      offset
    });

    return {
      docs: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: count,
        totalPages: Math.ceil(count / Number(limit))
      }
    };
  }

  async getPublishedArticles(query: any) {
    return this.getArticles({ ...query, status: ArticleStatus.PUBLISHED });
  }

  async getArticleById(id: string) {
    const article = await KBArticle.findByPk(id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'profilePicture'] }]
    });
    if (!article) throw new Error('Article not found');
    return article;
  }

  async getArticleBySlug(slug: string) {
    const article = await KBArticle.findOne({
      where: { slug, status: ArticleStatus.PUBLISHED },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'profilePicture'] }]
    });
    if (!article) throw new Error('Article not found');
    await article.increment('viewCount');
    return article;
  }

  async deleteArticle(id: string) {
    const article = await KBArticle.findByPk(id);
    if (!article) throw new Error('Article not found');
    await article.destroy();
    return { deleted: true };
  }

  async markHelpful(id: string) {
    const article = await KBArticle.findByPk(id);
    if (!article) throw new Error('Article not found');
    await article.increment('helpfulCount');
    return { helpfulCount: article.helpfulCount + 1 };
  }

  async getCategories() {
    const articles = await KBArticle.findAll({
      attributes: ['category'],
      where: { category: { [Op.ne]: null } },
      group: ['category']
    });
    return articles.map(a => a.category).filter(Boolean);
  }

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
    return `${base}-${Date.now().toString(36)}`;
  }
}

export default new KBService();
