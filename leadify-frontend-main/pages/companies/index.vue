<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 🏢 Company Directory
      p.text-sm.mt-1(style="color: var(--text-muted);") Manage companies, link contacts, and track organizational relationships.
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:buildings" size="16" style="margin-right: 4px;")
      | Add Company

  .grid.grid-cols-3.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total Companies
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ companies.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Active
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ companies.filter(c => c.status === 'active').length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Industries
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ new Set(companies.map(c => c.industry)).size }}

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    el-table(:data="companies" style="width: 100%" empty-text="No companies added yet.")
      el-table-column(label="Company" min-width="250")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center.text-white.font-bold.text-sm(:style="{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }") {{ row.name.slice(0,2).toUpperCase() }}
            div
              p.text-sm.font-bold {{ row.name }}
              p.text-xs.text-gray-400 {{ row.industry }}
      el-table-column(label="Website" width="200")
        template(#default="{ row }")
          a.text-xs.text-violet-600(v-if="row.website" :href="row.website" target="_blank") {{ row.website }}
          span.text-gray-400(v-else) —
      el-table-column(label="Contacts" width="100" align="center")
        template(#default="{ row }")
          el-badge(:value="row.contactCount" type="primary")
      el-table-column(label="Revenue" width="140" align="right")
        template(#default="{ row }")
          span.font-mono.font-bold.text-sm {{ row.annualRevenue?.toLocaleString() || '—' }}
      el-table-column(label="Status" width="100")
        template(#default="{ row }")
          el-tag(:type="row.status === 'active' ? 'success' : 'info'" size="small" round) {{ row.status }}
      el-table-column(width="60")
        template(#default="{ row }")
          el-button(text circle size="small" type="danger" @click="removeCompany(row.id)")
            Icon(name="ph:trash" size="14")

  el-dialog(v-model="showDialog" title="Add Company" width="560px")
    el-form(label-position="top" size="large")
      el-form-item(label="Company Name")
        el-input(v-model="form.name" placeholder="Acme Corp")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Industry")
          el-select(v-model="form.industry" class="w-full")
            el-option(label="Technology" value="Technology")
            el-option(label="Finance" value="Finance")
            el-option(label="Healthcare" value="Healthcare")
            el-option(label="Manufacturing" value="Manufacturing")
            el-option(label="Real Estate" value="Real Estate")
            el-option(label="Retail" value="Retail")
            el-option(label="Education" value="Education")
            el-option(label="Other" value="Other")
        el-form-item(label="Status")
          el-select(v-model="form.status" class="w-full")
            el-option(label="Active" value="active")
            el-option(label="Prospect" value="prospect")
            el-option(label="Inactive" value="inactive")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Website")
          el-input(v-model="form.website" placeholder="https://...")
        el-form-item(label="Annual Revenue")
          el-input-number(v-model="form.annualRevenue" :min="0" class="!w-full")
    template(#footer)
      el-button(@click="showDialog = false") Cancel
      el-button(type="primary" @click="saveCompany" style="border-radius: 12px;") Save
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
definePageMeta({ layout: 'main', middleware: 'auth' });

interface Company { id: string; name: string; industry: string; website: string; status: string; annualRevenue: number; contactCount: number; }
const KEY = 'crm_companies';
const companies = ref<Company[]>(JSON.parse(localStorage.getItem(KEY) || '[]'));
const showDialog = ref(false);
const form = reactive({ name: '', industry: 'Technology', website: '', status: 'active', annualRevenue: 0 });

function saveCompany() {
  companies.value.unshift({ ...form, id: `co_${Date.now()}`, contactCount: 0 });
  localStorage.setItem(KEY, JSON.stringify(companies.value));
  Object.assign(form, { name: '', industry: 'Technology', website: '', status: 'active', annualRevenue: 0 });
  showDialog.value = false;
  ElMessage.success('Company added!');
}
function removeCompany(id: string) {
  companies.value = companies.value.filter(c => c.id !== id);
  localStorage.setItem(KEY, JSON.stringify(companies.value));
}
</script>
