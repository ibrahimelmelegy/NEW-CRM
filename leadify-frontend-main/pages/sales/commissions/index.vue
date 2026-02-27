<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('commissions.title') || 'Sales Commissions'" :subtitle="$t('commissions.subtitle') || 'Track and manage sales team commissions.'")
    template(#actions)
      el-button(type="primary" size="large" @click="showDialog = true" class="premium-btn")
        Icon(name="ph:currency-dollar-bold" size="20")
        span.mx-1 {{ $t('commissions.add') || 'Add Commission' }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    el-table(:data="items" v-loading="loading" style="width: 100%")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('commissions.staff') || 'Staff'" min-width="160")
        template(#default="{ row }")
          span.font-bold {{ row.staff?.name || '—' }}
      el-table-column(:label="$t('commissions.deal') || 'Deal'" min-width="160")
        template(#default="{ row }")
          span {{ row.deal?.name || '—' }}
      el-table-column(:label="$t('commissions.amount') || 'Amount'" width="130" align="right")
        template(#default="{ row }")
          span.font-bold {{ Number(row.amount || 0).toLocaleString() }} SAR
      el-table-column(:label="$t('commissions.rate') || 'Rate'" width="90" align="center")
        template(#default="{ row }")
          span {{ row.rate ? row.rate + '%' : '—' }}
      el-table-column(:label="$t('commissions.status') || 'Status'" width="130")
        template(#default="{ row }")
          el-dropdown(trigger="click" @command="(cmd) => updateStatus(row.id, cmd)")
            el-tag(:type="statusType(row.status)" size="small" round style="cursor:pointer") {{ row.status }}
            template(#dropdown)
              el-dropdown-menu
                el-dropdown-item(command="PENDING") Pending
                el-dropdown-item(command="APPROVED") Approved
                el-dropdown-item(command="PAID") Paid
                el-dropdown-item(command="REJECTED") Rejected
      el-table-column(:label="$t('common.date') || 'Date'" width="120")
        template(#default="{ row }")
          span.text-xs.font-mono {{ new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) }}
      el-table-column(:label="$t('common.action') || ''" width="80" fixed="right")
        template(#default="{ row }")
          el-button(text circle size="small" type="danger" @click="handleDelete(row.id)")
            Icon(name="ph:trash" size="14")
      template(#empty)
        el-empty(:description="$t('common.noData') || 'No commissions yet'")

  el-dialog(v-model="showDialog" :title="$t('commissions.add') || 'Add Commission'" width="500px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('commissions.amount') || 'Amount'")
          el-input-number(v-model="form.amount" :min="0" :precision="2" class="w-full")
        el-form-item(:label="$t('commissions.rate') || 'Rate %'")
          el-input-number(v-model="form.rate" :min="0" :max="100" :precision="2" class="w-full")
      el-form-item(:label="$t('commissions.dealValue') || 'Deal Value'")
        el-input-number(v-model="form.dealValue" :min="0" :precision="2" class="w-full")
      el-form-item(:label="$t('commissions.notes') || 'Notes'")
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
const items = ref<any[]>([]);
const form = reactive({ amount: 0, rate: 5, dealValue: 0, notes: '' });

const summaryStats = computed(() => {
  const total = items.value.reduce((s, i) => s + Number(i.amount || 0), 0);
  const pending = items.value.filter(i => i.status === 'PENDING').reduce((s, i) => s + Number(i.amount || 0), 0);
  const paid = items.value.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.amount || 0), 0);
  return [
    { label: 'Total Commissions', value: items.value.length, icon: 'ph:currency-dollar-bold', color: '#7849ff' },
    { label: 'Pending', value: pending.toLocaleString() + ' SAR', icon: 'ph:hourglass-bold', color: '#f59e0b' },
    { label: 'Paid', value: paid.toLocaleString() + ' SAR', icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: 'Total Value', value: total.toLocaleString() + ' SAR', icon: 'ph:money-bold', color: '#3b82f6' }
  ];
});

onMounted(() => fetchData());

async function fetchData() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('commissions?limit=100');
    if (success && body) items.value = (body as any).docs || [];
  } finally { loading.value = false; }
}

async function saveItem() {
  saving.value = true;
  try {
    const { success } = await useApiFetch('commissions', 'POST', { ...form, status: 'PENDING' });
    if (success) { showDialog.value = false; ElMessage.success('Commission added'); await fetchData(); }
  } finally { saving.value = false; }
}

async function updateStatus(id: number, status: string) {
  await useApiFetch(`commissions/${id}`, 'PUT', { status });
  await fetchData();
}

async function handleDelete(id: number) {
  const { success } = await useApiFetch(`commissions/${id}`, 'DELETE');
  if (success) { ElMessage.success('Deleted'); await fetchData(); }
}

function statusType(s: string) {
  return { PENDING: 'warning', APPROVED: '', PAID: 'success', REJECTED: 'danger' }[s] || '';
}
</script>
