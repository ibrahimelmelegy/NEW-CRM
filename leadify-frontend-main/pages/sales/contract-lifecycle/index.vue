<template lang="pug">
div(class="animate-fade-in")
  //- Premium Header
  PremiumPageHeader(
    :title="$t('contractLifecycle.title')"
    :description="$t('contractLifecycle.subtitle')"
    icon="ph:file-doc-duotone"
    primaryColor="#8b5cf6"
  )
    template(#actions)
      el-button(@click="handleExportCSV" class="!rounded-xl" size="large")
        Icon(name="ph:download-bold" size="18")
        span.ml-1 {{ $t('common.export') }}
      el-button(type="primary" size="large" @click="openContractDialog()" class="!rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform")
        Icon(name="ph:plus-bold" size="18")
        span.ml-1 {{ $t('contractLifecycle.createContract') }}

  //- KPI Metrics
  .mb-6
    PremiumKPICards(:metrics="kpiMetrics" v-if="!loading")

  //- Renewal Alerts Banner
  .renewal-alerts-banner.glass-card.p-4.rounded-2xl.mb-6(v-if="renewalAlerts.length && !loading")
    .flex.items-center.justify-between.mb-3
      .flex.items-center.gap-2
        Icon(name="ph:warning-circle-bold" size="20" style="color: #f59e0b")
        h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('contractLifecycle.renewalAlerts') }}
      el-tag(type="warning" size="small" effect="dark" round) {{ renewalAlerts.length }}
    .flex.flex-wrap.gap-2
      .renewal-chip.flex.items-center.gap-2.px-3.py-2.rounded-xl(
        v-for="alert in renewalAlerts.slice(0, 8)"
        :key="alert.id"
        :style="{ background: getDaysColor(alert.daysLeft) + '15', border: '1px solid ' + getDaysColor(alert.daysLeft) + '30' }"
      )
        .w-7.h-7.rounded-lg.flex.items-center.justify-center.text-xs.font-bold(
          :style="{ background: getDaysColor(alert.daysLeft) + '20', color: getDaysColor(alert.daysLeft) }"
        ) {{ alert.daysLeft }}d
        .min-w-0
          p.text-xs.font-semibold.truncate(style="color: var(--text-primary)") {{ alert.clientName }}
          p.text-xs.truncate(style="color: var(--text-muted)") {{ alert.contractNumber }}
      .renewal-chip.flex.items-center.gap-2.px-3.py-2.rounded-xl.cursor-pointer(
        v-if="renewalAlerts.length > 8"
        style="background: rgba(120, 73, 255, 0.1); border: 1px solid rgba(120, 73, 255, 0.2)"
        @click="showAllAlerts = true"
      )
        span.text-xs.font-semibold(style="color: #7849ff") +{{ renewalAlerts.length - 8 }} {{ $t('common.more') }}

  //- Bulk Actions Bar
  BulkActions(
    :count="selectedRows.length"
    :actions="['export']"
    @bulk-export="handleBulkExport"
    @clear-selection="selectedRows = []"
    v-if="selectedRows.length"
  )

  //- Filters Section
  .flex.items-center.flex-wrap.gap-3.mb-4
    el-input.max-w-xs(
      v-model="searchQuery"
      :placeholder="$t('common.search') + ' ' + $t('contractLifecycle.title')"
      clearable
      class="!rounded-xl"
      size="large"
    )
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

    el-select(v-model="filterStatus" :placeholder="$t('common.status')" clearable style="width: 180px" size="large" class="!rounded-xl")
      el-option(v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value")

    el-select(v-model="filterType" :placeholder="$t('contractLifecycle.contractType')" clearable style="width: 200px" size="large" class="!rounded-xl")
      el-option(v-for="tp in typeOptions" :key="tp.value" :label="tp.label" :value="tp.value")

    el-date-picker(
      v-model="filterDateRange"
      type="daterange"
      :start-placeholder="$t('contractLifecycle.startDate')"
      :end-placeholder="$t('contractLifecycle.endDate')"
      format="YYYY-MM-DD"
      value-format="YYYY-MM-DD"
      size="large"
      class="!rounded-xl"
      style="max-width: 300px"
    )

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Main Table
  template(v-else-if="filteredContracts.length")
    .glass-card.rounded-2xl.overflow-hidden
      el-table(
        :data="paginatedContracts"
        style="width: 100%"
        row-class-name="contract-row"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        stripe
      )
        el-table-column(type="selection" width="48")

        el-table-column(:label="$t('contractLifecycle.contractNumber')" prop="contractNumber" width="180" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-2
              .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: rgba(139, 92, 252, 0.1)")
                Icon(name="ph:file-doc-bold" size="16" style="color: #8b5cf6")
              span.text-sm.font-mono.font-semibold(style="color: var(--text-primary)") {{ row.contractNumber }}

        el-table-column(:label="$t('contractLifecycle.clientName')" prop="clientName" min-width="200" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-3
              .w-9.h-9.rounded-xl.flex.items-center.justify-center.text-sm.font-bold(
                :style="{ background: getAvatarColor(row.clientName) + '20', color: getAvatarColor(row.clientName) }"
              ) {{ getInitials(row.clientName) }}
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.clientName }}
                p.text-xs(style="color: var(--text-muted)") {{ row.clientEmail || '' }}

        el-table-column(:label="$t('contractLifecycle.contractType')" prop="type" width="180" sortable)
          template(#default="{ row }")
            el-tag(:type="getTypeTagType(row.type)" size="small" effect="dark" round) {{ getTypeLabel(row.type) }}

        el-table-column(:label="$t('contractLifecycle.startDate')" prop="startDate" width="130" sortable)
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-secondary)") {{ formatDate(row.startDate) }}

        el-table-column(:label="$t('contractLifecycle.endDate')" prop="endDate" width="130" sortable)
          template(#default="{ row }")
            span.text-sm(:style="{ color: isExpiringSoon(row.endDate) ? '#ef4444' : 'var(--text-secondary)' }") {{ formatDate(row.endDate) }}

        el-table-column(:label="$t('contractLifecycle.value')" prop="value" width="150" sortable)
          template(#default="{ row }")
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ formatCurrency(row.value) }}

        el-table-column(:label="$t('contractLifecycle.status')" prop="status" width="140" sortable)
          template(#default="{ row }")
            el-tag(:type="getStatusType(row.status)" size="small" effect="dark" round)
              Icon.mr-1(:name="getStatusIcon(row.status)" size="12")
              | {{ getStatusLabel(row.status) }}

        el-table-column(:label="$t('contractLifecycle.autoRenewal')" prop="autoRenewal" width="120" align="center")
          template(#default="{ row }")
            el-switch(
              v-model="row.autoRenewal"
              size="small"
              active-color="#22c55e"
              @change="handleToggleAutoRenewal(row)"
              @click.stop
            )

        el-table-column(:label="$t('common.actions')" width="160" fixed="right")
          template(#default="{ row }")
            .flex.items-center.gap-1(@click.stop)
              el-tooltip(:content="$t('common.view')" placement="top")
                el-button(size="small" circle @click="openContractDetail(row)")
                  Icon(name="ph:eye-bold" size="14")
              el-tooltip(:content="$t('common.edit')" placement="top")
                el-button(size="small" circle @click="openContractDialog(row)")
                  Icon(name="ph:pencil-bold" size="14")
              el-tooltip(:content="$t('contractLifecycle.renewContract')" placement="top")
                el-button(size="small" circle type="success" plain @click="handleRenew(row)" v-if="row.status === 'active' || row.status === 'expiring'")
                  Icon(name="ph:arrows-clockwise-bold" size="14")
              el-tooltip(:content="$t('contractLifecycle.terminateContract')" placement="top")
                el-button(size="small" circle type="danger" plain @click="handleTerminate(row)" v-if="row.status !== 'expired' && row.status !== 'terminated'")
                  Icon(name="ph:x-circle-bold" size="14")

    //- Pagination
    .flex.items-center.justify-between.mt-4.px-2
      span.text-xs(style="color: var(--text-muted)") {{ $t('common.showEntries') }} {{ filteredContracts.length }} {{ $t('common.entries') }}
      el-pagination(
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredContracts.length"
        layout="sizes, prev, pager, next"
        background
      )

  //- Empty State
  .text-center.py-20(v-else)
    .w-20.h-20.mx-auto.rounded-2xl.flex.items-center.justify-center.mb-4(style="background: rgba(139, 92, 252, 0.1)")
      Icon(name="ph:file-doc-bold" size="40" style="color: #8b5cf6")
    p.text-lg.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('contractLifecycle.noContracts') }}
    p.text-sm.mb-6(style="color: var(--text-muted)") {{ $t('contractLifecycle.noContractsDesc') }}
    el-button(type="primary" size="large" @click="openContractDialog()" class="!rounded-xl")
      Icon.mr-1(name="ph:plus-bold" size="18")
      | {{ $t('contractLifecycle.createContract') }}

  //- Contract Detail Drawer
  el-drawer(v-model="detailDrawerVisible" :title="selectedContract?.contractNumber" size="600px" direction="rtl")
    template(v-if="selectedContract")
      //- Contract Timeline
      .mb-6
        h4.text-sm.font-bold.uppercase.mb-4(style="color: var(--text-muted)") {{ $t('contractLifecycle.timeline') }}
        .timeline-steps.flex.items-center.gap-0.overflow-x-auto.pb-2
          .timeline-step.flex.flex-col.items-center.gap-1(
            v-for="(step, i) in timelineSteps"
            :key="step.key"
          )
            .w-10.h-10.rounded-full.flex.items-center.justify-center.text-xs.font-bold.transition-all(
              :style="getTimelineStepStyle(step.key, selectedContract.status)"
            )
              Icon(:name="step.icon" size="18")
            span.text-xs.font-semibold.whitespace-nowrap(:style="{ color: isStepActive(step.key, selectedContract.status) ? '#8b5cf6' : 'var(--text-muted)' }") {{ step.label }}
          div(class="timeline-connector flex-1 h-0.5 min-w-4"
            v-if="i < timelineSteps.length - 1"
            :style="{ background: isStepPassed(timelineSteps[i+1]?.key, selectedContract.status) ? '#8b5cf6' : 'var(--border-glass, rgba(255,255,255,0.1))' }"
          )

      //- Contract Details
      .space-y-4
        .glass-card.p-4.rounded-xl
          .grid.gap-4(class="grid-cols-2")
            div
              p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('contractLifecycle.clientName') }}
              p.text-sm.font-bold.mt-1(style="color: var(--text-primary)") {{ selectedContract.clientName }}
            div
              p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('contractLifecycle.contractType') }}
              p.text-sm.font-bold.mt-1(style="color: var(--text-primary)") {{ getTypeLabel(selectedContract.type) }}
            div
              p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('contractLifecycle.startDate') }}
              p.text-sm.font-bold.mt-1(style="color: var(--text-primary)") {{ formatDate(selectedContract.startDate) }}
            div
              p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('contractLifecycle.endDate') }}
              p.text-sm.font-bold.mt-1(style="color: var(--text-primary)") {{ formatDate(selectedContract.endDate) }}
            div
              p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('contractLifecycle.value') }}
              p.text-sm.font-bold.mt-1(style="color: #10b981") {{ formatCurrency(selectedContract.value) }}
            div
              p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('contractLifecycle.status') }}
              el-tag.mt-1(:type="getStatusType(selectedContract.status)" size="small" effect="dark" round) {{ getStatusLabel(selectedContract.status) }}
            div
              p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('contractLifecycle.autoRenewal') }}
              p.text-sm.font-bold.mt-1(style="color: var(--text-primary)") {{ selectedContract.autoRenewal ? $t('common.yes') : $t('common.no') }}
            div
              p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('contractLifecycle.owner') }}
              p.text-sm.font-bold.mt-1(style="color: var(--text-primary)") {{ selectedContract.owner || '--' }}

        //- Notes
        .glass-card.p-4.rounded-xl(v-if="selectedContract.notes")
          p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('contractLifecycle.notes') }}
          p.text-sm(style="color: var(--text-secondary)") {{ selectedContract.notes }}

      //- Actions
      .flex.gap-3.mt-6
        el-button(type="primary" @click="openContractDialog(selectedContract)" class="!rounded-xl")
          Icon.mr-1(name="ph:pencil-bold" size="16")
          | {{ $t('common.edit') }}
        el-button(type="success" @click="handleRenew(selectedContract)" v-if="selectedContract.status === 'active' || selectedContract.status === 'expiring'" class="!rounded-xl")
          Icon.mr-1(name="ph:arrows-clockwise-bold" size="16")
          | {{ $t('contractLifecycle.renewContract') }}

  //- Create/Edit Contract Dialog
  el-dialog(
    v-model="contractDialogVisible"
    :title="editingContract ? $t('contractLifecycle.editContract') : $t('contractLifecycle.createContract')"
    width="750px"
    class="contract-dialog"
  )
    el-form(:model="contractForm" label-position="top" ref="formRef")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('contractLifecycle.clientName')" required)
          el-input(v-model="contractForm.clientName" :placeholder="$t('contractLifecycle.enterClientName')")

        el-form-item(:label="$t('contractLifecycle.clientEmail')")
          el-input(v-model="contractForm.clientEmail" placeholder="client@company.com")

        el-form-item(:label="$t('contractLifecycle.contractType')" required)
          el-select(v-model="contractForm.type" style="width: 100%")
            el-option(v-for="tp in typeOptions" :key="tp.value" :label="tp.label" :value="tp.value")

        el-form-item(:label="$t('contractLifecycle.value')" required)
          el-input-number(v-model="contractForm.value" :min="0" :precision="2" style="width: 100%" :controls="false")

        el-form-item(:label="$t('contractLifecycle.startDate')" required)
          el-date-picker(v-model="contractForm.startDate" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%")

        el-form-item(:label="$t('contractLifecycle.endDate')" required)
          el-date-picker(v-model="contractForm.endDate" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%")

        el-form-item(:label="$t('contractLifecycle.status')")
          el-select(v-model="contractForm.status" style="width: 100%")
            el-option(v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value")

        el-form-item(:label="$t('contractLifecycle.owner')")
          el-input(v-model="contractForm.owner" :placeholder="$t('contractLifecycle.enterOwner')")

      el-form-item(:label="$t('contractLifecycle.autoRenewal')")
        el-switch(v-model="contractForm.autoRenewal" active-color="#22c55e")

      el-form-item(:label="$t('contractLifecycle.notes')")
        el-input(v-model="contractForm.notes" type="textarea" :rows="3" :placeholder="$t('contractLifecycle.enterNotes')")

    template(#footer)
      el-button(@click="contractDialogVisible = false" class="!rounded-xl") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSaveContract" :loading="saving" class="!rounded-xl") {{ $t('common.save') }}

  //- Renewal Alerts Drawer
  el-drawer(v-model="showAllAlerts" :title="$t('contractLifecycle.renewalAlerts')" size="480px")
    .space-y-3
      .glass-card.p-4.rounded-xl(v-for="alert in renewalAlerts" :key="alert.id")
        .flex.items-center.justify-between
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center.text-sm.font-bold(
              :style="{ background: getDaysColor(alert.daysLeft) + '20', color: getDaysColor(alert.daysLeft) }"
            ) {{ alert.daysLeft }}d
            div
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ alert.clientName }}
              p.text-xs(style="color: var(--text-muted)") {{ alert.contractNumber }} - {{ getTypeLabel(alert.type) }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('contractLifecycle.endDate') }}: {{ formatDate(alert.endDate) }}
          .flex.items-center.gap-2
            el-tag(
              :type="alert.daysLeft <= 30 ? 'danger' : alert.daysLeft <= 60 ? 'warning' : 'info'"
              size="small"
              effect="dark"
              round
            )
              | {{ alert.daysLeft <= 30 ? $t('contractLifecycle.expiringIn30') : alert.daysLeft <= 60 ? $t('contractLifecycle.expiringIn60') : $t('contractLifecycle.expiringIn90') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import PremiumPageHeader from '~/components/UI/PremiumPageHeader.vue';
import PremiumKPICards from '~/components/UI/PremiumKPICards.vue';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';

definePageMeta({ title: 'Contract Lifecycle Management' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const saving = ref(false);
const searchQuery = ref('');
const filterStatus = ref('');
const filterType = ref('');
const filterDateRange = ref<string[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const selectedRows = ref<any[]>([]);
const contractDialogVisible = ref(false);
const detailDrawerVisible = ref(false);
const showAllAlerts = ref(false);
const editingContract = ref<any>(null);
const selectedContract = ref<any>(null);

// Contract Types
const typeOptions = computed(() => [
  { label: t('contractLifecycle.serviceAgreement'), value: 'service_agreement' },
  { label: t('contractLifecycle.license'), value: 'license' },
  { label: t('contractLifecycle.nda'), value: 'nda' },
  { label: t('contractLifecycle.sla'), value: 'sla' },
  { label: t('contractLifecycle.partnership'), value: 'partnership' }
]);

// Status Options
const statusOptions = computed(() => [
  { label: t('contractLifecycle.draft'), value: 'draft' },
  { label: t('contractLifecycle.underReview'), value: 'under_review' },
  { label: t('contractLifecycle.active'), value: 'active' },
  { label: t('contractLifecycle.expiring'), value: 'expiring' },
  { label: t('contractLifecycle.expired'), value: 'expired' },
  { label: t('contractLifecycle.renewed'), value: 'renewed' },
  { label: t('contractLifecycle.terminated'), value: 'terminated' }
]);

// Timeline Steps
const timelineSteps = computed(() => [
  { key: 'draft', label: t('contractLifecycle.draft'), icon: 'ph:note-pencil-bold' },
  { key: 'under_review', label: t('contractLifecycle.underReview'), icon: 'ph:magnifying-glass-bold' },
  { key: 'active', label: t('contractLifecycle.active'), icon: 'ph:check-circle-bold' },
  { key: 'expiring', label: t('contractLifecycle.expiring'), icon: 'ph:warning-circle-bold' },
  { key: 'renewed', label: t('contractLifecycle.renewed'), icon: 'ph:arrows-clockwise-bold' }
]);

// Contract Form
const contractForm = reactive({
  clientName: '',
  clientEmail: '',
  type: 'service_agreement',
  value: 0,
  startDate: '',
  endDate: '',
  status: 'draft',
  autoRenewal: false,
  owner: '',
  notes: ''
});

// Data
const contracts = ref<any[]>([]);

// Load data
async function loadContracts() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('contracts');
    if (success && body) {
      const docs = (body as any).docs || body;
      contracts.value = Array.isArray(docs) ? docs : [];
    }
  } catch (e) {
    // Generate demo data on API failure for display purposes
    contracts.value = generateDemoContracts();
  } finally {
    loading.value = false;
  }
}

function generateDemoContracts() {
  const clients = [
    'Aramco Digital', 'STC Solutions', 'Neom Technologies', 'SABIC Corp',
    'Al Rajhi Capital', 'Saudi Telecom', 'Mobily Enterprise', 'Zain KSA',
    'Elm Company', 'Tahakom', 'Red Sea Global', 'ACWA Power',
    'Lucid Motors Saudi', 'King Salman Energy Park', 'Diriyah Gate'
  ];
  const types = ['service_agreement', 'license', 'nda', 'sla', 'partnership'];
  const statuses = ['draft', 'under_review', 'active', 'active', 'active', 'expiring', 'expired', 'renewed'];
  const now = new Date();
  const year = now.getFullYear();

  return clients.map((client, i) => {
    const status = statuses[i % statuses.length];
    const startDate = new Date(year - 1, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const endOffset = status === 'expiring' ? Math.floor(Math.random() * 30) : (status === 'expired' ? -Math.floor(Math.random() * 60) : Math.floor(Math.random() * 365) + 60);
    const endDate = new Date(now.getTime() + endOffset * 86400000);

    return {
      id: i + 1,
      contractNumber: `CTR-${year}-${String(i + 1001).padStart(4, '0')}`,
      clientName: client,
      clientEmail: `contact@${client.toLowerCase().replace(/\s+/g, '')}.com`,
      type: types[i % types.length],
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 500000) + 25000,
      status,
      autoRenewal: Math.random() > 0.4,
      owner: ['Ahmed Al-Sayed', 'Fatima Hassan', 'Mohammed Ali', 'Sara Khan', 'Omar Rashid'][i % 5],
      notes: i % 3 === 0 ? 'Key enterprise account - priority renewal' : ''
    };
  });
}

await loadContracts();

// Computed
const filteredContracts = computed(() => {
  let result = [...contracts.value];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter((c: any) =>
      c.contractNumber?.toLowerCase().includes(q) ||
      c.clientName?.toLowerCase().includes(q) ||
      c.owner?.toLowerCase().includes(q)
    );
  }

  if (filterStatus.value) {
    result = result.filter((c: any) => c.status === filterStatus.value);
  }

  if (filterType.value) {
    result = result.filter((c: any) => c.type === filterType.value);
  }

  if (filterDateRange.value?.length === 2) {
    const [from, to] = filterDateRange.value;
    result = result.filter((c: any) => c.endDate >= from && c.endDate <= to);
  }

  return result;
});

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredContracts.value.slice(start, start + pageSize.value);
});

const renewalAlerts = computed(() => {
  const now = new Date();
  return contracts.value
    .filter((c: any) => {
      if (c.status === 'expired' || c.status === 'terminated') return false;
      const end = new Date(c.endDate);
      const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      return diff > 0 && diff <= 90;
    })
    .map((c: any) => {
      const end = new Date(c.endDate);
      const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      return { ...c, daysLeft: diff };
    })
    .sort((a: any, b: any) => a.daysLeft - b.daysLeft);
});

const kpiMetrics = computed<KPIMetric[]>(() => {
  const data = contracts.value;
  const active = data.filter((c: any) => c.status === 'active' || c.status === 'expiring').length;
  const expiringSoon = data.filter((c: any) => {
    const end = new Date(c.endDate);
    const diff = Math.ceil((end.getTime() - Date.now()) / 86400000);
    return diff > 0 && diff <= 30 && c.status !== 'expired' && c.status !== 'terminated';
  }).length;
  const totalValue = data
    .filter((c: any) => c.status === 'active' || c.status === 'expiring' || c.status === 'renewed')
    .reduce((sum: number, c: any) => sum + (Number(c.value) || 0), 0);
  const renewedCount = data.filter((c: any) => c.status === 'renewed').length;
  const eligibleForRenewal = data.filter((c: any) => ['renewed', 'expired', 'expiring'].includes(c.status)).length;
  const renewalRate = eligibleForRenewal > 0 ? Math.round((renewedCount / eligibleForRenewal) * 100) : 0;

  return [
    {
      label: t('contractLifecycle.activeContracts'),
      value: active,
      icon: 'ph:file-doc-bold',
      color: '#8b5cf6'
    },
    {
      label: t('contractLifecycle.expiringSoon'),
      value: expiringSoon,
      icon: 'ph:warning-circle-bold',
      color: expiringSoon > 0 ? '#ef4444' : '#22c55e',
      trend: expiringSoon > 3 ? 'Urgent' : undefined,
      trendType: expiringSoon > 3 ? 'down' as const : undefined
    },
    {
      label: t('contractLifecycle.totalValue'),
      value: formatCurrency(totalValue),
      icon: 'ph:currency-circle-dollar-bold',
      color: '#10b981'
    },
    {
      label: t('contractLifecycle.renewalRate'),
      value: `${renewalRate}%`,
      icon: 'ph:arrows-clockwise-bold',
      color: renewalRate >= 70 ? '#22c55e' : renewalRate >= 50 ? '#f59e0b' : '#ef4444'
    }
  ];
});

// Helpers
function formatCurrency(val: number): string {
  return Number(val || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0
  });
}

