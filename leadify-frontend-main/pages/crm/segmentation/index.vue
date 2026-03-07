<template lang="pug">
.segmentation-page.p-6(class="md:p-8")
  //- ════════════════════════════════════════════════════════
  //- Page Header
  //- ════════════════════════════════════════════════════════
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary)")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #7849ff, #a855f7)")
          Icon(name="ph:users-three-bold" size="22" style="color: white")
        span.bg-gradient-to-r.from-purple-400.to-violet-400.bg-clip-text.text-transparent {{ $t('segmentation.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('segmentation.subtitle') }}

    .flex.items-center.gap-3
      el-button(size="large" type="primary" class="!bg-[#7849ff] !border-none !rounded-xl" @click="showCreateSegmentDialog")
        Icon(name="ph:plus-bold" size="16")
        span.ml-2 {{ $t('segmentation.createSegment') }}
      el-button(size="large" class="!rounded-xl" @click="refreshData" :loading="loading")
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-2 {{ $t('segmentation.refresh') }}

  //- ════════════════════════════════════════════════════════
  //- KPI Stat Cards
  //- ════════════════════════════════════════════════════════
  .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
    .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
      .flex.items-start.justify-between
        div
          p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
          p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
          .flex.items-center.gap-1.mt-1
            Icon(:name="kpi.trendIcon" size="14" :style="{ color: kpi.trendColor }")
            span.text-xs.font-medium(:style="{ color: kpi.trendColor }") {{ kpi.trend }}
        .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
          Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

  //- ════════════════════════════════════════════════════════
  //- Main Tabs
  //- ════════════════════════════════════════════════════════
  el-tabs(v-model="activeTab" type="border-card" class="segmentation-tabs")

    //- ═══════════════════════════════════════════════════
    //- TAB 1: Segment Builder
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('segmentation.segmentBuilder')" name="builder")
      .flex.items-center.justify-between.mb-6
        h3.text-sm.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:funnel-bold" size="16" class="mr-2" style="color: #7849ff")
          | {{ $t('segmentation.visualRuleBuilder') }}
        .flex.items-center.gap-2
          el-button(size="small" @click="resetConditions" class="!rounded-lg")
            Icon(name="ph:arrow-counter-clockwise-bold" size="14")
            span.ml-1 {{ $t('segmentation.reset') }}

      //- Condition Groups
      .space-y-4.mb-6
        .condition-group(v-for="(group, gIdx) in conditionGroups" :key="gIdx")
          .glass-card
            //- Group Header
            .flex.items-center.justify-between.mb-4
              .flex.items-center.gap-2
                .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
                  Icon(name="ph:brackets-curly-bold" size="16" style="color: #7849ff")
                span.text-sm.font-bold(style="color: var(--text-primary)") {{ `${$t('segmentation.conditionGroup')} #${gIdx + 1}` }}
              .flex.items-center.gap-2
                el-button(
                  v-if="conditionGroups.length > 1"
                  size="small"
                  type="danger"
                  text
                  @click="removeGroup(gIdx)"
                )
                  Icon(name="ph:trash-bold" size="14")

            //- Condition Rows
            .space-y-3
              .condition-row(v-for="(condition, cIdx) in group.conditions" :key="cIdx")
                .flex.items-center.gap-3(class="flex-col sm:flex-row")
                  //- AND/OR Indicator (not for first condition)
                  .w-16.text-center(v-if="cIdx > 0")
                    el-tag(
                      :type="group.operator === 'AND' ? 'primary' : 'warning'"
                      effect="dark"
                      size="small"
                      round
                      class="cursor-pointer"
                      @click="toggleGroupOperator(gIdx)"
                    ) {{ group.operator }}
                  .w-16(v-else)
                    span.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('segmentation.where') }}

                  //- Field Select
                  el-select(
                    v-model="condition.field"
                    :placeholder="$t('segmentation.selectField')"
                    size="default"
                    style="width: 180px"
                    @change="onFieldChange(gIdx, cIdx)"
                  )
                    el-option(
                      v-for="field in availableFields"
                      :key="field.value"
                      :label="field.label"
                      :value="field.value"
                    )
                      .flex.items-center.gap-2
                        Icon(:name="field.icon" size="14" :style="{ color: field.color }")
                        | {{ field.label }}

                  //- Operator Select
                  el-select(
                    v-model="condition.operator"
                    :placeholder="$t('segmentation.selectOperator')"
                    size="default"
                    style="width: 160px"
                  )
                    el-option(
                      v-for="op in getOperatorsForField(condition.field)"
                      :key="op.value"
                      :label="op.label"
                      :value="op.value"
                    )

                  //- Value Input
                  el-input(
                    v-if="!isSelectValueType(condition.operator)"
                    v-model="condition.value"
                    :placeholder="$t('segmentation.enterValue')"
                    size="default"
                    style="width: 200px"
                    class="flex-1"
                  )
                  el-select(
                    v-else
                    v-model="condition.value"
                    :placeholder="$t('segmentation.selectValue')"
                    size="default"
                    style="width: 200px"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                  )
                    el-option(
                      v-for="val in getValuesForField(condition.field)"
                      :key="val"
                      :label="val"
                      :value="val"
                    )

                  //- Remove Condition Button
                  el-button(
                    v-if="group.conditions.length > 1"
                    size="small"
                    type="danger"
                    circle
                    text
                    @click="removeCondition(gIdx, cIdx)"
                  )
                    Icon(name="ph:x-bold" size="14")

            //- Add Condition Button
            .mt-4
              el-button(size="small" @click="addCondition(gIdx)" class="!rounded-lg")
                Icon(name="ph:plus-bold" size="14")
                span.ml-1 {{ $t('segmentation.addCondition') }}

        //- AND/OR Toggle Between Groups
        .flex.items-center.justify-center.my-2(v-if="conditionGroups.length > 0")
          .flex.items-center.gap-3
            .h-px.w-16(style="background: var(--border-color)")
            el-button-group
              el-button(
                size="small"
                :type="groupsOperator === 'AND' ? 'primary' : 'default'"
                @click="groupsOperator = 'AND'"
                class="!rounded-l-lg"
              ) AND
              el-button(
                size="small"
                :type="groupsOperator === 'OR' ? 'primary' : 'default'"
                @click="groupsOperator = 'OR'"
                class="!rounded-r-lg"
              ) OR
            .h-px.w-16(style="background: var(--border-color)")

        //- Add Group Button
        .flex.justify-center.mt-2
          el-button(size="default" @click="addGroup" class="!rounded-xl !border-dashed")
            Icon(name="ph:plus-circle-bold" size="16")
            span.ml-2 {{ $t('segmentation.addConditionGroup') }}

      //- Preview & Save Section
      .glass-card
        .flex.items-center.justify-between
          .flex.items-center.gap-4
            .flex.items-center.gap-2
              Icon(name="ph:eye-bold" size="18" style="color: #7849ff")
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('segmentation.livePreview') }}
            .flex.items-center.gap-2
              .w-3.h-3.rounded-full.animate-pulse(style="background: #22c55e")
              span.text-lg.font-bold(style="color: #22c55e") {{ previewCount.toLocaleString() }}
              span.text-sm(style="color: var(--text-muted)") {{ $t('segmentation.matchingContacts') }}
          .flex.items-center.gap-3
            el-button(@click="previewSegment" class="!rounded-xl")
              Icon(name="ph:magnifying-glass-bold" size="16")
              span.ml-1 {{ $t('segmentation.preview') }}
            el-button(type="primary" @click="showSaveDialog = true" class="!bg-[#7849ff] !border-none !rounded-xl")
              Icon(name="ph:floppy-disk-bold" size="16")
              span.ml-1 {{ $t('segmentation.saveSegment') }}

    //- ═══════════════════════════════════════════════════
    //- TAB 2: Segment List
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('segmentation.segmentList')" name="list")
      .flex.items-center.justify-between.mb-6
        .flex.items-center.gap-3
          el-input(
            v-model="segmentSearchQuery"
            :placeholder="$t('segmentation.searchSegments')"
            prefix-icon="Search"
            clearable
            style="width: 280px"
            size="default"
          )
          el-select(v-model="segmentTypeFilter" clearable :placeholder="$t('segmentation.filterByType')" size="default" style="width: 160px")
            el-option(:label="$t('segmentation.allTypes')" value="")
            el-option(:label="$t('segmentation.static')" value="static")
            el-option(:label="$t('segmentation.dynamic')" value="dynamic")
        .flex.items-center.gap-2
          el-button(size="default" @click="exportSegments" class="!rounded-xl")
            Icon(name="ph:download-simple-bold" size="16")
            span.ml-1 {{ $t('segmentation.export') }}

      .glass-card.overflow-hidden
        el-table(
          :data="filteredSegments"
          style="width: 100%"
          :row-class-name="'segment-table-row'"
          :header-cell-style="{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: '600', borderBottom: '1px solid var(--border-color)' }"
          :cell-style="{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }"
        )
          el-table-column(:label="$t('segmentation.segmentName')" prop="name" min-width="200" sortable)
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-lg.flex.items-center.justify-center(:style="{ background: row.color + '20' }")
                  Icon(:name="row.icon" size="18" :style="{ color: row.color }")
                div
                  p.text-sm.font-semibold {{ row.name }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.description }}

          el-table-column(:label="$t('segmentation.size')" prop="size" width="120" sortable align="center")
            template(#default="{ row }")
              span.text-sm.font-bold {{ row.size.toLocaleString() }}

          el-table-column(:label="$t('segmentation.growth')" prop="growth" width="120" sortable align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                Icon(
                  :name="row.growth >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'"
                  size="14"
                  :style="{ color: row.growth >= 0 ? '#22c55e' : '#ef4444' }"
                )
                span.text-sm.font-medium(:style="{ color: row.growth >= 0 ? '#22c55e' : '#ef4444' }") {{ row.growth > 0 ? '+' : '' }}{{ row.growth }}%

          el-table-column(:label="$t('segmentation.type')" prop="type" width="120" align="center")
            template(#default="{ row }")
              el-tag(
                :type="row.type === 'dynamic' ? '' : 'success'"
                size="small"
                effect="dark"
                round
              ) {{ row.type === 'dynamic' ? $t('segmentation.dynamic') : $t('segmentation.static') }}

          el-table-column(:label="$t('segmentation.createdBy')" prop="createdBy" width="150")
            template(#default="{ row }")
              .flex.items-center.gap-2
                el-avatar(:size="24" :style="{ background: row.avatarColor }") {{ row.createdBy.charAt(0) }}
                span.text-sm {{ row.createdBy }}

          el-table-column(:label="$t('segmentation.lastUpdated')" prop="lastUpdated" width="160" sortable)
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ row.lastUpdated }}

          el-table-column(:label="$t('segmentation.actions')" width="150" align="center" fixed="right")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-tooltip(:content="$t('segmentation.viewSegment')")
                  el-button(size="small" circle text @click="viewSegment(row)")
                    Icon(name="ph:eye-bold" size="16" style="color: #3b82f6")
                el-tooltip(:content="$t('segmentation.editSegment')")
                  el-button(size="small" circle text @click="editSegment(row)")
                    Icon(name="ph:pencil-simple-bold" size="16" style="color: #f59e0b")
                el-tooltip(:content="$t('segmentation.deleteSegment')")
                  el-button(size="small" circle text @click="deleteSegment(row)")
                    Icon(name="ph:trash-bold" size="16" style="color: #ef4444")

    //- ═══════════════════════════════════════════════════
    //- TAB 3: RFM Analysis
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('segmentation.rfmAnalysis')" name="rfm")
      .flex.items-center.justify-between.mb-6
        div
          h3.text-sm.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:chart-scatter-bold" size="16" class="mr-2" style="color: #7849ff")
            | {{ $t('segmentation.rfmMatrix') }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('segmentation.rfmDescription') }}
        .flex.items-center.gap-3
          .flex.items-center.gap-2
            .w-3.h-3.rounded-sm(style="background: rgba(120, 73, 255, 0.8)")
            span.text-xs(style="color: var(--text-muted)") {{ $t('segmentation.highValue') }}
          .flex.items-center.gap-2
            .w-3.h-3.rounded-sm(style="background: rgba(120, 73, 255, 0.4)")
            span.text-xs(style="color: var(--text-muted)") {{ $t('segmentation.mediumValue') }}
          .flex.items-center.gap-2
            .w-3.h-3.rounded-sm(style="background: rgba(120, 73, 255, 0.15)")
            span.text-xs(style="color: var(--text-muted)") {{ $t('segmentation.lowValue') }}

      //- RFM Grid
      .rfm-grid-wrapper.mb-8
        //- Column Headers (Recency)
        .rfm-header-row
          .rfm-axis-label
          .rfm-col-header
            span.text-xs.font-bold(style="color: var(--text-primary)") {{ $t('segmentation.recent') }}
            span.text-xs(style="color: var(--text-muted)") (0-30 {{ $t('segmentation.days') }})
          .rfm-col-header
            span.text-xs.font-bold(style="color: var(--text-primary)") {{ $t('segmentation.moderate') }}
            span.text-xs(style="color: var(--text-muted)") (31-90 {{ $t('segmentation.days') }})
          .rfm-col-header
            span.text-xs.font-bold(style="color: var(--text-primary)") {{ $t('segmentation.lapsed') }}
            span.text-xs(style="color: var(--text-muted)") (90+ {{ $t('segmentation.days') }})

        //- Grid Rows (Frequency)
        .rfm-grid-row(v-for="(row, rIdx) in rfmGrid" :key="rIdx")
          .rfm-row-label
            span.text-xs.font-bold(style="color: var(--text-primary)") {{ row.label }}
            span.text-xs(style="color: var(--text-muted)") {{ row.sublabel }}
          .rfm-cell(
            v-for="(cell, cIdx) in row.cells"
            :key="cIdx"
            :style="{ background: getRfmCellBg(cell.intensity) }"
            :class="{ 'rfm-cell-active': selectedRfmCell === `${rIdx}-${cIdx}` }"
            @click="selectRfmCell(rIdx, cIdx, cell)"
          )
            .rfm-cell-content
              p.text-sm.font-bold(:style="{ color: getRfmTextColor(cell.intensity) }") {{ cell.name }}
              .flex.items-center.gap-2.mt-2
                .flex.items-center.gap-1
                  Icon(name="ph:users-bold" size="12" :style="{ color: getRfmTextColor(cell.intensity) }")
                  span.text-xs.font-medium(:style="{ color: getRfmTextColor(cell.intensity) }") {{ cell.count.toLocaleString() }}
                .flex.items-center.gap-1
                  Icon(name="ph:currency-dollar-bold" size="12" :style="{ color: getRfmTextColor(cell.intensity) }")
                  span.text-xs.font-medium(:style="{ color: getRfmTextColor(cell.intensity) }") ${{ formatCompact(cell.monetary) }}
              .mt-2
                .rfm-bar
                  .rfm-bar-fill(:style="{ width: cell.percentage + '%', background: getRfmBarColor(cell.intensity) }")

      //- RFM Cell Detail (appears when a cell is clicked)
      Transition(name="fade")
        .glass-card.mb-6(v-if="selectedRfmDetail")
          .flex.items-center.justify-between.mb-4
            .flex.items-center.gap-3
              .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: selectedRfmDetail.color + '20' }")
                Icon(name="ph:user-focus-bold" size="22" :style="{ color: selectedRfmDetail.color }")
              div
                h4.text-lg.font-bold(style="color: var(--text-primary)") {{ selectedRfmDetail.name }}
                p.text-xs(style="color: var(--text-muted)") {{ selectedRfmDetail.description }}
            el-button(size="small" circle text @click="selectedRfmCell = null; selectedRfmDetail = null")
              Icon(name="ph:x-bold" size="16")

          .grid.gap-4(class="grid-cols-2 sm:grid-cols-4")
            .text-center.p-4.rounded-xl(style="background: var(--bg-elevated)")
              p.text-xl.font-bold(style="color: #7849ff") {{ selectedRfmDetail.count.toLocaleString() }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('segmentation.customers') }}
            .text-center.p-4.rounded-xl(style="background: var(--bg-elevated)")
              p.text-xl.font-bold(style="color: #22c55e") ${{ formatCompact(selectedRfmDetail.monetary) }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('segmentation.totalRevenue') }}
            .text-center.p-4.rounded-xl(style="background: var(--bg-elevated)")
              p.text-xl.font-bold(style="color: #3b82f6") {{ selectedRfmDetail.avgFrequency }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('segmentation.avgFrequency') }}
            .text-center.p-4.rounded-xl(style="background: var(--bg-elevated)")
              p.text-xl.font-bold(style="color: #f59e0b") {{ selectedRfmDetail.avgRecency }} {{ $t('segmentation.days') }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('segmentation.avgRecency') }}

          .mt-4
            h5.text-sm.font-semibold.mb-2(style="color: var(--text-primary)") {{ $t('segmentation.recommendedActions') }}
            .flex.flex-wrap.gap-2
              el-tag(
                v-for="action in selectedRfmDetail.actions"
                :key="action"
                size="default"
                effect="plain"
                round
              ) {{ action }}

      //- RFM Summary Cards
      .grid.gap-5(class="grid-cols-1 sm:grid-cols-3")
        .glass-card.text-center(v-for="summary in rfmSummary" :key="summary.label")
          .w-12.h-12.rounded-xl.flex.items-center.justify-center.mx-auto.mb-3(:style="{ background: summary.color + '20' }")
            Icon(:name="summary.icon" size="22" :style="{ color: summary.color }")
          p.text-2xl.font-bold(:style="{ color: summary.color }") {{ summary.value }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ summary.label }}

    //- ═══════════════════════════════════════════════════
    //- TAB 4: Insights
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('segmentation.insights')" name="insights")
      .grid.gap-6.mb-8(class="grid-cols-1 lg:grid-cols-2")
        //- Segment Comparison Bar Chart
        .glass-card
          .flex.items-center.justify-between.mb-4
            h3.text-sm.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:chart-bar-bold" size="16" class="mr-2" style="color: #7849ff")
              | {{ $t('segmentation.segmentComparison') }}
            el-select(v-model="comparisonMetric" size="small" style="width: 140px")
              el-option(:label="$t('segmentation.bySize')" value="size")
              el-option(:label="$t('segmentation.byRevenue')" value="revenue")
              el-option(:label="$t('segmentation.byEngagement')" value="engagement")
          .chart-container
            ClientOnly
              VChart(v-if="comparisonChartOption" :option="comparisonChartOption" autoresize style="height: 360px")

        //- Segment Overlap Visualization
        .glass-card
          .flex.items-center.justify-between.mb-4
            h3.text-sm.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:intersect-bold" size="16" class="mr-2" style="color: #f59e0b")
              | {{ $t('segmentation.segmentOverlap') }}
          .flex.flex-col.items-center.justify-center.py-6
            .overlap-container
              .overlap-circle.circle-a
                .overlap-label
                  p.text-sm.font-bold {{ overlapData.segmentA.name }}
                  p.text-xs {{ overlapData.segmentA.count.toLocaleString() }}
              .overlap-circle.circle-b
                .overlap-label
                  p.text-sm.font-bold {{ overlapData.segmentB.name }}
                  p.text-xs {{ overlapData.segmentB.count.toLocaleString() }}
              .overlap-circle.circle-c
                .overlap-label
                  p.text-sm.font-bold {{ overlapData.segmentC.name }}
                  p.text-xs {{ overlapData.segmentC.count.toLocaleString() }}
              .overlap-center
                p.text-xs.font-bold {{ overlapData.overlapCount.toLocaleString() }}
                p.text-xs {{ $t('segmentation.shared') }}
            .flex.items-center.gap-6.mt-6
              .flex.items-center.gap-2(v-for="seg in overlapLegend" :key="seg.name")
                .w-3.h-3.rounded-full(:style="{ background: seg.color }")
                span.text-xs(style="color: var(--text-muted)") {{ seg.name }}

      //- Growth Trend Chart
      .glass-card.mb-8
        .flex.items-center.justify-between.mb-4
          h3.text-sm.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:trend-up-bold" size="16" class="mr-2" style="color: #22c55e")
            | {{ $t('segmentation.growthTrends') }}
          .flex.items-center.gap-2
            el-radio-group(v-model="trendPeriod" size="small")
              el-radio-button(value="3m") 3M
              el-radio-button(value="6m") 6M
              el-radio-button(value="12m") 12M
        .chart-container
          ClientOnly
            VChart(v-if="growthTrendChartOption" :option="growthTrendChartOption" autoresize style="height: 360px")

      //- Behavioral Insights Cards
      .grid.gap-5(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
        .glass-card(v-for="insight in behavioralInsights" :key="insight.title")
          .flex.items-center.gap-3.mb-4
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: insight.color + '20' }")
              Icon(:name="insight.icon" size="20" :style="{ color: insight.color }")
            div
              h4.text-sm.font-bold(style="color: var(--text-primary)") {{ insight.title }}
              p.text-xs(style="color: var(--text-muted)") {{ insight.subtitle }}
          .space-y-3
            .flex.items-center.justify-between(v-for="item in insight.items" :key="item.label")
              .flex.items-center.gap-2
                .w-2.h-2.rounded-full(:style="{ background: insight.color }")
                span.text-sm(style="color: var(--text-primary)") {{ item.label }}
              span.text-sm.font-bold(:style="{ color: insight.color }") {{ item.value }}
          .mt-4.pt-4(style="border-top: 1px solid var(--border-color)")
            .flex.items-center.justify-between
              span.text-xs(style="color: var(--text-muted)") {{ $t('segmentation.lastUpdated') }}
              span.text-xs.font-medium(style="color: var(--text-muted)") {{ insight.updatedAt }}

  //- ════════════════════════════════════════════════════════
  //- Save Segment Dialog
  //- ════════════════════════════════════════════════════════
  el-dialog(
    v-model="showSaveDialog"
    :title="$t('segmentation.saveSegment')"
    width="520px"
    :close-on-click-modal="false"
  )
    el-form(label-position="top" :model="segmentForm")
      el-form-item(:label="$t('segmentation.segmentName')" required)
        el-input(
          v-model="segmentForm.name"
          :placeholder="$t('segmentation.enterSegmentName')"
          maxlength="80"
          show-word-limit
        )
      el-form-item(:label="$t('segmentation.description')")
        el-input(
          v-model="segmentForm.description"
          type="textarea"
          :rows="3"
          :placeholder="$t('segmentation.enterDescription')"
          maxlength="300"
          show-word-limit
        )
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('segmentation.segmentType')")
          el-select(v-model="segmentForm.type" style="width: 100%")
            el-option(:label="$t('segmentation.dynamic')" value="dynamic")
            el-option(:label="$t('segmentation.static')" value="static")
        el-form-item(:label="$t('segmentation.category')")
          el-select(v-model="segmentForm.category" style="width: 100%")
            el-option(:label="$t('segmentation.behavioral')" value="behavioral")
            el-option(:label="$t('segmentation.demographic')" value="demographic")
            el-option(:label="$t('segmentation.geographic')" value="geographic")
            el-option(:label="$t('segmentation.firmographic')" value="firmographic")
      el-form-item(:label="$t('segmentation.tags')")
        el-select(
          v-model="segmentForm.tags"
          multiple
          filterable
          allow-create
          default-first-option
          :placeholder="$t('segmentation.addTags')"
          style="width: 100%"
        )
          el-option(v-for="tag in commonTags" :key="tag" :label="tag" :value="tag")

      .glass-card.mt-2
        .flex.items-center.gap-2
          Icon(name="ph:info-bold" size="16" style="color: #3b82f6")
          span.text-sm(style="color: var(--text-muted)") {{ $t('segmentation.matchingPreview', { count: previewCount.toLocaleString() }) }}

    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showSaveDialog = false") {{ $t('segmentation.cancel') }}
        el-button(
          type="primary"
          @click="saveSegment"
          :disabled="!segmentForm.name"
          class="!bg-[#7849ff] !border-none"
        ) {{ $t('segmentation.save') }}

  //- ════════════════════════════════════════════════════════
  //- View Segment Detail Dialog
  //- ════════════════════════════════════════════════════════
  el-dialog(
    v-model="showDetailDialog"
    :title="viewingSegment?.name || $t('segmentation.segmentDetail')"
    width="680px"
  )
    template(v-if="viewingSegment")
      .grid.gap-4.mb-6(class="grid-cols-2 sm:grid-cols-4")
        .text-center.p-4.rounded-xl(style="background: var(--bg-elevated)")
          p.text-xl.font-bold(style="color: #7849ff") {{ viewingSegment.size.toLocaleString() }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('segmentation.totalContacts') }}
        .text-center.p-4.rounded-xl(style="background: var(--bg-elevated)")
          p.text-xl.font-bold(style="color: #22c55e") {{ viewingSegment.growth > 0 ? '+' : '' }}{{ viewingSegment.growth }}%
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('segmentation.growth') }}
        .text-center.p-4.rounded-xl(style="background: var(--bg-elevated)")
          p.text-xl.font-bold(style="color: #3b82f6") {{ viewingSegment.engagementRate }}%
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('segmentation.engagementRate') }}
        .text-center.p-4.rounded-xl(style="background: var(--bg-elevated)")
          p.text-xl.font-bold(style="color: #f59e0b") ${{ formatCompact(viewingSegment.revenue) }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('segmentation.revenue') }}

      h5.text-sm.font-semibold.mb-3(style="color: var(--text-primary)") {{ $t('segmentation.segmentRules') }}
      .space-y-2.mb-4
        .flex.items-center.gap-2.p-3.rounded-lg(
          v-for="(rule, rIdx) in viewingSegment.rules"
          :key="rIdx"
          style="background: var(--bg-elevated)"
        )
          el-tag(size="small" effect="dark" round :type="rIdx === 0 ? '' : 'warning'") {{ rIdx === 0 ? 'WHERE' : 'AND' }}
          span.text-sm(style="color: var(--text-primary)") {{ rule }}

      h5.text-sm.font-semibold.mb-3.mt-4(style="color: var(--text-primary)") {{ $t('segmentation.topContacts') }}
      .space-y-2
        .flex.items-center.justify-between.p-3.rounded-lg(
          v-for="contact in viewingSegment.topContacts"
          :key="contact.name"
          style="background: var(--bg-elevated)"
        )
          .flex.items-center.gap-3
            el-avatar(:size="32" :style="{ background: contact.avatarColor }") {{ contact.name.charAt(0) }}
            div
              p.text-sm.font-medium(style="color: var(--text-primary)") {{ contact.name }}
              p.text-xs(style="color: var(--text-muted)") {{ contact.email }}
          .text-right
            p.text-sm.font-bold(style="color: #22c55e") ${{ contact.revenue.toLocaleString() }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('segmentation.revenue') }}

    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showDetailDialog = false") {{ $t('segmentation.close') }}
        el-button(type="primary" class="!bg-[#7849ff] !border-none" @click="showDetailDialog = false; editSegment(viewingSegment)")
          Icon(name="ph:pencil-simple-bold" size="14")
          span.ml-1 {{ $t('segmentation.edit') }}
