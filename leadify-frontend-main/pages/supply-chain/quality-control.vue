<template lang="pug">
.quality-control-page.p-6(class="md:p-8")
  //- ╔══════════════════════════════════════════════════════════╗
  //- ║  Page Header                                             ║
  //- ╚══════════════════════════════════════════════════════════╝
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-4
        .header-icon-wrapper
          Icon(name="ph:seal-check-bold" size="28" style="color: #fff")
        div
          h2.text-3xl.font-bold.mb-1.bg-clip-text.text-transparent.bg-gradient-to-r.from-green-400.to-emerald-400
            | {{ t('qualityControl.title') }}
          p(style="color: var(--text-muted)") {{ t('qualityControl.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-button(type="primary" @click="refreshData" :loading="loading")
          Icon(name="ph:arrow-clockwise-bold" size="16")
          span.ml-2 {{ t('qualityControl.refresh') }}
        el-button(@click="exportReport")
          Icon(name="ph:download-simple-bold" size="16")
          span.ml-2 {{ t('qualityControl.export') }}

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="40" style="color: #22c55e")

  template(v-else)
    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  KPI Cards                                               ║
    //- ╚══════════════════════════════════════════════════════════╝
    .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
      .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
        .flex.items-start.justify-between
          div
            p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
            p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
            .flex.items-center.gap-1.mt-2
              Icon(:name="kpi.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }")
              span.text-xs.font-semibold(:style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ `${kpi.trend >= 0 ? '+' : ''}${kpi.trend}%` }}
          .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  Tabs                                                    ║
    //- ╚══════════════════════════════════════════════════════════╝
    el-tabs(v-model="activeTab" class="qc-tabs")

      //- ────────────────────────────────────────────────────────
      //- Tab 1: Inspections
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('qualityControl.inspections')" name="inspections")
        .glass-card.p-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:clipboard-text-bold" size="22" style="color: #3b82f6")
              | {{ t('qualityControl.inspections') }}
            el-button(type="primary" @click="showNewInspectionDialog = true")
              Icon(name="ph:plus-bold" size="16")
              span.ml-2 {{ t('qualityControl.newInspection') }}

          //- Filters
          .flex.items-center.gap-3.flex-wrap.mb-6
            el-input(
              v-model="inspectionSearch"
              :placeholder="t('qualityControl.search')"
              prefix-icon="Search"
              size="default"
              clearable
              style="width: 240px"
            )
            el-select(v-model="inspectionTypeFilter" size="default" style="width: 160px" :placeholder="t('qualityControl.type')" clearable)
              el-option(:label="t('qualityControl.incoming')" value="Incoming")
              el-option(:label="t('qualityControl.inProcess')" value="In-Process")
              el-option(:label="t('qualityControl.final')" value="Final")
              el-option(:label="t('qualityControl.random')" value="Random")
            el-select(v-model="inspectionStatusFilter" size="default" style="width: 160px" :placeholder="t('qualityControl.status')" clearable)
              el-option(:label="t('qualityControl.passed')" value="Passed")
              el-option(:label="t('qualityControl.failed')" value="Failed")
              el-option(:label="t('qualityControl.pending')" value="Pending")

          //- Inspections Table
          el-table(
            :data="filteredInspections"
            stripe
            style="width: 100%"
            max-height="600"
          )
            el-table-column(prop="id" :label="t('qualityControl.inspectionId')" min-width="130")
              template(#default="{ row }")
                span.font-semibold(style="color: #3b82f6") {{ row.id }}
            el-table-column(:label="t('qualityControl.productBatch')" min-width="180")
              template(#default="{ row }")
                div
                  p.font-medium {{ row.product }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.batch }}
            el-table-column(prop="inspector" :label="t('qualityControl.inspector')" min-width="140")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  .inspector-avatar
                    | {{ row.inspector.charAt(0) }}
                  span {{ row.inspector }}
            el-table-column(:label="t('qualityControl.type')" min-width="120")
              template(#default="{ row }")
                el-tag(
                  :type="getInspectionTypeTag(row.type)"
                  size="small"
                  effect="plain"
                ) {{ row.type }}
            el-table-column(:label="t('qualityControl.status')" min-width="110")
              template(#default="{ row }")
                el-tag(
                  :type="getStatusTagType(row.status)"
                  size="small"
                  effect="dark"
                ) {{ row.status }}
            el-table-column(prop="date" :label="t('qualityControl.date')" min-width="120")
            el-table-column(:label="t('qualityControl.score')" min-width="150")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  el-progress(
                    :percentage="row.score"
                    :stroke-width="8"
                    :color="getScoreColor(row.score)"
                    style="flex: 1"
                  )
                  span.text-xs.font-semibold(:style="{ color: getScoreColor(row.score) }") {{ `${row.score}%` }}
            el-table-column(:label="t('qualityControl.actions')" min-width="100" align="center")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-2
                  el-tooltip(:content="t('qualityControl.viewDetails')")
                    el-button(circle size="small" @click="viewInspection(row)")
                      Icon(name="ph:eye-bold" size="14")
                  el-tooltip(:content="t('qualityControl.downloadReport')")
                    el-button(circle size="small" @click="downloadInspectionReport(row)")
                      Icon(name="ph:file-pdf-bold" size="14")

      //- ────────────────────────────────────────────────────────
      //- Tab 2: Defect Tracker
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('qualityControl.defectTracker')" name="defects")
        //- Defect Cards Grid
        .grid.gap-5.mb-8(class="grid-cols-1 md:grid-cols-2 xl:grid-cols-3")
          .defect-card(v-for="(defect, idx) in defectRecords" :key="idx")
            .flex.items-center.justify-between.mb-3
              el-tag(
                :type="getSeverityTagType(defect.severity)"
                size="small"
                effect="dark"
              ) {{ defect.severity }}
              el-tag(
                :type="getDefectStatusType(defect.status)"
                size="small"
                effect="plain"
              ) {{ defect.status }}
            h4.font-semibold.mb-2(style="color: var(--text-primary)") {{ defect.product }}
            .space-y-2.text-sm
              .flex.items-center.gap-2
                Icon(name="ph:warning-circle-bold" size="14" style="color: var(--text-muted)")
                span(style="color: var(--text-muted)") {{ defect.defectType }}
              .flex.items-center.gap-2
                Icon(name="ph:user-bold" size="14" style="color: var(--text-muted)")
                span(style="color: var(--text-muted)") {{ `${t('qualityControl.reportedBy')}: ${defect.reportedBy}` }}
              .flex.items-center.gap-2
                Icon(name="ph:user-focus-bold" size="14" style="color: var(--text-muted)")
                span(style="color: var(--text-muted)") {{ `${t('qualityControl.assignedTo')}: ${defect.assignedTo}` }}
            .flex.items-center.justify-between.mt-3.pt-3(style="border-top: 1px solid var(--border-default)")
              span.text-xs(style="color: var(--text-muted)") {{ defect.date }}
              .flex.items-center.gap-1(v-if="defect.images > 0")
                Icon(name="ph:image-bold" size="14" style="color: #3b82f6")
                el-badge(:value="defect.images" type="primary")
                  span.text-xs(style="color: #3b82f6") {{ t('qualityControl.images') }}

        //- Charts Row
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          .glass-card.p-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:chart-line-up-bold" size="22" style="color: #ef4444")
              | {{ t('qualityControl.defectTrend') }}
            ClientOnly
              VChart.w-full(:option="defectTrendChartOption" :style="{ height: '320px' }" autoresize)

          .glass-card.p-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:chart-pie-bold" size="22" style="color: #8b5cf6")
              | {{ t('qualityControl.categoryBreakdown') }}
            ClientOnly
              VChart.w-full(:option="defectCategoryChartOption" :style="{ height: '320px' }" autoresize)

      //- ────────────────────────────────────────────────────────
      //- Tab 3: Checklists
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('qualityControl.checklists')" name="checklists")
        .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
          h3.section-title
            Icon.mr-2(name="ph:list-checks-bold" size="22" style="color: #22c55e")
            | {{ t('qualityControl.checklists') }}
          el-button(type="primary" @click="showChecklistDialog = true")
            Icon(name="ph:plus-bold" size="16")
            span.ml-2 {{ t('qualityControl.createTemplate') }}

        .grid.gap-5(class="grid-cols-1 md:grid-cols-2 xl:grid-cols-3")
          .checklist-card(v-for="(checklist, idx) in checklistTemplates" :key="idx")
            .flex.items-center.justify-between.mb-3
              .flex.items-center.gap-2
                .checklist-icon-wrapper(:style="{ background: checklist.color + '18' }")
                  Icon(name="ph:list-checks-bold" size="18" :style="{ color: checklist.color }")
                h4.font-semibold(style="color: var(--text-primary)") {{ checklist.name }}
              el-dropdown(trigger="click")
                el-button(circle size="small")
                  Icon(name="ph:dots-three-vertical-bold" size="14")
                template(#dropdown)
                  el-dropdown-menu
                    el-dropdown-item {{ t('qualityControl.edit') }}
                    el-dropdown-item {{ t('qualityControl.duplicate') }}
                    el-dropdown-item(divided) {{ t('qualityControl.delete') }}
            .flex.items-center.gap-3.mb-3
              el-tag(size="small" effect="plain") {{ checklist.category }}
            .space-y-2.text-sm
              .flex.items-center.gap-2
                Icon(name="ph:check-square-bold" size="14" style="color: var(--text-muted)")
                span(style="color: var(--text-muted)") {{ `${checklist.itemCount} ${t('qualityControl.criteria')}` }}
              .flex.items-center.gap-2
                Icon(name="ph:calendar-bold" size="14" style="color: var(--text-muted)")
                span(style="color: var(--text-muted)") {{ `${t('qualityControl.lastUsed')}: ${checklist.lastUsed}` }}
              .flex.items-center.gap-2
                Icon(name="ph:hash-bold" size="14" style="color: var(--text-muted)")
                span(style="color: var(--text-muted)") {{ `${t('qualityControl.timesUsed')}: ${checklist.timesUsed}` }}
            .mt-4
              el-button(size="small" type="primary" plain @click="useChecklist(checklist)" class="!w-full !rounded-xl")
                Icon.mr-1(name="ph:play-bold" size="14")
                | {{ t('qualityControl.useTemplate') }}

      //- ────────────────────────────────────────────────────────
      //- Tab 4: Analytics
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('qualityControl.analytics')" name="analytics")
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          //- Pass Rate Trend
          .glass-card.p-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:chart-line-bold" size="22" style="color: #22c55e")
              | {{ t('qualityControl.passRateTrend') }}
            ClientOnly
              VChart.w-full(:option="passRateTrendChartOption" :style="{ height: '340px' }" autoresize)

          //- Defect Pareto
          .glass-card.p-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:chart-bar-bold" size="22" style="color: #f59e0b")
              | {{ t('qualityControl.defectPareto') }}
            ClientOnly
              VChart.w-full(:option="defectParetoChartOption" :style="{ height: '340px' }" autoresize)

          //- Inspector Performance
          .glass-card.p-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:users-bold" size="22" style="color: #3b82f6")
              | {{ t('qualityControl.inspectorPerformance') }}
            ClientOnly
              VChart.w-full(:option="inspectorPerformanceChartOption" :style="{ height: '340px' }" autoresize)

          //- Quality Cost Breakdown
          .glass-card.p-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:currency-circle-dollar-bold" size="22" style="color: #8b5cf6")
              | {{ t('qualityControl.qualityCostBreakdown') }}
            ClientOnly
              VChart.w-full(:option="qualityCostChartOption" :style="{ height: '340px' }" autoresize)

    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  New Inspection Dialog                                    ║
    //- ╚══════════════════════════════════════════════════════════╝
    el-dialog(
      v-model="showNewInspectionDialog"
      :title="t('qualityControl.newInspection')"
      width="600px"
      :close-on-click-modal="false"
    )
      el-form(:model="newInspectionForm" label-position="top")
        el-form-item(:label="t('qualityControl.productName')")
          el-input(v-model="newInspectionForm.product" :placeholder="t('qualityControl.enterProductName')")
        el-form-item(:label="t('qualityControl.batch')")
          el-input(v-model="newInspectionForm.batch" :placeholder="t('qualityControl.enterBatchNumber')")
        el-form-item(:label="t('qualityControl.inspector')")
          el-select(v-model="newInspectionForm.inspector" style="width: 100%" :placeholder="t('qualityControl.selectInspector')")
            el-option(v-for="insp in inspectorList" :key="insp" :label="insp" :value="insp")
        el-form-item(:label="t('qualityControl.type')")
          el-select(v-model="newInspectionForm.type" style="width: 100%" :placeholder="t('qualityControl.selectType')")
            el-option(:label="t('qualityControl.incoming')" value="Incoming")
            el-option(:label="t('qualityControl.inProcess')" value="In-Process")
            el-option(:label="t('qualityControl.final')" value="Final")
            el-option(:label="t('qualityControl.random')" value="Random")
        el-form-item(:label="t('qualityControl.checklistTemplate')")
          el-select(v-model="newInspectionForm.checklist" style="width: 100%" :placeholder="t('qualityControl.selectChecklist')")
            el-option(v-for="cl in checklistTemplates" :key="cl.name" :label="cl.name" :value="cl.name")
        el-form-item(:label="t('qualityControl.notes')")
          el-input(v-model="newInspectionForm.notes" type="textarea" :rows="3" :placeholder="t('qualityControl.enterNotes')")
      template(#footer)
        .flex.justify-end.gap-3
          el-button(@click="showNewInspectionDialog = false") {{ t('qualityControl.cancel') }}
          el-button(type="primary" @click="submitInspection") {{ t('qualityControl.save') }}

    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  Create Checklist Template Dialog                         ║
    //- ╚══════════════════════════════════════════════════════════╝
    el-dialog(
      v-model="showChecklistDialog"
      :title="t('qualityControl.createTemplate')"
      width="700px"
      :close-on-click-modal="false"
    )
      el-form(:model="newChecklistForm" label-position="top")
        .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
          el-form-item(:label="t('qualityControl.templateName')")
            el-input(v-model="newChecklistForm.name" :placeholder="t('qualityControl.enterTemplateName')")
          el-form-item(:label="t('qualityControl.category')")
            el-select(v-model="newChecklistForm.category" style="width: 100%" :placeholder="t('qualityControl.selectCategory')")
              el-option(:label="$t('qualityControl.manufacturing')" value="Manufacturing")
              el-option(:label="$t('qualityControl.packaging')" value="Packaging")
              el-option(:label="$t('qualityControl.safety')" value="Safety")
              el-option(:label="$t('qualityControl.compliance')" value="Compliance")
              el-option(:label="$t('qualityControl.environmental')" value="Environmental")

        //- Checklist Items
        .mb-4
          .flex.items-center.justify-between.mb-3
            span.font-semibold(style="color: var(--text-primary)") {{ t('qualityControl.checklistItems') }}
            el-button(size="small" type="primary" plain @click="addChecklistItem")
              Icon(name="ph:plus-bold" size="14")
              span.ml-1 {{ t('qualityControl.addItem') }}

          .checklist-item-row(v-for="(item, idx) in newChecklistForm.items" :key="idx")
            .grid.gap-3.items-end(class="grid-cols-12")
              .col-span-6
                el-input(
                  v-model="item.criteria"
                  :placeholder="t('qualityControl.enterCriteria')"
                  size="default"
                )
              .col-span-3
                el-select(v-model="item.resultType" size="default" style="width: 100%")
                  el-option(:label="$t('qualityControl.passFail')" value="pass-fail")
                  el-option(:label="$t('qualityControl.passFailNa')" value="pass-fail-na")
                  el-option(:label="$t('qualityControl.numeric')" value="numeric")
              .col-span-2
                el-input-number(
                  v-model="item.weight"
                  :min="1"
                  :max="10"
                  size="default"
                  style="width: 100%"
                  controls-position="right"
                )
              .col-span-1.flex.justify-center
                el-button(
                  circle
                  size="small"
                  type="danger"
                  plain
                  @click="removeChecklistItem(idx)"
                  :disabled="newChecklistForm.items.length <= 1"
                )
                  Icon(name="ph:trash-bold" size="14")

      template(#footer)
        .flex.justify-end.gap-3
          el-button(@click="showChecklistDialog = false") {{ t('qualityControl.cancel') }}
          el-button(type="primary" @click="submitChecklist") {{ t('qualityControl.save') }}
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { graphic } from 'echarts/core';
import VChart from 'vue-echarts';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Quality Control' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const loading = ref(true);
const activeTab = ref('inspections');
const inspectionSearch = ref('');
const inspectionTypeFilter = ref('');
const inspectionStatusFilter = ref('');
const showNewInspectionDialog = ref(false);
const showChecklistDialog = ref(false);

// ─── Tooltip Style ──────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.92)',
  borderColor: 'rgba(34, 197, 94, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => [
  {
    label: t('qualityControl.passRate'),
    value: '96.4%',
    icon: 'ph:check-circle-bold',
    color: '#22c55e',
    trend: 2.1
  },
  {
    label: t('qualityControl.openDefects'),
    value: '23',
    icon: 'ph:bug-bold',
    color: '#ef4444',
    trend: -5.3
  },
  {
    label: t('qualityControl.inspectionsToday'),
    value: '18',
    icon: 'ph:clipboard-text-bold',
    color: '#3b82f6',
    trend: 12.5
  },
  {
    label: t('qualityControl.avgResolutionTime'),
    value: '2.4 days',
    icon: 'ph:clock-bold',
    color: '#f59e0b',
    trend: -8.7
  }
]);

// ─── Inspector List ─────────────────────────────────────────
const inspectorList = ['Ahmed Al-Rashid', 'Sarah Johnson', 'Omar Khalil', 'Maria Santos', 'James Chen', 'Fatima Al-Sayed'];

// ─── Inspection Records (fallback mock data) ────────────────
const inspectionRecordsFallback = [
  {
    id: 'INS-2026-001',
    product: 'Steel Beam Grade A',
    batch: 'BTH-4521',
    inspector: 'Ahmed Al-Rashid',
    type: 'Incoming',
    status: 'Passed',
    date: '2026-02-28',
    score: 98
  },
  {
    id: 'INS-2026-002',
    product: 'Copper Wire 12mm',
    batch: 'BTH-4522',
    inspector: 'Sarah Johnson',
    type: 'In-Process',
    status: 'Passed',
    date: '2026-02-28',
    score: 95
  },
  {
    id: 'INS-2026-003',
    product: 'Hydraulic Pump Unit',
    batch: 'BTH-4523',
    inspector: 'Omar Khalil',
    type: 'Final',
    status: 'Failed',
    date: '2026-02-27',
    score: 62
  },
  {
    id: 'INS-2026-004',
    product: 'LED Panel 60W',
    batch: 'BTH-4524',
    inspector: 'Maria Santos',
    type: 'Incoming',
    status: 'Passed',
    date: '2026-02-27',
    score: 97
  },
  {
    id: 'INS-2026-005',
    product: 'Carbon Fiber Sheet',
    batch: 'BTH-4525',
    inspector: 'James Chen',
    type: 'Random',
    status: 'Pending',
    date: '2026-02-27',
    score: 0
  },
  {
    id: 'INS-2026-006',
    product: 'Aluminum Extrusion',
    batch: 'BTH-4526',
    inspector: 'Fatima Al-Sayed',
    type: 'In-Process',
    status: 'Passed',
    date: '2026-02-26',
    score: 91
  },
  {
    id: 'INS-2026-007',
    product: 'Titanium Bolts M10',
    batch: 'BTH-4527',
    inspector: 'Ahmed Al-Rashid',
    type: 'Final',
    status: 'Passed',
    date: '2026-02-26',
    score: 99
  },
  {
    id: 'INS-2026-008',
    product: 'PVC Insulation Roll',
    batch: 'BTH-4528',
    inspector: 'Sarah Johnson',
    type: 'Incoming',
    status: 'Failed',
    date: '2026-02-25',
    score: 54
  },
  {
    id: 'INS-2026-009',
    product: 'Stainless Steel Pipe',
    batch: 'BTH-4529',
    inspector: 'Omar Khalil',
    type: 'Random',
    status: 'Passed',
    date: '2026-02-25',
    score: 88
  },
  {
    id: 'INS-2026-010',
    product: 'Ceramic Bearings Kit',
    batch: 'BTH-4530',
    inspector: 'Maria Santos',
    type: 'In-Process',
    status: 'Passed',
    date: '2026-02-24',
    score: 94
  },
  {
    id: 'INS-2026-011',
    product: 'Glass Fiber Composite',
    batch: 'BTH-4531',
    inspector: 'James Chen',
    type: 'Final',
    status: 'Pending',
    date: '2026-02-24',
    score: 0
  },
  {
    id: 'INS-2026-012',
    product: 'Rubber Gasket Set',
    batch: 'BTH-4532',
    inspector: 'Fatima Al-Sayed',
    type: 'Incoming',
    status: 'Passed',
    date: '2026-02-23',
    score: 96
  }
];

const inspectionRecords = ref<Record<string, unknown>[]>([]);

const filteredInspections = computed(() => {
  let items = inspectionRecords.value;

  if (inspectionTypeFilter.value) {
    items = items.filter(i => i.type === inspectionTypeFilter.value);
  }

  if (inspectionStatusFilter.value) {
    items = items.filter(i => i.status === inspectionStatusFilter.value);
  }

  if (inspectionSearch.value) {
    const q = inspectionSearch.value.toLowerCase();
    items = items.filter(
      i =>
        i.id.toLowerCase().includes(q) ||
        i.product.toLowerCase().includes(q) ||
        i.batch.toLowerCase().includes(q) ||
        i.inspector.toLowerCase().includes(q)
    );
  }

  return items;
});

// ─── Defect Records (mock with API fallback) ────────────────
const defectRecordsFallback = [
  {
    id: 'DEF-001',
    product: 'Hydraulic Pump Unit',
    defectType: 'Seal Leakage',
    severity: 'Critical',
    reportedBy: 'Omar Khalil',
    assignedTo: 'Ahmed Al-Rashid',
    status: 'Open',
    date: '2026-02-27',
    images: 3
  },
  {
    id: 'DEF-002',
    product: 'PVC Insulation Roll',
    defectType: 'Surface Contamination',
    severity: 'Major',
    reportedBy: 'Sarah Johnson',
    assignedTo: 'James Chen',
    status: 'In Progress',
    date: '2026-02-25',
    images: 2
  },
  {
    id: 'DEF-003',
    product: 'Steel Beam Grade A',
    defectType: 'Dimensional Deviation',
    severity: 'Minor',
    reportedBy: 'Ahmed Al-Rashid',
    assignedTo: 'Omar Khalil',
    status: 'Resolved',
    date: '2026-02-22',
    images: 1
  },
  {
    id: 'DEF-004',
    product: 'Copper Wire 12mm',
    defectType: 'Tensile Strength Failure',
    severity: 'Critical',
    reportedBy: 'Maria Santos',
    assignedTo: 'Sarah Johnson',
    status: 'In Progress',
    date: '2026-02-26',
    images: 4
  },
  {
    id: 'DEF-005',
    product: 'LED Panel 60W',
    defectType: 'Color Temperature Drift',
    severity: 'Minor',
    reportedBy: 'James Chen',
    assignedTo: 'Fatima Al-Sayed',
    status: 'Open',
    date: '2026-02-28',
    images: 0
  },
  {
    id: 'DEF-006',
    product: 'Carbon Fiber Sheet',
    defectType: 'Delamination',
    severity: 'Major',
    reportedBy: 'Fatima Al-Sayed',
    assignedTo: 'Maria Santos',
    status: 'Open',
    date: '2026-02-27',
    images: 5
  },
  {
    id: 'DEF-007',
    product: 'Aluminum Extrusion',
    defectType: 'Surface Scratch',
    severity: 'Minor',
    reportedBy: 'Omar Khalil',
    assignedTo: 'James Chen',
    status: 'Resolved',
    date: '2026-02-20',
    images: 2
  },
  {
    id: 'DEF-008',
    product: 'Rubber Gasket Set',
    defectType: 'Hardness Out of Spec',
    severity: 'Major',
    reportedBy: 'Ahmed Al-Rashid',
    assignedTo: 'Omar Khalil',
    status: 'In Progress',
    date: '2026-02-24',
    images: 1
  },
  {
    id: 'DEF-009',
    product: 'Stainless Steel Pipe',
    defectType: 'Weld Porosity',
    severity: 'Critical',
    reportedBy: 'Sarah Johnson',
    assignedTo: 'Ahmed Al-Rashid',
    status: 'Open',
    date: '2026-02-28',
    images: 3
  }
];

const defectRecords = ref<Record<string, unknown>[]>([]);

// ─── Checklist Templates (mock with API fallback) ───────────
const checklistTemplatesFallback = [
  { name: 'Incoming Material Inspection', category: 'Manufacturing', itemCount: 15, lastUsed: '2026-02-28', timesUsed: 142, color: '#3b82f6' },
  { name: 'Final Product QA', category: 'Manufacturing', itemCount: 22, lastUsed: '2026-02-27', timesUsed: 98, color: '#22c55e' },
  { name: 'Packaging Integrity Check', category: 'Packaging', itemCount: 10, lastUsed: '2026-02-26', timesUsed: 76, color: '#f59e0b' },
  { name: 'Safety Compliance Audit', category: 'Safety', itemCount: 28, lastUsed: '2026-02-25', timesUsed: 34, color: '#ef4444' },
  { name: 'Environmental Standards', category: 'Environmental', itemCount: 18, lastUsed: '2026-02-22', timesUsed: 21, color: '#8b5cf6' },
  { name: 'Regulatory Compliance', category: 'Compliance', itemCount: 32, lastUsed: '2026-02-20', timesUsed: 45, color: '#06b6d4' }
];

const checklistTemplates = ref<Record<string, unknown>[]>([]);

// ─── New Inspection Form ────────────────────────────────────
const newInspectionForm = ref({
  product: '',
  batch: '',
  inspector: '',
  type: '',
  checklist: '',
  notes: ''
});

// ─── New Checklist Form ─────────────────────────────────────
const newChecklistForm = ref({
  name: '',
  category: '',
  items: [{ criteria: '', resultType: 'pass-fail', weight: 1 }]
});

function addChecklistItem() {
  newChecklistForm.value.items.push({ criteria: '', resultType: 'pass-fail', weight: 1 });
}

function removeChecklistItem(idx: number) {
  if (newChecklistForm.value.items.length > 1) {
    newChecklistForm.value.items.splice(idx, 1);
  }
}

// ─── Chart: Defect Trend (30 days) ──────────────────────────
const defectTrendChartOption = computed(() => {
  const days: string[] = [];
  const values: number[] = [];
  const now = new Date(2026, 1, 28);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    days.push(label);
    values.push(Math.floor(Math.random() * 6) + 1);
  }

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle
    },
    grid: { top: 20, right: 20, bottom: 30, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      boundaryGap: false,
      axisLabel: { color: '#94a3b8', fontSize: 10, interval: 4 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    series: [
      {
        name: t('qualityControl.defectsFound'),
        type: 'line',
        data: values,
        smooth: true,
        lineStyle: { width: 3, color: '#ef4444' },
        itemStyle: { color: '#ef4444' },
        symbol: 'circle',
        symbolSize: 4,
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.25)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
          ])
        },
        animationDuration: 1200
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Chart: Defect Category Breakdown ───────────────────────
const defectCategoryChartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      ...tooltipStyle
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#94a3b8', fontSize: 12 },
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 14
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.3)' }
        },
        data: [
          { value: 8, name: t('qualityControl.surfaceDefects'), itemStyle: { color: '#ef4444' } },
          { value: 6, name: t('qualityControl.dimensionalIssues'), itemStyle: { color: '#f59e0b' } },
          { value: 4, name: t('qualityControl.materialFlaws'), itemStyle: { color: '#3b82f6' } },
          { value: 3, name: t('qualityControl.mechanicalFailure'), itemStyle: { color: '#8b5cf6' } },
          { value: 2, name: t('qualityControl.electricalDefects'), itemStyle: { color: '#22c55e' } }
        ],
        animationDuration: 1200,
        animationEasing: 'cubicOut'
      }
    ]
  };
});

