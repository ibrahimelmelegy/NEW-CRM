<template lang="pug">
div
  ModuleHeader(
    :title="$t('calendar.title')"
    :subtitle="$t('calendar.subtitle')"
  )
    template(#actions)
      el-button(size="large" type="primary" @click="openCreate" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('calendar.addEvent') }}

  //- Stats Row
  .grid.grid-cols-2(class="md:grid-cols-4 gap-4 mb-6")
    .glass-card.p-4.rounded-xl.text-center.animate-entrance
      .flex.items-center.justify-center.mb-2
        Icon(name="ph:calendar-bold" size="20" style="color: #7849ff")
      .text-2xl.font-bold(style="color: var(--text-primary)") {{ totalEventsCount }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('calendar.totalEvents') }}
    .glass-card.p-4.rounded-xl.text-center.animate-entrance
      .flex.items-center.justify-center.mb-2
        Icon(name="ph:clock-bold" size="20" style="color: #3b82f6")
      .text-2xl.font-bold(style="color: #3b82f6") {{ scheduledCount }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('calendar.scheduledEvents') }}
    .glass-card.p-4.rounded-xl.text-center.animate-entrance
      .flex.items-center.justify-center.mb-2
        Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
      .text-2xl.font-bold(style="color: #22c55e") {{ completedCount }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('calendar.completedEvents') }}
    .glass-card.p-4.rounded-xl.text-center.animate-entrance
      .flex.items-center.justify-center.mb-2
        Icon(name="ph:calendar-dots-bold" size="20" style="color: #f59e0b")
      .text-2xl.font-bold(style="color: #f59e0b") {{ thisWeekCount }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('calendar.thisWeekEvents') }}

  //- Main Layout: Sidebar + Calendar
  .flex.gap-6.animate-entrance(class="flex-col lg:flex-row")

    //- Left Sidebar: Mini Calendar + Upcoming + Filters
    .w-full(class="lg:w-72 shrink-0 space-y-4")

      //- Mini Calendar
      .glass-card.p-4.rounded-xl
        .flex.items-center.justify-between.mb-3
          el-button(text size="small" @click="miniPrev" class="!rounded-xl")
            Icon(name="ph:caret-left-bold" size="14")
          .text-sm.font-bold(style="color: var(--text-primary)") {{ miniMonthLabel }}
          el-button(text size="small" @click="miniNext" class="!rounded-xl")
            Icon(name="ph:caret-right-bold" size="14")
        .grid.grid-cols-7.gap-0
          .text-center.text-xs.py-1(
            v-for="d in weekDayLabels"
            :key="d"
            style="color: var(--text-muted)"
          ) {{ d }}
          .mini-cell(
            v-for="cell in miniCells"
            :key="cell.key"
            :class="{ 'mini-other': !cell.isCurrentMonth, 'mini-today': cell.isToday, 'mini-selected': cell.dateStr === selectedDateStr, 'mini-has-events': cell.hasEvents }"
            @click="onMiniDateClick(cell)"
          )
            span {{ cell.day }}

      //- Type Filter
      .glass-card.p-4.rounded-xl
        .text-xs.font-bold.mb-2(style="color: var(--text-muted)") {{ $t('calendar.filterByType') }}
        el-select(v-model="filterType" :placeholder="$t('calendar.allTypes')" clearable size="small" class="w-full")
          el-option(:label="$t('calendar.allTypes')" value="")
          el-option(
            v-for="tp in EVENT_TYPES"
            :key="tp.value"
            :value="tp.value"
            :label="$t('calendar.' + tp.value.toLowerCase())"
          )

      //- Today's Agenda
      .glass-card.p-4.rounded-xl
        .text-xs.font-bold.mb-3(style="color: var(--text-muted)") {{ $t('calendar.todaysAgenda') }}
        .space-y-2(v-if="todayEvents.length")
          .flex.items-start.gap-2.p-2.rounded-lg.cursor-pointer(
            v-for="evt in todayEvents.slice(0, 5)"
            :key="evt.id"
            style="background: var(--bg-input)"
            @click="viewEvent(evt)"
          )
            .w-2.h-2.rounded-full.shrink-0(:style="{ background: evt.color || getEventTypeColor(evt.eventType) }" class="mt-1.5")
            div.min-w-0.flex-1
              .text-xs.font-medium.truncate(style="color: var(--text-primary)") {{ evt.title }}
              .text-xs(style="color: var(--text-muted)") {{ formatTime(evt.startDate) }}
        .text-xs.text-center.py-4(v-else style="color: var(--text-muted)") {{ $t('calendar.noEventsToday') }}

  //- Main Calendar Area
    .flex-1.min-w-0

      //- Calendar Header: Navigation + View Switcher
      .glass-card.p-4.mb-4.rounded-xl
        .flex.items-center.justify-between.flex-wrap.gap-3
          .flex.items-center.gap-3
            el-button(text @click="navigatePrev" class="!rounded-xl")
              Icon(name="ph:caret-left-bold" size="18")
            h3.text-xl.font-bold(style="color: var(--text-primary)") {{ mainHeaderLabel }}
            el-button(text @click="navigateNext" class="!rounded-xl")
              Icon(name="ph:caret-right-bold" size="18")
            el-button(size="small" @click="goToToday" class="!rounded-2xl") {{ $t('calendar.today') }}

          //- View Switcher
          el-radio-group(v-model="viewMode" size="small")
            el-radio-button(value="month") {{ $t('calendar.month') }}
            el-radio-button(value="week") {{ $t('calendar.week') }}
            el-radio-button(value="day") {{ $t('calendar.day') }}
            el-radio-button(value="agenda") {{ $t('calendar.agenda') }}

      //- Loading State
      .flex.items-center.justify-center.py-20(v-if="loading")
        el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

      //- ══════ MONTH VIEW ══════
      .glass-card.p-4.rounded-xl(v-else-if="viewMode === 'month'")
        .grid.grid-cols-7.gap-0
          //- Weekday headers
          .text-center.py-2.text-xs.font-bold(
            v-for="day in weekDayLabels"
            :key="'hdr-'+day"
            style="color: var(--text-muted)"
          ) {{ day }}

          //- Day cells
          .calendar-cell(
            v-for="cell in monthCells"
            :key="cell.key"
            :class="{ 'other-month': !cell.isCurrentMonth, 'cell-today': cell.isToday, 'cell-selected': cell.dateStr === selectedDateStr }"
            @click="onMonthCellClick(cell)"
          )
            .text-xs.font-medium.mb-1(
              :class="{ 'today-badge': cell.isToday }"
              :style="!cell.isToday ? 'color: var(--text-primary)' : ''"
            ) {{ cell.day }}
            .event-dot(
              v-for="evt in cell.events.slice(0, 3)"
              :key="evt.id"
              :style="{ background: evt.color || getEventTypeColor(evt.eventType) }"
              @click.stop="viewEvent(evt)"
            ) {{ evt.title }}
            .text-xs(v-if="cell.events.length > 3" style="color: var(--text-muted)") +{{ cell.events.length - 3 }}

      //- ══════ WEEK VIEW ══════
      .glass-card.rounded-xl.overflow-hidden(v-else-if="viewMode === 'week'")
        //- Week day headers
        .grid.week-header-grid.border-b(style="border-color: var(--border-default)")
          .week-time-gutter
          .text-center.py-3.text-xs.font-bold(
            v-for="wd in weekDayHeaders"
            :key="wd.dateStr"
            :class="{ 'week-today-header': wd.isToday }"
            style="border-inline-start: 1px solid var(--border-default); color: var(--text-muted)"
          )
            div {{ wd.label }}
            .text-lg.font-bold(:style="wd.isToday ? 'color: #7849ff' : 'color: var(--text-primary)'") {{ wd.dayNum }}

        //- Time grid
        .week-scroll-area.overflow-y-auto(style="max-height: 600px")
          .grid.week-body-grid
            //- Time column
            .week-time-gutter
              .week-time-slot(v-for="hour in timeSlots" :key="'wt-'+hour")
                .text-xs(style="color: var(--text-muted)") {{ formatHour(hour) }}

            //- Day columns
            .week-day-column(
              v-for="wd in weekDayHeaders"
              :key="'col-'+wd.dateStr"
              style="border-inline-start: 1px solid var(--border-default)"
            )
              .week-time-slot.relative.group(
                v-for="hour in timeSlots"
                :key="'wslot-'+wd.dateStr+'-'+hour"
                @click="quickCreate(wd.dateStr, hour)"
              )
                //- Event blocks in this hour
                .week-event-block(
                  v-for="evt in getWeekEventsForSlot(wd.dateStr, hour)"
                  :key="'we-'+evt.id"
                  :style="{ background: (evt.color || getEventTypeColor(evt.eventType)) + '20', borderInlineStart: '3px solid ' + (evt.color || getEventTypeColor(evt.eventType)) }"
                  @click.stop="viewEvent(evt)"
                )
                  .text-xs.font-medium.truncate(style="color: var(--text-primary)") {{ evt.title }}
                  .text-xs(style="color: var(--text-muted)") {{ formatTime(evt.startDate) }}

                //- Hover add button
                .absolute.opacity-0.transition(class="group-hover:opacity-100 end-1 top-1")
                  el-button(text size="small" type="primary" @click.stop="quickCreate(wd.dateStr, hour)")
                    Icon(name="ph:plus" size="14")

      //- ══════ DAY VIEW ══════
      .glass-card.rounded-xl.overflow-hidden(v-else-if="viewMode === 'day'")
        //- Day header
        .p-4.border-b(style="border-color: var(--border-default)")
          .text-lg.font-bold(style="color: var(--text-primary)") {{ dayHeaderLabel }}

        //- All day events row
        .p-3.border-b(
          v-if="dayAllDayEvents.length"
          style="border-color: var(--border-default); background: var(--bg-elevated)"
        )
          .flex.flex-wrap.gap-2
            .inline-flex.items-center.gap-1.px-2.py-1.rounded-lg.text-xs.cursor-pointer(
              v-for="evt in dayAllDayEvents"
              :key="'ad-'+evt.id"
              :style="{ background: (evt.color || getEventTypeColor(evt.eventType)) + '20', color: evt.color || getEventTypeColor(evt.eventType) }"
              @click="viewEvent(evt)"
            )
              .w-2.h-2.rounded-full(:style="{ background: evt.color || getEventTypeColor(evt.eventType) }")
              span {{ evt.title }}

        //- Time slots
        .day-scroll-area.overflow-y-auto(style="max-height: 600px")
          .flex.border-b.min-h-16.group(
            v-for="hour in timeSlots"
            :key="'d-'+hour"
            style="border-color: var(--border-default)"
            class="hover:bg-[var(--bg-input)]"
          )
            .w-20.shrink-0.p-2.text-end.text-xs.border-e(style="color: var(--text-muted); border-color: var(--border-default)") {{ formatHour(hour) }}
            .flex-1.relative.p-1
              .day-event-block(
                v-for="evt in getDayEventsForHour(hour)"
                :key="'de-'+evt.id"
                :style="{ background: (evt.color || getEventTypeColor(evt.eventType)) + '20', borderInlineStart: '3px solid ' + (evt.color || getEventTypeColor(evt.eventType)) }"
                @click="viewEvent(evt)"
              )
                .flex.items-center.justify-between
                  div
                    .text-sm.font-medium(style="color: var(--text-primary)") {{ evt.title }}
                    .text-xs(style="color: var(--text-muted)") {{ formatTime(evt.startDate) }} - {{ formatTime(evt.endDate) }}
                  .shrink-0
                    el-tag(:type="priorityTagType(evt.priority)" effect="dark" size="small" class="!text-xs") {{ evt.priority }}

              //- Hover add
              .absolute.opacity-0.transition(class="group-hover:opacity-100 end-2 top-1/2 -translate-y-1/2")
                el-button(text size="small" type="primary" @click.stop="quickCreate(selectedDateStr, hour)")
                  Icon(name="ph:plus" size="14")

      //- ══════ AGENDA VIEW ══════
      .glass-card.p-6.rounded-xl(v-else-if="viewMode === 'agenda'")
        .space-y-4(v-if="agendaGroups.length")
          div(v-for="group in agendaGroups" :key="group.dateStr")
            .text-sm.font-bold.mb-2(style="color: var(--text-muted)") {{ group.label }}
            .space-y-2
              .flex.items-center.justify-between.p-3.rounded-xl.cursor-pointer(
                v-for="evt in group.events"
                :key="'ag-'+evt.id"
                style="background: var(--bg-input)"
                class="hover:brightness-110 transition"
                @click="viewEvent(evt)"
              )
                .flex.items-center.gap-3.min-w-0
                  .w-3.h-3.rounded-full.shrink-0(:style="{ background: evt.color || getEventTypeColor(evt.eventType) }")
                  .min-w-0
                    .font-medium.text-sm.truncate(style="color: var(--text-primary)") {{ evt.title }}
                    .text-xs(style="color: var(--text-muted)")
                      span(v-if="evt.allDay") {{ $t('calendar.allDay') }}
                      span(v-else) {{ formatTime(evt.startDate) }} - {{ formatTime(evt.endDate) }}
                      span.mx-2 |
                      span {{ $t('calendar.' + evt.eventType.toLowerCase()) }}
                .flex.items-center.gap-2.shrink-0
                  el-tag(:type="priorityTagType(evt.priority)" effect="dark" size="small" class="!text-xs") {{ evt.priority }}
                  el-tag(:type="statusTagType(evt.status)" effect="dark" size="small" class="!text-xs") {{ evt.status }}
        .text-center.py-12(v-else style="color: var(--text-muted)")
          Icon(name="ph:calendar-x-bold" size="48" class="mb-3 block mx-auto")
          .text-sm {{ $t('calendar.noUpcomingEvents') }}

  //- ═══════════ EVENT DETAIL DRAWER ═══════════
  el-drawer(v-model="showDetail" :title="$t('calendar.eventDetails')" size="420px" direction="rtl")
    template(v-if="detailEvent")
      .space-y-4.p-2

        //- Type badge + Title
        .flex.items-start.gap-3
          .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0(
            :style="{ background: (detailEvent.color || getEventTypeColor(detailEvent.eventType)) + '20' }"
          )
            Icon(:name="getEventTypeIcon(detailEvent.eventType)" size="20" :style="{ color: detailEvent.color || getEventTypeColor(detailEvent.eventType) }")
          div
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ detailEvent.title }}
            .flex.items-center.gap-2.mt-1
              el-tag(:type="statusTagType(detailEvent.status)" effect="dark" size="small") {{ detailEvent.status }}
              el-tag(:type="priorityTagType(detailEvent.priority)" effect="dark" size="small") {{ detailEvent.priority }}

        el-divider

        //- Date/Time
        .flex.items-center.gap-3
          Icon(name="ph:clock-bold" size="18" style="color: var(--text-muted)")
          div
            .text-sm(style="color: var(--text-primary)")
              span(v-if="detailEvent.allDay") {{ formatDate(detailEvent.startDate) }} - {{ formatDate(detailEvent.endDate) }} ({{ $t('calendar.allDay') }})
              span(v-else) {{ formatDate(detailEvent.startDate) }}, {{ formatTime(detailEvent.startDate) }} - {{ formatTime(detailEvent.endDate) }}

        //- Location
        .flex.items-center.gap-3(v-if="detailEvent.location")
          Icon(name="ph:map-pin-bold" size="18" style="color: var(--text-muted)")
          .text-sm(style="color: var(--text-primary)") {{ detailEvent.location }}

        //- Meeting Link
        .flex.items-center.gap-3(v-if="detailEvent.meetingLink")
          Icon(name="ph:link-bold" size="18" style="color: var(--text-muted)")
          a.text-sm(:href="detailEvent.meetingLink" target="_blank" style="color: #7849ff; text-decoration: underline") {{ detailEvent.meetingLink }}

        //- Description
        div(v-if="detailEvent.description")
          .text-xs.font-bold.mb-1(style="color: var(--text-muted)") {{ $t('calendar.description') }}
          .text-sm(style="color: var(--text-primary); white-space: pre-wrap") {{ detailEvent.description }}

        //- Attendees
        div(v-if="detailEvent.attendees && detailEvent.attendees.length")
          .text-xs.font-bold.mb-2(style="color: var(--text-muted)") {{ $t('calendar.attendees') }}
          .space-y-1
            .flex.items-center.justify-between.px-2.py-1.rounded-lg(
              v-for="(att, ai) in detailEvent.attendees"
              :key="ai"
              style="background: var(--bg-input)"
            )
              .flex.items-center.gap-2
                el-avatar(:size="24" style="background: var(--bg-elevated)") {{ (att.name || '?').charAt(0) }}
                .text-sm(style="color: var(--text-primary)") {{ att.name }}
              el-tag(
                :type="att.status === 'ACCEPTED' ? 'success' : att.status === 'DECLINED' ? 'danger' : 'warning'"
                effect="dark"
                size="small"
                class="!text-xs"
              ) {{ att.status }}

        el-divider

        //- Action Buttons
        .flex.gap-2
          el-button(type="primary" class="!rounded-2xl flex-1" @click="editFromDetail")
            Icon(name="ph:pencil-bold" size="14")
            span.ml-1 {{ $t('calendar.editEvent') }}
          el-popconfirm(:title="$t('calendar.deleteConfirm')" @confirm="handleDelete(detailEvent.id)")
            template(#reference)
              el-button(type="danger" class="!rounded-2xl")
                Icon(name="ph:trash-bold" size="14")

  //- ═══════════ CREATE/EDIT DIALOG ═══════════
  el-dialog(
    v-model="showEditor"
    :title="editingId ? $t('calendar.editEvent') : $t('calendar.addEvent')"
    width="600px"
    @close="resetForm"
    :close-on-click-modal="false"
  )
    el-form(ref="formRef" :model="form" :rules="rules" label-position="top")
      el-form-item(:label="$t('calendar.eventTitle')" prop="title")
        el-input(v-model="form.title" :placeholder="$t('calendar.eventTitle')")

      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('calendar.start')" prop="startDate")
          el-date-picker(v-model="form.startDate" type="datetime" class="w-full" :disabled-date="disablePast")
        el-form-item(:label="$t('calendar.end')" prop="endDate")
          el-date-picker(v-model="form.endDate" type="datetime" class="w-full")

      .grid.grid-cols-3.gap-4
        el-form-item(:label="$t('calendar.type')")
          el-select(v-model="form.eventType" class="w-full")
            el-option(
              v-for="tp in EVENT_TYPES"
              :key="tp.value"
              :value="tp.value"
              :label="$t('calendar.' + tp.value.toLowerCase())"
            )
        el-form-item(:label="$t('calendar.priority')")
          el-select(v-model="form.priority" class="w-full")
            el-option(
              v-for="pr in PRIORITY_OPTIONS"
              :key="pr.value"
              :value="pr.value"
              :label="$t('calendar.' + pr.value.toLowerCase())"
            )
        el-form-item(:label="$t('calendar.color')")
          el-color-picker(v-model="form.color")

      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('calendar.location')")
          el-input(v-model="form.location" :placeholder="$t('calendar.location')")
        el-form-item(:label="$t('calendar.meetingLink')")
          el-input(v-model="form.meetingLink" placeholder="https://")

      el-form-item(:label="$t('calendar.description')")
        el-input(v-model="form.description" type="textarea" :rows="3")

      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('calendar.reminderMinutes')")
          el-select(v-model="form.reminder" class="w-full" clearable)
            el-option(:label="$t('calendar.noRecurrence')" :value="0")
            el-option(label="5 min" :value="5")
            el-option(label="15 min" :value="15")
            el-option(label="30 min" :value="30")
            el-option(label="1 hour" :value="60")
            el-option(label="1 day" :value="1440")
        el-form-item(:label="$t('calendar.status')")
          el-select(v-model="form.status" class="w-full")
            el-option(
              v-for="s in STATUS_OPTIONS"
              :key="s.value"
              :value="s.value"
              :label="$t('calendar.' + s.value.toLowerCase())"
            )

      .flex.items-center.gap-6.mb-4
        el-checkbox(v-model="form.allDay") {{ $t('calendar.allDay') }}
        el-checkbox(v-model="form.isPrivate") {{ $t('calendar.private') }}

      //- Attendees
      el-form-item(:label="$t('calendar.attendees')")
        .space-y-2.w-full
          .flex.items-center.gap-2(v-for="(att, ai) in form.attendees" :key="ai")
            el-input(v-model="att.name" placeholder="Name" class="flex-1")
            el-input(v-model="att.email" placeholder="Email" class="flex-1")
            el-button(text type="danger" @click="form.attendees.splice(ai, 1)")
              Icon(name="ph:x-bold" size="14")
          el-button(text type="primary" @click="form.attendees.push({ name: '', email: '', status: 'PENDING' })")
            Icon(name="ph:plus-bold" size="14" class="mr-1")
            span {{ $t('calendar.addAttendee') }}

    template(#footer)
      el-button(@click="showEditor = false" class="!rounded-2xl") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveEvent" class="!rounded-2xl") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { CalendarEvent, CalendarAttendee } from '~/composables/useCalendar';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  fetchTodayAgenda,
  EVENT_TYPES,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  getEventTypeColor,
  getEventTypeIcon,
} from '~/composables/useCalendar';

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// ─── State ──────────────────────────────────────────────────────────────────
const events = ref<CalendarEvent[]>([]);
const todayEvents = ref<CalendarEvent[]>([]);
const currentDate = ref(new Date());
const selectedDateStr = ref(toDateStr(new Date()));
const viewMode = ref<'month' | 'week' | 'day' | 'agenda'>('month');
const filterType = ref('');
const loading = ref(false);
const saving = ref(false);
const showEditor = ref(false);
const showDetail = ref(false);
const editingId = ref<number | null>(null);
const detailEvent = ref<CalendarEvent | null>(null);
const formRef = ref();

// Mini calendar separate date tracking
const miniDate = ref(new Date());

const form = reactive({
  title: '',
  description: '',
  startDate: '' as any,
  endDate: '' as any,
  allDay: false,
  color: '',
  eventType: 'OTHER',
  priority: 'MEDIUM',
  location: '',
  meetingLink: '',
  reminder: 0,
  status: 'SCHEDULED',
  isPrivate: false,
  attendees: [] as Array<{ name: string; email: string; status: string }>
});

const rules = {
  title: [{ required: true, message: () => t('calendar.titleRequired'), trigger: 'blur' }],
  startDate: [{ required: true, message: () => t('calendar.startRequired'), trigger: 'change' }],
  endDate: [{ required: true, message: () => t('calendar.endRequired'), trigger: 'change' }]
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dy}`;
}

const todayStr = toDateStr(new Date());

const weekDayLabels = computed(() => [
  t('calendar.sun'), t('calendar.mon'), t('calendar.tue'), t('calendar.wed'),
  t('calendar.thu'), t('calendar.fri'), t('calendar.sat')
]);

const timeSlots = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM

function formatHour(h: number): string {
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function disablePast(date: Date): boolean {
  return false; // Allow past dates for logging completed events
}

function getHourFromDate(dateStr: string): number {
  return new Date(dateStr).getHours();
}

function priorityTagType(p: string): 'success' | 'warning' | 'info' | 'danger' | '' {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | ''> = {
    LOW: 'info', MEDIUM: '', HIGH: 'warning', URGENT: 'danger'
  };
  return map[p] || 'info';
}

function statusTagType(s: string): 'success' | 'warning' | 'info' | 'danger' | '' {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | ''> = {
    SCHEDULED: '', COMPLETED: 'success', CANCELLED: 'danger'
  };
  return map[s] || 'info';
}

// ─── Filtered Events ────────────────────────────────────────────────────────
const filteredEvents = computed(() => {
  if (!filterType.value) return events.value;
  return events.value.filter(e => e.eventType === filterType.value);
});

// ─── Stats ──────────────────────────────────────────────────────────────────
const totalEventsCount = computed(() => events.value.length);
const scheduledCount = computed(() => events.value.filter(e => e.status === 'SCHEDULED').length);
const completedCount = computed(() => events.value.filter(e => e.status === 'COMPLETED').length);
const thisWeekCount = computed(() => {
  const now = new Date();
  const dow = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dow);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const ws = weekStart.toISOString();
  const we = weekEnd.toISOString();
  return events.value.filter(e => e.startDate >= ws && e.startDate <= we).length;
});

// ─── Mini Calendar ──────────────────────────────────────────────────────────
const miniMonthLabel = computed(() => {
  return miniDate.value.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
});

const miniCells = computed(() => {
  const year = miniDate.value.getFullYear();
  const month = miniDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const cells: any[] = [];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const dateStr = toDateStr(d);
    cells.push({ key: `mp-${i}`, day: d.getDate(), dateStr, isCurrentMonth: false, isToday: dateStr === todayStr, hasEvents: hasEventsOnDate(dateStr) });
  }
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dt = new Date(year, month, d);
    const dateStr = toDateStr(dt);
    cells.push({ key: `mc-${d}`, day: d, dateStr, isCurrentMonth: true, isToday: dateStr === todayStr, hasEvents: hasEventsOnDate(dateStr) });
  }
  // Next month padding
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dateStr = toDateStr(d);
    cells.push({ key: `mn-${i}`, day: i, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr, hasEvents: hasEventsOnDate(dateStr) });
  }
  return cells;
});

function hasEventsOnDate(dateStr: string): boolean {
  return filteredEvents.value.some(e => {
    const start = e.startDate.split('T')[0];
    const end = e.endDate.split('T')[0];
    return dateStr >= start! && dateStr <= end!;
  });
}

function miniPrev() {
  miniDate.value = new Date(miniDate.value.getFullYear(), miniDate.value.getMonth() - 1, 1);
}
function miniNext() {
  miniDate.value = new Date(miniDate.value.getFullYear(), miniDate.value.getMonth() + 1, 1);
}
function onMiniDateClick(cell: any) {
  selectedDateStr.value = cell.dateStr;
  currentDate.value = new Date(cell.dateStr + 'T00:00:00');
  if (viewMode.value === 'month') {
    // Stay in month view but highlight the date
  }
}

// ─── Month View ─────────────────────────────────────────────────────────────
const mainHeaderLabel = computed(() => {
  const d = currentDate.value;
  if (viewMode.value === 'month') {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (viewMode.value === 'week') {
    const dow = d.getDay();
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - dow);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  if (viewMode.value === 'day') {
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

const monthCells = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const cells: any[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const dateStr = toDateStr(d);
    cells.push({ key: `prev-${i}`, day: d.getDate(), dateStr, isCurrentMonth: false, isToday: dateStr === todayStr, events: getEventsForDate(dateStr) });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dt = new Date(year, month, d);
    const dateStr = toDateStr(dt);
    cells.push({ key: `cur-${d}`, day: d, dateStr, isCurrentMonth: true, isToday: dateStr === todayStr, events: getEventsForDate(dateStr) });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dateStr = toDateStr(d);
    cells.push({ key: `next-${i}`, day: i, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr, events: getEventsForDate(dateStr) });
  }
  return cells;
});

function getEventsForDate(dateStr: string): CalendarEvent[] {
  return filteredEvents.value.filter(e => {
    const start = e.startDate.split('T')[0];
    const end = e.endDate.split('T')[0];
    return dateStr >= start! && dateStr <= end!;
  });
}

function onMonthCellClick(cell: any) {
  selectedDateStr.value = cell.dateStr;
}

// ─── Week View ──────────────────────────────────────────────────────────────
const weekDayHeaders = computed(() => {
  const d = currentDate.value;
  const dow = d.getDay();
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - dow);
  const days: any[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(weekStart);
    dt.setDate(weekStart.getDate() + i);
    const dateStr = toDateStr(dt);
    days.push({
      dateStr,
      dayNum: dt.getDate(),
      label: dt.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: dateStr === todayStr
    });
  }
  return days;
});

function getWeekEventsForSlot(dateStr: string, hour: number): CalendarEvent[] {
  return filteredEvents.value.filter(e => {
    const start = e.startDate.split('T')[0];
    const end = e.endDate.split('T')[0];
    if (dateStr < start! || dateStr > end!) return false;
    if (e.allDay) return hour === 7; // Show all-day at first slot
    return getHourFromDate(e.startDate) === hour;
  });
}

// ─── Day View ───────────────────────────────────────────────────────────────
const dayHeaderLabel = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
});

const dayAllDayEvents = computed(() => {
  return filteredEvents.value.filter(e => {
    const start = e.startDate.split('T')[0];
    const end = e.endDate.split('T')[0];
    return e.allDay && selectedDateStr.value >= start! && selectedDateStr.value <= end!;
  });
});

function getDayEventsForHour(hour: number): CalendarEvent[] {
  return filteredEvents.value.filter(e => {
    const start = e.startDate.split('T')[0];
    const end = e.endDate.split('T')[0];
    if (selectedDateStr.value < start! || selectedDateStr.value > end!) return false;
    if (e.allDay) return false;
    return getHourFromDate(e.startDate) === hour;
  });
}

// ─── Agenda View ────────────────────────────────────────────────────────────
const agendaGroups = computed(() => {
  // Show next 14 days of events
  const groups: Array<{ dateStr: string; label: string; events: CalendarEvent[] }> = [];
  const start = new Date(currentDate.value);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    const dateStr = toDateStr(dt);
    const dayEvents = getEventsForDate(dateStr);
    if (dayEvents.length > 0) {
      groups.push({
        dateStr,
        label: dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        events: dayEvents
      });
    }
  }
  return groups;
});

// ─── Navigation ─────────────────────────────────────────────────────────────
function navigatePrev() {
  const d = new Date(currentDate.value);
  if (viewMode.value === 'month') d.setMonth(d.getMonth() - 1);
  else if (viewMode.value === 'week') d.setDate(d.getDate() - 7);
  else d.setDate(d.getDate() - 1);
  currentDate.value = d;
  selectedDateStr.value = toDateStr(d);
  loadEvents();
}

function navigateNext() {
  const d = new Date(currentDate.value);
  if (viewMode.value === 'month') d.setMonth(d.getMonth() + 1);
  else if (viewMode.value === 'week') d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 1);
  currentDate.value = d;
  selectedDateStr.value = toDateStr(d);
  loadEvents();
}

function goToToday() {
  currentDate.value = new Date();
  selectedDateStr.value = todayStr;
  miniDate.value = new Date();
  loadEvents();
}

// ─── CRUD ───────────────────────────────────────────────────────────────────
function openCreate() {
  resetForm();
  if (selectedDateStr.value) {
    form.startDate = new Date(selectedDateStr.value + 'T09:00:00');
    form.endDate = new Date(selectedDateStr.value + 'T10:00:00');
  }
  showEditor.value = true;
}

function quickCreate(dateStr: string, hour: number) {
  resetForm();
  form.startDate = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`);
  form.endDate = new Date(`${dateStr}T${String(hour + 1).padStart(2, '0')}:00:00`);
  showEditor.value = true;
}

