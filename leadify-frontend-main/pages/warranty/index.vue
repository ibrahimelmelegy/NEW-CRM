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
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:shield-check-bold" size="20" style="color: #7849ff")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ warrantyAnalytics.activeWarranties }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warranty.activeWarranties') || 'Active Warranties' }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:clock-countdown-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-bold(style="color: #f59e0b") {{ warrantyAnalytics.expiringSoon }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warranty.expiringSoon30') || 'Expiring Soon (30d)' }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:file-text-bold" size="20" style="color: #3b82f6")
        div
          p.text-2xl.font-bold(style="color: #3b82f6") {{ warrantyAnalytics.claimsFiled }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warranty.claimsFiled') || 'Claims Filed' }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:timer-bold" size="20" style="color: #22c55e")
        div
          p.text-2xl.font-bold(style="color: #22c55e") {{ warrantyAnalytics.avgResolutionTime }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('warranty.avgResolution') || 'Avg Resolution (days)' }}

  //- Expiring Soon Alerts Panel
  .glass-card.p-5.rounded-2xl.mb-6(v-if="expiringWarranties.length")
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:warning-bold" size="20" class="mr-2" style="color: #f59e0b")
        | {{ $t('warranty.expiringSoonPanel') || 'Expiring Soon' }}
      el-tag(type="warning" size="small" effect="dark" round) {{ expiringWarranties.length }} {{ $t('warranty.warranties') || 'warranties' }}
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
          p.text-sm.font-bold(:style="{ color: getExpiryColor(ew.daysRemaining) }") {{ ew.daysRemaining }} {{ $t('warranty.daysLeft') || 'days left' }}
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

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="loading")
    el-table(:data="warranties" style="width: 100%" :empty-text="$t('warranty.noWarranties')")
      el-table-column(:label="$t('warranty.productService')" min-width="200")
        template(#default="{ row }")
          p.text-sm.font-bold {{ row.productName }}
          p.text-xs.text-gray-400 {{ row.clientName }}
      el-table-column(:label="$t('warranty.type')" width="140")
        template(#default="{ row }")
          el-tag(size="small" round effect="plain") {{ row.warrantyType }}
      el-table-column(:label="$t('warranty.coverage')" min-width="200")
        template(#default="{ row }")
          p.text-xs {{ row.coverage }}
      el-table-column(:label="$t('warranty.startDate')" width="110")
        template(#default="{ row }")
          span.text-xs.font-mono {{ row.startDate }}
      el-table-column(:label="$t('warranty.endDate')" width="110")
        template(#default="{ row }")
          span.text-xs.font-mono(:style="{ color: isExpiringSoon(row.endDate) ? '#f59e0b' : '' }") {{ row.endDate }}
      el-table-column(:label="$t('warranty.status')" width="100")
        template(#default="{ row }")
          el-tag(:type="row.status === 'active' ? 'success' : row.status === 'expired' ? 'danger' : 'info'" size="small" round) {{ row.status }}
      el-table-column(width="60")
        template(#default="{ row }")
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
            el-option(label="Warranty" value="Warranty")
            el-option(label="Maintenance" value="Maintenance")
            el-option(label="Support Plan" value="Support")
            el-option(label="AMC" value="AMC")
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

const { $t } = useNuxtApp();

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
const loading = ref(false);
const saving = ref(false);
const form = reactive({ productName: '', clientName: '', warrantyType: 'Warranty', coverage: '', startDate: '', endDate: '' });

// Analytics from API
const warrantyAnalytics = reactive({
  activeWarranties: 0,
  expiringSoon: 0,
  claimsFiled: 0,
  avgResolutionTime: 0
});

// Expiring warranties list
const expiringWarranties = ref<any[]>([]);

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
    }
  } catch {
    // silent
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
  } catch {
    // silent
  }
}

onMounted(() => {
  fetchWarranties();
  loadWarrantyAnalytics();
  loadExpiringWarranties();
});
</script>