// ─── Chart: Pass Rate Trend (30 days) ───────────────────────
const passRateTrendChartOption = computed(() => {
  const days: string[] = [];
  const values: number[] = [];
  const now = new Date(2026, 1, 28);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    days.push(label);
    values.push(Math.round((92 + Math.random() * 7) * 10) / 10);
  }

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: unknown) => {
        const p = params[0];
        return `<strong>${p.name}</strong><br/>${t('qualityControl.passRate')}: <strong>${p.value}%</strong>`;
      }
    },
    grid: { top: 20, right: 20, bottom: 30, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      boundaryGap: false,
      axisLabel: { color: '#94a3b8', fontSize: 10, interval: 4 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 85,
      max: 100,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: (v: number) => `${v}%`
      }
    },
    series: [
      {
        name: t('qualityControl.passRate'),
        type: 'line',
        data: values,
        smooth: true,
        lineStyle: { width: 3, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
        symbol: 'circle',
        symbolSize: 4,
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 197, 94, 0.30)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0.02)' }
          ])
        },
        markLine: {
          silent: true,
          data: [
            {
              yAxis: 95,
              label: { formatter: 'Target 95%', color: '#94a3b8', fontSize: 10 },
              lineStyle: { color: '#f59e0b', type: 'dashed', width: 1 }
            }
          ]
        },
        animationDuration: 1200
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Chart: Defect Pareto (bar + cumulative line, dual y-axis) ──
const defectParetoChartOption = computed(() => {
  const categories = ['Surface Defects', 'Dimensional', 'Material Flaws', 'Mechanical', 'Electrical', 'Contamination', 'Packaging'];
  const counts = [34, 28, 19, 14, 9, 6, 3];
  const total = counts.reduce((s, v) => s + v, 0);
  const cumulative: number[] = [];
  let running = 0;
  counts.forEach(c => {
    running += c;
    cumulative.push(Math.round((running / total) * 1000) / 10);
  });

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: [t('qualityControl.defectCount'), t('qualityControl.cumulativePercent')],
      textStyle: { color: '#94a3b8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 20
    },
    grid: { top: 30, right: 40, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 15, interval: 0 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: t('qualityControl.count'),
        nameTextStyle: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      {
        type: 'value',
        name: '%',
        nameTextStyle: { color: '#94a3b8', fontSize: 10 },
        min: 0,
        max: 100,
        splitLine: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
          formatter: (v: number) => `${v}%`
        }
      }
    ],
    series: [
      {
        name: t('qualityControl.defectCount'),
        type: 'bar',
        data: counts,
        barWidth: 28,
        itemStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f59e0b' },
            { offset: 1, color: '#d97706' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        animationDuration: 1000
      },
      {
        name: t('qualityControl.cumulativePercent'),
        type: 'line',
        yAxisIndex: 1,
        data: cumulative,
        smooth: true,
        lineStyle: { width: 2, color: '#ef4444' },
        itemStyle: { color: '#ef4444' },
        symbol: 'circle',
        symbolSize: 6,
        animationDuration: 1200
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Chart: Inspector Performance (horizontal bar) ──────────
const inspectorPerformanceChartOption = computed(() => {
  const inspectors = ['Fatima Al-Sayed', 'Ahmed Al-Rashid', 'Maria Santos', 'James Chen', 'Sarah Johnson', 'Omar Khalil'];
  const passRates = [98.2, 97.5, 96.8, 95.4, 94.1, 92.7];
  const inspectionsConducted = [145, 198, 167, 132, 178, 156];

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const idx = params[0]?.dataIndex ?? 0;
        const inspector = inspectors[idx];
        const rate = passRates[idx];
        const count = inspectionsConducted[idx];
        return `<strong>${inspector}</strong><br/>${t('qualityControl.passRate')}: <strong>${rate}%</strong><br/>${t('qualityControl.totalInspections')}: <strong>${count}</strong>`;
      }
    },
    grid: { top: 10, right: 40, bottom: 20, left: 10, containLabel: true },
    xAxis: {
      type: 'value',
      min: 85,
      max: 100,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: (v: number) => `${v}%`
      }
    },
    yAxis: {
      type: 'category',
      data: inspectors,
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisTick: { show: false }
    },
    series: [
      {
        name: t('qualityControl.passRate'),
        type: 'bar',
        data: passRates.map((rate, idx) => ({
          value: rate,
          itemStyle: {
            color: new graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: rate >= 96 ? '#16a34a' : rate >= 94 ? '#f59e0b' : '#ef4444' },
              { offset: 1, color: rate >= 96 ? '#22c55e' : rate >= 94 ? '#fbbf24' : '#f87171' }
            ]),
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barWidth: 18,
        label: {
          show: true,
          position: 'right',
          color: '#94a3b8',
          fontSize: 11,
          formatter: (params: unknown) => `${params.value}%`
        },
        animationDuration: 1000
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Chart: Quality Cost Breakdown (doughnut) ───────────────
const qualityCostChartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      ...tooltipStyle,
      formatter: (params: unknown) => {
        return `<strong>${params.name}</strong><br/>${t('qualityControl.cost')}: <strong>$${params.value.toLocaleString()}</strong><br/>${t('qualityControl.share')}: <strong>${params.percent}%</strong>`;
      }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#94a3b8', fontSize: 12 },
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 14
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            return `{total|$184K}\n{label|${t('qualityControl.totalCost')}}`;
          },
          rich: {
            total: { fontSize: 22, fontWeight: 'bold', color: '#fff', lineHeight: 30 },
            label: { fontSize: 12, color: '#94a3b8', lineHeight: 20 }
          }
        },
        emphasis: {
          label: { show: true },
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.3)' }
        },
        data: [
          { value: 52000, name: t('qualityControl.prevention'), itemStyle: { color: '#22c55e' } },
          { value: 78000, name: t('qualityControl.appraisal'), itemStyle: { color: '#3b82f6' } },
          { value: 54000, name: t('qualityControl.failure'), itemStyle: { color: '#ef4444' } }
        ],
        animationDuration: 1200,
        animationEasing: 'cubicOut'
      }
    ]
  };
});