function viewEvent(evt: CalendarEvent) {
  detailEvent.value = evt;
  showDetail.value = true;
}

function editFromDetail() {
  if (!detailEvent.value) return;
  editEvent(detailEvent.value);
  showDetail.value = false;
}

function editEvent(evt: CalendarEvent) {
  editingId.value = evt.id;
  form.title = evt.title;
  form.description = evt.description || '';
  form.startDate = new Date(evt.startDate);
  form.endDate = new Date(evt.endDate);
  form.allDay = evt.allDay;
  form.color = evt.color || '';
  form.eventType = evt.eventType;
  form.priority = evt.priority || 'MEDIUM';
  form.location = evt.location || '';
  form.meetingLink = evt.meetingLink || '';
  form.reminder = evt.reminder || 0;
  form.status = evt.status || 'SCHEDULED';
  form.isPrivate = evt.isPrivate || false;
  form.attendees = (evt.attendees || []).map(a => ({ name: a.name, email: a.email || '', status: a.status }));
  showEditor.value = true;
}

function resetForm() {
  editingId.value = null;
  form.title = '';
  form.description = '';
  form.startDate = '';
  form.endDate = '';
  form.allDay = false;
  form.color = '';
  form.eventType = 'OTHER';
  form.priority = 'MEDIUM';
  form.location = '';
  form.meetingLink = '';
  form.reminder = 0;
  form.status = 'SCHEDULED';
  form.isPrivate = false;
  form.attendees = [];
}

