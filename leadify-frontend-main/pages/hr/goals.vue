<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Goals & OKRs</h1>
          <p class="text-slate-400 text-sm mt-1">Set objectives, track key results, and align team goals across the organization.</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showGoalDialog = true">
          <Icon name="ph:target-bold" class="w-4 h-4 mr-2" />
          Create Goal
        </el-button>
      </div>
    </div>

    <!-- Progress Overview -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-5 rounded-xl">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-500">Company Goals</span>
          <Icon name="ph:buildings-bold" class="w-4 h-4 text-indigo-400" />
        </div>
        <div class="text-2xl font-bold text-slate-200">{{ companyGoals.length }}</div>
        <el-progress :percentage="avgProgress(companyGoals)" :stroke-width="4" :show-text="false" color="#6366F1" class="mt-2" />
      </div>
      <div class="glass-panel p-5 rounded-xl">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-500">Team Goals</span>
          <Icon name="ph:users-three-bold" class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-2xl font-bold text-slate-200">{{ teamGoals.length }}</div>
        <el-progress :percentage="avgProgress(teamGoals)" :stroke-width="4" :show-text="false" color="#10B981" class="mt-2" />
      </div>
      <div class="glass-panel p-5 rounded-xl">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-500">Personal Goals</span>
          <Icon name="ph:user-bold" class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-2xl font-bold text-slate-200">{{ personalGoals.length }}</div>
        <el-progress :percentage="avgProgress(personalGoals)" :stroke-width="4" :show-text="false" color="#F59E0B" class="mt-2" />
      </div>
      <div class="glass-panel p-5 rounded-xl">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-500">Overall Progress</span>
          <Icon name="ph:chart-line-up-bold" class="w-4 h-4 text-teal-400" />
        </div>
        <div class="text-2xl font-bold text-teal-400">{{ avgProgress(allGoals) }}%</div>
        <el-progress :percentage="avgProgress(allGoals)" :stroke-width="4" :show-text="false" color="#14B8A6" class="mt-2" />
      </div>
    </div>

    <!-- Goals Kanban View -->
    <el-tabs v-model="viewMode" class="glass-tabs">
      <el-tab-pane label="Board View" name="board">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Not Started -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-3 h-3 rounded-full bg-slate-500"></div>
              <h3 class="text-sm font-medium text-slate-400">Not Started</h3>
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
                  <span>{{ goal.keyResults?.length || 0 }} Key Results</span>
                  <span>Due: {{ formatDate(goal.dueDate) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- In Progress -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <h3 class="text-sm font-medium text-slate-400">In Progress</h3>
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
                  <span>Due: {{ formatDate(goal.dueDate) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Completed -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
              <h3 class="text-sm font-medium text-slate-400">Completed</h3>
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

      <el-tab-pane label="List View" name="list">
        <div class="glass-panel p-6 rounded-xl">
          <el-table :data="allGoals" class="glass-table" stripe>
            <el-table-column prop="title" label="Goal" min-width="200" />
            <el-table-column prop="level" label="Level" width="120">
              <template #default="{ row }">
                <el-tag :type="getLevelType(row.level)" effect="dark" size="small">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Progress" width="160">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="4" :color="getProgressColor(row.progress)" />
              </template>
            </el-table-column>
            <el-table-column prop="owner" label="Owner" width="140" />
            <el-table-column label="Due Date" width="120">
              <template #default="{ row }">
                <span class="text-sm text-slate-400">{{ formatDate(row.dueDate) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Status" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" effect="dark" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- New Goal Dialog -->
    <el-dialog v-model="showGoalDialog" title="Create New Goal" width="560px">
      <el-form label-position="top">
        <el-form-item label="Goal Title">
          <el-input v-model="newGoal.title" placeholder="e.g., Increase quarterly revenue by 20%" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="newGoal.description" type="textarea" :rows="2" placeholder="Describe the objective..." />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Level">
            <el-select v-model="newGoal.level" class="w-full">
              <el-option label="Company" value="COMPANY" />
              <el-option label="Team" value="TEAM" />
              <el-option label="Personal" value="PERSONAL" />
            </el-select>
          </el-form-item>
          <el-form-item label="Due Date">
            <el-date-picker v-model="newGoal.dueDate" type="date" class="w-full" />
          </el-form-item>
        </div>
        <el-form-item label="Key Results">
          <div class="space-y-2 w-full">
            <div v-for="(kr, idx) in newGoal.keyResults" :key="idx" class="flex gap-2">
              <el-input v-model="kr.title" placeholder="Key result..." class="flex-1" />
              <el-button text type="danger" @click="newGoal.keyResults.splice(idx, 1)">
                <Icon name="ph:x-bold" class="w-4 h-4" />
              </el-button>
            </div>
            <el-button text type="primary" @click="newGoal.keyResults.push({ id: Date.now(), title: '', completed: false })">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-1" />
              Add Key Result
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGoalDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createGoal">Create Goal</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const viewMode = ref('board');
const showGoalDialog = ref(false);
const newGoal = ref({
  title: '',
  description: '',
  level: 'PERSONAL',
  dueDate: new Date().toISOString().slice(0, 10),
  keyResults: [{ id: Date.now(), title: '', completed: false }]
});

const allGoals = ref([
  {
    id: 1,
    title: 'Increase Q1 Revenue by 25%',
    description: 'Drive revenue growth through new client acquisition and upselling',
    level: 'COMPANY',
    status: 'IN_PROGRESS',
    progress: 62,
    owner: 'Leadership',
    dueDate: '2026-03-31',
    keyResults: [
      { id: 1, title: 'Close 15 new enterprise deals', completed: false },
      { id: 2, title: 'Upsell 20% of existing clients', completed: true },
      { id: 3, title: 'Reduce churn to under 5%', completed: false }
    ]
  },
  {
    id: 2,
    title: 'Launch Marketing Automation',
    description: 'Implement full marketing automation pipeline',
    level: 'TEAM',
    status: 'IN_PROGRESS',
    progress: 45,
    owner: 'Marketing',
    dueDate: '2026-02-28',
    keyResults: [
      { id: 4, title: 'Set up email sequences', completed: true },
      { id: 5, title: 'Configure lead scoring', completed: false }
    ]
  },
  {
    id: 3,
    title: 'Achieve 95% Customer Satisfaction',
    description: 'Improve customer support response times and quality',
    level: 'COMPANY',
    status: 'IN_PROGRESS',
    progress: 78,
    owner: 'Support',
    dueDate: '2026-03-31',
    keyResults: [
      { id: 6, title: 'Response time under 2 hours', completed: true },
      { id: 7, title: 'CSAT score above 4.5', completed: true },
      { id: 8, title: 'Zero critical tickets unresolved over 48h', completed: false }
    ]
  },
  {
    id: 4,
    title: 'Complete Sales Training Program',
    description: 'Train all sales reps on new CRM features',
    level: 'PERSONAL',
    status: 'COMPLETED',
    progress: 100,
    owner: 'Ahmed Al-Farsi',
    dueDate: '2026-01-31',
    keyResults: []
  },
  {
    id: 5,
    title: 'Hire 5 New Engineers',
    description: 'Expand engineering team for product development',
    level: 'TEAM',
    status: 'NOT_STARTED',
    progress: 0,
    owner: 'HR',
    dueDate: '2026-04-30',
    keyResults: [
      { id: 9, title: 'Post job listings', completed: false },
      { id: 10, title: 'Screen 50 candidates', completed: false }
    ]
  },
  {
    id: 6,
    title: 'Reduce Operational Costs by 10%',
    description: 'Optimize processes and reduce overhead',
    level: 'COMPANY',
    status: 'NOT_STARTED',
    progress: 0,
    owner: 'Operations',
    dueDate: '2026-06-30',
    keyResults: []
  }
]);

const companyGoals = computed(() => allGoals.value.filter(g => g.level === 'COMPANY'));
const teamGoals = computed(() => allGoals.value.filter(g => g.level === 'TEAM'));
const personalGoals = computed(() => allGoals.value.filter(g => g.level === 'PERSONAL'));
const notStartedGoals = computed(() => allGoals.value.filter(g => g.status === 'NOT_STARTED'));
const inProgressGoals = computed(() => allGoals.value.filter(g => g.status === 'IN_PROGRESS'));
const completedGoals = computed(() => allGoals.value.filter(g => g.status === 'COMPLETED'));

const avgProgress = (goals: any[]) => {
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
    NOT_STARTED: 'info'
  };
  return map[status] || 'info';
};

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '-');

const createGoal = () => {
  if (!newGoal.value.title) {
    ElMessage.warning('Goal title is required');
    return;
  }
  allGoals.value.unshift({
    id: Date.now(),
    ...newGoal.value,
    status: 'NOT_STARTED',
    progress: 0,
    owner: 'Me'
  });
  showGoalDialog.value = false;
  newGoal.value = {
    title: '',
    description: '',
    level: 'PERSONAL',
    dueDate: new Date().toISOString().slice(0, 10),
    keyResults: [{ id: Date.now(), title: '', completed: false }]
  };
  ElMessage.success('Goal created successfully');
};
</script>
