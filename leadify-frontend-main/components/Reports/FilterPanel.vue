<template lang="pug">
.filter-panel

  //- Active filter tags
  .active-filters.flex.flex-wrap.gap-2.mb-4(v-if="modelValue.length")
    el-tag(
      v-for="(filter, i) in modelValue"
      :key="i"
      closable
      effect="dark"
      size="default"
      type=""
      @close="removeFilter(i)"
      style="background: rgba(120, 73, 255, 0.15); border-color: rgba(120, 73, 255, 0.3); color: #7849ff"
    )
      span {{ getFieldLabel(filter.field) }}
      span.mx-1.font-bold {{ getOperatorLabel(filter.operator, filter.fieldType) }}
      span.font-medium {{ formatFilterValue(filter) }}

    el-button(
      size="small"
      text
      type="danger"
      @click="clearAll"
    )
      Icon(name="ph:trash" size="14" aria-hidden="true")
      span.ml-1 {{ $t('reportBuilder.clearAll') }}

  //- Logic toggle
  .flex.items-center.gap-3.mb-4(v-if="modelValue.length > 1")
    span.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('reportBuilder.filterLogic') }}
    el-radio-group(v-model="logicMode" size="small")
      el-radio-button(value="AND") AND
      el-radio-button(value="OR") OR

  //- Filter rule cards
  .filter-rules.space-y-3
    .filter-rule.glass-card.p-4.rounded-xl(
      v-for="(filter, i) in modelValue"
      :key="'rule-' + i"
    )
      .flex.items-start.gap-3
        //- Field selector
        .flex-1
          label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('reportBuilder.field') }}
          el-select(
            :model-value="filter.field"
            @update:model-value="updateFilterField(i, $event)"
            size="default"
            class="w-full"
            :placeholder="$t('reportBuilder.selectField')"
            filterable
          )
            el-option-group(
              v-for="mod in moduleOptions"
              :key="mod.key"
              :label="mod.label"
            )
              el-option(
                v-for="f in mod.fields"
                :key="f.name"
                :value="f.name"
                :label="f.label"
              )
                .flex.items-center.gap-2
                  Icon(:name="f.icon" size="14" aria-hidden="true")
                  span {{ f.label }}

        //- Operator selector
        .flex-1
          label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('reportBuilder.operator') }}
          el-select(
            :model-value="filter.operator"
            @update:model-value="updateFilterProp(i, 'operator', $event)"
            size="default"
            class="w-full"
          )
            el-option(
              v-for="op in getOperatorsForField(filter.field)"
              :key="op.value"
              :value="op.value"
              :label="op.label"
            )

        //- Value input (varies by type and operator)
        .flex-1
          label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('reportBuilder.value') }}
          template(v-if="!isNoValueOperator(filter.operator)")
            //- Select field type - dropdown value
            el-select(
              v-if="getFieldType(filter.field) === 'select'"
              :model-value="filter.value"
              @update:model-value="updateFilterProp(i, 'value', $event)"
              size="default"
              class="w-full"
              :multiple="filter.operator === 'in' || filter.operator === 'not_in'"
              :placeholder="$t('reportBuilder.selectValue')"
            )
              el-option(
                v-for="opt in getFieldOptions(filter.field)"
                :key="opt"
                :value="opt"
                :label="opt"
              )

            //- Date field type
            template(v-else-if="getFieldType(filter.field) === 'date'")
              el-date-picker(
                v-if="filter.operator === 'between'"
                :model-value="filter.value"
                @update:model-value="updateFilterProp(i, 'value', $event)"
                type="daterange"
                size="default"
                class="w-full"
                start-placeholder="Start"
                end-placeholder="End"
                value-format="YYYY-MM-DD"
              )
              el-date-picker(
                v-else
                :model-value="filter.value"
                @update:model-value="updateFilterProp(i, 'value', $event)"
                type="date"
                size="default"
                class="w-full"
                value-format="YYYY-MM-DD"
                :placeholder="$t('reportBuilder.selectDate')"
              )

            //- Number field type
            template(v-else-if="getFieldType(filter.field) === 'number'")
              .flex.gap-2(v-if="filter.operator === 'between'")
                el-input-number(
                  :model-value="Array.isArray(filter.value) ? filter.value[0] : ''"
                  @update:model-value="updateBetweenValue(i, 0, $event)"
                  size="default"
                  controls-position="right"
                  placeholder="Min"
                  class="flex-1"
                )
                el-input-number(
                  :model-value="Array.isArray(filter.value) ? filter.value[1] : ''"
                  @update:model-value="updateBetweenValue(i, 1, $event)"
                  size="default"
                  controls-position="right"
                  placeholder="Max"
                  class="flex-1"
                )
              el-input-number(
                v-else
                :model-value="filter.value"
                @update:model-value="updateFilterProp(i, 'value', $event)"
                size="default"
                controls-position="right"
                class="w-full"
              )

            //- Text field type (default)
            el-input(
              v-else
              :model-value="filter.value"
              @update:model-value="updateFilterProp(i, 'value', $event)"
              size="default"
              :placeholder="$t('reportBuilder.enterValue')"
            )

          //- No value needed
          .text-sm.py-2.italic(v-else style="color: var(--text-muted)") {{ $t('reportBuilder.noValueNeeded') }}

        //- Remove button
        .pt-5
          el-button(
            link
            size="small"
            @click="removeFilter(i)"
          )
            Icon(name="ph:x-circle" size="18" class="text-red-400" aria-label="Remove filter")

  //- Add filter button
  .mt-4
    el-button(
      size="default"
      @click="addFilter"
      class="w-full"
      style="border-style: dashed"
    )
      Icon(name="ph:plus" size="16" aria-hidden="true")
      span.ml-2 {{ $t('reportBuilder.addFilter') }}
