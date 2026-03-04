<template lang="pug">
.integrations-page.p-8
  //- Page header
  .header.mb-6
    .flex.items-center.justify-between.flex-wrap.gap-4
      div
        h2(class="text-3xl font-bold" style="color: var(--text-primary)") {{ $t('integrationHub.title') }}
        p(style="color: var(--text-muted)") {{ $t('integrationHub.subtitle') }}
      .flex.gap-2
        .stat-pill
          Icon(name="ph:plugs-connected-bold" size="18" style="color: var(--el-color-success)")
          span {{ connectedCount }} {{ $t('integrationHub.connected') }}
        .stat-pill
          Icon(name="ph:webhooks-logo-bold" size="18" style="color: var(--el-color-primary)")
          span {{ hub.webhooks.value.length }} {{ $t('integrationHub.webhooksCount') }}

  //- Connected Integrations Section (top)
  .mb-8(v-if="connectedIntegrations.length")
    h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
      Icon(name="ph:check-circle-bold" size="20" class="mr-2" style="color: var(--el-color-success)")
      | {{ $t('integrationHub.connectedIntegrations') }}
    .grid.grid-cols-1.gap-4(class="md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")
      .connected-card.p-4.rounded-2xl(
        v-for="intg in connectedIntegrations"
        :key="intg.type"
        style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
      )
        .flex.items-center.gap-3.mb-3
          .integration-icon(:style="{ backgroundColor: intg.color + '20' }")
            span.text-lg.font-bold(:style="{ color: intg.color }") {{ intg.name.charAt(0) }}
          .flex-1.min-w-0
            .font-bold.truncate(style="color: var(--text-primary)") {{ intg.name }}
            .flex.items-center.gap-2.mt-1
              .status-dot(:class="getFlowClass(intg)")
              span.text-xs(style="color: var(--text-muted)") {{ $t('integrationHub.' + getFlowStatus(intg)) }}
        .flex.items-center.justify-between
          .text-xs(style="color: var(--text-muted)")
            Icon(name="ph:clock-bold" size="12" class="mr-1")
            | {{ intg.lastSyncLabel || $t('integrationHub.neverSynced') }}
          .flex.items-center.gap-2
            el-switch(
              :model-value="intg.enabled"
              size="small"
              @change="toggleIntegration(intg)"
            )
            el-button(
              link
              size="small"
              @click="openConfigDialog(intg)"
            )
              Icon(name="ph:gear-bold" size="16")

  //- Search & Category Filter
  .flex.items-center.gap-4.mb-6(class="flex-col md:flex-row")
    el-input(
      v-model="searchQuery"
      :placeholder="$t('integrationHub.marketplace.search')"
      prefix-icon="Search"
      clearable
      class="max-w-md"
    )
    .flex-1
    .flex.gap-2.flex-wrap
      el-button(
        v-for="cat in categories"
        :key="cat.key"
        :type="activeCategory === cat.key ? 'primary' : 'default'"
        size="small"
        round
        @click="activeCategory = cat.key"
        :class="{ 'active-cat': activeCategory === cat.key }"
      ) {{ $t('integrationHub.categories.' + cat.key) }}

  //- Integration Cards Grid
  .grid.grid-cols-1.gap-5(class="md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" v-if="filteredIntegrations.length")
    .integration-card.p-5.rounded-2xl(
      v-for="intg in filteredIntegrations"
      :key="intg.id"
      style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
    )
      .flex.items-start.gap-3.mb-3
        .integration-icon(:style="{ backgroundColor: intg.color + '20' }")
          span.text-lg.font-bold(:style="{ color: intg.color }") {{ intg.name.charAt(0) }}
        .flex-1.min-w-0
          .flex.items-center.gap-2
            span.font-bold.truncate(style="color: var(--text-primary)") {{ intg.name }}
          p.text-xs.mt-1.line-clamp-2(style="color: var(--text-muted)") {{ intg.description }}
      .flex.items-center.justify-between.mt-4
        .flex.items-center.gap-2
          el-tag(
            :type="intg.statusType"
            size="small"
            effect="dark"
            round
          ) {{ $t('integrationHub.statusLabels.' + intg.status) }}
          el-tag(size="small" effect="plain" round) {{ $t('integrationHub.categories.' + intg.category) }}
        el-button(
          v-if="intg.status === 'connected'"
          size="small"
          @click="openConfigDialog(intg)"
          class="!rounded-xl"
        )
          Icon(name="ph:gear-bold" size="14" class="mr-1")
          | {{ $t('integrationHub.card.configure') }}
        el-button(
          v-else-if="intg.status === 'available'"
          type="primary"
          size="small"
          @click="openConfigDialog(intg)"
          class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none"
        )
          Icon(name="ph:plug-bold" size="14" class="mr-1")
          | {{ $t('integrationHub.card.connect') }}
        el-button(
          v-else
          size="small"
          disabled
          class="!rounded-xl"
        ) {{ $t('integrationHub.statusLabels.comingSoon') }}

  //- No results
  .text-center.py-16(v-else)
    Icon(name="ph:plugs-bold" size="64" style="color: var(--text-muted)")
    p.mt-4.text-lg.font-bold(style="color: var(--text-muted)") {{ $t('integrationHub.marketplace.noResults') }}
    p.mt-1.text-sm(style="color: var(--text-muted)") {{ $t('integrationHub.marketplace.noResultsHint') }}

  //- Integration Detail / Configuration Dialog
  el-dialog(
    v-model="configDialogVisible"
    :title="selectedIntegration ? (selectedIntegration.isConfigured ? $t('integrationHub.config.manageTitle', { name: selectedIntegration.name }) : $t('integrationHub.config.configureTitle', { name: selectedIntegration.name })) : ''"
    width="680px"
    destroy-on-close
    class="integration-dialog"
  )
    .space-y-6(v-if="selectedIntegration")
      //- Connection Settings
      el-tabs(v-model="configTab")
        el-tab-pane(:label="$t('integrationHub.configTabs.connection')" name="connection")
          .space-y-4.pt-4
            .form-group(v-for="field in selectedIntegration.configFields" :key="field.key")
              label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ field.label }}
              el-input(
                v-model="configFormData[field.key]"
                :type="field.type === 'password' ? 'password' : 'text'"
                :show-password="field.type === 'password'"
                :placeholder="field.placeholder"
              )

        el-tab-pane(:label="$t('integrationHub.configTabs.syncSettings')" name="sync")
          .space-y-4.pt-4
            .form-group
              label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('integrationHub.syncDirection') }}
              el-radio-group(v-model="syncSettings.direction")
                el-radio(value="bidirectional") {{ $t('integrationHub.bidirectional') }}
                el-radio(value="incoming") {{ $t('integrationHub.incoming') }}
                el-radio(value="outgoing") {{ $t('integrationHub.outgoing') }}
            .form-group
              label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('integrationHub.syncFrequencyLabel') }}
              el-select(v-model="syncSettings.frequency" class="w-full")
                el-option(:label="$t('integrationHub.realTime')" value="realtime")
                el-option(:label="$t('integrationHub.hourly')" value="hourly")
                el-option(:label="$t('integrationHub.daily')" value="daily")
            .form-group
              label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('integrationHub.dataToSync') }}
              el-checkbox-group(v-model="syncSettings.entities")
                el-checkbox(value="contacts" :label="$t('integrationHub.contacts')")
                el-checkbox(value="deals" :label="$t('integrationHub.deals')")
                el-checkbox(value="tasks" :label="$t('integrationHub.tasks')")
                el-checkbox(value="notes" :label="$t('integrationHub.notes')")
                el-checkbox(value="emails" :label="$t('integrationHub.emails')")

        el-tab-pane(:label="$t('integrationHub.configTabs.fieldMapping')" name="mapping")
          .pt-4
            .text-sm.mb-4(style="color: var(--text-muted)") {{ $t('integrationHub.fieldMappingDesc') }}
            el-table(:data="fieldMappings" stripe style="width: 100%")
              el-table-column(:label="$t('integrationHub.crmField')" prop="crmField" width="200")
              el-table-column(:label="$t('integrationHub.externalField')" prop="externalField")
                template(#default="{ row }")
                  el-input(v-model="row.externalField" size="small" :placeholder="$t('integrationHub.mapToField')")
              el-table-column(:label="$t('integrationHub.direction')" width="140")
                template(#default="{ row }")
                  el-select(v-model="row.direction" size="small")
                    el-option(label="<->" value="both")
                    el-option(label="->" value="outgoing")
                    el-option(label="<-" value="incoming")

        el-tab-pane(:label="$t('integrationHub.configTabs.syncLog')" name="log")
          .pt-4
            .text-sm.mb-4(style="color: var(--text-muted)") {{ $t('integrationHub.recentSyncEvents') }}
            .space-y-2
              .flex.items-center.gap-3.p-3.rounded-xl(
                v-for="(log, idx) in syncLogs"
                :key="idx"
                style="background: var(--bg-input); border: 1px solid var(--border-default)"
              )
                Icon(
                  :name="log.success ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'"
                  size="18"
                  :style="{ color: log.success ? '#22c55e' : '#ef4444' }"
                )
                .flex-1
                  .text-sm.font-medium(style="color: var(--text-primary)") {{ log.message }}
                  .text-xs(style="color: var(--text-muted)") {{ log.timestamp }}
                el-tag(:type="log.success ? 'success' : 'danger'" size="small" effect="plain") {{ log.records }} {{ $t('integrationHub.records') }}
            .text-center.py-8(v-if="!syncLogs.length")
              p.text-sm(style="color: var(--text-muted)") {{ $t('integrationHub.noSyncLogs') }}

    template(#footer)
      .flex.items-center.justify-between.w-full
        .flex.gap-2
          el-button(
            v-if="selectedIntegration?.isConfigured"
            type="danger"
            plain
            @click="handleConfigDisconnect(selectedIntegration.type)"
            :loading="disconnecting"
          )
            Icon(name="ph:plug-bold" size="14" class="mr-1")
            | {{ $t('integrationHub.config.disconnect') }}
        .flex.gap-2
          el-button(@click="handleConfigTest({ type: selectedIntegration?.type || '', config: configFormData })" :loading="testingConnection")
            Icon(name="ph:play-bold" size="14" class="mr-1")
            | {{ $t('integrationHub.config.testConnection') }}
          el-button(
            type="primary"
            @click="handleConfigSave({ type: selectedIntegration?.type || '', config: configFormData })"
            :loading="savingConfig"
            class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none"
          )
            Icon(name="ph:floppy-disk-bold" size="14" class="mr-1")
            | {{ $t('integrationHub.config.save') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useIntegrations, type MergedIntegration } from '~/composables/useIntegrations';

definePageMeta({
  middleware: 'permissions',
  permission: 'VIEW_SETTINGS'
});

const { t } = useI18n();
const hub = useIntegrations();

// ─── State ──────────────────────────────────────────────────────────────────
const searchQuery = ref('');
const activeCategory = ref('all');
const configDialogVisible = ref(false);
const selectedIntegration = ref<any>(null);
const configTab = ref('connection');
const configFormData = ref<Record<string, any>>({});
const testingConnection = ref(false);
const savingConfig = ref(false);
const disconnecting = ref(false);

const syncSettings = ref({
  direction: 'bidirectional',
  frequency: 'hourly',
  entities: ['contacts', 'deals']
});

const fieldMappings = ref([
  { crmField: 'First Name', externalField: '', direction: 'both' },
  { crmField: 'Last Name', externalField: '', direction: 'both' },
  { crmField: 'Email', externalField: '', direction: 'both' },
  { crmField: 'Phone', externalField: '', direction: 'both' },
  { crmField: 'Company', externalField: '', direction: 'both' },
  { crmField: 'Deal Value', externalField: '', direction: 'outgoing' },
  { crmField: 'Stage', externalField: '', direction: 'both' },
  { crmField: 'Notes', externalField: '', direction: 'both' }
]);

const syncLogs = ref([
  { success: true, message: 'Contacts synced successfully', timestamp: '2026-02-28 14:30', records: 45 },
  { success: true, message: 'Deals updated from external source', timestamp: '2026-02-28 13:00', records: 12 },
  { success: false, message: 'Rate limit exceeded - retrying in 5 min', timestamp: '2026-02-28 12:15', records: 0 },
  { success: true, message: 'Tasks synchronized', timestamp: '2026-02-28 11:00', records: 8 },
  { success: true, message: 'Contact fields mapped and synced', timestamp: '2026-02-28 10:30', records: 23 }
]);

// ─── Categories ─────────────────────────────────────────────────────────────
const categories = [
  { key: 'all' },
  { key: 'communication' },
  { key: 'email' },
  { key: 'storage' },
  { key: 'accounting' },
  { key: 'marketing' },
  { key: 'support' },
  { key: 'payments' },
  { key: 'social' }
];

// ─── Full integration marketplace catalog ───────────────────────────────────
interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  status: 'connected' | 'available' | 'comingSoon';
  statusType: 'success' | '' | 'info';
  isConfigured: boolean;
  enabled: boolean;
  lastSyncLabel: string;
  flowStatus: string;
  configFields: { key: string; label: string; type: string; placeholder: string; required: boolean }[];
  type: string;
}

const marketplaceIntegrations = ref<IntegrationItem[]>([
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Real-time team messaging and notifications channel',
    category: 'communication',
    color: '#4A154B',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'SLACK',
    configFields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/...', required: true },
      { key: 'channel', label: 'Default Channel', type: 'text', placeholder: '#general', required: false }
    ]
  },
  {
    id: 'ms-teams',
    name: 'Microsoft Teams',
    description: 'Enterprise collaboration and video conferencing',
    category: 'communication',
    color: '#5B5FC7',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'MS_TEAMS',
    configFields: [
      { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'Enter Azure Tenant ID', required: true },
      { key: 'clientId', label: 'App Client ID', type: 'text', placeholder: 'Enter App ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true }
    ]
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video meetings and webinar integration',
    category: 'communication',
    color: '#2D8CFF',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'ZOOM',
    configFields: [
      { key: 'accountId', label: 'Account ID', type: 'text', placeholder: 'Enter Zoom Account ID', required: true },
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter OAuth Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true }
    ]
  },
  {
    id: 'google-meet',
    name: 'Google Meet',
    description: 'Video meetings via Google Workspace',
    category: 'communication',
    color: '#00897B',
    status: 'comingSoon',
    statusType: 'info',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'GOOGLE_MEET',
    configFields: []
  },

  // Email
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Google email integration for sending and tracking',
    category: 'email',
    color: '#EA4335',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'GMAIL',
    configFields: [
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', placeholder: 'Enter Google Client ID', required: true },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true }
    ]
  },
  {
    id: 'outlook-mail',
    name: 'Outlook',
    description: 'Microsoft email and calendar sync',
    category: 'email',
    color: '#0078D4',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'OUTLOOK_MAIL',
    configFields: [
      { key: 'clientId', label: 'App ID', type: 'text', placeholder: 'Enter Azure App ID', required: true },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'Enter Tenant ID', required: true }
    ]
  },
  {
    id: 'brevo',
    name: 'Brevo / SendGrid',
    description: 'Transactional email and campaign delivery',
    category: 'email',
    color: '#009664',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'BREVO',
    configFields: [{ key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'xkeysib-...', required: true }]
  },

  // Storage
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Cloud file storage and document sharing',
    category: 'storage',
    color: '#4285F4',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'GOOGLE_DRIVE',
    configFields: [
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', placeholder: 'Enter Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true }
    ]
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'File sync and cloud storage for documents',
    category: 'storage',
    color: '#0061FF',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'DROPBOX',
    configFields: [{ key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Enter Dropbox Access Token', required: true }]
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Microsoft cloud storage integration',
    category: 'storage',
    color: '#0078D4',
    status: 'comingSoon',
    statusType: 'info',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'ONEDRIVE',
    configFields: []
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    description: 'Enterprise content management and collaboration',
    category: 'storage',
    color: '#036C70',
    status: 'comingSoon',
    statusType: 'info',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'SHAREPOINT',
    configFields: []
  },

  // Accounting
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Accounting and invoicing synchronization',
    category: 'accounting',
    color: '#2CA01C',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'QUICKBOOKS',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter QB Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true },
      { key: 'realmId', label: 'Realm ID', type: 'text', placeholder: 'Enter Company Realm ID', required: true }
    ]
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Cloud accounting and financial management',
    category: 'accounting',
    color: '#13B5EA',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'XERO',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Xero Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true }
    ]
  },
  {
    id: 'freshbooks',
    name: 'FreshBooks',
    description: 'Invoice and expense tracking platform',
    category: 'accounting',
    color: '#0075DD',
    status: 'comingSoon',
    statusType: 'info',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'FRESHBOOKS',
    configFields: []
  },

  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and audience management',
    category: 'marketing',
    color: '#FFE01B',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'MAILCHIMP',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter Mailchimp API Key', required: true },
      { key: 'server', label: 'Server Prefix', type: 'text', placeholder: 'us1', required: true }
    ]
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing automation and CRM sync',
    category: 'marketing',
    color: '#FF7A59',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'HUBSPOT',
    configFields: [{ key: 'accessToken', label: 'Private App Token', type: 'password', placeholder: 'pat-...', required: true }]
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Ad campaign performance and lead attribution',
    category: 'marketing',
    color: '#4285F4',
    status: 'comingSoon',
    statusType: 'info',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'GOOGLE_ADS',
    configFields: []
  },
  {
    id: 'facebook-ads',
    name: 'Facebook Ads',
    description: 'Social advertising and audience targeting',
    category: 'marketing',
    color: '#1877F2',
    status: 'comingSoon',
    statusType: 'info',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'FACEBOOK_ADS',
    configFields: []
  },

  // Support
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support ticketing and helpdesk',
    category: 'support',
    color: '#03363D',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'ZENDESK',
    configFields: [
      { key: 'subdomain', label: 'Subdomain', type: 'text', placeholder: 'your-company', required: true },
      { key: 'apiToken', label: 'API Token', type: 'password', placeholder: 'Enter API Token', required: true },
      { key: 'email', label: 'Admin Email', type: 'text', placeholder: 'admin@company.com', required: true }
    ]
  },
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Customer messaging and engagement platform',
    category: 'support',
    color: '#1F8DED',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'INTERCOM',
    configFields: [{ key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Enter Access Token', required: true }]
  },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    description: 'Cloud-based customer support software',
    category: 'support',
    color: '#2CA5E0',
    status: 'comingSoon',
    statusType: 'info',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'FRESHDESK',
    configFields: []
  },

  // Payments
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Online payment processing and billing',
    category: 'payments',
    color: '#635BFF',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'STRIPE',
    configFields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_...', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_...', required: true }
    ]
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Global payment gateway and invoicing',
    category: 'payments',
    color: '#003087',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'PAYPAL',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter PayPal Client ID', required: true },
      { key: 'clientSecret', label: 'Secret', type: 'password', placeholder: 'Enter PayPal Secret', required: true }
    ]
  },
  {
    id: 'square',
    name: 'Square',
    description: 'POS and payment processing integration',
    category: 'payments',
    color: '#006AFF',
    status: 'comingSoon',
    statusType: 'info',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'SQUARE',
    configFields: []
  },

  // Social
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional networking and lead generation',
    category: 'social',
    color: '#0A66C2',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'LINKEDIN',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter LinkedIn App ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true }
    ]
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    description: 'Social media engagement and monitoring',
    category: 'social',
    color: '#000000',
    status: 'available',
    statusType: '',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'TWITTER',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Enter API Key', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Enter API Secret', required: true },
      { key: 'bearerToken', label: 'Bearer Token', type: 'password', placeholder: 'Enter Bearer Token', required: true }
    ]
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Page management and social engagement',
    category: 'social',
    color: '#1877F2',
    status: 'comingSoon',
    statusType: 'info',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'FACEBOOK',
    configFields: []
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Visual content and social commerce',
    category: 'social',
    color: '#E4405F',
    status: 'comingSoon',
    statusType: 'info',
    isConfigured: false,
    enabled: false,
    lastSyncLabel: '',
    flowStatus: '',
    type: 'INSTAGRAM',
    configFields: []
  }
]);

