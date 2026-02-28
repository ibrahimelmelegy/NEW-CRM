<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('quoteComparison.title')" :subtitle="$t('quoteComparison.subtitle')")
    template(#actions)
      .flex.gap-2
        el-button(size="large" @click="addOption" :disabled="options.length >= 4")
          Icon(name="ph:plus-bold" size="18")
          span.mx-1 {{ $t('quoteComparison.addOption') }}
        el-button(size="large" type="success" @click="handleExportPDF")
          Icon(name="ph:file-pdf-bold" size="18")
          span.mx-1 {{ $t('quoteComparison.exportPDF') }}
        el-button(size="large" type="primary" @click="handleSaveComparison" class="premium-btn")
          Icon(name="ph:floppy-disk-bold" size="18")
          span.mx-1 {{ $t('quoteComparison.saveComparison') }}

  //- Value Analysis Summary Cards
  StatCards(:stats="valueSummaryStats")

  //- Quote Builder: Side-by-side option cards
  .mb-6
    .flex.items-center.gap-3.mb-4
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
        Icon(name="ph:stack-bold" size="22" style="color: #7849ff")
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('quoteComparison.quoteBuilder') }}

    .grid.gap-4(:class="optionGridClass")
      .glass-card.p-5.rounded-2xl.relative.animate-entrance(
        v-for="(opt, idx) in options"
        :key="idx"
        :style="{ border: opt.recommended ? '2px solid #7849ff' : '1px solid var(--border-default)', animationDelay: `${idx * 0.08}s` }"
      )
        //- Recommended badge
        .absolute.top-0(v-if="opt.recommended" class="left-1/2 -translate-x-1/2 -translate-y-1/2")
          el-tag(type="primary" effect="dark" size="small" round style="background: #7849ff; border-color: #7849ff")
            Icon(name="ph:star-bold" size="12" class="mr-1")
            span {{ $t('quoteComparison.recommended') }}

        //- Remove button
        el-button.absolute.top-2.right-2(
          v-if="options.length > 2"
          text circle size="small" type="danger"
          @click="removeOption(idx)"
        )
          Icon(name="ph:x-bold" size="14")

        //- Option name
        el-input.mb-4(
          v-model="opt.name"
          :placeholder="$t('quoteComparison.optionName')"
          size="large"
          style="font-weight: 700"
        )

        //- Pricing
        .grid.grid-cols-2.gap-3.mb-4
          el-form-item(:label="$t('quoteComparison.monthlyPrice')" class="!mb-0")
            el-input-number(v-model="opt.monthlyPrice" :min="0" :precision="2" :step="50" class="w-full" size="default")
          el-form-item(:label="$t('quoteComparison.annualPrice')" class="!mb-0")
            el-input-number(v-model="opt.annualPrice" :min="0" :precision="2" :step="500" class="w-full" size="default")

        //- Annual discount indicator
        .text-center.mb-4(v-if="opt.monthlyPrice > 0 && opt.annualPrice > 0 && opt.annualPrice < opt.monthlyPrice * 12")
          el-tag(type="success" effect="dark" size="small" round)
            Icon(name="ph:tag-bold" size="12" class="mr-1")
            span {{ $t('quoteComparison.save') }} {{ getAnnualDiscount(opt) }}%

        //- Limits & Support
        .space-y-3.mb-4
          el-form-item(:label="$t('quoteComparison.userLimit')" class="!mb-0")
            el-input(v-model="opt.userLimit" :placeholder="$t('quoteComparison.unlimited')" size="default")
          el-form-item(:label="$t('quoteComparison.storageLimit')" class="!mb-0")
            el-input(v-model="opt.storageLimit" :placeholder="$t('quoteComparison.storagePlaceholder')" size="default")
          el-form-item(:label="$t('quoteComparison.supportLevel')" class="!mb-0")
            el-select(v-model="opt.supportLevel" class="w-full" size="default")
              el-option(:label="$t('quoteComparison.emailSupport')" value="Email")
              el-option(:label="$t('quoteComparison.phoneSupport')" value="Phone")
              el-option(:label="$t('quoteComparison.dedicatedSupport')" value="Dedicated")

        //- Features list
        .mb-3
          .flex.items-center.justify-between.mb-2
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('quoteComparison.features') }}
            el-button(text size="small" type="primary" @click="addFeatureToOption(idx)")
              Icon(name="ph:plus-bold" size="12")
              span.ml-1 {{ $t('common.add') }}
          .space-y-2
            .flex.items-center.gap-2(v-for="(feat, fIdx) in opt.features" :key="fIdx")
              el-checkbox(v-model="feat.included" :label="' '")
              el-input(v-model="feat.name" size="small" :placeholder="$t('quoteComparison.featureName')" class="flex-1")
              el-button(text circle size="small" type="danger" @click="opt.features.splice(fIdx, 1)" v-if="opt.features.length > 1")
                Icon(name="ph:x" size="12")

        //- Set as recommended
        .text-center
          el-button(
            :type="opt.recommended ? 'primary' : 'default'"
            size="small"
            @click="setRecommended(idx)"
            round
          )
            Icon(name="ph:star-bold" size="14" class="mr-1")
            span {{ opt.recommended ? $t('quoteComparison.isRecommended') : $t('quoteComparison.setRecommended') }}

  //- Feature Comparison Matrix
  .glass-card.p-6.rounded-2xl.mb-6.animate-entrance
    .flex.items-center.gap-3.mb-5
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
        Icon(name="ph:table-bold" size="22" style="color: #3b82f6")
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('quoteComparison.comparisonMatrix') }}

    el-table(:data="comparisonMatrixRows" style="width: 100%" stripe)
      el-table-column(:label="$t('quoteComparison.feature')" min-width="200" fixed="left")
        template(#default="{ row }")
          span.font-medium(style="color: var(--text-primary)") {{ row.feature }}
      el-table-column(
        v-for="(opt, idx) in options"
        :key="idx"
        :label="opt.name || ($t('quoteComparison.option') + ' ' + (idx + 1))"
        min-width="150"
        align="center"
      )
        template(#header)
          .flex.flex-col.items-center.gap-1
            span.font-bold {{ opt.name || ($t('quoteComparison.option') + ' ' + (idx + 1)) }}
            el-tag(v-if="opt.recommended" type="primary" size="small" effect="dark" round style="background: #7849ff; border-color: #7849ff") {{ $t('quoteComparison.recommended') }}
        template(#default="{ row }")
          .flex.justify-center
            Icon(
              :name="row.options[idx] ? 'ph:check-circle-fill' : 'ph:x-circle-fill'"
              :size="22"
              :style="{ color: row.options[idx] ? '#22c55e' : '#ef4444' }"
            )
      template(#empty)
        el-empty(:description="$t('quoteComparison.addFeatures')")

  //- Value Analysis
  .glass-card.p-6.rounded-2xl.mb-6.animate-entrance
    .flex.items-center.gap-3.mb-5
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
        Icon(name="ph:chart-bar-bold" size="22" style="color: #f59e0b")
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('quoteComparison.valueAnalysis') }}

    //- Period selector
    .flex.gap-2.mb-5
      el-radio-group(v-model="analysisPeriod" size="default")
        el-radio-button(:value="12") 12 {{ $t('quoteComparison.months') }}
        el-radio-button(:value="24") 24 {{ $t('quoteComparison.months') }}
        el-radio-button(:value="36") 36 {{ $t('quoteComparison.months') }}

    el-table(:data="valueAnalysisRows" style="width: 100%")
      el-table-column(:label="$t('quoteComparison.metric')" min-width="180" fixed="left")
        template(#default="{ row }")
          span.font-medium(style="color: var(--text-primary)") {{ row.metric }}
      el-table-column(
        v-for="(opt, idx) in options"
        :key="idx"
        :label="opt.name || ($t('quoteComparison.option') + ' ' + (idx + 1))"
        min-width="160"
        align="center"
      )
        template(#default="{ row }")
          .flex.flex-col.items-center
            span.font-bold(:style="{ color: row.bestIndex === idx ? '#22c55e' : 'var(--text-primary)' }") {{ row.values[idx] }}
            el-tag(v-if="row.bestIndex === idx" type="success" size="small" round effect="dark" class="mt-1") {{ $t('quoteComparison.bestValue') }}
      template(#empty)
        el-empty(:description="$t('common.noData')")

  //- Bottom action bar
  .flex.justify-end.gap-3.mt-6.animate-entrance
    el-button(size="large" @click="handleShareWithClient")
      Icon(name="ph:share-network-bold" size="18")
      span.mx-1 {{ $t('quoteComparison.shareWithClient') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { t, locale } = useI18n();

// --- Default feature list ---
const defaultFeatures = () => [
  { name: t('quoteComparison.featureCrmCore'), included: true },
  { name: t('quoteComparison.featureEmailIntegration'), included: true },
  { name: t('quoteComparison.featureReportingAnalytics'), included: true },
  { name: t('quoteComparison.featureApiAccess'), included: false },
  { name: t('quoteComparison.featureCustomWorkflows'), included: false },
  { name: t('quoteComparison.featureDedicatedSupport'), included: false },
  { name: t('quoteComparison.featureWhiteLabel'), included: false },
  { name: t('quoteComparison.featureSlaGuarantee'), included: false }
];

// --- Quote options ---
interface FeatureItem {
  name: string;
  included: boolean;
}

interface QuoteOption {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  userLimit: string;
  storageLimit: string;
  supportLevel: string;
  recommended: boolean;
  features: FeatureItem[];
}

const createOption = (name: string, monthly: number, annual: number, recommended: boolean, featureOverrides?: Partial<FeatureItem>[]): QuoteOption => {
  const features = defaultFeatures();
  if (featureOverrides) {
    featureOverrides.forEach((override, i) => {
      if (i < features.length) Object.assign(features[i], override);
    });
  }
  return {
    name,
    monthlyPrice: monthly,
    annualPrice: annual,
    userLimit: '',
    storageLimit: '',
    supportLevel: 'Email',
    recommended,
    features
  };
};

const options = reactive<QuoteOption[]>([
  createOption('Starter', 29, 290, false, [
    { included: true }, { included: true }, { included: true },
    { included: false }, { included: false }, { included: false },
    { included: false }, { included: false }
  ]),
  createOption('Professional', 79, 790, true, [
    { included: true }, { included: true }, { included: true },
    { included: true }, { included: true }, { included: false },
    { included: false }, { included: false }
  ]),
  createOption('Enterprise', 149, 1490, false, [
    { included: true }, { included: true }, { included: true },
    { included: true }, { included: true }, { included: true },
    { included: true }, { included: true }
  ])
]);

const analysisPeriod = ref(12);

// --- Computed grid class based on number of options ---
const optionGridClass = computed(() => {
  const map: Record<number, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };
  return map[options.length] || 'grid-cols-1 md:grid-cols-3';
});

// --- Value Summary Stats ---
const valueSummaryStats = computed(() => {
  const cheapest = options.reduce((prev, curr) => curr.monthlyPrice < prev.monthlyPrice ? curr : prev, options[0]);
  const mostFeatures = options.reduce((prev, curr) => {
    const prevCount = prev.features.filter(f => f.included).length;
    const currCount = curr.features.filter(f => f.included).length;
    return currCount > prevCount ? curr : prev;
  }, options[0]);
  const bestRatio = getBestValueOption();
  const recommended = options.find(o => o.recommended);

  return [
    {
      label: t('quoteComparison.lowestPrice'),
      value: cheapest.name || '-',
      icon: 'ph:tag-bold',
      color: '#22c55e'
    },
    {
      label: t('quoteComparison.mostFeatures'),
      value: mostFeatures.name || '-',
      icon: 'ph:list-checks-bold',
      color: '#3b82f6'
    },
    {
      label: t('quoteComparison.bestValue'),
      value: bestRatio?.name || '-',
      icon: 'ph:trophy-bold',
      color: '#f59e0b'
    },
    {
      label: t('quoteComparison.recommended'),
      value: recommended?.name || '-',
      icon: 'ph:star-bold',
      color: '#7849ff'
    }
  ];
});

// --- Feature comparison matrix ---
const comparisonMatrixRows = computed(() => {
  const allFeatures = new Map<string, boolean[]>();

  // Collect all unique feature names across all options
  options.forEach((opt, optIdx) => {
    opt.features.forEach(feat => {
      if (!feat.name.trim()) return;
      if (!allFeatures.has(feat.name)) {
        allFeatures.set(feat.name, new Array(options.length).fill(false));
      }
      const row = allFeatures.get(feat.name)!;
      row[optIdx] = feat.included;
    });
  });

  return Array.from(allFeatures.entries()).map(([feature, opts]) => ({
    feature,
    options: opts
  }));
});

// --- Value analysis rows ---
const valueAnalysisRows = computed(() => {
  const months = analysisPeriod.value;

  // Total cost per option
  const totalCosts = options.map(opt => opt.annualPrice > 0
    ? opt.annualPrice * (months / 12)
    : opt.monthlyPrice * months
  );

  // Cost per user
  const costPerUser = options.map((opt, i) => {
    const users = parseInt(opt.userLimit) || 1;
    return totalCosts[i] / users;
  });

  // Feature count
  const featureCounts = options.map(opt => opt.features.filter(f => f.included).length);

  // Feature-to-price ratio (features per $100)
  const featureRatios = options.map((opt, i) => {
    const monthly = opt.monthlyPrice || 1;
    return +(featureCounts[i] / monthly * 100).toFixed(1);
  });

  // Find best index for each metric
  const bestTotalCost = totalCosts.indexOf(Math.min(...totalCosts));
  const bestCostPerUser = costPerUser.indexOf(Math.min(...costPerUser));
  const bestFeatureRatio = featureRatios.indexOf(Math.max(...featureRatios));

  return [
    {
      metric: t('quoteComparison.totalCost') + ` (${months} ${t('quoteComparison.months')})`,
      values: totalCosts.map(v => new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)),
      bestIndex: bestTotalCost
    },
    {
      metric: t('quoteComparison.costPerUser'),
      values: costPerUser.map(v => new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(v))),
      bestIndex: bestCostPerUser
    },
    {
      metric: t('quoteComparison.featuresIncluded'),
      values: featureCounts.map(v => v + ' / ' + (options[0]?.features.length || 0)),
      bestIndex: featureCounts.indexOf(Math.max(...featureCounts))
    },
    {
      metric: t('quoteComparison.featureRatio'),
      values: featureRatios.map(v => v.toString()),
      bestIndex: bestFeatureRatio
    }
  ];
});

// --- Helpers ---
function getAnnualDiscount(opt: QuoteOption): number {
  if (!opt.monthlyPrice || !opt.annualPrice) return 0;
  const fullPrice = opt.monthlyPrice * 12;
  return Math.round(((fullPrice - opt.annualPrice) / fullPrice) * 100);
}

function getBestValueOption(): QuoteOption | null {
  if (!options.length) return null;
  let best = options[0];
  let bestScore = 0;

  options.forEach(opt => {
    const featureCount = opt.features.filter(f => f.included).length;
    const price = opt.monthlyPrice || 1;
    const score = featureCount / price;
    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  });

  return best;
}

function addOption() {
  if (options.length >= 4) {
    ElMessage.warning(t('quoteComparison.maxOptions'));
    return;
  }
  options.push(createOption('', 0, 0, false));
}

function removeOption(idx: number) {
  if (options.length <= 2) {
    ElMessage.warning(t('quoteComparison.minOptions'));
    return;
  }
  options.splice(idx, 1);
}

function addFeatureToOption(optIdx: number) {
  options[optIdx].features.push({ name: '', included: false });
}

function setRecommended(idx: number) {
  options.forEach((opt, i) => {
    opt.recommended = i === idx;
  });
}

function handleExportPDF() {
  ElMessage.info(t('quoteComparison.pdfGenerating'));
}

function handleSaveComparison() {
  ElMessage.success(t('quoteComparison.comparisonSaved'));
}

function handleShareWithClient() {
  ElMessage.info(t('quoteComparison.shareSent'));
}
</script>

<style lang="scss" scoped>
.premium-btn {
  background: linear-gradient(135deg, #7849ff 0%, #5a2fd4 100%);
  border: none;
  color: #fff;
  font-weight: 600;
  &:hover {
    background: linear-gradient(135deg, #8b5cf6 0%, #7849ff 100%);
  }
}
.glass-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover { transform: translateY(-1px); }
}
.animate-entrance {
  animation: slideUp 0.4s ease-out;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
