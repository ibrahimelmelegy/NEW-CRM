<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
            {{ $t('assignmentRules.title') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('assignmentRules.subtitle') }}</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showRuleDialog = true">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          {{ $t('assignmentRules.newRule') }}
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ rules.length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('assignmentRules.totalRules') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ rules.filter(r => r.isActive).length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('common.active') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ totalAssignments }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('assignmentRules.autoAssigned') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ escalationsTriggered }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('assignmentRules.escalations') }}</div>
      </div>
    </div>

    <!-- Tabs: Assignment / Escalation / Round Robin -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Assignment Rules -->
      <el-tab-pane :label="$t('assignmentRules.assignmentRules')" name="assignment">
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
                  {{ rule.isActive ? $t('assignmentRules.active') : $t('assignmentRules.inactive') }}
                </el-tag>
                <el-switch v-model="rule.isActive" size="small" />
              </div>
            </div>

            <!-- Rule Conditions -->
            <div class="mt-4 p-3 rounded-lg bg-slate-800/40">
              <div class="text-xs text-slate-500 mb-2">{{ $t('assignmentRules.conditions') }} ({{ rule.matchType }})</div>
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
                  {{ $t('assignmentRules.assignTo') }}:
                  <strong class="text-slate-200">{{ rule.assignTo }}</strong>
                </span>
                <span v-if="rule.assignMethod" class="text-slate-600">| {{ $t('assignmentRules.method') }}: {{ rule.assignMethod }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span>{{ $t('assignmentRules.triggered') }} {{ rule.triggerCount }}x</span>
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
      <el-tab-pane :label="$t('assignmentRules.escalationRules')" name="escalation">
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
                  <span class="text-xs text-slate-300">{{ $t('assignmentRules.after') }} {{ level.delay }}</span>
                  <span class="text-xs text-slate-500">→ {{ $t('assignmentRules.notify') }}</span>
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
                {{ $t('assignmentRules.entity') }}:
                <strong class="text-slate-300">{{ esc.entity }}</strong>
              </span>
              <span>| {{ $t('assignmentRules.trigger') }}: {{ esc.trigger }}</span>
              <span>| {{ $t('assignmentRules.triggered') }} {{ esc.triggerCount }}x</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Round Robin -->
      <el-tab-pane :label="$t('assignmentRules.roundRobin')" name="roundrobin">
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
              <span>{{ $t('assignmentRules.totalAssigned') }}: {{ pool.totalAssigned }}</span>
              <span>
                {{ $t('assignmentRules.next') }}:
                <strong class="text-slate-300">{{ pool.nextAssignee }}</strong>
              </span>
              <span>{{ $t('assignmentRules.maxLoad') }}: {{ pool.maxLoad }}/{{ $t('assignmentRules.person') }}</span>
            </div>
          </div>

          <div v-if="roundRobinPools.length === 0" class="glass-panel p-12 rounded-2xl text-center">
            <Icon name="ph:arrows-clockwise-bold" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p class="text-slate-500">{{ $t('assignmentRules.noRoundRobinPools') }}</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- New Rule Dialog -->
    <el-dialog v-model="showRuleDialog" :title="$t('assignmentRules.createRule')" width="600px">
      <el-form label-position="top">
        <el-form-item :label="$t('assignmentRules.ruleName')">
          <el-input v-model="newRule.name" :placeholder="$t('assignmentRules.ruleNamePlaceholder')" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('assignmentRules.ruleType')">
            <el-select v-model="newRule.type" class="w-full">
              <el-option :label="$t('assignmentRules.typeAssignment')" value="ASSIGNMENT" />
              <el-option :label="$t('assignmentRules.typeEscalation')" value="ESCALATION" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('assignmentRules.entityLabel')">
            <el-select v-model="newRule.entity" class="w-full">
              <el-option :label="$t('assignmentRules.entityLeads')" value="LEAD" />
              <el-option :label="$t('assignmentRules.entityDeals')" value="DEAL" />
              <el-option :label="$t('assignmentRules.entityTickets')" value="TICKET" />
              <el-option :label="$t('assignmentRules.entityTasks')" value="TASK" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item :label="$t('assignmentRules.matchType')">
          <el-radio-group v-model="newRule.matchType">
            <el-radio value="ALL">{{ $t('assignmentRules.matchAll') }}</el-radio>
            <el-radio value="ANY">{{ $t('assignmentRules.matchAny') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('assignmentRules.conditionsLabel')">
          <div class="space-y-2 w-full">
            <div v-for="(cond, idx) in newRule.conditions" :key="idx" class="flex gap-2">
              <el-select v-model="cond.field" class="w-40">
                <el-option :label="$t('assignmentRules.fieldSource')" value="source" />
                <el-option :label="$t('assignmentRules.fieldIndustry')" value="industry" />
                <el-option :label="$t('assignmentRules.fieldValue')" value="value" />
                <el-option :label="$t('assignmentRules.fieldPriority')" value="priority" />
                <el-option :label="$t('assignmentRules.fieldRegion')" value="region" />
              </el-select>
              <el-select v-model="cond.operator" class="w-32">
                <el-option :label="$t('assignmentRules.opEquals')" value="equals" />
                <el-option :label="$t('assignmentRules.opContains')" value="contains" />
                <el-option :label="$t('assignmentRules.opGreaterThan')" value="gt" />
                <el-option :label="$t('assignmentRules.opLessThan')" value="lt" />
              </el-select>
              <el-input v-model="cond.value" :placeholder="$t('assignmentRules.valuePlaceholder')" class="flex-1" />
              <el-button text type="danger" @click="newRule.conditions.splice(idx, 1)">
                <Icon name="ph:x-bold" class="w-4 h-4" />
              </el-button>
            </div>
            <el-button text type="primary" @click="newRule.conditions.push({ field: 'source', operator: 'equals', value: '' })">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-1" />
              {{ $t('assignmentRules.addCondition') }}
            </el-button>
          </div>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('assignmentRules.assignToLabel')">
            <el-input v-model="newRule.assignTo" :placeholder="$t('assignmentRules.assignToPlaceholder')" />
          </el-form-item>
          <el-form-item :label="$t('assignmentRules.methodLabel')">
            <el-select v-model="newRule.method" class="w-full">
              <el-option :label="$t('assignmentRules.methodDirect')" value="DIRECT" />
              <el-option :label="$t('assignmentRules.methodRoundRobin')" value="ROUND_ROBIN" />
              <el-option :label="$t('assignmentRules.methodWeighted')" value="WEIGHTED" />
              <el-option :label="$t('assignmentRules.methodLeastLoaded')" value="LEAST_LOADED" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showRuleDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveRule">{{ $t('assignmentRules.saveRule') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

const rules = ref<
  {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    type: string;
    matchType: string;
    conditions: { field: string; operator: string; value: string }[];
    assignTo: string;
    assignMethod: string;
    triggerCount: number;
  }[]
>([]);

const assignmentRules = computed(() => rules.value.filter(r => r.type === 'ASSIGNMENT'));

const escalationRules = ref<
  {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    entity: string;
    trigger: string;
    triggerCount: number;
    levels: { delay: string; notifyTo: string; email: boolean; sms: boolean; slack: boolean }[];
  }[]
>([]);

const roundRobinPools = ref<
  {
    id: number;
    name: string;
    entity: string;
    method: string;
    isActive: boolean;
    totalAssigned: number;
    nextAssignee: string;
    maxLoad: number;
    members: { name: string; assigned: number; weight: number | undefined }[];
  }[]
>([]);

const totalAssignments = computed(() => rules.value.reduce((s, r) => s + r.triggerCount, 0));
const escalationsTriggered = computed(() => escalationRules.value.reduce((s, e) => s + e.triggerCount, 0));

const editRule = (rule: unknown) => ElMessage.info(t('assignmentRules.editingRule', { name: rule.name }));
const deleteRule = (rule: unknown) => {
  rules.value = rules.value.filter(r => r.id !== rule.id);
  ElMessage.success(t('common.deleted'));
};

const saveRule = () => {
  if (!newRule.value.name) {
    ElMessage.warning(t('common.fillRequired'));
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
  ElMessage.success(t('assignmentRules.ruleCreated'));
};
</script>
