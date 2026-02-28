<template lang="pug">
div
  //- Header
  ModuleHeader(
    :title="$t('currency.currencies.title')"
    :subtitle="$t('currency.currencies.subtitle')"
  )
    template(#actions)
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openConvertDialog")
        Icon(name="ph:arrows-left-right-bold" size="18" class="mr-1")
        span {{ $t('currency.currencies.convert') }}
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openDialog()")
        Icon(name="ph:plus-bold" size="18" class="mr-1")
        span {{ $t('common.add') }}

  //- Stats
  StatCards(:stats="summaryStats")

  //- Currencies Table
  .glass-card.py-8.animate-entrance
    el-table(:data="currencies" v-loading="loading" style="width: 100%")
      el-table-column(:label="$t('currency.currencies.code')" prop="code" width="120")
        template(#default="{ row }")
          span.font-bold {{ row.code }}
      el-table-column(:label="$t('currency.currencies.name')" prop="name" min-width="180")
      el-table-column(:label="$t('currency.currencies.symbol')" prop="symbol" width="100")
      el-table-column(:label="$t('currency.currencies.exchangeRate')" width="160")
        template(#default="{ row }")
          span.font-bold(style="color: #7849ff") {{ row.exchangeRate }}
      el-table-column(:label="$t('currency.currencies.default')" width="120")
        template(#default="{ row }")
          span.label-outline-green(v-if="row.isDefault") {{ $t('common.yes') }}
      el-table-column(:label="$t('common.actions')" width="80" align="center")
        template(#default="{ row }")
          el-dropdown(trigger="click")
            span.el-dropdown-link
              .toggle-icon.text-md
                Icon(name="IconToggle" size="22")
            template(#dropdown)
              el-dropdown-menu
                el-dropdown-item(@click="openDialog(row)")
                  .flex.items-center
                    Icon.text-md.mr-2(name="ph:pencil-simple-bold" size="20")
                    p.text-sm {{ $t('common.edit') }}
                el-dropdown-item(:disabled="row.isDefault" @click="handleSetDefault(row)")
                  .flex.items-center
                    Icon.text-md.mr-2(name="ph:star-bold" size="20")
                    p.text-sm {{ $t('currency.currencies.setDefault') }}
                el-dropdown-item(:disabled="row.isDefault" @click="[deleteId = row.id, deletePopup = true]")
                  .flex.items-center
                    Icon.text-md.mr-2(name="ph:trash-bold" size="20")
                    p.text-sm {{ $t('common.delete') }}

  //- Delete Confirmation
  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete') || $t('common.deleteConfirmation')" @confirm="confirmDelete")

  //- Create/Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? $t('currency.currencies.edit') : $t('currency.currencies.add')" width="500px")
    el-form(:model="form" label-position="top")
      el-form-item(:label="$t('currency.currencies.code')" required)
        el-input(v-model="form.code" maxlength="3" :placeholder="'USD'")
      el-form-item(:label="$t('currency.currencies.name')" required)
        el-input(v-model="form.name" :placeholder="'US Dollar'")
      el-form-item(:label="$t('currency.currencies.symbol')" required)
        el-input(v-model="form.symbol" :placeholder="'$'")
      el-form-item(:label="$t('currency.currencies.exchangeRate')" required)
        el-input-number(v-model="form.exchangeRate" :min="0" :precision="6" :step="0.01" style="width: 100%")
      el-form-item(:label="$t('currency.currencies.default')")
        el-switch(v-model="form.isDefault")
    template(#footer)
      el-button(@click="dialogVisible = false" class="!rounded-2xl" size="large") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving" class="!rounded-2xl" size="large") {{ $t('common.save') }}

  //- Convert Dialog
  el-dialog(v-model="convertVisible" :title="$t('currency.currencies.convert')" width="500px")
    el-form(label-position="top")
      el-form-item(:label="$t('currency.currencies.amount')")
        el-input-number(v-model="convertForm.amount" :min="0" :precision="2" style="width: 100%")
      .flex.gap-4
        el-form-item(:label="$t('currency.currencies.from')" class="flex-1")
          el-select(v-model="convertForm.from" style="width: 100%")
            el-option(v-for="c in currencies" :key="c.code" :label="`${c.code} - ${c.name}`" :value="c.code")
        el-form-item(:label="$t('currency.currencies.to')" class="flex-1")
          el-select(v-model="convertForm.to" style="width: 100%")
            el-option(v-for="c in currencies" :key="c.code" :label="`${c.code} - ${c.name}`" :value="c.code")
      el-button(type="primary" @click="handleConvert" :loading="converting" style="width: 100%" class="!rounded-2xl" size="large") {{ $t('currency.currencies.convert') }}
      .mt-4.text-center(v-if="convertResult !== null")
        p.text-2xl.font-bold {{ convertForm.amount }} {{ convertForm.from }} = {{ convertResult }} {{ convertForm.to }}
</template>

<script lang="ts" setup>
import { ElNotification } from 'element-plus';
import { useCurrency, type CurrencyItem } from '~/composables/useCurrency';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const { fetchCurrencies, createCurrency, updateCurrency, deleteCurrency, convertCurrency } = useCurrency();

const currencies = ref<CurrencyItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const dialogVisible = ref(false);
const editingItem = ref<CurrencyItem | null>(null);
const form = ref({ code: '', name: '', symbol: '', exchangeRate: 1, isDefault: false });

const deletePopup = ref(false);
const deleteId = ref<number | null>(null);

const convertVisible = ref(false);
const convertForm = ref({ amount: 100, from: '', to: '' });
const convertResult = ref<number | null>(null);
const converting = ref(false);

// Summary stats
const summaryStats = computed(() => {
  const total = currencies.value.length;
  const defaultCurrency = currencies.value.find(c => c.isDefault);
  const rates = currencies.value.map(c => c.exchangeRate).filter(Boolean);
  const minRate = rates.length ? Math.min(...rates) : 0;
  const maxRate = rates.length ? Math.max(...rates) : 0;
  const rateRange = rates.length ? `${minRate.toFixed(2)} - ${maxRate.toFixed(2)}` : '—';

  return [
    { label: t('currency.currencies.totalCurrencies'), value: total, icon: 'ph:coins-bold', color: '#7849ff' },
    {
      label: t('currency.currencies.defaultCurrency'),
      value: defaultCurrency?.code || '—',
      icon: 'ph:star-bold',
      color: '#22c55e'
    },
    { label: t('currency.currencies.exchangeRateRange'), value: rateRange, icon: 'ph:chart-line-up-bold', color: '#f59e0b' }
  ];
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await fetchCurrencies();
    currencies.value = res?.body || res || [];
  } finally {
    loading.value = false;
  }
}

function openDialog(item?: CurrencyItem) {
  editingItem.value = item || null;
  form.value = item
    ? { code: item.code, name: item.name, symbol: item.symbol, exchangeRate: item.exchangeRate, isDefault: item.isDefault }
    : { code: '', name: '', symbol: '', exchangeRate: 1, isDefault: false };
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.code || !form.value.name || !form.value.symbol) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    if (editingItem.value) {
      await updateCurrency(editingItem.value.id, form.value);
    } else {
      await createCurrency(form.value);
    }
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.savedSuccessfully') });
    dialogVisible.value = false;
    await loadData();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleSetDefault(item: CurrencyItem) {
  if (item.isDefault) return;
  saving.value = true;
  try {
    await updateCurrency(item.id, { isDefault: true });
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.savedSuccessfully') });
    await loadData();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    await deleteCurrency(deleteId.value);
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deletedSuccessfully') || t('common.deleted') });
    await loadData();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    deleting.value = false;
    deletePopup.value = false;
    deleteId.value = null;
  }
}

function openConvertDialog() {
  convertResult.value = null;
  convertVisible.value = true;
}

async function handleConvert() {
  if (!convertForm.value.from || !convertForm.value.to) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  converting.value = true;
  try {
    const res: any = await convertCurrency(convertForm.value.amount, convertForm.value.from, convertForm.value.to);
    convertResult.value = res?.body?.result ?? res?.result ?? null;
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    converting.value = false;
  }
}

onMounted(loadData);
</script>
