/**
 * Call Log System
 * Track all phone calls with clients — duration, notes, outcomes.
 */
import { ref, computed } from 'vue';

export interface CallEntry {
    id: string;
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

const STORAGE_KEY = 'crm_call_log';
function load(): CallEntry[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(items: CallEntry[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

const calls = ref<CallEntry[]>(load());

export function useCallLog() {
    const sorted = computed(() => [...calls.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    const stats = computed(() => ({
        total: calls.value.length,
        totalDuration: calls.value.reduce((s, c) => s + c.duration, 0),
        answered: calls.value.filter(c => c.outcome === 'answered').length,
        missed: calls.value.filter(c => c.outcome === 'no_answer').length,
        inbound: calls.value.filter(c => c.direction === 'inbound').length,
        outbound: calls.value.filter(c => c.direction === 'outbound').length,
    }));

    function logCall(data: Omit<CallEntry, 'id' | 'createdAt'>): CallEntry {
        const entry: CallEntry = { ...data, id: `call_${Date.now()}`, createdAt: new Date().toISOString() };
        calls.value.unshift(entry);
        save(calls.value);
        return entry;
    }
    function removeCall(id: string) { calls.value = calls.value.filter(c => c.id !== id); save(calls.value); }

    return { calls: sorted, stats, logCall, removeCall };
}
