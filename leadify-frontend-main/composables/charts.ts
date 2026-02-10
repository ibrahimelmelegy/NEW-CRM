import { graphic } from 'echarts';

const THEME = {
  purple: '#7849FF',
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F97316',
  glassTooltip: {
    backgroundColor: 'rgba(30, 30, 45, 0.85)',
    borderColor: 'rgba(120, 73, 255, 0.3)',
    borderWidth: 1,
    padding: [12, 16],
    textStyle: { color: '#fff' },
    extraCssText: 'backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-radius: 16px;'
  },
  axisLine: {
    lineStyle: { type: 'dashed' as const, color: 'rgba(255,255,255,0.05)' }
  }
};

export function getPieChartsData(data: any, colorpallete: any, position = '0%', left = 'center') {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b} : {c} ({d}%)',
      ...THEME.glassTooltip
    },
    legend: {
      orient: left === 'center' ? 'horizontal' : 'vertical',
      top: position,
      left,
      textStyle: { color: '#94A3B8' },
      itemWidth: 14,
      itemHeight: 14,
      icon: 'circle'
    },
    color: colorpallete,
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'transparent',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            color: '#fff',
            formatter: '{b}\n{d}%'
          },
          scale: true,
          scaleSize: 10,
          itemStyle: {
            shadowBlur: 0, // Sharp edges
            shadowColor: 'rgba(0,0,0,0.5)'
          }
        },
        data
      }
    ]
  };
}

export function getBarChartData(data: any, colorpallete: any) {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...THEME.glassTooltip },
    grid: { top: 20, right: 20, bottom: 20, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((val: any) => val.name),
      axisLabel: { color: '#94A3B8', fontWeight: 500 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: THEME.axisLine,
      axisLabel: { color: '#64748B' }
    },
    series: [
      {
        type: 'bar',
        barWidth: '30%',
        data: data.map((val: any) => Number(val.value)),
        itemStyle: {
          borderRadius: [6, 6, 6, 6], // Fully rounded
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: THEME.purple },
            { offset: 1, color: hexToRgba(THEME.purple, 0.3) }
          ]),
          shadowBlur: 0, // No blur
          shadowColor: 'transparent',
          shadowOffsetY: 0
        },
        emphasis: {
          itemStyle: {
            color: THEME.purple
          }
        }
      }
    ]
  };
}

// Fixed function to convert hex to rgba
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getBarHorizontalChartData(data: any, colorpallete: any) {
  return {
    tooltip: { trigger: 'item', ...THEME.glassTooltip },
    grid: { containLabel: true, bottom: 10, top: 10, right: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { show: false },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: data.map((val: any) => val.name),
      inverse: true,
      axisLabel: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: 500,
        margin: 15
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: data.map((val: any) => val.value),
        barWidth: 16,
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(255,255,255,0.03)',
          borderRadius: 8
        },
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: new graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#A855F7' },
            { offset: 1, color: '#7849FF' }
          ]),
          shadowBlur: 10,
          shadowColor: 'rgba(120, 73, 255, 0.3)'
        }
      }
    ]
  };
}

export function getConversionGauge(value: number) {
  const numValue = parseFloat(value.toString()) || 0;
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 5,
        radius: '90%',
        center: ['50%', '70%'],
        progress: {
          show: true,
          width: 12,
          itemStyle: {
            color: new graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#3B82F6' },
              { offset: 1, color: '#10B981' }
            ])
          }
        },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 12, color: [[1, 'rgba(255,255,255,0.05)']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, -10],
          fontSize: 32,
          fontWeight: 'bold',
          color: '#fff',
          formatter: '{value}%'
        },
        data: [{ value: numValue }]
      }
    ]
  };
}

