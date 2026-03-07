<template lang="pug">
.compliance-center-page.p-6(class="md:p-8")
  //- Page Header
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary)")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #7849ff, #6a3ae0)")
          Icon(name="ph:shield-check-bold" size="22" style="color: white")
        | {{ $t('complianceCenter.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('complianceCenter.subtitle') }}

    .flex.items-center.gap-3
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :start-placeholder="$t('complianceCenter.startDate')"
        :end-placeholder="$t('complianceCenter.endDate')"
        size="large"
        class="!rounded-xl"
        value-format="YYYY-MM-DD"
      )
      el-button(size="large" type="primary" class="!bg-[#7849ff] !border-none !rounded-xl" @click="refreshData" :loading="loading")
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-2 {{ $t('complianceCenter.refresh') }}

  //- KPI Cards
  .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" v-loading="loading")
    //- Consent Rate
    .kpi-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('complianceCenter.consentRate') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ kpiData.consentRate }}%
              span.kpi-trend.text-green-400
                Icon(name="ph:trend-up-bold" size="14")
                | +2.4%
          .kpi-icon-wrap(style="background: rgba(34, 197, 94, 0.1)")
            Icon(name="ph:check-square-bold" size="24" style="color: #22c55e")

    //- Active Policies
    .kpi-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('complianceCenter.activePolicies') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ kpiData.activePolicies }}
          .kpi-icon-wrap(style="background: rgba(59, 130, 246, 0.1)")
            Icon(name="ph:file-text-bold" size="24" style="color: #3b82f6")

    //- Open DSR Requests
    .kpi-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('complianceCenter.openDsrRequests') }}
            .flex.items-baseline.gap-2
              p.kpi-value(:style="{ color: kpiData.openDsrRequests > 5 ? '#ef4444' : '#f59e0b' }") {{ kpiData.openDsrRequests }}
              el-tag(v-if="kpiData.openDsrRequests > 5" type="danger" size="small" effect="dark" round) {{ $t('complianceCenter.urgent') }}
          .kpi-icon-wrap(style="background: rgba(245, 158, 11, 0.1)")
            Icon(name="ph:user-circle-bold" size="24" style="color: #f59e0b")

    //- Audit Score
    .kpi-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('complianceCenter.auditScore') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ kpiData.auditScore }}%
              .w-2.h-2.rounded-full(:style="{ background: kpiData.auditScore >= 90 ? '#22c55e' : kpiData.auditScore >= 70 ? '#f59e0b' : '#ef4444' }")
          .kpi-icon-wrap(style="background: rgba(120, 73, 255, 0.1)")
            Icon(name="ph:shield-check-bold" size="24" style="color: #7849ff")

  //- Tabs
  .max-w-full(v-if="!loading")
    el-tabs(v-model="activeTab")

      //- Tab 1: Consent Management
      el-tab-pane(:label="$t('complianceCenter.consentManagement')" name="consent")
        .glass-card.rounded-2xl.overflow-hidden.mb-6
          .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--border-default)")
            h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceCenter.consentRecords') }}
            .flex.items-center.gap-2
              el-select(v-model="consentTypeFilter" clearable :placeholder="$t('complianceCenter.allTypes')" size="large" style="width: 180px")
                el-option(:label="$t('complianceCenter.allTypes')" value="")
                el-option(:label="$t('complianceCenter.marketing')" value="marketing")
                el-option(:label="$t('complianceCenter.analytics')" value="analytics")
                el-option(:label="$t('complianceCenter.essential')" value="essential")
              el-input(
                v-model="consentSearch"
                :placeholder="$t('complianceCenter.searchContacts')"
                prefix-icon="Search"
                clearable
                size="large"
                style="width: 240px"
              )

          el-table(:data="filteredConsentRecords" style="width: 100%" stripe)
            el-table-column(:label="$t('complianceCenter.contact')" min-width="220")
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .w-8.h-8.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(style="background: linear-gradient(135deg, #7849ff, #a78bfa)") {{ getInitials(row.name) }}
                  div
                    .text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                    .text-xs(style="color: var(--text-muted)") {{ row.email }}
            el-table-column(:label="$t('complianceCenter.consentType')" width="150")
              template(#default="{ row }")
                el-tag(:type="getConsentTypeTag(row.consentType)" size="small" effect="dark" round) {{ $t(`complianceCenter.${row.consentType}`) }}
            el-table-column(:label="$t('complianceCenter.status')" width="130" align="center")
              template(#default="{ row }")
                el-switch(
                  v-model="row.granted"
                  :active-text="$t('complianceCenter.granted')"
                  :inactive-text="$t('complianceCenter.withdrawn')"
                  active-color="#22c55e"
                  inactive-color="#ef4444"
                  @change="handleConsentToggle(row)"
                )
            el-table-column(:label="$t('complianceCenter.channel')" width="130")
              template(#default="{ row }")
                .flex.items-center.gap-1
                  Icon(:name="getChannelIcon(row.channel)" size="14" style="color: var(--text-muted)")
                  span.text-sm(style="color: var(--text-secondary)") {{ row.channel }}
            el-table-column(:label="$t('complianceCenter.consentDate')" width="140" sortable prop="consentDate")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-secondary)") {{ formatDate(row.consentDate) }}
            el-table-column(:label="$t('complianceCenter.expiryDate')" width="140")
              template(#default="{ row }")
                span.text-sm(:style="{ color: isExpiringSoon(row.expiryDate) ? '#ef4444' : 'var(--text-secondary)' }") {{ formatDate(row.expiryDate) }}
            el-table-column(:label="$t('complianceCenter.lastUpdated')" width="140")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.lastUpdated) }}
            template(#empty)
              .py-8.text-center
                Icon(name="ph:check-square-bold" size="40" style="color: var(--text-muted)")
                p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('complianceCenter.noConsentRecords') }}

        //- Consent Trend Chart
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4
            h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceCenter.consentTrend') }}
            .flex.items-center.gap-3
              .flex.items-center.gap-1
                .w-3.h-3.rounded-sm(style="background: #22c55e")
                span.text-xs(style="color: var(--text-muted)") {{ $t('complianceCenter.optIn') }}
              .flex.items-center.gap-1
                .w-3.h-3.rounded-sm(style="background: #ef4444")
                span.text-xs(style="color: var(--text-muted)") {{ $t('complianceCenter.optOut') }}
          ClientOnly
            VChart(v-if="consentTrendOption" :option="consentTrendOption" autoresize style="height: 320px")

      //- Tab 2: Data Retention
      el-tab-pane(:label="$t('complianceCenter.dataRetention')" name="retention")
        //- Retention Policy Cards
        .grid.gap-5.mb-8(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
          .retention-policy-card(v-for="policy in retentionPolicies" :key="policy.id")
            .glass-card.p-5.rounded-2xl.h-full
              .flex.items-center.justify-between.mb-4
                .flex.items-center.gap-3
                  .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: policy.iconBg }")
                    Icon(:name="policy.icon" size="20" :style="{ color: policy.iconColor }")
                  div
                    h4.text-sm.font-bold(style="color: var(--text-primary)") {{ policy.name }}
                    span.text-xs(style="color: var(--text-muted)") {{ $t('complianceCenter.retentionPeriod') }}: {{ policy.period }}
                el-tag(:type="policy.active ? 'success' : 'info'" size="small" effect="dark" round) {{ policy.active ? $t('complianceCenter.active') : $t('complianceCenter.inactive') }}
              .grid.gap-3(class="grid-cols-2")
                .stat-mini
                  .text-lg.font-bold(style="color: var(--text-primary)") {{ policy.dataCount.toLocaleString() }}
                  .text-xs(style="color: var(--text-muted)") {{ $t('complianceCenter.records') }}
                .stat-mini
                  .text-lg.font-bold(style="color: var(--text-primary)") {{ policy.storageUsed }}
                  .text-xs(style="color: var(--text-muted)") {{ $t('complianceCenter.storageUsed') }}
              .mt-4.pt-4(style="border-top: 1px solid var(--border-default)")
                .flex.items-center.justify-between
                  .flex.items-center.gap-2
                    Icon(name="ph:calendar-bold" size="14" style="color: var(--text-muted)")
                    span.text-xs(style="color: var(--text-muted)") {{ $t('complianceCenter.nextReview') }}: {{ policy.nextReview }}
                  el-button(size="small" type="primary" plain class="!rounded-lg" @click="editRetentionPolicy(policy)")
                    Icon(name="ph:pencil-bold" size="14")

        //- Data Categories Doughnut Chart
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4
            h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceCenter.dataDistribution') }}
          ClientOnly
            VChart(v-if="dataDistributionOption" :option="dataDistributionOption" autoresize style="height: 360px")

      //- Tab 3: Privacy Requests (DSR)
      el-tab-pane(:label="$t('complianceCenter.privacyRequests')" name="dsr")
        .glass-card.rounded-2xl.overflow-hidden
          .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--border-default)")
            h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceCenter.dsrRequests') }}
            .flex.items-center.gap-3
              el-select(v-model="dsrStatusFilter" clearable :placeholder="$t('complianceCenter.allStatuses')" size="large" style="width: 180px")
                el-option(:label="$t('complianceCenter.allStatuses')" value="")
                el-option(:label="$t('complianceCenter.pending')" value="pending")
                el-option(:label="$t('complianceCenter.inProgress')" value="in-progress")
                el-option(:label="$t('complianceCenter.completed')" value="completed")
                el-option(:label="$t('complianceCenter.overdue')" value="overdue")
              el-button(type="primary" size="large" class="!bg-[#7849ff] !border-none !rounded-xl" @click="showNewRequestDialog = true")
                Icon(name="ph:plus-bold" size="16")
                span.ml-2 {{ $t('complianceCenter.newRequest') }}

          el-table(:data="filteredDsrRequests" style="width: 100%" stripe)
            el-table-column(:label="$t('complianceCenter.requester')" min-width="200")
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .w-8.h-8.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(:style="{ background: getAvatarColor(row.requester) }") {{ getInitials(row.requester) }}
                  div
                    .text-sm.font-semibold(style="color: var(--text-primary)") {{ row.requester }}
                    .text-xs(style="color: var(--text-muted)") {{ row.email }}
            el-table-column(:label="$t('complianceCenter.requestType')" width="150")
              template(#default="{ row }")
                el-tag(:type="getDsrTypeTag(row.requestType)" size="small" effect="dark" round)
                  Icon(:name="getDsrTypeIcon(row.requestType)" size="12" class="mr-1")
                  | {{ $t(`complianceCenter.dsr_${row.requestType}`) }}
            el-table-column(:label="$t('complianceCenter.submittedDate')" width="140" sortable prop="submittedDate")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-secondary)") {{ formatDate(row.submittedDate) }}
            el-table-column(:label="$t('complianceCenter.slaCountdown')" width="150" align="center")
              template(#default="{ row }")
                .sla-countdown(:class="getSlaClass(row.daysRemaining)")
                  Icon(name="ph:clock-bold" size="14")
                  span.font-mono.font-bold {{ row.daysRemaining }}d {{ $t('complianceCenter.remaining') }}
            el-table-column(:label="$t('complianceCenter.assignedTo')" width="150")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  .w-6.h-6.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(style="background: linear-gradient(135deg, #3b82f6, #60a5fa)") {{ getInitials(row.assignedTo) }}
                  span.text-sm(style="color: var(--text-secondary)") {{ row.assignedTo }}
            el-table-column(:label="$t('complianceCenter.status')" width="130")
              template(#default="{ row }")
                el-tag(:type="getDsrStatusTag(row.status)" size="small" effect="dark" round) {{ $t(`complianceCenter.${row.status}`) }}
            el-table-column(:label="$t('complianceCenter.actions')" width="120" align="center")
              template(#default="{ row }")
                .flex.items-center.gap-1.justify-center
                  el-tooltip(:content="$t('complianceCenter.viewDetails')")
                    el-button(size="small" circle @click="viewDsrDetails(row)")
                      Icon(name="ph:eye-bold" size="14")
                  el-tooltip(:content="$t('complianceCenter.processRequest')")
                    el-button(size="small" type="primary" circle @click="processDsrRequest(row)" :disabled="row.status === 'completed'")
                      Icon(name="ph:check-bold" size="14")
            template(#empty)
              .py-8.text-center
                Icon(name="ph:user-circle-bold" size="40" style="color: var(--text-muted)")
                p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('complianceCenter.noDsrRequests') }}

      //- Tab 4: Audit Trail
      el-tab-pane(:label="$t('complianceCenter.auditTrail')" name="audit")
        .glass-card.rounded-2xl.overflow-hidden.mb-6
          .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--border-default)")
            h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceCenter.auditLog') }}
            .flex.items-center.gap-3
              el-date-picker(
                v-model="auditDateRange"
                type="daterange"
                :start-placeholder="$t('complianceCenter.startDate')"
                :end-placeholder="$t('complianceCenter.endDate')"
                size="large"
                class="!rounded-xl"
                value-format="YYYY-MM-DD"
              )
              el-button(size="large" class="!rounded-xl" @click="exportAuditCsv")
                Icon(name="ph:file-csv-bold" size="16")
                span.ml-2 {{ $t('complianceCenter.exportCsv') }}

          el-table(:data="paginatedAuditLogs" style="width: 100%" stripe)
            el-table-column(:label="$t('complianceCenter.timestamp')" width="190" sortable prop="timestamp")
              template(#default="{ row }")
                .text-sm.font-mono(style="color: var(--text-secondary)") {{ formatDateTime(row.timestamp) }}
            el-table-column(:label="$t('complianceCenter.user')" min-width="180")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  .w-7.h-7.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(style="background: linear-gradient(135deg, #7849ff, #a78bfa)") {{ getInitials(row.user) }}
                  span.text-sm.font-medium(style="color: var(--text-primary)") {{ row.user }}
            el-table-column(:label="$t('complianceCenter.action')" width="160")
              template(#default="{ row }")
                .flex.items-center.gap-1
                  Icon(:name="getAuditActionIcon(row.action)" size="14" :style="{ color: getAuditActionColor(row.action) }")
                  span.text-sm(style="color: var(--text-primary)") {{ row.action }}
            el-table-column(:label="$t('complianceCenter.resource')" width="180")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-secondary)") {{ row.resource }}
            el-table-column(:label="$t('complianceCenter.ipAddress')" width="140")
              template(#default="{ row }")
                span.text-sm.font-mono(style="color: var(--text-muted)") {{ row.ipAddress }}
            el-table-column(:label="$t('complianceCenter.status')" width="110" align="center")
              template(#default="{ row }")
                el-tag(:type="row.success ? 'success' : 'danger'" size="small" effect="dark" round) {{ row.success ? $t('complianceCenter.success') : $t('complianceCenter.failure') }}
            el-table-column(:label="$t('complianceCenter.details')" min-width="200")
              template(#default="{ row }")
                el-tooltip(:content="row.details" placement="top" :show-after="300")
                  span.text-xs.truncate.block.max-w-xs(style="color: var(--text-muted)") {{ row.details }}
            template(#empty)
              .py-8.text-center
                Icon(name="ph:list-bullets-bold" size="40" style="color: var(--text-muted)")
                p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('complianceCenter.noAuditLogs') }}

          //- Pagination
          .p-5.flex.items-center.justify-between(v-if="filteredAuditLogs.length > auditPageSize")
            span.text-xs(style="color: var(--text-muted)") {{ filteredAuditLogs.length }} {{ $t('complianceCenter.entries') }}
            el-pagination(
              background
              style="direction: ltr"
              :pager-count="5"
              v-model:current-page="auditCurrentPage"
              :page-size="auditPageSize"
              layout="prev, pager, next"
              :total="filteredAuditLogs.length"
            )

        //- Timeline View
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-6
            h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceCenter.recentEvents') }}
            el-radio-group(v-model="auditViewMode" size="small")
              el-radio-button(value="table") {{ $t('complianceCenter.tableView') }}
              el-radio-button(value="timeline") {{ $t('complianceCenter.timelineView') }}

          el-timeline(v-if="auditViewMode === 'timeline'")
            el-timeline-item(
              v-for="event in recentAuditEvents"
              :key="event.id"
              :timestamp="formatDateTime(event.timestamp)"
              placement="top"
              :color="getAuditActionColor(event.action)"
            )
              .glass-card.p-4.rounded-xl
                .flex.items-center.justify-between
                  .flex.items-center.gap-3
                    Icon(:name="getAuditActionIcon(event.action)" size="18" :style="{ color: getAuditActionColor(event.action) }")
                    div
                      .text-sm.font-semibold(style="color: var(--text-primary)") {{ event.action }}
                      .text-xs(style="color: var(--text-muted)") {{ event.user }} - {{ event.resource }}
                  .flex.items-center.gap-2
                    el-tag(:type="event.success ? 'success' : 'danger'" size="small" effect="dark" round) {{ event.success ? $t('complianceCenter.success') : $t('complianceCenter.failure') }}
                    span.text-xs.font-mono(style="color: var(--text-muted)") {{ event.ipAddress }}
                p.text-xs.mt-2(style="color: var(--text-muted)") {{ event.details }}

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    .text-center
      el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")
      p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('complianceCenter.loadingData') }}

  //- New DSR Request Dialog
  el-dialog(v-model="showNewRequestDialog" :title="$t('complianceCenter.newDsrRequest')" width="600px")
    el-form(:model="newDsrForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('complianceCenter.requesterName')" required)
          el-input(v-model="newDsrForm.requester" :placeholder="$t('complianceCenter.enterName')")
        el-form-item(:label="$t('complianceCenter.requesterEmail')" required)
          el-input(v-model="newDsrForm.email" :placeholder="$t('complianceCenter.enterEmail')" type="email")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('complianceCenter.requestType')")
          el-select(v-model="newDsrForm.requestType" style="width: 100%")
            el-option(:label="$t('complianceCenter.dsr_access')" value="access")
            el-option(:label="$t('complianceCenter.dsr_deletion')" value="deletion")
            el-option(:label="$t('complianceCenter.dsr_portability')" value="portability")
            el-option(:label="$t('complianceCenter.dsr_rectification')" value="rectification")
        el-form-item(:label="$t('complianceCenter.assignTo')")
          el-select(v-model="newDsrForm.assignedTo" style="width: 100%")
            el-option(v-for="member in teamMembers" :key="member" :label="member" :value="member")
      el-form-item(:label="$t('complianceCenter.description')")
        el-input(v-model="newDsrForm.description" type="textarea" :rows="3" :placeholder="$t('complianceCenter.describeRequest')")
    template(#footer)
      el-button(@click="showNewRequestDialog = false") {{ $t('complianceCenter.cancel') }}
      el-button(type="primary" @click="submitNewDsrRequest" :loading="submittingDsr" class="!bg-[#7849ff] !border-none") {{ $t('complianceCenter.submit') }}

  //- DSR Details Dialog
  el-dialog(v-model="showDsrDetailsDialog" :title="$t('complianceCenter.requestDetails')" width="650px")
    template(v-if="selectedDsr")
      .space-y-4
        .grid.gap-4(class="grid-cols-2")
          .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('complianceCenter.requester') }}
            .text-sm.font-semibold(style="color: var(--text-primary)") {{ selectedDsr.requester }}
            .text-xs(style="color: var(--text-muted)") {{ selectedDsr.email }}
          .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('complianceCenter.requestType') }}
            el-tag(:type="getDsrTypeTag(selectedDsr.requestType)" size="small" effect="dark") {{ $t(`complianceCenter.dsr_${selectedDsr.requestType}`) }}
        .grid.gap-4(class="grid-cols-3")
          .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('complianceCenter.submittedDate') }}
            .text-sm(style="color: var(--text-primary)") {{ formatDate(selectedDsr.submittedDate) }}
          .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('complianceCenter.slaDeadline') }}
            .text-sm.font-bold(:style="{ color: selectedDsr.daysRemaining <= 5 ? '#ef4444' : '#22c55e' }") {{ selectedDsr.daysRemaining }}d {{ $t('complianceCenter.remaining') }}
          .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('complianceCenter.status') }}
            el-tag(:type="getDsrStatusTag(selectedDsr.status)" effect="dark" size="small") {{ $t(`complianceCenter.${selectedDsr.status}`) }}
        .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
          .text-xs.mb-2(style="color: var(--text-muted)") {{ $t('complianceCenter.description') }}
          .text-sm(style="color: var(--text-primary)") {{ selectedDsr.description || $t('complianceCenter.noDescription') }}
    template(#footer)
      el-button(@click="showDsrDetailsDialog = false") {{ $t('complianceCenter.close') }}
      el-button(type="primary" @click="processDsrRequest(selectedDsr)" :disabled="selectedDsr?.status === 'completed'" class="!bg-[#7849ff] !border-none") {{ $t('complianceCenter.processRequest') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import VChart from 'vue-echarts';
import { graphic } from 'echarts/core';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Compliance Center' });

const { t } = useI18n();

const loading = ref(true);
const activeTab = ref('consent');
const dateRange = ref<string[]>([]);
const consentSearch = ref('');
const consentTypeFilter = ref('');
const dsrStatusFilter = ref('');
const auditDateRange = ref<string[]>([]);
const auditCurrentPage = ref(1);
const auditPageSize = 15;
const auditViewMode = ref('table');
const showNewRequestDialog = ref(false);
const showDsrDetailsDialog = ref(false);
const submittingDsr = ref(false);
const selectedDsr = ref<Record<string, unknown> | null>(null);

const kpiData = reactive({
  consentRate: 0,
  activePolicies: 0,
  openDsrRequests: 0,
  auditScore: 0
});

const teamMembers = ref<string[]>([]);

const newDsrForm = reactive({
  requester: '',
  email: '',
  requestType: 'access',
  assignedTo: '',
  description: ''
});

const consentRecords = ref<Record<string, unknown>[]>([]);

const filteredConsentRecords = computed(() => {
  return consentRecords.value.filter(rec => {
    const matchSearch =
      !consentSearch.value ||
      ((rec.name as string) || '').toLowerCase().includes(consentSearch.value.toLowerCase()) ||
      ((rec.email as string) || '').toLowerCase().includes(consentSearch.value.toLowerCase());
    const matchType = !consentTypeFilter.value || rec.consentType === consentTypeFilter.value;
    return matchSearch && matchType;
  });
});

const retentionPolicies = ref<Record<string, unknown>[]>([]);

const dsrRequests = ref<Record<string, unknown>[]>([]);

const filteredDsrRequests = computed(() => {
  return dsrRequests.value.filter(req => {
    return !dsrStatusFilter.value || req.status === dsrStatusFilter.value;
  });
});

const auditLogs = ref<Record<string, unknown>[]>([]);

const filteredAuditLogs = computed(() => {
  let logs = [...auditLogs.value];
  if (auditDateRange.value && auditDateRange.value.length === 2) {
    const [start, end] = auditDateRange.value;
    logs = logs.filter(log => {
      const logDate = ((log.timestamp as string) || '').split('T')[0]!;
      return logDate >= start! && logDate <= end!;
    });
  }
  return logs;
});

const paginatedAuditLogs = computed(() => {
  const start = (auditCurrentPage.value - 1) * auditPageSize;
  return filteredAuditLogs.value.slice(start, start + auditPageSize);
});

const recentAuditEvents = computed(() => auditLogs.value.slice(0, 8));

const chartTooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.9)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  textStyle: { color: '#fff' },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

const consentTrendOption = computed(() => {
  const now = new Date();
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString(undefined, { month: 'short' }));
  }

  const emptyData = new Array(12).fill(0);

  return {
    tooltip: { trigger: 'axis', ...chartTooltipStyle },
    grid: { top: 20, right: 20, bottom: 30, left: 50, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11 }
    },
    series: [
      {
        name: t('complianceCenter.optIn'),
        type: 'line',
        data: emptyData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#22c55e', width: 3 },
        itemStyle: { color: '#22c55e', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 197, 94, 0.25)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0.02)' }
          ])
        }
      },
      {
        name: t('complianceCenter.optOut'),
        type: 'line',
        data: emptyData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#ef4444', width: 3 },
        itemStyle: { color: '#ef4444', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.15)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
          ])
        }
      }
    ]
  };
});

