<template lang="pug">
div
  ModuleHeader(
    :title="$t('hr.leave.title')"
    :subtitle="$t('hr.leave.subtitle')"
    :actions="headerActions"
  )
    template(#actions)
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'leave-requests-export'" :title="$t('hr.leave.title')")

  .leave-kpi-grid
    StatCards(:stats="summaryStats")

  //- Desktop Table View
  .leave-desktop-view
    AppTable(
      v-slot="{data}"
      :externalLoading="loading"
      :filterOptions="filterOptions"
      :columns="table.columns"
      position="hr/leave-requests"
      :pageInfo="pagination"
      :data="table.data"
      @handleRowClick="handleRowClick"
      :searchPlaceholder="$t('hr.leave.title')"
      :key="table.data"
    )
      .flex.items-center.py-2(@click.stop)
        el-dropdown(class="outline-0" trigger="click")
          span(class="el-dropdown-link")
            .toggle-icon.text-md
              Icon(name="IconToggle" size="22")
          template(#dropdown)
            el-dropdown-menu
              el-dropdown-item
                NuxtLink.flex.items-center(:to="`/hr/leave-requests/${data?.id}`")
                  Icon.text-md.mr-2(name="IconEye")
                  p.text-sm {{ $t('common.view') }}
              el-dropdown-item(v-if="data?.status === 'PENDING'" @click="handleApprove(data?.id)")
                .flex.items-center
                  Icon.text-md.mr-2(name="ph:check-circle-bold")
                  p.text-sm {{ $t('hr.leave.approve') }}
              el-dropdown-item(v-if="data?.status === 'PENDING'" @click="[rejectId = data?.id, rejectPopup = true]")
                .flex.items-center
                  Icon.text-md.mr-2(name="ph:x-circle-bold")
                  p.text-sm {{ $t('hr.leave.reject') }}
              el-dropdown-item(v-if="data?.status === 'PENDING'" @click="handleCancel(data?.id)")
                .flex.items-center
                  Icon.text-md.mr-2(name="ph:prohibit-bold")
                  p.text-sm {{ $t('common.cancel') }}
              el-dropdown-item(@click="[deleteId = data?.id, deletePopup = true]")
                .flex.items-center
                  Icon.text-md.mr-2(name="IconDelete")
                  p.text-sm {{ $t('common.delete') }}

  //- Mobile Card View
  .leave-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      //- Mobile Search
      .mb-3
        el-input(
          v-model="mobileSearch"
          size="large"
          :placeholder="`${$t('common.search')} ${$t('hr.leave.title')}`"
          clearable
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      //- Status Filter Pills
      .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.status-pill(
          v-for="filter in statusFilters"
          :key="filter.value"
          :class="{ 'status-pill--active': mobileStatusFilter === filter.value }"
          :style="mobileStatusFilter === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="setMobileStatusFilter(filter.value)"
        )
          span {{ filter.label }}
          span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

      //- Leave Request Cards with Swipe Actions
      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="request in mobileFilteredData"
          :key="request.id"
          :rightActions="getSwipeRightActions(request)"
          :leftActions="getSwipeLeftActions(request)"
          @action="(name) => handleSwipeAction(name, request)"
        )
          .entity-card.p-4(@click="handleRowClick(request)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: getStatusColor(request.status) + '20', color: getStatusColor(request.status) }"
                ) {{ getInitial(request) }}
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ request.employeeDetails?.title || '—' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ request.leaveTypeLabel || '' }}
              el-tag.shrink-0(
                :type="getTagType(request.status)"
                size="small"
                effect="dark"
                round
              ) {{ request.status }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="request.period")
                Icon(name="ph:calendar-blank" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ request.period }}
              .flex.items-center.gap-2.col-span-2(v-if="request.reason")
                Icon(name="ph:chat-text" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ request.reason }}

      //- Empty state
      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:calendar-x" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      //- Mobile result count
      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('hr.leave.title').toLowerCase() }}

    //- Floating Action Button
    .mobile-fab(@click="navigateTo('/hr/leave-requests/create')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")

  //- Reject dialog
  el-dialog(v-model="rejectPopup" :title="$t('hr.leave.reject')" width="500px")
    el-form(label-position="top")
      el-form-item(:label="$t('hr.leave.rejectionReason')")
        el-input(v-model="rejectReason" type="textarea" :rows="3")
    template(#footer)
      el-button(@click="rejectPopup = false") {{ $t('common.cancel') }}
      el-button(type="danger" :loading="rejecting" @click="confirmReject" class="!rounded-2xl") {{ $t('hr.leave.reject') }}
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { fetchLeaveRequests, approveLeave, rejectLeave, cancelLeave, deleteLeaveRequest, LEAVE_STATUSES, LEAVE_TYPES } from '~/composables/useHR';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;
const router = useRouter();

// Export columns
const exportColumns = [
  { prop: 'employeeDetails', label: t('hr.leave.employee') },
  { prop: 'leaveTypeLabel', label: t('hr.leave.type') },
  { prop: 'period', label: t('hr.leave.period') },
  { prop: 'reason', label: t('hr.leave.reason') },
  { prop: 'status', label: t('hr.leave.status') }
];

const loading = ref(false);
const deleting = ref(false);
const rejecting = ref(false);
const deletePopup = ref(false);
const rejectPopup = ref(false);
const deleteId = ref<number | null>(null);
const rejectId = ref<number | null>(null);
const rejectReason = ref('');

const headerActions = computed(() => [{ label: t('hr.leave.requestLeave'), to: '/hr/leave-requests/create', type: 'primary', icon: Plus }]);

const result = ref(await fetchLeaveRequests());
const pagination = ref(result.value.pagination);

const summaryStats = computed(() => {
  const docs = result.value.docs || [];
  const pending = docs.filter((r: any) => r.status === 'PENDING').length;
  const approved = docs.filter((r: any) => r.status === 'APPROVED').length;
  const rejected = docs.filter((r: any) => r.status === 'REJECTED').length;
  return [
    { label: t('hr.leave.pending'), value: pending, icon: 'ph:clock-bold', color: '#f59e0b' },
    { label: t('hr.leave.approved'), value: approved, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('hr.leave.rejected'), value: rejected, icon: 'ph:x-circle-bold', color: '#ef4444' },
    { label: t('hr.leave.total'), value: docs.length, icon: 'ph:calendar-bold', color: '#7849ff' }
  ];
});

const table = ref({
  columns: [] as any[],
  data: result.value.docs.map(formatRow) || [],
  sort: []
});

function formatRow(r: any) {
  return {
    ...r,
    employeeDetails: { title: r.user?.name || '—', image: r.user?.profilePicture, withImage: true },
    period: `${r.startDate} → ${r.endDate}`,
    leaveTypeLabel: r.leaveType
  };
}

const updateColumns = () => {
  table.value.columns = [
    { prop: 'employeeDetails', label: t('hr.leave.employee'), component: 'AvatarText', type: 'font-bold', width: 200 },
    { prop: 'leaveTypeLabel', label: t('hr.leave.type'), component: 'Text', type: 'font-default', width: 120 },
    { prop: 'period', label: t('hr.leave.period'), component: 'Text', type: 'font-default', width: 200 },
    { prop: 'reason', label: t('hr.leave.reason'), component: 'Text', type: 'font-default', width: 200 },
    {
      prop: 'status',
      label: t('hr.leave.status'),
      component: 'Label',
      type: 'outline',
      filters: LEAVE_STATUSES.map(s => ({ text: s.label, value: s.value })),
      width: 140
    }
  ];
};
updateColumns();

const filterOptions = computed(() => [
  { title: t('hr.leave.status'), value: 'status', options: LEAVE_STATUSES.map(s => ({ label: s.label, value: s.value })) },
  { title: t('hr.leave.type'), value: 'leaveType', options: LEAVE_TYPES.map(s => ({ label: s.label, value: s.value })) }
]);

function handleRowClick(row: any) {
  router.push(`/hr/leave-requests/${row.id}`);
}

async function handleApprove(id: number) {
  const res = await approveLeave(id);
  if (res.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.approved') });
    await refreshData();
  }
}

async function confirmReject() {
  if (!rejectId.value) return;
  rejecting.value = true;
  try {
    const res = await rejectLeave(rejectId.value, rejectReason.value);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.rejected') });
      rejectPopup.value = false;
      rejectReason.value = '';
      await refreshData();
    }
  } finally {
    rejecting.value = false;
  }
}

