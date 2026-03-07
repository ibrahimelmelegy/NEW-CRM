<template lang="pug">
.filter-builder
  .filter-header
    h4.filter-title {{ $t('common.filter') }}
    el-button(text size="small" @click="addRule")
      el-icon
        Plus
      span Add Rule

  .filter-rules(v-if="localFilters.length > 0")
    .filter-rule(v-for="(rule, index) in localFilters" :key="index")
      //- Logic connector (AND/OR) for rules after the first
      .logic-connector(v-if="index > 0")
        el-radio-group(
          v-model="rule.logic"
          size="small"
        )
          el-radio-button(value="AND") AND
          el-radio-button(value="OR") OR

      .rule-row
        //- Field selector
        el-select(
          v-model="rule.field"
          :placeholder="$t('common.choose') + 'field'"
          size="default"
          class="rule-field"
          @change="onFieldChange(index)"
        )
          el-option(
            v-for="col in filterableColumns"
            :key="col.prop"
            :label="col.label"
            :value="col.prop"
          )

        //- Operator selector
        el-select(
          v-model="rule.operator"
          :placeholder="$t('common.operator')"
          size="default"
          class="rule-operator"
        )
          el-option(
            v-for="op in getOperatorsForField(rule.field)"
            :key="op.value"
            :label="op.label"
            :value="op.value"
          )

        //- Value input - dynamic based on field type
        template(v-if="rule.operator === 'between'")
          .between-inputs
            el-input(
              v-model="rule.value[0]"
              :placeholder="'Min'"
              size="default"
              :type="getFieldType(rule.field) === 'number' ? 'number' : 'text'"
              class="rule-value-half"
            )
            span.between-separator -
            el-input(
              v-model="rule.value[1]"
              :placeholder="'Max'"
              size="default"
              :type="getFieldType(rule.field) === 'number' ? 'number' : 'text'"
              class="rule-value-half"
            )

        template(v-else-if="rule.operator === 'in'")
          el-select(
            v-model="rule.value"
            multiple
            filterable
            allow-create
            default-first-option
            :placeholder="'Select values'"
            size="default"
            class="rule-value"
          )
            el-option(
              v-for="opt in getSelectOptions(rule.field)"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            )

        template(v-else-if="getFieldType(rule.field) === 'date'")
          el-date-picker(
            v-model="rule.value"
            type="date"
            :placeholder="'Select date'"
            size="default"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="rule-value"
          )

        template(v-else-if="getFieldType(rule.field) === 'select'")
          el-select(
            v-model="rule.value"
            :placeholder="'Select value'"
            size="default"
            filterable
            class="rule-value"
          )
            el-option(
              v-for="opt in getSelectOptions(rule.field)"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            )

        template(v-else-if="getFieldType(rule.field) === 'number'")
          el-input(
            v-model="rule.value"
            :placeholder="$t('common.enter') + 'value'"
            size="default"
            type="number"
            class="rule-value"
          )

        template(v-else)
          el-input(
            v-model="rule.value"
            :placeholder="$t('common.enter') + 'value'"
            size="default"
            class="rule-value"
          )

        //- Remove rule button
        el-button(
          text
          type="danger"
          size="small"
          @click="removeRule(index)"
          class="remove-rule-btn"
        )
          el-icon
            Delete

  .filter-empty(v-else)
    p.text-sm.text-muted No filter rules added. Click "Add Rule" to start filtering.

  .filter-actions
    el-button(size="default" @click="clearAll") {{ $t('common.reset') }}
    el-button(type="primary" size="default" @click="applyAll")
      span {{ $t('common.filter') }}
      span.filter-count(v-if="localFilters.length > 0") &nbsp;({{ localFilters.length }})
</template>

<script setup lang="ts">
import { Plus, Delete } from '@element-plus/icons-vue';
import type { SmartTableColumn, SmartTableFilter } from '~/composables/useSmartTable';

const props = defineProps({
  columns: {
    type: Array as PropType<SmartTableColumn[]>,
    required: true
  },
  filters: {
    type: Array as PropType<SmartTableFilter[]>,
    default: () => []
  }
});

const emit = defineEmits<{
  'apply-filters': [filters: SmartTableFilter[]];
  'clear-filters': [];
}>();

