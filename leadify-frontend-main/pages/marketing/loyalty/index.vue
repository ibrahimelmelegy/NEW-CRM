<template lang="pug">
div
  ModuleHeader(
    :title="$t('marketing.loyalty.title') || 'Loyalty Programs'"
    :subtitle="$t('marketing.loyalty.subtitle') || 'Manage loyalty programs, track points, and reward your customers.'"
  )
    template(#actions)
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openProgramDialog()")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('marketing.loyalty.newProgram') || 'New Program' }}

  StatCards(:stats="summaryStats")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Tabs
  template(v-else)
    el-tabs(v-model="activeTab")
      //- Programs Tab
      el-tab-pane(:label="$t('marketing.loyalty.programs') || 'Programs'" name="programs")
        .glass-card.p-6
          .flex.items-center.justify-between.mb-4
            el-input(
              v-model="programSearch"
              :placeholder="$t('common.search') || 'Search programs'"
              clearable
              style="max-width: 280px"
              size="large"
              class="!rounded-xl"
            )
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

          el-table(:data="filteredPrograms" style="width: 100%" stripe)
            el-table-column(:label="$t('common.name') || 'Name'" prop="name" min-width="200" sortable)
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(245, 158, 11, 0.1)")
                    Icon(name="ph:crown-bold" size="18" style="color: #f59e0b")
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                    p.text-xs(v-if="row.description" style="color: var(--text-muted)") {{ row.description?.substring(0, 40) }}{{ row.description?.length > 40 ? '...' : '' }}
            el-table-column(:label="$t('common.status') || 'Status'" prop="status" width="130" sortable)
              template(#default="{ row }")
                el-tag(:type="row.status === 'ACTIVE' ? 'success' : row.status === 'DRAFT' ? 'info' : 'danger'" size="small" effect="dark") {{ row.status }}
            el-table-column(:label="$t('marketing.loyalty.pointsPerCurrency') || 'Pts/Currency'" prop="pointsPerCurrency" width="140" align="center")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: #f59e0b") {{ row.pointsPerCurrency || 0 }}
            el-table-column(:label="$t('marketing.loyalty.tiers') || 'Tiers'" width="250")
              template(#default="{ row }")
                .flex.flex-wrap.gap-1(v-if="row.tiers && row.tiers.length")
                  el-tag(v-for="tier in row.tiers" :key="tier.name" size="small" effect="plain") {{ tier.name }} ({{ tier.minPoints || 0 }}+)
                span.text-sm(v-else style="color: var(--text-muted)") --
            el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-1
                  el-button(text size="small" type="primary" @click.stop="openProgramDialog(row)")
                    Icon(name="ph:pencil-bold" size="16")
                  el-button(text size="small" type="danger" @click.stop="handleDeleteProgram(row)")
                    Icon(name="ph:trash-bold" size="16")

          .text-center.py-8(v-if="!filteredPrograms.length")
            Icon(name="ph:crown" size="48" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') || 'No programs found' }}

      //- Points History Tab
      el-tab-pane(:label="$t('marketing.loyalty.pointsHistory') || 'Points History'" name="points")
        .glass-card.p-6
          .flex.items-center.justify-between.mb-4
            el-input(
              v-model="pointsSearch"
              :placeholder="$t('common.search') || 'Search transactions'"
              clearable
              style="max-width: 280px"
              size="large"
              class="!rounded-xl"
            )
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
            el-button(size="large" type="primary" class="!rounded-2xl" @click="openPointsDialog()")
              Icon(name="ph:plus-bold" size="16")
              span.ml-1 {{ $t('marketing.loyalty.addPoints') || 'Add Points' }}

          el-table(:data="filteredPoints" style="width: 100%" stripe)
            el-table-column(:label="$t('marketing.loyalty.client') || 'Client'" prop="clientName" min-width="180" sortable)
              template(#default="{ row }")
                span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.clientName || row.clientId || '--' }}
            el-table-column(:label="$t('marketing.loyalty.program') || 'Program'" prop="programName" min-width="160")
              template(#default="{ row }")
                span.text-sm {{ row.programName || row.programId || '--' }}
            el-table-column(:label="$t('marketing.loyalty.points') || 'Points'" prop="points" width="120" align="center" sortable)
              template(#default="{ row }")
                span.text-sm.font-bold(:style="{ color: row.transactionType === 'EARN' || row.transactionType === 'BONUS' ? '#22c55e' : '#ef4444' }") {{ row.transactionType === 'EARN' || row.transactionType === 'BONUS' ? '+' : '-' }}{{ row.points }}
            el-table-column(:label="$t('common.type') || 'Type'" prop="transactionType" width="130")
              template(#default="{ row }")
                el-tag(:type="getTransactionTypeTag(row.transactionType)" size="small" effect="dark") {{ row.transactionType }}
            el-table-column(:label="$t('common.description') || 'Description'" prop="description" min-width="200")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-muted)") {{ row.description || '--' }}
            el-table-column(:label="$t('common.date') || 'Date'" prop="createdAt" width="150" sortable)
              template(#default="{ row }")
                span.text-sm {{ formatDate(row.createdAt) }}

          .text-center.py-8(v-if="!filteredPoints.length")
            Icon(name="ph:coins" size="48" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') || 'No transactions found' }}

  //- Program Dialog
  el-dialog(v-model="programDialogVisible" :title="editingProgram ? ($t('common.edit') || 'Edit Program') : ($t('marketing.loyalty.newProgram') || 'New Program')" width="560px" destroy-on-close)
    el-form(:model="programForm" label-position="top")
      el-form-item(:label="$t('common.name') || 'Program Name'" required)
        el-input(v-model="programForm.name" :placeholder="$t('marketing.loyalty.programNamePlaceholder') || 'e.g., VIP Rewards'")
      el-form-item(:label="$t('common.description') || 'Description'")
        el-input(v-model="programForm.description" type="textarea" :rows="2")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('common.status') || 'Status'")
          el-select(v-model="programForm.status" class="w-full")
            el-option(label="Draft" value="DRAFT")
            el-option(label="Active" value="ACTIVE")
            el-option(label="Inactive" value="INACTIVE")
        el-form-item(:label="$t('marketing.loyalty.pointsPerCurrency') || 'Points per Currency Unit'")
          el-input-number(v-model="programForm.pointsPerCurrency" :min="0" :step="1" class="!w-full")

      //- Tiers management
      el-form-item(:label="$t('marketing.loyalty.tiers') || 'Tiers'")
        .space-y-2
          .flex.items-center.gap-2(v-for="(tier, idx) in programForm.tiers" :key="idx")
            el-input(v-model="tier.name" :placeholder="$t('common.name') || 'Tier Name'" style="flex: 2")
            el-input-number(v-model="tier.minPoints" :min="0" :placeholder="$t('marketing.loyalty.minPoints') || 'Min Points'" style="flex: 1")
            el-button(text type="danger" @click="programForm.tiers.splice(idx, 1)")
              Icon(name="ph:x-bold" size="14")
          el-button(text type="primary" @click="programForm.tiers.push({ name: '', minPoints: 0 })")
            Icon(name="ph:plus-bold" size="14")
            span.ml-1 {{ $t('marketing.loyalty.addTier') || 'Add Tier' }}
    template(#footer)
      el-button(@click="programDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSaveProgram" :loading="saving") {{ $t('common.save') || 'Save' }}

  //- Points Dialog
  el-dialog(v-model="pointsDialogVisible" :title="$t('marketing.loyalty.addPoints') || 'Add Points Transaction'" width="500px" destroy-on-close)
    el-form(:model="pointsForm" label-position="top")
      el-form-item(:label="$t('marketing.loyalty.clientId') || 'Client ID'" required)
        el-input(v-model="pointsForm.clientId" :placeholder="$t('marketing.loyalty.clientIdPlaceholder') || 'Enter client ID'")
      el-form-item(:label="$t('marketing.loyalty.programId') || 'Program'" required)
        el-select(v-model="pointsForm.programId" class="w-full" :placeholder="$t('marketing.loyalty.selectProgram') || 'Select program'")
          el-option(v-for="p in programs" :key="p.id" :label="p.name" :value="p.id")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('marketing.loyalty.points') || 'Points'" required)
          el-input-number(v-model="pointsForm.points" :min="1" class="!w-full")
        el-form-item(:label="$t('common.type') || 'Transaction Type'" required)
          el-select(v-model="pointsForm.transactionType" class="w-full")
            el-option(label="Earn" value="EARN")
            el-option(label="Redeem" value="REDEEM")
            el-option(label="Bonus" value="BONUS")
            el-option(label="Adjustment" value="ADJUSTMENT")
      el-form-item(:label="$t('common.description') || 'Description'")
        el-input(v-model="pointsForm.description" :placeholder="$t('marketing.loyalty.descPlaceholder') || 'e.g., Purchase reward points'")
    template(#footer)
      el-button(@click="pointsDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSavePoints" :loading="saving") {{ $t('common.save') || 'Save' }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const saving = ref(false);
const activeTab = ref('programs');
const programDialogVisible = ref(false);
const pointsDialogVisible = ref(false);
const editingProgram = ref<any>(null);
const programSearch = ref('');
const pointsSearch = ref('');
const programs = ref<any[]>([]);
const points = ref<any[]>([]);

const defaultProgramForm = () => ({
  name: '',
  description: '',
  status: 'DRAFT',
  pointsPerCurrency: 1,
  tiers: [{ name: '', minPoints: 0 }] as { name: string; minPoints: number }[]
});

const defaultPointsForm = () => ({
  clientId: '',
  programId: '',
  points: 100,
  transactionType: 'EARN',
  description: ''
});

const programForm = ref(defaultProgramForm());
const pointsForm = ref(defaultPointsForm());

// Stats
const summaryStats = computed(() => {
  const totalPrograms = programs.value.length;
  const activePrograms = programs.value.filter((p: any) => p.status === 'ACTIVE').length;
  const totalEarned = points.value
    .filter((p: any) => p.transactionType === 'EARN' || p.transactionType === 'BONUS')
    .reduce((sum: number, p: any) => sum + (p.points || 0), 0);
  const totalRedeemed = points.value
    .filter((p: any) => p.transactionType === 'REDEEM')
    .reduce((sum: number, p: any) => sum + (p.points || 0), 0);
  return [
    { label: t('marketing.loyalty.totalPrograms') || 'Total Programs', value: totalPrograms, icon: 'ph:crown-bold', color: '#f59e0b' },
    { label: t('marketing.loyalty.activePrograms') || 'Active', value: activePrograms, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('marketing.loyalty.totalEarned') || 'Total Earned', value: totalEarned.toLocaleString(), icon: 'ph:trend-up-bold', color: '#3b82f6' },
    { label: t('marketing.loyalty.totalRedeemed') || 'Total Redeemed', value: totalRedeemed.toLocaleString(), icon: 'ph:gift-bold', color: '#8b5cf6' }
  ];
});

const filteredPrograms = computed(() => {
  if (!programSearch.value) return programs.value;
  const q = programSearch.value.toLowerCase();
  return programs.value.filter((p: any) => (p.name || '').toLowerCase().includes(q));
});

const filteredPoints = computed(() => {
  if (!pointsSearch.value) return points.value;
  const q = pointsSearch.value.toLowerCase();
  return points.value.filter((p: any) =>
    (p.clientName || p.clientId || '').toLowerCase().includes(q) ||
    (p.description || '').toLowerCase().includes(q)
  );
});

function getTransactionTypeTag(type: string): string {
  const map: Record<string, string> = {
    EARN: 'success',
    REDEEM: 'danger',
    BONUS: '',
    ADJUSTMENT: 'warning'
  };
  return map[type] || 'info';
}

function formatDate(d: string): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

// CRUD - Programs
async function fetchPrograms() {
  loading.value = true;
  try {
    const res = await useApiFetch('loyalty/programs');
    if (res.success && res.body) {
      programs.value = Array.isArray(res.body) ? res.body : (res.body as any).docs || [];
    }
  } catch {
    ElMessage.error(t('common.error') || 'Failed to load programs');
  } finally {
    loading.value = false;
  }
}

async function fetchPoints() {
  try {
    const res = await useApiFetch('loyalty/points');
    if (res.success && res.body) {
      points.value = Array.isArray(res.body) ? res.body : (res.body as any).docs || [];
    }
  } catch {
    // Silent - points tab may not be active
  }
}

function openProgramDialog(program?: any) {
  if (program) {
    editingProgram.value = program;
    programForm.value = {
      name: program.name || '',
      description: program.description || '',
      status: program.status || 'DRAFT',
      pointsPerCurrency: program.pointsPerCurrency || 1,
      tiers: program.tiers && program.tiers.length
        ? program.tiers.map((t: any) => ({ name: t.name, minPoints: t.minPoints || 0 }))
        : [{ name: '', minPoints: 0 }]
    };
  } else {
    editingProgram.value = null;
    programForm.value = defaultProgramForm();
  }
  programDialogVisible.value = true;
}

function openPointsDialog() {
  pointsForm.value = defaultPointsForm();
  pointsDialogVisible.value = true;
}

async function handleSaveProgram() {
  if (!programForm.value.name.trim()) {
    ElMessage.warning(t('common.fillRequired') || 'Please fill in required fields');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...programForm.value,
      tiers: programForm.value.tiers.filter((t) => t.name.trim())
    };

    if (editingProgram.value) {
      const res = await useApiFetch(`loyalty/programs/${editingProgram.value.id}`, 'PUT', payload);
      if (res.success) {
        ElMessage.success(t('common.saved') || 'Saved successfully');
      } else {
        ElMessage.error(res.message || t('common.error') || 'Save failed');
      }
    } else {
      const res = await useApiFetch('loyalty/programs', 'POST', payload);
      if (res.success) {
        ElMessage.success(t('common.saved') || 'Created successfully');
      } else {
        ElMessage.error(res.message || t('common.error') || 'Create failed');
      }
    }
    programDialogVisible.value = false;
    await fetchPrograms();
  } catch {
    ElMessage.error(t('common.error') || 'An error occurred');
  } finally {
    saving.value = false;
  }
}

async function handleDeleteProgram(program: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this program?',
      t('common.warning') || 'Warning',
      { type: 'warning', confirmButtonText: t('common.delete') || 'Delete', cancelButtonText: t('common.cancel') || 'Cancel' }
    );
    const res = await useApiFetch(`loyalty/programs/${program.id}`, 'DELETE');
    if (res.success) {
      ElMessage.success(t('common.deleted') || 'Deleted successfully');
      await fetchPrograms();
    } else {
      ElMessage.error(res.message || t('common.error') || 'Delete failed');
    }
  } catch {
    // User cancelled
  }
}

async function handleSavePoints() {
  if (!pointsForm.value.clientId.trim() || !pointsForm.value.programId) {
    ElMessage.warning(t('common.fillRequired') || 'Please fill in required fields');
    return;
  }
  saving.value = true;
  try {
    const res = await useApiFetch('loyalty/points', 'POST', { ...pointsForm.value });
    if (res.success) {
      ElMessage.success(t('common.saved') || 'Points transaction recorded');
      pointsDialogVisible.value = false;
      await fetchPoints();
    } else {
      ElMessage.error(res.message || t('common.error') || 'Failed to record transaction');
    }
  } catch {
    ElMessage.error(t('common.error') || 'An error occurred');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  fetchPrograms();
  fetchPoints();
});
</script>

<style lang="scss" scoped>
.glass-card {
  border-radius: 16px;
}
</style>
