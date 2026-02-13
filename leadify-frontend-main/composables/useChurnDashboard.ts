import { ElNotification } from 'element-plus';

export interface ChurnLead {
  id: string;
  name: string;
  email: string | null;
  status: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  daysSinceLastContact: number;
  lastContactDate: string | null;
}

export interface ChurnDashboardData {
  summary: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    totalAtRisk: number;
  };
  atRiskLeads: ChurnLead[];
  riskDistribution: Array<{ name: string; value: number }>;
}

export async function getChurnDashboardData(): Promise<ChurnDashboardData | null> {
  try {
    const { body, success, message } = await useApiFetch('ai/churn-dashboard');
    if (success && body) {
      return body as ChurnDashboardData;
    }
    throw new Error(message || 'Failed to fetch churn data');
  } catch (error) {
    console.error('Error fetching churn dashboard:', error instanceof Error ? error.message : error);
    ElNotification({
      type: 'error',
      title: 'Error',
      message: 'Failed to load churn prediction data'
    });
    return null;
  }
}

export function getRiskTagType(level: string): string {
  switch (level) {
    case 'HIGH': return 'danger';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'info';
    default: return 'info';
  }
}
