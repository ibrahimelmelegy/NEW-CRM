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
          <el-date-picker v-model="selectedWeek" type="week" placeholder="Select week" format="[Week] ww" class="w-40" />
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
      <h3 class="text-sm font-medium text-slate-300 mb-4">Weekly Workload Heatmap</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="text-left p-2 text-xs text-slate-500 w-48">Resource</th>
              <th v-for="day in weekDays" :key="day" class="text-center p-2 text-xs text-slate-500 w-24">{{ day }}</th>
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
                  :percentage="Math.round((res.weeklyHours.reduce((a: number, b: number) => a + b, 0) / (res.maxHoursPerDay * 5)) * 100)"
                  :stroke-width="6"
                  :color="getUtilColor(res)"
                  :show-text="true"
                  class="w-24 mx-auto"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Project Allocations -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- By Project -->
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4">Allocation by Project</h3>
        <div class="space-y-3">
          <div v-for="proj in projects" :key="proj.id" class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: proj.color }"></div>
            <div class="flex-1">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm text-slate-200">{{ proj.name }}</span>
                <span class="text-xs text-slate-500">{{ proj.hours }}h / {{ proj.budget }}h</span>
              </div>
              <el-progress :percentage="Math.round((proj.hours / proj.budget) * 100)" :stroke-width="4" :color="proj.color" :show-text="false" />
            </div>
          </div>
        </div>
      </div>

      <!-- Skill Matrix -->
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4">Skill Availability</h3>
        <div class="space-y-3">
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
      </div>
    </div>

    <!-- Allocate Dialog -->
    <el-dialog v-model="showAllocateDialog" title="Allocate Resource" width="500px">
      <el-form label-position="top">
        <el-form-item label="Resource">
          <el-select v-model="newAlloc.resourceId" class="w-full" filterable>
            <el-option v-for="r in resources" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Project">
          <el-select v-model="newAlloc.projectId" class="w-full">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Hours per Day">
            <el-input-number v-model="newAlloc.hoursPerDay" :min="1" :max="8" class="!w-full" />
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
        <el-button type="primary" @click="allocateResource">Allocate</el-button>
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

const selectedWeek = ref('');
const showAllocateDialog = ref(false);
const newAlloc = ref({ resourceId: '', projectId: '', hoursPerDay: 4, duration: '1w' });
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const resources = ref([
  { id: 1, name: 'Ahmed Al-Farsi', role: 'Senior Developer', maxHoursPerDay: 8, weeklyHours: [8, 7, 8, 6, 4] },
  { id: 2, name: 'Sara Mohammed', role: 'UI/UX Designer', maxHoursPerDay: 8, weeklyHours: [6, 8, 5, 8, 7] },
  { id: 3, name: 'Omar Hassan', role: 'Backend Developer', maxHoursPerDay: 8, weeklyHours: [8, 8, 8, 8, 8] },
  { id: 4, name: 'Fatima Ali', role: 'QA Engineer', maxHoursPerDay: 8, weeklyHours: [4, 6, 3, 5, 2] },
  { id: 5, name: 'Khalid Ibrahim', role: 'Project Manager', maxHoursPerDay: 8, weeklyHours: [6, 5, 7, 6, 5] },
  { id: 6, name: 'Noura Salem', role: 'DevOps Engineer', maxHoursPerDay: 8, weeklyHours: [3, 4, 2, 5, 3] }
]);

const projects = ref([
  { id: 1, name: 'CRM Platform v3', hours: 120, budget: 160, color: '#6366F1' },
  { id: 2, name: 'Mobile App Redesign', hours: 80, budget: 100, color: '#8B5CF6' },
  { id: 3, name: 'API Gateway', hours: 45, budget: 80, color: '#3B82F6' },
  { id: 4, name: 'Data Migration', hours: 30, budget: 40, color: '#10B981' }
]);

const skills = ref([
  { name: 'Frontend (Vue/React)', people: 3, allocated: 96, available: 24 },
  { name: 'Backend (Node.js)', people: 2, allocated: 72, available: 8 },
  { name: 'UI/UX Design', people: 1, allocated: 34, available: 6 },
  { name: 'DevOps/Infrastructure', people: 1, allocated: 17, available: 23 },
  { name: 'QA/Testing', people: 1, allocated: 20, available: 20 }
]);

const availableCapacity = computed(() => resources.value.length * 40);
const allocatedHours = computed(() => resources.value.reduce((s, r) => s + r.weeklyHours.reduce((a: number, b: number) => a + b, 0), 0));
const utilizationRate = computed(() => Math.round((allocatedHours.value / availableCapacity.value) * 100));
const overallocated = computed(() => resources.value.filter(r => r.weeklyHours.some((h: number) => h > r.maxHoursPerDay)).length);

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

const editDayAllocation = (res: any, dayIdx: number) => {
  ElMessage.info(`Editing ${res.name}'s ${weekDays[dayIdx]} allocation`);
};

const allocateResource = () => {
  ElMessage.success('Resource allocated');
  showAllocateDialog.value = false;
};
</script>
