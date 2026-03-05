<template lang="pug">
.okr-page.p-6(v-loading="loading")
  //- Header
  .flex.items-center.justify-between.mb-6(class="flex-col md:flex-row gap-4")
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:target-bold" size="24" class="mr-2" style="color: #7849ff")
        | {{ $t('okr.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('okr.subtitle') }}
    .flex.items-center.gap-3(class="flex-wrap")
      el-select(v-model="selectedPeriod" style="width: 140px")
        el-option(:label="$t('okr.quarterly')" value="quarterly")
        el-option(:label="$t('okr.monthly')" value="monthly")
        el-option(:label="$t('okr.yearly')" value="yearly")
      el-button(type="primary" @click="openCreateDialog('objective')" class="!bg-[#7849ff] !border-none")
        Icon(name="ph:plus" size="16")
        span.ml-1 {{ $t('okr.createObjective') }}
      el-button(@click="openCreateDialog('keyResult')" plain)
        Icon(name="ph:plus" size="16")
        span.ml-1 {{ $t('okr.createKeyResult') }}

  //- Tabs for sections
  el-tabs(v-model="activeTab" type="border-card" class="okr-tabs")

    //- ═══════════════════════════════════════════════
    //- TAB 1: OKR Overview - Company Objectives
    //- ═══════════════════════════════════════════════
    el-tab-pane(:label="$t('okr.objectives')" name="objectives")
      //- Summary Cards
      .grid.gap-4.mb-6(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
        .glass-card.p-5.rounded-2xl.text-center(v-for="stat in summaryStats" :key="stat.label")
          .w-10.h-10.rounded-xl.flex.items-center.justify-center.mx-auto.mb-3(:style="{ background: stat.color + '20' }")
            Icon(:name="stat.icon" size="20" :style="{ color: stat.color }")
          p.text-2xl.font-bold(:style="{ color: stat.color }") {{ stat.value }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ stat.label }}

      //- Empty state for objectives
      .text-center.py-16(v-if="!objectives.length && !loading")
        Icon(name="ph:target" size="48" style="color: var(--text-muted)")
        p.mt-3.font-medium(style="color: var(--text-primary)") {{ $t('okr.noObjectives') }}
        p.mt-1(style="color: var(--text-muted)") {{ $t('okr.createFirstObjective') }}
        el-button.mt-4(type="primary" @click="openCreateDialog('objective')" class="!bg-[#7849ff] !border-none") {{ $t('okr.createObjective') }}

      //- Company Objectives Grid
      .grid.gap-6(class="grid-cols-1 lg:grid-cols-2" v-if="objectives.length")
        .glass-card.rounded-2xl.overflow-hidden(v-for="obj in objectives" :key="obj.id")
          //- Objective Header
          .p-5
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3
                .w-12.h-12.rounded-xl.flex.items-center.justify-center(:style="{ background: getStatusColor(obj.status) + '20' }")
                  Icon(name="ph:flag-bold" size="22" :style="{ color: getStatusColor(obj.status) }")
                div
                  h4.text-sm.font-bold(style="color: var(--text-primary)") {{ obj.title }}
                  p.text-xs.mt-1(style="color: var(--text-muted)") {{ obj.description }}
              .flex.items-center.gap-2
                el-tag(:type="getStatusTagType(obj.status)" size="small" round effect="dark") {{ $t('okr.' + obj.status) }}
                el-dropdown(trigger="click")
                  el-button(text size="small")
                    Icon(name="ph:dots-three-vertical" size="16")
                  template(#dropdown)
                    el-dropdown-menu
                      el-dropdown-item(@click="editObjective(obj)")
                        Icon(name="ph:pencil" size="14" class="mr-2")
                        | {{ $t('okr.edit') }}
                      el-dropdown-item(@click="openCreateDialog('keyResult', obj.id)")
                        Icon(name="ph:plus" size="14" class="mr-2")
                        | {{ $t('okr.addKeyResult') }}
                      el-dropdown-item(divided @click="deleteObjective(obj)")
                        span(style="color: #ef4444")
                          Icon(name="ph:trash" size="14" class="mr-2")
                          | {{ $t('okr.delete') }}

            //- Progress bar
            .flex.items-center.justify-between.mb-2
              .flex.items-center.gap-2
                .w-6.h-6.rounded-full.overflow-hidden.border(style="border-color: var(--glass-border)")
                  img.w-full.h-full.object-cover(:src="obj.ownerAvatar || '/images/avatar-placeholder.png'" :alt="obj.owner")
                span.text-xs(style="color: var(--text-muted)") {{ obj.owner }}
              .flex.items-center.gap-2
                Icon(name="ph:clock" size="14" style="color: var(--text-muted)")
                span.text-xs(:style="{ color: getDaysRemainingColor(obj.dueDate) }") {{ getDaysRemaining(obj.dueDate) }}
            .w-full.rounded-full.overflow-hidden(style="height: 8px; background: var(--glass-border)")
              .h-full.rounded-full.transition-all.duration-700(:style="{ width: Math.min(obj.progress, 100) + '%', background: getStatusColor(obj.status) }")
            .flex.justify-between.mt-1
              span.text-xs.font-semibold(:style="{ color: getStatusColor(obj.status) }") {{ obj.progress }}%
              span.text-xs(style="color: var(--text-muted)") {{ $t('okr.progress') }}

          //- Key Results (expandable)
          .border-t(style="border-color: var(--glass-border)" v-if="getKeyResultsForObjective(obj.id).length")
            .px-5.py-3.cursor-pointer.flex.items-center.justify-between(@click="toggleExpand(obj.id)" style="background: var(--bg-input)")
              span.text-xs.font-semibold(style="color: var(--text-primary)")
                Icon(name="ph:key-bold" size="14" class="mr-1" style="color: #7849ff")
                | {{ $t('okr.keyResults') }} ({{ getKeyResultsForObjective(obj.id).length }})
              Icon(:name="expandedObjectives.includes(obj.id) ? 'ph:caret-up' : 'ph:caret-down'" size="14" style="color: var(--text-muted)")

            el-collapse-transition
              .px-5.pb-4(v-if="expandedObjectives.includes(obj.id)")
                .py-3.border-b(v-for="kr in getKeyResultsForObjective(obj.id)" :key="kr.id" style="border-color: var(--glass-border)")
                  .flex.items-center.justify-between.mb-2
                    .flex.items-center.gap-2
                      span.text-sm.font-medium(style="color: var(--text-primary)") {{ kr.title }}
                    .flex.items-center.gap-2
                      span.text-xs(style="color: var(--text-muted)") {{ kr.owner }}
                      el-tag(size="small" :type="kr.progress >= 100 ? 'success' : kr.progress >= 60 ? 'warning' : 'danger'" round) {{ kr.progress }}%
                  .flex.items-center.gap-4.mb-2
                    .flex-1
                      .w-full.rounded-full.overflow-hidden(style="height: 6px; background: var(--glass-border)")
                        .h-full.rounded-full.transition-all.duration-700(:style="{ width: Math.min(kr.progress, 100) + '%', background: getProgressColor(kr.progress) }")
                    span.text-xs.font-mono(style="color: var(--text-muted)") {{ formatMetricValue(kr.currentValue, kr.metricType) }} / {{ formatMetricValue(kr.targetValue, kr.metricType) }}
                  .flex.items-center.justify-between
                    span.text-xs(style="color: var(--text-muted)")
                      Icon(name="ph:calendar" size="12" class="mr-1")
                      | {{ formatDate(kr.dueDate) }}
                    .flex.items-center.gap-2
                      el-button(size="small" text @click="openUpdateProgress(kr)")
                        Icon(name="ph:pencil-simple" size="14" style="color: #7849ff")
                        span.ml-1.text-xs(style="color: #7849ff") {{ $t('okr.updateProgress') }}
                      el-button(size="small" text @click="deleteKeyResult(kr)")
                        Icon(name="ph:trash" size="14" style="color: #ef4444")

    //- ═══════════════════════════════════════════════
    //- TAB 2: Key Results Table
    //- ═══════════════════════════════════════════════
    el-tab-pane(:label="$t('okr.keyResults')" name="keyResults")
      .glass-card.rounded-2xl.overflow-hidden
        .p-5.flex.items-center.justify-between
          h3.text-sm.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:key-bold" size="16" class="mr-2" style="color: #7849ff")
            | {{ $t('okr.allKeyResults') }}
          el-input(v-model="krSearch" :placeholder="$t('okr.searchKeyResults')" prefix-icon="Search" clearable style="width: 240px")

        el-table(:data="filteredKeyResults" stripe style="width: 100%" :empty-text="$t('okr.noKeyResults')")
          el-table-column(:label="$t('okr.keyResultTitle')" min-width="220")
            template(#default="{ row }")
              .flex.items-center.gap-2
                Icon(name="ph:key" size="16" style="color: #7849ff")
                div
                  span.font-medium {{ row.title }}
                  p.text-xs(style="color: var(--text-muted)") {{ getObjectiveTitle(row.objectiveId) }}

          el-table-column(:label="$t('okr.progress')" width="200")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .flex-1
                  .w-full.rounded-full.overflow-hidden(style="height: 8px; background: var(--glass-border)")
                    .h-full.rounded-full.transition-all.duration-700(:style="{ width: Math.min(row.progress, 100) + '%', background: getProgressColor(row.progress) }")
                span.text-sm.font-bold(:style="{ color: getProgressColor(row.progress) }") {{ row.progress }}%

          el-table-column(:label="$t('okr.currentValue')" width="130" align="center")
            template(#default="{ row }")
              span.font-mono {{ formatMetricValue(row.currentValue, row.metricType) }}

          el-table-column(:label="$t('okr.targetValue')" width="130" align="center")
            template(#default="{ row }")
              span.font-mono(style="color: var(--text-muted)") {{ formatMetricValue(row.targetValue, row.metricType) }}

          el-table-column(:label="$t('okr.owner')" width="140")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-6.h-6.rounded-full.overflow-hidden.border(style="border-color: var(--glass-border)")
                  img.w-full.h-full.object-cover(:src="row.ownerAvatar || '/images/avatar-placeholder.png'" :alt="row.owner")
                span.text-xs {{ row.owner }}

          el-table-column(:label="$t('okr.dueDate')" width="120")
            template(#default="{ row }")
              span.text-xs(:style="{ color: getDaysRemainingColor(row.dueDate) }") {{ formatDate(row.dueDate) }}

          el-table-column(:label="$t('okr.actions')" width="120" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-button(size="small" type="primary" text @click="openUpdateProgress(row)")
                  Icon(name="ph:pencil-simple" size="16")
                el-button(size="small" type="danger" text @click="deleteKeyResult(row)")
                  Icon(name="ph:trash" size="16")

    //- ═══════════════════════════════════════════════
    //- TAB 3: Goal Hierarchy Tree
    //- ═══════════════════════════════════════════════
    el-tab-pane(:label="$t('okr.goalHierarchy')" name="hierarchy")
      .glass-card.p-6.rounded-2xl
        .flex.items-center.justify-between.mb-6
          h3.text-sm.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:tree-structure-bold" size="16" class="mr-2" style="color: #7849ff")
            | {{ $t('okr.goalHierarchy') }}
          .flex.items-center.gap-2
            el-button(size="small" @click="expandAllNodes" plain)
              Icon(name="ph:arrows-out" size="14" class="mr-1")
              | {{ $t('okr.expandAll') }}
            el-button(size="small" @click="collapseAllNodes" plain)
              Icon(name="ph:arrows-in" size="14" class="mr-1")
              | {{ $t('okr.collapseAll') }}

        //- Tree visualization
        .hierarchy-tree(v-if="hierarchyTree.length")
          el-tree(
            :data="hierarchyTree"
            :props="treeProps"
            node-key="id"
            ref="treeRef"
            default-expand-all
            :expand-on-click-node="true"
          )
            template(#default="{ node, data }")
              .flex.items-center.justify-between.w-full.py-2.pr-4
                .flex.items-center.gap-3
                  .w-8.h-8.rounded-lg.flex.items-center.justify-center(:style="{ background: getNodeColor(data.level) + '20' }")
                    Icon(:name="getNodeIcon(data.level)" size="16" :style="{ color: getNodeColor(data.level) }")
                  div
                    span.text-sm.font-medium(style="color: var(--text-primary)") {{ data.label }}
                    span.text-xs.ml-2(style="color: var(--text-muted)") {{ data.ownerName }}
                .flex.items-center.gap-3
                  .w-24
                    .w-full.rounded-full.overflow-hidden(style="height: 6px; background: var(--glass-border)")
                      .h-full.rounded-full.transition-all.duration-500(:style="{ width: Math.min(data.progress, 100) + '%', background: getProgressColor(data.progress) }")
                  span.text-xs.font-bold(:style="{ color: getProgressColor(data.progress) }" style="min-width: 36px; text-align: right") {{ data.progress }}%

        //- Empty hierarchy state
        .text-center.py-12(v-else)
          Icon(name="ph:tree-structure" size="40" style="color: var(--text-muted)")
          p.mt-3.text-sm(style="color: var(--text-muted)") {{ $t('okr.noHierarchy') }}

    //- ═══════════════════════════════════════════════
    //- TAB 4: Team Goals Dashboard
    //- ═══════════════════════════════════════════════
    el-tab-pane(:label="$t('okr.teamGoals')" name="teamGoals")
      //- Empty state
      .text-center.py-16(v-if="!teamMembers.length && !loading")
        Icon(name="ph:users-three" size="48" style="color: var(--text-muted)")
        p.mt-3.font-medium(style="color: var(--text-primary)") {{ $t('okr.noTeamMembers') }}
        p.mt-1(style="color: var(--text-muted)") {{ $t('okr.loadTeamData') }}

      .grid.gap-6(class="grid-cols-1 md:grid-cols-2 xl:grid-cols-3" v-if="teamMembers.length")
        .glass-card.p-5.rounded-2xl(v-for="member in teamMembersWithGoals" :key="member.id")
          .flex.items-center.gap-4.mb-4
            .w-14.h-14.rounded-full.overflow-hidden.border-2(style="border-color: #7849ff")
              img.w-full.h-full.object-cover(:src="member.avatar || '/images/avatar-placeholder.png'" :alt="member.name")
            div
              h4.text-sm.font-bold(style="color: var(--text-primary)") {{ member.name }}
              p.text-xs(style="color: var(--text-muted)") {{ member.role || $t('okr.teamMember') }}
              .flex.items-center.gap-2.mt-1
                el-tag(size="small" type="info" round) {{ member.completedGoals }}/{{ member.totalGoals }} {{ $t('okr.completed') }}

          //- Progress ring chart
          .flex.items-center.justify-center.mb-4(v-if="member.totalGoals > 0")
            VChart.w-full(:option="getMemberRingOption(member)" :style="{ height: '140px' }" autoresize)

          //- Top 3 goals mini progress bars
          .space-y-3(v-if="member.topGoals.length")
            .flex.items-center.gap-3(v-for="goal in member.topGoals" :key="goal.id")
              .flex-1
                .flex.items-center.justify-between.mb-1
                  span.text-xs.truncate(style="color: var(--text-primary); max-width: 180px") {{ goal.title }}
                  span.text-xs.font-bold(:style="{ color: getProgressColor(goal.progress) }") {{ goal.progress }}%
                .w-full.rounded-full.overflow-hidden(style="height: 4px; background: var(--glass-border)")
                  .h-full.rounded-full.transition-all.duration-500(:style="{ width: Math.min(goal.progress, 100) + '%', background: getProgressColor(goal.progress) }")

          //- No goals for this member
          .text-center.py-4(v-if="!member.topGoals.length")
            p.text-xs(style="color: var(--text-muted)") {{ $t('okr.noGoalsAssigned') }}

    //- ═══════════════════════════════════════════════
    //- TAB 5: Progress Timeline
    //- ═══════════════════════════════════════════════
    el-tab-pane(:label="$t('okr.progressTimeline')" name="timeline")
      .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
        //- Timeline chart
        .glass-card.p-6.rounded-2xl
          h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
            Icon(name="ph:chart-line-up-bold" size="16" class="mr-2" style="color: #7849ff")
            | {{ $t('okr.progressOverTime') }}
          VChart.w-full(v-if="progressChartOption" :option="progressChartOption" :style="{ height: '320px' }" autoresize)
          .text-center.py-8(v-else)
            p.text-xs(style="color: var(--text-muted)") {{ $t('okr.noTimelineData') }}

        //- Activity log
        .glass-card.p-6.rounded-2xl
          h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
            Icon(name="ph:clock-counter-clockwise-bold" size="16" class="mr-2" style="color: #7849ff")
            | {{ $t('okr.recentUpdates') }}
          .space-y-0(v-if="progressHistory.length")
            el-timeline
              el-timeline-item(
                v-for="entry in progressHistory"
                :key="entry.id"
                :timestamp="formatDateTime(entry.date)"
                placement="top"
                :color="getProgressColor(entry.newValue)"
              )
                .glass-card.p-4.rounded-xl
                  .flex.items-center.justify-between
                    div
                      p.text-sm.font-medium(style="color: var(--text-primary)") {{ entry.goalTitle }}
                      p.text-xs.mt-1(style="color: var(--text-muted)")
                        | {{ entry.updatedBy }} {{ $t('okr.updatedProgressFrom') }}
                        span.font-bold.mx-1(:style="{ color: getProgressColor(entry.oldValue) }") {{ entry.oldValue }}%
                        | {{ $t('okr.to') }}
                        span.font-bold.mx-1(:style="{ color: getProgressColor(entry.newValue) }") {{ entry.newValue }}%
                    .w-10.h-10.rounded-lg.flex.items-center.justify-center(:style="{ background: getProgressColor(entry.newValue) + '20' }")
                      Icon(name="ph:trend-up" size="18" :style="{ color: getProgressColor(entry.newValue) }")
          .text-center.py-8(v-else)
            Icon(name="ph:clock-counter-clockwise" size="32" style="color: var(--text-muted)")
            p.text-xs.mt-2(style="color: var(--text-muted)") {{ $t('okr.noUpdatesYet') }}

  //- ═══════════════════════════════════════════════
  //- Goal Creation / Edit Dialog
  //- ═══════════════════════════════════════════════
  el-dialog(
    v-model="showCreateDialog"
    :title="editingId ? $t('okr.editGoal') : (createType === 'objective' ? $t('okr.createObjective') : $t('okr.createKeyResult'))"
    width="600px"
    @close="resetForm"
  )
    el-form(label-position="top" :model="goalForm")
      el-form-item(:label="$t('okr.goalTitle')")
        el-input(v-model="goalForm.title" :placeholder="createType === 'objective' ? $t('okr.objectivePlaceholder') : $t('okr.keyResultPlaceholder')")

      el-form-item(:label="$t('okr.description')")
        el-input(v-model="goalForm.description" type="textarea" :rows="2" :placeholder="$t('okr.descriptionPlaceholder')")

      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('okr.type')")
          el-select(v-model="goalForm.type" style="width: 100%" @change="onTypeChange")
            el-option(value="objective" :label="$t('okr.objective')")
            el-option(value="keyResult" :label="$t('okr.keyResult')")

        el-form-item(:label="$t('okr.parentObjective')" v-if="goalForm.type === 'keyResult'")
          el-select(v-model="goalForm.objectiveId" style="width: 100%" :placeholder="$t('okr.selectObjective')")
            el-option(v-for="obj in objectives" :key="obj.id" :value="obj.id" :label="obj.title")

      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('okr.owner')")
          el-select(v-model="goalForm.owner" style="width: 100%" :placeholder="$t('okr.selectOwner')" filterable)
            el-option(v-for="member in teamMembers" :key="member.id" :value="member.name" :label="member.name")

        el-form-item(:label="$t('okr.visibility')")
          el-select(v-model="goalForm.visibility" style="width: 100%")
            el-option(value="company" :label="$t('okr.company')")
            el-option(value="department" :label="$t('okr.department')")
            el-option(value="team" :label="$t('okr.team')")
            el-option(value="private" :label="$t('okr.private')")

      .grid.gap-4(class="grid-cols-2" v-if="goalForm.type === 'keyResult'")
        el-form-item(:label="$t('okr.metricType')")
          el-select(v-model="goalForm.metricType" style="width: 100%")
            el-option(value="number" :label="$t('okr.number')")
            el-option(value="currency" :label="$t('okr.currency')")
            el-option(value="percentage" :label="$t('okr.percentage')")
            el-option(value="boolean" :label="$t('okr.boolean')")

        el-form-item(:label="$t('okr.targetValue')")
          el-input-number(v-if="goalForm.metricType !== 'boolean'" v-model="goalForm.targetValue" :min="0" :controls="false" style="width: 100%")
          el-switch(v-else v-model="goalForm.boolTarget" :active-text="$t('okr.yes')" :inactive-text="$t('okr.no')")

      .grid.gap-4(class="grid-cols-2" v-if="goalForm.type === 'keyResult' && goalForm.metricType !== 'boolean'")
        el-form-item(:label="$t('okr.currentValue')")
          el-input-number(v-model="goalForm.currentValue" :min="0" :controls="false" style="width: 100%")

      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('okr.startDate')")
          el-date-picker(v-model="goalForm.startDate" type="date" style="width: 100%" :placeholder="$t('okr.selectDate')")
        el-form-item(:label="$t('okr.dueDate')")
          el-date-picker(v-model="goalForm.dueDate" type="date" style="width: 100%" :placeholder="$t('okr.selectDate')")

    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showCreateDialog = false") {{ $t('okr.cancel') }}
        el-button(
          type="primary"
          @click="saveGoal"
          :disabled="!goalForm.title"
          class="!bg-[#7849ff] !border-none"
        ) {{ editingId ? $t('okr.update') : $t('okr.create') }}

  //- ═══════════════════════════════════════════════
  //- Update Progress Dialog
  //- ═══════════════════════════════════════════════
  el-dialog(v-model="showProgressDialog" :title="$t('okr.updateProgress')" width="450px")
    .space-y-4(v-if="progressKR")
      .glass-card.p-4.rounded-xl
        p.text-sm.font-bold(style="color: var(--text-primary)") {{ progressKR.title }}
        p.text-xs.mt-1(style="color: var(--text-muted)") {{ getObjectiveTitle(progressKR.objectiveId) }}
      .flex.items-center.justify-between
        span.text-sm(style="color: var(--text-muted)") {{ $t('okr.currentValue') }}
        span.text-sm.font-bold(style="color: var(--text-primary)") {{ formatMetricValue(progressKR.currentValue, progressKR.metricType) }}
      .flex.items-center.justify-between
        span.text-sm(style="color: var(--text-muted)") {{ $t('okr.targetValue') }}
        span.text-sm.font-bold(style="color: var(--text-muted)") {{ formatMetricValue(progressKR.targetValue, progressKR.metricType) }}
      el-divider
      el-form-item(:label="$t('okr.newValue')")
        el-input-number(v-if="progressKR.metricType !== 'boolean'" v-model="newProgressValue" :min="0" :controls="true" style="width: 100%")
        el-switch(v-else v-model="newProgressBool" :active-text="$t('okr.yes')" :inactive-text="$t('okr.no')")

    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showProgressDialog = false") {{ $t('okr.cancel') }}
        el-button(type="primary" @click="submitProgress" class="!bg-[#7849ff] !border-none") {{ $t('okr.updateProgress') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import VChart from 'vue-echarts';
import { graphic } from 'echarts/core';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();

// ─── State ───────────────────────────────────────────
const loading = ref(false);
const activeTab = ref('objectives');
const selectedPeriod = ref('quarterly');
const showCreateDialog = ref(false);
const showProgressDialog = ref(false);
const createType = ref<'objective' | 'keyResult'>('objective');
const editingId = ref<string | null>(null);
const expandedObjectives = ref<string[]>([]);
const krSearch = ref('');
const treeRef = ref<Record<string, unknown> | null>(null);

// ─── Interfaces ──────────────────────────────────────
interface Objective {
  id: string;
  title: string;
  description: string;
  status: 'onTrack' | 'atRisk' | 'behind' | 'completed';
  progress: number;
  owner: string;
  ownerAvatar?: string;
  dueDate: string;
  startDate: string;
  visibility: string;
}

interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  metricType: 'number' | 'currency' | 'percentage' | 'boolean';
  targetValue: number;
  currentValue: number;
  progress: number;
  owner: string;
  ownerAvatar?: string;
  dueDate: string;
  startDate: string;
}

interface ProgressEntry {
  id: string;
  goalTitle: string;
  krId: string;
  date: string;
  oldValue: number;
  newValue: number;
  updatedBy: string;
}

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
}

// ─── Data ────────────────────────────────────────────
const objectives = ref<Objective[]>([]);
const keyResults = ref<KeyResult[]>([]);
const progressHistory = ref<ProgressEntry[]>([]);
const teamMembers = ref<TeamMember[]>([]);

// ─── Form ────────────────────────────────────────────
const goalForm = ref({
  title: '',
  description: '',
  type: 'objective' as 'objective' | 'keyResult',
  objectiveId: '',
  owner: '',
  visibility: 'company',
  metricType: 'number' as 'number' | 'currency' | 'percentage' | 'boolean',
  targetValue: 100,
  currentValue: 0,
  boolTarget: false,
  startDate: new Date(),
  dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
});

const progressKR = ref<KeyResult | null>(null);
const newProgressValue = ref(0);
const newProgressBool = ref(false);

// ─── Tree ────────────────────────────────────────────
const treeProps = {
  children: 'children',
  label: 'label'
};

// ─── Computed ────────────────────────────────────────
const summaryStats = computed(() => {
  const total = objectives.value.length;
  const onTrack = objectives.value.filter(o => o.status === 'onTrack').length;
  const atRisk = objectives.value.filter(o => o.status === 'atRisk').length;
  const behind = objectives.value.filter(o => o.status === 'behind').length;
  const completed = objectives.value.filter(o => o.status === 'completed').length;
  const avgProgress = total > 0 ? Math.round(objectives.value.reduce((s, o) => s + o.progress, 0) / total) : 0;

  return [
    { label: t('okr.totalObjectives'), value: total, icon: 'ph:target-bold', color: '#7849ff' },
    { label: t('okr.onTrack'), value: onTrack, icon: 'ph:check-circle-bold', color: '#10b981' },
    { label: t('okr.atRisk'), value: atRisk, icon: 'ph:warning-bold', color: '#f59e0b' },
    { label: t('okr.behind'), value: behind, icon: 'ph:x-circle-bold', color: '#ef4444' },
    { label: t('okr.completed'), value: completed, icon: 'ph:trophy-bold', color: '#22c55e' },
    { label: t('okr.avgProgress'), value: avgProgress + '%', icon: 'ph:chart-line-up-bold', color: '#3b82f6' }
  ];
});

const filteredKeyResults = computed(() => {
  if (!krSearch.value) return keyResults.value;
  const search = krSearch.value.toLowerCase();
  return keyResults.value.filter(kr => kr.title.toLowerCase().includes(search) || kr.owner.toLowerCase().includes(search));
});

const hierarchyTree = computed(() => {
  // Build: Company level -> objectives -> key results
  const companyNode = {
    id: 'company',
    label: t('okr.companyObjectives'),
    level: 'company',
    ownerName: '',
    progress: objectives.value.length ? Math.round(objectives.value.reduce((s, o) => s + o.progress, 0) / objectives.value.length) : 0,
    children: objectives.value.map(obj => ({
      id: obj.id,
      label: obj.title,
      level: 'department',
      ownerName: obj.owner,
      progress: obj.progress,
      children: getKeyResultsForObjective(obj.id).map(kr => ({
        id: kr.id,
        label: kr.title,
        level: 'individual',
        ownerName: kr.owner,
        progress: kr.progress,
        children: [] as unknown[]
      }))
    }))
  };
  return [companyNode];
});

const teamMembersWithGoals = computed(() => {
  return teamMembers.value.map(member => {
    const memberKRs = keyResults.value.filter(kr => kr.owner === member.name);
    const memberObjectives = objectives.value.filter(o => o.owner === member.name);
    const allGoals = [
      ...memberObjectives.map(o => ({ id: o.id, title: o.title, progress: o.progress })),
      ...memberKRs.map(kr => ({ id: kr.id, title: kr.title, progress: kr.progress }))
    ];
    const completedGoals = allGoals.filter(g => g.progress >= 100).length;
    const overallProgress = allGoals.length ? Math.round(allGoals.reduce((s, g) => s + g.progress, 0) / allGoals.length) : 0;

    return {
      ...member,
      totalGoals: allGoals.length,
      completedGoals,
      overallProgress,
      topGoals: allGoals.slice(0, 3)
    };
  });
});

const progressChartOption = computed(() => {
  if (!progressHistory.value.length) return null;

  // Group progress entries by date for chart
  const dateMap = new Map<string, number[]>();
  progressHistory.value.forEach(entry => {
    const dateKey = entry.date.split('T')[0] || entry.date;
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, []);
    dateMap.get(dateKey)!.push(entry.newValue);
  });

  const dates = Array.from(dateMap.keys()).sort();
  const values = dates.map(d => {
    const vals = dateMap.get(d)!;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  });

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 30, 45, 0.85)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); border-radius: 16px;'
    },
    grid: { top: 30, right: 30, bottom: 30, left: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { type: 'dashed' as const, color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', formatter: '{value}%' }
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#7849ff',
          shadowBlur: 15,
          shadowColor: 'rgba(120, 73, 255, 0.4)',
          shadowOffsetY: 8
        },
        itemStyle: {
          color: '#fff',
          borderColor: '#7849ff',
          borderWidth: 2
        },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(120, 73, 255, 0.3)' },
            { offset: 1, color: 'rgba(120, 73, 255, 0)' }
          ])
        }
      }
    ]
  };
});

// ─── Methods ─────────────────────────────────────────
function getKeyResultsForObjective(objId: string): KeyResult[] {
  return keyResults.value.filter(kr => kr.objectiveId === objId);
}

function getObjectiveTitle(objId: string): string {
  return objectives.value.find(o => o.id === objId)?.title || '';
}

function toggleExpand(objId: string) {
  const idx = expandedObjectives.value.indexOf(objId);
  if (idx >= 0) {
    expandedObjectives.value.splice(idx, 1);
  } else {
    expandedObjectives.value.push(objId);
  }
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    onTrack: '#10b981',
    atRisk: '#f59e0b',
    behind: '#ef4444',
    completed: '#22c55e'
  };
  return colors[status] || '#7849ff';
}

