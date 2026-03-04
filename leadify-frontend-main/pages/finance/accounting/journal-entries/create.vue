<template lang="pug">
div
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold {{ $t('accounting.journalCreate.title') }}
      p.text-gray-500.mt-1 {{ $t('accounting.journalCreate.subtitle') }}
    .flex.gap-3
      el-button(size="large" @click="router.back()") {{ $t('accounting.journalCreate.cancel') }}
      el-button(
        type="primary"
        size="large"
        @click="handleSave"
        :loading="saving"
        :disabled="!isBalanced || lines.length === 0"
      ) {{ $t('accounting.journalCreate.saveAsDraft') }}

  el-card(shadow="never" class="mb-4")
    .grid.grid-cols-1(class="md:grid-cols-3 gap-4")
      el-form-item(:label="$t('accounting.journalCreate.date')")
        el-date-picker(
          v-model="entryData.date"
          type="date"
          :placeholder="$t('accounting.journalCreate.selectDate')"
          value-format="YYYY-MM-DD"
          class="w-full"
        )
      el-form-item(:label="$t('accounting.journalCreate.reference')")
        el-input(v-model="entryData.reference" :placeholder="$t('accounting.journalCreate.referencePlaceholder')")
      el-form-item(:label="$t('accounting.journalCreate.description')")
        el-input(v-model="entryData.description" :placeholder="$t('accounting.journalCreate.descriptionPlaceholder')")

  el-card(shadow="never")
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-semibold {{ $t('accounting.journalCreate.entryLines') }}
      el-button(type="primary" plain size="small" @click="addLine") {{ $t('accounting.journalCreate.addLine') }}

    el-table(:data="lines" border class="w-full")
      el-table-column(:label="$t('accounting.journalCreate.account')" min-width="250")
        template(#default="{ row, $index }")
          el-select(
            v-model="row.accountId"
            :placeholder="$t('accounting.journalCreate.selectAccount')"
            filterable
            class="w-full"
          )
            el-option(
              v-for="acc in flatAccounts"
              :key="acc.id"
              :label="`${acc.code} - ${acc.name}`"
              :value="acc.id"
            )
      el-table-column(:label="$t('accounting.journalCreate.debit')" width="160")
        template(#default="{ row, $index }")
          el-input-number(
            v-model="row.debit"
            :min="0"
            :precision="2"
            :controls="false"
            class="w-full"
            @change="onDebitChange(row)"
          )
      el-table-column(:label="$t('accounting.journalCreate.credit')" width="160")
        template(#default="{ row, $index }")
          el-input-number(
            v-model="row.credit"
            :min="0"
            :precision="2"
            :controls="false"
            class="w-full"
            @change="onCreditChange(row)"
          )
      el-table-column(:label="$t('accounting.journalCreate.description')" min-width="200")
        template(#default="{ row }")
          el-input(v-model="row.description" :placeholder="$t('accounting.journalCreate.lineDescription')")
      el-table-column(label="" width="60" align="center")
        template(#default="{ $index }")
          el-button(
            type="danger"
            link
            @click="removeLine($index)"
            :disabled="lines.length <= 1"
          )
            span X

    //- Totals row
    .flex.justify-end.mt-4.gap-8
      .text-right
        .text-sm.text-gray-500 {{ $t('accounting.journalCreate.totalDebits') }}
        .text-lg.font-bold {{ formatCurrency(totalDebits) }}
      .text-right
        .text-sm.text-gray-500 {{ $t('accounting.journalCreate.totalCredits') }}
        .text-lg.font-bold {{ formatCurrency(totalCredits) }}
      .text-right
        .text-sm.text-gray-500 {{ $t('accounting.journalCreate.difference') }}
        .text-lg.font-bold(:class="isBalanced ? 'text-green-600' : 'text-red-600'")
          span(v-if="isBalanced") {{ $t('accounting.journalCreate.balanced') }}
          span(v-else) {{ $t('accounting.journalCreate.unbalanced', { diff: formatCurrency(difference) }) }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { fetchChartOfAccounts, createJournalEntry } from '~/composables/useAccounting';
import type { ChartOfAccountsItem } from '~/composables/useAccounting';

definePageMeta({ middleware: 'permissions' });
const router = useRouter();
const { t } = useI18n();

const saving = ref(false);
const flatAccounts = ref<ChartOfAccountsItem[]>([]);

const entryData = ref({
  date: new Date().toISOString().substring(0, 10),
  reference: '',
  description: ''
});

interface LineItem {
  accountId: string;
  debit: number;
  credit: number;
  description: string;
}

const lines = ref<LineItem[]>([
  { accountId: '', debit: 0, credit: 0, description: '' },
  { accountId: '', debit: 0, credit: 0, description: '' }
]);

const totalDebits = computed(() => lines.value.reduce((sum, l) => sum + (Number(l.debit) || 0), 0));
const totalCredits = computed(() => lines.value.reduce((sum, l) => sum + (Number(l.credit) || 0), 0));
const difference = computed(() => Math.abs(totalDebits.value - totalCredits.value));
const isBalanced = computed(() => difference.value < 0.01 && totalDebits.value > 0);

function addLine() {
  lines.value.push({ accountId: '', debit: 0, credit: 0, description: '' });
}

function removeLine(index: number) {
  if (lines.value.length > 1) {
    lines.value.splice(index, 1);
  }
}

function onDebitChange(row: LineItem) {
  if (Number(row.debit) > 0) {
    row.credit = 0;
  }
}

function onCreditChange(row: LineItem) {
  if (Number(row.credit) > 0) {
    row.debit = 0;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
}

async function loadAccounts() {
  const tree = await fetchChartOfAccounts();
  const flat: ChartOfAccountsItem[] = [];
  const traverse = (list: ChartOfAccountsItem[]) => {
    for (const acc of list) {
      if (!acc.isGroup) flat.push(acc);
      if (acc.children && acc.children.length > 0) traverse(acc.children);
    }
  };
  traverse(tree);
  flatAccounts.value = flat;
}

async function handleSave() {
  // Validate
  const invalidLines = lines.value.filter(l => !l.accountId || (l.debit === 0 && l.credit === 0));
  if (invalidLines.length > 0) {
    ElNotification({ type: 'warning', title: t('accounting.journalCreate.validationTitle'), message: t('accounting.journalCreate.lineValidation') });
    return;
  }

  if (!entryData.value.date) {
    ElNotification({ type: 'warning', title: t('accounting.journalCreate.validationTitle'), message: t('accounting.journalCreate.dateRequired') });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      date: entryData.value.date,
      reference: entryData.value.reference,
      description: entryData.value.description,
      sourceType: 'MANUAL',
      lines: lines.value.map(l => ({
        accountId: l.accountId,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description
      }))
    };

    const res = await createJournalEntry(payload as any);
    if (res.success) {
      ElNotification({ type: 'success', title: t('accounting.journalCreate.successTitle'), message: t('accounting.journalCreate.successMessage') });
      router.push('/finance/accounting/journal-entries');
    } else {
      ElNotification({ type: 'error', title: t('accounting.journalCreate.errorTitle'), message: res.message });
    }
  } finally {
    saving.value = false;
  }
}

await loadAccounts();
</script>
