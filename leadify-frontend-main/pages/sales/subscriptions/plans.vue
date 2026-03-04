<template lang="pug">
div
  .flex.items-center.justify-between.mb-5.mt-5
    .flex.items-center.gap-3
      el-button(circle size="small" @click="$router.back()")
        Icon(name="ph:arrow-left-bold" size="18")
      .title.font-bold.text-2xl.mb-1.capitalize {{ $t('subscriptions.plansTitle') }}
    .flex.gap-3
      el-switch(
        v-model="showInactive"
        :active-text="$t('subscriptions.showInactive')"
        @change="loadPlans"
        class="mr-4"
      )
      el-button(
        size="large"
        type="primary"
        class="!rounded-2xl"
        @click="openPlanDialog()"
      )
        Icon.mr-1(name="ph:plus-bold" size="18")
        | {{ $t('subscriptions.addPlan') }}

  //- Plan cards grid
  .grid.gap-6(v-loading="loading" class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
    PlanCard(
      v-for="plan in plans"
      :key="plan.id"
      :plan="plan"
      @edit="openPlanDialog(plan)"
      @toggle="togglePlanStatus(plan)"
    )

  //- Empty state
  .glass-card.p-12.text-center(v-if="!loading && plans.length === 0")
    Icon(name="ph:package-bold" size="64" style="color: var(--text-muted)")
    h3.text-xl.font-semibold.mt-4(style="color: var(--text-primary)") {{ $t('subscriptions.noPlansFound') }}
    p.mt-2(style="color: var(--text-muted)") {{ $t('subscriptions.noPlansDesc') }}

  //- Plan Dialog
  el-dialog(
    v-model="showPlanDialog"
    :title="editingPlan ? $t('subscriptions.editPlan') : $t('subscriptions.createPlan')"
    width="600px"
    :close-on-click-modal="false"
  )
    el-form(
      :model="planForm"
      label-position="top"
    )
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('subscriptions.planName')" required)
          el-input(v-model="planForm.name" :placeholder="$t('subscriptions.planNamePlaceholder')")
        el-form-item(:label="$t('subscriptions.billingCycle')" required)
          el-select(v-model="planForm.billingCycle" :placeholder="$t('subscriptions.billingCycle')" style="width: 100%")
            el-option(
              v-for="opt in billingCycleOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            )
        el-form-item(:label="$t('subscriptions.price')" required)
          el-input-number(
            v-model="planForm.price"
            :min="0"
            :precision="2"
            :step="10"
            style="width: 100%"
          )
        el-form-item(:label="$t('subscriptions.currency')")
          el-input(v-model="planForm.currency" placeholder="SAR")
        el-form-item(:label="$t('subscriptions.trialDays')")
          el-input-number(
            v-model="planForm.trialDays"
            :min="0"
            :step="1"
            style="width: 100%"
          )

      el-form-item(:label="$t('subscriptions.description')")
        el-input(
          v-model="planForm.description"
          type="textarea"
          :rows="3"
          :placeholder="$t('subscriptions.descriptionPlaceholder')"
        )

      //- Features editable list
      el-form-item(:label="$t('subscriptions.features')")
        .flex.flex-col.gap-2.w-full
          .flex.items-center.gap-2(
            v-for="(feature, idx) in planForm.features"
            :key="idx"
          )
            el-input(
              v-model="planForm.features[idx]"
              :placeholder="$t('subscriptions.featureDescription')"
              size="default"
            )
            el-button(
              type="danger"
              circle
              size="small"
              @click="removeFeature(idx)"
            )
              Icon(name="ph:x-bold" size="14")
          el-button(
            type="primary"
            plain
            size="small"
            @click="addFeature"
            class="!w-fit"
          )
            Icon.mr-1(name="ph:plus-bold" size="14")
            | {{ $t('subscriptions.addFeature') }}

    template(#footer)
      el-button(@click="showPlanDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSavePlan" :loading="saving") {{ editingPlan ? $t('subscriptions.update') : $t('subscriptions.create') }}
</template>

<script setup lang="ts">
import { fetchPlans, createPlan, updatePlan, deletePlan, billingCycleOptions, type SubscriptionPlan } from '~/composables/useSubscriptions';

const loading = ref(false);
const saving = ref(false);
const plans = ref<SubscriptionPlan[]>([]);
const showPlanDialog = ref(false);
const showInactive = ref(false);
const editingPlan = ref<SubscriptionPlan | null>(null);

const defaultPlanForm = () => ({
  name: '',
  description: '',
  billingCycle: '',
  price: 0,
  currency: 'SAR',
  trialDays: 0,
  features: [] as string[]
});

const planForm = ref(defaultPlanForm());

async function loadPlans() {
  loading.value = true;
  try {
    plans.value = await fetchPlans(showInactive.value);
  } finally {
    loading.value = false;
  }
}

function openPlanDialog(plan?: SubscriptionPlan) {
  if (plan) {
    editingPlan.value = plan;
    planForm.value = {
      name: plan.name,
      description: plan.description || '',
      billingCycle: plan.billingCycle,
      price: Number(plan.price),
      currency: plan.currency || 'SAR',
      trialDays: plan.trialDays || 0,
      features: plan.features ? [...plan.features] : []
    };
  } else {
    editingPlan.value = null;
    planForm.value = defaultPlanForm();
  }
  showPlanDialog.value = true;
}

function addFeature() {
  planForm.value.features.push('');
}

function removeFeature(idx: number) {
  planForm.value.features.splice(idx, 1);
}

async function handleSavePlan() {
  if (!planForm.value.name || !planForm.value.billingCycle || !planForm.value.price) return;

  saving.value = true;
  try {
    // Filter out empty features
    const data = {
      ...planForm.value,
      features: planForm.value.features.filter(f => f.trim() !== '')
    };

    if (editingPlan.value?.id) {
      await updatePlan(editingPlan.value.id, data);
    } else {
      await createPlan(data);
    }

    showPlanDialog.value = false;
    loadPlans();
  } finally {
    saving.value = false;
  }
}

async function togglePlanStatus(plan: SubscriptionPlan) {
  if (!plan.id) return;
  if (plan.isActive) {
    await deletePlan(plan.id);
  } else {
    await updatePlan(plan.id, { isActive: true });
  }
  loadPlans();
}

onMounted(() => {
  loadPlans();
});
</script>

<style scoped>
.glass-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e4e7ed);
  border-radius: 1rem;
}
</style>
