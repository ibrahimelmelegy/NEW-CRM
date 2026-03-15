import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';
import logger from '~/utils/logger'

export interface WarRoomMetrics {
  totalDeals: number;
  totalRevenue: number;
  wonDeals: number;
  lostDeals: number;
  openLeads: number;
  conversionRate: number;
  avgDealSize: number;
  activeProjects: number;
}

export function useWarRoom() {
  const metrics = ref<WarRoomMetrics>({
    totalDeals: 0,
    totalRevenue: 0,
    wonDeals: 0,
    lostDeals: 0,
    openLeads: 0,
    conversionRate: 0,
    avgDealSize: 0,
    activeProjects: 0
  });
  const dealAlerts = ref<Record<string, unknown>[]>([]);
  const teamMembers = ref<Record<string, unknown>[]>([]);
  const sparklineData = ref<Record<string, number[]>>({});
  const loading = ref(false);

  async function fetchMetrics() {
    loading.value = true;
    try {
      const [insightsRes, leadsRes] = await Promise.all([useApiFetch('insights/leads-sales'), useApiFetch('lead?page=1&limit=1')]);

      if (insightsRes.success && insightsRes.body) {
        const data = insightsRes.body as unknown;
        metrics.value = {
          totalDeals: data.totalDeals || 0,
          totalRevenue: data.totalRevenue || 0,
          wonDeals: data.closedDeals || data.wonDeals || 0,
          lostDeals: data.cancelledDeals || data.lostDeals || 0,
          openLeads: data.totalLeads || (leadsRes?.body as unknown)?.count || 0,
          conversionRate: data.conversionRate || 0,
          avgDealSize: data.avgDealSize || 0,
          activeProjects: data.activeProjects || 0
        };
      }

      // Generate sparkline mock from metrics trends
      sparklineData.value = {
        revenue: generateSparkline(metrics.value.totalRevenue),
        deals: generateSparkline(metrics.value.totalDeals),
        leads: generateSparkline(metrics.value.openLeads),
        conversion: generateSparkline(metrics.value.conversionRate)
      };
    } catch (e) {
      logger.error('War room metrics fetch failed', e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchTeam() {
    const res = await useApiFetch('users?page=1&limit=20');
    if (res.success && res.body) {
      const body = res.body as unknown;
      const users = Array.isArray(body) ? body : body.rows || [];
      teamMembers.value = users.map(u => ({
        id: u.id,
        name: u.name,
        profilePicture: u.profilePicture,
        isActive: Math.random() > 0.3 // simulated online status
      }));
    }
  }

  async function fetchDealAlerts() {
    const res = await useApiFetch('activity?page=1&limit=15');
    if (res.success && res.body) {
      const body = res.body as unknown;
      const activities = Array.isArray(body) ? body : body.rows || [];
      dealAlerts.value = activities;
    }
  }

  function generateSparkline(baseValue: number): number[] {
    const points: number[] = [];
    let val = baseValue * 0.6;
    for (let i = 0; i < 12; i++) {
      val += (Math.random() - 0.3) * baseValue * 0.1;
      points.push(Math.max(0, Math.round(val)));
    }
    return points;
  }

  return {
    metrics,
    dealAlerts,
    teamMembers,
    sparklineData,
    loading,
    fetchMetrics,
    fetchTeam,
    fetchDealAlerts
  };
}