// ─── Computed ────────────────────────────────────────────────────────────────
const allIntegrations = computed(() => {
  // Merge hub integrations with our marketplace data
  const hubIntegrations = hub.allIntegrations.value;
  const merged = [...marketplaceIntegrations.value];

  hubIntegrations.forEach((hi: MergedIntegration) => {
    const existingIdx = merged.findIndex(m => m.type === hi.type);
    if (existingIdx >= 0) {
      const existing = merged[existingIdx]!;
      existing.isConfigured = hi.isConfigured;
      existing.status = hi.isConfigured ? 'connected' : 'available';
      existing.statusType = hi.isConfigured ? 'success' : '';
      existing.enabled = hi.isConfigured;
      if (hi.isConfigured) {
        existing.lastSyncLabel = t('integrationHub.justNow');
        existing.flowStatus = 'healthy';
      }
      existing.configFields = hi.configFields.map(f => ({
        key: f.key,
        label: f.label,
        type: f.type,
        placeholder: f.placeholder,
        required: f.required
      }));
    } else {
      merged.push({
        id: hi.type.toLowerCase(),
        name: hi.name,
        description: hi.description,
        category: hi.category.toLowerCase(),
        color: '#7849ff',
        status: hi.isConfigured ? 'connected' : 'available',
        statusType: hi.isConfigured ? 'success' : '',
        isConfigured: hi.isConfigured,
        enabled: hi.isConfigured,
        lastSyncLabel: '',
        flowStatus: hi.isConfigured ? 'healthy' : '',
        configFields: hi.configFields.map(f => ({
          key: f.key,
          label: f.label,
          type: f.type,
          placeholder: f.placeholder,
          required: f.required
        })),
        type: hi.type
      });
    }
  });

  return merged;
});

