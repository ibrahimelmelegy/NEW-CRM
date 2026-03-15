<template lang="pug">
.api-marketplace-page.p-6(class="md:p-8")
  //- Page Header
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary)")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #22c55e, #10b981)")
          Icon(name="ph:plugs-bold" size="22" style="color: white")
        | {{ $t('apiMarketplace.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('apiMarketplace.subtitle') }}

    .flex.items-center.gap-3
      el-button(
        size="large"
        type="primary"
        @click="refreshData"
        :loading="loading"
        class="!bg-[#22c55e] !border-none !rounded-xl hover:!bg-[#16a34a]"
      )
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-2 {{ $t('apiMarketplace.refresh') }}

  //- KPI Cards
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

  //- Tabs
  el-tabs(v-model="activeTab")

    //- Tab 1: Marketplace
    el-tab-pane(:label="$t('apiMarketplace.marketplace')" name="marketplace")
      //- Filters
      .flex.items-center.gap-4.mb-6(class="flex-col md:flex-row")
        el-input(
          v-model="marketplaceSearch"
          :placeholder="$t('apiMarketplace.searchConnectors')"
          prefix-icon="Search"
          clearable
          size="large"
          class="max-w-xs"
        )
        el-select(
          v-model="categoryFilter"
          :placeholder="$t('apiMarketplace.allCategories')"
          clearable
          size="large"
          style="width: 200px"
        )
          el-option(:label="$t('apiMarketplace.allCategories')" value="")
          el-option(:label="$t('apiMarketplace.categoryCRM')" value="CRM")
          el-option(:label="$t('apiMarketplace.categoryCommunication')" value="Communication")
          el-option(:label="$t('apiMarketplace.categoryPayment')" value="Payment")
          el-option(:label="$t('apiMarketplace.categoryAutomation')" value="Automation")
          el-option(:label="$t('apiMarketplace.categoryAnalytics')" value="Analytics")
        .flex-1
        .text-sm(style="color: var(--text-muted)") {{ filteredConnectors.length }} {{ $t('apiMarketplace.connectorsAvailable') }}

      //- Connector Cards Grid
      .grid.gap-5(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
        .connector-card(v-for="connector in filteredConnectors" :key="connector.id")
          .glass-card.p-5.rounded-2xl.h-full
            .flex.items-start.gap-4.mb-4
              .connector-icon-circle(:style="{ background: connector.color + '18' }")
                Icon(:name="connector.icon" size="26" :style="{ color: connector.color }")
              .flex-1.min-w-0
                .flex.items-center.gap-2.mb-1
                  h4.font-bold.truncate(style="color: var(--text-primary)") {{ connector.name }}
                  el-tag(size="small" effect="plain" round) {{ connector.category }}
                p.text-xs.line-clamp-2(style="color: var(--text-muted)") {{ connector.description }}
            .flex.items-center.justify-between.mt-auto
              .flex.items-center.gap-2
                span.text-amber-400.text-sm {{ getStarDisplay(connector.rating) }}
                span.text-xs(style="color: var(--text-muted)") {{ connector.rating.toFixed(1) }}
              el-button(
                type="primary"
                size="small"
                @click="installConnector(connector)"
                :disabled="isInstalled(connector.id)"
                class="!rounded-lg"
              )
                Icon(name="ph:download-simple-bold" size="14" class="mr-1")
                | {{ isInstalled(connector.id) ? $t('apiMarketplace.installed') : $t('apiMarketplace.install') }}

      //- Empty state
      .text-center.py-12(v-if="filteredConnectors.length === 0")
        Icon(name="ph:puzzle-piece-bold" size="48" style="color: var(--text-muted)")
        p.mt-3.text-sm(style="color: var(--text-muted)") {{ $t('apiMarketplace.noConnectorsFound') }}

    //- Tab 2: Installed
    el-tab-pane(:label="$t('apiMarketplace.installedTab')" name="installed")
      .glass-card.rounded-2xl.overflow-hidden
        .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--border-default)")
          h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('apiMarketplace.installedIntegrations') }}
          .text-sm(style="color: var(--text-muted)") {{ installedIntegrations.length }} {{ $t('apiMarketplace.active') }}

        el-table(:data="installedIntegrations" style="width: 100%" stripe)
          el-table-column(:label="$t('apiMarketplace.name')" min-width="200")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-xl.flex.items-center.justify-center(:style="{ background: row.color + '18' }")
                  Icon(:name="row.icon" size="20" :style="{ color: row.color }")
                .font-semibold(style="color: var(--text-primary)") {{ row.name }}

          el-table-column(:label="$t('apiMarketplace.status')" width="140" align="center")
            template(#default="{ row }")
              el-tag(
                :type="row.status === 'Connected' ? 'success' : row.status === 'Error' ? 'danger' : 'warning'"
                size="small"
                effect="dark"
                round
              ) {{ row.status }}

          el-table-column(:label="$t('apiMarketplace.health')" width="100" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center
                .health-dot(:class="'health-' + row.healthStatus")

          el-table-column(:label="$t('apiMarketplace.lastSynced')" width="160")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-secondary)") {{ row.lastSynced }}

          el-table-column(:label="$t('apiMarketplace.apiCallsCol')" width="130" align="right")
            template(#default="{ row }")
              span.text-sm.font-mono(style="color: var(--text-primary)") {{ formatNumber(row.apiCalls) }}

          el-table-column(:label="$t('apiMarketplace.actions')" width="200" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-button(link size="small" @click="configureIntegration(row)")
                  Icon(name="ph:gear-bold" size="16" style="color: var(--text-muted)")
                el-button(link size="small" @click="togglePause(row)")
                  Icon(:name="row.status === 'Paused' ? 'ph:play-bold' : 'ph:pause-bold'" size="16" style="color: var(--text-muted)")
                el-button(link size="small" @click="disconnectIntegration(row)")
                  Icon(name="ph:plug-bold" size="16" class="text-red-400")

          template(#empty)
            .py-8.text-center
              Icon(name="ph:plugs-connected-bold" size="40" style="color: var(--text-muted)")
              p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('apiMarketplace.noInstalledIntegrations') }}

    //- Tab 3: API Keys
    el-tab-pane(:label="$t('apiMarketplace.apiKeysTab')" name="api-keys")
      .glass-card.rounded-2xl.overflow-hidden
        .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--border-default)")
          h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('apiMarketplace.apiKeyManagement') }}
          el-button(type="primary" size="default" @click="showGenerateKeyDialog = true" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !rounded-xl")
            Icon(name="ph:plus-bold" size="16" class="mr-1")
            | {{ $t('apiMarketplace.generateNewKey') }}

        el-table(:data="apiKeys" style="width: 100%" stripe)
          el-table-column(:label="$t('apiMarketplace.keyName')" min-width="160")
            template(#default="{ row }")
              .font-semibold(style="color: var(--text-primary)") {{ row.name }}

          el-table-column(:label="$t('apiMarketplace.key')" min-width="260")
            template(#default="{ row }")
              .flex.items-center.gap-2
                code.text-xs.font-mono.px-2.py-1.rounded-lg(style="background: var(--bg-input); color: var(--text-secondary)") {{ row.visible ? row.fullKey : row.maskedKey }}
                el-button(link size="small" @click="toggleKeyVisibility(row)")
                  Icon(:name="row.visible ? 'ph:eye-slash-bold' : 'ph:eye-bold'" size="14" style="color: var(--text-muted)")
                el-button(link size="small" @click="copyKey(row)")
                  Icon(name="ph:copy-bold" size="14" style="color: var(--text-muted)")

          el-table-column(:label="$t('apiMarketplace.created')" width="130")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-secondary)") {{ row.created }}

          el-table-column(:label="$t('apiMarketplace.lastUsed')" width="130")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-secondary)") {{ row.lastUsed }}

          el-table-column(:label="$t('apiMarketplace.requests30d')" width="120" align="right")
            template(#default="{ row }")
              span.text-sm.font-mono(style="color: var(--text-primary)") {{ formatNumber(row.requests30d) }}

          el-table-column(:label="$t('apiMarketplace.statusCol')" width="110" align="center")
            template(#default="{ row }")
              el-tag(
                :type="row.status === 'Active' ? 'success' : 'danger'"
                size="small"
                effect="dark"
                round
              ) {{ row.status }}

          el-table-column(:label="$t('apiMarketplace.actions')" width="120" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-button(link size="small" @click="revokeKey(row)" :disabled="row.status === 'Revoked'")
                  Icon(name="ph:prohibit-bold" size="16" class="text-red-400")
                el-button(link size="small" @click="deleteKey(row)")
                  Icon(name="ph:trash-bold" size="16" class="text-red-400")

          template(#empty)
            .py-8.text-center
              Icon(name="ph:key-bold" size="40" style="color: var(--text-muted)")
              p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('apiMarketplace.noApiKeys') }}

    //- Tab 4: Usage Analytics
    el-tab-pane(:label="$t('apiMarketplace.usageAnalytics')" name="usage")
      //- API Call Volume Chart
      .glass-card.p-6.rounded-2xl.mb-6
        .flex.items-center.justify-between.mb-4
          h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('apiMarketplace.apiCallVolume') }}
          .flex.items-center.gap-3
            .flex.items-center.gap-1
              .w-3.h-3.rounded-sm(style="background: #3b82f6")
              span.text-xs(style="color: var(--text-muted)") {{ $t('apiMarketplace.successful') }}
            .flex.items-center.gap-1
              .w-3.h-3.rounded-sm(style="background: #ef4444")
              span.text-xs(style="color: var(--text-muted)") {{ $t('apiMarketplace.failed') }}
        ClientOnly
          VChart(v-if="apiCallVolumeOption" :option="apiCallVolumeOption" autoresize style="height: 320px")

      //- Top Endpoints Table
      .glass-card.rounded-2xl.overflow-hidden.mb-6
        .p-5(style="border-bottom: 1px solid var(--border-default)")
          h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('apiMarketplace.topEndpoints') }}
        el-table(:data="topEndpoints" style="width: 100%" stripe)
          el-table-column(:label="$t('apiMarketplace.endpoint')" min-width="280")
            template(#default="{ row }")
              code.text-xs.font-mono(style="color: var(--text-primary)") {{ row.path }}
          el-table-column(:label="$t('apiMarketplace.method')" width="110" align="center")
            template(#default="{ row }")
              el-tag(
                :type="getMethodTagType(row.method)"
                size="small"
                effect="dark"
                round
              ) {{ row.method }}
          el-table-column(:label="$t('apiMarketplace.calls')" width="120" align="right" sortable prop="calls")
            template(#default="{ row }")
              span.text-sm.font-mono(style="color: var(--text-primary)") {{ formatNumber(row.calls) }}
          el-table-column(:label="$t('apiMarketplace.avgLatency')" width="130" align="right")
            template(#default="{ row }")
              span.text-sm.font-mono(:style="{ color: row.avgLatency > 500 ? '#ef4444' : row.avgLatency > 200 ? '#f59e0b' : '#22c55e' }") {{ row.avgLatency }}ms
          el-table-column(:label="$t('apiMarketplace.errorRate')" width="120" align="right")
            template(#default="{ row }")
              span.text-sm.font-mono(:style="{ color: row.errorRate > 5 ? '#ef4444' : row.errorRate > 2 ? '#f59e0b' : '#22c55e' }") {{ row.errorRate }}%

      //- Calls by Integration Bar Chart
      .glass-card.p-6.rounded-2xl.mb-6
        .flex.items-center.justify-between.mb-4
          h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('apiMarketplace.callsByIntegration') }}
        ClientOnly
          VChart(v-if="callsByIntegrationOption" :option="callsByIntegrationOption" autoresize style="height: 320px")

      //- Rate Limit Cards
      h3.text-sm.font-bold.uppercase.mb-4(style="color: var(--text-muted)") {{ $t('apiMarketplace.rateLimits') }}
      .grid.gap-5(class="grid-cols-1 md:grid-cols-3")
        .glass-card.p-5.rounded-2xl(v-for="(limit, idx) in rateLimits" :key="idx")
          .flex.items-center.justify-between.mb-3
            .flex.items-center.gap-2
              Icon(:name="limit.icon" size="18" :style="{ color: limit.color }")
              span.font-semibold.text-sm(style="color: var(--text-primary)") {{ limit.label }}
            span.text-xs.font-mono(style="color: var(--text-muted)") {{ `${formatNumber(limit.current)} / ${formatNumber(limit.max)}` }}
          el-progress(
            :percentage="Math.round((limit.current / limit.max) * 100)"
            :color="getProgressColor(limit.current / limit.max)"
            :stroke-width="10"
            :show-text="true"
          )
          .flex.items-center.justify-between.mt-2
            span.text-xs(style="color: var(--text-muted)") {{ $t('apiMarketplace.resets') }}: {{ limit.resetsIn }}
            span.text-xs.font-semibold(:style="{ color: getProgressColor(limit.current / limit.max) }") {{ Math.round((limit.current / limit.max) * 100) }}%

  //- Generate API Key Dialog
  el-dialog(
    v-model="showGenerateKeyDialog"
    :title="$t('apiMarketplace.generateNewKey')"
    width="560px"
    :close-on-click-modal="false"
  )
    .space-y-5
      .form-group
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('apiMarketplace.keyNameLabel') }}
        el-input(
          v-model="newKeyForm.name"
          :placeholder="$t('apiMarketplace.keyNamePlaceholder')"
          size="large"
        )
      .form-group
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('apiMarketplace.permissions') }}
        .grid.gap-2(class="grid-cols-2")
          el-checkbox(v-model="newKeyForm.permissions.read") {{ $t('apiMarketplace.permRead') }}
          el-checkbox(v-model="newKeyForm.permissions.write") {{ $t('apiMarketplace.permWrite') }}
          el-checkbox(v-model="newKeyForm.permissions.delete") {{ $t('apiMarketplace.permDelete') }}
          el-checkbox(v-model="newKeyForm.permissions.admin") {{ $t('apiMarketplace.permAdmin') }}
      .form-group
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('apiMarketplace.expiry') }}
        el-select(v-model="newKeyForm.expiry" size="large" style="width: 100%")
          el-option(:label="$t('apiMarketplace.expiry30d')" value="30")
          el-option(:label="$t('apiMarketplace.expiry60d')" value="60")
          el-option(:label="$t('apiMarketplace.expiry90d')" value="90")
          el-option(:label="$t('apiMarketplace.expiryNever')" value="never")

      //- Generated Key Display
      .p-4.rounded-xl(v-if="generatedKey" style="background: var(--bg-input); border: 1px solid var(--border-default)")
        label.block.text-xs.font-bold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('apiMarketplace.yourApiKey') }}
        .flex.items-center.gap-2
          code.text-sm.font-mono.flex-1.break-all(style="color: #22c55e") {{ generatedKey }}
          el-button(size="small" @click="copyGeneratedKey" class="!rounded-lg")
            Icon(name="ph:copy-bold" size="14")
        p.text-xs.mt-2(style="color: #f59e0b")
          Icon(name="ph:warning-bold" size="12" class="mr-1")
          | {{ $t('apiMarketplace.keyWarning') }}

    template(#footer)
      el-button(@click="closeGenerateKeyDialog") {{ $t('apiMarketplace.close') }}
      el-button(
        v-if="!generatedKey"
        type="primary"
        @click="generateKey"
        :loading="generatingKey"
        class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none"
      ) {{ $t('apiMarketplace.generate') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import VChart from 'vue-echarts';
import { graphic } from 'echarts/core';
import logger from '~/utils/logger'

definePageMeta({ title: 'API Marketplace' });

const { t } = useI18n();

// --- State ---
const loading = ref(false);
const activeTab = ref('marketplace');
const marketplaceSearch = ref('');
const categoryFilter = ref('');
const showGenerateKeyDialog = ref(false);
const generatingKey = ref(false);
const generatedKey = ref('');

// --- KPI Cards ---
const kpiCards = computed(() => [
  {
    label: t('apiMarketplace.activeIntegrations'),
    value: installedIntegrations.value.filter(i => i.status === 'Connected').length,
    icon: 'ph:plugs-connected-bold',
    color: '#22c55e',
    trend: 12.5
  },
  {
    label: t('apiMarketplace.apiCalls30d'),
    value: formatNumber(284650),
    icon: 'ph:chart-line-up-bold',
    color: '#3b82f6',
    trend: 8.3
  },
  {
    label: t('apiMarketplace.availableConnectors'),
    value: connectors.value.length,
    icon: 'ph:puzzle-piece-bold',
    color: '#7849ff',
    trend: 6.7
  },
  {
    label: t('apiMarketplace.webhookDeliveries'),
    value: formatNumber(42180),
    icon: 'ph:webhooks-logo-bold',
    color: '#f59e0b',
    trend: -2.1
  }
]);

// --- Connector Catalog ---
const connectors = ref([
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    icon: 'ph:slack-logo-bold',
    color: '#E01E5A',
    description: 'Send notifications, create channels, and sync conversations with your CRM workflows.',
    rating: 4.8
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'Communication',
    icon: 'ph:phone-bold',
    color: '#F22F46',
    description: 'SMS, voice, and WhatsApp messaging for lead engagement and customer support.',
    rating: 4.6
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payment',
    icon: 'ph:credit-card-bold',
    color: '#635BFF',
    description: 'Payment processing, subscription management, and invoice automation.',
    rating: 4.9
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automation',
    icon: 'ph:lightning-bold',
    color: '#FF4F00',
    description: 'Connect thousands of apps with automated workflows and triggers.',
    rating: 4.7
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    icon: 'ph:circles-three-bold',
    color: '#FF7A59',
    description: 'Bi-directional contact sync, deal pipeline integration, and marketing automation.',
    rating: 4.5
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'Communication',
    icon: 'ph:envelope-simple-bold',
    color: '#FFE01B',
    description: 'Email campaign management, audience sync, and marketing analytics.',
    rating: 4.4
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    icon: 'ph:cloud-bold',
    color: '#00A1E0',
    description: 'Enterprise CRM sync with lead routing, opportunity tracking, and custom field mapping.',
    rating: 4.7
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'Payment',
    icon: 'ph:calculator-bold',
    color: '#2CA01C',
    description: 'Accounting integration for invoices, expenses, and financial reporting.',
    rating: 4.3
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'Automation',
    icon: 'ph:kanban-bold',
    color: '#0052CC',
    description: 'Project management and issue tracking with CRM ticket escalation.',
    rating: 4.5
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    category: 'Communication',
    icon: 'ph:google-logo-bold',
    color: '#4285F4',
    description: 'Gmail, Calendar, Drive, and Contacts integration for seamless productivity.',
    rating: 4.8
  },
  {
    id: 'ms-teams',
    name: 'Microsoft Teams',
    category: 'Communication',
    icon: 'ph:microsoft-teams-logo-bold',
    color: '#6264A7',
    description: 'Team chat notifications, meeting scheduling, and collaboration.',
    rating: 4.4
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'Payment',
    icon: 'ph:storefront-bold',
    color: '#96BF48',
    description: 'E-commerce sync for orders, customers, and product catalog management.',
    rating: 4.6
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'Communication',
    icon: 'ph:paper-plane-tilt-bold',
    color: '#1A82E2',
    description: 'Transactional email delivery, templates, and email analytics.',
    rating: 4.5
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'CRM',
    icon: 'ph:headset-bold',
    color: '#03363D',
    description: 'Support ticket sync, customer satisfaction tracking, and agent assignment.',
    rating: 4.4
  },
  {
    id: 'intercom',
    name: 'Intercom',
    category: 'Analytics',
    icon: 'ph:chat-dots-bold',
    color: '#286EFA',
    description: 'Live chat, user engagement analytics, and product tours integration.',
    rating: 4.6
  }
]);

const filteredConnectors = computed(() => {
  return connectors.value.filter(c => {
    const matchSearch =
      !marketplaceSearch.value ||
      c.name.toLowerCase().includes(marketplaceSearch.value.toLowerCase()) ||
      c.description.toLowerCase().includes(marketplaceSearch.value.toLowerCase());
    const matchCategory = !categoryFilter.value || c.category === categoryFilter.value;
    return matchSearch && matchCategory;
  });
});

// --- Installed Integrations ---
const installedIntegrations = ref([
  {
    id: 'slack',
    name: 'Slack',
    icon: 'ph:slack-logo-bold',
    color: '#E01E5A',
    status: 'Connected',
    healthStatus: 'green',
    lastSynced: '2 minutes ago',
    apiCalls: 34520
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: 'ph:credit-card-bold',
    color: '#635BFF',
    status: 'Connected',
    healthStatus: 'green',
    lastSynced: '5 minutes ago',
    apiCalls: 78430
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: 'ph:circles-three-bold',
    color: '#FF7A59',
    status: 'Error',
    healthStatus: 'red',
    lastSynced: '3 hours ago',
    apiCalls: 12650
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    icon: 'ph:google-logo-bold',
    color: '#4285F4',
    status: 'Connected',
    healthStatus: 'green',
    lastSynced: '1 minute ago',
    apiCalls: 95200
  },
  {
    id: 'zapier',
    name: 'Zapier',
    icon: 'ph:lightning-bold',
    color: '#FF4F00',
    status: 'Paused',
    healthStatus: 'yellow',
    lastSynced: '2 days ago',
    apiCalls: 8340
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    icon: 'ph:paper-plane-tilt-bold',
    color: '#1A82E2',
    status: 'Connected',
    healthStatus: 'green',
    lastSynced: '15 minutes ago',
    apiCalls: 55510
  },
  {
    id: 'jira',
    name: 'Jira',
    icon: 'ph:kanban-bold',
    color: '#0052CC',
    status: 'Connected',
    healthStatus: 'green',
    lastSynced: '30 minutes ago',
    apiCalls: 4200
  }
]);

// --- API Keys ---
const apiKeys = ref([
  {
    id: 1,
    name: 'Production API Key',
    maskedKey: 'ldy_prod_••••••••••••••••3f8a',
    fullKey: 'ldy_prod_sk_4b7e9c2d1a8f6e3b5c7d9e1f3a8b3f8a',
    visible: false,
    created: 'Jan 15, 2026',
    lastUsed: 'Feb 28, 2026',
    requests30d: 145200,
    status: 'Active'
  },
  {
    id: 2,
    name: 'Staging API Key',
    maskedKey: 'ldy_stg_••••••••••••••••7d2c',
    fullKey: 'ldy_stg_sk_9f3a7b2e4c8d1f6a5b3e7c9d2a4f7d2c',
    visible: false,
    created: 'Feb 01, 2026',
    lastUsed: 'Feb 27, 2026',
    requests30d: 32450,
    status: 'Active'
  },
  {
    id: 3,
    name: 'Webhook Signing Key',
    maskedKey: 'ldy_whk_••••••••••••••••8e5b',
    fullKey: 'ldy_whk_sk_2d5f8a3c7e1b4d6f9a2c5e8b3d7f8e5b',
    visible: false,
    created: 'Dec 10, 2025',
    lastUsed: 'Feb 28, 2026',
    requests30d: 42180,
    status: 'Active'
  },
  {
    id: 4,
    name: 'Legacy v1 Key',
    maskedKey: 'ldy_v1_••••••••••••••••1a9f',
    fullKey: 'ldy_v1_sk_7c2e5b8d3f1a4c6e9b2d5f8a3c7e1a9f',
    visible: false,
    created: 'Aug 22, 2025',
    lastUsed: 'Jan 05, 2026',
    requests30d: 0,
    status: 'Revoked'
  },
  {
    id: 5,
    name: 'Mobile App Key',
    maskedKey: 'ldy_mob_••••••••••••••••4c6e',
    fullKey: 'ldy_mob_sk_5a8d2f6b9c3e7a1d4f8b2e5c9a3d4c6e',
    visible: false,
    created: 'Nov 18, 2025',
    lastUsed: 'Feb 28, 2026',
    requests30d: 64820,
    status: 'Active'
  }
]);

// --- New Key Form ---
const newKeyForm = reactive({
  name: '',
  permissions: {
    read: true,
    write: false,
    delete: false,
    admin: false
  },
  expiry: '90'
});

// --- Top Endpoints ---
const topEndpoints = ref([
  { path: '/api/v2/leads', method: 'GET', calls: 45230, avgLatency: 82, errorRate: 0.3 },
  { path: '/api/v2/contacts', method: 'GET', calls: 38140, avgLatency: 95, errorRate: 0.5 },
  { path: '/api/v2/deals', method: 'POST', calls: 22680, avgLatency: 145, errorRate: 1.2 },
  { path: '/api/v2/leads', method: 'PUT', calls: 18920, avgLatency: 118, errorRate: 0.8 },
  { path: '/api/v2/activities', method: 'POST', calls: 15340, avgLatency: 132, errorRate: 1.5 },
  { path: '/api/v2/webhooks/deliver', method: 'POST', calls: 42180, avgLatency: 65, errorRate: 2.8 },
  { path: '/api/v2/contacts/search', method: 'POST', calls: 28750, avgLatency: 210, errorRate: 0.9 },
  { path: '/api/v2/deals', method: 'DELETE', calls: 3420, avgLatency: 98, errorRate: 0.4 },
  { path: '/api/v2/files/upload', method: 'POST', calls: 8960, avgLatency: 450, errorRate: 3.2 },
  { path: '/api/v2/reports/generate', method: 'POST', calls: 5120, avgLatency: 820, errorRate: 4.1 }
]);

// --- Rate Limits ---
const rateLimits = ref([
  { label: t('apiMarketplace.apiRequestsPerMin'), icon: 'ph:clock-bold', color: '#3b82f6', current: 342, max: 500, resetsIn: '45s' },
  { label: t('apiMarketplace.dailyApiCalls'), icon: 'ph:calendar-bold', color: '#22c55e', current: 184650, max: 500000, resetsIn: '6h 14m' },
  { label: t('apiMarketplace.webhookDeliveriesPerHour'), icon: 'ph:webhooks-logo-bold', color: '#f59e0b', current: 890, max: 1000, resetsIn: '22m' }
]);

// --- Chart: API Call Volume (30 day trend) ---
const apiCallVolumeOption = computed(() => {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const successData = [
    8200, 7800, 9100, 8500, 9400, 10200, 11300, 10800, 9600, 8900, 9800, 10500, 11200, 10100, 9700, 10300, 11500, 12100, 11800, 10600, 9500, 10200,
    11000, 11600, 10900, 11400, 12300, 11700, 10800, 11200
  ];
  const failedData = [
    120, 95, 180, 110, 145, 200, 160, 130, 170, 140, 155, 210, 190, 125, 135, 175, 220, 195, 150, 165, 140, 180, 205, 170, 145, 190, 230, 185, 160,
    175
  ];

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 30, 45, 0.9)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
    },
    grid: { top: 20, right: 20, bottom: 30, left: 55, containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#a1a1aa', fontSize: 10, interval: 4 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11 }
    },
    series: [
      {
        name: t('apiMarketplace.successful'),
        type: 'line',
        data: successData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        lineStyle: { color: '#3b82f6', width: 2.5 },
        itemStyle: { color: '#3b82f6', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
          ])
        }
      },
      {
        name: t('apiMarketplace.failed'),
        type: 'line',
        data: failedData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        lineStyle: { color: '#ef4444', width: 2.5 },
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

// --- Chart: Calls by Integration (horizontal bar) ---
const callsByIntegrationOption = computed(() => {
  const sorted = [...installedIntegrations.value].sort((a, b) => b.apiCalls - a.apiCalls);
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(30, 30, 45, 0.9)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
    },
    grid: { top: 10, right: 40, bottom: 10, left: 120, containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11 }
    },
    yAxis: {
      type: 'category',
      data: sorted.map(i => i.name),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#a1a1aa', fontSize: 12 },
      inverse: true
    },
    series: [
      {
        type: 'bar',
        data: sorted.map(i => ({
          value: i.apiCalls,
          itemStyle: {
            color: new graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: i.color + 'CC' },
              { offset: 1, color: i.color }
            ]),
            borderRadius: [0, 6, 6, 0]
          }
        })),
        barWidth: 20,
        label: {
          show: true,
          position: 'right',
          color: '#a1a1aa',
          fontSize: 11,
          formatter: (params: unknown) => formatNumber(params.value)
        }
      }
    ]
  };
});

