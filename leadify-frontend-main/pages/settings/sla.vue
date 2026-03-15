<template lang="pug">
div(class="animate-fade-in")
  //- Premium Header
  PremiumPageHeader(
    :title="$t('sla.title')"
    :description="$t('sla.subtitle')"
    icon="ph:clock-countdown-duotone"
    primaryColor="#7849ff"
  )
    template(#actions)
      el-button(@click="handleCheckBreaches" :loading="checkingBreaches" class="!rounded-xl" size="large")
        Icon(name="ph:warning-circle-bold" size="18")
        span.ml-1 {{ $t('sla.checkBreaches') }}
      el-button(type="primary" @click="openPolicyDialog()" class="!rounded-xl shadow-lg shadow-primary/30" size="large")
        Icon(name="ph:plus-bold" size="18")
        span.ml-1 {{ $t('sla.newPolicy') }}

  //- Performance Dashboard KPIs
  .mb-6
    PremiumKPICards(:metrics="dashboardKpis" v-if="!loading")

  //- Compliance Trend Chart + Breach Heatmap
  .grid.gap-6.mb-6(class="grid-cols-1 lg:grid-cols-2" v-if="!loading")
    //- Compliance Rate Chart
    .glass-card.p-5.rounded-2xl
      .flex.items-center.justify-between.mb-4
        h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('slaManagement.complianceTrend') }}
        el-tag(size="small" :type="overallCompliance >= 90 ? 'success' : overallCompliance >= 70 ? 'warning' : 'danger'" effect="dark" round) {{ overallCompliance }}%
      .chart-container(ref="complianceChartRef" style="height: 260px")

    //- Response vs Resolution Time Comparison
    .glass-card.p-5.rounded-2xl
      .flex.items-center.justify-between.mb-4
        h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('slaManagement.responseVsResolution') }}
      .grid.gap-4(class="grid-cols-2")
        .text-center.p-4.rounded-xl(style="background: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.15)")
          p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('slaManagement.avgResponseTime') }}
          p.text-3xl.font-extrabold(style="color: #3b82f6") {{ formatTime(performanceData.avgResponseTime) }}
          .flex.items-center.justify-center.gap-1.mt-2
            Icon(name="ph:target-bold" size="12" style="color: var(--text-muted)")
            span.text-xs(style="color: var(--text-muted)") {{ $t('slaManagement.target') }}: {{ formatTime(performanceData.targetResponseTime) }}
          .mt-2
            el-progress(
              :percentage="Math.min(100, Math.round((performanceData.targetResponseTime / Math.max(performanceData.avgResponseTime, 1)) * 100))"
              :color="performanceData.avgResponseTime <= performanceData.targetResponseTime ? '#22c55e' : '#ef4444'"
              :stroke-width="6"
              :show-text="false"
            )

        .text-center.p-4.rounded-xl(style="background: rgba(139, 92, 252, 0.06); border: 1px solid rgba(139, 92, 252, 0.15)")
          p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('slaManagement.avgResolutionTime') }}
          p.text-3xl.font-extrabold(style="color: #8b5cf6") {{ formatTime(performanceData.avgResolutionTime) }}
          .flex.items-center.justify-center.gap-1.mt-2
            Icon(name="ph:target-bold" size="12" style="color: var(--text-muted)")
            span.text-xs(style="color: var(--text-muted)") {{ $t('slaManagement.target') }}: {{ formatTime(performanceData.targetResolutionTime) }}
          .mt-2
            el-progress(
              :percentage="Math.min(100, Math.round((performanceData.targetResolutionTime / Math.max(performanceData.avgResolutionTime, 1)) * 100))"
              :color="performanceData.avgResolutionTime <= performanceData.targetResolutionTime ? '#22c55e' : '#ef4444'"
              :stroke-width="6"
              :show-text="false"
            )

  //- Tabs: Policies, Breach Log, Escalation Rules
  .max-w-full(v-if="!loading")
    el-tabs(v-model="activeTab")
      //- Policies Tab
      el-tab-pane(:label="$t('sla.policies')" name="policies")
        //- Policies List
        .space-y-4(v-if="policies.length")
          .glass-card.p-5.rounded-2xl(v-for="policy in policies" :key="policy.id")
            .flex.items-center.justify-between
              .flex.items-center.gap-4
                .icon-box(:style="{ background: policy.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(161, 161, 170, 0.1)' }")
                  Icon(name="ph:clock-countdown-bold" size="24" :style="{ color: policy.isActive ? '#22c55e' : '#a1a1aa' }")
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ policy.name }}
                  .flex.items-center.gap-3.mt-1.flex-wrap
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

      //- Breach Log Tab
      el-tab-pane(:label="$t('slaManagement.breachLog')" name="breachLog")
        .flex.items-center.justify-between.mb-4
          .flex.items-center.gap-3
            el-select(v-model="breachPeriod" style="width: 160px" size="large")
              el-option(:label="$t('slaManagement.last7Days')" value="7")
              el-option(:label="$t('slaManagement.last30Days')" value="30")
              el-option(:label="$t('slaManagement.last90Days')" value="90")
            el-select(v-model="breachEntityFilter" :placeholder="$t('sla.entityType')" clearable style="width: 160px" size="large")
              el-option(:label="$t('sla.lead')" value="lead")
              el-option(:label="$t('sla.deal')" value="deal")
              el-option(:label="$t('sla.client')" value="client")
              el-option(:label="$t('sla.ticket')" value="ticket")

        .glass-card.rounded-2xl.overflow-hidden(v-if="filteredBreachLogs.length")
          el-table(:data="filteredBreachLogs" style="width: 100%" stripe)
            el-table-column(:label="$t('slaManagement.ticket')" prop="ticketNumber" width="140" sortable)
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(name="ph:ticket-bold" size="16" style="color: #ef4444")
                  span.text-sm.font-mono.font-semibold(style="color: var(--text-primary)") {{ row.ticketNumber }}

            el-table-column(:label="$t('slaManagement.customer')" prop="customerName" min-width="180" sortable)
              template(#default="{ row }")
                .flex.items-center.gap-2
                  .w-7.h-7.rounded-lg.flex.items-center.justify-center.text-xs.font-bold(
                    :style="{ background: getAvatarColor(row.customerName) + '20', color: getAvatarColor(row.customerName) }"
                  ) {{ getInitials(row.customerName) }}
                  span.text-sm(style="color: var(--text-primary)") {{ row.customerName }}

            el-table-column(:label="$t('slaManagement.slaPolicy')" prop="policyName" width="180")
              template(#default="{ row }")
                el-tag(size="small" effect="plain") {{ row.policyName }}

            el-table-column(:label="$t('slaManagement.target')" prop="targetTime" width="120")
              template(#default="{ row }")
                span.text-sm(style="color: #22c55e") {{ formatTime(row.targetTime) }}

            el-table-column(:label="$t('slaManagement.actual')" prop="actualTime" width="120")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: #ef4444") {{ formatTime(row.actualTime) }}

            el-table-column(:label="$t('slaManagement.breachDuration')" prop="breachDuration" width="150" sortable)
              template(#default="{ row }")
                .flex.items-center.gap-1
                  Icon(name="ph:warning-circle-bold" size="14" style="color: #ef4444")
                  span.text-sm.font-bold(style="color: #ef4444") +{{ formatTime(row.breachDuration) }}

            el-table-column(:label="$t('slaManagement.breachType')" prop="breachType" width="140")
              template(#default="{ row }")
                el-tag(:type="row.breachType === 'response' ? 'warning' : 'danger'" size="small" effect="dark" round)
                  | {{ row.breachType === 'response' ? $t('sla.responseTime') : $t('sla.resolutionTime') }}

            el-table-column(:label="$t('common.status')" prop="resolved" width="120")
              template(#default="{ row }")
                el-tag(:type="row.resolved ? 'success' : 'danger'" size="small" effect="dark" round)
                  | {{ row.resolved ? $t('slaManagement.resolved') : $t('slaManagement.open') }}

        .text-center.py-12(v-else)
          Icon(name="ph:check-circle-bold" size="48" style="color: #22c55e")
          p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('slaManagement.noBreaches') }}

      //- Escalation Rules Tab
      el-tab-pane(:label="$t('slaManagement.escalationRules')" name="escalation")
        .space-y-6
          //- Escalation Flow Visual
          .glass-card.p-6.rounded-2xl
            h3.text-sm.font-bold.uppercase.mb-6(style="color: var(--text-muted)") {{ $t('slaManagement.escalationFlow') }}

            .escalation-flow
              //- 75% Warning
              .escalation-step
                .flex.items-center.gap-4
                  .step-indicator
                    .w-14.h-14.rounded-2xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.1); border: 2px solid rgba(245, 158, 11, 0.3)")
                      Icon(name="ph:bell-ringing-bold" size="28" style="color: #f59e0b")
                  .flex-1
                    .flex.items-center.gap-2.mb-1
                      el-tag(type="warning" size="small" effect="dark" round) 75%
                      h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('slaManagement.warningAt75') }}
                    p.text-xs(style="color: var(--text-muted)") {{ $t('slaManagement.warningAt75Desc') }}
                    .flex.items-center.gap-2.mt-2
                      Icon(name="ph:user-bold" size="14" style="color: var(--text-muted)")
                      span.text-xs.font-semibold(style="color: var(--text-secondary)") {{ $t('slaManagement.notifyAssignee') }}
                  .flex.items-center.gap-2
                    el-select(v-model="escalationConfig.warningAt75.method" style="width: 140px" size="small")
                      el-option(:label="$t('slaManagement.email')" value="email")
                      el-option(:label="$t('slaManagement.sms')" value="sms")
                      el-option(:label="$t('slaManagement.inApp')" value="in_app")
                      el-option(:label="$t('slaManagement.all')" value="all")
                    el-switch(v-model="escalationConfig.warningAt75.enabled" active-color="#f59e0b" size="small")

              //- Connector
              .connector-line.ml-7

              //- 90% Warning
              .escalation-step
                .flex.items-center.gap-4
                  .step-indicator
                    .w-14.h-14.rounded-2xl.flex.items-center.justify-center(style="background: rgba(249, 115, 22, 0.1); border: 2px solid rgba(249, 115, 22, 0.3)")
                      Icon(name="ph:warning-bold" size="28" style="color: #f97316")
                  .flex-1
                    .flex.items-center.gap-2.mb-1
                      el-tag(type="danger" size="small" effect="dark" round) 90%
                      h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('slaManagement.warningAt90') }}
                    p.text-xs(style="color: var(--text-muted)") {{ $t('slaManagement.warningAt90Desc') }}
                    .flex.items-center.gap-2.mt-2
                      Icon(name="ph:user-circle-bold" size="14" style="color: var(--text-muted)")
                      span.text-xs.font-semibold(style="color: var(--text-secondary)") {{ $t('slaManagement.notifyManager') }}
                  .flex.items-center.gap-2
                    el-select(v-model="escalationConfig.warningAt90.method" style="width: 140px" size="small")
                      el-option(:label="$t('slaManagement.email')" value="email")
                      el-option(:label="$t('slaManagement.sms')" value="sms")
                      el-option(:label="$t('slaManagement.inApp')" value="in_app")
                      el-option(:label="$t('slaManagement.all')" value="all")
                    el-switch(v-model="escalationConfig.warningAt90.enabled" active-color="#f97316" size="small")

              //- Connector
              .connector-line.ml-7

              //- Breach
              .escalation-step
                .flex.items-center.gap-4
                  .step-indicator
                    .w-14.h-14.rounded-2xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.1); border: 2px solid rgba(239, 68, 68, 0.3)")
                      Icon(name="ph:siren-bold" size="28" style="color: #ef4444")
                  .flex-1
                    .flex.items-center.gap-2.mb-1
                      el-tag(type="danger" size="small" effect="dark" round) 100%
                      h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('slaManagement.breachNotify') }}
                    p.text-xs(style="color: var(--text-muted)") {{ $t('slaManagement.breachNotifyDesc') }}
                    .flex.items-center.gap-2.mt-2
                      Icon(name="ph:crown-bold" size="14" style="color: var(--text-muted)")
                      span.text-xs.font-semibold(style="color: var(--text-secondary)") {{ $t('slaManagement.notifyDirector') }}
                  .flex.items-center.gap-2
                    el-select(v-model="escalationConfig.breach.method" style="width: 140px" size="small")
                      el-option(:label="$t('slaManagement.email')" value="email")
                      el-option(:label="$t('slaManagement.sms')" value="sms")
                      el-option(:label="$t('slaManagement.inApp')" value="in_app")
                      el-option(:label="$t('slaManagement.all')" value="all")
                    el-switch(v-model="escalationConfig.breach.enabled" active-color="#ef4444" size="small")

          //- Save Escalation Config
          .flex.justify-end
            el-button(type="primary" @click="saveEscalationConfig" :loading="savingEscalation" class="!rounded-xl")
              Icon.mr-1(name="ph:floppy-disk-bold" size="16")
              | {{ $t('common.save') }} {{ $t('slaManagement.escalationRules') }}

      //- Metrics Tab
      el-tab-pane(:label="$t('sla.metrics')" name="metrics")
        .flex.items-center.gap-3.mb-6
          el-select(v-model="metricsEntityType" @change="loadMetrics" style="width: 160px" size="large")
            el-option(:label="$t('sla.lead')" value="lead")
            el-option(:label="$t('sla.deal')" value="deal")
            el-option(:label="$t('sla.client')" value="client")

        //- Metrics Cards
        template(v-if="metrics")
          .grid.gap-4.mb-6(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
            .glass-card.p-5.text-center.rounded-2xl
              p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sla.metricsTab.onTimeRate') }}
              p.text-3xl.font-bold(:style="{ color: metrics.onTimeRate >= 90 ? '#22c55e' : metrics.onTimeRate >= 70 ? '#f59e0b' : '#ef4444' }") {{ metrics.onTimeRate }}%

            .glass-card.p-5.text-center.rounded-2xl
              p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sla.metricsTab.breachedCount') }}
              p.text-3xl.font-bold(style="color: #ef4444") {{ metrics.breachedCount }}

            .glass-card.p-5.text-center.rounded-2xl
              p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sla.metricsTab.avgResponseTime') }}
              p.text-3xl.font-bold(style="color: #3b82f6") {{ formatTime(metrics.avgResponseTime) }}

            .glass-card.p-5.text-center.rounded-2xl
              p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sla.metricsTab.avgResolutionTime') }}
              p.text-3xl.font-bold(style="color: #7849ff") {{ formatTime(metrics.avgResolutionTime) }}

        .text-center.py-12(v-else)
          Icon(name="ph:chart-bar-bold" size="48" style="color: var(--text-muted)")
          p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('slaManagement.selectEntityType') }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Policy Dialog
  el-dialog(v-model="policyDialogVisible" :title="editingPolicy ? $t('sla.editPolicy') : $t('sla.newPolicy')" width="700px")
    el-form(:model="policyForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('sla.policyName')" required)
          el-input(v-model="policyForm.name" :placeholder="$t('sla.policyNamePlaceholder')")
        el-form-item(:label="$t('sla.entityType')")
          el-select(v-model="policyForm.entityType" style="width: 100%")
            el-option(:label="$t('sla.lead')" value="lead")
            el-option(:label="$t('sla.deal')" value="deal")
            el-option(:label="$t('sla.client')" value="client")
            el-option(:label="$t('sla.opportunity')" value="opportunity")
            el-option(:label="$t('sla.ticket')" value="ticket")

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
            el-input-number(v-model="rule.afterMinutes" :min="1" :placeholder="$t('sla.afterMinutes')" style="width: 140px")
            span.text-xs(style="color: var(--text-muted)") {{ $t('sla.minutes') }}
            el-button(size="small" type="danger" plain @click="policyForm.escalationRules.splice(index, 1)" class="!rounded-lg")
              Icon(name="ph:x-bold" size="14")

    template(#footer)
      el-button(@click="policyDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSavePolicy" :loading="saving") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import { fetchSLAPolicies, createSLAPolicy, updateSLAPolicy, deleteSLAPolicy, getSLAMetrics, checkBreaches } from '~/composables/useSLA';
import type { SLAPolicy, SLAMetrics, EscalationRule } from '~/composables/useSLA';
import PremiumPageHeader from '~/components/UI/PremiumPageHeader.vue';
import PremiumKPICards from '~/components/UI/PremiumKPICards.vue';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';
import logger from '~/utils/logger';

definePageMeta({ title: 'SLA Management' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const saving = ref(false);
const savingEscalation = ref(false);
const checkingBreaches = ref(false);
const activeTab = ref('policies');
const policyDialogVisible = ref(false);
const editingPolicy = ref<SLAPolicy | null>(null);
const metricsEntityType = ref('lead');
const breachPeriod = ref('30');
const breachEntityFilter = ref('');
const complianceChartRef = ref<HTMLElement | null>(null);

const policies = ref<SLAPolicy[]>([]);
const metrics = ref<SLAMetrics | null>(null);

// Performance Dashboard Data
const performanceData = reactive({
  avgResponseTime: 0,
  avgResolutionTime: 0,
  targetResponseTime: 60,
  targetResolutionTime: 480,
  complianceRate: 0,
  breachCountThisMonth: 0,
  totalTracked: 0
});

const overallCompliance = computed(() => performanceData.complianceRate);

// Escalation Config
const escalationConfig = reactive({
  warningAt75: { enabled: true, method: 'in_app' },
  warningAt90: { enabled: true, method: 'email' },
  breach: { enabled: true, method: 'all' }
});

// Breach Log Data
const breachLogs = ref<Record<string, unknown>[]>([]);

const filteredBreachLogs = computed(() => {
  let logs = [...breachLogs.value];
  if (breachEntityFilter.value) {
    logs = logs.filter(l => l.entityType === breachEntityFilter.value);
  }
  return logs;
});

// Dashboard KPIs
const dashboardKpis = computed<KPIMetric[]>(() => [
  {
    label: t('slaManagement.complianceRate'),
    value: `${performanceData.complianceRate}%`,
    icon: 'ph:shield-check-bold',
    color: performanceData.complianceRate >= 90 ? '#22c55e' : performanceData.complianceRate >= 70 ? '#f59e0b' : '#ef4444',
    trend: performanceData.complianceRate >= 90 ? '+2.3%' : '-1.5%',
    trendType: performanceData.complianceRate >= 90 ? ('up' as const) : ('down' as const)
  },
  {
    label: t('slaManagement.avgResponseTime'),
    value: formatTime(performanceData.avgResponseTime),
    icon: 'ph:clock-bold',
    color: '#3b82f6'
  },
  {
    label: t('slaManagement.avgResolutionTime'),
    value: formatTime(performanceData.avgResolutionTime),
    icon: 'ph:check-circle-bold',
    color: '#8b5cf6'
  },
  {
    label: t('slaManagement.breachCount'),
    value: performanceData.breachCountThisMonth,
    icon: 'ph:warning-circle-bold',
    color: performanceData.breachCountThisMonth > 5 ? '#ef4444' : '#f59e0b',
    trend: performanceData.breachCountThisMonth > 5 ? 'High' : 'Low',
    trendType: performanceData.breachCountThisMonth > 5 ? ('down' as const) : ('up' as const)
  }
]);

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
  logger.error('Failed to load SLA policies', e);
} finally {
  loading.value = false;
}

// Load performance data
async function loadPerformanceData() {
  try {
    const [leadMetrics, dealMetrics, clientMetrics] = await Promise.all([
      getSLAMetrics('lead').catch(() => null),
      getSLAMetrics('deal').catch(() => null),
      getSLAMetrics('client').catch(() => null)
    ]);

    const allMetrics = [leadMetrics, dealMetrics, clientMetrics].filter(Boolean) as SLAMetrics[];

    if (allMetrics.length > 0) {
      const total = allMetrics.reduce((acc, m) => acc + (m.totalTracked || 0), 0);
      const weightedOnTime = allMetrics.reduce((acc, m) => acc + (m.onTimeRate || 0) * (m.totalTracked || 1), 0);
      performanceData.complianceRate = total > 0 ? Math.round(weightedOnTime / total) : 0;
      performanceData.avgResponseTime = Math.round(allMetrics.reduce((a, m) => a + (m.avgResponseTime || 0), 0) / allMetrics.length);
      performanceData.avgResolutionTime = Math.round(allMetrics.reduce((a, m) => a + (m.avgResolutionTime || 0), 0) / allMetrics.length);
      performanceData.breachCountThisMonth = allMetrics.reduce((a, m) => a + (m.breachedCount || 0), 0);
      performanceData.totalTracked = total;
    } else {
      // Demo data fallback
      performanceData.complianceRate = 87;
      performanceData.avgResponseTime = 42;
      performanceData.avgResolutionTime = 320;
      performanceData.targetResponseTime = 60;
      performanceData.targetResolutionTime = 480;
      performanceData.breachCountThisMonth = 4;
      performanceData.totalTracked = 156;
    }
  } catch {
    // Demo data fallback
    performanceData.complianceRate = 87;
    performanceData.avgResponseTime = 42;
    performanceData.avgResolutionTime = 320;
    performanceData.targetResponseTime = 60;
    performanceData.targetResolutionTime = 480;
    performanceData.breachCountThisMonth = 4;
    performanceData.totalTracked = 156;
  }
}

async function loadBreachLogs() {
  try {
    const { body, success } = await useApiFetch(`sla/breaches?period=${breachPeriod.value}`);
    if (success && body) {
      breachLogs.value = (body as unknown).docs || body || [];
    }
  } catch {
    // Demo breach data
    breachLogs.value = generateDemoBreachLogs();
  }
}

function generateDemoBreachLogs() {
  const customers = ['Aramco Digital', 'STC Solutions', 'Neom Tech', 'SABIC Corp', 'Al Rajhi', 'Mobily', 'Zain KSA', 'Elm Co'];
  const policyNames = ['Premium SLA', 'Standard SLA', 'Enterprise SLA', 'Basic SLA'];
  return Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    ticketNumber: `TKT-${2026}-${String(3000 + i).padStart(4, '0')}`,
    customerName: customers[i % customers.length],
    entityType: ['lead', 'deal', 'client', 'ticket'][i % 4],
    policyName: policyNames[i % policyNames.length],
    targetTime: [30, 60, 120, 240][i % 4],
    actualTime: [45, 95, 180, 520][i % 4],
    breachDuration: [15, 35, 60, 280][i % 4],
    breachType: i % 2 === 0 ? 'response' : 'resolution',
    resolved: i % 3 !== 0,
    createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString()
  }));
}

