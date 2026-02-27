<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('warranty.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('warranty.subtitle') }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:shield-check" size="16" style="margin-right: 4px;")
      | {{ $t('warranty.addWarranty') }}

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
const showDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const form = reactive({ productName: '', clientName: '', warrantyType: 'Warranty', coverage: '', startDate: '', endDate: '' });

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
    const { body, success } = await useApiFetch('warranty', 'GET');
    if (success && body) {
      warranties.value = body;
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

onMounted(() => {
  fetchWarranties();
});
</script>