function getStatusTagType(status: string): string {
  const types: Record<string, string> = {
    onTrack: 'success',
    atRisk: 'warning',
    behind: 'danger',
    completed: 'success'
  };
  return types[status] || 'info';
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return '#22c55e';
  if (progress >= 70) return '#10b981';
  if (progress >= 40) return '#f59e0b';
  return '#ef4444';
}

function getDaysRemaining(dueDate: string): string {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return t('okr.overdue');
  if (diff === 0) return t('okr.dueToday');
  return `${diff} ${t('okr.daysLeft')}`;
}

function getDaysRemainingColor(dueDate: string): string {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '#ef4444';
  if (diff <= 7) return '#f59e0b';
  return 'var(--text-muted)';
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatMetricValue(value: number, metricType: string): string {
  switch (metricType) {
    case 'currency':
      return '$' + Number(value || 0).toLocaleString();
    case 'percentage':
      return value + '%';
    case 'boolean':
      return value ? t('okr.yes') : t('okr.no');
    default:
      return String(value || 0);
  }
}

function getNodeColor(level: string): string {
  const colors: Record<string, string> = {
    company: '#7849ff',
    department: '#3b82f6',
    team: '#10b981',
    individual: '#f59e0b'
  };
  return colors[level] || '#7849ff';
}

function getNodeIcon(level: string): string {
  const icons: Record<string, string> = {
    company: 'ph:buildings-bold',
    department: 'ph:flag-bold',
    team: 'ph:users-three-bold',
    individual: 'ph:key-bold'
  };
  return icons[level] || 'ph:target';
}

function expandAllNodes() {
  const tree = treeRef.value;
  if (tree) {
    const root = tree.store?.root;
    if (root) {
      const expand = (node: unknown) => {
        node.expanded = true;
        if (node.childNodes) node.childNodes.forEach(expand);
      };
      expand(root);
    }
  }
}

function collapseAllNodes() {
  const tree = treeRef.value;
  if (tree) {
    const root = tree.store?.root;
    if (root) {
      const collapse = (node: unknown) => {
        node.expanded = false;
        if (node.childNodes) node.childNodes.forEach(collapse);
      };
      collapse(root);
      root.expanded = true; // Keep root visible
    }
  }
}

function getMemberRingOption(member: unknown) {
  return {
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: 'transparent',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#fff',
          formatter: () => member.overallProgress + '%'
        },
        emphasis: { scale: false },
        data: [
          { value: member.overallProgress, name: t('okr.completed'), itemStyle: { color: '#7849ff' } },
          { value: 100 - member.overallProgress, name: t('okr.remaining'), itemStyle: { color: 'rgba(255,255,255,0.06)' } }
        ]
      }
    ]
  };
}

