<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">A/B Testing</h1>
          <p class="text-slate-400 text-sm mt-1">Create experiments, test variations, and optimize your campaigns with data-driven decisions.</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showCreateDialog = true">
          <Icon name="ph:flask-bold" class="w-4 h-4 mr-2" />
          New Experiment
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ experiments.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Experiments</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ experiments.filter(e => e.status === 'COMPLETED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Completed</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ experiments.filter(e => e.status === 'RUNNING').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Running</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ avgLift }}%</div>
        <div class="text-xs text-slate-500 mt-1">Avg Conversion Lift</div>
      </div>
    </div>

    <!-- Experiments List -->
    <div class="space-y-4">
      <div v-for="exp in experiments" :key="exp.id" class="glass-panel p-6 rounded-2xl">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-medium text-slate-200">{{ exp.name }}</h3>
              <el-tag :type="getExpStatusType(exp.status)" effect="dark" size="small">{{ exp.status }}</el-tag>
            </div>
            <p class="text-sm text-slate-500 mt-1">{{ exp.description }}</p>
          </div>
          <div class="text-right">
            <div class="text-xs text-slate-500">Duration</div>
            <div class="text-sm text-slate-400">{{ exp.duration }}</div>
          </div>
        </div>

        <!-- Variants Comparison -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div
            v-for="variant in exp.variants"
            :key="variant.id"
            class="p-4 rounded-xl border transition"
            :class="variant.isWinner ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700/50 bg-slate-800/30'"
          >
            <div class="flex justify-between items-center mb-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-slate-200">{{ variant.name }}</span>
                <el-tag v-if="variant.isWinner" type="success" effect="dark" size="small">Winner</el-tag>
                <el-tag v-if="variant.isControl" type="info" effect="plain" size="small">Control</el-tag>
              </div>
              <span class="text-xs text-slate-500">{{ variant.trafficShare }}% traffic</span>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div>
                <div class="text-lg font-bold text-slate-200">{{ variant.sent }}</div>
                <div class="text-xs text-slate-500">Sent</div>
              </div>
              <div>
                <div class="text-lg font-bold text-blue-400">{{ variant.openRate }}%</div>
                <div class="text-xs text-slate-500">Open Rate</div>
              </div>
              <div>
                <div class="text-lg font-bold text-emerald-400">{{ variant.conversionRate }}%</div>
                <div class="text-xs text-slate-500">Conversion</div>
              </div>
            </div>
            <div class="mt-3">
              <el-progress
                :percentage="variant.conversionRate * 5"
                :stroke-width="4"
                :color="variant.isWinner ? '#10B981' : '#6366F1'"
                :show-text="false"
              />
            </div>
          </div>
        </div>

        <!-- Statistical Confidence -->
        <div
          v-if="exp.status === 'COMPLETED' || exp.status === 'RUNNING'"
          class="mt-4 p-3 rounded-lg bg-slate-800/40 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <Icon name="ph:chart-bar-bold" class="w-4 h-4 text-indigo-400" />
            <span class="text-sm text-slate-400">Statistical Confidence:</span>
            <span class="text-sm font-medium" :class="exp.confidence >= 95 ? 'text-emerald-400' : 'text-amber-400'">{{ exp.confidence }}%</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-400">Lift:</span>
            <span class="text-sm font-medium" :class="exp.lift >= 0 ? 'text-emerald-400' : 'text-red-400'">
              {{ exp.lift >= 0 ? '+' : '' }}{{ exp.lift }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Experiment Dialog -->
    <el-dialog v-model="showCreateDialog" title="Create A/B Test Experiment" width="600px">
      <el-form label-position="top">
        <el-form-item label="Experiment Name">
          <el-input v-model="newExperiment.name" placeholder="e.g., Subject Line Test - Q1 Campaign" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="newExperiment.description" type="textarea" :rows="2" placeholder="What are you testing?" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Test Type">
            <el-select v-model="newExperiment.testType" class="w-full">
              <el-option label="Email Subject" value="SUBJECT" />
              <el-option label="Email Content" value="CONTENT" />
              <el-option label="Send Time" value="SEND_TIME" />
              <el-option label="CTA Button" value="CTA" />
              <el-option label="Landing Page" value="LANDING_PAGE" />
            </el-select>
          </el-form-item>
          <el-form-item label="Traffic Split">
            <el-select v-model="newExperiment.trafficSplit" class="w-full">
              <el-option label="50/50" value="50-50" />
              <el-option label="70/30" value="70-30" />
              <el-option label="80/20" value="80-20" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="Campaign">
          <el-select v-model="newExperiment.campaignId" placeholder="Select campaign" class="w-full">
            <el-option label="Q1 Newsletter" value="1" />
            <el-option label="Product Launch" value="2" />
            <el-option label="Re-engagement Series" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="Duration">
          <el-select v-model="newExperiment.duration" class="w-full">
            <el-option label="24 hours" value="24h" />
            <el-option label="3 days" value="3d" />
            <el-option label="7 days" value="7d" />
            <el-option label="14 days" value="14d" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createExperiment">
          <Icon name="ph:flask-bold" class="w-4 h-4 mr-2" />
          Create Experiment
        </el-button>
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

const showCreateDialog = ref(false);
const newExperiment = ref({ name: '', description: '', testType: 'SUBJECT', trafficSplit: '50-50', campaignId: '', duration: '7d' });

const experiments = ref([
  {
    id: 1,
    name: 'Subject Line Test - March Newsletter',
    description: 'Testing casual vs professional subject lines for monthly newsletter',
    status: 'COMPLETED',
    duration: '7 days',
    confidence: 97,
    lift: 12.5,
    variants: [
      { id: 'a', name: 'Variant A', isControl: true, isWinner: false, trafficShare: 50, sent: 5000, openRate: 22.4, conversionRate: 3.2 },
      { id: 'b', name: 'Variant B', isControl: false, isWinner: true, trafficShare: 50, sent: 5000, openRate: 28.1, conversionRate: 4.8 }
    ]
  },
  {
    id: 2,
    name: 'CTA Button Color Test',
    description: 'Testing green vs blue CTA buttons for conversion rate',
    status: 'RUNNING',
    duration: '14 days',
    confidence: 82,
    lift: 8.3,
    variants: [
      { id: 'a', name: 'Green CTA', isControl: true, isWinner: false, trafficShare: 50, sent: 3200, openRate: 25.6, conversionRate: 4.1 },
      { id: 'b', name: 'Blue CTA', isControl: false, isWinner: false, trafficShare: 50, sent: 3200, openRate: 25.8, conversionRate: 4.5 }
    ]
  },
  {
    id: 3,
    name: 'Send Time Optimization',
    description: 'Testing morning vs afternoon send times',
    status: 'DRAFT',
    duration: '7 days',
    confidence: 0,
    lift: 0,
    variants: [
      { id: 'a', name: 'Morning (9 AM)', isControl: true, isWinner: false, trafficShare: 50, sent: 0, openRate: 0, conversionRate: 0 },
      { id: 'b', name: 'Afternoon (2 PM)', isControl: false, isWinner: false, trafficShare: 50, sent: 0, openRate: 0, conversionRate: 0 }
    ]
  }
]);

const avgLift = computed(() => {
  const completed = experiments.value.filter(e => e.status === 'COMPLETED');
  if (!completed.length) return 0;
  return (completed.reduce((s, e) => s + e.lift, 0) / completed.length).toFixed(1);
});

const getExpStatusType = (s: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const m: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    COMPLETED: 'success',
    RUNNING: undefined,
    DRAFT: 'info',
    PAUSED: 'warning'
  };
  return m[s] || 'info';
};

const createExperiment = () => {
  if (!newExperiment.value.name) {
    ElMessage.warning('Experiment name is required');
    return;
  }
  ElMessage.success('Experiment created');
  showCreateDialog.value = false;
};
</script>
