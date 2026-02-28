<template lang="pug">
DetailLayout(
  :title="expense?.description || $t('finance.expenses.title')"
  :breadcrumbs="[{ label: $t('navigation.finance'), to: '/finance/expenses' }, { label: $t('finance.expenses.title'), to: '/finance/expenses' }, { label: expense?.description || '' }]"
  :hasSidebar="true"
)
  template(#dropdown-actions)
    el-dropdown-item
      NuxtLink.flex.items-center(:to="`/finance/expenses/create?edit=${expense?.id}`")
        Icon.text-md.mr-2(name="IconEdit" size="20")
        p.text-sm {{ $t('common.edit') }}
    el-dropdown-item(v-if="expense?.status === 'PENDING'" @click="handleApprove")
      .flex.items-center
        Icon.text-md.mr-2(name="ph:check-circle-bold" size="20")
        p.text-sm {{ $t('finance.expenses.approved') }}
    el-dropdown-item(v-if="expense?.status === 'PENDING'" @click="handleReject")
      .flex.items-center
        Icon.text-md.mr-2(name="ph:x-circle-bold" size="20")
        p.text-sm {{ $t('finance.expenses.rejected') }}
    el-dropdown-item(@click="deletePopup = true")
      .flex.items-center
        Icon.text-md.mr-2(name="IconDelete" size="20")
        p.text-sm {{ $t('common.delete') }}

  //- Main content
  el-tabs(v-model="activeTab")
    el-tab-pane(:label="$t('common.summary')" name="summary")
      .glass-card.p-8.rounded-3xl.mt-3
        .flex.items-center.gap-3.mb-6
          h3.text-2xl.font-semibold(style="color: var(--text-primary)") {{ expense?.description }}
          span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getStatusColor(expense?.status)}`") {{ expense?.status }}
        .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="ph:money-bold" size="20" class="mr-2")
              p {{ $t('finance.expenses.amount') }}
            p.text-lg.font-bold(style="color: var(--text-primary)") {{ formatCurrency(expense?.amount || 0) }}
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="ph:tag-bold" size="20" class="mr-2")
              p {{ $t('finance.expenses.category') }}
            p(style="color: var(--text-primary)") {{ expense?.category?.name || '—' }}
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="IconCalendar" size="20" class="mr-2")
              p {{ $t('finance.expenses.date') }}
            p(style="color: var(--text-primary)") {{ expense?.date }}
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="ph:storefront-bold" size="20" class="mr-2")
              p {{ $t('finance.expenses.vendor') }}
            p(style="color: var(--text-primary)") {{ expense?.vendor || '—' }}
          div(v-if="expense?.notes")
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="ph:note-bold" size="20" class="mr-2")
              p {{ $t('finance.expenses.notes') }}
            p(style="color: var(--text-primary)") {{ expense.notes }}
          div(v-if="expense?.submitter")
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="ph:user-bold" size="20" class="mr-2")
              p Submitted By
            p(style="color: var(--text-primary)") {{ expense.submitter.name }}

    el-tab-pane(:label="$t('common.timeline')" name="timeline")
      .mt-4
        RecordTimeline(entityType="expense" :entityId="route.params.id")

    el-tab-pane(:label="$t('common.comments')" name="comments")
      .mt-4
        RecordComments(entityType="expense" :entityId="route.params.id")

    el-tab-pane(:label="$t('common.attachments')" name="attachments")
      .mt-4
        RecordAttachments(entityType="expense" :entityId="route.params.id")

  //- Sidebar
  template(#sidebar)
    .glass-card.p-5.rounded-2xl
      h4.font-semibold.mb-4(style="color: var(--text-primary)") {{ $t('common.info') }}
      .space-y-3
        .flex.justify-between
          span.text-sm(style="color: var(--text-muted)") {{ $t('finance.expenses.status') }}
          span.text-sm.font-medium(:class="statusClass") {{ expense?.status }}
        .flex.justify-between
          span.text-sm(style="color: var(--text-muted)") {{ $t('finance.expenses.amount') }}
          span.text-sm.font-bold(style="color: var(--text-primary)") {{ formatCurrency(expense?.amount || 0) }}
        .flex.justify-between
          span.text-sm(style="color: var(--text-muted)") {{ $t('finance.expenses.date') }}
          span.text-sm(style="color: var(--text-primary)") {{ expense?.date }}

    .glass-card.p-5.rounded-2xl
      h4.font-semibold.mb-4(style="color: var(--text-primary)") {{ $t('common.actions') }}
      .space-y-2
        NuxtLink(:to="`/finance/expenses/create?edit=${expense?.id}`")
          el-button(class="w-full !rounded-xl" size="large") {{ $t('common.edit') }}
        el-button(v-if="expense?.status === 'PENDING'" type="success" class="w-full !rounded-xl" size="large" @click="handleApprove") {{ $t('finance.expenses.approved') }}
        el-button(v-if="expense?.status === 'PENDING'" type="danger" class="w-full !rounded-xl" size="large" @click="handleReject") {{ $t('finance.expenses.rejected') }}

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { fetchExpenseById, approveExpense, rejectExpense, deleteExpense } from '~/composables/useFinance';

definePageMeta({ middleware: 'permissions' });
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const activeTab = ref('summary');
const deletePopup = ref(false);
const deleting = ref(false);

const expense = ref(await fetchExpenseById(route.params.id as string));

const statusClass = computed(() => {
  const map: Record<string, string> = { PENDING: 'text-orange-500', APPROVED: 'text-green-500', REJECTED: 'text-red-500' };
  return map[expense.value?.status || ''] || '';
});

async function handleApprove() {
  const res = await approveExpense(Number(route.params.id));
  if (res.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('finance.expenses.approved') });
    expense.value = await fetchExpenseById(route.params.id as string);
  }
}

async function handleReject() {
  const res = await rejectExpense(Number(route.params.id));
  if (res.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('finance.expenses.rejected') });
    expense.value = await fetchExpenseById(route.params.id as string);
  }
}

async function confirmDelete() {
  deleting.value = true;
  try {
    const res = await deleteExpense(Number(route.params.id));
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      router.push('/finance/expenses');
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
