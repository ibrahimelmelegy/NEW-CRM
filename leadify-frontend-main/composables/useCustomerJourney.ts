interface JourneyEvent {
  date: string;
  type: 'creation' | 'email' | 'call' | 'meeting' | 'deal_stage' | 'note' | 'task' | 'proposal' | 'invoice';
  title: string;
  description: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  metadata?: Record<string, unknown>;
}

interface JourneySummary {
  totalTouchpoints: number;
  journeyDurationDays: number;
  avgDaysBetweenTouchpoints: number;
  firstContact: string;
  lastContact: string;
}

interface JourneyResult {
  events: JourneyEvent[];
  summary: JourneySummary;
}

export function useCustomerJourney() {
  const journey = ref<JourneyResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const zoomLevel = ref<'year' | 'month' | 'week'>('month');

  async function fetchJourney(leadId: string) {
    loading.value = true;
    error.value = null;
    try {
      const { body, success, message } = await useApiFetch(`lead/${leadId}/journey`);
      if (success && body) {
        journey.value = body;
      } else {
        error.value = message || 'Failed to load journey data';
      }
    } catch (e: unknown) {
      error.value = e?.message || 'Failed to load journey data';
    } finally {
      loading.value = false;
    }
  }

  function setZoom(level: 'year' | 'month' | 'week') {
    zoomLevel.value = level;
  }

  // Color mapping for event types
  const typeColors: Record<string, string> = {
    creation: '#10b981',
    email: '#3b82f6',
    call: '#22c55e',
    meeting: '#8b5cf6',
    deal_stage: '#f59e0b',
    note: '#6b7280',
    task: '#14b8a6',
    proposal: '#f97316',
    invoice: '#eab308'
  };

  // Icon mapping for event types
  const typeIcons: Record<string, string> = {
    creation: 'ph:star-bold',
    email: 'ph:envelope-bold',
    call: 'ph:phone-bold',
    meeting: 'ph:users-bold',
    deal_stage: 'ph:handshake-bold',
    note: 'ph:note-pencil-bold',
    task: 'ph:check-square-bold',
    proposal: 'ph:file-text-bold',
    invoice: 'ph:receipt-bold'
  };

  // Sentiment color mapping
  const sentimentColors: Record<string, string> = {
    positive: '#10b981',
    neutral: '#6b7280',
    negative: '#ef4444'
  };

  return {
    journey,
    loading,
    error,
    zoomLevel,
    fetchJourney,
    setZoom,
    typeColors,
    typeIcons,
    sentimentColors
  };
}

export type { JourneyEvent, JourneySummary, JourneyResult };
