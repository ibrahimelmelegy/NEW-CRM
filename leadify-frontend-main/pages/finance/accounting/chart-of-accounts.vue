<template lang="pug">
div
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold Chart of Accounts
      p.text-gray-500.mt-1 Manage your organization's account structure
    .flex.gap-3
      el-button(type="default" size="large" @click="handleSeedDefaults" :loading="seeding")
        span Seed Defaults
      el-button(type="primary" size="large" @click="openCreateDialog")
        span Add Account

  el-card(shadow="never")
    AccountingAccountTree(
      :accounts="accounts"
      @node-click="handleNodeClick"
    )

  //- Create / Edit Dialog
  el-dialog(
    v-model="dialogVisible"
    :title="editingAccount ? 'Edit Account' : 'New Account'"
    width="520px"
    destroy-on-close
  )
    el-form(
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
    )
      el-form-item(label="Account Code" prop="code")
        el-input(v-model="formData.code" placeholder="e.g. 1100")
      el-form-item(label="Account Name" prop="name")
        el-input(v-model="formData.name" placeholder="e.g. Cash")
      el-form-item(label="Account Type" prop="type")
        el-select(v-model="formData.type" placeholder="Select type" class="w-full")
          el-option(
            v-for="t in accountTypes"
            :key="t.value"
            :label="t.label"
            :value="t.value"
          )
      el-form-item(label="Parent Account")
        el-select(v-model="formData.parentId" placeholder="None (top-level)" clearable filterable class="w-full")
          el-option(
            v-for="acc in flatAccounts"
            :key="acc.id"
            :label="`${acc.code} - ${acc.name}`"
            :value="acc.id"
          )
      el-form-item(label="Is Group Account")
        el-switch(v-model="formData.isGroup")
      el-form-item(label="Description")
        el-input(v-model="formData.description" type="textarea" :rows="3" placeholder="Optional description")
    template(#footer)
      .flex.justify-between
        el-button(v-if="editingAccount" type="danger" plain @click="handleDelete" :loading="deleting") Delete
        div(v-else)
        .flex.gap-2
          el-button(@click="dialogVisible = false") Cancel
          el-button(type="primary" @click="handleSubmit" :loading="saving") {{ editingAccount ? 'Update' : 'Create' }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules } from 'element-plus';

const { t } = useI18n();
import { fetchChartOfAccounts, createAccount, updateAccount, deleteAccount, seedDefaultAccounts, AccountType } from '~/composables/useAccounting';
import type { ChartOfAccountsItem } from '~/composables/useAccounting';

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
