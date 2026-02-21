<template lang="pug">
.p-6
  .flex.justify-between.items-center.mb-6
    div
      h2.text-2xl.font-bold {{ $t('currency.taxRules.title') }}
      p.text-sm.opacity-60 {{ $t('currency.taxRules.subtitle') }}
    el-button(type="primary" @click="openDialog()")
      Icon(name="ph:plus-bold" size="16" class="mr-1")
      span {{ $t('common.add') }}

  //- Filter by Tax Type
  .flex.items-center.gap-4.mb-4
    el-select(v-model="filterType" :placeholder="$t('currency.taxRules.allTypes')" clearable style="width: 200px" @change="loadData")
      el-option(:label="$t('currency.taxRules.allTypes')" value="")
      el-option(v-for="tp in taxTypeOptions" :key="tp.value" :label="tp.label" :value="tp.value")

  //- Tax Rules Table
  el-table(:data="filteredRules" v-loading="loading" stripe)
    el-table-column(:label="$t('currency.taxRules.name')" prop="name" min-width="180")
    el-table-column(:label="$t('currency.taxRules.type')" width="150")
      template(#default="{ row }")
        el-tag(:type="getTypeTag(row.type)" size="small" effect="plain") {{ row.type || 'VAT' }}
    el-table-column(:label="$t('currency.taxRules.rate')" width="120")
      template(#default="{ row }")
        span {{ row.rate }}%
    el-table-column(:label="$t('currency.taxRules.region')" prop="region" width="160")
    el-table-column(:label="$t('currency.taxRules.description')" prop="description" min-width="200")
    el-table-column(:label="$t('currency.taxRules.inclusive')" width="100" align="center")
      template(#default="{ row }")
        Icon(v-if="row.isInclusive" name="ph:check-circle-bold" size="16" style="color: #67c23a")
        Icon(v-else name="ph:minus-circle-bold" size="16" style="color: var(--text-muted)")
    el-table-column(:label="$t('currency.taxRules.active')" width="100")
      template(#default="{ row }")
        el-tag(:type="row.isActive ? 'success' : 'info'" size="small") {{ row.isActive ? $t('common.yes') : $t('common.no') }}
    el-table-column(:label="$t('common.actions')" width="200" align="center")
      template(#default="{ row }")
        el-button(link type="primary" @click="openCalcDialog(row)")
          Icon(name="ph:calculator-bold" size="16")
        el-button(link type="primary" @click="openDialog(row)")
          Icon(name="ph:pencil-simple-bold" size="16")
        el-button(link type="danger" @click="handleDelete(row)")
          Icon(name="ph:trash-bold" size="16")

  //- Create/Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? $t('currency.taxRules.edit') : $t('currency.taxRules.add')" width="560px")
    el-form(:model="form" label-position="top")
      el-form-item(:label="$t('currency.taxRules.name')" required)
        el-input(v-model="form.name" :placeholder="'VAT 15%'")
      el-form-item(:label="$t('currency.taxRules.type')" required)
        el-select(v-model="form.type" style="width: 100%")
          el-option(v-for="tp in taxTypeOptions" :key="tp.value" :label="tp.label" :value="tp.value")
      el-form-item(:label="$t('currency.taxRules.rate')" required)
        el-input-number(v-model="form.rate" :min="0" :max="100" :precision="2" :step="0.5" style="width: 100%")
      el-form-item(:label="$t('currency.taxRules.region')")
        el-input(v-model="form.region" :placeholder="'Saudi Arabia'")
      el-form-item(:label="$t('currency.taxRules.description')")
        el-input(v-model="form.description" type="textarea" :rows="2")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('currency.taxRules.inclusive')")
          el-switch(v-model="form.isInclusive")
        el-form-item(:label="$t('currency.taxRules.compound')")
          el-switch(v-model="form.isCompound")
      el-form-item(:label="$t('currency.taxRules.active')")
        el-switch(v-model="form.isActive")
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') }}

  //- Calculate Tax Dialog
  el-dialog(v-model="calcVisible" :title="$t('currency.taxRules.calculateTax')" width="400px")
    el-form(label-position="top")
      el-form-item(:label="$t('currency.taxRules.amount')")
        el-input-number(v-model="calcAmount" :min="0" :precision="2" style="width: 100%")
      el-button(type="primary" @click="handleCalcTax" :loading="calculating" style="width: 100%") {{ $t('currency.taxRules.calculateTax') }}
      .mt-4(v-if="calcResult")
        .flex.justify-between.py-2.border-b
          span {{ $t('currency.taxRules.subtotal') }}
          span.font-bold {{ calcResult.amount }}
        .flex.justify-between.py-2.border-b
          span {{ $t('currency.taxRules.taxAmount') }} ({{ calcResult.taxRate }}%)
          span.font-bold {{ calcResult.taxAmount }}
        .flex.justify-between.py-2.text-lg
          span {{ $t('currency.taxRules.total') }}
          span.font-bold.text-primary {{ calcResult.total }}
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useCurrency, type TaxRuleItem } from '~/composables/useCurrency';

definePageMeta({ middleware: 'permissions' });

const { fetchTaxRules, createTaxRule, updateTaxRule, deleteTaxRule, calculateTax } = useCurrency();
const { t } = useI18n();

const taxRules = ref<TaxRuleItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingItem = ref<TaxRuleItem | null>(null);
const filterType = ref('');

const taxTypeOptions = [
  { label: 'VAT', value: 'VAT' },
  { label: 'Zakaat', value: 'ZAKAAT' },
  { label: 'Withholding', value: 'WITHHOLDING' },
  { label: 'Excise', value: 'EXCISE' }
];

function getTypeTag(type?: string): string {
  const map: Record<string, string> = { VAT: 'success', ZAKAAT: '', WITHHOLDING: 'warning', EXCISE: 'danger' };
  return map[type || 'VAT'] || 'info';
}

const filteredRules = computed(() => {
  if (!filterType.value) return taxRules.value;
  return taxRules.value.filter(r => (r as any).type === filterType.value);
});

const form = ref({ name: '', type: 'VAT', rate: 15, region: '', description: '', isActive: true, isInclusive: false, isCompound: false });

const calcVisible = ref(false);
const calcAmount = ref(1000);
const calcResult = ref<any>(null);
const calcRuleId = ref<number>(0);
const calculating = ref(false);

async function loadData() {
  loading.value = true;
  try {
    const res: any = await fetchTaxRules();
    taxRules.value = res?.body || res || [];
  } finally {
    loading.value = false;
  }
}

function openDialog(item?: TaxRuleItem) {
  editingItem.value = item || null;
  form.value = item
    ? {
        name: item.name,
        type: (item as any).type || 'VAT',
        rate: item.rate,
        region: item.region,
        description: item.description,
        isActive: item.isActive,
        isInclusive: (item as any).isInclusive || false,
        isCompound: (item as any).isCompound || false
      }
    : { name: '', type: 'VAT', rate: 15, region: '', description: '', isActive: true, isInclusive: false, isCompound: false };
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.name) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    if (editingItem.value) {
      await updateTaxRule(editingItem.value.id, form.value);
    } else {
      await createTaxRule(form.value);
    }
    ElMessage.success(t('common.savedSuccessfully'));
    dialogVisible.value = false;
    await loadData();
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(item: TaxRuleItem) {
  await ElMessageBox.confirm(t('common.deleteConfirmation'), t('common.warning'), { type: 'warning' });
  try {
    await deleteTaxRule(item.id);
    ElMessage.success(t('common.deletedSuccessfully'));
    await loadData();
  } catch {
    ElMessage.error(t('common.error'));
  }
}

function openCalcDialog(rule: TaxRuleItem) {
  calcRuleId.value = rule.id;
  calcResult.value = null;
  calcAmount.value = 1000;
  calcVisible.value = true;
}

async function handleCalcTax() {
  calculating.value = true;
  try {
    const res: any = await calculateTax(calcAmount.value, calcRuleId.value);
    calcResult.value = res?.body || res;
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    calculating.value = false;
  }
}

onMounted(loadData);
</script>
