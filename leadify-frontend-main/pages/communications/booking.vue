<template lang="pug">
div.animate-fade-in
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('booking.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('booking.subtitle') }}
    .flex.items-center.gap-3
      el-button(type="primary" size="large" @click="openCreateDialog" class="!rounded-xl")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ $t('booking.newBooking') }}

  //- Stats Cards
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:calendar-check-bold" size="20" style="color: #7849ff")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ stats.total }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('booking.totalBookings') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:clock-bold" size="20" style="color: #3b82f6")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ stats.today }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('booking.today') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:calendar-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ stats.upcoming }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('booking.upcoming') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ stats.completed }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('booking.completed') }}

  //- Upcoming Bookings
  .glass-card.p-5.rounded-2xl.mb-6
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:calendar-dots-bold" size="20" class="mr-2" style="color: #7849ff")
        | {{ $t('booking.upcomingBookings') }}
      el-button(size="small" text @click="loadUpcoming" :loading="loadingUpcoming")
        Icon(name="ph:arrows-clockwise" size="14")
    .flex.items-center.justify-center.py-6(v-if="loadingUpcoming")
      el-icon.is-loading(:size="20" style="color: var(--accent-color, #7849ff)")
    .space-y-3(v-else-if="upcomingBookings.length")
      .flex.items-center.justify-between.p-3.rounded-xl(
        v-for="(ub, idx) in upcomingBookings"
        :key="idx"
        style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
      )
        .flex.items-center.gap-3
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
            Icon(name="ph:calendar-check" size="18" style="color: #7849ff")
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ ub.clientName || '--' }}
            p.text-xs(style="color: var(--text-muted)") {{ ub.staffName || ub.staffId || '--' }} &middot; {{ ub.type || 'MEETING' }}
        .text-end
          p.text-sm.font-bold(style="color: #7849ff") {{ formatDate(ub.date) }}
          p.text-xs(style="color: var(--text-muted)") {{ ub.startTime || '--' }} - {{ ub.endTime || '--' }}
    .text-center.py-6(v-else)
      Icon(name="ph:calendar-blank" size="32" style="color: var(--text-muted)")
      p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('booking.noUpcoming') }}

  //- Availability Checker
  .glass-card.p-5.rounded-2xl.mb-6
    h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
      Icon(name="ph:clock-countdown-bold" size="20" class="mr-2" style="color: #3b82f6")
      | {{ $t('booking.availabilityChecker') }}
    el-row(:gutter="16" align="bottom")
      el-col(:span="8")
        el-form-item(:label="$t('booking.staff')" style="margin-bottom: 0")
          el-select(
            v-model="availStaffId"
            :placeholder="$t('booking.selectStaff')"
            style="width: 100%"
            size="large"
            filterable
            clearable
          )
            el-option(
              v-for="user in staffList"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            )
      el-col(:span="8")
        el-form-item(:label="$t('booking.date')" style="margin-bottom: 0")
          el-date-picker(
            v-model="availDate"
            type="date"
            :placeholder="$t('booking.selectDate')"
            style="width: 100%"
            size="large"
            value-format="YYYY-MM-DD"
          )
      el-col(:span="8")
        el-button(
          type="primary"
          size="large"
          @click="checkAvailability"
          :loading="loadingAvailability"
          :disabled="!availStaffId || !availDate"
          class="!rounded-xl"
          style="width: 100%"
        )
          Icon(name="ph:magnifying-glass-bold" size="16" class="mr-1")
          | {{ $t('booking.check') }}
    //- Available Slots
    .mt-4(v-if="availableSlots !== null")
      .flex.items-center.gap-2.mb-3(v-if="availableSlots.length")
        Icon(name="ph:check-circle-bold" size="16" style="color: #22c55e")
        span.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('booking.availableSlots') }}
      .flex.flex-wrap.gap-2(v-if="availableSlots.length")
        el-tag(
          v-for="(slot, idx) in availableSlots"
          :key="idx"
          size="large"
          effect="plain"
          round
          style="cursor: pointer"
          @click="prefillSlot(slot)"
        )
          Icon(name="ph:clock" size="14" class="mr-1")
          | {{ slot.startTime || slot.start || slot }} {{ slot.endTime ? '- ' + slot.endTime : '' }}
      .flex.items-center.gap-2(v-else)
        Icon(name="ph:x-circle-bold" size="16" style="color: #ef4444")
        span.text-sm(style="color: #ef4444") {{ $t('booking.noSlots') }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Bookings Table
  .glass-card.p-4(v-else)
    .flex.items-center.justify-between.mb-4
      el-input(
        v-model="searchQuery"
        :placeholder="$t('booking.search')"
        clearable
        style="max-width: 320px"
        size="large"
        class="!rounded-xl"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")
      .flex.items-center.gap-2
        el-select(v-model="statusFilter" clearable :placeholder="$t('booking.filterStatus')" size="large" style="width: 160px")
          el-option(:label="$t('common.all')" value="")
          el-option(:label="$t('common.pending')" value="PENDING")
          el-option(:label="$t('common.confirmed')" value="CONFIRMED")
          el-option(:label="$t('common.cancelled')" value="CANCELLED")
          el-option(:label="$t('common.completed')" value="COMPLETED")
          el-option(:label="$t('booking.noShow')" value="NO_SHOW")

    el-table(:data="filteredBookings" v-loading="loading" stripe style="width: 100%" @row-click="handleRowClick" row-class-name="cursor-pointer")
      el-table-column(:label="$t('booking.clientName')" min-width="180")
        template(#default="{ row }")
          .flex.items-center.gap-2
            .w-8.h-8.rounded-full.flex.items-center.justify-center.text-xs.font-bold(
              :style="{ background: '#7849ff20', color: '#7849ff' }"
            ) {{ (row.clientName || '?').charAt(0).toUpperCase() }}
            div
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.clientName || '--' }}
              p.text-xs(style="color: var(--text-muted)") {{ row.clientEmail || '' }}
      el-table-column(:label="$t('booking.staff')" prop="staffName" width="150")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-primary)") {{ row.staffName || row.staffId || '--' }}
      el-table-column(:label="$t('booking.date')" prop="date" width="130" sortable)
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-primary)") {{ formatDate(row.date) }}
      el-table-column(:label="$t('booking.time')" width="150")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-primary)") {{ row.startTime || '--' }} - {{ row.endTime || '--' }}
      el-table-column(:label="$t('booking.type')" prop="type" width="130")
        template(#default="{ row }")
          el-tag(size="small" effect="plain" round) {{ row.type || 'MEETING' }}
      el-table-column(:label="$t('booking.status')" width="140" align="center")
        template(#default="{ row }")
          el-tag(
            :type="getStatusType(row.status)"
            size="small"
            effect="dark"
            round
          ) {{ row.status }}
      el-table-column(:label="$t('booking.notes')" prop="notes" min-width="180" show-overflow-tooltip)
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-muted)") {{ row.notes || '--' }}
      el-table-column(:label="$t('common.actions')" width="120" align="center" fixed="right")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-1(@click.stop)
            el-button(size="small" @click="openEditDialog(row)" class="!rounded-lg")
              Icon(name="ph:pencil-bold" size="14")
            el-button(size="small" type="danger" plain @click="handleDelete(row)" class="!rounded-lg")
              Icon(name="ph:trash-bold" size="14")

    //- Empty state
    .text-center.py-12(v-if="!filteredBookings.length && !loading")
      Icon(name="ph:calendar-blank" size="48" style="color: var(--text-muted)")
      p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('booking.noBookings') }}

  //- Create / Edit Dialog
  el-dialog(
    v-model="dialogVisible"
    :title="editingBooking ? ($t('booking.editBooking')) : ($t('booking.newBooking'))"
    width="600px"
    :close-on-click-modal="false"
  )
    el-form(:model="form" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('booking.clientName')" required)
          el-input(v-model="form.clientName" :placeholder="$t('booking.clientName')")
        el-form-item(:label="$t('booking.clientEmail')")
          el-input(v-model="form.clientEmail" :placeholder="$t('booking.clientEmail')" type="email")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('booking.staff')" required)
          el-select(v-model="form.staffId" :placeholder="$t('booking.selectStaff')" style="width: 100%" filterable)
            el-option(
              v-for="user in staffList"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            )
        el-form-item(:label="$t('booking.type')")
          el-select(v-model="form.type" style="width: 100%")
            el-option(:label="$t('booking.meeting')" value="MEETING")
            el-option(:label="$t('booking.call')" value="CALL")
            el-option(:label="$t('booking.demo')" value="DEMO")
            el-option(:label="$t('booking.consultation')" value="CONSULTATION")
            el-option(:label="$t('booking.followUp')" value="FOLLOW_UP")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
        el-form-item(:label="$t('booking.date')" required)
          el-date-picker(
            v-model="form.date"
            type="date"
            :placeholder="$t('booking.selectDate')"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          )
        el-form-item(:label="$t('booking.startTime')" required)
          el-time-picker(
            v-model="form.startTime"
            :placeholder="$t('booking.startTime')"
            style="width: 100%"
            format="HH:mm"
            value-format="HH:mm"
          )
        el-form-item(:label="$t('booking.endTime')" required)
          el-time-picker(
            v-model="form.endTime"
            :placeholder="$t('booking.endTime')"
            style="width: 100%"
            format="HH:mm"
            value-format="HH:mm"
          )
      el-form-item(:label="$t('booking.notes')")
        el-input(v-model="form.notes" type="textarea" :rows="3" :placeholder="$t('booking.notesPlaceholder')")
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="handleSave") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// State
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const bookings = ref<Record<string, unknown>[]>([]);
const staffList = ref<Record<string, unknown>[]>([]);
const dialogVisible = ref(false);
const editingBooking = ref<Record<string, unknown> | null>(null);

