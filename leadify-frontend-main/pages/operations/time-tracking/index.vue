<template lang="pug">
div
  ModuleHeader(
    :title="$t('timeTracking.title')"
    :subtitle="$t('timeTracking.subtitle')"
  )
    template(#actions)
      ExportButton(:data="entries" :columns="exportColumns" :filename="'time-tracking-export'" :title="$t('timeTracking.title')")
      el-button(v-if="!activeTimer" type="success" size="large" :loading="starting" @click="startTimer" class="!rounded-2xl")
        Icon(name="ph:play-bold" size="16" class="mr-1")
        span {{ $t('timeTracking.start') }}
      el-button(v-else type="danger" size="large" :loading="stopping" @click="stopTimer" class="!rounded-2xl")
        Icon(name="ph:stop-bold" size="16" class="mr-1")
        span {{ $t('timeTracking.stop') }}
      el-button(size="large" @click="showManualEntry = true" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        span {{ $t('timeTracking.manual') }}

  //- Active Timer Card
  .glass-card.p-6.mb-6.flex.items-center.gap-4.animate-entrance(v-if="activeTimer")
    .w-16.h-16.rounded-2xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.1)")
      Icon(name="ph:timer-bold" size="32" style="color: #ef4444")
    div
      .text-3xl.font-bold.font-mono(style="color: var(--text-primary)") {{ elapsedDisplay }}
      p.text-sm(style="color: var(--text-muted)") {{ activeTimer?.description || $t('timeTracking.currentSession') }}
    .ml-auto
      el-button(type="danger" size="large" :loading="stopping" @click="stopTimer" class="!rounded-2xl")
        Icon(name="ph:stop-bold" size="16" class="mr-1")
        span {{ $t('timeTracking.stop') }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    .px-6.mb-4
      .text-lg.font-bold(style="color: var(--text-primary)") {{ $t('timeTracking.entries') }}

    el-table(:data="entries" v-loading="loading" style="width: 100%")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('timeTracking.description')" min-width="200")
        template(#default="{ row }")
          .font-bold(style="color: var(--text-primary)") {{ row.description || '—' }}
          .text-xs(style="color: var(--text-muted)") {{ row.entityType ? `${row.entityType}: ${row.entityName || ''}` : '' }}
      el-table-column(:label="$t('timeTracking.date')" width="120")
        template(#default="{ row }")
          span {{ row.date || formatDate(row.startTime) }}
      el-table-column(:label="$t('timeTracking.startTime')" width="100")
        template(#default="{ row }")
          span {{ formatTime(row.startTime) }}
      el-table-column(:label="$t('timeTracking.endTime')" width="100")
        template(#default="{ row }")
          span {{ row.endTime ? formatTime(row.endTime) : '—' }}
      el-table-column(:label="$t('timeTracking.duration')" width="120")
        template(#default="{ row }")
          span.font-bold(style="color: #7849ff") {{ row.duration || calculateDuration(row.startTime, row.endTime) }}
      el-table-column(:label="$t('common.action')" width="80" fixed="right")
        template(#default="{ row }")
          el-popconfirm(:title="$t('common.confirmDelete')" @confirm="removeEntry(row.id)")
            template(#reference)
              el-button(text circle size="small")
                Icon(name="ph:trash-bold" size="16" style="color: var(--text-muted)")
      template(#empty)
        el-empty(:description="$t('common.noData')" image="/images/empty.png")

    .pagination.mt-5.flex.justify-center.px-6(v-if="pagination.totalPages > 1")
      el-pagination(background style="direction:ltr" :pager-count="4" v-model:current-page="currentPage" :page-size="20" layout="prev, pager, next" :total="pagination.totalItems" @current-change="loadEntries")

  //- Manual Entry Dialog
  el-dialog(v-model="showManualEntry" :title="$t('timeTracking.manual')" width="600px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('timeTracking.description')")
        el-input(v-model="manualForm.description")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('timeTracking.date')")
          el-date-picker(v-model="manualForm.date" type="date" class="w-full" value-format="YYYY-MM-DD")
        el-form-item(:label="$t('timeTracking.duration')")
          el-input-number(v-model="manualForm.hours" :min="0.25" :step="0.25" :precision="2" class="w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('timeTracking.entityType')")
          el-select(v-model="manualForm.entityType" clearable class="w-full")
            el-option(value="LEAD" :label="$t('common.lead')")
            el-option(value="DEAL" :label="$t('common.deal')")
            el-option(value="PROJECT" :label="$t('timeTracking.project')")
        el-form-item(:label="$t('timeTracking.entityName')")
          el-input(v-model="manualForm.entityName")
    template(#footer)
      el-button(@click="showManualEntry = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingManual" @click="submitManual" class="!rounded-2xl") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessage } from 'element-plus';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;

// Export columns
const exportColumns = [
  { prop: 'description', label: t('timeTracking.description') },
  { prop: 'date', label: t('timeTracking.date') },
  { prop: 'startTime', label: t('timeTracking.startTime') },
  { prop: 'endTime', label: t('timeTracking.endTime') },
  { prop: 'duration', label: t('timeTracking.duration') },
  { prop: 'entityType', label: t('timeTracking.entityType') }
];

const loading = ref(true);
const starting = ref(false);
const stopping = ref(false);
const savingManual = ref(false);
const entries = ref<Record<string, unknown>[]>([]);
const activeTimer = ref<Record<string, unknown> | null>(null);
const currentPage = ref(1);
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });
const showManualEntry = ref(false);
const elapsedSeconds = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const manualForm = reactive({ description: '', date: '', hours: 1, entityType: '', entityName: '' });

const elapsedDisplay = computed(() => {
  const h = Math.floor(elapsedSeconds.value / 3600);
  const m = Math.floor((elapsedSeconds.value % 3600) / 60);
  const s = elapsedSeconds.value % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const summaryStats = computed(() => {
  const totalHours = entries.value.reduce((sum, e) => {
    if (e.duration) {
      const parts = e.duration.split(':');
      return sum + (Number(parts[0]) || 0) + (Number(parts[1]) || 0) / 60;
    }
    return sum;
  }, 0);
  return [
    { label: t('timeTracking.totalEntries'), value: entries.value.length, icon: 'ph:clock-bold', color: '#7849ff' },
    { label: t('timeTracking.totalHours'), value: totalHours.toFixed(1) + 'h', icon: 'ph:timer-bold', color: '#22c55e' },
    {
      label: t('timeTracking.activeTimer'),
      value: activeTimer.value ? 'Running' : 'Stopped',
      icon: 'ph:play-circle-bold',
      color: activeTimer.value ? '#ef4444' : '#64748b'
    }
  ];
});

onMounted(async () => {
  await loadEntries();
  checkActiveTimer();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

async function loadEntries() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch(`time-tracking/entries?page=${currentPage.value}&limit=20`);
    if (success && body) {
      entries.value = body.docs || [];
      pagination.value = body.pagination || pagination.value;
    }
  } finally {
    loading.value = false;
  }
}

async function checkActiveTimer() {
  try {
    const { body, success } = await useApiFetch('time-tracking/running');
    if (success && body && body.id) {
      activeTimer.value = body;
      startElapsedCounter(body.startTime);
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

function startElapsedCounter(startTime: string) {
  const start = new Date(startTime).getTime();
  elapsedSeconds.value = Math.floor((Date.now() - start) / 1000);
  timerInterval = setInterval(() => {
    elapsedSeconds.value++;
  }, 1000);
}

async function startTimer() {
  starting.value = true;
  try {
    const { body, success } = await useApiFetch('time-tracking/start', 'POST');
    if (success && body) {
      activeTimer.value = body;
      startElapsedCounter(body.startTime);
      ElNotification({ type: 'success', title: t('common.success'), message: t('timeTracking.started') });
    }
  } finally {
    starting.value = false;
  }
}

async function stopTimer() {
  stopping.value = true;
  try {
    const { success } = await useApiFetch('time-tracking/stop', 'POST');
    if (success) {
      activeTimer.value = null;
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      elapsedSeconds.value = 0;
      await loadEntries();
      ElNotification({ type: 'success', title: t('common.success'), message: t('timeTracking.stopped') });
    }
  } finally {
    stopping.value = false;
  }
}

async function submitManual() {
  savingManual.value = true;
  try {
    const { success } = await useApiFetch('time-tracking', 'POST', manualForm);
    if (success) {
      showManualEntry.value = false;
      Object.assign(manualForm, { description: '', date: '', hours: 1, entityType: '', entityName: '' });
      await loadEntries();
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    }
  } finally {
    savingManual.value = false;
  }
}

async function removeEntry(id: number) {
  const { success } = await useApiFetch(`time-tracking/${id}`, 'DELETE');
  if (success) await loadEntries();
}

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString() : '—';
}
function formatTime(d: string) {
  return d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
}
function calculateDuration(start: string, end: string) {
  if (!start || !end) return '—';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}
</script>