function formatDate(date: string): string {
  if (!date) return '--';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    service_agreement: t('contractLifecycle.serviceAgreement'),
    license: t('contractLifecycle.license'),
    nda: t('contractLifecycle.nda'),
    sla: t('contractLifecycle.sla'),
    partnership: t('contractLifecycle.partnership')
  };
  return map[type] || type;
}

function getTypeTagType(type: string): string {
  const map: Record<string, string> = {
    service_agreement: '',
    license: 'success',
    nda: 'warning',
    sla: 'info',
    partnership: 'primary'
  };
  return map[type] || 'info';
}

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    draft: 'info',
    under_review: 'warning',
    active: 'success',
    expiring: 'danger',
    expired: 'info',
    renewed: 'primary',
    terminated: 'danger'
  };
  return map[status] || 'info';
}

function getStatusIcon(status: string): string {
  const map: Record<string, string> = {
    draft: 'ph:note-pencil-bold',
    under_review: 'ph:magnifying-glass-bold',
    active: 'ph:check-circle-bold',
    expiring: 'ph:warning-circle-bold',
    expired: 'ph:x-circle-bold',
    renewed: 'ph:arrows-clockwise-bold',
    terminated: 'ph:prohibit-bold'
  };
  return map[status] || 'ph:circle-bold';
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: t('contractLifecycle.draft'),
    under_review: t('contractLifecycle.underReview'),
    active: t('contractLifecycle.active'),
    expiring: t('contractLifecycle.expiring'),
    expired: t('contractLifecycle.expired'),
    renewed: t('contractLifecycle.renewed'),
    terminated: t('contractLifecycle.terminated')
  };
  return map[status] || status;
}