export function getIncreaseLineChart(data: any, colorPalette: any) {
  return {
    tooltip: { trigger: 'axis', ...THEME.glassTooltip },
    grid: { top: 30, right: 30, bottom: 20, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((val: any) => val.name),
      axisLabel: { color: '#94A3B8' },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: THEME.axisLine,
      axisLabel: { color: '#64748B' }
    },
    series: [
      {
        type: 'line',
        data: data.map((val: any) => val.value),
        smooth: true, // Smooth curves for organic feel
        showSymbol: false,
        symbolSize: 10,
        lineStyle: {
          width: 4, // Sharp line
          color: THEME.green,
          shadowBlur: 0, // No blur
          shadowColor: 'transparent',
          shadowOffsetY: 0
        },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(THEME.green, 0.4) },
            { offset: 1, color: 'rgba(0,0,0,0)' }
          ])
        },
        emphasis: {
          showSymbol: true,
          itemStyle: {
            color: '#fff',
            borderColor: THEME.green,
            borderWidth: 3
          }
        }
      }
    ]
  };
}

// Helper Utilities are now provided by format.ts and utils.ts via Nuxt auto-imports

// Full restoration of data fetching logic with Premium types
export const statsLoading = ref(false);

export async function getLeadsStatics() {
  const { $i18n } = useNuxtApp();
  const t = $i18n.t;
  statsLoading.value = true;
  try {
    const { body, success } = await useApiFetch('insights/leads-sales');
    statsLoading.value = false;
    if (!success) return getDefaultLeadsStats();

    return {
      firstCards: [
        { name: 'Total Leads Assigned', value: Number(body.leadCount) || 0 },
        { name: 'Lead Conversion Rate', value: `${(body.leadConversionRate || 0).toFixed(2)}%` },
        { name: 'Total Opportunities', value: Number(body.opportunityCount) || 0 }
      ],
      secondCards: [
        { name: 'Total Deals Closed', value: formatLargeNumber(body.dealsCount || 0) },
        { name: 'Revenue Won', value: `SAR ${formatLargeNumber(body.revenueFromDeals || 0)}` }
      ],
      opportunityStages: Object.entries(body.opportunityStages || {}).map(([name, value]) => ({
        name:
          t(`crm.stages.${name.toLowerCase()}`) !== `crm.stages.${name.toLowerCase()}` ? t(`crm.stages.${name.toLowerCase()}`) : capitalizeName(name),
        value
      })),
      dealsPipeline: Object.entries(body.dealsPipeline || {}).map(([name, value]) => ({
        name:
          t(`crm.pipeline.${name.toLowerCase()}`) !== `crm.pipeline.${name.toLowerCase()}`
            ? t(`crm.pipeline.${name.toLowerCase()}`)
            : capitalizeName(name),
        value
      })),
      salesPerformance: (body.salesPerformance || []).map((i: any) => ({ name: i.date, value: i.revenue }))
    };
  } catch (error: any) {
    statsLoading.value = false;
    ElNotification.error({ title: 'Dashboard Error', message: error?.message || 'Failed to load Leads stats' });
    return getDefaultLeadsStats();
  }
}

function getDefaultLeadsStats() {
  return { firstCards: [], secondCards: [], opportunityStages: [], dealsPipeline: [], salesPerformance: [] };
}

export async function getProjectOperationsStatics() {
  const { $i18n } = useNuxtApp();
  const t = $i18n.t;
  statsLoading.value = true;
  try {
    const { body, success } = await useApiFetch('insights/projects-operations');
    statsLoading.value = false;
    if (!success) return getDefaultProjectStats();

    return {
      firstCards: [
        { name: 'Total Projects', value: formatLargeNumber(body.projectCount || 0) },
        { name: 'Eitmad Projects Overview', value: formatLargeNumber(body.eitmadProjectsCount || 0) }
      ],
      pieChart_one: {
        title: t('dashboard.widgets.assetsPercentage'),
        options: [
          { name: t('dashboard.widgets.usedAssets'), value: body.usedAssetPercentage?.toFixed(2) },
          { name: t('dashboard.widgets.unusedAssets'), value: (100 - body.usedAssetPercentage)?.toFixed(2) }
        ]
      },
      pieChart_two: {
        title: t('dashboard.widgets.manpowerPercentage'),
        options: [
          { name: t('dashboard.widgets.usedManpower'), value: body.usedManpowerPercentage?.toFixed(2) },
          { name: t('dashboard.widgets.unusedManpower'), value: (100 - body.usedManpowerPercentage)?.toFixed(2) }
        ]
      },
      projectsByStatus: Object.entries(body.projectsByStatus || {}).map(([name, value]) => ({
        name:
          t(`crm.projectStatus.${name.toLowerCase()}`) !== `crm.projectStatus.${name.toLowerCase()}`
            ? t(`crm.projectStatus.${name.toLowerCase()}`)
            : formatSnakeCase(name),
        value
      }))
    };
  } catch (error: any) {
    statsLoading.value = false;
    ElNotification.error({ title: 'Dashboard Error', message: error?.message || 'Failed to load Project stats' });
    return getDefaultProjectStats();
  }
}