const dataDistributionOption = computed(() => {
  const policyColors = ['#3b82f6', '#22c55e', '#f59e0b', '#7849ff', '#06b6d4', '#ef4444'];
  const chartData = retentionPolicies.value.map((p, i) => ({
    value: (p.dataCount as number) || 0,
    name: (p.name as string) || '',
    itemStyle: { color: policyColors[i % policyColors.length] }
  }));

  return {
    tooltip: {
      trigger: 'item',
      ...chartTooltipStyle,
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: { color: '#a1a1aa', fontSize: 12 }
    },
    series: [
      {
        name: t('complianceCenter.dataCategories'),
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'rgba(30, 30, 45, 0.8)',
          borderWidth: 3
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        labelLine: { show: false },
        data: chartData
      }
    ]
  };
});

// --- Helpers ---
function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] || '';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
}

function isExpiringSoon(dateStr: string): boolean {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}

function getConsentTypeTag(type: string): 'success' | 'warning' | 'info' | '' {
  switch (type) {
    case 'marketing':
      return 'warning';
    case 'analytics':
      return 'info';
    case 'essential':
      return 'success';
    default:
      return '';
  }
}

function getChannelIcon(channel: string): string {
  switch (channel) {
    case 'Email':
      return 'ph:envelope-bold';
    case 'Web':
      return 'ph:globe-bold';
    case 'API':
      return 'ph:code-bold';
    case 'Mobile':
      return 'ph:device-mobile-bold';
    default:
      return 'ph:link-bold';
  }
}