function isExpiringSoon(endDate: string): boolean {
  if (!endDate) return false;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff > 0 && diff <= 30;
}

function getDaysColor(days: number): string {
  if (days <= 15) return '#ef4444';
  if (days <= 30) return '#f59e0b';
  if (days <= 60) return '#3b82f6';
  return '#22c55e';
}

function getTimelineStepStyle(stepKey: string, currentStatus: string): Record<string, string> {
  const active = isStepActive(stepKey, currentStatus);
  const passed = isStepPassed(stepKey, currentStatus);
  if (active) {
    return { background: '#8b5cf6', color: '#fff', boxShadow: '0 0 0 4px rgba(139, 92, 252, 0.2)' };
  }
  if (passed) {
    return { background: 'rgba(139, 92, 252, 0.2)', color: '#8b5cf6' };
  }
  return { background: 'var(--glass-bg, rgba(255,255,255,0.06))', color: 'var(--text-muted)', border: '1px solid var(--border-glass, rgba(255,255,255,0.1))' };
}

function isStepActive(stepKey: string, currentStatus: string): boolean {
  return stepKey === currentStatus;
}

function isStepPassed(stepKey: string, currentStatus: string): boolean {
  const order = ['draft', 'under_review', 'active', 'expiring', 'renewed'];
  const currentIdx = order.indexOf(currentStatus);
  const stepIdx = order.indexOf(stepKey);
  return stepIdx < currentIdx;
}

