import { ElNotification } from 'element-plus';

export interface KanbanCard {
  id: string;
  name: string;
  companyName?: string;
  price?: number;
  estimatedValue?: number;
  contractType?: string;
  priority?: string;
  expectedCloseDate?: string;
  users?: Array<{ id: number; name: string; email: string }>;
  lead?: { id: string; name: string; companyName?: string };
  createdAt?: string;
  [key: string]: unknown;
}

export async function fetchDealKanban(): Promise<Record<string, KanbanCard[]>> {
  try {
    const { body, success, message } = await useApiFetch('deal/kanban');
    if (success && body) return body;
    const t = useNuxtApp().$i18n.t;
    throw new Error(message || t('common.fetchError'));
  } catch (error) {
    console.error('Error fetching kanban deals:', error);
    const t = useNuxtApp().$i18n.t;
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.fetchError') });
    return {};
  }
}

export async function fetchOpportunityKanban(): Promise<Record<string, KanbanCard[]>> {
  try {
    const { body, success, message } = await useApiFetch('opportunity/kanban');
    if (success && body) return body;
    const t = useNuxtApp().$i18n.t;
    throw new Error(message || t('common.fetchError'));
  } catch (error) {
    console.error('Error fetching kanban opportunities:', error);
    const t = useNuxtApp().$i18n.t;
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.fetchError') });
    return {};
  }
}

export async function updateDealStage(dealId: string, stage: string): Promise<boolean> {
  try {
    const { success, message } = await useApiFetch('deal/stage', 'PATCH', { dealId, stage });
    if (!success) {
      const t = useNuxtApp().$i18n.t;
      ElNotification({ type: 'error', title: t('common.error'), message: message || t('common.saveFailed') });
      return false;
    }
    return true;
  } catch (error) {
    const t = useNuxtApp().$i18n.t;
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.saveFailed') });
    return false;
  }
}

export async function updateOpportunityStage(id: string, stage: string): Promise<boolean> {
  try {
    const { success, message } = await useApiFetch(`opportunity/${id}/stage`, 'PATCH', { stage });
    if (!success) {
      const t = useNuxtApp().$i18n.t;
      ElNotification({ type: 'error', title: t('common.error'), message: message || t('common.saveFailed') });
      return false;
    }
    return true;
  } catch (error) {
    const t = useNuxtApp().$i18n.t;
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.saveFailed') });
    return false;
  }
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    PROGRESS: '#3B82F6',
    CLOSED: '#10B981',
    CANCELLED: '#EF4444',
    DISCOVERY: '#8B5CF6',
    PROPOSAL: '#F59E0B',
    NEGOTIATION: '#3B82F6',
    WON: '#10B981',
    LOST: '#EF4444'
  };
  return colors[stage] || '#6B7280';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    VERY_HIGH: '#EF4444',
    HIGH: '#F97316',
    MEDIUM: '#F59E0B',
    LOW: '#3B82F6',
    VERY_LOW: '#6B7280'
  };
  return colors[priority] || '#6B7280';
}
