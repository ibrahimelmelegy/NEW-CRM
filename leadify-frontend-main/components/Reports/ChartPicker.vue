<template lang="pug">
.chart-picker

  //- Chart type thumbnails
  .chart-types.grid.grid-cols-4.gap-3.mb-6
    .chart-type-card.text-center.p-3.rounded-xl.cursor-pointer(
      v-for="chart in chartTypes"
      :key="chart.value"
      :class="{ 'chart-selected': modelValue === chart.value }"
      @click="selectChartType(chart.value)"
      style="background: var(--bg-input); border: 2px solid transparent; transition: all 0.2s"
    )
      .chart-icon.mx-auto.mb-2.flex.items-center.justify-center(
        style="width: 40px; height: 40px; border-radius: 10px"
        :style="{ background: modelValue === chart.value ? 'rgba(120, 73, 255, 0.15)' : 'rgba(120, 73, 255, 0.05)' }"
      )
        Icon(:name="chart.icon" size="20" :style="{ color: modelValue === chart.value ? '#7849ff' : 'var(--text-muted)' }" aria-hidden="true")
      .text-xs.font-medium(:style="{ color: modelValue === chart.value ? '#7849ff' : 'var(--text-secondary)' }") {{ chart.label }}

  //- Chart configuration options (shown when a chart type is selected)
  transition(name="fade")
    .chart-config.space-y-4(v-if="modelValue && modelValue !== 'table'")
      .grid.grid-cols-2.gap-4

        //- X-Axis field
        .form-group
          label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('reportBuilder.xAxis') }}
          el-select(
            :model-value="configValue.xAxis"
            @update:model-value="updateConfig('xAxis', $event)"
            size="default"
            class="w-full"
            :placeholder="$t('reportBuilder.selectField')"
            clearable
          )
            el-option(
              v-for="f in fields"
              :key="f.name"
              :value="f.name"
              :label="f.label"
            )

        //- Y-Axis field
        .form-group
          label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('reportBuilder.yAxis') }}
          el-select(
            :model-value="configValue.yAxis"
            @update:model-value="updateConfig('yAxis', $event)"
            size="default"
            class="w-full"
            :placeholder="$t('reportBuilder.selectField')"
            clearable
          )
            el-option(value="count" :label="$t('chartPicker.count')")
            el-option(
              v-for="f in numericFields"
              :key="f.name"
              :value="f.name"
              :label="f.label"
            )

      //- Color scheme
      .form-group
        label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('reportBuilder.colorScheme') }}
        .flex.gap-2
          .color-scheme.cursor-pointer.rounded-lg.p-2.flex.gap-1(
            v-for="(colors, name) in colorSchemes"
            :key="name"
            :class="{ 'scheme-selected': configValue.colorScheme === name }"
            @click="updateConfig('colorScheme', name)"
            style="border: 2px solid transparent; transition: all 0.2s"
          )
            .color-dot(
              v-for="(c, i) in colors.slice(0, 4)"
              :key="i"
              :style="{ background: c }"
              style="width: 12px; height: 12px; border-radius: 50%"
            )

      //- Toggles
      .flex.gap-6
        el-checkbox(
          :model-value="configValue.showLegend"
          @update:model-value="updateConfig('showLegend', $event)"
        ) {{ $t('reportBuilder.showLegend') }}

        el-checkbox(
          :model-value="configValue.showValues"
          @update:model-value="updateConfig('showValues', $event)"
        ) {{ $t('reportBuilder.showValues') }}

        el-checkbox(
          v-if="modelValue === 'bar' || modelValue === 'stacked'"
          :model-value="configValue.stacked"
          @update:model-value="updateConfig('stacked', $event)"
        ) {{ $t('reportBuilder.stacked') }}
</template>

<script setup lang="ts">
import { CHART_COLOR_SCHEMES, type FieldDefinition, type ChartConfig } from '~/composables/useReportBuilderPro';

interface Props {
  modelValue: string;
  config: ChartConfig;
  fields: FieldDefinition[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:config': [config: ChartConfig];
}>();

const chartTypes = [
  { value: 'table', label: 'Table Only', icon: 'ph:table' },
  { value: 'bar', label: 'Bar Chart', icon: 'ph:chart-bar' },
  { value: 'line', label: 'Line Chart', icon: 'ph:chart-line-up' },
  { value: 'pie', label: 'Pie Chart', icon: 'ph:chart-pie-slice' },
  { value: 'donut', label: 'Donut Chart', icon: 'ph:chart-donut' },
  { value: 'area', label: 'Area Chart', icon: 'ph:chart-line' },
  { value: 'stacked', label: 'Stacked Bar', icon: 'ph:chart-bar-horizontal' }
];

const colorSchemes = CHART_COLOR_SCHEMES;

const configValue = computed(() => ({
  xAxis: props.config.xAxis || '',
  yAxis: props.config.yAxis || '',
  colorScheme: props.config.colorScheme || 'purple',
  stacked: props.config.stacked || false,
  showLegend: props.config.showLegend !== false,
  showValues: props.config.showValues || false
}));

const numericFields = computed(() => {
  return props.fields.filter(f => f.type === 'number');
});

function selectChartType(type: string) {
  if (type === props.modelValue) {
    emit('update:modelValue', '');
  } else {
    emit('update:modelValue', type);
  }
}

function updateConfig(key: string, value: any) {
  emit('update:config', {
    ...configValue.value,
    [key]: value
  });
}
</script>

<style lang="scss" scoped>
.chart-type-card:hover {
  border-color: rgba(120, 73, 255, 0.3) !important;
}

.chart-type-card.chart-selected {
  border-color: #7849ff !important;
  background: rgba(120, 73, 255, 0.08) !important;
}

.color-scheme:hover {
  border-color: rgba(120, 73, 255, 0.3) !important;
  background: var(--bg-input);
}

.color-scheme.scheme-selected {
  border-color: #7849ff !important;
  background: rgba(120, 73, 255, 0.08);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
