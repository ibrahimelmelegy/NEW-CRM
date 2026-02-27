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
    <div v-loading="loading" class="glass-panel rounded-2xl overflow-hidden">
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
      <div v-if="!loading && tasks.length === 0" class="p-12 text-center">
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
        <el-button type="primary" :loading="saving" @click="addTask">Add Task</el-button>
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
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';
import { user } from '~/composables/useUser';

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

/** Color palette for auto-assigning colors to tasks */
const GANTT_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#6366F1', '#14B8A6', '#F59E0B', '#EF4444'];

const viewMode = ref('month');
const showTaskDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const cellWidth = computed(() => (viewMode.value === 'week' ? 80 : viewMode.value === 'month' ? 40 : 20));

const newTask = ref({ name: '', start: '', end: '', assignee: '', progress: 0, isMilestone: false });

const tasks = ref<GanttTask[]>([]);

// ---------------------------------------------------------------------------
// Helpers: parse gantt metadata stored in the Task model's tags JSONB field
// ---------------------------------------------------------------------------

interface GanttMeta {
  color?: string;
  isMilestone?: boolean;
}

/**
 * Parse optional gantt metadata that is stored as a JSON string inside the
 * `tags` array.  We look for the first element that parses as an object
 * containing a `color` or `isMilestone` key.
 */
function parseGanttMeta(tags: any[]): GanttMeta {
  if (!Array.isArray(tags)) return {};
  for (const tag of tags) {
    if (typeof tag === 'string') {
      try {
        const parsed = JSON.parse(tag);
        if (parsed && typeof parsed === 'object' && ('color' in parsed || 'isMilestone' in parsed)) {
          return parsed as GanttMeta;
        }
      } catch {
        // not JSON -- skip
      }
    } else if (tag && typeof tag === 'object' && ('color' in tag || 'isMilestone' in tag)) {
      return tag as GanttMeta;
    }
  }
  return {};
}

/**
 * Derive a progress percentage from the backend Task status.
 * The `duration` field on the Task model is used to persist an explicit
 * progress value (0-100) when available.
 */
function statusToProgress(status: string, duration?: number | null): number {
  // If duration holds an explicit progress value, honour it
  if (typeof duration === 'number' && duration >= 0 && duration <= 100) return duration;
  switch (status) {
    case 'COMPLETED':
      return 100;
    case 'IN_PROGRESS':
      return 50;
    case 'CANCELLED':
      return 0;
    case 'PENDING':
    default:
      return 0;
  }
}

/** Map a raw backend Task record to a GanttTask for the chart */
function mapApiTaskToGantt(apiTask: any, index: number): GanttTask {
  const meta = parseGanttMeta(apiTask.tags || []);
  const today = new Date().toISOString().slice(0, 10);

  // Determine start and end dates
  const start = apiTask.date || (apiTask.dueDate ? apiTask.dueDate.slice(0, 10) : today);
  const end = apiTask.dueDate ? apiTask.dueDate.slice(0, 10) : start;

  return {
    id: apiTask.id,
    name: apiTask.title,
    start,
    end,
    progress: statusToProgress(apiTask.status, apiTask.duration),
    assignee: apiTask.assignee?.name || 'Unassigned',
    color: meta.color || GANTT_COLORS[index % GANTT_COLORS.length]!,
    isMilestone: meta.isMilestone || false,
    dependency: apiTask.parentTaskId || undefined
  };
}

// ---------------------------------------------------------------------------
// Fetch tasks from the API
// ---------------------------------------------------------------------------

async function fetchTasks() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('tasks?limit=200&entityType=GANTT&sortBy=createdAt&sort=ASC');
    if (success && body) {
      const data = (body as any).docs || body;
      if (Array.isArray(data)) {
        tasks.value = data.map((t: any, i: number) => mapApiTaskToGantt(t, i));
      }
    }
  } catch (e) {
    console.error('Failed to fetch gantt tasks:', e);
    ElMessage.error('Failed to load tasks');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchTasks();
});

