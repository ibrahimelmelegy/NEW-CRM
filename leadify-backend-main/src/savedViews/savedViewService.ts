import { Op, WhereOptions, Order } from 'sequelize';
import SavedView, { FilterObject, ConditionLogic } from './savedViewModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

class SavedViewService {
  /**
   * Create a new saved view
   */
  async createView(data: Partial<SavedView>, userId: number): Promise<SavedView> {
    return SavedView.create({
      name: data.name,
      entityType: data.entityType,
      filters: data.filters || [],
      sortBy: data.sortBy || null,
      sortOrder: data.sortOrder || 'DESC',
      columns: data.columns || [],
      isDefault: data.isDefault || false,
      isShared: data.isShared || false,
      color: data.color || null,
      icon: data.icon || null,
      userId
    });
  }

  /**
   * Update a saved view (only owner can update)
   */
  async updateView(id: number, data: Partial<SavedView>, userId: number): Promise<SavedView> {
    const view = await SavedView.findOne({ where: { id, userId } });
    if (!view) {
      throw new BaseError(ERRORS.NOT_FOUND);
    }

    return view.update({
      name: data.name !== undefined ? data.name : view.name,
      filters: data.filters !== undefined ? data.filters : view.filters,
      sortBy: data.sortBy !== undefined ? data.sortBy : view.sortBy,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : view.sortOrder,
      columns: data.columns !== undefined ? data.columns : view.columns,
      isDefault: data.isDefault !== undefined ? data.isDefault : view.isDefault,
      isShared: data.isShared !== undefined ? data.isShared : view.isShared,
      color: data.color !== undefined ? data.color : view.color,
      icon: data.icon !== undefined ? data.icon : view.icon
    });
  }

  /**
   * Delete a saved view (only owner can delete)
   */
  async deleteView(id: number, userId: number): Promise<void> {
    const view = await SavedView.findOne({ where: { id, userId } });
    if (!view) {
      throw new BaseError(ERRORS.NOT_FOUND);
    }
    await view.destroy();
  }

  /**
   * Get all views for a given entity type: user's own views + shared views
   */
  async getViews(entityType: string, userId: number): Promise<SavedView[]> {
    return SavedView.findAll({
      where: {
        entityType,
        [Op.or]: [{ userId }, { isShared: true }]
      },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });
  }

  /**
   * Get a single view by id
   */
  async getViewById(id: number): Promise<SavedView> {
    const view = await SavedView.findByPk(id);
    if (!view) {
      throw new BaseError(ERRORS.NOT_FOUND);
    }
    return view;
  }

  /**
   * Set a view as the default for this entity type (unset previous default for this user+entityType)
   */
  async setDefault(id: number, userId: number): Promise<SavedView> {
    const view = await SavedView.findOne({ where: { id, userId } });
    if (!view) {
      throw new BaseError(ERRORS.NOT_FOUND);
    }

    // Unset any existing default for this user and entity type
    await SavedView.update(
      { isDefault: false },
      {
        where: {
          userId,
          entityType: view.entityType,
          isDefault: true
        }
      }
    );

    // Set this view as default
    return view.update({ isDefault: true });
  }

  /**
   * Apply a saved view's filters and sorting to build query options.
   * Returns { where, order } to be spread into a Sequelize findAll call.
   */
  applyView(view: SavedView): { where: WhereOptions; order: Order } {
    const where = this.buildWhereClause(view.filters || [], 'AND');
    const order: Order = view.sortBy ? [[view.sortBy, view.sortOrder || 'DESC']] : [['createdAt', 'DESC']];

    return { where, order };
  }

  /**
   * Convert an array of filter objects into Sequelize where conditions.
   * Supports AND / OR condition logic.
   */
  buildWhereClause(filters: FilterObject[], conditionLogic: ConditionLogic = 'AND'): WhereOptions {
    if (!filters || filters.length === 0) {
      return {};
    }

    const conditions: WhereOptions[] = filters.map(filter => {
      return this.buildSingleCondition(filter);
    });

    if (conditionLogic === 'OR') {
      return { [Op.or]: conditions };
    }

    return { [Op.and]: conditions };
  }

  /**
   * Build a single Sequelize where condition from a filter object
   */
  private buildSingleCondition(filter: FilterObject): WhereOptions {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'equals':
        return { [field]: { [Op.eq]: value } };

      case 'not_equals':
        return { [field]: { [Op.ne]: value } };

      case 'contains':
        return { [field]: { [Op.iLike]: `%${value}%` } };

      case 'not_contains':
        return { [field]: { [Op.notILike]: `%${value}%` } };

      case 'starts_with':
        return { [field]: { [Op.iLike]: `${value}%` } };

      case 'ends_with':
        return { [field]: { [Op.iLike]: `%${value}` } };

      case 'greater_than':
        return { [field]: { [Op.gt]: value } };

      case 'less_than':
        return { [field]: { [Op.lt]: value } };

      case 'greater_than_or_equal':
        return { [field]: { [Op.gte]: value } };

      case 'less_than_or_equal':
        return { [field]: { [Op.lte]: value } };

      case 'between':
        if (!Array.isArray(value) || value.length !== 2) {
          throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400);
        }
        return { [field]: { [Op.between]: [value[0], value[1]] } };

      case 'is_empty':
        return {
          [Op.or]: [{ [field]: { [Op.is]: null as any } }, { [field]: { [Op.eq]: '' } }]
        };

      case 'is_not_empty':
        return {
          [Op.and]: [{ [field]: { [Op.not]: null as any } }, { [field]: { [Op.ne]: '' } }]
        };

      case 'in':
        if (!Array.isArray(value)) {
          throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400);
        }
        return { [field]: { [Op.in]: value } };

      case 'not_in':
        if (!Array.isArray(value)) {
          throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400);
        }
        return { [field]: { [Op.notIn]: value } };

      default:
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400);
    }
  }
}

export default new SavedViewService();