function getDsrTypeTag(type: string): 'success' | 'danger' | 'warning' | 'info' | '' {
  switch (type) {
    case 'access':
      return 'info';
    case 'deletion':
      return 'danger';
    case 'portability':
      return 'warning';
    case 'rectification':
      return 'success';
    default:
      return '';
  }
}

function getDsrTypeIcon(type: string): string {
  switch (type) {
    case 'access':
      return 'ph:eye-bold';
    case 'deletion':
      return 'ph:trash-bold';
    case 'portability':
      return 'ph:export-bold';
    case 'rectification':
      return 'ph:pencil-bold';
    default:
      return 'ph:question-bold';
  }
}

function getDsrStatusTag(status: string): 'success' | 'danger' | 'warning' | 'info' | '' {
  switch (status) {
    case 'pending':
      return 'info';
    case 'in-progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'overdue':
      return 'danger';
    default:
      return '';
  }
}

function getSlaClass(days: number): string {
  if (days <= 0) return 'sla-overdue';
  if (days <= 5) return 'sla-critical';
  if (days <= 10) return 'sla-warning';
  return 'sla-ok';
}

function getAuditActionIcon(action: string): string {
  if (action.includes('Consent')) return 'ph:check-square-bold';
  if (action.includes('DSR') || action.includes('Request')) return 'ph:user-circle-bold';
  if (action.includes('Purge') || action.includes('Delete') || action.includes('Anonymized')) return 'ph:trash-bold';
  if (action.includes('Policy') || action.includes('Updated')) return 'ph:file-text-bold';
  if (action.includes('Export') || action.includes('Backup')) return 'ph:download-bold';
  if (action.includes('Compliance') || action.includes('Scan')) return 'ph:shield-check-bold';
  if (action.includes('Encryption')) return 'ph:lock-bold';
  if (action.includes('Training')) return 'ph:graduation-cap-bold';
  if (action.includes('Audit') || action.includes('Access')) return 'ph:magnifying-glass-bold';
  if (action.includes('Cookie')) return 'ph:cookie-bold';
  if (action.includes('Rectified')) return 'ph:pencil-bold';
  if (action.includes('Escalated')) return 'ph:arrow-up-bold';
  return 'ph:info-bold';
}