// ─── CRUD Operations ─────────────────────────────────
function openCreateDialog(type: 'objective' | 'keyResult', parentId?: string) {
  createType.value = type;
  editingId.value = null;
  goalForm.value = {
    title: '',
    description: '',
    type,
    objectiveId: parentId || '',
    owner: '',
    visibility: 'company',
    metricType: 'number',
    targetValue: 100,
    currentValue: 0,
    boolTarget: false,
    startDate: new Date(),
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  };
  showCreateDialog.value = true;
}

function onTypeChange() {
  createType.value = goalForm.value.type;
}

function editObjective(obj: Objective) {
  editingId.value = obj.id;
  createType.value = 'objective';
  goalForm.value = {
    title: obj.title,
    description: obj.description,
    type: 'objective',
    objectiveId: '',
    owner: obj.owner,
    visibility: obj.visibility,
    metricType: 'number',
    targetValue: 100,
    currentValue: 0,
    boolTarget: false,
    startDate: new Date(obj.startDate),
    dueDate: new Date(obj.dueDate)
  };
  showCreateDialog.value = true;
}

function resetForm() {
  editingId.value = null;
  goalForm.value = {
    title: '',
    description: '',
    type: 'objective',
    objectiveId: '',
    owner: '',
    visibility: 'company',
    metricType: 'number',
    targetValue: 100,
    currentValue: 0,
    boolTarget: false,
    startDate: new Date(),
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  };
}