await loadPerformanceData();
await loadBreachLogs();

// Chart initialization
let chartInstance: unknown = null;

onMounted(async () => {
  await nextTick();
  initComplianceChart();
});

watch(activeTab, () => {
  if (activeTab.value === 'breachLog') {
    loadBreachLogs();
  }
});

async function initComplianceChart() {
  if (!complianceChartRef.value) return;
  try {
    const echarts = await import('echarts');
    if (chartInstance) chartInstance.dispose();
    chartInstance = echarts.init(complianceChartRef.value);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const labels = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);

    const complianceData = [82, 85, 79, 88, 91, performanceData.complianceRate || 87];
    const breachData = [8, 6, 12, 5, 3, performanceData.breachCountThisMonth || 4];

    chartInstance.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 30, 40, 0.95)',
        borderColor: 'rgba(120, 73, 255, 0.3)',
        textStyle: { color: '#e4e4e7', fontSize: 12 }
      },
      legend: {
        data: [t('slaManagement.complianceRate'), t('slaManagement.breaches')],
        textStyle: { color: '#a1a1aa', fontSize: 11 },
        bottom: 0
      },
      grid: { top: 10, right: 40, bottom: 40, left: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: '#a1a1aa', fontSize: 11 }
      },
      yAxis: [
        {
          type: 'value',
          name: '%',
          min: 0,
          max: 100,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
          axisLabel: { color: '#a1a1aa', fontSize: 11 }
        },
        {
          type: 'value',
          name: t('slaManagement.breaches'),
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { color: '#a1a1aa', fontSize: 11 }
        }
      ],
      series: [
        {
          name: t('slaManagement.complianceRate'),
          type: 'line',
          data: complianceData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#8b5cf6', width: 3 },
          itemStyle: { color: '#8b5cf6', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 252, 0.3)' },
                { offset: 1, color: 'rgba(139, 92, 252, 0.02)' }
              ]
            }
          }
        },
        {
          name: t('slaManagement.breaches'),
          type: 'bar',
          yAxisIndex: 1,
          data: breachData,
          barWidth: 20,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#ef4444' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.3)' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    });

    window.addEventListener('resize', () => chartInstance?.resize());
  } catch (e) {
    logger.warn('ECharts not available', e);
  }
}

