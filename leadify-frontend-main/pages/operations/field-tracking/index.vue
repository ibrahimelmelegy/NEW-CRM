<template lang="pug">
div
  ModuleHeader(
    :title="$t('fieldOps.title')"
    :subtitle="$t('fieldOps.subtitle')"
  )
    template(#actions)
      ExportButton(:data="checkIns" :columns="exportColumns" :filename="'field-tracking-export'" :title="$t('fieldOps.title')")
      el-button(size="large" type="success" @click="handleCheckIn" :loading="checkingIn" class="!rounded-2xl")
        Icon(name="ph:map-pin-bold" size="16" class="mr-1")
        span {{ $t('fieldOps.checkIn') }}
      el-button(size="large" @click="handleCheckOut" :loading="checkingOut" class="!rounded-2xl")
        Icon(name="ph:sign-out-bold" size="16" class="mr-1")
        span {{ $t('fieldOps.checkOut') }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    .px-6.flex.items-center.flex-wrap.gap-2.mb-6.justify-start
      .input.table-search(class="w-full md:w-[250px]")
        el-input(size="large" style="height:50px" v-model="search" :placeholder="$t('common.search') + ' ' + $t('fieldOps.title')" clearable @input="debounceLoad")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16")
      el-select(v-model="filters.type" clearable :placeholder="$t('fieldOps.allTypes')" @change="loadCheckIns" class="w-44" size="large")
        el-option(value="CHECK_IN" :label="$t('fieldOps.checkIn')")
        el-option(value="CHECK_OUT" :label="$t('fieldOps.checkOut')")
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :start-placeholder="$t('fieldOps.startDate')"
        :end-placeholder="$t('fieldOps.endDate')"
        @change="handleDateChange"
        size="large"
        value-format="YYYY-MM-DD"
      )
      el-button(v-if="filters.type || dateRange" size="large" @click="resetFilters" class="!rounded-2xl")
        Icon(name="ph:arrows-counter-clockwise" size="16" class="mr-1")
        span {{ $t('common.reset') }}

    el-table(:data="checkIns" v-loading="loading" style="width: 100%" :row-style="{cursor:'pointer'}" @current-change="handleRowClick")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('fieldOps.employee')" min-width="200")
        template(#default="{ row }")
          .flex.items-center.gap-3
            el-avatar(:size="32" :src="row.user?.profilePicture")
              span {{ row.user?.name?.charAt(0) || '?' }}
            div
              .font-bold(style="color: var(--text-primary)") {{ row.user?.name || $t('common.unknown') }}
              .text-xs(style="color: var(--text-muted)") {{ row.user?.email || '' }}
      el-table-column(:label="$t('fieldOps.type')" width="130")
        template(#default="{ row }")
          span.border.rounded-xl.text-xs.px-2(:class="row.type === 'CHECK_IN' ? 'label-outline-green' : 'label-outline-orange'") {{ row.type === 'CHECK_IN' ? $t('fieldOps.checkedIn') : $t('fieldOps.checkedOut') }}
      el-table-column(:label="$t('fieldOps.location')" min-width="250")
        template(#default="{ row }")
          .flex.items-start.gap-2
            Icon(name="ph:map-pin" size="16" style="color: var(--text-muted)" class="mt-1 flex-shrink-0")
            div
              .text-sm.font-medium(style="color: var(--text-primary)") {{ row.address || `${row.latitude?.toFixed(4)}, ${row.longitude?.toFixed(4)}` }}
              a.text-xs(
                style="color: #7849ff"
                :href="`https://www.google.com/maps?q=${row.latitude},${row.longitude}`"
                target="_blank"
                @click.stop
              ) {{ $t('fieldOps.viewOnMap') }}
      el-table-column(:label="$t('fieldOps.notes')" min-width="180")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-muted)") {{ row.notes || '—' }}
      el-table-column(:label="$t('fieldOps.date')" width="160")
        template(#default="{ row }")
          div
            .text-sm(style="color: var(--text-primary)") {{ formatDate(row.createdAt) }}
            .text-xs(style="color: var(--text-muted)") {{ formatTime(row.createdAt) }}
      el-table-column(:label="$t('common.action')" width="120" fixed="right")
        template(#default="{ row }")
          .flex.items-center.gap-1(@click.stop)
            el-button(text circle size="small" @click="handleRowClick(row)")
              Icon(name="ph:eye-bold" size="16" style="color: var(--text-muted)")
            el-button(text circle size="small" @click="deleteId = row?.id; deleteDialog = true")
              Icon(name="ph:trash-bold" size="16" style="color: #ef4444")
      template(#empty)
        el-empty(:description="$t('common.noData')" image="/images/empty.png")

    .pagination.mt-5.flex.items-center.flex-wrap.gap-2.px-6(class="sm:justify-between justify-center" v-if="pagination.totalPages > 1")
      span.text-xs(style="color: var(--text-muted)") {{ pagination.totalItems }} {{ $t('common.entries') }}
      el-pagination(background style="direction:ltr" :pager-count="4" v-model:current-page="currentPage" :page-size="20" layout="prev, pager, next" :total="pagination.totalItems" @current-change="loadCheckIns")

  //- Check-in Dialog
  el-dialog(v-model="showCheckInDialog" :title="checkInType === 'CHECK_IN' ? $t('fieldOps.checkIn') : $t('fieldOps.checkOut')" width="500px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('fieldOps.location')")
        el-input(v-model="locationText" disabled)
          template(#prepend)
            Icon(name="ph:map-pin" size="16")
      el-form-item(:label="$t('fieldOps.address') + ' (' + $t('common.optional') + ')'")
        el-input(v-model="checkInData.address" type="textarea" :rows="2" :placeholder="$t('fieldOps.enterAddress')")
      el-form-item(:label="$t('fieldOps.notes') + ' (' + $t('common.optional') + ')'")
        el-input(v-model="checkInData.notes" type="textarea" :rows="3" :placeholder="$t('fieldOps.enterNotes')")
    template(#footer)
      el-button(@click="showCheckInDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="handleSaveCheckIn" class="!rounded-2xl") {{ $t('common.save') }}

  ActionModel(v-model="deleteDialog" :loading="deleting" :description="$t('common.deleteConfirmMessage')" @confirm="handleDelete")

  //- Detail Dialog
  el-dialog(v-model="showDetailDialog" :title="$t('fieldOps.checkInDetails')" width="600px")
    .space-y-4(v-if="selectedCheckIn")
      .flex.items-center.gap-3.pb-4(style="border-bottom: 1px solid var(--border-default)")
        el-avatar(:size="48" :src="selectedCheckIn.user?.profilePicture")
          span.text-lg {{ selectedCheckIn.user?.name?.charAt(0) || '?' }}
        div
          p.font-bold.text-lg(style="color: var(--text-primary)") {{ selectedCheckIn.user?.name || $t('common.unknown') }}
          p.text-sm(style="color: var(--text-muted)") {{ selectedCheckIn.user?.email || '' }}
      .grid.grid-cols-2.gap-4
        div
          .text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('fieldOps.type') }}
          span.border.rounded-xl.text-xs.px-2(:class="selectedCheckIn.type === 'CHECK_IN' ? 'label-outline-green' : 'label-outline-orange'") {{ selectedCheckIn.type === 'CHECK_IN' ? $t('fieldOps.checkedIn') : $t('fieldOps.checkedOut') }}
        div
          .text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('fieldOps.date') }}
          p(style="color: var(--text-primary)") {{ new Date(selectedCheckIn.createdAt).toLocaleString() }}
      div
        .text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('fieldOps.location') }}
        p(style="color: var(--text-primary)") {{ selectedCheckIn.address || `${selectedCheckIn.latitude}, ${selectedCheckIn.longitude}` }}
        a.text-sm.mt-1.inline-block(
          style="color: #7849ff"
          :href="`https://www.google.com/maps?q=${selectedCheckIn.latitude},${selectedCheckIn.longitude}`"
          target="_blank"
        ) {{ $t('fieldOps.viewOnMap') }}
      div(v-if="selectedCheckIn.notes")
        .text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('fieldOps.notes') }}
        .glass-card.p-3
          p.text-sm(style="color: var(--text-primary)") {{ selectedCheckIn.notes }}
    template(#footer)
      el-button(@click="showDetailDialog = false") {{ $t('common.close') }}
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { ElNotification, ElMessage } from 'element-plus';
import type { FieldCheckIn } from '~/composables/useFieldOps';
import { fetchCheckIns, createCheckIn } from '~/composables/useFieldOps';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;

// Export columns
const exportColumns = [
  { prop: 'user', label: t('fieldOps.employee') },
  { prop: 'type', label: t('fieldOps.type') },
  { prop: 'address', label: t('fieldOps.location') },
  { prop: 'notes', label: t('fieldOps.notes') },
  { prop: 'createdAt', label: t('fieldOps.date') }
];

const loading = ref(true);
const checkingIn = ref(false);
const checkingOut = ref(false);
const saving = ref(false);
const checkIns = ref<FieldCheckIn[]>([]);
const search = ref('');
const currentPage = ref(1);
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });
const showCheckInDialog = ref(false);
const showDetailDialog = ref(false);
const selectedCheckIn = ref<FieldCheckIn | null>(null);
const dateRange = ref<[string, string] | null>(null);
const checkInType = ref<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

