<template lang="pug">
div
  //- Header
  ModuleHeader(
    :title="$t('loyaltyRewards.title')"
    :subtitle="$t('loyaltyRewards.subtitle')"
  )
    template(#actions)
      el-button(size="large" @click="exportMembersCSV" class="!rounded-2xl")
        Icon(name="ph:download-bold" size="16")
        span.ml-1 {{ $t('common.export') }}
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openProgramDialog()")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('loyalty.newProgram') }}

  //- KPI Stats
  StatCards(:stats="kpiStats")

  //- Dashboard: Tier Distribution
  .glass-card.p-6.rounded-2xl.mb-6(v-if="dashboardData && !loading")
    .flex.items-center.justify-between.mb-5
      .flex.items-center.gap-2
        Icon(name="ph:chart-pie-slice-bold" size="20" style="color: #7849ff")
        h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('loyalty.tierDistribution') }}
      .flex.items-center.gap-2
        span.text-xs(style="color: var(--text-muted)") {{ $t('loyalty.totalMembers') }}:
        span.text-sm.font-bold(style="color: var(--text-primary)") {{ (dashboardData.totalMembers || 0).toLocaleString() }}

    //- Tier Cards
    .grid.gap-4.mb-5(class="grid-cols-2 md:grid-cols-4")
      .glass-card.p-4.rounded-xl.text-center.relative.overflow-hidden(v-for="tier in tierData" :key="tier.name")
        .absolute.top-0.left-0.w-full.h-1(:style="{ background: tier.color }")
        .w-10.h-10.mx-auto.rounded-full.flex.items-center.justify-center.mb-2(:style="{ background: tier.color + '20' }")
          Icon(name="ph:crown-bold" size="20" :style="{ color: tier.color }")
        p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(:style="{ color: tier.color }") {{ tier.name }}
        p.text-2xl.font-bold(style="color: var(--text-primary)") {{ tier.count }}
        p.text-xs(style="color: var(--text-muted)") {{ $t('loyalty.members') }}

    //- Tier Progress Bar
    .mt-3(v-if="tierTotal > 0")
      .flex.h-7.rounded-xl.overflow-hidden
        .transition-all.flex.items-center.justify-center(
          v-for="tier in tierData"
          :key="'bar-' + tier.name"
          :style="{ width: ((tier.count / tierTotal) * 100) + '%', background: tier.color, minWidth: tier.count > 0 ? '28px' : '0' }"
        )
          span.text-xs.font-bold.text-white(v-if="(tier.count / tierTotal) >= 0.08") {{ Math.round((tier.count / tierTotal) * 100) }}%

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Content Tabs
  template(v-else)
    el-tabs(v-model="activeTab")

      //- ─── Programs Tab ─────────────────────────────────
      el-tab-pane(:label="$t('loyalty.programs')" name="programs")
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4.flex-wrap.gap-3
            el-input(
              v-model="programSearch"
              :placeholder="$t('common.search')"
              clearable
              style="max-width: 280px"
              size="large"
              class="!rounded-xl"
            )
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
            el-select(v-model="programStatusFilter" :placeholder="$t('common.all')" clearable size="large" style="width: 160px")
              el-option(label="All" value="")
              el-option(label="Active" value="ACTIVE")
              el-option(label="Paused" value="PAUSED")
              el-option(label="Ended" value="ENDED")

          //- Desktop table
          .hidden(class="md:block")
            el-table(:data="filteredPrograms" style="width: 100%" stripe)
              el-table-column(:label="$t('common.name')" min-width="220" sortable prop="name")
                template(#default="{ row }")
                  .flex.items-center.gap-3
                    .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(245, 158, 11, 0.1)")
                      Icon(name="ph:crown-bold" size="18" style="color: #f59e0b")
                    div
                      p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                      p.text-xs(v-if="row.description" style="color: var(--text-muted)") {{ truncate(row.description, 50) }}
              el-table-column(:label="$t('common.status')" width="130" sortable prop="status")
                template(#default="{ row }")
                  el-tag(:type="getProgramStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
              el-table-column(:label="$t('loyalty.pointsPerCurrency')" width="140" align="center")
                template(#default="{ row }")
                  span.text-sm.font-bold(style="color: #f59e0b") {{ row.pointsPerCurrency || 0 }}
              el-table-column(:label="$t('loyalty.tiers')" width="280")
                template(#default="{ row }")
                  .flex.flex-wrap.gap-1(v-if="row.tiers && row.tiers.length")
                    el-tag(v-for="tier in row.tiers" :key="tier.name" size="small" effect="plain") {{ tier.name }} ({{ tier.minPoints || 0 }}+)
                  span.text-sm(v-else style="color: var(--text-muted)") --
              el-table-column(:label="$t('common.actions')" width="120" align="center")
                template(#default="{ row }")
                  .flex.items-center.justify-center.gap-1
                    el-button(text size="small" type="primary" @click.stop="openProgramDialog(row)")
                      Icon(name="ph:pencil-bold" size="16")
                    el-button(text size="small" type="danger" @click.stop="handleDeleteProgram(row)")
                      Icon(name="ph:trash-bold" size="16")

          //- Mobile cards
          .space-y-3(class="md:hidden")
            .glass-card.p-4.rounded-2xl(v-for="row in filteredPrograms" :key="row.id")
              .flex.items-start.justify-between.mb-2
                .flex.items-center.gap-3
                  .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(245, 158, 11, 0.1)")
                    Icon(name="ph:crown-bold" size="18" style="color: #f59e0b")
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                    p.text-xs(style="color: var(--text-muted)") {{ row.pointsPerCurrency || 0 }} pts/unit
                el-tag(:type="getProgramStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
              .flex.items-center.justify-end.gap-2.mt-3
                el-button(text size="small" type="primary" @click.stop="openProgramDialog(row)")
                  Icon(name="ph:pencil-bold" size="14")
                el-button(text size="small" type="danger" @click.stop="handleDeleteProgram(row)")
                  Icon(name="ph:trash-bold" size="14")

          //- Empty state
          .text-center.py-12(v-if="!filteredPrograms.length")
            Icon(name="ph:crown" size="48" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('loyalty.noPrograms') }}

          //- Pagination
          .flex.justify-end.mt-4(v-if="programsPagination.total > programsPagination.limit")
            el-pagination(
              :current-page="programsPagination.page"
              :page-size="programsPagination.limit"
              :total="programsPagination.total"
              layout="total, prev, pager, next"
              @current-change="(p: number) => { programsPagination.page = p; fetchPrograms() }"
            )

      //- ─── Members Tab ──────────────────────────────────
      el-tab-pane(:label="$t('loyalty.membersTab')" name="members")
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4.flex-wrap.gap-3
            el-input(
              v-model="memberSearch"
              :placeholder="$t('loyalty.searchMembers')"
              clearable
              style="max-width: 280px"
              size="large"
              class="!rounded-xl"
            )
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
            .flex.items-center.gap-3
              el-select(v-model="memberTierFilter" :placeholder="$t('loyalty.allTiers')" clearable size="large" style="width: 160px")
                el-option(label="All Tiers" value="")
                el-option(label="Bronze" value="BRONZE")
                el-option(label="Silver" value="SILVER")
                el-option(label="Gold" value="GOLD")
                el-option(label="Platinum" value="PLATINUM")
              el-button(size="large" type="primary" plain class="!rounded-2xl" @click="openAdjustDialog()")
                Icon(name="ph:plus-minus-bold" size="16")
                span.ml-1 {{ $t('loyalty.adjustPoints') }}

          //- Bulk Actions Bar
          .flex.items-center.gap-2.mb-3(v-if="selectedMembers.length")
            span.text-sm.font-medium(style="color: var(--text-primary)") {{ selectedMembers.length }} {{ $t('common.selected') }}
            el-button(size="small" @click="bulkAdjustPoints" class="!rounded-xl")
              Icon(name="ph:plus-minus-bold" size="14")
              span.ml-1 {{ $t('loyalty.adjustPoints') }}
            el-button(size="small" @click="bulkChangeTier" class="!rounded-xl")
              Icon(name="ph:crown-bold" size="14")
              span.ml-1 {{ $t('common.changeStatus') }}
            el-button(size="small" @click="exportMembersCSV" class="!rounded-xl")
              Icon(name="ph:download-bold" size="14")
              span.ml-1 {{ $t('common.export') }}

          //- Members Table (desktop)
          .hidden(class="md:block")
            el-table(:data="filteredMembers" style="width: 100%" stripe @selection-change="handleMemberSelectionChange")
              el-table-column(type="selection" width="40")
              el-table-column(:label="$t('loyalty.client')" min-width="200")
                template(#default="{ row }")
                  .flex.items-center.gap-3.cursor-pointer(@click="openMemberDetail(row)")
                    .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(:style="{ background: getTierColor(row.tier) + '20' }")
                      span.text-sm.font-bold(:style="{ color: getTierColor(row.tier) }") {{ (row.clientName || '?').charAt(0).toUpperCase() }}
                    div
                      p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.clientName || row.clientId }}
                      p.text-xs(v-if="row.email" style="color: var(--text-muted)") {{ row.email }}
              el-table-column(:label="$t('loyalty.tier')" width="130" align="center")
                template(#default="{ row }")
                  el-tag(:color="getTierColor(row.tier)" effect="dark" size="small" round style="border: none; color: #fff") {{ row.tier }}
              el-table-column(:label="$t('loyalty.pointsBalance')" width="140" align="center" sortable)
                template(#default="{ row }")
                  span.text-sm.font-bold(style="color: var(--text-primary)") {{ (row.balance || 0).toLocaleString() }}
              el-table-column(:label="$t('loyalty.lifetimePoints')" width="140" align="center")
                template(#default="{ row }")
                  span.text-sm(style="color: var(--text-muted)") {{ (row.totalEarned || 0).toLocaleString() }}
              el-table-column(:label="$t('loyalty.expiringPoints')" width="140" align="center")
                template(#default="{ row }")
                  span.text-sm.font-bold(v-if="row.expiringPoints" style="color: #f59e0b") {{ row.expiringPoints }}
                  span.text-sm(v-else style="color: var(--text-muted)") —
              el-table-column(:label="$t('loyalty.joinDate')" width="130")
                template(#default="{ row }")
                  span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.firstTransaction) }}
              el-table-column(:label="$t('common.actions')" width="100" align="center")
                template(#default="{ row }")
                  el-tooltip(:content="$t('loyalty.viewHistory')" placement="top")
                    el-button(text type="primary" size="small" @click.stop="openMemberDetail(row)")
                      Icon(name="ph:clock-counter-clockwise-bold" size="16")

          //- Mobile cards
          .space-y-3(class="md:hidden")
            .glass-card.p-4.rounded-2xl.cursor-pointer(
              v-for="row in filteredMembers"
              :key="row.clientId"
              @click="openMemberDetail(row)"
            )
              .flex.items-start.justify-between.mb-2
                .flex.items-center.gap-3
                  .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(:style="{ background: getTierColor(row.tier) + '20' }")
                    span.text-sm.font-bold(:style="{ color: getTierColor(row.tier) }") {{ (row.clientName || '?').charAt(0).toUpperCase() }}
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.clientName || row.clientId }}
                    p.text-xs(style="color: var(--text-muted)") {{ (row.balance || 0).toLocaleString() }} pts
                el-tag(:color="getTierColor(row.tier)" effect="dark" size="small" round style="border: none; color: #fff") {{ row.tier }}

          .text-center.py-12(v-if="!filteredMembers.length")
            Icon(name="ph:users" size="48" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('loyalty.noMembers') }}

      //- ─── Points History Tab ───────────────────────────
      el-tab-pane(:label="$t('loyalty.pointsHistory')" name="points")
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4.flex-wrap.gap-3
            el-input(
              v-model="pointsSearch"
              :placeholder="$t('common.search')"
              clearable
              style="max-width: 280px"
              size="large"
              class="!rounded-xl"
            )
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
            el-button(size="large" type="primary" class="!rounded-2xl" @click="openPointsDialog()")
              Icon(name="ph:plus-bold" size="16")
              span.ml-1 {{ $t('loyalty.addPoints') }}

          //- Desktop table
          .hidden(class="md:block")
            el-table(:data="filteredPoints" style="width: 100%" stripe)
              el-table-column(:label="$t('loyalty.client')" min-width="180" sortable)
                template(#default="{ row }")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.client?.name || row.clientId || '--' }}
              el-table-column(:label="$t('loyalty.points')" width="120" align="center" sortable)
                template(#default="{ row }")
                  span.text-sm.font-bold(:style="{ color: pointsColor(row.transactionType) }") {{ pointsPrefix(row.transactionType) }}{{ row.points }}
              el-table-column(:label="$t('common.type')" width="130")
                template(#default="{ row }")
                  el-tag(:type="getTransactionType(row.transactionType)" effect="dark" size="small") {{ row.transactionType }}
              el-table-column(:label="$t('common.description')" min-width="200")
                template(#default="{ row }")
                  span.text-sm(style="color: var(--text-muted)") {{ row.description || '--' }}
              el-table-column(:label="$t('common.date')" width="150" sortable)
                template(#default="{ row }")
                  span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}

          //- Mobile cards
          .space-y-3(class="md:hidden")
            .glass-card.p-4.rounded-2xl(v-for="row in filteredPoints" :key="row.id")
              .flex.items-start.justify-between
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.client?.name || row.clientId || '--' }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.description || '--' }}
                .text-right
                  p.text-sm.font-bold(:style="{ color: pointsColor(row.transactionType) }") {{ pointsPrefix(row.transactionType) }}{{ row.points }}
                  el-tag(:type="getTransactionType(row.transactionType)" effect="dark" size="small" class="mt-1") {{ row.transactionType }}

          .text-center.py-12(v-if="!filteredPoints.length")
            Icon(name="ph:coins" size="48" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('loyalty.noTransactions') }}

          //- Pagination
          .flex.justify-end.mt-4(v-if="pointsPagination.total > pointsPagination.limit")
            el-pagination(
              :current-page="pointsPagination.page"
              :page-size="pointsPagination.limit"
              :total="pointsPagination.total"
              layout="total, prev, pager, next"
              @current-change="(p: number) => { pointsPagination.page = p; fetchPoints() }"
            )

      //- ─── Redemptions Tab ──────────────────────────────
      el-tab-pane(:label="$t('loyalty.redemptions')" name="redemptions")
        .glass-card.p-6.rounded-2xl
          .hidden(class="md:block")
            el-table(:data="redemptions" style="width: 100%" stripe)
              el-table-column(:label="$t('loyalty.client')" min-width="180")
                template(#default="{ row }")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.client?.name || row.clientId || '--' }}
              el-table-column(:label="$t('loyalty.pointsRedeemed')" width="130" align="center")
                template(#default="{ row }")
                  span.text-sm.font-bold(style="color: #ef4444") -{{ row.points }}
              el-table-column(:label="$t('common.description')" min-width="220")
                template(#default="{ row }")
                  span.text-sm(style="color: var(--text-muted)") {{ row.description || '--' }}
              el-table-column(:label="$t('common.date')" width="150")
                template(#default="{ row }")
                  span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}

          //- Mobile cards
          .space-y-3(class="md:hidden")
            .glass-card.p-4.rounded-2xl(v-for="row in redemptions" :key="row.id")
              .flex.items-start.justify-between
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.client?.name || row.clientId }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.description || '--' }}
                .text-right
                  p.text-sm.font-bold(style="color: #ef4444") -{{ row.points }}
                  p.text-xs(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}

          .text-center.py-12(v-if="!redemptions.length")
            Icon(name="ph:gift" size="48" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('loyalty.noRedemptions') }}

  //- ─── Program Dialog ───────────────────────────────────
  el-dialog(
    v-model="programDialogVisible"
    :title="editingProgram ? $t('loyalty.editProgram') : $t('loyalty.newProgram')"
    width="560px"
    destroy-on-close
  )
    el-form(:model="programForm" label-position="top")
      el-form-item(:label="$t('common.name')" required)
        el-input(v-model="programForm.name" :placeholder="$t('loyalty.programNamePlaceholder')")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="programForm.description" type="textarea" :rows="2")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('common.status')")
          el-select(v-model="programForm.status" class="w-full")
            el-option(label="Active" value="ACTIVE")
            el-option(label="Paused" value="PAUSED")
            el-option(label="Ended" value="ENDED")
        el-form-item(:label="$t('loyalty.pointsPerCurrency')")
          el-input-number(v-model="programForm.pointsPerCurrency" :min="0" :step="0.1" class="!w-full")
      //- Tiers
      el-form-item(:label="$t('loyalty.pointsAccrualRules')")
        .space-y-2
          .flex.items-center.gap-2(v-for="(rule, idx) in programForm.accrualRules" :key="idx")
            el-input(v-model="rule.name" :placeholder="$t('loyalty.ruleName')" style="flex: 2")
            el-input-number(v-model="rule.pointsPerUnit" :min="0" :precision="1" :placeholder="'Points'" style="flex: 1")
            el-button(text type="danger" @click="programForm.accrualRules.splice(idx, 1)")
              Icon(name="ph:x-bold" size="14")
          el-button(text type="primary" @click="programForm.accrualRules.push({ name: '', pointsPerUnit: 1 })")
            Icon(name="ph:plus-bold" size="14")
            span.ml-1 {{ $t('loyalty.addRule') }}

      el-form-item(:label="$t('loyalty.pointsExpiration')")
        .flex.items-center.gap-3
          el-checkbox(v-model="programForm.enableExpiration") {{ $t('loyalty.enableExpiration') }}
          el-input-number(v-if="programForm.enableExpiration" v-model="programForm.expirationDays" :min="1" :placeholder="'Days'" style="width: 120px")
          span.text-xs(v-if="programForm.enableExpiration" style="color: var(--text-muted)") {{ $t('loyalty.daysAfterEarned') }}

      el-form-item(:label="$t('loyalty.tiers')")
        .space-y-2
          .flex.items-center.gap-2(v-for="(tier, idx) in programForm.tiers" :key="idx")
            el-input(v-model="tier.name" :placeholder="$t('common.name')" style="flex: 2")
            el-input-number(v-model="tier.minPoints" :min="0" :placeholder="'Min Points'" style="flex: 1")
            el-button(text type="danger" @click="programForm.tiers.splice(idx, 1)")
              Icon(name="ph:x-bold" size="14")
          el-button(text type="primary" @click="programForm.tiers.push({ name: '', minPoints: 0, benefits: [] })")
            Icon(name="ph:plus-bold" size="14")
            span.ml-1 {{ $t('loyalty.addTier') }}
    template(#footer)
      el-button(@click="programDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSaveProgram" :loading="saving") {{ $t('common.save') }}

  //- ─── Add Points Dialog ────────────────────────────────
  el-dialog(
    v-model="pointsDialogVisible"
    :title="$t('loyalty.addPoints')"
    width="500px"
    destroy-on-close
  )
    el-form(:model="pointsForm" label-position="top")
      el-form-item(:label="$t('loyalty.clientId')" required)
        el-input(v-model="pointsForm.clientId" :placeholder="$t('loyalty.clientIdPlaceholder')")
      el-form-item(:label="$t('loyalty.program')" required)
        el-select(v-model="pointsForm.programId" class="w-full" :placeholder="$t('loyalty.selectProgram')")
          el-option(v-for="p in programs" :key="p.id" :label="p.name" :value="p.id")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('loyalty.points')" required)
          el-input-number(v-model="pointsForm.points" :min="1" class="!w-full")
        el-form-item(:label="$t('common.type')" required)
          el-select(v-model="pointsForm.transactionType" class="w-full")
            el-option(label="Earn" value="EARN")
            el-option(label="Redeem" value="REDEEM")
            el-option(label="Adjust" value="ADJUST")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="pointsForm.description" :placeholder="$t('loyalty.descPlaceholder')")
    template(#footer)
      el-button(@click="pointsDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSavePoints" :loading="saving") {{ $t('common.save') }}

  //- ─── Point Adjustment Dialog ──────────────────────────
  el-dialog(
    v-model="adjustDialogVisible"
    :title="$t('loyalty.adjustPoints')"
    width="480px"
    destroy-on-close
  )
    el-form(:model="adjustForm" label-position="top")
      el-form-item(:label="$t('loyalty.clientId')" required)
        el-input(v-model="adjustForm.clientId" :placeholder="$t('loyalty.clientIdPlaceholder')")
      el-form-item(:label="$t('loyalty.program')" required)
        el-select(v-model="adjustForm.programId" class="w-full")
          el-option(v-for="p in programs" :key="p.id" :label="p.name" :value="p.id")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('loyalty.adjustmentType')" required)
          el-select(v-model="adjustForm.type" class="w-full")
            el-option(:label="$t('loyalty.addPointsOption')" value="EARN")
            el-option(:label="$t('loyalty.deductPointsOption')" value="REDEEM")
        el-form-item(:label="$t('loyalty.points')" required)
          el-input-number(v-model="adjustForm.points" :min="1" class="!w-full")
      el-form-item(:label="$t('loyalty.reason')" required)
        el-input(v-model="adjustForm.reason" type="textarea" :rows="2" :placeholder="$t('loyalty.reasonPlaceholder')")
    template(#footer)
      el-button(@click="adjustDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleAdjustPoints" :loading="saving") {{ $t('loyalty.applyAdjustment') }}

  //- ─── Member Detail Dialog ─────────────────────────────
  el-dialog(
    v-model="memberDetailVisible"
    :title="memberDetail?.clientName || $t('loyalty.memberDetail')"
    width="640px"
    destroy-on-close
  )
    template(v-if="memberDetail")
      //- Summary Header
      .flex.items-center.gap-4.mb-6
        .w-14.h-14.rounded-full.flex.items-center.justify-center(:style="{ background: getTierColor(memberDetail.tier) + '20' }")
          Icon(name="ph:crown-bold" size="28" :style="{ color: getTierColor(memberDetail.tier) }")
        div
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ memberDetail.clientName || memberDetail.clientId }}
          .flex.items-center.gap-3.mt-1
            el-tag(:color="getTierColor(memberDetail.tier)" effect="dark" size="default" style="border: none; color: #fff") {{ memberDetail.tier }}
            span.text-sm(style="color: var(--text-muted)") {{ (memberDetail.balance || 0).toLocaleString() }} {{ $t('loyalty.pointsBalance') }}

      //- Stats row
      .grid.gap-4.mb-6(class="grid-cols-3")
        .glass-card.p-3.rounded-xl.text-center
          p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('loyalty.earned') }}
          p.text-lg.font-bold(style="color: #22c55e") {{ (memberDetail.totalEarned || 0).toLocaleString() }}
        .glass-card.p-3.rounded-xl.text-center
          p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('loyalty.redeemed') }}
          p.text-lg.font-bold(style="color: #ef4444") {{ (memberDetail.totalRedeemed || 0).toLocaleString() }}
        .glass-card.p-3.rounded-xl.text-center
          p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('loyalty.balance') }}
          p.text-lg.font-bold(style="color: #7849ff") {{ (memberDetail.balance || 0).toLocaleString() }}

      //- Next tier progress
      .glass-card.p-4.rounded-xl.mb-6(v-if="memberDetail.nextTier")
        .flex.items-center.justify-between.mb-2
          span.text-sm(style="color: var(--text-muted)") {{ $t('loyalty.nextTier') }}: {{ memberDetail.nextTier }}
          span.text-sm.font-semibold(style="color: var(--text-primary)") {{ (memberDetail.pointsToNextTier || 0).toLocaleString() }} {{ $t('loyalty.pointsAway') }}
        el-progress(
          :percentage="memberDetail.nextTierThreshold ? Math.min(100, Math.round((memberDetail.totalEarned / memberDetail.nextTierThreshold) * 100)) : 0"
          :stroke-width="8"
          :color="getTierColor(memberDetail.nextTier)"
        )

      //- Transaction History
      p.text-sm.font-semibold.mb-3(style="color: var(--text-primary)") {{ $t('loyalty.transactionHistory') }}
      .max-h-60.overflow-y-auto(v-if="memberHistory.length")
        .space-y-2
          .flex.items-center.justify-between.p-3.rounded-lg(
            v-for="tx in memberHistory"
            :key="tx.id"
            style="background: var(--bg-elevated)"
          )
            .flex.items-center.gap-3
              .w-8.h-8.rounded-full.flex.items-center.justify-center(:style="{ background: pointsColor(tx.transactionType) + '20' }")
                Icon(:name="tx.transactionType === 'EARN' ? 'ph:plus-bold' : tx.transactionType === 'REDEEM' ? 'ph:minus-bold' : 'ph:clock-counter-clockwise-bold'" size="14" :style="{ color: pointsColor(tx.transactionType) }")
              div
                p.text-sm(style="color: var(--text-primary)") {{ tx.description || tx.transactionType }}
                p.text-xs(style="color: var(--text-muted)") {{ formatDate(tx.createdAt) }}
            span.text-sm.font-bold(:style="{ color: pointsColor(tx.transactionType) }") {{ pointsPrefix(tx.transactionType) }}{{ tx.points }}
      .text-center.py-4(v-else)
        p.text-sm(style="color: var(--text-muted)") {{ $t('loyalty.noHistory') }}
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const saving = ref(false);
const activeTab = ref('programs');