function computeObjectiveProgress(objId: string): number {
  const krs = getKeyResultsForObjective(objId);
  if (!krs.length) return 0;
  return Math.round(krs.reduce((sum, kr) => sum + kr.progress, 0) / krs.length);
}

function computeObjectiveStatus(progress: number, dueDate: string): Objective['status'] {
  if (progress >= 100) return 'completed';
  const daysLeft = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const expectedProgress = Math.max(0, 100 - (daysLeft / 90) * 100);
  if (progress >= expectedProgress - 10) return 'onTrack';
  if (progress >= expectedProgress - 30) return 'atRisk';
  return 'behind';
}

function recalcObjective(objId: string) {
  const objIdx = objectives.value.findIndex(o => o.id === objId);
  if (objIdx >= 0) {
    const progress = computeObjectiveProgress(objId);
    objectives.value[objIdx]!.progress = progress;
    objectives.value[objIdx]!.status = computeObjectiveStatus(progress, objectives.value[objIdx]!.dueDate);
  }
}

function saveGoal() {
  if (!goalForm.value.title) return;

  if (goalForm.value.type === 'objective') {
    if (editingId.value) {
      const idx = objectives.value.findIndex(o => o.id === editingId.value);
      if (idx >= 0) {
        objectives.value[idx] = {
          ...objectives.value[idx]!,
          title: goalForm.value.title,
          description: goalForm.value.description,
          owner: goalForm.value.owner,
          visibility: goalForm.value.visibility,
          startDate: new Date(goalForm.value.startDate).toISOString(),
          dueDate: new Date(goalForm.value.dueDate).toISOString()
        };
        recalcObjective(editingId.value);
      }
      ElNotification({ type: 'success', title: t('okr.updated'), message: t('okr.objectiveUpdated') });
    } else {
      const newObj: Objective = {
        id: 'obj-' + Date.now(),
        title: goalForm.value.title,
        description: goalForm.value.description,
        status: 'onTrack',
        progress: 0,
        owner: goalForm.value.owner || t('okr.unassigned'),
        dueDate: new Date(goalForm.value.dueDate).toISOString(),
        startDate: new Date(goalForm.value.startDate).toISOString(),
        visibility: goalForm.value.visibility
      };
      objectives.value.push(newObj);
      ElNotification({ type: 'success', title: t('okr.created'), message: t('okr.objectiveCreated') });
    }
  } else {
    // Key Result
    if (!goalForm.value.objectiveId) {
      ElNotification({ type: 'warning', title: t('okr.warning'), message: t('okr.selectObjectiveFirst') });
      return;
    }

    const targetVal = goalForm.value.metricType === 'boolean' ? 1 : goalForm.value.targetValue;
    const currentVal = goalForm.value.metricType === 'boolean' ? (goalForm.value.boolTarget ? 1 : 0) : goalForm.value.currentValue;
    const progress = targetVal > 0 ? Math.min(Math.round((currentVal / targetVal) * 100), 100) : 0;

    const newKR: KeyResult = {
      id: 'kr-' + Date.now(),
      objectiveId: goalForm.value.objectiveId,
      title: goalForm.value.title,
      metricType: goalForm.value.metricType,
      targetValue: targetVal,
      currentValue: currentVal,
      progress,
      owner: goalForm.value.owner || t('okr.unassigned'),
      dueDate: new Date(goalForm.value.dueDate).toISOString(),
      startDate: new Date(goalForm.value.startDate).toISOString()
    };

    keyResults.value.push(newKR);
    recalcObjective(goalForm.value.objectiveId);

    // Expand to show the new KR
    if (!expandedObjectives.value.includes(goalForm.value.objectiveId)) {
      expandedObjectives.value.push(goalForm.value.objectiveId);
    }

    ElNotification({ type: 'success', title: t('okr.created'), message: t('okr.keyResultCreated') });
  }

  showCreateDialog.value = false;
  resetForm();
}