// --- Helpers ---
function formatNumber(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n) : n;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return num.toLocaleString();
  return String(num);
}

function getStarDisplay(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '\u2605'.repeat(full) + (half ? '\u2606' : '') + '\u2606'.repeat(empty);
}

function isInstalled(connectorId: string): boolean {
  return installedIntegrations.value.some(i => i.id === connectorId);
}

function getMethodTagType(method: string): 'success' | 'warning' | 'info' | 'danger' | '' {
  switch (method) {
    case 'GET':
      return 'success';
    case 'POST':
      return '';
    case 'PUT':
      return 'warning';
    case 'DELETE':
      return 'danger';
    default:
      return 'info';
  }
}

function getProgressColor(ratio: number): string {
  if (ratio >= 0.9) return '#ef4444';
  if (ratio >= 0.7) return '#f59e0b';
  return '#22c55e';
}

// --- Actions ---
function installConnector(connector: unknown) {
  if (isInstalled(connector.id)) return;
  installedIntegrations.value.push({
    id: connector.id,
    name: connector.name,
    icon: connector.icon,
    color: connector.color,
    status: 'Connected',
    healthStatus: 'green',
    lastSynced: 'Just now',
    apiCalls: 0
  });
  ElNotification({
    type: 'success',
    title: t('apiMarketplace.success'),
    message: `${connector.name} ${t('apiMarketplace.installedSuccess')}`
  });
}

