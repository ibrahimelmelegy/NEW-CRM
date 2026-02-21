<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">Vendor Scorecard</h1>
          <p class="text-slate-400 text-sm mt-1">Evaluate vendor performance, compare suppliers, and identify at-risk partners.</p>
        </div>
        <div class="flex gap-2">
          <el-select v-model="selectedPeriod" class="w-36">
            <el-option label="Q1 2026" value="Q1-2026" />
            <el-option label="Q4 2025" value="Q4-2025" />
            <el-option label="Q3 2025" value="Q3-2025" />
          </el-select>
          <el-button type="primary" class="!rounded-xl" @click="showEvaluationDialog = true">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            New Evaluation
          </el-button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ vendors.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Vendors</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-orange-400">{{ avgScore.toFixed(1) }}</div>
        <div class="text-xs text-slate-500 mt-1">Avg Score</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ topRatedCount }}</div>
        <div class="text-xs text-slate-500 mt-1">Top-Rated (4.0+)</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ atRiskCount }}</div>
        <div class="text-xs text-slate-500 mt-1">At-Risk (&lt;2.5)</div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Vendor Performance Table -->
      <div class="lg:col-span-2 glass-panel p-6 rounded-xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-slate-200">Vendor Performance</h3>
          <el-input v-model="searchText" placeholder="Search vendors..." clearable class="!w-48" size="small">
            <template #prefix>
              <Icon name="ph:magnifying-glass" class="w-4 h-4" />
            </template>
          </el-input>
        </div>
        <el-table :data="filteredVendors" class="glass-table" stripe row-class-name="cursor-pointer" @row-click="selectVendor">
          <el-table-column label="Vendor" min-width="180">
            <template #default="{ row }">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" :class="getVendorAvatarClass(row.overallScore)">
                  {{ row.name.charAt(0) }}
                </div>
                <div>
                  <div class="text-sm font-medium text-slate-200">{{ row.name }}</div>
                  <div class="text-xs text-slate-500">{{ row.category }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Quality" width="130" align="center">
            <template #default="{ row }">
              <el-rate v-model="row.qualityScore" disabled :max="5" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="Delivery" width="100" align="center">
            <template #default="{ row }">
              <span class="text-sm font-medium" :class="getScoreColor(row.deliveryScore)">{{ row.deliveryScore.toFixed(1) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Pricing" width="100" align="center">
            <template #default="{ row }">
              <span class="text-sm font-medium" :class="getScoreColor(row.pricingScore)">{{ row.pricingScore.toFixed(1) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Overall" width="110" align="center">
            <template #default="{ row }">
              <div class="flex items-center justify-center gap-1">
                <span class="text-sm font-bold" :class="getScoreColor(row.overallScore)">{{ row.overallScore.toFixed(1) }}</span>
                <Icon
                  :name="row.trend === 'up' ? 'ph:arrow-up-bold' : row.trend === 'down' ? 'ph:arrow-down-bold' : 'ph:minus-bold'"
                  class="w-3 h-3"
                  :class="row.trend === 'up' ? 'text-emerald-400' : row.trend === 'down' ? 'text-red-400' : 'text-slate-500'"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Status" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.overallScore)" effect="dark" size="small">
                {{ getStatusLabel(row.overallScore) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Radar Chart Placeholder / Selected Vendor -->
      <div class="glass-panel p-6 rounded-xl">
        <h3 class="text-lg font-medium text-slate-200 mb-4">Vendor Comparison</h3>
        <div v-if="selectedVendor">
          <div class="text-center mb-4">
            <div
              class="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold mb-2"
              :class="getVendorAvatarClass(selectedVendor.overallScore)"
            >
              {{ selectedVendor.name.charAt(0) }}
            </div>
            <h4 class="text-sm font-bold text-slate-200">{{ selectedVendor.name }}</h4>
            <p class="text-xs text-slate-500">{{ selectedVendor.category }}</p>
          </div>

          <!-- Radar-like Score Breakdown -->
          <div class="space-y-3 mt-6">
            <div v-for="metric in vendorMetrics" :key="metric.label">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-slate-400">{{ metric.label }}</span>
                <span class="text-xs font-bold" :class="getScoreColor(metric.score)">{{ metric.score.toFixed(1) }}/5.0</span>
              </div>
              <el-progress
                :percentage="(metric.score / 5) * 100"
                :stroke-width="8"
                :show-text="false"
                :color="metric.score >= 4 ? '#10B981' : metric.score >= 3 ? '#F59E0B' : '#EF4444'"
              />
            </div>
          </div>

          <!-- Vendor Details -->
          <div class="mt-6 space-y-3 pt-4 border-t border-slate-800/60">
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Contract Value</span>
              <span class="text-slate-200 font-medium">{{ formatCurrency(selectedVendor.contractValue) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Active Since</span>
              <span class="text-slate-200">{{ selectedVendor.activeSince }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Orders (YTD)</span>
              <span class="text-slate-200">{{ selectedVendor.ordersYTD }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">On-Time %</span>
              <span class="font-medium" :class="selectedVendor.onTimePercent >= 90 ? 'text-emerald-400' : 'text-amber-400'">
                {{ selectedVendor.onTimePercent }}%
              </span>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <el-button size="small" type="primary" class="flex-1" @click="evaluateVendor(selectedVendor)">
              <Icon name="ph:clipboard-text-bold" class="w-4 h-4 mr-1" />
              Evaluate
            </el-button>
            <el-button size="small" class="flex-1" @click="viewHistory(selectedVendor)">
              <Icon name="ph:clock-counter-clockwise-bold" class="w-4 h-4 mr-1" />
              History
            </el-button>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-12">
          <Icon name="ph:chart-polar-bold" class="w-16 h-16 text-slate-600 mb-4" />
          <p class="text-sm text-slate-500 text-center">Select a vendor from the table to view detailed performance metrics</p>
        </div>
      </div>
    </div>

    <!-- Evaluation Dialog -->
    <el-dialog v-model="showEvaluationDialog" title="Vendor Evaluation" width="600px">
      <el-form label-position="top">
        <el-form-item label="Vendor">
          <el-select v-model="evaluationForm.vendorId" placeholder="Select vendor" class="w-full">
            <el-option v-for="v in vendors" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Evaluation Period">
          <el-date-picker v-model="evaluationForm.period" type="month" placeholder="Select month" class="w-full" />
        </el-form-item>

        <div class="space-y-4 mt-2">
          <h4 class="text-sm font-medium text-slate-300">Performance Criteria</h4>
          <div v-for="criterion in evaluationCriteria" :key="criterion.key" class="glass-panel p-4 rounded-xl">
            <div class="flex justify-between items-center mb-2">
              <div>
                <span class="text-sm font-medium text-slate-200">{{ criterion.label }}</span>
                <p class="text-xs text-slate-500">{{ criterion.description }}</p>
              </div>
              <span class="text-sm font-bold text-orange-400">{{ evaluationForm.scores[criterion.key] || 0 }}/5</span>
            </div>
            <el-rate v-model="evaluationForm.scores[criterion.key]" :max="5" allow-half show-score />
          </div>
        </div>

        <el-form-item label="Notes" class="mt-4">
          <el-input v-model="evaluationForm.notes" type="textarea" :rows="3" placeholder="Additional comments about vendor performance..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEvaluationDialog = false">Cancel</el-button>
        <el-button type="primary" @click="submitEvaluation">Submit Evaluation</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const selectedPeriod = ref('Q1-2026');
const searchText = ref('');
const showEvaluationDialog = ref(false);
const selectedVendorId = ref<number | null>(null);

const vendors = ref([
  {
    id: 1,
    name: 'Al-Rajhi Materials',
    category: 'Raw Materials',
    qualityScore: 4.5,
    deliveryScore: 4.2,
    pricingScore: 3.8,
    overallScore: 4.2,
    trend: 'up' as const,
    contractValue: 1250000,
    activeSince: 'Jan 2023',
    ordersYTD: 48,
    onTimePercent: 94
  },
  {
    id: 2,
    name: 'Gulf Tech Supplies',
    category: 'IT Equipment',
    qualityScore: 4.0,
    deliveryScore: 3.5,
    pricingScore: 4.2,
    overallScore: 3.9,
    trend: 'stable' as const,
    contractValue: 870000,
    activeSince: 'Mar 2022',
    ordersYTD: 32,
    onTimePercent: 88
  },
  {
    id: 3,
    name: 'Saudi Steel Corp',
    category: 'Construction',
    qualityScore: 4.8,
    deliveryScore: 4.6,
    pricingScore: 3.5,
    overallScore: 4.3,
    trend: 'up' as const,
    contractValue: 2100000,
    activeSince: 'Jun 2021',
    ordersYTD: 56,
    onTimePercent: 96
  },
  {
    id: 4,
    name: 'Riyadh Logistics',
    category: 'Logistics',
    qualityScore: 3.2,
    deliveryScore: 2.8,
    pricingScore: 4.0,
    overallScore: 3.3,
    trend: 'down' as const,
    contractValue: 450000,
    activeSince: 'Sep 2024',
    ordersYTD: 18,
    onTimePercent: 72
  },
  {
    id: 5,
    name: 'Desert Packaging',
    category: 'Packaging',
    qualityScore: 2.0,
    deliveryScore: 2.2,
    pricingScore: 3.5,
    overallScore: 2.4,
    trend: 'down' as const,
    contractValue: 180000,
    activeSince: 'Nov 2024',
    ordersYTD: 12,
    onTimePercent: 65
  },
  {
    id: 6,
    name: 'MENA Office Solutions',
    category: 'Office Supplies',
    qualityScore: 3.8,
    deliveryScore: 4.0,
    pricingScore: 4.5,
    overallScore: 4.1,
    trend: 'up' as const,
    contractValue: 320000,
    activeSince: 'Feb 2023',
    ordersYTD: 24,
    onTimePercent: 91
  },
  {
    id: 7,
    name: 'Jeddah Chemicals',
    category: 'Chemicals',
    qualityScore: 4.2,
    deliveryScore: 3.9,
    pricingScore: 3.6,
    overallScore: 3.9,
    trend: 'stable' as const,
    contractValue: 560000,
    activeSince: 'Aug 2022',
    ordersYTD: 38,
    onTimePercent: 87
  },
  {
    id: 8,
    name: 'Eastern Textiles',
    category: 'Textiles',
    qualityScore: 1.8,
    deliveryScore: 2.0,
    pricingScore: 4.2,
    overallScore: 2.3,
    trend: 'down' as const,
    contractValue: 95000,
    activeSince: 'Apr 2025',
    ordersYTD: 6,
    onTimePercent: 58
  }
]);

const evaluationCriteria = ref([
  { key: 'quality', label: 'Quality', description: 'Product/service quality and consistency' },
  { key: 'delivery', label: 'Delivery', description: 'On-time delivery and logistics reliability' },
  { key: 'pricing', label: 'Pricing', description: 'Competitiveness and value for money' },
  { key: 'communication', label: 'Communication', description: 'Responsiveness and clarity of communication' },
  { key: 'compliance', label: 'Compliance', description: 'Regulatory and contractual compliance' }
]);

const evaluationForm = ref<{
  vendorId: number | null;
  period: string;
  scores: Record<string, number>;
  notes: string;
}>({
  vendorId: null,
  period: '',
  scores: { quality: 0, delivery: 0, pricing: 0, communication: 0, compliance: 0 },
  notes: ''
});

const filteredVendors = computed(() => {
  if (!searchText.value) return vendors.value;
  const s = searchText.value.toLowerCase();
  return vendors.value.filter(v => v.name.toLowerCase().includes(s) || v.category.toLowerCase().includes(s));
});

const avgScore = computed(() => {
  if (!vendors.value.length) return 0;
  return vendors.value.reduce((s, v) => s + v.overallScore, 0) / vendors.value.length;
});

const topRatedCount = computed(() => vendors.value.filter(v => v.overallScore >= 4.0).length);
const atRiskCount = computed(() => vendors.value.filter(v => v.overallScore < 2.5).length);

const selectedVendor = computed(() => {
  if (selectedVendorId.value === null) return null;
  return vendors.value.find(v => v.id === selectedVendorId.value) || null;
});

const vendorMetrics = computed(() => {
  if (!selectedVendor.value) return [];
  const v = selectedVendor.value;
  return [
    { label: 'Quality', score: v.qualityScore },
    { label: 'Delivery', score: v.deliveryScore },
    { label: 'Pricing', score: v.pricingScore },
    { label: 'Communication', score: (v.qualityScore + v.deliveryScore) / 2 },
    { label: 'Compliance', score: (v.overallScore + v.deliveryScore) / 2 }
  ];
});

const formatCurrency = (val: number) => {
  if (!val) return '0 SAR';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M SAR`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K SAR`;
  return `${val} SAR`;
};

const getScoreColor = (score: number): string => {
  if (score >= 4.0) return 'text-emerald-400';
  if (score >= 3.0) return 'text-amber-400';
  return 'text-red-400';
};

const getVendorAvatarClass = (score: number): string => {
  if (score >= 4.0) return 'bg-emerald-500/20 text-emerald-400';
  if (score >= 3.0) return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/20 text-red-400';
};

const getStatusType = (score: number): 'success' | 'warning' | 'danger' | undefined => {
  if (score >= 4.0) return 'success';
  if (score >= 2.5) return 'warning';
  return 'danger';
};

const getStatusLabel = (score: number): string => {
  if (score >= 4.0) return 'Excellent';
  if (score >= 3.0) return 'Good';
  if (score >= 2.5) return 'Fair';
  return 'At Risk';
};

const selectVendor = (row: any) => {
  selectedVendorId.value = row.id;
};

const evaluateVendor = (vendor: any) => {
  evaluationForm.value.vendorId = vendor.id;
  showEvaluationDialog.value = true;
};

const viewHistory = (vendor: any) => {
  ElMessage.info(`Viewing evaluation history for ${vendor.name}`);
};

const submitEvaluation = () => {
  if (!evaluationForm.value.vendorId) {
    ElMessage.warning('Please select a vendor');
    return;
  }
  const scores = Object.values(evaluationForm.value.scores);
  if (scores.includes(0)) {
    ElMessage.warning('Please rate all criteria');
    return;
  }
  ElMessage.success('Vendor evaluation submitted successfully');
  showEvaluationDialog.value = false;
  evaluationForm.value = {
    vendorId: null,
    period: '',
    scores: { quality: 0, delivery: 0, pricing: 0, communication: 0, compliance: 0 },
    notes: ''
  };
};
</script>
