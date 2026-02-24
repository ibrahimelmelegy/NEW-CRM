<template lang="pug">
div
  ModuleHeader(
    :title="$t('hr.attendance.title')"
    :subtitle="$t('hr.attendance.subtitle')"
  )
    template(#actions)
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'attendance-export'" :title="$t('hr.attendance.title')")
      el-button(type="success" size="large" :loading="checkingIn" @click="handleCheckIn" class="!rounded-2xl")
        Icon(name="ph:sign-in-bold" size="16" class="mr-1")
        span {{ $t('hr.attendance.checkIn') }}
      el-button(type="warning" size="large" :loading="checkingOut" @click="handleCheckOut" class="!rounded-2xl")
        Icon(name="ph:sign-out-bold" size="16" class="mr-1")
        span {{ $t('hr.attendance.checkOut') }}

  StatCards(:stats="summaryStats")

  AppTable(
    v-slot="{data}"
    :externalLoading="loading"
    :filterOptions="filterOptions"
    :columns="table.columns"
    position="hr/attendance"
    :pageInfo="pagination"
    :data="table.data"
    :searchPlaceholder="$t('hr.attendance.title')"
    :key="table.data"
    :withoutAction="true"
  )

</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { fetchAttendance, clockIn, clockOut, ATTENDANCE_STATUSES } from '~/composables/useHR';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;

// Export columns
const exportColumns = [
  { prop: 'employeeDetails', label: t('hr.attendance.employee') },
  { prop: 'date', label: t('hr.attendance.date') },
  { prop: 'checkInTime', label: t('hr.attendance.checkIn') },
  { prop: 'checkOutTime', label: t('hr.attendance.checkOut') },
  { prop: 'status', label: t('hr.attendance.status') },
  { prop: 'notes', label: t('hr.attendance.notes') }
];

const loading = ref(false);
const checkingIn = ref(false);
const checkingOut = ref(false);

const result = ref(await fetchAttendance());
const pagination = ref(result.value.pagination);

const table = ref({
  columns: [] as any[],
  data: result.value.docs.map(formatRow) || [],
  sort: []
});

const summaryStats = computed(() => {
  const records = result.value.docs || [];
  const present = records.filter((r: any) => r.status === 'PRESENT').length;
  const late = records.filter((r: any) => r.status === 'LATE').length;
  const absent = records.filter((r: any) => r.status === 'ABSENT').length;
  return [
    { label: t('hr.attendance.present'), value: present, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('hr.attendance.late'), value: late, icon: 'ph:clock-bold', color: '#f59e0b' },
    { label: t('hr.attendance.absent'), value: absent, icon: 'ph:x-circle-bold', color: '#ef4444' },
    { label: t('hr.attendance.title'), value: records.length, icon: 'ph:users-bold', color: '#7849ff' }
  ];
});

function formatRow(r: any) {
  return {
    ...r,
    employeeDetails: { title: r.user?.name || '—', image: r.user?.profilePicture, withImage: true },
    checkInTime: r.checkIn || '—',
    checkOutTime: r.checkOut || '—',
    status: r.status
  };
}

const updateColumns = () => {
  table.value.columns = [
    { prop: 'employeeDetails', label: t('hr.attendance.employee'), component: 'AvatarText', type: 'font-bold', width: 200 },
    { prop: 'date', label: t('hr.attendance.date'), component: 'Text', sortable: true, type: 'font-default', width: 130 },
    { prop: 'checkInTime', label: t('hr.attendance.checkIn'), component: 'Text', type: 'font-default', width: 120 },
    { prop: 'checkOutTime', label: t('hr.attendance.checkOut'), component: 'Text', type: 'font-default', width: 120 },
    {
      prop: 'status',
      label: t('hr.attendance.status'),
      component: 'Label',
      type: 'outline',
      filters: ATTENDANCE_STATUSES.map(s => ({ text: s.label, value: s.value })),
      width: 140
    },
    { prop: 'notes', label: t('hr.attendance.notes'), component: 'Text', type: 'font-default', width: 200 }
  ];
};
updateColumns();

const filterOptions = computed(() => [
  { title: t('hr.attendance.status'), value: 'status', options: ATTENDANCE_STATUSES.map(s => ({ label: s.label, value: s.value })) },
  { title: t('hr.attendance.date'), value: ['startDate', 'endDate'], type: 'date' }
]);

async function handleCheckIn() {
  checkingIn.value = true;
  try {
    const res = await clockIn();
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.attendance.checkedIn') });
      await refreshData();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    checkingIn.value = false;
  }
}

async function handleCheckOut() {
  checkingOut.value = true;
  try {
    const res = await clockOut();
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.attendance.checkedOut') });
      await refreshData();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    checkingOut.value = false;
  }
}

async function refreshData() {
  loading.value = true;
  result.value = await fetchAttendance();
  table.value.data = result.value.docs.map(formatRow);
  pagination.value = result.value.pagination;
  loading.value = false;
}
</script>
