<template lang="pug">
.webhooks-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('webhooks.title') }}
    p(style="color: var(--text-muted)") {{ $t('webhooks.subtitle') }}

  .glass-card.p-6
    .flex.justify-between.items-center.mb-6
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('webhooks.endpoints') }}
      el-button(type="primary" @click="openForm()" class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
        Icon(name="ph:plus-bold" size="16" aria-hidden="true")
        span.ml-2 {{ $t('webhooks.addWebhook') }}

    el-skeleton(:rows="3" animated v-if="loading")

    .space-y-3(v-else-if="webhooks.length")
      .webhook-item.p-4.rounded-xl(
        v-for="wh in webhooks"
        :key="wh.id"
        style="background: var(--bg-input); border: 1px solid var(--border-default)"
      )
        .flex.items-start.justify-between
          div
            .flex.items-center.gap-3.mb-2
              span.font-bold(style="color: var(--text-primary)") {{ wh.name }}
              el-tag(:type="wh.isActive ? 'success' : 'danger'" size="small" effect="dark") {{ wh.isActive ? $t('webhooks.active') : $t('webhooks.inactive') }}
              el-tag(v-if="wh.failureCount > 0" type="warning" size="small") {{ wh.failureCount }} {{ $t('webhooks.failures') }}
            p.text-sm.font-mono(style="color: var(--text-muted)") {{ wh.url }}
            .flex.flex-wrap.gap-1.mt-2
              el-tag(v-for="ev in wh.events" :key="ev" size="small" effect="plain") {{ ev }}
          .flex.gap-2
            el-button(link @click="testWebhookHandler(wh.id)" :loading="testing === wh.id" size="small")
              Icon(name="ph:play" size="16" aria-label="Test")
            el-button(link @click="openForm(wh)" size="small")
              Icon(name="ph:pencil" size="16" aria-label="Edit")
            el-button(link @click="removeWebhook(wh.id)" size="small")
              Icon(name="ph:trash" size="16" class="text-red-400" aria-label="Delete")

    .text-center.py-8(v-else)
      Icon(name="ph:webhooks-logo" size="48" style="color: var(--text-muted)" aria-hidden="true")
      p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('webhooks.noWebhooks') }}

  //- Add/Edit Dialog
  el-dialog(v-model="showForm" :title="editingId ? $t('webhooks.editWebhook') : $t('webhooks.addWebhook')" width="560px")
    .space-y-4
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('webhooks.name') }}
        el-input(v-model="formData.name" :placeholder="$t('webhooks.namePlaceholder')")
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('webhooks.url') }}
        el-input(v-model="formData.url" placeholder="https://example.com/webhook")
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('webhooks.events') }}
        el-checkbox-group(v-model="formData.events")
          el-checkbox(v-for="ev in WEBHOOK_EVENTS" :key="ev" :value="ev" :label="ev" class="mb-1")
      el-checkbox(v-model="formData.isActive") {{ $t('webhooks.active') }}

    template(#footer)
      el-button(@click="showForm = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveWebhook" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import type { WebhookConfig } from '~/composables/useWebhooks';
import { fetchWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook, WEBHOOK_EVENTS } from '~/composables/useWebhooks';

definePageMeta({
  middleware: 'permissions',
  permission: 'VIEW_SETTINGS'
});

const webhooks = ref<WebhookConfig[]>([]);
const loading = ref(true);
const saving = ref(false);
const testing = ref<string | null>(null);
const showForm = ref(false);
const editingId = ref<string | null>(null);

const formData = ref({
  name: '',
  url: '',
  events: [] as string[],
  isActive: true
});

onMounted(async () => {
  await loadWebhooks();
});

async function loadWebhooks() {
  loading.value = true;
  try {
    webhooks.value = await fetchWebhooks();
  } finally {
    loading.value = false;
  }
}

function openForm(wh?: WebhookConfig) {
  if (wh) {
    editingId.value = wh.id;
    formData.value = { name: wh.name, url: wh.url, events: [...wh.events], isActive: wh.isActive };
  } else {
    editingId.value = null;
    formData.value = { name: '', url: '', events: [], isActive: true };
  }
  showForm.value = true;
}

async function saveWebhook() {
  if (!formData.value.name || !formData.value.url || !formData.value.events.length) {
    ElNotification({ type: 'warning', title: 'Warning', message: 'Name, URL and at least one event are required' });
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await updateWebhook(editingId.value, formData.value);
    } else {
      await createWebhook(formData.value);
    }
    showForm.value = false;
    await loadWebhooks();
    ElNotification({ type: 'success', title: 'Success', message: 'Webhook saved' });
  } finally {
    saving.value = false;
  }
}

async function removeWebhook(id: string) {
  try {
    await ElMessageBox.confirm('Delete this webhook?', 'Confirm', { type: 'warning' });
    await deleteWebhook(id);
    await loadWebhooks();
    ElNotification({ type: 'success', title: 'Deleted', message: 'Webhook removed' });
  } catch {}
}

async function testWebhookHandler(id: string) {
  testing.value = id;
  try {
    const { success } = await testWebhook(id);
    ElNotification({
      type: success ? 'success' : 'error',
      title: success ? 'Success' : 'Failed',
      message: success ? 'Webhook test successful' : 'Webhook test failed'
    });
  } catch {
    ElNotification({ type: 'error', title: 'Error', message: 'Test failed' });
  } finally {
    testing.value = null;
  }
}
</script>

<style lang="scss" scoped>
.webhooks-page {
  animation: fadeIn 0.4s ease-out;
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
