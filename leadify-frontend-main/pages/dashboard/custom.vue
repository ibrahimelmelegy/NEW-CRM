<template lang="pug">
div
  //- Toolbar
  .flex.items-center.justify-between.mb-8
    .flex.items-center.gap-4
      NuxtLink(to="/dashboard")
        el-button(size="large" class="!rounded-2xl")
          Icon(name="ph:arrow-left-bold" size="16")
      div
        el-input(
          v-if="editingName"
          v-model="dashboardName"
          size="large"
          class="w-64"
          @blur="editingName = false"
          @keyup.enter="editingName = false"
          autofocus
        )
        h2.text-2xl.font-bold.cursor-pointer(
          v-else
          style="color: var(--text-primary)"
          @click="editingName = true"
        ) {{ dashboardName || $t('customDashboard.untitled') }}
    .flex.items-center.gap-3
      el-button(size="large" @click="showAddWidget = true" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('customDashboard.addWidget') }}
      el-button(size="large" type="primary" :loading="saving" @click="saveDashboard" class="!rounded-2xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
        Icon(name="ph:floppy-disk-bold" size="16")
        span.ml-1 {{ $t('common.save') }}

  //- Dashboard Select
  .flex.items-center.gap-3.mb-6(v-if="dashboards.length")
    el-select(v-model="selectedDashboardId" size="large" :placeholder="$t('customDashboard.selectDashboard')" class="w-64" @change="loadSelectedDashboard")
      el-option(v-for="d in dashboards" :key="d.id" :value="d.id" :label="d.name")
    el-button(v-if="selectedDashboardId" size="large" type="danger" plain @click="handleDelete" class="!rounded-2xl")
      Icon(name="ph:trash-bold" size="16")

  //- Widgets Grid
  .grid.grid-cols-1.gap-6(class="md:grid-cols-2 lg:grid-cols-3" v-if="widgets.length")
    .glass-card.p-6.animate-entrance.relative.group(
      v-for="(widget, idx) in widgets"
      :key="widget.id"
      :class="{ 'md:col-span-2': widget.width >= 8, 'lg:col-span-3': widget.width === 12 }"
    )
      //- Widget Header
      .flex.items-center.justify-between.mb-4
        h4.font-bold(style="color: var(--text-primary)") {{ widget.title }}
        .flex.items-center.gap-1.opacity-0.transition-opacity(class="group-hover:opacity-100")
          el-button(link size="small" @click="editWidget(idx)")
            Icon(name="ph:pencil-simple" size="14" style="color: var(--text-muted)")
          el-button(link size="small" @click="removeWidget(idx)")
            Icon(name="ph:x" size="14" class="text-red-400")

      //- Widget Content
      template(v-if="widget.type === 'stat'")
        .text-center
          p.text-4xl.font-bold(style="color: var(--accent-color, #7849ff)") {{ widget.data?.value ?? '--' }}
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ widget.data?.label || widget.config?.label || '' }}

      template(v-else-if="widget.type === 'chart'")
        ClientOnly
          VChart(v-if="widget.chartOption" :option="widget.chartOption" autoresize style="height: 260px")
        .text-center.py-8(v-if="!widget.chartOption")
          Icon(name="ph:chart-bar" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('customDashboard.noData') }}

      template(v-else-if="widget.type === 'table'")
        el-table(:data="widget.data?.rows || []" style="width: 100%" max-height="250" size="small")
          el-table-column(
            v-for="col in (widget.data?.columns || [])"
            :key="col.prop"
            :prop="col.prop"
            :label="col.label"
            min-width="100"
          )
        .text-center.py-6(v-if="!widget.data?.rows?.length")
          p.text-sm(style="color: var(--text-muted)") {{ $t('customDashboard.noData') }}

      template(v-else-if="widget.type === 'activity'")
        .space-y-2
          .flex.items-center.gap-3(v-for="item in (widget.data?.items || [])" :key="item.id")
            .w-2.h-2.rounded-full.bg-purple-500
            p.text-sm.truncate(style="color: var(--text-primary)") {{ item.description }}
            span.text-xs.shrink-0(style="color: var(--text-muted)") {{ item.time }}
        .text-center.py-6(v-if="!widget.data?.items?.length")
          p.text-sm(style="color: var(--text-muted)") {{ $t('customDashboard.noData') }}

      template(v-else)
        .text-center.py-8
          Icon(name="ph:squares-four" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('customDashboard.configureWidget') }}

  //- Empty State
  .glass-card.p-16.text-center.animate-entrance(v-else)
    Icon(name="ph:layout-bold" size="64" style="color: var(--text-muted)")
    h3.text-xl.font-bold.mt-4(style="color: var(--text-primary)") {{ $t('customDashboard.emptyTitle') }}
    p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('customDashboard.emptyDescription') }}
    el-button.mt-6(size="large" type="primary" @click="showAddWidget = true" class="!rounded-2xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
      Icon(name="ph:plus-bold" size="16")
      span.ml-1 {{ $t('customDashboard.addFirstWidget') }}

  //- Add/Edit Widget Dialog
  el-dialog(v-model="showAddWidget" :title="editingWidgetIdx >= 0 ? $t('customDashboard.editWidget') : $t('customDashboard.addWidget')" width="520px")
    .space-y-5
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('customDashboard.widgetTitle') }}
        el-input(v-model="widgetForm.title" :placeholder="$t('customDashboard.widgetTitlePlaceholder')")

      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('customDashboard.widgetType') }}
        el-select(v-model="widgetForm.type" class="w-full")
          el-option(value="stat" :label="$t('customDashboard.types.stat')")
          el-option(value="chart" :label="$t('customDashboard.types.chart')")
          el-option(value="table" :label="$t('customDashboard.types.table')")
          el-option(value="activity" :label="$t('customDashboard.types.activity')")
          el-option(value="pipeline" :label="$t('customDashboard.types.pipeline')")

      .form-group(v-if="widgetForm.type === 'chart'")
        label.block.text-sm.font-medium.mb-2 {{ $t('customDashboard.chartType') }}
        el-select(v-model="widgetForm.chartType" class="w-full")
          el-option(value="bar" :label="$t('reportBuilder.barChart')")
          el-option(value="pie" :label="$t('reportBuilder.pieChart')")
          el-option(value="line" :label="$t('reportBuilder.lineChart')")

      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('customDashboard.dataSource') }}
        el-select(v-model="widgetForm.dataSource" class="w-full")
          el-option(value="revenue" :label="$t('executiveDashboard.totalRevenue')")
          el-option(value="deals" :label="$t('navigation.deals')")
          el-option(value="leads" :label="$t('navigation.leads')")
          el-option(value="pipeline" :label="$t('executiveDashboard.salesPipeline')")
          el-option(value="tasks" :label="$t('executiveDashboard.pendingTasks')")
          el-option(value="activities" :label="$t('executiveDashboard.recentActivities')")

      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('customDashboard.widgetWidth') }}
        el-slider(v-model="widgetForm.width" :min="4" :max="12" :step="4" :marks="widthMarks")

    template(#footer)
      .flex.justify-end.gap-3
        el-button(@click="showAddWidget = false") {{ $t('common.cancel') }}
        el-button(type="primary" @click="confirmWidget" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ editingWidgetIdx >= 0 ? $t('common.update') : $t('common.add') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import {
  fetchDashboards,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  fetchWidgetData,
  type Dashboard,
  type DashboardWidget
} from '~/composables/useDashboard';
// Lazy-load heavy chart dependencies for faster initial page load
const VChart = defineAsyncComponent(() =>
  Promise.all([
    import('echarts/core'),
    import('echarts/renderers'),
    import('echarts/charts'),
    import('echarts/components'),
    import('vue-echarts')
  ]).then(
    ([
      { use },
      { CanvasRenderer },
      { BarChart, PieChart, LineChart },
      { TitleComponent, TooltipComponent, LegendComponent, GridComponent },
      VChartModule
    ]) => {
      return VChartModule;
    }
  )
);

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const widthMarks = computed(() => ({
  4: t('customDashboard.widthSmall'),
  8: t('customDashboard.widthMedium'),
  12: t('customDashboard.widthFull')
}));

interface WidgetView extends DashboardWidget {
  data?: unknown;
  chartOption?: unknown;
}

const dashboards = ref<Dashboard[]>([]);
const selectedDashboardId = ref<number | null>(null);
const dashboardName = ref('');
const editingName = ref(false);
const widgets = ref<WidgetView[]>([]);
const saving = ref(false);
const showAddWidget = ref(false);
const editingWidgetIdx = ref(-1);

const widgetForm = ref({
  title: '',
  type: 'stat' as DashboardWidget['type'],
  chartType: 'bar',
  dataSource: 'revenue',
  width: 4
});

// Load dashboards on mount
onMounted(async () => {
  dashboards.value = await fetchDashboards();
  if (dashboards.value.length) {
    selectedDashboardId.value = dashboards.value[0]!.id;
    loadSelectedDashboard();
  }
});

function loadSelectedDashboard() {
  const dash = dashboards.value.find(d => d.id === selectedDashboardId.value);
  if (dash) {
    dashboardName.value = dash.name;
    widgets.value = (dash.widgets || []).map(w => ({ ...w, data: null, chartOption: null }));
    widgets.value.forEach((w, i) => loadWidgetData(i));
  }
}

async function loadWidgetData(idx: number) {
  const widget = widgets.value[idx];
  if (!widget) return;
  try {
    const data = await fetchWidgetData(widget.config || {});
    if (data) {
      widget.data = data;
      if (widget.type === 'chart' && data) {
        widget.chartOption = buildChartOption(widget, data);
      }
    }
  } catch (e) {
    console.error('Widget data load failed:', e);
  }
}

function buildChartOption(widget: WidgetView, data: unknown) {
  const chartType = widget.config?.chartType || 'bar';
  const items = data.items || data.data || [];
  if (!items.length) return null;

  const labels = items.map(i => i.name || i.label || '');
  const values = items.map(i => i.value || i.count || 0);

  if (chartType === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      series: [{ type: 'pie', radius: '60%', data: labels.map((l: string, i: number) => ({ name: l, value: values[i] })) }]
    };
  }
  return {
    tooltip: { trigger: 'axis' },
    grid: { top: 20, right: 20, bottom: 20, left: 40, containLabel: true },
    xAxis: { type: 'category', data: labels, axisLabel: { color: '#94A3B8' } },
    yAxis: { type: 'value', axisLabel: { color: '#64748B' } },
    series: [{ type: chartType, data: values, itemStyle: { color: '#7849ff' } }]
  };
}

function editWidget(idx: number) {
  const w = widgets.value[idx]!;
  editingWidgetIdx.value = idx;
  widgetForm.value = {
    title: w.title,
    type: w.type,
    chartType: w.config?.chartType || 'bar',
    dataSource: w.config?.dataSource || 'revenue',
    width: w.width || 4
  };
  showAddWidget.value = true;
}

function removeWidget(idx: number) {
  widgets.value.splice(idx, 1);
}

function confirmWidget() {
  const newWidget: WidgetView = {
    id: editingWidgetIdx.value >= 0 ? widgets.value[editingWidgetIdx.value]!.id : `widget-${Date.now()}`,
    title: widgetForm.value.title || t('customDashboard.untitledWidget'),
    type: widgetForm.value.type,
    config: {
      chartType: widgetForm.value.chartType,
      dataSource: widgetForm.value.dataSource
    },
    width: widgetForm.value.width,
    height: 1,
    position: { x: 0, y: widgets.value.length },
    data: null,
    chartOption: null
  };

  if (editingWidgetIdx.value >= 0) {
    widgets.value[editingWidgetIdx.value] = newWidget;
    loadWidgetData(editingWidgetIdx.value);
  } else {
    widgets.value.push(newWidget);
    loadWidgetData(widgets.value.length - 1);
  }

  showAddWidget.value = false;
  editingWidgetIdx.value = -1;
  widgetForm.value = { title: '', type: 'stat', chartType: 'bar', dataSource: 'revenue', width: 4 };
}

async function saveDashboard() {
  saving.value = true;
  try {
    const payload: Partial<Dashboard> = {
      name: dashboardName.value || t('customDashboard.untitled'),
      widgets: widgets.value.map(({ data, chartOption, ...rest }) => rest)
    };

    if (selectedDashboardId.value) {
      await updateDashboard(selectedDashboardId.value, payload);
    } else {
      const res = await createDashboard(payload);
      if (res.success && res.body) {
        selectedDashboardId.value = (res.body as unknown).id;
        dashboards.value = await fetchDashboards();
      }
    }
    ElNotification({ type: 'success', title: t('common.saved'), message: '' });
  } catch (e: unknown) {
    ElNotification({ type: 'error', title: t('common.error'), message: e?.message || '' });
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!selectedDashboardId.value) return;
  try {
    await deleteDashboard(selectedDashboardId.value);
    dashboards.value = dashboards.value.filter(d => d.id !== selectedDashboardId.value);
    selectedDashboardId.value = null;
    dashboardName.value = '';
    widgets.value = [];
    ElNotification({ type: 'success', title: t('common.deleted'), message: '' });
  } catch (e: unknown) {
    ElNotification({ type: 'error', title: t('common.error'), message: e?.message || '' });
  }
}
</script>

<style lang="scss" scoped>
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
</style>