// ─── Helpers ────────────────────────────────────────────────
function getInspectionTypeTag(type: string): string {
  const map: Record<string, string> = {
    Incoming: 'primary',
    'In-Process': 'warning',
    Final: 'success',
    Random: 'info'
  };
  return map[type] || 'info';
}

function getStatusTagType(status: string): string {
  const map: Record<string, string> = {
    Passed: 'success',
    Failed: 'danger',
    Pending: 'warning'
  };
  return map[status] || 'info';
}

function getSeverityTagType(severity: string): string {
  const map: Record<string, string> = {
    Critical: 'danger',
    Major: 'warning',
    Minor: 'info'
  };
  return map[severity] || 'info';
}

function getDefectStatusType(status: string): string {
  const map: Record<string, string> = {
    Open: 'danger',
    'In Progress': 'warning',
    Resolved: 'success'
  };
  return map[status] || 'info';
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#f59e0b';
  if (score > 0) return '#ef4444';
  return '#94a3b8';
}

// ─── Data Loading ───────────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    // Load inspection records from manufacturing API
    const inspRes = await useApiFetch('manufacturing');
    if (inspRes.success && Array.isArray(inspRes.body)) {
      inspectionRecords.value = inspRes.body;
    } else {
      inspectionRecords.value = inspectionRecordsFallback;
    }
  } catch {
    inspectionRecords.value = inspectionRecordsFallback;
  }

  // Defect records: keep as mock (no dedicated API)
  defectRecords.value = defectRecordsFallback;

  // Checklist templates: keep as mock (no dedicated API)
  checklistTemplates.value = checklistTemplatesFallback;

  loading.value = false;
}