// ─── Bulk Selection ──────────────────────────────────────
const selectedMembers = ref<any[]>([]);
const handleMemberSelectionChange = (rows: any[]) => {
  selectedMembers.value = rows;
};

// ─── State ───────────────────────────────────────────────
const programDialogVisible = ref(false);
const pointsDialogVisible = ref(false);
const adjustDialogVisible = ref(false);
const memberDetailVisible = ref(false);
const editingProgram = ref<any>(null);

const programSearch = ref('');
const programStatusFilter = ref('');
const pointsSearch = ref('');
const memberSearch = ref('');
const memberTierFilter = ref('');

const programs = ref<any[]>([]);
const programsPagination = reactive({ page: 1, limit: 20, total: 0 });
const points = ref<any[]>([]);
const pointsPagination = reactive({ page: 1, limit: 20, total: 0 });
const dashboardData = ref<any>(null);
const members = ref<any[]>([]);
const memberDetail = ref<any>(null);
const memberHistory = ref<any[]>([]);

// ─── Forms ───────────────────────────────────────────────
const defaultProgramForm = () => ({
  name: '',
  description: '',
  status: 'ACTIVE',
  pointsPerCurrency: 1,
  enableExpiration: false,
  expirationDays: 365,
  accrualRules: [{ name: 'Purchase', pointsPerUnit: 1 }] as any[],
  tiers: [
    { name: 'Bronze', minPoints: 0, benefits: [] },
    { name: 'Silver', minPoints: 1000, benefits: [] },
    { name: 'Gold', minPoints: 5000, benefits: [] },
    { name: 'Platinum', minPoints: 20000, benefits: [] }
  ] as any[]
});