function configureIntegration(row: unknown) {
  ElMessage.info(`${t('apiMarketplace.configuring')}: ${row.name}`);
}

function togglePause(row: unknown) {
  if (row.status === 'Paused') {
    row.status = 'Connected';
    row.healthStatus = 'green';
    ElMessage.success(`${row.name} ${t('apiMarketplace.resumed')}`);
  } else {
    row.status = 'Paused';
    row.healthStatus = 'yellow';
    ElMessage.warning(`${row.name} ${t('apiMarketplace.paused')}`);
  }
}

function disconnectIntegration(row: unknown) {
  ElMessageBox.confirm(`${t('apiMarketplace.disconnectConfirm')} ${row.name}?`, t('apiMarketplace.warning'), {
    type: 'warning',
    confirmButtonText: t('apiMarketplace.disconnect'),
    cancelButtonText: t('apiMarketplace.cancel')
  })
    .then(() => {
      const idx = installedIntegrations.value.findIndex(i => i.id === row.id);
      if (idx > -1) installedIntegrations.value.splice(idx, 1);
      ElNotification({ type: 'success', title: t('apiMarketplace.success'), message: `${row.name} ${t('apiMarketplace.disconnected')}` });
    })
    .catch((error: unknown) => {
      logger.error('Operation failed:', error);
    });
}

