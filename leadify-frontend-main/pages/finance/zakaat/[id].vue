<template lang="pug">
div(v-loading="loading")
  DetailLayout(
    :title="assessment ? `${$t('zakaat.assessment')} - ${assessment.fiscalYear}` : $t('common.loading')"
    :breadcrumbs="breadcrumbs"
    :hasSidebar="true"
  )
    template(#header-actions)
      el-tag.mr-2(v-if="assessment" :type="getStatusType(assessment.status)" size="large" effect="dark")
        | {{ $t(`zakaat.status.${assessment.status.toLowerCase()}`) }}
      el-button(
        v-if="assessment && assessment.status === 'DRAFT'"
        type="success"
        :loading="calculating"
        @click="handleCalculate"
        class="!rounded-2xl"
      )
        Icon(name="ph:calculator-bold" size="16" class="mr-1")
        span {{ $t('zakaat.calculate') }}
      el-button(
        v-if="assessment && assessment.status === 'DRAFT'"
        @click="router.push(`/finance/zakaat/create?edit=${assessment.id}`)"
        class="!rounded-2xl"
      )
        Icon(name="ph:pencil-simple-bold" size="16" class="mr-1")
        span {{ $t('common.edit') }}
      el-button(
        v-if="assessment && assessment.status === 'CALCULATED'"
        type="warning"
        @click="handleSubmitAssessment"
        class="!rounded-2xl"
      )
        Icon(name="ph:paper-plane-tilt-bold" size="16" class="mr-1")
        span {{ $t('zakaat.submit') }}
      el-button(
        v-if="assessment && assessment.status === 'SUBMITTED'"
        type="success"
        @click="handleMarkPaid"
        class="!rounded-2xl"
      )
        Icon(name="ph:check-circle-bold" size="16" class="mr-1")
        span {{ $t('zakaat.markPaid') }}

    //- Main content
    template(v-if="assessment")
      //- Asset Breakdown Cards
      .mb-6
        h3.font-bold.text-lg.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:wallet-bold" size="20" class="mr-2" style="color: var(--accent-color)")
          | {{ $t('zakaat.assetBreakdown') }}
        .grid.grid-cols-1.gap-4(class="md:grid-cols-2 lg:grid-cols-3")
          //- Asset cards
          .glass-card.p-5.animate-entrance(v-for="(asset, i) in assetCards" :key="asset.key" :style="{ animationDelay: `${i * 0.04}s` }")
            .flex.items-center.justify-between
              .flex.items-center.gap-3
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: asset.color + '15' }")
                  Icon(:name="asset.icon" size="20" :style="{ color: asset.color }")
                div
                  p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ asset.label }}
                  p.text-lg.font-bold(:style="{ color: asset.isDeduction ? '#ef4444' : 'var(--text-primary)' }")
                    span(v-if="asset.isDeduction") -
                    | {{ formatCurrency(asset.value) }}

      //- Calculation Summary
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.3s")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:calculator-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zakaat.calculationSummary') }}
        .max-w-lg.mx-auto
          .flex.justify-between.py-3.border-b(style="border-color: var(--border-color)")
            span.text-sm(style="color: var(--text-muted)") {{ $t('zakaat.totalAssets') }}
            span.font-medium {{ formatCurrency(assessment.totalAssets) }}
          .flex.justify-between.py-3.border-b(style="border-color: var(--border-color)")
            span.text-sm.text-red-500 {{ $t('zakaat.lessExemptAssets') }}
            span.font-medium.text-red-500 -{{ formatCurrency(assessment.exemptAssets) }}
          .flex.justify-between.py-3.border-b(style="border-color: var(--border-color)")
            span.font-medium {{ $t('zakaat.zakaatableBase') }}
            span.font-bold {{ formatCurrency(assessment.zakaatableBase) }}
          .flex.justify-between.py-3.border-b(style="border-color: var(--border-color)")
            span.text-sm(style="color: var(--text-muted)") {{ $t('zakaat.zakaatRate') }}
            span.font-medium {{ assessment.zakaatRate || 2.5 }}%
          .flex.justify-between.py-4.mt-2
            span.text-xl.font-bold {{ $t('zakaat.zakaatDue') }}
            .text-right
              p.text-3xl.font-bold(style="color: var(--accent-color)") {{ formatCurrency(assessment.zakaatDue) }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('zakaat.annualObligation') }}

      //- Notes
      .glass-card.p-6.mt-6.animate-entrance(v-if="assessment.notes" style="animation-delay: 0.35s")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:note-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zakaat.notes') }}
        p.text-sm(style="color: var(--text-muted); white-space: pre-wrap") {{ assessment.notes }}

    //- Sidebar
    template(#sidebar v-if="assessment")
      //- Status Timeline
      .glass-card.p-6.animate-entrance
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:clock-clockwise-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zakaat.timeline') }}
        .space-y-4
          .flex.items-center.gap-3
            .w-8.h-8.rounded-full.flex.items-center.justify-center(
              :style="{ background: '#67c23a15', color: '#67c23a' }"
            )
              Icon(name="ph:check-bold" size="14")
            div
              p.text-sm.font-medium {{ $t('zakaat.created') }}
              p.text-xs(style="color: var(--text-muted)") {{ formatDate(assessment.createdAt) }}
          .flex.items-center.gap-3(v-if="assessment.status !== 'DRAFT'")
            .w-8.h-8.rounded-full.flex.items-center.justify-center(
              :style="{ background: '#409eff15', color: '#409eff' }"
            )
              Icon(name="ph:calculator-bold" size="14")
            div
              p.text-sm.font-medium {{ $t('zakaat.calculated') }}
              p.text-xs(style="color: var(--text-muted)") {{ formatDate(assessment.updatedAt) }}
          .flex.items-center.gap-3(v-if="assessment.submittedAt")
            .w-8.h-8.rounded-full.flex.items-center.justify-center(
              :style="{ background: '#e6a23c15', color: '#e6a23c' }"
            )
              Icon(name="ph:paper-plane-tilt-bold" size="14")
            div
              p.text-sm.font-medium {{ $t('zakaat.submitted') }}
              p.text-xs(style="color: var(--text-muted)") {{ formatDate(assessment.submittedAt) }}
          .flex.items-center.gap-3(v-if="assessment.paidAt")
            .w-8.h-8.rounded-full.flex.items-center.justify-center(
              :style="{ background: '#67c23a15', color: '#67c23a' }"
            )
              Icon(name="ph:money-bold" size="14")
            div
              p.text-sm.font-medium {{ $t('zakaat.paid') }}
              p.text-xs(style="color: var(--text-muted)") {{ formatDate(assessment.paidAt) }}

      //- Quick Facts
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.1s")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:info-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zakaat.quickFacts') }}
        .space-y-3
          .flex.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('zakaat.fiscalYear') }}
            span.text-sm.font-bold {{ assessment.fiscalYear }}
          .flex.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('zakaat.assessmentDate') }}
            span.text-sm {{ formatDate(assessment.assessmentDate) }}
          .flex.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('zakaat.zakaatRate') }}
            span.text-sm.font-medium {{ assessment.zakaatRate || 2.5 }}%

      //- About Zakaat Info Card
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.15s")
        .flex.items-center.gap-2.mb-3
          Icon(name="ph:book-open-bold" size="20" style="color: var(--accent-color)")
          h3.font-bold.text-lg {{ $t('zakaat.aboutZakaat') }}
        p.text-xs.leading-relaxed(style="color: var(--text-muted)") {{ $t('zakaat.aboutZakaatDesc') }}
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import {
  fetchAssessment,
  calculateZakaat,
  updateAssessment,
  type ZakaatAssessment,
  type ZakaatStatus
} from '~/composables/useZakaat';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const calculating = ref(false);
const assessment = ref<ZakaatAssessment | null>(null);

