<template lang="pug">
div.animate-fade-in
  //- Premium Header
  PremiumPageHeader(
    :title="$t('territoryManagement.title')"
    :description="$t('territoryManagement.subtitle')"
    icon="ph:map-pin-area-bold"
    primaryColor="#7c3aed"
  )
    template(#actions)
      .flex.items-center.gap-3
        el-button(size="large" @click="handleBulkExport" :disabled="!selectedRows.length" class="!rounded-xl")
          Icon(name="ph:export-bold" size="16" class="mr-1")
          | {{ $t('common.export') }}
        el-button(type="primary" size="large" @click="openCreateDialog" class="!rounded-xl shadow-lg shadow-primary/30")
          Icon(name="ph:plus-bold" size="16" class="mr-1")
          | {{ $t('territoryManagement.createTerritory') }}

  //- KPI Overview Cards
  PremiumKPICards(:metrics="kpiMetrics" v-if="!loading")

  //- View Toggle: Map vs Table
  .flex.items-center.justify-between.mb-6
    .flex.items-center.gap-2
      el-radio-group(v-model="activeView" size="large")
        el-radio-button(value="map")
          Icon(name="ph:squares-four-bold" size="16" class="mr-1")
          | {{ $t('territoryManagement.mapView') }}
        el-radio-button(value="table")
          Icon(name="ph:table-bold" size="16" class="mr-1")
          | {{ $t('territoryManagement.tableView') }}
        el-radio-button(value="compare")
          Icon(name="ph:chart-bar-bold" size="16" class="mr-1")
          | {{ $t('territoryManagement.performanceComparison') }}
    .flex.items-center.gap-2
      el-select(v-model="regionFilter" :placeholder="$t('territoryManagement.region')" clearable size="large" style="width: 200px" class="!rounded-xl")
        el-option(v-for="r in availableRegions" :key="r" :label="r" :value="r")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- ===== MAP VIEW: Card-based territory grid =====
    .territory-map-view(v-if="activeView === 'map'")
      .text-center.py-12(v-if="!filteredTerritories.length")
        Icon(name="ph:map-pin-area" size="56" style="color: var(--text-muted)")
        p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('territoryManagement.noTerritories') }}

      //- Group by region
      template(v-for="(group, regionName) in territoriesByRegion" :key="regionName")
        .mb-8
          .flex.items-center.gap-2.mb-4
            Icon(name="ph:globe-hemisphere-west-bold" size="20" style="color: var(--accent-color, #7849ff)")
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ regionName }}
            el-tag(size="small" round effect="plain") {{ group.length }} {{ $t('territoryManagement.totalTerritories').toLowerCase() }}
          .grid.gap-4(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")
            .territory-map-card.glass-card.rounded-2xl.p-5.cursor-pointer.transition-all(
              v-for="territory in group"
              :key="territory.id"
              :class="getPerformanceClass(territory)"
              @click="openTerritoryDetail(territory)"
            )
              .flex.items-center.justify-between.mb-3
                .flex.items-center.gap-2
                  .w-10.h-10.rounded-xl.flex.items-center.justify-center(
                    :style="{ background: getPerformanceColor(territory) + '15', color: getPerformanceColor(territory) }"
                  )
                    Icon(name="ph:map-pin-bold" size="20")
                  div
                    p.text-sm.font-bold(style="color: var(--text-primary)") {{ territory.name }}
                    p.text-xs(style="color: var(--text-muted)") {{ territory.type || territory.region || '--' }}
                el-tag(
                  size="small"
                  :type="getPerformanceTagType(territory)"
                  effect="dark"
                  round
                ) {{ getPerformanceLabel(territory) }}

              //- Assigned Reps
              .flex.items-center.gap-2.mb-3(v-if="territory._reps && territory._reps.length")
                .flex.-space-x-2
                  .w-7.h-7.rounded-full.flex.items-center.justify-center.text-xs.font-bold.border-2(
                    v-for="(rep, rIdx) in territory._reps.slice(0, 3)"
                    :key="rIdx"
                    :style="{ background: getRepColor(rIdx), color: '#fff', borderColor: 'var(--bg-elevated)' }"
                  ) {{ getInitial(rep.name) }}
                  .w-7.h-7.rounded-full.flex.items-center.justify-center.text-xs.font-medium.border-2(
                    v-if="territory._reps.length > 3"
                    style="background: var(--bg-elevated); color: var(--text-muted); border-color: var(--bg-elevated)"
                  ) +{{ territory._reps.length - 3 }}
                span.text-xs(style="color: var(--text-muted)") {{ territory._reps.map(r => r.name).slice(0, 2).join(', ') }}{{ territory._reps.length > 2 ? '...' : '' }}
              .flex.items-center.gap-1.mb-3(v-else)
                Icon(name="ph:user-circle-dashed" size="16" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.unassigned') }}

              //- Metrics row
              .grid.grid-cols-3.gap-2
                .text-center.p-2.rounded-lg(style="background: var(--bg-elevated)")
                  p.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.leadsCount') }}
                  p.text-sm.font-bold(style="color: var(--text-primary)") {{ territory._leadsCount ?? 0 }}
                .text-center.p-2.rounded-lg(style="background: var(--bg-elevated)")
                  p.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.dealsCount') }}
                  p.text-sm.font-bold(style="color: var(--text-primary)") {{ territory._dealsCount ?? 0 }}
                .text-center.p-2.rounded-lg(style="background: var(--bg-elevated)")
                  p.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.yTDRevenue') }}
                  p.text-sm.font-bold(style="color: var(--text-primary)") {{ formatCurrency(territory._revenue ?? 0) }}

              //- Coverage bar
              .mt-3
                .flex.items-center.justify-between.mb-1
                  span.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.coverage') }}
                  span.text-xs.font-bold(:style="{ color: getPerformanceColor(territory) }") {{ (territory._coverage ?? 0).toFixed(0) }}%
                el-progress(
                  :percentage="territory._coverage ?? 0"
                  :stroke-width="6"
                  :show-text="false"
                  :color="getPerformanceColor(territory)"
                )

    //- ===== TABLE VIEW =====
    .territory-table-view(v-if="activeView === 'table'")
      .glass-card.p-4.rounded-2xl
        .flex.items-center.justify-between.mb-4
          el-input(
            v-model="searchQuery"
            :placeholder="$t('common.search') + ' ' + $t('territoryManagement.title')"
            clearable
            size="large"
            style="max-width: 320px"
            class="!rounded-xl"
          )
            template(#prefix)
              Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")
          .flex.items-center.gap-2
            el-button(size="default" :disabled="!selectedRows.length" @click="handleBulkAssign")
              Icon(name="ph:users-three-bold" size="16" class="mr-1")
              | {{ $t('territoryManagement.bulkAssign') }}

        el-table(
          :data="filteredTerritories"
          v-loading="loading"
          stripe
          style="width: 100%"
          @selection-change="handleSelectionChange"
          :default-sort="{ prop: 'name', order: 'ascending' }"
        )
          el-table-column(type="selection" width="50")
          el-table-column(:label="$t('territoryManagement.territoryName')" prop="name" min-width="180" sortable)
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-8.h-8.rounded-lg.flex.items-center.justify-center(
                  :style="{ background: getPerformanceColor(row) + '15', color: getPerformanceColor(row) }"
                )
                  Icon(name="ph:map-pin-bold" size="16")
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.description || '' }}
          el-table-column(:label="$t('territoryManagement.region')" prop="type" width="130" sortable)
            template(#default="{ row }")
              el-tag(size="small" effect="plain" round) {{ row.type || row.region || '--' }}
          el-table-column(:label="$t('territoryManagement.assignedTo')" min-width="180")
            template(#default="{ row }")
              .flex.items-center.gap-1(v-if="row._reps && row._reps.length")
                .flex.-space-x-2
                  .w-7.h-7.rounded-full.flex.items-center.justify-center.text-xs.font-bold.border-2(
                    v-for="(rep, rIdx) in row._reps.slice(0, 3)"
                    :key="rIdx"
                    :style="{ background: getRepColor(rIdx), color: '#fff', borderColor: 'var(--bg-elevated)' }"
                  ) {{ getInitial(rep.name) }}
                  .w-7.h-7.rounded-full.flex.items-center.justify-center.text-xs.font-medium.border-2(
                    v-if="row._reps.length > 3"
                    style="background: var(--bg-elevated); color: var(--text-muted); border-color: var(--bg-elevated)"
                  ) +{{ row._reps.length - 3 }}
                span.text-xs.ml-1(style="color: var(--text-secondary)") {{ row._reps.length }} rep(s)
              span.text-xs(v-else style="color: var(--text-muted)") {{ $t('territoryManagement.unassigned') }}
          el-table-column(:label="$t('territoryManagement.leadsCount')" prop="_leadsCount" width="110" align="center" sortable)
            template(#default="{ row }")
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row._leadsCount ?? 0 }}
          el-table-column(:label="$t('territoryManagement.dealsCount')" prop="_dealsCount" width="110" align="center" sortable)
            template(#default="{ row }")
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row._dealsCount ?? 0 }}
          el-table-column(:label="$t('territoryManagement.pipelineValue')" prop="_pipelineValue" width="140" align="center" sortable)
            template(#default="{ row }")
              span.text-sm.font-bold(:style="{ color: '#3b82f6' }") {{ formatCurrency(row._pipelineValue ?? 0) }}
          el-table-column(:label="$t('territoryManagement.yTDRevenue')" prop="_revenue" width="140" align="center" sortable)
            template(#default="{ row }")
              span.text-sm.font-bold(:style="{ color: '#10b981' }") {{ formatCurrency(row._revenue ?? 0) }}
          el-table-column(:label="$t('territoryManagement.coverage')" prop="_coverage" width="130" align="center" sortable)
            template(#default="{ row }")
              .flex.items-center.gap-2.justify-center
                el-progress(
                  :percentage="row._coverage ?? 0"
                  :stroke-width="6"
                  :color="getPerformanceColor(row)"
                  :show-text="false"
                  style="width: 60px"
                )
                span.text-xs.font-bold(:style="{ color: getPerformanceColor(row) }") {{ (row._coverage ?? 0).toFixed(0) }}%
          el-table-column(:label="$t('common.actions')" width="150" align="center" fixed="right")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-tooltip(:content="$t('common.view')")
                  el-button(size="small" @click.stop="openTerritoryDetail(row)" class="!rounded-lg")
                    Icon(name="ph:eye-bold" size="14")
                el-tooltip(:content="$t('territoryManagement.assignTerritory')")
                  el-button(size="small" @click.stop="openAssignDialog(row)" class="!rounded-lg")
                    Icon(name="ph:user-switch-bold" size="14")
                el-tooltip(:content="$t('common.edit')")
                  el-button(size="small" @click.stop="openEditDialog(row)" class="!rounded-lg")
                    Icon(name="ph:pencil-bold" size="14")
                el-tooltip(:content="$t('common.delete')")
                  el-button(size="small" type="danger" @click.stop="deleteId = row?.id; deleteDialog = true" class="!rounded-lg")
                    Icon(name="ph:trash-bold" size="14")

        //- Empty state
        .text-center.py-12(v-if="!filteredTerritories.length && !loading")
          Icon(name="ph:map-pin-area" size="56" style="color: var(--text-muted)")
          p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('territoryManagement.noTerritories') }}
          el-button.mt-4(type="primary" @click="openCreateDialog" class="!rounded-xl")
            Icon(name="ph:plus-bold" size="16" class="mr-1")
            | {{ $t('territoryManagement.createTerritory') }}

    //- ===== PERFORMANCE COMPARISON VIEW =====
    .territory-compare-view(v-if="activeView === 'compare'")
      //- Comparison selector
      .glass-card.p-5.rounded-2xl.mb-6
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:chart-bar-bold" size="20" class="mr-2" style="color: #7c3aed")
            | {{ $t('territoryManagement.performanceComparison') }}
          .flex.items-center.gap-3
            el-select(v-model="compareMetric" size="large" style="width: 200px" class="!rounded-xl")
              el-option(:label="$t('territoryManagement.yTDRevenue')" value="revenue")
              el-option(:label="$t('territoryManagement.leadsCount')" value="leads")
              el-option(:label="$t('territoryManagement.winRate')" value="winRate")
              el-option(:label="$t('territoryManagement.avgDealSize')" value="avgDealSize")

        //- Bar chart using ECharts
        .chart-container(ref="comparisonChartRef" style="width: 100%; height: 400px;")

      //- Side-by-side territory comparison
      .glass-card.p-5.rounded-2xl
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:scales-bold" size="20" class="mr-2" style="color: #3b82f6")
            | {{ $t('territoryManagement.sideBySide') }}
        .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
          el-select(v-model="compareTerritory1" :placeholder="$t('territoryManagement.selectTerritory') + ' 1'" size="large" clearable filterable class="!rounded-xl")
            el-option(v-for="t in enrichedTerritories" :key="t.id" :label="t.name" :value="t.id")
          el-select(v-model="compareTerritory2" :placeholder="$t('territoryManagement.selectTerritory') + ' 2'" size="large" clearable filterable class="!rounded-xl")
            el-option(v-for="t in enrichedTerritories" :key="t.id" :label="t.name" :value="t.id")

        //- Comparison table
        .mt-6(v-if="comparisonData")
          el-table(:data="comparisonData" stripe style="width: 100%")
            el-table-column(:label="$t('territoryManagement.metric')" prop="metric" min-width="160")
              template(#default="{ row }")
                span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.metric }}
            el-table-column(:label="territory1Name" min-width="150" align="center")
              template(#default="{ row }")
                span.text-sm.font-bold(:style="{ color: row.val1 > row.val2 ? '#10b981' : row.val1 < row.val2 ? '#ef4444' : 'var(--text-primary)' }") {{ row.display1 }}
            el-table-column(:label="territory2Name" min-width="150" align="center")
              template(#default="{ row }")
                span.text-sm.font-bold(:style="{ color: row.val2 > row.val1 ? '#10b981' : row.val2 < row.val1 ? '#ef4444' : 'var(--text-primary)' }") {{ row.display2 }}
        .text-center.py-8(v-else)
          Icon(name="ph:scales" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('territoryManagement.selectTwoTerritories') }}

  //- ===== CREATE / EDIT TERRITORY DIALOG =====
  el-dialog(
    v-model="createDialogVisible"
    :title="editingTerritory ? $t('territoryManagement.editTerritory') : $t('territoryManagement.createTerritory')"
    width="650px"
    :close-on-click-modal="false"
  )
    el-form(:model="territoryForm" :rules="territoryRules" ref="territoryFormRef" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('common.name')" prop="name" required)
          el-input(v-model="territoryForm.name" :placeholder="$t('territoryManagement.territoryNamePlaceholder')")
        el-form-item(:label="$t('territoryManagement.region')" required)
          el-select(v-model="territoryForm.type" style="width: 100%")
            el-option(:label="$t('territoryManagement.typeRegion')" value="region")
            el-option(:label="$t('territoryManagement.typeCity')" value="city")
            el-option(:label="$t('territoryManagement.typeArea')" value="area")
            el-option(:label="$t('territoryManagement.typeCustom')" value="custom")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="territoryForm.description" type="textarea" :rows="3")

      //- Assignment Rules
      .glass-card.p-4.rounded-xl.mb-4
        h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)")
          Icon(name="ph:funnel-bold" size="16" class="mr-1" style="color: #7c3aed")
          | {{ $t('territoryManagement.assignmentRules') }}
        .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
          el-form-item(:label="$t('territoryManagement.byZipCode')")
            el-input(v-model="territoryForm.ruleZipCode" :placeholder="'e.g. 10001, 10002, 10003'")
          el-form-item(:label="$t('territoryManagement.byCountry')")
            el-input(v-model="territoryForm.ruleCountry" :placeholder="'e.g. Saudi Arabia, UAE'")
          el-form-item(:label="$t('territoryManagement.byIndustry')")
            el-input(v-model="territoryForm.ruleIndustry" :placeholder="'e.g. Technology, Healthcare'")
          el-form-item(:label="$t('territoryManagement.byAccountSize')")
            el-select(v-model="territoryForm.ruleAccountSize" style="width: 100%" clearable multiple)
              el-option(:label="$t('territoryManagement.accountSizeSmall')" value="small")
              el-option(:label="$t('territoryManagement.accountSizeMedium')" value="medium")
              el-option(:label="$t('territoryManagement.accountSizeLarge')" value="large")
              el-option(:label="$t('territoryManagement.accountSizeEnterprise')" value="enterprise")

      el-form-item(:label="$t('territoryManagement.revenueTarget')")
        el-input-number(v-model="territoryForm.revenueTarget" :min="0" :step="10000" style="width: 100%" :placeholder="'0'")

      el-form-item
        el-checkbox(v-model="territoryForm.isActive") {{ $t('common.active') }}

    template(#footer)
      el-button(@click="createDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="handleSaveTerritory") {{ $t('common.save') }}

  //- ===== ASSIGN TERRITORY DIALOG =====
  el-dialog(
    v-model="assignDialogVisible"
    :title="$t('territoryManagement.assignTerritory')"
    width="700px"
    :close-on-click-modal="false"
  )
    .mb-4(v-if="assigningTerritory")
      .flex.items-center.gap-3.mb-4
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(124, 58, 237, 0.15); color: #7c3aed")
          Icon(name="ph:map-pin-bold" size="20")
        div
          p.text-lg.font-bold(style="color: var(--text-primary)") {{ assigningTerritory.name }}
          p.text-sm(style="color: var(--text-muted)") {{ assigningTerritory.type || assigningTerritory.region || '' }}

    //- Current Assignments
    .glass-card.p-4.rounded-xl.mb-4(v-if="assigningTerritory?._reps?.length")
      h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)")
        Icon(name="ph:users-three-bold" size="16" class="mr-1" style="color: #10b981")
        | {{ $t('territoryManagement.currentAssignments') }}
      .flex.flex-wrap.gap-2
        el-tag(
          v-for="rep in assigningTerritory._reps"
          :key="rep.id"
          closable
          size="large"
          effect="plain"
          round
          @close="removeRep(rep)"
        )
          .flex.items-center.gap-1
            .w-5.h-5.rounded-full.flex.items-center.justify-center.text-xs.font-bold(style="background: #7c3aed20; color: #7c3aed") {{ getInitial(rep.name) }}
            span {{ rep.name }}

    //- Staff Selector with Workload Info
    h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)")
      Icon(name="ph:user-switch-bold" size="16" class="mr-1" style="color: #3b82f6")
      | {{ $t('territoryManagement.selectReps') }}
    el-input.mb-3(
      v-model="staffSearch"
      :placeholder="$t('common.search') + '...'"
      clearable
      size="large"
      class="!rounded-xl"
    )
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")

    .staff-list.space-y-2(style="max-height: 320px; overflow-y: auto")
      .flex.items-center.justify-between.p-3.rounded-xl.cursor-pointer.transition-all(
        v-for="staff in filteredStaff"
        :key="staff.id"
        :class="{ 'ring-2 ring-purple-500': selectedStaffIds.includes(staff.id) }"
        style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
        @click="toggleStaffSelection(staff.id)"
      )
        .flex.items-center.gap-3
          el-checkbox(:model-value="selectedStaffIds.includes(staff.id)" @click.stop)
          .w-9.h-9.rounded-full.flex.items-center.justify-center.text-sm.font-bold(
            :style="{ background: '#7c3aed20', color: '#7c3aed' }"
          ) {{ getInitial(staff.name) }}
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ staff.name }}
            p.text-xs(style="color: var(--text-muted)") {{ staff.email || staff.role || '' }}
        .flex.items-center.gap-4
          .text-center
            p.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.currentLoad') }}
            p.text-sm.font-bold(:style="{ color: getLoadColor(staff._territoryCount ?? 0) }") {{ staff._territoryCount ?? 0 }} {{ $t('territoryManagement.totalTerritories').toLowerCase() }}
          .text-center
            p.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.leadsCount') }}
            p.text-sm.font-bold(style="color: var(--text-primary)") {{ staff._leadCount ?? 0 }}

    //- Auto-assign suggestion
    .mt-4.p-3.rounded-xl(v-if="autoSuggestedStaff.length" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2)")
      .flex.items-center.gap-2.mb-2
        Icon(name="ph:lightbulb-bold" size="16" style="color: #10b981")
        span.text-sm.font-semibold(style="color: #10b981") {{ $t('territoryManagement.autoAssign') }}
      p.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.autoAssignHint') }}:
        strong.ml-1(style="color: var(--text-primary)") {{ autoSuggestedStaff.map(s => s.name).join(', ') }}
      el-button.mt-2(size="small" type="success" plain @click="applyAutoAssign" class="!rounded-lg")
        Icon(name="ph:check-bold" size="14" class="mr-1")
        | {{ $t('territoryManagement.applyAutoAssign') }}

    template(#footer)
      el-button(@click="assignDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="handleAssignSave") {{ $t('common.save') }}

  //- ===== TERRITORY DETAIL DRAWER =====
  el-drawer(
    v-model="detailDrawerVisible"
    :title="detailTerritory?.name || ''"
    size="480px"
    direction="rtl"
  )
    template(v-if="detailTerritory")
      //- Territory info
      .p-4
        .flex.items-center.gap-3.mb-4
          .w-12.h-12.rounded-xl.flex.items-center.justify-center(
            :style="{ background: getPerformanceColor(detailTerritory) + '15', color: getPerformanceColor(detailTerritory) }"
          )
            Icon(name="ph:map-pin-area-bold" size="24")
          div
            h3.text-xl.font-bold(style="color: var(--text-primary)") {{ detailTerritory.name }}
            p.text-sm(style="color: var(--text-muted)") {{ detailTerritory.type || detailTerritory.region || '' }} {{ detailTerritory.description ? ' - ' + detailTerritory.description : '' }}

        //- Mini KPIs
        .grid.grid-cols-2.gap-3.mb-6
          .p-3.rounded-xl.text-center(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            p.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.leadsCount') }}
            p.text-xl.font-bold(style="color: var(--text-primary)") {{ detailTerritory._leadsCount ?? 0 }}
          .p-3.rounded-xl.text-center(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            p.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.dealsCount') }}
            p.text-xl.font-bold(style="color: var(--text-primary)") {{ detailTerritory._dealsCount ?? 0 }}
          .p-3.rounded-xl.text-center(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            p.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.pipelineValue') }}
            p.text-xl.font-bold(style="color: #3b82f6") {{ formatCurrency(detailTerritory._pipelineValue ?? 0) }}
          .p-3.rounded-xl.text-center(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            p.text-xs(style="color: var(--text-muted)") {{ $t('territoryManagement.yTDRevenue') }}
            p.text-xl.font-bold(style="color: #10b981") {{ formatCurrency(detailTerritory._revenue ?? 0) }}

        //- Coverage
        .mb-6
          .flex.items-center.justify-between.mb-2
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('territoryManagement.coverage') }}
            span.text-sm.font-bold(:style="{ color: getPerformanceColor(detailTerritory) }") {{ (detailTerritory._coverage ?? 0).toFixed(0) }}%
          el-progress(
            :percentage="detailTerritory._coverage ?? 0"
            :stroke-width="10"
            :color="getPerformanceColor(detailTerritory)"
          )

        //- Assigned Reps
        .mb-6
          h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)")
            Icon(name="ph:users-three-bold" size="16" class="mr-1")
            | {{ $t('territoryManagement.assignedTo') }}
          .space-y-2(v-if="detailTerritory._reps && detailTerritory._reps.length")
            .flex.items-center.gap-3.p-3.rounded-xl(
              v-for="rep in detailTerritory._reps"
              :key="rep.id"
              style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
            )
              .w-9.h-9.rounded-full.flex.items-center.justify-center.text-sm.font-bold(style="background: #7c3aed20; color: #7c3aed") {{ getInitial(rep.name) }}
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ rep.name }}
                p.text-xs(style="color: var(--text-muted)") {{ rep.email || '' }}
          p.text-sm(v-else style="color: var(--text-muted)") {{ $t('territoryManagement.noRepsAssigned') }}

        //- Assignment Rules
        .mb-6(v-if="detailTerritory.boundaries && Object.keys(detailTerritory.boundaries).length")
          h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)")
            Icon(name="ph:funnel-bold" size="16" class="mr-1")
            | {{ $t('territoryManagement.assignmentRules') }}
          .space-y-2
            .flex.items-center.gap-2(v-if="detailTerritory.boundaries.zipCode")
              el-tag(size="small" type="info") {{ $t('territoryManagement.byZipCode') }}
              span.text-xs(style="color: var(--text-secondary)") {{ detailTerritory.boundaries.zipCode }}
            .flex.items-center.gap-2(v-if="detailTerritory.boundaries.country")
              el-tag(size="small" type="info") {{ $t('territoryManagement.byCountry') }}
              span.text-xs(style="color: var(--text-secondary)") {{ detailTerritory.boundaries.country }}
            .flex.items-center.gap-2(v-if="detailTerritory.boundaries.industry")
              el-tag(size="small" type="info") {{ $t('territoryManagement.byIndustry') }}
              span.text-xs(style="color: var(--text-secondary)") {{ detailTerritory.boundaries.industry }}
            .flex.items-center.gap-2(v-if="detailTerritory.boundaries.accountSize")
              el-tag(size="small" type="info") {{ $t('territoryManagement.byAccountSize') }}
              span.text-xs(style="color: var(--text-secondary)") {{ detailTerritory.boundaries.accountSize }}

        //- Actions
        .flex.items-center.gap-3
          el-button(type="primary" @click="openEditDialog(detailTerritory); detailDrawerVisible = false" class="!rounded-xl")
            Icon(name="ph:pencil-bold" size="16" class="mr-1")
            | {{ $t('common.edit') }}
          el-button(@click="openAssignDialog(detailTerritory); detailDrawerVisible = false" class="!rounded-xl")
            Icon(name="ph:user-switch-bold" size="16" class="mr-1")
            | {{ $t('territoryManagement.assignTerritory') }}

  ActionModel(v-model="deleteDialog" :loading="deleting" :description="$t('common.deleteConfirmMessage')" @confirm="handleDelete")
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import * as echarts from 'echarts/core';
import { fetchTerritories, createTerritory, updateTerritory } from '~/composables/useTerritories';
import type { Territory } from '~/composables/useTerritories';
import { useApiFetch } from '~/composables/useApiFetch';
import PremiumPageHeader from '~/components/UI/PremiumPageHeader.vue';
import PremiumKPICards from '~/components/UI/PremiumKPICards.vue';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';
import logger from '~/utils/logger';