onMounted(() => {
  loadData();
});

// ─── Actions ────────────────────────────────────────────────
function refreshData() {
  loadData();
}

function exportReport() {
  ElMessage.success(t('qualityControl.exportStarted'));
}

function viewInspection(row: unknown) {
  ElMessage.info(`${t('qualityControl.viewingInspection')}: ${row.id}`);
}

function downloadInspectionReport(row: unknown) {
  ElMessage.success(`${t('qualityControl.downloadingReport')}: ${row.id}`);
}

function submitInspection() {
  showNewInspectionDialog.value = false;
  ElMessage.success(t('qualityControl.inspectionCreated'));
  newInspectionForm.value = { product: '', batch: '', inspector: '', type: '', checklist: '', notes: '' };
}

function submitChecklist() {
  showChecklistDialog.value = false;
  ElMessage.success(t('qualityControl.checklistCreated'));
  newChecklistForm.value = { name: '', category: '', items: [{ criteria: '', resultType: 'pass-fail', weight: 1 }] };
}

function useChecklist(checklist: unknown) {
  ElMessage.info(`${t('qualityControl.usingTemplate')}: ${checklist.name}`);
}
</script>

<style lang="scss" scoped>
.quality-control-page {
  animation: fadeInUp 0.6s ease-out;
  min-height: 100vh;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ─── Header ─────────────────────────────────────────────────
.header-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
}

