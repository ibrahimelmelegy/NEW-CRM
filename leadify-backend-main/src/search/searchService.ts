import { Op, WhereOptions, Order } from 'sequelize';
import Lead from '../lead/leadModel';
import Deal from '../deal/model/dealModel';
import Client from '../client/clientModel';
import Opportunity from '../opportunity/opportunityModel';
import Project from '../project/models/projectModel';
import Invoice from '../deal/model/invoiceMode';
import Contract from '../contract/contractModel';
import savedViewService from '../savedViews/savedViewService';
import { FilterObject, ConditionLogic } from '../savedViews/savedViewModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

// Map of entity types to their Sequelize models
const modelMap: Record<string, any> = {
  lead: Lead,
  deal: Deal,
  client: Client,
  opportunity: Opportunity,
  project: Project,
  invoice: Invoice,
  contract: Contract
};

// Searchable fields definition with types for each entity
const searchableFieldsMap: Record<string, { field: string; type: string; label: string }[]> = {
  lead: [
    { field: 'name', type: 'string', label: 'Name' },
    { field: 'email', type: 'string', label: 'Email' },
    { field: 'phone', type: 'string', label: 'Phone' },
    { field: 'companyName', type: 'string', label: 'Company' },
    { field: 'leadSource', type: 'enum', label: 'Source' },
    { field: 'status', type: 'enum', label: 'Stage' },
    { field: 'score', type: 'number', label: 'Score' },
    { field: 'lastContactDate', type: 'date', label: 'Last Contact Date' },
    { field: 'createdAt', type: 'date', label: 'Created At' }
  ],
  deal: [
    { field: 'name', type: 'string', label: 'Name' },
    { field: 'stage', type: 'enum', label: 'Stage' },
    { field: 'price', type: 'number', label: 'Value' },
    { field: 'companyName', type: 'string', label: 'Company' },
    { field: 'contractType', type: 'enum', label: 'Contract Type' },
    { field: 'signatureDate', type: 'date', label: 'Signature Date' },
    { field: 'createdAt', type: 'date', label: 'Created At' }
  ],
  client: [
    { field: 'clientName', type: 'string', label: 'Name' },
    { field: 'email', type: 'string', label: 'Email' },
    { field: 'phoneNumber', type: 'string', label: 'Phone' },
    { field: 'industry', type: 'enum', label: 'Industry' },
    { field: 'companyName', type: 'string', label: 'Company' },
    { field: 'clientStatus', type: 'enum', label: 'Status' },
    { field: 'clientType', type: 'string', label: 'Client Type' },
    { field: 'city', type: 'string', label: 'City' },
    { field: 'createdAt', type: 'date', label: 'Created At' }
  ],
  opportunity: [
    { field: 'name', type: 'string', label: 'Name' },
    { field: 'stage', type: 'enum', label: 'Stage' },
    { field: 'estimatedValue', type: 'number', label: 'Value' },
    { field: 'priority', type: 'enum', label: 'Priority' },
    { field: 'interestedIn', type: 'string', label: 'Interested In' },
    { field: 'expectedCloseDate', type: 'date', label: 'Expected Close Date' },
    { field: 'createdAt', type: 'date', label: 'Created At' }
  ],
  project: [
    { field: 'name', type: 'string', label: 'Name' },
    { field: 'status', type: 'enum', label: 'Status' },
    { field: 'category', type: 'enum', label: 'Category' },
    { field: 'type', type: 'string', label: 'Type' },
    { field: 'startDate', type: 'date', label: 'Start Date' },
    { field: 'endDate', type: 'date', label: 'End Date' },
    { field: 'grandTotal', type: 'number', label: 'Grand Total' },
    { field: 'isCompleted', type: 'boolean', label: 'Completed' },
    { field: 'createdAt', type: 'date', label: 'Created At' }
  ],
  invoice: [
    { field: 'invoiceNumber', type: 'string', label: 'Invoice Number' },
    { field: 'amount', type: 'number', label: 'Amount' },
    { field: 'collected', type: 'boolean', label: 'Collected' },
    { field: 'invoiceDate', type: 'date', label: 'Invoice Date' },
    { field: 'collectedDate', type: 'date', label: 'Collected Date' },
    { field: 'createdAt', type: 'date', label: 'Created At' }
  ],
  contract: [
    { field: 'title', type: 'string', label: 'Title' },
    { field: 'status', type: 'enum', label: 'Status' },
    { field: 'signerName', type: 'string', label: 'Signer Name' },
    { field: 'signerEmail', type: 'string', label: 'Signer Email' },
    { field: 'signedAt', type: 'date', label: 'Signed At' },
    { field: 'expiresAt', type: 'date', label: 'Expires At' },
    { field: 'createdAt', type: 'date', label: 'Created At' }
  ]
};

// Fields to search in global search per entity type (text-searchable fields only)
const globalSearchFieldsMap: Record<string, string[]> = {
  lead: ['name', 'email', 'phone', 'companyName'],
  deal: ['name', 'companyName'],
  client: ['clientName', 'email', 'phoneNumber', 'companyName'],
  opportunity: ['name', 'interestedIn'],
  project: ['name', 'type'],
  invoice: ['invoiceNumber'],
  contract: ['title', 'signerName', 'signerEmail']
};

interface SearchResult {
  entityType: string;
  results: any[];
  total: number;
}

interface PaginatedResult<T> {
  docs: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

class SearchService {
  /**
   * Global full-text search across multiple entity types.
   * Returns results grouped by entity type.
   */
  async search(query: string, entityTypes?: string[], page: number = 1, limit: number = 10): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const typesToSearch = entityTypes && entityTypes.length > 0 ? entityTypes.filter(t => modelMap[t]) : Object.keys(modelMap);

    const offset = (page - 1) * limit;
    const searchTerm = query.trim();

    const results = await Promise.all(
      typesToSearch.map(async entityType => {
        const Model = modelMap[entityType];
        const fields = globalSearchFieldsMap[entityType];

        if (!Model || !fields || fields.length === 0) {
          return { entityType, results: [], total: 0 };
        }

        // Build an OR condition: search across all text fields
        const whereConditions: WhereOptions[] = fields.map(field => ({
          [field]: { [Op.iLike]: `%${searchTerm}%` }
        }));

        const where: WhereOptions = { [Op.or]: whereConditions };

        const { count, rows } = await Model.findAndCountAll({
          where,
          limit,
          offset,
          order: [['createdAt', 'DESC']]
        });

        return {
          entityType,
          results: rows,
          total: count
        };
      })
    );

    // Only return entity types that have results
    return results.filter(r => r.total > 0);
  }

  /**
   * Advanced search within a single entity type with complex filter conditions.
   */
  async advancedSearch(
    entityType: string,
    filters: FilterObject[],
    conditionLogic: ConditionLogic = 'AND',
    sortBy?: string,
    sort: 'ASC' | 'DESC' = 'DESC',
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<any>> {
    const Model = modelMap[entityType];
    if (!Model) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400);
    }

    const offset = (page - 1) * limit;

    // Build the where clause from filters
    const where = savedViewService.buildWhereClause(filters, conditionLogic);

    // Build order
    const order: Order = sortBy ? [[sortBy, sort]] : [['createdAt', 'DESC']];

    const { count, rows } = await Model.findAndCountAll({
      where,
      order,
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Return the list of searchable/filterable fields for a given entity type.
   */
  getSearchableFields(entityType: string): { field: string; type: string; label: string }[] {
    const fields = searchableFieldsMap[entityType];
    if (!fields) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400);
    }
    return fields;
  }
}

export default new SearchService();
