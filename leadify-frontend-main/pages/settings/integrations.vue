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

  //- Tab navigation
  el-tabs(v-model="activeTab" type="border-card" class="hub-tabs")
    //- Tab 1: Marketplace
    el-tab-pane(:label="$t('integrationHub.tabs.marketplace')" name="marketplace")
      template(#label)
        .flex.items-center.gap-2
          Icon(name="ph:storefront-bold" size="16")
          span {{ $t('integrationHub.tabs.marketplace') }}
      IntegrationMarketplace(
        :integrations="hub.allIntegrations.value"
        @configure="openConfigDialog($event)"
        @manage="openConfigDialog($event)"
      )

    //- Tab 2: Configured (Legacy cards)
    el-tab-pane(:label="$t('integrationHub.tabs.configured')" name="configured")
      template(#label)
        .flex.items-center.gap-2
          Icon(name="ph:gear-bold" size="16")
          span {{ $t('integrationHub.tabs.configured') }}
      .grid.grid-cols-1.gap-8(class="md:grid-cols-2")
        //- Google Calendar Integration
        .glass-card.p-6.integration-card
          .flex.items-center.gap-4.mb-6
            .icon-box.bg-blue-500.bg-opacity-10
              Icon(name="logos:google-calendar" size="32")
            div
              h3.text-xl.font-bold {{ $t('integrations.google.title') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('integrations.google.subtitle') }}
          .form-group.mb-4
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.google.clientId') }}
            el-input(v-model="config.google.clientId" :placeholder="$t('integrations.google.clientIdPlaceholder')" class="glass-input")
          .form-group.mb-6
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.google.clientSecret') }}
            el-input(v-model="config.google.clientSecret" type="password" show-password :placeholder="$t('integrations.google.clientSecretPlaceholder')" class="glass-input")
          .flex.justify-between.items-center
            el-tag(:type="legacyStatus.google ? 'success' : 'info'" effect="dark") {{ legacyStatus.google ? $t('integrations.status.connected') : $t('integrations.status.disconnected') }}
            el-button(type="primary" :loading="legacyLoading.google" @click="saveIntegration('google')" class="premium-btn") {{ $t('integrations.saveAndTest') }}

        //- Microsoft Outlook
        .glass-card.p-6.integration-card
          .flex.items-center.gap-4.mb-6
            .icon-box.bg-blue-600.bg-opacity-10
              Icon(name="logos:microsoft-icon" size="32")
            div
              h3.text-xl.font-bold {{ $t('integrations.outlook.title') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('integrations.outlook.subtitle') }}
          .form-group.mb-4
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.outlook.appId') }}
            el-input(v-model="config.outlook.clientId" :placeholder="$t('integrations.outlook.appIdPlaceholder')" class="glass-input")
          .form-group.mb-6
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.outlook.tenantId') }}
            el-input(v-model="config.outlook.tenantId" :placeholder="$t('integrations.outlook.tenantIdPlaceholder')" class="glass-input")
          .flex.justify-between.items-center
            el-tag(:type="legacyStatus.outlook ? 'success' : 'info'" effect="dark") {{ legacyStatus.outlook ? $t('integrations.status.connected') : $t('integrations.status.disconnected') }}
            el-button(type="primary" :loading="legacyLoading.outlook" @click="saveIntegration('outlook')" class="premium-btn") {{ $t('integrations.saveAndTest') }}

        //- WhatsApp
        .glass-card.p-6.integration-card
          .flex.items-center.gap-4.mb-6
            .icon-box.bg-emerald-500.bg-opacity-10
              Icon(name="logos:whatsapp-icon" size="32")
            div
              h3.text-xl.font-bold {{ $t('integrations.whatsapp.title') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('integrations.whatsapp.subtitle') }}
          .form-group.mb-4
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.whatsapp.phoneId') }}
            el-input(v-model="config.whatsapp.phoneNumberId" :placeholder="$t('integrations.whatsapp.phoneIdPlaceholder')" class="glass-input")
          .form-group.mb-6
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.whatsapp.accessToken') }}
            el-input(v-model="config.whatsapp.accessToken" type="password" show-password :placeholder="$t('integrations.whatsapp.accessTokenPlaceholder')" class="glass-input")
          .flex.justify-between.items-center
            el-tag(:type="legacyStatus.whatsapp ? 'success' : 'info'" effect="dark") {{ legacyStatus.whatsapp ? $t('integrations.status.connected') : $t('integrations.status.disconnected') }}
            el-button(type="primary" :loading="legacyLoading.whatsapp" @click="saveIntegration('whatsapp')" class="premium-btn") {{ $t('integrations.saveAndTest') }}

        //- OpenAI
        .glass-card.p-6.integration-card
          .flex.items-center.gap-4.mb-6
            .icon-box(style="background-color: rgba(120, 73, 255, 0.1)")
              Icon(name="logos:openai-icon" size="32")
            div
              h3.text-xl.font-bold {{ $t('integrations.openai.title') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('integrations.openai.subtitle') }}
          .form-group.mb-6
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.openai.apiKey') }}
            el-input(v-model="config.openai.apiKey" type="password" show-password :placeholder="$t('integrations.openai.apiKeyPlaceholder')" class="glass-input")
          .flex.justify-between.items-center
            el-tag(:type="legacyStatus.openai ? 'success' : 'info'" effect="dark") {{ legacyStatus.openai ? $t('integrations.status.connected') : $t('integrations.status.disconnected') }}
            el-button(type="primary" :loading="legacyLoading.openai" @click="saveIntegration('openai')" class="premium-btn") {{ $t('integrations.saveAndTest') }}

        //- ERPNext
        .glass-card.p-6.integration-card
          .flex.items-center.gap-4.mb-6
            .icon-box(style="background-color: rgba(0, 140, 255, 0.1)")
              Icon(name="ph:database-bold" size="32" style="color: #008cff")
            div
              h3.text-xl.font-bold {{ $t('integrations.erpnext.title') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('integrations.erpnext.subtitle') }}
          .form-group.mb-4
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.erpnext.baseUrl') }}
            el-input(v-model="config.erpnext.baseUrl" :placeholder="$t('integrations.erpnext.baseUrlPlaceholder')" class="glass-input")
          .form-group.mb-4
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.erpnext.apiKey') }}
            el-input(v-model="config.erpnext.apiKey" type="password" show-password :placeholder="$t('integrations.erpnext.apiKeyPlaceholder')" class="glass-input")
          .form-group.mb-6
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.erpnext.apiSecret') }}
            el-input(v-model="config.erpnext.apiSecret" type="password" show-password :placeholder="$t('integrations.erpnext.apiSecretPlaceholder')" class="glass-input")
          .flex.justify-between.items-center
            el-tag(:type="legacyStatus.erpnext ? 'success' : 'info'" effect="dark") {{ legacyStatus.erpnext ? $t('integrations.status.connected') : $t('integrations.status.disconnected') }}
            .flex.gap-2
              el-button(:loading="legacyLoading.erpnext" @click="testLegacyConnection('erpnext')" class="premium-btn-secondary") {{ $t('integrations.testConnection') }}
              el-button(type="primary" :loading="legacyLoading.erpnext" @click="saveIntegration('erpnext')" class="premium-btn") {{ $t('integrations.saveAndTest') }}

        //- Brevo
        .glass-card.p-6.integration-card
          .flex.items-center.gap-4.mb-6
            .icon-box(style="background-color: rgba(0, 150, 100, 0.1)")
              Icon(name="ph:envelope-simple-bold" size="32" style="color: #009664")
            div
              h3.text-xl.font-bold {{ $t('integrations.brevo.title') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('integrations.brevo.subtitle') }}
          .form-group.mb-6
            label.block.text-sm.font-medium.mb-2 {{ $t('integrations.brevo.apiKey') }}
            el-input(v-model="config.brevo.apiKey" type="password" show-password :placeholder="$t('integrations.brevo.apiKeyPlaceholder')" class="glass-input")
          .flex.justify-between.items-center
            el-tag(:type="legacyStatus.brevo ? 'success' : 'info'" effect="dark") {{ legacyStatus.brevo ? $t('integrations.status.connected') : $t('integrations.status.disconnected') }}
            el-button(type="primary" :loading="legacyLoading.brevo" @click="saveIntegration('brevo')" class="premium-btn") {{ $t('integrations.saveAndTest') }}

    //- Tab 3: Webhooks
    el-tab-pane(:label="$t('integrationHub.tabs.webhooks')" name="webhooks")
      template(#label)
        .flex.items-center.gap-2
          Icon(name="ph:webhooks-logo-bold" size="16")
          span {{ $t('integrationHub.tabs.webhooks') }}
      IntegrationWebhookManager(
        :webhooks="hub.webhooks.value"
        :loading="hub.webhooksLoading.value"
        @create="handleCreateWebhook"
        @update="handleUpdateWebhook"
        @delete="handleDeleteWebhook"
        @test="handleTestWebhook"
        @toggle="handleToggleWebhook"
      )

  //- Config dialog (for hub marketplace integrations)
  IntegrationConfigForm(
    v-model="configDialogVisible"
    :integration="selectedIntegration"
    :is-configured="!!selectedIntegration?.isConfigured"
    :existing-config="selectedIntegration?.existingConfig"
    @save="handleConfigSave"
    @test="handleConfigTest"
    @disconnect="handleConfigDisconnect"
  )
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useIntegrations, type MergedIntegration } from '~/composables/useIntegrations';

definePageMeta({
  middleware: 'permissions',
  permission: 'VIEW_SETTINGS'
});

const hub = useIntegrations();
const activeTab = ref('marketplace');

// ─── Config dialog state ─────────────────────────────────────────────────────
const configDialogVisible = ref(false);
const selectedIntegration = ref<MergedIntegration | null>(null);

const connectedCount = computed(() => {
  return hub.allIntegrations.value.filter(i => i.isConfigured).length;
});

// ─── Legacy integration state (Tab 2) ────────────────────────────────────────
type Provider = 'google' | 'outlook' | 'whatsapp' | 'openai' | 'erpnext' | 'brevo';

const config = ref<Record<string, any>>({
  google: { clientId: '', clientSecret: '' },
  outlook: { clientId: '', tenantId: '', clientSecret: '' },
  whatsapp: { phoneNumberId: '', accessToken: '' },
  openai: { apiKey: '' },
  erpnext: { baseUrl: '', apiKey: '', apiSecret: '' },
  brevo: { apiKey: '' }
});

const legacyStatus = ref<Record<string, boolean>>({
  google: false, outlook: false, whatsapp: false,
  openai: false, erpnext: false, brevo: false
});

const legacyLoading = ref<Record<string, boolean>>({
  google: false, outlook: false, whatsapp: false,
  openai: false, erpnext: false, brevo: false
});

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    fetchLegacyIntegrations(),
    hub.fetchCatalog(),
    hub.fetchConfigured(),
    hub.fetchWebhooks()
  ]);
});