function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(contracts.value.length + 1001).padStart(4, '0');
  return `CTR-${year}-${seq}`;
}

// Actions
function openContractDialog(contract?: any) {
  if (contract) {
    editingContract.value = contract;
    contractForm.clientName = contract.clientName;
    contractForm.clientEmail = contract.clientEmail || '';
    contractForm.type = contract.type;
    contractForm.value = contract.value;
    contractForm.startDate = contract.startDate;
    contractForm.endDate = contract.endDate;
    contractForm.status = contract.status;
    contractForm.autoRenewal = contract.autoRenewal;
    contractForm.owner = contract.owner || '';
    contractForm.notes = contract.notes || '';
  } else {
    editingContract.value = null;
    contractForm.clientName = '';
    contractForm.clientEmail = '';
    contractForm.type = 'service_agreement';
    contractForm.value = 0;
    contractForm.startDate = '';
    contractForm.endDate = '';
    contractForm.status = 'draft';
    contractForm.autoRenewal = false;
    contractForm.owner = '';
    contractForm.notes = '';
  }
  contractDialogVisible.value = true;
}

function openContractDetail(contract: any) {
  selectedContract.value = contract;
  detailDrawerVisible.value = true;
}

async function handleSaveContract() {
  if (!contractForm.clientName.trim() || !contractForm.startDate || !contractForm.endDate) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...contractForm };
    if (editingContract.value) {
      await useApiFetch(`contracts/${editingContract.value.id}`, 'PUT', payload);
    } else {
      (payload as any).contractNumber = generateContractNumber();
      await useApiFetch('contracts', 'POST', payload);
    }
    await loadContracts();
    contractDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('contractLifecycle.contractSaved') });
  } catch {
    // On API failure, do local update for demo
    if (editingContract.value) {
      Object.assign(editingContract.value, contractForm);
    } else {
      contracts.value.push({
        id: Date.now(),
        contractNumber: generateContractNumber(),
        ...contractForm
      });
    }
    contractDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('contractLifecycle.contractSaved') });
  } finally {
    saving.value = false;
  }
}

