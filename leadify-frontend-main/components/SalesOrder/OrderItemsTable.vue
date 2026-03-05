<template lang="pug">
.order-items-table
    el-table(:data="localItems" style="width: 100%; height: auto !important;" class="premium-table table-auto-height")
        el-table-column(label="#" width="50" align="center")
            template(#default="{ $index }")
                span.text-muted.font-mono {{ $index + 1 }}

        el-table-column(:label="$t('salesOrders.description')" min-width="250")
            template(#default="{ row }")
                template(v-if="editable")
                    el-input(
                        v-model="row.description"
                        :placeholder="$t('invoices.itemDescription')"
                        class="premium-input-transparent"
                        @input="emitUpdate"
                    )
                template(v-else)
                    span.text-white {{ row.description }}

        el-table-column(:label="$t('salesOrders.qty')" width="120" align="center")
            template(#default="{ row }")
                template(v-if="editable")
                    el-input-number(
                        v-model="row.quantity"
                        :min="0.01"
                        :precision="2"
                        :controls="false"
                        class="premium-number-input !w-full"
                        @change="recalculateRow(row)"
                    )
                template(v-else)
                    span {{ row.quantity }}

        el-table-column(:label="$t('salesOrders.unitPrice')" width="160" align="right")
            template(#default="{ row }")
                template(v-if="editable")
                    el-input-number(
                        v-model="row.unitPrice"
                        :min="0"
                        :precision="2"
                        :controls="false"
                        class="premium-number-input !w-full"
                        @change="recalculateRow(row)"
                    )
                template(v-else)
                    span {{ Number(row.unitPrice).toFixed(2) }}

        el-table-column(:label="$t('salesOrders.taxPercent')" width="110" align="center")
            template(#default="{ row }")
                template(v-if="editable")
                    el-input-number(
                        v-model="row.taxRate"
                        :min="0"
                        :max="100"
                        :precision="2"
                        :controls="false"
                        class="premium-number-input !w-full"
                        @change="recalculateRow(row)"
                    )
                template(v-else)
                    span {{ row.taxRate }}%

        el-table-column(:label="$t('salesOrders.discountPercent')" width="110" align="center")
            template(#default="{ row }")
                template(v-if="editable")
                    el-input-number(
                        v-model="row.discountRate"
                        :min="0"
                        :max="100"
                        :precision="2"
                        :controls="false"
                        class="premium-number-input !w-full"
                        @change="recalculateRow(row)"
                    )
                template(v-else)
                    span {{ row.discountRate }}%

        el-table-column(:label="$t('salesOrders.lineTotal')" width="150" align="right")
            template(#default="{ row }")
                span.font-bold.text-purple-300 {{ calculateLineTotal(row).toFixed(2) }}

        el-table-column(v-if="editable" width="60" align="center")
            template(#default="{ $index }")
                el-button(
                    type="danger"
                    :icon="Delete"
                    circle
                    plain
                    class="!border-none !bg-transparent hover:!bg-red-500/20 text-red-400"
                    @click="removeItem($index)"
                )
</template>

<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue';

const props = defineProps<{
  items: Array<<unknown>;
  editable?: boolean;
}>();

const emit = defineEmits(['update:items']);

const localItems = ref<Record<string, unknown>[]>([]);

watch(
  () => props.items,
  newItems => {
    localItems.value = JSON.parse(JSON.stringify(newItems || []));
  },
  { immediate: true, deep: true }
);

function calculateLineTotal(row: unknown): number {
  const qty = Number(row.quantity) || 0;
  const price = Number(row.unitPrice) || 0;
  const taxRate = Number(row.taxRate) || 0;
  const discountRate = Number(row.discountRate) || 0;

  const lineBase = qty * price;
  const lineDiscount = lineBase * (discountRate / 100);
  const lineAfterDiscount = lineBase - lineDiscount;
  const lineTax = lineAfterDiscount * (taxRate / 100);
  return lineAfterDiscount + lineTax;
}

function recalculateRow(row: unknown) {
  row.lineTotal = parseFloat(calculateLineTotal(row).toFixed(2));
  emitUpdate();
}

function removeItem(index: number) {
  localItems.value.splice(index, 1);
  emitUpdate();
}

function emitUpdate() {
  emit(
    'update:items',
    localItems.value.map(item => ({
      ...item,
      lineTotal: parseFloat(calculateLineTotal(item).toFixed(2))
    }))
  );
}
</script>

<style scoped lang="scss">
.premium-table {
  background: transparent !important;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.02);
  --el-table-border-color: rgba(255, 255, 255, 0.05);

  :deep(th.el-table__cell) {
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--text-secondary);
    padding: 14px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  }
  :deep(td.el-table__cell) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    padding: 14px 0;
  }
}

.table-auto-height {
  :deep(.el-table__inner-wrapper) {
    height: auto !important;
  }
  :deep(.el-table__body-wrapper) {
    height: auto !important;
    overflow-y: hidden !important;
  }
}

.premium-input-transparent {
  :deep(.el-input__wrapper) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding-left: 0;
    font-size: 14px;
  }
}

.premium-number-input {
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 10px !important;
    box-shadow: none !important;
    height: 38px;
  }
}
</style>
