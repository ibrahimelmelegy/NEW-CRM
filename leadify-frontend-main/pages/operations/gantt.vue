<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">Gantt Timeline</h1>
          <p class="text-slate-400 text-sm mt-1">Visualize project schedules, dependencies, and milestones.</p>
        </div>
        <div class="flex gap-2">
          <el-button-group>
            <el-button :type="viewMode === 'week' ? 'primary' : 'default'" size="small" @click="viewMode = 'week'">Week</el-button>
            <el-button :type="viewMode === 'month' ? 'primary' : 'default'" size="small" @click="viewMode = 'month'">Month</el-button>
            <el-button :type="viewMode === 'quarter' ? 'primary' : 'default'" size="small" @click="viewMode = 'quarter'">Quarter</el-button>
          </el-button-group>
          <el-button type="primary" class="!rounded-xl" @click="showTaskDialog = true">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            Add Task
          </el-button>
        </div>
      </div>
    </div>

    <!-- Project Selector & Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ tasks.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Tasks</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ tasks.filter(t => t.progress === 100).length }}</div>
        <div class="text-xs text-slate-500 mt-1">Completed</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ tasks.filter(t => t.progress > 0 && t.progress < 100).length }}</div>
        <div class="text-xs text-slate-500 mt-1">In Progress</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ overdueTasks }}</div>
        <div class="text-xs text-slate-500 mt-1">Overdue</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ overallProgress }}%</div>
        <div class="text-xs text-slate-500 mt-1">Overall Progress</div>
      </div>
    </div>

    <!-- Gantt Chart -->
    <div class="glass-panel rounded-2xl overflow-hidden">
      <!-- Timeline Header -->
      <div class="flex border-b border-slate-800/60">
        <div class="w-72 flex-shrink-0 p-3 border-r border-slate-800/60">
          <span class="text-sm font-medium text-slate-300">Task Name</span>
        </div>
        <div class="flex-1 flex overflow-x-auto">
          <div
            v-for="(date, idx) in timelineDates"
            :key="idx"
            class="flex-shrink-0 text-center p-2 border-r border-slate-800/30"
            :style="{ width: cellWidth + 'px' }"
            :class="isToday(date) ? 'bg-primary-500/10' : ''"
          >
            <div class="text-[10px] text-slate-600">{{ formatDayName(date) }}</div>
            <div class="text-xs text-slate-400">{{ formatDay(date) }}</div>
          </div>
        </div>
      </div>

      <!-- Task Rows -->
      <div v-for="task in tasks" :key="task.id" class="flex border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors group">
        <!-- Task Info -->
        <div class="w-72 flex-shrink-0 p-3 border-r border-slate-800/60">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: task.color }"></div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-200 truncate">{{ task.name }}</div>
              <div class="flex items-center gap-2 mt-1">
                <el-avatar :size="18" class="bg-slate-700 text-[10px]">{{ task.assignee?.charAt(0) }}</el-avatar>
                <span class="text-[10px] text-slate-500">{{ task.assignee }}</span>
                <el-tag v-if="task.isMilestone" type="warning" effect="dark" size="small" class="!text-[10px]">Milestone</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- Gantt Bar Area -->
        <div class="flex-1 relative overflow-x-auto" style="min-height: 48px">
          <div class="flex h-full">
            <div
              v-for="(date, idx) in timelineDates"
              :key="idx"
              class="flex-shrink-0 border-r border-slate-800/20 h-full"
              :style="{ width: cellWidth + 'px' }"
              :class="isToday(date) ? 'bg-primary-500/5' : ''"
            ></div>
          </div>
          <!-- Actual Bar -->
          <div
            class="absolute top-3 h-6 rounded-md flex items-center px-2 cursor-pointer transition-all hover:brightness-110"
            :style="getBarStyle(task)"
            @click="editTask(task)"
          >
            <template v-if="task.isMilestone">
              <Icon name="ph:diamond-fill" class="w-4 h-4 text-amber-400" />
            </template>
            <template v-else>
              <!-- Progress Fill -->
              <div
                class="absolute left-0 top-0 h-full rounded-md opacity-40"
                :style="{ width: task.progress + '%', backgroundColor: task.color }"
              ></div>
              <span class="text-[10px] text-white font-medium relative z-10">{{ task.progress }}%</span>
            </template>
          </div>

          <!-- Dependency Arrow -->
          <svg v-if="task.dependency" class="absolute top-0 left-0 w-full h-full pointer-events-none" style="overflow: visible">
            <line
              :x1="getDependencyLine(task).x1"
              y1="24"
              :x2="getDependencyLine(task).x2"
              y2="24"
              stroke="#6366F1"
              stroke-width="1.5"
              stroke-dasharray="4 2"
              marker-end="url(#arrowhead)"
            />
          </svg>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="tasks.length === 0" class="p-12 text-center">
        <Icon name="ph:calendar-blank-bold" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p class="text-slate-500">No tasks scheduled. Add your first task to get started.</p>
      </div>
    </div>

    <!-- Today Indicator Legend -->
    <div class="flex items-center gap-4 text-xs text-slate-500">
      <div class="flex items-center gap-1">
        <div class="w-3 h-1 bg-primary-500 rounded"></div>
        Today
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded-sm bg-blue-500/40"></div>
        In Progress
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded-sm bg-emerald-500/40"></div>
        Completed
      </div>
      <div class="flex items-center gap-1">
        <Icon name="ph:diamond-fill" class="w-3 h-3 text-amber-400" />
        Milestone
      </div>
      <div class="flex items-center gap-1">
        <div class="w-4 border-t border-dashed border-indigo-400"></div>
        Dependency
      </div>
    </div>

    <!-- Add Task Dialog -->
    <el-dialog v-model="showTaskDialog" title="Add Gantt Task" width="520px">
      <el-form label-position="top">
        <el-form-item label="Task Name">
          <el-input v-model="newTask.name" placeholder="e.g., Backend API Development" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Start Date">
            <el-date-picker v-model="newTask.start" type="date" class="w-full" />
          </el-form-item>
          <el-form-item label="End Date">
            <el-date-picker v-model="newTask.end" type="date" class="w-full" />
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Assignee">
            <el-input v-model="newTask.assignee" placeholder="Name" />
          </el-form-item>
          <el-form-item label="Progress">
            <el-slider v-model="newTask.progress" :step="5" />
          </el-form-item>
        </div>
        <el-form-item label="Milestone">
          <el-switch v-model="newTask.isMilestone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTaskDialog = false">Cancel</el-button>
        <el-button type="primary" @click="addTask">Add Task</el-button>
      </template>
    </el-dialog>

    <!-- SVG Defs for Arrowhead -->
    <svg style="position: absolute; width: 0; height: 0">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" />
        </marker>
      </defs>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

