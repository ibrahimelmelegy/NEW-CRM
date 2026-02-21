<template lang="pug">
.p-8.animate-entrance.w-full.mx-auto(class="max-w-[1800px]")
    //- Header
    .flex.items-center.justify-between.mb-10
        .flex.items-center.gap-6
            el-button(@click="router.back()" circle :icon="ArrowLeft" class="premium-btn-outline !w-12 !h-12 !text-lg")
            .header-content
                .title.font-black.text-4xl.text-gradient Create Sales Order
                .subtitle.text-muted.text-base.mt-1 Fill in the order details below

    .grid.grid-cols-12.gap-8
        //- Main Form (8 cols)
        .col-span-12.xl.col-span-8.space-y-8
            //- Client & Deal Section
            .glass-card.p-10.relative.overflow-hidden
                .absolute.top-0.right-0.p-10.opacity-5
                    Icon(name="ph:users-three-duotone" class="text-9xl text-purple-500")

                .flex.items-center.gap-4.mb-8
                    .p-3.rounded-xl.bg-purple-500_10.border.border-purple-500_20
                        Icon(name="ph:identification-badge-bold" class="text-purple-400 text-2xl")
                    span.text-2xl.font-bold.text-white Client & Order Details

                el-form(:model="form" label-position="top" ref="formRef")
                    .grid.grid-cols-1.md.grid-cols-2.gap-8
                        el-form-item(prop="clientId" :rules="[{ required: true, message: 'Client is required' }]")
                            template(#label)
                                span.text-xs.uppercase.font-bold.tracking-widest.text-muted Client
                            el-select(
                                v-model="form.clientId"
                                placeholder="Search and select client..."
                                class="w-full premium-select-large"
                                filterable
                            )
                                el-option(
                                    v-for="c in clients"
                                    :key="c.id"
                                    :label="c.clientName"
                                    :value="c.id"
                                )
                                    .flex.items-center.gap-3
                                        el-avatar(:size="24" class="bg-purple-500/20") {{ c.clientName?.charAt(0) }}
                                        .flex.flex-col
                                            span.font-bold {{ c.clientName }}
                                            span.text-xs.text-muted {{ c.companyName || c.email || '' }}

                        el-form-item(prop="dealId")
                            template(#label)
                                span.text-xs.uppercase.font-bold.tracking-widest.text-muted Deal (optional)
                            el-select(
                                v-model="form.dealId"
                                placeholder="Link to a deal..."
                                class="w-full premium-select-large"
                                filterable
                                clearable
                            )
                                el-option(
                                    v-for="d in deals"
                                    :key="d.id"
                                    :label="d.name"
                                    :value="d.id"
                                )
                                    .flex.items-center.gap-3
                                        Icon(name="ph:handshake-duotone" class="text-green-400")
                                        .flex.flex-col
                                            span.font-bold {{ d.name }}
                                            span.text-xs.text-muted {{ d.companyName || '' }}

                    .grid.grid-cols-1.md.grid-cols-3.gap-8.mt-6
                        el-form-item(label="Payment Terms" prop="paymentTerms")
                            el-select(v-model="form.paymentTerms" class="w-full premium-select" placeholder="Select terms")
                                el-option(label="Immediate Payment" value="Immediate")
                                el-option(label="Net 15 Days" value="Net 15")
                                el-option(label="Net 30 Days" value="Net 30")
                                el-option(label="Net 60 Days" value="Net 60")
                                el-option(label="50/50 Split" value="50-50")

                        el-form-item(label="Currency" prop="currency")
                            el-select(v-model="form.currency" class="w-full premium-select")
                                el-option(label="SAR" value="SAR")
                                el-option(label="USD" value="USD")
                                el-option(label="EUR" value="EUR")
                                el-option(label="GBP" value="GBP")

                        el-form-item(label="Shipping Address" prop="shippingAddress")
                            el-input(v-model="form.shippingAddress" placeholder="Delivery address..." class="premium-input")

            //- Line Items Section
            .glass-card.p-10
                .flex.items-center.justify-between.mb-8
                    .flex.items-center.gap-4
                        .p-3.rounded-xl.bg-pink-500_10.border.border-pink-500_20
                            Icon(name="ph:shopping-cart-bold" class="text-pink-400 text-2xl")
                        span.text-2xl.font-bold.text-white Order Items

                    el-button(type="primary" :icon="Plus" @click="addItem" class="premium-btn-outline px-8 !h-12 !rounded-xl text-base") Add Item

                el-table(:data="form.items" style="width: 100%; height: auto !important;" class="premium-table mb-8 table-auto-height")
                    el-table-column(label="#" width="50" align="center")
                        template(#default="{ $index }")
                            span.text-muted.font-mono {{ $index + 1 }}

                    el-table-column(label="Description" min-width="250")
                        template(#default="{ row }")
                            el-input(v-model="row.description" placeholder="Product / service description..." class="premium-input-transparent font-medium")

                    el-table-column(label="Qty" width="120")
                        template(#default="{ row }")
                            el-input-number(v-model="row.quantity" :min="0.01" :precision="2" class="premium-number-input !w-full" :controls="false")

                    el-table-column(label="Unit Price" width="160")
                        template(#default="{ row }")
                            el-input-number(v-model="row.unitPrice" :min="0" :precision="2" class="premium-number-input !w-full" :controls="false")

                    el-table-column(label="Tax %" width="100")
                        template(#default="{ row }")
                            el-input-number(v-model="row.taxRate" :min="0" :max="100" :precision="2" class="premium-number-input !w-full" :controls="false")

                    el-table-column(label="Discount %" width="110")
                        template(#default="{ row }")
                            el-input-number(v-model="row.discountRate" :min="0" :max="100" :precision="2" class="premium-number-input !w-full" :controls="false")

                    el-table-column(label="Line Total" width="150" align="right")
                        template(#default="{ row }")
                            span.font-bold.text-lg.text-white {{ calcLineTotal(row).toFixed(2) }}

                    el-table-column(width="60" align="center")
                        template(#default="{ $index }")
                            el-button(type="danger" :icon="Delete" circle plain class="!border-none !bg-transparent hover:!bg-red-500/20 text-red-400" @click="form.items.splice($index, 1)")

                //- Totals
                .flex.flex-col.items-end.gap-2.pt-8.border-t.border-white_10
                    .flex.items-center.justify-between.w-full.max-w-xs.py-2
                        span.text-muted Subtotal
                        span.text-white {{ subtotal.toFixed(2) }}
                    .flex.items-center.justify-between.w-full.max-w-xs.py-2
                        span.text-muted Tax Amount
                        span.text-white {{ taxTotal.toFixed(2) }}
                    .flex.items-center.justify-between.w-full.max-w-xs.py-2
                        span.text-muted Discount
                        span.text-red-400 -{{ discountTotal.toFixed(2) }}

                    .flex.items-center.justify-between.w-full.max-w-md.mt-4.p-4.rounded-2xl.bg-white_5.border.border-white_10
                        span.text-lg.font-bold.text-gradient Grand Total
                        span.text-4xl.font-black.text-white {{ grandTotal.toFixed(2) }}

            //- Notes Section
            .glass-card.p-10
                .flex.items-center.gap-4.mb-6
                    .p-3.rounded-xl.bg-yellow-500_10.border.border-yellow-500_20
                        Icon(name="ph:note-bold" class="text-yellow-400 text-2xl")
                    span.text-2xl.font-bold.text-white Notes

                el-input(
                    v-model="form.notes"
                    type="textarea"
                    :rows="4"
                    placeholder="Additional notes for this order..."
                    class="premium-input-textarea"
                )

            //- Action Buttons
            .flex.justify-end.gap-4
                el-button(size="large" @click="router.back()" class="premium-btn-ghost w-32 !h-14") Cancel
                el-button(
                    type="primary"
                    size="large"
                    :loading="submitting"
                    @click="handleSubmit"
                    class="premium-btn !rounded-xl w-64 !h-14 text-lg shadow-lg shadow-purple-900/50"
                )
                    Icon(name="ph:paper-plane-right-bold" class="mr-2")
                    | Create Order

        //- Right Sidebar (4 cols)
        .col-span-12.xl.col-span-4.space-y-8
            //- Quick Actions
            .glass-card.p-8.overflow-hidden.relative
                .absolute.inset-0.bg-gradient-to-br.from-purple-600_20.to-blue-500_20.opacity-50
                .relative.z-10
                    .flex.items-center.gap-3.mb-6
                        .p-2.bg-blue-500_20.rounded-lg.text-blue-400
                            Icon(name="ph:lightning-bold" class="text-xl")
                        span.text-lg.font-bold.text-white Quick Tips

                    .space-y-4.text-sm.text-gray-300
                        .flex.items-start.gap-3
                            Icon(name="ph:check-circle-bold" class="text-green-400 mt-1")
                            span Select a client to associate the order with
                        .flex.items-start.gap-3
                            Icon(name="ph:check-circle-bold" class="text-green-400 mt-1")
                            span Optionally link to an existing deal for tracking
                        .flex.items-start.gap-3
                            Icon(name="ph:check-circle-bold" class="text-green-400 mt-1")
                            span Add line items with quantities and prices
                        .flex.items-start.gap-3
                            Icon(name="ph:check-circle-bold" class="text-green-400 mt-1")
                            span Tax and discount rates auto-calculate totals

            //- Order Summary
            .glass-card.p-8
                .flex.items-center.gap-3.mb-6
                    Icon(name="ph:receipt-bold" class="text-purple-400 text-xl")
                    span.text-lg.font-bold.text-white Order Summary

                .space-y-4
                    .flex.justify-between.text-sm
                        span.text-muted Items
                        span.font-bold.text-white {{ form.items.length }}
                    .flex.justify-between.text-sm
                        span.text-muted Client
                        span.font-bold.text-white {{ selectedClientName || 'Not selected' }}
                    .flex.justify-between.text-sm
                        span.text-muted Currency
                        span.font-bold.text-white {{ form.currency }}
                    .pt-4.border-t.border-white_10
                        .flex.justify-between
                            span.text-muted Total
                            span.text-2xl.font-black.text-gradient {{ grandTotal.toFixed(2) }}
</template>

<script setup lang="ts">
import { ArrowLeft, Plus, Delete } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { createSalesOrder } from '~/composables/useSalesOrders';

const router = useRouter();
const formRef = ref();
const submitting = ref(false);

const form = reactive({
  clientId: null as string | null,
  dealId: null as string | null,
  paymentTerms: 'Net 30',
  currency: 'SAR',
  shippingAddress: '',
  notes: '',
  items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 15, discountRate: 0 }] as any[]
});

const clients = ref<any[]>([]);
const deals = ref<any[]>([]);

// Fetch clients and deals on mount
onMounted(async () => {
  const clientRes = await useApiFetch('client?limit=500');
  clients.value = clientRes?.body?.docs || [];

  const dealRes = await useApiFetch('deal?limit=500');
  deals.value = dealRes?.body?.docs || [];
});

const selectedClientName = computed(() => {
  if (!form.clientId) return '';
  const client = clients.value.find((c: any) => c.id === form.clientId);
  return client?.clientName || '';
});

function addItem() {
  form.items.push({ description: '', quantity: 1, unitPrice: 0, taxRate: 15, discountRate: 0 });
}

function calcLineTotal(row: any): number {
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

const subtotal = computed(() => {
  return form.items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
});

const taxTotal = computed(() => {
  return form.items.reduce((acc, item) => {
    const lineBase = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    const lineDiscount = lineBase * ((Number(item.discountRate) || 0) / 100);
    const lineAfterDiscount = lineBase - lineDiscount;
    return acc + lineAfterDiscount * ((Number(item.taxRate) || 0) / 100);
  }, 0);
});

const discountTotal = computed(() => {
  return form.items.reduce((acc, item) => {
    const lineBase = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return acc + lineBase * ((Number(item.discountRate) || 0) / 100);
  }, 0);
});

const grandTotal = computed(() => {
  return subtotal.value - discountTotal.value + taxTotal.value;
});

async function handleSubmit() {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  if (form.items.length === 0) {
    return ElNotification({ title: 'Error', message: 'Add at least one item', type: 'warning' });
  }

  // Validate items
  for (const item of form.items) {
    if (!item.description?.trim()) {
      return ElNotification({ title: 'Error', message: 'All items must have a description', type: 'warning' });
    }
  }

  submitting.value = true;
  try {
    const payload = {
      clientId: form.clientId,
      dealId: form.dealId || undefined,
      paymentTerms: form.paymentTerms,
      currency: form.currency,
      shippingAddress: form.shippingAddress || undefined,
      notes: form.notes || undefined,
      items: form.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discountRate: item.discountRate
      }))
    };

    const result = await createSalesOrder(payload);
    if (result) {
      navigateTo('/sales/sales-orders');
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.bg-white_5 {
  background: rgba(255, 255, 255, 0.05);
}
.bg-white_10 {
  background: rgba(255, 255, 255, 0.1);
}
.border-white_10 {
  border-color: rgba(255, 255, 255, 0.1);
}
.bg-purple-500_10 {
  background: rgba(168, 85, 247, 0.1);
}
.border-purple-500_20 {
  border-color: rgba(168, 85, 247, 0.2);
}
.bg-pink-500_10 {
  background: rgba(236, 72, 153, 0.1);
}
.border-pink-500_20 {
  border-color: rgba(236, 72, 153, 0.2);
}
.bg-yellow-500_10 {
  background: rgba(234, 179, 8, 0.1);
}
.border-yellow-500_20 {
  border-color: rgba(234, 179, 8, 0.2);
}
.bg-blue-500_20 {
  background: rgba(59, 130, 246, 0.2);
}
.from-purple-600_20 {
  --tw-gradient-from: rgba(147, 51, 234, 0.2);
}
.to-blue-500_20 {
  --tw-gradient-to: rgba(59, 130, 246, 0.2);
}

.premium-input,
.premium-select {
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 14px !important;
    box-shadow: none !important;
    height: 52px;
    color: white;
    font-size: 15px;
    transition: all 0.3s ease;
    &.is-focus,
    &:hover {
      border-color: var(--purple-500) !important;
      background: rgba(168, 85, 247, 0.05) !important;
    }
  }
}

.premium-select-large {
  @extend .premium-input;
  :deep(.el-input__wrapper) {
    height: 60px;
    font-size: 16px;
    font-weight: 600;
  }
}

.premium-input-transparent {
  :deep(.el-input__wrapper) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding-left: 0;
    font-size: 15px;
  }
}

.premium-number-input {
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    box-shadow: none !important;
    height: 42px;
  }
}

.premium-input-textarea {
  :deep(.el-textarea__inner) {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 16px !important;
    color: white;
    padding: 15px;
    &:focus {
      border-color: var(--purple-500) !important;
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.1);
    }
  }
}

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
    padding: 16px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  }
  :deep(td.el-table__cell) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    padding: 16px 0;
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

.premium-btn-ghost {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: var(--text-secondary);
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
}

.premium-btn-outline {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
  }
}
</style>