async function saveEvent() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const payload = {
      title: form.title,
      description: form.description,
      startDate: form.startDate,
      endDate: form.endDate,
      allDay: form.allDay,
      color: form.color || undefined,
      eventType: form.eventType,
      priority: form.priority,
      location: form.location || undefined,
      meetingLink: form.meetingLink || undefined,
      reminder: form.reminder || undefined,
      status: form.status,
      isPrivate: form.isPrivate,
      attendees: form.attendees.filter(a => a.name.trim())
    };
    const res = editingId.value
      ? await updateCalendarEvent(editingId.value, payload)
      : await createCalendarEvent(payload);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
      showEditor.value = false;
      await loadEvents();
      await loadTodayAgenda();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: number) {
  const res = await deleteCalendarEvent(id);
  if (res.success) {
    showDetail.value = false;
    detailEvent.value = null;
    await loadEvents();
    await loadTodayAgenda();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') || 'Deleted' });
  }
}

// ─── Data Loading ───────────────────────────────────────────────────────────
async function loadEvents() {
  loading.value = true;
  try {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month + 2, 0).toISOString();
    events.value = await fetchCalendarEvents({ start, end });
  } finally {
    loading.value = false;
  }
}

async function loadTodayAgenda() {
  todayEvents.value = await fetchTodayAgenda();
}