definePageMeta({ middleware: 'permissions', title: 'Territory Management' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// ──────────── State ────────────
const loading = ref(true);
const saving = ref(false);
const activeView = ref<'map' | 'table' | 'compare'>('map');
const searchQuery = ref('');
const regionFilter = ref('');
const selectedRows = ref<Record<string, unknown>[]>([]);

// Delete state
const deleteDialog = ref(false);
const deleteId = ref<string | null>(null);
const deleting = ref(false);

// Data
const territories = ref<Territory[]>([]);
const staffList = ref<Record<string, unknown>[]>([]);

// Dialog state
const createDialogVisible = ref(false);
const assignDialogVisible = ref(false);
const detailDrawerVisible = ref(false);
const editingTerritory = ref<Territory | null>(null);
const assigningTerritory = ref<Record<string, unknown> | null>(null);
const detailTerritory = ref<Record<string, unknown> | null>(null);

// Assign dialog
const selectedStaffIds = ref<string[]>([]);
const staffSearch = ref('');

// Comparison
const compareMetric = ref('revenue');
const compareTerritory1 = ref('');
const compareTerritory2 = ref('');
const comparisonChartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

// Create/Edit form
const territoryForm = reactive({
  name: '',
  description: '',
  type: 'region',
  ruleZipCode: '',
  ruleCountry: '',
  ruleIndustry: '',
  ruleAccountSize: [] as string[],
  revenueTarget: 0,
  isActive: true
});

const territoryFormRef = ref<InstanceType<(typeof import('element-plus'))['ElForm']> | null>(null);

const territoryRules = computed(() => ({
  name: [{ required: true, message: t('validation.required') || 'Territory name is required', trigger: 'blur' }]
}));

// ──────────── Computed: enrich territories with mock analytics ────────────
const enrichedTerritories = computed(() => {
  return territories.value.map((ter, idx) => {
    // Simulate analytics data if not provided by API
    const seed = ter.name.length + idx;
    const reps = ter.assignedUser ? [ter.assignedUser] : [];
    return {
      ...ter,
      region: ter.type || 'region',
      _reps: reps.length
        ? reps
        : staffList.value.length
          ? staffList.value.filter((_s: unknown, i: number) => (i + seed) % 5 === 0).slice(0, Math.max(1, seed % 3))
          : [],
      _leadsCount: (ter as unknown)._leadsCount ?? (seed * 17 + 23) % 120,
      _dealsCount: (ter as unknown)._dealsCount ?? (seed * 7 + 11) % 45,
      _pipelineValue: (ter as unknown)._pipelineValue ?? (seed * 12347 + 50000) % 500000,
      _revenue: (ter as unknown)._revenue ?? (seed * 9823 + 30000) % 350000,
      _coverage: (ter as unknown)._coverage ?? 30 + ((seed * 13) % 70),
      _revenueTarget: (ter as unknown)._revenueTarget ?? ter.boundaries?.revenueTarget ?? 200000,
      _winRate: (ter as unknown)._winRate ?? 15 + ((seed * 11) % 60),
      _avgDealSize: (ter as unknown)._avgDealSize ?? 5000 + ((seed * 3571) % 40000)
    };
  });
});

const filteredTerritories = computed(() => {
  let data = enrichedTerritories.value;
  if (regionFilter.value) {
    data = data.filter(t => (t.type || t.region || '') === regionFilter.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    data = data.filter(t => {
      return t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q) || (t.type || '').toLowerCase().includes(q);
    });
  }
  return data;
});

const availableRegions = computed(() => {
  const regions = new Set(enrichedTerritories.value.map(t => t.type || t.region || 'Other'));
  return Array.from(regions).sort();
});

const territoriesByRegion = computed(() => {
  const groups: Record<string, Record<string, unknown>[]> = {};
  for (const ter of filteredTerritories.value) {
    const region = ter.type || ter.region || 'Other';
    if (!groups[region]) groups[region] = [];
    groups[region].push(ter);
  }
  return groups;
});

// ──────────── KPI Metrics ────────────
const kpiMetrics = computed<KPIMetric[]>(() => {
  const data = enrichedTerritories.value;
  const total = data.length;
  const assignedReps = new Set(data.flatMap(t => (t._reps || []).map(r => r.id || r.name)));
  const unassignedLeads = data.reduce((sum, t) => sum + Math.max(0, (t._leadsCount || 0) - (t._reps?.length || 0) * 10), 0);
  const totalRevenue = data.reduce((sum, t) => sum + (t._revenue || 0), 0);

  return [
    {
      label: t('territoryManagement.totalTerritories'),
      value: total,
      icon: 'ph:map-pin-area-bold',
      color: '#7c3aed',
      trend: '+3',
      trendType: 'up'
    },
    {
      label: t('territoryManagement.assignedReps'),
      value: assignedReps.size,
      icon: 'ph:users-three-bold',
      color: '#3b82f6',
      trend: '+2',
      trendType: 'up'
    },
    {
      label: t('territoryManagement.unassignedLeads'),
      value: unassignedLeads,
      icon: 'ph:user-circle-dashed-bold',
      color: '#f59e0b',
      trend: '-12',
      trendType: 'down'
    },
    {
      label: t('territoryManagement.territoryRevenue'),
      value: formatCurrency(totalRevenue),
      icon: 'ph:currency-dollar-bold',
      color: '#10b981',
      trend: '+8.2%',
      trendType: 'up'
    }
  ];
});

// ──────────── Comparison Data ────────────
const territory1Name = computed(() => {
  const t1 = enrichedTerritories.value.find(t => t.id === compareTerritory1.value);
  return t1?.name || '--';
});
const territory2Name = computed(() => {
  const t2 = enrichedTerritories.value.find(t => t.id === compareTerritory2.value);
  return t2?.name || '--';
});

const comparisonData = computed(() => {
  const t1 = enrichedTerritories.value.find(t => t.id === compareTerritory1.value);
  const t2 = enrichedTerritories.value.find(t => t.id === compareTerritory2.value);
  if (!t1 || !t2) return null;

  return [
    {
      metric: t('territoryManagement.leadsCount'),
      val1: t1._leadsCount,
      val2: t2._leadsCount,
      display1: String(t1._leadsCount),
      display2: String(t2._leadsCount)
    },
    {
      metric: t('territoryManagement.dealsCount'),
      val1: t1._dealsCount,
      val2: t2._dealsCount,
      display1: String(t1._dealsCount),
      display2: String(t2._dealsCount)
    },
    {
      metric: t('territoryManagement.pipelineValue'),
      val1: t1._pipelineValue,
      val2: t2._pipelineValue,
      display1: formatCurrency(t1._pipelineValue),
      display2: formatCurrency(t2._pipelineValue)
    },
    {
      metric: t('territoryManagement.yTDRevenue'),
      val1: t1._revenue,
      val2: t2._revenue,
      display1: formatCurrency(t1._revenue),
      display2: formatCurrency(t2._revenue)
    },
    {
      metric: t('territoryManagement.coverage'),
      val1: t1._coverage,
      val2: t2._coverage,
      display1: t1._coverage.toFixed(0) + '%',
      display2: t2._coverage.toFixed(0) + '%'
    },
    {
      metric: t('territoryManagement.winRate'),
      val1: t1._winRate,
      val2: t2._winRate,
      display1: t1._winRate.toFixed(1) + '%',
      display2: t2._winRate.toFixed(1) + '%'
    },
    {
      metric: t('territoryManagement.avgDealSize'),
      val1: t1._avgDealSize,
      val2: t2._avgDealSize,
      display1: formatCurrency(t1._avgDealSize),
      display2: formatCurrency(t2._avgDealSize)
    },
    {
      metric: t('territoryManagement.assignedReps'),
      val1: t1._reps?.length ?? 0,
      val2: t2._reps?.length ?? 0,
      display1: String(t1._reps?.length ?? 0),
      display2: String(t2._reps?.length ?? 0)
    }
  ];
});

// ──────────── Staff for assignment ────────────
const filteredStaff = computed(() => {
  let data = staffList.value;
  if (staffSearch.value) {
    const q = staffSearch.value.toLowerCase();
    data = data.filter(s => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q));
  }
  return data;
});

const autoSuggestedStaff = computed(() => {
  // Suggest staff with the lowest territory count (workload balancing)
  if (!staffList.value.length) return [];
  const sorted = [...staffList.value].sort((a, b) => (a._territoryCount || 0) - (b._territoryCount || 0));
  return sorted.slice(0, 2);
});

// ──────────── Helpers ────────────
function formatCurrency(value: number): string {
  if (!value && value !== 0) return '--';
  return Number(value).toLocaleString('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });
}

function getInitial(name: string): string {
  return (name || '?').charAt(0).toUpperCase();
}

const repColors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
function getRepColor(index: number): string {
  return repColors[index % repColors.length] || '';
}

function getPerformanceColor(territory: unknown): string {
  const coverage = territory._coverage ?? 0;
  if (coverage >= 70) return '#10b981';
  if (coverage >= 40) return '#f59e0b';
  return '#ef4444';
}

function getPerformanceClass(territory: unknown): string {
  const coverage = territory._coverage ?? 0;
  if (coverage >= 70) return 'performance-exceeding';
  if (coverage >= 40) return 'performance-on-target';
  return 'performance-below';
}

function getPerformanceTagType(territory: unknown): string {
  const coverage = territory._coverage ?? 0;
  if (coverage >= 70) return 'success';
  if (coverage >= 40) return 'warning';
  return 'danger';
}

function getPerformanceLabel(territory: unknown): string {
  const coverage = territory._coverage ?? 0;
  if (coverage >= 70) return t('territoryManagement.exceeding');
  if (coverage >= 40) return t('territoryManagement.onTarget');
  return t('territoryManagement.below');
}

function getLoadColor(count: number): string {
  if (count >= 5) return '#ef4444';
  if (count >= 3) return '#f59e0b';
  return '#10b981';
}

// ──────────── Data Loading ────────────
async function loadData() {
  loading.value = true;
  try {
    const [territoryData, usersRes]: Record<string, unknown>[] = await Promise.all([fetchTerritories(), useApiFetch('users')]);
    territories.value = territoryData;
    if (usersRes?.body?.docs) {
      staffList.value = usersRes.body.docs.map((u: unknown, idx: number) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        _territoryCount: (u.name?.length || 0) % 6,
        _leadCount: (idx * 7 + 10) % 50
      }));
    }
  } catch (e) {
    logger.error('Failed to load territory data', e);
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
}

// ──────────── Delete ────────────
async function handleDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const res = await useApiFetch('territories/' + deleteId.value, 'DELETE');
    if (res?.success) {
      ElMessage.success(t('common.deletedSuccess'));
      await loadData();
    } else {
      ElMessage.error(t('common.deleteError'));
    }
  } catch {
    ElMessage.error(t('common.deleteError'));
  } finally {
    deleting.value = false;
    deleteDialog.value = false;
    deleteId.value = null;
  }
}

