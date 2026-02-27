<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('callLog.title') || 'Call Log' }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('callLog.subtitle') || 'Track all phone calls with clients and prospects.' }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:phone-plus" size="16" style="margin-right: 4px;")
      | {{ $t('callLog.logCall') || 'Log Call' }}

  //- Stats
  .grid.grid-cols-2.gap-4.mb-8(class="md:grid-cols-4")
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('callLog.totalCalls') || 'Total Calls' }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.total }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('callLog.answered') || 'Answered' }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.answered }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('callLog.missed') || 'Missed' }}
      p.text-3xl.font-black.mt-1(style="color: #ef4444;") {{ stats.missed }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('callLog.talkTime') || 'Talk Time' }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ formatDuration(stats.totalDuration) }}

  //- Table
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    el-table(:data="calls" v-loading="callLoading" style="width: 100%" :empty-text="$t('common.noData') || 'No calls logged yet.'")
      el-table-column(:label="$t('callLog.direction') || 'Direction'" width="100")
        template(#default="{ row }")
          el-tag(:type="row.direction === 'inbound' ? 'success' : 'primary'" size="small" round effect="plain")
            | {{ row.direction === 'inbound' ? 'In' : 'Out' }}
      el-table-column(:label="$t('callLog.contact') || 'Contact'" min-width="200")
        template(#default="{ row }")
          p.text-sm.font-bold {{ row.contactName }}
          p.text-xs.text-gray-400 {{ row.phone }}
      el-table-column(:label="$t('callLog.outcome') || 'Outcome'" width="130")
        template(#default="{ row }")
          el-tag(:type="outcomeType(row.outcome)" size="small" round) {{ row.outcome.replace('_', ' ') }}
      el-table-column(:label="$t('callLog.duration') || 'Duration'" width="100")
        template(#default="{ row }")
          span.font-mono.text-sm {{ formatDuration(row.duration) }}
      el-table-column(:label="$t('callLog.notes') || 'Notes'" min-width="200")
        template(#default="{ row }")
          p.text-xs.text-gray-500.line-clamp-2 {{ row.notes || '—' }}
      el-table-column(:label="$t('common.date') || 'Date'" width="150")
        template(#default="{ row }")
          span.text-xs.font-mono {{ new Date(row.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
      el-table-column(label="" width="60")
        template(#default="{ row }")
          el-button(text circle size="small" type="danger" @click="removeCall(row.id)")
            Icon(name="ph:trash" size="14")

  //- Log Call Dialog
  el-dialog(v-model="showDialog" :title="$t('callLog.logCall') || 'Log Call'" width="500px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('callLog.contactName') || 'Contact Name'")
          el-input(v-model="form.contactName" placeholder="Client name")
        el-form-item(:label="$t('callLog.phone') || 'Phone'")
          el-input(v-model="form.phone" placeholder="+966...")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('callLog.direction') || 'Direction'")
          el-select(v-model="form.direction" class="w-full")
            el-option(:label="$t('callLog.outbound') || 'Outbound'" value="outbound")
            el-option(:label="$t('callLog.inbound') || 'Inbound'" value="inbound")
        el-form-item(:label="$t('callLog.outcome') || 'Outcome'")
          el-select(v-model="form.outcome" class="w-full")
            el-option(:label="$t('callLog.answered') || 'Answered'" value="answered")
            el-option(:label="$t('callLog.noAnswer') || 'No Answer'" value="no_answer")
            el-option(:label="$t('callLog.voicemail') || 'Voicemail'" value="voicemail")
            el-option(:label="$t('callLog.busy') || 'Busy'" value="busy")
            el-option(:label="$t('callLog.callback') || 'Callback'" value="callback")
      el-form-item(:label="$t('callLog.durationMin') || 'Duration (minutes)'")
        el-input-number(v-model="form.durationMin" :min="0" class="!w-full")
      el-form-item(:label="$t('callLog.notes') || 'Notes'")
        el-input(v-model="form.notes" type="textarea" :rows="3" placeholder="Call summary...")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="saveCall" style="border-radius: 12px;") {{ $t('common.save') || 'Save Call' }}
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useCallLog } from '~/composables/useCallLog';

definePageMeta({});

const { calls, stats, logCall, removeCall, fetchCalls, loading: callLoading } = useCallLog();
const showDialog = ref(false);
const saving = ref(false);
const form = reactive({
  contactName: '',
  phone: '',
  direction: 'outbound' as const,
  outcome: 'answered' as const,
  durationMin: 5,
  notes: ''
});

onMounted(() => {
  fetchCalls();
});

async function saveCall() {
  saving.value = true;
  try {
    const success = await logCall({
      contactName: form.contactName,
      phone: form.phone,
      direction: form.direction as any,
      outcome: form.outcome as any,
      duration: form.durationMin * 60,
      notes: form.notes
    });
    if (success) {
      Object.assign(form, {
        contactName: '',
        phone: '',
        direction: 'outbound',
        outcome: 'answered',
        durationMin: 5,
        notes: ''
      });
      showDialog.value = false;
      ElMessage.success('Call logged!');
    }
  } finally {
    saving.value = false;
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function outcomeType(
  o: string
): '' | 'success' | 'warning' | 'danger' | 'info' {
  return (
    {
      answered: 'success' as const,
      no_answer: 'danger' as const,
      voicemail: 'warning' as const,
      busy: 'info' as const,
      callback: '' as const
    }[o] || ''
  );
}
</script>
