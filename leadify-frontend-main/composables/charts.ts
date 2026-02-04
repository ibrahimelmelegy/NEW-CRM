import { graphic } from "echarts";

export function getPieChartsData(data: any, colorpallete: any, position = "0%", left = "center") {
  return {
    tooltip: {
      trigger: "item",
      formatter: "{b} : {c} ({d}%)",
    },
    legend: {
      orient: left === "center" ? "horizontal" : "vertical",
      top: position,
      left: left,
      textStyle: { color: '#94A3B8' }
    },
    color: colorpallete,
    series: [
      {
        type: "pie",
        radius: "60%",
        data: [...data],
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(124, 58, 237, 0.3)",
          },
        },
      },
    ],
  };
}

export function getBarChartData(data: any, colorpallete: any) {
  return {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.map((val: any) => val.name),
      axisLabel: { color: "#94A3B8" }
    },
    yAxis: { type: "value", splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: [
      {
        type: "bar",
        barWidth: "40%",
        data: data.map((val: any) => Number(val.value)),
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#7C3AED' },
            { offset: 1, color: '#6366F1' },
          ]),
          shadowBlur: 10,
          shadowColor: 'rgba(124, 58, 237, 0.4)',
        },
      },
    ],
  };
}

export function getBarHorizontalChartData(data: any, colorpallete: any) {
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c}" },
    xAxis: {
      type: "value",
      axisLabel: { color: "#94A3B8" },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
    },
    yAxis: {
      type: "category",
      data: data.map((val: any) => val.name),
      inverse: true,
      axisLabel: { color: "#94A3B8" }
    },
    series: [
      {
        type: "bar",
        data: data.map((val: any) => val.value),
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: new graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#A855F7' },
            { offset: 1, color: '#6366F1' },
          ]),
        },
      },
    ],
  };
}

export function getIncreaseLineChart(data: any, colorPalette: any) {
  return {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.map((val: any) => val.name),
      axisLabel: { color: "#94A3B8" }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#94A3B8" },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
    },
    series: [
      {
        type: "line",
        data: data.map((val: any) => val.value),
        smooth: true,
        symbolSize: 8,
        lineStyle: {
          width: 4,
          color: '#7C3AED',
          shadowBlur: 15,
          shadowColor: 'rgba(124, 58, 237, 0.5)',
          shadowOffsetY: 5
        },
        itemStyle: { color: '#7C3AED' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(124, 58, 237, 0.3)' },
            { offset: 1, color: 'rgba(124, 58, 237, 0)' },
          ]),
        },
      },
    ],
  };
}

// Helper Utilities are now provided by format.ts and utils.ts via Nuxt auto-imports

// Full restoration of data fetching logic with Premium types
export const statsLoading = ref(false);

export async function getLeadsStatics() {
  statsLoading.value = true;
  try {
    const { body, success } = await useApiFetch("insights/leads-sales");
    statsLoading.value = false;
    if (!success) return getDefaultLeadsStats();

    return {
      firstCards: [
        { name: "Total Leads Assigned", value: Number(body.leadCount) || 0 },
        { name: "Lead Conversion Rate", value: `${(body.leadConversionRate || 0).toFixed(2)}%` },
        { name: "Total Opportunities", value: Number(body.opportunityCount) || 0 },
      ],
      secondCards: [
        { name: "Total Deals Closed", value: formatLargeNumber(body.dealsCount || 0) },
        { name: "Revenue Won", value: `SAR ${formatLargeNumber(body.revenueFromDeals || 0)}` },
      ],
      opportunityStages: Object.entries(body.opportunityStages || {}).map(([name, value]) => ({ name: capitalizeName(name), value })),
      dealsPipeline: Object.entries(body.dealsPipeline || {}).map(([name, value]) => ({ name: capitalizeName(name), value })),
      salesPerformance: (body.salesPerformance || []).map((i: any) => ({ name: i.date, value: i.revenue })),
    };
  } catch (error) {
    statsLoading.value = false;
    return getDefaultLeadsStats();
  }
}

function getDefaultLeadsStats() {
  return { firstCards: [], secondCards: [], opportunityStages: [], dealsPipeline: [], salesPerformance: [] };
}

export async function getProjectOperationsStatics() {
  statsLoading.value = true;
  try {
    const { body, success } = await useApiFetch("insights/projects-operations");
    statsLoading.value = false;
    if (!success) return getDefaultProjectStats();

    return {
      firstCards: [
        { name: "Total Projects", value: formatLargeNumber(body.projectCount || 0) },
        { name: "Eitmad Projects Overview", value: formatLargeNumber(body.eitmadProjectsCount || 0) },
      ],
      pieChart_one: {
        title: "Assets Percentage",
        options: [
          { name: "Used Assets %", value: body.usedAssetPercentage?.toFixed(2) },
          { name: "Unused Assets %", value: (100 - body.usedAssetPercentage)?.toFixed(2) },
        ],
      },
      pieChart_two: {
        title: "Manpower Percentage",
        options: [
          { name: "Used Manpower %", value: body.usedManpowerPercentage?.toFixed(2) },
          { name: "Unused Manpower %", value: (100 - body.usedManpowerPercentage)?.toFixed(2) },
        ],
      },
      projectsByStatus: Object.entries(body.projectsByStatus || {}).map(([name, value]) => ({ name: formatSnakeCase(name), value })),
    };
  } catch (error) {
    statsLoading.value = false;
    return getDefaultProjectStats();
  }
}

function getDefaultProjectStats() {
  return { firstCards: [], projectsByStatus: [] };
}

export async function getBussinesStatics() {
  statsLoading.value = true;
  try {
    const { body, success } = await useApiFetch("insights/financial-business-metrics");
    statsLoading.value = false;
    if (!success) return { firstCards: [] };

    return {
      firstCards: [
        { name: "Total Deals Revenue", value: formatLargeNumber(body.revenueFromDeals || 0) },
        { name: "Outstanding Invoices", value: formatLargeNumber(body.outstandingInvoicesCount || 0) },
        { name: "Collected Payments", value: formatLargeNumber(body.collectedPaymentsCount || 0) },
      ],
    };
  } catch (error) {
    statsLoading.value = false;
    return { firstCards: [] };
  }
}

export async function getPerformanceStatics() {
  statsLoading.value = true;
  try {
    const { body, success } = await useApiFetch("insights/performance-hr");
    statsLoading.value = false;
    if (!success) return { firstCards: [] };

    return {
      firstCards: [
        { name: "Total Leads", value: formatLargeNumber(body.leadCount || 0) },
        { name: "Conv. Rate (Opp -> Deal)", value: `${body.percentageOfOpportunitiesBecameDeals?.toFixed(2)}%` },
        { name: "Total Deals Closed", value: formatLargeNumber(body.dealsCount || 0) },
      ],
    };
  } catch (error) {
    statsLoading.value = false;
    return { firstCards: [] };
  }
}
