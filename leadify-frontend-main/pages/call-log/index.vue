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
          el-button(text size="small" @click="drillDownDuration")
            Icon(name="ph:arrow-square-out" size="14")
      div(ref="durationChartRef" style="width: 100%; height: 300px;" @click="drillDownDuration")

    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        .flex.items-center.justify-between
          span.font-bold {{ $t('callLog.callsByOutcome') }}
          el-button(text size="small" @click="drillDownOutcome")
            Icon(name="ph:arrow-square-out" size="14")
      div(ref="outcomeChartRef" style="width: 100%; height: 300px;" @click="drillDownOutcome")

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

  //- Advanced Filters & Bulk Actions
  el-card.rounded-2xl.mb-4(shadow="never" style="border: 1px solid var(--border-default);")
    .p-4
      .flex.items-center.justify-between.flex-wrap.gap-4
        .flex.items-center.gap-2.flex-wrap
          el-select(v-model="filters.outcome" :placeholder="$t('callLog.filterByOutcome')" clearable style="width: 160px;" size="small")
            el-option(:label="$t('common.all')" value="")
            el-option(v-for="opt in ['answered', 'no_answer', 'voicemail', 'busy', 'callback']" :key="opt" :label="$t('callLog.outcomes.' + opt)" :value="opt")
          el-select(v-model="filters.disposition" :placeholder="$t('callLog.filterByDisposition')" clearable style="width: 180px;" size="small")
            el-option(:label="$t('common.all')" value="")
            el-option(v-for="disp in ['interested', 'not_interested', 'follow_up', 'voicemail', 'no_answer', 'callback']" :key="disp" :label="$t('callLog.dispositions.' + disp)" :value="disp")
          el-select(v-model="filters.agent" :placeholder="$t('callLog.filterByAgent')" clearable filterable style="width: 160px;" size="small")
            el-option(:label="$t('common.all')" value="")
            el-option(v-for="agent in availableAgents" :key="agent.id" :label="agent.name" :value="agent.id")
          el-date-picker(
            v-model="filters.dateRange"
            type="daterange"
            :placeholder="$t('callLog.selectDateRange')"
            size="small"
            style="width: 240px;"
            :start-placeholder="$t('callLog.startDate')"
            :end-placeholder="$t('callLog.endDate')"
          )
          .flex.items-center.gap-2
            span.text-xs(style="color: var(--text-muted);") {{ $t('callLog.duration') }}:
            el-input-number(v-model="filters.durationMin" :min="0" :placeholder="$t('callLog.min')" size="small" style="width: 80px;")
            span.text-xs(style="color: var(--text-muted);") -
            el-input-number(v-model="filters.durationMax" :min="0" :placeholder="$t('callLog.max')" size="small" style="width: 80px;")
          el-input(v-model="filters.search" :placeholder="$t('callLog.searchCalls')" clearable size="small" style="width: 200px;")
            template(#prefix)
              Icon(name="ph:magnifying-glass" size="14")
          el-button(size="small" @click="applyFilters")
            Icon(name="ph:funnel" size="14" style="margin-right: 4px;")
            | {{ $t('callLog.applyFilters') }}
          el-button(size="small" @click="clearFilters" v-if="hasActiveFilters")
            Icon(name="ph:x" size="14" style="margin-right: 4px;")
            | {{ $t('callLog.clearFilters') }}
        .flex.items-center.gap-2(v-if="selectedCalls.length > 0")
          el-tag(type="info" size="small") {{ selectedCalls.length }} {{ $t('callLog.selected') }}
          el-button(size="small" type="primary" @click="showBulkReassignDialog = true")
            Icon(name="ph:user-switch" size="14" style="margin-right: 4px;")
            | {{ $t('callLog.bulkReassign') }}
          el-button(size="small" type="success" @click="bulkExport")
            Icon(name="ph:download" size="14" style="margin-right: 4px;")
            | {{ $t('callLog.bulkExport') }}
          el-button(size="small" type="danger" @click="bulkDelete")
            Icon(name="ph:trash" size="14" style="margin-right: 4px;")
            | {{ $t('callLog.bulkDelete') }}

  //- Tags Section
  el-card.rounded-2xl.mb-4(shadow="never" style="border: 1px solid var(--border-default);" v-if="showTagsSection")
    .p-4
      .flex.items-center.justify-between.mb-3
        h3.text-sm.font-bold(style="color: var(--text-primary);") {{ $t('callLog.callTags') }}
        el-button(size="small" @click="showAddTagDialog = true")
          Icon(name="ph:tag" size="14" style="margin-right: 4px;")
          | {{ $t('callLog.addTag') }}
      .flex.flex-wrap.gap-2
        el-tag(
          v-for="tag in availableTags"
          :key="tag.id"
          :type="tag.color"
          size="small"
          closable
          @close="removeTag(tag.id)"
          @click="filterByTag(tag)"
          class="cursor-pointer"
        )
          | {{ tag.name }} ({{ tag.count }})

  //- Table
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    el-table(
      :data="filteredCalls"
      v-loading="callLoading"
      style="width: 100%"
      :empty-text="emptyText"
      @selection-change="handleSelectionChange"
    )
      el-table-column(type="selection" width="55")
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
      el-table-column(:label="$t('callLog.tags')" width="180")
        template(#default="{ row }")
          .flex.flex-wrap.gap-1
            el-tag(v-for="tag in row.tags" :key="tag.id" :type="tag.color" size="small" effect="plain") {{ tag.name }}
            el-button(text circle size="small" @click.stop="addTagToCall(row)")
              Icon(name="ph:tag" size="12")
      el-table-column(:label="$t('callLog.qualityScore')" width="120" align="center")
        template(#default="{ row }")
          .flex.items-center.gap-1.justify-center(v-if="row.qualityScore !== null && row.qualityScore !== undefined")
            el-rate(v-model="row.qualityScore" disabled size="small" :max="5")
            span.text-xs.font-mono {{ row.qualityScore }}/5
          el-button(v-else text circle size="small" type="primary" @click.stop="rateCallQuality(row)")
            Icon(name="ph:star" size="14")
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

  //- Add Tag Dialog
  el-dialog(v-model="showAddTagDialog" :title="$t('callLog.addTags')" width="500px")
    el-form(label-position="top")
      el-form-item(:label="$t('callLog.selectTags')")
        el-select(v-model="form.tags" multiple class="w-full" :placeholder="$t('callLog.selectTagsPlaceholder')")
          el-option(v-for="tag in availableTags" :key="tag.id" :label="tag.name" :value="tag.id")
            el-tag(:type="tag.color" size="small" effect="plain") {{ tag.name }}
    template(#footer)
      el-button(@click="showAddTagDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveCallTags") {{ $t('common.save') }}

  //- Bulk Reassign Dialog
  el-dialog(v-model="showBulkReassignDialog" :title="$t('callLog.bulkReassign')" width="450px")
    el-form(label-position="top")
      el-form-item(:label="$t('callLog.assignTo')")
        el-select(v-model="bulkReassignForm.agentId" class="w-full" :placeholder="$t('callLog.selectAgent')")
          el-option(v-for="agent in availableAgents" :key="agent.id" :label="agent.name" :value="agent.id")
      p.text-sm.text-gray-500.mt-2
        | {{ $t('callLog.reassignConfirmMsg', { count: selectedCalls.length }) }}
    template(#footer)
      el-button(@click="showBulkReassignDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="bulkReassign") {{ $t('callLog.reassign') }}

  //- Quality Rating Dialog
  el-dialog(v-model="showQualityRatingDialog" :title="$t('callLog.rateCallQuality')" width="500px")
    el-form(label-position="top" v-if="callForRating")
      .mb-4
        p.text-xs.text-gray-500.mb-1 {{ $t('callLog.contact') }}
        p.text-sm.font-bold {{ callForRating.contactName }} - {{ callForRating.phone }}
      el-form-item(:label="$t('callLog.qualityScore')")
        .flex.items-center.gap-3
          el-rate(v-model="qualityRatingForm.score" :max="5" size="large" show-text)
          span.text-sm.font-mono {{ qualityRatingForm.score }}/5
      el-form-item(:label="$t('callLog.qualityNotes')")
        el-input(v-model="qualityRatingForm.notes" type="textarea" :rows="3" :placeholder="$t('callLog.qualityNotesPlaceholder')")
    template(#footer)
      el-button(@click="showQualityRatingDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveQualityRating") {{ $t('common.save') }}
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts/core';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useCallLog } from '~/composables/useCallLog';

definePageMeta({});

const { t: $t } = useI18n();

const { calls, stats, logCall, removeCall, fetchCalls, fetchAnalytics, analytics, loading: callLoading } = useCallLog();
const showDialog = ref(false);
const showDetailsDialog = ref(false);
const showAnalytics = ref(false);
const showTagsSection = ref(true);
const showAddTagDialog = ref(false);
const showBulkReassignDialog = ref(false);
const showQualityRatingDialog = ref(false);
const saving = ref(false);
const selectedCall = ref<Record<string, unknown> | null>(null);
const selectedCalls = ref<Record<string, unknown>[]>([]);
const callForRating = ref<Record<string, unknown> | null>(null);

const form = reactive({
  contactName: '',
  phone: '',
  direction: 'outbound' as const,
  outcome: 'answered' as const,
  disposition: '',
  durationMin: 5,
  recordingUrl: '',
  transcription: '',
  notes: '',
  tags: [] as number[],
  qualityScore: 0
});

const filters = reactive({
  outcome: '',
  disposition: '',
  agent: '',
  dateRange: null as unknown,
  durationMin: null as number | null,
  durationMax: null as number | null,
  search: '',
  tagId: null as number | null
});

const newTag = reactive({
  name: '',
  color: 'primary'
});

const bulkReassignForm = reactive({
  agentId: null as number | null
});

const qualityRatingForm = reactive({
  score: 5,
  notes: ''
});

const availableTags = ref<Record<string, unknown>[]>([
  { id: 1, name: 'Hot Lead', color: 'danger', count: 12 },
  { id: 2, name: 'Follow-up', color: 'warning', count: 8 },
  { id: 3, name: 'Qualified', color: 'success', count: 15 },
  { id: 4, name: 'Cold Call', color: 'info', count: 20 }
]);

const availableAgents = ref<Record<string, unknown>[]>([]);

const durationChartRef = ref<HTMLElement>();
const outcomeChartRef = ref<HTMLElement>();
const hourChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();

const emptyText = computed(() => $t('common.noData'));

const filteredCalls = computed(() => {
  let result = calls.value;

  if (filters.outcome) {
    result = result.filter((c) => c.outcome === filters.outcome);
  }

  if (filters.disposition) {
    result = result.filter((c) => c.disposition === filters.disposition);
  }

  if (filters.agent) {
    result = result.filter((c) => c.agentId === filters.agent);
  }

  if (filters.dateRange && filters.dateRange.length === 2) {
    const [start, end] = filters.dateRange;
    result = result.filter((c) => {
      const callDate = new Date(c.createdAt);
      return callDate >= start && callDate <= end;
    });
  }

  if (filters.durationMin !== null) {
    result = result.filter((c) => c.duration >= filters.durationMin! * 60);
  }

  if (filters.durationMax !== null) {
    result = result.filter((c) => c.duration <= filters.durationMax! * 60);
  }

  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      (c: unknown) => c.contactName?.toLowerCase().includes(query) || c.phone?.toLowerCase().includes(query) || c.notes?.toLowerCase().includes(query)
    );
  }

  if (filters.tagId) {
    result = result.filter((c) => c.tags?.some((t) => t.id === filters.tagId));
  }

  return result;
});

const hasActiveFilters = computed(() => {
  return (
    filters.outcome ||
    filters.disposition ||
    filters.agent ||
    filters.dateRange ||
    filters.durationMin !== null ||
    filters.durationMax !== null ||
    filters.search ||
    filters.tagId
  );
});

onMounted(() => {
  fetchCalls();
});

watch(showAnalytics, async show => {
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
      direction: form.direction as unknown,
      outcome: form.outcome as unknown,
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
  if (confirm($t('callLog.confirmDial', { phone }))) {
    window.location.href = `tel:${phone}`;
  }
}

function viewDetails(call: unknown) {
  selectedCall.value = call;
  showDetailsDialog.value = true;
}

function playRecording(call: unknown) {
  selectedCall.value = call;
  showDetailsDialog.value = true;
}

function handleSelectionChange(selection: Record<string, unknown>[]) {
  selectedCalls.value = selection;
}

function applyFilters() {
  ElMessage.success($t('callLog.filtersApplied'));
}

function clearFilters() {
  Object.assign(filters, {
    outcome: '',
    disposition: '',
    agent: '',
    dateRange: null,
    durationMin: null,
    durationMax: null,
    search: '',
    tagId: null
  });
  ElMessage.info($t('callLog.filtersCleared'));
}

async function bulkDelete() {
  try {
    await ElMessageBox.confirm($t('callLog.confirmBulkDelete', { count: selectedCalls.value.length }), $t('common.warning'), { type: 'warning' });

    for (const call of selectedCalls.value) {
      await removeCall(call.id);
    }

    selectedCalls.value = [];
    ElMessage.success($t('callLog.bulkDeleteSuccess'));
  } catch {
    // User cancelled
  }
}

async function bulkExport() {
  try {
    const data = selectedCalls.value.map(call => ({
      Contact: call.contactName,
      Phone: call.phone,
      Direction: call.direction,
      Outcome: call.outcome,
      Disposition: call.disposition,
      Duration: formatDuration(call.duration),
      Date: formatDate(call.createdAt),
      Notes: call.notes || ''
    }));

    const csv = [Object.keys(data[0] as unknown).join(','), ...data.map(row => Object.values(row).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `call-log-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    ElMessage.success($t('callLog.exportSuccess'));
  } catch (error) {
    ElMessage.error($t('callLog.exportFailed'));
  }
}

async function bulkReassign() {
  if (!bulkReassignForm.agentId) {
    ElMessage.warning($t('callLog.selectAgent'));
    return;
  }

  try {
    // API call to bulk reassign
    await useApiFetch('call-log/bulk-reassign', 'POST', {
      callIds: selectedCalls.value.map(c => c.id),
      agentId: bulkReassignForm.agentId
    });

    showBulkReassignDialog.value = false;
    selectedCalls.value = [];
    await fetchCalls();
    ElMessage.success($t('callLog.reassignSuccess'));
  } catch {
    ElMessage.error($t('callLog.reassignFailed'));
  }
}

function addTagToCall(call: unknown) {
  selectedCall.value = call;
  showAddTagDialog.value = true;
}

async function saveCallTags() {
  if (!selectedCall.value) return;

  try {
    await useApiFetch(`call-log/${selectedCall.value.id}`, 'PUT', {
      tags: form.tags
    });

    showAddTagDialog.value = false;
    await fetchCalls();
    ElMessage.success($t('callLog.tagsUpdated'));
  } catch {
    ElMessage.error($t('callLog.tagsUpdateFailed'));
  }
}

function removeTag(tagId: number) {
  availableTags.value = availableTags.value.filter(t => t.id !== tagId);
}

function filterByTag(tag: unknown) {
  filters.tagId = filters.tagId === tag.id ? null : tag.id;
}

function rateCallQuality(call: unknown) {
  callForRating.value = call;
  qualityRatingForm.score = call.qualityScore || 5;
  qualityRatingForm.notes = '';
  showQualityRatingDialog.value = true;
}

async function saveQualityRating() {
  if (!callForRating.value) return;

  try {
    await useApiFetch(`call-log/${callForRating.value.id}/quality`, 'PUT', {
      qualityScore: qualityRatingForm.score,
      qualityNotes: qualityRatingForm.notes
    });

    showQualityRatingDialog.value = false;
    await fetchCalls();
    ElMessage.success($t('callLog.qualityRated'));
  } catch {
    ElMessage.error($t('callLog.qualityRatingFailed'));
  }
}

function drillDownDuration() {
  // Filter calls by clicking on duration chart - show modal with breakdown
  ElMessageBox.alert($t('callLog.drillDownDurationMsg'), $t('callLog.durationBreakdown'), { confirmButtonText: $t('common.ok') });
}

function drillDownOutcome() {
  // Filter calls by outcome - could show detailed breakdown
  ElMessageBox.alert($t('callLog.drillDownOutcomeMsg'), $t('callLog.outcomeBreakdown'), { confirmButtonText: $t('common.ok') });
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
      series: [
        {
          data: Object.values(durationData),
          type: 'bar',
          itemStyle: { color: '#7c3aed' }
        }
      ]
    });
  }

  // Calls by Outcome Pie Chart
  if (outcomeChartRef.value) {
    const outcomeChart = echarts.init(outcomeChartRef.value);
    const outcomeData = analytics.value.byOutcome || {};
    outcomeChart.setOption({
      tooltip: { trigger: 'item' },
      series: [
        {
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
        }
      ]
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
      series: [
        {
          data: Object.values(hourData),
          type: 'bar',
          itemStyle: { color: '#22c55e' }
        }
      ]
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
      series: [
        {
          data: Object.values(trendData),
          type: 'line',
          smooth: true,
          itemStyle: { color: '#3b82f6' }
        }
      ]
    });
  }
}
</script>