// ─── Legacy integration methods ──────────────────────────────────────────────
const fetchLegacyIntegrations = async () => {
  try {
    const response: any = await useApiFetch('integrations');
    if (response.success && response.body) {
      response.body.forEach((item: any) => {
        if (config.value[item.provider]) {
          config.value[item.provider] = { ...config.value[item.provider], ...item.config };
          legacyStatus.value[item.provider] = item.isActive;
        }
      });
    }
  } catch (e) {
    console.error('Fetch integrations failed', e);
  }
};

const saveIntegration = async (provider: Provider) => {
  legacyLoading.value[provider] = true;
  try {
    const response: any = await useApiFetch('integrations', 'POST', {
      provider,
      config: config.value[provider],
      isActive: true,
      systemWide: true
    });
    if (response.success) {
      ElNotification.success(`${provider} integration saved successfully`);
      legacyStatus.value[provider] = true;
    }
  } catch (err) {
    ElNotification.error(`Failed to save ${provider} integration`);
  } finally {
    legacyLoading.value[provider] = false;
  }
};

const testLegacyConnection = async (provider: Provider) => {
  legacyLoading.value[provider] = true;
  try {
    const response: any = await useApiFetch(`integrations/${provider}/test`, 'POST', config.value[provider]);
    if (response.success) {
      ElNotification.success(`${provider} connection successful`);
      legacyStatus.value[provider] = true;
    } else {
      ElNotification.warning(response.message || `${provider} connection failed`);
    }
  } catch (err) {
    ElNotification.error(`${provider} connection test failed`);
  } finally {
    legacyLoading.value[provider] = false;
  }
};