function getAuditActionColor(action: string): string {
  if (action.includes('Consent') && action.includes('Revoked')) return '#ef4444';
  if (action.includes('Consent')) return '#22c55e';
  if (action.includes('DSR') || action.includes('Request')) return '#f59e0b';
  if (action.includes('Purge') || action.includes('Delete') || action.includes('Anonymized')) return '#ef4444';
  if (action.includes('Policy') || action.includes('Updated')) return '#3b82f6';
  if (action.includes('Compliance') || action.includes('Scan')) return '#7849ff';
  if (action.includes('Encryption')) return '#06b6d4';
  if (action.includes('Escalated')) return '#f59e0b';
  return '#7849ff';
}

// --- Actions ---
function handleConsentToggle(record: unknown) {
  const status = record.granted ? t('complianceCenter.granted') : t('complianceCenter.withdrawn');
  ElMessage.success(`${record.name}: ${t('complianceCenter.consentStatusUpdated')} - ${status}`);
  record.lastUpdated = new Date().toISOString().split('T')[0];
  updateKpis();
}

function editRetentionPolicy(policy: unknown) {
  ElMessage.info(`${t('complianceCenter.editingPolicy')}: ${policy.name}`);
}

function viewDsrDetails(dsr: unknown) {
  selectedDsr.value = dsr;
  showDsrDetailsDialog.value = true;
}

