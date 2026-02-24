<template lang="pug">
FormPage(
  :title="isEdit ? $t('finance.expenses.editExpense') : $t('finance.expenses.addExpense')"
  :subtitle="$t('finance.expenses.subtitle')"
  :breadcrumbs="[{ label: $t('navigation.finance'), to: '/finance/expenses' }, { label: $t('finance.expenses.title'), to: '/finance/expenses' }, { label: isEdit ? $t('common.edit') : $t('common.create') }]"
  :loading="saving"
  @submit="handleSubmit"
)
  el-form(ref="formRef" :model="form" :rules="rules" label-position="top" size="large")
    .grid.gap-6(class="md:grid-cols-2 grid-cols-1")
      el-form-item(:label="$t('finance.expenses.description')" prop="description" class="md:col-span-2")
        el-input(v-model="form.description" :placeholder="$t('common.enter') + $t('finance.expenses.description')")

      el-form-item(:label="$t('finance.expenses.amount')" prop="amount")
        el-input-number(v-model="form.amount" :min="0" :precision="2" class="w-full" :placeholder="$t('common.enter') + $t('finance.expenses.amount')")

      el-form-item(:label="$t('finance.expenses.date')" prop="date")
        el-date-picker(v-model="form.date" type="date" class="w-full" value-format="YYYY-MM-DD")

      el-form-item(:label="$t('finance.expenses.category')")
        el-select(v-model="form.categoryId" clearable class="w-full" :placeholder="$t('common.choose') + $t('finance.expenses.category')")
          el-option(v-for="cat in categories" :key="cat.id" :value="cat.id" :label="cat.name")

      el-form-item(:label="$t('finance.expenses.vendor')")
        el-input(v-model="form.vendor" :placeholder="$t('common.enter') + $t('finance.expenses.vendor')")

    el-form-item(:label="$t('finance.expenses.notes')")
      el-input(v-model="form.notes" type="textarea" :rows="3" :placeholder="$t('common.enter') + $t('finance.expenses.notes')")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { fetchExpenseById, fetchExpenseCategories, createExpense, updateExpense } from '~/composables/useFinance';

definePageMeta({ middleware: 'permissions' });
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const editId = route.query.edit ? Number(route.query.edit) : null;
const isEdit = !!editId;
const saving = ref(false);
const formRef = ref();
const categories = await fetchExpenseCategories();

const form = reactive({
  description: '',
  amount: 0,
  date: '',
  categoryId: null as number | null,
  vendor: '',
  notes: ''
});

const rules = {
  description: [{ required: true, message: () => t('finance.expenses.descriptionRequired'), trigger: 'blur' }],
  amount: [{ required: true, message: () => t('finance.expenses.amountRequired'), trigger: 'blur' }],
  date: [{ required: true, message: () => t('finance.expenses.dateRequired'), trigger: 'change' }]
};

// Load existing data for edit
if (editId) {
  const expense = await fetchExpenseById(editId);
  if (expense) {
    form.description = expense.description;
    form.amount = expense.amount;
    form.date = expense.date;
    form.categoryId = expense.categoryId || null;
    form.vendor = expense.vendor || '';
    form.notes = expense.notes || '';
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const payload = { ...form };
    const res = isEdit ? await updateExpense(editId!, payload) : await createExpense(payload);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') || 'Saved' });
      router.push('/finance/expenses');
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    saving.value = false;
  }
}
</script>
