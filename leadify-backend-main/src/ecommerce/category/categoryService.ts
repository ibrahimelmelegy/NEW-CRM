import { Op, WhereOptions } from 'sequelize';
import EcCategory from './categoryModel';
import { clampPagination } from '../../utils/pagination';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class CategoryService {
  async getCategories(query: Record<string, unknown>): Promise<unknown> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey, parentId, isActive } = query;

    const where: WhereOptions = {};

    if (searchKey) {
      (where as Record<string, unknown>)[Op.or] = [{ name: { [Op.iLike]: `%${searchKey}%` } }];
    }

    if (parentId !== undefined && parentId !== '') {
      if (parentId === 'null' || parentId === null) {
        (where as Record<string, unknown>).parentId = null;
      } else {
        (where as Record<string, unknown>).parentId = parentId;
      }
    }

    if (isActive !== undefined && isActive !== '') {
      (where as Record<string, unknown>).isActive = isActive === 'true' || isActive === true;
    }

    const { rows: docs, count: totalItems } = await EcCategory.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      include: [
        { model: EcCategory, as: 'parent', required: false },
        { model: EcCategory, as: 'children', required: false }
      ]
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async getCategoryById(id: string): Promise<EcCategory> {
    const category = await EcCategory.findByPk(id, {
      include: [
        { model: EcCategory, as: 'parent', required: false },
        { model: EcCategory, as: 'children', required: false }
      ]
    });
    if (!category) throw new Error('Category not found');
    return category;
  }

  async getCategoryTree(): Promise<EcCategory[]> {
    const categories = await EcCategory.findAll({
      where: { parentId: null },
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      include: [
        {
          model: EcCategory,
          as: 'children',
          required: false,
          include: [{ model: EcCategory, as: 'children', required: false }]
        }
      ]
    });
    return categories;
  }

  async createCategory(data: Record<string, unknown>): Promise<EcCategory> {
    const slug = slugify(data.name);

    // Ensure slug uniqueness by appending a suffix if needed
    let finalSlug = slug;
    let counter = 1;
    while (await EcCategory.findOne({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return EcCategory.create({ ...data, slug: finalSlug });
  }

  async updateCategory(id: string, data: Record<string, unknown>): Promise<EcCategory> {
    const category = await EcCategory.findByPk(id);
    if (!category) throw new Error('Category not found');

    // Regenerate slug if name changed
    if (data.name && data.name !== category.name) {
      const slug = slugify(data.name);
      let finalSlug = slug;
      let counter = 1;
      while (true) {
        const existing = await EcCategory.findOne({ where: { slug: finalSlug } });
        if (!existing || existing.id === id) break;
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      data.slug = finalSlug;
    }

    return category.update(data);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await EcCategory.findByPk(id, {
      include: [{ model: EcCategory, as: 'children', required: false }]
    });
    if (!category) throw new Error('Category not found');

    if (category.children && category.children.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    await category.destroy();
  }
}

export default new CategoryService();
