<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('callLog.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('callLog.subtitle') }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:phone-plus" size="16" style="margin-right: 4px;")
      | {{ $t('callLog.logCall') }}

  //- Stats
  .grid.grid-cols-2.gap-4.mb-8(class="md:grid-cols-4")
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('callLog.totalCalls') }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.total }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('callLog.answered') }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.answered }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('callLog.missed') }}
      p.text-3xl.font-black.mt-1(style="color: #ef4444;") {{ stats.missed }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('callLog.talkTime') }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ formatDuration(stats.totalDuration) }}

  //- Analytics Charts
  .grid.grid-cols-1.gap-4.mb-8(class="lg:grid-cols-2" v-if="showAnalytics")
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        .flex.items-center.justify-between
          span.font-bold {{ $t('callLog.durationDistribution') }}
      div(ref="durationChartRef" style="width: 100%; height: 300px;")

    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        .flex.items-center.justify-between
          span.font-bold {{ $t('callLog.callsByOutcome') }}
      div(ref="outcomeChartRef" style="width: 100%; height: 300px;")

    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        .flex.items-center.justify-between
          span.font-bold {{ $t('callLog.callsByHour') }}
      div(ref="hourChartRef" style="width: 100%; height: 300px;")

    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        .flex.items-center.justify-between
          span.font-bold {{ $t('callLog.volumeTrend') }}
      div(ref="trendChartRef" style="width: 100%; height: 300px;")

  //- Toggle Analytics Button
  .mb-4
    el-button(@click="showAnalytics = !showAnalytics" size="small")
      Icon(:name="showAnalytics ? 'ph:chart-line-down' : 'ph:chart-line-up'" size="16" style="margin-right: 4px;")
      | {{ showAnalytics ? $t('callLog.hideAnalytics') : $t('callLog.showAnalytics') }}

  //- Table
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    el-table(:data="calls" v-loading="callLoading" style="width: 100%" :empty-text="emptyText")
      el-table-column(:label="$t('callLog.direction')" width="100")
        template(#default="{ row }")
          el-tag(:type="row.direction === 'inbound' ? 'success' : 'primary'" size="small" round effect="plain")
            | {{ row.direction === 'inbound' ? 'In' : 'Out' }}
      el-table-column(:label="$t('callLog.contact')" min-width="200")
        template(#default="{ row }")
          .flex.items-center.gap-2
            div
              p.text-sm.font-bold {{ row.contactName }}
              a.text-xs.text-blue-500.cursor-pointer(
                :href="'tel:' + row.phone"
                @click.prevent="handleDial(row.phone)"
                class="hover:underline"
              )
                Icon(name="ph:phone" size="12" style="margin-right: 2px; display: inline-block; vertical-align: middle;")
                | {{ row.phone }}
      el-table-column(:label="$t('callLog.disposition')" width="140")
        template(#default="{ row }")
          el-tag(:type="dispositionType(row.disposition || row.outcome)" size="small" round v-if="row.disposition")
            | {{ $t('callLog.dispositions.' + (row.disposition || row.outcome)) }}
          span.text-xs.text-gray-400(v-else) —
      el-table-column(:label="$t('callLog.duration')" width="100")
        template(#default="{ row }")
          span.font-mono.text-sm {{ formatDuration(row.duration) }}
      el-table-column(:label="$t('callLog.recording')" width="100" align="center")
        template(#default="{ row }")
          el-button(
            v-if="row.recordingUrl"
            text
            circle
            size="small"
            type="primary"
            @click="playRecording(row)"
          )
            Icon(name="ph:play-circle" size="18")
          span.text-xs.text-gray-400(v-else) —
      el-table-column(:label="$t('callLog.notes')" min-width="200")
        template(#default="{ row }")
          p.text-xs.text-gray-500.line-clamp-2 {{ row.notes || '—' }}
      el-table-column(:label="$t('common.date')" width="150")
        template(#default="{ row }")
          span.text-xs.font-mono {{ formatDate(row.createdAt) }}
      el-table-column(label="" width="110")
        template(#default="{ row }")
          el-button(text circle size="small" type="info" @click="viewDetails(row)" :title="$t('common.view')")
            Icon(name="ph:eye" size="14")
          el-button(text circle size="small" type="danger" @click="removeCall(row.id)" :title="$t('common.delete')")
            Icon(name="ph:trash" size="14")

  //- Log Call Dialog
  el-dialog(v-model="showDialog" :title="$t('callLog.logCall')" width="600px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('callLog.contactName')")
          el-input(v-model="form.contactName" :placeholder="$t('callLog.contactNamePlaceholder')")
        el-form-item(:label="$t('callLog.phone')")
          el-input(v-model="form.phone" placeholder="+966...")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('callLog.direction')")
          el-select(v-model="form.direction" class="w-full")
            el-option(:label="$t('callLog.outbound')" value="outbound")
            el-option(:label="$t('callLog.inbound')" value="inbound")
        el-form-item(:label="$t('callLog.outcome')")
          el-select(v-model="form.outcome" class="w-full")
            el-option(:label="$t('callLog.outcomes.answered')" value="answered")
            el-option(:label="$t('callLog.outcomes.noAnswer')" value="no_answer")
            el-option(:label="$t('callLog.outcomes.voicemail')" value="voicemail")
            el-option(:label="$t('callLog.outcomes.busy')" value="busy")
            el-option(:label="$t('callLog.outcomes.callback')" value="callback")
      el-form-item(:label="$t('callLog.disposition')")
        el-select(v-model="form.disposition" class="w-full" :placeholder="$t('callLog.selectDisposition')")
          el-option(:label="$t('callLog.dispositions.interested')" value="interested")
          el-option(:label="$t('callLog.dispositions.not_interested')" value="not_interested")
          el-option(:label="$t('callLog.dispositions.follow_up')" value="follow_up")
          el-option(:label="$t('callLog.dispositions.voicemail')" value="voicemail")
          el-option(:label="$t('callLog.dispositions.no_answer')" value="no_answer")
          el-option(:label="$t('callLog.dispositions.callback')" value="callback")
      el-form-item(:label="$t('callLog.durationMin')")
        el-input-number(v-model="form.durationMin" :min="0" class="!w-full")
      el-form-item(:label="$t('callLog.recordingUrl')")
        el-input(v-model="form.recordingUrl" :placeholder="$t('callLog.recordingUrlPlaceholder')")
      el-form-item(:label="$t('callLog.transcription')")
        el-input(v-model="form.transcription" type="textarea" :rows="3" :placeholder="$t('callLog.transcriptionPlaceholder')")
      el-form-item(:label="$t('callLog.notes')")
        el-input(v-model="form.notes" type="textarea" :rows="3" :placeholder="$t('callLog.notesPlaceholder')")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveCall" style="border-radius: 12px;") {{ $t('common.save') }}

  //- Call Details Dialog
  el-dialog(v-model="showDetailsDialog" :title="$t('callLog.callDetails')" width="700px")
    div(v-if="selectedCall")
      .mb-4
        .grid.grid-cols-2.gap-4
          div
            p.text-xs.text-gray-500.mb-1 {{ $t('callLog.contact') }}
            p.text-sm.font-bold {{ selectedCall.contactName }}
            a.text-xs.text-blue-500.cursor-pointer(
              :href="'tel:' + selectedCall.phone"
              @click.prevent="handleDial(selectedCall.phone)"
              class="hover:underline"
            )
              Icon(name="ph:phone" size="12" style="margin-right: 2px; display: inline-block; vertical-align: middle;")
              | {{ selectedCall.phone }}
          div
            p.text-xs.text-gray-500.mb-1 {{ $t('callLog.direction') }}
            el-tag(:type="selectedCall.direction === 'inbound' ? 'success' : 'primary'" size="small" round)
              | {{ selectedCall.direction === 'inbound' ? $t('callLog.inbound') : $t('callLog.outbound') }}
          div
            p.text-xs.text-gray-500.mb-1 {{ $t('callLog.duration') }}
            p.text-sm.font-mono {{ formatDuration(selectedCall.duration) }}
          div
            p.text-xs.text-gray-500.mb-1 {{ $t('callLog.disposition') }}
            el-tag(:type="dispositionType(selectedCall.disposition || selectedCall.outcome)" size="small" round v-if="selectedCall.disposition")
              | {{ $t('callLog.dispositions.' + (selectedCall.disposition || selectedCall.outcome)) }}
            span.text-xs.text-gray-400(v-else) —

      div(v-if="selectedCall.recordingUrl" class="mb-4")
        p.text-xs.text-gray-500.mb-2 {{ $t('callLog.recording') }}
        audio(controls class="w-full")
          source(:src="selectedCall.recordingUrl" type="audio/mpeg")

      div(v-if="selectedCall.transcription" class="mb-4")
        p.text-xs.text-gray-500.mb-2 {{ $t('callLog.transcription') }}
        .p-4.rounded-xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-sm.whitespace-pre-wrap {{ selectedCall.transcription }}

      div(v-if="selectedCall.notes")
        p.text-xs.text-gray-500.mb-2 {{ $t('callLog.notes') }}
        .p-4.rounded-xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-sm.whitespace-pre-wrap {{ selectedCall.notes }}
    template(#footer)
      el-button(@click="showDetailsDialog = false") {{ $t('common.close') }}
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue';
import { useCallLog } from '~/composables/useCallLog';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts';

definePageMeta({});

const { t: $t } = useI18n();

const { calls, stats, logCall, removeCall, fetchCalls, fetchAnalytics, analytics, loading: callLoading } = useCallLog();
const showDialog = ref(false);
const showDetailsDialog = ref(false);
const showAnalytics = ref(false);
const saving = ref(false);
const selectedCall = ref<any>(null);
const form = reactive({
  contactName: '',
  phone: '',
  direction: 'outbound' as const,
  outcome: 'answered' as const,
  disposition: '',
  durationMin: 5,
  recordingUrl: '',
  transcription: '',
  notes: ''
});

const durationChartRef = ref<HTMLElement>();
const outcomeChartRef = ref<HTMLElement>();
const hourChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();

const emptyText = computed(() => $t('common.noData'));

onMounted(() => {
  fetchCalls();
});

watch(showAnalytics, async (show) => {
  if (show) {
    await fetchAnalytics();
    await nextTick();
    renderCharts();
  }
});

async function saveCall() {
  saving.value = true;
  try {
    const success = await logCall({
      contactName: form.contactName,
      phone: form.phone,
      direction: form.direction as any,
      outcome: form.outcome as any,
      disposition: form.disposition,
      duration: form.durationMin * 60,
      recordingUrl: form.recordingUrl || undefined,
      transcription: form.transcription || undefined,
      notes: form.notes
    });
    if (success) {
      Object.assign(form, {
        contactName: '',
        phone: '',
        direction: 'outbound',
        outcome: 'answered',
        disposition: '',
        durationMin: 5,
        recordingUrl: '',
        transcription: '',
        notes: ''
      });
      showDialog.value = false;
      ElMessage.success($t('callLog.callLogged'));
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

function formatDate(date: string): string {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function dispositionType(disposition: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    interested: 'success',
    not_interested: 'danger',
    follow_up: 'warning',
    voicemail: 'info',
    no_answer: 'danger',
    callback: 'warning',
    answered: 'success',
    busy: 'info'
  };
  return map[disposition] || '';
}

function handleDial(phone: string) {
  if (confirm($t('callLog.confirmDial', { phone }) || `Dial ${phone}?`)) {
    window.location.href = `tel:${phone}`;
  }
}

function viewDetails(call: any) {
  selectedCall.value = call;
  showDetailsDialog.value = true;
}

function playRecording(call: any) {
  selectedCall.value = call;
  showDetailsDialog.value = true;
}

function renderCharts() {
  if (!analytics.value) return;

  // Duration Distribution Chart
  if (durationChartRef.value) {
    const durationChart = echarts.init(durationChartRef.value);
    const durationData = analytics.value.durationDistribution || {};
    durationChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: Object.keys(durationData).map(k => `${k} min`)
      },
      yAxis: { type: 'value' },
      series: [{
        data: Object.values(durationData),
        type: 'bar',
        itemStyle: { color: '#7c3aed' }
      }]
    });
  }

  // Calls by Outcome Pie Chart
  if (outcomeChartRef.value) {
    const outcomeChart = echarts.init(outcomeChartRef.value);
    const outcomeData = analytics.value.byOutcome || {};
    outcomeChart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: Object.entries(outcomeData).map(([name, value]) => ({ name, value })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    });
  }

  // Calls by Hour Bar Chart
  if (hourChartRef.value) {
    const hourChart = echarts.init(hourChartRef.value);
    const hourData = analytics.value.byHour || {};
    hourChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: Object.keys(hourData).map(h => `${h}:00`)
      },
      yAxis: { type: 'value' },
      series: [{
        data: Object.values(hourData),
        type: 'bar',
        itemStyle: { color: '#22c55e' }
      }]
    });
  }

  // Volume Trend Line Chart
  if (trendChartRef.value) {
    const trendChart = echarts.init(trendChartRef.value);
    const trendData = analytics.value.dailyVolume || {};
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: Object.keys(trendData)
      },
      yAxis: { type: 'value' },
      series: [{
        data: Object.values(trendData),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#3b82f6' }
      }]
    });
  }
}
</script>