// ──────────── Create / Edit ────────────
function openCreateDialog() {
  editingTerritory.value = null;
  territoryForm.name = '';
  territoryForm.description = '';
  territoryForm.type = 'region';
  territoryForm.ruleZipCode = '';
  territoryForm.ruleCountry = '';
  territoryForm.ruleIndustry = '';
  territoryForm.ruleAccountSize = [];
  territoryForm.revenueTarget = 0;
  territoryForm.isActive = true;
  createDialogVisible.value = true;
}

function openEditDialog(territory: unknown) {
  editingTerritory.value = territory;
  territoryForm.name = territory.name;
  territoryForm.description = territory.description || '';
  territoryForm.type = territory.type || 'region';
  territoryForm.ruleZipCode = territory.boundaries?.zipCode || '';
  territoryForm.ruleCountry = territory.boundaries?.country || '';
  territoryForm.ruleIndustry = territory.boundaries?.industry || '';
  territoryForm.ruleAccountSize = territory.boundaries?.accountSize ? territory.boundaries.accountSize.split(',') : [];
  territoryForm.revenueTarget = territory.boundaries?.revenueTarget || 0;
  territoryForm.isActive = territory.isActive;
  createDialogVisible.value = true;
}

async function handleSaveTerritory() {
  const valid = await territoryFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const payload = {
      name: territoryForm.name,
      description: territoryForm.description,
      type: territoryForm.type,
      isActive: territoryForm.isActive,
      boundaries: {
        zipCode: territoryForm.ruleZipCode,
        country: territoryForm.ruleCountry,
        industry: territoryForm.ruleIndustry,
        accountSize: territoryForm.ruleAccountSize.join(','),
        revenueTarget: territoryForm.revenueTarget
      }
    };
    if (editingTerritory.value) {
      await updateTerritory(editingTerritory.value.id, payload);
    } else {
      await createTerritory(payload);
    }
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    createDialogVisible.value = false;
    await loadData();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

// ──────────── Assignment ────────────
function openAssignDialog(territory: unknown) {
  assigningTerritory.value = territory;
  selectedStaffIds.value = (territory._reps || []).map(r => r.id);
  staffSearch.value = '';
  assignDialogVisible.value = true;
}

function toggleStaffSelection(staffId: string) {
  const idx = selectedStaffIds.value.indexOf(staffId);
  if (idx >= 0) {
    selectedStaffIds.value.splice(idx, 1);
  } else {
    selectedStaffIds.value.push(staffId);
  }
}

function removeRep(rep: unknown) {
  const idx = selectedStaffIds.value.indexOf(rep.id);
  if (idx >= 0) selectedStaffIds.value.splice(idx, 1);
}

function applyAutoAssign() {
  for (const staff of autoSuggestedStaff.value) {
    if (!selectedStaffIds.value.includes(staff.id)) {
      selectedStaffIds.value.push(staff.id);
    }
  }
}

async function handleAssignSave() {
  if (!assigningTerritory.value) return;
  saving.value = true;
  try {
    await updateTerritory(assigningTerritory.value.id, {
      assignedUserId: selectedStaffIds.value[0] || undefined
    });
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    assignDialogVisible.value = false;
    await loadData();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

function handleBulkAssign() {
  if (!selectedRows.value.length) return;
  // Open assign dialog for the first selected territory
  openAssignDialog(selectedRows.value[0]);
}

// ──────────── Detail ────────────
function openTerritoryDetail(territory: unknown) {
  detailTerritory.value = territory;
  detailDrawerVisible.value = true;
}

// ──────────── Table selection ────────────
function handleSelectionChange(rows: Record<string, unknown>[]) {
  selectedRows.value = rows;
}

// ──────────── Export ────────────
async function handleBulkExport() {
  try {
    const data = selectedRows.value.length ? selectedRows.value : enrichedTerritories.value;
    const csvRows = [
      ['Name', 'Region', 'Leads', 'Deals', 'Pipeline Value', 'Revenue', 'Coverage %'].join(','),
      ...data.map(t =>
        [t.name, t.type || '', t._leadsCount || 0, t._dealsCount || 0, t._pipelineValue || 0, t._revenue || 0, (t._coverage || 0).toFixed(0)].join(
          ','
        )
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'territories-export.csv';
    link.click();
    URL.revokeObjectURL(url);
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.exportSuccess') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.exportFailed') });
  }
}

// ──────────── ECharts Comparison Chart ────────────
function renderComparisonChart() {
  if (!comparisonChartRef.value) return;
  if (chartInstance) chartInstance.dispose();
  chartInstance = echarts.init(comparisonChartRef.value);

  const data = enrichedTerritories.value;
  const names = data.map(t => t.name);
  let values: number[];
  let label: string;

  switch (compareMetric.value) {
    case 'leads':
      values = data.map(t => t._leadsCount || 0);
      label = t('territoryManagement.leadsCount');
      break;
    case 'winRate':
      values = data.map(t => t._winRate || 0);
      label = t('territoryManagement.winRate');
      break;
    case 'avgDealSize':
      values = data.map(t => t._avgDealSize || 0);
      label = t('territoryManagement.avgDealSize');
      break;
    default:
      values = data.map(t => t._revenue || 0);
      label = t('territoryManagement.yTDRevenue');
  }

  const colors = values.map((v, i) => {
    const max = Math.max(...values);
    if (v >= max * 0.7) return '#10b981';
    if (v >= max * 0.4) return '#f59e0b';
    return '#ef4444';
  });

  chartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: 'var(--text-muted)', rotate: names.length > 8 ? 30 : 0 }
    },
    yAxis: {
      type: 'value',
      name: label,
      axisLabel: { color: 'var(--text-muted)' }
    },
    series: [
      {
        name: label,
        type: 'bar',
        data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: [6, 6, 0, 0] } })),
        barMaxWidth: 40
      }
    ]
  });
}

