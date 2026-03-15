<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-400">
            {{ $t('hr.performance.title') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('hr.performance.subtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <el-select v-model="selectedCycle" :placeholder="$t('hr.performance.period')" class="w-48" @change="fetchReviews">
            <el-option :label="$t('performance.q1_2026')" value="Q1-2026" />
            <el-option :label="$t('performance.q4_2025')" value="Q4-2025" />
            <el-option :label="$t('performance.q3_2025')" value="Q3-2025" />
            <el-option :label="$t('performance.annual_2025')" value="ANNUAL-2025" />
          </el-select>
          <el-button type="primary" class="!rounded-xl" @click="showNewReviewDialog = true">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            {{ $t('hr.performance.newReview') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ reviews.length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('hr.performance.totalReviews') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ reviews.filter(r => r.status === 'COMPLETED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('hr.performance.completed') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ reviews.filter(r => r.status === 'IN_PROGRESS').length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('hr.goals.inProgress') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ avgRating }}/5</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('hr.performance.avgRating') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-teal-400">{{ goalCompletion }}%</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('hr.goals.completed') }}</div>
      </div>
    </div>

    <!-- Reviews Table -->
    <div class="glass-panel p-6 rounded-2xl">
      <el-table v-loading="loading" :data="reviews" class="glass-table" stripe style="width: 100%">
        <el-table-column :label="$t('hr.performance.employee')" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-avatar :size="36" :src="row.avatar" class="bg-slate-700">
                {{ row.employeeName?.charAt(0) }}
              </el-avatar>
              <div>
                <div class="text-sm font-medium text-slate-200">{{ row.employeeName }}</div>
                <div class="text-xs text-slate-500">{{ row.department }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reviewType" :label="$t('common.type')" width="130">
          <template #default="{ row }">
            <el-tag effect="dark" size="small">{{ row.reviewType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('hr.performance.rating')" width="180" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-2">
              <el-rate v-model="row.overallRating" disabled :max="5" size="small" />
              <span class="text-sm text-slate-400">{{ row.overallRating }}/5</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('hr.goals.completed')" width="120" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.goalsCompleted" :stroke-width="4" :color="getProgressColor(row.goalsCompleted)" :show-text="true" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('hr.performance.status')" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getReviewStatusType(row.status)" effect="dark" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewDate" :label="$t('hr.performance.date')" width="120">
          <template #default="{ row }">
            <span class="text-sm text-slate-400">{{ formatDate(row.reviewDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="100" align="center">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="viewReview(row)">
              <Icon name="ph:eye-bold" class="w-4 h-4" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Performance Distribution Chart -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4">{{ $t('hr.performance.ratingDistribution') }}</h3>
        <div ref="ratingChartRef" class="w-full h-64"></div>
      </div>
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4">{{ $t('common.departments') }}</h3>
        <div ref="deptChartRef" class="w-full h-64"></div>
      </div>
    </div>

    <!-- New Review Dialog -->
    <el-dialog v-model="showNewReviewDialog" :title="$t('hr.performance.newReview')" width="560px">
      <el-form label-position="top">
        <el-form-item :label="$t('hr.performance.employee')">
          <el-select v-model="newReview.employeeId" :placeholder="$t('hr.performance.selectEmployee')" class="w-full" filterable>
            <el-option v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('common.type')">
          <el-select v-model="newReview.reviewType" class="w-full">
            <el-option :label="$t('performance.quarterly')" value="QUARTERLY" />
            <el-option :label="$t('performance.annual')" value="ANNUAL" />
            <el-option :label="$t('performance.probation')" value="PROBATION" />
            <el-option :label="$t('performance.projectBased')" value="PROJECT" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('hr.performance.period')">
          <el-date-picker
            v-model="newReview.period"
            type="daterange"
            :start-placeholder="$t('common.startDate')"
            :end-placeholder="$t('common.endDate')"
            class="w-full"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewReviewDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="createReview">{{ $t('hr.performance.newReview') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts/core';
import { useApiFetch } from '~/composables/useApiFetch';
import logger from '~/utils/logger'

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();

const selectedCycle = ref('Q1-2026');
const showNewReviewDialog = ref(false);
const ratingChartRef = ref<HTMLElement>();
const deptChartRef = ref<HTMLElement>();
const loading = ref(false);
const creating = ref(false);

const reviews = ref<Record<string, unknown>[]>([]);
const employees = ref<Record<string, unknown>[]>([]);
const newReview = ref({ employeeId: '', reviewType: 'QUARTERLY', period: null as unknown });

// --------------- helpers to map backend → display fields ---------------

/**
 * Calculate goal completion percentage from the goals JSONB array.
 * Each goal has { title, status, weight }. We sum the weights of goals
 * whose status is 'COMPLETED' (or 'DONE'/'MET') and divide by total weight.
 * If no weights are present, fall back to simple count ratio.
 */
function calcGoalCompletion(goals: Record<string, unknown>[] | null | undefined): number {
  if (!goals || !Array.isArray(goals) || goals.length === 0) return 0;

  const hasWeights = goals.some(g => g.weight !== null && g.weight !== undefined && g.weight > 0);

  if (hasWeights) {
    const totalWeight = goals.reduce((sum, g) => sum + (Number(g.weight) || 0), 0);
    if (totalWeight === 0) return 0;
    const completedWeight = goals
      .filter(g => ['COMPLETED', 'DONE', 'MET'].includes(String(g.status).toUpperCase()))
      .reduce((sum, g) => sum + (Number(g.weight) || 0), 0);
    return Math.round((completedWeight / totalWeight) * 100);
  }

  // Fallback: simple count
  const completed = goals.filter(g => ['COMPLETED', 'DONE', 'MET'].includes(String(g.status).toUpperCase())).length;
  return Math.round((completed / goals.length) * 100);
}

/**
 * Derive a reviewType label from the period string.
 * The backend `period` field is a free-form STRING (e.g. "Q1-2026", "ANNUAL-2025").
 */
function deriveReviewType(period: string | undefined): string {
  if (!period) return 'QUARTERLY';
  const upper = period.toUpperCase();
  if (upper.startsWith('ANNUAL')) return 'ANNUAL';
  if (upper.includes('PROBATION')) return 'PROBATION';
  if (upper.includes('PROJECT')) return 'PROJECT';
  return 'QUARTERLY';
}

/** Map a raw backend PerformanceReview record into the shape the template expects. */
function mapReview(raw: unknown): unknown {
  return {
    id: raw.id,
    employeeName: raw.employee ? `${raw.employee.firstName || ''} ${raw.employee.lastName || ''}`.trim() : `Employee #${raw.employeeId}`,
    department: raw.employee?.department || '-',
    reviewType: deriveReviewType(raw.period),
    overallRating: Number(raw.overallRating) || 0,
    goalsCompleted: calcGoalCompletion(raw.goals),
    status: raw.status || 'DRAFT',
    reviewDate: raw.reviewDate || raw.createdAt || '',
    avatar: raw.employee?.profilePicture || undefined,
    // Keep the raw record for detail navigation
    _raw: raw
  };
}

// --------------- API calls ---------------

const fetchReviews = async () => {
  loading.value = true;
  try {
    const query = selectedCycle.value ? `?period=${selectedCycle.value}` : '';
    const res = await useApiFetch(`hr/performance${query}`);
    if (res?.success) {
      const docs = res.body?.docs || res.body || [];
      reviews.value = (Array.isArray(docs) ? docs : []).map(mapReview);
    } else {
      reviews.value = [];
    }
  } catch (e) {
    logger.error('Failed to fetch performance reviews', e);
    reviews.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchEmployees = async () => {
  const res = await useApiFetch('hr/employees?limit=100');
  if (res?.success) {
    employees.value = res.body?.docs || res.body || [];
  }
};

// --------------- computed KPIs ---------------

const avgRating = computed(() => {
  if (!reviews.value.length) return 0;
  return (reviews.value.reduce((s, r) => s + r.overallRating, 0) / reviews.value.length).toFixed(1);
});

const goalCompletion = computed(() => {
  if (!reviews.value.length) return 0;
  return Math.round(reviews.value.reduce((s, r) => s + r.goalsCompleted, 0) / reviews.value.length);
});

// --------------- UI helpers ---------------

const getProgressColor = (pct: number) => {
  if (pct >= 80) return '#10B981';
  if (pct >= 60) return '#F59E0B';
  return '#EF4444';
};

const getReviewStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    COMPLETED: 'success',
    ACKNOWLEDGED: 'success',
    IN_PROGRESS: 'warning',
    DRAFT: 'info',
    PENDING: 'info',
    CANCELLED: 'danger'
  };
  return map[status] || 'info';
};

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '-');

// --------------- actions ---------------

const viewReview = async (review: unknown) => {
  const router = useRouter();
  // Navigate to detail view if route exists, otherwise show info
  try {
    await router.push(`/hr/performance-reviews/${review.id}`);
  } catch {
    ElMessage.info(`Viewing review for ${review.employeeName}`);
  }
};

const createReview = async () => {
  if (!newReview.value.employeeId) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }

  creating.value = true;
  try {
    // Build period string from the selected review cycle / date range
    let periodStr = selectedCycle.value || '';
    if (newReview.value.period && Array.isArray(newReview.value.period) && newReview.value.period.length === 2) {
      const start = new Date(newReview.value.period[0]).toISOString().slice(0, 10);
      const end = new Date(newReview.value.period[1]).toISOString().slice(0, 10);
      periodStr = `${start} to ${end}`;
    }

    const payload: Record<string, unknown> = {
      employeeId: Number(newReview.value.employeeId),
      period: periodStr,
      status: 'DRAFT',
      reviewDate: new Date().toISOString().slice(0, 10)
    };

    const res = await useApiFetch('hr/performance', 'POST', payload);
    if (res?.success) {
      ElMessage.success(t('performanceReviews.reviewStarted'));
      showNewReviewDialog.value = false;
      newReview.value = { employeeId: '', reviewType: 'QUARTERLY', period: null };
      // Reload reviews to include the new one
      await fetchReviews();
    } else {
      ElMessage.error(res?.message || 'Failed to create review');
    }
  } catch (e: unknown) {
    ElMessage.error(e?.message || 'Failed to create review');
  } finally {
    creating.value = false;
  }
};

// --------------- charts ---------------

const renderCharts = () => {
  // ---- Rating Distribution (bar chart) ----
  if (ratingChartRef.value) {
    const buckets = [0, 0, 0, 0, 0]; // 1-star, 2-star, 3-star, 4-star, 5-star
    reviews.value.forEach(r => {
      const idx = Math.min(Math.max(Math.round(r.overallRating) - 1, 0), 4);
      buckets[idx]!++;
    });

    const chart = echarts.init(ratingChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
        axisLabel: { color: '#64748b' },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [
        {
          type: 'bar',
          data: buckets,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#8B5CF6' },
              { offset: 1, color: '#6D28D9' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '50%'
        }
      ]
    });
  }

  // ---- Department Performance (radar chart) ----
  if (deptChartRef.value) {
    // Aggregate average ratings per department from real data
    const deptMap: Record<string, { sum: number; count: number }> = {};
    reviews.value.forEach(r => {
      const dept = r.department || 'Other';
      if (!deptMap[dept]) deptMap[dept] = { sum: 0, count: 0 };
      deptMap[dept].sum += r.overallRating;
      deptMap[dept].count++;
    });

    // Build indicator and value arrays from the data
    const departments = Object.keys(deptMap);
    // If we have data, use real departments; otherwise show placeholders
    const indicators =
      departments.length > 0
        ? departments.map(name => ({ name, max: 5 }))
        : [
            { name: 'Sales', max: 5 },
            { name: 'Marketing', max: 5 },
            { name: 'Engineering', max: 5 },
            { name: 'HR', max: 5 },
            { name: 'Operations', max: 5 }
          ];

    const values =
      departments.length > 0
        ? departments.map(dept => {
            const entry = deptMap[dept]!;
            return Number((entry.sum / entry.count).toFixed(1));
          })
        : [0, 0, 0, 0, 0];

    const chart = echarts.init(deptChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
      radar: {
        indicator: indicators,
        axisName: { color: '#94a3b8' },
        splitArea: { areaStyle: { color: ['rgba(30,41,59,0.5)', 'rgba(30,41,59,0.3)'] } },
        splitLine: { lineStyle: { color: '#334155' } },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: values,
              name: 'Avg Rating',
              areaStyle: { color: 'rgba(99,102,241,0.2)' },
              lineStyle: { color: '#6366F1', width: 2 },
              itemStyle: { color: '#6366F1' }
            }
          ]
        }
      ]
    });
  }
};

// --------------- lifecycle ---------------

onMounted(async () => {
  await Promise.all([fetchReviews(), fetchEmployees()]);
  await nextTick();
  renderCharts();
});
</script>
