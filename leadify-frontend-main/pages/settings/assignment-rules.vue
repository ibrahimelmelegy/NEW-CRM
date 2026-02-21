<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">Assignment & Escalation Rules</h1>
          <p class="text-slate-400 text-sm mt-1">Auto-assign leads, deals, and tickets based on criteria. Set escalation paths for SLA breaches.</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showRuleDialog = true">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          New Rule
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ rules.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Rules</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ rules.filter(r => r.isActive).length }}</div>
        <div class="text-xs text-slate-500 mt-1">Active</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ totalAssignments }}</div>
        <div class="text-xs text-slate-500 mt-1">Auto-Assigned (30d)</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ escalationsTriggered }}</div>
        <div class="text-xs text-slate-500 mt-1">Escalations (30d)</div>
      </div>
    </div>

    <!-- Tabs: Assignment / Escalation / Round Robin -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Assignment Rules -->
      <el-tab-pane label="Assignment Rules" name="assignment">
        <div class="space-y-4">
          <div v-for="rule in assignmentRules" :key="rule.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Icon name="ph:user-switch-bold" class="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 class="text-sm font-medium text-slate-200">{{ rule.name }}</h4>
                  <p class="text-xs text-slate-500 mt-0.5">{{ rule.description }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <el-tag :type="rule.isActive ? 'success' : 'info'" effect="dark" size="small">
                  {{ rule.isActive ? 'Active' : 'Inactive' }}
                </el-tag>
                <el-switch v-model="rule.isActive" size="small" />
              </div>
            </div>

            <!-- Rule Conditions -->
            <div class="mt-4 p-3 rounded-lg bg-slate-800/40">
              <div class="text-xs text-slate-500 mb-2">Conditions ({{ rule.matchType }})</div>
              <div class="space-y-1">
                <div v-for="(cond, idx) in rule.conditions" :key="idx" class="flex items-center gap-2 text-xs">
                  <el-tag effect="plain" size="small">{{ cond.field }}</el-tag>
                  <span class="text-slate-500">{{ cond.operator }}</span>
                  <el-tag type="warning" effect="dark" size="small">{{ cond.value }}</el-tag>
                  <span v-if="idx < rule.conditions.length - 1" class="text-slate-600">{{ rule.matchType === 'ALL' ? 'AND' : 'OR' }}</span>
                </div>
              </div>
            </div>

            <!-- Action -->
            <div class="mt-3 flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs text-slate-400">
                <Icon name="ph:arrow-right-bold" class="w-3 h-3" />
                <span>
                  Assign to:
                  <strong class="text-slate-200">{{ rule.assignTo }}</strong>
                </span>
                <span v-if="rule.assignMethod" class="text-slate-600">| Method: {{ rule.assignMethod }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span>Triggered {{ rule.triggerCount }}x</span>
                <el-button text size="small" type="primary" @click="editRule(rule)">
                  <Icon name="ph:pencil-simple" class="w-3 h-3" />
                </el-button>
                <el-button text size="small" type="danger" @click="deleteRule(rule)">
                  <Icon name="ph:trash" class="w-3 h-3" />
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Escalation Rules -->
      <el-tab-pane label="Escalation Rules" name="escalation">
        <div class="space-y-4">
          <div v-for="esc in escalationRules" :key="esc.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Icon name="ph:warning-bold" class="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 class="text-sm font-medium text-slate-200">{{ esc.name }}</h4>
                  <p class="text-xs text-slate-500 mt-0.5">{{ esc.description }}</p>
                </div>
              </div>
              <el-switch v-model="esc.isActive" size="small" />
            </div>

            <!-- Escalation Levels -->
            <div class="mt-4 space-y-2">
              <div
                v-for="(level, idx) in esc.levels"
                :key="idx"
                class="flex items-center gap-3 p-2 rounded-lg"
                :class="idx === 0 ? 'bg-amber-500/5' : idx === 1 ? 'bg-orange-500/5' : 'bg-red-500/5'"
              >
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  :class="
                    idx === 0 ? 'bg-amber-500/20 text-amber-400' : idx === 1 ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                  "
                >
                  L{{ idx + 1 }}
                </div>
                <div class="flex-1">
                  <span class="text-xs text-slate-300">After {{ level.delay }}</span>
                  <span class="text-xs text-slate-500">→ Notify</span>
                  <span class="text-xs text-slate-200 font-medium">{{ level.notifyTo }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Icon v-if="level.email" name="ph:envelope" class="w-3 h-3 text-blue-400" />
                  <Icon v-if="level.sms" name="ph:chat-circle" class="w-3 h-3 text-emerald-400" />
                  <Icon v-if="level.slack" name="ph:slack-logo" class="w-3 h-3 text-purple-400" />
                </div>
              </div>
            </div>

            <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>
                Entity:
                <strong class="text-slate-300">{{ esc.entity }}</strong>
              </span>
              <span>| Trigger: {{ esc.trigger }}</span>
              <span>| Triggered {{ esc.triggerCount }}x</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Round Robin -->
      <el-tab-pane label="Round Robin" name="roundrobin">
        <div class="space-y-4">
          <div v-for="pool in roundRobinPools" :key="pool.id" class="glass-panel p-5 rounded-xl">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h4 class="text-sm font-medium text-slate-200">{{ pool.name }}</h4>
                <p class="text-xs text-slate-500 mt-0.5">{{ pool.entity }} - {{ pool.method }}</p>
              </div>
              <el-switch v-model="pool.isActive" size="small" />
            </div>

            <!-- Members -->
            <div class="flex flex-wrap gap-2 mb-3">
              <div v-for="member in pool.members" :key="member.name" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/40">
                <el-avatar :size="22" class="bg-slate-700">{{ member.name.charAt(0) }}</el-avatar>
                <span class="text-xs text-slate-300">{{ member.name }}</span>
                <span class="text-[10px] text-slate-500">({{ member.assigned }})</span>
                <div v-if="member.weight" class="text-[10px] text-indigo-400">{{ member.weight }}%</div>
              </div>
            </div>

            <!-- Pool Stats -->
            <div class="flex items-center gap-4 text-xs text-slate-500">
              <span>Total assigned: {{ pool.totalAssigned }}</span>
              <span>
                Next:
                <strong class="text-slate-300">{{ pool.nextAssignee }}</strong>
              </span>
              <span>Max load: {{ pool.maxLoad }}/person</span>
            </div>
          </div>

          <div v-if="roundRobinPools.length === 0" class="glass-panel p-12 rounded-2xl text-center">
            <Icon name="ph:arrows-clockwise-bold" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p class="text-slate-500">No round-robin pools configured</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- New Rule Dialog -->
    <el-dialog v-model="showRuleDialog" title="Create Assignment Rule" width="600px">
      <el-form label-position="top">
        <el-form-item label="Rule Name">
          <el-input v-model="newRule.name" placeholder="e.g., High-value leads to Senior Sales" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Rule Type">
            <el-select v-model="newRule.type" class="w-full">
              <el-option label="Assignment" value="ASSIGNMENT" />
              <el-option label="Escalation" value="ESCALATION" />
            </el-select>
          </el-form-item>
          <el-form-item label="Entity">
            <el-select v-model="newRule.entity" class="w-full">
              <el-option label="Leads" value="LEAD" />
              <el-option label="Deals" value="DEAL" />
              <el-option label="Tickets" value="TICKET" />
              <el-option label="Tasks" value="TASK" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="Match Type">
          <el-radio-group v-model="newRule.matchType">
            <el-radio value="ALL">Match ALL conditions</el-radio>
            <el-radio value="ANY">Match ANY condition</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Conditions">
          <div class="space-y-2 w-full">
            <div v-for="(cond, idx) in newRule.conditions" :key="idx" class="flex gap-2">
              <el-select v-model="cond.field" class="w-40">
                <el-option label="Source" value="source" />
                <el-option label="Industry" value="industry" />
                <el-option label="Value" value="value" />
                <el-option label="Priority" value="priority" />
                <el-option label="Region" value="region" />
              </el-select>
              <el-select v-model="cond.operator" class="w-32">
                <el-option label="equals" value="equals" />
                <el-option label="contains" value="contains" />
                <el-option label="greater than" value="gt" />
                <el-option label="less than" value="lt" />
              </el-select>
              <el-input v-model="cond.value" placeholder="Value" class="flex-1" />
              <el-button text type="danger" @click="newRule.conditions.splice(idx, 1)">
                <Icon name="ph:x-bold" class="w-4 h-4" />
              </el-button>
            </div>
            <el-button text type="primary" @click="newRule.conditions.push({ field: 'source', operator: 'equals', value: '' })">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-1" />
              Add Condition
            </el-button>
          </div>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Assign To">
            <el-input v-model="newRule.assignTo" placeholder="User or team name" />
          </el-form-item>
          <el-form-item label="Method">
            <el-select v-model="newRule.method" class="w-full">
              <el-option label="Direct" value="DIRECT" />
              <el-option label="Round Robin" value="ROUND_ROBIN" />
              <el-option label="Weighted" value="WEIGHTED" />
              <el-option label="Least Loaded" value="LEAST_LOADED" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showRuleDialog = false">Cancel</el-button>
        <el-button type="primary" @click="saveRule">Save Rule</el-button>
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

const activeTab = ref('assignment');
const showRuleDialog = ref(false);
const newRule = ref({
  name: '',
  type: 'ASSIGNMENT',
  entity: 'LEAD',
  matchType: 'ALL',
  conditions: [{ field: 'source', operator: 'equals', value: '' }],
  assignTo: '',
  method: 'ROUND_ROBIN'
});

const rules = ref([
  {
    id: 1,
    name: 'High-value leads → Senior Sales',
    description: 'Auto-assign leads with value > 50K to senior team',
    isActive: true,
    type: 'ASSIGNMENT',
    matchType: 'ALL',
    conditions: [
      { field: 'Value', operator: '>', value: '50,000 SAR' },
      { field: 'Source', operator: 'equals', value: 'Website' }
    ],
    assignTo: 'Senior Sales Team',
    assignMethod: 'Round Robin',
    triggerCount: 87
  },
  {
    id: 2,
    name: 'Enterprise leads → Key Account Mgr',
    description: 'Route enterprise segment leads to KAMs',
    isActive: true,
    type: 'ASSIGNMENT',
    matchType: 'ANY',
    conditions: [
      { field: 'Industry', operator: 'equals', value: 'Enterprise' },
      { field: 'Employees', operator: '>', value: '500' }
    ],
    assignTo: 'Khalid Ibrahim',
    assignMethod: 'Direct',
    triggerCount: 34
  },
  {
    id: 3,
    name: 'Support tickets by category',
    description: 'Auto-route tickets based on category',
    isActive: true,
    type: 'ASSIGNMENT',
    matchType: 'ALL',
    conditions: [{ field: 'Category', operator: 'equals', value: 'Technical' }],
    assignTo: 'Tech Support Pool',
    assignMethod: 'Least Loaded',
    triggerCount: 156
  },
  {
    id: 4,
    name: 'Regional lead routing',
    description: 'Route leads by geographic region',
    isActive: false,
    type: 'ASSIGNMENT',
    matchType: 'ALL',
    conditions: [{ field: 'Region', operator: 'equals', value: 'GCC' }],
    assignTo: 'GCC Sales Team',
    assignMethod: 'Weighted',
    triggerCount: 12
  }
]);

const assignmentRules = computed(() => rules.value.filter(r => r.type === 'ASSIGNMENT'));

const escalationRules = ref([
  {
    id: 1,
    name: 'Ticket SLA Breach',
    description: 'Escalate unresolved support tickets',
    isActive: true,
    entity: 'Ticket',
    trigger: 'SLA breach',
    triggerCount: 23,
    levels: [
      { delay: '2 hours', notifyTo: 'Team Lead', email: true, sms: false, slack: true },
      { delay: '4 hours', notifyTo: 'Department Manager', email: true, sms: true, slack: true },
      { delay: '8 hours', notifyTo: 'VP Support', email: true, sms: true, slack: true }
    ]
  },
  {
    id: 2,
    name: 'Deal Stale Alert',
    description: 'Escalate when deal has no activity for 7 days',
    isActive: true,
    entity: 'Deal',
    trigger: 'No activity > 7 days',
    triggerCount: 15,
    levels: [
      { delay: '7 days', notifyTo: 'Sales Rep', email: true, sms: false, slack: true },
      { delay: '14 days', notifyTo: 'Sales Manager', email: true, sms: true, slack: true }
    ]
  },
  {
    id: 3,
    name: 'Lead Response Time',
    description: 'Escalate if lead not contacted within 1 hour',
    isActive: true,
    entity: 'Lead',
    trigger: 'No contact > 1 hour',
    triggerCount: 45,
    levels: [
      { delay: '1 hour', notifyTo: 'Assigned Rep', email: true, sms: true, slack: true },
      { delay: '2 hours', notifyTo: 'Team Lead', email: true, sms: true, slack: true },
      { delay: '4 hours', notifyTo: 'Sales Director', email: true, sms: true, slack: true }
    ]
  }
]);

const roundRobinPools = ref([
  {
    id: 1,
    name: 'Sales Team Pool',
    entity: 'Leads',
    method: 'Round Robin',
    isActive: true,
    totalAssigned: 234,
    nextAssignee: 'Sara M.',
    maxLoad: 20,
    members: [
      { name: 'Ahmed F.', assigned: 52, weight: 30 },
      { name: 'Sara M.', assigned: 48, weight: 30 },
      { name: 'Omar H.', assigned: 45, weight: 20 },
      { name: 'Fatima A.', assigned: 44, weight: 20 }
    ]
  },
  {
    id: 2,
    name: 'Support Agents',
    entity: 'Tickets',
    method: 'Least Loaded',
    isActive: true,
    totalAssigned: 187,
    nextAssignee: 'Khalid I.',
    maxLoad: 15,
    members: [
      { name: 'Khalid I.', assigned: 38, weight: undefined },
      { name: 'Noura S.', assigned: 42, weight: undefined },
      { name: 'Yusuf A.', assigned: 55, weight: undefined },
      { name: 'Layla M.', assigned: 52, weight: undefined }
    ]
  }
]);

const totalAssignments = computed(() => rules.value.reduce((s, r) => s + r.triggerCount, 0));
const escalationsTriggered = computed(() => escalationRules.value.reduce((s, e) => s + e.triggerCount, 0));

const editRule = (rule: any) => ElMessage.info(`Editing: ${rule.name}`);
const deleteRule = (rule: any) => {
  rules.value = rules.value.filter(r => r.id !== rule.id);
  ElMessage.success('Rule deleted');
};

const saveRule = () => {
  if (!newRule.value.name) {
    ElMessage.warning('Rule name required');
    return;
  }
  rules.value.push({
    id: Date.now(),
    name: newRule.value.name,
    description: '',
    isActive: true,
    type: newRule.value.type,
    matchType: newRule.value.matchType,
    conditions: newRule.value.conditions.map(c => ({ field: c.field, operator: c.operator, value: c.value })),
    assignTo: newRule.value.assignTo,
    assignMethod: newRule.value.method,
    triggerCount: 0
  });
  showRuleDialog.value = false;
  ElMessage.success('Rule created');
};
</script>
