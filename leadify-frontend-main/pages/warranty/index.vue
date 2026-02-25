<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 🎫 Warranty & Service Contracts
      p.text-sm.mt-1(style="color: var(--text-muted);") Track warranties, maintenance agreements, and service contract expiry.
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:shield-check" size="16" style="margin-right: 4px;")
      | Add Warranty

  .grid.grid-cols-4.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ warranties.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Active
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ warranties.filter(w => w.status === 'active').length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Expiring Soon
      p.text-3xl.font-black.mt-1(style="color: #f59e0b;") {{ expiringSoon.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Expired
      p.text-3xl.font-black.mt-1(style="color: #ef4444;") {{ warranties.filter(w => w.status === 'expired').length }}

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    el-table(:data="warranties" style="width: 100%" empty-text="No warranties or service contracts.")
      el-table-column(label="Product/Service" min-width="200")
        template(#default="{ row }")
          p.text-sm.font-bold {{ row.productName }}
          p.text-xs.text-gray-400 {{ row.clientName }}
      el-table-column(label="Type" width="140")
        template(#default="{ row }")
          el-tag(size="small" round effect="plain") {{ row.warrantyType }}
      el-table-column(label="Coverage" min-width="200")
        template(#default="{ row }")
          p.text-xs {{ row.coverage }}
      el-table-column(label="Start" width="110")
        template(#default="{ row }")
          span.text-xs.font-mono {{ row.startDate }}
      el-table-column(label="End" width="110")
        template(#default="{ row }")
          span.text-xs.font-mono(:style="{ color: isExpiringSoon(row.endDate) ? '#f59e0b' : '' }") {{ row.endDate }}
      el-table-column(label="Status" width="100")
        template(#default="{ row }")
          el-tag(:type="row.status === 'active' ? 'success' : row.status === 'expired' ? 'danger' : 'info'" size="small" round) {{ row.status }}
      el-table-column(width="60")
        template(#default="{ row }")
          el-button(text circle size="small" type="danger" @click="removeWarranty(row.id)")
            Icon(name="ph:trash" size="14")

  el-dialog(v-model="showDialog" title="Add Warranty / Service Contract" width="560px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Product/Service Name")
          el-input(v-model="form.productName")
        el-form-item(label="Client")
          el-input(v-model="form.clientName")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Type")
          el-select(v-model="form.warrantyType" class="w-full")
            el-option(label="Warranty" value="Warranty")
            el-option(label="Maintenance" value="Maintenance")
            el-option(label="Support Plan" value="Support")
            el-option(label="AMC" value="AMC")
        el-form-item(label="Coverage")
          el-input(v-model="form.coverage" placeholder="Parts & labor for 2 years")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Start Date")
          el-date-picker(v-model="form.startDate" type="date" class="!w-full")
        el-form-item(label="End Date")
          el-date-picker(v-model="form.endDate" type="date" class="!w-full")
    template(#footer)
      el-button(@click="showDialog = false") Cancel
      el-button(type="primary" @click="saveWarranty" style="border-radius: 12px;") Save
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
definePageMeta({});
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
const KEY = 'crm_warranties';
const warranties = ref<Warranty[]>(JSON.parse(localStorage.getItem(KEY) || '[]'));
const showDialog = ref(false);
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

function saveWarranty() {
  warranties.value.unshift({
    ...form,
    id: `war_${Date.now()}`,
    status: 'active',
    startDate: form.startDate ? new Date(form.startDate).toISOString().slice(0, 10) : '',
    endDate: form.endDate ? new Date(form.endDate).toISOString().slice(0, 10) : ''
  });
  localStorage.setItem(KEY, JSON.stringify(warranties.value));
  Object.assign(form, { productName: '', clientName: '', warrantyType: 'Warranty', coverage: '', startDate: '', endDate: '' });
  showDialog.value = false;
  ElMessage.success('Warranty added!');
}
function removeWarranty(id: string) {
  warranties.value = warranties.value.filter(w => w.id !== id);
  localStorage.setItem(KEY, JSON.stringify(warranties.value));
}
</script>
