<template lang="pug">
.cart-recovery-page.p-6(class="md:p-8")
  //- ╔══════════════════════════════════════════════════════════╗
  //- ║  Page Header                                             ║
  //- ╚══════════════════════════════════════════════════════════╝
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary)")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #ef4444, #fb7185)")
          Icon(name="ph:shopping-cart-simple-bold" size="22" style="color: white")
        | {{ $t('cartRecovery.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('cartRecovery.subtitle') }}

    .flex.items-center.gap-3
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        range-separator="to"
        :start-placeholder="$t('cartRecovery.startDate')"
        :end-placeholder="$t('cartRecovery.endDate')"
        @change="onDateRangeChange"
        style="width: 280px"
      )
      el-button(
        type="primary"
        size="large"
        @click="refreshData"
        :loading="loading"
        class="!rounded-xl"
      )
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-2 {{ $t('cartRecovery.refresh') }}

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="40" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  KPI Cards                                              ║
    //- ╚══════════════════════════════════════════════════════════╝
    .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
      .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
        .flex.items-start.justify-between
          div
            p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
            p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
            .flex.items-center.gap-1.mt-2
              Icon(:name="kpi.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }")
              span.text-xs.font-semibold(:style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ kpi.trend >= 0 ? '+' : '' }}{{ kpi.trend }}%
          .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  Tabs                                                   ║
    //- ╚══════════════════════════════════════════════════════════╝
    el-tabs(v-model="activeTab" class="recovery-tabs")

      //- ────────────────────────────────────────────────────────
      //- Tab 1: Abandoned Carts
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('cartRecovery.abandonedCarts')" name="carts")
        //- Filters & Search
        .glass-card.p-4.mb-5
          .flex.flex-wrap.items-center.gap-3
            el-input(
              v-model="cartSearch"
              :placeholder="$t('cartRecovery.searchCustomer')"
              clearable
              size="large"
              style="max-width: 300px"
              class="!rounded-xl"
            )
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")
            el-select(v-model="cartStatusFilter" :placeholder="$t('cartRecovery.filterStatus')" clearable size="large" style="width: 180px")
              el-option(:label="$t('cartRecovery.allStatuses')" value="")
              el-option(:label="$t('cartRecovery.statusPending')" value="Pending")
              el-option(:label="$t('cartRecovery.statusEmailSent')" value="Email Sent")
              el-option(:label="$t('cartRecovery.statusRecovered')" value="Recovered")
              el-option(:label="$t('cartRecovery.statusLost')" value="Lost")
            .ml-auto.flex.items-center.gap-2
              span.text-sm(style="color: var(--text-muted)") {{ filteredAbandonedCarts.length }} {{ $t('cartRecovery.cartsFound') }}

        //- Bulk Actions Bar
        .flex.items-center.gap-3.mb-4(v-if="selectedCarts.length")
          .glass-card.px-4.py-3.flex.items-center.gap-3.w-full
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ selectedCarts.length }} {{ $t('cartRecovery.selected') }}
            el-button(type="primary" size="small" @click="bulkRecover" class="!rounded-lg")
              Icon(name="ph:envelope-bold" size="14")
              span.ml-1 {{ $t('cartRecovery.sendRecoveryEmail') }}
            el-button(size="small" type="danger" plain @click="bulkMarkLost" class="!rounded-lg")
              Icon(name="ph:x-circle-bold" size="14")
              span.ml-1 {{ $t('cartRecovery.markAsLost') }}

        //- Abandoned Carts Table
        .glass-card.overflow-hidden
          el-table(
            :data="filteredAbandonedCarts"
            stripe
            style="width: 100%"
            row-key="id"
            @selection-change="onCartSelectionChange"
            @expand-change="expandRow"
          )
            el-table-column(type="selection" width="45")
            el-table-column(type="expand")
              template(#default="{ row }")
                .p-4
                  h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)")
                    Icon(name="ph:list-bold" size="16" class="mr-1")
                    | {{ $t('cartRecovery.cartItems') }}
                  .grid.gap-2(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
                    .flex.items-center.gap-3.p-3.rounded-xl(
                      v-for="(item, iIdx) in row.items"
                      :key="iIdx"
                      style="background: var(--bg-base); border: 1px solid var(--border-default)"
                    )
                      .w-10.h-10.rounded-lg.flex.items-center.justify-center.flex-shrink-0(style="background: rgba(120, 73, 255, 0.1)")
                        Icon(name="ph:package-bold" size="18" style="color: #7849ff")
                      .flex-1.min-w-0
                        p.text-sm.font-medium.truncate(style="color: var(--text-primary)") {{ item.name }}
                        .flex.items-center.gap-2.mt-1
                          span.text-xs(style="color: var(--text-muted)") {{ $t('cartRecovery.qty') }}: {{ item.quantity }}
                          span.text-xs.font-bold(style="color: #7849ff") ${{ item.price.toFixed(2) }}

            el-table-column(:label="$t('cartRecovery.customer')" min-width="200")
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .customer-avatar
                    | {{ getInitials(row.customerName) }}
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.customerName }}
                    p.text-xs(style="color: var(--text-muted)") {{ row.customerEmail }}

            el-table-column(:label="$t('cartRecovery.items')" min-width="180")
              template(#default="{ row }")
                div
                  span.text-sm(style="color: var(--text-primary)")
                    | {{ row.items.slice(0, 2).map((i: any) => truncateText(i.name, 20)).join(', ') }}
                  el-tag.ml-1(
                    v-if="row.items.length > 2"
                    size="small"
                    effect="plain"
                    round
                  ) +{{ row.items.length - 2 }} {{ $t('cartRecovery.more') }}

            el-table-column(:label="$t('cartRecovery.cartValue')" width="130" align="right")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: var(--text-primary)") ${{ row.cartValue.toFixed(2) }}

            el-table-column(:label="$t('cartRecovery.abandonedAt')" width="150")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-muted)") {{ getRelativeTime(row.abandonedAt) }}

            el-table-column(:label="$t('cartRecovery.status')" width="130" align="center")
              template(#default="{ row }")
                el-tag(
                  :type="getCartStatusType(row.status)"
                  size="small"
                  effect="dark"
                  round
                ) {{ row.status }}

            el-table-column(:label="$t('cartRecovery.actions')" width="200" align="center" fixed="right")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-2
                  el-button(
                    v-if="row.status === 'Pending' || row.status === 'Email Sent'"
                    type="primary"
                    size="small"
                    plain
                    @click="sendRecoveryEmail(row)"
                    class="!rounded-lg"
                  )
                    Icon(name="ph:envelope-bold" size="14")
                    span.ml-1 {{ $t('cartRecovery.recover') }}
                  el-button(size="small" @click="viewCartDetail(row)" class="!rounded-lg")
                    Icon(name="ph:eye-bold" size="14")
                    span.ml-1 {{ $t('cartRecovery.view') }}

          //- Empty state
          .text-center.py-12(v-if="!filteredAbandonedCarts.length")
            Icon(name="ph:shopping-cart-simple" size="48" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('cartRecovery.noCarts') }}

      //- ────────────────────────────────────────────────────────
      //- Tab 2: Recovery Campaigns
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('cartRecovery.recoveryCampaigns')" name="campaigns")
        .flex.items-center.justify-between.mb-6
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:megaphone-bold" size="20" class="mr-2" style="color: #7849ff")
            | {{ $t('cartRecovery.activeCampaigns') }}
          el-button(type="primary" @click="showCreateCampaign = true" class="!rounded-xl")
            Icon(name="ph:plus-bold" size="16")
            span.ml-2 {{ $t('cartRecovery.newCampaign') }}

        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          .glass-card.p-6(v-for="(campaign, cIdx) in campaigns" :key="cIdx")
            //- Campaign Header
            .flex.items-center.justify-between.mb-5
              div
                h4.text-base.font-bold(style="color: var(--text-primary)") {{ campaign.name }}
                p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('cartRecovery.createdOn') }} {{ formatDate(campaign.createdAt) }}
              .flex.items-center.gap-3
                el-switch(
                  v-model="campaign.active"
                  :active-text="$t('cartRecovery.active')"
                  :inactive-text="$t('cartRecovery.paused')"
                  active-color="#22c55e"
                  @change="toggleCampaign(campaign)"
                )

            //- Sequence Timeline
            .campaign-timeline.mb-5
              .timeline-steps
                .timeline-step(v-for="(step, sIdx) in campaign.steps" :key="sIdx")
                  .step-node(:style="{ background: step.color + '20', borderColor: step.color }")
                    Icon(:name="step.icon" size="18" :style="{ color: step.color }")
                  .step-info
                    p.text-xs.font-semibold(style="color: var(--text-primary)") {{ step.label }}
                    p.text-xs(style="color: var(--text-muted)") {{ step.description }}
                  .step-connector(v-if="sIdx < campaign.steps.length - 1")
                    .connector-line
                    .connector-label {{ step.delay }}

            //- Campaign Metrics
            .grid.gap-3(class="grid-cols-4")
              .campaign-metric
                p.text-xl.font-bold(style="color: #7849ff") {{ campaign.metrics.sent.toLocaleString() }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('cartRecovery.sent') }}
              .campaign-metric
                p.text-xl.font-bold(style="color: #3b82f6") {{ campaign.metrics.opened }}%
                p.text-xs(style="color: var(--text-muted)") {{ $t('cartRecovery.opened') }}
              .campaign-metric
                p.text-xl.font-bold(style="color: #f59e0b") {{ campaign.metrics.clicked }}%
                p.text-xs(style="color: var(--text-muted)") {{ $t('cartRecovery.clicked') }}
              .campaign-metric
                p.text-xl.font-bold(style="color: #22c55e") {{ campaign.metrics.recovered }}%
                p.text-xs(style="color: var(--text-muted)") {{ $t('cartRecovery.recovered') }}

            //- Campaign Actions
            .flex.items-center.gap-2.mt-4.pt-4(style="border-top: 1px solid var(--border-default)")
              el-button(size="small" @click="editCampaign(campaign)" class="!rounded-lg")
                Icon(name="ph:pencil-bold" size="14")
                span.ml-1 {{ $t('cartRecovery.editCampaign') }}
              el-button(size="small" @click="viewCampaignDetails(campaign)" class="!rounded-lg")
                Icon(name="ph:chart-bar-bold" size="14")
                span.ml-1 {{ $t('cartRecovery.viewDetails') }}

      //- ────────────────────────────────────────────────────────
      //- Tab 3: Conversion Funnel
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('cartRecovery.conversionFunnel')" name="funnel")
        //- Week Toggle
        .flex.items-center.justify-between.mb-6
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:funnel-bold" size="20" class="mr-2" style="color: #3b82f6")
            | {{ $t('cartRecovery.checkoutFunnel') }}
          .flex.items-center.gap-3
            el-switch(
              v-model="showComparison"
              :active-text="$t('cartRecovery.compareWeeks')"
              active-color="#7849ff"
            )

        //- Funnel Chart
        .grid.gap-6(:class="showComparison ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'")
          .glass-card.p-6
            h4.text-sm.font-semibold.mb-4(style="color: var(--text-muted)") {{ $t('cartRecovery.currentWeek') }}
            ClientOnly
              VChart.w-full(:option="funnelChartOption" :style="{ height: '420px' }" autoresize)

          .glass-card.p-6(v-if="showComparison")
            h4.text-sm.font-semibold.mb-4(style="color: var(--text-muted)") {{ $t('cartRecovery.previousWeek') }}
            ClientOnly
              VChart.w-full(:option="previousFunnelChartOption" :style="{ height: '420px' }" autoresize)

        //- Drop-off Analysis
        .mt-6
          h3.text-lg.font-bold.mb-5(style="color: var(--text-primary)")
            Icon(name="ph:arrow-bend-down-right-bold" size="20" class="mr-2" style="color: #ef4444")
            | {{ $t('cartRecovery.dropOffAnalysis') }}

          .grid.gap-4(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
            .glass-card.p-5(v-for="(stage, dIdx) in dropOffStages" :key="dIdx")
              .flex.items-center.justify-between.mb-3
                .flex.items-center.gap-2
                  Icon(:name="stage.icon" size="18" :style="{ color: stage.color }")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ stage.from }}
                Icon(name="ph:arrow-right" size="14" style="color: var(--text-muted)")
                span.text-sm(style="color: var(--text-muted)") {{ stage.to }}
              .flex.items-center.gap-3.mb-3
                .flex-1
                  el-progress(
                    :percentage="stage.dropOff"
                    :stroke-width="10"
                    :color="stage.dropOff > 50 ? '#ef4444' : stage.dropOff > 30 ? '#f59e0b' : '#22c55e'"
                    :show-text="false"
                  )
                span.text-lg.font-bold(:style="{ color: stage.dropOff > 50 ? '#ef4444' : stage.dropOff > 30 ? '#f59e0b' : '#22c55e' }")
                  | {{ stage.dropOff }}%
              p.text-xs.mb-2(style="color: var(--text-muted)") {{ $t('cartRecovery.topReasons') }}:
              .flex.flex-wrap.gap-1
                el-tag(
                  v-for="(reason, rIdx) in stage.reasons"
                  :key="rIdx"
                  size="small"
                  effect="plain"
                  round
                ) {{ reason }}

      //- ────────────────────────────────────────────────────────
      //- Tab 4: Revenue Impact
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('cartRecovery.revenueImpact')" name="revenue")
        //- Revenue Summary Cards
        .grid.gap-5.mb-6(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
          .glass-card.p-5(v-for="(stat, sIdx) in revenueSummaryCards" :key="sIdx")
            .flex.items-center.gap-3
              .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: stat.color + '18' }")
                Icon(:name="stat.icon" size="20" :style="{ color: stat.color }")
              div
                p.text-xs.font-medium.uppercase.tracking-wider(style="color: var(--text-muted)") {{ stat.label }}
                p.text-xl.font-bold.mt-1(:style="{ color: stat.color }") {{ stat.value }}

        //- Stacked Bar Chart: Recovered vs Lost
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          .glass-card.p-6
            .flex.items-center.justify-between.mb-5
              h3.section-title
                Icon.mr-2(name="ph:chart-bar-bold" size="22" style="color: #7849ff")
                | {{ $t('cartRecovery.recoveredVsLost') }}
              el-select(v-model="revenuePeriod" size="small" style="width: 140px")
                el-option(:label="$t('cartRecovery.last8Weeks')" value="8weeks")
                el-option(:label="$t('cartRecovery.last12Weeks')" value="12weeks")
            ClientOnly
              VChart.w-full(:option="revenueBarChartOption" :style="{ height: '380px' }" autoresize)

          //- Recovery Rate Trend
          .glass-card.p-6
            .flex.items-center.justify-between.mb-5
              h3.section-title
                Icon.mr-2(name="ph:trend-up-bold" size="22" style="color: #22c55e")
                | {{ $t('cartRecovery.recoveryRateTrend') }}
            ClientOnly
              VChart.w-full(:option="recoveryRateChartOption" :style="{ height: '380px' }" autoresize)

        //- Revenue Breakdown Table
        .glass-card.p-6.mt-6
          h3.section-title.mb-5
            Icon.mr-2(name="ph:table-bold" size="22" style="color: #3b82f6")
            | {{ $t('cartRecovery.weeklyBreakdown') }}
          el-table(:data="weeklyRevenueData" stripe style="width: 100%")
            el-table-column(:label="$t('cartRecovery.week')" min-width="120")
              template(#default="{ row }")
                span.text-sm.font-medium(style="color: var(--text-primary)") {{ row.week }}
            el-table-column(:label="$t('cartRecovery.atRisk')" min-width="130" align="right")
              template(#default="{ row }")
                span.text-sm.font-semibold(style="color: #f59e0b") ${{ row.atRisk.toLocaleString() }}
            el-table-column(:label="$t('cartRecovery.recovered')" min-width="130" align="right")
              template(#default="{ row }")
                span.text-sm.font-semibold(style="color: #22c55e") ${{ row.recovered.toLocaleString() }}
            el-table-column(:label="$t('cartRecovery.lost')" min-width="130" align="right")
              template(#default="{ row }")
                span.text-sm.font-semibold(style="color: #ef4444") ${{ row.lost.toLocaleString() }}
            el-table-column(:label="$t('cartRecovery.recoveryRate')" min-width="140" align="center")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-2
                  el-progress(
                    :percentage="row.rate"
                    :stroke-width="8"
                    :color="row.rate >= 30 ? '#22c55e' : row.rate >= 15 ? '#f59e0b' : '#ef4444'"
                    :show-text="false"
                    style="flex: 1; max-width: 80px"
                  )
                  span.text-xs.font-bold(:style="{ color: row.rate >= 30 ? '#22c55e' : row.rate >= 15 ? '#f59e0b' : '#ef4444' }") {{ row.rate }}%

  //- ╔══════════════════════════════════════════════════════════╗
  //- ║  Cart Detail Dialog                                      ║
  //- ╚══════════════════════════════════════════════════════════╝
  el-dialog(
    v-model="cartDetailVisible"
    :title="$t('cartRecovery.cartDetails')"
    width="600px"
    :close-on-click-modal="false"
  )
    template(v-if="selectedCart")
      .space-y-4
        .flex.items-center.gap-3.mb-4
          .customer-avatar.large
            | {{ getInitials(selectedCart.customerName) }}
          div
            p.text-lg.font-bold(style="color: var(--text-primary)") {{ selectedCart.customerName }}
            p.text-sm(style="color: var(--text-muted)") {{ selectedCart.customerEmail }}
        el-divider
        .space-y-3
          .flex.items-center.gap-3.p-3.rounded-xl(
            v-for="(item, iIdx) in selectedCart.items"
            :key="iIdx"
            style="background: var(--bg-base); border: 1px solid var(--border-default)"
          )
            .w-10.h-10.rounded-lg.flex.items-center.justify-center.flex-shrink-0(style="background: rgba(120, 73, 255, 0.1)")
              Icon(name="ph:package-bold" size="18" style="color: #7849ff")
            .flex-1.min-w-0
              p.text-sm.font-medium(style="color: var(--text-primary)") {{ item.name }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('cartRecovery.qty') }}: {{ item.quantity }}
            span.font-bold(style="color: #7849ff") ${{ (item.price * item.quantity).toFixed(2) }}
        el-divider
        .flex.items-center.justify-between
          span.text-base.font-bold(style="color: var(--text-primary)") {{ $t('cartRecovery.total') }}
          span.text-xl.font-black(style="color: #7849ff") ${{ selectedCart.cartValue.toFixed(2) }}
    template(#footer)
      el-button(@click="cartDetailVisible = false") {{ $t('cartRecovery.close') }}
      el-button(
        v-if="selectedCart && (selectedCart.status === 'Pending' || selectedCart.status === 'Email Sent')"
        type="primary"
        @click="sendRecoveryEmail(selectedCart); cartDetailVisible = false"
        class="!rounded-xl"
      )
        Icon(name="ph:envelope-bold" size="16")
        span.ml-1 {{ $t('cartRecovery.sendRecoveryEmail') }}
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { graphic } from 'echarts';
import VChart from 'vue-echarts';
import { ElMessage, ElMessageBox } from 'element-plus';

definePageMeta({ title: 'Cart Recovery' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const loading = ref(false);
const activeTab = ref('carts');
const dateRange = ref<[Date, Date] | null>(null);
const cartSearch = ref('');
const cartStatusFilter = ref('');
const selectedCarts = ref<any[]>([]);
const cartDetailVisible = ref(false);
const selectedCart = ref<any>(null);
const showComparison = ref(false);
const showCreateCampaign = ref(false);
const revenuePeriod = ref('8weeks');

// ─── Mock Data: Abandoned Carts ─────────────────────────────
const abandonedCarts = ref([
  {
    id: 'cart-001',
    customerName: 'Sarah Mitchell',
    customerEmail: 'sarah.mitchell@example.com',
    items: [
      { name: 'Wireless Bluetooth Headphones Pro', quantity: 1, price: 149.99 },
      { name: 'USB-C Fast Charging Cable 3-Pack', quantity: 2, price: 24.99 },
      { name: 'Portable Phone Stand', quantity: 1, price: 19.99 }
    ],
    cartValue: 219.96,
    abandonedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'Pending'
  },
  {
    id: 'cart-002',
    customerName: 'James Rodriguez',
    customerEmail: 'j.rodriguez@techcorp.io',
    items: [
      { name: 'Ergonomic Office Chair Deluxe', quantity: 1, price: 459.00 },
      { name: 'Standing Desk Converter', quantity: 1, price: 289.00 }
    ],
    cartValue: 748.00,
    abandonedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'Email Sent'
  },
  {
    id: 'cart-003',
    customerName: 'Emily Chen',
    customerEmail: 'emily.chen@startup.co',
    items: [
      { name: 'MacBook Pro 16" Sleeve', quantity: 1, price: 79.99 },
      { name: '4K Webcam Ultra HD', quantity: 1, price: 129.99 },
      { name: 'Ring Light with Tripod', quantity: 1, price: 49.99 },
      { name: 'Mechanical Keyboard RGB', quantity: 1, price: 189.99 }
    ],
    cartValue: 449.96,
    abandonedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: 'Pending'
  },
  {
    id: 'cart-004',
    customerName: 'Michael Thompson',
    customerEmail: 'mike.t@globalfirm.com',
    items: [
      { name: 'Noise Cancelling Earbuds ANC', quantity: 2, price: 199.99 },
      { name: 'Wireless Charging Pad', quantity: 1, price: 39.99 }
    ],
    cartValue: 439.97,
    abandonedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    status: 'Recovered'
  },
  {
    id: 'cart-005',
    customerName: 'Lisa Park',
    customerEmail: 'lisa.park@designstudio.net',
    items: [
      { name: 'Drawing Tablet Professional', quantity: 1, price: 349.99 },
      { name: 'Stylus Pen Set Premium', quantity: 1, price: 79.99 },
      { name: 'Screen Protector Anti-Glare', quantity: 2, price: 14.99 }
    ],
    cartValue: 459.96,
    abandonedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'Email Sent'
  },
  {
    id: 'cart-006',
    customerName: 'David Wilson',
    customerEmail: 'david.w@enterprise.org',
    items: [
      { name: 'Smart Home Hub Controller', quantity: 1, price: 199.99 },
      { name: 'Smart Bulb 4-Pack RGB', quantity: 3, price: 49.99 },
      { name: 'Motion Sensor Indoor', quantity: 2, price: 29.99 }
    ],
    cartValue: 409.94,
    abandonedAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    status: 'Lost'
  },
  {
    id: 'cart-007',
    customerName: 'Amanda Foster',
    customerEmail: 'a.foster@freelance.me',
    items: [
      { name: 'Portable SSD 2TB', quantity: 1, price: 179.99 },
      { name: 'USB Hub 7-Port', quantity: 1, price: 44.99 }
    ],
    cartValue: 224.98,
    abandonedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'Pending'
  },
  {
    id: 'cart-008',
    customerName: 'Robert Kim',
    customerEmail: 'robert.kim@megacorp.com',
    items: [
      { name: 'Ultra-Wide Monitor 34"', quantity: 1, price: 699.99 },
      { name: 'Monitor Arm Dual Mount', quantity: 1, price: 89.99 },
      { name: 'HDMI 2.1 Cable 6ft', quantity: 2, price: 19.99 },
      { name: 'Cable Management Kit', quantity: 1, price: 24.99 }
    ],
    cartValue: 854.95,
    abandonedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    status: 'Email Sent'
  },
  {
    id: 'cart-009',
    customerName: 'Jessica Moore',
    customerEmail: 'jess.moore@boutique.shop',
    items: [
      { name: 'Yoga Mat Premium Eco', quantity: 1, price: 69.99 },
      { name: 'Resistance Bands Set', quantity: 1, price: 34.99 },
      { name: 'Water Bottle Insulated 32oz', quantity: 2, price: 29.99 }
    ],
    cartValue: 164.96,
    abandonedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    status: 'Recovered'
  },
  {
    id: 'cart-010',
    customerName: 'Andrew Baker',
    customerEmail: 'a.baker@innovate.tech',
    items: [
      { name: 'Mechanical Keyboard Cherry MX', quantity: 1, price: 169.99 },
      { name: 'Mouse Pad XXL Desk Mat', quantity: 1, price: 29.99 },
      { name: 'Wrist Rest Gel Pad', quantity: 1, price: 19.99 }
    ],
    cartValue: 219.97,
    abandonedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'Pending'
  },
  {
    id: 'cart-011',
    customerName: 'Natalie Evans',
    customerEmail: 'nat.evans@creative.co',
    items: [
      { name: 'Wireless Mouse Ergonomic', quantity: 1, price: 79.99 },
      { name: 'Laptop Cooling Pad', quantity: 1, price: 44.99 }
    ],
    cartValue: 124.98,
    abandonedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    status: 'Lost'
  },
  {
    id: 'cart-012',
    customerName: 'Daniel Harris',
    customerEmail: 'd.harris@consulting.biz',
    items: [
      { name: 'Projector Mini HD 1080p', quantity: 1, price: 299.99 },
      { name: 'Projector Screen 100"', quantity: 1, price: 89.99 },
      { name: 'HDMI Wireless Adapter', quantity: 1, price: 59.99 }
    ],
    cartValue: 449.97,
    abandonedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: 'Pending'
  },
  {
    id: 'cart-013',
    customerName: 'Olivia Martinez',
    customerEmail: 'olivia.m@retail.plus',
    items: [
      { name: 'Smart Watch Series 5', quantity: 1, price: 349.99 },
      { name: 'Watch Band Leather', quantity: 2, price: 39.99 },
      { name: 'Watch Charging Dock', quantity: 1, price: 29.99 }
    ],
    cartValue: 459.96,
    abandonedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    status: 'Email Sent'
  },
  {
    id: 'cart-014',
    customerName: 'Chris Taylor',
    customerEmail: 'chris.t@agency.com',
    items: [
      { name: 'Drone Mini 4K Camera', quantity: 1, price: 599.99 },
      { name: 'Drone Extra Battery Pack', quantity: 2, price: 69.99 },
      { name: 'Drone Carrying Case', quantity: 1, price: 49.99 }
    ],
    cartValue: 789.96,
    abandonedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: 'Pending'
  }
]);

// ─── Mock Data: Recovery Campaigns ──────────────────────────
const campaigns = ref([
  {
    id: 'camp-001',
    name: 'Quick Recovery - 1 Hour Reminder',
    active: true,
    createdAt: '2026-01-15T10:00:00Z',
    steps: [
      {
        label: t('cartRecovery.stepEmail'),
        description: t('cartRecovery.friendlyReminder'),
        icon: 'ph:envelope-bold',
        color: '#3b82f6',
        delay: '1h'
      },
      {
        label: t('cartRecovery.stepReminder'),
        description: t('cartRecovery.urgencyMessage'),
        icon: 'ph:bell-bold',
        color: '#f59e0b',
        delay: '24h'
      },
      {
        label: t('cartRecovery.stepDiscount'),
        description: t('cartRecovery.specialOffer10'),
        icon: 'ph:tag-bold',
        color: '#22c55e',
        delay: ''
      }
    ],
    metrics: { sent: 3420, opened: 62, clicked: 28, recovered: 18 }
  },
  {
    id: 'camp-002',
    name: 'VIP Customer Recovery',
    active: true,
    createdAt: '2026-01-22T14:30:00Z',
    steps: [
      {
        label: t('cartRecovery.stepPersonalEmail'),
        description: t('cartRecovery.personalizedMessage'),
        icon: 'ph:user-circle-bold',
        color: '#7849ff',
        delay: '30m'
      },
      {
        label: t('cartRecovery.stepSmsReminder'),
        description: t('cartRecovery.smsNotification'),
        icon: 'ph:chat-bold',
        color: '#06b6d4',
        delay: '12h'
      },
      {
        label: t('cartRecovery.stepExclusive'),
        description: t('cartRecovery.vipDiscount15'),
        icon: 'ph:crown-bold',
        color: '#f59e0b',
        delay: ''
      }
    ],
    metrics: { sent: 1250, opened: 74, clicked: 41, recovered: 32 }
  },
  {
    id: 'camp-003',
    name: 'High Value Cart Recovery',
    active: false,
    createdAt: '2026-02-05T09:00:00Z',
    steps: [
      {
        label: t('cartRecovery.stepUrgentEmail'),
        description: t('cartRecovery.limitedStock'),
        icon: 'ph:warning-bold',
        color: '#ef4444',
        delay: '2h'
      },
      {
        label: t('cartRecovery.stepFreeShipping'),
        description: t('cartRecovery.freeShippingOffer'),
        icon: 'ph:truck-bold',
        color: '#22c55e',
        delay: '48h'
      },
      {
        label: t('cartRecovery.stepPhoneCall'),
        description: t('cartRecovery.personalFollowUp'),
        icon: 'ph:phone-bold',
        color: '#7849ff',
        delay: ''
      }
    ],
    metrics: { sent: 890, opened: 58, clicked: 22, recovered: 14 }
  },
  {
    id: 'camp-004',
    name: 'Browse Abandonment Winback',
    active: true,
    createdAt: '2026-02-18T11:15:00Z',
    steps: [
      {
        label: t('cartRecovery.stepBrowseEmail'),
        description: t('cartRecovery.productRecommendation'),
        icon: 'ph:star-bold',
        color: '#f59e0b',
        delay: '4h'
      },
      {
        label: t('cartRecovery.stepSocialProof'),
        description: t('cartRecovery.reviewsHighlight'),
        icon: 'ph:chat-circle-dots-bold',
        color: '#3b82f6',
        delay: '72h'
      },
      {
        label: t('cartRecovery.stepLastChance'),
        description: t('cartRecovery.finalDiscount20'),
        icon: 'ph:clock-bold',
        color: '#ef4444',
        delay: ''
      }
    ],
    metrics: { sent: 2180, opened: 55, clicked: 19, recovered: 11 }
  }
]);

// ─── Mock Data: Funnel ──────────────────────────────────────
const currentWeekFunnel = ref([
  { stage: 'Browse', value: 12500, percentage: 100 },
  { stage: 'Add to Cart', value: 5625, percentage: 45 },
  { stage: 'Checkout', value: 3500, percentage: 28 },
  { stage: 'Payment', value: 2250, percentage: 18 },
  { stage: 'Complete', value: 1875, percentage: 15 }
]);

const previousWeekFunnel = ref([
  { stage: 'Browse', value: 11800, percentage: 100 },
  { stage: 'Add to Cart', value: 4956, percentage: 42 },
  { stage: 'Checkout', value: 3068, percentage: 26 },
  { stage: 'Payment', value: 1888, percentage: 16 },
  { stage: 'Complete', value: 1534, percentage: 13 }
]);

const dropOffStages = ref([
  {
    from: 'Browse',
    to: 'Add to Cart',
    dropOff: 55,
    icon: 'ph:cursor-click-bold',
    color: '#3b82f6',
    reasons: ['Price too high', 'Just browsing', 'Comparing options', 'Out of stock']
  },
  {
    from: 'Add to Cart',
    to: 'Checkout',
    dropOff: 38,
    icon: 'ph:shopping-cart-simple-bold',
    color: '#f59e0b',
    reasons: ['Shipping costs', 'Requires account', 'Slow loading', 'No guest checkout']
  },
  {
    from: 'Checkout',
    to: 'Payment',
    dropOff: 36,
    icon: 'ph:credit-card-bold',
    color: '#ef4444',
    reasons: ['Payment declined', 'Limited options', 'Security concerns', 'Hidden fees']
  },
  {
    from: 'Payment',
    to: 'Complete',
    dropOff: 17,
    icon: 'ph:check-circle-bold',
    color: '#22c55e',
    reasons: ['Timeout error', 'Changed mind', 'Technical issue', 'Duplicate order fear']
  }
]);

// ─── Mock Data: Revenue ─────────────────────────────────────
const weeklyRevenueData = ref([
  { week: 'Week 1 (Jan 6)', atRisk: 28500, recovered: 8550, lost: 19950, rate: 30 },
  { week: 'Week 2 (Jan 13)', atRisk: 31200, recovered: 7800, lost: 23400, rate: 25 },
  { week: 'Week 3 (Jan 20)', atRisk: 27800, recovered: 9730, lost: 18070, rate: 35 },
  { week: 'Week 4 (Jan 27)', atRisk: 34100, recovered: 8866, lost: 25234, rate: 26 },
  { week: 'Week 5 (Feb 3)', atRisk: 29600, recovered: 10360, lost: 19240, rate: 35 },
  { week: 'Week 6 (Feb 10)', atRisk: 32400, recovered: 11340, lost: 21060, rate: 35 },
  { week: 'Week 7 (Feb 17)', atRisk: 35800, recovered: 12530, lost: 23270, rate: 35 },
  { week: 'Week 8 (Feb 24)', atRisk: 33200, recovered: 11620, lost: 21580, rate: 35 }
]);

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => {
  const pendingCarts = abandonedCarts.value.filter(c => c.status === 'Pending' || c.status === 'Email Sent').length;
  const recoveredCarts = abandonedCarts.value.filter(c => c.status === 'Recovered').length;
  const totalCarts = abandonedCarts.value.length;
  const recoveryRate = totalCarts > 0 ? Math.round((recoveredCarts / totalCarts) * 100) : 0;
  const totalRecovered = weeklyRevenueData.value.reduce((s, w) => s + w.recovered, 0);
  const avgCartVal = totalCarts > 0
    ? Math.round(abandonedCarts.value.reduce((s, c) => s + c.cartValue, 0) / totalCarts)
    : 0;

  return [
    {
      label: t('cartRecovery.abandonedCarts24h'),
      value: pendingCarts.toString(),
      icon: 'ph:shopping-cart-simple-bold',
      color: '#ef4444',
      trend: -8.3
    },
    {
      label: t('cartRecovery.recoveryRate'),
      value: `${recoveryRate}%`,
      icon: 'ph:arrow-counter-clockwise-bold',
      color: '#22c55e',
      trend: 5.2
    },
    {
      label: t('cartRecovery.revenueRecovered'),
      value: `$${(totalRecovered / 1000).toFixed(1)}K`,
      icon: 'ph:currency-dollar-bold',
      color: '#7849ff',
      trend: 12.7
    },
    {
      label: t('cartRecovery.avgCartValue'),
      value: `$${avgCartVal}`,
      icon: 'ph:tag-bold',
      color: '#3b82f6',
      trend: 3.1
    }
  ];
});

// ─── Filtered Abandoned Carts ───────────────────────────────
const filteredAbandonedCarts = computed(() => {
  let carts = abandonedCarts.value;
  if (cartSearch.value.trim()) {
    const q = cartSearch.value.toLowerCase();
    carts = carts.filter(c =>
      c.customerName.toLowerCase().includes(q) ||
      c.customerEmail.toLowerCase().includes(q)
    );
  }
  if (cartStatusFilter.value) {
    carts = carts.filter(c => c.status === cartStatusFilter.value);
  }
  return carts;
});

// ─── Revenue Summary Cards ──────────────────────────────────
const revenueSummaryCards = computed(() => {
  const totalAtRisk = weeklyRevenueData.value.reduce((s, w) => s + w.atRisk, 0);
  const totalRecovered = weeklyRevenueData.value.reduce((s, w) => s + w.recovered, 0);
  const totalLost = weeklyRevenueData.value.reduce((s, w) => s + w.lost, 0);
  const roi = totalRecovered > 0 ? Math.round((totalRecovered / (totalAtRisk * 0.05)) * 100) : 0;

  return [
    {
      label: t('cartRecovery.totalAtRisk'),
      value: `$${(totalAtRisk / 1000).toFixed(1)}K`,
      icon: 'ph:warning-bold',
      color: '#f59e0b'
    },
    {
      label: t('cartRecovery.successfullyRecovered'),
      value: `$${(totalRecovered / 1000).toFixed(1)}K`,
      icon: 'ph:check-circle-bold',
      color: '#22c55e'
    },
    {
      label: t('cartRecovery.lostRevenue'),
      value: `$${(totalLost / 1000).toFixed(1)}K`,
      icon: 'ph:x-circle-bold',
      color: '#ef4444'
    },
    {
      label: t('cartRecovery.recoveryROI'),
      value: `${roi}%`,
      icon: 'ph:chart-line-up-bold',
      color: '#7849ff'
    }
  ];
});

// ─── Tooltip Style ──────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.9)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

// ─── Funnel Chart Options ───────────────────────────────────
const funnelColors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#22c55e'];

const funnelChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    ...tooltipStyle,
    formatter: (params: any) => {
      return `<strong>${params.name}</strong><br/>Visitors: <strong>${params.value.toLocaleString()}</strong><br/>Rate: <strong>${params.data.percentage}%</strong>`;
    }
  },
  series: [
    {
      type: 'funnel',
      left: '10%',
      top: 30,
      bottom: 30,
      width: '80%',
      min: 0,
      max: 12500,
      minSize: '10%',
      maxSize: '100%',
      sort: 'descending',
      gap: 4,
      label: {
        show: true,
        position: 'inside',
        formatter: (params: any) => `${params.name}\n${params.data.percentage}%`,
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
        lineHeight: 20
      },
      labelLine: { show: false },
      itemStyle: {
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 4
      },
      emphasis: {
        label: { fontSize: 15 },
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      },
      data: currentWeekFunnel.value.map((s, i) => ({
        name: s.stage,
        value: s.value,
        percentage: s.percentage,
        itemStyle: { color: funnelColors[i] }
      })),
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    }
  ]
}));

const previousFunnelChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    ...tooltipStyle,
    formatter: (params: any) => {
      return `<strong>${params.name}</strong><br/>Visitors: <strong>${params.value.toLocaleString()}</strong><br/>Rate: <strong>${params.data.percentage}%</strong>`;
    }
  },
  series: [
    {
      type: 'funnel',
      left: '10%',
      top: 30,
      bottom: 30,
      width: '80%',
      min: 0,
      max: 11800,
      minSize: '10%',
      maxSize: '100%',
      sort: 'descending',
      gap: 4,
      label: {
        show: true,
        position: 'inside',
        formatter: (params: any) => `${params.name}\n${params.data.percentage}%`,
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
        lineHeight: 20
      },
      labelLine: { show: false },
      itemStyle: {
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 4
      },
      emphasis: {
        label: { fontSize: 15 },
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      },
      data: previousWeekFunnel.value.map((s, i) => ({
        name: s.stage,
        value: s.value,
        percentage: s.percentage,
        itemStyle: { color: funnelColors[i], opacity: 0.7 }
      })),
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    }
  ]
}));