function processDsrRequest(dsr: unknown) {
  if (!dsr || dsr.status === 'completed') return;
  ElMessageBox.confirm(t('complianceCenter.confirmProcessDsr'), t('complianceCenter.processRequest'), { type: 'warning' })
    .then(() => {
      dsr.status = 'completed';
      dsr.daysRemaining = 0;
      ElNotification({ type: 'success', title: t('complianceCenter.success'), message: `${t('complianceCenter.dsrProcessed')}: ${dsr.requester}` });
      updateKpis();
    })
    .catch((error: unknown) => {
      console.error('Operation failed:', error);
    });
}

function submitNewDsrRequest() {
  if (!newDsrForm.requester.trim() || !newDsrForm.email.trim()) {
    ElMessage.warning(t('complianceCenter.fillRequired'));
    return;
  }
  submittingDsr.value = true;
  setTimeout(() => {
    dsrRequests.value.unshift({
      id: dsrRequests.value.length + 1,
      requester: newDsrForm.requester,
      email: newDsrForm.email,
      requestType: newDsrForm.requestType,
      submittedDate: new Date().toISOString().split('T')[0]!,
      daysRemaining: 30,
      assignedTo: newDsrForm.assignedTo || teamMembers.value[0] || '',
      status: 'pending',
      description: newDsrForm.description
    });
    showNewRequestDialog.value = false;
    submittingDsr.value = false;
    newDsrForm.requester = '';
    newDsrForm.email = '';
    newDsrForm.requestType = 'access';
    newDsrForm.assignedTo = '';
    newDsrForm.description = '';
    ElNotification({ type: 'success', title: t('complianceCenter.success'), message: t('complianceCenter.dsrCreated') });
    updateKpis();
  }, 800);
}

