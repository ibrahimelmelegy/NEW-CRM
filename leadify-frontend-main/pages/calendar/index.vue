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

  //- Month Navigation
  .glass-card.p-4.mb-6.animate-entrance(style="color: var(--text-primary)")
    .flex.items-center.justify-between
      .flex.items-center.gap-3
        el-button(text @click="prevMonth" class="!rounded-2xl")
          Icon(name="ph:caret-left-bold" size="18" aria-label="Previous")
        h3.text-xl.font-bold {{ currentMonthLabel }}
        el-button(text @click="nextMonth" class="!rounded-2xl")
          Icon(name="ph:caret-right-bold" size="18" aria-label="Next")
      el-button(size="small" @click="goToToday" class="!rounded-2xl") {{ $t('calendar.today') }}

  //- Calendar Grid
  .glass-card.p-4.animate-entrance
    .grid.grid-cols-7.gap-0
      //- Day headers
      .text-center.py-2.text-xs.font-bold(
        v-for="day in weekDays"
        :key="day"
        style="color: var(--text-muted)"
      ) {{ day }}

      //- Day cells
      .calendar-cell(
        v-for="cell in calendarCells"
        :key="cell.key"
        :class="{ 'other-month': !cell.isCurrentMonth, today: cell.isToday }"
        @click="selectDate(cell.date)"
      )
        .text-xs.font-medium.mb-1(:style="cell.isToday ? 'color: #7849ff' : 'color: var(--text-primary)'") {{ cell.day }}
        .event-dot(
          v-for="evt in cell.events.slice(0, 3)"
          :key="evt.id"
          :style="{ background: evt.color || getTypeColor(evt.eventType) }"
          @click.stop="editEvent(evt)"
        ) {{ evt.title }}
        .text-xs(v-if="cell.events.length > 3" style="color: var(--text-muted)") +{{ cell.events.length - 3 }}

  //- Event List for Selected Date
  .glass-card.p-6.mt-6.animate-entrance(v-if="selectedDateEvents.length")
    h3.font-bold.mb-4(style="color: var(--text-primary)") {{ selectedDateLabel }}
    .space-y-2
      .flex.items-center.justify-between.p-3.rounded-xl(
        v-for="evt in selectedDateEvents"
        :key="evt.id"
        style="background: var(--bg-input)"
      )
        .flex.items-center.gap-3
          .w-3.h-3.rounded-full(:style="{ background: evt.color || getTypeColor(evt.eventType) }")
          div
            p.font-medium.text-sm(style="color: var(--text-primary)") {{ evt.title }}
            p.text-xs(style="color: var(--text-muted)") {{ formatTime(evt.startDate) }} — {{ formatTime(evt.endDate) }}
          span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getTypeLabelColor(evt.eventType)}`") {{ evt.eventType }}
        .flex.gap-1
          el-button(size="small" @click="editEvent(evt)" class="!rounded-2xl")
            Icon(name="ph:pencil-bold" size="14" aria-label="Edit")
          el-popconfirm(:title="$t('common.confirmDelete')" @confirm="handleDelete(evt.id)")
            template(#reference)
              el-button(size="small" type="danger" class="!rounded-2xl")
                Icon(name="ph:trash-bold" size="14" aria-label="Delete")

  //- Create/Edit Event Dialog
  el-dialog(v-model="showEditor" :title="editingId ? $t('calendar.editEvent') : $t('calendar.addEvent')" width="550px" @close="resetForm")
    el-form(ref="formRef" :model="form" :rules="rules" label-position="top")
      el-form-item(:label="$t('calendar.eventTitle')" prop="title")
        el-input(v-model="form.title")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('calendar.start')" prop="startDate")
          el-date-picker(v-model="form.startDate" type="datetime" class="w-full")
        el-form-item(:label="$t('calendar.end')" prop="endDate")
          el-date-picker(v-model="form.endDate" type="datetime" class="w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('calendar.type')")
          el-select(v-model="form.eventType" class="w-full")
            el-option(v-for="tp in EVENT_TYPES" :key="tp.value" :value="tp.value" :label="$t('calendar.' + tp.value.toLowerCase())")
        el-form-item(:label="$t('calendar.color')")
          el-color-picker(v-model="form.color")
      el-form-item(:label="$t('calendar.location')")
        el-input(v-model="form.location")
      el-form-item(:label="$t('calendar.description')")
        el-input(v-model="form.description" type="textarea" :rows="3")
      el-checkbox(v-model="form.allDay") {{ $t('calendar.allDay') }}
    template(#footer)
      el-button(@click="showEditor = false" class="!rounded-2xl") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveEvent" class="!rounded-2xl") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { CalendarEvent } from '~/composables/useCalendar';
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, EVENT_TYPES } from '~/composables/useCalendar';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const events = ref<CalendarEvent[]>([]);
const currentDate = ref(new Date());
const selectedDate = ref<string | null>(null);
const showEditor = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const formRef = ref();

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const form = reactive({
  title: '', description: '', startDate: '' as any, endDate: '' as any,
  allDay: false, color: '', eventType: 'OTHER', location: ''
});

const rules = {
  title: [{ required: true, message: () => t('calendar.titleRequired'), trigger: 'blur' }],
  startDate: [{ required: true, message: () => t('calendar.startRequired'), trigger: 'change' }],
  endDate: [{ required: true, message: () => t('calendar.endRequired'), trigger: 'change' }]
};

const currentMonthLabel = computed(() => {
  const d = currentDate.value;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

const calendarCells = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const cells: any[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const dateStr = d.toISOString().split('T')[0]!;
    cells.push({ key: `prev-${i}`, day: d.getDate(), date: dateStr, isCurrentMonth: false, isToday: false, events: getEventsForDate(dateStr) });
  }
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dt = new Date(year, month, d);
    const dateStr = dt.toISOString().split('T')[0]!;
    cells.push({ key: `cur-${d}`, day: d, date: dateStr, isCurrentMonth: true, isToday: dateStr === today, events: getEventsForDate(dateStr) });
  }
  // Next month padding
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dateStr = d.toISOString().split('T')[0]!;
    cells.push({ key: `next-${i}`, day: i, date: dateStr, isCurrentMonth: false, isToday: false, events: getEventsForDate(dateStr) });
  }
  return cells;
});

const selectedDateEvents = computed(() => {
  if (!selectedDate.value) return [];
  return getEventsForDate(selectedDate.value);
});

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return '';
  return new Date(selectedDate.value + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
});

function getEventsForDate(dateStr: string): CalendarEvent[] {
  return events.value.filter(e => {
    const start = e.startDate.split('T')[0];
    const end = e.endDate.split('T')[0];
    return dateStr >= start! && dateStr <= end!;
  });
}

function getTypeColor(type: string): string {
  const found = EVENT_TYPES.find(t => t.value === type);
  return found?.color || '#6b7280';
}

function getTypeLabelColor(type: string): string {
  const colorMap: Record<string, string> = {
    MEETING: 'purple',
    CALL: 'green',
    TASK: 'orange',
    REMINDER: 'red',
    OTHER: 'gray'
  };
  return colorMap[type] || 'gray';
}

onMounted(() => loadEvents());

async function loadEvents() {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month + 2, 0).toISOString();
  events.value = await fetchCalendarEvents({ start, end });
}

function prevMonth() { currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1); loadEvents(); }
function nextMonth() { currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1); loadEvents(); }
function goToToday() { currentDate.value = new Date(); selectedDate.value = new Date().toISOString().split('T')[0]!; loadEvents(); }
function selectDate(date: string) { selectedDate.value = date; }

function openCreate() {
  resetForm();
  if (selectedDate.value) {
    form.startDate = new Date(selectedDate.value + 'T09:00:00');
    form.endDate = new Date(selectedDate.value + 'T10:00:00');
  }
  showEditor.value = true;
}

function editEvent(evt: CalendarEvent) {
  editingId.value = evt.id;
  form.title = evt.title; form.description = evt.description || '';
  form.startDate = new Date(evt.startDate); form.endDate = new Date(evt.endDate);
  form.allDay = evt.allDay; form.color = evt.color || '';
  form.eventType = evt.eventType; form.location = evt.location || '';
  showEditor.value = true;
}

function resetForm() {
  editingId.value = null;
  form.title = ''; form.description = ''; form.startDate = ''; form.endDate = '';
  form.allDay = false; form.color = ''; form.eventType = 'OTHER'; form.location = '';
}

async function saveEvent() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const payload = { ...form };
    const res = editingId.value
      ? await updateCalendarEvent(editingId.value, payload)
      : await createCalendarEvent(payload);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
      showEditor.value = false;
      await loadEvents();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  const res = await deleteCalendarEvent(id);
  if (res.success) { await loadEvents(); }
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
</script>

<style>
.calendar-cell {
  min-height: 80px;
  padding: 4px 6px;
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: background 0.2s;
}
.calendar-cell:hover { background: var(--bg-input); }
.calendar-cell.today { background: rgba(120, 73, 255, 0.06); }
.calendar-cell.other-month { opacity: 0.4; }
.event-dot {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  color: white;
  margin-bottom: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
</style>
