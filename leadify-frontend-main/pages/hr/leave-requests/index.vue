<template lang="pug">
div
  ModuleHeader(
    :title="$t('hr.leave.title')"
    :subtitle="$t('hr.leave.subtitle')"
    :actions="headerActions"
  )
    template(#actions)
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'leave-requests-export'" :title="$t('hr.leave.title')")

  StatCards(:stats="summaryStats")

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

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")

  //- Reject dialog
  el-dialog(v-model="rejectPopup" :title="$t('hr.leave.reject')" width="500px")
    el-form(label-position="top")
      el-form-item(:label="$t('hr.leave.rejectionReason') || 'Reason'")
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
  { prop: 'period', label: t('hr.leave.period') || 'Period' },
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
    { label: t('hr.leave.pending') || 'Pending', value: pending, icon: 'ph:clock-bold', color: '#f59e0b' },
    { label: t('hr.leave.approved') || 'Approved', value: approved, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('hr.leave.rejected') || 'Rejected', value: rejected, icon: 'ph:x-circle-bold', color: '#ef4444' },
    { label: t('hr.leave.total') || 'Total', value: docs.length, icon: 'ph:calendar-bold', color: '#7849ff' }
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
    { prop: 'period', label: t('hr.leave.period') || 'Period', component: 'Text', type: 'font-default', width: 200 },
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
    ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.approved') || 'Approved' });
    await refreshData();
  }
}

async function confirmReject() {
  if (!rejectId.value) return;
  rejecting.value = true;
  try {
    const res = await rejectLeave(rejectId.value, rejectReason.value);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.rejected') || 'Rejected' });
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
    ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.cancelled') || 'Cancelled' });
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
</script>