function exportAuditCsv() {
  const headers = ['Timestamp', 'User', 'Action', 'Resource', 'IP Address', 'Status', 'Details'];
  const rows = filteredAuditLogs.value.map(log => [
    log.timestamp,
    log.user,
    log.action,
    log.resource,
    log.ipAddress,
    log.success ? 'Success' : 'Failure',
    log.details
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `compliance-audit-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  ElMessage.success(t('complianceCenter.exportSuccess'));
}

function updateKpis() {
  const total = consentRecords.value.length;
  const granted = consentRecords.value.filter(r => r.granted).length;
  kpiData.consentRate = total > 0 ? Math.round((granted / total) * 100) : 0;
  kpiData.activePolicies = retentionPolicies.value.filter(p => p.active).length;
  kpiData.openDsrRequests = dsrRequests.value.filter(r => r.status !== 'completed').length;
}

async function loadData() {
  loading.value = true;
  try {
    const response = await useApiFetch('compliance/overview');
    if (response.success && response.body) {
      const data = response.body as Record<string, unknown>;
      if (data.kpi) {
        const kpi = data.kpi as Record<string, unknown>;
        kpiData.consentRate = (kpi.consentRate as number) ?? 0;
        kpiData.activePolicies = (kpi.activePolicies as number) ?? 0;
        kpiData.openDsrRequests = (kpi.openDsrRequests as number) ?? 0;
        kpiData.auditScore = (kpi.auditScore as number) ?? 0;
      }
      if (Array.isArray(data.consentRecords)) {
        consentRecords.value = data.consentRecords;
      }
      if (Array.isArray(data.retentionPolicies)) {
        retentionPolicies.value = data.retentionPolicies;
      }
      if (Array.isArray(data.dsrRequests)) {
        dsrRequests.value = data.dsrRequests;
      }
      if (Array.isArray(data.auditLogs)) {
        auditLogs.value = data.auditLogs;
      }
      if (Array.isArray(data.teamMembers)) {
        teamMembers.value = data.teamMembers as string[];
      }
    }
    updateKpis();
  } catch {
    updateKpis();
  } finally {
    loading.value = false;
  }
}

async function refreshData() {
  await loadData();
  ElMessage.success(t('complianceCenter.dataRefreshed'));
}

await loadData().catch(() => {
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.compliance-center-page {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// KPI Cards
.kpi-card {
  .kpi-card-inner {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.25s ease;
    height: 100%;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08);
    }
  }

  .kpi-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .kpi-value {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
  }

  .kpi-trend {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    font-weight: 600;
  }

  .kpi-icon-wrap {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    flex-shrink: 0;
  }
}

// Glass Card
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
}

// Retention Policy Cards
.retention-policy-card {
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);

    .glass-card {
      box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08);
    }
  }
}

.stat-mini {
  padding: 10px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.04);
  border: 1px solid rgba(120, 73, 255, 0.08);
  text-align: center;
}

// SLA Countdown
.sla-countdown {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;

  &.sla-ok {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }

  &.sla-warning {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  &.sla-critical {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    animation: pulse-critical 2s ease-in-out infinite;
  }

  &.sla-overdue {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    font-weight: 700;
  }
}

@keyframes pulse-critical {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// Table Styling
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(120, 73, 255, 0.04);
  --el-table-border-color: var(--border-default);
  --el-table-text-color: var(--text-primary);
  --el-table-header-text-color: var(--text-muted);

  .el-table__header th {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

// Tabs Styling
:deep(.el-tabs) {
  .el-tabs__header {
    margin-bottom: 24px;
  }

  .el-tabs__item {
    font-size: 14px;
    font-weight: 500;
  }
}

// Timeline
:deep(.el-timeline-item__tail) {
  border-left: 2px solid var(--border-default);
}

:deep(.el-timeline-item__timestamp) {
  color: var(--text-muted) !important;
  font-size: 12px;
}

// Dialog
:deep(.el-dialog) {
  border-radius: 16px;
}

// Responsive
@media (max-width: 767px) {
  .compliance-center-page {
    padding: 16px !important;
  }

  .kpi-card .kpi-card-inner {
    padding: 16px;
  }

  .kpi-card .kpi-value {
    font-size: 22px;
  }

  .sla-countdown {
    font-size: 11px;
    padding: 3px 8px;
  }
}
</style>