const connectedCount = computed(() => allIntegrations.value.filter(i => i.status === 'connected').length);

const connectedIntegrations = computed(() => allIntegrations.value.filter(i => i.status === 'connected'));

const filteredIntegrations = computed(() => {
  let list = allIntegrations.value;
  if (activeCategory.value !== 'all') {
    list = list.filter(i => i.category === activeCategory.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }
  return list;
});

// ─── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([hub.fetchCatalog(), hub.fetchConfigured(), hub.fetchWebhooks()]);
});

// ─── Methods ────────────────────────────────────────────────────────────────
function getFlowStatus(intg: any): string {
  if (!intg.isConfigured) return 'disconnected';
  return intg.flowStatus || 'healthy';
}

function getFlowClass(intg: any): string {
  const status = getFlowStatus(intg);
  if (status === 'healthy') return 'status-healthy';
  if (status === 'warning') return 'status-warning';
  if (status === 'error') return 'status-error';
  return 'status-disconnected';
}

function toggleIntegration(intg: any) {
  intg.enabled = !intg.enabled;
  ElNotification({
    type: intg.enabled ? 'success' : 'info',
    title: intg.enabled ? t('common.enabled') : t('common.disabled'),
    message: `${intg.name} ${intg.enabled ? t('integrationHub.integrationEnabled') : t('integrationHub.integrationDisabled')}`
  });
}

