/**
 * Call Log System — API-backed
 * Track all phone calls with clients — duration, notes, outcomes.
 */
import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface CallEntry {
  id: number;
  contactName: string;
  contactCompany?: string;
  phone: string;
  direction: 'inbound' | 'outbound';
  outcome: 'answered' | 'no_answer' | 'voicemail' | 'busy' | 'callback';
  duration: number; // seconds
  notes: string;
  createdAt: string;
  followUpDate?: string;
}

const calls = ref<CallEntry[]>([]);
const loading = ref(false);

function mapOutcome(backendOutcome?: string): CallEntry['outcome'] {
  const map: Record<string, CallEntry['outcome']> = {
    CONNECTED: 'answered',
    NO_ANSWER: 'no_answer',
    VOICEMAIL: 'voicemail',
    BUSY: 'busy',
    LEFT_MESSAGE: 'callback'
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

export function useCallLog() {
  const sorted = computed(() =>
    [...calls.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );

  const stats = computed(() => ({
    total: calls.value.length,
    totalDuration: calls.value.reduce((s, c) => s + c.duration, 0),
    answered: calls.value.filter((c) => c.outcome === 'answered').length,
    missed: calls.value.filter((c) => c.outcome === 'no_answer').length,
    inbound: calls.value.filter((c) => c.direction === 'inbound').length,
    outbound: calls.value.filter((c) => c.direction === 'outbound').length
  }));

  async function fetchCalls(page = 1) {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch(
        `communications/call-logs?page=${page}&limit=100`
      );
      if (success && body) {
        const data = body as any;
        calls.value = (data.docs || []).map((a: any) => ({
          id: a.id,
          contactName: a.subject || a.contactId || 'Unknown',
          phone: a.callLog?.phoneNumber || '',
          direction: (a.direction || 'OUTBOUND').toLowerCase() as any,
          outcome: mapOutcome(a.callLog?.outcome),
          duration: a.duration || a.callLog?.duration || 0,
          notes: a.body || a.callLog?.notes || '',
          createdAt: a.createdAt
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  async function logCall(
    data: Omit<CallEntry, 'id' | 'createdAt'>
  ): Promise<boolean> {
    const payload = {
      contactId: data.contactName,
      contactType: 'CLIENT',
      subject: data.contactName,
      body: data.notes,
      direction: data.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
      phoneNumber: data.phone,
      duration: data.duration,
      outcome: mapOutcomeToBackend(data.outcome),
      notes: data.notes
    };
    const { success } = await useApiFetch('communications/calls', 'POST', payload);
    if (success) {
      await fetchCalls();
    }
    return success;
  }

  async function removeCall(id: number) {
    const { success } = await useApiFetch(
      `communications/activities/${id}`,
      'DELETE'
    );
    if (success) {
      calls.value = calls.value.filter((c) => c.id !== id);
    }
  }

  return { calls: sorted, stats, logCall, removeCall, fetchCalls, loading };
}
