<template lang="pug">
div
  //- Header info
  el-card(shadow="never" class="mb-4")
    .grid.grid-cols-1(class="md:grid-cols-3 gap-4")
      el-form-item(:label="$t('common.date')")
        el-date-picker(
          v-model="formData.date"
          type="date"
          :placeholder="$t('common.selectDate')"
          value-format="YYYY-MM-DD"
          class="w-full"
          :disabled="readonly"
        )
      el-form-item(:label="$t('finance.reference')")
        el-input(v-model="formData.reference" placeholder="e.g. INV-001" :disabled="readonly")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="formData.description" :placeholder="$t('finance.journal.entryDescription')" :disabled="readonly")

  //- Lines table
  el-card(shadow="never")
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-semibold {{ $t('finance.entryLines') }}
      el-button(v-if="!readonly" type="primary" plain size="small" @click="addLine") {{ $t('finance.addLine') }}

    el-table(:data="formData.lines" border class="w-full")
      el-table-column(:label="$t('finance.account')" min-width="250")
        template(#default="{ row }")
          el-select(
            v-if="!readonly"
            v-model="row.accountId"
            :placeholder="$t('finance.journal.selectAccount')"
            filterable
            class="w-full"
          )
            el-option(
              v-for="acc in accounts"
              :key="acc.id"
              :label="`${acc.code} - ${acc.name}`"
              :value="acc.id"
            )
          span(v-else) {{ row.account ? `${row.account.code} - ${row.account.name}` : row.accountId }}
      el-table-column(:label="$t('finance.debit')" width="160" align="right")
        template(#default="{ row }")
          el-input-number(
            v-if="!readonly"
            v-model="row.debit"
            :min="0"
            :precision="2"
            :controls="false"
            class="w-full"
          )
          span(v-else) {{ formatAmount(row.debit) }}
      el-table-column(:label="$t('finance.credit')" width="160" align="right")
        template(#default="{ row }")
          el-input-number(
            v-if="!readonly"
            v-model="row.credit"
            :min="0"
            :precision="2"
            :controls="false"
            class="w-full"
          )
          span(v-else) {{ formatAmount(row.credit) }}
      el-table-column(:label="$t('common.description')" min-width="180")
        template(#default="{ row }")
          el-input(v-if="!readonly" v-model="row.description" :placeholder="$t('finance.journal.lineDescription')")
          span(v-else) {{ row.description || '-' }}
      el-table-column(v-if="!readonly" label="" width="60" align="center")
        template(#default="{ $index }")
          el-button(type="danger" link @click="removeLine($index)" :disabled="formData.lines.length <= 1") X

    //- Totals
    .flex.justify-end.mt-4.gap-8
      .text-right
        .text-sm.text-gray-500 Total Debits
        .text-lg.font-bold {{ formatAmount(totalDebits) }}
      .text-right
        .text-sm.text-gray-500 Total Credits
        .text-lg.font-bold {{ formatAmount(totalCredits) }}
      .text-right
        .text-sm.text-gray-500 Balance
        .text-lg.font-bold(:class="isBalanced ? 'text-green-600' : 'text-red-600'")
          span(v-if="isBalanced") Balanced
          span(v-else) Unbalanced: {{ formatAmount(Math.abs(totalDebits - totalCredits)) }}

    //- Actions
    .flex.justify-end.mt-4.gap-3(v-if="!readonly")
      el-button(@click="$emit('cancel')") Cancel
      el-button(type="primary" @click="handleSave" :disabled="!isBalanced || formData.lines.length === 0") Save
</template>

<script setup lang="ts">
import type { ChartOfAccountsItem } from '~/composables/useAccounting';

interface LineData {
  accountId: string;
  debit: number;
  credit: number;
  description: string;
  account?: { id: string; code: string; name: string; type: string };
}

interface EntryData {
  date: string;
  reference: string;
  description: string;
  lines: LineData[];
}

interface Props {
  entry?: unknown;
  accounts?: ChartOfAccountsItem[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  accounts: () => [],
  readonly: false
});

const emit = defineEmits<{
  (e: 'save', data: EntryData): void;
  (e: 'cancel'): void;
}>();

const formData = ref<EntryData>({
  date: props.entry?.date ? props.entry.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
  reference: props.entry?.reference || '',
  description: props.entry?.description || '',
  lines: props.entry?.lines?.map(l => ({
    accountId: l.accountId,
    debit: Number(l.debit) || 0,
    credit: Number(l.credit) || 0,
    description: l.description || '',
    account: l.account
  })) || [
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' }
  ]
});

const totalDebits = computed(() => formData.value.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0));
const totalCredits = computed(() => formData.value.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0));
const isBalanced = computed(() => Math.abs(totalDebits.value - totalCredits.value) < 0.01 && totalDebits.value > 0);

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
}

function addLine() {
  formData.value.lines.push({ accountId: '', debit: 0, credit: 0, description: '' });
}

function removeLine(index: number) {
  if (formData.value.lines.length > 1) {
    formData.value.lines.splice(index, 1);
  }
}

function handleSave() {
  emit('save', { ...formData.value });
}
</script>
