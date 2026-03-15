<template lang="pug">
.email-accounts-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('navigation.emailAccounts') }}
    p(style="color: var(--text-muted)") {{ $t('emailAccounts.subtitle') }}

  .max-w-3xl
    //- Connect Button
    .flex.justify-end.mb-6
      el-button(type="primary" @click="connectDialogVisible = true" class="!rounded-xl")
        Icon.mr-1(name="ph:plus-bold" size="16")
        | {{ $t('emailAccounts.connectAccount') }}

    //- Loading
    .flex.items-center.justify-center.py-20(v-if="loading")
      el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

    template(v-else)
      //- Accounts List
      .space-y-4(v-if="accounts.length")
        .glass-card.p-5(v-for="account in accounts" :key="account.id")
          .flex.items-center.justify-between
            .flex.items-center.gap-4
              .icon-box(:style="{ background: providerColor(account.provider) + '1a' }")
                Icon(:name="providerIcon(account.provider)" size="28" :style="{ color: providerColor(account.provider) }")
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ account.email }}
                .flex.items-center.gap-2.mt-1
                  el-tag(size="small" :type="account.isActive ? 'success' : 'info'") {{ account.isActive ? $t('emailAccounts.connected') : $t('emailAccounts.disconnected') }}
                  span.text-xs(style="color: var(--text-muted)" v-if="account.lastSyncAt") {{ $t('emailAccounts.lastSync') }}: {{ formatDate(account.lastSyncAt) }}
            el-button(type="danger" plain size="small" @click="handleDisconnect(account)" class="!rounded-lg")
              Icon.mr-1(name="ph:x-bold" size="14")
              | {{ $t('emailAccounts.disconnect') }}

      .text-center.py-12(v-else)
        Icon(name="ph:envelope-bold" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('emailAccounts.noAccounts') }}

  //- Connect Dialog
  el-dialog(v-model="connectDialogVisible" :title="$t('emailAccounts.connectAccount')" width="500px")
    el-form(:model="connectForm" label-position="top")
      el-form-item(:label="$t('emailAccounts.provider')" required)
        el-select(v-model="connectForm.provider" style="width: 100%")
          el-option(:label="$t('emailAccounts.gmail')" value="gmail")
          el-option(:label="$t('emailAccounts.outlook')" value="outlook")
          el-option(:label="$t('emailAccounts.imap')" value="imap")
          el-option(:label="$t('emailAccounts.smtp')" value="smtp")
      el-form-item(:label="$t('emailAccounts.email')" required)
        el-input(v-model="connectForm.email" :placeholder="$t('emailAccounts.emailPlaceholder')")
      template(v-if="connectForm.provider === 'imap' || connectForm.provider === 'smtp'")
        el-form-item(:label="$t('emailAccounts.host')")
          el-input(v-model="connectForm.host" :placeholder="$t('emailAccounts.hostPlaceholder')")
        .grid.gap-4(class="grid-cols-2")
          el-form-item(:label="$t('emailAccounts.port')")
            el-input-number(v-model="connectForm.port" :min="1" style="width: 100%")
          el-form-item(:label="$t('emailAccounts.password')")
            el-input(v-model="connectForm.password" type="password" :placeholder="$t('emailAccounts.appPassword')")
    template(#footer)
      el-button(@click="connectDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleConnect" :loading="connecting") {{ $t('emailAccounts.connect') }}
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import { fetchEmailAccounts, connectEmailAccount, disconnectEmailAccount } from '~/composables/useEmailIntegration';
import type { EmailAccount } from '~/composables/useEmailIntegration';
import logger from '~/utils/logger'

definePageMeta({ title: 'Email Accounts' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const connecting = ref(false);
const connectDialogVisible = ref(false);
const accounts = ref<EmailAccount[]>([]);

const connectForm = reactive({
  provider: 'gmail',
  email: '',
  host: '',
  port: 993,
  password: ''
});

// Load accounts
try {
  accounts.value = await fetchEmailAccounts();
} catch (e) {
  logger.error('Failed to load email accounts', e);
} finally {
  loading.value = false;
}

function providerIcon(provider: string) {
  const map: Record<string, string> = {
    gmail: 'ph:google-logo-bold',
    outlook: 'ph:microsoft-outlook-logo-bold',
    imap: 'ph:envelope-bold',
    smtp: 'ph:paper-plane-tilt-bold'
  };
  return map[provider] || 'ph:envelope-bold';
}

function providerColor(provider: string) {
  const map: Record<string, string> = {
    gmail: '#ea4335',
    outlook: '#0078d4',
    imap: '#7849ff',
    smtp: '#22c55e'
  };
  return map[provider] || '#7849ff';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function handleConnect() {
  if (!connectForm.email) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  connecting.value = true;
  try {
    const payload: Record<string, unknown> = {
      provider: connectForm.provider,
      email: connectForm.email
    };
    if (connectForm.provider === 'imap' || connectForm.provider === 'smtp') {
      payload.settings = { host: connectForm.host, port: connectForm.port, password: connectForm.password };
    }
    const res = await connectEmailAccount(payload);
    if (res?.success) {
      accounts.value = await fetchEmailAccounts();
      connectDialogVisible.value = false;
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    connecting.value = false;
  }
}

async function handleDisconnect(account: EmailAccount) {
  try {
    await ElMessageBox.confirm(t('common.confirmAction'), t('common.warning'), { type: 'warning' });
    await disconnectEmailAccount(account.id);
    accounts.value = await fetchEmailAccounts();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}
</script>

<style lang="scss" scoped>
.email-accounts-page {
  animation: fadeIn 0.5s ease-out;
}

.icon-box {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
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
