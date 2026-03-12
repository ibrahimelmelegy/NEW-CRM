import { Op, literal } from 'sequelize';
import { sequelize } from '../config/db';
import Lead from '../lead/leadModel';
import Deal from '../deal/model/dealModel';
import Client from '../client/clientModel';
import Opportunity from '../opportunity/opportunityModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

// ─── Entity Configuration ───────────────────────────────────────────────────────

interface EntityConfig {
  model: unknown;
  tableName: string;
  searchFields: string[];
  titleField: string;
  subtitleField: string;
}

const entityConfigMap: Record<string, EntityConfig> = {
  lead: {
    model: Lead,
    tableName: 'Leads',
    searchFields: ['name', 'email', 'phone', 'companyName'],
    titleField: 'name',
    subtitleField: 'companyName'
  },
  deal: {
    model: Deal,
    tableName: 'Deals',
    searchFields: ['name', 'companyName'],
    titleField: 'name',
    subtitleField: 'companyName'
  },
  client: {
    model: Client,
    tableName: 'Clients',
    searchFields: ['clientName', 'email', 'phoneNumber', 'companyName'],
    titleField: 'clientName',
    subtitleField: 'companyName'
  },
  contact: {
    model: Client,
    tableName: 'Clients',
    searchFields: ['clientName', 'email', 'phoneNumber'],
    titleField: 'clientName',
    subtitleField: 'email'
  },
  opportunity: {
    model: Opportunity,
    tableName: 'Opportunities',
    searchFields: ['name', 'interestedIn'],
    titleField: 'name',
    subtitleField: 'interestedIn'
  }
};

const MAX_PER_ENTITY = 10;

// ─── In-Memory Search History (per user) ─────────────────────────────────────

interface SearchHistoryEntry {
  query: string;
  timestamp: Date;
}

const searchHistory = new Map<number, SearchHistoryEntry[]>();
const MAX_HISTORY = 20;

// ─── Result Types ────────────────────────────────────────────────────────────

interface SearchResultItem {
  entityType: string;
  id: number;
  title: string;
  subtitle: string;
  relevanceScore: number;
}

interface GlobalSearchResult {
  results: SearchResultItem[];
  totalByEntity: Record<string, number>;
}

interface EntitySearchResult {
  docs: SearchResultItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface GlobalSearchOptions {
  entities?: string[];
  page?: number;
  limit?: number;
}

interface EntitySearchFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: unknown;
}

// ─── Search Service ──────────────────────────────────────────────────────────

class SearchService {
  /**
   * Search across leads, deals, clients, contacts, opportunities.
   * Uses PostgreSQL tsvector when available, falls back to ILIKE.
   */
  async globalSearch(query: string, tenantId: string | undefined, options: GlobalSearchOptions = {}): Promise<GlobalSearchResult> {
    if (!query || query.trim().length === 0) {
      return { results: [], totalByEntity: {} };
    }

    const searchTerm = query.trim();
    const { entities, page = 1, limit = MAX_PER_ENTITY } = options;
    const perEntity = Math.min(limit, MAX_PER_ENTITY);

    const entitiesToSearch = entities && entities.length > 0 ? entities.filter(e => entityConfigMap[e]) : Object.keys(entityConfigMap);

    const tenantFilter = tenantId ? { tenantId } : {};
    const allResults: SearchResultItem[] = [];
    const totalByEntity: Record<string, number> = {};

    await Promise.all(
      entitiesToSearch.map(async entityType => {
        const config = entityConfigMap[entityType];
        if (!config) return;

        const offset = (page - 1) * perEntity;
        let rows: unknown[] = [];
        let count = 0;

        // Try tsvector-based full-text search first
        try {
          const escaped = sequelize.escape(searchTerm);
          const result = await config.model.findAndCountAll({
            where: {
              ...tenantFilter,
              ...literal(`search_vector @@ plainto_tsquery('english', ${escaped})`)
            },
            attributes: {
              include: [[literal(`ts_rank(search_vector, plainto_tsquery('english', ${escaped}))`), 'search_rank']]
            },
            limit: perEntity,
            offset,
            order: [[literal('search_rank'), 'DESC']]
          });

          if (result.count > 0) {
            rows = result.rows;
            count = result.count;
          }
        } catch {
          // search_vector column may not exist; fall through to ILIKE
        }

        // ILIKE fallback when tsvector returns nothing or is unavailable
        if (rows.length === 0) {
          const whereConditions = config.searchFields.map(field => ({
            [field]: { [Op.iLike]: `%${searchTerm}%` }
          }));

          const result = await config.model.findAndCountAll({
            where: {
              ...tenantFilter,
              [Op.or]: whereConditions
            },
            limit: perEntity,
            offset,
            order: [['createdAt', 'DESC']]
          });

          rows = result.rows;
          count = result.count;
        }

        totalByEntity[entityType] = count;

        rows.forEach((row: Record<string, unknown>, index: number) => {
          const plain = row.get ? row.get({ plain: true }) : row;
          allResults.push({
            entityType,
            id: plain.id,
            title: plain[config.titleField] || '',
            subtitle: plain[config.subtitleField] || '',
            relevanceScore: plain.search_rank ? parseFloat(plain.search_rank) : 1 - index * 0.01
          });
        });
      })
    );

    // Sort combined results by relevance score descending
    allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return { results: allResults, totalByEntity };
  }

