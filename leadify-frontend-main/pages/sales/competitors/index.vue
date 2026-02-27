<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('competitors.title') || 'Competitor Tracking'" :subtitle="$t('competitors.subtitle') || 'Monitor competitors and track win/loss analysis.'")
    template(#actions)
      el-button(type="primary" size="large" @click="openCreateDialog" class="premium-btn")
        Icon(name="ph:binoculars-bold" size="20")
        span.mx-1 {{ $t('competitors.add') || 'Add Competitor' }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    el-table(:data="items" v-loading="loading" style="width: 100%")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('competitors.name') || 'Name'" min-width="160")
        template(#default="{ row }")
          span.font-bold {{ row.name || '—' }}
      el-table-column(:label="$t('competitors.website') || 'Website'" min-width="160")
        template(#default="{ row }")
          a.text-blue-400.underline(v-if="row.website" :href="row.website" target="_blank" @click.stop) {{ row.website }}
          span(v-else) —
      el-table-column(:label="$t('competitors.industry') || 'Industry'" width="140")
        template(#default="{ row }")
          span {{ row.industry || '—' }}
      el-table-column(:label="$t('competitors.threatLevel') || 'Threat Level'" width="130")
        template(#default="{ row }")
          el-tag(:type="threatType(row.threatLevel)" size="small" round) {{ row.threatLevel || '—' }}
      el-table-column(:label="$t('competitors.dealsWon') || 'Deals Won'" width="110" align="center")
        template(#default="{ row }")
          span.font-bold.text-green-500 {{ row.dealsWon ?? 0 }}
      el-table-column(:label="$t('competitors.dealsLost') || 'Deals Lost'" width="110" align="center")
        template(#default="{ row }")
          span.font-bold.text-red-500 {{ row.dealsLost ?? 0 }}
      el-table-column(:label="$t('competitors.status') || 'Status'" width="120")
        template(#default="{ row }")
          el-tag(:type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small" round) {{ row.status || '—' }}
      el-table-column(:label="$t('common.action') || ''" width="100" fixed="right")
        template(#default="{ row }")
          el-button(text circle size="small" type="primary" @click="openEditDialog(row)")
            Icon(name="ph:pencil-simple" size="14")
          el-button(text circle size="small" type="danger" @click="handleDelete(row.id)")
            Icon(name="ph:trash" size="14")
      template(#empty)
        el-empty(:description="$t('common.noData') || 'No competitors tracked yet'")

  el-dialog(v-model="showDialog" :title="editingId ? ($t('competitors.edit') || 'Edit Competitor') : ($t('competitors.add') || 'Add Competitor')" width="600px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('competitors.name') || 'Name'" required)
          el-input(v-model="form.name" :placeholder="$t('competitors.namePlaceholder') || 'Competitor name'")
        el-form-item(:label="$t('competitors.website') || 'Website'")
          el-input(v-model="form.website" placeholder="https://")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('competitors.industry') || 'Industry'")
          el-input(v-model="form.industry" :placeholder="$t('competitors.industryPlaceholder') || 'e.g. SaaS, Finance'")
        el-form-item(:label="$t('competitors.threatLevel') || 'Threat Level'")
          el-select(v-model="form.threatLevel" class="w-full")
            el-option(label="Low" value="LOW")
            el-option(label="Medium" value="MEDIUM")
            el-option(label="High" value="HIGH")
            el-option(label="Critical" value="CRITICAL")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('competitors.status') || 'Status'")
          el-select(v-model="form.status" class="w-full")
            el-option(label="Active" value="ACTIVE")
            el-option(label="Inactive" value="INACTIVE")
        el-form-item(:label="$t('competitors.dealsWon') || 'Deals Won'")
          el-input-number(v-model="form.dealsWon" :min="0" class="w-full")
      el-form-item(:label="$t('competitors.strengths') || 'Strengths'")
        el-input(v-model="form.strengths" type="textarea" :rows="2" :placeholder="$t('competitors.strengthsPlaceholder') || 'Key strengths...'")
      el-form-item(:label="$t('competitors.weaknesses') || 'Weaknesses'")
        el-input(v-model="form.weaknesses" type="textarea" :rows="2" :placeholder="$t('competitors.weaknessesPlaceholder') || 'Key weaknesses...'")
      el-form-item(:label="$t('competitors.notes') || 'Notes'")
        el-input(v-model="form.notes" type="textarea" :rows="2")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="saveItem") {{ $t('common.save') || 'Save' }}
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });

const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const editingId = ref<number | null>(null);
const items = ref<any[]>([]);

const defaultForm = () => ({
  name: '',
  website: '',
  industry: '',
  threatLevel: 'MEDIUM',
  status: 'ACTIVE',
  strengths: '',
  weaknesses: '',
  notes: '',
  dealsWon: 0,
  dealsLost: 0
});

const form = reactive(defaultForm());

const summaryStats = computed(() => {
  const total = items.value.length;
  const active = items.value.filter(i => i.status === 'ACTIVE').length;
  const totalWon = items.value.reduce((s, i) => s + Number(i.dealsWon || 0), 0);
  const totalLost = items.value.reduce((s, i) => s + Number(i.dealsLost || 0), 0);
  const winRate = (totalWon + totalLost) > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0;
  return [
    { label: 'Total Competitors', value: total, icon: 'ph:binoculars-bold', color: '#7849ff' },
    { label: 'Active Threats', value: active, icon: 'ph:warning-bold', color: '#ef4444' },
    { label: 'Deals Won (Us)', value: totalWon, icon: 'ph:trophy-bold', color: '#22c55e' },
    { label: 'Win Rate', value: winRate + '%', icon: 'ph:chart-line-up-bold', color: '#3b82f6' }
  ];
});

onMounted(() => fetchData());

async function fetchData() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('competitors?limit=100');
    if (success && body) items.value = (body as any).docs || [];
  } finally { loading.value = false; }
}

function openCreateDialog() {
  editingId.value = null;
  Object.assign(form, defaultForm());
  showDialog.value = true;
}

function openEditDialog(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name || '',
    website: row.website || '',
    industry: row.industry || '',
    threatLevel: row.threatLevel || 'MEDIUM',
    status: row.status || 'ACTIVE',
    strengths: row.strengths || '',
    weaknesses: row.weaknesses || '',
    notes: row.notes || '',
    dealsWon: row.dealsWon ?? 0,
    dealsLost: row.dealsLost ?? 0
  });
  showDialog.value = true;
}

async function saveItem() {
  if (!form.name?.trim()) {
    ElMessage.warning('Name is required');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      const { success } = await useApiFetch(`competitors/${editingId.value}`, 'PUT', { ...form });
      if (success) { showDialog.value = false; ElMessage.success('Competitor updated'); await fetchData(); }
    } else {
      const { success } = await useApiFetch('competitors', 'POST', { ...form });
      if (success) { showDialog.value = false; ElMessage.success('Competitor added'); await fetchData(); }
    }
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  const { success } = await useApiFetch(`competitors/${id}`, 'DELETE');
  if (success) { ElMessage.success('Deleted'); await fetchData(); }
}

function threatType(level: string) {
  return { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger', CRITICAL: 'danger' }[level] || 'info';
}
</script>