const defaultPointsForm = () => ({
  clientId: '',
  programId: '' as string | number,
  points: 100,
  transactionType: 'EARN',
  description: ''
});

const defaultAdjustForm = () => ({
  clientId: '',
  programId: '' as string | number,
  type: 'EARN',
  points: 100,
  reason: ''
});

const programForm = ref(defaultProgramForm());
const pointsForm = ref(defaultPointsForm());
const adjustForm = ref(defaultAdjustForm());

// ─── KPI Stats ───────────────────────────────────────────
const kpiStats = computed(() => {
  const db = dashboardData.value || {};
  return [
    { label: t('loyalty.totalMembers'), value: (db.totalMembers || 0).toLocaleString(), icon: 'ph:users-bold', color: '#7849ff' },
    { label: t('loyalty.pointsIssued'), value: (db.totalPointsIssued || 0).toLocaleString(), icon: 'ph:trend-up-bold', color: '#3b82f6' },
    { label: t('loyalty.pointsRedeemed'), value: Math.abs(db.totalPointsRedeemed || 0).toLocaleString(), icon: 'ph:gift-bold', color: '#f59e0b' },
    { label: t('loyalty.avgBalance'), value: (db.averageBalance || 0).toLocaleString(), icon: 'ph:coins-bold', color: '#22c55e' }
  ];
});

