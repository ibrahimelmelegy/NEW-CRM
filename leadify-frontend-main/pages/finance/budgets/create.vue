<template lang="pug">
FormPage(
  :title="isEdit ? $t('finance.budgets.editBudget') : $t('finance.budgets.addBudget')"
  :subtitle="$t('finance.budgets.subtitle')"
  :breadcrumbs="[{ label: $t('navigation.finance'), to: '/finance/budgets' }, { label: $t('finance.budgets.title'), to: '/finance/budgets' }, { label: isEdit ? $t('common.edit') : $t('common.create') }]"
  :loading="saving"
  @submit="handleSubmit"
)
  el-form(ref="formRef" :model="form" :rules="rules" label-position="top" size="large")
    .grid.gap-6(class="md:grid-cols-2 grid-cols-1")
      el-form-item(:label="$t('finance.budgets.name')" prop="name" class="md:col-span-2")
        el-input(v-model="form.name" :placeholder="$t('common.enter') + $t('finance.budgets.name')")

      el-form-item(:label="$t('finance.budgets.amount')" prop="amount")
        el-input-number(v-model="form.amount" :min="0" :precision="2" class="w-full")

      el-form-item(:label="$t('finance.budgets.category')")
        el-select(v-model="form.categoryId" clearable class="w-full" :placeholder="$t('common.choose') + $t('finance.budgets.category')")
          el-option(v-for="cat in categories" :key="cat.id" :value="cat.id" :label="cat.name")

      el-form-item(:label="$t('finance.budgets.startDate')" prop="startDate")
        el-date-picker(v-model="form.startDate" type="date" class="w-full" value-format="YYYY-MM-DD")

      el-form-item(:label="$t('finance.budgets.endDate')" prop="endDate")
        el-date-picker(v-model="form.endDate" type="date" class="w-full" value-format="YYYY-MM-DD")

    el-form-item(:label="$t('finance.budgets.notes')")
      el-input(v-model="form.notes" type="textarea" :rows="3")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { fetchBudgetById, fetchExpenseCategories, createBudget, updateBudget } from '~/composables/useFinance';

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
  name: '',
  amount: 0,
  categoryId: null as number | null,
  startDate: '',
  endDate: '',
  notes: ''
});

const rules = {
  name: [{ required: true, message: () => t('finance.budgets.nameRequired'), trigger: 'blur' }],
  amount: [{ required: true, message: () => t('finance.budgets.amountRequired'), trigger: 'blur' }],
  startDate: [{ required: true, message: () => t('finance.budgets.startRequired'), trigger: 'change' }],
  endDate: [{ required: true, message: () => t('finance.budgets.endRequired'), trigger: 'change' }]
};

if (editId) {
  const budget = await fetchBudgetById(editId);
  if (budget) {
    form.name = budget.name;
    form.amount = budget.amount;
    form.categoryId = budget.categoryId || null;
    form.startDate = budget.startDate;
    form.endDate = budget.endDate;
    form.notes = budget.notes || '';
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const res = isEdit ? await updateBudget(editId!, form) : await createBudget(form);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') || 'Saved' });
      router.push('/finance/budgets');
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    saving.value = false;
  }
}
</script>
