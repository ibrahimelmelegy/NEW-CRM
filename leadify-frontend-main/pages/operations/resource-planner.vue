<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">Resource Planner</h1>
          <p class="text-slate-400 text-sm mt-1">Manage team workload, capacity, and resource allocation across projects.</p>
        </div>
        <div class="flex gap-2">
          <el-date-picker v-model="selectedWeek" type="week" placeholder="Select week" format="[Week] ww" class="w-40" @change="handleWeekChange" />
          <el-button type="primary" class="!rounded-xl" @click="showAllocateDialog = true">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            Allocate
          </el-button>
        </div>
      </div>
    </div>

    <!-- Capacity Overview -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ resources.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Team Members</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ availableCapacity }}h</div>
        <div class="text-xs text-slate-500 mt-1">Available Capacity</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ allocatedHours }}h</div>
        <div class="text-xs text-slate-500 mt-1">Allocated</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ utilizationRate }}%</div>
        <div class="text-xs text-slate-500 mt-1">Utilization Rate</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ overallocated }}</div>
        <div class="text-xs text-slate-500 mt-1">Over-allocated</div>
      </div>
    </div>

    <!-- Workload Heatmap -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-slate-300">Weekly Workload Heatmap</h3>
        <span class="text-xs text-slate-500">{{ weekRangeLabel }}</span>
      </div>
      <div v-if="loading" class="flex items-center justify-center py-12">
        <el-icon class="is-loading text-2xl text-blue-400 mr-2"><Loading /></el-icon>
        <span class="text-slate-400">Loading resources...</span>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="text-left p-2 text-xs text-slate-500 w-48">Resource</th>
              <th v-for="(day, idx) in weekDayLabels" :key="idx" class="text-center p-2 text-xs text-slate-500 w-24">{{ day }}</th>
              <th class="text-center p-2 text-xs text-slate-500 w-24">Total</th>
              <th class="text-center p-2 text-xs text-slate-500 w-32">Utilization</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="res in resources" :key="res.id" class="border-t border-slate-800/30">
              <td class="p-2">
                <div class="flex items-center gap-2">
                  <el-avatar :size="28" class="bg-slate-700">{{ res.name.charAt(0) }}</el-avatar>
                  <div>
                    <div class="text-sm text-slate-200">{{ res.name }}</div>
                    <div class="text-[10px] text-slate-500">{{ res.role }}</div>
                  </div>
                </div>
              </td>
              <td v-for="(hours, idx) in res.weeklyHours" :key="idx" class="text-center p-2">
                <div
                  class="w-full h-8 rounded-md flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-105"
                  :class="getHeatmapClass(hours, res.maxHoursPerDay)"
                  @click="editDayAllocation(res, idx)"
                >
                  {{ hours }}h
                </div>
              </td>
              <td class="text-center p-2">
                <span class="text-sm font-medium" :class="getTotalClass(res)">{{ res.weeklyHours.reduce((a: number, b: number) => a + b, 0) }}h</span>
              </td>
              <td class="text-center p-2">
                <el-progress
                  :percentage="Math.min(Math.round((res.weeklyHours.reduce((a: number, b: number) => a + b, 0) / (res.maxHoursPerDay * 5)) * 100), 200)"
                  :stroke-width="6"
                  :color="getUtilColor(res)"
                  :show-text="true"
                  class="w-24 mx-auto"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty resource state -->
        <div v-if="!loading && resources.length === 0" class="text-center py-12">
          <Icon name="ph:users-bold" class="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p class="text-slate-500 text-sm">No team members found. Add employees in HR module first.</p>
        </div>
      </div>
    </div>

    <!-- Project Allocations -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- By Project -->
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4">Allocation by Project</h3>
        <div v-if="projects.length" class="space-y-3">
          <div v-for="proj in projects" :key="proj.id" class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: proj.color }"></div>
            <div class="flex-1">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm text-slate-200">{{ proj.name }}</span>
                <span class="text-xs text-slate-500">{{ proj.hours }}h / {{ proj.budget }}h</span>
              </div>
              <el-progress :percentage="Math.min(Math.round((proj.hours / proj.budget) * 100), 100)" :stroke-width="4" :color="proj.color" :show-text="false" />
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <p class="text-slate-500 text-sm">No projects with allocations.</p>
        </div>
      </div>

      <!-- Skill Matrix -->
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4">Skill Availability</h3>
        <div v-if="skills.length" class="space-y-3">
          <div v-for="skill in skills" :key="skill.name" class="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
            <div>
              <div class="text-sm text-slate-200">{{ skill.name }}</div>
              <div class="text-xs text-slate-500">{{ skill.people }} team members</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium" :class="skill.available > 0 ? 'text-emerald-400' : 'text-red-400'">
                {{ skill.available }}h available
              </div>
              <div class="text-[10px] text-slate-500">{{ skill.allocated }}h allocated</div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <p class="text-slate-500 text-sm">No skill data available.</p>
        </div>
      </div>
    </div>

    <!-- Allocate Dialog -->
    <el-dialog v-model="showAllocateDialog" title="Allocate Resource" width="500px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="Resource">
          <el-select v-model="newAlloc.resourceId" class="w-full" filterable placeholder="Select team member">
            <el-option v-for="r in resources" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Project">
          <el-select v-model="newAlloc.projectId" class="w-full" filterable placeholder="Select project">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Hours per Day">
            <el-input-number v-model="newAlloc.hoursPerDay" :min="1" :max="12" class="!w-full" />
          </el-form-item>
          <el-form-item label="Duration">
            <el-select v-model="newAlloc.duration" class="w-full">
              <el-option label="1 week" value="1w" />
              <el-option label="2 weeks" value="2w" />
              <el-option label="1 month" value="1m" />
              <el-option label="3 months" value="3m" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showAllocateDialog = false">Cancel</el-button>
        <el-button type="primary" :loading="allocating" @click="allocateResource">Allocate</el-button>
      </template>
    </el-dialog>

    <!-- Edit Day Allocation Dialog -->
    <el-dialog v-model="showDayEditDialog" title="Edit Day Allocation" width="400px" :close-on-click-modal="false">
      <div v-if="editingDay.resource" class="space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
          <el-avatar :size="32" class="bg-slate-700">{{ editingDay.resource?.name.charAt(0) }}</el-avatar>
          <div>
            <div class="text-sm font-medium text-slate-200">{{ editingDay.resource?.name }}</div>
            <div class="text-xs text-slate-500">{{ weekDayLabels[editingDay.dayIndex] }}</div>
          </div>
        </div>
        <el-form label-position="top">
          <el-form-item label="Hours">
            <el-input-number v-model="editingDay.hours" :min="0" :max="16" :step="0.5" class="!w-full" />
          </el-form-item>
        </el-form>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-500">Capacity:</span>
          <span :class="editingDay.hours > (editingDay.resource?.maxHoursPerDay || 8) ? 'text-red-400' : 'text-emerald-400'">
            {{ editingDay.hours }}h / {{ editingDay.resource?.maxHoursPerDay || 8 }}h
          </span>
          <span v-if="editingDay.hours > (editingDay.resource?.maxHoursPerDay || 8)" class="text-red-400 font-medium">(Over-allocated)</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDayEditDialog = false">Cancel</el-button>
        <el-button type="primary" @click="applyDayEdit">Apply</el-button>
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