async function handleCancel(id: number) {
  const res = await cancelLeave(id);
  if (res.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.cancelled') });
    await refreshData();
  }
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const res = await deleteLeaveRequest(deleteId.value);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      await refreshData();
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
  }
}

async function refreshData() {
  loading.value = true;
  result.value = await fetchLeaveRequests();
  table.value.data = result.value.docs.map(formatRow);
  pagination.value = result.value.pagination;
  loading.value = false;
}

// --- Mobile card view ---
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileStatusFilter = ref('ALL');
const mobileRefreshing = ref(false);

const statusFilters = computed(() => {
  const data = table.value.data || [];
  return [
    { value: 'ALL', label: t('hr.leave.allStatuses'), color: '#f59e0b', count: data.length },
    { value: 'PENDING', label: t('hr.leave.pending'), color: '#f59e0b', count: data.filter((r: any) => r.status === 'PENDING').length },
    { value: 'APPROVED', label: t('hr.leave.approved'), color: '#22c55e', count: data.filter((r: any) => r.status === 'APPROVED').length },
    { value: 'REJECTED', label: t('hr.leave.rejected'), color: '#ef4444', count: data.filter((r: any) => r.status === 'REJECTED').length }
  ];
});

function setMobileStatusFilter(value: string) {
  mobileStatusFilter.value = value;
  vibrate();
}

