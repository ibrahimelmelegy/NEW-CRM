const MAX_LIMIT = 100;

export function clampPagination(query: { page?: any; limit?: unknown }, defaultLimit = 10): { page: number; limit: number; offset: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
