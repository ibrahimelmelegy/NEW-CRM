<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('roiCalculator.title')" :subtitle="$t('roiCalculator.subtitle')")
    template(#actions)
      .flex.gap-2
        el-button(size="large" @click="resetForm")
          Icon(name="ph:arrow-counter-clockwise-bold" size="18")
          span.mx-1 {{ $t('roiCalculator.reset') }}
        el-button(size="large" type="success" @click="handleGeneratePDF")
          Icon(name="ph:file-pdf-bold" size="18")
          span.mx-1 {{ $t('roiCalculator.generatePDF') }}
        el-button(size="large" type="primary" @click="handleSaveCalculation" class="premium-btn")
          Icon(name="ph:floppy-disk-bold" size="18")
          span.mx-1 {{ $t('roiCalculator.saveCalculation') }}

  StatCards(:stats="summaryStats")

  .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
    //- Left Side: Inputs
    div
      //- Current Costs Form
      .glass-card.p-6.rounded-2xl.mb-6.animate-entrance
        .flex.items-center.gap-3.mb-5
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
            Icon(name="ph:money-bold" size="22" style="color: #7849ff")
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('roiCalculator.currentCosts') }}

        el-form(label-position="top" size="large")
          .grid.grid-cols-2.gap-4
            el-form-item(:label="$t('roiCalculator.currentCrmCost')")
              el-input-number(v-model="form.currentCrmCost" :min="0" :precision="2" :step="100" class="w-full" :placeholder="$t('roiCalculator.currentCrmCost')")
            el-form-item(:label="$t('roiCalculator.numberOfUsers')")
              el-input-number(v-model="form.numberOfUsers" :min="1" :max="10000" class="w-full")
          .grid.grid-cols-2.gap-4
            el-form-item(:label="$t('roiCalculator.manualTaskHours')")
              el-input-number(v-model="form.manualTaskHours" :min="0" :max="168" :precision="1" class="w-full")
            el-form-item(:label="$t('roiCalculator.hourlyCost')")
              el-input-number(v-model="form.hourlyCost" :min="0" :precision="2" :step="10" class="w-full")
          .grid.grid-cols-2.gap-4
            el-form-item(:label="$t('roiCalculator.conversionRate')")
              el-input-number(v-model="form.conversionRate" :min="0" :max="100" :precision="1" class="w-full")
                template(#suffix) %
            el-form-item(:label="$t('roiCalculator.avgDealSize')")
              el-input-number(v-model="form.avgDealSize" :min="0" :precision="2" :step="1000" class="w-full")

      //- Projected Improvements Form
      .glass-card.p-6.rounded-2xl.animate-entrance
        .flex.items-center.gap-3.mb-5
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
            Icon(name="ph:trend-up-bold" size="22" style="color: #22c55e")
          div
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('roiCalculator.projectedImprovements') }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('roiCalculator.industryAverages') }}

        el-form(label-position="top" size="large")
          .grid.grid-cols-2.gap-4
            el-form-item(:label="$t('roiCalculator.timeSaved')")
              el-slider(v-model="improvements.timeSaved" :min="0" :max="80" :format-tooltip="(v: number) => v + '%'" show-input)
            el-form-item(:label="$t('roiCalculator.conversionImprovement')")
              el-slider(v-model="improvements.conversionImprovement" :min="0" :max="100" :format-tooltip="(v: number) => v + '%'" show-input)
          .grid.grid-cols-2.gap-4
            el-form-item(:label="$t('roiCalculator.dealSizeIncrease')")
              el-slider(v-model="improvements.dealSizeIncrease" :min="0" :max="100" :format-tooltip="(v: number) => v + '%'" show-input)
            el-form-item(:label="$t('roiCalculator.cycleReduction')")
              el-input-number(v-model="improvements.cycleReduction" :min="0" :max="365" class="w-full")

    //- Right Side: Results
    div
      //- Annual ROI Summary Card
      .glass-card.p-6.rounded-2xl.mb-6.animate-entrance(style="border: 1px solid rgba(120, 73, 255, 0.2)")
        .flex.items-center.gap-3.mb-5
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
            Icon(name="ph:chart-pie-bold" size="22" style="color: #7849ff")
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('roiCalculator.annualROI') }}

        .grid.grid-cols-2.gap-5
          .text-center.p-4.rounded-xl(style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.2)")
            p.text-xs.font-medium.uppercase.tracking-wider.mb-2(style="color: var(--text-muted)") {{ $t('roiCalculator.totalSavings') }}
            p.text-2xl.font-bold(style="color: #22c55e") {{ formatCurrency(results.totalSavings) }}
          .text-center.p-4.rounded-xl(style="background: rgba(120, 73, 255, 0.08); border: 1px solid rgba(120, 73, 255, 0.2)")
            p.text-xs.font-medium.uppercase.tracking-wider.mb-2(style="color: var(--text-muted)") {{ $t('roiCalculator.roiPercentage') }}
            p.text-2xl.font-bold(style="color: #7849ff") {{ results.roiPercentage }}%
          .text-center.p-4.rounded-xl(style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2)")
            p.text-xs.font-medium.uppercase.tracking-wider.mb-2(style="color: var(--text-muted)") {{ $t('roiCalculator.paybackPeriod') }}
            p.text-2xl.font-bold(style="color: #f59e0b") {{ results.paybackMonths }} {{ $t('roiCalculator.months') }}
          .text-center.p-4.rounded-xl(style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2)")
            p.text-xs.font-medium.uppercase.tracking-wider.mb-2(style="color: var(--text-muted)") {{ $t('roiCalculator.threeYearValue') }}
            p.text-2xl.font-bold(style="color: #3b82f6") {{ formatCurrency(results.threeYearValue) }}

      //- Breakdown Chart
      .glass-card.p-6.rounded-2xl.mb-6.animate-entrance
        .flex.items-center.gap-3.mb-5
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
            Icon(name="ph:chart-bar-bold" size="22" style="color: #3b82f6")
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('roiCalculator.breakdown') }}
        ClientOnly
          VChart.w-full(:option="breakdownChartOption" :style="{ height: '320px' }" autoresize)

      //- Comparison Table
      .glass-card.p-6.rounded-2xl.animate-entrance
        .flex.items-center.gap-3.mb-5
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
            Icon(name="ph:table-bold" size="22" style="color: #f59e0b")
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('roiCalculator.beforeAfter') }}

        el-table(:data="comparisonRows" style="width: 100%" stripe)
          el-table-column(:label="$t('roiCalculator.metric')" min-width="180" prop="metric")
            template(#default="{ row }")
              span.font-medium(style="color: var(--text-primary)") {{ row.metric }}
          el-table-column(:label="$t('roiCalculator.before')" min-width="150" align="center")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ row.before }}
          el-table-column(:label="$t('roiCalculator.after')" min-width="150" align="center")
            template(#default="{ row }")
              span.font-bold(style="color: #22c55e") {{ row.after }}
          el-table-column(:label="$t('roiCalculator.change')" width="120" align="center")
            template(#default="{ row }")
              el-tag(:type="row.changeType === 'positive' ? 'success' : 'danger'" size="small" round effect="dark") {{ row.change }}

  //- Action bar at bottom
  .flex.justify-end.gap-3.mt-6.animate-entrance
    el-button(size="large" @click="handleEmailProspect")
      Icon(name="ph:envelope-bold" size="18")
      span.mx-1 {{ $t('roiCalculator.emailToProspect') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import VChart from 'vue-echarts';
import { ElMessage } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { t, locale } = useI18n();

// --- Current costs form ---
const form = reactive({
  currentCrmCost: 500,
  numberOfUsers: 10,
  manualTaskHours: 15,
  hourlyCost: 50,
  conversionRate: 12,
  avgDealSize: 5000
});

// --- Projected improvements (industry average defaults) ---
const improvements = reactive({
  timeSaved: 30,
  conversionImprovement: 25,
  dealSizeIncrease: 15,
  cycleReduction: 14
});

// --- Calculations ---
const results = computed(() => {
  const weeklyManualCost = form.manualTaskHours * form.hourlyCost * form.numberOfUsers;
  const annualManualCost = weeklyManualCost * 52;
  const timeSavingsValue = annualManualCost * (improvements.timeSaved / 100);

  const currentAnnualRevenue = form.avgDealSize * (form.conversionRate / 100) * form.numberOfUsers * 12;
  const improvedConversion = form.conversionRate * (1 + improvements.conversionImprovement / 100);
  const improvedDealSize = form.avgDealSize * (1 + improvements.dealSizeIncrease / 100);
  const projectedAnnualRevenue = improvedDealSize * (improvedConversion / 100) * form.numberOfUsers * 12;
  const revenueIncrease = projectedAnnualRevenue - currentAnnualRevenue;

  const currentAnnualCrmCost = form.currentCrmCost * 12;
  const costReduction = currentAnnualCrmCost * 0.2;

  const efficiencyGains = (improvements.cycleReduction / 30) * form.avgDealSize * form.numberOfUsers;

  const totalSavings = timeSavingsValue + revenueIncrease + costReduction + efficiencyGains;
  const annualInvestment = currentAnnualCrmCost || 1;
  const roiPercentage = Math.round((totalSavings / annualInvestment) * 100);

  const monthlyBenefit = totalSavings / 12;
  const paybackMonths = monthlyBenefit > 0 ? Math.max(1, Math.round(annualInvestment / monthlyBenefit)) : 0;

  const threeYearValue = totalSavings * 3;

  return {
    totalSavings: Math.round(totalSavings),
    roiPercentage,
    paybackMonths,
    threeYearValue: Math.round(threeYearValue),
    timeSavingsValue: Math.round(timeSavingsValue),
    revenueIncrease: Math.round(revenueIncrease),
    costReduction: Math.round(costReduction),
    efficiencyGains: Math.round(efficiencyGains),
    currentAnnualRevenue: Math.round(currentAnnualRevenue),
    projectedAnnualRevenue: Math.round(projectedAnnualRevenue),
    improvedConversion: +(form.conversionRate * (1 + improvements.conversionImprovement / 100)).toFixed(1),
    improvedDealSize: Math.round(form.avgDealSize * (1 + improvements.dealSizeIncrease / 100))
  };
});

// --- Summary stat cards ---
const summaryStats = computed(() => [
  {
    label: t('roiCalculator.totalSavings'),
    value: formatCurrency(results.value.totalSavings),
    icon: 'ph:piggy-bank-bold',
    color: '#22c55e'
  },
  {
    label: t('roiCalculator.roiPercentage'),
    value: results.value.roiPercentage + '%',
    icon: 'ph:chart-line-up-bold',
    color: '#7849ff'
  },
  {
    label: t('roiCalculator.paybackPeriod'),
    value: results.value.paybackMonths + ' ' + t('roiCalculator.months'),
    icon: 'ph:clock-bold',
    color: '#f59e0b'
  },
  {
    label: t('roiCalculator.threeYearValue'),
    value: formatCurrency(results.value.threeYearValue),
    icon: 'ph:rocket-launch-bold',
    color: '#3b82f6'
  }
]);

// --- Breakdown chart (stacked bar) ---
const breakdownChartOption = computed(() => {
  const categories = [
    t('roiCalculator.timeSavingsLabel'),
    t('roiCalculator.revenueIncreaseLabel'),
    t('roiCalculator.costReductionLabel'),
    t('roiCalculator.efficiencyGainsLabel')
  ];
  const values = [results.value.timeSavingsValue, results.value.revenueIncrease, results.value.costReduction, results.value.efficiencyGains];
  const colors = ['#7849ff', '#22c55e', '#3b82f6', '#f59e0b'];

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-radius: 16px;',
      formatter: (params: unknown) => {
        const item = params[0];
        return `<div style="font-weight:600;margin-bottom:4px">${item.name}</div>
          <div style="color:${item.color}">${formatCurrency(item.value)}</div>`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#94A3B8',
        formatter: (v: number) => {
          if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
          if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
          return v.toString();
        }
      },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
    },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: colors[i],
            borderRadius: [8, 8, 0, 0]
          }
        })),
        barWidth: '45%'
      }
    ]
  };
});

