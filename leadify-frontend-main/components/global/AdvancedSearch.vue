<template lang="pug">
.advanced-search
  //- Toggle button
  .flex.items-center.gap-2.mb-3(v-if="!alwaysOpen")
    el-button(text @click="expanded = !expanded")
      Icon(:name="expanded ? 'ph:funnel-simple-bold' : 'ph:funnel-simple-bold'" size="16")
      span.ml-1 {{ $t('common.advancedFilters') || 'Advanced Filters' }}
      el-badge.ml-1(v-if="filterRows.length > 0 && !expanded" :value="filterRows.length" type="primary")

  //- Filter builder
  Transition(name="slide-down")
    .glass-card.p-4.space-y-3(v-if="expanded || alwaysOpen")
      //- Group logic toggle
      .flex.items-center.gap-2.mb-2(v-if="filterRows.length > 1")
        span.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('common.matchCondition') || 'Match' }}
        el-radio-group(v-model="groupLogic" size="small")
          el-radio-button(value="AND") {{ $t('common.all') || 'All' }}
          el-radio-button(value="OR") {{ $t('common.any') || 'Any' }}

      //- Filter rows
      .filter-row(v-for="(row, index) in filterRows" :key="row.id")
        .flex.items-center.gap-2.flex-wrap
          //- Logic badge between rows
          .logic-badge(v-if="index > 0")
            span.text-xs.font-medium {{ groupLogic }}

          //- Field selector
          el-select(
            v-model="row.field"
            :placeholder="$t('common.selectField') || 'Select field'"
            size="default"
            filterable
            style="width: 180px"
            @change="onFieldChange(row)"
          )
            el-option(v-for="field in fields" :key="field.key" :label="field.label" :value="field.key")

          //- Operator selector
          el-select(
            v-model="row.operator"
            :placeholder="$t('common.operator') || 'Operator'"
            size="default"
            style="width: 160px"
          )
            el-option(v-for="op in getOperators(row.field)" :key="op.value" :label="op.label" :value="op.value")

          //- Value input (dynamic based on field type)
          template(v-if="row.operator !== 'is_empty' && row.operator !== 'is_not_empty'")
            //- Date picker
            template(v-if="getFieldType(row.field) === 'date'")
              el-date-picker(
                v-if="row.operator === 'between'"
                v-model="row.value"
                type="daterange"
                size="default"
                :start-placeholder="$t('common.startDate') || 'Start'"
                :end-placeholder="$t('common.endDate') || 'End'"
                style="width: 260px"
                value-format="YYYY-MM-DD"
              )
              el-date-picker(
                v-else
                v-model="row.value"
                type="date"
                size="default"
                :placeholder="$t('common.selectDate') || 'Select date'"
                style="width: 180px"
                value-format="YYYY-MM-DD"
              )

            //- Number input
            template(v-else-if="getFieldType(row.field) === 'number'")
              .flex.items-center.gap-1(v-if="row.operator === 'between'")
                el-input-number(v-model="row.value" size="default" :placeholder="$t('common.min') || 'Min'" style="width: 120px" controls-position="right")
                span.text-xs(style="color: var(--text-muted)") -
                el-input-number(v-model="row.valueTo" size="default" :placeholder="$t('common.max') || 'Max'" style="width: 120px" controls-position="right")
              el-input-number(v-else v-model="row.value" size="default" style="width: 180px" controls-position="right")

            //- Select (for enum fields)
            template(v-else-if="getFieldType(row.field) === 'select'")
              el-select(
                v-model="row.value"
                :multiple="row.operator === 'in' || row.operator === 'not_in'"
                :placeholder="$t('common.selectValue') || 'Select value'"
                size="default"
                filterable
                style="width: 220px"
              )
                el-option(v-for="opt in getFieldOptions(row.field)" :key="opt.value" :label="opt.label" :value="opt.value")

            //- Default text input
            template(v-else)
              el-input(v-model="row.value" :placeholder="$t('common.enterValue') || 'Enter value'" size="default" style="width: 200px" clearable)

          //- Remove button
          el-button(text circle size="small" @click="removeRow(index)")
            Icon(name="ph:x-bold" size="14" style="color: var(--text-muted)")

      //- Actions
      .flex.items-center.justify-between.pt-2
        el-button(text @click="addRow")
          Icon(name="ph:plus-bold" size="14")
          span.ml-1 {{ $t('common.addFilter') || 'Add Filter' }}
        .flex.gap-2
          el-button(v-if="filterRows.length > 0" text @click="clearAll")
            span {{ $t('common.clearAll') || 'Clear All' }}
          el-button(type="primary" :disabled="!hasValidFilters" @click="applyFilters" class="!rounded-xl")
            Icon(name="ph:magnifying-glass-bold" size="14")
            span.ml-1 {{ $t('common.apply') || 'Apply' }}
