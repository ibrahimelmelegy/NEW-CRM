<template lang="pug">
div.animate-fade-in
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('vendorScorecard.title') || 'Vendor Scorecard' }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('vendorScorecard.subtitle') || 'Evaluate and track vendor performance across key metrics.' }}
    .flex.items-center.gap-3
      el-button(type="primary" size="large" @click="openCreateDialog" class="!rounded-xl")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ $t('vendorScorecard.newScorecard') || 'New Evaluation' }}

  //- Vendor Rankings
  .glass-card.p-5.rounded-2xl.mb-6
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:trophy-bold" size="20" class="mr-2" style="color: #f59e0b")
        | {{ $t('vendorScorecard.rankings') || 'Vendor Rankings' }}
      el-button(size="small" text @click="loadRankings" :loading="loadingRankings")
        Icon(name="ph:arrows-clockwise" size="14")
    .flex.items-center.justify-center.py-6(v-if="loadingRankings")
      el-icon.is-loading(:size="20" style="color: var(--accent-color, #7849ff)")
    .space-y-2(v-else-if="vendorRankings.length")
      .flex.items-center.justify-between.p-3.rounded-xl(
        v-for="(vr, idx) in vendorRankings"
        :key="idx"
        style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
      )
        .flex.items-center.gap-3
          .w-9.h-9.rounded-full.flex.items-center.justify-center.text-sm.font-black(
            :style="{ background: idx < 3 ? '#f59e0b20' : 'var(--bg-elevated)', color: idx < 3 ? '#f59e0b' : 'var(--text-muted)', border: '1px solid var(--border-default)' }"
          ) {{ idx + 1 }}
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ vr.vendorName || vr.name || '--' }}
            p.text-xs(v-if="vr.percentile != null" style="color: var(--text-muted)") Top {{ vr.percentile }}%
        .flex.items-center.gap-3
          .w-12.h-12.rounded-full.flex.items-center.justify-center.text-sm.font-bold(
            :style="{ background: getRankScoreColor(vr.overallScore || vr.score || 0) + '20', color: getRankScoreColor(vr.overallScore || vr.score || 0) }"
          ) {{ (vr.overallScore || vr.score || 0).toFixed(1) }}
    .text-center.py-6(v-else)
      Icon(name="ph:trophy" size="32" style="color: var(--text-muted)")
      p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('vendorScorecard.noRankings') || 'No rankings available' }}

  //- Benchmark Card
  el-row.mb-6(:gutter="16" v-if="benchmark")
    el-col(:span="24")
      .glass-card.p-5.rounded-2xl
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:chart-bar-horizontal-bold" size="20" class="mr-2" style="color: #3b82f6")
            | {{ $t('vendorScorecard.benchmark') || 'Vendor Benchmark (Averages)' }}
        el-row(:gutter="16")
          el-col(:span="6")
            .text-center.p-3.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
              p.text-xs.mb-1(style="color: var(--text-muted)") {{ $t('vendorScorecard.avgQuality') || 'Avg Quality' }}
              p.text-2xl.font-bold(:style="{ color: getScoreColor(benchmark.avgQuality || 0) }") {{ (benchmark.avgQuality || 0).toFixed(1) }}
          el-col(:span="6")
            .text-center.p-3.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
              p.text-xs.mb-1(style="color: var(--text-muted)") {{ $t('vendorScorecard.avgDelivery') || 'Avg Delivery' }}
              p.text-2xl.font-bold(:style="{ color: getScoreColor(benchmark.avgDelivery || 0) }") {{ (benchmark.avgDelivery || 0).toFixed(1) }}
          el-col(:span="6")
            .text-center.p-3.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
              p.text-xs.mb-1(style="color: var(--text-muted)") {{ $t('vendorScorecard.avgPrice') || 'Avg Price' }}
              p.text-2xl.font-bold(:style="{ color: getScoreColor(benchmark.avgPrice || 0) }") {{ (benchmark.avgPrice || 0).toFixed(1) }}
          el-col(:span="6")
            .text-center.p-3.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
              p.text-xs.mb-1(style="color: var(--text-muted)") {{ $t('vendorScorecard.avgCommunication') || 'Avg Communication' }}
              p.text-2xl.font-bold(:style="{ color: getScoreColor(benchmark.avgCommunication || 0) }") {{ (benchmark.avgCommunication || 0).toFixed(1) }}

  //- Stats Cards
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:clipboard-text-bold" size="20" style="color: #7849ff")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ stats.total }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('vendorScorecard.totalScorecards') || 'Total Scorecards' }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:star-bold" size="20" style="color: #22c55e")
        div
          p.text-2xl.font-bold(:style="{ color: getScoreColor(stats.avgQuality) }") {{ stats.avgQuality.toFixed(1) }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('vendorScorecard.avgQuality') || 'Avg Quality' }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:truck-bold" size="20" style="color: #3b82f6")
        div
          p.text-2xl.font-bold(:style="{ color: getScoreColor(stats.avgDelivery) }") {{ stats.avgDelivery.toFixed(1) }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('vendorScorecard.avgDelivery') || 'Avg Delivery' }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:chart-bar-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-bold(:style="{ color: getScoreColor(stats.avgOverall) }") {{ stats.avgOverall.toFixed(1) }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('vendorScorecard.avgOverall') || 'Avg Overall' }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Scorecards Table
  .glass-card.p-4(v-else)
    .flex.items-center.justify-between.mb-4
      el-input(
        v-model="searchQuery"
        :placeholder="$t('vendorScorecard.search') || 'Search scorecards...'"
        clearable
        size="large"
        style="max-width: 320px"
        class="!rounded-xl"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")

    el-table(:data="filteredScorecards" v-loading="loading" stripe style="width: 100%")
      el-table-column(:label="$t('vendorScorecard.vendor') || 'Vendor'" min-width="200" sortable)
        template(#default="{ row }")
          .flex.items-center.gap-2
            .w-8.h-8.rounded-full.flex.items-center.justify-center.text-xs.font-bold(
              :style="{ background: '#7849ff20', color: '#7849ff' }"
            ) {{ (row.vendorName || row.vendorId || '?').toString().charAt(0).toUpperCase() }}
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.vendorName || row.vendorId || '--' }}
      el-table-column(:label="$t('vendorScorecard.period') || 'Period'" prop="period" width="140" sortable)
        template(#default="{ row }")
          el-tag(size="small" effect="plain" round) {{ row.period || '--' }}
      el-table-column(:label="$t('vendorScorecard.qualityScore') || 'Quality'" width="140" align="center" sortable)
        template(#default="{ row }")
          .flex.items-center.gap-2.justify-center
            el-progress(
              :percentage="(row.qualityScore / 5) * 100"
              :stroke-width="6"
              :color="getScoreColor(row.qualityScore)"
              :show-text="false"
              style="width: 60px"
            )
            span.text-sm.font-bold(:style="{ color: getScoreColor(row.qualityScore) }") {{ row.qualityScore?.toFixed(1) || '0.0' }}
      el-table-column(:label="$t('vendorScorecard.deliveryScore') || 'Delivery'" width="140" align="center" sortable)
        template(#default="{ row }")
          .flex.items-center.gap-2.justify-center
            el-progress(
              :percentage="(row.deliveryScore / 5) * 100"
              :stroke-width="6"
              :color="getScoreColor(row.deliveryScore)"
              :show-text="false"
              style="width: 60px"
            )
            span.text-sm.font-bold(:style="{ color: getScoreColor(row.deliveryScore) }") {{ row.deliveryScore?.toFixed(1) || '0.0' }}
      el-table-column(:label="$t('vendorScorecard.priceScore') || 'Price'" width="140" align="center" sortable)
        template(#default="{ row }")
          .flex.items-center.gap-2.justify-center
            el-progress(
              :percentage="(row.priceScore / 5) * 100"
              :stroke-width="6"
              :color="getScoreColor(row.priceScore)"
              :show-text="false"
              style="width: 60px"
            )
            span.text-sm.font-bold(:style="{ color: getScoreColor(row.priceScore) }") {{ row.priceScore?.toFixed(1) || '0.0' }}
      el-table-column(:label="$t('vendorScorecard.communicationScore') || 'Communication'" width="160" align="center" sortable)
        template(#default="{ row }")
          .flex.items-center.gap-2.justify-center
            el-progress(
              :percentage="(row.communicationScore / 5) * 100"
              :stroke-width="6"
              :color="getScoreColor(row.communicationScore)"
              :show-text="false"
              style="width: 60px"
            )
            span.text-sm.font-bold(:style="{ color: getScoreColor(row.communicationScore) }") {{ row.communicationScore?.toFixed(1) || '0.0' }}
      el-table-column(:label="$t('vendorScorecard.overallScore') || 'Overall'" width="140" align="center" sortable)
        template(#default="{ row }")
          .flex.items-center.gap-2.justify-center
            .w-10.h-10.rounded-full.flex.items-center.justify-center.text-sm.font-bold(
              :style="{ background: getScoreColor(getOverallScore(row)) + '20', color: getScoreColor(getOverallScore(row)) }"
            ) {{ getOverallScore(row).toFixed(1) }}
      el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center" fixed="right")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-1
            el-button(size="small" @click="openEditDialog(row)" class="!rounded-lg")
              Icon(name="ph:pencil-bold" size="14")
            el-button(size="small" type="danger" plain @click="handleDelete(row)" class="!rounded-lg")
              Icon(name="ph:trash-bold" size="14")

    //- Empty state
    .text-center.py-12(v-if="!filteredScorecards.length && !loading")
      Icon(name="ph:clipboard-text" size="48" style="color: var(--text-muted)")
      p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('vendorScorecard.noScorecards') || 'No scorecards found' }}

  //- Create / Edit Dialog
  el-dialog(
    v-model="dialogVisible"
    :title="editingScorecard ? ($t('vendorScorecard.editScorecard') || 'Edit Scorecard') : ($t('vendorScorecard.newScorecard') || 'New Evaluation')"
    width="600px"
    :close-on-click-modal="false"
  )
    el-form(:model="form" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('vendorScorecard.vendor') || 'Vendor'" required)
          el-select(v-model="form.vendorId" :placeholder="$t('vendorScorecard.selectVendor') || 'Select Vendor'" style="width: 100%" filterable)
            el-option(
              v-for="vendor in vendors"
              :key="vendor.id"
              :label="vendor.name"
              :value="vendor.id"
            )
        el-form-item(:label="$t('vendorScorecard.period') || 'Period'" required)
          el-input(v-model="form.period" :placeholder="'e.g. Q1-2026'")

      //- Score Sliders
      .glass-card.p-4.mb-4.rounded-xl
        h4.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:star-bold" size="16" class="mr-1" style="color: #f59e0b")
          | {{ $t('vendorScorecard.scores') || 'Performance Scores (1-5)' }}
        .grid.gap-6(class="grid-cols-1 md:grid-cols-2")
          el-form-item(:label="$t('vendorScorecard.qualityScore') || 'Quality Score'")
            .flex.items-center.gap-3
              el-slider(v-model="form.qualityScore" :min="1" :max="5" :step="0.5" style="flex: 1" :marks="scoreMarks")
              span.text-lg.font-bold.w-10.text-center(:style="{ color: getScoreColor(form.qualityScore) }") {{ form.qualityScore }}
          el-form-item(:label="$t('vendorScorecard.deliveryScore') || 'Delivery Score'")
            .flex.items-center.gap-3
              el-slider(v-model="form.deliveryScore" :min="1" :max="5" :step="0.5" style="flex: 1" :marks="scoreMarks")
              span.text-lg.font-bold.w-10.text-center(:style="{ color: getScoreColor(form.deliveryScore) }") {{ form.deliveryScore }}
          el-form-item(:label="$t('vendorScorecard.priceScore') || 'Price Score'")
            .flex.items-center.gap-3
              el-slider(v-model="form.priceScore" :min="1" :max="5" :step="0.5" style="flex: 1" :marks="scoreMarks")
              span.text-lg.font-bold.w-10.text-center(:style="{ color: getScoreColor(form.priceScore) }") {{ form.priceScore }}
          el-form-item(:label="$t('vendorScorecard.communicationScore') || 'Communication Score'")
            .flex.items-center.gap-3
              el-slider(v-model="form.communicationScore" :min="1" :max="5" :step="0.5" style="flex: 1" :marks="scoreMarks")
              span.text-lg.font-bold.w-10.text-center(:style="{ color: getScoreColor(form.communicationScore) }") {{ form.communicationScore }}

        //- Overall preview
        .flex.items-center.justify-center.mt-4.pt-4.border-t(style="border-color: var(--border-default)")
          .text-center
            p.text-xs.mb-1(style="color: var(--text-muted)") {{ $t('vendorScorecard.overallScore') || 'Overall Score' }}
            .w-16.h-16.rounded-full.flex.items-center.justify-center.text-xl.font-bold.mx-auto(
              :style="{ background: getScoreColor(formOverallScore) + '20', color: getScoreColor(formOverallScore) }"
            ) {{ formOverallScore.toFixed(1) }}

      el-form-item(:label="$t('vendorScorecard.notes') || 'Notes'")
        el-input(v-model="form.notes" type="textarea" :rows="3" :placeholder="$t('vendorScorecard.notesPlaceholder') || 'Additional comments about vendor performance...'")

    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="handleSave") {{ $t('common.save') || 'Save' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// State
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const scorecards = ref<any[]>([]);
const vendors = ref<any[]>([]);
const dialogVisible = ref(false);
const editingScorecard = ref<any>(null);

// Rankings & Benchmark
const loadingRankings = ref(false);
const vendorRankings = ref<any[]>([]);
const benchmark = ref<any>(null);

const scoreMarks = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' };

const form = reactive({
  vendorId: '' as any,
  period: '',
  qualityScore: 3 as number,
  deliveryScore: 3 as number,
  priceScore: 3 as number,
  communicationScore: 3 as number,
  notes: ''
});

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 4) return '#22c55e';
  if (score >= 3) return '#f59e0b';
  return '#ef4444';
}

// Ranking score color (uses 0-100 scale)
function getRankScoreColor(score: number): string {
  if (score > 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 4) return getScoreColor(score); // 1-5 scale fallback
  return '#ef4444';
}

// Overall score calculator
function getOverallScore(row: any): number {
  const scores = [row.qualityScore || 0, row.deliveryScore || 0, row.priceScore || 0, row.communicationScore || 0];
  const valid = scores.filter(s => s > 0);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

const formOverallScore = computed(() => {
  const scores = [form.qualityScore, form.deliveryScore, form.priceScore, form.communicationScore];
  return scores.reduce((a, b) => a + b, 0) / scores.length;
});

// Stats
const stats = computed(() => {
  const data = scorecards.value;
  const total = data.length;
  const avgQuality = total ? data.reduce((sum: number, s: any) => sum + (s.qualityScore || 0), 0) / total : 0;
  const avgDelivery = total ? data.reduce((sum: number, s: any) => sum + (s.deliveryScore || 0), 0) / total : 0;
  const avgOverall = total ? data.reduce((sum: number, s: any) => sum + getOverallScore(s), 0) / total : 0;
  return { total, avgQuality, avgDelivery, avgOverall };
});

// Filtering
const filteredScorecards = computed(() => {
  if (!searchQuery.value) return scorecards.value;
  const q = searchQuery.value.toLowerCase();
  return scorecards.value.filter((s: any) => {
    const vendor = (s.vendorName || s.vendorId || '').toString().toLowerCase();
    const period = (s.period || '').toLowerCase();
    return vendor.includes(q) || period.includes(q);
  });
});

// API
async function loadScorecards() {
  loading.value = true;
  try {
    const res = await useApiFetch('vendor-scorecard');
    if (res?.success) {
      scorecards.value = res.body?.docs || res.body || [];
    }
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
}

async function loadVendors() {
  try {
    const res = await useApiFetch('vendor');
    if (res?.success) {
      vendors.value = res.body?.docs || res.body || [];
    }
  } catch {
    // silent
  }
}

function openCreateDialog() {
  editingScorecard.value = null;
  form.vendorId = '';
  form.period = '';
  form.qualityScore = 3;
  form.deliveryScore = 3;
  form.priceScore = 3;
  form.communicationScore = 3;
  form.notes = '';
  dialogVisible.value = true;
}

function openEditDialog(scorecard: any) {
  editingScorecard.value = scorecard;
  form.vendorId = scorecard.vendorId || '';
  form.period = scorecard.period || '';
  form.qualityScore = scorecard.qualityScore || 3;
  form.deliveryScore = scorecard.deliveryScore || 3;
  form.priceScore = scorecard.priceScore || 3;
  form.communicationScore = scorecard.communicationScore || 3;
  form.notes = scorecard.notes || '';
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.vendorId || !form.period.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning') || 'Warning', message: t('common.fillRequired') || 'Please fill required fields' });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form };
    if (editingScorecard.value) {
      await useApiFetch(`vendor-scorecard/${editingScorecard.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('vendor-scorecard', 'POST', payload);
    }
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.saved') || 'Saved' });
    dialogVisible.value = false;
    await loadScorecards();
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('common.error') || 'Error' });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(scorecard: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this scorecard?',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    await useApiFetch(`vendor-scorecard/${scorecard.id}`, 'DELETE');
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.deleted') || 'Deleted' });
    await loadScorecards();
  } catch {
    // cancelled or error
  }
}

// Rankings API
async function loadRankings() {
  loadingRankings.value = true;
  try {
    const res = await useApiFetch('vendor-scorecard/ranking');
    if (res?.success) {
      vendorRankings.value = res.body?.docs || res.body || [];
    }
  } catch {
    // silent
  } finally {
    loadingRankings.value = false;
  }
}

// Benchmark API
async function loadBenchmark() {
  try {
    const res = await useApiFetch('vendor-scorecard/benchmark');
    if (res?.success && res.body) {
      benchmark.value = res.body;
    }
  } catch {
    // silent
  }
}

onMounted(() => {
  loadScorecards();
  loadVendors();
  loadRankings();
  loadBenchmark();
});
</script>

<style lang="scss" scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