async function deleteObjective(obj: Objective) {
  try {
    await ElMessageBox.confirm(`${t('okr.deleteConfirm')} "${obj.title}"?`, t('okr.delete'), {
      type: 'warning',
      confirmButtonText: t('okr.delete'),
      cancelButtonText: t('okr.cancel')
    });
    // Remove KRs belonging to this objective
    keyResults.value = keyResults.value.filter(kr => kr.objectiveId !== obj.id);
    objectives.value = objectives.value.filter(o => o.id !== obj.id);
    ElNotification({ type: 'success', title: t('okr.deleted'), message: t('okr.objectiveDeleted') });
  } catch {
    /* cancelled */
  }
}

async function deleteKeyResult(kr: KeyResult) {
  try {
    await ElMessageBox.confirm(`${t('okr.deleteConfirm')} "${kr.title}"?`, t('okr.delete'), {
      type: 'warning',
      confirmButtonText: t('okr.delete'),
      cancelButtonText: t('okr.cancel')
    });
    keyResults.value = keyResults.value.filter(k => k.id !== kr.id);
    recalcObjective(kr.objectiveId);
    ElNotification({ type: 'success', title: t('okr.deleted'), message: t('okr.keyResultDeleted') });
  } catch {
    /* cancelled */
  }
}

function openUpdateProgress(kr: KeyResult) {
  progressKR.value = { ...kr };
  newProgressValue.value = kr.currentValue;
  newProgressBool.value = kr.currentValue >= 1;
  showProgressDialog.value = true;
}

