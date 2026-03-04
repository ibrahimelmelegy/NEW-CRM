<template lang="pug">
.plan-card(:class="{ 'plan-inactive': !plan.isActive }")
  .plan-header
    .flex.items-center.justify-between
      h3.plan-name {{ plan.name }}
      el-switch(
        :model-value="plan.isActive"
        size="small"
        @change="$emit('toggle', plan)"
      )
    .plan-price
      span.price-amount {{ formatSubscriptionCurrency(plan.price, plan.currency) }}
      span.price-cycle / {{ getBillingCycleLabel(plan.billingCycle).toLowerCase() }}

  .plan-body
    //- Description
    p.plan-description(v-if="plan.description") {{ plan.description }}

    //- Trial info
    .trial-badge(v-if="plan.trialDays && plan.trialDays > 0")
      Icon(name="ph:clock-bold" size="14")
      span {{ plan.trialDays }}-day free trial

    //- Features
    .plan-features(v-if="plan.features && plan.features.length > 0")
      .feature-item(v-for="(feature, idx) in plan.features" :key="idx")
        Icon(name="ph:check-circle-bold" size="16" style="color: #67c23a")
        span {{ feature }}
    .plan-features(v-else)
      .feature-item
        Icon(name="ph:info-bold" size="16" style="color: var(--text-muted)")
        span.text-sm(style="color: var(--text-muted)") No features listed

    //- Subscriber count
    .subscriber-count(v-if="plan.subscriptions")
      Icon(name="ph:users-bold" size="16" style="color: #7849ff")
      span {{ plan.subscriptions.length }} subscriber{{ plan.subscriptions.length !== 1 ? 's' : '' }}

  .plan-footer
    el-button(
      size="default"
      class="!rounded-xl !w-full"
      @click="$emit('edit', plan)"
    )
      Icon.mr-1(name="ph:pencil-simple-bold" size="16")
      | Edit Plan
</template>

<script setup lang="ts">
import { formatSubscriptionCurrency, getBillingCycleLabel, type SubscriptionPlan } from '~/composables/useSubscriptions';

defineProps<{
  plan: SubscriptionPlan;
}>();

defineEmits<{
  (e: 'edit', plan: SubscriptionPlan): void;
  (e: 'toggle', plan: SubscriptionPlan): void;
}>();
</script>

<style scoped>
.plan-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e4e7ed);
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.plan-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.plan-inactive {
  opacity: 0.6;
}

.plan-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border-color, #e4e7ed);
}

.plan-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #303133);
  margin-bottom: 8px;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-amount {
  font-size: 24px;
  font-weight: 700;
  color: #7849ff;
}

.price-cycle {
  font-size: 14px;
  color: var(--text-muted, #909399);
}

.plan-body {
  padding: 16px 20px;
}

.plan-description {
  font-size: 13px;
  color: var(--text-secondary, #606266);
  margin-bottom: 12px;
  line-height: 1.5;
}

.trial-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary, #303133);
}

.subscriber-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted, #909399);
  padding-top: 8px;
  border-top: 1px solid var(--border-color, #e4e7ed);
}

.plan-footer {
  padding: 12px 20px 16px;
}
</style>