// ─── Hub marketplace config dialog ──────────────────────────────────────────
function openConfigDialog(integration: MergedIntegration) {
  selectedIntegration.value = integration;
  configDialogVisible.value = true;
}

async function handleConfigSave(data: { type: string; config: Record<string, any> }) {
  const success = await hub.configure(data.type, data.config);
  if (success) {
    configDialogVisible.value = false;
  }
}

async function handleConfigTest(data: { type: string; config: Record<string, any> }) {
  await hub.testConnection(data.type, data.config);
}

async function handleConfigDisconnect(type: string) {
  const integration = hub.allIntegrations.value.find(i => i.type === type);
  if (integration?.configId) {
    const success = await hub.removeIntegration(integration.configId);
    if (success) {
      configDialogVisible.value = false;
    }
  }
}

// ─── Webhook handlers ────────────────────────────────────────────────────────
async function handleCreateWebhook(data: any) {
  await hub.createWebhook(data);
}

async function handleUpdateWebhook(data: { id: string; payload: any }) {
  await hub.updateWebhook(data.id, data.payload);
}

async function handleDeleteWebhook(id: string) {
  await hub.deleteWebhook(id);
}

async function handleTestWebhook(id: string) {
  await hub.testWebhook(id);
}

async function handleToggleWebhook(data: { id: string; status: string }) {
  await hub.updateWebhook(data.id, { status: data.status });
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

.hub-tabs {
  background: transparent;
  border-color: var(--glass-border-color);
  box-shadow: none;

  :deep(.el-tabs__header) {
    background: var(--glass-bg);
    border-bottom-color: var(--glass-border-color);
  }

  :deep(.el-tabs__content) {
    padding: 24px 0;
    background: transparent;
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted);
    &.is-active {
      color: var(--text-primary);
    }
  }
}

.integration-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }
}

.icon-box {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
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