const deleteDialog = ref(false);
const deleteId = ref<number | null>(null);
const deleting = ref(false);

const filters = ref({ type: '', startDate: '', endDate: '' });

const checkInData = ref({ address: '', notes: '', latitude: 0, longitude: 0 });

const locationText = computed(() => {
  if (checkInData.value.latitude && checkInData.value.longitude) {
    return `${checkInData.value.latitude.toFixed(6)}, ${checkInData.value.longitude.toFixed(6)}`;
  }
  return '';
});

const summaryStats = computed(() => {
  const total = checkIns.value.length;
  const ins = checkIns.value.filter(c => c.type === 'CHECK_IN').length;
  const outs = checkIns.value.filter(c => c.type === 'CHECK_OUT').length;
  return [
    { label: t('fieldOps.totalCheckIns'), value: pagination.value.totalItems || total, icon: 'ph:map-pin-bold', color: '#7849ff' },
    { label: t('fieldOps.checkIn'), value: ins, icon: 'ph:sign-in-bold', color: '#22c55e' },
    { label: t('fieldOps.checkOut'), value: outs, icon: 'ph:sign-out-bold', color: '#f59e0b' }
  ];
});

let debounceTimer: ReturnType<typeof setTimeout>;
function debounceLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    loadCheckIns();
  }, 400);
}