// ─── Section Title ──────────────────────────────────────────
.section-title {
  display: flex;
  align-items: center;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

// ─── Glass Card ─────────────────────────────────────────────
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(34, 197, 94, 0.08);
  }
}

// ─── KPI Cards ──────────────────────────────────────────────
.kpi-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.3);
  }
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Tabs Styling ───────────────────────────────────────────
.qc-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    background: var(--border-default);
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted);
    font-weight: 500;
    font-size: 0.95rem;

    &.is-active {
      color: #22c55e;
      font-weight: 600;
    }

    &:hover {
      color: #22c55e;
    }
  }

  :deep(.el-tabs__active-bar) {
    background-color: #22c55e;
  }
}

// ─── Inspector Avatar ───────────────────────────────────────
.inspector-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

// ─── Defect Card ────────────────────────────────────────────
.defect-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: rgba(34, 197, 94, 0.3);
  }
}

// ─── Checklist Card ─────────────────────────────────────────
.checklist-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: rgba(34, 197, 94, 0.3);
  }
}

.checklist-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Checklist Item Row ─────────────────────────────────────
.checklist-item-row {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: rgba(34, 197, 94, 0.03);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(34, 197, 94, 0.2);
    background: rgba(34, 197, 94, 0.05);
  }
}
</style>