// --------------------------------------------------
// Reactive state
// --------------------------------------------------
const selectedWeek = ref<Date | string>(new Date());
const showAllocateDialog = ref(false);
const showDayEditDialog = ref(false);
const loading = ref(false);
const allocating = ref(false);
const newAlloc = ref({ resourceId: '', projectId: '', hoursPerDay: 4, duration: '1w' });
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Color palette for project badges
const PROJECT_COLORS = ['#6366F1', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#06B6D4'];

interface Resource {
  id: string;
  name: string;
  role: string;
  maxHoursPerDay: number;
  weeklyHours: number[];
}

interface ProjectAllocation {
  id: string;
  name: string;
  hours: number;
  budget: number;
  color: string;
}

interface RawAllocation {
  id: string;
  projectId: string;
  manpowerId: string;
  estimatedWorkDays: number;
  actualWorkDays: number;
  mission: string[];
  durationCost: number;
  totalCost: number;
  project?: any;
  manpower?: any;
}

const resources = ref<Resource[]>([]);
const projects = ref<ProjectAllocation[]>([]);
const rawAllocations = ref<RawAllocation[]>([]);

// Day edit state
const editingDay = ref<{
  resource: Resource | null;
  dayIndex: number;
  hours: number;
}>({
  resource: null,
  dayIndex: 0,
  hours: 0
});

// --------------------------------------------------
// Week helpers
// --------------------------------------------------

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  // Monday = 1, Sunday = 0
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

const weekStartDate = computed(() => {
  const d = selectedWeek.value instanceof Date ? selectedWeek.value : new Date(selectedWeek.value || Date.now());
  return getWeekStart(d);
});

const weekDayLabels = computed(() => {
  const start = weekStartDate.value;
  return weekDays.map((name, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return `${name} ${d.getDate()}/${d.getMonth() + 1}`;
  });
});

const weekRangeLabel = computed(() => {
  const start = weekStartDate.value;
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return `${fmt(start)} - ${fmt(end)}`;
});

function handleWeekChange() {
  fetchData();
}

// --------------------------------------------------
// Computed: skills derived from employee positions
// --------------------------------------------------
const skills = computed(() => {
  // Group resources by role/jobTitle
  const roleMap = new Map<string, { people: number; allocated: number }>();

  for (const res of resources.value) {
    const roleName = res.role || 'Unassigned';
    if (!roleMap.has(roleName)) {
      roleMap.set(roleName, { people: 0, allocated: 0 });
    }
    const entry = roleMap.get(roleName)!;
    entry.people += 1;
    entry.allocated += res.weeklyHours.reduce((a, b) => a + b, 0);
  }

  return Array.from(roleMap.entries()).map(([name, data]) => ({
    name,
    people: data.people,
    allocated: data.allocated,
    // Available = (people * 40h/week) - allocated
    available: Math.max(0, data.people * 40 - data.allocated)
  }));
});

// --------------------------------------------------
// Computed: KPI metrics
// --------------------------------------------------
const availableCapacity = computed(() => resources.value.length * 40);
const allocatedHours = computed(() => resources.value.reduce((s, r) => s + r.weeklyHours.reduce((a: number, b: number) => a + b, 0), 0));
const utilizationRate = computed(() => availableCapacity.value > 0 ? Math.round((allocatedHours.value / availableCapacity.value) * 100) : 0);
const overallocated = computed(() => resources.value.filter(r => r.weeklyHours.some((h: number) => h > r.maxHoursPerDay)).length);

// --------------------------------------------------
// Data fetching
// --------------------------------------------------

/**
 * Convert estimatedWorkDays into a 5-day weekly hours distribution.
 * Each work day is treated as 8 hours. We spread the allocation across
 * Mon-Fri evenly, capping at 8h per day.
 */
function distributeWorkDays(estimatedWorkDays: number): number[] {
  const hoursPerDay = 8;
  const totalHours = estimatedWorkDays * hoursPerDay;
  // Spread across 5 days evenly
  const perDay = Math.min(hoursPerDay, Math.round(totalHours / 5));
  return [perDay, perDay, perDay, perDay, perDay];
}

/**
 * Merge multiple allocation arrays by summing each day's hours.
 */
function mergeWeeklyHours(existing: number[], additional: number[]): number[] {
  return existing.map((h, i) => h + (additional[i] || 0));
}

async function fetchData() {
  loading.value = true;
  try {
    // Fetch all three endpoints in parallel
    const [employeesRes, projectsRes, allocationsRes] = await Promise.all([
      useApiFetch('hr/employees?limit=500'),
      useApiFetch('project?limit=1000'),
      useApiFetch('project-manpower?limit=1000')
    ]);

    // -- Process employees -> resources --
    const employeeList: any[] = employeesRes?.success
      ? (employeesRes.body?.docs || employeesRes.body || [])
      : [];

    // -- Process allocations --
    const allocationList: RawAllocation[] = allocationsRes?.success
      ? (allocationsRes.body?.docs || allocationsRes.body || [])
      : [];
    rawAllocations.value = allocationList;

    // Build a map: employeeId -> aggregated weeklyHours
    const employeeHoursMap = new Map<string, number[]>();
    for (const alloc of allocationList) {
      const empId = alloc.manpowerId;
      if (!empId) continue;
      const addHours = distributeWorkDays(alloc.estimatedWorkDays || 0);
      const existing = employeeHoursMap.get(empId) || [0, 0, 0, 0, 0];
      employeeHoursMap.set(empId, mergeWeeklyHours(existing, addHours));
    }

    // Map employees to resource format
    resources.value = employeeList.map((emp: any) => {
      const id = emp.id;
      const weeklyHours = employeeHoursMap.get(id) || [0, 0, 0, 0, 0];
      return {
        id,
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || 'Unknown',
        role: emp.jobTitle || emp.position || 'Unassigned',
        maxHoursPerDay: 8,
        weeklyHours
      };
    });

    // -- Process projects --
    const projectList: any[] = projectsRes?.success
      ? (projectsRes.body?.docs || projectsRes.body || [])
      : [];

    // Build a map: projectId -> total allocated hours from project-manpower
    const projectHoursMap = new Map<string, number>();
    for (const alloc of allocationList) {
      const pid = alloc.projectId;
      if (!pid) continue;
      const hours = (alloc.estimatedWorkDays || 0) * 8;
      projectHoursMap.set(pid, (projectHoursMap.get(pid) || 0) + hours);
    }

    projects.value = projectList.map((proj: any, index: number) => {
      // Budget hours: use resourceCount * duration (days) * 8, or fallback
      const budgetHours = (proj.resourceCount || 1) * (proj.duration || 20) * 8;
      const allocatedProjectHours = projectHoursMap.get(proj.id) || 0;
      return {
        id: proj.id,
        name: proj.name || 'Untitled Project',
        hours: allocatedProjectHours,
        budget: budgetHours || 160,
        color: PROJECT_COLORS[index % PROJECT_COLORS.length]!
      };
    });
  } catch (err) {
    console.error('Failed to load resource planner data:', err);
    ElMessage.error('Failed to load resource planner data');
  } finally {
    loading.value = false;
  }
}

// --------------------------------------------------
// Heatmap & utility helpers
// --------------------------------------------------
const getHeatmapClass = (hours: number, max: number) => {
  const ratio = hours / max;
  if (ratio === 0) return 'bg-slate-800/30 text-slate-600';
  if (ratio <= 0.5) return 'bg-emerald-500/20 text-emerald-400';
  if (ratio <= 0.75) return 'bg-blue-500/20 text-blue-400';
  if (ratio <= 1) return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/30 text-red-400';
};

const getTotalClass = (res: any) => {
  const total = res.weeklyHours.reduce((a: number, b: number) => a + b, 0);
  const max = res.maxHoursPerDay * 5;
  if (total > max) return 'text-red-400';
  if (total >= max * 0.8) return 'text-amber-400';
  return 'text-emerald-400';
};

const getUtilColor = (res: any) => {
  const pct = (res.weeklyHours.reduce((a: number, b: number) => a + b, 0) / (res.maxHoursPerDay * 5)) * 100;
  if (pct > 100) return '#EF4444';
  if (pct >= 80) return '#F59E0B';
  return '#10B981';
};

// --------------------------------------------------
// Edit day allocation (inline dialog)
// --------------------------------------------------

function editDayAllocation(res: Resource, dayIdx: number) {
  editingDay.value = {
    resource: res,
    dayIndex: dayIdx,
    hours: res.weeklyHours[dayIdx] || 0
  };
  showDayEditDialog.value = true;
}

function applyDayEdit() {
  if (!editingDay.value.resource) return;
  const res = resources.value.find(r => r.id === editingDay.value.resource!.id);
  if (res) {
    res.weeklyHours[editingDay.value.dayIndex] = editingDay.value.hours;
  }
  showDayEditDialog.value = false;
  ElMessage.success('Day allocation updated locally');
}

// --------------------------------------------------
// Allocate resource -> POST /api/project-manpower
// --------------------------------------------------

/** Map duration select value to estimated work days */
function durationToWorkDays(duration: string): number {
  const daysPerWeek = 5;
  switch (duration) {
    case '1w': return daysPerWeek;
    case '2w': return daysPerWeek * 2;
    case '1m': return daysPerWeek * 4;
    case '3m': return daysPerWeek * 12;
    default: return daysPerWeek;
  }
}

const allocateResource = async () => {
  const { resourceId, projectId, hoursPerDay, duration } = newAlloc.value;

  if (!resourceId || !projectId) {
    ElMessage.warning('Please select both a resource and a project');
    return;
  }

  allocating.value = true;
  try {
    const estimatedWorkDays = durationToWorkDays(duration);

    const res = await useApiFetch('project-manpower', 'POST', {
      projectId,
      manpowerId: resourceId,
      estimatedWorkDays,
      actualWorkDays: 0,
      mission: ['Standard']
    });

    if (res?.success) {
      ElMessage.success('Resource allocated successfully');
      showAllocateDialog.value = false;
      // Reset form
      newAlloc.value = { resourceId: '', projectId: '', hoursPerDay: 4, duration: '1w' };
      // Refresh data to reflect new allocation
      await fetchData();
    } else {
      ElMessage.error(res?.message || 'Failed to allocate resource');
    }
  } catch (err: any) {
    console.error('Allocation error:', err);
    ElMessage.error(err?.message || 'Failed to allocate resource');
  } finally {
    allocating.value = false;
  }
};

// --------------------------------------------------
// Lifecycle
// --------------------------------------------------
onMounted(() => {
  fetchData();
});
</script>