  /**
   * Search within a specific entity type with optional field filters.
   */
  async searchEntity(entity: string, query: string, tenantId: string | undefined, filters: EntitySearchFilters = {}): Promise<EntitySearchResult> {
    const config = entityConfigMap[entity];
    if (!config) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400);
    }

    const searchTerm = query?.trim();
    const { page = 1, limit = 20, sortBy, sortOrder = 'DESC', ...fieldFilters } = filters;
    const offset = (page - 1) * limit;
    const tenantFilter = tenantId ? { tenantId } : {};

    // Build where clause
    const where: unknown = { ...tenantFilter };

    // Text search conditions
    if (searchTerm) {
      where[Op.or] = config.searchFields.map(field => ({
        [field]: { [Op.iLike]: `%${searchTerm}%` }
      }));
    }

    // Apply additional field filters (e.g. status, stage)
    for (const [key, value] of Object.entries(fieldFilters)) {
      if (value !== undefined && value !== null && value !== '') {
        where[key] = value;
      }
    }

    const order: unknown = sortBy ? [[sortBy, sortOrder]] : [['createdAt', 'DESC']];

    const { count, rows } = await config.model.findAndCountAll({
      where,
      limit,
      offset,
      order
    });

    const docs: SearchResultItem[] = rows.map((row: Record<string, unknown>, index: number) => {
      const plain = row.get ? row.get({ plain: true }) : row;
      return {
        entityType: entity,
        id: plain.id,
        title: plain[config.titleField] || '',
        subtitle: plain[config.subtitleField] || '',
        relevanceScore: 1 - index * 0.01
      };
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get recent search history for a user.
   */
  getRecentSearches(userId: number): SearchHistoryEntry[] {
    return searchHistory.get(userId) || [];
  }

  /**
   * Save a search query to the user's history.
   */
  saveSearch(userId: number, query: string): void {
    if (!query || query.trim().length === 0) return;

    const history = searchHistory.get(userId) || [];

    // Remove duplicate if the same query already exists
    const filtered = history.filter(entry => entry.query.toLowerCase() !== query.trim().toLowerCase());

    // Add new entry at the beginning
    filtered.unshift({ query: query.trim(), timestamp: new Date() });

    // Keep only the most recent entries
    searchHistory.set(userId, filtered.slice(0, MAX_HISTORY));
  }

  /**
   * Clear recent search history for a user.
   */
  clearRecentSearches(userId: number): void {
    searchHistory.delete(userId);
  }
}

export default new SearchService();
