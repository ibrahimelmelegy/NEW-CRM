<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">{{ $t('hr.goals.title') }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('hr.goals.subtitle') }}</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showGoalDialog = true">
          <Icon name="ph:target-bold" class="w-4 h-4 mr-2" />
          {{ $t('hr.goals.createGoal') }}
        </el-button>
      </div>
    </div>

    <!-- Stats Dashboard -->
    <div v-if="!loading" class="space-y-4">
      <el-row :gutter="16">
        <el-col :xs="12" :sm="8" :md="4" :lg="4">
          <div class="glass-panel p-5 rounded-xl text-center">
            <div class="flex items-center justify-center mb-2">
              <Icon name="ph:target-bold" class="w-5 h-5 text-indigo-400" />
            </div>
            <div class="text-2xl font-bold text-slate-200">{{ statsData.totalGoals }}</div>
            <div class="text-xs text-slate-500 mt-1">{{ $t('hr.goals.totalGoals') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4" :lg="4">
          <div class="glass-panel p-5 rounded-xl text-center">
            <div class="flex items-center justify-center mb-2">
              <Icon name="ph:check-circle-bold" class="w-5 h-5 text-emerald-400" />
            </div>
            <div class="text-2xl font-bold text-emerald-400">{{ statsData.completed }}</div>
            <div class="text-xs text-slate-500 mt-1">{{ $t('hr.goals.completed') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4" :lg="4">
          <div class="glass-panel p-5 rounded-xl text-center">
            <div class="flex items-center justify-center mb-2">
              <Icon name="ph:spinner-bold" class="w-5 h-5 text-blue-400" />
            </div>
            <div class="text-2xl font-bold text-blue-400">{{ statsData.inProgress }}</div>
            <div class="text-xs text-slate-500 mt-1">{{ $t('hr.goals.inProgress') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4" :lg="4">
          <div class="glass-panel p-5 rounded-xl text-center">
            <div class="flex items-center justify-center mb-2">
              <Icon name="ph:warning-bold" class="w-5 h-5 text-red-400" />
            </div>
            <div class="text-2xl font-bold text-red-400">{{ statsData.overdue }}</div>
            <div class="text-xs text-slate-500 mt-1">{{ $t('hr.goals.overdue') }}</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="8" :md="4" :lg="4">
          <div class="glass-panel p-5 rounded-xl text-center">
            <div class="flex items-center justify-center mb-2">
              <Icon name="ph:chart-line-up-bold" class="w-5 h-5 text-amber-400" />
            </div>
            <div class="text-2xl font-bold text-amber-400">{{ statsData.avgProgress }}%</div>
            <div class="text-xs text-slate-500 mt-1">{{ $t('hr.goals.avgProgress') }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- Overdue Goals Alert Panel -->
      <div v-if="overdueGoals.length" class="glass-panel p-5 rounded-xl border border-red-500/30">
        <div class="flex items-center gap-2 mb-4">
          <Icon name="ph:warning-circle-bold" class="w-5 h-5 text-red-400" />
          <h3 class="text-sm font-semibold text-red-400">{{ $t('hr.goals.overdueGoals') }} ({{ overdueGoals.length }})</h3>
        </div>
        <div class="space-y-2">
          <div
            v-for="og in overdueGoals"
            :key="og.id"
            class="flex items-center justify-between p-3 rounded-lg"
            style="background: rgba(239, 68, 68, 0.08)"
          >
            <div class="flex-1 min-w-0">
              <span class="text-sm font-medium text-slate-200 truncate block">{{ og.title }}</span>
              <span class="text-xs text-slate-500">Owner: {{ og.owner }}</span>
            </div>
            <div class="flex items-center gap-4 shrink-0 ml-4">
              <span class="text-xs text-slate-500">Due: {{ formatDate(og.dueDate) }}</span>
              <span class="text-xs font-bold text-red-400">{{ og.daysOverdue }}d overdue</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <el-icon class="is-loading text-teal-400" :size="32"><Loading /></el-icon>
    </div>

    <!-- Progress Overview -->
    <div v-if="!loading" class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="glass-panel p-5 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-slate-500">{{ $t('hr.goals.companyGoals') }}</span>
            <Icon name="ph:buildings-bold" class="w-4 h-4 text-indigo-400" />
          </div>
          <div class="text-2xl font-bold text-slate-200">{{ companyGoals.length }}</div>
          <el-progress :percentage="avgProgress(companyGoals)" :stroke-width="4" :show-text="false" color="#6366F1" class="mt-2" />
        </div>
        <div class="glass-panel p-5 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-slate-500">{{ $t('hr.goals.teamGoals') }}</span>
            <Icon name="ph:users-three-bold" class="w-4 h-4 text-emerald-400" />
          </div>
          <div class="text-2xl font-bold text-slate-200">{{ teamGoals.length }}</div>
          <el-progress :percentage="avgProgress(teamGoals)" :stroke-width="4" :show-text="false" color="#10B981" class="mt-2" />
        </div>
        <div class="glass-panel p-5 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-slate-500">{{ $t('hr.goals.personalGoals') }}</span>
            <Icon name="ph:user-bold" class="w-4 h-4 text-amber-400" />
          </div>
          <div class="text-2xl font-bold text-slate-200">{{ personalGoals.length }}</div>
          <el-progress :percentage="avgProgress(personalGoals)" :stroke-width="4" :show-text="false" color="#F59E0B" class="mt-2" />
        </div>
        <div class="glass-panel p-5 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-slate-500">{{ $t('hr.goals.overallProgress') }}</span>
            <Icon name="ph:chart-line-up-bold" class="w-4 h-4 text-teal-400" />
          </div>
          <div class="text-2xl font-bold text-teal-400">{{ avgProgress(allGoals) }}%</div>
          <el-progress :percentage="avgProgress(allGoals)" :stroke-width="4" :show-text="false" color="#14B8A6" class="mt-2" />
        </div>
      </div>

      <!-- Goals Kanban View -->
      <el-tabs v-model="viewMode" class="glass-tabs">
        <el-tab-pane :label="$t('hr.goals.boardView')" name="board">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Not Started -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 rounded-full bg-slate-500"></div>
                <h3 class="text-sm font-medium text-slate-400">{{ $t('hr.goals.notStarted') }}</h3>
                <span class="text-xs text-slate-600">({{ notStartedGoals.length }})</span>
              </div>
              <div class="space-y-3">
                <div v-for="goal in notStartedGoals" :key="goal.id" class="glass-panel p-4 rounded-xl hover:border-slate-600 transition">
                  <div class="flex items-start justify-between">
                    <h4 class="text-sm font-medium text-slate-200">{{ goal.title }}</h4>
                    <el-tag :type="getLevelType(goal.level)" effect="dark" size="small">{{ goal.level }}</el-tag>
                  </div>
                  <p class="text-xs text-slate-500 mt-2 line-clamp-2">{{ goal.description }}</p>
                  <div class="mt-3">
                    <el-progress :percentage="goal.progress" :stroke-width="4" :color="getProgressColor(goal.progress)" />
                  </div>
                  <div class="flex items-center justify-between mt-3 text-xs text-slate-500">
                    <span>{{ goal.keyResults?.length || 0 }} {{ $t('hr.goals.keyResults') }}</span>
                    <span>{{ $t('hr.goals.date') }}: {{ formatDate(goal.dueDate) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- In Progress -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                <h3 class="text-sm font-medium text-slate-400">{{ $t('hr.goals.inProgress') }}</h3>
                <span class="text-xs text-slate-600">({{ inProgressGoals.length }})</span>
              </div>
              <div class="space-y-3">
                <div
                  v-for="goal in inProgressGoals"
                  :key="goal.id"
                  class="glass-panel p-4 rounded-xl border-l-2 border-blue-500 hover:border-blue-400 transition"
                >
                  <div class="flex items-start justify-between">
                    <h4 class="text-sm font-medium text-slate-200">{{ goal.title }}</h4>
                    <el-tag :type="getLevelType(goal.level)" effect="dark" size="small">{{ goal.level }}</el-tag>
                  </div>
                  <p class="text-xs text-slate-500 mt-2 line-clamp-2">{{ goal.description }}</p>
                  <div class="mt-3">
                    <el-progress :percentage="goal.progress" :stroke-width="4" :color="getProgressColor(goal.progress)" />
                  </div>
                  <!-- Key Results -->
                  <div v-if="goal.keyResults?.length" class="mt-3 space-y-1">
                    <div v-for="kr in goal.keyResults.slice(0, 3)" :key="kr.id" class="flex items-center gap-2 text-xs">
                      <el-checkbox :model-value="kr.completed" size="small" disabled />
                      <span class="text-slate-400" :class="kr.completed ? 'line-through' : ''">{{ kr.title }}</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between mt-3 text-xs text-slate-500">
                    <span>{{ goal.owner }}</span>
                    <span>{{ $t('hr.goals.date') }}: {{ formatDate(goal.dueDate) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Completed -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                <h3 class="text-sm font-medium text-slate-400">{{ $t('hr.goals.completed') }}</h3>
                <span class="text-xs text-slate-600">({{ completedGoals.length }})</span>
              </div>
              <div class="space-y-3">
                <div v-for="goal in completedGoals" :key="goal.id" class="glass-panel p-4 rounded-xl border-l-2 border-emerald-500 opacity-80">
                  <div class="flex items-start justify-between">
                    <h4 class="text-sm font-medium text-slate-200">{{ goal.title }}</h4>
                    <Icon name="ph:check-circle-bold" class="w-5 h-5 text-emerald-400" />
                  </div>
                  <p class="text-xs text-slate-500 mt-2">{{ goal.description }}</p>
                  <div class="mt-3">
                    <el-progress :percentage="100" :stroke-width="4" color="#10B981" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="$t('hr.goals.listView')" name="list">
          <div class="glass-panel p-6 rounded-xl">
            <el-table :data="allGoals" class="glass-table" stripe>
              <el-table-column prop="title" :label="$t('hr.goals.goal')" min-width="200" />
              <el-table-column prop="level" :label="$t('hr.goals.level')" width="120">
                <template #default="{ row }">
                  <el-tag :type="getLevelType(row.level)" effect="dark" size="small">{{ row.level }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('hr.goals.progress')" width="160">
                <template #default="{ row }">
                  <div class="flex items-center gap-2">
                    <el-progress :percentage="row.progress" :stroke-width="4" :color="getProgressColor(row.progress)" class="flex-1" />
                    <el-button text size="small" @click="openProgressDialog(row)">
                      <Icon name="ph:pencil-simple-bold" class="w-3.5 h-3.5 text-slate-400" />
                    </el-button>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="owner" :label="$t('hr.goals.owner')" width="140" />
              <el-table-column :label="$t('hr.goals.date')" width="120">
                <template #default="{ row }">
                  <span class="text-sm text-slate-400">{{ formatDate(row.dueDate) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('hr.goals.status')" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" effect="dark" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- New Goal Dialog -->
    <el-dialog v-model="showGoalDialog" :title="$t('hr.goals.createGoal')" width="560px">
      <el-form label-position="top">
        <el-form-item :label="$t('hr.goals.goalTitle')">
          <el-input v-model="newGoal.title" :placeholder="$t('hr.goals.goalTitlePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('hr.goals.description')">
          <el-input v-model="newGoal.description" type="textarea" :rows="2" :placeholder="$t('hr.goals.descriptionPlaceholder')" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('hr.goals.level')">
            <el-select v-model="newGoal.level" class="w-full">
              <el-option :label="$t('hr.goals.company')" value="COMPANY" />
              <el-option :label="$t('hr.goals.team')" value="TEAM" />
              <el-option :label="$t('hr.goals.personal')" value="PERSONAL" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('hr.goals.date')">
            <el-date-picker v-model="newGoal.dueDate" type="date" class="w-full" />
          </el-form-item>
        </div>
        <el-form-item :label="$t('hr.goals.owner')">
          <el-input v-model="newGoal.owner" :placeholder="$t('hr.goals.ownerPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('hr.goals.keyResults')">
          <div class="space-y-2 w-full">
            <div v-for="(kr, idx) in newGoal.keyResults" :key="idx" class="flex gap-2">
              <el-input v-model="kr.title" :placeholder="$t('hr.goals.keyResultPlaceholder')" class="flex-1" />
              <el-button text type="danger" @click="newGoal.keyResults.splice(idx, 1)">
                <Icon name="ph:x-bold" class="w-4 h-4" />
              </el-button>
            </div>
            <el-button text type="primary" @click="newGoal.keyResults.push({ id: Date.now(), title: '', completed: false })">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-1" />
              {{ $t('hr.goals.addKeyResult') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGoalDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="createGoal">{{ $t('hr.goals.createGoalBtn') }}</el-button>
      </template>
    </el-dialog>

    <!-- Update Progress Dialog -->
    <el-dialog v-model="showProgressDialog" :title="$t('hr.goals.updateProgress')" width="420px">
      <div v-if="editingGoal" class="space-y-4">
        <h4 class="text-sm font-medium text-slate-200">{{ editingGoal.title }}</h4>
        <el-form-item :label="$t('hr.goals.progressPercent')">
          <el-slider v-model="editProgress" :min="0" :max="100" :step="5" show-input />
        </el-form-item>
        <el-form-item :label="$t('hr.goals.status')">
          <el-select v-model="editStatus" class="w-full">
            <el-option :label="$t('hr.goals.notStartedStatus')" value="NOT_STARTED" />
            <el-option :label="$t('hr.goals.inProgressStatus')" value="IN_PROGRESS" />
            <el-option :label="$t('hr.goals.completedStatus')" value="COMPLETED" />
            <el-option :label="$t('hr.goals.cancelledStatus')" value="CANCELLED" />
          </el-select>
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="showProgressDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="updateGoalProgress">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { $i18n } = useNuxtApp();
const t = $i18n.t;

interface KeyResult {
  id: number;
  title: string;
  completed: boolean;
}

interface Goal {
  id: number;
  title: string;
  description: string;
  level: string;
  status: string;
  progress: number;
  owner: string;
  dueDate: string;
  keyResults: KeyResult[];
  parentGoalId?: number | null;
}

const viewMode = ref('board');
const showGoalDialog = ref(false);
const showProgressDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const editingGoal = ref<Goal | null>(null);
const editProgress = ref(0);
const editStatus = ref('NOT_STARTED');

const newGoal = ref({
  title: '',
  description: '',
  level: 'PERSONAL',
  owner: '',
  dueDate: new Date().toISOString().slice(0, 10),
  keyResults: [{ id: Date.now(), title: '', completed: false }] as KeyResult[]
});

const allGoals = ref<Goal[]>([]);

// Stats dashboard data
const statsData = ref({
  totalGoals: 0,
  completed: 0,
  inProgress: 0,
  overdue: 0,
  avgProgress: 0
});

interface OverdueGoal {
  id: number;
  title: string;
  owner: string;
  dueDate: string;
  daysOverdue: number;
}

const overdueGoals = ref<OverdueGoal[]>([]);

const companyGoals = computed(() => allGoals.value.filter(g => g.level === 'COMPANY'));
const teamGoals = computed(() => allGoals.value.filter(g => g.level === 'TEAM'));
const personalGoals = computed(() => allGoals.value.filter(g => g.level === 'PERSONAL'));
const notStartedGoals = computed(() => allGoals.value.filter(g => g.status === 'NOT_STARTED'));
const inProgressGoals = computed(() => allGoals.value.filter(g => g.status === 'IN_PROGRESS'));
const completedGoals = computed(() => allGoals.value.filter(g => g.status === 'COMPLETED'));

const avgProgress = (goals: Goal[]) => {
  if (!goals.length) return 0;
  return Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length);
};

const getProgressColor = (pct: number) => {
  if (pct >= 80) return '#10B981';
  if (pct >= 50) return '#3B82F6';
  if (pct >= 25) return '#F59E0B';
  return '#94A3B8';
};

const getLevelType = (level: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = { COMPANY: undefined, TEAM: 'success', PERSONAL: 'warning' };
  return map[level] || 'info';
};

const getStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    COMPLETED: 'success',
    IN_PROGRESS: 'warning',
    NOT_STARTED: 'info',
    CANCELLED: 'danger'
  };
  return map[status] || 'info';
};

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '-');

// Fetch all goals from API
const fetchGoals = async () => {
  loading.value = true;
  try {
    const res = await useApiFetch('goals?limit=100');
    if (res?.success) {
      allGoals.value = res.body?.docs || res.body || [];
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch (err) {
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
};

// Create a new goal via API
const createGoal = async () => {
  if (!newGoal.value.title) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }

  // Filter out empty key results
  const keyResults = newGoal.value.keyResults.filter(kr => kr.title.trim());

  // Format dueDate to YYYY-MM-DD string if it's a Date object
  const dueDate = newGoal.value.dueDate instanceof Date
    ? newGoal.value.dueDate.toISOString().slice(0, 10)
    : newGoal.value.dueDate;

  const payload = {
    title: newGoal.value.title,
    description: newGoal.value.description,
    level: newGoal.value.level,
    owner: newGoal.value.owner || 'Me',
    dueDate,
    status: 'NOT_STARTED',
    progress: 0,
    keyResults
  };

  saving.value = true;
  try {
    const res = await useApiFetch('goals', 'POST', payload);
    if (res?.success) {
      ElMessage.success(t('common.saved'));
      showGoalDialog.value = false;
      // Reset the form
      newGoal.value = {
        title: '',
        description: '',
        level: 'PERSONAL',
        owner: '',
        dueDate: new Date().toISOString().slice(0, 10),
        keyResults: [{ id: Date.now(), title: '', completed: false }]
      };
      // Refresh goals list from server
      await fetchGoals();
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch (err) {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
};

// Open progress update dialog
const openProgressDialog = (goal: Goal) => {
  editingGoal.value = goal;
  editProgress.value = goal.progress;
  editStatus.value = goal.status;
  showProgressDialog.value = true;
};

// Update goal progress and status via API
const updateGoalProgress = async () => {
  if (!editingGoal.value) return;

  saving.value = true;
  try {
    const res = await useApiFetch(`goals/${editingGoal.value.id}`, 'PUT', {
      progress: editProgress.value,
      status: editStatus.value
    });
    if (res?.success) {
      ElMessage.success(t('common.saved'));
      showProgressDialog.value = false;
      editingGoal.value = null;
      // Refresh goals list from server
      await fetchGoals();
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch (err) {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
};

// Fetch stats from API
const fetchStats = async () => {
  try {
    const res = await useApiFetch('goals/stats');
    if (res?.success && res.body) {
      const d = res.body as any;
      statsData.value = {
        totalGoals: d.totalGoals ?? d.total ?? 0,
        completed: d.completed ?? 0,
        inProgress: d.inProgress ?? 0,
        overdue: d.overdue ?? 0,
        avgProgress: d.avgProgress ?? 0
      };
    }
  } catch {
    // Stats are supplementary; silently ignore errors
  }
};

// Fetch overdue goals from API
const fetchOverdueGoals = async () => {
  try {
    const res = await useApiFetch('goals/overdue');
    if (res?.success && res.body) {
      const docs = (res.body as any).docs || res.body || [];
      overdueGoals.value = docs.map((g: any) => {
        const dueDate = new Date(g.dueDate);
        const now = new Date();
        const diffMs = now.getTime() - dueDate.getTime();
        const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        return {
          id: g.id,
          title: g.title,
          owner: g.owner || '--',
          dueDate: g.dueDate,
          daysOverdue: g.daysOverdue ?? daysOverdue
        };
      });
    }
  } catch {
    // Overdue data is supplementary; silently ignore errors
  }
};

onMounted(() => {
  fetchGoals();
  fetchStats();
  fetchOverdueGoals();
});
</script>