</template>

<script setup lang="ts">
interface FilterField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'select';
  options?: { value: string; label: string }[];
}

interface FilterRow {
  id: number;
  field: string;
  operator: string;
  value: any;
  valueTo?: any; // for "between" operator
}

interface OperatorOption {
  value: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    entityType: string;
    fields: FilterField[];
    alwaysOpen?: boolean;
    initialFilters?: any[];
  }>(),
  {
    alwaysOpen: false
  }
);

const emit = defineEmits<{
  apply: [filters: { logic: string; conditions: any[] }];
  clear: [];
}>();

const expanded = ref(props.alwaysOpen);
const groupLogic = ref<'AND' | 'OR'>('AND');
const filterRows = ref<FilterRow[]>([]);
let nextId = 1;

const STRING_OPERATORS: OperatorOption[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not equals' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' }
];

const NUMBER_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not equals' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater or equal' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less or equal' },
  { value: 'between', label: 'Between' },
  { value: 'is_empty', label: 'Is empty' }
];

const DATE_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'On' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' }
];

const SELECT_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'Is' },
  { value: 'not_equals', label: 'Is not' },
  { value: 'in', label: 'Is any of' },
  { value: 'not_in', label: 'Is none of' },
  { value: 'is_empty', label: 'Is empty' }
];

function getFieldType(fieldKey: string): string {
  return props.fields.find(f => f.key === fieldKey)?.type || 'string';
}

function getFieldOptions(fieldKey: string): { value: string; label: string }[] {
  return props.fields.find(f => f.key === fieldKey)?.options || [];
}

function getOperators(fieldKey: string): OperatorOption[] {
  const type = getFieldType(fieldKey);
  switch (type) {
    case 'number':
      return NUMBER_OPERATORS;
    case 'date':
      return DATE_OPERATORS;
    case 'select':
      return SELECT_OPERATORS;
    default:
      return STRING_OPERATORS;
  }
}

function onFieldChange(row: FilterRow) {
  const operators = getOperators(row.field);
  row.operator = operators[0]?.value || 'contains';
  row.value = null;
  row.valueTo = undefined;
}

function addRow() {
  filterRows.value.push({
    id: nextId++,
    field: props.fields[0]?.key || '',
    operator: 'contains',
    value: null,
    valueTo: undefined
  });
}

function removeRow(index: number) {
  filterRows.value.splice(index, 1);
}

function clearAll() {
  filterRows.value = [];
  groupLogic.value = 'AND';
  emit('clear');
}

const hasValidFilters = computed(() => {
  return filterRows.value.some(row => {
    if (!row.field || !row.operator) return false;
    if (row.operator === 'is_empty' || row.operator === 'is_not_empty') return true;
    if (row.operator === 'between') {
      return row.value != null && row.valueTo != null;
    }
    return row.value != null && row.value !== '';
  });
});

function applyFilters() {
  const conditions = filterRows.value
    .filter(row => {
      if (!row.field || !row.operator) return false;
      if (row.operator === 'is_empty' || row.operator === 'is_not_empty') return true;
      if (row.operator === 'between') return row.value != null && row.valueTo != null;
      return row.value != null && row.value !== '';
    })
    .map(row => ({
      field: row.field,
      operator: row.operator,
      value: row.operator === 'between' ? [row.value, row.valueTo] : row.value
    }));

  emit('apply', {
    logic: groupLogic.value,
    conditions
  });
}

// Initialize with initial filters if provided
if (props.initialFilters && props.initialFilters.length > 0) {
  props.initialFilters.forEach(f => {
    filterRows.value.push({
      id: nextId++,
      field: f.field,
      operator: f.operator,
      value: f.value,
      valueTo: Array.isArray(f.value) ? f.value[1] : undefined
    });
  });
  if (filterRows.value.length > 0) expanded.value = true;
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.filter-row {
  position: relative;
}

.logic-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 10px;
  background: var(--accent-color, #7849ff);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.filter-row + .filter-row {
  padding-top: 8px;
  border-top: 1px dashed var(--glass-border-color, rgba(255, 255, 255, 0.06));
}
</style>
