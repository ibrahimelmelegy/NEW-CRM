import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import Territory from './territoryModel';
import User from '../user/userModel';

interface TerritoryQuery {
  parentId?: string;
  isActive?: boolean;
}

interface TerritoryNode {
  id: string;
  name: string;
  description?: string;
  type: string;
  parentId?: string;
  assignedUserId?: string;
  boundaries?: object;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children: TerritoryNode[];
}

class TerritoryService {
  async getTerritories(query: TerritoryQuery): Promise<Territory[]> {
    const where: Record<string, any> = {};

    if (query.parentId !== undefined) {
      where.parentId = query.parentId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return Territory.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']]
    });
  }

  async getTerritoryById(id: string): Promise<Territory> {
    const territory = await Territory.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Territory,
          as: 'children',
          include: [
            {
              model: User,
              as: 'assignedUser',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: Territory,
          as: 'parent'
        }
      ]
    });

    if (!territory) throw new BaseError(ERRORS.TERRITORY_NOT_FOUND);
    return territory;
  }

  async createTerritory(data: Record<string, unknown>): Promise<Territory> {
    if (data.parentId) {
      const parent = await Territory.findByPk(data.parentId);
      if (!parent) throw new BaseError(ERRORS.TERRITORY_NOT_FOUND);
    }

    return Territory.create(data);
  }

  async updateTerritory(id: string, data: Record<string, unknown>): Promise<Territory> {
    const territory = await Territory.findByPk(id);
    if (!territory) throw new BaseError(ERRORS.TERRITORY_NOT_FOUND);

    if (data.parentId) {
      if (data.parentId === id) throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);
      const parent = await Territory.findByPk(data.parentId);
      if (!parent) throw new BaseError(ERRORS.TERRITORY_NOT_FOUND);
    }

    territory.set(data);
    return territory.save();
  }

  async deleteTerritory(id: string): Promise<void> {
    const territory = await Territory.findByPk(id);
    if (!territory) throw new BaseError(ERRORS.TERRITORY_NOT_FOUND);

    await territory.destroy();
  }

  async getTerritoryTree(): Promise<TerritoryNode[]> {
    const territories = await Territory.findAll({
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']]
    });

    const territoryMap = new Map<string, TerritoryNode>();
    const roots: TerritoryNode[] = [];

    // First pass: create nodes
    for (const t of territories) {
      const plain = t.toJSON() as any;
      territoryMap.set(plain.id, { ...plain, children: [] });
    }

    // Second pass: build tree
    for (const node of territoryMap.values()) {
      if (node.parentId && territoryMap.has(node.parentId)) {
        territoryMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}

export default new TerritoryService();
