<template lang="pug">
.invoice-line-items
  el-table(:data="localItems" border style="width: 100%")
    el-table-column(label="#" width="50" align="center")
      template(#default="{ $index }")
        span {{ $index + 1 }}
    el-table-column(:label="$t('common.description')" min-width="200")
      template(#default="{ row, $index }")
        el-input(
          v-if="editable"
          v-model="row.description"
          :placeholder="$t('invoices.itemDescription')"
          @input="onItemChange($index)"
        )
        span(v-else) {{ row.description }}
    el-table-column(:label="$t('invoices.qty')" width="100" align="center")
      template(#default="{ row, $index }")
        el-input-number(
          v-if="editable"
          v-model="row.quantity"
          :min="0.01"
          :precision="2"
          :controls="false"
          size="small"
          @change="onItemChange($index)"
        )
        span(v-else) {{ Number(row.quantity).toFixed(2) }}
    el-table-column(:label="$t('invoices.unitPrice')" width="130" align="right")
      template(#default="{ row, $index }")
        el-input-number(
          v-if="editable"
          v-model="row.unitPrice"
          :min="0"
          :precision="2"
          :controls="false"
          size="small"
          @change="onItemChange($index)"
        )
        span(v-else) {{ Number(row.unitPrice).toFixed(2) }}
    el-table-column(:label="$t('invoices.taxPercent')" width="100" align="center")
      template(#default="{ row, $index }")
        el-input-number(
          v-if="editable"
          v-model="row.taxRate"
          :min="0"
          :max="100"
          :precision="2"
          :controls="false"
          size="small"
          @change="onItemChange($index)"
        )
        span(v-else) {{ Number(row.taxRate).toFixed(2) }}%
    el-table-column(:label="$t('invoices.discountPercent')" width="110" align="center")
      template(#default="{ row, $index }")
        el-input-number(
          v-if="editable"
          v-model="row.discountRate"
          :min="0"
          :max="100"
          :precision="2"
          :controls="false"
          size="small"
          @change="onItemChange($index)"
        )
        span(v-else) {{ Number(row.discountRate).toFixed(2) }}%
    el-table-column(:label="$t('invoices.lineTotal')" width="140" align="right")
      template(#default="{ row }")
        span.font-semibold {{ Number(row.lineTotal).toFixed(2) }}
    el-table-column(v-if="editable" label="" width="60" align="center")
      template(#default="{ $index }")
        el-button(
          type="danger"
          :icon="Delete"
          circle
          size="small"
          @click="removeItem($index)"
        )

  .mt-3(v-if="editable")
    el-button(type="primary" plain size="small" @click="addItem")
      Icon(name="ph:plus-bold" size="14" class="mr-1")
      span Add Line Item
</template>

<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue';

interface LineItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
}

const props = defineProps<{
  items: LineItem[];
  editable: boolean;
}>();

const emit = defineEmits<{
  'update:items': [items: LineItem[]];
}>();

const localItems = ref<LineItem[]>([]);

watch(
  () => props.items,
  newItems => {
    localItems.value = newItems.map(item => ({ ...item }));
  },
  { immediate: true, deep: true }
);

function calcLineTotal(item: LineItem): number {
  const subtotal = item.quantity * item.unitPrice;
  const discount = subtotal * (item.discountRate / 100);
  const taxable = subtotal - discount;
  const tax = taxable * (item.taxRate / 100);
  return Math.round((taxable + tax) * 100) / 100;
}

function onItemChange(index: number) {
  const item = localItems.value[index];
  if (item) {
    item.lineTotal = calcLineTotal(item);
    emitUpdate();
  }
}

function addItem() {
  localItems.value.push({
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 0,
    discountRate: 0,
    lineTotal: 0
  });
  emitUpdate();
}

function removeItem(index: number) {
  localItems.value.splice(index, 1);
  emitUpdate();
}

function emitUpdate() {
  emit('update:items', [...localItems.value]);
}
</script>

<style scoped>
.invoice-line-items :deep(.el-input-number) {
  width: 100%;
}
.invoice-line-items :deep(.el-input-number .el-input__inner) {
  text-align: right;
}
</style>