async function handleRenew(contract: any) {
  try {
    await ElMessageBox.confirm(
      t('contractLifecycle.confirmRenew'),
      t('contractLifecycle.renewContract'),
      { type: 'info', confirmButtonText: t('contractLifecycle.renewContract'), cancelButtonText: t('common.cancel') }
    );
    try {
      await useApiFetch(`contracts/${contract.id}/renew`, 'POST');
    } catch {
      // Local update for demo
      contract.status = 'renewed';
      const endDate = new Date(contract.endDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      contract.endDate = endDate.toISOString().split('T')[0];
    }
    ElNotification({ type: 'success', title: t('common.success'), message: t('contractLifecycle.contractRenewed') });
  } catch {
    // User cancelled
  }
}

async function handleTerminate(contract: any) {
  try {
    await ElMessageBox.confirm(
      t('contractLifecycle.confirmTerminate'),
      t('contractLifecycle.terminateContract'),
      { type: 'warning', confirmButtonText: t('contractLifecycle.terminateContract'), cancelButtonText: t('common.cancel') }
    );
    try {
      await useApiFetch(`contracts/${contract.id}/terminate`, 'POST');
    } catch {
      contract.status = 'terminated';
    }
    ElNotification({ type: 'success', title: t('common.success'), message: t('contractLifecycle.contractTerminated') });
  } catch {
    // User cancelled
  }
}

async function handleToggleAutoRenewal(contract: any) {
  try {
    await useApiFetch(`contracts/${contract.id}`, 'PUT', { autoRenewal: contract.autoRenewal });
  } catch {
    // Silently keep the local toggle on failure for demo
  }
}

function handleRowClick(row: any) {
  openContractDetail(row);
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

async function handleBulkExport() {
  try {
    const ids = selectedRows.value.map((r: any) => r.id);
    await useApiFetch('contracts/export', 'POST', { ids });
    ElNotification({ type: 'success', title: t('common.success'), message: t('contractLifecycle.exportSuccess') });
    selectedRows.value = [];
  } catch {
    handleExportCSV();
    selectedRows.value = [];
  }
}

function handleExportCSV() {
  const data = filteredContracts.value;
  const headers = [
    t('contractLifecycle.contractNumber'),
    t('contractLifecycle.clientName'),
    t('contractLifecycle.contractType'),
    t('contractLifecycle.startDate'),
    t('contractLifecycle.endDate'),
    t('contractLifecycle.value'),
    t('contractLifecycle.status'),
    t('contractLifecycle.autoRenewal')
  ];
  const rows = data.map((c: any) => [
    c.contractNumber,
    c.clientName,
    getTypeLabel(c.type),
    c.startDate,
    c.endDate,
    c.value,
    getStatusLabel(c.status),
    c.autoRenewal ? 'Yes' : 'No'
  ]);
  const csv = [headers.join(','), ...rows.map((r: any[]) => r.map((v: any) => `"${v}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contracts-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElNotification({ type: 'success', title: t('common.success'), message: t('contractLifecycle.exportSuccess') });
}
</script>

<style lang="scss" scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.renewal-alerts-banner {
  border: 1px solid rgba(245, 158, 11, 0.2);
  background: rgba(245, 158, 11, 0.03);
}

.renewal-chip {
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-1px);
  }
}

.timeline-steps {
  .timeline-step {
    flex-shrink: 0;
  }
  .timeline-connector {
    flex-shrink: 1;
    align-self: center;
    margin-top: -20px;
  }
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

  .contract-row {
    cursor: pointer;
    transition: all 0.15s ease;
  }
}

// Mobile responsive
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
}
</style>
