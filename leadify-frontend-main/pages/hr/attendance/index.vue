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

  .att-kpi-grid
    StatCards(:stats="summaryStats")

  //- Desktop Table View
  .att-desktop-view
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

  //- Mobile Card View
  .att-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      //- Mobile Search
      .mb-3
        el-input(
          v-model="mobileSearch"
          size="large"
          :placeholder="`${$t('common.search')} ${$t('hr.attendance.title')}`"
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

      //- Attendance Cards
      .space-y-3(v-if="mobileFilteredData.length")
        .entity-card.p-4(v-for="record in mobileFilteredData" :key="record.id")
          .flex.items-start.justify-between.mb-3
            .flex.items-center.gap-3.min-w-0.flex-1
              .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                :style="{ background: getStatusColor(record.status) + '20', color: getStatusColor(record.status) }"
              ) {{ getInitial(record) }}
              .min-w-0.flex-1
                p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ record.employeeDetails?.title || '—' }}
                p.text-xs.truncate(style="color: var(--text-muted)") {{ record.date || '' }}
            el-tag.shrink-0(
              :type="getTagType(record.status)"
              size="small"
              effect="dark"
              round
            ) {{ record.status }}

          .grid.grid-cols-2.gap-2
            .flex.items-center.gap-2(v-if="record.checkInTime && record.checkInTime !== '—'")
              Icon(name="ph:sign-in" size="14" style="color: var(--text-muted)")
              span.text-xs(style="color: var(--text-secondary)") {{ record.checkInTime }}
            .flex.items-center.gap-2(v-if="record.checkOutTime && record.checkOutTime !== '—'")
              Icon(name="ph:sign-out" size="14" style="color: var(--text-muted)")
              span.text-xs(style="color: var(--text-secondary)") {{ record.checkOutTime }}
            .flex.items-center.gap-2.col-span-2(v-if="record.notes")
              Icon(name="ph:note" size="14" style="color: var(--text-muted)")
              span.text-xs.truncate(style="color: var(--text-secondary)") {{ record.notes }}

      //- Empty state
      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:calendar-check" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      //- Mobile result count
      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('hr.attendance.title').toLowerCase() }}

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
  columns: [] as Record<string, unknown>[],
  data: result.value.docs.map(formatRow) || [],
  sort: []
});

const summaryStats = computed(() => {
  const records = result.value.docs || [];
  const present = records.filter((r: Record<string, unknown>) => r.status === 'PRESENT').length;
  const late = records.filter((r: Record<string, unknown>) => r.status === 'LATE').length;
  const absent = records.filter((r: Record<string, unknown>) => r.status === 'ABSENT').length;
  return [
    { label: t('hr.attendance.present'), value: present, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('hr.attendance.late'), value: late, icon: 'ph:clock-bold', color: '#f59e0b' },
    { label: t('hr.attendance.absent'), value: absent, icon: 'ph:x-circle-bold', color: '#ef4444' },
    { label: t('hr.attendance.title'), value: records.length, icon: 'ph:users-bold', color: '#7849ff' }
  ];
});

function formatRow(r: Record<string, unknown>) {
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

// --- Mobile card view ---
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileStatusFilter = ref('ALL');
const mobileRefreshing = ref(false);

const statusFilters = computed(() => {
  const data = table.value.data || [];
  return [
    { value: 'ALL', label: t('hr.attendance.allStatuses'), color: '#22c55e', count: data.length },
    { value: 'PRESENT', label: t('hr.attendance.present'), color: '#22c55e', count: data.filter((r: Record<string, unknown>) => r.status === 'PRESENT').length },
    { value: 'LATE', label: t('hr.attendance.late'), color: '#f59e0b', count: data.filter((r: Record<string, unknown>) => r.status === 'LATE').length },
    { value: 'ABSENT', label: t('hr.attendance.absent'), color: '#ef4444', count: data.filter((r: Record<string, unknown>) => r.status === 'ABSENT').length }
  ];
});

function setMobileStatusFilter(value: string) {
  mobileStatusFilter.value = value;
  vibrate();
}

const mobileFilteredData = computed(() => {
  let data = table.value.data || [];
  if (mobileStatusFilter.value !== 'ALL') {
    data = data.filter((r: Record<string, unknown>) => r.status === mobileStatusFilter.value);
  }
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((r: Record<string, unknown>) => {
    const name = (r.employeeDetails?.title || '').toLowerCase();
    const date = (r.date || '').toLowerCase();
    const notes = (r.notes || '').toLowerCase();
    return name.includes(q) || date.includes(q) || notes.includes(q);
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

function getInitial(record: Record<string, unknown>): string {
  const name = record.employeeDetails?.title || '?';
  return name.charAt(0).toUpperCase();
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PRESENT: '#22c55e',
    LATE: '#f59e0b',
    ABSENT: '#ef4444',
    HALF_DAY: '#3b82f6',
    ON_LEAVE: '#94a3b8'
  };
  return map[status] || '#94a3b8';
}

function getTagType(status: string): string {
  const map: Record<string, string> = {
    PRESENT: 'success',
    LATE: 'warning',
    ABSENT: 'danger',
    HALF_DAY: '',
    ON_LEAVE: 'info'
  };
  return map[status] || 'info';
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('att', #22c55e);
</style>
