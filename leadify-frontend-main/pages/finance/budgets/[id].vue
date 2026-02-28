<template lang="pug">
DetailLayout(
  :title="budget?.name || $t('finance.budgets.title')"
  :breadcrumbs="[{ label: $t('navigation.finance'), to: '/finance/budgets' }, { label: $t('finance.budgets.title'), to: '/finance/budgets' }, { label: budget?.name || '' }]"
  :hasSidebar="true"
)
  template(#dropdown-actions)
    el-dropdown-item
      NuxtLink.flex.items-center(:to="`/finance/budgets/create?edit=${budget?.id}`")
        Icon.text-md.mr-2(name="IconEdit" size="20")
        p.text-sm {{ $t('common.edit') }}
    el-dropdown-item(@click="deletePopup = true")
      .flex.items-center
        Icon.text-md.mr-2(name="IconDelete" size="20")
        p.text-sm {{ $t('common.delete') }}

  //- Main content
  el-tabs(v-model="activeTab")
    el-tab-pane(:label="$t('common.summary')" name="summary")
      .glass-card.p-8.rounded-3xl.mt-3
        h3.text-2xl.font-semibold.mb-6(style="color: var(--text-primary)") {{ budget?.name }}
        //- Progress bar
        .mb-6
          .flex.justify-between.mb-2
            span.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('finance.budgets.totalSpent') }}
            span.text-sm.font-bold(:style="{ color: progressColor }") {{ usagePercent }}%
          el-progress(:percentage="usagePercent" :color="progressColor" :stroke-width="12")
          .flex.justify-between.mt-2
            span.text-sm(style="color: var(--text-muted)") {{ formatCurrency(budget?.spent || 0) }} / {{ formatCurrency(budget?.amount || 0) }}
            span.text-sm.font-medium(:style="{ color: progressColor }") {{ formatCurrency(remaining) }} {{ $t('finance.budgets.remaining') }}

        .grid.gap-4.mt-6(class="md:grid-cols-2 grid-cols-1")
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="ph:tag-bold" size="20" class="mr-2")
              p {{ $t('finance.budgets.category') }}
            p(style="color: var(--text-primary)") {{ budget?.category?.name || '—' }}
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="IconCalendar" size="20" class="mr-2")
              p {{ $t('finance.budgets.period') }}
            p(style="color: var(--text-primary)") {{ budget?.startDate }} → {{ budget?.endDate }}
          div(v-if="budget?.notes")
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="ph:note-bold" size="20" class="mr-2")
              p {{ $t('finance.budgets.notes') }}
            p(style="color: var(--text-primary)") {{ budget.notes }}

    el-tab-pane(:label="$t('common.timeline')" name="timeline")
      .mt-4
        RecordTimeline(entityType="budget" :entityId="route.params.id")

    el-tab-pane(:label="$t('common.comments')" name="comments")
      .mt-4
        RecordComments(entityType="budget" :entityId="route.params.id")

    el-tab-pane(:label="$t('common.attachments')" name="attachments")
      .mt-4
        RecordAttachments(entityType="budget" :entityId="route.params.id")

  //- Sidebar
  template(#sidebar)
    .glass-card.p-5.rounded-2xl
      h4.font-semibold.mb-4(style="color: var(--text-primary)") {{ $t('common.info') }}
      .space-y-3
        .flex.justify-between
          span.text-sm(style="color: var(--text-muted)") {{ $t('finance.budgets.amount') }}
          span.text-sm.font-bold(style="color: var(--text-primary)") {{ formatCurrency(budget?.amount || 0) }}
        .flex.justify-between
          span.text-sm(style="color: var(--text-muted)") {{ $t('finance.budgets.totalSpent') }}
          span.text-sm.font-bold.text-red-500 {{ formatCurrency(budget?.spent || 0) }}
        .flex.justify-between
          span.text-sm(style="color: var(--text-muted)") {{ $t('finance.budgets.remaining') }}
          span.text-sm.font-bold.text-green-500 {{ formatCurrency(remaining) }}

    .glass-card.p-5.rounded-2xl
      h4.font-semibold.mb-4(style="color: var(--text-primary)") {{ $t('common.actions') }}
      .space-y-2
        NuxtLink(:to="`/finance/budgets/create?edit=${budget?.id}`")
          el-button(class="w-full !rounded-xl" size="large") {{ $t('common.edit') }}

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { fetchBudgetById, deleteBudget } from '~/composables/useFinance';

definePageMeta({ middleware: 'permissions' });
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const activeTab = ref('summary');
const deletePopup = ref(false);
const deleting = ref(false);

const budget = ref(await fetchBudgetById(route.params.id as string));

const usagePercent = computed(() => {
  if (!budget.value || budget.value.amount <= 0) return 0;
  return Math.min(100, Math.round((budget.value.spent / budget.value.amount) * 100));
});

const remaining = computed(() => Math.max(0, (budget.value?.amount || 0) - (budget.value?.spent || 0)));

const progressColor = computed(() => {
  const pct = usagePercent.value;
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#22c55e';
});

async function confirmDelete() {
  deleting.value = true;
  try {
    const res = await deleteBudget(Number(route.params.id));
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      router.push('/finance/budgets');
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
}
</script>
