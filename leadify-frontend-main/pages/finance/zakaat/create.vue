<template lang="pug">
FormPage(
  :title="isEdit ? $t('zakaat.editAssessment') : $t('zakaat.newAssessment')"
  :breadcrumbs="breadcrumbs"
  :loading="saving"
  :submitLabel="$t('common.save')"
  @submit="handleSave"
)
  //- Fiscal Year
  .mb-8
    h3.font-bold.text-lg.mb-4(style="color: var(--text-primary)")
      Icon(name="ph:calendar-bold" size="20" class="mr-2" style="color: var(--accent-color)")
      | {{ $t('zakaat.fiscalYearSection') }}
    .grid.grid-cols-1.gap-4(class="md:grid-cols-3")
      el-form-item(:label="$t('zakaat.fiscalYear')" required)
        el-date-picker(
          v-model="form.fiscalYear"
          type="year"
          format="YYYY"
          value-format="YYYY"
          :placeholder="$t('zakaat.selectYear')"
          style="width: 100%"
        )
      el-form-item(:label="$t('zakaat.assessmentDate')" required)
        el-date-picker(
          v-model="form.assessmentDate"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :placeholder="$t('zakaat.selectDate')"
          style="width: 100%"
        )

  //- Asset Breakdown
  .mb-8
    h3.font-bold.text-lg.mb-4(style="color: var(--text-primary)")
      Icon(name="ph:wallet-bold" size="20" class="mr-2" style="color: var(--accent-color)")
      | {{ $t('zakaat.assetBreakdown') }}
    .grid.grid-cols-1.gap-4(class="md:grid-cols-2 lg:grid-cols-3")
      el-form-item(:label="$t('zakaat.assets.cashAndBank')" required)
        el-input-number(
          v-model="form.cashAndBank"
          :min="0"
          :precision="2"
          :step="1000"
          style="width: 100%"
          :placeholder="$t('common.enter') + $t('zakaat.assets.cashAndBank')"
          @change="recalculate"
        )
      el-form-item(:label="$t('zakaat.assets.accountsReceivable')")
        el-input-number(
          v-model="form.accountsReceivable"
          :min="0"
          :precision="2"
          :step="1000"
          style="width: 100%"
          @change="recalculate"
        )
      el-form-item(:label="$t('zakaat.assets.inventoryValue')")
        el-input-number(
          v-model="form.inventoryValue"
          :min="0"
          :precision="2"
          :step="1000"
          style="width: 100%"
          @change="recalculate"
        )
      el-form-item(:label="$t('zakaat.assets.shortTermInvestments')")
        el-input-number(
          v-model="form.shortTermInvestments"
          :min="0"
          :precision="2"
          :step="1000"
          style="width: 100%"
          @change="recalculate"
        )
      el-form-item(:label="$t('zakaat.assets.prepaidExpenses')")
        el-input-number(
          v-model="form.prepaidExpenses"
          :min="0"
          :precision="2"
          :step="1000"
          style="width: 100%"
          @change="recalculate"
        )
      el-form-item(:label="$t('zakaat.assets.otherCurrentAssets')")
        el-input-number(
          v-model="form.otherCurrentAssets"
          :min="0"
          :precision="2"
          :step="1000"
          style="width: 100%"
          @change="recalculate"
        )

  //- Deductions
  .mb-8
    h3.font-bold.text-lg.mb-4(style="color: var(--text-primary)")
      Icon(name="ph:minus-circle-bold" size="20" class="mr-2" style="color: #ef4444")
      | {{ $t('zakaat.deductionsSection') }}
    .grid.grid-cols-1.gap-4(class="md:grid-cols-2 lg:grid-cols-3")
      el-form-item(:label="$t('zakaat.deductions.fixedAssets')")
        el-input-number(
          v-model="form.fixedAssets"
          :min="0"
          :precision="2"
          :step="1000"
          style="width: 100%"
          @change="recalculate"
        )
      el-form-item(:label="$t('zakaat.deductions.longTermLiabilities')")
        el-input-number(
          v-model="form.longTermLiabilities"
          :min="0"
          :precision="2"
          :step="1000"
          style="width: 100%"
          @change="recalculate"
        )
      el-form-item(:label="$t('zakaat.deductions.otherDeductions')")
        el-input-number(
          v-model="form.otherDeductions"
          :min="0"
          :precision="2"
          :step="1000"
          style="width: 100%"
          @change="recalculate"
        )

  //- Auto-calculated Summary
  .glass-card.p-6.mb-8(style="border-left: 4px solid var(--accent-color)")
    h3.font-bold.text-lg.mb-4
      Icon(name="ph:calculator-bold" size="20" class="mr-2" style="color: var(--accent-color)")
      | {{ $t('zakaat.calculatedSummary') }}
    .max-w-lg
      .flex.justify-between.py-2.border-b(style="border-color: var(--border-color)")
        span(style="color: var(--text-muted)") {{ $t('zakaat.totalAssets') }}
        span.font-medium {{ formatCurrency(calculated.totalAssets) }}
      .flex.justify-between.py-2.border-b(style="border-color: var(--border-color)")
        span.text-red-500 {{ $t('zakaat.lessExemptAssets') }}
        span.font-medium.text-red-500 -{{ formatCurrency(calculated.exemptAssets) }}
      .flex.justify-between.py-2.border-b(style="border-color: var(--border-color)")
        span.font-bold {{ $t('zakaat.zakaatableBase') }}
        span.font-bold {{ formatCurrency(calculated.zakaatableBase) }}
      .flex.justify-between.py-3
        span.text-lg.font-bold {{ $t('zakaat.zakaatDue') }} (2.5%)
        span.text-2xl.font-bold(style="color: var(--accent-color)") {{ formatCurrency(calculated.zakaatDue) }}

  //- Notes
  el-form-item(:label="$t('zakaat.notes')")
    el-input(
      v-model="form.notes"
      type="textarea"
      :rows="3"
      :placeholder="$t('zakaat.placeholders.notes')"
    )
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { createAssessment, updateAssessment, fetchAssessment, type ZakaatAssessment } from '~/composables/useZakaat';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const saving = ref(false);
const isEdit = computed(() => !!route.query.edit);
const editId = computed(() => route.query.edit as string);