// ─── Watch view mode changes to update date range ──────────────────────────
watch(viewMode, () => {
  loadEvents();
});

// ─── Init ───────────────────────────────────────────────────────────────────
onMounted(() => {
  loadEvents();
  loadTodayAgenda();
});
</script>

<style scoped>
/* ─── Month Calendar Grid ─────────────────────────────────────────────────── */
.calendar-cell {
  min-height: 90px;
  padding: 4px 6px;
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: background 0.2s;
}
.calendar-cell:hover {
  background: var(--bg-input);
}
.calendar-cell.cell-today {
  background: rgba(120, 73, 255, 0.06);
}
.calendar-cell.cell-selected {
  background: rgba(120, 73, 255, 0.1);
  box-shadow: inset 0 0 0 2px rgba(120, 73, 255, 0.3);
}
.calendar-cell.other-month {
  opacity: 0.35;
}

.today-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #7849ff;
  color: #fff !important;
  font-weight: 700;
}

.event-dot {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
  color: white;
  margin-bottom: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: brightness 0.2s;
}
.event-dot:hover {
  filter: brightness(1.15);
}

/* ─── Mini Calendar ───────────────────────────────────────────────────────── */
.mini-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 4px;
  color: var(--text-primary);
  position: relative;
  transition: background 0.15s;
}
.mini-cell:hover {
  background: var(--bg-input);
}
.mini-cell.mini-other {
  opacity: 0.3;
}
.mini-cell.mini-today span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #7849ff;
  color: #fff;
  font-weight: 700;
}
.mini-cell.mini-selected {
  background: rgba(120, 73, 255, 0.15);
}
.mini-cell.mini-has-events::after {
  content: '';
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #7849ff;
}

