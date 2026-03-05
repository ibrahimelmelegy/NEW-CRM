import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import searchService from './searchService';
import { AuthenticatedRequest } from '../types';

class SearchController {
  /**
   * GET /api/search?q=term&entity=leads&page=1&limit=20
   * Global search across multiple entity types, or a single entity when specified.
   */
  async search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      const entity = req.query.entity as string | undefined;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const tenantId = req.user!.tenantId!;

      // Auto-save the search query
      if (q && req.user?.id) {
        searchService.saveSearch(req.user.id, q);
      }

      if (entity) {
        // Single entity search
        const results = await searchService.searchEntity(entity, q, tenantId, { page, limit });
        return wrapResult(res, results);
      }

      // Global search across all entities
      const entityTypes = req.query.entityTypes ? (req.query.entityTypes as string).split(',').map(t => t.trim()) : undefined;

      const results = await searchService.globalSearch(q, tenantId, {
        entities: entityTypes,
        page,
        limit
      });

      return wrapResult(res, results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/search/recent
   * Get the current user's recent search history.
   */
  async getRecentSearches(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      if (!userId) {
        return wrapResult(res, []);
      }
      const recent = searchService.getRecentSearches(userId);
      return wrapResult(res, recent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/search/recent
   * Clear the current user's recent search history.
   */
  async clearRecentSearches(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      if (userId) {
        searchService.clearRecentSearches(userId);
      }
      return wrapResult(res, { cleared: true });
    } catch (error) {
      next(error);
    }
  }
}

export default new SearchController();
