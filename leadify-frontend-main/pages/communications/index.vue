<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
            {{ $t('communications.title', 'Communication Hub') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">
            {{ $t('communications.subtitle', 'Unified inbox for all emails, calls, meetings, and notes across your CRM.') }}
          </p>
        </div>
        <div class="flex gap-2">
          <el-button type="primary" class="!rounded-xl" @click="showLogDialog = true">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            {{ $t('communications.logActivity') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-xl font-bold text-slate-200">{{ stats.totalActivities }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('communications.totalActivities') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-xl font-bold text-blue-400">{{ stats.callsToday }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('communications.callsToday') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-xl font-bold text-indigo-400">{{ stats.emailsThisWeek }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('communications.emailsThisWeek') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-xl font-bold text-purple-400">{{ stats.meetingsScheduled }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('communications.meetings') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-xl font-bold text-teal-400">{{ stats.notesCreated }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('communications.notesThisWeek') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-xl font-bold" :class="stats.trend >= 0 ? 'text-emerald-400' : 'text-red-400'">
          {{ stats.trend >= 0 ? '+' : '' }}{{ stats.trend }}%
        </div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('communications.weekTrend') }}</div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Activity Timeline (left 3 cols) -->
      <div class="lg:col-span-3 space-y-4">
        <!-- Filters -->
        <div class="glass-panel p-4 rounded-xl flex flex-wrap gap-3 items-center">
          <el-select v-model="filterType" :placeholder="$t('communications.activityType')" clearable class="w-40" @change="fetchActivities">
            <el-option :label="$t('communications.allTypes')" value="" />
            <el-option :label="$t('communications.email')" value="EMAIL" />
            <el-option :label="$t('communications.call')" value="CALL" />
            <el-option :label="$t('communications.meeting')" value="MEETING" />
            <el-option :label="$t('communications.note')" value="NOTE" />
            <el-option :label="$t('communications.task')" value="TASK" />
          </el-select>
          <el-select v-model="filterDirection" :placeholder="$t('communications.direction')" clearable class="w-36" @change="fetchActivities">
            <el-option :label="$t('communications.all')" value="" />
            <el-option :label="$t('communications.inbound')" value="INBOUND" />
            <el-option :label="$t('communications.outbound')" value="OUTBOUND" />
          </el-select>
          <div class="flex-1"></div>
          <el-input
            v-model="searchQuery"
            :placeholder="$t('communications.search')"
            prefix-icon="Search"
            clearable
            class="!w-56"
            @input="debouncedSearch"
          />
        </div>

        <!-- Timeline -->
        <div v-if="activitiesLoading" class="space-y-4">
          <div v-for="i in 5" :key="i" class="glass-panel p-5 rounded-xl animate-pulse">
            <div class="flex gap-4">
              <div class="w-10 h-10 rounded-full bg-slate-700/50"></div>
              <div class="flex-1 space-y-2">
                <div class="w-1/3 h-4 bg-slate-700/50 rounded"></div>
                <div class="w-2/3 h-3 bg-slate-700/50 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activities.length === 0" class="glass-panel p-12 rounded-2xl text-center">
          <Icon name="ph:chat-circle-dots-bold" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-slate-300 mb-2">{{ $t('communications.noActivities') }}</h3>
          <p class="text-slate-500 text-sm">{{ $t('communications.noActivitiesDesc') }}</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="activity in activities"
            :key="activity.id"
            class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all duration-200 group"
          >
            <div class="flex gap-4">
              <!-- Type Icon -->
              <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" :class="getActivityIconBg(activity.type)">
                <Icon :name="getActivityIcon(activity.type)" class="w-5 h-5" :class="getActivityIconColor(activity.type)" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h4 class="text-sm font-medium text-slate-200 line-clamp-1">{{ activity.subject }}</h4>
                    <div class="flex items-center gap-2 mt-1">
                      <el-tag :type="getActivityTagType(activity.type)" effect="dark" size="small">{{ activity.type }}</el-tag>
                      <el-tag v-if="activity.direction" type="info" effect="plain" size="small">{{ activity.direction }}</el-tag>
                      <span class="text-xs text-slate-500">{{ activity.user?.name || $t('communications.system') }}</span>
                    </div>
                  </div>
                  <span class="text-xs text-slate-500 shrink-0">{{ formatTimeAgo(activity.createdAt) }}</span>
                </div>
                <p v-if="activity.body" class="text-sm text-slate-400 mt-2 line-clamp-2">{{ activity.body }}</p>
                <!-- Call Details -->
                <div v-if="activity.callLog" class="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>
                    <Icon name="ph:phone" class="w-3 h-3 inline mr-1" />
                    {{ activity.callLog.phoneNumber }}
                  </span>
                  <span>
                    <Icon name="ph:timer" class="w-3 h-3 inline mr-1" />
                    {{ formatDuration(activity.callLog.duration) }}
                  </span>
                  <el-tag size="small" :type="activity.callLog.outcome === 'CONNECTED' ? 'success' : 'info'" effect="plain">
                    {{ activity.callLog.outcome }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalItems > pageSize" class="flex justify-center pt-4">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalItems"
            layout="prev, pager, next"
            @current-change="fetchActivities"
          />
        </div>
      </div>

      <!-- Right Sidebar: Activity Breakdown -->
      <div class="space-y-4">
        <!-- Activity Type Breakdown -->
        <div class="glass-panel p-5 rounded-xl">
          <h3 class="text-sm font-medium text-slate-300 mb-4">{{ $t('communications.activityBreakdown') }}</h3>
          <div class="space-y-3">
            <div v-for="(count, type) in stats.byType" :key="type" class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon :name="getActivityIcon(type as string)" class="w-4 h-4" :class="getActivityIconColor(type as string)" />
                <span class="text-sm text-slate-400 capitalize">{{ (type as string).toLowerCase() }}</span>
              </div>
              <span class="text-sm font-medium text-slate-300">{{ count }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="glass-panel p-5 rounded-xl">
          <h3 class="text-sm font-medium text-slate-300 mb-4">{{ $t('communications.callPerformance') }}</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-slate-400">{{ $t('communications.avgCallDuration') }}</span>
              <span class="text-sm font-medium text-slate-300">{{ formatDuration(stats.avgCallDuration) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-slate-400">{{ $t('communications.tasksThisWeek') }}</span>
              <span class="text-sm font-medium text-slate-300">{{ stats.tasksThisWeek }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Activity Dialog -->
    <el-dialog v-model="showLogDialog" :title="$t('communications.logActivity')" width="560px" class="glass-dialog">
      <el-form :model="newActivity" label-position="top">
        <el-form-item :label="$t('communications.activityType')">
          <el-select v-model="newActivity.type" :placeholder="$t('communications.selectType')" class="w-full">
            <el-option :label="$t('communications.email')" value="EMAIL" />
            <el-option :label="$t('communications.call')" value="CALL" />
            <el-option :label="$t('communications.meeting')" value="MEETING" />
            <el-option :label="$t('communications.note')" value="NOTE" />
            <el-option :label="$t('communications.task')" value="TASK" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('communications.subject')">
          <el-input v-model="newActivity.subject" :placeholder="$t('communications.activitySubject')" />
        </el-form-item>
        <el-form-item v-if="['EMAIL', 'CALL'].includes(newActivity.type)" :label="$t('communications.direction')">
          <el-radio-group v-model="newActivity.direction">
            <el-radio value="INBOUND">{{ $t('communications.inbound') }}</el-radio>
            <el-radio value="OUTBOUND">{{ $t('communications.outbound') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('communications.details')">
          <el-input v-model="newActivity.body" type="textarea" :rows="3" :placeholder="$t('communications.activityDetails')" />
        </el-form-item>
        <el-form-item v-if="newActivity.type === 'CALL'" :label="$t('communications.phoneNumber')">
          <el-input v-model="newActivity.phoneNumber" :placeholder="$t('communications.phoneNumberPlaceholder')" />
        </el-form-item>
        <el-form-item v-if="newActivity.type === 'CALL'" :label="$t('communications.callOutcome')">
          <el-select v-model="newActivity.outcome" :placeholder="$t('communications.selectOutcome')" class="w-full">
            <el-option :label="$t('communications.connected')" value="CONNECTED" />
            <el-option :label="$t('communications.noAnswer')" value="NO_ANSWER" />
            <el-option :label="$t('communications.voicemail')" value="VOICEMAIL" />
            <el-option :label="$t('communications.busy')" value="BUSY" />
            <el-option :label="$t('communications.leftMessage')" value="LEFT_MESSAGE" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLogDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="logActivity">{{ $t('communications.logActivity') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();

const activities = ref<Record<string, unknown>[]>([]);
const activitiesLoading = ref(true);
const currentPage = ref(1);
const pageSize = 20;
const totalItems = ref(0);
const filterType = ref('');
const filterDirection = ref('');
const searchQuery = ref('');
const showLogDialog = ref(false);
const saving = ref(false);

const stats = ref<Record<string, unknown>>({
  totalActivities: 0,
  callsToday: 0,
  emailsThisWeek: 0,
  meetingsScheduled: 0,
  notesCreated: 0,
  tasksThisWeek: 0,
  avgCallDuration: 0,
  trend: 0,
  byType: {}
});

const newActivity = ref({
  type: 'NOTE',
  subject: '',
  body: '',
  direction: 'OUTBOUND',
  contactId: '',
  contactType: 'LEAD',
  phoneNumber: '',
  outcome: 'CONNECTED'
});

let searchTimeout: ReturnType<typeof setTimeout>;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchActivities(), 300);
};

const fetchActivities = async () => {
  activitiesLoading.value = true;
  const params = new URLSearchParams();
  params.append('page', currentPage.value.toString());
  params.append('limit', pageSize.toString());
  if (filterType.value) params.append('type', filterType.value);

  const res = await useApiFetch(`communications/recent?${params.toString()}`);
  if (res?.success && res.body) {
    if (Array.isArray(res.body)) {
      activities.value = res.body;
      totalItems.value = res.body.length;
    } else {
      activities.value = res.body.docs || res.body;
      totalItems.value = res.body.pagination?.totalItems || activities.value.length;
    }
  }
  activitiesLoading.value = false;
};

const fetchStats = async () => {
  const res = await useApiFetch('communications/stats');
  if (res?.success && res.body) {
    stats.value = res.body;
  }
};

const logActivity = async () => {
  if (!newActivity.value.subject) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  if (newActivity.value.type === 'CALL') {
    if (!newActivity.value.phoneNumber) {
      ElMessage.warning(t('communications.phoneNumberRequired'));
      return;
    }
    if (!newActivity.value.outcome) {
      ElMessage.warning(t('communications.outcomeRequired'));
      return;
    }
  }
  saving.value = true;
  const res = await useApiFetch('communications/activities', 'POST', {
    ...newActivity.value
  });
  if (res?.success) {
    ElMessage.success(t('communications.activityLogged'));
    showLogDialog.value = false;
    newActivity.value = {
      type: 'NOTE',
      subject: '',
      body: '',
      direction: 'OUTBOUND',
      contactId: '',
      contactType: 'LEAD',
      phoneNumber: '',
      outcome: 'CONNECTED'
    };
    fetchActivities();
    fetchStats();
  } else {
    ElMessage.error(res?.message || t('communications.logActivityFailed'));
  }
  saving.value = false;
};

const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    EMAIL: 'ph:envelope-simple-bold',
    CALL: 'ph:phone-bold',
    MEETING: 'ph:video-camera-bold',
    NOTE: 'ph:note-pencil-bold',
    TASK: 'ph:check-square-bold'
  };
  return icons[type] || 'ph:circle-bold';
};

const getActivityIconBg = (type: string) => {
  const bgs: Record<string, string> = {
    EMAIL: 'bg-blue-500/10',
    CALL: 'bg-emerald-500/10',
    MEETING: 'bg-purple-500/10',
    NOTE: 'bg-amber-500/10',
    TASK: 'bg-teal-500/10'
  };
  return bgs[type] || 'bg-slate-500/10';
};

const getActivityIconColor = (type: string) => {
  const colors: Record<string, string> = {
    EMAIL: 'text-blue-400',
    CALL: 'text-emerald-400',
    MEETING: 'text-purple-400',
    NOTE: 'text-amber-400',
    TASK: 'text-teal-400'
  };
  return colors[type] || 'text-slate-400';
};

const getActivityTagType = (type: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const types: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    EMAIL: undefined,
    CALL: 'success',
    MEETING: 'warning',
    NOTE: 'info',
    TASK: 'danger'
  };
  return types[type] || 'info';
};

const formatTimeAgo = (date: string) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('communications.justNow');
  if (mins < 60) return `${mins}m ${t('communications.ago')}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${t('communications.ago')}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ${t('communications.ago')}`;
  return new Date(date).toLocaleDateString();
};

const formatDuration = (seconds: number) => {
  if (!seconds) return t('communications.zeroDuration');
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

onMounted(() => {
  fetchActivities();
  fetchStats();
});

onUnmounted(() => {
  clearTimeout(searchTimeout);
});
</script>
