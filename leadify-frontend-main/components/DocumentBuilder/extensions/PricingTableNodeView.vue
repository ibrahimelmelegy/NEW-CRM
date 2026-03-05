<template lang="pug">
node-view-wrapper.pricing-table-node
  .pricing-inner.glass-card.rounded-xl.overflow-hidden.shadow-sm.border.border-gray-200(
    class="my-4 transition-all duration-300"
    :class="{ 'ring-2 ring-primary-500': selected }"
  )
    //- Header
    .bg-gray-50.px-4.py-3.border-b.border-gray-200.flex.justify-between.items-center
      .flex.items-center.gap-2
        Icon(name="ph:receipt-bold" class="text-gray-500")
        h3.text-sm.font-semibold.text-gray-700 Dynamic Pricing Table
      
      .flex.items-center.gap-1(v-if="isEditable")
        el-button(size="small" type="primary" plain @click="addRow") 
          Icon(name="ph:plus-bold" class="mr-1") 
          span Add Item
        el-button(size="small" type="danger" plain @click="deleteNode")
          Icon(name="ph:trash-bold")

    //- Table
    .overflow-x-auto
      table.w-full.text-left.text-sm
        thead.bg-gray-50.text-gray-600
          tr
            th.px-4.py-2(width="40%") Item Description
            th.px-4.py-2(width="15%") Qty
            th.px-4.py-2(width="20%") Unit Price
            th.px-4.py-2(width="20%") Total
            th.px-4.py-2(width="5%" v-if="isEditable")
        tbody
          tr.border-t.border-gray-100(v-for="(item, index) in items" :key="index")
            td.px-4.py-2
              el-input(
                v-if="isEditable"
                v-model="item.description"
                :placeholder="$t('docBuilder.productServiceDesc')"
                size="small"
                @input="updateContent"
              )
              span(v-else) {{ item.description }}
            td.px-4.py-2
              el-input-number(
                v-if="isEditable"
                v-model="item.qty"
                :min="1"
                size="small"
                controls-position="right"
                class="!w-full"
                @change="updateContent"
              )
              span(v-else) {{ item.qty }}
            td.px-4.py-2
              el-input-number(
                v-if="isEditable"
                v-model="item.price"
                :min="0"
                :precision="2"
                :step="100"
                size="small"
                controls-position="right"
                class="!w-full"
                @change="updateContent"
              )
              span(v-else) {{ formatCurrency(item.price) }}
            td.px-4.py-2.font-medium
              | {{ formatCurrency(item.qty * item.price) }}
            td.px-4.py-2.text-center(v-if="isEditable")
              el-button(type="danger" text size="small" @click="removeRow(index)")
                Icon(name="ph:x-bold")
          
          tr(v-if="items.length === 0")
            td.px-4.py-8.text-center.text-gray-400(colspan="5")
              | No items added yet. Click 'Add Item'.

    //- Footer Totals
    .bg-gray-50.px-4.py-3.border-t.border-gray-200
      .flex.justify-end
        .w-64.space-y-2
          .flex.justify-between.text-sm.text-gray-600
            span Subtotal
            span {{ formatCurrency(subtotal) }}
          .flex.justify-between.text-sm.text-gray-600.items-center
            span.flex.items-center.gap-2 
              | Tax / VAT
              el-input-number(
                v-if="isEditable"
                v-model="taxRate"
                :min="0"
                :max="100"
                size="small"
                class="!w-20"
                @change="updateContent"
              )
              span(v-else) ({{ taxRate }}%)
            span {{ formatCurrency(taxAmount) }}
          .flex.justify-between.text-base.font-bold.text-gray-900.pt-2.border-t.border-gray-200
            span Total
            span {{ formatCurrency(total) }}
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { ElInput, ElInputNumber, ElButton } from 'element-plus';

const props = defineProps(nodeViewProps);

const items = computed(() => props.node.attrs.items || []);
const taxRate = computed({
  get: () => props.node.attrs.taxRate || 15,
  set: val => props.updateAttributes({ taxRate: val })
});
const isEditable = computed(() => props.editor.isEditable);

const subtotal = computed(() => {
  return items.value.reduce((sum: number, item: unknown) => sum + item.qty * item.price, 0);
});

const taxAmount = computed(() => {
  return subtotal.value * (taxRate.value / 100);
});

const total = computed(() => {
  return subtotal.value + taxAmount.value;
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2
  }).format(value);
}

function addRow() {
  const newItems = [...items.value, { description: '', qty: 1, price: 0 }];
  props.updateAttributes({ items: newItems });
}

function removeRow(index: number) {
  const newItems = items.value.filter((_: unknown, i: number) => i !== index);
  props.updateAttributes({ items: newItems });
}

function updateContent() {
  // Trigger attribute update to save content
  props.updateAttributes({ items: [...items.value] });
}
</script>

<style scoped>
.pricing-table-node {
  display: block;
}
.pricing-inner {
  background: white;
}
</style>
