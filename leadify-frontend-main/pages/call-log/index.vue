<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 📞 Call Log
      p.text-sm.mt-1(style="color: var(--text-muted);") Track all phone calls with clients and prospects.
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:phone-plus" size="16" style="margin-right: 4px;")
      | Log Call

  //- Stats
  .grid.grid-cols-4.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total Calls
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.total }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Answered
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.answered }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Missed
      p.text-3xl.font-black.mt-1(style="color: #ef4444;") {{ stats.missed }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Talk Time
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ formatDuration(stats.totalDuration) }}

  //- Table
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    el-table(:data="calls" style="width: 100%" empty-text="No calls logged yet.")
      el-table-column(label="Direction" width="100")
        template(#default="{ row }")
          el-tag(:type="row.direction === 'inbound' ? 'success' : 'primary'" size="small" round effect="plain")
            | {{ row.direction === 'inbound' ? '📥 In' : '📤 Out' }}
      el-table-column(label="Contact" min-width="200")
        template(#default="{ row }")
          p.text-sm.font-bold {{ row.contactName }}
          p.text-xs.text-gray-400 {{ row.phone }}
      el-table-column(label="Outcome" width="130")
        template(#default="{ row }")
          el-tag(:type="outcomeType(row.outcome)" size="small" round) {{ row.outcome.replace('_', ' ') }}
      el-table-column(label="Duration" width="100")
        template(#default="{ row }")
          span.font-mono.text-sm {{ formatDuration(row.duration) }}
      el-table-column(label="Notes" min-width="200")
        template(#default="{ row }")
          p.text-xs.text-gray-500.line-clamp-2 {{ row.notes || '—' }}
      el-table-column(label="Date" width="150")
        template(#default="{ row }")
          span.text-xs.font-mono {{ new Date(row.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
      el-table-column(label="" width="60")
        template(#default="{ row }")
          el-button(text circle size="small" type="danger" @click="removeCall(row.id)")
            Icon(name="ph:trash" size="14")

  //- Log Call Dialog
  el-dialog(v-model="showDialog" title="Log Call" width="500px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Contact Name")
          el-input(v-model="form.contactName" placeholder="Client name")
        el-form-item(label="Phone")
          el-input(v-model="form.phone" placeholder="+966...")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Direction")
          el-select(v-model="form.direction" class="w-full")
            el-option(label="📤 Outbound" value="outbound")
            el-option(label="📥 Inbound" value="inbound")
        el-form-item(label="Outcome")
          el-select(v-model="form.outcome" class="w-full")
            el-option(label="✅ Answered" value="answered")
            el-option(label="❌ No Answer" value="no_answer")
            el-option(label="📧 Voicemail" value="voicemail")
            el-option(label="📵 Busy" value="busy")
            el-option(label="🔄 Callback" value="callback")
      el-form-item(label="Duration (minutes)")
        el-input-number(v-model="form.durationMin" :min="0" class="!w-full")
      el-form-item(label="Notes")
        el-input(v-model="form.notes" type="textarea" :rows="3" placeholder="Call summary...")
    template(#footer)
      el-button(@click="showDialog = false") Cancel
      el-button(type="primary" @click="saveCall" style="border-radius: 12px;") Save Call
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useCallLog } from '~/composables/useCallLog';

definePageMeta({});

const { calls, stats, logCall, removeCall } = useCallLog();
const showDialog = ref(false);
const form = reactive({ contactName: '', phone: '', direction: 'outbound' as const, outcome: 'answered' as const, durationMin: 5, notes: '' });

function saveCall() {
  logCall({ contactName: form.contactName, phone: form.phone, direction: form.direction as any, outcome: form.outcome as any, duration: form.durationMin * 60, notes: form.notes });
  Object.assign(form, { contactName: '', phone: '', direction: 'outbound', outcome: 'answered', durationMin: 5, notes: '' });
  showDialog.value = false;
  ElMessage.success('Call logged!');
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function outcomeType(o: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  return { answered: 'success' as const, no_answer: 'danger' as const, voicemail: 'warning' as const, busy: 'info' as const, callback: '' as const }[o] || '';
}
</script>