const form = reactive({
  staffId: '' as unknown,
  clientName: '',
  clientEmail: '',
  date: '',
  startTime: '',
  endTime: '',
  type: 'MEETING',
  notes: ''
});

// Upcoming Bookings
const loadingUpcoming = ref(false);
const upcomingBookings = ref<Record<string, unknown>[]>([]);

// Availability Checker
const availStaffId = ref('' as unknown);
const availDate = ref('');
const loadingAvailability = ref(false);
const availableSlots = ref<any[] | null>(null);

// Stats
const stats = computed(() => {
  const data = bookings.value;
  const today = new Date().toISOString().split('T')[0]!;
  return {
    total: data.length,
    today: data.filter((b) => b.date === today).length,
    upcoming: data.filter((b) => b.date > today && b.status !== 'CANCELLED').length,
    completed: data.filter((b) => b.status === 'COMPLETED').length
  };
});

// Status helper
function getStatusType(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'warning',
    CONFIRMED: 'success',
    CANCELLED: 'danger',
    COMPLETED: '',
    NO_SHOW: 'info'
  };
  return map[status] || 'info';
}

// Filtering
const filteredBookings = computed(() => {
  let data = bookings.value;
  if (statusFilter.value) {
    data = data.filter((b) => b.status === statusFilter.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    data = data.filter((b) => {
      const name = (b.clientName || '').toLowerCase();
      const email = (b.clientEmail || '').toLowerCase();
      const staff = (b.staffName || '').toLowerCase();
      const notes = (b.notes || '').toLowerCase();
      return name.includes(q) || email.includes(q) || staff.includes(q) || notes.includes(q);
    });
  }
  return data;
});

// Formatting
function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// API
async function loadBookings() {
  loading.value = true;
  try {
    const res = await useApiFetch('bookings');
    if (res?.success) {
      bookings.value = res.body?.docs || res.body || [];
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
}

async function loadStaff() {
  try {
    const res = await useApiFetch('users');
    if (res?.body?.docs) {
      staffList.value = res.body.docs;
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

function openCreateDialog() {
  editingBooking.value = null;
  form.staffId = '';
  form.clientName = '';
  form.clientEmail = '';
  form.date = '';
  form.startTime = '';
  form.endTime = '';
  form.type = 'MEETING';
  form.notes = '';
  dialogVisible.value = true;
}

function openEditDialog(booking: unknown) {
  editingBooking.value = booking;
  form.staffId = booking.staffId || '';
  form.clientName = booking.clientName || '';
  form.clientEmail = booking.clientEmail || '';
  form.date = booking.date || '';
  form.startTime = booking.startTime || '';
  form.endTime = booking.endTime || '';
  form.type = booking.type || 'MEETING';
  form.notes = booking.notes || '';
  dialogVisible.value = true;
}

function handleRowClick(row: unknown) {
  openEditDialog(row);
}

async function handleSave() {
  if (!form.clientName.trim() || !form.staffId || !form.date || !form.startTime || !form.endTime) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form };
    let res;
    if (editingBooking.value) {
      res = await useApiFetch(`bookings/${editingBooking.value.id}`, 'PUT', payload);
    } else {
      res = await useApiFetch('bookings', 'POST', payload);
    }
    if (res?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
      dialogVisible.value = false;
      await loadBookings();
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(booking: unknown) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' });
    await useApiFetch(`bookings/${booking.id}`, 'DELETE');
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    await loadBookings();
  } catch {
    // cancelled or error
  }
}

// Upcoming Bookings API
async function loadUpcoming() {
  loadingUpcoming.value = true;
  try {
    const res = await useApiFetch('booking?limit=5&sort=date');
    if (res?.success) {
      upcomingBookings.value = res.body?.docs || res.body || [];
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingUpcoming.value = false;
  }
}

// Availability Checker API
async function checkAvailability() {
  if (!availStaffId.value || !availDate.value) return;
  loadingAvailability.value = true;
  availableSlots.value = null;
  try {
    const res = await useApiFetch(`booking/available-slots?staffId=${availStaffId.value}&date=${availDate.value}`);
    if (res?.success) {
      availableSlots.value = res.body?.slots || res.body || [];
    } else {
      availableSlots.value = [];
    }
  } catch {
    availableSlots.value = [];
  } finally {
    loadingAvailability.value = false;
  }
}

function prefillSlot(slot: unknown) {
  const start = slot.startTime || slot.start || (typeof slot === 'string' ? slot : '');
  const end = slot.endTime || slot.end || '';
  form.staffId = availStaffId.value;
  form.date = availDate.value;
  form.startTime = start;
  form.endTime = end;
  editingBooking.value = null;
  dialogVisible.value = true;
}

onMounted(() => {
  loadBookings();
  loadStaff();
  loadUpcoming();
});
</script>

<style lang="scss" scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