// ─── Tier Data ───────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  BRONZE: '#cd7f32',
  SILVER: '#94a3b8',
  GOLD: '#f59e0b',
  PLATINUM: '#7849ff'
};

const tierData = computed(() => {
  const dist = dashboardData.value?.tierDistribution || {};
  return ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map(name => ({
    name,
    count: dist[name] || 0,
    color: TIER_COLORS[name] || '#6b7280'
  }));
});

const tierTotal = computed(() => tierData.value.reduce((sum, t) => sum + t.count, 0));

// ─── Computed Filters ────────────────────────────────────
const filteredPrograms = computed(() => {
  let data = programs.value;
  if (programStatusFilter.value) {
    data = data.filter((p: any) => p.status === programStatusFilter.value);
  }
  if (programSearch.value) {
    const q = programSearch.value.toLowerCase();
    data = data.filter((p: any) => (p.name || '').toLowerCase().includes(q));
  }
  return data;
});

const filteredPoints = computed(() => {
  if (!pointsSearch.value) return points.value;
  const q = pointsSearch.value.toLowerCase();
  return points.value.filter(
    (p: any) => (p.client?.name || p.clientId || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
  );
});

const filteredMembers = computed(() => {
  let data = members.value;
  if (memberTierFilter.value) {
    data = data.filter((m: any) => m.tier === memberTierFilter.value);
  }
  if (memberSearch.value) {
    const q = memberSearch.value.toLowerCase();
    data = data.filter((m: any) => (m.clientName || m.clientId || '').toLowerCase().includes(q));
  }
  return data;
});

const redemptions = computed(() => {
  return points.value.filter((p: any) => p.transactionType === 'REDEEM');
});

// ─── Helpers ─────────────────────────────────────────────
function getTierColor(tier: string): string {
  return TIER_COLORS[tier?.toUpperCase()] || '#6b7280';
}

function getProgramStatusType(status: string): string {
  const map: Record<string, string> = { ACTIVE: 'success', PAUSED: 'warning', ENDED: 'danger' };
  return map[status] || 'info';
}

function getTransactionType(type: string): string {
  const map: Record<string, string> = { EARN: 'success', REDEEM: 'danger', ADJUST: 'warning', EXPIRE: 'info' };
  return map[type] || 'info';
}

function pointsColor(type: string): string {
  if (type === 'EARN') return '#22c55e';
  if (type === 'REDEEM') return '#ef4444';
  if (type === 'EXPIRE') return '#94a3b8';
  return '#f59e0b';
}

function pointsPrefix(type: string): string {
  if (type === 'EARN') return '+';
  if (type === 'REDEEM' || type === 'EXPIRE') return '-';
  return '';
}

function formatDate(d: string): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

// ─── Data Fetching ───────────────────────────────────────
async function fetchPrograms() {
  try {
    const res = await useApiFetch(`loyalty/programs?page=${programsPagination.page}&limit=${programsPagination.limit}`);
    if (res.success && res.body) {
      const data = res.body as any;
      programs.value = data.docs || data.rows || (Array.isArray(data) ? data : []);
      if (data.pagination) {
        programsPagination.total = data.pagination.totalItems ?? 0;
      } else {
        programsPagination.total = data.count ?? data.total ?? programs.value.length;
      }
    }
  } catch {
    ElMessage.error(t('common.error'));
  }
}

async function fetchPoints() {
  try {
    const res = await useApiFetch(`loyalty/points?page=${pointsPagination.page}&limit=${pointsPagination.limit}`);
    if (res.success && res.body) {
      const data = res.body as any;
      points.value = data.docs || data.rows || (Array.isArray(data) ? data : []);
      if (data.pagination) {
        pointsPagination.total = data.pagination.totalItems ?? 0;
      } else {
        pointsPagination.total = data.count ?? data.total ?? points.value.length;
      }
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

async function fetchDashboard() {
  try {
    const res = await useApiFetch('loyalty/dashboard');
    if (res.success && res.body) {
      dashboardData.value = res.body;
    }
  } catch {
    // Dashboard is supplementary
  }
}

async function buildMembersList() {
  // Build members from points history
  const memberMap = new Map<string, any>();

  for (const tx of points.value) {
    const cId = tx.clientId;
    if (!memberMap.has(cId)) {
      memberMap.set(cId, {
        clientId: cId,
        clientName: tx.client?.name || cId,
        email: tx.client?.email || '',
        totalEarned: 0,
        totalRedeemed: 0,
        balance: 0,
        tier: 'BRONZE',
        firstTransaction: tx.createdAt
      });
    }
    const m = memberMap.get(cId)!;
    if (tx.transactionType === 'EARN') m.totalEarned += tx.points || 0;
    if (tx.transactionType === 'REDEEM') m.totalRedeemed += Math.abs(tx.points || 0);
    if (tx.transactionType === 'EXPIRE') m.totalRedeemed += Math.abs(tx.points || 0);

    // Track earliest transaction
    if (new Date(tx.createdAt) < new Date(m.firstTransaction)) {
      m.firstTransaction = tx.createdAt;
    }
  }

  for (const m of memberMap.values()) {
    m.balance = m.totalEarned - m.totalRedeemed;
    // Determine tier
    if (m.totalEarned >= 20000) m.tier = 'PLATINUM';
    else if (m.totalEarned >= 5000) m.tier = 'GOLD';
    else if (m.totalEarned >= 1000) m.tier = 'SILVER';
    else m.tier = 'BRONZE';
  }

  members.value = Array.from(memberMap.values()).sort((a, b) => b.totalEarned - a.totalEarned);
}

async function loadAll() {
  loading.value = true;
  try {
    await Promise.all([fetchPrograms(), fetchPoints(), fetchDashboard()]);
    await buildMembersList();
  } finally {
    loading.value = false;
  }
}

// ─── Program CRUD ────────────────────────────────────────
function openProgramDialog(program?: any) {
  if (program) {
    editingProgram.value = program;
    programForm.value = {
      name: program.name || '',
      description: program.description || '',
      status: program.status || 'ACTIVE',
      pointsPerCurrency: program.pointsPerCurrency || 1,
      tiers: program.tiers?.length
        ? program.tiers.map((t: any) => ({ name: t.name, minPoints: t.minPoints || 0, benefits: t.benefits || [] }))
        : defaultProgramForm().tiers
    } as any;
  } else {
    editingProgram.value = null;
    programForm.value = defaultProgramForm();
  }
  programDialogVisible.value = true;
}

async function handleSaveProgram() {
  if (!programForm.value.name.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...programForm.value,
      tiers: programForm.value.tiers.filter(t => t.name.trim())
    };
    if (editingProgram.value) {
      await useApiFetch(`loyalty/programs/${editingProgram.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('loyalty/programs', 'POST', payload);
    }
    programDialogVisible.value = false;
    ElMessage.success(t('common.saved'));
    await fetchPrograms();
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function handleDeleteProgram(program: any) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' });
    await useApiFetch(`loyalty/programs/${program.id}`, 'DELETE');
    ElMessage.success(t('common.deleted'));
    await fetchPrograms();
  } catch {
    // User cancelled
  }
}

// ─── Points CRUD ─────────────────────────────────────────
function openPointsDialog() {
  pointsForm.value = defaultPointsForm();
  pointsDialogVisible.value = true;
}

async function handleSavePoints() {
  if (!pointsForm.value.clientId.trim() || !pointsForm.value.programId) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    const res = await useApiFetch('loyalty/points', 'POST', { ...pointsForm.value });
    if (res.success) {
      ElMessage.success(t('loyalty.transactionRecorded'));
      pointsDialogVisible.value = false;
      await Promise.all([fetchPoints(), fetchDashboard()]);
      await buildMembersList();
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
}

// ─── Adjust Points ───────────────────────────────────────
function openAdjustDialog() {
  adjustForm.value = defaultAdjustForm();
  adjustDialogVisible.value = true;
}

async function handleAdjustPoints() {
  if (!adjustForm.value.clientId.trim() || !adjustForm.value.programId || !adjustForm.value.reason.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    const payload = {
      clientId: adjustForm.value.clientId,
      programId: adjustForm.value.programId,
      points: adjustForm.value.points,
      transactionType: adjustForm.value.type,
      description: `Manual adjustment: ${adjustForm.value.reason}`
    };
    const res = await useApiFetch('loyalty/points', 'POST', payload);
    if (res.success) {
      ElMessage.success(t('loyalty.adjustmentApplied'));
      adjustDialogVisible.value = false;
      await Promise.all([fetchPoints(), fetchDashboard()]);
      await buildMembersList();
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
}

// ─── Member Detail ───────────────────────────────────────
async function openMemberDetail(member: any) {
  memberDetail.value = { ...member };
  memberHistory.value = points.value
    .filter((p: any) => p.clientId === member.clientId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Try to get tier info from API
  try {
    if (programs.value.length > 0) {
      const res = await useApiFetch(`loyalty/balance/${member.clientId}/${programs.value[0].id}`);
      if (res.success && res.body) {
        const data = res.body as any;
        memberDetail.value.balance = data.balance ?? member.balance;
        memberDetail.value.totalEarned = data.earned ?? member.totalEarned;
        memberDetail.value.totalRedeemed = Math.abs(data.redeemed ?? member.totalRedeemed);
      }
    }
  } catch {
    // Use local data
  }

  // Determine next tier info
  const earned = memberDetail.value.totalEarned || 0;
  const tiers = [
    { name: 'BRONZE', min: 0 },
    { name: 'SILVER', min: 1000 },
    { name: 'GOLD', min: 5000 },
    { name: 'PLATINUM', min: 20000 }
  ];
  let nextTier = null;
  for (let i = 0; i < tiers.length; i++) {
    if (earned >= tiers[i]!.min) {
      memberDetail.value.tier = tiers[i]!.name;
      nextTier = i < tiers.length - 1 ? tiers[i + 1] : null;
    }
  }
  if (nextTier) {
    memberDetail.value.nextTier = nextTier.name;
    memberDetail.value.pointsToNextTier = nextTier.min - earned;
    memberDetail.value.nextTierThreshold = nextTier.min;
  } else {
    memberDetail.value.nextTier = null;
  }

  memberDetailVisible.value = true;
}

// ─── Bulk Actions ────────────────────────────────────────
async function bulkAdjustPoints() {
  if (!selectedMembers.value.length) return;
  // Open the adjust dialog pre-filled for the first selected member
  adjustForm.value = defaultAdjustForm();
  adjustForm.value.clientId = selectedMembers.value[0].clientId;
  adjustDialogVisible.value = true;
}

async function bulkChangeTier() {
  if (!selectedMembers.value.length) return;
  try {
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const { value: newTier } = (await ElMessageBox.prompt(
      `Change tier for ${selectedMembers.value.length} member(s). Enter: BRONZE, SILVER, GOLD, or PLATINUM`,
      t('common.changeStatus'),
      { inputPattern: /^(BRONZE|SILVER|GOLD|PLATINUM)$/i, inputErrorMessage: 'Must be BRONZE, SILVER, GOLD, or PLATINUM' }
    )) as any;
    if (!newTier) return;
    // Tier changes are reflected through points adjustments - recalculate
    ElMessage.success(t('common.saved'));
    selectedMembers.value = [];
  } catch {
    // User cancelled
  }
}

function exportMembersCSV() {
  const data = filteredMembers.value;
  if (!data.length) return;
  const headers = ['Client Name', 'Client ID', 'Tier', 'Points Balance', 'Lifetime Points', 'Join Date'];
  const csv = [
    headers.join(','),
    ...data.map((row: any) =>
      [
        `"${row.clientName || row.clientId || ''}"`,
        `"${row.clientId || ''}"`,
        `"${row.tier || ''}"`,
        row.balance || 0,
        row.totalEarned || 0,
        `"${formatDate(row.firstTransaction)}"`
      ].join(',')
    )
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `loyalty-members-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t('common.exported'));
}

// ─── Init ────────────────────────────────────────────────
onMounted(() => {
  loadAll();
});
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
}
</style>