// ─── Revenue Stacked Bar Chart ──────────────────────────────
const revenueBarChartOption = computed(() => {
  const data = weeklyRevenueData.value;
  const weeks = data.map(d => d.week.replace(/\s*\(.*\)/, ''));
  const recovered = data.map(d => d.recovered);
  const lost = data.map(d => d.lost);

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex ?? 0;
        const weekLabel = data[idx]?.week || '';
        let html = `<strong>${weekLabel}</strong><br/>`;
        params.forEach((p: any) => {
          html += `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color};margin-right:6px;"></span>`;
          html += `${p.seriesName}: <strong>$${p.value.toLocaleString()}</strong><br/>`;
        });
        return html;
      }
    },
    legend: {
      data: [t('cartRecovery.recovered'), t('cartRecovery.lost')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 20
    },
    grid: { top: 20, right: 20, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: weeks,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: {
        color: '#64748B',
        formatter: (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`
      }
    },
    series: [
      {
        name: t('cartRecovery.recovered'),
        type: 'bar',
        stack: 'revenue',
        data: recovered,
        barWidth: 28,
        itemStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#22c55e' },
            { offset: 1, color: '#16a34a' }
          ]),
          borderRadius: [0, 0, 0, 0]
        }
      },
      {
        name: t('cartRecovery.lost'),
        type: 'bar',
        stack: 'revenue',
        data: lost,
        barWidth: 28,
        itemStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#ef4444' },
            { offset: 1, color: '#dc2626' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Recovery Rate Trend Chart ──────────────────────────────
const recoveryRateChartOption = computed(() => {
  const data = weeklyRevenueData.value;
  const weeks = data.map(d => d.week.replace(/\s*\(.*\)/, ''));
  const rates = data.map(d => d.rate);

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex ?? 0;
        const weekLabel = data[idx]?.week || '';
        return `<strong>${weekLabel}</strong><br/>Recovery Rate: <strong>${params[0]?.value}%</strong>`;
      }
    },
    grid: { top: 20, right: 20, bottom: 30, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: weeks,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 50,
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', formatter: '{value}%' }
    },
    series: [
      {
        type: 'line',
        data: rates,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#22c55e' },
        itemStyle: { color: '#22c55e', borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0)' }
          ])
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#f59e0b', width: 1 },
          data: [{ yAxis: 30, label: { formatter: 'Target: 30%', color: '#f59e0b', fontSize: 11 } }]
        }
      }
    ],
    animationDuration: 1200,
    animationEasing: 'cubicOut'
  };
});

// ─── Helpers ────────────────────────────────────────────────
function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.split(' ');
  return parts.length >= 2
    ? (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

function getRelativeTime(dateStr: string): string {
  if (!dateStr) return '--';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t('cartRecovery.justNow');
  if (diffMin < 60) return t('cartRecovery.minutesAgo', { count: diffMin });
  if (diffHr < 24) return t('cartRecovery.hoursAgo', { count: diffHr });
  return t('cartRecovery.daysAgo', { count: diffDay });
}

function getCartStatusType(status: string): string {
  const map: Record<string, string> = {
    'Pending': 'warning',
    'Email Sent': '',
    'Recovered': 'success',
    'Lost': 'danger'
  };
  return map[status] || 'info';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Actions ────────────────────────────────────────────────
function onCartSelectionChange(rows: any[]) {
  selectedCarts.value = rows;
}

function expandRow(_row: any, _expandedRows: any[]) {
  // Track expanded rows if needed
}

function sendRecoveryEmail(cart: any) {
  if (cart.status === 'Recovered' || cart.status === 'Lost') {
    ElMessage.warning(t('cartRecovery.cannotRecoverCart'));
    return;
  }
  cart.status = 'Email Sent';
  ElMessage.success(t('cartRecovery.emailSentTo', { name: cart.customerName }));
}

function bulkRecover() {
  const eligible = selectedCarts.value.filter(c => c.status === 'Pending' || c.status === 'Email Sent');
  if (!eligible.length) {
    ElMessage.warning(t('cartRecovery.noEligibleCarts'));
    return;
  }
  eligible.forEach(c => { c.status = 'Email Sent'; });
  ElMessage.success(t('cartRecovery.bulkEmailSent', { count: eligible.length }));
  selectedCarts.value = [];
}

function bulkMarkLost() {
  ElMessageBox.confirm(
    t('cartRecovery.confirmMarkLost', { count: selectedCarts.value.length }),
    t('cartRecovery.warning'),
    { type: 'warning' }
  ).then(() => {
    selectedCarts.value.forEach(c => { c.status = 'Lost'; });
    ElMessage.success(t('cartRecovery.markedAsLost'));
    selectedCarts.value = [];
  }).catch(() => { /* cancelled */ });
}

function viewCartDetail(cart: any) {
  selectedCart.value = cart;
  cartDetailVisible.value = true;
}

function toggleCampaign(campaign: any) {
  const status = campaign.active ? t('cartRecovery.activated') : t('cartRecovery.paused');
  ElMessage.success(`${campaign.name} ${status}`);
}

function editCampaign(campaign: any) {
  ElMessage.info(t('cartRecovery.editingCampaign', { name: campaign.name }));
}

function viewCampaignDetails(campaign: any) {
  ElMessage.info(t('cartRecovery.viewingDetails', { name: campaign.name }));
}

function onDateRangeChange() {
  // Filter data by date range
}

function refreshData() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    ElMessage.success(t('cartRecovery.dataRefreshed'));
  }, 1000);
}
</script>

<style lang="scss" scoped>
.cart-recovery-page {
  animation: fadeInUp 0.5s ease-out;
  min-height: 100vh;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ─── Section Title ──────────────────────────────────────────
.section-title {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
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
    box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08);
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
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.12);
    border-color: rgba(120, 73, 255, 0.3);
  }
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Customer Avatar ────────────────────────────────────────
.customer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #7849ff, #a855f7);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.large {
    width: 48px;
    height: 48px;
    font-size: 1rem;
    border-radius: 14px;
  }
}

// ─── Campaign Timeline ──────────────────────────────────────
.campaign-timeline {
  padding: 0.5rem 0;
}

.timeline-steps {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  text-align: center;
}

.step-node {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 2;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}

.step-info {
  margin-top: 0.5rem;
  max-width: 100px;
}

.step-connector {
  position: absolute;
  top: 22px;
  left: calc(50% + 22px);
  width: calc(100% - 44px);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

.connector-line {
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--border-default), rgba(120, 73, 255, 0.3), var(--border-default));
}

.connector-label {
  margin-top: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-elevated);
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-default);
}

// ─── Campaign Metrics ───────────────────────────────────────
.campaign-metric {
  text-align: center;
  padding: 0.75rem;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.04);
  border: 1px solid var(--border-default);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(120, 73, 255, 0.08);
  }
}

// ─── Funnel ─────────────────────────────────────────────────
.funnel-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(120, 73, 255, 0.3);
    background: rgba(120, 73, 255, 0.03);
  }
}

// ─── Tabs Styling ───────────────────────────────────────────
.recovery-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    background: var(--border-default);
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted);
    font-weight: 500;
    font-size: 0.95rem;

    &.is-active {
      color: var(--accent-color, #7849ff);
      font-weight: 600;
    }

    &:hover {
      color: var(--accent-color, #7849ff);
    }
  }

  :deep(.el-tabs__active-bar) {
    background: var(--accent-color, #7849ff);
    height: 3px;
    border-radius: 3px;
  }

  :deep(.el-tabs__content) {
    padding-top: 1.5rem;
  }
}

// ─── Responsive ─────────────────────────────────────────────
@media (max-width: 768px) {
  .timeline-steps {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .timeline-step {
    flex-direction: row;
    gap: 0.75rem;
    text-align: start;
  }

  .step-connector {
    display: none;
  }

  .step-info {
    margin-top: 0;
    max-width: 200px;
  }
}
</style>