interface GanttTask {
  id: number;
  name: string;
  start: string;
  end: string;
  progress: number;
  assignee: string;
  color: string;
  isMilestone?: boolean;
  dependency?: number;
}

const viewMode = ref('month');
const showTaskDialog = ref(false);
const cellWidth = computed(() => (viewMode.value === 'week' ? 80 : viewMode.value === 'month' ? 40 : 20));

const newTask = ref({ name: '', start: '', end: '', assignee: '', progress: 0, isMilestone: false });

const tasks = ref<GanttTask[]>([
  { id: 1, name: 'Project Planning & Requirements', start: '2026-02-01', end: '2026-02-14', progress: 100, assignee: 'Ahmed F.', color: '#10B981' },
  { id: 2, name: 'UI/UX Design Phase', start: '2026-02-10', end: '2026-02-28', progress: 85, assignee: 'Sara M.', color: '#8B5CF6', dependency: 1 },
  {
    id: 3,
    name: 'Backend API Development',
    start: '2026-02-15',
    end: '2026-03-15',
    progress: 60,
    assignee: 'Omar H.',
    color: '#3B82F6',
    dependency: 1
  },
  {
    id: 4,
    name: 'Frontend Implementation',
    start: '2026-02-20',
    end: '2026-03-20',
    progress: 40,
    assignee: 'Fatima A.',
    color: '#6366F1',
    dependency: 2
  },
  {
    id: 5,
    name: 'Design Review Milestone',
    start: '2026-02-28',
    end: '2026-02-28',
    progress: 0,
    assignee: 'Khalid I.',
    color: '#F59E0B',
    isMilestone: true
  },
  { id: 6, name: 'Integration Testing', start: '2026-03-10', end: '2026-03-25', progress: 15, assignee: 'Ahmed F.', color: '#EC4899', dependency: 3 },
  {
    id: 7,
    name: 'User Acceptance Testing',
    start: '2026-03-20',
    end: '2026-04-01',
    progress: 0,
    assignee: 'Sara M.',
    color: '#14B8A6',
    dependency: 6
  },
  {
    id: 8,
    name: 'Production Deployment',
    start: '2026-04-01',
    end: '2026-04-01',
    progress: 0,
    assignee: 'Omar H.',
    color: '#F59E0B',
    isMilestone: true,
    dependency: 7
  }
]);