function submitProgress() {
  if (!progressKR.value) return;

  const kr = keyResults.value.find(k => k.id === progressKR.value!.id);
  if (!kr) return;

  const oldProgress = kr.progress;
  const newVal = kr.metricType === 'boolean' ? (newProgressBool.value ? 1 : 0) : newProgressValue.value;

  kr.currentValue = newVal;
  kr.progress = kr.targetValue > 0 ? Math.min(Math.round((newVal / kr.targetValue) * 100), 100) : 0;

  recalcObjective(kr.objectiveId);

  // Record in timeline
  progressHistory.value.unshift({
    id: 'ph-' + Date.now(),
    goalTitle: kr.title,
    krId: kr.id,
    date: new Date().toISOString(),
    oldValue: oldProgress,
    newValue: kr.progress,
    updatedBy: kr.owner
  });

  showProgressDialog.value = false;
  ElNotification({ type: 'success', title: t('okr.updated'), message: t('okr.progressUpdated') });
}

// ─── Data Loading ────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    // Load team members
    const { body: usersBody, success: usersOk } = await useApiFetch('users?limit=50');
    if (usersOk && usersBody) {
      const users = (usersBody as unknown).docs || usersBody || [];
      teamMembers.value = users.map((u) => ({
        id: u.id || u._id,
        name: u.name || u.fullName || 'Unknown',
        role: u.role || u.position || '',
        avatar: u.avatar || u.profilePicture || ''
      }));
    }

    // Load goals from API if available
    try {
      const { body: goalsBody, success: goalsOk } = await useApiFetch('goals?limit=100');
      if (goalsOk && goalsBody) {
        const goalsDocs = (goalsBody as unknown).docs || goalsBody || [];
        if (goalsDocs.length) {
          // Parse real objectives and key results from API
          goalsDocs.forEach((g) => {
            if (g.type === 'objective') {
              objectives.value.push({
                id: g.id || g._id,
                title: g.title || g.name,
                description: g.description || '',
                status: g.status || 'onTrack',
                progress: g.progress || 0,
                owner: g.owner?.name || g.ownerName || '',
                ownerAvatar: g.owner?.avatar || '',
                dueDate: g.dueDate || g.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                startDate: g.startDate || new Date().toISOString(),
                visibility: g.visibility || 'company'
              });
            } else if (g.type === 'keyResult') {
              keyResults.value.push({
                id: g.id || g._id,
                objectiveId: g.objectiveId || g.parentId || '',
                title: g.title || g.name,
                metricType: g.metricType || 'number',
                targetValue: g.targetValue || g.target || 100,
                currentValue: g.currentValue || g.current || 0,
                progress: g.progress || 0,
                owner: g.owner?.name || g.ownerName || '',
                ownerAvatar: g.owner?.avatar || '',
                dueDate: g.dueDate || g.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                startDate: g.startDate || new Date().toISOString()
              });
            }
          });
          loading.value = false;
          return;
        }
      }
    } catch {
      // API not available, use seed data
    }

    // Seed demo data if no API data found
    seedDemoData();
  } catch {
    seedDemoData();
  } finally {
    loading.value = false;
  }
}

