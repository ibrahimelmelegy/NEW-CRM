<template lang="pug">
.abm-page.p-6(class="md:p-8")
  //- Page Header
  .flex.items-center.justify-between.mb-6(class="flex-col md:flex-row gap-4")
    div
      h1.text-2xl.font-bold.flex.items-center.gap-3(style="color: var(--text-primary)")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #7849ff, #5a2fd4)")
          Icon(name="ph:target-bold" size="22" style="color: white")
        | {{ $t('abm.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('abm.subtitle') }}

    .flex.items-center.gap-3(class="flex-wrap")
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :start-placeholder="$t('abm.startDate')"
        :end-placeholder="$t('abm.endDate')"
        size="large"
        style="max-width: 280px"
        value-format="YYYY-MM-DD"
      )
      el-button(size="large" @click="refreshData" :loading="loading" class="!rounded-2xl")
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-1 {{ $t('abm.refresh') }}

  //- KPI Cards
  .grid.gap-5.mb-6(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" v-loading="loading")
    .kpi-card(v-for="kpi in kpiCards" :key="kpi.label")
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.text-xs.font-medium.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
            p.text-2xl.font-bold(style="color: var(--text-primary)") {{ kpi.value }}
            .flex.items-center.gap-1.mt-1(v-if="kpi.change")
              Icon(:name="kpi.change > 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: kpi.change > 0 ? '#22c55e' : '#ef4444' }")
              span.text-xs.font-medium(:style="{ color: kpi.change > 0 ? '#22c55e' : '#ef4444' }") {{ kpi.change > 0 ? '+' : '' }}{{ kpi.change }}%
          .w-12.h-12.rounded-xl.flex.items-center.justify-center(:style="{ background: kpi.color + '15' }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Content Tabs
  template(v-else)
    el-tabs(v-model="activeTab")

      //- ════════════════════════════════════════════════
      //- TAB 1: Target Accounts
      //- ════════════════════════════════════════════════
      el-tab-pane(:label="$t('abm.targetAccounts')" name="accounts")
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4(class="flex-wrap gap-3")
            .flex.items-center.gap-3
              el-input(
                v-model="accountSearch"
                :placeholder="$t('abm.searchAccounts')"
                clearable
                size="large"
                style="max-width: 280px"
                class="!rounded-xl"
              )
                template(#prefix)
                  Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
              el-select(
                v-model="tierFilter"
                :placeholder="$t('abm.allTiers')"
                clearable
                size="large"
                style="width: 160px"
              )
                el-option(:label="$t('abm.allTiers')" value="")
                el-option(:label="$t('abm.tier1')" value="1")
                el-option(:label="$t('abm.tier2')" value="2")
                el-option(:label="$t('abm.tier3')" value="3")
            el-button(type="primary" size="large" class="!rounded-2xl !bg-[#7849ff] !border-none" @click="showAddAccountDialog = true")
              Icon(name="ph:plus-bold" size="16")
              span.ml-1 {{ $t('abm.addAccount') }}

          el-table(:data="paginatedAccounts" style="width: 100%" stripe)
            el-table-column(:label="$t('abm.accountName')" min-width="200" sortable prop="name")
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(:style="{ background: getTierColor(row.tier) + '15' }")
                    Icon(name="ph:buildings-bold" size="18" :style="{ color: getTierColor(row.tier) }")
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                    p.text-xs(style="color: var(--text-muted)") {{ row.domain }}

            el-table-column(:label="$t('abm.tier')" width="110" align="center" sortable prop="tier")
              template(#default="{ row }")
                el-tag(:color="getTierColor(row.tier)" effect="dark" size="small" round style="border: none; color: #fff") {{ $t('abm.tier' + row.tier) }}

            el-table-column(:label="$t('abm.industry')" width="150")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-primary)") {{ row.industry }}

            el-table-column(:label="$t('abm.engagementScore')" width="200" sortable prop="engagementScore")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  el-progress(
                    :percentage="row.engagementScore"
                    :stroke-width="8"
                    :color="getEngagementColor(row.engagementScore)"
                    style="flex: 1"
                  )
                  span.text-xs.font-bold(:style="{ color: getEngagementColor(row.engagementScore) }") {{ row.engagementScore }}

            el-table-column(:label="$t('abm.pipelineValue')" width="150" align="right" sortable prop="pipelineValue")
              template(#default="{ row }")
                span.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatCurrency(row.pipelineValue) }}

            el-table-column(:label="$t('abm.owner')" width="140")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  .w-6.h-6.rounded-full.flex.items-center.justify-center.text-xs.font-bold.text-white(:style="{ background: getAvatarColor(row.owner) }") {{ getInitials(row.owner) }}
                  span.text-xs(style="color: var(--text-secondary)") {{ row.owner }}

            el-table-column(:label="$t('abm.status')" width="130" align="center")
              template(#default="{ row }")
                el-tag(:type="getAccountStatusType(row.status)" effect="dark" size="small" round) {{ $t('abm.status_' + row.status) }}

          //- Pagination
          .flex.items-center.justify-between.mt-4(v-if="filteredAccounts.length > 0")
            span.text-sm(style="color: var(--text-muted)") {{ $t('abm.showing') }} {{ accountPaginationStart }}-{{ accountPaginationEnd }} {{ $t('abm.of') }} {{ filteredAccounts.length }}
            el-pagination(
              v-model:current-page="accountPage"
              :page-size="accountPageSize"
              :total="filteredAccounts.length"
              layout="prev, pager, next"
              background
            )

      //- ════════════════════════════════════════════════
      //- TAB 2: Campaigns
      //- ════════════════════════════════════════════════
      el-tab-pane(:label="$t('abm.campaigns')" name="campaigns")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:megaphone-bold" size="20" class="mr-2" style="color: #7849ff")
            | {{ $t('abm.abmCampaigns') }}
          el-button(type="primary" size="large" class="!rounded-2xl !bg-[#7849ff] !border-none" @click="showCreateCampaignDialog = true")
            Icon(name="ph:plus-bold" size="16")
            span.ml-1 {{ $t('abm.newCampaign') }}

        .grid.gap-5(class="grid-cols-1 lg:grid-cols-2")
          .glass-card.rounded-2xl.overflow-hidden(v-for="campaign in abmCampaigns" :key="campaign.id")
            .p-5
              .flex.items-start.justify-between.mb-3
                div
                  h4.text-base.font-bold(style="color: var(--text-primary)") {{ campaign.name }}
                  p.text-xs.mt-1(style="color: var(--text-muted)") {{ campaign.dateRange }}
                el-tag(:type="getCampaignStatusType(campaign.status)" effect="dark" size="small" round) {{ $t('abm.campaignStatus_' + campaign.status) }}

              //- Target accounts count
              .flex.items-center.gap-4.mb-4
                .flex.items-center.gap-2
                  Icon(name="ph:buildings-bold" size="16" style="color: var(--text-muted)")
                  span.text-sm(style="color: var(--text-secondary)")
                    span.font-bold(style="color: var(--text-primary)") {{ campaign.targetAccounts }}
                    |  {{ $t('abm.targetAccountsLabel') }}

              //- Channel icons
              .flex.items-center.gap-2.mb-4
                span.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('abm.channels') }}:
                .flex.items-center.gap-1
                  el-tooltip(v-for="ch in campaign.channels" :key="ch" :content="$t('abm.channel_' + ch)")
                    .w-8.h-8.rounded-lg.flex.items-center.justify-center(:style="{ background: getChannelColor(ch) + '15' }")
                      Icon(:name="getChannelIcon(ch)" size="16" :style="{ color: getChannelColor(ch) }")

              //- Metrics row
              .grid.grid-cols-2.gap-3.mb-4
                .p-3.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
                  p.text-xs(style="color: var(--text-muted)") {{ $t('abm.engagementRate') }}
                  p.text-lg.font-bold(style="color: #22c55e") {{ campaign.engagementRate }}%
                .p-3.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
                  p.text-xs(style="color: var(--text-muted)") {{ $t('abm.pipelineInfluenced') }}
                  p.text-lg.font-bold(style="color: #3b82f6") {{ formatCurrency(campaign.pipelineInfluenced) }}

              //- Progress bar
              .mb-2
                .flex.items-center.justify-between.mb-1
                  span.text-xs(style="color: var(--text-muted)") {{ $t('abm.progress') }}
                  span.text-xs.font-bold(:style="{ color: '#7849ff' }") {{ campaign.progress }}%
                .w-full.rounded-full.overflow-hidden(style="height: 6px; background: var(--border-default)")
                  .h-full.rounded-full.transition-all.duration-700(style="background: #7849ff" :style="{ width: campaign.progress + '%' }")

      //- ════════════════════════════════════════════════
      //- TAB 3: Engagement Insights
      //- ════════════════════════════════════════════════
      el-tab-pane(:label="$t('abm.engagementInsights')" name="engagement")
        //- Activity Heatmap
        .glass-card.p-6.rounded-2xl.mb-6
          .flex.items-center.justify-between.mb-4
            h3.text-base.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:squares-four-bold" size="20" class="mr-2" style="color: #7849ff")
              | {{ $t('abm.activityHeatmap') }}
            .flex.items-center.gap-2
              span.text-xs(style="color: var(--text-muted)") {{ $t('abm.lessActive') }}
              .flex.items-center.gap-1
                .w-4.h-4.rounded-sm(v-for="c in heatmapLegendColors" :key="c" :style="{ background: c }")
              span.text-xs(style="color: var(--text-muted)") {{ $t('abm.moreActive') }}

          //- Heatmap Grid
          .heatmap-container
            .heatmap-row(v-for="(dayRow, dayIdx) in heatmapData" :key="dayIdx")
              span.heatmap-label {{ dayLabels[dayIdx] }}
              .heatmap-cells
                el-tooltip(
                  v-for="(val, hourIdx) in dayRow"
                  :key="hourIdx"
                  :content="`${dayLabels[dayIdx]} ${hourIdx}:00 - ${val} ${$t('abm.interactions')}`"
                )
                  .heatmap-cell(:style="{ background: getHeatmapColor(val) }")

          .flex.items-center.justify-center.gap-6.mt-3
            span.text-xs(style="color: var(--text-muted)") {{ $t('abm.hourlyBreakdown') }} (0:00 - 23:00)

        //- Intent Signals Table
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4
            h3.text-base.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:lightning-bold" size="20" class="mr-2" style="color: #f59e0b")
              | {{ $t('abm.intentSignals') }}
            el-badge(:value="intentSignals.length" type="warning")

          el-table(:data="intentSignals" style="width: 100%" stripe)
            el-table-column(:label="$t('abm.accountName')" min-width="180")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(name="ph:buildings-bold" size="16" style="color: #7849ff")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.account }}

            el-table-column(:label="$t('abm.signalType')" width="180")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(:name="getSignalIcon(row.type)" size="16" :style="{ color: getSignalColor(row.type) }")
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('abm.signal_' + row.type) }}

            el-table-column(:label="$t('abm.signalStrength')" width="140" align="center")
              template(#default="{ row }")
                el-tag(:type="getStrengthType(row.strength)" effect="dark" size="small" round) {{ $t('abm.strength_' + row.strength) }}

            el-table-column(:label="$t('abm.detectedDate')" width="140")
              template(#default="{ row }")
                .flex.items-center.gap-1
                  Icon(name="ph:calendar-blank" size="14" style="color: var(--text-muted)")
                  span.text-sm(style="color: var(--text-secondary)") {{ formatDate(row.detectedAt) }}

            el-table-column(:label="$t('abm.recommendedAction')" min-width="200")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(name="ph:arrow-right-bold" size="14" style="color: #22c55e")
                  span.text-sm(style="color: var(--text-primary)") {{ row.action }}

      //- ════════════════════════════════════════════════
      //- TAB 4: Pipeline Impact
      //- ════════════════════════════════════════════════
      el-tab-pane(:label="$t('abm.pipelineImpact')" name="pipeline")
        //- Waterfall Chart
        .glass-card.p-6.rounded-2xl.mb-6
          .flex.items-center.justify-between.mb-4
            h3.text-base.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:chart-bar-bold" size="20" class="mr-2" style="color: #3b82f6")
              | {{ $t('abm.pipelineWaterfall') }}
            .flex.items-center.gap-2
              .flex.items-center.gap-1
                .w-3.h-3.rounded-sm(style="background: #7849ff")
                span.text-xs(style="color: var(--text-muted)") {{ $t('abm.accounts') }}
              .flex.items-center.gap-1
                .w-3.h-3.rounded-sm(style="background: #22c55e")
                span.text-xs(style="color: var(--text-muted)") {{ $t('abm.value') }}

          ClientOnly
            VChart(v-if="waterfallChartOption" :option="waterfallChartOption" autoresize style="height: 380px")

        //- Revenue Attribution Table
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4
            h3.text-base.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:currency-dollar-bold" size="20" class="mr-2" style="color: #22c55e")
              | {{ $t('abm.revenueAttribution') }}

          el-table(:data="revenueAttributions" style="width: 100%" stripe)
            el-table-column(:label="$t('abm.accountName')" min-width="180" sortable prop="account")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(name="ph:buildings-bold" size="16" style="color: #7849ff")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.account }}

            el-table-column(:label="$t('abm.campaign')" min-width="160")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-secondary)") {{ row.campaign }}

            el-table-column(:label="$t('abm.influencedAmount')" width="160" align="right" sortable prop="amount")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: #22c55e") {{ formatCurrency(row.amount) }}

            el-table-column(:label="$t('abm.attributionModel')" width="160" align="center")
              template(#default="{ row }")
                el-tag(:type="getAttributionType(row.model)" effect="plain" size="small" round) {{ $t('abm.model_' + row.model) }}

            el-table-column(:label="$t('abm.dealStage')" width="150" align="center")
              template(#default="{ row }")
                el-tag(:color="getStageColor(row.stage)" effect="dark" size="small" round style="border: none; color: #fff") {{ $t('abm.stage_' + row.stage) }}

  //- ════════════════════════════════════════════════
  //- Add Account Dialog
  //- ════════════════════════════════════════════════
  el-dialog(v-model="showAddAccountDialog" :title="$t('abm.addTargetAccount')" width="560px" :close-on-click-modal="false")
    el-form(label-position="top" :model="accountForm")
      el-form-item(:label="$t('abm.accountName')")
        el-input(v-model="accountForm.name" :placeholder="$t('abm.accountNamePlaceholder')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('abm.tier')")
          el-radio-group(v-model="accountForm.tier")
            el-radio-button(value="1") {{ $t('abm.tier1') }}
            el-radio-button(value="2") {{ $t('abm.tier2') }}
            el-radio-button(value="3") {{ $t('abm.tier3') }}
        el-form-item(:label="$t('abm.industry')")
          el-input(v-model="accountForm.industry" :placeholder="$t('abm.industryPlaceholder')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('abm.owner')")
          el-select(v-model="accountForm.owner" :placeholder="$t('abm.selectOwner')" style="width: 100%" filterable)
            el-option(v-for="owner in ownerOptions" :key="owner" :label="owner" :value="owner")
        el-form-item(:label="$t('abm.domain')")
          el-input(v-model="accountForm.domain" placeholder="example.com")
    template(#footer)
      el-button(@click="showAddAccountDialog = false") {{ $t('abm.cancel') }}
      el-button(type="primary" class="!bg-[#7849ff] !border-none" @click="handleAddAccount") {{ $t('abm.save') }}

  //- ════════════════════════════════════════════════
  //- Create Campaign Dialog
  //- ════════════════════════════════════════════════
  el-dialog(v-model="showCreateCampaignDialog" :title="$t('abm.createCampaign')" width="600px" :close-on-click-modal="false")
    el-form(label-position="top" :model="campaignForm")
      el-form-item(:label="$t('abm.campaignName')")
        el-input(v-model="campaignForm.name" :placeholder="$t('abm.campaignNamePlaceholder')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('abm.status')")
          el-select(v-model="campaignForm.status" style="width: 100%")
            el-option(:label="$t('abm.campaignStatus_active')" value="active")
            el-option(:label="$t('abm.campaignStatus_draft')" value="draft")
            el-option(:label="$t('abm.campaignStatus_paused')" value="paused")
        el-form-item(:label="$t('abm.channels')")
          el-select(v-model="campaignForm.channels" multiple style="width: 100%")
            el-option(:label="$t('abm.channelEmail')" value="email")
            el-option(:label="$t('abm.channelAds')" value="ads")
            el-option(:label="$t('abm.channelSocial')" value="social")
            el-option(:label="$t('abm.channelEvents')" value="events")
      el-form-item(:label="$t('abm.dateRange')")
        el-date-picker(
          v-model="campaignForm.dateRange"
          type="daterange"
          :start-placeholder="$t('abm.startDate')"
          :end-placeholder="$t('abm.endDate')"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        )
    template(#footer)
      el-button(@click="showCreateCampaignDialog = false") {{ $t('abm.cancel') }}
      el-button(type="primary" class="!bg-[#7849ff] !border-none" @click="handleCreateCampaign") {{ $t('abm.save') }}
</template>

<script setup lang="ts">
import { use, graphic } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';

definePageMeta({ title: 'Account-Based Marketing' });

const { t } = useI18n();

// ── State ──
const loading = ref(false);
const activeTab = ref('accounts');
const dateRange = ref<string[]>([]);
const accountSearch = ref('');
const tierFilter = ref('');
const accountPage = ref(1);
const accountPageSize = 10;
const showAddAccountDialog = ref(false);
const showCreateCampaignDialog = ref(false);

// ── Raw API Data ──
const rawDeals = ref<Record<string, unknown>[]>([]);
const rawLeads = ref<Record<string, unknown>[]>([]);
const rawCompanies = ref<Record<string, unknown>[]>([]);

// ── Form State ──
const accountForm = ref({
  name: '',
  tier: '1',
  industry: '',
  owner: '',
  domain: ''
});

const campaignForm = ref({
  name: '',
  status: 'draft',
  channels: [] as string[],
  dateRange: [] as string[]
});

// ── Owner Options ──
const ownerOptions = computed(() => {
  const owners = new Set<string>();
  rawDeals.value.forEach(d => {
    if (d.assignedTo) owners.add(d.assignedTo);
    if (d.ownerName) owners.add(d.ownerName);
  });
  if (owners.size === 0) {
    return ['Sarah Chen', 'Michael Ross', 'David Park', 'Lisa Wang', 'James Miller'];
  }
  return Array.from(owners);
});

// ── Derived Target Accounts ──
const targetAccounts = ref<Record<string, unknown>[]>([]);

const generateTargetAccounts = () => {
  const industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Energy', 'Media', 'Logistics'];
  const statuses = ['active', 'nurturing', 'new'];
  const names: string[] = [];
  const owners = ownerOptions.value;

  // If we have company data from the API, use it
  if (rawCompanies.value.length > 0) {
    return rawCompanies.value.slice(0, 20).map((company, idx) => ({
      id: company.id || `acc-${idx}`,
      name: company.name || company.companyName || names[idx % names.length],
      domain: company.website || `${(company.name || names[idx % names.length]).toLowerCase().replace(/\s+/g, '')}.com`,
      tier: (idx % 3) + 1,
      industry: company.industry || industries[idx % industries.length],
      engagementScore: 0,
      pipelineValue: 0,
      owner: owners[idx % owners.length],
      status: statuses[idx % statuses.length]
    }));
  }

  return names.map((name, idx) => ({
    id: `acc-${idx + 1}`,
    name,
    domain: `${name.toLowerCase().replace(/\s+/g, '')}.com`,
    tier: (idx % 3) + 1,
    industry: industries[idx % industries.length],
    engagementScore: 0,
    pipelineValue: 0,
    owner: owners[idx % owners.length],
    status: statuses[idx % statuses.length]
  }));
};

// ── ABM Campaigns ──
const abmCampaigns = ref<Record<string, unknown>[]>([]);

const generateCampaigns = () => {
  return [
    {
      id: 'camp-1',
      name: t('abm.campaign_enterpriseOutreach'),
      status: 'active',
      targetAccounts: 12,
      channels: ['email', 'ads', 'social'],
      engagementRate: 68,
      pipelineInfluenced: 1250000,
      progress: 72,
      dateRange: 'Jan 15 - Mar 30, 2026'
    },
    {
      id: 'camp-2',
      name: t('abm.campaign_executiveSummit'),
      status: 'active',
      targetAccounts: 8,
      channels: ['events', 'email'],
      engagementRate: 82,
      pipelineInfluenced: 890000,
      progress: 55,
      dateRange: 'Feb 01 - Apr 15, 2026'
    },
    {
      id: 'camp-3',
      name: t('abm.campaign_productLaunch'),
      status: 'draft',
      targetAccounts: 15,
      channels: ['email', 'ads', 'social', 'events'],
      engagementRate: 0,
      pipelineInfluenced: 0,
      progress: 10,
      dateRange: 'Mar 01 - May 31, 2026'
    },
    {
      id: 'camp-4',
      name: t('abm.campaign_retentionPlay'),
      status: 'completed',
      targetAccounts: 6,
      channels: ['email', 'social'],
      engagementRate: 91,
      pipelineInfluenced: 540000,
      progress: 100,
      dateRange: 'Nov 01 - Dec 31, 2025'
    },
    {
      id: 'camp-5',
      name: t('abm.campaign_industryWebinar'),
      status: 'paused',
      targetAccounts: 20,
      channels: ['events', 'ads', 'email'],
      engagementRate: 45,
      pipelineInfluenced: 320000,
      progress: 35,
      dateRange: 'Jan 01 - Feb 28, 2026'
    },
    {
      id: 'camp-6',
      name: t('abm.campaign_partnerCoSell'),
      status: 'active',
      targetAccounts: 10,
      channels: ['email', 'events', 'social'],
      engagementRate: 73,
      pipelineInfluenced: 780000,
      progress: 60,
      dateRange: 'Feb 10 - Apr 30, 2026'
    }
  ];
};

// ── Intent Signals ──
const intentSignals = ref<Record<string, unknown>[]>([]);

const generateIntentSignals = () => {
  const accounts = targetAccounts.value;
  const types = ['web_visit', 'content_download', 'competitor_research', 'web_visit', 'content_download'];
  const strengths = ['high', 'medium', 'low'];
  const actions = [
    t('abm.action_scheduleDemo'),
    t('abm.action_sendCaseStudy'),
    t('abm.action_competitiveAnalysis'),
    t('abm.action_personalizedEmail'),
    t('abm.action_executiveBriefing'),
    t('abm.action_webinarInvite'),
    t('abm.action_phoneCall'),
    t('abm.action_proposalFollowup')
  ];

  return accounts.slice(0, 12).map((acc, idx) => ({
    id: `signal-${idx + 1}`,
    account: acc.name,
    type: types[idx % types.length],
    strength: strengths[idx % strengths.length],
    detectedAt: new Date().toISOString(),
    action: actions[idx % actions.length]
  }));
};

// ── Revenue Attribution ──
const revenueAttributions = ref<Record<string, unknown>[]>([]);

const generateRevenueAttributions = () => {
  const accounts = targetAccounts.value;
  const campaigns = abmCampaigns.value.filter(c => c.status !== 'draft');
  const models = ['first_touch', 'last_touch', 'linear', 'time_decay'];
  const stages = ['new', 'engaged', 'opportunity', 'proposal', 'won'];

  return accounts.slice(0, 10).map((acc, idx) => ({
    id: `attr-${idx + 1}`,
    account: acc.name,
    campaign: campaigns[idx % campaigns.length]?.name || t('abm.campaign_enterpriseOutreach'),
    amount: 0,
    model: models[idx % models.length],
    stage: stages[idx % stages.length]
  }));
};

// ── Heatmap Data (7 days x 24 hours) ──
const dayLabels = [t('abm.mon'), t('abm.tue'), t('abm.wed'), t('abm.thu'), t('abm.fri'), t('abm.sat'), t('abm.sun')];

const heatmapData = computed(() => {
  const data: number[][] = [];
  for (let day = 0; day < 7; day++) {
    const row: number[] = [];
    for (let hour = 0; hour < 24; hour++) {
      // Higher activity during business hours (8-18) on weekdays
      const isWeekday = day < 5;
      const isBusinessHour = hour >= 8 && hour <= 18;
      let base = 0;
      if (isWeekday && isBusinessHour) base = 60;
      else if (isWeekday) base = 15;
      else if (isBusinessHour) base = 25;
      else base = 5;
      row.push(0);
    }
    data.push(row);
  }
  return data;
});

const heatmapLegendColors = ['#1a1a2e', '#2d1b69', '#5a2fd4', '#7849ff', '#a78bfa'];

// ── KPI Cards ──
const kpiCards = computed(() => {
  const totalAccounts = targetAccounts.value.length;
  const avgEngagement = totalAccounts > 0 ? Math.round(targetAccounts.value.reduce((sum, a) => sum + a.engagementScore, 0) / totalAccounts) : 0;
  const totalPipeline = targetAccounts.value.reduce((sum, a) => sum + a.pipelineValue, 0);
  const totalInfluenced = abmCampaigns.value.reduce((sum, c) => sum + c.pipelineInfluenced, 0);
  const abmROI = totalInfluenced > 0 ? Math.round((totalInfluenced / Math.max(totalPipeline * 0.1, 1)) * 100) : 0;

  return [
    {
      label: t('abm.kpi_targetAccounts'),
      value: totalAccounts,
      icon: 'ph:target-bold',
      color: '#7849ff',
      change: 12
    },
    {
      label: t('abm.kpi_avgEngagement'),
      value: `${avgEngagement}/100`,
      icon: 'ph:chart-bar-bold',
      color: '#22c55e',
      change: 8
    },
    {
      label: t('abm.kpi_influencedPipeline'),
      value: formatCurrency(totalInfluenced),
      icon: 'ph:funnel-bold',
      color: '#3b82f6',
      change: 23
    },
    {
      label: t('abm.kpi_abmROI'),
      value: `${Math.min(abmROI, 340)}%`,
      icon: 'ph:trend-up-bold',
      color: '#f59e0b',
      change: 15
    }
  ];
});

// ── Filtered Accounts ──
const filteredAccounts = computed(() => {
  let result = targetAccounts.value;
  if (accountSearch.value) {
    const q = accountSearch.value.toLowerCase();
    result = result.filter(a => a.name.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q));
  }
  if (tierFilter.value) {
    result = result.filter(a => String(a.tier) === tierFilter.value);
  }
  return result;
});

const paginatedAccounts = computed(() => {
  const start = (accountPage.value - 1) * accountPageSize;
  return filteredAccounts.value.slice(start, start + accountPageSize);
});

const accountPaginationStart = computed(() => {
  if (filteredAccounts.value.length === 0) return 0;
  return (accountPage.value - 1) * accountPageSize + 1;
});

const accountPaginationEnd = computed(() => {
  return Math.min(accountPage.value * accountPageSize, filteredAccounts.value.length);
});

watch([accountSearch, tierFilter], () => {
  accountPage.value = 1;
});

// ── Waterfall Chart Option ──
const waterfallChartOption = computed(() => {
  const stages = [t('abm.stage_new'), t('abm.stage_engaged'), t('abm.stage_opportunity'), t('abm.stage_proposal'), t('abm.stage_won')];

  // Derive values from deal data or use computed defaults
  const totalAccounts = targetAccounts.value.length;
  const stageValues = [
    totalAccounts,
    Math.round(totalAccounts * 0.75),
    Math.round(totalAccounts * 0.5),
    Math.round(totalAccounts * 0.3),
    Math.round(totalAccounts * 0.18)
  ];

  const pipelineValues = [targetAccounts.value.reduce((s, a) => s + a.pipelineValue, 0), 0, 0, 0, 0];
  pipelineValues[1] = Math.round(pipelineValues[0] * 0.82);
  pipelineValues[2] = Math.round(pipelineValues[0] * 0.55);
  pipelineValues[3] = Math.round(pipelineValues[0] * 0.35);
  pipelineValues[4] = Math.round(pipelineValues[0] * 0.2);

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 30, 45, 0.9)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;',
      formatter: (params: unknown) => {
        const idx = params[0]?.dataIndex ?? 0;
        return `<strong>${stages[idx]}</strong><br/>
          ${t('abm.accounts')}: ${stageValues[idx]}<br/>
          ${t('abm.value')}: ${formatCurrency(pipelineValues[idx])}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      data: stages,
      axisLine: { lineStyle: { color: 'rgba(120, 73, 255, 0.2)' } },
      axisLabel: { color: '#94a3b8', fontSize: 12 }
    },
    yAxis: [
      {
        type: 'value' as const,
        name: t('abm.accounts'),
        nameTextStyle: { color: '#94a3b8' },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(120, 73, 255, 0.08)' } },
        axisLabel: { color: '#94a3b8' }
      },
      {
        type: 'value' as const,
        name: t('abm.value'),
        nameTextStyle: { color: '#94a3b8' },
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: '#94a3b8',
          formatter: (val: number) => {
            if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
            if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
            return `$${val}`;
          }
        }
      }
    ],
    series: [
      {
        name: t('abm.accounts'),
        type: 'bar' as const,
        data: stageValues,
        itemStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#7849ff' },
            { offset: 1, color: '#5a2fd4' }
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        barWidth: '30%'
      },
      {
        name: t('abm.value'),
        type: 'bar' as const,
        yAxisIndex: 1,
        data: pipelineValues,
        itemStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#22c55e' },
            { offset: 1, color: '#16a34a' }
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        barWidth: '30%'
      }
    ]
  };
});

// ── Helper Functions ──
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateStr));
}

function getTierColor(tier: number): string {
  const colors: Record<number, string> = { 1: '#7849ff', 2: '#3b82f6', 3: '#06b6d4' };
  return colors[tier] || '#94a3b8';
}

function getEngagementColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getAvatarColor(name: string): string {
  const colors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length] || '';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getAccountStatusType(status: string): string {
  const map: Record<string, string> = { active: 'success', nurturing: 'warning', new: 'info' };
  return map[status] || 'info';
}

function getCampaignStatusType(status: string): string {
  const map: Record<string, string> = { active: 'success', draft: 'info', paused: 'warning', completed: '' };
  return map[status] || 'info';
}

function getChannelIcon(channel: string): string {
  const map: Record<string, string> = {
    email: 'ph:envelope-bold',
    ads: 'ph:megaphone-bold',
    social: 'ph:share-network-bold',
    events: 'ph:calendar-check-bold'
  };
  return map[channel] || 'ph:circle-bold';
}

function getChannelColor(channel: string): string {
  const map: Record<string, string> = {
    email: '#3b82f6',
    ads: '#f97316',
    social: '#06b6d4',
    events: '#7849ff'
  };
  return map[channel] || '#94a3b8';
}

function getSignalIcon(type: string): string {
  const map: Record<string, string> = {
    web_visit: 'ph:globe-bold',
    content_download: 'ph:file-arrow-down-bold',
    competitor_research: 'ph:binoculars-bold'
  };
  return map[type] || 'ph:info-bold';
}

function getSignalColor(type: string): string {
  const map: Record<string, string> = {
    web_visit: '#3b82f6',
    content_download: '#22c55e',
    competitor_research: '#ef4444'
  };
  return map[type] || '#94a3b8';
}

function getStrengthType(strength: string): string {
  const map: Record<string, string> = { high: 'danger', medium: 'warning', low: 'info' };
  return map[strength] || 'info';
}

function getAttributionType(model: string): string {
  const map: Record<string, string> = { first_touch: 'primary', last_touch: 'success', linear: 'warning', time_decay: 'info' };
  return map[model] || 'info';
}

function getStageColor(stage: string): string {
  const map: Record<string, string> = {
    new: '#94a3b8',
    engaged: '#3b82f6',
    opportunity: '#f59e0b',
    proposal: '#f97316',
    won: '#22c55e'
  };
  return map[stage] || '#94a3b8';
}

function getHeatmapColor(value: number): string {
  if (value >= 80) return '#7849ff';
  if (value >= 60) return '#5a2fd4';
  if (value >= 40) return '#3d1f8a';
  if (value >= 20) return '#2d1b69';
  return '#1a1a2e';
}

// ── Dialog Actions ──
function handleAddAccount() {
  if (!accountForm.value.name) return;
  targetAccounts.value.unshift({
    id: `acc-new-${Date.now()}`,
    name: accountForm.value.name,
    domain: accountForm.value.domain || `${accountForm.value.name.toLowerCase().replace(/\s+/g, '')}.com`,
    tier: Number(accountForm.value.tier),
    industry: accountForm.value.industry || 'Technology',
    engagementScore: 0,
    pipelineValue: 0,
    owner: accountForm.value.owner || ownerOptions.value[0],
    status: 'new'
  });
  showAddAccountDialog.value = false;
  accountForm.value = { name: '', tier: '1', industry: '', owner: '', domain: '' };
}

function handleCreateCampaign() {
  if (!campaignForm.value.name) return;
  const dr = campaignForm.value.dateRange;
  abmCampaigns.value.unshift({
    id: `camp-new-${Date.now()}`,
    name: campaignForm.value.name,
    status: campaignForm.value.status,
    targetAccounts: 0,
    channels: campaignForm.value.channels.length ? campaignForm.value.channels : ['email'],
    engagementRate: 0,
    pipelineInfluenced: 0,
    progress: 0,
    dateRange: dr.length === 2 ? `${dr[0]} - ${dr[1]}` : 'TBD'
  });
  showCreateCampaignDialog.value = false;
  campaignForm.value = { name: '', status: 'draft', channels: [], dateRange: [] };
}

// ── Data Loading ──
async function loadData() {
  loading.value = true;
  try {
    const [dealsRes, leadsRes, companiesRes] = await Promise.all([
      useApiFetch('deal', 'GET', {}, true),
      useApiFetch('lead', 'GET', {}, true),
      useApiFetch('company', 'GET', {}, true)
    ]);

    if (dealsRes.success && Array.isArray(dealsRes.body)) {
      rawDeals.value = dealsRes.body;
    }
    if (leadsRes.success && Array.isArray(leadsRes.body)) {
      rawLeads.value = leadsRes.body;
    }
    if (companiesRes.success && Array.isArray(companiesRes.body)) {
      rawCompanies.value = companiesRes.body;
    }
  } catch {
    // Silently handle API errors — mock data will be used
  }

  // Generate derived data
  targetAccounts.value = generateTargetAccounts();
  abmCampaigns.value = generateCampaigns();
  intentSignals.value = generateIntentSignals();
  revenueAttributions.value = generateRevenueAttributions();

  loading.value = false;
}

async function refreshData() {
  await loadData();
}

// ── Load on Setup ──
await loadData().catch(() => {
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.abm-page {
  max-width: 1480px;
  margin: 0 auto;
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

// ── KPI Cards ──
.kpi-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(120, 73, 255, 0.1);
  }
}

.kpi-card-inner {
  padding: 20px;
}

// ── Glass Card ──
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
}

// ── Heatmap ──
.heatmap-container {
  overflow-x: auto;
}

.heatmap-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 3px;
}

.heatmap-label {
  width: 36px;
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
  flex-shrink: 0;
  padding-right: 4px;
}

.heatmap-cells {
  display: flex;
  gap: 3px;
  flex: 1;
}

.heatmap-cell {
  width: 100%;
  min-width: 18px;
  aspect-ratio: 1;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.25);
    box-shadow: 0 0 8px rgba(120, 73, 255, 0.4);
  }
}

// ── Tab Styling ──
:deep(.el-tabs__item) {
  font-weight: 600;
  font-size: 14px;
}

:deep(.el-tabs__active-bar) {
  background: var(--accent-color, #7849ff);
}

:deep(.el-tabs__item.is-active) {
  color: var(--accent-color, #7849ff);
}

// ── Table Tweaks ──
:deep(.el-table) {
  --el-table-border-color: var(--border-default);
  --el-table-header-bg-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(120, 73, 255, 0.04);
}

:deep(.el-table th.el-table__cell) {
  background: transparent;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

// ── Progress Overrides ──
:deep(.el-progress__text) {
  display: none;
}

// ── Dialog Styling ──
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

// ── Pagination ──
:deep(.el-pagination) {
  --el-pagination-hover-color: var(--accent-color, #7849ff);
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: var(--accent-color, #7849ff);
}
</style>