const overdueTasks = computed(() => tasks.value.filter(t => new Date(t.end) < new Date() && t.progress < 100).length);
const overallProgress = computed(() => {
  if (!tasks.value.length) return 0;
  return Math.round(tasks.value.reduce((s, t) => s + t.progress, 0) / tasks.value.length);
});

// Generate timeline dates
const timelineDates = computed(() => {
  const dates: string[] = [];
  const start = new Date('2026-02-01');
  const days = viewMode.value === 'week' ? 14 : viewMode.value === 'month' ? 60 : 120;
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
});

const isToday = (d: string) => d === new Date().toISOString().slice(0, 10);
const formatDayName = (d: string) => new Date(d).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
const formatDay = (d: string) => new Date(d).getDate().toString();

const getBarStyle = (task: GanttTask) => {
  const timelineStart = new Date(timelineDates.value[0]);
  const taskStart = new Date(task.start);
  const taskEnd = new Date(task.end);
  const daysDiff = Math.max(0, (taskStart.getTime() - timelineStart.getTime()) / 86400000);
  const duration = Math.max(1, (taskEnd.getTime() - taskStart.getTime()) / 86400000);

  return {
    left: `${daysDiff * cellWidth.value}px`,
    width: task.isMilestone ? '24px' : `${duration * cellWidth.value}px`,
    backgroundColor: task.isMilestone ? 'transparent' : `${task.color}30`,
    border: task.isMilestone ? 'none' : `1px solid ${task.color}60`
  };
};

const getDependencyLine = (task: GanttTask) => {
  const dep = tasks.value.find(t => t.id === task.dependency);
  if (!dep) return { x1: 0, x2: 0 };
  const timelineStart = new Date(timelineDates.value[0]);
  const depEnd = ((new Date(dep.end).getTime() - timelineStart.getTime()) / 86400000) * cellWidth.value;
  const taskStart = ((new Date(task.start).getTime() - timelineStart.getTime()) / 86400000) * cellWidth.value;
  return { x1: depEnd, x2: taskStart };
};

const addTask = () => {
  if (!newTask.value.name) {
    ElMessage.warning('Task name required');
    return;
  }
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#6366F1', '#14B8A6'];
  tasks.value.push({
    id: Date.now(),
    name: newTask.value.name,
    start: newTask.value.start || '2026-03-01',
    end: newTask.value.end || '2026-03-15',
    progress: newTask.value.progress,
    assignee: newTask.value.assignee || 'Unassigned',
    color: colors[tasks.value.length % colors.length],
    isMilestone: newTask.value.isMilestone
  });
  showTaskDialog.value = false;
  newTask.value = { name: '', start: '', end: '', assignee: '', progress: 0, isMilestone: false };
  ElMessage.success('Task added');
};

const editTask = (task: GanttTask) => ElMessage.info(`Editing: ${task.name}`);
</script>
