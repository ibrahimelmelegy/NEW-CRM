<template lang="pug">
.integrations-page.p-8
  .header.mb-8
    h2(class="text-3xl font-bold text-primary mb-2") {{ $t('integrations.title') }}
    p(style="color: var(--text-muted)") {{ $t('integrations.subtitle') }}

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
        el-tag(:type="status.google ? 'success' : 'info'" effect="dark") {{ status.google ? $t('integrations.status.connected') : $t('integrations.status.disconnected') }}
        el-button(type="primary" :loading="loading.google" @click="saveIntegration('google')" class="premium-btn") {{ $t('integrations.saveAndTest') }}

    //- Microsoft Outlook Integration
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
        el-tag(:type="status.outlook ? 'success' : 'info'" effect="dark") {{ status.outlook ? $t('integrations.status.connected') : $t('integrations.status.disconnected') }}
        el-button(type="primary" :loading="loading.outlook" @click="saveIntegration('outlook')" class="premium-btn") {{ $t('integrations.saveAndTest') }}

    //- WhatsApp Business API
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
        el-tag(:type="status.whatsapp ? 'success' : 'info'" effect="dark") {{ status.whatsapp ? $t('integrations.status.connected') : $t('integrations.status.disconnected') }}
        el-button(type="primary" :loading="loading.whatsapp" @click="saveIntegration('whatsapp')" class="premium-btn") {{ $t('integrations.saveAndTest') }}

    //- OpenAI API
    .glass-card.p-6.integration-card
      .flex.items-center.gap-4.mb-6
        .icon-box(style="background-color: var(--color-primary-alpha-10)")
          Icon(name="logos:openai-icon" size="32")
        div
          h3.text-xl.font-bold {{ $t('integrations.openai.title') }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('integrations.openai.subtitle') }}

      .form-group.mb-6
        label.block.text-sm.font-medium.mb-2 {{ $t('integrations.openai.apiKey') }}
        el-input(v-model="config.openai.apiKey" type="password" show-password :placeholder="$t('integrations.openai.apiKeyPlaceholder')" class="glass-input")

      .flex.justify-between.items-center
        el-tag(:type="status.openai ? 'success' : 'info'" effect="dark") {{ status.openai ? $t('integrations.status.connected') : $t('integrations.status.disconnected') }}
        el-button(type="primary" :loading="loading.openai" @click="saveIntegration('openai')" class="premium-btn") {{ $t('integrations.saveAndTest') }}

</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';

definePageMeta({
  middleware: 'permissions',
  permission: 'VIEW_SETTINGS'
});

type Provider = 'google' | 'outlook' | 'whatsapp' | 'openai';

const config = ref<Record<string, any>>({
  google: { clientId: '', clientSecret: '' },
  outlook: { clientId: '', tenantId: '', clientSecret: '' },
  whatsapp: { phoneNumberId: '', accessToken: '' },
  openai: { apiKey: '' }
});

const status = ref<Record<string, boolean>>({
  google: false,
  outlook: false,
  whatsapp: false,
  openai: false
});

const loading = ref<Record<string, boolean>>({
  google: false,
  outlook: false,
  whatsapp: false,
  openai: false
});

onMounted(async () => {
  await fetchIntegrations();
});

const fetchIntegrations = async () => {
  try {
    const response: any = await useApiFetch('integrations');
    if (response.success && response.body) {
      response.body.forEach((item: any) => {
        if (config.value[item.provider]) {
          config.value[item.provider] = { ...config.value[item.provider], ...item.config };
          status.value[item.provider] = item.isActive;
        }
      });
    }
  } catch (e) {
    console.error('Fetch integrations failed', e);
  }
};

const saveIntegration = async (provider: Provider) => {
  loading.value[provider] = true;
  try {
    const response: any = await useApiFetch('integrations', 'POST', {
      provider,
      config: config.value[provider],
      isActive: true,
      systemWide: true
    });

    if (response.success) {
      ElNotification.success(`${provider} integration saved successfully`);
      status.value[provider] = true;
    }
  } catch (err) {
    ElNotification.error(`Failed to save ${provider} integration`);
  } finally {
    loading.value[provider] = false;
  }
};
</script>

<style lang="scss" scoped>
.integrations-page {
  animation: fadeIn 0.5s ease-out;
}

.integration-card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px var(--color-surface-overlay);
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