function toggleKeyVisibility(key: unknown) {
  key.visible = !key.visible;
}

function copyKey(key: unknown) {
  navigator.clipboard.writeText(key.fullKey);
  ElMessage.success(t('apiMarketplace.keyCopied'));
}

function revokeKey(key: unknown) {
  ElMessageBox.confirm(t('apiMarketplace.revokeConfirm'), t('apiMarketplace.warning'), { type: 'warning' })
    .then(() => {
      key.status = 'Revoked';
      ElNotification({ type: 'success', title: t('apiMarketplace.success'), message: `${key.name} ${t('apiMarketplace.revoked')}` });
    })
    .catch((error: unknown) => {
      logger.error('Operation failed:', error);
    });
}

function deleteKey(key: unknown) {
  ElMessageBox.confirm(t('apiMarketplace.deleteKeyConfirm'), t('apiMarketplace.warning'), { type: 'warning' } as unknown)
    .then(() => {
      const idx = apiKeys.value.findIndex(k => k.id === key.id);
      if (idx > -1) apiKeys.value.splice(idx, 1);
      ElNotification({ type: 'success', title: t('apiMarketplace.success'), message: t('apiMarketplace.keyDeleted') });
    })
    .catch((error: unknown) => {
      logger.error('Operation failed:', error);
    });
}