/* ─── Week View ───────────────────────────────────────────────────────────── */
.week-header-grid {
  grid-template-columns: 60px repeat(7, 1fr);
}
.week-body-grid {
  grid-template-columns: 60px repeat(7, 1fr);
}
.week-time-gutter {
  display: flex;
  flex-direction: column;
}
.week-time-slot {
  min-height: 60px;
  border-bottom: 1px solid var(--border-default);
  padding: 2px 4px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}
.week-day-column .week-time-slot {
  justify-content: flex-start;
  flex-direction: column;
  position: relative;
}
.week-today-header {
  background: rgba(120, 73, 255, 0.06);
}
.week-event-block {
  padding: 4px 6px;
  border-radius: 6px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: filter 0.2s;
}
.week-event-block:hover {
  filter: brightness(1.1);
}

/* ─── Day View ────────────────────────────────────────────────────────────── */
.day-event-block {
  padding: 8px 10px;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: filter 0.2s;
}
.day-event-block:hover {
  filter: brightness(1.1);
}

/* ─── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .calendar-cell {
    min-height: 60px;
    padding: 2px 3px;
  }
  .event-dot {
    font-size: 9px;
    padding: 0 3px;
  }
  .week-header-grid,
  .week-body-grid {
    grid-template-columns: 45px repeat(7, 1fr);
  }
}
</style>