</template>

<script setup lang="ts">
import {
  MODULE_DEFINITIONS,
  FILTER_OPERATORS_BY_TYPE,
  type ReportFilter,
  type FieldDefinition
} from '~/composables/useReportBuilderPro';

interface Props {
  modelValue: ReportFilter[];
  activeModule: string;
  logic?: 'AND' | 'OR';
}

const props = withDefaults(defineProps<Props>(), {
  logic: 'AND'
});

const emit = defineEmits<{
  'update:modelValue': [filters: ReportFilter[]];
  'update:logic': [logic: 'AND' | 'OR'];
}>();

const logicMode = computed({
  get: () => props.logic,
  set: (val) => emit('update:logic', val)
});

const moduleOptions = computed(() => {
  return Object.values(MODULE_DEFINITIONS);
});

function getAllFields(): FieldDefinition[] {
  return Object.values(MODULE_DEFINITIONS).flatMap(m => m.fields);
}

function getFieldDef(fieldName: string): FieldDefinition | undefined {
  return getAllFields().find(f => f.name === fieldName);
}

function getFieldLabel(fieldName: string): string {
  const fd = getFieldDef(fieldName);
  return fd?.label || fieldName;
}

function getFieldType(fieldName: string): string {
  const fd = getFieldDef(fieldName);
  return fd?.type || 'text';
}

function getFieldOptions(fieldName: string): string[] {
  const fd = getFieldDef(fieldName);
  return fd?.options || [];
}

function getOperatorsForField(fieldName: string): { value: string; label: string }[] {
  const type = getFieldType(fieldName);
  return FILTER_OPERATORS_BY_TYPE[type] ?? FILTER_OPERATORS_BY_TYPE.text ?? [];
}

function getOperatorLabel(operator: string, fieldType?: string): string {
  const type = fieldType || 'text';
  const ops = FILTER_OPERATORS_BY_TYPE[type] ?? FILTER_OPERATORS_BY_TYPE.text ?? [];
  const op = ops.find((o: { value: string; label: string }) => o.value === operator);
  return op?.label || operator;
}

function isNoValueOperator(operator: string): boolean {
  return operator === 'is_null' || operator === 'is_not_null';
}

function formatFilterValue(filter: ReportFilter): string {
  if (isNoValueOperator(filter.operator)) return '';
  if (Array.isArray(filter.value)) {
    return (filter.value as any[]).join(' - ');
  }
  return String(filter.value ?? '');
}

function addFilter() {
  const fields = MODULE_DEFINITIONS[props.activeModule]?.fields || [];
  const firstField = fields[0];
  const newFilter: ReportFilter = {
    field: firstField?.name || '',
    operator: 'equals',
    value: '',
    fieldType: firstField?.type || 'text'
  };
  emit('update:modelValue', [...props.modelValue, newFilter]);
}

function removeFilter(index: number) {
  const updated = [...props.modelValue];
  updated.splice(index, 1);
  emit('update:modelValue', updated);
}

function clearAll() {
  emit('update:modelValue', []);
}

function updateFilterField(index: number, fieldName: string) {
  const updated = [...props.modelValue];
  const fieldType = getFieldType(fieldName);
  const operators = FILTER_OPERATORS_BY_TYPE[fieldType] ?? FILTER_OPERATORS_BY_TYPE.text ?? [];
  updated[index] = {
    ...updated[index]!,
    field: fieldName,
    fieldType,
    operator: operators[0]?.value || 'equals',
    value: ''
  };
  emit('update:modelValue', updated);
}

function updateFilterProp(index: number, prop: string, value: any) {
  const updated = [...props.modelValue];
  updated[index] = { ...updated[index]!, [prop]: value };
  emit('update:modelValue', updated);
}

function updateBetweenValue(index: number, pos: number, value: any) {
  const updated = [...props.modelValue];
  const currentVal = updated[index]!.value;
  const current: any[] = Array.isArray(currentVal) ? [...currentVal] : ['', ''];
  current[pos] = value;
  updated[index] = { ...updated[index]!, value: current };
  emit('update:modelValue', updated);
}
</script>

<style lang="scss" scoped>
.filter-rule {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border-color);
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(120, 73, 255, 0.3);
  }
}
</style>
