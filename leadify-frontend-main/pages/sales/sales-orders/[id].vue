<template lang="pug">
.p-6.animate-entrance
    //- Header
    .flex.items-center.justify-between.mb-10
        .flex.items-center.gap-6
            el-button(@click="goBack()" circle :icon="ArrowLeft" class="premium-btn-outline !w-12 !h-12 !text-lg")
            .header-content
                .title.font-bold.text-3xl.text-gradient Sales Order Details
                .subtitle.text-muted.text-sm Order # {{ order?.orderNumber }}

        .flex.items-center.gap-x-4
            el-dropdown(trigger="click" v-if="order?.status !== 'CANCELLED' && order?.status !== 'DELIVERED'")
                el-button(type="primary" class="premium-btn !rounded-2xl px-6")
                    Icon(name="ph:arrows-clockwise-bold" class="mr-2")
                    | Update Status
                template(#dropdown)
                    el-dropdown-menu
                        el-dropdown-item(
                            v-for="opt in availableStatuses"
                            :key="opt.value"
                            @click="handleStatusUpdate(opt.value)"
                        )
                            .flex.items-center.gap-2
                                SalesOrderOrderStatusBadge(:status="opt.value")

            el-button(
                type="primary"
                class="premium-btn-outline !rounded-2xl px-6"
                @click="showFulfillmentDialog = true"
                v-if="order?.status !== 'CANCELLED' && order?.status !== 'DRAFT'"
            )
                Icon(name="ph:package-bold" class="mr-2")
                | Add Fulfillment

    //- Loading
    template(v-if="loading")
        .flex.items-center.justify-center.py-20
            el-icon(class="is-loading text-4xl text-purple-400")
                Icon(name="ph:spinner-bold")

    //- Content
    template(v-else-if="order")
        .grid.grid-cols-1.lg.grid-cols-4.gap-8
            //- Main Content (3 cols)
            .lg_col-span-3.space-y-8
                //- Order Header Card
                .glass-card.p-8.relative.overflow-hidden
                    .absolute.top-0.right-10.h-12.px-6.flex.items-center.justify-center.rounded-b-2xl.shadow-lg(:class="statusRibbonClass")
                        span.font-black.uppercase.tracking-tighter.text-xs {{ order.status }}

                    .grid.grid-cols-2.gap-8.mb-8
                        div
                            .text-xs.uppercase.font-black.text-purple-400.tracking-widest.mb-3 Client
                            .text-xl.font-bold.text-white {{ order.client?.clientName || 'N/A' }}
                            .text-sm.text-muted.mt-1 {{ order.client?.companyName || '' }}
                            .text-sm.text-muted {{ order.client?.email || '' }}

                        .text-right
                            .text-xs.uppercase.tracking-widest.text-muted.mb-1 Order Date
                            .text-lg.font-bold.text-purple-200 {{ formatDate(order.createdAt) }}
                            .text-xs.text-muted.mt-2(v-if="order.dealId") Linked Deal ID: {{ order.dealId }}

                //- Line Items
                .glass-card.p-8
                    .flex.items-center.gap-4.mb-6
                        .p-3.rounded-xl.bg-pink-500_10.border.border-pink-500_20
                            Icon(name="ph:list-bullets-bold" class="text-pink-400 text-2xl")
                        span.text-xl.font-bold.text-white Line Items

                    SalesOrderOrderItemsTable(:items="order.items || []" :editable="false")

                    //- Totals
                    .flex.justify-end.mt-8
                        .w-80.space-y-3
                            .flex.justify-between.text-sm
                                span.text-muted Subtotal
                                span.text-white {{ Number(order.subtotal).toFixed(2) }} {{ order.currency }}
                            .flex.justify-between.text-sm
                                span.text-muted Tax
                                span.text-white {{ Number(order.taxAmount).toFixed(2) }} {{ order.currency }}
                            .flex.justify-between.text-sm
                                span.text-muted Discount
                                span.text-red-400 -{{ Number(order.discountAmount).toFixed(2) }} {{ order.currency }}
                            .pt-4.border-t.border-white_10.flex.justify-between.items-end
                                span.text-lg.font-black.text-gradient Total
                                span.text-3xl.font-black.text-white {{ Number(order.total).toFixed(2) }}
                                    span.text-sm.font-normal.text-muted.ml-1 {{ order.currency }}

                //- Fulfillment Timeline
                .glass-card.p-8
                    .flex.items-center.gap-4.mb-6
                        .p-3.rounded-xl.bg-green-500_10.border.border-green-500_20
                            Icon(name="ph:truck-bold" class="text-green-400 text-2xl")
                        span.text-xl.font-bold.text-white Fulfillment History

                    SalesOrderFulfillmentTimeline(:fulfillments="order.fulfillments || []")

            //- Sidebar (1 col)
            .space-y-8
                //- Metadata
                .glass-card.p-6
                    .flex.items-center.gap-3.mb-6
                        Icon(name="ph:fingerprint-bold" class="text-purple-400")
                        span.text-xs.uppercase.font-bold.tracking-widest.text-muted Order Info

                    .space-y-5
                        .meta-item
                            .text-xs.text-muted.mb-1 Status
                            SalesOrderOrderStatusBadge(:status="order.status")

                        .meta-item
                            .text-xs.text-muted.mb-1 Currency
                            .flex.items-center.gap-2
                                Icon(name="ph:currency-circle-dollar-bold" class="text-green-400")
                                span.font-bold {{ order.currency }}

                        .meta-item
                            .text-xs.text-muted.mb-1 Payment Terms
                            .flex.items-center.gap-2
                                Icon(name="ph:credit-card-bold" class="text-purple-400")
                                span.font-bold {{ order.paymentTerms || 'N/A' }}

                        .meta-item(v-if="order.shippingAddress")
                            .text-xs.text-muted.mb-1 Shipping Address
                            .flex.items-start.gap-2
                                Icon(name="ph:map-pin-bold" class="text-orange-400 mt-1")
                                span.text-sm.text-white {{ order.shippingAddress }}

                        .meta-item
                            .text-xs.text-muted.mb-1 Created
                            .text-sm.font-medium {{ formatDate(order.createdAt) }}

                        .meta-item
                            .text-xs.text-muted.mb-1 Last Updated
                            .text-sm.font-medium {{ formatDate(order.updatedAt) }}

                //- Notes
                .glass-card.p-6(v-if="order.notes")
                    .flex.items-center.gap-3.mb-4
                        Icon(name="ph:note-bold" class="text-yellow-400")
                        span.text-xs.uppercase.font-bold.tracking-widest.text-muted Notes

                    p.text-sm.text-muted.leading-relaxed {{ order.notes }}

    //- Fulfillment Dialog
    el-dialog(
        v-model="showFulfillmentDialog"
        title="Add Fulfillment"
        width="500px"
        class="glass-dialog"
        append-to-body
    )
        .p-2.space-y-4
            el-form(:model="fulfillmentForm" label-position="top")
                el-form-item(label="Status")
                    el-select(v-model="fulfillmentForm.status" class="w-full")
                        el-option(
                            v-for="opt in fulfillmentStatusOptions"
                            :key="opt.value"
                            :label="opt.label"
                            :value="opt.value"
                        )

                el-form-item(label="Tracking Number")
                    el-input(v-model="fulfillmentForm.trackingNumber" placeholder="e.g. 1Z999AA10123456784")

                el-form-item(label="Carrier")
                    el-input(v-model="fulfillmentForm.carrier" placeholder="e.g. DHL, Aramex, SMSA")

                el-form-item(label="Notes")
                    el-input(
                        v-model="fulfillmentForm.notes"
                        type="textarea"
                        :rows="3"
                        placeholder="Optional notes..."
                    )

        template(#footer)
            .flex.justify-end.gap-4.pb-2.px-2
                el-button(@click="showFulfillmentDialog = false") Cancel
                el-button(
                    type="primary"
                    :loading="fulfillmentLoading"
                    @click="handleAddFulfillment"
                    class="premium-btn !rounded-xl px-8"
                ) Add Fulfillment
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue';
import {
    getSalesOrderById,
    updateSalesOrderStatus,
    addFulfillment,
    salesOrderStatusOptions,
    fulfillmentStatusOptions
} from '~/composables/useSalesOrders';

const route = useRoute();
const { goBack } = useSafeBack('/sales/sales-orders');
const { hasPermission } = await usePermissions();

const loading = ref(true);
const order = ref<any>(null);
const showFulfillmentDialog = ref(false);
const fulfillmentLoading = ref(false);

const fulfillmentForm = reactive({
    status: 'PENDING',
    trackingNumber: '',
    carrier: '',
    notes: ''
});

const statusRibbonClass = computed(() => {
    switch (order.value?.status) {
        case 'DRAFT': return 'bg-gray-600 text-white';
        case 'CONFIRMED': return 'bg-blue-600 text-white shadow-blue-900/40';
        case 'PROCESSING': return 'bg-orange-500 text-white shadow-orange-900/40';
        case 'SHIPPED': return 'bg-purple-600 text-white shadow-purple-900/40';
        case 'DELIVERED': return 'bg-green-600 text-white shadow-green-900/40';
        case 'CANCELLED': return 'bg-red-600 text-white shadow-red-900/40';
        default: return 'bg-gray-600 text-white';
    }
});

const availableStatuses = computed(() => {
    const current = order.value?.status;
    // Only show statuses that make sense as a progression
    return salesOrderStatusOptions.filter(opt => opt.value !== current);
});

function formatDate(date: any) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function fetchOrder() {
    loading.value = true;
    try {
        const id = route.params.id as string;
        order.value = await getSalesOrderById(id);
    } finally {
        loading.value = false;
    }
}

async function handleStatusUpdate(status: string) {
    const id = route.params.id as string;
    const result = await updateSalesOrderStatus(id, status);
    if (result) {
        order.value = result;
    }
}

async function handleAddFulfillment() {
    fulfillmentLoading.value = true;
    try {
        const id = route.params.id as string;
        const result = await addFulfillment(id, { ...fulfillmentForm });
        if (result) {
            showFulfillmentDialog.value = false;
            // Reset form
            fulfillmentForm.status = 'PENDING';
            fulfillmentForm.trackingNumber = '';
            fulfillmentForm.carrier = '';
            fulfillmentForm.notes = '';
            // Refresh order data
            await fetchOrder();
        }
    } finally {
        fulfillmentLoading.value = false;
    }
}

onMounted(fetchOrder);
</script>

<style scoped lang="scss">
.text-gradient {
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.bg-pink-500_10 { background: rgba(236, 72, 153, 0.1); }
.border-pink-500_20 { border-color: rgba(236, 72, 153, 0.2); }
.bg-green-500_10 { background: rgba(34, 197, 94, 0.1); }
.border-green-500_20 { border-color: rgba(34, 197, 94, 0.2); }
.border-white_10 { border-color: rgba(255, 255, 255, 0.1); }

.premium-btn-outline {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    &:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
    }
}

.glass-dialog {
    :deep(.el-dialog) {
        background: rgba(30, 18, 48, 0.9) !important;
        backdrop-filter: blur(25px);
        border: 1px solid rgba(168, 85, 247, 0.2);
        border-radius: 24px;
    }
}
</style>
