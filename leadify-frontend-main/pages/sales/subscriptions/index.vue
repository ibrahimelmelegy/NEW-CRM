<template lang="pug">
div
  .flex.items-center.justify-between.mb-5.mt-5
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('subscriptions.title') }}
    .flex.gap-3
      NuxtLink(to="/sales/subscriptions/metrics")
        el-button(size="large" class="!rounded-2xl")
          Icon.mr-1(name="ph:chart-line-up-bold" size="18")
          | {{ $t('subscriptions.metricsBtn') }}
      NuxtLink(to="/sales/subscriptions/plans")
        el-button(size="large" class="!rounded-2xl")
          Icon.mr-1(name="ph:package-bold" size="18")
          | {{ $t('subscriptions.managePlans') }}
      el-button(
        size="large"
        type="primary"
        class="!rounded-2xl"
        @click="showCreateDialog = true"
      )
        Icon.mr-1(name="ph:plus-bold" size="18")
        | {{ $t('subscriptions.newSubscription') }}

  //- Status filter tabs
  .glass-card.py-2.px-4.mb-6
    el-tabs(v-model="activeTab" @tab-change="onTabChange")
      el-tab-pane(:label="$t('common.all')" name="ALL")
      el-tab-pane(:label="$t('subscriptions.statusTrial')" name="TRIAL")
      el-tab-pane(:label="$t('subscriptions.statusActive')" name="ACTIVE")
      el-tab-pane(:label="$t('subscriptions.statusPastDue')" name="PAST_DUE")
      el-tab-pane(:label="$t('subscriptions.statusCancelled')" name="CANCELLED")
      el-tab-pane(:label="$t('subscriptions.statusExpired')" name="EXPIRED")

  //- Subscriptions table
  .glass-card.py-8.animate-entrance
    .px-6.mb-4.flex.items-center.justify-between
      el-input(
        v-model="searchKey"
        :placeholder="$t('subscriptions.searchByClient')"
        class="!w-72"
        clearable
        @clear="loadSubscriptions"
        @keyup.enter="loadSubscriptions"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="18")

    el-table(
      v-loading="loading"
      :data="subscriptions"
      style="width: 100%"
      @row-click="goToDetail"
      class="cursor-pointer"
    )
      el-table-column(prop="client.clientName" :label="$t('subscriptions.client')" min-width="180")
        template(#default="{ row }")
          .flex.items-center.gap-2
            Icon(name="ph:user-bold" size="18" style="color: var(--text-muted)")
            span {{ row.client?.clientName || 'N/A' }}
      el-table-column(prop="plan.name" :label="$t('subscriptions.plan')" min-width="140")
        template(#default="{ row }")
          span.font-medium {{ row.plan?.name || 'N/A' }}
      el-table-column(prop="status" :label="$t('common.status')" width="130")
        template(#default="{ row }")
          el-tag(
            :type="getSubscriptionStatusType(row.status)"
            size="small"
            effect="light"
          ) {{ getSubscriptionStatusLabel(row.status) }}
      el-table-column(:label="$t('common.amount')" width="140")
        template(#default="{ row }")
          span {{ formatSubscriptionCurrency(row.plan?.price, row.plan?.currency) }}
      el-table-column(:label="$t('subscriptions.billingCycle')" width="120")
        template(#default="{ row }")
          span {{ getBillingCycleLabel(row.plan?.billingCycle) }}
      el-table-column(prop="startDate" :label="$t('subscriptions.startDate')" width="130")
        template(#default="{ row }")
          span {{ formatDate(row.startDate) }}
      el-table-column(prop="currentPeriodEnd" :label="$t('subscriptions.periodEnd')" width="130")
        template(#default="{ row }")
          span {{ formatDate(row.currentPeriodEnd) }}
      el-table-column(prop="nextBillingDate" :label="$t('subscriptions.nextBilling')" width="130")
        template(#default="{ row }")
          span {{ row.nextBillingDate ? formatDate(row.nextBillingDate) : '-' }}
      el-table-column(:label="$t('common.action')" width="100" fixed="right")
        template(#default="{ row }")
          .flex.items-center(@click.stop)
            el-dropdown(trigger="click" class="outline-0")
              .toggle-icon.text-md
                Icon(name="IconToggle" size="22")
              template(#dropdown)
                el-dropdown-menu
                  el-dropdown-item(@click="goToDetail(row)")
                    Icon.mr-2(name="ph:eye-bold" size="16")
                    span {{ $t('common.view') }}
                  el-dropdown-item(
                    v-if="row.status !== 'CANCELLED' && row.status !== 'EXPIRED'"
                    @click="handleCancelSubscription(row)"
                  )
                    Icon.mr-2(name="ph:x-circle-bold" size="16" style="color: #ef4444")
                    span(style="color: #ef4444") {{ $t('subscriptions.cancel') }}

    //- Pagination
    .flex.justify-center.mt-6(v-if="pagination.totalPages > 1")
      el-pagination(
        v-model:current-page="currentPage"
        :page-size="pagination.limit"
        :total="pagination.totalItems"
        layout="prev, pager, next"
        @current-change="onPageChange"
      )

  //- Create Subscription Dialog
  el-dialog(
    v-model="showCreateDialog"
    :title="$t('subscriptions.newSubscription')"
    width="500px"
    :close-on-click-modal="false"
  )
    el-form(
      :model="newSubscription"
      label-position="top"
      @submit.prevent="handleCreateSubscription"
    )
      el-form-item(:label="$t('subscriptions.client')" required)
        el-select(
          v-model="newSubscription.clientId"
          filterable
          :placeholder="$t('subscriptions.selectClient')"
          style="width: 100%"
        )
          el-option(
            v-for="client in clients"
            :key="client.id"
            :label="client.clientName"
            :value="client.id"
          )
      el-form-item(:label="$t('subscriptions.plan')" required)
        el-select(
          v-model="newSubscription.planId"
          :placeholder="$t('subscriptions.selectPlan')"
          style="width: 100%"
        )
          el-option(
            v-for="plan in plans"
            :key="plan.id"
            :label="`${plan.name} - ${formatSubscriptionCurrency(plan.price, plan.currency)} / ${getBillingCycleLabel(plan.billingCycle)}`"
            :value="plan.id"
          )
    template(#footer)
      el-button(@click="showCreateDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleCreateSubscription" :loading="creating") {{ $t('common.create') }}
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchSubscriptions,
  createSubscription,
  cancelSubscription,
  fetchPlans,
  getSubscriptionStatusType,
  getSubscriptionStatusLabel,
  getBillingCycleLabel,
  formatSubscriptionCurrency,
  type CustomerSubscription,
  type SubscriptionPlan
} from '~/composables/useSubscriptions';

const router = useRouter();
const { t } = useI18n();

const loading = ref(false);
const creating = ref(false);
const subscriptions = ref<CustomerSubscription[]>([]);
const plans = ref<SubscriptionPlan[]>([]);
const clients = ref<Record<string, unknown>[]>([]);
const activeTab = ref('ALL');
const searchKey = ref('');
const currentPage = ref(1);
const showCreateDialog = ref(false);

const pagination = ref({
  totalItems: 0,
  page: 1,
  limit: 10,
  totalPages: 1
});

const newSubscription = ref({
  clientId: '',
  planId: ''
});

function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

async function loadSubscriptions() {
  loading.value = true;
  try {
    const params: string[] = [];
    params.push(`page=${currentPage.value}`);
    params.push(`limit=${pagination.value.limit}`);
    if (activeTab.value !== 'ALL') {
      params.push(`status=${activeTab.value}`);
    }
    if (searchKey.value) {
      params.push(`searchKey=${encodeURIComponent(searchKey.value)}`);
    }

    const result = await fetchSubscriptions(params.join('&'));
    subscriptions.value = result.subscriptions;
    pagination.value = result.pagination;
  } finally {
    loading.value = false;
  }
}

async function loadClients() {
  const { body, success } = await useApiFetch('client');
  if (success && body) {
    clients.value = Array.isArray(body) ? body : body.docs || [];
  }
}

async function loadPlans() {
  plans.value = await fetchPlans();
}

function onTabChange() {
  currentPage.value = 1;
  loadSubscriptions();
}

function onPageChange(page: number) {
  currentPage.value = page;
  loadSubscriptions();
}

function goToDetail(row: CustomerSubscription) {
  router.push(`/sales/subscriptions/${row.id}`);
}

async function handleCreateSubscription() {
  if (!newSubscription.value.clientId || !newSubscription.value.planId) return;
  creating.value = true;
  try {
    const result = await createSubscription(newSubscription.value);
    if (result) {
      showCreateDialog.value = false;
      newSubscription.value = { clientId: '', planId: '' };
      loadSubscriptions();
    }
  } finally {
    creating.value = false;
  }
}

async function handleCancelSubscription(row: CustomerSubscription) {
  try {
    await ElMessageBox.confirm(t('subscriptions.cancelConfirm'), t('subscriptions.cancelTitle'), {
      type: 'warning',
      confirmButtonText: t('subscriptions.cancelYes'),
      cancelButtonText: t('common.no')
    });
    const result = await cancelSubscription(String(row.id));
    if (result) {
      const sub = subscriptions.value.find(s => s.id === row.id);
      if (sub) sub.status = 'CANCELLED';
      ElMessage.success(t('subscriptions.cancelSuccess'));
    }
  } catch {
    // User cancelled dialog
  }
}

onMounted(() => {
  loadSubscriptions();
  loadClients();
  loadPlans();
});
</script>

<style scoped>
.glass-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e4e7ed);
  border-radius: 1rem;
}

.cursor-pointer :deep(.el-table__row) {
  cursor: pointer;
}

.animate-entrance {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
