<template lang="pug">
.contracts-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('contracts.title') }}
    p(style="color: var(--text-muted)") {{ $t('contracts.subtitle') }}

  .glass-card.p-6
    .flex.justify-between.items-center.mb-6
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('contracts.allContracts') }}
      el-button(type="primary" @click="openForm()" class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
        Icon(name="ph:plus-bold" size="16" aria-hidden="true")
        span.ml-2 {{ $t('contracts.create') }}

    el-skeleton(:rows="3" animated v-if="loading")

    el-table(:data="contracts" v-else style="width: 100%")
      el-table-column(:label="$t('contracts.titleField')" prop="title" min-width="200")
      el-table-column(:label="$t('contracts.deal')" min-width="150")
        template(#default="{ row }")
          span {{ row.deal?.name || '-' }}
      el-table-column(:label="$t('contracts.signerEmail')" prop="signerEmail" min-width="180")
      el-table-column(:label="$t('contracts.status')" width="120")
        template(#default="{ row }")
          el-tag(:type="getStatusType(row.status)" size="small" effect="dark") {{ row.status }}
      el-table-column(:label="$t('contracts.signedAt')" width="140")
        template(#default="{ row }")
          span {{ row.signedAt ? formatDate(row.signedAt) : '-' }}
      el-table-column(:label="$t('common.actions')" width="220" align="center")
        template(#default="{ row }")
          .flex.gap-1.justify-center
            el-button(link @click="viewContract(row)" size="small")
              Icon(name="ph:eye" size="16" aria-label="View")
            el-button(link @click="openForm(row)" size="small" v-if="row.status === 'DRAFT'")
              Icon(name="ph:pencil" size="16" aria-label="Edit")
            el-button(link @click="handleSend(row.id)" size="small" v-if="row.status === 'DRAFT' && row.signerEmail")
              Icon(name="ph:paper-plane-tilt" size="16" aria-label="Send")
            el-button(link @click="removeContract(row.id)" size="small" v-if="row.status === 'DRAFT'")
              Icon(name="ph:trash" size="16" class="text-red-400" aria-label="Delete")

    .text-center.py-8(v-if="!loading && !contracts.length")
      Icon(name="ph:file-text" size="48" style="color: var(--text-muted)" aria-hidden="true")
      p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('contracts.noContracts') }}

  //- Create/Edit Dialog
  el-dialog(v-model="showForm" :title="editingId ? $t('contracts.edit') : $t('contracts.create')" width="700px" :close-on-click-modal="false")
    .space-y-4
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('contracts.titleField') }}
        el-input(v-model="form.title" :placeholder="$t('contracts.titlePlaceholder')")
      .grid.grid-cols-2.gap-4
        .form-group
          label.block.text-sm.font-medium.mb-2 {{ $t('contracts.signerName') }}
          el-input(v-model="form.signerName")
        .form-group
          label.block.text-sm.font-medium.mb-2 {{ $t('contracts.signerEmail') }}
          el-input(v-model="form.signerEmail" type="email")
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('contracts.dealOptional') }}
        el-select(v-model="form.dealId" class="w-full" clearable :placeholder="$t('contracts.selectDeal')")
          el-option(v-for="d in deals" :key="d.id" :label="d.name" :value="d.id")
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('contracts.content') }}
        el-input(v-model="form.content" type="textarea" :rows="10" :placeholder="$t('contracts.contentPlaceholder')")

    template(#footer)
      el-button(@click="showForm = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveContract" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('common.save') }}

  //- View Contract Dialog
  el-dialog(v-model="showView" :title="viewItem?.title" width="700px")
    .space-y-4(v-if="viewItem")
      .grid.grid-cols-2.gap-4
        div
          label.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.status') }}
          p.font-bold(style="color: var(--text-primary)")
            el-tag(:type="getStatusType(viewItem.status)" effect="dark") {{ viewItem.status }}
        div
          label.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.deal') }}
          p(style="color: var(--text-primary)") {{ viewItem.deal?.name || '-' }}
        div
          label.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.signerName') }}
          p(style="color: var(--text-primary)") {{ viewItem.signerName || '-' }}
        div
          label.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.signerEmail') }}
          p(style="color: var(--text-primary)") {{ viewItem.signerEmail || '-' }}
        div(v-if="viewItem.signedAt")
          label.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.signedAt') }}
          p(style="color: var(--text-primary)") {{ formatDate(viewItem.signedAt) }}
        div(v-if="viewItem.signatureHash")
          label.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('contracts.signatureHash') }}
          p.text-xs.font-mono(style="color: var(--text-muted)") {{ viewItem.signatureHash }}
      .p-4.rounded-xl(style="background: var(--bg-input); border: 1px solid var(--border-default)" v-if="viewItem.content")
        .whitespace-pre-wrap.text-sm(style="color: var(--text-primary)") {{ viewItem.content }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  fetchContracts, createContract, updateContract, deleteContract, sendForSignature,
  getContractStatusType, type Contract
} from '~/composables/useContracts';
import { getDeals } from '~/composables/useDeals';

const loading = ref(true);
const saving = ref(false);
const contracts = ref<Contract[]>([]);
const deals = ref<any[]>([]);
const showForm = ref(false);
const showView = ref(false);
const editingId = ref<string | null>(null);
const viewItem = ref<Contract | null>(null);
const form = ref({ title: '', content: '', signerName: '', signerEmail: '', dealId: '' as string | null });

const getStatusType = getContractStatusType;

onMounted(async () => {
  const [contractsData, dealsData] = await Promise.all([fetchContracts(), getDeals(false)]);
  contracts.value = contractsData;
  deals.value = dealsData.deals || [];
  loading.value = false;
});

function formatDate(d: string) { return new Date(d).toLocaleDateString(); }

function openForm(contract?: Contract) {
  if (contract) {
    editingId.value = contract.id;
    form.value = {
      title: contract.title,
      content: contract.content || '',
      signerName: contract.signerName || '',
      signerEmail: contract.signerEmail || '',
      dealId: contract.dealId || null
    };
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
  if (editingId.value) {
    await updateContract(editingId.value, form.value);
  } else {
    await createContract(form.value);
  }
  contracts.value = await fetchContracts();
  showForm.value = false;
  saving.value = false;
}

async function removeContract(id: string) {
  await deleteContract(id);
  contracts.value = contracts.value.filter(c => c.id !== id);
}

async function handleSend(id: string) {
  await sendForSignature(id);
  contracts.value = await fetchContracts();
}
</script>
