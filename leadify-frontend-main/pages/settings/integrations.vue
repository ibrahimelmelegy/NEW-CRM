<template lang="pug">
.integrations-page.p-8
  .header.mb-8
    h2(class="text-3xl font-bold text-primary mb-2") System Integrations
    p.text-muted Manage system-wide API keys and real-time service connections.

  .grid.grid-cols-1.gap-8(class="md:grid-cols-2")
    //- Google Calendar Integration
    .glass-card.p-6.integration-card
      .flex.items-center.gap-4.mb-6
        .icon-box.bg-blue-500.bg-opacity-10
          Icon(name="logos:google-calendar" size="32")
        div
          h3.text-xl.font-bold Google Calendar
          p.text-xs.text-muted Direct bi-directional sync
      
      .form-group.mb-4
        label.block.text-sm.font-medium.mb-2 Client ID
        el-input(v-model="config.google.clientId" placeholder="Enter Google Client ID" class="glass-input")
      
      .form-group.mb-6
        label.block.text-sm.font-medium.mb-2 Client Secret
        el-input(v-model="config.google.clientSecret" type="password" show-password placeholder="Enter Google Client Secret" class="glass-input")
      
      .flex.justify-between.items-center
        el-tag(:type="status.google ? 'success' : 'info'" effect="dark") {{ status.google ? 'Connected' : 'Disconnected' }}
        el-button(type="primary" :loading="loading.google" @click="saveIntegration('google')" class="premium-btn") Save & Test

    //- Microsoft Outlook Integration
    .glass-card.p-6.integration-card
      .flex.items-center.gap-4.mb-6
        .icon-box.bg-blue-600.bg-opacity-10
          Icon(name="logos:microsoft-icon" size="32")
        div
          h3.text-xl.font-bold Outlook Calendar
          p.text-xs.text-muted Microsoft Graph API Sync
      
      .form-group.mb-4
        label.block.text-sm.font-medium.mb-2 Application ID
        el-input(v-model="config.outlook.clientId" placeholder="Enter Azure App ID" class="glass-input")
      
      .form-group.mb-6
        label.block.text-sm.font-medium.mb-2 Directory (Tenant) ID
        el-input(v-model="config.outlook.tenantId" placeholder="Enter Tenant ID" class="glass-input")
      
      .flex.justify-between.items-center
        el-tag(:type="status.outlook ? 'success' : 'info'" effect="dark") {{ status.outlook ? 'Connected' : 'Disconnected' }}
        el-button(type="primary" :loading="loading.outlook" @click="saveIntegration('outlook')" class="premium-btn") Save & Test

    //- WhatsApp Business API
    .glass-card.p-6.integration-card
      .flex.items-center.gap-4.mb-6
        .icon-box.bg-emerald-500.bg-opacity-10
          Icon(name="logos:whatsapp-icon" size="32")
        div
          h3.text-xl.font-bold WhatsApp Business
          p.text-xs.text-muted Automated messaging & notifications
      
      .form-group.mb-4
        label.block.text-sm.font-medium.mb-2 Phone Number ID
        el-input(v-model="config.whatsapp.phoneNumberId" placeholder="Enter Phone ID" class="glass-input")
      
      .form-group.mb-6
        label.block.text-sm.font-medium.mb-2 Access Token
        el-input(v-model="config.whatsapp.accessToken" type="password" show-password placeholder="Enter Permanent Access Token" class="glass-input")
      
      .flex.justify-between.items-center
        el-tag(:type="status.whatsapp ? 'success' : 'info'" effect="dark") {{ status.whatsapp ? 'Connected' : 'Disconnected' }}
        el-button(type="primary" :loading="loading.whatsapp" @click="saveIntegration('whatsapp')" class="premium-btn") Save & Test

    //- OpenAI API
    .glass-card.p-6.integration-card
      .flex.items-center.gap-4.mb-6
        .icon-box.bg-neutral-800.bg-opacity-10
          Icon(name="logos:openai-icon" size="32")
        div
          h3.text-xl.font-bold OpenAI Intelligence
          p.text-xs.text-muted Powers Lead Scoring & Summarizers
      
      .form-group.mb-6
        label.block.text-sm.font-medium.mb-2 API Key
        el-input(v-model="config.openai.apiKey" type="password" show-password placeholder="sk-..." class="glass-input")
      
      .flex.justify-between.items-center
        el-tag(:type="status.openai ? 'success' : 'info'" effect="dark") {{ status.openai ? 'Connected' : 'Disconnected' }}
        el-button(type="primary" :loading="loading.openai" @click="saveIntegration('openai')" class="premium-btn") Save & Test

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
        console.error("Fetch integrations failed", e);
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
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
