<template lang="pug">
div
  ModuleHeader(
    :title="$t('contracts.title')"
    :subtitle="$t('contracts.subtitle')"
  )
    template(#actions)
      ExportButton(:data="filteredContracts" :columns="exportColumns" :filename="'contracts-export'" :title="$t('contracts.title')")
      el-button(size="large" type="primary" @click="openForm()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('contracts.create') }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    .px-6.mb-6
      el-input(size="large" style="height:50px; max-width: 250px" v-model="searchText" :placeholder="$t('common.search') + ' ' + $t('contracts.title')" clearable @input="debounceSearch")
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="16")

    el-table(:data="filteredContracts" v-loading="loading" style="width: 100%" :row-style="{cursor:'pointer'}" @current-change="handleRowClick")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('contracts.titleField')" min-width="200")
        template(#default="{ row }")
          .font-bold(style="color: var(--text-primary)") {{ row.title }}
      el-table-column(:label="$t('contracts.deal')" min-width="150")
        template(#default="{ row }")
          NuxtLink.text-purple-500(v-if="row.dealId" :to="`/sales/deals/${row.dealId}`" @click.stop) {{ row.deal?.name || '-' }}
          span(v-else) —
      el-table-column(:label="$t('contracts.signerName')" prop="signerName" min-width="150")
      el-table-column(:label="$t('contracts.signerEmail')" prop="signerEmail" min-width="180")
      el-table-column(:label="$t('contracts.status')" width="130")
        template(#default="{ row }")
          span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getStatusColor(row.status)}`") {{ row.status }}
      el-table-column(:label="$t('contracts.signedAt')" width="140")
        template(#default="{ row }")
          span {{ row.signedAt ? formatDate(row.signedAt) : '—' }}
      el-table-column(:label="$t('common.action')" width="160" fixed="right")
        template(#default="{ row }")
          .flex.items-center(@click.stop)
            el-dropdown(trigger="click")
              span.el-dropdown-link
                .toggle-icon.text-md
                  Icon(name="IconToggle" size="22")
              template(#dropdown)
                el-dropdown-menu
                  el-dropdown-item(@click="viewContract(row)")
                    .flex.items-center
                      Icon.text-md.mr-2(name="IconEye")
                      p.text-sm {{ $t('common.view') }}
                  el-dropdown-item(v-if="row.status === 'DRAFT'" @click="openForm(row)")
                    .flex.items-center
                      Icon.text-md.mr-2(name="IconEdit")
                      p.text-sm {{ $t('common.edit') }}
                  el-dropdown-item(v-if="row.status === 'DRAFT' && row.signerEmail" @click="handleSend(row.id)")
                    .flex.items-center
                      Icon.text-md.mr-2(name="ph:paper-plane-tilt-bold")
                      p.text-sm {{ $t('contracts.send') || 'Send' }}
                  el-dropdown-item(v-if="row.status === 'DRAFT'" @click="[deleteId = row.id, deletePopup = true]")
                    .flex.items-center
                      Icon.text-md.mr-2(name="IconDelete")
                      p.text-sm {{ $t('common.delete') }}
      template(#empty)
        el-empty(:description="$t('contracts.noContracts')" image="/images/empty.png")

  //- Create/Edit Dialog
  el-dialog(v-model="showForm" :title="editingId ? $t('contracts.edit') : $t('contracts.create')" width="700px" :close-on-click-modal="false")
    el-form(ref="formRef" :model="form" label-position="top" size="large")
      el-form-item(:label="$t('contracts.titleField')")
        el-input(v-model="form.title" :placeholder="$t('contracts.titlePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('contracts.signerName')")
          el-input(v-model="form.signerName")
        el-form-item(:label="$t('contracts.signerEmail')")
          el-input(v-model="form.signerEmail" type="email")
      el-form-item(:label="$t('contracts.dealOptional')")
        el-select(v-model="form.dealId" class="w-full" clearable :placeholder="$t('contracts.selectDeal')")
          el-option(v-for="d in deals" :key="d.id" :label="d.name" :value="d.id")
      el-form-item(:label="$t('contracts.content')")
        el-input(v-model="form.content" type="textarea" :rows="10" :placeholder="$t('contracts.contentPlaceholder')")
    template(#footer)
      el-button(@click="showForm = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveContract" class="!rounded-2xl") {{ $t('common.save') }}

  //- View Contract Dialog
  el-dialog(v-model="showView" :title="viewItem?.title" width="700px")
    .space-y-4(v-if="viewItem")
      .grid.grid-cols-2.gap-4
        div
          .text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.status') }}
          .mt-1: span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getStatusColor(viewItem.status)}`") {{ viewItem.status }}
        div
          .text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.deal') }}
          p(style="color: var(--text-primary)") {{ viewItem.deal?.name || '—' }}
        div
          .text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.signerName') }}
          p(style="color: var(--text-primary)") {{ viewItem.signerName || '—' }}
        div
          .text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.signerEmail') }}
          p(style="color: var(--text-primary)") {{ viewItem.signerEmail || '—' }}
        div(v-if="viewItem.signedAt")
          .text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.signedAt') }}
          p(style="color: var(--text-primary)") {{ formatDate(viewItem.signedAt) }}
      .glass-card.p-4(v-if="viewItem.content")
        .whitespace-pre-wrap.text-sm(style="color: var(--text-primary)") {{ viewItem.content }}

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import {
  fetchContracts, createContract, updateContract, deleteContract, sendForSignature,
  getContractStatusType, type Contract
} from '~/composables/useContracts';
import { getDeals } from '~/composables/useDeals';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;

// Export columns
const exportColumns = [
  { prop: 'title', label: t('contracts.titleField') },
  { prop: 'signerName', label: t('contracts.signerName') },
  { prop: 'signerEmail', label: t('contracts.signerEmail') },
  { prop: 'status', label: t('contracts.status') },
  { prop: 'signedAt', label: t('contracts.signedAt') }
];

const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const contracts = ref<Contract[]>([]);
const deals = ref<any[]>([]);
const showForm = ref(false);
const showView = ref(false);
const deletePopup = ref(false);
const deleteId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const viewItem = ref<Contract | null>(null);
const searchText = ref('');
const form = ref({ title: '', content: '', signerName: '', signerEmail: '', dealId: '' as string | null });

const summaryStats = computed(() => {
  const all = contracts.value;
  const draft = all.filter(c => c.status === 'DRAFT').length;
  const sent = all.filter(c => c.status === 'SENT').length;
  const signed = all.filter(c => c.status === 'SIGNED').length;
  return [
    { label: t('contracts.allContracts'), value: all.length, icon: 'ph:file-text-bold', color: '#7849ff' },
    { label: t('contracts.draft') || 'Draft', value: draft, icon: 'ph:pencil-bold', color: '#64748b' },
    { label: t('contracts.sent') || 'Sent', value: sent, icon: 'ph:paper-plane-tilt-bold', color: '#3b82f6' },
    { label: t('contracts.signed') || 'Signed', value: signed, icon: 'ph:check-circle-bold', color: '#22c55e' }
  ];
});

const filteredContracts = computed(() => {
  if (!searchText.value) return contracts.value;
  const s = searchText.value.toLowerCase();
  return contracts.value.filter(c =>
    c.title?.toLowerCase().includes(s) || c.signerName?.toLowerCase().includes(s) || c.signerEmail?.toLowerCase().includes(s)
  );
});

let debounceTimer: ReturnType<typeof setTimeout>;
function debounceSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {}, 300);
}

onMounted(async () => {
  const [contractsData, dealsData] = await Promise.all([fetchContracts(), getDeals(false)]);
  contracts.value = contractsData;
  deals.value = dealsData.deals || [];
  loading.value = false;
});

function formatDate(d: string) { return new Date(d).toLocaleDateString(); }

function handleRowClick(row: Contract) {
  viewContract(row);
}

function openForm(contract?: Contract) {
  if (contract) {
    editingId.value = contract.id;
    form.value = { title: contract.title, content: contract.content || '', signerName: contract.signerName || '', signerEmail: contract.signerEmail || '', dealId: contract.dealId || null };
  } else {
    editingId.value = null;
    form.value = { title: '', content: '', signerName: '', signerEmail: '', dealId: null };
  }
  showForm.value = true;
}

function viewContract(contract: Contract) {
  viewItem.value = contract;
  showView.value = true;
}

async function saveContract() {
  saving.value = true;
  try {
    if (editingId.value) {
      await updateContract(editingId.value, form.value);
    } else {
      await createContract(form.value);
    }
    contracts.value = await fetchContracts();
    showForm.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') || 'Saved' });
  } finally { saving.value = false; }
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    await deleteContract(deleteId.value);
    contracts.value = contracts.value.filter(c => c.id !== deleteId.value);
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
  } finally {
    deleting.value = false;
    deletePopup.value = false;
  }
}

async function handleSend(id: string) {
  await sendForSignature(id);
  contracts.value = await fetchContracts();
  ElNotification({ type: 'success', title: t('common.success'), message: t('contracts.sent') || 'Sent for signature' });
}
</script>
