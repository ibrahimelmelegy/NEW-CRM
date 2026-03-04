<template lang="pug">
.calendar-view
  //- Calendar header
  .calendar-header
    el-button(text size="default" @click="prevMonth")
      el-icon
        ArrowLeft
    h3.calendar-month-label {{ monthLabel }}
    el-button(text size="default" @click="nextMonth")
      el-icon
        ArrowRight
    el-button.ml-4(size="small" @click="goToToday") Today

  //- Weekday headers
  .calendar-grid
    .calendar-weekday(v-for="day in weekDays" :key="day") {{ day }}

    //- Day cells
    .calendar-day(
      v-for="cell in calendarCells"
      :key="cell.dateKey"
      :class="getDayCellClasses(cell)"
      @click="selectDate(cell)"
    )
      .calendar-day-number {{ cell.day }}
      .calendar-day-records(v-if="cell.records.length > 0")
        .calendar-pill(
          v-for="(record, ri) in cell.records.slice(0, 3)"
          :key="ri"
          :style="{ background: getPillColor(ri) }"
          @click.stop="$emit('row-click', record)"
        )
          span.calendar-pill-text {{ getRecordLabel(record) }}
        .calendar-pill-more(
          v-if="cell.records.length > 3"
          @click.stop="selectDate(cell)"
        ) +{{ cell.records.length - 3 }} more

  //- Selected date detail panel
  Transition(name="fade")
    .calendar-detail-panel.glass-card(v-if="selectedDate && selectedRecords.length > 0")
      .calendar-detail-header
        h4.calendar-detail-title {{ selectedDateLabel }}
        el-button(text @click="selectedDate = null")
          el-icon
            Close
      .calendar-detail-list
        .calendar-detail-item(
          v-for="(record, i) in selectedRecords"
          :key="i"
          @click="$emit('row-click', record)"
        )
          .calendar-detail-dot(:style="{ background: getPillColor(i) }")
          .calendar-detail-info
            .calendar-detail-name {{ getRecordLabel(record) }}
            .calendar-detail-fields
              span.calendar-detail-field(
                v-for="col in detailColumns"
                :key="col.prop"
              ) {{ col.label }}: {{ record[col.prop] || '-' }}
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight, Close } from '@element-plus/icons-vue';
import type { SmartTableColumn } from '~/composables/useSmartTable';

interface CalendarCell {
  dateKey: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  date: Date;
  records: any[];
}

const props = defineProps({
  data: {
    type: Array as PropType<any[]>,
    required: true
  },
  columns: {
    type: Array as PropType<SmartTableColumn[]>,
    required: true
  },
  dateField: {
    type: String,
    required: true
  }
});

const emit = defineEmits<{
  'row-click': [row: any];
  'date-select': [date: string];
}>();

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());
const selectedDate = ref<string | null>(null);

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
});

// Build calendar grid
const calendarCells = computed<CalendarCell[]>(() => {
  const year = currentYear.value;
  const month = currentMonth.value;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  const todayKey = formatDateKey(today);

  // Build record map for quick lookup
  const recordsByDate = new Map<string, any[]>();
  props.data.forEach(record => {
    const dateVal = record[props.dateField];
    if (!dateVal) return;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return;
    const key = formatDateKey(d);
    if (!recordsByDate.has(key)) {
      recordsByDate.set(key, []);
    }
    recordsByDate.get(key)!.push(record);
  });

  const cells: CalendarCell[] = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const d = new Date(year, month - 1, day);
    const key = formatDateKey(d);
    cells.push({
      dateKey: key,
      day,
      isCurrentMonth: false,
      isToday: key === todayKey,
      date: d,
      records: recordsByDate.get(key) || []
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = formatDateKey(d);
    cells.push({
      dateKey: key,
      day,
      isCurrentMonth: true,
      isToday: key === todayKey,
      date: d,
      records: recordsByDate.get(key) || []
    });
  }

  // Next month padding to fill the grid (up to 42 cells = 6 weeks)
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const key = formatDateKey(d);
    cells.push({
      dateKey: key,
      day: i,
      isCurrentMonth: false,
      isToday: key === todayKey,
      date: d,
      records: recordsByDate.get(key) || []
    });
  }

  return cells;
});

const selectedRecords = computed(() => {
  if (!selectedDate.value) return [];
  const cell = calendarCells.value.find(c => c.dateKey === selectedDate.value);
  return cell?.records || [];
});

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return '';
  const d = new Date(selectedDate.value);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
});

// Show first 3 columns in detail view (excluding date field)
const detailColumns = computed(() =>
  props.columns
    .filter(c => c.visible !== false && c.prop !== props.dateField)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, 3)
);

// Methods
const formatDateKey = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  selectedDate.value = null;
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  selectedDate.value = null;
};

const goToToday = () => {
  const today = new Date();
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth();
  selectedDate.value = formatDateKey(today);
};

const selectDate = (cell: CalendarCell) => {
  selectedDate.value = cell.dateKey;
  emit('date-select', cell.dateKey);
};

const getDayCellClasses = (cell: CalendarCell) => ({
  'calendar-day--other-month': !cell.isCurrentMonth,
  'calendar-day--today': cell.isToday,
  'calendar-day--selected': selectedDate.value === cell.dateKey,
  'calendar-day--has-records': cell.records.length > 0
});

const getRecordLabel = (record: any) => {
  // Use first visible text column as label
  const textCol = props.columns.find(c => c.visible !== false && c.prop !== props.dateField && c.type !== 'image');
  if (textCol) {
    const val = record[textCol.prop];
    if (val && typeof val === 'object' && val.title) return val.title;
    return val || 'Record';
  }
  return record.name || record.title || 'Record';
};

const pillColors = [
  'rgba(124, 58, 237, 0.8)',
  'rgba(59, 130, 246, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(236, 72, 153, 0.8)'
];

const getPillColor = (index: number) => {
  return pillColors[index % pillColors.length];
};
</script>

<style lang="scss" scoped>
.calendar-view {
  width: 100%;
}

.calendar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 16px;
}

.calendar-month-label {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 180px;
  text-align: center;
  margin: 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-default);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 10px);
  overflow: hidden;
}

.calendar-weekday {
  padding: 10px 8px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
}

.calendar-day {
  min-height: 90px;
  padding: 6px 8px;
  background: var(--bg-card-solid, var(--bg-secondary));
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--bg-hover);
  }

  &--other-month {
    opacity: 0.35;
  }

  &--today {
    .calendar-day-number {
      background: var(--gradient-primary, linear-gradient(135deg, #7c3aed, #a855f7));
      color: #fff;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &--selected {
    background: var(--bg-hover) !important;
    box-shadow: inset 0 0 0 2px var(--brand-primary, #7c3aed);
  }
}

.calendar-day-number {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.calendar-day-records {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.calendar-pill {
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.8;
  }
}

.calendar-pill-text {
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.calendar-pill-more {
  font-size: 10px;
  color: var(--text-muted);
  padding: 1px 6px;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    color: var(--brand-primary);
  }
}

// Detail panel
.calendar-detail-panel {
  margin-top: 16px;
  padding: 16px 20px;
  border-radius: var(--radius-lg, 14px) !important;
}

.calendar-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.calendar-detail-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.calendar-detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calendar-detail-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--bg-hover);
  }
}

.calendar-detail-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

.calendar-detail-info {
  flex: 1;
  min-width: 0;
}

.calendar-detail-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.calendar-detail-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.calendar-detail-field {
  font-size: 12px;
  color: var(--text-muted);
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