function getDefaultProjectStats() {
  return { firstCards: [], projectsByStatus: [] };
}

export async function getBussinesStatics() {
  statsLoading.value = true;
  try {
    const { body, success } = await useApiFetch('insights/financial-business-metrics');
    statsLoading.value = false;
    if (!success) return { firstCards: [] };

    return {
      firstCards: [
        { name: 'Total Deals Revenue', value: formatLargeNumber(body.revenueFromDeals || 0) },
        { name: 'Outstanding Invoices', value: formatLargeNumber(body.outstandingInvoicesCount || 0) },
        { name: 'Collected Payments', value: formatLargeNumber(body.collectedPaymentsCount || 0) }
      ]
    };
  } catch (error: any) {
    statsLoading.value = false;
    ElNotification.error({ title: 'Dashboard Error', message: error?.message || 'Failed to load Business stats' });
    return { firstCards: [] };
  }
}

export async function getPerformanceStatics() {
  statsLoading.value = true;
  try {
    const { body, success } = await useApiFetch('insights/performance-hr');
    statsLoading.value = false;
    if (!success) return { firstCards: [] };

    return {
      firstCards: [
        { name: 'Total Leads', value: formatLargeNumber(body.leadCount || 0) },
        { name: 'Conv. Rate (Opp -> Deal)', value: `${body.percentageOfOpportunitiesBecameDeals?.toFixed(2)}%` },
        { name: 'Total Deals Closed', value: formatLargeNumber(body.dealsCount || 0) }
      ]
    };
  } catch (error: any) {
    statsLoading.value = false;
    ElNotification.error({ title: 'Dashboard Error', message: error?.message || 'Failed to load Performance stats' });
    return { firstCards: [] };
  }
}

export function getBarChartWithLineData(data: any, legend: string[], colorpallete: any) {
  if (!data) return {};
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, ...THEME.glassTooltip },
    legend: { data: legend, textStyle: { color: '#94A3B8' }, bottom: 0 },
    grid: { top: 40, right: 40, bottom: 40, left: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((val: any) => val.name),
      axisLabel: { color: '#94A3B8' },
      axisLine: { show: false }
    },
    yAxis: [
      { type: 'value', splitLine: THEME.axisLine, axisLabel: { color: '#64748B' } },
      { type: 'value', splitLine: { show: false }, axisLabel: { color: '#64748B' } }
    ],
    series: [
      {
        name: legend[0],
        type: 'bar',
        barWidth: '20%',
        data: data.map((val: any) => val.value),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: colorpallete[0] || THEME.purple
        }
      },
      {
        name: legend[1],
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: data.map((val: any) => val.totalPaid || 0),
        lineStyle: { width: 3, color: THEME.green },
        itemStyle: { color: THEME.green }
      }
    ]
  };
}

export function getCenterPieChartsData(data: any, colorpallete: any, title = '') {
  return {
    tooltip: {
      trigger: 'item',
      ...THEME.glassTooltip
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      textStyle: { color: '#94A3B8' }
    },
    title: {
      text: title,
      left: 'center',
      top: 'center',
      textStyle: { color: '#fff', fontSize: 16 }
    },
    color: colorpallete,
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: 'transparent',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data
      }
    ]
  };
}