</template>

<script setup lang="ts">
/* eslint-disable no-use-before-define */
import { ElNotification, ElMessageBox } from 'element-plus';
import VChart from 'vue-echarts';

definePageMeta({ title: 'Customer Segmentation' });

const { t } = useI18n();

// ── State ────────────────────────────────────────────────
const loading = ref(false);
const activeTab = ref('builder');
const showSaveDialog = ref(false);
const showDetailDialog = ref(false);
const segmentSearchQuery = ref('');
const segmentTypeFilter = ref('');
const comparisonMetric = ref<'size' | 'revenue' | 'engagement'>('size');
const trendPeriod = ref('6m');
const groupsOperator = ref<'AND' | 'OR'>('AND');
const selectedRfmCell = ref<string | null>(null);
const selectedRfmDetail = ref<RfmDetail | null>(null);
const viewingSegment = ref<Segment | null>(null);
const previewCount = ref(2847);

// ── Interfaces ───────────────────────────────────────────
interface Condition {
  field: string;
  operator: string;
  value: string | string[];
}

interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: Condition[];
}

interface Segment {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  size: number;
  growth: number;
  type: 'static' | 'dynamic';
  createdBy: string;
  avatarColor: string;
  lastUpdated: string;
  engagementRate: number;
  revenue: number;
  rules: string[];
  topContacts: Array<{
    name: string;
    email: string;
    avatarColor: string;
    revenue: number;
  }>;
}