function seedDemoData() {
  const now = new Date();
  const q1End = new Date(now.getFullYear(), 2, 31).toISOString();
  const q2End = new Date(now.getFullYear(), 5, 30).toISOString();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const ownerNames = teamMembers.value.length
    ? teamMembers.value.map(m => m.name)
    : ['Sarah Johnson', 'Ahmed Al-Rashid', 'David Chen', 'Maria Garcia'];

  objectives.value = [
    {
      id: 'obj-1',
      title: t('okr.demoObj1Title'),
      description: t('okr.demoObj1Desc'),
      status: 'onTrack',
      progress: 68,
      owner: ownerNames[0] || 'Sarah Johnson',
      dueDate: q1End,
      startDate: yearStart,
      visibility: 'company'
    },
    {
      id: 'obj-2',
      title: t('okr.demoObj2Title'),
      description: t('okr.demoObj2Desc'),
      status: 'atRisk',
      progress: 42,
      owner: ownerNames[1] || 'Ahmed Al-Rashid',
      dueDate: q2End,
      startDate: yearStart,
      visibility: 'company'
    },
    {
      id: 'obj-3',
      title: t('okr.demoObj3Title'),
      description: t('okr.demoObj3Desc'),
      status: 'behind',
      progress: 25,
      owner: ownerNames[2] || 'David Chen',
      dueDate: q1End,
      startDate: yearStart,
      visibility: 'department'
    },
    {
      id: 'obj-4',
      title: t('okr.demoObj4Title'),
      description: t('okr.demoObj4Desc'),
      status: 'completed',
      progress: 100,
      owner: ownerNames[3] || 'Maria Garcia',
      dueDate: q1End,
      startDate: yearStart,
      visibility: 'company'
    }
  ];

  keyResults.value = [
    // Obj 1 KRs
    {
      id: 'kr-1',
      objectiveId: 'obj-1',
      title: t('okr.demoKR1'),
      metricType: 'currency',
      targetValue: 100000,
      currentValue: 72000,
      progress: 72,
      owner: ownerNames[0] || 'Sarah Johnson',
      dueDate: q1End,
      startDate: yearStart
    },
    {
      id: 'kr-2',
      objectiveId: 'obj-1',
      title: t('okr.demoKR2'),
      metricType: 'number',
      targetValue: 50,
      currentValue: 34,
      progress: 68,
      owner: ownerNames[0] || 'Sarah Johnson',
      dueDate: q1End,
      startDate: yearStart
    },
    {
      id: 'kr-3',
      objectiveId: 'obj-1',
      title: t('okr.demoKR3'),
      metricType: 'percentage',
      targetValue: 30,
      currentValue: 19,
      progress: 63,
      owner: ownerNames[1] || 'Ahmed Al-Rashid',
      dueDate: q1End,
      startDate: yearStart
    },
    // Obj 2 KRs
    {
      id: 'kr-4',
      objectiveId: 'obj-2',
      title: t('okr.demoKR4'),
      metricType: 'number',
      targetValue: 200,
      currentValue: 85,
      progress: 43,
      owner: ownerNames[1] || 'Ahmed Al-Rashid',
      dueDate: q2End,
      startDate: yearStart
    },
    {
      id: 'kr-5',
      objectiveId: 'obj-2',
      title: t('okr.demoKR5'),
      metricType: 'percentage',
      targetValue: 90,
      currentValue: 72,
      progress: 80,
      owner: ownerNames[2] || 'David Chen',
      dueDate: q2End,
      startDate: yearStart
    },
    // Obj 3 KRs
    {
      id: 'kr-6',
      objectiveId: 'obj-3',
      title: t('okr.demoKR6'),
      metricType: 'currency',
      targetValue: 50000,
      currentValue: 12000,
      progress: 24,
      owner: ownerNames[2] || 'David Chen',
      dueDate: q1End,
      startDate: yearStart
    },
    {
      id: 'kr-7',
      objectiveId: 'obj-3',
      title: t('okr.demoKR7'),
      metricType: 'boolean',
      targetValue: 1,
      currentValue: 0,
      progress: 0,
      owner: ownerNames[3] || 'Maria Garcia',
      dueDate: q1End,
      startDate: yearStart
    },
    // Obj 4 KRs
    {
      id: 'kr-8',
      objectiveId: 'obj-4',
      title: t('okr.demoKR8'),
      metricType: 'number',
      targetValue: 10,
      currentValue: 10,
      progress: 100,
      owner: ownerNames[3] || 'Maria Garcia',
      dueDate: q1End,
      startDate: yearStart
    },
    {
      id: 'kr-9',
      objectiveId: 'obj-4',
      title: t('okr.demoKR9'),
      metricType: 'percentage',
      targetValue: 95,
      currentValue: 97,
      progress: 100,
      owner: ownerNames[0] || 'Sarah Johnson',
      dueDate: q1End,
      startDate: yearStart
    }
  ];

  // Seed progress history
  const demoHistory: ProgressEntry[] = [];
  const histDays = [1, 3, 5, 7, 10, 14, 18, 21];
  histDays.forEach((daysAgo, i) => {
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const kr = keyResults.value[i % keyResults.value.length]!;
    demoHistory.push({
      id: 'ph-' + i,
      goalTitle: kr.title,
      krId: kr.id,
      date: date.toISOString(),
      oldValue: Math.max(0, kr.progress - 10 - Math.floor(Math.random() * 15)),
      newValue: kr.progress,
      updatedBy: kr.owner
    });
  });
  progressHistory.value = demoHistory;

  // Expand first objective by default
  expandedObjectives.value = ['obj-1'];
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.okr-page {
  animation: fadeIn 0.3s ease-out;
}

.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

.okr-tabs :deep(.el-tabs__header) {
  background: var(--glass-bg, rgba(255, 255, 255, 0.04));
  border-color: var(--glass-border, rgba(255, 255, 255, 0.08));
  border-radius: 12px 12px 0 0;
}

.okr-tabs :deep(.el-tabs__content) {
  padding: 24px;
  background: transparent;
}

.okr-tabs :deep(.el-tabs__item) {
  color: var(--text-muted, #94a3b8);
}

.okr-tabs :deep(.el-tabs__item.is-active) {
  color: #7849ff;
}

.okr-tabs :deep(.el-tabs__active-bar) {
  background-color: #7849ff;
}

.hierarchy-tree :deep(.el-tree) {
  background: transparent;
  color: var(--text-primary);
}

.hierarchy-tree :deep(.el-tree-node__content) {
  height: auto;
  min-height: 48px;
  padding: 4px 0;
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.05));
  transition: background 0.2s;
}

.hierarchy-tree :deep(.el-tree-node__content:hover) {
  background: var(--bg-input, rgba(255, 255, 255, 0.04));
}

.hierarchy-tree :deep(.el-tree-node__expand-icon) {
  color: var(--text-muted, #94a3b8);
}

:deep(.el-timeline-item__timestamp) {
  color: var(--text-muted, #94a3b8) !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .okr-page {
    padding: 16px;
  }
}
</style>