// --- Comparison table ---
const comparisonRows = computed(() => [
  {
    metric: t('roiCalculator.monthlyCostLabel'),
    before: formatCurrency(form.currentCrmCost),
    after: formatCurrency(Math.round(form.currentCrmCost * 0.8)),
    change: '-20%',
    changeType: 'positive'
  },
  {
    metric: t('roiCalculator.timeOnTasksLabel'),
    before: form.manualTaskHours + ' ' + t('roiCalculator.hoursPerWeek'),
    after: Math.round(form.manualTaskHours * (1 - improvements.timeSaved / 100)) + ' ' + t('roiCalculator.hoursPerWeek'),
    change: '-' + improvements.timeSaved + '%',
    changeType: 'positive'
  },
  {
    metric: t('roiCalculator.conversionRateLabel'),
    before: form.conversionRate + '%',
    after: results.value.improvedConversion + '%',
    change: '+' + improvements.conversionImprovement + '%',
    changeType: 'positive'
  },
  {
    metric: t('roiCalculator.avgDealSizeLabel'),
    before: formatCurrency(form.avgDealSize),
    after: formatCurrency(results.value.improvedDealSize),
    change: '+' + improvements.dealSizeIncrease + '%',
    changeType: 'positive'
  },
  {
    metric: t('roiCalculator.annualRevenueLabel'),
    before: formatCurrency(results.value.currentAnnualRevenue),
    after: formatCurrency(results.value.projectedAnnualRevenue),
    change:
      '+' +
      (results.value.currentAnnualRevenue > 0
        ? Math.round(((results.value.projectedAnnualRevenue - results.value.currentAnnualRevenue) / results.value.currentAnnualRevenue) * 100)
        : 0) +
      '%',
    changeType: 'positive'
  }
]);

// --- Helpers ---
function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    value
  );
}

function resetForm() {
  Object.assign(form, {
    currentCrmCost: 500,
    numberOfUsers: 10,
    manualTaskHours: 15,
    hourlyCost: 50,
    conversionRate: 12,
    avgDealSize: 5000
  });
  Object.assign(improvements, {
    timeSaved: 30,
    conversionImprovement: 25,
    dealSizeIncrease: 15,
    cycleReduction: 14
  });
  ElMessage.success(t('roiCalculator.resetSuccess'));
}

function handleGeneratePDF() {
  ElMessage.info(t('roiCalculator.pdfGenerating'));
}

function handleEmailProspect() {
  ElMessage.info(t('roiCalculator.emailSending'));
}

function handleSaveCalculation() {
  ElMessage.success(t('roiCalculator.calculationSaved'));
}
</script>