interface RfmCell {
  name: string;
  count: number;
  monetary: number;
  percentage: number;
  intensity: number; // 0-1
}

interface RfmDetail {
  name: string;
  description: string;
  color: string;
  count: number;
  monetary: number;
  avgFrequency: number;
  avgRecency: number;
  actions: string[];
}

interface SegmentForm {
  name: string;
  description: string;
  type: 'dynamic' | 'static';
  category: string;
  tags: string[];
}

// ── Form State ──────────────────────────────────────────
const segmentForm = ref<SegmentForm>({
  name: '',
  description: '',
  type: 'dynamic',
  category: 'behavioral',
  tags: []
});

const commonTags = ['High Value', 'Enterprise', 'SMB', 'New Customer', 'At Risk', 'Churned', 'VIP', 'Trial', 'Engaged', 'Inactive'];

// ── Condition Groups ────────────────────────────────────
const conditionGroups = ref<ConditionGroup[]>([
  {
    operator: 'AND',
    conditions: [
      { field: 'revenue', operator: 'greater_than', value: '10000' },
      { field: 'last_activity', operator: 'less_than', value: '30' }
    ]
  },
  {
    operator: 'OR',
    conditions: [
      { field: 'industry', operator: 'equals', value: 'Technology' },
      { field: 'lead_score', operator: 'greater_than', value: '75' }
    ]
  }
]);

