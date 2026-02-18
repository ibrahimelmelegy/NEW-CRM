<template lang="pug">
.sla-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('sla.title') }}
    p(style="color: var(--text-muted)") {{ $t('sla.subtitle') }}

  .max-w-5xl
    //- Loading
    .flex.items-center.justify-center.py-20(v-if="loading")
      el-spinner(size="large")

    template(v-else)
      //- Tabs: Policies & Metrics
      el-tabs(v-model="activeTab")
        //- Policies Tab
        el-tab-pane(:label="$t('sla.policies')" name="policies")
          .flex.items-center.justify-between.mb-6
            .flex.items-center.gap-3
              el-button(type="primary" @click="openPolicyDialog()" class="!rounded-xl")
                Icon.mr-1(name="ph:plus-bold" size="16")
                | {{ $t('sla.newPolicy') }}
              el-button(@click="handleCheckBreaches" :loading="checkingBreaches" class="!rounded-xl")
                Icon.mr-1(name="ph:warning-circle-bold" size="16")
                | {{ $t('sla.checkBreaches') }}

          //- Policies List
          .space-y-4(v-if="policies.length")
            .glass-card.p-5(v-for="policy in policies" :key="policy.id")
              .flex.items-center.justify-between
                .flex.items-center.gap-4
                  .icon-box(:style="{ background: policy.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(161, 161, 170, 0.1)' }")
                    Icon(name="ph:clock-countdown-bold" size="24" :style="{ color: policy.isActive ? '#22c55e' : '#a1a1aa' }")
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ policy.name }}
                    .flex.items-center.gap-3.mt-1
                      el-tag(size="small" type="info") {{ policy.entityType }}
                      .flex.items-center.gap-1
                        Icon(name="ph:clock-bold" size="12" style="color: var(--text-muted)")
                        span.text-xs(style="color: var(--text-muted)") {{ formatTime(policy.responseTimeMinutes) }} {{ $t('sla.responseTime') }}
                      .flex.items-center.gap-1
                        Icon(name="ph:check-circle-bold" size="12" style="color: var(--text-muted)")
                        span.text-xs(style="color: var(--text-muted)") {{ formatTime(policy.resolutionTimeMinutes) }} {{ $t('sla.resolutionTime') }}
                      el-tag(v-if="policy.businessHoursOnly" size="small" effect="plain") {{ $t('sla.businessHoursOnly') }}

                .flex.items-center.gap-3
                  el-switch(v-model="policy.isActive" @change="handleTogglePolicy(policy)" active-color="#22c55e")
                  el-button(size="small" @click="openPolicyDialog(policy)" class="!rounded-lg")
                    Icon(name="ph:pencil-bold" size="14")
                  el-button(size="small" type="danger" plain @click="handleDeletePolicy(policy)" class="!rounded-lg")
                    Icon(name="ph:trash-bold" size="14")

              //- Escalation Rules Preview
              .mt-4.pt-4(v-if="policy.escalationRules?.length" style="border-top: 1px solid var(--border-glass, rgba(255,255,255,0.08))")
                p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sla.escalationRules') }}
                .flex.flex-wrap.gap-2
                  el-tag(v-for="(rule, i) in policy.escalationRules" :key="i" size="small" effect="plain")
                    | Level {{ rule.level }}: after {{ formatTime(rule.afterMinutes) }}

          //- Empty State
          .text-center.py-12(v-else)
            Icon(name="ph:clock-countdown-bold" size="48" style="color: var(--text-muted)")
            p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('sla.noPolicies') }}

        //- Metrics Tab
        el-tab-pane(:label="$t('sla.metrics')" name="metrics")
          .flex.items-center.gap-3.mb-6
            el-select(v-model="metricsEntityType" @change="loadMetrics" style="width: 160px")
              el-option(label="Lead" value="lead")
              el-option(label="Deal" value="deal")
              el-option(label="Client" value="client")

          //- Metrics Cards
          template(v-if="metrics")
            .grid.gap-4.mb-6(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
              .glass-card.p-5.text-center
                p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sla.metricsTab.onTimeRate') }}
                p.text-3xl.font-bold(:style="{ color: metrics.onTimeRate >= 90 ? '#22c55e' : metrics.onTimeRate >= 70 ? '#f59e0b' : '#ef4444' }") {{ metrics.onTimeRate }}%

              .glass-card.p-5.text-center
                p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sla.metricsTab.breachedCount') }}
                p.text-3xl.font-bold(style="color: #ef4444") {{ metrics.breachedCount }}

              .glass-card.p-5.text-center
                p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sla.metricsTab.avgResponseTime') }}
                p.text-3xl.font-bold(style="color: #3b82f6") {{ formatTime(metrics.avgResponseTime) }}

              .glass-card.p-5.text-center
                p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sla.metricsTab.avgResolutionTime') }}
                p.text-3xl.font-bold(style="color: #7849ff") {{ formatTime(metrics.avgResolutionTime) }}

          .text-center.py-12(v-else)
            Icon(name="ph:chart-bar-bold" size="48" style="color: var(--text-muted)")
            p.text-sm.mt-3(style="color: var(--text-muted)") Select an entity type to view metrics

  //- Policy Dialog
  el-dialog(v-model="policyDialogVisible" :title="editingPolicy ? $t('sla.editPolicy') : $t('sla.newPolicy')" width="700px")
    el-form(:model="policyForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('sla.policyName')" required)
          el-input(v-model="policyForm.name" :placeholder="$t('sla.policyNamePlaceholder')")
        el-form-item(:label="$t('sla.entityType')")
          el-select(v-model="policyForm.entityType" style="width: 100%")
            el-option(label="Lead" value="lead")
            el-option(label="Deal" value="deal")
            el-option(label="Client" value="client")
            el-option(label="Opportunity" value="opportunity")

      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('sla.responseTime') + ' (' + $t('sla.minutes') + ')'")
          el-input-number(v-model="policyForm.responseTimeMinutes" :min="1" style="width: 100%")
        el-form-item(:label="$t('sla.resolutionTime') + ' (' + $t('sla.minutes') + ')'")
          el-input-number(v-model="policyForm.resolutionTimeMinutes" :min="1" style="width: 100%")

      el-form-item
        el-checkbox(v-model="policyForm.businessHoursOnly") {{ $t('sla.businessHoursOnly') }}

      //- Escalation Rules
      .mb-4
        .flex.items-center.justify-between.mb-3
          h4.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('sla.escalationRules') }}
          el-button(size="small" @click="addEscalationRule" class="!rounded-lg")
            Icon.mr-1(name="ph:plus-bold" size="14")
            | {{ $t('common.add') }}

        .space-y-3
          .flex.items-center.gap-2(v-for="(rule, index) in policyForm.escalationRules" :key="index")
            span.text-xs.font-semibold(style="color: var(--text-muted); min-width: 50px") Level {{ rule.level }}
            el-input-number(v-model="rule.afterMinutes" :min="1" placeholder="After minutes" style="width: 140px")
            span.text-xs(style="color: var(--text-muted)") {{ $t('sla.minutes') }}
            el-button(size="small" type="danger" plain @click="policyForm.escalationRules.splice(index, 1)" class="!rounded-lg")
              Icon(name="ph:x-bold" size="14")

    template(#footer)
      el-button(@click="policyDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSavePolicy" :loading="saving") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';
import {
  fetchSLAPolicies,
  createSLAPolicy,
  updateSLAPolicy,
  deleteSLAPolicy,
  getSLAMetrics,
  checkBreaches
} from '~/composables/useSLA';
import type { SLAPolicy, SLAMetrics, EscalationRule } from '~/composables/useSLA';

definePageMeta({ title: 'SLA Management' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const saving = ref(false);
const checkingBreaches = ref(false);
const activeTab = ref('policies');
const policyDialogVisible = ref(false);
const editingPolicy = ref<SLAPolicy | null>(null);
const metricsEntityType = ref('lead');

const policies = ref<SLAPolicy[]>([]);
const metrics = ref<SLAMetrics | null>(null);

const policyForm = reactive({
  name: '',
  entityType: 'lead',
  responseTimeMinutes: 60,
  resolutionTimeMinutes: 480,
  businessHoursOnly: false,
  escalationRules: [] as EscalationRule[]
});

// Load data
try {
  const response = await fetchSLAPolicies();
  policies.value = response.docs;
} catch (e) {
  console.error('Failed to load SLA policies', e);
} finally {
  loading.value = false;
}

function formatTime(minutes: number): string {
  if (!minutes && minutes !== 0) return '-';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function openPolicyDialog(policy?: SLAPolicy) {
  if (policy) {
    editingPolicy.value = policy;
    policyForm.name = policy.name;
    policyForm.entityType = policy.entityType;
    policyForm.responseTimeMinutes = policy.responseTimeMinutes;
    policyForm.resolutionTimeMinutes = policy.resolutionTimeMinutes;
    policyForm.businessHoursOnly = policy.businessHoursOnly;
    policyForm.escalationRules = [...(policy.escalationRules || []).map(r => ({ ...r }))];
  } else {
    editingPolicy.value = null;
    policyForm.name = '';
    policyForm.entityType = 'lead';
    policyForm.responseTimeMinutes = 60;
    policyForm.resolutionTimeMinutes = 480;
    policyForm.businessHoursOnly = false;
    policyForm.escalationRules = [];
  }
  policyDialogVisible.value = true;
}

function addEscalationRule() {
  const level = policyForm.escalationRules.length + 1;
  policyForm.escalationRules.push({ level, afterMinutes: level * 30 });
}

async function handleSavePolicy() {
  if (!policyForm.name.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: policyForm.name,
      entityType: policyForm.entityType,
      responseTimeMinutes: policyForm.responseTimeMinutes,
      resolutionTimeMinutes: policyForm.resolutionTimeMinutes,
      businessHoursOnly: policyForm.businessHoursOnly,
      escalationRules: policyForm.escalationRules
    };

    if (editingPolicy.value) {
      await updateSLAPolicy(editingPolicy.value.id, payload);
    } else {
      await createSLAPolicy(payload);
    }

    const response = await fetchSLAPolicies();
    policies.value = response.docs;
    policyDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('sla.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleTogglePolicy(policy: SLAPolicy) {
  try {
    await updateSLAPolicy(policy.id, { isActive: policy.isActive });
  } catch {
    policy.isActive = !policy.isActive;
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

async function handleDeletePolicy(policy: SLAPolicy) {
  try {
    await ElMessageBox.confirm(t('sla.confirmDelete'), t('common.warning'), { type: 'warning' });
    await deleteSLAPolicy(policy.id);
    const response = await fetchSLAPolicies();
    policies.value = response.docs;
    ElNotification({ type: 'success', title: t('common.success'), message: t('sla.deleted') });
  } catch {}
}

async function handleCheckBreaches() {
  checkingBreaches.value = true;
  try {
    await checkBreaches();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    checkingBreaches.value = false;
  }
}

async function loadMetrics() {
  metrics.value = await getSLAMetrics(metricsEntityType.value);
}
</script>

<style lang="scss" scoped>
.sla-page {
  animation: fadeIn 0.5s ease-out;
}

.icon-box {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
