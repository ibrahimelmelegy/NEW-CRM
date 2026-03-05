<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('partnerManagement.title')" :subtitle="$t('partnerManagement.subtitle')")
    template(#actions)
      .flex.gap-2
        el-button(size="large" @click="exportPartners" class="!rounded-xl")
          Icon(name="ph:export-bold" size="18")
          span.mx-1 {{ $t('partnerManagement.export') }}
        el-button(type="primary" size="large" @click="openPartnerDialog()" class="premium-btn")
          Icon(name="ph:plus-bold" size="20")
          span.mx-1 {{ $t('partnerManagement.addPartner') }}

  //- KPI Stat Cards
  StatCards(:stats="kpiStats")

  //- Main Tabs
  .glass-card.py-6.animate-entrance
    el-tabs(v-model="activeTab" class="px-4")

      //- ============ TAB 1: PARTNERS DIRECTORY ============
      el-tab-pane(:label="$t('partnerManagement.partnersDirectory')" name="directory")
        .flex.items-center.justify-between.flex-wrap.gap-3.mb-4
          .flex.items-center.gap-2.flex-wrap
            el-input(v-model="partnerSearch" :placeholder="$t('common.search')" clearable size="default" style="width: 220px")
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="16")
            el-select(v-model="filterTier" clearable :placeholder="$t('partnerManagement.allTiers')" style="width: 150px" size="default")
              el-option(v-for="tier in tierOptions" :key="tier" :label="tier" :value="tier")
            el-select(v-model="filterRegion" clearable :placeholder="$t('partnerManagement.allRegions')" style="width: 160px" size="default")
              el-option(v-for="region in regionOptions" :key="region" :label="region" :value="region")
            el-select(v-model="filterPartnerStatus" clearable :placeholder="$t('partnerManagement.allStatuses')" style="width: 150px" size="default")
              el-option(:label="$t('partnerManagement.active')" value="active")
              el-option(:label="$t('partnerManagement.inactive')" value="inactive")
              el-option(:label="$t('partnerManagement.pending')" value="pending")

        el-table(:data="filteredPartners" v-loading="loading" style="width: 100%" stripe)
          el-table-column(type="index" width="50")
          el-table-column(:label="$t('partnerManagement.companyName')" min-width="200" sortable prop="companyName")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-xl.flex.items-center.justify-center(:style="{ background: getTierColor(row.tier) + '15', color: getTierColor(row.tier) }")
                  Icon(name="ph:buildings-bold" size="18")
                div
                  p.text-sm.font-bold(style="color: var(--text-primary)") {{ row.companyName }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.contactPerson }}
          el-table-column(:label="$t('partnerManagement.tier')" width="130" sortable prop="tier")
            template(#default="{ row }")
              el-tag(:type="getTierTagType(row.tier)" size="small" round effect="dark")
                Icon(:name="getTierIcon(row.tier)" size="12" class="mr-1")
                | {{ row.tier }}
          el-table-column(:label="$t('partnerManagement.region')" width="140" sortable prop="region")
            template(#default="{ row }")
              span.text-sm {{ row.region }}
          el-table-column(:label="$t('partnerManagement.contactPerson')" width="160")
            template(#default="{ row }")
              .flex.items-center.gap-2
                Icon(name="ph:user-bold" size="14" style="color: var(--text-muted)")
                span.text-sm {{ row.contactPerson }}
          el-table-column(:label="$t('partnerManagement.activeDeals')" width="120" align="center" sortable prop="activeDeals")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: #3b82f6") {{ row.activeDeals }}
          el-table-column(:label="$t('partnerManagement.totalRevenue')" width="150" align="right" sortable prop="totalRevenue")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: #22c55e") {{ formatCurrency(row.totalRevenue) }}
          el-table-column(:label="$t('partnerManagement.status')" width="120" align="center")
            template(#default="{ row }")
              el-tag(:type="getStatusTagType(row.status)" size="small" round) {{ getStatusLabel(row.status) }}
          el-table-column(:label="$t('common.actions')" width="130" align="center" fixed="right")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-tooltip(:content="$t('common.edit')")
                  el-button(text circle size="small" type="primary" :aria-label="$t('common.edit')" @click="openPartnerDialog(row)")
                    Icon(name="ph:pencil-simple" size="14")
                el-tooltip(:content="$t('common.view')")
                  el-button(text circle size="small" :aria-label="$t('common.view')" @click="openPartnerDetail(row)")
                    Icon(name="ph:eye-bold" size="14")
                el-tooltip(:content="$t('common.delete')")
                  el-button(text circle size="small" type="danger" :aria-label="$t('common.delete')" @click="handleDeletePartner(row)")
                    Icon(name="ph:trash" size="14")
          template(#empty)
            el-empty(:description="$t('partnerManagement.noPartners')")

      //- ============ TAB 2: DEAL REGISTRATION ============
      el-tab-pane(:label="$t('partnerManagement.dealRegistration')" name="deals")
        .flex.items-center.justify-between.flex-wrap.gap-3.mb-4
          .flex.items-center.gap-2
            el-input(v-model="dealSearch" :placeholder="$t('common.search')" clearable size="default" style="width: 220px")
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="16")
            el-select(v-model="filterDealStatus" clearable :placeholder="$t('partnerManagement.allStatuses')" style="width: 150px" size="default")
              el-option(:label="$t('partnerManagement.pending')" value="pending")
              el-option(:label="$t('partnerManagement.approved')" value="approved")
              el-option(:label="$t('partnerManagement.rejected')" value="rejected")
              el-option(:label="$t('partnerManagement.expired')" value="expired")

        el-table(:data="filteredDealRegistrations" v-loading="loading" style="width: 100%" stripe)
          el-table-column(type="index" width="50")
          el-table-column(:label="$t('partnerManagement.dealName')" min-width="180" sortable prop="dealName")
            template(#default="{ row }")
              p.text-sm.font-bold(style="color: var(--text-primary)") {{ row.dealName }}
          el-table-column(:label="$t('partnerManagement.partner')" min-width="160")
            template(#default="{ row }")
              .flex.items-center.gap-2
                Icon(name="ph:buildings" size="14" style="color: var(--text-muted)")
                span.text-sm {{ row.partnerName }}
          el-table-column(:label="$t('partnerManagement.customer')" min-width="150")
            template(#default="{ row }")
              span.text-sm {{ row.customerName }}
          el-table-column(:label="$t('partnerManagement.amount')" width="140" align="right" sortable prop="amount")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: #7849ff") {{ formatCurrency(row.amount) }}
          el-table-column(:label="$t('partnerManagement.stage')" width="130")
            template(#default="{ row }")
              el-tag(size="small" effect="plain" round) {{ row.stage }}
          el-table-column(:label="$t('partnerManagement.registrationDate')" width="130")
            template(#default="{ row }")
              span.text-xs.font-mono {{ formatDate(row.registrationDate) }}
          el-table-column(:label="$t('partnerManagement.expiryDate')" width="130")
            template(#default="{ row }")
              span.text-xs.font-mono(:style="{ color: isExpired(row.expiryDate) ? '#ef4444' : 'var(--text-primary)' }") {{ formatDate(row.expiryDate) }}
          el-table-column(:label="$t('partnerManagement.status')" width="120" align="center")
            template(#default="{ row }")
              el-tag(:type="getDealStatusTagType(row.status)" size="small" round effect="dark") {{ getDealStatusLabel(row.status) }}
          el-table-column(:label="$t('common.actions')" width="140" align="center" fixed="right")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1(v-if="row.status === 'pending'")
                el-tooltip(:content="$t('partnerManagement.approve')")
                  el-button(type="success" size="small" circle :aria-label="$t('partnerManagement.approve')" @click="handleDealAction(row, 'approved')")
                    Icon(name="ph:check-bold" size="14")
                el-tooltip(:content="$t('partnerManagement.reject')")
                  el-button(type="danger" size="small" circle :aria-label="$t('partnerManagement.reject')" @click="handleDealAction(row, 'rejected')")
                    Icon(name="ph:x-bold" size="14")
              span.text-xs(v-else style="color: var(--text-muted)") {{ $t('partnerManagement.processed') }}
          template(#empty)
            el-empty(:description="$t('partnerManagement.noDeals')")

      //- ============ TAB 3: CHANNEL PERFORMANCE ============
      el-tab-pane(:label="$t('partnerManagement.channelPerformance')" name="performance")
        .flex.items-center.justify-between.mb-4
          h3.text-base.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:chart-line-up-bold" size="20" class="mr-2" style="color: #7849ff")
            | {{ $t('partnerManagement.performanceOverview') }}
          el-select(v-model="performancePeriod" size="default" style="width: 160px")
            el-option(:label="$t('partnerManagement.monthly')" value="monthly")
            el-option(:label="$t('partnerManagement.quarterly')" value="quarterly")
            el-option(:label="$t('partnerManagement.yearly')" value="yearly")

        //- Charts Row
        .grid.gap-6.mb-6(class="grid-cols-1 lg:grid-cols-2")
          //- Revenue by Partner (Bar Chart)
          .glass-card.p-5.rounded-2xl
            h4.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
              Icon(name="ph:chart-bar-bold" size="16" class="mr-1" style="color: #3b82f6")
              | {{ $t('partnerManagement.revenueByPartner') }}
            client-only
              div(ref="revenueByPartnerChartRef" style="width: 100%; height: 320px;")

          //- Revenue by Tier (Pie Chart)
          .glass-card.p-5.rounded-2xl
            h4.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
              Icon(name="ph:chart-pie-bold" size="16" class="mr-1" style="color: #7849ff")
              | {{ $t('partnerManagement.revenueByTier') }}
            client-only
              div(ref="revenueByTierChartRef" style="width: 100%; height: 320px;")

        //- Performance Table
        .glass-card.p-5.rounded-2xl
          h4.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
            Icon(name="ph:ranking-bold" size="16" class="mr-1" style="color: #f59e0b")
            | {{ $t('partnerManagement.partnerPerformanceTable') }}
          el-table(:data="performanceTableData" style="width: 100%" stripe)
            el-table-column(:label="$t('partnerManagement.partnerName')" min-width="200" sortable prop="partnerName")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  .w-8.h-8.rounded-lg.flex.items-center.justify-center(:style="{ background: getTierColor(row.tier) + '15', color: getTierColor(row.tier) }")
                    Icon(name="ph:buildings-bold" size="16")
                  div
                    p.text-sm.font-bold(style="color: var(--text-primary)") {{ row.partnerName }}
                    el-tag(size="small" :type="getTierTagType(row.tier)" round) {{ row.tier }}
            el-table-column(:label="$t('partnerManagement.dealsClosed')" width="130" align="center" sortable prop="dealsClosed")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: var(--text-primary)") {{ row.dealsClosed }}
            el-table-column(:label="$t('partnerManagement.revenueGenerated')" width="170" align="right" sortable prop="revenueGenerated")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: #22c55e") {{ formatCurrency(row.revenueGenerated) }}
            el-table-column(:label="$t('partnerManagement.conversionRate')" width="150" align="center" sortable prop="conversionRate")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-2
                  el-progress(:percentage="row.conversionRate" :stroke-width="6" :show-text="false" :color="getConversionColor(row.conversionRate)" style="width: 60px")
                  span.text-xs.font-bold(:style="{ color: getConversionColor(row.conversionRate) }") {{ row.conversionRate }}%
            el-table-column(:label="$t('partnerManagement.commissionEarned')" width="160" align="right" sortable prop="commissionEarned")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: #f59e0b") {{ formatCurrency(row.commissionEarned) }}
            template(#empty)
              el-empty(:description="$t('common.noData')")

      //- ============ TAB 4: TIER MANAGEMENT & CO-MARKETING ============
      el-tab-pane(:label="$t('partnerManagement.tierAndCoMarketing')" name="tiers")
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")

          //- Tier Configuration
          .glass-card.p-5.rounded-2xl
            .flex.items-center.justify-between.mb-4
              h4.text-sm.font-bold(style="color: var(--text-primary)")
                Icon(name="ph:crown-bold" size="16" class="mr-1" style="color: #f59e0b")
                | {{ $t('partnerManagement.tierConfiguration') }}
              el-button(type="primary" size="small" @click="openTierDialog()" class="!rounded-lg")
                Icon(name="ph:plus-bold" size="14" class="mr-1")
                | {{ $t('partnerManagement.addTier') }}

            .space-y-4
              .p-4.rounded-xl.border.transition-all(
                v-for="tier in tierConfigurations"
                :key="tier.name"
                style="border-color: var(--border-default)"
                class="hover:shadow-md"
              )
                .flex.items-center.justify-between.mb-3
                  .flex.items-center.gap-3
                    .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: tier.color + '15', color: tier.color }")
                      Icon(name="ph:crown-bold" size="20")
                    div
                      p.text-sm.font-bold(style="color: var(--text-primary)") {{ tier.name }}
                      p.text-xs(style="color: var(--text-muted)") {{ $t('partnerManagement.revenueThreshold') }}: {{ formatCurrency(tier.revenueThreshold) }}
                  .flex.items-center.gap-1
                    el-tooltip(:content="$t('common.edit')")
                      el-button(text circle size="small" :aria-label="$t('common.edit')" @click="openTierDialog(tier)")
                        Icon(name="ph:pencil-simple" size="14")

                .grid.grid-cols-3.gap-3.mb-3
                  .text-center.p-2.rounded-lg(style="background: var(--bg-elevated)")
                    p.text-xs(style="color: var(--text-muted)") {{ $t('partnerManagement.discount') }}
                    p.text-sm.font-bold(style="color: #7849ff") {{ tier.discountPercent }}%
                  .text-center.p-2.rounded-lg(style="background: var(--bg-elevated)")
                    p.text-xs(style="color: var(--text-muted)") {{ $t('partnerManagement.commission') }}
                    p.text-sm.font-bold(style="color: #22c55e") {{ tier.commissionPercent }}%
                  .text-center.p-2.rounded-lg(style="background: var(--bg-elevated)")
                    p.text-xs(style="color: var(--text-muted)") {{ $t('partnerManagement.partners') }}
                    p.text-sm.font-bold(style="color: #3b82f6") {{ tier.partnerCount }}

                div
                  p.text-xs.font-semibold.mb-1(style="color: var(--text-muted)") {{ $t('partnerManagement.benefits') }}:
                  .flex.flex-wrap.gap-1
                    el-tag(v-for="benefit in tier.benefits" :key="benefit" size="small" effect="plain" round) {{ benefit }}

          //- Co-Marketing Fund Tracking
          .glass-card.p-5.rounded-2xl
            .flex.items-center.justify-between.mb-4
              h4.text-sm.font-bold(style="color: var(--text-primary)")
                Icon(name="ph:megaphone-bold" size="16" class="mr-1" style="color: #3b82f6")
                | {{ $t('partnerManagement.coMarketingFunds') }}
              el-button(type="primary" size="small" @click="openCoMarketingDialog()" class="!rounded-lg")
                Icon(name="ph:plus-bold" size="14" class="mr-1")
                | {{ $t('partnerManagement.allocateFund') }}

            el-table(:data="coMarketingFunds" style="width: 100%" size="small" stripe)
              el-table-column(:label="$t('partnerManagement.partner')" min-width="150")
                template(#default="{ row }")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.partnerName }}
              el-table-column(:label="$t('partnerManagement.allocatedBudget')" width="130" align="right")
                template(#default="{ row }")
                  span.text-sm.font-bold(style="color: #3b82f6") {{ formatCurrency(row.allocated) }}
              el-table-column(:label="$t('partnerManagement.spent')" width="120" align="right")
                template(#default="{ row }")
                  span.text-sm.font-bold(style="color: #ef4444") {{ formatCurrency(row.spent) }}
              el-table-column(:label="$t('partnerManagement.remaining')" width="120" align="right")
                template(#default="{ row }")
                  span.text-sm.font-bold(style="color: #22c55e") {{ formatCurrency(row.allocated - row.spent) }}
              el-table-column(:label="$t('partnerManagement.utilization')" width="130" align="center")
                template(#default="{ row }")
                  .flex.items-center.justify-center.gap-2
                    el-progress(:percentage="getUtilization(row)" :stroke-width="6" :show-text="false" :color="getUtilizationColor(row)" style="width: 50px")
                    span.text-xs.font-bold(:style="{ color: getUtilizationColor(row) }") {{ getUtilization(row) }}%
              el-table-column(:label="$t('partnerManagement.campaignsRun')" width="120" align="center")
                template(#default="{ row }")
                  span.text-sm.font-bold(style="color: var(--text-primary)") {{ row.campaignsRun }}
              template(#empty)
                el-empty(:description="$t('common.noData')")

  //- ============ ADD/EDIT PARTNER DIALOG ============
  el-dialog(v-model="showPartnerDialog" :title="editingPartner ? $t('partnerManagement.editPartner') : $t('partnerManagement.addPartner')" width="650px" :close-on-click-modal="false" destroy-on-close)
    el-form(:model="partnerForm" label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('partnerManagement.companyName')" required)
          el-input(v-model="partnerForm.companyName" :placeholder="$t('partnerManagement.companyNamePlaceholder')")
        el-form-item(:label="$t('partnerManagement.contactPerson')" required)
          el-input(v-model="partnerForm.contactPerson" :placeholder="$t('partnerManagement.contactPersonPlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('partnerManagement.email')")
          el-input(v-model="partnerForm.email" type="email" :placeholder="$t('partnerManagement.emailPlaceholder')")
        el-form-item(:label="$t('partnerManagement.phone')")
          el-input(v-model="partnerForm.phone" :placeholder="$t('partnerManagement.phonePlaceholder')")
      .grid.grid-cols-3.gap-4
        el-form-item(:label="$t('partnerManagement.tier')")
          el-select(v-model="partnerForm.tier" class="w-full")
            el-option(v-for="tier in tierOptions" :key="tier" :label="tier" :value="tier")
        el-form-item(:label="$t('partnerManagement.region')")
          el-select(v-model="partnerForm.region" class="w-full" filterable allow-create)
            el-option(v-for="region in regionOptions" :key="region" :label="region" :value="region")
        el-form-item(:label="$t('partnerManagement.status')")
          el-select(v-model="partnerForm.status" class="w-full")
            el-option(:label="$t('partnerManagement.active')" value="active")
            el-option(:label="$t('partnerManagement.inactive')" value="inactive")
            el-option(:label="$t('partnerManagement.pending')" value="pending")
      el-form-item(:label="$t('partnerManagement.address')")
        el-input(v-model="partnerForm.address" :placeholder="$t('partnerManagement.addressPlaceholder')")
      el-form-item(:label="$t('partnerManagement.notes')")
        el-input(v-model="partnerForm.notes" type="textarea" :rows="3" :placeholder="$t('partnerManagement.notesPlaceholder')")
    template(#footer)
      el-button(@click="showPartnerDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="savePartner") {{ $t('common.save') }}

  //- ============ PARTNER DETAIL DRAWER ============
  el-drawer(v-model="showPartnerDrawer" :title="detailPartner?.companyName || ''" size="460px" direction="rtl")
    template(v-if="detailPartner")
      .p-4
        .flex.items-center.gap-3.mb-6
          .w-14.h-14.rounded-2xl.flex.items-center.justify-center(:style="{ background: getTierColor(detailPartner.tier) + '15', color: getTierColor(detailPartner.tier) }")
            Icon(name="ph:buildings-bold" size="28")
          div
            h3.text-xl.font-bold(style="color: var(--text-primary)") {{ detailPartner.companyName }}
            .flex.items-center.gap-2.mt-1
              el-tag(:type="getTierTagType(detailPartner.tier)" size="small" round effect="dark") {{ detailPartner.tier }}
              el-tag(:type="getStatusTagType(detailPartner.status)" size="small" round) {{ getStatusLabel(detailPartner.status) }}

        .grid.grid-cols-2.gap-3.mb-6
          .p-3.rounded-xl.text-center(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            p.text-xs(style="color: var(--text-muted)") {{ $t('partnerManagement.activeDeals') }}
            p.text-xl.font-bold(style="color: #3b82f6") {{ detailPartner.activeDeals }}
          .p-3.rounded-xl.text-center(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            p.text-xs(style="color: var(--text-muted)") {{ $t('partnerManagement.totalRevenue') }}
            p.text-xl.font-bold(style="color: #22c55e") {{ formatCurrency(detailPartner.totalRevenue) }}

        .space-y-3.mb-6
          .flex.items-center.gap-3(v-if="detailPartner.contactPerson")
            Icon(name="ph:user-bold" size="16" style="color: var(--text-muted)")
            span.text-sm(style="color: var(--text-primary)") {{ detailPartner.contactPerson }}
          .flex.items-center.gap-3(v-if="detailPartner.email")
            Icon(name="ph:envelope-bold" size="16" style="color: var(--text-muted)")
            span.text-sm(style="color: var(--text-primary)") {{ detailPartner.email }}
          .flex.items-center.gap-3(v-if="detailPartner.phone")
            Icon(name="ph:phone-bold" size="16" style="color: var(--text-muted)")
            span.text-sm(style="color: var(--text-primary)") {{ detailPartner.phone }}
          .flex.items-center.gap-3(v-if="detailPartner.region")
            Icon(name="ph:globe-bold" size="16" style="color: var(--text-muted)")
            span.text-sm(style="color: var(--text-primary)") {{ detailPartner.region }}
          .flex.items-start.gap-3(v-if="detailPartner.notes")
            Icon(name="ph:note-bold" size="16" style="color: var(--text-muted)" class="mt-0.5")
            span.text-sm(style="color: var(--text-secondary)") {{ detailPartner.notes }}

        .flex.items-center.gap-3
          el-button(type="primary" @click="openPartnerDialog(detailPartner); showPartnerDrawer = false" class="!rounded-xl")
            Icon(name="ph:pencil-bold" size="16" class="mr-1")
            | {{ $t('common.edit') }}

  //- ============ TIER CONFIGURATION DIALOG ============
  el-dialog(v-model="showTierDialog" :title="editingTier ? $t('partnerManagement.editTier') : $t('partnerManagement.addTier')" width="550px" :close-on-click-modal="false" destroy-on-close)
    el-form(:model="tierForm" label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('partnerManagement.tierName')" required)
          el-input(v-model="tierForm.name" :placeholder="$t('partnerManagement.tierNamePlaceholder')")
        el-form-item(:label="$t('partnerManagement.revenueThreshold')")
          el-input-number(v-model="tierForm.revenueThreshold" :min="0" :step="10000" class="w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('partnerManagement.discountPercent')")
          el-input-number(v-model="tierForm.discountPercent" :min="0" :max="100" :precision="1" class="w-full")
        el-form-item(:label="$t('partnerManagement.commissionPercent')")
          el-input-number(v-model="tierForm.commissionPercent" :min="0" :max="100" :precision="1" class="w-full")
      el-form-item(:label="$t('partnerManagement.benefits')")
        el-select(v-model="tierForm.benefits" multiple filterable allow-create :placeholder="$t('partnerManagement.benefitsPlaceholder')" class="w-full")
          el-option(v-for="b in defaultBenefitOptions" :key="b" :label="b" :value="b")
    template(#footer)
      el-button(@click="showTierDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveTierConfig") {{ $t('common.save') }}

  //- ============ CO-MARKETING FUND DIALOG ============
  el-dialog(v-model="showCoMarketingDialog" :title="$t('partnerManagement.allocateFund')" width="480px" :close-on-click-modal="false" destroy-on-close)
    el-form(:model="coMarketingForm" label-position="top" size="large")
      el-form-item(:label="$t('partnerManagement.partner')" required)
        el-select(v-model="coMarketingForm.partnerName" class="w-full" filterable)
          el-option(v-for="p in partners" :key="p.id" :label="p.companyName" :value="p.companyName")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('partnerManagement.allocatedBudget')" required)
          el-input-number(v-model="coMarketingForm.allocated" :min="0" :step="1000" class="w-full")
        el-form-item(:label="$t('partnerManagement.spent')")
          el-input-number(v-model="coMarketingForm.spent" :min="0" class="w-full")
      el-form-item(:label="$t('partnerManagement.campaignsRun')")
        el-input-number(v-model="coMarketingForm.campaignsRun" :min="0" class="w-full")
    template(#footer)
      el-button(@click="showCoMarketingDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveCoMarketingFund") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import * as echarts from 'echarts/core';

interface Partner {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  tier: string;
  region: string;
  activeDeals: number;
  totalRevenue: number;
  status: string;
  address: string;
  notes: string;
}

interface DealRegistration {
  id: string;
  dealName: string;
  partnerName: string;
  customerName: string;
  amount: number;
  stage: string;
  registrationDate: string;
  expiryDate: string;
  status: string;
}

interface TierConfiguration {
  name: string;
  revenueThreshold: number;
  discountPercent: number;
  commissionPercent: number;
  partnerCount: number;
  color: string;
  benefits: string[];
}

interface CoMarketingFund {
  id: string;
  partnerName: string;
  allocated: number;
  spent: number;
  campaignsRun: number;
}

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();

// ──────────────────────────────────────────
// State
// ──────────────────────────────────────────
const activeTab = ref('directory');
const loading = ref(false);
const saving = ref(false);

// Partners
const partners = ref<Partner[]>([]);
const partnerSearch = ref('');
const filterTier = ref('');
const filterRegion = ref('');
const filterPartnerStatus = ref('');
const showPartnerDialog = ref(false);
const showPartnerDrawer = ref(false);
const editingPartner = ref<Partner | null>(null);
const detailPartner = ref<Partner | null>(null);

const tierOptions = ['Platinum', 'Gold', 'Silver', 'Bronze'];
const regionOptions = ['Middle East', 'North America', 'Europe', 'Asia Pacific', 'Africa', 'Latin America'];

const defaultPartnerForm = () => ({
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  tier: 'Silver',
  region: 'Middle East',
  status: 'active' as string,
  address: '',
  notes: ''
});
const partnerForm = reactive(defaultPartnerForm());

// Deal Registration
const dealRegistrations = ref<DealRegistration[]>([]);
const dealSearch = ref('');
const filterDealStatus = ref('');

// Performance
const performancePeriod = ref('monthly');
const revenueByPartnerChartRef = ref<HTMLElement>();
const revenueByTierChartRef = ref<HTMLElement>();
let partnerChart: echarts.ECharts | null = null;
let tierChart: echarts.ECharts | null = null;

// Tier Management
const tierConfigurations = ref<TierConfiguration[]>([]);
const showTierDialog = ref(false);
const editingTier = ref<TierConfiguration | null>(null);

const defaultTierForm = () => ({
  name: '',
  revenueThreshold: 0,
  discountPercent: 0,
  commissionPercent: 0,
  benefits: [] as string[]
});
const tierForm = reactive(defaultTierForm());

const defaultBenefitOptions = [
  'Priority Support',
  'Co-branded Materials',
  'Lead Sharing',
  'Joint Marketing',
  'Training Access',
  'API Access',
  'Dedicated Account Manager',
  'Early Product Access',
  'Revenue Sharing',
  'Event Sponsorship'
];

// Co-Marketing
const coMarketingFunds = ref<CoMarketingFund[]>([]);
const showCoMarketingDialog = ref(false);

const defaultCoMarketingForm = () => ({
  partnerName: '',
  allocated: 0,
  spent: 0,
  campaignsRun: 0
});
const coMarketingForm = reactive(defaultCoMarketingForm());

// ──────────────────────────────────────────
// Demo Data
// ──────────────────────────────────────────
function loadDemoData() {
  partners.value = [
    {
      id: '1',
      companyName: 'TechNova Solutions',
      contactPerson: 'Ahmed Al-Rashid',
      email: 'ahmed@technova.com',
      phone: '+966 50 123 4567',
      tier: 'Platinum',
      region: 'Middle East',
      activeDeals: 12,
      totalRevenue: 2450000,
      status: 'active',
      address: 'Riyadh, KSA',
      notes: 'Strategic partner since 2021'
    },
    {
      id: '2',
      companyName: 'CloudPeak Systems',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@cloudpeak.io',
      phone: '+1 555 234 5678',
      tier: 'Gold',
      region: 'North America',
      activeDeals: 8,
      totalRevenue: 1820000,
      status: 'active',
      address: 'San Francisco, CA',
      notes: ''
    },
    {
      id: '3',
      companyName: 'DataBridge GmbH',
      contactPerson: 'Marcus Weber',
      email: 'marcus@databridge.de',
      phone: '+49 30 555 1234',
      tier: 'Gold',
      region: 'Europe',
      activeDeals: 6,
      totalRevenue: 1340000,
      status: 'active',
      address: 'Berlin, Germany',
      notes: 'Expanding to new markets'
    },
    {
      id: '4',
      companyName: 'NexGen Consulting',
      contactPerson: 'Fatima Al-Saud',
      email: 'fatima@nexgen.sa',
      phone: '+966 55 987 6543',
      tier: 'Silver',
      region: 'Middle East',
      activeDeals: 4,
      totalRevenue: 680000,
      status: 'active',
      address: 'Jeddah, KSA',
      notes: ''
    },
    {
      id: '5',
      companyName: 'Pacific Digital',
      contactPerson: 'Wei Chen',
      email: 'wei@pacificdigital.cn',
      phone: '+86 21 555 8765',
      tier: 'Silver',
      region: 'Asia Pacific',
      activeDeals: 5,
      totalRevenue: 920000,
      status: 'active',
      address: 'Shanghai, China',
      notes: ''
    },
    {
      id: '6',
      companyName: 'Sahara IT Services',
      contactPerson: 'Omar Khalil',
      email: 'omar@saharait.com',
      phone: '+20 10 555 3456',
      tier: 'Bronze',
      region: 'Africa',
      activeDeals: 2,
      totalRevenue: 310000,
      status: 'active',
      address: 'Cairo, Egypt',
      notes: ''
    },
    {
      id: '7',
      companyName: 'Andean Software',
      contactPerson: 'Carlos Mendez',
      email: 'carlos@andeansw.com',
      phone: '+57 1 555 7890',
      tier: 'Bronze',
      region: 'Latin America',
      activeDeals: 1,
      totalRevenue: 185000,
      status: 'pending',
      address: 'Bogota, Colombia',
      notes: 'New partner onboarding'
    },
    {
      id: '8',
      companyName: 'AlphaNet Corp',
      contactPerson: "Liam O'Brien",
      email: 'liam@alphanet.co.uk',
      phone: '+44 20 555 4321',
      tier: 'Gold',
      region: 'Europe',
      activeDeals: 7,
      totalRevenue: 1560000,
      status: 'active',
      address: 'London, UK',
      notes: ''
    },
    {
      id: '9',
      companyName: 'Gulf Integration',
      contactPerson: 'Hassan Nouri',
      email: 'hassan@gulfint.ae',
      phone: '+971 50 555 8888',
      tier: 'Silver',
      region: 'Middle East',
      activeDeals: 3,
      totalRevenue: 540000,
      status: 'inactive',
      address: 'Dubai, UAE',
      notes: 'Contract under review'
    },
    {
      id: '10',
      companyName: 'Zenith Partners',
      contactPerson: 'Maya Patel',
      email: 'maya@zenithp.in',
      phone: '+91 98 555 6789',
      tier: 'Platinum',
      region: 'Asia Pacific',
      activeDeals: 10,
      totalRevenue: 2100000,
      status: 'active',
      address: 'Mumbai, India',
      notes: 'Top performer Q4'
    }
  ];

  dealRegistrations.value = [
    {
      id: '1',
      dealName: 'Enterprise ERP Migration',
      partnerName: 'TechNova Solutions',
      customerName: 'Al Rajhi Holdings',
      amount: 450000,
      stage: 'Negotiation',
      registrationDate: '2025-12-01',
      expiryDate: '2026-06-01',
      status: 'approved'
    },
    {
      id: '2',
      dealName: 'Cloud Infrastructure Setup',
      partnerName: 'CloudPeak Systems',
      customerName: 'Global Corp LLC',
      amount: 280000,
      stage: 'Proposal',
      registrationDate: '2026-01-15',
      expiryDate: '2026-07-15',
      status: 'pending'
    },
    {
      id: '3',
      dealName: 'CRM Implementation',
      partnerName: 'DataBridge GmbH',
      customerName: 'EuroTech AG',
      amount: 195000,
      stage: 'Discovery',
      registrationDate: '2026-02-01',
      expiryDate: '2026-08-01',
      status: 'pending'
    },
    {
      id: '4',
      dealName: 'Security Audit & Compliance',
      partnerName: 'AlphaNet Corp',
      customerName: 'FinSec Bank',
      amount: 120000,
      stage: 'Closed Won',
      registrationDate: '2025-10-15',
      expiryDate: '2026-04-15',
      status: 'approved'
    },
    {
      id: '5',
      dealName: 'Data Analytics Platform',
      partnerName: 'Zenith Partners',
      customerName: 'Tata Industries',
      amount: 380000,
      stage: 'Negotiation',
      registrationDate: '2026-01-20',
      expiryDate: '2026-07-20',
      status: 'approved'
    },
    {
      id: '6',
      dealName: 'Legacy System Upgrade',
      partnerName: 'NexGen Consulting',
      customerName: 'Saudi Telecom',
      amount: 175000,
      stage: 'Proposal',
      registrationDate: '2026-02-10',
      expiryDate: '2026-08-10',
      status: 'pending'
    },
    {
      id: '7',
      dealName: 'Mobile App Development',
      partnerName: 'Pacific Digital',
      customerName: 'ShopEase Inc',
      amount: 95000,
      stage: 'Discovery',
      registrationDate: '2025-09-01',
      expiryDate: '2026-03-01',
      status: 'expired'
    },
    {
      id: '8',
      dealName: 'IT Infrastructure Refresh',
      partnerName: 'Sahara IT Services',
      customerName: 'Nile Corp',
      amount: 65000,
      stage: 'Qualification',
      registrationDate: '2026-02-05',
      expiryDate: '2026-08-05',
      status: 'rejected'
    },
    {
      id: '9',
      dealName: 'AI Automation Suite',
      partnerName: 'TechNova Solutions',
      customerName: 'ACME Industries',
      amount: 520000,
      stage: 'Negotiation',
      registrationDate: '2026-02-15',
      expiryDate: '2026-08-15',
      status: 'pending'
    },
    {
      id: '10',
      dealName: 'Cybersecurity Framework',
      partnerName: 'AlphaNet Corp',
      customerName: 'BritishGas PLC',
      amount: 210000,
      stage: 'Proposal',
      registrationDate: '2026-01-28',
      expiryDate: '2026-07-28',
      status: 'approved'
    }
  ];

  tierConfigurations.value = [
    {
      name: 'Platinum',
      revenueThreshold: 2000000,
      discountPercent: 25,
      commissionPercent: 20,
      partnerCount: 2,
      color: '#7849ff',
      benefits: [
        'Priority Support',
        'Dedicated Account Manager',
        'Co-branded Materials',
        'Joint Marketing',
        'Early Product Access',
        'Revenue Sharing'
      ]
    },
    {
      name: 'Gold',
      revenueThreshold: 1000000,
      discountPercent: 18,
      commissionPercent: 15,
      partnerCount: 3,
      color: '#f59e0b',
      benefits: ['Priority Support', 'Co-branded Materials', 'Lead Sharing', 'Training Access']
    },
    {
      name: 'Silver',
      revenueThreshold: 500000,
      discountPercent: 12,
      commissionPercent: 10,
      partnerCount: 3,
      color: '#94a3b8',
      benefits: ['Lead Sharing', 'Training Access', 'API Access']
    },
    {
      name: 'Bronze',
      revenueThreshold: 100000,
      discountPercent: 5,
      commissionPercent: 5,
      partnerCount: 2,
      color: '#b45309',
      benefits: ['Training Access', 'API Access']
    }
  ];

  coMarketingFunds.value = [
    { id: '1', partnerName: 'TechNova Solutions', allocated: 150000, spent: 98000, campaignsRun: 8 },
    { id: '2', partnerName: 'CloudPeak Systems', allocated: 100000, spent: 72000, campaignsRun: 5 },
    { id: '3', partnerName: 'DataBridge GmbH', allocated: 80000, spent: 45000, campaignsRun: 4 },
    { id: '4', partnerName: 'Zenith Partners', allocated: 120000, spent: 110000, campaignsRun: 7 },
    { id: '5', partnerName: 'AlphaNet Corp', allocated: 90000, spent: 30000, campaignsRun: 2 },
    { id: '6', partnerName: 'NexGen Consulting', allocated: 50000, spent: 12000, campaignsRun: 1 },
    { id: '7', partnerName: 'Pacific Digital', allocated: 60000, spent: 48000, campaignsRun: 3 }
  ];
}

// ──────────────────────────────────────────
// Computed
// ──────────────────────────────────────────
const kpiStats = computed(() => {
  const totalPartners = partners.value.length;
  const activeDeals = partners.value.reduce((s, p) => s + (p.activeDeals || 0), 0);
  const channelRevenue = partners.value.reduce((s, p) => s + (p.totalRevenue || 0), 0);
  const avgPartnerRevenue = totalPartners > 0 ? Math.round(channelRevenue / totalPartners) : 0;

  return [
    { label: t('partnerManagement.totalPartners'), value: totalPartners, icon: 'ph:buildings-bold', color: '#7849ff', trend: 12 },
    { label: t('partnerManagement.activeDeals'), value: activeDeals, icon: 'ph:handshake-bold', color: '#3b82f6', trend: 8 },
    {
      label: t('partnerManagement.channelRevenue'),
      value: formatCurrency(channelRevenue),
      icon: 'ph:currency-dollar-bold',
      color: '#22c55e',
      trend: 15
    },
    {
      label: t('partnerManagement.avgPartnerRevenue'),
      value: formatCurrency(avgPartnerRevenue),
      icon: 'ph:chart-line-up-bold',
      color: '#f59e0b',
      trend: 5
    }
  ];
});

const filteredPartners = computed(() => {
  let data = [...partners.value];
  if (partnerSearch.value) {
    const q = partnerSearch.value.toLowerCase();
    data = data.filter(
      p =>
        (p.companyName || '').toLowerCase().includes(q) ||
        (p.contactPerson || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q)
    );
  }
  if (filterTier.value) data = data.filter(p => p.tier === filterTier.value);
  if (filterRegion.value) data = data.filter(p => p.region === filterRegion.value);
  if (filterPartnerStatus.value) data = data.filter(p => p.status === filterPartnerStatus.value);
  return data;
});

const filteredDealRegistrations = computed(() => {
  let data = [...dealRegistrations.value];
  if (dealSearch.value) {
    const q = dealSearch.value.toLowerCase();
    data = data.filter(
      d =>
        (d.dealName || '').toLowerCase().includes(q) ||
        (d.partnerName || '').toLowerCase().includes(q) ||
        (d.customerName || '').toLowerCase().includes(q)
    );
  }
  if (filterDealStatus.value) data = data.filter(d => d.status === filterDealStatus.value);
  return data;
});

const performanceTableData = computed(() => {
  return partners.value
    .filter(p => p.status === 'active')
    .map(p => {
      const seed = p.companyName.length;
      return {
        partnerName: p.companyName,
        tier: p.tier,
        dealsClosed: Math.max(1, p.activeDeals + ((seed * 3) % 8)),
        revenueGenerated: p.totalRevenue,
        conversionRate: Math.min(95, 25 + ((seed * 7) % 55)),
        commissionEarned: Math.round(p.totalRevenue * (getTierCommission(p.tier) / 100))
      };
    })
    .sort((a, b) => b.revenueGenerated - a.revenueGenerated);
});

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
function formatCurrency(val: number | string): string {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });
}

function formatDate(date: string): string {
  if (!date) return '\u2014';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function isExpired(date: string): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

function getTierColor(tier: string): string {
  const colors: Record<string, string> = { Platinum: '#7849ff', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309' };
  return colors[tier] || '#7849ff';
}

function getTierTagType(tier: string): string {
  const types: Record<string, string> = { Platinum: '', Gold: 'warning', Silver: 'info', Bronze: 'danger' };
  return types[tier] || '';
}

function getTierIcon(tier: string): string {
  const icons: Record<string, string> = { Platinum: 'ph:diamond-bold', Gold: 'ph:crown-bold', Silver: 'ph:medal-bold', Bronze: 'ph:shield-bold' };
  return icons[tier] || 'ph:star-bold';
}

function getTierCommission(tier: string): number {
  const commissions: Record<string, number> = { Platinum: 20, Gold: 15, Silver: 10, Bronze: 5 };
  return commissions[tier] || 5;
}

function getStatusTagType(status: string): string {
  const types: Record<string, string> = { active: 'success', inactive: 'info', pending: 'warning' };
  return types[status] || '';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: t('partnerManagement.active'),
    inactive: t('partnerManagement.inactive'),
    pending: t('partnerManagement.pending')
  };
  return labels[status] || status;
}

function getDealStatusTagType(status: string): string {
  const types: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger', expired: 'info' };
  return types[status] || '';
}

function getDealStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: t('partnerManagement.pending'),
    approved: t('partnerManagement.approved'),
    rejected: t('partnerManagement.rejected'),
    expired: t('partnerManagement.expired')
  };
  return labels[status] || status;
}

function getConversionColor(rate: number): string {
  if (rate >= 60) return '#22c55e';
  if (rate >= 35) return '#f59e0b';
  return '#ef4444';
}

function getUtilization(row: CoMarketingFund): number {
  if (!row.allocated) return 0;
  return Math.round((row.spent / row.allocated) * 100);
}

function getUtilizationColor(row: CoMarketingFund): string {
  const util = getUtilization(row);
  if (util >= 90) return '#ef4444';
  if (util >= 60) return '#f59e0b';
  return '#22c55e';
}

// ──────────────────────────────────────────
// Partner CRUD
// ──────────────────────────────────────────
function openPartnerDialog(partner?: Partner) {
  if (partner) {
    editingPartner.value = partner;
    Object.assign(partnerForm, {
      companyName: partner.companyName || '',
      contactPerson: partner.contactPerson || '',
      email: partner.email || '',
      phone: partner.phone || '',
      tier: partner.tier || 'Silver',
      region: partner.region || 'Middle East',
      status: partner.status || 'active',
      address: partner.address || '',
      notes: partner.notes || ''
    });
  } else {
    editingPartner.value = null;
    Object.assign(partnerForm, defaultPartnerForm());
  }
  showPartnerDialog.value = true;
}

function savePartner() {
  if (!partnerForm.companyName?.trim()) {
    ElMessage.warning(t('partnerManagement.fillRequired'));
    return;
  }
  if (!partnerForm.contactPerson?.trim()) {
    ElMessage.warning(t('partnerManagement.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    if (editingPartner.value) {
      const idx = partners.value.findIndex(p => p.id === editingPartner.value!.id);
      if (idx >= 0) {
        partners.value[idx] = { ...partners.value[idx], ...partnerForm } as unknown;
      }
    } else {
      partners.value.push({
        id: String(Date.now()),
        ...partnerForm,
        activeDeals: 0,
        totalRevenue: 0
      });
    }
    showPartnerDialog.value = false;
    ElMessage.success(t('common.saved'));
  } finally {
    saving.value = false;
  }
}

function openPartnerDetail(partner: Partner) {
  detailPartner.value = partner;
  showPartnerDrawer.value = true;
}

async function handleDeletePartner(partner: Partner) {
  try {
    await ElMessageBox.confirm(t('partnerManagement.confirmDelete'), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });
    partners.value = partners.value.filter(p => p.id !== partner.id);
    ElMessage.success(t('common.deleted'));
  } catch {
    // cancelled
  }
}

// ──────────────────────────────────────────
// Deal Actions
// ──────────────────────────────────────────
function handleDealAction(deal: DealRegistration, newStatus: string) {
  const idx = dealRegistrations.value.findIndex(d => d.id === deal.id);
  if (idx >= 0) {
    dealRegistrations.value[idx]!.status = newStatus;
    const action = newStatus === 'approved' ? t('partnerManagement.approved') : t('partnerManagement.rejected');
    ElNotification({
      type: newStatus === 'approved' ? 'success' : 'warning',
      title: action,
      message: `${deal.dealName} ${t('partnerManagement.hasBeenMarkedAs')} ${action.toLowerCase()}`
    });
  }
}

// ──────────────────────────────────────────
// Tier Configuration
// ──────────────────────────────────────────
function openTierDialog(tier?: TierConfiguration) {
  if (tier) {
    editingTier.value = tier;
    Object.assign(tierForm, {
      name: tier.name || '',
      revenueThreshold: tier.revenueThreshold || 0,
      discountPercent: tier.discountPercent || 0,
      commissionPercent: tier.commissionPercent || 0,
      benefits: [...(tier.benefits || [])]
    });
  } else {
    editingTier.value = null;
    Object.assign(tierForm, defaultTierForm());
  }
  showTierDialog.value = true;
}

function saveTierConfig() {
  if (!tierForm.name?.trim()) {
    ElMessage.warning(t('partnerManagement.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    if (editingTier.value) {
      const idx = tierConfigurations.value.findIndex(tc => tc.name === editingTier.value!.name);
      if (idx >= 0) {
        tierConfigurations.value[idx] = {
          ...tierConfigurations.value[idx],
          ...tierForm,
          color: getTierColor(tierForm.name)
        } as unknown;
      }
    } else {
      tierConfigurations.value.push({
        ...tierForm,
        color: getTierColor(tierForm.name),
        partnerCount: 0
      });
    }
    showTierDialog.value = false;
    ElMessage.success(t('common.saved'));
  } finally {
    saving.value = false;
  }
}

// ──────────────────────────────────────────
// Co-Marketing Funds
// ──────────────────────────────────────────
function openCoMarketingDialog() {
  Object.assign(coMarketingForm, defaultCoMarketingForm());
  showCoMarketingDialog.value = true;
}

function saveCoMarketingFund() {
  if (!coMarketingForm.partnerName) {
    ElMessage.warning(t('partnerManagement.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    coMarketingFunds.value.push({
      id: String(Date.now()),
      ...coMarketingForm
    });
    showCoMarketingDialog.value = false;
    ElMessage.success(t('common.saved'));
  } finally {
    saving.value = false;
  }
}

// ──────────────────────────────────────────
// Export
// ──────────────────────────────────────────
function exportPartners() {
  const headers = [
    t('partnerManagement.companyName'),
    t('partnerManagement.tier'),
    t('partnerManagement.region'),
    t('partnerManagement.contactPerson'),
    t('partnerManagement.activeDeals'),
    t('partnerManagement.totalRevenue'),
    t('partnerManagement.status')
  ];
  const rows = filteredPartners.value.map(p => [p.companyName, p.tier, p.region, p.contactPerson, p.activeDeals, p.totalRevenue, p.status]);
  const csv = [headers, ...rows].map(r => r.map((c: string | number) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `partners-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t('partnerManagement.exportSuccess'));
}

// ──────────────────────────────────────────
// ECharts
// ──────────────────────────────────────────
function initRevenueByPartnerChart() {
  if (!revenueByPartnerChartRef.value) return;
  if (partnerChart) partnerChart.dispose();
  partnerChart = echarts.init(revenueByPartnerChartRef.value);

  const activePartners = partners.value
    .filter(p => p.status === 'active')
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 8);

  const names = activePartners.map(p => p.companyName);
  const values = activePartners.map(p => p.totalRevenue);
  const colors = activePartners.map(p => getTierColor(p.tier));

  partnerChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const d = params[0];
        return `${d.name}<br/>${d.seriesName}: <b>${Number(d.value).toLocaleString()} SAR</b>`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: '#94a3b8', rotate: 25, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: t('partnerManagement.revenue'),
      axisLabel: { color: '#94a3b8', formatter: (v: number) => (v / 1000000).toFixed(1) + 'M' }
    },
    series: [
      {
        name: t('partnerManagement.revenue'),
        type: 'bar',
        data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: [6, 6, 0, 0] } })),
        barMaxWidth: 40
      }
    ]
  });
}

function initRevenueByTierChart() {
  if (!revenueByTierChartRef.value) return;
  if (tierChart) tierChart.dispose();
  tierChart = echarts.init(revenueByTierChartRef.value);

  const tierRevenue: Record<string, number> = {};
  partners.value.forEach(p => {
    tierRevenue[p.tier] = (tierRevenue[p.tier] || 0) + (p.totalRevenue || 0);
  });

  const data = Object.entries(tierRevenue).map(([name, value]) => ({
    name,
    value,
    itemStyle: { color: getTierColor(name) }
  }));

  tierChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) =>
        `${params.name}<br/>${t('partnerManagement.revenue')}: <b>${Number(params.value).toLocaleString()} SAR</b> (${params.percent}%)`
    },
    legend: { bottom: '0%', textStyle: { color: '#94a3b8' } },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#1e1e2e', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
        data
      }
    ]
  });
}

function handleResize() {
  partnerChart?.resize();
  tierChart?.resize();
}

function initCharts() {
  nextTick(() => {
    initRevenueByPartnerChart();
    initRevenueByTierChart();
    window.addEventListener('resize', handleResize);
  });
}

// ──────────────────────────────────────────
// Watchers
// ──────────────────────────────────────────
watch(activeTab, val => {
  if (val === 'performance') {
    nextTick(() => initCharts());
  }
});

watch(performancePeriod, () => {
  if (activeTab.value === 'performance') {
    nextTick(() => initCharts());
  }
});

// ──────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────
onMounted(() => {
  loadDemoData();
});

onBeforeUnmount(() => {
  partnerChart?.dispose();
  tierChart?.dispose();
  window.removeEventListener('resize', handleResize);
});
</script>

<style lang="scss" scoped>
.animate-entrance {
  animation: entranceSlide 0.4s ease-out;
}

@keyframes entranceSlide {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.premium-btn {
  background: linear-gradient(135deg, #7849ff, #a78bfa);
  border: none;
  color: white;

  &:hover {
    background: linear-gradient(135deg, #6b3fef, #9b7ae8);
  }
}

:deep(.el-tabs__item) {
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  background-color: #7849ff;
}

:deep(.el-tabs__item.is-active) {
  color: #7849ff;
}

:deep(.el-table) {
  --el-table-border-color: var(--border-default);
  --el-table-header-bg-color: var(--bg-elevated);
  background: transparent;
}

.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 1rem;
}

@media (max-width: 768px) {
  .glass-card {
    padding: 1rem !important;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-pagination) {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