onMounted(async () => {
  await loadCheckIns();
});

async function loadCheckIns() {
  loading.value = true;
  try {
    const params: Record<string, string> = { page: String(currentPage.value), limit: '20' };
    if (search.value) params.search = search.value;
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.startDate) params.startDate = filters.value.startDate;
    if (filters.value.endDate) params.endDate = filters.value.endDate;
    const result = await fetchCheckIns(params);
    checkIns.value = result.docs;
    pagination.value = result.pagination;
  } finally {
    loading.value = false;
  }
}

function handleDateChange(dates: [string, string] | null) {
  if (dates && dates.length === 2) {
    filters.value.startDate = dates[0];
    filters.value.endDate = dates[1];
  } else {
    filters.value.startDate = '';
    filters.value.endDate = '';
  }
  currentPage.value = 1;
  loadCheckIns();
}

function resetFilters() {
  filters.value = { type: '', startDate: '', endDate: '' };
  dateRange.value = null;
  search.value = '';
  currentPage.value = 1;
  loadCheckIns();
}

async function getLocation(): Promise<GeolocationPosition> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported');
  }
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
}

async function handleCheckIn() {
  checkingIn.value = true;
  checkInType.value = 'CHECK_IN';
  try {
    const position = await getLocation();
    checkInData.value = { latitude: position.coords.latitude, longitude: position.coords.longitude, address: '', notes: '' };
    showCheckInDialog.value = true;
  } catch (error: unknown) {
    const msg = error.code === 1 ? t('fieldOps.locationDenied') : t('fieldOps.locationError');
    ElNotification({ type: 'error', title: t('common.error'), message: msg });
  } finally {
    checkingIn.value = false;
  }
}

async function handleCheckOut() {
  checkingOut.value = true;
  checkInType.value = 'CHECK_OUT';
  try {
    const position = await getLocation();
    checkInData.value = { latitude: position.coords.latitude, longitude: position.coords.longitude, address: '', notes: '' };
    showCheckInDialog.value = true;
  } catch (error: unknown) {
    const msg = error.code === 1 ? t('fieldOps.locationDenied') : t('fieldOps.locationError');
    ElNotification({ type: 'error', title: t('common.error'), message: msg });
  } finally {
    checkingOut.value = false;
  }
}

async function handleSaveCheckIn() {
  saving.value = true;
  try {
    const { success } = await createCheckIn({
      type: checkInType.value,
      latitude: checkInData.value.latitude,
      longitude: checkInData.value.longitude,
      address: checkInData.value.address || undefined,
      notes: checkInData.value.notes || undefined
    });
    if (success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('fieldOps.checkInRecorded') });
      showCheckInDialog.value = false;
      await loadCheckIns();
    }
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const res = await useApiFetch('field-ops/' + deleteId.value, 'DELETE');
    if (res?.success) {
      ElMessage.success(t('common.deletedSuccess'));
      await loadCheckIns();
    } else {
      ElMessage.error(t('common.deleteError'));
    }
  } catch {
    ElMessage.error(t('common.deleteError'));
  } finally {
    deleting.value = false;
    deleteDialog.value = false;
    deleteId.value = null;
  }
}

function handleRowClick(row: FieldCheckIn) {
  selectedCheckIn.value = row;
  showDetailDialog.value = true;
}

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString() : '—';
}
function formatTime(d: string) {
  return d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
}
</script>
