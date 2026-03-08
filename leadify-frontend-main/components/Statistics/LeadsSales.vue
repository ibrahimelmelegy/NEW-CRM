<template lang="pug">
.leads-sales.chromatic-dashboard(v-if="!loading")
  .header.mb-8.flex.justify-between.items-center
    div
        h2(class="text-2xl font-bold text-primary mb-2") {{ $t('dashboard.leadsSales') }}
        p.text-muted {{ isLocked ? $t('dashboard.layoutLocked') : $t('dashboard.dragDropHint') }}
    .flex.items-center.gap-4
        el-button(@click="showWidgetManager = true" size="small" type="primary" plain) 
            Icon(name="ph:layout-bold" size="18" class="mr-1")
            | {{ $t('dashboard.manageWidgets') }}
        el-switch(v-model="isLocked" :active-text="$t('dashboard.lockLayout')" :inactive-text="$t('dashboard.editMode')" @change="saveLayout")
        el-button(@click="resetLayout" size="small" type="danger" plain) {{ $t('dashboard.resetDefault') }}

  //- Widget Manager Dialog
  el-dialog(v-model="showWidgetManager" :title="$t('dashboard.widgetsDialog')" width="400" class="glass-dialog")
    .grid.gap-4
        .flex.items-center.justify-between(v-for="w in widgets" :key="w.id")
            .flex.items-center.gap-2
                Icon(:name="w.icon || 'ph:chart-bar-bold'" size="20" class="text-neutral-500")
                span.text-sm {{ $t(w.name) }}
            el-checkbox(v-model="w.visible" @change="saveLayout")

  draggable.grid.grid-cols-12.gap-6(
    v-model="widgets" 
    item-key="id"
    :disabled="isLocked"
    handle=".drag-handle"
    :animation="200"
    @end="saveLayout"
  )
    template(#item="{ element }")
        //- Widget Container with Dynamic Span
        .glass-container.rounded-3xl.relative(
            :class="[element.span, 'group']"
            v-show="element.visible !== false"
        )
            //- Drag Handle
            .drag-handle.absolute.top-2.right-2.cursor-move.opacity-0.group-hover_opacity-100.z-10.p-2.bg-white.bg-opacity-20.rounded-lg.backdrop-blur-sm
                Icon(name="ph:dots-six-vertical-bold" size="20" class="text-neutral-500")

            //- 1. Metric Card Widget
            StatisticsCard.h-full(
                v-if="element.type === 'metric'"
                :name="$t(element.name)" 
                :data="getMetricValue(element.dataKey)" 
                :icon="element.icon" 
                :colorType="element.color"
            )

            //- 2. Chart Widget
            el-card.h-full.border-0.shadow-none(v-else class="!bg-transparent !border-0")
                template(#header)
                    .flex.items-center.gap-2
                        .w-2.h-6.rounded-full(:class="`bg-${element.accentColor}`")
                        h3(class="text-lg font-semibold text-primary") {{ $t(element.name) }}
                
                div(:class="element.heightClass")
                    v-chart.w-full.h-full(
                        :option="getChartOption(element.chartType)" 
                        autoresize
                        @click="onChartClick"
                    )

</template>

<script lang="ts" setup>
import VChart from 'vue-echarts';
import draggable from 'vuedraggable';
import { ElNotification } from 'element-plus';
import { getLeadsStatics, getBarChartData, getPieChartsData, getIncreaseLineChart, getConversionGauge } from '@/composables/charts';
import { useSocket } from '@/composables/useSocket';

const { t } = useI18n();
const router = useRouter();
const isLocked = ref(true); // Default to locked
const showWidgetManager = ref(false);
const vibrantPalette = ['#F59E0B', '#10B981', '#F97316', '#0EA5E9', '#6366F1', '#F43F5E'];

// Data Fetching
const loading = ref(true);
const leadStats = ref();

const { socket } = useSocket();

const onLeadCreated = async () => {
  leadStats.value = await getLeadsStatics();
  ElNotification.info(t('dashboard.newLead'));
};
const onLeadUpdated = async () => {
  leadStats.value = await getLeadsStatics();
};

onMounted(async () => {
  try {
    leadStats.value = await getLeadsStatics();
    loadLayout();

    // WebSocket Listeners
    if (socket.value) {
      socket.value.on('lead:created', onLeadCreated);
      socket.value.on('lead:updated', onLeadUpdated);
    }
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  // Clean up socket listeners to prevent updates after unmount
  if (socket.value) {
    socket.value.off('lead:created', onLeadCreated);
    socket.value.off('lead:updated', onLeadUpdated);
  }
});

// Professional Default Widget Config
const defaultWidgets = [
  // Top Row: Core Metrics
  {
    id: 'w1',
    type: 'metric',
    name: 'dashboard.widgets.totalLeads',
    dataKey: 'leads',
    icon: 'ph:user-list-bold',
    color: 'indigo',
    span: 'col-span-12 md:col-span-3',
    visible: true
  },
  {
    id: 'w3',
    type: 'metric',
    name: 'dashboard.widgets.totalOpportunities',
    dataKey: 'opportunities',
    icon: 'ph:sparkle-bold',
    color: 'amber',
    span: 'col-span-12 md:col-span-3',
    visible: true
  },
  {
    id: 'w5',
    type: 'metric',
    name: 'dashboard.widgets.totalDeals',
    dataKey: 'deals',
    icon: 'ph:handshake-bold',
    color: 'emerald',
    span: 'col-span-12 md:col-span-3',
    visible: true
  },
  {
    id: 'w6',
    type: 'metric',
    name: 'dashboard.widgets.revenue',
    dataKey: 'revenue',
    icon: 'ph:coins-bold',
    color: 'rose',
    span: 'col-span-12 md:col-span-3',
    visible: true
  },

  // Middle Row: Performance & Conversion
  {
    id: 'w8',
    type: 'chart',
    chartType: 'line',
    name: 'dashboard.widgets.salesPerformance',
    accentColor: 'accent-rose',
    heightClass: 'h-[400px]',
    span: 'col-span-12 md:col-span-8',
    visible: true
  },
  {
    id: 'w2',
    type: 'chart',
    chartType: 'gauge',
    name: 'dashboard.widgets.leadConversion',
    accentColor: 'accent-cyan',
    heightClass: 'h-[400px]',
    span: 'col-span-12 md:col-span-4',
    visible: true
  },

  // Bottom Row: Pipeline Breakdown
  {
    id: 'w4',
    type: 'chart',
    chartType: 'bar',
    name: 'dashboard.widgets.dealsPipeline',
    accentColor: 'accent-indigo',
    heightClass: 'h-[400px]',
    span: 'col-span-12 md:col-span-7',
    visible: true
  },
  {
    id: 'w7',
    type: 'chart',
    chartType: 'pie',
    name: 'dashboard.widgets.opportunitiesStage',
    accentColor: 'accent-cyan',
    heightClass: 'h-[400px]',
    span: 'col-span-12 md:col-span-5',
    visible: true
  }
];

const widgets = ref([...defaultWidgets]);

// Helpers
const getMetricValue = (key: string) => {
  if (!leadStats.value || !leadStats.value.firstCards || leadStats.value.firstCards.length === 0) return 0;
  try {
    const map: unknown = {
      leads: leadStats.value.firstCards[0]?.value ?? 0,
      conversion: leadStats.value.firstCards[1]?.value ?? 0,
      opportunities: leadStats.value.firstCards[2]?.value ?? 0,
      deals: leadStats.value.secondCards?.[0]?.value ?? 0,
      revenue: leadStats.value.secondCards?.[1]?.value ?? 0
    };
    return map[key];
  } catch (e) {
    return 0;
  }
};

const getChartOption = (type: string) => {
  if (!leadStats.value) return {};
  if (type === 'bar') return getBarChartData(leadStats.value.dealsPipeline, vibrantPalette);
  if (type === 'pie') return getPieChartsData(leadStats.value.opportunityStages, vibrantPalette);
  if (type === 'line') return getIncreaseLineChart(leadStats.value.salesPerformance, vibrantPalette);
  if (type === 'gauge') return getConversionGauge(leadStats.value.firstCards[1]?.value || 0);
  return {};
};

const onChartClick = (params: unknown) => {
  // Drill-down logic
  if (params.seriesType === 'pie') {
    const stage = params.name.toLowerCase();
    router.push({ path: '/sales/opportunity', query: { stage } });
  } else if (params.seriesType === 'bar') {
    const status = params.name.toLowerCase();
    router.push({ path: '/sales/deals', query: { status } });
  }
};

const saveLayout = () => {
  localStorage.setItem('dashboard-layout-leads-v4-i18n', JSON.stringify(widgets.value));
  ElNotification.success(t('dashboard.layoutSaved'));
};

const loadLayout = () => {
  const saved = localStorage.getItem('dashboard-layout-leads-v4-i18n');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Merge saved layout with default widgets to ensure new widgets are added
    const merged = [...defaultWidgets].map(dw => {
      const sw = parsed.find(p => p.id === dw.id);
      if (sw) {
        return { ...dw, ...sw, visible: sw.visible === undefined ? true : sw.visible };
      }
      return dw;
    });
    widgets.value = merged;
  }
};

const resetLayout = () => {
  // Deep clone default widgets to avoid reference issues
  const freshWidgets = JSON.parse(JSON.stringify(defaultWidgets));
  widgets.value = freshWidgets;
  localStorage.setItem('dashboard-layout-leads-v4-i18n', JSON.stringify(freshWidgets));

  ElNotification.success({
    title: t('dashboard.layoutReset'),
    message: t('dashboard.restoring'),
    duration: 2000
  });

  // Force a small delay then reload to ensure all ECharts instances re-init with new spans
  setTimeout(() => {
    window.location.reload();
  }, 500);
};
</script>

<style lang="scss" scoped>
.chromatic-dashboard {
  padding: 10px;
}

.glass-container {
  @include glass-card;
  overflow: hidden;

  // Hover effect for drag handle visibility
  &:hover .drag-handle {
    opacity: 1;
  }
}
</style>
