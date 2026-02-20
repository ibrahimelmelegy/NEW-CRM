<template lang="pug">
.p-6.animate-entrance
    //- Header
    .flex.items-center.justify-between.mb-10
        .header-content
            .title.font-bold.text-3xl.mb-2.text-gradient {{ $t('salesOrders.title') || 'Sales Orders' }}
            .subtitle.text-muted.text-sm.tracking-wide Manage and track your sales orders

        .flex.items-center.gap-x-4
            NuxtLink(to="/sales/sales-orders/create")
                el-button(
                    size="large"
                    type="primary"
                    :icon="Plus"
                    class="premium-btn !rounded-2xl px-8 glow-purple"
                ) New Order

    //- KPI Summary Cards
    .grid.grid-cols-1.sm.grid-cols-2.lg.grid-cols-4.gap-6.mb-8
        .glass-card.p-6.flex.items-center.gap-4
            .p-3.rounded-xl.bg-purple-500_10.border.border-purple-500_20
                Icon(name="ph:shopping-bag-bold" class="text-purple-400 text-2xl")
            div
                .text-2xl.font-black.text-white {{ kpi.total }}
                .text-xs.text-muted.uppercase.tracking-wider Total Orders

        .glass-card.p-6.flex.items-center.gap-4
            .p-3.rounded-xl.bg-yellow-500_10.border.border-yellow-500_20
                Icon(name="ph:gear-bold" class="text-yellow-400 text-2xl")
            div
                .text-2xl.font-black.text-white {{ kpi.processing }}
                .text-xs.text-muted.uppercase.tracking-wider Processing

        .glass-card.p-6.flex.items-center.gap-4
            .p-3.rounded-xl.bg-blue-500_10.border.border-blue-500_20
                Icon(name="ph:truck-bold" class="text-blue-400 text-2xl")
            div
                .text-2xl.font-black.text-white {{ kpi.shipped }}
                .text-xs.text-muted.uppercase.tracking-wider Shipped

        .glass-card.p-6.flex.items-center.gap-4
            .p-3.rounded-xl.bg-green-500_10.border.border-green-500_20
                Icon(name="ph:check-circle-bold" class="text-green-400 text-2xl")
            div
                .text-2xl.font-black.text-white {{ kpi.delivered }}
                .text-xs.text-muted.uppercase.tracking-wider Delivered

    //- Status Tabs & Table
    .glass-card.p-4(class="!rounded-3xl shadow-glow")
        el-tabs.mb-4(v-model="activeTab" @tab-change="handleTabChange" class="premium-tabs")
            el-tab-pane(label="All" name="ALL")
            el-tab-pane(label="Draft" name="DRAFT")
            el-tab-pane(label="Confirmed" name="CONFIRMED")
            el-tab-pane(label="Processing" name="PROCESSING")
            el-tab-pane(label="Shipped" name="SHIPPED")
            el-tab-pane(label="Delivered" name="DELIVERED")
            el-tab-pane(label="Cancelled" name="CANCELLED")

        //- Search
        .mb-4.px-2
            el-input(
                v-model="searchKey"
                placeholder="Search by order number..."
                :prefix-icon="Search"
                clearable
                class="premium-input"
                @input="debouncedSearch"
            )

        //- Table
        el-table(
            :data="orders"
            style="width: 100%"
            class="premium-table"
            @row-click="handleRowClick"
            row-class-name="cursor-pointer"
        )
            el-table-column(prop="orderNumber" label="Order #" width="160" sortable)
                template(#default="{ row }")
                    span.font-bold.text-purple-300 {{ row.orderNumber }}

            el-table-column(prop="client" label="Client" min-width="200")
                template(#default="{ row }")
                    .flex.items-center.gap-3(v-if="row.client")
                        el-avatar(:size="32" class="bg-purple-500/20") {{ row.client?.clientName?.charAt(0) || '?' }}
                        div
                            .text-white.font-medium {{ row.client?.clientName || 'N/A' }}
                            .text-xs.text-muted {{ row.client?.companyName || '' }}
                    span.text-muted(v-else) No client

            el-table-column(prop="status" label="Status" width="150" sortable)
                template(#default="{ row }")
                    SalesOrderOrderStatusBadge(:status="row.status")

            el-table-column(prop="total" label="Total" width="150" align="right" sortable)
                template(#default="{ row }")
                    span.font-bold.text-white {{ Number(row.total).toFixed(2) }}

            el-table-column(prop="currency" label="Currency" width="100" align="center")
                template(#default="{ row }")
                    el-tag(size="small" type="info" effect="plain") {{ row.currency }}

            el-table-column(prop="paymentTerms" label="Payment Terms" width="160")
                template(#default="{ row }")
                    span.text-muted {{ row.paymentTerms || '-' }}

            el-table-column(prop="createdAt" label="Created" width="160" sortable)
                template(#default="{ row }")
                    span.text-muted {{ formatDate(row.createdAt) }}

            el-table-column(label="" width="60" align="center")
                template(#default="{ row }")
                    .flex.items-center(@click.stop)
                        el-dropdown(trigger="click")
                            span.el-dropdown-link
                                Icon(name="ph:dots-three-outline-vertical-fill" size="20" class="text-purple-400 hover-scale")
                            template(#dropdown)
                                el-dropdown-menu
                                    el-dropdown-item
                                        NuxtLink.flex.items-center.gap-2(:to="`/sales/sales-orders/${row.id}`")
                                            Icon(name="ph:eye-bold" class="text-md")
                                            span View Details
                                    el-dropdown-item
                                        NuxtLink.flex.items-center.gap-2(:to="`/sales/sales-orders/${row.id}`")
                                            Icon(name="ph:pencil-bold" class="text-md")
                                            span Edit

        //- Pagination
        .flex.justify-end.mt-6.px-2
            el-pagination(
                v-model:current-page="currentPage"
                :page-size="pagination.limit"
                :total="pagination.totalItems"
                layout="prev, pager, next"
                @current-change="handlePageChange"
            )
</template>

<script setup lang="ts">
import { Plus, Search } from '@element-plus/icons-vue';
import { getSalesOrders } from '~/composables/useSalesOrders';

const { hasPermission } = await usePermissions();
const router = useRouter();

const activeTab = ref('ALL');
const searchKey = ref('');
const currentPage = ref(1);
const orders = ref<any[]>([]);
const pagination = ref({ totalItems: 0, page: 1, limit: 10, totalPages: 1 });

const kpi = reactive({
    total: 0,
    processing: 0,
    shipped: 0,
    delivered: 0
});

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout>;
function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
        fetchOrders();
    }, 400);
}

async function fetchOrders() {
    const params = new URLSearchParams();
    params.append('page', String(currentPage.value));
    params.append('limit', '10');

    if (activeTab.value !== 'ALL') {
        params.append('status', activeTab.value);
    }
    if (searchKey.value) {
        params.append('searchKey', searchKey.value);
    }

    const result = await getSalesOrders(params.toString());
    orders.value = result.orders;
    pagination.value = result.pagination;
}

async function fetchKPIs() {
    // Fetch counts for KPI cards by querying different statuses
    const [allRes, processingRes, shippedRes, deliveredRes] = await Promise.all([
        getSalesOrders('limit=1'),
        getSalesOrders('status=PROCESSING&limit=1'),
        getSalesOrders('status=SHIPPED&limit=1'),
        getSalesOrders('status=DELIVERED&limit=1')
    ]);

    kpi.total = allRes.pagination.totalItems;
    kpi.processing = processingRes.pagination.totalItems;
    kpi.shipped = shippedRes.pagination.totalItems;
    kpi.delivered = deliveredRes.pagination.totalItems;
}

function handleTabChange(tab: string) {
    currentPage.value = 1;
    fetchOrders();
}

function handlePageChange(page: number) {
    currentPage.value = page;
    fetchOrders();
}

function handleRowClick(row: any) {
    router.push(`/sales/sales-orders/${row.id}`);
}

function formatDate(date: any) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Initial fetch
onMounted(async () => {
    await Promise.all([fetchOrders(), fetchKPIs()]);
});
</script>

<style scoped lang="scss">
.text-gradient {
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.bg-purple-500_10 { background: rgba(168, 85, 247, 0.1); }
.bg-purple-500_20 { background: rgba(168, 85, 247, 0.2); }
.border-purple-500_20 { border-color: rgba(168, 85, 247, 0.2); }
.bg-yellow-500_10 { background: rgba(234, 179, 8, 0.1); }
.border-yellow-500_20 { border-color: rgba(234, 179, 8, 0.2); }
.bg-blue-500_10 { background: rgba(59, 130, 246, 0.1); }
.border-blue-500_20 { border-color: rgba(59, 130, 246, 0.2); }
.bg-green-500_10 { background: rgba(34, 197, 94, 0.1); }
.border-green-500_20 { border-color: rgba(34, 197, 94, 0.2); }

.premium-table {
    :deep(.el-table) {
        background: transparent !important;
        --el-table-bg-color: transparent;
        --el-table-tr-bg-color: transparent;

        th.el-table__cell {
            background: rgba(168, 85, 247, 0.05) !important;
            color: var(--text-secondary);
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 1px;
        }

        td.el-table__cell {
            border-bottom: 1px solid rgba(168, 85, 247, 0.05) !important;
            padding: 16px 0;
        }
    }
}

.premium-input {
    :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.03) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 14px !important;
        box-shadow: none !important;
        height: 44px;
        &.is-focus,
        &:hover {
            border-color: var(--purple-500) !important;
            background: rgba(168, 85, 247, 0.05) !important;
        }
    }
}

.hover-scale {
    transition: transform 0.2s ease;
    cursor: pointer;
    &:hover {
        transform: scale(1.2);
    }
}

.cursor-pointer {
    cursor: pointer;
}
</style>
