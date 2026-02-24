import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import searchService from './searchService';
import { AuthenticatedRequest } from '../types';

class SearchController {
  /**
   * GET /api/search?q=term&entityTypes=lead,deal&page=1&limit=10
   * Global search across multiple entity types
   */
  async search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      const entityTypesParam = req.query.entityTypes as string | undefined;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const entityTypes = entityTypesParam
        ? entityTypesParam.split(',').map((t) => t.trim())
        : undefined;

      const results = await searchService.search(q, entityTypes, page, limit);
      wrapResult(res, results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/search/advanced/:entityType
   * Advanced search within a single entity type
   * Body: { filters, conditionLogic, sortBy, sort, page, limit }
   */
  async advancedSearch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType } = req.params;
      const {
        filters = [],
        conditionLogic = 'AND',
        sortBy,
        sort = 'DESC',
        page = 1,
        limit = 20
      } = req.body;

      const results = await searchService.advancedSearch(
        entityType as string,
        filters,
        conditionLogic,
        sortBy,
        sort,
        page,
        limit
      );

      wrapResult(res, results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/search/fields/:entityType
   * Get searchable fields for an entity type
   */
  async getSearchableFields(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entityType = req.params.entityType as string;
      const fields = searchService.getSearchableFields(entityType);
      wrapResult(res, fields);
    } catch (error) {
      next(error);
    }
  }
}

export default new SearchController();