// ---------------------------------------------------------------------------
// Computed stats
// ---------------------------------------------------------------------------

const overdueTasks = computed(() => tasks.value.filter(t => new Date(t.end) < new Date() && t.progress < 100).length);
const overallProgress = computed(() => {
  if (!tasks.value.length) return 0;
  return Math.round(tasks.value.reduce((s, t) => s + t.progress, 0) / tasks.value.length);
});

// ---------------------------------------------------------------------------
// Generate timeline dates
// ---------------------------------------------------------------------------

const timelineDates = computed(() => {
  const dates: string[] = [];
  // Determine the earliest start across all tasks, falling back to today
  let earliest = new Date();
  if (tasks.value.length) {
    const starts = tasks.value.map(t => new Date(t.start).getTime());
    earliest = new Date(Math.min(...starts));
    // Pad a few days before the earliest task
    earliest.setDate(earliest.getDate() - 3);
  }
  const days = viewMode.value === 'week' ? 14 : viewMode.value === 'month' ? 60 : 120;
  for (let i = 0; i < days; i++) {
    const d = new Date(earliest);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
});

const isToday = (d: string) => d === new Date().toISOString().slice(0, 10);
const formatDayName = (d: string) => new Date(d).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
const formatDay = (d: string) => new Date(d).getDate().toString();

// ---------------------------------------------------------------------------
// Bar rendering
// ---------------------------------------------------------------------------

const getBarStyle = (task: GanttTask) => {
  const timelineStart = new Date(timelineDates.value[0]!);
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
  const timelineStart = new Date(timelineDates.value[0]!);
  const depEnd = ((new Date(dep.end).getTime() - timelineStart.getTime()) / 86400000) * cellWidth.value;
  const taskStart = ((new Date(task.start).getTime() - timelineStart.getTime()) / 86400000) * cellWidth.value;
  return { x1: depEnd, x2: taskStart };
};

// ---------------------------------------------------------------------------
// Add task via API
// ---------------------------------------------------------------------------

function formatDateStr(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return '';
}

const addTask = async () => {
  if (!newTask.value.name) {
    ElMessage.warning('Task name required');
    return;
  }

  saving.value = true;

  const startStr = formatDateStr(newTask.value.start) || new Date().toISOString().slice(0, 10);
  const endStr = formatDateStr(newTask.value.end) || startStr;
  const color = GANTT_COLORS[tasks.value.length % GANTT_COLORS.length]!;

  // Derive status from progress
  let status = 'PENDING';
  if (newTask.value.progress >= 100) status = 'COMPLETED';
  else if (newTask.value.progress > 0) status = 'IN_PROGRESS';

  // Build gantt metadata to persist in tags
  const ganttMeta: GanttMeta = {
    color,
    isMilestone: newTask.value.isMilestone
  };

  const payload: Record<string, any> = {
    title: newTask.value.name,
    date: startStr,
    dueDate: endStr,
    status,
    priority: 'MEDIUM',
    entityType: 'GANTT',
    duration: newTask.value.progress, // store progress percentage
    tags: [JSON.stringify(ganttMeta)],
    assignedTo: user.value?.id || 1
  };

  try {
    const { body, success } = await useApiFetch('tasks', 'POST', payload);
    if (success && body) {
      const created = (body as any);
      tasks.value.push(mapApiTaskToGantt(created, tasks.value.length));
      showTaskDialog.value = false;
      newTask.value = { name: '', start: '', end: '', assignee: '', progress: 0, isMilestone: false };
      ElMessage.success('Task added');
    } else {
      ElMessage.error('Failed to create task');
    }
  } catch (e) {
    console.error('Failed to add gantt task:', e);
    ElMessage.error('Failed to create task');
  } finally {
    saving.value = false;
  }
};

const editTask = (task: GanttTask) => ElMessage.info(`Editing: ${task.name}`);
</script>
