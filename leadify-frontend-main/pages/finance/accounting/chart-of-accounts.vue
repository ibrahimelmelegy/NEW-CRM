<template lang="pug">
div
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold {{ $t('finance.chartOfAccountsTitle') }}
      p.text-gray-500.mt-1 {{ $t('finance.manageAccountStructure') }}
    .flex.gap-3
      el-button(type="default" size="large" @click="handleSeedDefaults" :loading="seeding")
        span {{ $t('finance.seedDefaults') }}
      el-button(type="primary" size="large" @click="openCreateDialog")
        span {{ $t('finance.addAccount') }}

  el-card(shadow="never")
    AccountingAccountTree(
      :accounts="accounts"
      @node-click="handleNodeClick"
    )

  //- Create / Edit Dialog
  el-dialog(
    v-model="dialogVisible"
    :title="editingAccount ? $t('finance.editAccount') : $t('finance.newAccount')"
    width="520px"
    destroy-on-close
  )
    el-form(
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
    )
      el-form-item(:label="$t('finance.accountCode')" prop="code")
        el-input(v-model="formData.code" placeholder="e.g. 1100")
      el-form-item(:label="$t('finance.accountName')" prop="name")
        el-input(v-model="formData.name" placeholder="e.g. Cash")
      el-form-item(:label="$t('finance.accountType')" prop="type")
        el-select(v-model="formData.type" :placeholder="$t('finance.chartOfAccounts.selectType')" class="w-full")
          el-option(
            v-for="t in accountTypes"
            :key="t.value"
            :label="t.label"
            :value="t.value"
          )
      el-form-item(:label="$t('finance.parentAccount')")
        el-select(v-model="formData.parentId" :placeholder="$t('finance.chartOfAccounts.noneToplevel')" clearable filterable class="w-full")
          el-option(
            v-for="acc in flatAccounts"
            :key="acc.id"
            :label="`${acc.code} - ${acc.name}`"
            :value="acc.id"
          )
      el-form-item(:label="$t('finance.isGroupAccount')")
        el-switch(v-model="formData.isGroup")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="formData.description" type="textarea" :rows="3" :placeholder="$t('finance.chartOfAccounts.optionalDescription')")
    template(#footer)
      .flex.justify-between
        el-button(v-if="editingAccount" type="danger" plain @click="handleDelete" :loading="deleting") {{ $t('common.delete') }}
        div(v-else)
        .flex.gap-2
          el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
          el-button(type="primary" @click="handleSubmit" :loading="saving") {{ editingAccount ? $t('common.update') : $t('common.create') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules } from 'element-plus';
import { fetchChartOfAccounts, createAccount, updateAccount, deleteAccount, seedDefaultAccounts, AccountType } from '~/composables/useAccounting';
import type { ChartOfAccountsItem } from '~/composables/useAccounting';

const { t } = useI18n();

definePageMeta({ middleware: 'permissions' });

const accounts = ref<ChartOfAccountsItem[]>([]);
const dialogVisible = ref(false);
const editingAccount = ref<ChartOfAccountsItem | null>(null);
const saving = ref(false);
const deleting = ref(false);
const seeding = ref(false);
const formRef = ref<FormInstance>();

const accountTypes = [
  { label: 'Asset', value: AccountType.ASSET },
  { label: 'Liability', value: AccountType.LIABILITY },
  { label: 'Equity', value: AccountType.EQUITY },
  { label: 'Revenue', value: AccountType.REVENUE },
  { label: 'Expense', value: AccountType.EXPENSE }
];

const formData = ref({
  code: '',
  name: '',
  type: '' as string,
  parentId: '' as string,
  isGroup: false,
  description: ''
});

const formRules: FormRules = {
  code: [{ required: true, message: 'Account code is required', trigger: 'blur' }],
  name: [{ required: true, message: 'Account name is required', trigger: 'blur' }],
  type: [{ required: true, message: 'Account type is required', trigger: 'change' }]
};

// Flatten tree for parent selector
const flatAccounts = computed(() => {
  const flat: ChartOfAccountsItem[] = [];
  const traverse = (list: ChartOfAccountsItem[]) => {
    for (const acc of list) {
      flat.push(acc);
      if (acc.children && acc.children.length > 0) traverse(acc.children);
    }
  };
  traverse(accounts.value);
  return flat;
});

async function loadAccounts() {
  accounts.value = await fetchChartOfAccounts();
}

function openCreateDialog() {
  editingAccount.value = null;
  formData.value = { code: '', name: '', type: '', parentId: '', isGroup: false, description: '' };
  dialogVisible.value = true;
}

function handleNodeClick(account: ChartOfAccountsItem) {
  editingAccount.value = account;
  formData.value = {
    code: account.code,
    name: account.name,
    type: account.type,
    parentId: account.parentId || '',
    isGroup: account.isGroup,
    description: account.description || ''
  };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    const payload = { ...formData.value };
    if (!payload.parentId) delete (payload as any).parentId;

    if (editingAccount.value) {
      const res = await updateAccount(editingAccount.value.id, payload as any);
      if (res.success) {
        ElNotification({ type: 'success', title: 'Success', message: 'Account updated' });
        dialogVisible.value = false;
        await loadAccounts();
      } else {
        ElNotification({ type: 'error', title: 'Error', message: res.message });
      }
    } else {
      const res = await createAccount(payload as any);
      if (res.success) {
        ElNotification({ type: 'success', title: 'Success', message: 'Account created' });
        dialogVisible.value = false;
        await loadAccounts();
      } else {
        ElNotification({ type: 'error', title: 'Error', message: res.message });
      }
    }
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!editingAccount.value) return;
  try {
    await ElMessageBox.confirm(t('finance.confirmDeleteAccount'), t('common.confirmDelete'), { type: 'warning' });
  } catch {
    return;
  }

  deleting.value = true;
  try {
    const res = await deleteAccount(editingAccount.value.id);
    if (res.success) {
      ElNotification({ type: 'success', title: 'Success', message: 'Account deleted' });
      dialogVisible.value = false;
      await loadAccounts();
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
    }
  } finally {
    deleting.value = false;
  }
}

async function handleSeedDefaults() {
  try {
    await ElMessageBox.confirm(t('finance.confirmSeedAccounts'), t('finance.seedAccounts'), { type: 'info' });
  } catch {
    return;
  }

  seeding.value = true;
  try {
    const res = await seedDefaultAccounts();
    if (res.success) {
      ElNotification({ type: 'success', title: 'Success', message: 'Default accounts created' });
      await loadAccounts();
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
    }
  } finally {
    seeding.value = false;
  }
}

await loadAccounts();
</script>