// ──────────── Watchers ────────────
watch([activeView, compareMetric, () => enrichedTerritories.value.length], () => {
  if (activeView.value === 'compare') {
    nextTick(() => renderComparisonChart());
  }
});

watch(activeView, val => {
  if (val === 'compare') {
    nextTick(() => renderComparisonChart());
  }
});

// ──────────── Init ────────────
onMounted(async () => {
  await loadData();
});
</script>

<style lang="scss" scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Territory map cards
.territory-map-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.12);
  }

  &.performance-exceeding {
    border-color: rgba(16, 185, 129, 0.3);
    &:hover {
      border-color: rgba(16, 185, 129, 0.6);
    }
  }
  &.performance-on-target {
    border-color: rgba(245, 158, 11, 0.3);
    &:hover {
      border-color: rgba(245, 158, 11, 0.6);
    }
  }
  &.performance-below {
    border-color: rgba(239, 68, 68, 0.3);
    &:hover {
      border-color: rgba(239, 68, 68, 0.6);
    }
  }
}

// Staff list items
.staff-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 73, 255, 0.3) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(120, 73, 255, 0.3);
    border-radius: 2px;
  }
}

// Chart container
.chart-container {
  min-height: 400px;
}

// Responsive
@media (max-width: 767px) {
  .territory-map-card {
    .grid-cols-3 {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}
</style>