// ── Available Fields ────────────────────────────────────
const availableFields = [
  { value: 'name', label: t('segmentation.fieldName'), icon: 'ph:user-bold', color: '#7849ff' },
  { value: 'email', label: t('segmentation.fieldEmail'), icon: 'ph:envelope-bold', color: '#3b82f6' },
  { value: 'city', label: t('segmentation.fieldCity'), icon: 'ph:map-pin-bold', color: '#22c55e' },
  { value: 'industry', label: t('segmentation.fieldIndustry'), icon: 'ph:buildings-bold', color: '#f59e0b' },
  { value: 'revenue', label: t('segmentation.fieldRevenue'), icon: 'ph:currency-dollar-bold', color: '#ef4444' },
  { value: 'last_activity', label: t('segmentation.fieldLastActivity'), icon: 'ph:clock-bold', color: '#8b5cf6' },
  { value: 'tags', label: t('segmentation.fieldTags'), icon: 'ph:tag-bold', color: '#ec4899' },
  { value: 'lead_score', label: t('segmentation.fieldLeadScore'), icon: 'ph:star-bold', color: '#f97316' },
  { value: 'company_size', label: t('segmentation.fieldCompanySize'), icon: 'ph:users-three-bold', color: '#06b6d4' },
  { value: 'country', label: t('segmentation.fieldCountry'), icon: 'ph:globe-bold', color: '#14b8a6' },
  { value: 'deal_stage', label: t('segmentation.fieldDealStage'), icon: 'ph:funnel-bold', color: '#a855f7' },
  { value: 'signup_date', label: t('segmentation.fieldSignupDate'), icon: 'ph:calendar-bold', color: '#6366f1' }
];