const breadcrumbs = computed(() => [
  { label: t('navigation.finance'), to: '/finance/expenses' },
  { label: t('zakaat.title'), to: '/finance/zakaat' },
  { label: isEdit.value ? t('zakaat.editAssessment') : t('zakaat.newAssessment') }
]);

const form = ref({
  fiscalYear: String(new Date().getFullYear()),
  assessmentDate: new Date().toISOString().split('T')[0],
  cashAndBank: 0,
  accountsReceivable: 0,
  inventoryValue: 0,
  shortTermInvestments: 0,
  prepaidExpenses: 0,
  otherCurrentAssets: 0,
  fixedAssets: 0,
  longTermLiabilities: 0,
  otherDeductions: 0,
  notes: ''
});

const calculated = computed(() => {
  const totalAssets =
    (form.value.cashAndBank || 0) +
    (form.value.accountsReceivable || 0) +
    (form.value.inventoryValue || 0) +
    (form.value.shortTermInvestments || 0) +
    (form.value.prepaidExpenses || 0) +
    (form.value.otherCurrentAssets || 0);

  const exemptAssets = (form.value.fixedAssets || 0) + (form.value.longTermLiabilities || 0) + (form.value.otherDeductions || 0);

  const zakaatableBase = Math.max(0, totalAssets - exemptAssets);
  const zakaatDue = zakaatableBase * 0.025;

  return { totalAssets, exemptAssets, zakaatableBase, zakaatDue };
});

function recalculate() {
  // Computed handles this automatically, but we expose this for the template @change events
}

async function loadEdit() {
  if (!editId.value) return;
  try {
    const data = await fetchAssessment(editId.value);
    if (data) {
      form.value = {
        fiscalYear: data.fiscalYear,
        assessmentDate: data.assessmentDate,
        cashAndBank: data.cashAndBank || 0,
        accountsReceivable: data.accountsReceivable || 0,
        inventoryValue: data.inventoryValue || 0,
        shortTermInvestments: data.shortTermInvestments || 0,
        prepaidExpenses: data.prepaidExpenses || 0,
        otherCurrentAssets: data.otherCurrentAssets || 0,
        fixedAssets: data.fixedAssets || 0,
        longTermLiabilities: data.longTermLiabilities || 0,
        otherDeductions: data.otherDeductions || 0,
        notes: data.notes || ''
      };
    }
  } catch {
    ElMessage.error(t('errors.generic'));
  }
}

async function handleSave() {
  if (!form.value.fiscalYear || !form.value.assessmentDate) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }

  saving.value = true;
  try {
    const payload = {
      ...form.value,
      totalAssets: calculated.value.totalAssets,
      exemptAssets: calculated.value.exemptAssets,
      zakaatableBase: calculated.value.zakaatableBase,
      zakaatRate: 2.5,
      zakaatDue: calculated.value.zakaatDue
    };

    let res;
    if (isEdit.value) {
      res = await updateAssessment(editId.value, payload);
    } else {
      res = await createAssessment(payload);
    }

    if (res.success) {
      ElMessage.success(t('common.created'));
      router.push('/finance/zakaat');
    } else {
      ElMessage.error(res.message || t('errors.generic'));
    }
  } finally {
    saving.value = false;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(amount || 0);
}

onMounted(() => {
  if (isEdit.value) loadEdit();
});
</script>