const breadcrumbs = computed(() => [
  { label: t('navigation.finance'), to: '/finance/expenses' },
  { label: t('zakaat.title'), to: '/finance/zakaat' },
  { label: assessment.value ? assessment.value.fiscalYear : '...' }
]);

const assetCards = computed(() => {
  if (!assessment.value) return [];
  const a = assessment.value;
  return [
    { key: 'cash', label: t('zakaat.assets.cashAndBank'), value: a.cashAndBank, icon: 'ph:bank-bold', color: '#7849ff', isDeduction: false },
    { key: 'receivable', label: t('zakaat.assets.accountsReceivable'), value: a.accountsReceivable, icon: 'ph:invoice-bold', color: '#409eff', isDeduction: false },
    { key: 'inventory', label: t('zakaat.assets.inventoryValue'), value: a.inventoryValue, icon: 'ph:package-bold', color: '#67c23a', isDeduction: false },
    { key: 'investments', label: t('zakaat.assets.shortTermInvestments'), value: a.shortTermInvestments, icon: 'ph:chart-line-up-bold', color: '#e6a23c', isDeduction: false },
    { key: 'prepaid', label: t('zakaat.assets.prepaidExpenses'), value: a.prepaidExpenses, icon: 'ph:receipt-bold', color: '#909399', isDeduction: false },
    { key: 'fixed', label: t('zakaat.deductions.fixedAssets'), value: a.fixedAssets, icon: 'ph:buildings-bold', color: '#ef4444', isDeduction: true },
    { key: 'liabilities', label: t('zakaat.deductions.longTermLiabilities'), value: a.longTermLiabilities, icon: 'ph:scales-bold', color: '#f56c6c', isDeduction: true }
  ];
});

function getStatusType(status: ZakaatStatus): string {
  const map: Record<string, string> = {
    DRAFT: 'info',
    CALCULATED: '',
    SUBMITTED: 'warning',
    PAID: 'success'
  };
  return map[status] || 'info';
}

async function loadAssessment() {
  loading.value = true;
  try {
    assessment.value = await fetchAssessment(route.params.id as string);
    if (!assessment.value) {
      ElMessage.error(t('errors.notFound'));
      router.push('/finance/zakaat');
    }
  } finally {
    loading.value = false;
  }
}

async function handleCalculate() {
  if (!assessment.value) return;
  calculating.value = true;
  try {
    const res = await calculateZakaat(assessment.value.id);
    if (res.success) {
      ElMessage.success(t('zakaat.calculateSuccess'));
      await loadAssessment();
    } else {
      ElMessage.error(res.message || t('errors.generic'));
    }
  } finally {
    calculating.value = false;
  }
}

async function handleSubmitAssessment() {
  if (!assessment.value) return;
  try {
    const res = await updateAssessment(assessment.value.id, { status: 'SUBMITTED' } as any);
    if (res.success) {
      ElMessage.success(t('zakaat.submitSuccess'));
      await loadAssessment();
    }
  } catch {
    ElMessage.error(t('errors.generic'));
  }
}

async function handleMarkPaid() {
  if (!assessment.value) return;
  try {
    const res = await updateAssessment(assessment.value.id, {
      status: 'PAID',
      paidAt: new Date().toISOString()
    } as any);
    if (res.success) {
      ElMessage.success(t('zakaat.paidSuccess'));
      await loadAssessment();
    }
  } catch {
    ElMessage.error(t('errors.generic'));
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(amount || 0);
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

onMounted(loadAssessment);
</script>