const mobileFilteredData = computed(() => {
  let data = table.value.data || [];
  if (mobileStatusFilter.value !== 'ALL') {
    data = data.filter((r: any) => r.status === mobileStatusFilter.value);
  }
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((r: any) => {
    const name = (r.employeeDetails?.title || '').toLowerCase();
    const type = (r.leaveTypeLabel || '').toLowerCase();
    const reason = (r.reason || '').toLowerCase();
    const period = (r.period || '').toLowerCase();
    return name.includes(q) || type.includes(q) || reason.includes(q) || period.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    await refreshData();
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function getSwipeRightActions(request: any) {
  if (request.status !== 'PENDING') return [];
  return [{ name: 'approve', label: t('hr.leave.approve'), icon: 'ph:check-circle-bold', color: '#22c55e' }];
}

function getSwipeLeftActions(request: any) {
  if (request.status !== 'PENDING') return [];
  return [{ name: 'reject', label: t('hr.leave.reject'), icon: 'ph:x-circle-bold', color: '#ef4444' }];
}

function handleSwipeAction(name: string, request: any) {
  vibrate();
  switch (name) {
    case 'approve':
      handleApprove(request.id);
      break;
    case 'reject':
      rejectId.value = request.id;
      rejectPopup.value = true;
      break;
  }
}

function getInitial(request: any): string {
  const name = request.employeeDetails?.title || '?';
  return name.charAt(0).toUpperCase();
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: '#f59e0b',
    APPROVED: '#22c55e',
    REJECTED: '#ef4444',
    CANCELLED: '#94a3b8'
  };
  return map[status] || '#94a3b8';
}

function getTagType(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'info'
  };
  return map[status] || 'info';
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('leave', #f59e0b);
</style>
