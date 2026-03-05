<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
            {{ $t('resourcePlanner.title') }}
          </h1>
          <p class="text-sm mt-1" style="color: var(--text-muted)">
            {{ $t('resourcePlanner.subtitle') }}
          </p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <el-select v-model="viewMode" size="large" style="width: 150px">
            <el-option :label="$t('resourcePlanner.heatmap')" value="heatmap" />
            <el-option :label="$t('resourcePlanner.allocations')" value="allocations" />
            <el-option :label="$t('resourcePlanner.utilization')" value="utilization" />
          </el-select>
          <el-button type="primary" size="large" class="!rounded-xl" @click="openAllocateDialog">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            {{ $t('resourcePlanner.allocate') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Over-allocation Warning Banner -->
    <div
      v-if="overAllocatedResources.length > 0"
      class="p-4 rounded-xl border"
      style="background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.3)"
    >
      <div class="flex items-center gap-3">
        <Icon name="ph:warning-bold" size="20" style="color: #ef4444" />
        <div class="flex-1">
          <p class="text-sm font-medium" style="color: #ef4444">
            {{ $t('resourcePlanner.overAllocatedWarning').replace('{count}', String(overAllocatedResources.length)) }}
          </p>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">
            {{ overAllocatedResources.map(r => r.name).join(', ') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Capacity Overview KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div v-for="stat in kpiCards" :key="stat.label" class="glass-card p-4 rounded-xl text-center animate-entrance">
        <div class="text-2xl font-bold" :style="{ color: stat.color }">{{ stat.value }}</div>
        <div class="text-xs mt-1" style="color: var(--text-muted)">{{ stat.label }}</div>
      </div>
    </div>

    <!-- ========== HEATMAP VIEW ========== -->
    <div v-if="viewMode === 'heatmap'" class="glass-panel p-6 rounded-2xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium" style="color: var(--text-secondary)">
          {{ $t('resourcePlanner.weeklyHeatmap') }}
        </h3>
        <span class="text-xs" style="color: var(--text-muted)">
          {{ $t('resourcePlanner.clickToEdit') }}
        </span>
      </div>
      <div v-if="loading" class="flex items-center justify-center py-12">
        <el-icon class="is-loading text-2xl mr-2" style="color: var(--primary)"><Loading /></el-icon>
        <span style="color: var(--text-muted)">{{ $t('common.loading') }}</span>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="text-left p-2 text-xs w-48" style="color: var(--text-muted)">{{ $t('resourcePlanner.resource') }}</th>
              <th v-for="day in weekDays" :key="day" class="text-center p-2 text-xs w-24" style="color: var(--text-muted)">{{ day }}</th>
              <th class="text-center p-2 text-xs w-24" style="color: var(--text-muted)">{{ $t('resourcePlanner.total') }}</th>
              <th class="text-center p-2 text-xs w-32" style="color: var(--text-muted)">{{ $t('resourcePlanner.utilization') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="res in resources" :key="res.id" style="border-top: 1px solid var(--border-light)">
              <td class="p-2">
                <div class="flex items-center gap-2">
                  <el-avatar :size="28" style="background: var(--bg-elevated)">{{ res.name.charAt(0) }}</el-avatar>
                  <div>
                    <div class="text-sm" style="color: var(--text-primary)">{{ res.name }}</div>
                    <div class="text-[10px]" style="color: var(--text-muted)">{{ res.role }}</div>
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
                  :percentage="Math.min(getUtilPercent(res), 200)"
                  :stroke-width="6"
                  :color="getUtilColor(res)"
                  :show-text="true"
                  class="w-24 mx-auto"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!loading && resources.length === 0" class="text-center py-12">
          <Icon name="ph:users-bold" class="w-12 h-12 mx-auto mb-3" style="color: var(--text-muted)" />
          <p class="text-sm" style="color: var(--text-muted)">
            {{ $t('resourcePlanner.noResources') }}
          </p>
        </div>
      </div>

      <!-- Heatmap Legend -->
      <div class="flex items-center gap-4 mt-4 pt-4" style="border-top: 1px solid var(--border-light)">
        <span class="text-xs" style="color: var(--text-muted)">{{ $t('resourcePlanner.legend') }}:</span>
        <div class="flex items-center gap-1">
          <div class="w-4 h-4 rounded bg-slate-800/30"></div>
          <span class="text-xs" style="color: var(--text-muted)">0h</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-4 h-4 rounded bg-emerald-500/20"></div>
          <span class="text-xs" style="color: var(--text-muted)">1-4h</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-4 h-4 rounded bg-blue-500/20"></div>
          <span class="text-xs" style="color: var(--text-muted)">5-6h</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-4 h-4 rounded bg-amber-500/20"></div>
          <span class="text-xs" style="color: var(--text-muted)">7-8h</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-4 h-4 rounded bg-red-500/30"></div>
          <span class="text-xs" style="color: var(--text-muted)">&gt;8h (Over)</span>
        </div>
      </div>
    </div>

    <!-- ========== ALLOCATIONS VIEW ========== -->
    <div v-if="viewMode === 'allocations'" class="glass-panel p-6 rounded-2xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium" style="color: var(--text-secondary)">
          {{ $t('resourcePlanner.allAllocations') }}
        </h3>
        <el-input v-model="allocSearch" :placeholder="$t('common.search')" clearable size="large" style="width: 220px">
          <template #prefix><Icon name="ph:magnifying-glass" size="16" /></template>
        </el-input>
      </div>

      <el-table v-loading="loading" :data="filteredAllocations" style="width: 100%">
        <el-table-column type="index" width="50" />
        <el-table-column :label="$t('resourcePlanner.resource')" min-width="160">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-avatar :size="24" style="background: var(--bg-elevated)">{{ (row.manpower?.name || '?').charAt(0) }}</el-avatar>
              <span class="font-medium">{{ row.manpower?.name || 'Unknown' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('resourcePlanner.project')" min-width="160">
          <template #default="{ row }">
            <span>{{ row.project?.name || 'Unknown' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('resourcePlanner.estDays')" width="110" align="center">
          <template #default="{ row }">
            <span class="font-mono">{{ row.estimatedWorkDays }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('resourcePlanner.actualDays')" width="110" align="center">
          <template #default="{ row }">
            <span class="font-mono">{{ row.actualWorkDays }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('resourcePlanner.mission')" width="130">
          <template #default="{ row }">
            <el-tag v-for="m in row.mission || []" :key="m" size="small" class="mr-1">{{ m }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('resourcePlanner.cost')" width="120" align="right">
          <template #default="{ row }">
            <span class="font-mono text-sm">{{ Number(row.durationCost || 0).toLocaleString() }} SAR</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.action')" width="120" fixed="right">
          <template #default="{ row }">
            <div class="flex gap-1">
              <el-button text circle size="small" @click="editAllocation(row)">
                <Icon name="ph:pencil" size="14" />
              </el-button>
              <el-button text circle size="small" type="danger" @click="deleteAllocation(row.id)">
                <Icon name="ph:trash" size="14" />
              </el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('common.noData')" />
        </template>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="
            (p: number) => {
              pagination.page = p;
              fetchData();
            }
          "
        />
      </div>
    </div>

    <!-- ========== UTILIZATION VIEW ========== -->
    <div v-if="viewMode === 'utilization'" class="space-y-6">
      <!-- Utilization Summary -->
      <div v-if="utilizationData" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="glass-card p-4 rounded-xl text-center">
          <div class="text-2xl font-bold" style="color: var(--text-primary)">{{ utilizationData.summary?.totalResources || 0 }}</div>
          <div class="text-xs mt-1" style="color: var(--text-muted)">{{ $t('resourcePlanner.totalResources') }}</div>
        </div>
        <div class="glass-card p-4 rounded-xl text-center">
          <div class="text-2xl font-bold" style="color: #f59e0b">{{ utilizationData.summary?.avgUtilization || 0 }}%</div>
          <div class="text-xs mt-1" style="color: var(--text-muted)">{{ $t('resourcePlanner.avgUtilization') }}</div>
        </div>
        <div class="glass-card p-4 rounded-xl text-center">
          <div class="text-2xl font-bold" style="color: #ef4444">{{ utilizationData.summary?.overAllocatedCount || 0 }}</div>
          <div class="text-xs mt-1" style="color: var(--text-muted)">{{ $t('resourcePlanner.overAllocated') }}</div>
        </div>
        <div class="glass-card p-4 rounded-xl text-center">
          <div class="text-2xl font-bold" style="color: #3b82f6">{{ utilizationData.summary?.totalAllocatedDays || 0 }}d</div>
          <div class="text-xs mt-1" style="color: var(--text-muted)">{{ $t('resourcePlanner.totalAllocDays') }}</div>
        </div>
      </div>

      <!-- Utilization per Resource -->
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium mb-4" style="color: var(--text-secondary)">
          {{ $t('resourcePlanner.utilizationByResource') }}
        </h3>
        <div v-if="loadingUtil" class="flex items-center justify-center py-12">
          <el-icon class="is-loading text-2xl mr-2" style="color: var(--primary)"><Loading /></el-icon>
          <span style="color: var(--text-muted)">{{ $t('common.loading') }}</span>
        </div>
        <div v-else-if="utilizationData?.resources?.length" class="space-y-3">
          <div
            v-for="res in utilizationData.resources"
            :key="res.manpowerId"
            class="flex items-center gap-4 p-3 rounded-lg"
            :style="{
              background: res.overAllocated ? 'rgba(239,68,68,0.06)' : 'var(--bg-base)',
              border: res.overAllocated ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent'
            }"
          >
            <el-avatar :size="32" style="background: var(--bg-elevated)">{{ res.manpower?.name?.charAt(0) || '?' }}</el-avatar>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium" style="color: var(--text-primary)">{{ res.manpower?.name || 'Unknown' }}</span>
                <el-tag v-if="res.overAllocated" type="danger" size="small" round>Over</el-tag>
              </div>
              <div class="text-xs" style="color: var(--text-muted)">
                {{ res.projectCount }} {{ $t('resourcePlanner.projects') }} &middot; {{ res.totalEstimatedDays }}d allocated &middot;
                {{ res.availableDays }}d available
              </div>
              <el-progress
                :percentage="Math.min(res.utilization, 200)"
                :stroke-width="4"
                :color="res.utilization > 100 ? '#ef4444' : res.utilization >= 80 ? '#f59e0b' : '#10b981'"
                :show-text="false"
                class="mt-1"
              />
            </div>
            <div class="text-right">
              <div class="text-lg font-bold" :style="{ color: res.utilization > 100 ? '#ef4444' : res.utilization >= 80 ? '#f59e0b' : '#10b981' }">
                {{ res.utilization }}%
              </div>
              <div class="text-xs font-mono" style="color: var(--text-muted)">{{ Number(res.totalCost || 0).toLocaleString() }} SAR</div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12">
          <p class="text-sm" style="color: var(--text-muted)">{{ $t('common.noData') }}</p>
        </div>
      </div>
    </div>

    <!-- Project Allocations + Skill Matrix (shown on heatmap view) -->
    <div v-if="viewMode === 'heatmap'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- By Project -->
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium mb-4" style="color: var(--text-secondary)">
          {{ $t('resourcePlanner.byProject') }}
        </h3>
        <div v-if="projectSummaries.length" class="space-y-3">
          <div v-for="proj in projectSummaries" :key="proj.id" class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: proj.color }"></div>
            <div class="flex-1">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm" style="color: var(--text-primary)">{{ proj.name }}</span>
                <span class="text-xs" style="color: var(--text-muted)">{{ proj.hours }}h / {{ proj.budget }}h</span>
              </div>
              <el-progress
                :percentage="Math.min(Math.round((proj.hours / proj.budget) * 100), 100)"
                :stroke-width="4"
                :color="proj.color"
                :show-text="false"
              />
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <p class="text-sm" style="color: var(--text-muted)">{{ $t('resourcePlanner.noProjectAllocations') }}</p>
        </div>
      </div>

      <!-- Skill Matrix -->
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium mb-4" style="color: var(--text-secondary)">
          {{ $t('resourcePlanner.skillAvailability') }}
        </h3>
        <div v-if="skills.length" class="space-y-3">
          <div v-for="skill in skills" :key="skill.name" class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-base)">
            <div>
              <div class="text-sm" style="color: var(--text-primary)">{{ skill.name }}</div>
              <div class="text-xs" style="color: var(--text-muted)">{{ skill.people }} {{ $t('resourcePlanner.teamMembers') }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium" :style="{ color: skill.available > 0 ? '#10b981' : '#ef4444' }">
                {{ skill.available }}h {{ $t('resourcePlanner.available') }}
              </div>
              <div class="text-[10px]" style="color: var(--text-muted)">{{ skill.allocated }}h {{ $t('resourcePlanner.allocated') }}</div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <p class="text-sm" style="color: var(--text-muted)">{{ $t('common.noData') }}</p>
        </div>
      </div>
    </div>

    <!-- ========== ALLOCATE DIALOG ========== -->
    <el-dialog
      v-model="showAllocateDialog"
      :title="editingAlloc ? $t('resourcePlanner.editAllocation') : $t('resourcePlanner.allocateResource')"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top" size="large">
        <el-form-item :label="$t('resourcePlanner.resource')">
          <el-select
            v-model="allocForm.manpowerId"
            class="w-full"
            filterable
            :placeholder="$t('resourcePlanner.selectResource')"
            :disabled="!!editingAlloc"
          >
            <el-option v-for="mp in manpowerList" :key="mp.id" :label="`${mp.name} (${(mp.role || []).join(', ')})`" :value="mp.id">
              <div class="flex items-center justify-between w-full">
                <span>{{ mp.name }}</span>
                <el-tag v-if="mp.availabilityStatus === 'AVAILABLE'" type="success" size="small">Available</el-tag>
                <el-tag v-else type="danger" size="small">Busy</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('resourcePlanner.project')">
          <el-select
            v-model="allocForm.projectId"
            class="w-full"
            filterable
            :placeholder="$t('resourcePlanner.selectProject')"
            :disabled="!!editingAlloc"
          >
            <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('resourcePlanner.estDays')">
            <el-input-number v-model="allocForm.estimatedWorkDays" :min="1" :max="365" class="!w-full" />
          </el-form-item>
          <el-form-item :label="$t('resourcePlanner.actualDays')">
            <el-input-number v-model="allocForm.actualWorkDays" :min="0" :max="365" class="!w-full" />
          </el-form-item>
        </div>
        <el-form-item :label="$t('resourcePlanner.mission')">
          <el-select v-model="allocForm.mission" multiple class="w-full">
            <el-option :label="$t('resourcePlanner.standard')" value="Standard" />
            <el-option :label="$t('resourcePlanner.helper')" value="Helper" />
            <el-option :label="$t('resourcePlanner.siteEngineer')" value="SiteEngineer" />
            <el-option :label="$t('resourcePlanner.engineer')" value="Engineer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAllocateDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveAllocation">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- ========== EDIT DAY DIALOG ========== -->
    <el-dialog v-model="showDayEditDialog" :title="$t('resourcePlanner.editDayAllocation')" width="420px" :close-on-click-modal="false">
      <div v-if="editingDay.resource" class="space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-lg" style="background: var(--bg-base)">
          <el-avatar :size="32" style="background: var(--bg-elevated)">{{ editingDay.resource?.name.charAt(0) }}</el-avatar>
          <div>
            <div class="text-sm font-medium" style="color: var(--text-primary)">{{ editingDay.resource?.name }}</div>
            <div class="text-xs" style="color: var(--text-muted)">{{ weekDays[editingDay.dayIndex] }}</div>
          </div>
        </div>

        <!-- Show which allocations contribute to this resource's hours -->
        <div v-if="editingDay.allocations.length" class="space-y-2">
          <p class="text-xs font-medium" style="color: var(--text-muted)">{{ $t('resourcePlanner.allocationsForDay') }}</p>
          <div
            v-for="alloc in editingDay.allocations"
            :key="alloc.id"
            class="flex items-center justify-between p-2 rounded"
            style="background: var(--bg-elevated)"
          >
            <span class="text-sm" style="color: var(--text-primary)">{{ alloc.project?.name || 'Unknown Project' }}</span>
            <div class="flex items-center gap-2">
              <el-input-number v-model="alloc._editDays" :min="0" :max="365" size="small" style="width: 100px" />
              <span class="text-xs" style="color: var(--text-muted)">days</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-4">
          <p class="text-sm" style="color: var(--text-muted)">{{ $t('resourcePlanner.noAllocationsFound') }}</p>
        </div>

        <!-- Capacity indicator -->
        <div class="flex items-center gap-2 text-xs">
          <span style="color: var(--text-muted)">{{ $t('resourcePlanner.capacity') }}:</span>
          <span :style="{ color: editingDay.totalHours > (editingDay.resource?.maxHoursPerDay || 8) ? '#ef4444' : '#10b981' }">
            {{ editingDay.totalHours }}h / {{ editingDay.resource?.maxHoursPerDay || 8 }}h per day
          </span>
          <span v-if="editingDay.totalHours > (editingDay.resource?.maxHoursPerDay || 8)" style="color: #ef4444" class="font-medium">
            ({{ $t('resourcePlanner.overAllocatedLabel') }})
          </span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDayEditDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="savingDay" @click="applyDayEdit">{{ $t('resourcePlanner.saveChanges') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// --------------------------------------------------
// State
// --------------------------------------------------
const viewMode = ref<'heatmap' | 'allocations' | 'utilization'>('heatmap');
const loading = ref(false);
const loadingUtil = ref(false);
const saving = ref(false);
const savingDay = ref(false);
const showAllocateDialog = ref(false);
const showDayEditDialog = ref(false);
const editingAlloc = ref<Record<string, unknown> | null>(null);
const allocSearch = ref('');

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const PROJECT_COLORS = ['#6366F1', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#06B6D4'];

const allocForm = reactive({
  manpowerId: '',
  projectId: '',
  estimatedWorkDays: 5,
  actualWorkDays: 0,
  mission: ['Standard'] as string[]
});

const pagination = reactive({ page: 1, limit: 50, total: 0 });

// Data
interface Resource {
  id: string;
  name: string;
  role: string;
  maxHoursPerDay: number;
  weeklyHours: number[];
  allocations: Record<string, unknown>[];
}

const resources = ref<Resource[]>([]);
const rawAllocations = ref<Record<string, unknown>[]>([]);
const manpowerList = ref<Record<string, unknown>[]>([]);
const projectList = ref<Record<string, unknown>[]>([]);
const utilizationData = ref<Record<string, unknown> | null>(null);

// Day edit state
const editingDay = ref<{
  resource: Resource | null;
  dayIndex: number;
  allocations: Record<string, unknown>[];
  totalHours: number;
}>({
  resource: null,
  dayIndex: 0,
  allocations: [],
  totalHours: 0
});

// --------------------------------------------------
// Computed: KPI cards
// --------------------------------------------------
const availableCapacity = computed(() => resources.value.length * 40);
const allocatedHours = computed(() => resources.value.reduce((s, r) => s + r.weeklyHours.reduce((a: number, b: number) => a + b, 0), 0));
const utilizationRate = computed(() => (availableCapacity.value > 0 ? Math.round((allocatedHours.value / availableCapacity.value) * 100) : 0));
const overAllocatedResources = computed(() => resources.value.filter(r => r.weeklyHours.some((h: number) => h > r.maxHoursPerDay)));

const kpiCards = computed(() => [
  { label: 'Team Members', value: resources.value.length, color: 'var(--text-primary)' },
  { label: 'Available Capacity', value: `${availableCapacity.value}h`, color: '#10b981' },
  { label: 'Allocated', value: `${allocatedHours.value}h`, color: '#3b82f6' },
  { label: 'Utilization Rate', value: `${utilizationRate.value}%`, color: '#f59e0b' },
  { label: 'Over-allocated', value: overAllocatedResources.value.length, color: '#ef4444' }
]);

// Computed: Skills derived from manpower roles
const skills = computed(() => {
  const roleMap = new Map<string, { people: number; allocated: number }>();
  for (const res of resources.value) {
    const roleName = res.role || 'Unassigned';
    if (!roleMap.has(roleName)) roleMap.set(roleName, { people: 0, allocated: 0 });
    const entry = roleMap.get(roleName)!;
    entry.people += 1;
    entry.allocated += res.weeklyHours.reduce((a, b) => a + b, 0);
  }
  return Array.from(roleMap.entries()).map(([name, data]) => ({
    name,
    people: data.people,
    allocated: data.allocated,
    available: Math.max(0, data.people * 40 - data.allocated)
  }));
});

// Computed: Project summaries from allocations
const projectSummaries = computed(() => {
  const projMap = new Map<string, { name: string; hours: number; budget: number }>();
  for (const alloc of rawAllocations.value) {
    const pid = alloc.projectId;
    if (!pid) continue;
    const hours = (alloc.estimatedWorkDays || 0) * 8;
    const existing = projMap.get(pid);
    if (existing) {
      existing.hours += hours;
    } else {
      const proj = alloc.project || projectList.value.find((p) => p.id === pid);
      const budgetHours = (proj?.resourceCount || 1) * (proj?.duration || 20) * 8 || 160;
      projMap.set(pid, {
        name: proj?.name || 'Unknown Project',
        hours,
        budget: budgetHours
      });
    }
  }
  return Array.from(projMap.values()).map((p, idx) => ({
    ...p,
    id: idx,
    color: PROJECT_COLORS[idx % PROJECT_COLORS.length]
  }));
});

// Computed: filtered allocations for the table
const filteredAllocations = computed(() => {
  if (!allocSearch.value) return rawAllocations.value;
  const q = allocSearch.value.toLowerCase();
  return rawAllocations.value.filter(
    (a: unknown) => (a.manpower?.name || '').toLowerCase().includes(q) || (a.project?.name || '').toLowerCase().includes(q)
  );
});

// --------------------------------------------------
// Data fetching
// --------------------------------------------------

function distributeWorkDays(estimatedWorkDays: number): number[] {
  const hoursPerDay = 8;
  const totalHours = estimatedWorkDays * hoursPerDay;
  const perDay = Math.min(hoursPerDay, Math.round(totalHours / 5));
  return [perDay, perDay, perDay, perDay, perDay];
}

function mergeWeeklyHours(existing: number[], additional: number[]): number[] {
  return existing.map((h, i) => h + (additional[i] || 0));
}

async function fetchData() {
  loading.value = true;
  try {
    const [manpowerRes, projectsRes, allocationsRes]: Record<string, unknown>[] = await Promise.all([
      useApiFetch('manpower?limit=500'),
      useApiFetch('project?limit=1000'),
      useApiFetch(`project-manpower?limit=${pagination.limit}&page=${pagination.page}`)
    ]);

    // Process manpower resources
    const mpList: Record<string, unknown>[] = manpowerRes?.success ? manpowerRes.body?.docs || manpowerRes.body || [] : [];
    manpowerList.value = mpList;

    // Process projects
    const projList: Record<string, unknown>[] = projectsRes?.success ? projectsRes.body?.docs || projectsRes.body || [] : [];
    projectList.value = projList;

    // Process allocations
    const allocList: Record<string, unknown>[] = allocationsRes?.success ? allocationsRes.body?.docs || allocationsRes.body || [] : [];
    rawAllocations.value = allocList;
    pagination.total = allocationsRes?.body?.pagination?.totalItems ?? allocList.length;

    // Build resource heatmap from manpower + allocations
    const manpowerHoursMap = new Map<string, number[]>();
    const manpowerAllocMap = new Map<string, any[]>();

    for (const alloc of allocList) {
      const mpId = alloc.manpowerId;
      if (!mpId) continue;
      const addHours = distributeWorkDays(alloc.estimatedWorkDays || 0);
      const existing = manpowerHoursMap.get(mpId) || [0, 0, 0, 0, 0];
      manpowerHoursMap.set(mpId, mergeWeeklyHours(existing, addHours));

      if (!manpowerAllocMap.has(mpId)) manpowerAllocMap.set(mpId, []);
      manpowerAllocMap.get(mpId)!.push(alloc);
    }

    resources.value = mpList.map((mp) => {
      const id = mp.id;
      const weeklyHours = manpowerHoursMap.get(id) || [0, 0, 0, 0, 0];
      const roles = Array.isArray(mp.role) ? mp.role : [mp.role || 'Unassigned'];
      return {
        id,
        name: mp.name || 'Unknown',
        role: roles.join(', '),
        maxHoursPerDay: 8,
        weeklyHours,
        allocations: manpowerAllocMap.get(id) || []
      };
    });
  } catch (err) {
    console.error('Failed to load resource planner data:', err);
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
}

async function fetchUtilizationReport() {
  loadingUtil.value = true;
  try {
    const { body, success } = await useApiFetch('project-manpower/utilization?maxCapacityDays=22');
    if (success && body) {
      utilizationData.value = body;
    }
  } catch {
    // Non-critical
  } finally {
    loadingUtil.value = false;
  }
}

// --------------------------------------------------
// Heatmap helpers
// --------------------------------------------------
function getHeatmapClass(hours: number, max: number) {
  const ratio = hours / max;
  if (ratio === 0) return 'bg-slate-800/30 text-slate-600';
  if (ratio <= 0.5) return 'bg-emerald-500/20 text-emerald-400';
  if (ratio <= 0.75) return 'bg-blue-500/20 text-blue-400';
  if (ratio <= 1) return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/30 text-red-400';
}

function getTotalClass(res: Resource) {
  const total = res.weeklyHours.reduce((a: number, b: number) => a + b, 0);
  const max = res.maxHoursPerDay * 5;
  if (total > max) return 'text-red-400';
  if (total >= max * 0.8) return 'text-amber-400';
  return 'text-emerald-400';
}

function getUtilPercent(res: Resource) {
  return Math.round((res.weeklyHours.reduce((a: number, b: number) => a + b, 0) / (res.maxHoursPerDay * 5)) * 100);
}

function getUtilColor(res: Resource) {
  const pct = getUtilPercent(res);
  if (pct > 100) return '#EF4444';
  if (pct >= 80) return '#F59E0B';
  return '#10B981';
}

// --------------------------------------------------
// Edit day allocation -> persists via API
// --------------------------------------------------
function editDayAllocation(res: Resource, dayIdx: number) {
  // Find all allocations for this resource, let user adjust estimatedWorkDays on each
  const allocs = (res.allocations || []).map((a) => ({
    ...a,
    _editDays: a.estimatedWorkDays
  }));

  const totalHours = res.weeklyHours[dayIdx] || 0;

  editingDay.value = {
    resource: res,
    dayIndex: dayIdx,
    allocations: allocs,
    totalHours
  };
  showDayEditDialog.value = true;
}

// Watch allocation edits to update total hours preview
watch(
  () => editingDay.value.allocations.map((a) => a._editDays),
  newVals => {
    const totalDays = newVals.reduce((s: number, d: number) => s + (d || 0), 0);
    const perDay = Math.min(8, Math.round((totalDays * 8) / 5));
    editingDay.value.totalHours = perDay;
  },
  { deep: true }
);

async function applyDayEdit() {
  if (!editingDay.value.resource) return;
  savingDay.value = true;
  try {
    let anyUpdated = false;
    for (const alloc of editingDay.value.allocations) {
      if (alloc._editDays !== alloc.estimatedWorkDays) {
        const { success } = await useApiFetch(`project-manpower/${alloc.id}`, 'PUT', {
          estimatedWorkDays: alloc._editDays
        });
        if (success) anyUpdated = true;
      }
    }
    if (anyUpdated) {
      ElMessage.success(t('common.saved'));
      await fetchData();
      if (viewMode.value === 'utilization') await fetchUtilizationReport();
    } else {
      ElMessage.info(t('common.saved'));
    }
    showDayEditDialog.value = false;
  } catch (err: unknown) {
    console.error('Failed to update allocation:', err);
    ElMessage.error(t('common.error'));
  } finally {
    savingDay.value = false;
  }
}

// --------------------------------------------------
// Allocate / Edit / Delete
// --------------------------------------------------
function openAllocateDialog() {
  editingAlloc.value = null;
  allocForm.manpowerId = '';
  allocForm.projectId = '';
  allocForm.estimatedWorkDays = 5;
  allocForm.actualWorkDays = 0;
  allocForm.mission = ['Standard'];
  showAllocateDialog.value = true;
}

function editAllocation(alloc: unknown) {
  editingAlloc.value = alloc;
  allocForm.manpowerId = alloc.manpowerId;
  allocForm.projectId = alloc.projectId;
  allocForm.estimatedWorkDays = alloc.estimatedWorkDays;
  allocForm.actualWorkDays = alloc.actualWorkDays;
  allocForm.mission = alloc.mission || ['Standard'];
  showAllocateDialog.value = true;
}

async function saveAllocation() {
  if (!allocForm.manpowerId || !allocForm.projectId) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    if (editingAlloc.value) {
      // UPDATE existing
      const { success } = await useApiFetch(`project-manpower/${editingAlloc.value.id}`, 'PUT', {
        estimatedWorkDays: allocForm.estimatedWorkDays,
        actualWorkDays: allocForm.actualWorkDays,
        mission: allocForm.mission
      });
      if (success) {
        ElMessage.success(t('common.saved'));
        showAllocateDialog.value = false;
        await fetchData();
        if (viewMode.value === 'utilization') await fetchUtilizationReport();
      }
    } else {
      // CREATE new
      const { success } = await useApiFetch('project-manpower', 'POST', {
        projectId: allocForm.projectId,
        manpowerId: allocForm.manpowerId,
        estimatedWorkDays: allocForm.estimatedWorkDays,
        actualWorkDays: allocForm.actualWorkDays,
        mission: allocForm.mission
      });
      if (success) {
        ElMessage.success(t('common.saved'));
        showAllocateDialog.value = false;
        await fetchData();
        if (viewMode.value === 'utilization') await fetchUtilizationReport();
      }
    }
  } catch (err: unknown) {
    console.error('Allocation error:', err);
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function deleteAllocation(id: string) {
  try {
    await ElMessageBox.confirm(t('common.confirmAction'), t('common.warning'), {
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
    const { success } = await useApiFetch(`project-manpower/${id}`, 'DELETE');
    if (success) {
      ElMessage.success(t('common.deleted'));
      await fetchData();
      if (viewMode.value === 'utilization') await fetchUtilizationReport();
    }
  } catch {
    // User cancelled
  }
}

// --------------------------------------------------
// Lifecycle
// --------------------------------------------------
onMounted(() => {
  fetchData();
});

// Fetch utilization when view changes to utilization
watch(viewMode, newMode => {
  if (newMode === 'utilization' && !utilizationData.value) {
    fetchUtilizationReport();
  }
});
</script>
