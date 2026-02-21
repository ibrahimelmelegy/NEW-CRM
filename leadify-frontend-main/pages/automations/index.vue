<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-indigo-400">
            {{ $t('automations.title', 'Visual Journey Builder') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">
            {{ $t('automations.subtitle', 'Design and automate your sales and operational workflows with ease.') }}
          </p>
        </div>
        <el-button type="primary" class="!rounded-xl shadow-lg shadow-primary-500/20" @click="createNewJourney">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          {{ $t('automations.createNew', 'Create Journey') }}
        </el-button>
      </div>
    </div>

    <!-- Active Journeys Grid -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="glass-panel p-6 rounded-2xl min-h-[160px] animate-pulse">
        <div class="w-1/2 h-6 bg-slate-700/50 rounded mb-4"></div>
        <div class="w-3/4 h-4 bg-slate-700/50 rounded"></div>
      </div>
    </div>

    <div v-else-if="fetchError" class="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center">
      <div class="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
        <Icon name="ph:warning-bold" class="w-10 h-10 text-red-400" />
      </div>
      <h3 class="text-xl font-medium text-slate-200 mb-2">Failed to Load Automations</h3>
      <p class="text-slate-400 max-w-sm mb-4">{{ fetchError }}</p>
      <el-button type="primary" class="!rounded-xl" @click="fetchWorkflows">Retry</el-button>
    </div>

    <div v-else-if="workflows.length === 0" class="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center">
      <div class="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
        <Icon name="ph:git-merge-bold" class="w-10 h-10 text-slate-400" />
      </div>
      <h3 class="text-xl font-medium text-slate-200 mb-2">No Automations Yet</h3>
      <p class="text-slate-400 max-w-sm mb-6">Build your first visual journey to automate repetitive tasks and scale your processes.</p>
      <el-button type="primary" class="!rounded-xl" @click="createNewJourney">Create First Journey</el-button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Journey Card -->
      <div
        v-for="workflow in workflows"
        :key="workflow.id"
        class="glass-panel p-6 rounded-2xl group hover:border-primary-500/30 transition-all duration-300 relative overflow-hidden"
      >
        <!-- Activity Blob -->
        <div v-if="workflow.isActive" class="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>

        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
              <Icon :name="getIconForTrigger(workflow.triggerType)" class="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 class="font-medium text-slate-200 line-clamp-1 truncate" :title="workflow.name">{{ workflow.name }}</h3>
              <el-tag size="small" :type="workflow.isActive ? 'success' : 'info'" class="mt-1" effect="dark">
                {{ workflow.isActive ? 'Active' : 'Draft' }}
              </el-tag>
            </div>
          </div>

          <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, workflow)">
            <el-button link class="!text-slate-400 hover:!text-white">
              <Icon name="ph:dots-three-vertical-bold" class="w-5 h-5" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="!bg-slate-900 !border-slate-800">
                <el-dropdown-item command="edit">
                  <Icon name="ph:pencil-simple" class="w-4 h-4 mr-2" />
                  Edit Canvas
                </el-dropdown-item>
                <el-dropdown-item command="toggle">
                  <Icon :name="workflow.isActive ? 'ph:pause' : 'ph:play'" class="w-4 h-4 mr-2" />
                  {{ workflow.isActive ? 'Pause' : 'Activate' }}
                </el-dropdown-item>
                <el-dropdown-item command="logs">
                  <Icon name="ph:list-dashes" class="w-4 h-4 mr-2" />
                  View Execution Logs
                </el-dropdown-item>
                <el-dropdown-item divided command="delete" class="!text-red-400">
                  <Icon name="ph:trash" class="w-4 h-4 mr-2" />
                  Delete
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <p class="text-sm text-slate-400 line-clamp-2 mb-4 h-10">
          {{ workflow.description || 'No description provided.' }}
        </p>

        <!-- Stats Footer -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-800/60">
          <div class="flex flex-col">
            <span class="text-xs text-slate-500">Executions</span>
            <span class="text-sm font-medium text-slate-300">{{ workflow.executionCount || 0 }}</span>
          </div>
          <div class="flex flex-col text-right">
            <span class="text-xs text-slate-500">Trigger</span>
            <span class="text-sm font-medium text-slate-300 capitalize">{{ (workflow.entityType || '').replace('_', ' ') }}</span>
          </div>
        </div>

        <!-- Hidden overlay link to open builder -->
        <nuxt-link :to="`/automations/${workflow.id}`" class="absolute inset-0 z-0"></nuxt-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const router = useRouter();

const workflows = ref<any[]>([]);
const loading = ref(true);
const fetchError = ref('');

const fetchWorkflows = async () => {
  loading.value = true;
  fetchError.value = '';
  try {
    const res: any = await useApiFetch('workflows');
    if (res?.success) {
      workflows.value = res.body?.docs || res.body || [];
    } else {
      fetchError.value = res?.message || `API error (code ${res?.code || 'unknown'})`;
      console.error('[Automations] fetch failed:', res);
    }
  } catch (err: any) {
    fetchError.value = err?.message || 'Network error';
    console.error('[Automations] unexpected error:', err);
  } finally {
    loading.value = false;
  }
};

const createNewJourney = async () => {
  try {
    const response = await ElMessageBox.prompt('Please enter a name for the new journey', 'Create Journey', {
      confirmButtonText: 'Create Studio Canvas',
      cancelButtonText: 'Cancel',
      inputPattern: /.+/,
      inputErrorMessage: 'Name cannot be empty',
      customClass: 'dark-message-box'
    });

    if (response && (response as any).value) {
      const res: any = await useApiFetch('workflows/rules', 'POST', {
        name: (response as any).value,
        entityType: 'lead', // default
        triggerType: 'ON_CREATE',
        conditionLogic: 'AND',
        conditions: [],
        actions: [],
        isActive: false
      });

      if (res?.success) {
        ElMessage.success('Journey created');
        router.push(`/automations/${res.body?.id}`);
      }
    }
  } catch (e) {
    // User cancelled
  }
};

const handleCommand = async (command: string, workflow: any) => {
  if (command === 'edit') {
    router.push(`/automations/${workflow.id}`);
  } else if (command === 'toggle') {
    try {
      await useApiFetch(`workflows/rules/${workflow.id}/toggle`, 'PATCH', { isActive: !workflow.isActive });
      ElMessage.success(`Automation ${!workflow.isActive ? 'activated' : 'paused'} successfully`);
      fetchWorkflows();
    } catch (err) {
      ElMessage.error('Failed to toggle workflow');
    }
  } else if (command === 'logs') {
    ElMessage.info('Execution logs feature coming soon');
  } else if (command === 'delete') {
    try {
      await ElMessageBox.confirm('Are you sure you want to delete this automation?', 'Warning', {
        type: 'warning',
        customClass: 'dark-message-box'
      });
      await useApiFetch(`workflows/rules/${workflow.id}`, 'DELETE');
      ElMessage.success('Automation deleted');
      fetchWorkflows();
    } catch (e) {
      // Cancelled or error
    }
  }
};

const getIconForTrigger = (trigger: string) => {
  if (trigger === 'ON_CREATE') return 'ph:sparkle-bold';
  if (trigger === 'ON_UPDATE') return 'ph:arrows-clockwise-bold';
  if (trigger === 'ON_FIELD_CHANGE') return 'ph:cursor-click-bold';
  if (trigger === 'SCHEDULED') return 'ph:clock-bold';
  return 'ph:git-merge-bold';
};

onMounted(() => {
  fetchWorkflows();
});
</script>

<style scoped>
/* Scoped overrides if needed */
.dark-message-box {
  background: #1e293b !important;
  border-color: #334155 !important;
}
</style>
