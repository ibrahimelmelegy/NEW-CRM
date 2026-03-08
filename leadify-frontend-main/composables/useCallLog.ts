/**
 * Call Log System — API-backed with Analytics
 * Track all phone calls with clients — duration, notes, outcomes, recordings, transcriptions.
 */
import { ref, computed } from 'vue';
import { ElNotification } from 'element-plus';
import { useApiFetch } from './useApiFetch';

export interface CallEntry {
  id: number;
  contactName: string;
  contactCompany?: string;
  phone: string;
  direction: 'inbound' | 'outbound';
  outcome: 'answered' | 'no_answer' | 'voicemail' | 'busy' | 'callback';
  disposition?: string;
  duration: number; // seconds
  recordingUrl?: string;
  transcription?: string;
  notes: string;
  createdAt: string;
  followUpDate?: string;
}

export interface CallAnalytics {
  totalCalls: number;
  totalDuration: number;
  avgDuration: number;
  durationDistribution: Record<string, number>;
  byOutcome: Record<string, number>;
  byDisposition: Record<string, number>;
  byHour: Record<number, number>;
  byDirection: { INBOUND: number; OUTBOUND: number };
  dailyVolume: Record<string, number>;
}

const calls = ref<CallEntry[]>([]);
const analytics = ref<CallAnalytics | null>(null);
const loading = ref(false);

function mapOutcome(backendOutcome?: string): CallEntry['outcome'] {
  const map: Record<string, CallEntry['outcome']> = {
    CONNECTED: 'answered',
    NO_ANSWER: 'no_answer',
    VOICEMAIL: 'voicemail',
    BUSY: 'busy',
    LEFT_MESSAGE: 'callback',
    INTERESTED: 'answered',
    NOT_INTERESTED: 'no_answer',
    FOLLOW_UP: 'callback',
    CALLBACK: 'callback',
    FAILED: 'no_answer'
  };
  return map[backendOutcome || ''] || 'answered';
}

function mapOutcomeToBackend(outcome: string): string {
  const map: Record<string, string> = {
    answered: 'CONNECTED',
    no_answer: 'NO_ANSWER',
    voicemail: 'VOICEMAIL',
    busy: 'BUSY',
    callback: 'LEFT_MESSAGE'
  };
  return map[outcome] || 'CONNECTED';
}

function mapDispositionToBackend(disposition: string): string {
  const map: Record<string, string> = {
    interested: 'INTERESTED',
    not_interested: 'NOT_INTERESTED',
    follow_up: 'FOLLOW_UP',
    voicemail: 'VOICEMAIL',
    no_answer: 'NO_ANSWER',
    callback: 'CALLBACK'
  };
  return map[disposition] || disposition.toUpperCase();
}

export function useCallLog() {
  const sorted = computed(() => [...calls.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  const stats = computed(() => ({
    total: calls.value.length,
    totalDuration: calls.value.reduce((s, c) => s + c.duration, 0),
    answered: calls.value.filter(c => c.outcome === 'answered').length,
    missed: calls.value.filter(c => c.outcome === 'no_answer').length,
    inbound: calls.value.filter(c => c.direction === 'inbound').length,
    outbound: calls.value.filter(c => c.direction === 'outbound').length
  }));

  async function fetchCalls(page = 1) {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch(`communications/call-logs?page=${page}&limit=100`);
      if (success && body) {
        const data = body as unknown;
        calls.value = (data.docs || []).map(a => ({
          id: a.id,
          contactName: a.subject || a.contactId || 'Unknown',
          phone: a.callLog?.phoneNumber || '',
          direction: (a.direction || 'OUTBOUND').toLowerCase() as unknown,
          outcome: mapOutcome(a.callLog?.outcome),
          disposition: a.callLog?.disposition?.toLowerCase(),
          duration: a.duration || a.callLog?.duration || 0,
          recordingUrl: a.callLog?.recordingUrl,
          transcription: a.callLog?.transcription,
          notes: a.body || a.callLog?.notes || '',
          createdAt: a.createdAt
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchAnalytics(dateRange?: { start: string; end: string }) {
    try {
      const queryParams = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
      const { body, success } = await useApiFetch(`communications/call-analytics${queryParams}`);
      if (success && body) {
        analytics.value = body as CallAnalytics;
      }
    } catch (error) {
      console.error('Failed to fetch call analytics:', error);
      const t = useNuxtApp().$i18n.t;
      ElNotification({ type: 'error', title: t('common.error'), message: t('common.fetchError') });
    }
  }

  async function logCall(data: Omit<CallEntry, 'id' | 'createdAt'>): Promise<boolean> {
    const payload = {
      contactId: data.contactName,
      contactType: 'CLIENT',
      subject: data.contactName,
      body: data.notes,
      direction: data.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
      phoneNumber: data.phone,
      duration: data.duration,
      outcome: mapOutcomeToBackend(data.outcome),
      disposition: data.disposition ? mapDispositionToBackend(data.disposition) : undefined,
      recordingUrl: data.recordingUrl,
      transcription: data.transcription,
      notes: data.notes
    };
    const { success } = await useApiFetch('communications/calls', 'POST', payload);
    if (success) {
      await fetchCalls();
    }
    return success;
  }

  async function removeCall(id: number) {
    const { success } = await useApiFetch(`communications/activities/${id}`, 'DELETE');
    if (success) {
      calls.value = calls.value.filter(c => c.id !== id);
    }
  }

  return {
    calls: sorted,
    stats,
    analytics,
    logCall,
    removeCall,
    fetchCalls,
    fetchAnalytics,
    loading
  };
}