// ── Operators ───────────────────────────────────────────
const textOperators = [
  { value: 'contains', label: t('segmentation.opContains') },
  { value: 'not_contains', label: t('segmentation.opNotContains') },
  { value: 'equals', label: t('segmentation.opEquals') },
  { value: 'not_equals', label: t('segmentation.opNotEquals') },
  { value: 'starts_with', label: t('segmentation.opStartsWith') },
  { value: 'ends_with', label: t('segmentation.opEndsWith') },
  { value: 'is_empty', label: t('segmentation.opIsEmpty') }
];

const numberOperators = [
  { value: 'equals', label: t('segmentation.opEquals') },
  { value: 'not_equals', label: t('segmentation.opNotEquals') },
  { value: 'greater_than', label: t('segmentation.opGreaterThan') },
  { value: 'less_than', label: t('segmentation.opLessThan') },
  { value: 'between', label: t('segmentation.opBetween') }
];

const listOperators = [
  { value: 'in_list', label: t('segmentation.opInList') },
  { value: 'not_in_list', label: t('segmentation.opNotInList') },
  { value: 'contains', label: t('segmentation.opContains') }
];

const numericFields = ['revenue', 'last_activity', 'lead_score', 'company_size'];
const listFields = ['tags', 'industry', 'deal_stage', 'country', 'city'];

function getOperatorsForField(field: string) {
  if (numericFields.includes(field)) return numberOperators;
  if (listFields.includes(field)) return listOperators;
  return textOperators;
}

function isSelectValueType(operator: string) {
  return operator === 'in_list' || operator === 'not_in_list';
}

function getValuesForField(field: string): string[] {
  const valuesMap: Record<string, string[]> = {
    industry: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Energy'],
    tags: ['VIP', 'Enterprise', 'SMB', 'New', 'At Risk', 'Trial', 'Partner', 'Referral'],
    deal_stage: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    country: ['United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia', 'Japan', 'Brazil'],
    city: ['New York', 'London', 'Berlin', 'San Francisco', 'Toronto', 'Sydney', 'Tokyo', 'Dubai']
  };
  return valuesMap[field] || [];
}

function onFieldChange(gIdx: number, cIdx: number) {
  const group = conditionGroups.value[gIdx];
  if (group) {
    const condition = group.conditions[cIdx];
    if (condition) {
      condition.operator = '';
      condition.value = '';
    }
  }
}

// ── KPI Cards ───────────────────────────────────────────
const kpiCards = computed(() => [
  {
    label: t('segmentation.totalSegments'),
    value: '24',
    icon: 'ph:stack-bold',
    color: '#7849ff',
    trend: '+3 this month',
    trendIcon: 'ph:trend-up-bold',
    trendColor: '#22c55e'
  },
  {
    label: t('segmentation.avgSegmentSize'),
    value: '1,284',
    icon: 'ph:users-bold',
    color: '#3b82f6',
    trend: '+12.4% vs last month',
    trendIcon: 'ph:trend-up-bold',
    trendColor: '#22c55e'
  },
  {
    label: t('segmentation.activeCampaigns'),
    value: '8',
    icon: 'ph:megaphone-bold',
    color: '#22c55e',
    trend: '3 launching this week',
    trendIcon: 'ph:rocket-bold',
    trendColor: '#3b82f6'
  },
  {
    label: t('segmentation.segmentOverlapRate'),
    value: '14.2%',
    icon: 'ph:intersect-bold',
    color: '#f59e0b',
    trend: '-2.1% from last month',
    trendIcon: 'ph:trend-down-bold',
    trendColor: '#22c55e'
  }
]);

// ── Segment List Data ───────────────────────────────────
const segments = ref<Segment[]>([]);

const filteredSegments = computed(() => {
  let result = segments.value;
  if (segmentSearchQuery.value) {
    const q = segmentSearchQuery.value.toLowerCase();
    result = result.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }
  if (segmentTypeFilter.value) {
    result = result.filter(s => s.type === segmentTypeFilter.value);
  }
  return result;
});

