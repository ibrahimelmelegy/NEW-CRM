<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">{{ $t('gantt.title') }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('gantt.subtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <el-button-group>
            <el-button :type="viewMode === 'week' ? 'primary' : 'default'" size="small" @click="viewMode = 'week'">{{ $t('gantt.week') }}</el-button>
            <el-button :type="viewMode === 'month' ? 'primary' : 'default'" size="small" @click="viewMode = 'month'">{{ $t('gantt.month') }}</el-button>
            <el-button :type="viewMode === 'quarter' ? 'primary' : 'default'" size="small" @click="viewMode = 'quarter'">{{ $t('gantt.quarter') }}</el-button>
          </el-button-group>
          <el-button :type="showCriticalPath ? 'warning' : 'default'" size="small" @click="showCriticalPath = !showCriticalPath">
            <Icon name="ph:lightning-bold" class="w-4 h-4 mr-1" />
            {{ $t('gantt.criticalPath') }}
          </el-button>
          <el-button class="!rounded-xl" @click="exportTasksCSV">
            <Icon name="ph:download-bold" class="w-4 h-4 mr-1" />
            {{ $t('common.export') }}
          </el-button>
          <el-button type="primary" class="!rounded-xl" @click="openAddDialog">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            {{ $t('gantt.addTask') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Project Selector & Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ tasks.length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('gantt.totalTasks') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ tasks.filter(t => t.progress === 100).length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('gantt.completed') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ tasks.filter(t => t.progress > 0 && t.progress < 100).length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('gantt.inProgress') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ overdueTasks }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('gantt.overdue') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ overallProgress }}%</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('gantt.overallProgress') }}</div>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <div v-if="selectedTaskCount > 0" class="glass-panel p-3 rounded-xl flex items-center gap-3 flex-wrap">
      <span class="text-sm font-medium" style="color: var(--text-primary)">{{ selectedTaskCount }} {{ $t('common.selected') }}</span>
      <el-button size="small" type="success" class="!rounded-xl" @click="bulkUpdateStatus('COMPLETED')">
        <Icon name="ph:check-circle-bold" class="w-3.5 h-3.5 mr-1" />
        {{ $t('gantt.completed') }}
      </el-button>
      <el-button size="small" class="!rounded-xl" @click="bulkUpdateStatus('IN_PROGRESS')">
        <Icon name="ph:play-bold" class="w-3.5 h-3.5 mr-1" />
        {{ $t('gantt.inProgress') }}
      </el-button>
      <el-button size="small" type="danger" class="!rounded-xl" @click="bulkDeleteTasks">
        <Icon name="ph:trash-bold" class="w-3.5 h-3.5 mr-1" />
        {{ $t('common.delete') }}
      </el-button>
      <el-button size="small" class="!rounded-xl" @click="exportTasksCSV">
        <Icon name="ph:download-bold" class="w-3.5 h-3.5 mr-1" />
        {{ $t('common.export') }}
      </el-button>
    </div>

    <!-- Gantt Chart -->
    <div v-loading="loading" class="glass-panel rounded-2xl overflow-hidden">
      <!-- Timeline Header -->
      <div class="flex border-b border-slate-800/60">
        <div class="w-72 flex-shrink-0 p-3 border-r border-slate-800/60 flex items-center gap-2">
          <el-checkbox v-model="selectAll" @change="toggleSelectAll" size="small" />
          <span class="text-sm font-medium text-slate-300">{{ $t('gantt.taskName') }}</span>
        </div>
        <div ref="timelineHeaderRef" class="flex-1 flex overflow-x-auto relative" @scroll="syncScroll('header', $event)">
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
          <!-- Today vertical line in header -->
          <div
            v-if="todayOffset >= 0"
            class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            :style="{ left: todayOffset + 'px' }"
          >
            <div class="absolute -top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] px-1 rounded-b font-bold whitespace-nowrap">{{ $t('gantt.today') }}</div>
          </div>
        </div>
      </div>

      <!-- Task Rows -->
      <div v-for="task in tasks" :key="task.id" class="flex border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors group">
        <!-- Task Info -->
        <div class="w-72 flex-shrink-0 p-3 border-r border-slate-800/60">
          <div class="flex items-center gap-2">
            <el-checkbox :model-value="selectedTaskIds.has(task.id)" @change="toggleTaskSelection(task.id)" size="small" @click.stop />
            <div
              class="w-2 h-2 rounded-full flex-shrink-0"
              :style="{ backgroundColor: task.color }"
              :class="showCriticalPath && isCriticalTask(task) ? 'ring-2 ring-red-500 ring-offset-1 ring-offset-slate-900' : ''"
            ></div>
            <div class="flex-1 min-w-0">
              <div
                class="text-sm font-medium truncate"
                :class="showCriticalPath && isCriticalTask(task) ? 'text-red-400' : 'text-slate-200'"
              >{{ task.name }}</div>
              <div class="flex items-center gap-2 mt-1">
                <el-avatar :size="18" class="bg-slate-700 text-[10px]">{{ task.assignee?.charAt(0) }}</el-avatar>
                <span class="text-[10px] text-slate-500">{{ task.assignee }}</span>
                <el-tag v-if="task.isMilestone" type="warning" effect="dark" size="small" class="!text-[10px]">{{ $t('gantt.milestone') }}</el-tag>
                <el-tag v-if="showCriticalPath && isCriticalTask(task)" type="danger" effect="dark" size="small" class="!text-[10px]">{{ $t('gantt.critical') }}</el-tag>
              </div>
            </div>
            <!-- Delete button visible on hover -->
            <el-button
              size="small"
              type="danger"
              plain
              class="!rounded-lg opacity-0 group-hover:opacity-100 transition-opacity !p-1"
              @click.stop="confirmDeleteTask(task)"
            >
              <Icon name="ph:trash-bold" class="w-3 h-3" />
            </el-button>
          </div>
        </div>

        <!-- Gantt Bar Area -->
        <div class="flex-1 relative overflow-x-auto" style="min-height: 48px" @scroll="syncScroll('row', $event)">
          <div class="flex h-full">
            <div
              v-for="(date, idx) in timelineDates"
              :key="idx"
              class="flex-shrink-0 border-r border-slate-800/20 h-full"
              :style="{ width: cellWidth + 'px' }"
              :class="isToday(date) ? 'bg-primary-500/5' : ''"
            ></div>
          </div>

          <!-- Today vertical line in rows -->
          <div
            v-if="todayOffset >= 0"
            class="absolute top-0 bottom-0 w-0.5 bg-red-500/40 z-[5] pointer-events-none"
            :style="{ left: todayOffset + 'px' }"
          ></div>

          <!-- Actual Bar -->
          <div
            class="absolute top-3 h-6 rounded-md flex items-center px-2 cursor-pointer transition-all hover:brightness-110"
            :style="getBarStyle(task)"
            :class="showCriticalPath && isCriticalTask(task) ? 'ring-1 ring-red-500' : ''"
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
            <!-- Resize handle (right edge) -->
            <div
              v-if="!task.isMilestone"
              class="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-white/20 rounded-r-md z-20"
              @mousedown.stop.prevent="startResize($event, task)"
            ></div>
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
        <p class="text-slate-500">{{ $t('gantt.noTasks') }}</p>
      </div>
    </div>

    <!-- Today Indicator Legend -->
    <div class="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 bg-red-500 rounded-sm"></div>
        {{ $t('gantt.todayLine') }}
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded-sm bg-blue-500/40"></div>
        {{ $t('gantt.inProgress') }}
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded-sm bg-emerald-500/40"></div>
        {{ $t('gantt.completed') }}
      </div>
      <div class="flex items-center gap-1">
        <Icon name="ph:diamond-fill" class="w-3 h-3 text-amber-400" />
        {{ $t('gantt.milestone') }}
      </div>
      <div class="flex items-center gap-1">
        <div class="w-4 border-t border-dashed border-indigo-400"></div>
        {{ $t('gantt.dependency') }}
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded-sm bg-red-500/40 ring-1 ring-red-500"></div>
        {{ $t('gantt.criticalPath') }}
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2 h-4 bg-white/20 border border-slate-500 rounded-sm cursor-col-resize"></div>
        {{ $t('gantt.dragToResize') }}
      </div>
    </div>

    <!-- Add/Edit Task Dialog -->
    <el-dialog v-model="showTaskDialog" :title="isEditing ? $t('gantt.editTask') : $t('gantt.addGanttTask')" width="520px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item :label="$t('gantt.taskName')">
          <el-input v-model="taskForm.name" :placeholder="$t('gantt.taskNamePlaceholder')" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('gantt.startDate')">
            <el-date-picker v-model="taskForm.start" type="date" class="w-full" />
          </el-form-item>
          <el-form-item :label="$t('gantt.endDate')">
            <el-date-picker v-model="taskForm.end" type="date" class="w-full" />
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('gantt.priority')">
            <el-select v-model="taskForm.priority" class="w-full">
              <el-option :label="$t('gantt.priorityLow')" value="LOW" />
              <el-option :label="$t('gantt.priorityMedium')" value="MEDIUM" />
              <el-option :label="$t('gantt.priorityHigh')" value="HIGH" />
              <el-option :label="$t('gantt.priorityUrgent')" value="URGENT" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('gantt.progress')">
            <el-slider v-model="taskForm.progress" :step="5" />
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('gantt.dependency')">
            <el-select v-model="taskForm.parentTaskId" class="w-full" clearable :placeholder="$t('gantt.none')">
              <el-option
                v-for="t in availableDependencies"
                :key="t.id"
                :label="t.name"
                :value="t.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('gantt.milestone')">
            <el-switch v-model="taskForm.isMilestone" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showTaskDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="isEditing" type="danger" plain :loading="deleting" @click="confirmDeleteTask(editingTask!)">{{ $t('common.delete') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveTask">{{ isEditing ? $t('gantt.update') : $t('gantt.addTask') }}</el-button>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';
import { user } from '~/composables/useUser';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { $i18n } = useNuxtApp();
const t = $i18n.t;

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
const showCriticalPath = ref(false);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const isEditing = ref(false);
const editingTask = ref<GanttTask | null>(null);

// Bulk Selection
const selectedTaskIds = ref<Set<number>>(new Set());
const selectAll = ref(false);

function toggleTaskSelection(taskId: number) {
  if (selectedTaskIds.value.has(taskId)) {
    selectedTaskIds.value.delete(taskId);
  } else {
    selectedTaskIds.value.add(taskId);
  }
  selectedTaskIds.value = new Set(selectedTaskIds.value); // trigger reactivity
  selectAll.value = tasks.value.length > 0 && selectedTaskIds.value.size === tasks.value.length;
}

function toggleSelectAll() {
  if (selectAll.value) {
    selectedTaskIds.value = new Set(tasks.value.map(t => t.id));
  } else {
    selectedTaskIds.value = new Set();
  }
}

const selectedTaskCount = computed(() => selectedTaskIds.value.size);
const cellWidth = computed(() => (viewMode.value === 'week' ? 80 : viewMode.value === 'month' ? 40 : 20));
const timelineHeaderRef = ref<HTMLElement>();

const taskForm = ref({
  name: '',
  start: '' as string | Date,
  end: '' as string | Date,
  progress: 0,
  isMilestone: false,
  priority: 'MEDIUM',
  parentTaskId: null as number | null
});

const tasks = ref<GanttTask[]>([]);

// Available dependencies for the parent task selector (exclude self when editing)
const availableDependencies = computed(() => {
  if (isEditing.value && editingTask.value) {
    return tasks.value.filter(t => t.id !== editingTask.value!.id);
  }
  return tasks.value;
});

// ---------------------------------------------------------------------------
// Helpers: parse gantt metadata stored in the Task model's tags JSONB field
// ---------------------------------------------------------------------------

interface GanttMeta {
  color?: string;
  isMilestone?: boolean;
}

function parseGanttMeta(tags: unknown[]): GanttMeta {
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

function statusToProgress(status: string, duration?: number | null): number {
  if (typeof duration === 'number' && duration >= 0 && duration <= 100) return duration;
  switch (status) {
    case 'COMPLETED': return 100;
    case 'IN_PROGRESS': return 50;
    case 'CANCELLED': return 0;
    case 'PENDING':
    default: return 0;
  }
}

function mapApiTaskToGantt(apiTask: Record<string, unknown>, index: number): GanttTask {
  const meta = parseGanttMeta(apiTask.tags || []);
  const today = new Date().toISOString().slice(0, 10);
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
      const data = (body as Record<string, unknown>).docs || body;
      if (Array.isArray(data)) {
        tasks.value = data.map((t: Record<string, unknown>, i: number) => mapApiTaskToGantt(t, i));
      }
    }
  } catch (e) {
    console.error('Failed to fetch gantt tasks:', e);
    ElMessage.error(t('common.error'));
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
// Critical Path computation
// ---------------------------------------------------------------------------

/**
 * Compute critical path: tasks that, if delayed, delay the project end.
 * Uses a simplified forward/backward pass algorithm.
 */
const criticalTaskIds = computed(() => {
  if (!tasks.value.length) return new Set<number>();

  const taskMap = new Map(tasks.value.map(t => [t.id, t]));
  const earlyStart = new Map<number, number>();
  const earlyFinish = new Map<number, number>();
  const lateStart = new Map<number, number>();
  const lateFinish = new Map<number, number>();

  const toMs = (d: string) => new Date(d).getTime();
  const DAY = 86400000;

  // Forward pass: compute early start and early finish
  const processed = new Set<number>();
  function forwardPass(task: GanttTask) {
    if (processed.has(task.id)) return;
    const dep = task.dependency ? taskMap.get(task.dependency) : null;
    if (dep && !processed.has(dep.id)) forwardPass(dep);

    const depFinish = dep ? (earlyFinish.get(dep.id) || toMs(dep.end)) : 0;
    const es = Math.max(toMs(task.start), depFinish);
    const duration = Math.max(DAY, toMs(task.end) - toMs(task.start));
    const ef = es + duration;

    earlyStart.set(task.id, es);
    earlyFinish.set(task.id, ef);
    processed.add(task.id);
  }

  for (const task of tasks.value) forwardPass(task);

  // Find project end (max early finish)
  let projectEnd = 0;
  for (const ef of earlyFinish.values()) {
    if (ef > projectEnd) projectEnd = ef;
  }

  // Backward pass: compute late start and late finish
  // Build a reverse dependency map: who depends on me?
  const dependents = new Map<number, number[]>();
  for (const task of tasks.value) {
    if (task.dependency) {
      if (!dependents.has(task.dependency)) dependents.set(task.dependency, []);
      dependents.get(task.dependency)!.push(task.id);
    }
  }

  const backProcessed = new Set<number>();
  function backwardPass(task: GanttTask) {
    if (backProcessed.has(task.id)) return;
    const deps = dependents.get(task.id) || [];
    for (const depId of deps) {
      const depTask = taskMap.get(depId);
      if (depTask && !backProcessed.has(depId)) backwardPass(depTask);
    }

    const lf = deps.length > 0
      ? Math.min(...deps.map(d => lateStart.get(d) || projectEnd))
      : projectEnd;
    const duration = Math.max(DAY, toMs(task.end) - toMs(task.start));
    const ls = lf - duration;

    lateFinish.set(task.id, lf);
    lateStart.set(task.id, ls);
    backProcessed.add(task.id);
  }

  for (const task of tasks.value) backwardPass(task);

  // Critical tasks: float = lateStart - earlyStart === 0
  const critical = new Set<number>();
  for (const task of tasks.value) {
    const es = earlyStart.get(task.id) || 0;
    const ls = lateStart.get(task.id) || 0;
    const slack = Math.abs(ls - es);
    if (slack < DAY && task.progress < 100) {
      critical.add(task.id);
    }
  }

  return critical;
});

function isCriticalTask(task: GanttTask): boolean {
  return criticalTaskIds.value.has(task.id);
}

// ---------------------------------------------------------------------------
// Generate timeline dates
// ---------------------------------------------------------------------------

const timelineDates = computed(() => {
  const dates: string[] = [];
  let earliest = new Date();
  if (tasks.value.length) {
    const starts = tasks.value.map(t => new Date(t.start).getTime());
    earliest = new Date(Math.min(...starts));
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

const todayStr = new Date().toISOString().slice(0, 10);
const isToday = (d: string) => d === todayStr;
const formatDayName = (d: string) => new Date(d).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
const formatDay = (d: string) => new Date(d).getDate().toString();

// Today line offset (px from left of timeline)
const todayOffset = computed(() => {
  if (!timelineDates.value.length) return -1;
  const timelineStart = new Date(timelineDates.value[0]!);
  const today = new Date(todayStr);
  const daysDiff = (today.getTime() - timelineStart.getTime()) / 86400000;
  if (daysDiff < 0 || daysDiff > timelineDates.value.length) return -1;
  return daysDiff * cellWidth.value + cellWidth.value / 2;
});

// ---------------------------------------------------------------------------
// Scroll sync between header and task rows
// ---------------------------------------------------------------------------

function syncScroll(_source: string, event: Event) {
  const target = event.target as HTMLElement;
  if (!target) return;
  if (timelineHeaderRef.value && target !== timelineHeaderRef.value) {
    timelineHeaderRef.value.scrollLeft = target.scrollLeft;
  }
}

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
// Drag-to-Resize: change end date by dragging the right edge of a bar
// ---------------------------------------------------------------------------

let resizingTask: GanttTask | null = null;
let resizeStartX = 0;
let resizeOriginalEnd = '';

function startResize(event: MouseEvent, task: GanttTask) {
  resizingTask = task;
  resizeStartX = event.clientX;
  resizeOriginalEnd = task.end;
  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
}

function onResizeMove(event: MouseEvent) {
  if (!resizingTask) return;
  const dx = event.clientX - resizeStartX;
  const daysDelta = Math.round(dx / cellWidth.value);
  if (daysDelta === 0) return;

  const newEnd = new Date(resizeOriginalEnd);
  newEnd.setDate(newEnd.getDate() + daysDelta);
  // Don't allow end before start
  if (newEnd.getTime() < new Date(resizingTask.start).getTime()) return;
  resizingTask.end = newEnd.toISOString().slice(0, 10);
}

async function onResizeEnd() {
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);

  if (!resizingTask || resizingTask.end === resizeOriginalEnd) {
    resizingTask = null;
    return;
  }

  const task = resizingTask;
  resizingTask = null;

  // Persist the new end date via API
  try {
    const ganttMeta: GanttMeta = { color: task.color, isMilestone: task.isMilestone };
    let status = 'PENDING';
    if (task.progress >= 100) status = 'COMPLETED';
    else if (task.progress > 0) status = 'IN_PROGRESS';

    const { success } = await useApiFetch(`tasks/${task.id}`, 'PUT', {
      dueDate: task.end,
      date: task.start,
      duration: task.progress,
      status,
      entityType: 'GANTT',
      tags: [JSON.stringify(ganttMeta)]
    });
    if (success) {
      ElMessage.success(t('common.saved'));
    } else {
      // Revert
      task.end = resizeOriginalEnd;
      ElMessage.error(t('common.error'));
    }
  } catch {
    task.end = resizeOriginalEnd;
    ElMessage.error(t('common.error'));
  }
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
});

// ---------------------------------------------------------------------------
// Date formatting helper
// ---------------------------------------------------------------------------

function formatDateStr(val: string | Date | null | undefined): string {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return '';
}

// ---------------------------------------------------------------------------
// Open Add dialog (reset form)
// ---------------------------------------------------------------------------

function openAddDialog() {
  isEditing.value = false;
  editingTask.value = null;
  taskForm.value = {
    name: '',
    start: '',
    end: '',
    progress: 0,
    isMilestone: false,
    priority: 'MEDIUM',
    parentTaskId: null
  };
  showTaskDialog.value = true;
}

// ---------------------------------------------------------------------------
// Open Edit dialog (populate form from task)
// ---------------------------------------------------------------------------

function editTask(task: GanttTask) {
  isEditing.value = true;
  editingTask.value = task;
  taskForm.value = {
    name: task.name,
    start: task.start,
    end: task.end,
    progress: task.progress,
    isMilestone: task.isMilestone || false,
    priority: 'MEDIUM',
    parentTaskId: task.dependency || null
  };
  showTaskDialog.value = true;
}

// ---------------------------------------------------------------------------
// Build the API payload from form values
// ---------------------------------------------------------------------------

function buildPayload(colorOverride?: string): Record<string, unknown> {
  const startStr = formatDateStr(taskForm.value.start) || new Date().toISOString().slice(0, 10);
  const endStr = formatDateStr(taskForm.value.end) || startStr;
  const color = colorOverride || GANTT_COLORS[tasks.value.length % GANTT_COLORS.length]!;

  let status = 'PENDING';
  if (taskForm.value.progress >= 100) status = 'COMPLETED';
  else if (taskForm.value.progress > 0) status = 'IN_PROGRESS';

  const ganttMeta: GanttMeta = {
    color,
    isMilestone: taskForm.value.isMilestone
  };

  const payload: Record<string, unknown> = {
    title: taskForm.value.name,
    date: startStr,
    dueDate: endStr,
    status,
    priority: taskForm.value.priority,
    entityType: 'GANTT',
    duration: taskForm.value.progress,
    tags: [JSON.stringify(ganttMeta)],
    assignedTo: user.value?.id || 1
  };

  if (taskForm.value.parentTaskId) {
    payload.parentTaskId = taskForm.value.parentTaskId;
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Save task (Add or Update)
// ---------------------------------------------------------------------------

const saveTask = async () => {
  if (!taskForm.value.name) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }

  saving.value = true;

  try {
    if (isEditing.value && editingTask.value) {
      const payload = buildPayload(editingTask.value.color);
      const { success } = await useApiFetch(`tasks/${editingTask.value.id}`, 'PUT', payload);
      if (success) {
        const idx = tasks.value.findIndex(t => t.id === editingTask.value!.id);
        if (idx !== -1) {
          const existing = tasks.value[idx]!;
          tasks.value[idx] = {
            id: existing.id,
            name: taskForm.value.name,
            start: formatDateStr(taskForm.value.start) || existing.start,
            end: formatDateStr(taskForm.value.end) || existing.end,
            progress: taskForm.value.progress,
            assignee: existing.assignee,
            color: existing.color,
            isMilestone: taskForm.value.isMilestone,
            dependency: taskForm.value.parentTaskId || undefined
          };
        }
        showTaskDialog.value = false;
        ElMessage.success(t('common.saved'));
      } else {
        ElMessage.error(t('common.error'));
      }
    } else {
      const payload = buildPayload();
      const { body, success } = await useApiFetch('tasks', 'POST', payload);
      if (success && body) {
        const created = body as Record<string, unknown>;
        tasks.value.push(mapApiTaskToGantt(created, tasks.value.length));
        showTaskDialog.value = false;
        ElMessage.success(t('common.saved'));
      } else {
        ElMessage.error(t('common.error'));
      }
    }
  } catch (e) {
    console.error('Failed to save gantt task:', e);
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
};

// ---------------------------------------------------------------------------
// Delete task
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Bulk Actions
// ---------------------------------------------------------------------------

async function bulkUpdateStatus(newStatus: string) {
  if (!selectedTaskIds.value.size) return;
  try {
    await ElMessageBox.confirm(
      `Update ${selectedTaskIds.value.size} task(s) to ${newStatus}?`,
      t('common.warning'),
      { type: 'warning' }
    );
    const progress = newStatus === 'COMPLETED' ? 100 : newStatus === 'IN_PROGRESS' ? 50 : 0;
    for (const id of selectedTaskIds.value) {
      const task = tasks.value.find(t => t.id === id);
      if (task) {
        const ganttMeta: GanttMeta = { color: task.color, isMilestone: task.isMilestone };
        await useApiFetch(`tasks/${id}`, 'PUT', {
          status: newStatus,
          duration: progress,
          entityType: 'GANTT',
          tags: [JSON.stringify(ganttMeta)]
        });
        task.progress = progress;
      }
    }
    selectedTaskIds.value = new Set();
    selectAll.value = false;
    ElMessage.success(t('common.saved'));
  } catch {
    // User cancelled
  }
}

async function bulkDeleteTasks() {
  if (!selectedTaskIds.value.size) return;
  try {
    await ElMessageBox.confirm(
      t('common.confirmBulkDelete', { count: selectedTaskIds.value.size }),
      t('common.warning'),
      { type: 'warning' }
    );
    for (const id of selectedTaskIds.value) {
      await useApiFetch(`tasks/${id}`, 'DELETE');
    }
    tasks.value = tasks.value.filter(t => !selectedTaskIds.value.has(t.id));
    selectedTaskIds.value = new Set();
    selectAll.value = false;
    ElMessage.success(t('common.deleted'));
  } catch {
    // User cancelled
  }
}

function exportTasksCSV() {
  const data = selectedTaskIds.value.size
    ? tasks.value.filter(t => selectedTaskIds.value.has(t.id))
    : tasks.value;
  if (!data.length) return;
  const headers = ['Task Name', 'Assignee', 'Start Date', 'End Date', 'Progress', 'Milestone'];
  const csv = [headers.join(','), ...data.map((task: GanttTask) =>
    [
      `"${task.name || ''}"`,
      `"${task.assignee || ''}"`,
      `"${task.start || ''}"`,
      `"${task.end || ''}"`,
      `${task.progress || 0}%`,
      task.isMilestone ? 'Yes' : 'No'
    ].join(',')
  )].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gantt-tasks-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t('common.exported'));
}

async function confirmDeleteTask(task: GanttTask) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmAction'),
      t('common.warning'),
      { type: 'warning', confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel') }
    );
    await deleteTask(task);
  } catch {
    // cancelled
  }
}

async function deleteTask(task: GanttTask) {
  deleting.value = true;
  try {
    const { success } = await useApiFetch(`tasks/${task.id}`, 'DELETE');
    if (success) {
      tasks.value = tasks.value.filter(t => t.id !== task.id);
      showTaskDialog.value = false;
      ElMessage.success(t('common.deleted'));
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch (e) {
    console.error('Failed to delete gantt task:', e);
    ElMessage.error(t('common.error'));
  } finally {
    deleting.value = false;
  }
}
</script>