function generateKey() {
  if (!newKeyForm.name.trim()) {
    ElMessage.warning(t('apiMarketplace.enterKeyName'));
    return;
  }
  generatingKey.value = true;
  setTimeout(() => {
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    generatedKey.value = `ldy_${newKeyForm.name.toLowerCase().replace(/\s+/g, '_').substring(0, 6)}_sk_${randomHex}`;

    const expiryDays = newKeyForm.expiry === 'never' ? null : parseInt(newKeyForm.expiry);
    const perms: string[] = [];
    if (newKeyForm.permissions.read) perms.push('Read');
    if (newKeyForm.permissions.write) perms.push('Write');
    if (newKeyForm.permissions.delete) perms.push('Delete');
    if (newKeyForm.permissions.admin) perms.push('Admin');

    apiKeys.value.unshift({
      id: Date.now(),
      name: newKeyForm.name,
      maskedKey: `${generatedKey.value.substring(0, 12)}${'\\u2022'.repeat(16)}${generatedKey.value.slice(-4)}`,
      fullKey: generatedKey.value,
      visible: false,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never',
      requests30d: 0,
      status: 'Active' as const
    });

    generatingKey.value = false;
    ElNotification({ type: 'success', title: t('apiMarketplace.success'), message: t('apiMarketplace.keyGenerated') });
  }, 1200);
}

