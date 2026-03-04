<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('warranty.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('warranty.subtitle') }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:shield-check" size="16" style="margin-right: 4px;")
      | {{ $t('warranty.addWarranty') }}

  //- Analytics Cards (from API)
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-5")
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:shield-check-bold" size="20" style="color: #7849ff")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ warrantyAnalytics.activeWarranties }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warranty.activeWarranties') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:clock-countdown-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-bold(style="color: #f59e0b") {{ warrantyAnalytics.expiringSoon }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warranty.expiringSoon30') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:file-text-bold" size="20" style="color: #3b82f6")
        div
          p.text-2xl.font-bold(style="color: #3b82f6") {{ warrantyAnalytics.claimsFiled }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warranty.claimsFiled') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:timer-bold" size="20" style="color: #22c55e")
        div
          p.text-2xl.font-bold(style="color: #22c55e") {{ warrantyAnalytics.avgResolutionTime }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warranty.avgResolution') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(236, 72, 153, 0.15)")
          Icon(name="ph:currency-circle-dollar-bold" size="20" style="color: #ec4899")
        div
          p.text-2xl.font-bold(style="color: #ec4899") {{ formatCurrency(warrantyAnalytics.avgClaimValue) }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warranty.avgClaimValue') }}

  //- Expiring Soon Alerts Panel
  .glass-card.p-5.rounded-2xl.mb-6(v-if="expiringWarranties.length")
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:warning-bold" size="20" class="mr-2" style="color: #f59e0b")
        | {{ $t('warranty.expiringSoonPanel') }}
      el-tag(type="warning" size="small" effect="dark" round) {{ expiringWarranties.length }} {{ $t('warranty.warranties') }}
    .space-y-2
      .flex.items-center.justify-between.p-3.rounded-xl(
        v-for="(ew, idx) in expiringWarranties"
        :key="idx"
        style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
      )
        .flex.items-center.gap-3
          .w-9.h-9.rounded-lg.flex.items-center.justify-center(:style="{ background: getExpiryBgColor(ew.daysRemaining) }")
            Icon(name="ph:shield-warning-bold" size="16" :style="{ color: getExpiryColor(ew.daysRemaining) }")
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ ew.productName || ew.name || '--' }}
            p.text-xs(style="color: var(--text-muted)") {{ ew.clientName || ew.client || '--' }}
        .text-end
          p.text-sm.font-bold(:style="{ color: getExpiryColor(ew.daysRemaining) }") {{ ew.daysRemaining }} {{ $t('warranty.daysLeft') }}
          p.text-xs(style="color: var(--text-muted)") {{ ew.endDate || '--' }}

  //- Original Stats Cards (kept for backward compat)
  .grid.grid-cols-4.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('warranty.total') }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ warranties.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('warranty.active') }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ warranties.filter(w => w.status === 'active').length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('warranty.expiringSoon') }}
      p.text-3xl.font-black.mt-1(style="color: #f59e0b;") {{ expiringSoon.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('warranty.expired') }}
      p.text-3xl.font-black.mt-1(style="color: #ef4444;") {{ warranties.filter(w => w.status === 'expired').length }}

  //- Warranty Claims Section
  .glass-card.p-5.rounded-2xl.mb-6(v-if="showClaimsSection")
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:gavel-bold" size="20" class="mr-2" style="color: #3b82f6")
        | {{ $t('warranty.claimsWorkflow') }}
      el-button(type="primary" size="small" @click="showClaimDialog = true")
        Icon(name="ph:plus" size="14" class="mr-1")
        | {{ $t('warranty.fileClaim') }}
    .grid.gap-4(class="grid-cols-1 md:grid-cols-4")
      .glass-card.p-4.text-center(v-for="(count, status) in claimStatusCounts" :key="status")
        el-tag(:type="getClaimStatusType(status)" size="small" effect="dark" round class="mb-2") {{ status }}
        p.text-2xl.font-bold(:style="{ color: getClaimStatusColor(status) }") {{ count }}

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="loading")
    //- Bulk Operations Toolbar
    .flex.items-center.justify-between.mb-4(v-if="selectedWarranties.length")
      .flex.items-center.gap-2
        Icon(name="ph:check-square-bold" size="18" style="color: #7849ff")
        span.text-sm.font-semibold(style="color: var(--text-primary)") {{ selectedWarranties.length }} {{ $t('warranty.selected') }}
      .flex.items-center.gap-2
        el-button(type="warning" size="small" @click="bulkChangeStatus")
          Icon(name="ph:arrows-clockwise" size="14" class="mr-1")
          | {{ $t('warranty.bulkChangeStatus') }}
        el-button(type="danger" size="small" @click="bulkDelete")
          Icon(name="ph:trash" size="14" class="mr-1")
          | {{ $t('warranty.bulkDelete') }}

    el-table(
      :data="warranties"
      style="width: 100%"
      :empty-text="$t('warranty.noWarranties')"
      @selection-change="handleSelectionChange"
    )
      el-table-column(type="selection" width="55")
      el-table-column(:label="$t('warranty.productService')" min-width="200")
        template(#default="{ row }")
          .flex.items-center.gap-2
            div
              p.text-sm.font-bold {{ row.productName }}
              p.text-xs.text-gray-400 {{ row.clientName }}
      el-table-column(:label="$t('warranty.type')" width="140")
        template(#default="{ row }")
          el-tag(size="small" round effect="plain") {{ row.warrantyType }}
      el-table-column(:label="$t('warranty.coverage')" min-width="180")
        template(#default="{ row }")
          .flex.items-center.gap-2
            p.text-xs {{ row.coverage }}
            el-progress(
              v-if="row.coveragePercent != null"
              :percentage="row.coveragePercent"
              :stroke-width="4"
              :show-text="false"
              style="width: 60px"
            )
      el-table-column(:label="$t('warranty.startDate')" width="110")
        template(#default="{ row }")
          span.text-xs.font-mono {{ row.startDate }}
      el-table-column(:label="$t('warranty.endDate')" width="110")
        template(#default="{ row }")
          span.text-xs.font-mono(:style="{ color: isExpiringSoon(row.endDate) ? '#f59e0b' : '' }") {{ row.endDate }}
      el-table-column(:label="$t('warranty.status')" width="100")
        template(#default="{ row }")
          el-tag(:type="row.status === 'active' ? 'success' : row.status === 'expired' ? 'danger' : 'info'" size="small" round) {{ row.status }}
      el-table-column(:label="$t('common.actions')" width="120")
        template(#default="{ row }")
          .flex.items-center.gap-1
            el-button(text circle size="small" type="primary" @click="viewTimeline(row)")
              Icon(name="ph:clock-clockwise" size="14")
            el-button(text circle size="small" type="danger" @click="removeWarranty(row.id)")
              Icon(name="ph:trash" size="14")

    .flex.justify-end.mt-4
      el-pagination(
        :current-page="pagination.page"
        :page-size="pagination.limit"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="(p: number) => { pagination.page = p; fetchWarranties() }"
      )

  //- Claim Filing Dialog
  el-dialog(v-model="showClaimDialog" :title="$t('warranty.fileClaim')" width="560px")
    el-form(label-position="top" size="default")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('warranty.warranty')" required)
          el-select(v-model="claimForm.warrantyId" class="w-full" filterable)
            el-option(
              v-for="w in warranties.filter(x => x.status === 'active')"
              :key="w.id"
              :label="w.productName + ' - ' + w.clientName"
              :value="w.id"
            )
        el-form-item(:label="$t('warranty.claimAmount')" required)
          el-input-number(v-model="claimForm.claimAmount" :min="0" class="!w-full")
      el-form-item(:label="$t('warranty.claimReason')" required)
        el-input(v-model="claimForm.reason" type="textarea" :rows="3" :placeholder="$t('warranty.claimReasonPlaceholder')")
      el-form-item(:label="$t('warranty.claimStatus')")
        el-select(v-model="claimForm.claimStatus" class="w-full")
          el-option(:label="$t('warranty.filed')" value="FILED")
          el-option(:label="$t('warranty.underReview')" value="UNDER_REVIEW")
          el-option(:label="$t('common.approved')" value="APPROVED")
          el-option(:label="$t('common.denied')" value="DENIED")
          el-option(:label="$t('warranty.fulfilled')" value="FULFILLED")
    template(#footer)
      el-button(@click="showClaimDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveClaim" :loading="savingClaim") {{ $t('common.submit') }}

  //- Timeline Dialog
  el-dialog(v-model="showTimelineDialog" :title="timelineTitle" width="680px")
    .space-y-4(v-if="timelineData.length")
      .flex.gap-4(v-for="(event, idx) in timelineData" :key="idx")
        .flex.flex-col.items-center.shrink-0(style="width: 60px")
          .w-10.h-10.rounded-full.flex.items-center.justify-center(:style="{ background: getEventColor(event.type) + '20' }")
            Icon(:name="getEventIcon(event.type)" size="16" :style="{ color: getEventColor(event.type) }")
          div(v-if="idx < timelineData.length - 1" class="w-0.5 flex-1 mt-2" :style="{ background: getEventColor(event.type) + '40' }")
        .glass-card.p-4.flex-1
          .flex.items-center.justify-between.mb-2
            h4.text-sm.font-bold(style="color: var(--text-primary)") {{ event.title }}
            span.text-xs(style="color: var(--text-muted)") {{ formatDateTime(event.timestamp) }}
          p.text-xs(style="color: var(--text-muted)") {{ event.description }}
    .text-center.py-8(v-else)
      Icon(name="ph:clock-clockwise" size="48" style="color: var(--text-muted)")
      p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('warranty.noTimeline') }}

  el-dialog(v-model="showDialog" :title="$t('warranty.addWarranty')" width="560px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('warranty.productServiceName')")
          el-input(v-model="form.productName")
        el-form-item(:label="$t('warranty.client')")
          el-input(v-model="form.clientName")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('warranty.type')")
          el-select(v-model="form.warrantyType" class="w-full")
            el-option(:label="$t('warranty.typeWarranty')" value="Warranty")
            el-option(:label="$t('warranty.typeMaintenance')" value="Maintenance")
            el-option(:label="$t('warranty.typeSupportPlan')" value="Support")
            el-option(:label="$t('warranty.typeAMC')" value="AMC")
        el-form-item(:label="$t('warranty.coverage')")
          el-input(v-model="form.coverage" :placeholder="$t('warranty.coveragePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('warranty.startDate')")
          el-date-picker(v-model="form.startDate" type="date" class="!w-full")
        el-form-item(:label="$t('warranty.endDate')")
          el-date-picker(v-model="form.endDate" type="date" class="!w-full")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveWarranty" :loading="saving" style="border-radius: 12px;") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';

definePageMeta({});

const { t: $t } = useI18n();

interface Warranty {
  id: string;
  productName: string;
  clientName: string;
  warrantyType: string;
  coverage: string;
  startDate: string;
  endDate: string;
  status: string;
}

const warranties = ref<Warranty[]>([]);
const pagination = reactive({ page: 1, limit: 20, total: 0 });
const showDialog = ref(false);
const showClaimDialog = ref(false);
const showTimelineDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const savingClaim = ref(false);
const form = reactive({ productName: '', clientName: '', warrantyType: 'Warranty', coverage: '', startDate: '', endDate: '' });
const selectedWarranties = ref<Warranty[]>([]);
const showClaimsSection = ref(true);
const timelineData = ref<any[]>([]);
const timelineTitle = ref('');

// Claim form
const claimForm = reactive({
  warrantyId: '',
  claimAmount: 0,
  reason: '',
  claimStatus: 'FILED'
});

// Analytics from API
const warrantyAnalytics = reactive({
  activeWarranties: 0,
  expiringSoon: 0,
  claimsFiled: 0,
  avgResolutionTime: 0,
  avgClaimValue: 0
});

// Expiring warranties list
const expiringWarranties = ref<any[]>([]);

// Claim status counts
const claimStatusCounts = reactive({
  FILED: 0,
  UNDER_REVIEW: 0,
  APPROVED: 0,
  DENIED: 0,
  FULFILLED: 0
});

const expiringSoon = computed(() => {
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return warranties.value.filter(w => w.status === 'active' && w.endDate >= today && w.endDate <= in30);
});

function isExpiringSoon(date: string): boolean {
  const d = new Date(date);
  return d.getTime() - Date.now() < 30 * 86400000 && d.getTime() > Date.now();
}

async function fetchWarranties() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch(`warranty?page=${pagination.page}&limit=${pagination.limit}`, 'GET');
    if (success && body) {
      const data = body as any;
      warranties.value = data.rows || data.docs || (Array.isArray(data) ? data : []);
      pagination.total = data.count ?? data.total ?? warranties.value.length;
    }
  } catch (e) {
    console.error('Failed to fetch warranties:', e);
    ElMessage.error($t('common.fetchError'));
  } finally {
    loading.value = false;
  }
}

async function saveWarranty() {
  saving.value = true;
  try {
    const payload = {
      ...form,
      status: 'active',
      startDate: form.startDate ? new Date(form.startDate).toISOString().slice(0, 10) : '',
      endDate: form.endDate ? new Date(form.endDate).toISOString().slice(0, 10) : ''
    };
    const { body, success } = await useApiFetch('warranty', 'POST', payload);
    if (success && body) {
      warranties.value.unshift(body);
    }
    Object.assign(form, { productName: '', clientName: '', warrantyType: 'Warranty', coverage: '', startDate: '', endDate: '' });
    showDialog.value = false;
    ElMessage.success($t('warranty.warrantyAdded'));
  } catch (e) {
    console.error('Failed to save warranty:', e);
    ElMessage.error($t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function removeWarranty(id: string) {
  try {
    const { success } = await useApiFetch(`warranty/${id}`, 'DELETE');
    if (success) {
      warranties.value = warranties.value.filter(w => w.id !== id);
      ElMessage.success($t('warranty.warrantyDeleted'));
    }
  } catch (e) {
    console.error('Failed to delete warranty:', e);
    ElMessage.error($t('common.error'));
  }
}

// Expiry color helpers
function getExpiryColor(days: number): string {
  if (days < 7) return '#ef4444';
  if (days < 14) return '#f97316';
  return '#f59e0b';
}

function getExpiryBgColor(days: number): string {
  if (days < 7) return 'rgba(239, 68, 68, 0.1)';
  if (days < 14) return 'rgba(249, 115, 22, 0.1)';
  return 'rgba(245, 158, 11, 0.1)';
}

// Bulk operations
function handleSelectionChange(val: Warranty[]) {
  selectedWarranties.value = val;
}

async function bulkChangeStatus() {
  if (!selectedWarranties.value.length) return;
  try {
    const status = await ElMessageBox.prompt($t('warranty.enterNewStatus'), $t('common.warning'), {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      inputPattern: /^(active|expired|pending)$/,
      inputErrorMessage: $t('warranty.invalidStatus')
    });
    const ids = selectedWarranties.value.map(w => w.id);
    const statusValue = typeof status === 'string' ? status : (status as { value: string }).value;
    const { success } = await useApiFetch('warranty/bulk-status', 'PUT', { ids, status: statusValue });
    if (success) {
      ElMessage.success($t('warranty.statusUpdated'));
      selectedWarranties.value = [];
      await fetchWarranties();
    }
  } catch {
    // cancelled
  }
}

async function bulkDelete() {
  if (!selectedWarranties.value.length) return;
  try {
    await ElMessageBox.confirm($t('warranty.confirmBulkDelete'), $t('common.warning'), {
      type: 'warning',
      confirmButtonText: $t('common.delete'),
      cancelButtonText: $t('common.cancel')
    });
    const ids = selectedWarranties.value.map(w => w.id);
    const { success } = await useApiFetch('warranty/bulk-delete', 'DELETE', { ids });
    if (success) {
      ElMessage.success($t('warranty.warrantyDeleted'));
      selectedWarranties.value = [];
      await fetchWarranties();
    }
  } catch {
    // cancelled
  }
}

// Timeline
async function viewTimeline(warranty: Warranty) {
  timelineTitle.value = `${$t('warranty.timeline')} - ${warranty.productName}`;
  showTimelineDialog.value = true;
  try {
    const { body, success } = await useApiFetch(`warranty/${warranty.id}/timeline`, 'GET');
    if (success && body) {
      timelineData.value = Array.isArray(body) ? body : (body as any).events || [];
    }
  } catch {
    timelineData.value = [];
  }
}

function getEventIcon(type: string): string {
  const map: Record<string, string> = {
    created: 'ph:plus-circle-bold',
    claim_filed: 'ph:file-text-bold',
    claim_approved: 'ph:check-circle-bold',
    claim_denied: 'ph:x-circle-bold',
    renewed: 'ph:arrows-clockwise-bold',
    expired: 'ph:warning-bold'
  };
  return map[type] || 'ph:circle-bold';
}

function getEventColor(type: string): string {
  const map: Record<string, string> = {
    created: '#7849ff',
    claim_filed: '#3b82f6',
    claim_approved: '#22c55e',
    claim_denied: '#ef4444',
    renewed: '#f59e0b',
    expired: '#ef4444'
  };
  return map[type] || '#7849ff';
}

function formatDateTime(ts: string): string {
  if (!ts) return '--';
  try {
    return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}

function formatCurrency(val: number): string {
  return val ? val.toLocaleString() : '0';
}

// Claims
function getClaimStatusType(status: string): string {
  const map: Record<string, string> = {
    FILED: 'info',
    UNDER_REVIEW: 'warning',
    APPROVED: 'success',
    DENIED: 'danger',
    FULFILLED: 'success'
  };
  return map[status] || 'info';
}

function getClaimStatusColor(status: string): string {
  const map: Record<string, string> = {
    FILED: '#3b82f6',
    UNDER_REVIEW: '#f59e0b',
    APPROVED: '#22c55e',
    DENIED: '#ef4444',
    FULFILLED: '#10b981'
  };
  return map[status] || '#7849ff';
}

async function saveClaim() {
  if (!claimForm.warrantyId || !claimForm.reason.trim()) {
    ElMessage.warning($t('common.fillRequired'));
    return;
  }
  savingClaim.value = true;
  try {
    const { success } = await useApiFetch('warranty/claims', 'POST', claimForm);
    if (success) {
      ElMessage.success($t('warranty.claimFiled'));
      Object.assign(claimForm, { warrantyId: '', claimAmount: 0, reason: '', claimStatus: 'FILED' });
      showClaimDialog.value = false;
      await loadWarrantyAnalytics();
      await loadClaimStatusCounts();
    }
  } catch (e) {
    ElMessage.error($t('common.error'));
  } finally {
    savingClaim.value = false;
  }
}

// Analytics API
async function loadWarrantyAnalytics() {
  try {
    const { body, success } = await useApiFetch('warranty/analytics', 'GET');
    if (success && body) {
      const data = body as any;
      warrantyAnalytics.activeWarranties = data?.activeWarranties ?? data?.active ?? 0;
      warrantyAnalytics.expiringSoon = data?.expiringSoon ?? 0;
      warrantyAnalytics.claimsFiled = data?.claimsFiled ?? data?.claims ?? 0;
      warrantyAnalytics.avgResolutionTime = data?.avgResolutionTime ?? data?.avgResolution ?? 0;
      warrantyAnalytics.avgClaimValue = data?.avgClaimValue ?? 0;
    }
  } catch (e: any) {
    ElMessage.error($t('common.error'));
  }
}

async function loadClaimStatusCounts() {
  try {
    const { body, success } = await useApiFetch('warranty/claims/status-counts', 'GET');
    if (success && body) {
      Object.assign(claimStatusCounts, body);
    }
  } catch (e: any) {
    ElMessage.error($t('common.error'));
  }
}

// Expiring Warranties API
async function loadExpiringWarranties() {
  try {
    const { body, success } = await useApiFetch('warranty/expiring?daysAhead=30', 'GET');
    if (success && body) {
      const data = body as any;
      const items = data?.rows || data?.docs || (Array.isArray(data) ? data : []);
      // Compute daysRemaining if not provided
      const today = new Date();
      expiringWarranties.value = items.map((w: any) => {
        let daysRemaining = w.daysRemaining;
        if (daysRemaining == null && w.endDate) {
          const end = new Date(w.endDate);
          daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));
        }
        return { ...w, daysRemaining: daysRemaining ?? 0 };
      });
    }
  } catch (e: any) {
    ElMessage.error($t('common.error'));
  }
}

onMounted(() => {
  fetchWarranties();
  loadWarrantyAnalytics();
  loadExpiringWarranties();
  loadClaimStatusCounts();
});
</script>