function openConfigDialog(intg: any) {
  selectedIntegration.value = intg;
  configTab.value = 'connection';
  configFormData.value = {};
  intg.configFields?.forEach((f: any) => {
    configFormData.value[f.key] = '';
  });
  if (intg.existingConfig) {
    Object.assign(configFormData.value, intg.existingConfig);
  }
  configDialogVisible.value = true;
}

async function handleConfigSave(data: { type: string; config: Record<string, any> }) {
  savingConfig.value = true;
  try {
    const success = await hub.configure(data.type, data.config);
    if (success) {
      configDialogVisible.value = false;
      ElNotification.success(t('common.saved'));
    }
  } catch {
    ElNotification.error(t('common.error'));
  } finally {
    savingConfig.value = false;
  }
}

async function handleConfigTest(data: { type: string; config: Record<string, any> }) {
  testingConnection.value = true;
  try {
    await hub.testConnection(data.type, data.config);
  } finally {
    testingConnection.value = false;
  }
}

async function handleConfigDisconnect(type: string) {
  disconnecting.value = true;
  try {
    const integration = hub.allIntegrations.value.find((i: MergedIntegration) => i.type === type);
    if (integration?.configId) {
      const success = await hub.removeIntegration(integration.configId);
      if (success) {
        configDialogVisible.value = false;
      }
    }
  } finally {
    disconnecting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.integrations-page {
  animation: fadeIn 0.5s ease-out;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border-color);
  color: var(--text-primary);
}

.integration-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.integration-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  }
}

.connected-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  &.status-healthy {
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
  }
  &.status-warning {
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
  }
  &.status-error {
    background: #ef4444;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
  }
  &.status-disconnected {
    background: #71717a;
  }
}

.active-cat {
  background: #7849ff !important;
  border-color: #7849ff !important;
  color: white !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.integration-dialog {
  :deep(.el-dialog__body) {
    padding-top: 0;
  }
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
</style>
