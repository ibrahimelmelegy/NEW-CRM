import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';

class HeatmapService {
  async getHeatmapData(year: number, userId?: number): Promise<{ date: string; count: number }[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const activityTables = ['leadActivities', 'dealActivities', 'opportunityActivities', 'clientActivities', 'projectActivities'];

    const unionQueries = activityTables.map(
      table =>
        `SELECT DATE("createdAt") as activity_date, COUNT(*) as cnt FROM "${table}" WHERE "createdAt" >= :startDate AND "createdAt" <= :endDate ${userId ? 'AND "userId" = :userId' : ''} GROUP BY DATE("createdAt")`
    );

    const sql = `
      SELECT activity_date as date, SUM(cnt)::int as count
      FROM (${unionQueries.join(' UNION ALL ')}) combined
      GROUP BY activity_date
      ORDER BY activity_date
    `;

    const replacements: Record<string, any> = { startDate, endDate };
    if (userId) replacements.userId = userId;

    const results = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT
    });

    return results as { date: string; count: number }[];
  }

  async getRecentActivity(limit: number = 20): Promise<any[]> {
    const sql = `
      SELECT * FROM (
        SELECT 'lead' as type, "descripion" as description, "createdAt", "userId"
        FROM "leadActivities" ORDER BY "createdAt" DESC LIMIT :limit
      ) l
      UNION ALL
      SELECT * FROM (
        SELECT 'deal' as type, "descripion" as description, "createdAt", "userId"
        FROM "dealActivities" ORDER BY "createdAt" DESC LIMIT :limit
      ) d
      ORDER BY "createdAt" DESC
      LIMIT :limit
    `;

    try {
      const results = await sequelize.query(sql, {
        replacements: { limit },
        type: QueryTypes.SELECT
      });
      return results;
    } catch {
      // Fallback if column name is different (description vs descripion)
      const fallbackSql = `
        SELECT * FROM (
          SELECT 'lead' as type, "description" as description, "createdAt", "userId"
          FROM "leadActivities" ORDER BY "createdAt" DESC LIMIT :limit
        ) l
        UNION ALL
        SELECT * FROM (
          SELECT 'deal' as type, "description" as description, "createdAt", "userId"
          FROM "dealActivities" ORDER BY "createdAt" DESC LIMIT :limit
        ) d
        ORDER BY "createdAt" DESC
        LIMIT :limit
      `;
      const results = await sequelize.query(fallbackSql, {
        replacements: { limit },
        type: QueryTypes.SELECT
      });
      return results;
    }
  }
}

export default new HeatmapService();