interface LocalFilter {
  field: string;
  operator: string;
  value: unknown;
  logic: 'AND' | 'OR';
}

const localFilters = ref<LocalFilter[]>([]);

// Initialize from prop
watch(
  () => props.filters,
  newFilters => {
    if (newFilters.length > 0 && localFilters.value.length === 0) {
      localFilters.value = newFilters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.operator === 'between' ? (Array.isArray(f.value) ? [...f.value] : ['', '']) : f.value,
        logic: f.logic || 'AND'
      }));
    }
  },
  { immediate: true }
);

const filterableColumns = computed(() => props.columns.filter(col => col.prop && col.label));

const operatorsByType: Record<string, Array<{ label: string; value: string }>> = {
  text: [
    { label: 'Equals', value: 'equals' },
    { label: 'Contains', value: 'contains' },
    { label: 'In', value: 'in' }
  ],
  number: [
    { label: 'Equals', value: 'equals' },
    { label: 'Greater than', value: 'gt' },
    { label: 'Less than', value: 'lt' },
    { label: 'Between', value: 'between' }
  ],
  date: [
    { label: 'Equals', value: 'equals' },
    { label: 'Greater than', value: 'gt' },
    { label: 'Less than', value: 'lt' },
    { label: 'Between', value: 'between' }
  ],
  select: [
    { label: 'Equals', value: 'equals' },
    { label: 'In', value: 'in' }
  ],
  image: [
    { label: 'Equals', value: 'equals' },
    { label: 'Contains', value: 'contains' }
  ]
};

const getFieldType = (fieldProp: string): string => {
  const col = props.columns.find(c => c.prop === fieldProp);
  return col?.type || 'text';
};

const getOperatorsForField = (fieldProp: string) => {
  const type = getFieldType(fieldProp);
  return operatorsByType[type] || operatorsByType.text;
};

const getSelectOptions = (fieldProp: string) => {
  const col = props.columns.find(c => c.prop === fieldProp);
  return col?.filters || [];
};

const onFieldChange = (index: number) => {
  const rule = localFilters.value[index];
  if (!rule) return;
  // Reset operator and value when field changes
  const ops = getOperatorsForField(rule.field);
  rule.operator = ops![0]?.value || 'equals';
  rule.value = rule.operator === 'between' ? ['', ''] : '';
};

const addRule = () => {
  const defaultField = filterableColumns.value[0]?.prop || '';
  localFilters.value.push({
    field: defaultField,
    operator: 'contains',
    value: '',
    logic: 'AND'
  });
};

const removeRule = (index: number) => {
  localFilters.value.splice(index, 1);
};

const clearAll = () => {
  localFilters.value = [];
  emit('clear-filters');
};

const applyAll = () => {
  const validFilters: SmartTableFilter[] = localFilters.value
    .filter(r => {
      if (!r.field || !r.operator) return false;
      if (r.operator === 'between') {
        return Array.isArray(r.value) && r.value[0] !== '' && r.value[1] !== '';
      }
      if (r.operator === 'in') {
        return Array.isArray(r.value) && r.value.length > 0;
      }
      return r.value !== '' && r.value !== null && r.value !== undefined;
    })
    .map(r => ({
      field: r.field,
      operator: r.operator as SmartTableFilter['operator'],
      value: r.value,
      logic: r.logic
    }));

  emit('apply-filters', validFilters);
};
</script>

<style lang="scss" scoped>
.filter-builder {
  padding: 16px;
  background: var(--bg-card, var(--glass-bg));
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 14px);
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.filter-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.filter-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-rule {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.logic-connector {
  display: flex;
  align-items: center;
  padding-left: 8px;
}

.rule-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rule-field {
  width: 160px;
  min-width: 140px;
}

.rule-operator {
  width: 140px;
  min-width: 120px;
}

.rule-value {
  flex: 1;
  min-width: 140px;
}

.rule-value-half {
  width: 100px;
  min-width: 80px;
}

.between-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.between-separator {
  color: var(--text-muted);
  font-weight: 600;
}

.remove-rule-btn {
  flex-shrink: 0;
}

.filter-empty {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
}

.filter-count {
  font-weight: 700;
}

.text-muted {
  color: var(--text-muted);
}
</style>