// ── RFM Analysis Data ───────────────────────────────────
const rfmGrid = ref([
  {
    label: t('segmentation.freqHigh'),
    sublabel: '(10+ ' + t('segmentation.orders') + ')',
    cells: [
      { name: t('segmentation.rfmChampions'), count: 487, monetary: 2450000, percentage: 92, intensity: 1.0 },
      { name: t('segmentation.rfmLoyalCustomers'), count: 312, monetary: 1280000, percentage: 74, intensity: 0.7 },
      { name: t('segmentation.rfmCantLoseThem'), count: 89, monetary: 890000, percentage: 45, intensity: 0.5 }
    ]
  },
  {
    label: t('segmentation.freqMedium'),
    sublabel: '(4-9 ' + t('segmentation.orders') + ')',
    cells: [
      { name: t('segmentation.rfmPotentialLoyalists'), count: 634, monetary: 1560000, percentage: 68, intensity: 0.65 },
      { name: t('segmentation.rfmNeedAttention'), count: 421, monetary: 780000, percentage: 52, intensity: 0.4 },
      { name: t('segmentation.rfmAboutToSleep'), count: 267, monetary: 340000, percentage: 28, intensity: 0.25 }
    ]
  },
  {
    label: t('segmentation.freqLow'),
    sublabel: '(1-3 ' + t('segmentation.orders') + ')',
    cells: [
      { name: t('segmentation.rfmNewCustomers'), count: 892, monetary: 670000, percentage: 56, intensity: 0.45 },
      { name: t('segmentation.rfmHibernating'), count: 345, monetary: 120000, percentage: 18, intensity: 0.15 },
      { name: t('segmentation.rfmLost'), count: 198, monetary: 45000, percentage: 8, intensity: 0.08 }
    ]
  }
]);

const rfmDetailMap: Record<string, RfmDetail> = {
  '0-0': {
    name: t('segmentation.rfmChampions'),
    description: 'Best customers who bought recently, buy often, and spend the most',
    color: '#7849ff',
    count: 487,
    monetary: 2450000,
    avgFrequency: 14.2,
    avgRecency: 8,
    actions: ['Exclusive offers', 'Early access programs', 'Loyalty rewards', 'Referral program', 'VIP events']
  },
  '0-1': {
    name: t('segmentation.rfmLoyalCustomers'),
    description: 'Customers who buy on a regular basis with good spending',
    color: '#6366f1',
    count: 312,
    monetary: 1280000,
    avgFrequency: 11.5,
    avgRecency: 45,
    actions: ['Upsell premium products', 'Loyalty program enrollment', 'Personalized recommendations', 'Birthday rewards']
  },
  '0-2': {
    name: t('segmentation.rfmCantLoseThem'),
    description: 'Used to be very active but declining - high value at risk',
    color: '#ef4444',
    count: 89,
    monetary: 890000,
    avgFrequency: 12.8,
    avgRecency: 120,
    actions: ['Win-back campaign', 'Personal outreach', 'Special discount', 'Feedback survey', 'Account review']
  },
  '1-0': {
    name: t('segmentation.rfmPotentialLoyalists'),
    description: 'Recent customers with moderate frequency - potential for growth',
    color: '#3b82f6',
    count: 634,
    monetary: 1560000,
    avgFrequency: 6.3,
    avgRecency: 15,
    actions: ['Membership offer', 'Cross-sell products', 'Engagement campaigns', 'Product education']
  },
  '1-1': {
    name: t('segmentation.rfmNeedAttention'),
    description: 'Above average but not recently active - keep them engaged',
    color: '#f59e0b',
    count: 421,
    monetary: 780000,
    avgFrequency: 5.8,
    avgRecency: 62,
    actions: ['Re-engagement email', 'Limited-time offer', 'New feature announcement', 'Check-in call']
  },
  '1-2': {
    name: t('segmentation.rfmAboutToSleep'),
    description: 'Below average frequency and recency - act before they churn',
    color: '#f97316',
    count: 267,
    monetary: 340000,
    avgFrequency: 4.2,
    avgRecency: 95,
    actions: ['Urgency campaign', 'Reactivation discount', 'Product update email', 'Exit survey']
  },
  '2-0': {
    name: t('segmentation.rfmNewCustomers'),
    description: 'Recent first-time buyers with high potential',
    color: '#22c55e',
    count: 892,
    monetary: 670000,
    avgFrequency: 1.8,
    avgRecency: 12,
    actions: ['Welcome series', 'Onboarding guide', 'First purchase follow-up', 'Product tutorials', 'Community invite']
  },
  '2-1': {
    name: t('segmentation.rfmHibernating'),
    description: 'Low engagement customers who last purchased a while ago',
    color: '#94a3b8',
    count: 345,
    monetary: 120000,
    avgFrequency: 2.1,
    avgRecency: 78,
    actions: ['Win-back offer', 'New product launch', 'Social proof campaign', 'Feedback request']
  },
  '2-2': {
    name: t('segmentation.rfmLost'),
    description: 'Lowest activity and oldest purchase - last resort retention',
    color: '#64748b',
    count: 198,
    monetary: 45000,
    avgFrequency: 1.2,
    avgRecency: 180,
    actions: ['Final win-back email', 'Significant discount', 'Product change notification', 'Clean from list']
  }
};

const rfmSummary = computed(() => [
  {
    label: t('segmentation.totalCustomersAnalyzed'),
    value: '3,645',
    icon: 'ph:users-three-bold',
    color: '#7849ff'
  },
  {
    label: t('segmentation.avgCustomerLifetimeValue'),
    value: '$2,247',
    icon: 'ph:currency-dollar-bold',
    color: '#22c55e'
  },
  {
    label: t('segmentation.retentionRate'),
    value: '78.4%',
    icon: 'ph:arrow-u-up-left-bold',
    color: '#3b82f6'
  }
]);

// ── Overlap Data ────────────────────────────────────────
const overlapData = ref({
  segmentA: { name: 'Enterprise', count: 342, color: '#7849ff' },
  segmentB: { name: 'High-Value', count: 189, color: '#f59e0b' },
  segmentC: { name: 'Tech Sector', count: 567, color: '#22c55e' },
  overlapCount: 87
});

const overlapLegend = computed(() => [
  { name: overlapData.value.segmentA.name, color: overlapData.value.segmentA.color },
  { name: overlapData.value.segmentB.name, color: overlapData.value.segmentB.color },
  { name: overlapData.value.segmentC.name, color: overlapData.value.segmentC.color }
]);

// ── Behavioral Insights ─────────────────────────────────
const behavioralInsights = computed(() => [
  {
    title: t('segmentation.purchasePatterns'),
    subtitle: t('segmentation.top5Products'),
    icon: 'ph:shopping-cart-bold',
    color: '#7849ff',
    updatedAt: '2 hours ago',
    items: [
      { label: 'Premium Plan', value: '34%' },
      { label: 'Enterprise Add-on', value: '22%' },
      { label: 'API Access', value: '18%' },
      { label: 'Support Package', value: '15%' },
      { label: 'Training Bundle', value: '11%' }
    ]
  },
  {
    title: t('segmentation.engagementMetrics'),
    subtitle: t('segmentation.last30Days'),
    icon: 'ph:cursor-click-bold',
    color: '#3b82f6',
    updatedAt: '1 hour ago',
    items: [
      { label: 'Email Open Rate', value: '42.3%' },
      { label: 'Click-Through Rate', value: '12.8%' },
      { label: 'Page Views / Session', value: '5.4' },
      { label: 'Avg Session Duration', value: '4m 32s' },
      { label: 'Feature Adoption', value: '67%' }
    ]
  },
  {
    title: t('segmentation.churnIndicators'),
    subtitle: t('segmentation.riskAssessment'),
    icon: 'ph:warning-octagon-bold',
    color: '#ef4444',
    updatedAt: '30 minutes ago',
    items: [
      { label: 'Declining Usage', value: '156' },
      { label: 'Support Tickets Up', value: '89' },
      { label: 'Payment Issues', value: '23' },
      { label: 'No Login 30+ Days', value: '267' },
      { label: 'Downgrade Requests', value: '12' }
    ]
  }
]);

