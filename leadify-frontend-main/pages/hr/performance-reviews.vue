<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-400">Performance Reviews</h1>
          <p class="text-slate-400 text-sm mt-1">Track employee performance, set goals, and manage review cycles.</p>
        </div>
        <div class="flex gap-2">
          <el-select v-model="selectedCycle" placeholder="Review Cycle" class="w-48">
            <el-option label="Q1 2026" value="Q1-2026" />
            <el-option label="Q4 2025" value="Q4-2025" />
            <el-option label="Q3 2025" value="Q3-2025" />
            <el-option label="Annual 2025" value="ANNUAL-2025" />
          </el-select>
          <el-button type="primary" class="!rounded-xl" @click="showNewReviewDialog = true">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            New Review
          </el-button>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ reviews.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Reviews</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ reviews.filter(r => r.status === 'COMPLETED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Completed</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ reviews.filter(r => r.status === 'IN_PROGRESS').length }}</div>
        <div class="text-xs text-slate-500 mt-1">In Progress</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ avgRating }}/5</div>
        <div class="text-xs text-slate-500 mt-1">Avg Rating</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-teal-400">{{ goalCompletion }}%</div>
        <div class="text-xs text-slate-500 mt-1">Goal Completion</div>
      </div>
    </div>

    <!-- Reviews Table -->
    <div class="glass-panel p-6 rounded-2xl">
      <el-table :data="reviews" class="glass-table" stripe style="width: 100%">
        <el-table-column label="Employee" min-width="200">
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
        <el-table-column prop="reviewType" label="Type" width="130">
          <template #default="{ row }">
            <el-tag effect="dark" size="small">{{ row.reviewType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Overall Rating" width="180" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-2">
              <el-rate v-model="row.overallRating" disabled :max="5" size="small" />
              <span class="text-sm text-slate-400">{{ row.overallRating }}/5</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Goals Met" width="120" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.goalsCompleted" :stroke-width="4" :color="getProgressColor(row.goalsCompleted)" :show-text="true" />
          </template>
        </el-table-column>
        <el-table-column label="Status" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getReviewStatusType(row.status)" effect="dark" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewDate" label="Date" width="120">
          <template #default="{ row }">
            <span class="text-sm text-slate-400">{{ formatDate(row.reviewDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="100" align="center">
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
        <h3 class="text-sm font-medium text-slate-300 mb-4">Rating Distribution</h3>
        <div ref="ratingChartRef" class="w-full h-64"></div>
      </div>
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4">Department Performance</h3>
        <div ref="deptChartRef" class="w-full h-64"></div>
      </div>
    </div>

    <!-- New Review Dialog -->
    <el-dialog v-model="showNewReviewDialog" title="Start Performance Review" width="560px">
      <el-form label-position="top">
        <el-form-item label="Employee">
          <el-select v-model="newReview.employeeId" placeholder="Select employee" class="w-full" filterable>
            <el-option v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Review Type">
          <el-select v-model="newReview.reviewType" class="w-full">
            <el-option label="Quarterly" value="QUARTERLY" />
            <el-option label="Annual" value="ANNUAL" />
            <el-option label="Probation" value="PROBATION" />
            <el-option label="Project-Based" value="PROJECT" />
          </el-select>
        </el-form-item>
        <el-form-item label="Review Period">
          <el-date-picker v-model="newReview.period" type="daterange" start-placeholder="Start" end-placeholder="End" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewReviewDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createReview">Start Review</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const selectedCycle = ref('Q1-2026');
const showNewReviewDialog = ref(false);
const ratingChartRef = ref<HTMLElement>();
const deptChartRef = ref<HTMLElement>();

// Sample data structure - will connect to real API
const reviews = ref<any[]>([
  {
    id: 1,
    employeeName: 'Ahmed Al-Farsi',
    department: 'Sales',
    reviewType: 'QUARTERLY',
    overallRating: 4.2,
    goalsCompleted: 85,
    status: 'COMPLETED',
    reviewDate: '2026-01-15'
  },
  {
    id: 2,
    employeeName: 'Sara Mohammed',
    department: 'Marketing',
    reviewType: 'QUARTERLY',
    overallRating: 4.8,
    goalsCompleted: 95,
    status: 'COMPLETED',
    reviewDate: '2026-01-18'
  },
  {
    id: 3,
    employeeName: 'Omar Hassan',
    department: 'Engineering',
    reviewType: 'QUARTERLY',
    overallRating: 3.5,
    goalsCompleted: 70,
    status: 'IN_PROGRESS',
    reviewDate: '2026-02-01'
  },
  {
    id: 4,
    employeeName: 'Fatima Ali',
    department: 'HR',
    reviewType: 'ANNUAL',
    overallRating: 4.0,
    goalsCompleted: 80,
    status: 'COMPLETED',
    reviewDate: '2026-01-20'
  },
  {
    id: 5,
    employeeName: 'Khalid Ibrahim',
    department: 'Sales',
    reviewType: 'QUARTERLY',
    overallRating: 3.8,
    goalsCompleted: 75,
    status: 'PENDING',
    reviewDate: '2026-02-10'
  }
]);

const employees = ref<any[]>([]);
const newReview = ref({ employeeId: '', reviewType: 'QUARTERLY', period: null });

const avgRating = computed(() => {
  if (!reviews.value.length) return 0;
  return (reviews.value.reduce((s, r) => s + r.overallRating, 0) / reviews.value.length).toFixed(1);
});

const goalCompletion = computed(() => {
  if (!reviews.value.length) return 0;
  return Math.round(reviews.value.reduce((s, r) => s + r.goalsCompleted, 0) / reviews.value.length);
});

const getProgressColor = (pct: number) => {
  if (pct >= 80) return '#10B981';
  if (pct >= 60) return '#F59E0B';
  return '#EF4444';
};

const getReviewStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    COMPLETED: 'success',
    IN_PROGRESS: 'warning',
    PENDING: 'info',
    CANCELLED: 'danger'
  };
  return map[status] || 'info';
};

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '-');

const viewReview = (review: any) => ElMessage.info(`Viewing review for ${review.employeeName}`);
const createReview = () => {
  ElMessage.success('Performance review started');
  showNewReviewDialog.value = false;
};

const fetchEmployees = async () => {
  const res: any = await useApiFetch('hr/employees?limit=100');
  if (res?.success) {
    employees.value = res.body?.docs || res.body || [];
  }
};

const renderCharts = () => {
  if (ratingChartRef.value) {
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
          data: [0, 0, 1, 3, 1],
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

  if (deptChartRef.value) {
    const chart = echarts.init(deptChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
      radar: {
        indicator: [
          { name: 'Sales', max: 5 },
          { name: 'Marketing', max: 5 },
          { name: 'Engineering', max: 5 },
          { name: 'HR', max: 5 },
          { name: 'Operations', max: 5 }
        ],
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
              value: [4.0, 4.8, 3.5, 4.0, 3.7],
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

onMounted(async () => {
  fetchEmployees();
  await nextTick();
  renderCharts();
});
</script>
