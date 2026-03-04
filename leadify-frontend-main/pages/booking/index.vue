<template lang="pug">
.p-6.space-y-6.animate-entrance
  //- Header
  .p-6.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
    .flex.flex-col.justify-between.items-start.gap-4(class="sm:flex-row sm:items-center")
      div
        h1.text-2xl.font-bold.bg-clip-text.text-transparent.bg-gradient-to-r.from-teal-400.to-cyan-400 {{ $t('booking.title') }}
        p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('booking.subtitle') }}
      .flex.gap-2
        el-button-group
          el-button(:type="viewMode === 'day' ? 'primary' : 'default'" size="small" @click="viewMode = 'day'") {{ $t('booking.day') }}
          el-button(:type="viewMode === 'week' ? 'primary' : 'default'" size="small" @click="viewMode = 'week'") {{ $t('booking.week') }}
          el-button(:type="viewMode === 'list' ? 'primary' : 'default'" size="small" @click="viewMode = 'list'") {{ $t('booking.list') }}
        el-button(type="primary" class="!rounded-xl" @click="showBookingDialog = true")
          Icon(name="ph:plus-bold" class="w-4 h-4 mr-2")
          | {{ $t('booking.newBooking') }}

  //- Stats
  .grid.gap-4(class="grid-cols-2 md:grid-cols-5")
    .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .text-2xl.font-bold(style="color: var(--text-primary);") {{ todayBookings }}
      .text-xs.mt-1(style="color: var(--text-muted);") {{ $t('booking.todayBookings') }}
    .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .text-2xl.font-bold.text-emerald-400 {{ weekBookings }}
      .text-xs.mt-1(style="color: var(--text-muted);") {{ $t('booking.thisWeek') }}
    .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .text-2xl.font-bold.text-blue-400 {{ bookings.filter(b => b.status === 'CONFIRMED').length }}
      .text-xs.mt-1(style="color: var(--text-muted);") {{ $t('booking.confirmed') }}
    .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .text-2xl.font-bold.text-amber-400 {{ bookings.filter(b => b.status === 'PENDING').length }}
      .text-xs.mt-1(style="color: var(--text-muted);") {{ $t('booking.pending') }}
    .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .text-2xl.font-bold.text-red-400 {{ noShowRate }}%
      .text-xs.mt-1(style="color: var(--text-muted);") {{ $t('booking.noShowRate') }}

  //- Calendar/Day View
  .rounded-2xl.border.overflow-hidden(v-if="viewMode === 'day' || viewMode === 'week'" style="border-color: var(--border-default); background: var(--bg-elevated);")
    .p-4.border-b.flex.items-center.justify-between(style="border-color: var(--border-default);")
      .flex.items-center.gap-3
        el-button(text @click="navigateDay(-1)")
          Icon(name="ph:caret-left" class="w-5 h-5")
        h3.text-lg.font-medium(style="color: var(--text-primary);") {{ currentDateLabel }}
        el-button(text @click="navigateDay(1)")
          Icon(name="ph:caret-right" class="w-5 h-5")
      el-button(text type="primary" @click="goToToday") {{ $t('booking.today') }}

    div(class="max-h-[600px] overflow-y-auto")
      div(class="flex border-b min-h-[60px] group"
        v-for="hour in timeSlots"
        :key="hour"
        style="border-color: var(--border-default);"
        class="hover:bg-slate-800/10"
      )
        .w-20.flex-shrink-0.p-2.text-right.text-xs.border-r(style="color: var(--text-muted); border-color: var(--border-default);")
          | {{ formatHour(hour) }}
        .flex-1.relative.p-1
          .absolute.left-1.right-1.rounded-lg.px-3.py-2.cursor-pointer.transition-all.z-10(
            v-for="booking in getBookingsForHour(hour)"
            :key="booking.id"
            :style="{ backgroundColor: booking.color + '20', borderLeft: `3px solid ${booking.color}`, top: '2px' }"
            @click="openBooking(booking)"
            class="hover:brightness-110"
          )
            .flex.justify-between.items-start
              div
                .text-sm.font-medium(style="color: var(--text-primary);") {{ booking.title }}
                .text-xs(style="color: var(--text-muted);") {{ booking.time }} - {{ booking.clientName }}
              el-tag(:type="getBookingStatusType(booking.status)" effect="dark" size="small" class="!text-[10px]")
                | {{ booking.status }}

          .absolute.right-2.top-1/2.-translate-y-1/2.opacity-0.group-hover_opacity-100.transition
            el-button(text size="small" type="primary" @click="quickBook(hour)")
              Icon(name="ph:plus" class="w-4 h-4")

  //- List View
  .p-6.rounded-2xl.border(v-if="viewMode === 'list'" style="border-color: var(--border-default); background: var(--bg-elevated);")
    el-table(:data="bookings" stripe v-loading="loading" class="custom-table")
      el-table-column(:label="$t('booking.booking')" min-width="250")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-1.h-10.rounded-full(:style="{ backgroundColor: row.color }")
            div
              .text-sm.font-medium(style="color: var(--text-primary);") {{ row.title }}
              .text-xs(style="color: var(--text-muted);") {{ row.type }}
      el-table-column(:label="$t('booking.client')" width="180")
        template(#default="{ row }")
          .flex.items-center.gap-2
            el-avatar(:size="24" class="bg-slate-700") {{ row.clientName?.charAt(0) }}
            span.text-sm(style="color: var(--text-muted);") {{ row.clientName }}
      el-table-column(:label="$t('booking.dateTime')" width="200")
        template(#default="{ row }")
          .text-sm(style="color: var(--text-primary);") {{ formatDate(row.date) }}
          .text-xs(style="color: var(--text-muted);") {{ row.time }} ({{ row.duration }}min)
      el-table-column(:label="$t('booking.host')" width="150")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-muted);") {{ row.host }}
      el-table-column(:label="$t('common.status')" width="120" align="center")
        template(#default="{ row }")
          el-tag(:type="getBookingStatusType(row.status)" effect="dark" size="small") {{ row.status }}
      el-table-column(:label="$t('common.actions')" width="150" align="center")
        template(#default="{ row }")
          .flex.gap-1.justify-center
            el-button(v-if="row.status === 'PENDING'" text type="success" size="small" @click="confirmBooking(row)")
              Icon(name="ph:check-bold" class="w-4 h-4")
            el-button(text type="primary" size="small" @click="openBooking(row)")
              Icon(name="ph:eye-bold" class="w-4 h-4")
            el-button(text type="danger" size="small" @click="cancelBooking(row)")
              Icon(name="ph:x-bold" class="w-4 h-4")

  //- Staff Availability Section
  .p-6.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
    .flex.justify-between.items-center.mb-4
      h3.text-sm.font-medium(style="color: var(--text-primary);") {{ $t('booking.staffAvailability') }}
      el-button(type="primary" size="small" @click="showAvailabilityDialog = true")
        Icon(name="ph:clock-bold" class="w-4 h-4 mr-2")
        | {{ $t('booking.setAvailability') }}
    .grid.gap-3(class="grid-cols-1 md:grid-cols-2")
      .p-3.rounded-lg.border(
        v-for="staff in staffAvailability"
        :key="staff.id"
        style="border-color: var(--border-default); background: var(--bg-base);"
      )
        .flex.items-center.gap-3
          el-avatar(:size="32") {{ staff.name?.charAt(0) }}
          div.flex-1
            p.text-sm.font-medium(style="color: var(--text-primary)") {{ staff.name }}
            p.text-xs(style="color: var(--text-muted)") {{ staff.availableSlots || $t('booking.noAvailabilitySet') }}

  //- Booking Pages
  .p-6.rounded-2xl.border.mt-6(style="border-color: var(--border-default); background: var(--bg-elevated);")
    .flex.justify-between.items-center.mb-4
      h3.text-sm.font-medium(style="color: var(--text-primary);") {{ $t('booking.bookingPages') }}
      el-button(type="primary" size="small" @click="showBookingTypeDialog = true")
        Icon(name="ph:plus-bold" class="w-4 h-4 mr-2")
        | {{ $t('booking.newPage') }}
    .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
      .p-4.rounded-xl.border.transition(
        v-for="page in bookingPages"
        :key="page.id"
        style="border-color: var(--border-default); background: var(--bg-elevated);"
        class="hover:border-primary-500/30"
      )
        .flex.items-center.gap-3.mb-3
          .w-10.h-10.rounded-lg.flex.items-center.justify-center(:style="{ backgroundColor: page.color + '20' }")
            Icon(:name="page.icon" class="w-5 h-5" :style="{ color: page.color }")
          div
            h4.text-sm.font-medium(style="color: var(--text-primary);") {{ page.name }}
            p.text-xs(style="color: var(--text-muted);") {{ page.duration }}min - {{ page.type }}
        .flex.items-center.justify-between.text-xs(style="color: var(--text-muted);")
          span {{ page.bookingCount }} {{ $t('booking.bookings') }}
          el-button(text type="primary" size="small" @click="copyBookingLink(page)")
            Icon(name="ph:link" class="w-3 h-3 mr-1")
            | {{ $t('booking.copyLink') }}

  //- Analytics Section
  .p-6.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
    h3.text-sm.font-medium.mb-4(style="color: var(--text-primary);") {{ $t('booking.analytics') }}
    .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
      div
        p.text-xs.font-bold.mb-2(style="color: var(--text-muted);") {{ $t('booking.popularTimeSlots') }}
        div(ref="popularSlotsChartRef" style="height: 200px;")
      div
        p.text-xs.font-bold.mb-2(style="color: var(--text-muted);") {{ $t('booking.bookingTrend') }}
        div(ref="trendChartRef" style="height: 200px;")

  //- New Booking Dialog
  el-dialog(v-model="showBookingDialog" :title="$t('booking.newBooking')" width="520px")
    el-form(label-position="top")
      el-form-item(:label="$t('booking.title')")
        el-input(v-model="newBooking.title" :placeholder="$t('booking.titlePlaceholder')")
      el-form-item(:label="$t('booking.client')")
        el-input(v-model="newBooking.clientName" :placeholder="$t('booking.clientPlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('booking.date')")
          el-date-picker(v-model="newBooking.date" type="date" class="w-full")
        el-form-item(:label="$t('booking.time')")
          el-time-picker(v-model="newBooking.time" format="HH:mm" class="w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('booking.duration')")
          el-select(v-model="newBooking.duration" class="w-full")
            el-option(:label="`15 ${$t('booking.minutes')}`" :value="15")
            el-option(:label="`30 ${$t('booking.minutes')}`" :value="30")
            el-option(:label="`45 ${$t('booking.minutes')}`" :value="45")
            el-option(:label="`60 ${$t('booking.minutes')}`" :value="60")
            el-option(:label="`90 ${$t('booking.minutes')}`" :value="90")
        el-form-item(:label="$t('booking.type')")
          el-select(v-model="newBooking.type" class="w-full")
            el-option(:label="$t('booking.types.meeting')" value="MEETING")
            el-option(:label="$t('booking.types.demo')" value="DEMO")
            el-option(:label="$t('booking.types.consultation')" value="CONSULTATION")
            el-option(:label="$t('booking.types.followup')" value="FOLLOWUP")
      el-form-item(:label="$t('booking.timezone')")
        el-select(v-model="newBooking.timezone" class="w-full" filterable)
          el-option(v-for="tz in timezones" :key="tz" :label="tz" :value="tz")
      el-form-item(:label="$t('booking.location')")
        el-input(v-model="newBooking.location" :placeholder="$t('booking.locationPlaceholder')")
      el-form-item(:label="$t('booking.notes')")
        el-input(v-model="newBooking.notes" type="textarea" :rows="2")
      el-form-item
        el-checkbox(v-model="newBooking.isRecurring") {{ $t('booking.recurringBooking') }}
        el-select(v-if="newBooking.isRecurring" v-model="newBooking.recurringPattern" class="ml-2" style="width: 150px")
          el-option(:label="$t('booking.recurringDaily')" value="DAILY")
          el-option(:label="$t('booking.recurringWeekly')" value="WEEKLY")
          el-option(:label="$t('booking.recurringBiweekly')" value="BIWEEKLY")
          el-option(:label="$t('booking.recurringMonthly')" value="MONTHLY")
      el-form-item(v-if="newBooking.isRecurring" :label="$t('booking.reminderConfig')")
        .flex.items-center.gap-2
          el-checkbox(v-model="newBooking.sendReminder") {{ $t('booking.sendReminder') }}
          el-input-number(v-if="newBooking.sendReminder" v-model="newBooking.reminderMinutes" :min="5" :max="1440" :step="5" class="!w-28")
          span.text-xs(v-if="newBooking.sendReminder" style="color: var(--text-muted)") {{ $t('booking.minutesBefore') }}
    template(#footer)
      el-button(@click="showBookingDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="submitting" @click="createBooking") {{ $t('booking.schedule') }}

  //- Booking Type Dialog
  el-dialog(v-model="showBookingTypeDialog" :title="$t('booking.createBookingPage')" width="480px")
    el-form(label-position="top")
      el-form-item(:label="$t('booking.pageName')")
        el-input(v-model="newPage.name" :placeholder="$t('booking.pageNamePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="durationLabel")
          el-input-number(v-model="newPage.duration" :min="15" :step="15" class="!w-full")
        el-form-item(:label="$t('booking.type')")
          el-select(v-model="newPage.type" class="w-full")
            el-option(:label="$t('booking.types.oneOnOne')" value="ONE_ON_ONE")
            el-option(:label="$t('booking.types.group')" value="GROUP")
            el-option(:label="$t('booking.types.roundRobin')" value="ROUND_ROBIN")
      el-form-item(:label="bufferLabel")
        el-input-number(v-model="newPage.bufferTime" :min="0" :step="5" class="!w-full")
      el-form-item(:label="$t('booking.maxBookingsPerDay')")
        el-input-number(v-model="newPage.maxBookingsPerDay" :min="0" :max="50" class="!w-full")
    template(#footer)
      el-button(@click="showBookingTypeDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="createBookingPage") {{ $t('common.create') }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts/core';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();
const config = useRuntimeConfig();

const TYPE_COLORS: Record<string, string> = {
  DEMO: '#6366F1',
  MEETING: '#10B981',
  CONSULTATION: '#F59E0B',
  FOLLOWUP: '#8B5CF6'
};
const FALLBACK_COLORS = ['#EC4899', '#14B8A6', '#3B82F6', '#EF4444', '#A855F7', '#F97316'];

function colorForBooking(type: string | undefined, index: number): string {
  if (type && TYPE_COLORS[type]) return TYPE_COLORS[type];
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length] || '#3B82F6';
}

function parseHourFromTime(time: string): number {
  if (!time) return 0;
  const [hStr] = time.split(':');
  return parseInt(hStr || '0', 10);
}

function computeDurationMinutes(start: string, end: string): number {
  if (!start || !end) return 30;
  const [sh = 0, sm = 0] = start.split(':').map(Number);
  const [eh = 0, em = 0] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

interface UIBooking {
  id: number;
  title: string;
  clientName: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  host: string;
  status: string;
  color: string;
  hour: number;
  timezone?: string;
}

function mapBooking(raw: any, index: number): UIBooking {
  const type = raw.type || '';
  const clientName = raw.clientName || raw.client?.clientName || '';
  const host = raw.staff?.name || '';
  const startTime = raw.startTime || '';
  const endTime = raw.endTime || '';

  return {
    id: raw.id,
    title: type && clientName ? `${type} - ${clientName}` : type || clientName || `Booking #${raw.id}`,
    clientName,
    date: raw.date || '',
    time: startTime,
    duration: computeDurationMinutes(startTime, endTime),
    type,
    host,
    status: raw.status || 'PENDING',
    color: colorForBooking(type, index),
    hour: parseHourFromTime(startTime),
    timezone: raw.timezone || 'UTC'
  };
}

const viewMode = ref('day');
const showBookingDialog = ref(false);
const showBookingTypeDialog = ref(false);
const showAvailabilityDialog = ref(false);
const currentDate = ref(new Date());
const loading = ref(false);
const submitting = ref(false);
const popularSlotsChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();

const newBooking = ref({
  title: '',
  clientName: '',
  date: '',
  time: '',
  duration: 30,
  type: 'MEETING',
  location: '',
  notes: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  isRecurring: false,
  recurringPattern: 'WEEKLY',
  sendReminder: false,
  reminderMinutes: 15
});

const staffAvailability = ref<any[]>([]);

const newPage = ref({
  name: '',
  duration: 30,
  type: 'ONE_ON_ONE',
  bufferTime: 10,
  maxBookingsPerDay: 0
});

const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8);
const bookings = ref<UIBooking[]>([]);
const bookingPages = ref<any[]>([]);
const analyticsData = ref<any>({ popularSlots: [], dailyTrend: [] });

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const durationLabel = computed(() => `${t('booking.duration')} (${t('booking.minutes')})`);
const bufferLabel = computed(() => `${t('booking.bufferTime')} (${t('booking.minutes')})`);

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekRange(d: Date): { start: string; end: string } {
  const dayOfWeek = d.getDay();
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return { start: toDateString(startOfWeek), end: toDateString(endOfWeek) };
}

const todayBookings = computed(() => {
  const todayStr = toDateString(new Date());
  return bookings.value.filter(b => b.date === todayStr).length;
});

const weekBookings = computed(() => {
  const { start, end } = getWeekRange(new Date());
  return bookings.value.filter(b => b.date >= start && b.date <= end).length;
});

const noShowRate = computed(() => {
  const total = bookings.value.length;
  if (total === 0) return 0;
  const noShows = bookings.value.filter(b => b.status === 'NO_SHOW').length;
  return parseFloat(((noShows / total) * 100).toFixed(1));
});

const currentDateLabel = computed(() => {
  return currentDate.value.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
});

const formatHour = (h: number) => `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) : '-');

const getBookingsForHour = (hour: number) => {
  const dateStr = toDateString(currentDate.value);
  return bookings.value.filter(b => b.hour === hour && b.date === dateStr);
};

const getBookingStatusType = (s: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const m: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    CONFIRMED: 'success',
    PENDING: 'warning',
    CANCELLED: 'danger',
    NO_SHOW: 'danger',
    COMPLETED: 'info'
  };
  return m[s] || 'info';
};

const navigateDay = (offset: number) => {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() + offset);
  currentDate.value = d;
};

const goToToday = () => {
  currentDate.value = new Date();
};

async function fetchBookings() {
  loading.value = true;
  try {
    const res: any = await useApiFetch('bookings?limit=500');
    if (res?.success) {
      const raw: any[] = res.body?.docs || res.body || [];
      bookings.value = raw.map((b, i) => mapBooking(b, i));
    } else {
      ElMessage.error(res?.message || t('booking.fetchError'));
    }
  } catch (e: any) {
    ElMessage.error(t('booking.fetchError'));
  } finally {
    loading.value = false;
  }
}

async function fetchBookingPages() {
  try {
    const res: any = await useApiFetch('bookings/pages');
    if (res?.success) {
      bookingPages.value = res.body || [];
    }
  } catch (e) {
    console.error('Failed to fetch booking pages:', e);
  }
}

async function fetchAnalytics() {
  try {
    const res = await useApiFetch('bookings/analytics');
    if (res?.success && res.body) {
      analyticsData.value = res.body;
      await nextTick();
      renderCharts();
    }
  } catch (e) {
    console.error('Failed to fetch analytics:', e);
  }
}

function renderCharts() {
  if (popularSlotsChartRef.value && analyticsData.value.popularSlots?.length) {
    const chart = echarts.init(popularSlotsChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: analyticsData.value.popularSlots.map((s: any) => s.slot) },
      yAxis: { type: 'value' },
      series: [{ data: analyticsData.value.popularSlots.map((s: any) => s.count), type: 'bar', itemStyle: { color: '#10B981' } }]
    });
  }
  if (trendChartRef.value && analyticsData.value.dailyTrend?.length) {
    const chart = echarts.init(trendChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: analyticsData.value.dailyTrend.map((d: any) => d.date) },
      yAxis: { type: 'value' },
      series: [{ data: analyticsData.value.dailyTrend.map((d: any) => d.count), type: 'line', smooth: true, itemStyle: { color: '#6366F1' } }]
    });
  }
}

const createBooking = async () => {
  if (!newBooking.value.clientName) {
    ElMessage.warning(t('booking.clientRequired'));
    return;
  }

  let startTime = '';
  if (newBooking.value.time) {
    const t = newBooking.value.time;
    if (typeof t === 'string') {
      startTime = t;
    } else if ((t as any) instanceof Date) {
      startTime = `${String((t as any).getHours()).padStart(2, '0')}:${String((t as any).getMinutes()).padStart(2, '0')}`;
    }
  }

  let endTime = '';
  if (startTime) {
    const [sh = 0, sm = 0] = startTime.split(':').map(Number);
    const totalMin = sh * 60 + sm + (newBooking.value.duration || 30);
    const eh = Math.floor(totalMin / 60);
    const em = totalMin % 60;
    endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  }

  let dateStr = '';
  if (newBooking.value.date) {
    const d = newBooking.value.date;
    if (typeof d === 'string') {
      dateStr = d;
    } else if ((d as any) instanceof Date) {
      dateStr = toDateString(d as any);
    }
  }

  const payload = {
    clientName: newBooking.value.clientName,
    date: dateStr,
    startTime,
    endTime,
    type: newBooking.value.type,
    notes: newBooking.value.notes,
    location: newBooking.value.location,
    timezone: newBooking.value.timezone
  };

  submitting.value = true;
  try {
    const res = await useApiFetch('bookings', 'POST', payload);
    if (res?.success) {
      ElMessage.success(t('booking.bookingScheduled'));
      showBookingDialog.value = false;
      newBooking.value = {
        title: '',
        clientName: '',
        date: '',
        time: '',
        duration: 30,
        type: 'MEETING',
        location: '',
        notes: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        isRecurring: false,
        recurringPattern: 'WEEKLY',
        sendReminder: false,
        reminderMinutes: 15
      };
      await fetchBookings();
    } else {
      ElMessage.error(res?.message || t('booking.bookingFailed'));
    }
  } catch (e: any) {
    ElMessage.error(t('booking.bookingFailed'));
  } finally {
    submitting.value = false;
  }
};

const confirmBooking = async (b: UIBooking) => {
  try {
    const res = await useApiFetch(`bookings/${b.id}`, 'PUT', { status: 'CONFIRMED' });
    if (res?.success) {
      b.status = 'CONFIRMED';
      ElMessage.success(t('booking.bookingConfirmed'));
    } else {
      ElMessage.error(res?.message || t('booking.confirmFailed'));
    }
  } catch (e: any) {
    ElMessage.error(t('booking.confirmFailed'));
  }
};

const cancelBooking = async (b: UIBooking) => {
  try {
    const res = await useApiFetch(`bookings/${b.id}`, 'PUT', { status: 'CANCELLED' });
    if (res?.success) {
      b.status = 'CANCELLED';
      ElMessage.success(t('booking.bookingCancelled'));
    } else {
      ElMessage.error(res?.message || t('booking.cancelFailed'));
    }
  } catch (e: any) {
    ElMessage.error(t('booking.cancelFailed'));
  }
};

const openBooking = (b: UIBooking) => ElMessage.info(`${t('booking.opening')}: ${b.title}`);

const quickBook = (hour: number) => {
  newBooking.value.time = `${String(hour).padStart(2, '0')}:00`;
  newBooking.value.date = toDateString(currentDate.value);
  showBookingDialog.value = true;
};

const copyBookingLink = (page: any) => {
  const baseUrl = (config.public.BOOKING_BASE_URL || config.public.BASE_URL || '').replace(/\/$/, '');
  navigator.clipboard?.writeText(`${baseUrl}/book/${page.slug || page.id}`);
  ElMessage.success(t('booking.linkCopied'));
};

const createBookingPage = async () => {
  if (!newPage.value.name) {
    ElMessage.warning(t('booking.pageNameRequired'));
    return;
  }
  try {
    const res = await useApiFetch('bookings/pages', 'POST', newPage.value);
    if (res?.success) {
      ElMessage.success(t('booking.pageCreated'));
      showBookingTypeDialog.value = false;
      newPage.value = { name: '', duration: 30, type: 'ONE_ON_ONE', bufferTime: 10, maxBookingsPerDay: 0 };
      await fetchBookingPages();
    } else {
      ElMessage.error(res?.message || t('booking.pageCreationFailed'));
    }
  } catch (e) {
    ElMessage.error(t('booking.pageCreationFailed'));
  }
};

async function fetchStaffAvailability() {
  try {
    const res = await useApiFetch('bookings/slots');
    if (res?.success && res?.body) {
      // Group slots by staff member for the UI
      const slotData = Array.isArray(res.body) ? res.body : [];
      const staffMap = new Map<number, any>();
      for (const slot of slotData) {
        const staffId = slot.staffId;
        if (!staffMap.has(staffId)) {
          staffMap.set(staffId, {
            id: staffId,
            name: slot.staff?.name || `Staff #${staffId}`,
            availableSlots: `${slot.startTime} - ${slot.endTime}`
          });
        } else {
          const existing = staffMap.get(staffId);
          existing.availableSlots += `, ${slot.startTime} - ${slot.endTime}`;
        }
      }
      staffAvailability.value = Array.from(staffMap.values());
    }
  } catch (e) {
    console.error('Failed to fetch staff availability:', e);
  }
}

onMounted(() => {
  fetchBookings();
  fetchBookingPages();
  fetchAnalytics();
  fetchStaffAvailability();
});
</script>