// ── Chart Options ───────────────────────────────────────
const comparisonChartOption = computed(() => {
  const metricMap: Record<string, { data: number[]; label: string }> = {
    size: {
      data: [342, 189, 567, 478, 892, 3241, 156, 67],
      label: t('segmentation.contactCount')
    },
    revenue: {
      data: [4850, 7320, 3670, 890, 670, 1560, 1240, 0],
      label: t('segmentation.revenueK')
    },
    engagement: {
      data: [72, 89, 68, 61, 56, 34, 23, 45],
      label: t('segmentation.engagementPct')
    }
  };

  const metric = metricMap[comparisonMetric.value]!;
  const segmentNames = ['Enterprise', 'High-Value', 'Tech Sector', 'New Signups', 'New Customers', 'Newsletter', 'At-Risk', 'Trial Expiring'];
  const colors = ['#7849ff', '#f59e0b', '#6366f1', '#22c55e', '#3b82f6', '#14b8a6', '#ef4444', '#f97316'];

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 20, 40, 0.95)',
      borderColor: 'rgba(120, 73, 255, 0.2)',
      textStyle: { color: '#e2e8f0', fontSize: 12 }
    },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: segmentNames,
      axisLabel: { color: '#94a3b8', fontSize: 11, rotate: 30 },
      axisLine: { lineStyle: { color: 'rgba(120, 73, 255, 0.1)' } }
    },
    yAxis: {
      type: 'value',
      name: metric.label,
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(120, 73, 255, 0.06)' } }
    },
    series: [
      {
        name: metric.label,
        type: 'bar',
        data: metric.data.map((val, idx) => ({
          value: val,
          itemStyle: {
            color: colors[idx],
            borderRadius: [6, 6, 0, 0]
          }
        })),
        barWidth: '50%',
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(120, 73, 255, 0.3)' }
        }
      }
    ]
  };
});

const growthTrendChartOption = computed(() => {
  const months = ['Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026'];
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 20, 40, 0.95)',
      borderColor: 'rgba(120, 73, 255, 0.2)',
      textStyle: { color: '#e2e8f0', fontSize: 12 }
    },
    legend: {
      data: ['Enterprise', 'High-Value', 'At-Risk', 'New Signups'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      bottom: 0
    },
    grid: { left: '3%', right: '4%', bottom: '14%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(120, 73, 255, 0.1)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(120, 73, 255, 0.06)' } }
    },
    series: [
      {
        name: 'Enterprise',
        type: 'line',
        data: [280, 295, 310, 318, 330, 342],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#7849ff', width: 2 },
        itemStyle: { color: '#7849ff' },
        areaStyle: { color: 'rgba(120, 73, 255, 0.08)' }
      },
      {
        name: 'High-Value',
        type: 'line',
        data: [145, 155, 162, 170, 178, 189],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#f59e0b', width: 2 },
        itemStyle: { color: '#f59e0b' },
        areaStyle: { color: 'rgba(245, 158, 11, 0.08)' }
      },
      {
        name: 'At-Risk',
        type: 'line',
        data: [198, 185, 178, 172, 164, 156],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#ef4444', width: 2 },
        itemStyle: { color: '#ef4444' },
        areaStyle: { color: 'rgba(239, 68, 68, 0.08)' }
      },
      {
        name: 'New Signups',
        type: 'line',
        data: [120, 210, 285, 350, 412, 478],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' },
        areaStyle: { color: 'rgba(34, 197, 94, 0.08)' }
      }
    ]
  };
});

// ── RFM Helper Functions ────────────────────────────────
function getRfmCellBg(intensity: number): string {
  const alpha = Math.max(0.06, intensity * 0.45);
  return `rgba(120, 73, 255, ${alpha})`;
}

function getRfmTextColor(intensity: number): string {
  if (intensity >= 0.7) return '#c4b5fd';
  if (intensity >= 0.4) return '#a78bfa';
  return '#94a3b8';
}

function getRfmBarColor(intensity: number): string {
  if (intensity >= 0.7) return '#7849ff';
  if (intensity >= 0.4) return '#a855f7';
  return '#6366f1';
}

function selectRfmCell(rIdx: number, cIdx: number, _cell: RfmCell) {
  const key = `${rIdx}-${cIdx}`;
  if (selectedRfmCell.value === key) {
    selectedRfmCell.value = null;
    selectedRfmDetail.value = null;
  } else {
    selectedRfmCell.value = key;
    selectedRfmDetail.value = rfmDetailMap[key] || null;
  }
}

// ── Methods ─────────────────────────────────────────────
function addCondition(groupIdx: number) {
  conditionGroups.value[groupIdx]!.conditions.push({
    field: '',
    operator: '',
    value: ''
  });
}

function removeCondition(groupIdx: number, conditionIdx: number) {
  conditionGroups.value[groupIdx]!.conditions.splice(conditionIdx, 1);
}

function addGroup() {
  conditionGroups.value.push({
    operator: 'AND',
    conditions: [{ field: '', operator: '', value: '' }]
  });
}

function removeGroup(groupIdx: number) {
  conditionGroups.value.splice(groupIdx, 1);
}

function toggleGroupOperator(groupIdx: number) {
  const group = conditionGroups.value[groupIdx]!;
  group.operator = group.operator === 'AND' ? 'OR' : 'AND';
}

function resetConditions() {
  conditionGroups.value = [
    {
      operator: 'AND',
      conditions: [{ field: '', operator: '', value: '' }]
    }
  ];
  previewCount.value = 0;
}

function previewSegment() {
  loading.value = true;
  setTimeout(() => {
    previewCount.value = 0;
    loading.value = false;
    ElNotification({
      title: t('segmentation.previewReady'),
      message: t('segmentation.matchingPreview', { count: previewCount.value.toLocaleString() }),
      type: 'success',
      duration: 3000
    });
  }, 800);
}

function saveSegment() {
  if (!segmentForm.value.name) return;

  const newSegment: Segment = {
    id: `s${Date.now()}`,
    name: segmentForm.value.name,
    description: segmentForm.value.description,
    icon: 'ph:stack-bold',
    color: '#7849ff',
    size: previewCount.value,
    growth: 0,
    type: segmentForm.value.type,
    createdBy: 'Current User',
    avatarColor: '#7849ff',
    lastUpdated: new Date().toISOString().split('T')[0] || '',
    engagementRate: 0,
    revenue: 0,
    rules: conditionGroups.value.flatMap(g =>
      g.conditions.filter(c => c.field && c.operator).map(c => `${c.field} ${c.operator} ${Array.isArray(c.value) ? c.value.join(', ') : c.value}`)
    ),
    topContacts: []
  };

  segments.value.unshift(newSegment);
  showSaveDialog.value = false;
  segmentForm.value = { name: '', description: '', type: 'dynamic', category: 'behavioral', tags: [] };

  ElNotification({
    title: t('segmentation.segmentSaved'),
    message: t('segmentation.segmentSavedMsg', { name: newSegment.name }),
    type: 'success',
    duration: 3000
  });
}