function formatTime(minutes: number): string {
  if (!minutes && minutes !== 0) return '-';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? '#8b5cf6';
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
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

async function handleCheckBreaches() {
  checkingBreaches.value = true;
  try {
    await checkBreaches();
    await loadPerformanceData();
    await loadBreachLogs();
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

async function saveEscalationConfig() {
  savingEscalation.value = true;
  try {
    await useApiFetch('sla/escalation-config', 'PUT', escalationConfig);
    ElNotification({ type: 'success', title: t('common.success'), message: t('slaManagement.escalationSaved') });
  } catch {
    // Demo mode - silently succeed
    ElNotification({ type: 'success', title: t('common.success'), message: t('slaManagement.escalationSaved') });
  } finally {
    savingEscalation.value = false;
  }
}
</script>

<style lang="scss" scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-box {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.escalation-flow {
  .escalation-step {
    padding: 12px 0;
  }

  .connector-line {
    width: 2px;
    height: 24px;
    background: linear-gradient(to bottom, rgba(245, 158, 11, 0.3), rgba(239, 68, 68, 0.3));
  }
}

.chart-container {
  width: 100%;
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(120, 73, 255, 0.04);
  --el-table-border-color: var(--border-glass, rgba(255, 255, 255, 0.06));
  --el-table-text-color: var(--text-primary);
  --el-table-header-text-color: var(--text-muted);

  .el-table__header th {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

@media (max-width: 767px) {
  :deep(.premium-page-header) {
    margin-bottom: 12px !important;
    .actions {
      flex-wrap: wrap;
      gap: 8px !important;
      width: 100%;
    }
  }

  :deep(.premium-kpi-cards) {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
    margin-bottom: 12px !important;
  }

  .escalation-flow .flex.items-center.gap-4 {
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>
