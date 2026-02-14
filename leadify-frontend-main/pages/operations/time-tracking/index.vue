<template lang="pug">
.time-tracking-page.p-8
  .flex.justify-between.items-start.mb-8
    div
      h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('timeTracking.title') }}
      p(style="color: var(--text-muted)") {{ $t('timeTracking.subtitle') }}
    .flex.gap-3
      //- Active Timer
      .glass-card.px-4.py-3.flex.items-center.gap-3(v-if="runningTimer")
        .w-3.h-3.rounded-full.bg-green-500.animate-pulse
        span.font-mono.text-lg.font-bold(style="color: var(--text-primary)") {{ elapsedTime }}
        span.text-sm(style="color: var(--text-muted)") {{ runningTimer.entityName || runningTimer.description || $t('timeTracking.noDescription') }}
        el-button(type="danger" size="small" @click="handleStop" :loading="stopping" class="!rounded-lg")
          Icon(name="ph:stop-bold" size="16" aria-label="Stop timer")

      el-button(v-else type="primary" @click="showStartDialog = true" class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
        Icon(name="ph:play-bold" size="16" aria-hidden="true")
        span.ml-2 {{ $t('timeTracking.startTimer') }}

      el-button(@click="showManualDialog = true" class="!rounded-xl")
        Icon(name="ph:plus-bold" size="16" aria-hidden="true")
        span.ml-2 {{ $t('timeTracking.addManual') }}

  //- Weekly Summary
  .grid.grid-cols-1.gap-6.mb-8(class="md:grid-cols-7")
    .glass-card.p-4.text-center(v-for="(seconds, day) in weeklyData.dailyTotals" :key="day")
      p.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ formatDay(day) }}
      p.text-lg.font-bold(style="color: var(--text-primary)") {{ formatDuration(seconds) }}

  //- Total
  .glass-card.p-4.mb-8.flex.items-center.justify-between
    span.font-medium(style="color: var(--text-primary)") {{ $t('timeTracking.weekTotal') }}
    span.text-2xl.font-bold(style="color: #7849ff") {{ formatDuration(weeklyData.totalSeconds) }}

  //- Entries Table
  .glass-card.p-6
    h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('timeTracking.recentEntries') }}

    el-table(:data="entries" style="width: 100%" v-loading="loading")
      el-table-column(:label="$t('timeTracking.date')" width="120")
        template(#default="{ row }")
          span {{ new Date(row.startTime).toLocaleDateString() }}
      el-table-column(:label="$t('timeTracking.description')" prop="description" min-width="200")
      el-table-column(:label="$t('timeTracking.entity')" width="150")
        template(#default="{ row }")
          el-tag(v-if="row.entityType" size="small" effect="plain") {{ row.entityType }}
          span.ml-2.text-sm {{ row.entityName || '' }}
      el-table-column(:label="$t('timeTracking.start')" width="100")
        template(#default="{ row }")
          span {{ new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      el-table-column(:label="$t('timeTracking.end')" width="100")
        template(#default="{ row }")
          span(v-if="row.endTime") {{ new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          el-tag(v-else type="success" size="small") {{ $t('timeTracking.running') }}
      el-table-column(:label="$t('timeTracking.duration')" width="120")
        template(#default="{ row }")
          span.font-mono {{ row.duration ? formatDuration(row.duration) : '—' }}
      el-table-column(:label="$t('common.actions')" width="80" align="center")
        template(#default="{ row }")
          el-button(v-if="row.endTime" link @click="removeEntry(row.id)")
            Icon(name="ph:trash" size="16" class="text-red-400" aria-label="Delete")

    .flex.justify-center.mt-4(v-if="total > limit")
      el-pagination(
        v-model:current-page="page"
        :page-size="limit"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadEntries"
      )

  //- Start Timer Dialog
  el-dialog(v-model="showStartDialog" :title="$t('timeTracking.startTimer')" width="420px")
    .space-y-4
      el-input(v-model="timerDesc" :placeholder="$t('timeTracking.whatWorking')")
      el-select(v-model="timerEntityType" :placeholder="$t('timeTracking.entityType')" clearable class="w-full")
        el-option(value="LEAD" :label="$t('navigation.leads')")
        el-option(value="DEAL" :label="$t('navigation.deals')")
        el-option(value="PROJECT" :label="$t('navigation.projects')")
      el-input(v-if="timerEntityType" v-model="timerEntityName" :placeholder="$t('timeTracking.entityName')")
    template(#footer)
      el-button(@click="showStartDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="starting" @click="handleStart" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('timeTracking.start') }}

  //- Manual Entry Dialog
  el-dialog(v-model="showManualDialog" :title="$t('timeTracking.addManual')" width="480px")
    .space-y-4
      el-input(v-model="manualData.description" :placeholder="$t('timeTracking.description')")
      .grid.grid-cols-2.gap-4
        .form-group
          label.block.text-sm.font-medium.mb-2 {{ $t('timeTracking.start') }}
          el-date-picker(v-model="manualData.startTime" type="datetime" class="w-full")
        .form-group
          label.block.text-sm.font-medium.mb-2 {{ $t('timeTracking.end') }}
          el-date-picker(v-model="manualData.endTime" type="datetime" class="w-full")
    template(#footer)
      el-button(@click="showManualDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingManual" @click="handleManualSave" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { TimeEntry } from '~/composables/useTimeTracking';
import {
  startTimer, stopTimer, getRunningTimer, fetchTimeEntries,
  createManualEntry, deleteTimeEntry, getWeeklySummary, formatDuration
} from '~/composables/useTimeTracking';

definePageMeta({ title: 'Time Tracking' });

const entries = ref<TimeEntry[]>([]);
const runningTimer = ref<TimeEntry | null>(null);
const weeklyData = ref<{ dailyTotals: Record<string, number>; totalSeconds: number }>({ dailyTotals: {}, totalSeconds: 0 });
const loading = ref(true);
const starting = ref(false);
const stopping = ref(false);
const savingManual = ref(false);
const showStartDialog = ref(false);
const showManualDialog = ref(false);
const page = ref(1);
const limit = 20;
const total = ref(0);
const elapsedTime = ref('0:00:00');
let timerInterval: ReturnType<typeof setInterval> | null = null;

const timerDesc = ref('');
const timerEntityType = ref('');
const timerEntityName = ref('');
const manualData = ref({ description: '', startTime: null as any, endTime: null as any });

onMounted(async () => {
  await Promise.all([loadEntries(), loadRunning(), loadWeekly()]);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

async function loadEntries() {
  loading.value = true;
  try {
    const result = await fetchTimeEntries({ page: page.value, limit });
    entries.value = result.entries;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

async function loadRunning() {
  const timer = await getRunningTimer();
  // Only set if it has a valid startTime
  if (timer?.startTime) {
    runningTimer.value = timer;
    startElapsedTimer();
  }
}

async function loadWeekly() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  weeklyData.value = await getWeeklySummary(monday.toISOString().split('T')[0]);
}

function startElapsedTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!runningTimer.value) return;
    const diff = Math.floor((Date.now() - new Date(runningTimer.value.startTime).getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    elapsedTime.value = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

async function handleStart() {
  starting.value = true;
  try {
    await startTimer({
      description: timerDesc.value,
      entityType: timerEntityType.value || undefined,
      entityName: timerEntityName.value || undefined
    });
    showStartDialog.value = false;
    timerDesc.value = '';
    timerEntityType.value = '';
    timerEntityName.value = '';
    await loadRunning();
    ElNotification({ type: 'success', title: 'Started', message: 'Timer started' });
  } finally {
    starting.value = false;
  }
}

async function handleStop() {
  stopping.value = true;
  try {
    await stopTimer();
    if (timerInterval) clearInterval(timerInterval);
    runningTimer.value = null;
    elapsedTime.value = '0:00:00';
    await Promise.all([loadEntries(), loadWeekly()]);
    ElNotification({ type: 'success', title: 'Stopped', message: 'Timer stopped' });
  } finally {
    stopping.value = false;
  }
}

async function handleManualSave() {
  if (!manualData.value.startTime || !manualData.value.endTime) {
    ElNotification({ type: 'warning', title: 'Warning', message: 'Start and end time are required' });
    return;
  }
  savingManual.value = true;
  try {
    await createManualEntry({
      description: manualData.value.description,
      startTime: new Date(manualData.value.startTime).toISOString(),
      endTime: new Date(manualData.value.endTime).toISOString()
    });
    showManualDialog.value = false;
    manualData.value = { description: '', startTime: null, endTime: null };
    await Promise.all([loadEntries(), loadWeekly()]);
    ElNotification({ type: 'success', title: 'Added', message: 'Time entry added' });
  } finally {
    savingManual.value = false;
  }
}

async function removeEntry(id: string) {
  await deleteTimeEntry(id);
  await Promise.all([loadEntries(), loadWeekly()]);
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], { weekday: 'short' });
}
</script>

<style lang="scss" scoped>
.time-tracking-page {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