function copyGeneratedKey() {
  navigator.clipboard.writeText(generatedKey.value);
  ElMessage.success(t('apiMarketplace.keyCopied'));
}

function closeGenerateKeyDialog() {
  showGenerateKeyDialog.value = false;
  generatedKey.value = '';
  newKeyForm.name = '';
  newKeyForm.permissions = { read: true, write: false, delete: false, admin: false };
  newKeyForm.expiry = '90';
}

async function refreshData() {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    ElMessage.success(t('apiMarketplace.dataRefreshed'));
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.api-marketplace-page {
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
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(34, 197, 94, 0.08);
  }
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  flex-shrink: 0;
}

// Glass Card
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
}

// Connector Cards
.connector-card {
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-3px);

    .glass-card {
      box-shadow: 0 12px 40px rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.2);
    }
  }
}

.connector-icon-circle {
  width: 48px;
  height: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

// Health Dot with pulse animation
.health-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    animation: healthPulse 2s ease-in-out infinite;
  }

  &.health-green {
    background: #22c55e;

    &::after {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
      animation-name: pulseGreen;
    }
  }

  &.health-red {
    background: #ef4444;

    &::after {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
      animation-name: pulseRed;
    }
  }

  &.health-yellow {
    background: #f59e0b;

    &::after {
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5);
      animation-name: pulseYellow;
    }
  }
}

@keyframes pulseGreen {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

@keyframes pulseRed {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

@keyframes pulseYellow {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
}

// Table Styling
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(34, 197, 94, 0.04);
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

// Dialog
:deep(.el-dialog) {
  border-radius: 16px;
}

// Progress bar overrides
:deep(.el-progress-bar__inner) {
  border-radius: 6px;
}

:deep(.el-progress-bar__outer) {
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
}

// Responsive
@media (max-width: 767px) {
  .api-marketplace-page {
    padding: 16px !important;
  }

  .kpi-card {
    padding: 16px;
  }

  .connector-icon-circle {
    width: 40px;
    height: 40px;
    min-width: 40px;
  }
}
</style>
