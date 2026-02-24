<template lang="pug">
div(v-loading="loading")
  .flex.items-center.justify-between.mb-5.mt-5
    .flex.items-center.gap-3
      el-button(circle size="small" @click="$router.back()")
        Icon(name="ph:arrow-left-bold" size="18")
      .title.font-bold.text-2xl.mb-1 {{ subscription?.client?.clientName || 'Subscription Detail' }}
      el-tag(
        v-if="subscription?.status"
        :type="getSubscriptionStatusType(subscription.status)"
        size="large"
        effect="light"
      ) {{ getSubscriptionStatusLabel(subscription.status) }}
    .flex.gap-3(v-if="subscription && subscription.status !== 'CANCELLED'")
      el-button(
        size="large"
        class="!rounded-2xl"
        @click="showChangePlanDialog = true"
      )
        Icon.mr-1(name="ph:swap-bold" size="18")
        | Change Plan
      el-button(
        size="large"
        type="danger"
        class="!rounded-2xl"
        @click="showCancelDialog = true"
      )
        Icon.mr-1(name="ph:x-circle-bold" size="18")
        | Cancel Subscription

  template(v-if="subscription")
    .grid.gap-6.mb-6(class="grid-cols-1 lg:grid-cols-2")
      //- Plan Info Card
      .glass-card.p-6.animate-entrance
        h3.text-lg.font-semibold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:package-bold" size="20" style="color: #7849ff")
          | Plan Information
        .grid.gap-4(class="grid-cols-2")
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Plan Name
            p.font-medium(style="color: var(--text-primary)") {{ subscription.plan?.name }}
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Price
            p.font-medium(style="color: var(--text-primary)") {{ formatSubscriptionCurrency(subscription.plan?.price || 0, subscription.plan?.currency) }}
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Billing Cycle
            p.font-medium(style="color: var(--text-primary)") {{ getBillingCycleLabel(subscription.plan?.billingCycle || '') }}
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Currency
            p.font-medium(style="color: var(--text-primary)") {{ subscription.plan?.currency || 'SAR' }}
        //- Features
        div(v-if="subscription.plan?.features?.length" class="mt-4")
          p.text-sm.mb-2(style="color: var(--text-muted)") Features
          .flex.flex-wrap.gap-2
            el-tag(
              v-for="(feature, idx) in subscription.plan.features"
              :key="idx"
              type="info"
              effect="plain"
              size="small"
            ) {{ feature }}

      //- Period Info Card
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.05s")
        h3.text-lg.font-semibold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:calendar-bold" size="20" style="color: #7849ff")
          | Period Information
        .grid.gap-4(class="grid-cols-2")
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Start Date
            p.font-medium(style="color: var(--text-primary)") {{ formatDate(subscription.startDate) }}
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Current Period Start
            p.font-medium(style="color: var(--text-primary)") {{ formatDate(subscription.currentPeriodStart) }}
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Current Period End
            p.font-medium(style="color: var(--text-primary)") {{ formatDate(subscription.currentPeriodEnd) }}
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Next Billing Date
            p.font-medium(style="color: var(--text-primary)") {{ subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : 'N/A' }}
        div(v-if="subscription.cancelledAt" class="mt-4")
          .grid.gap-4(class="grid-cols-2")
            div
              p.text-sm.mb-1(style="color: var(--text-muted)") Cancelled At
              p.font-medium.text-red-500 {{ formatDate(subscription.cancelledAt) }}
            div(v-if="subscription.cancelReason")
              p.text-sm.mb-1(style="color: var(--text-muted)") Cancel Reason
              p.font-medium(style="color: var(--text-primary)") {{ subscription.cancelReason }}

      //- Client Info Card
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.1s")
        h3.text-lg.font-semibold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:user-bold" size="20" style="color: #7849ff")
          | Client Information
        .grid.gap-4(class="grid-cols-2")
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Client Name
            p.font-medium(style="color: var(--text-primary)") {{ subscription.client?.clientName || 'N/A' }}
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Email
            p.font-medium(style="color: var(--text-primary)") {{ subscription.client?.email || 'N/A' }}
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Company
            p.font-medium(style="color: var(--text-primary)") {{ subscription.client?.companyName || 'N/A' }}

      //- Event Timeline
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.15s")
        h3.text-lg.font-semibold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:clock-clockwise-bold" size="20" style="color: #7849ff")
          | Event Timeline
        SubscriptionTimeline(:events="subscription.events || []")

  //- Cancel Dialog
  el-dialog(
    v-model="showCancelDialog"
    title="Cancel Subscription"
    width="450px"
    :close-on-click-modal="false"
  )
    p.mb-4(style="color: var(--text-secondary)") Are you sure you want to cancel this subscription? This action cannot be undone.
    el-form-item(label="Reason (optional)")
      el-input(
        v-model="cancelReason"
        type="textarea"
        :rows="3"
        placeholder="Enter cancellation reason..."
      )
    template(#footer)
      el-button(@click="showCancelDialog = false") Keep Subscription
      el-button(type="danger" @click="handleCancel" :loading="cancelling") Cancel Subscription

  //- Change Plan Dialog
  el-dialog(
    v-model="showChangePlanDialog"
    title="Change Subscription Plan"
    width="500px"
    :close-on-click-modal="false"
  )
    p.mb-4(style="color: var(--text-secondary)") Select a new plan for this subscription. Proration will be calculated automatically.
    el-form-item(label="New Plan")
      el-select(
        v-model="selectedNewPlanId"
        placeholder="Select plan"
        style="width: 100%"
      )
        el-option(
          v-for="plan in availablePlans"
          :key="plan.id"
          :label="`${plan.name} - ${formatSubscriptionCurrency(plan.price, plan.currency)} / ${getBillingCycleLabel(plan.billingCycle)}`"
          :value="plan.id"
          :disabled="plan.id === subscription?.planId"
        )
    template(#footer)
      el-button(@click="showChangePlanDialog = false") Cancel
      el-button(type="primary" @click="handleChangePlan" :loading="changingPlan" :disabled="!selectedNewPlanId") Change Plan
</template>

<script setup lang="ts">
import {
  fetchSubscriptionById,
  cancelSubscription,
  changeSubscriptionPlan,
  fetchPlans,
  getSubscriptionStatusType,
  getSubscriptionStatusLabel,
  getBillingCycleLabel,
  formatSubscriptionCurrency,
  type CustomerSubscription,
  type SubscriptionPlan
} from '~/composables/useSubscriptions';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const cancelling = ref(false);
const changingPlan = ref(false);
const subscription = ref<CustomerSubscription | null>(null);
const availablePlans = ref<SubscriptionPlan[]>([]);
const showCancelDialog = ref(false);
const showChangePlanDialog = ref(false);
const cancelReason = ref('');
const selectedNewPlanId = ref('');

function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

async function loadSubscription() {
  loading.value = true;
  try {
    const id = route.params.id as string;
    subscription.value = await fetchSubscriptionById(id);
  } finally {
    loading.value = false;
  }
}

async function loadPlans() {
  availablePlans.value = await fetchPlans();
}

async function handleCancel() {
  if (!subscription.value?.id) return;
  cancelling.value = true;
  try {
    const result = await cancelSubscription(subscription.value.id, cancelReason.value || undefined);
    if (result) {
      subscription.value = result;
      showCancelDialog.value = false;
      cancelReason.value = '';
    }
  } finally {
    cancelling.value = false;
  }
}

async function handleChangePlan() {
  if (!subscription.value?.id || !selectedNewPlanId.value) return;
  changingPlan.value = true;
  try {
    const result = await changeSubscriptionPlan(subscription.value.id, selectedNewPlanId.value);
    if (result) {
      subscription.value = result;
      showChangePlanDialog.value = false;
      selectedNewPlanId.value = '';
    }
  } finally {
    changingPlan.value = false;
  }
}

onMounted(() => {
  loadSubscription();
  loadPlans();
});
</script>

<style scoped>
.glass-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e4e7ed);
  border-radius: 1rem;
}

.animate-entrance {
  animation: fadeInUp 0.3s ease-out both;
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