function showCreateSegmentDialog() {
  activeTab.value = 'builder';
  resetConditions();
}

function viewSegment(segment: Segment) {
  viewingSegment.value = segment;
  showDetailDialog.value = true;
}

function editSegment(segment: Segment | null) {
  if (!segment) return;
  ElNotification({
    title: t('segmentation.editingSegment'),
    message: segment.name,
    type: 'info',
    duration: 2000
  });
  activeTab.value = 'builder';
}

function deleteSegment(segment: Segment) {
  ElMessageBox.confirm(t('segmentation.deleteConfirmMsg', { name: segment.name }), t('segmentation.deleteConfirm'), {
    confirmButtonText: t('segmentation.delete'),
    cancelButtonText: t('segmentation.cancel'),
    type: 'warning'
  })
    .then(() => {
      const idx = segments.value.findIndex(s => s.id === segment.id);
      if (idx !== -1) segments.value.splice(idx, 1);
      ElNotification({
        title: t('segmentation.segmentDeleted'),
        message: segment.name,
        type: 'success',
        duration: 2000
      });
    })
    .catch((error: unknown) => {
      console.error('Operation failed:', error);
    });
}

function exportSegments() {
  ElNotification({
    title: t('segmentation.exportStarted'),
    message: t('segmentation.exportMsg'),
    type: 'info',
    duration: 2000
  });
}

function refreshData() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    ElNotification({
      title: t('segmentation.dataRefreshed'),
      message: t('segmentation.dataRefreshedMsg'),
      type: 'success',
      duration: 2000
    });
  }, 1000);
}

function formatCompact(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
  return value.toString();
}
</script>

<style scoped lang="scss">
// ── KPI Cards ───────────────────────────────────────────
.kpi-card {
  @apply rounded-2xl p-5 transition-all duration-300;
  background: var(--card-bg, rgba(30, 30, 60, 0.4));
  border: 1px solid var(--border-color, rgba(120, 73, 255, 0.08));

  &:hover {
    border-color: rgba(120, 73, 255, 0.2);
    transform: translateY(-2px);
  }
}

.kpi-icon-wrapper {
  @apply w-12 h-12 rounded-xl flex items-center justify-center;
}

// ── Glass Card ──────────────────────────────────────────
.glass-card {
  @apply rounded-2xl p-6;
  background: var(--card-bg, rgba(30, 30, 60, 0.4));
  border: 1px solid var(--border-color, rgba(120, 73, 255, 0.08));
}

// ── Tabs ────────────────────────────────────────────────
.segmentation-tabs {
  :deep(.el-tabs__header) {
    background: var(--card-bg, rgba(30, 30, 60, 0.4));
    border-color: var(--border-color, rgba(120, 73, 255, 0.08));
    border-radius: 16px 16px 0 0;
  }

  :deep(.el-tabs__content) {
    background: transparent;
    padding: 24px;
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted, #94a3b8);
    font-weight: 600;

    &.is-active {
      color: #7849ff;
    }
  }

  :deep(.el-tabs__nav-wrap::after) {
    background: var(--border-color, rgba(120, 73, 255, 0.08));
  }
}

// ── Condition Builder ───────────────────────────────────
.condition-row {
  @apply p-3 rounded-xl transition-all duration-200;
  background: var(--bg-elevated, rgba(20, 20, 50, 0.3));

  &:hover {
    background: var(--bg-elevated-hover, rgba(30, 30, 60, 0.5));
  }
}

// ── RFM Grid ────────────────────────────────────────────
.rfm-grid-wrapper {
  display: grid;
  grid-template-rows: auto repeat(3, 1fr);
  gap: 8px;
}

.rfm-header-row {
  display: grid;
  grid-template-columns: 120px repeat(3, 1fr);
  gap: 8px;
}

.rfm-col-header {
  @apply flex flex-col items-center justify-center text-center p-3 rounded-xl;
  background: var(--bg-elevated, rgba(20, 20, 50, 0.3));
}

.rfm-axis-label {
  @apply flex items-center justify-center p-3;
}

.rfm-grid-row {
  display: grid;
  grid-template-columns: 120px repeat(3, 1fr);
  gap: 8px;
}

.rfm-row-label {
  @apply flex flex-col items-center justify-center text-center p-3 rounded-xl;
  background: var(--bg-elevated, rgba(20, 20, 50, 0.3));
}

.rfm-cell {
  @apply rounded-xl p-4 cursor-pointer transition-all duration-300;
  border: 2px solid transparent;

  &:hover {
    border-color: rgba(120, 73, 255, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(120, 73, 255, 0.15);
  }

  &.rfm-cell-active {
    border-color: #7849ff;
    box-shadow: 0 0 0 3px rgba(120, 73, 255, 0.2);
  }
}

.rfm-cell-content {
  @apply h-full flex flex-col justify-center;
}

.rfm-bar {
  @apply w-full h-1.5 rounded-full overflow-hidden;
  background: rgba(120, 73, 255, 0.1);
}

.rfm-bar-fill {
  @apply h-full rounded-full transition-all duration-500;
}

// ── Overlap Visualization ───────────────────────────────
.overlap-container {
  position: relative;
  width: 320px;
  height: 260px;
}

.overlap-circle {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &.circle-a {
    top: 0;
    left: 20px;
    background: rgba(120, 73, 255, 0.2);
    border: 2px solid rgba(120, 73, 255, 0.4);
  }

  &.circle-b {
    top: 0;
    right: 20px;
    background: rgba(245, 158, 11, 0.2);
    border: 2px solid rgba(245, 158, 11, 0.4);
  }

  &.circle-c {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(34, 197, 94, 0.2);
    border: 2px solid rgba(34, 197, 94, 0.4);
  }
}

.overlap-label {
  text-align: center;
  color: var(--text-primary);
}

.overlap-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -40%);
  text-align: center;
  z-index: 10;
  background: rgba(120, 73, 255, 0.3);
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(120, 73, 255, 0.5);
  color: var(--text-primary);
}

// ── Table Styling ───────────────────────────────────────
.segment-table-row {
  background: transparent !important;

  &:hover > td {
    background: var(--bg-elevated, rgba(30, 30, 60, 0.3)) !important;
  }
}

// ── Chart Container ─────────────────────────────────────
.chart-container {
  @apply w-full;
  min-height: 360px;
}

// ── Animations ──────────────────────────────────────────
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// ── Responsive ──────────────────────────────────────────
@media (max-width: 768px) {
  .rfm-grid-wrapper,
  .rfm-header-row,
  .rfm-grid-row {
    grid-template-columns: 80px repeat(3, 1fr);
  }

  .overlap-container {
    width: 260px;
    height: 220px;
  }

  .overlap-circle {
    width: 140px;
    height: 140px;
  }

  .overlap-center {
    width: 52px;
    height: 52px;
  }

  .condition-row {
    .flex.items-center.gap-3 {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>
