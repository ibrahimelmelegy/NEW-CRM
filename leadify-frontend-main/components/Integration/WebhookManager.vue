<template lang="pug">
.webhook-manager
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h3.text-xl.font-bold(style="color: var(--text-primary)") {{ $t('integrationHub.webhooks.title') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('integrationHub.webhooks.subtitle') }}
    el-button(type="primary" @click="openCreateDialog")
      Icon(name="ph:plus-bold" size="16" class="mr-1")
      span {{ $t('integrationHub.webhooks.add') }}

  //- Webhooks table
  .glass-card.p-0.overflow-hidden(v-if="webhooks.length > 0")
    el-table(
      :data="webhooks"
      style="width: 100%"
      :header-cell-style="{ background: 'var(--glass-bg)', color: 'var(--text-primary)', fontWeight: 600 }"
      :cell-style="{ background: 'transparent', color: 'var(--text-primary)' }"
    )
      el-table-column(:label="$t('integrationHub.webhooks.name')" prop="name" min-width="160")
      el-table-column(:label="$t('integrationHub.webhooks.url')" min-width="220")
        template(#default="{ row }")
          .text-xs.font-mono.truncate(style="max-width: 200px" :title="row.url") {{ row.url }}
      el-table-column(:label="$t('integrationHub.webhooks.events')" min-width="220")
        template(#default="{ row }")
          .flex.flex-wrap.gap-1
            el-tag(
              v-for="evt in row.events"
              :key="evt"
              size="small"
              :type="eventTagType(evt)"
              effect="plain"
              round
            ) {{ evt }}
      el-table-column(:label="$t('integrationHub.webhooks.status')" width="110" align="center")
        template(#default="{ row }")
          el-switch(
            :model-value="row.status === 'ACTIVE'"
            :loading="togglingId === row.id"
            @change="toggleStatus(row)"
          )
      el-table-column(:label="$t('integrationHub.webhooks.lastTriggered')" width="160")
        template(#default="{ row }")
          span.text-xs(v-if="row.lastTriggeredAt") {{ formatDate(row.lastTriggeredAt) }}
          span.text-xs(v-else style="color: var(--text-muted)") {{ $t('integrationHub.webhooks.never') }}
      el-table-column(:label="$t('integrationHub.webhooks.failures')" width="90" align="center")
        template(#default="{ row }")
          el-tag(
            v-if="row.failureCount > 0"
            type="danger"
            size="small"
            effect="plain"
            round
          ) {{ row.failureCount }}
          span.text-xs(v-else style="color: var(--text-muted)") 0
      el-table-column(:label="$t('integrationHub.webhooks.actions')" width="140" align="center" fixed="right")
        template(#default="{ row }")
          .flex.gap-1.justify-center
            el-tooltip(:content="$t('integrationHub.webhooks.test')")
              el-button(link type="primary" :loading="testingId === row.id" @click="testWebhook(row)")
                Icon(name="ph:play-bold" size="16")
            el-tooltip(:content="$t('integrationHub.webhooks.edit')")
              el-button(link type="warning" @click="openEditDialog(row)")
                Icon(name="ph:pencil-simple-bold" size="16")
            el-tooltip(:content="$t('integrationHub.webhooks.delete')")
              el-button(link type="danger" @click="confirmDelete(row)")
                Icon(name="ph:trash-bold" size="16")

  //- Empty state
  .glass-card.p-12.text-center(v-else)
    Icon(name="ph:webhooks-logo-bold" size="48" style="color: var(--text-muted); margin: 0 auto;")
    p.mt-4.text-lg.font-medium(style="color: var(--text-muted)") {{ $t('integrationHub.webhooks.empty') }}
    p.mt-1.text-sm(style="color: var(--text-muted)") {{ $t('integrationHub.webhooks.emptyHint') }}
    el-button.mt-4(type="primary" @click="openCreateDialog") {{ $t('integrationHub.webhooks.addFirst') }}

  //- Create / Edit dialog
  el-dialog(
    v-model="dialogVisible"
    :title="editingWebhook ? $t('integrationHub.webhooks.editTitle') : $t('integrationHub.webhooks.createTitle')"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
  )
    el-form(ref="formRef" :model="form" :rules="formRules" label-position="top")
      el-form-item(:label="$t('integrationHub.webhooks.nameLabel')" prop="name")
        el-input(v-model="form.name" :placeholder="$t('integrationHub.webhooks.namePlaceholder')" class="glass-input")

      el-form-item(:label="$t('integrationHub.webhooks.urlLabel')" prop="url")
        el-input(v-model="form.url" :placeholder="$t('integrationHub.webhooks.urlPlaceholder')" class="glass-input")

      el-form-item(:label="$t('integrationHub.webhooks.eventsLabel')" prop="events")
        el-select(
          v-model="form.events"
          multiple
          filterable
          :placeholder="$t('integrationHub.webhooks.eventsPlaceholder')"
          style="width: 100%"
        )
          el-option(
            v-for="evt in availableEvents"
            :key="evt"
            :label="evt"
            :value="evt"
          )

      el-form-item(:label="$t('integrationHub.webhooks.secretLabel')")
        .flex.gap-2.w-full
          el-input(v-model="form.secret" readonly class="glass-input")
          el-button(@click="regenerateSecret" type="info" plain)
            Icon(name="ph:arrows-clockwise-bold" size="16")

      el-collapse
        el-collapse-item(:title="$t('integrationHub.webhooks.advancedHeaders')")
          .mb-3(v-for="(header, idx) in form.headersList" :key="idx")
            .flex.gap-2.items-center
              el-input(v-model="header.key" :placeholder="$t('integrationHub.webhooks.headerKey')" class="glass-input" style="flex: 1")
              el-input(v-model="header.value" :placeholder="$t('integrationHub.webhooks.headerValue')" class="glass-input" style="flex: 1")
              el-button(link type="danger" @click="removeHeader(idx)")
                Icon(name="ph:x-bold" size="14")
          el-button(size="small" @click="addHeader") {{ $t('integrationHub.webhooks.addHeader') }}

    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="dialogVisible = false") {{ $t('integrationHub.webhooks.cancel') }}
        el-button(type="primary" :loading="submitting" @click="handleSubmit") {{ editingWebhook ? $t('integrationHub.webhooks.update') : $t('integrationHub.webhooks.create') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

export interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  headers?: Record<string, string>;
  status: 'ACTIVE' | 'INACTIVE';
  lastTriggeredAt?: string;
  failureCount: number;
}

const props = defineProps<{
  webhooks: WebhookItem[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'create', data: any): void;
  (e: 'update', data: { id: string; payload: any }): void;
  (e: 'delete', id: string): void;
  (e: 'test', id: string): void;
  (e: 'toggle', data: { id: string; status: string }): void;
}>();

const { t } = useI18n();
const formRef = ref<FormInstance>();
const dialogVisible = ref(false);
const editingWebhook = ref<WebhookItem | null>(null);
const submitting = ref(false);
const testingId = ref<string | null>(null);
const togglingId = ref<string | null>(null);

const availableEvents = [
  'lead.created',
  'lead.updated',
  'deal.created',
  'deal.updated',
  'deal.won',
  'invoice.created',
  'payment.received',
  'ticket.created',
  'client.created'
];

interface HeaderEntry {
  key: string;
  value: string;
}

const form = ref<{
  name: string;
  url: string;
  events: string[];
  secret: string;
  headersList: HeaderEntry[];
}>({
  name: '',
  url: '',
  events: [],
  secret: '',
  headersList: []
});

const formRules: FormRules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  url: [
    { required: true, message: 'URL is required', trigger: 'blur' },
    { type: 'url', message: 'Please enter a valid URL', trigger: 'blur' }
  ],
  events: [{ required: true, type: 'array', min: 1, message: 'Select at least one event', trigger: 'change' }]
};

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function regenerateSecret() {
  form.value.secret = generateSecret();
}

function openCreateDialog() {
  editingWebhook.value = null;
  form.value = {
    name: '',
    url: '',
    events: [],
    secret: generateSecret(),
    headersList: []
  };
  dialogVisible.value = true;
}

function openEditDialog(webhook: WebhookItem) {
  editingWebhook.value = webhook;
  const headersList: HeaderEntry[] = [];
  if (webhook.headers) {
    for (const [key, value] of Object.entries(webhook.headers)) {
      headersList.push({ key, value });
    }
  }
  form.value = {
    name: webhook.name,
    url: webhook.url,
    events: [...webhook.events],
    secret: webhook.secret,
    headersList
  };
  dialogVisible.value = true;
}

function addHeader() {
  form.value.headersList.push({ key: '', value: '' });
}

function removeHeader(idx: number) {
  form.value.headersList.splice(idx, 1);
}

function headersToObject(): Record<string, string> | null {
  const valid = form.value.headersList.filter(h => h.key.trim() && h.value.trim());
  if (valid.length === 0) return null;
  const obj: Record<string, string> = {};
  for (const h of valid) {
    obj[h.key.trim()] = h.value.trim();
  }
  return obj;
}

async function handleSubmit() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      name: form.value.name,
      url: form.value.url,
      events: form.value.events,
      secret: form.value.secret,
      headers: headersToObject()
    };

    if (editingWebhook.value) {
      emit('update', { id: editingWebhook.value.id, payload });
    } else {
      emit('create', payload);
    }

    dialogVisible.value = false;
  } finally {
    submitting.value = false;
  }
}

async function testWebhook(webhook: WebhookItem) {
  testingId.value = webhook.id;
  emit('test', webhook.id);
  setTimeout(() => {
    testingId.value = null;
  }, 3000);
}

async function toggleStatus(webhook: WebhookItem) {
  togglingId.value = webhook.id;
  const newStatus = webhook.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  emit('toggle', { id: webhook.id, status: newStatus });
  setTimeout(() => {
    togglingId.value = null;
  }, 1000);
}

async function confirmDelete(webhook: WebhookItem) {
  try {
    await ElMessageBox.confirm(t('integrationHub.webhooks.deleteConfirm', { name: webhook.name }), t('integrationHub.webhooks.deleteTitle'), {
      confirmButtonText: t('integrationHub.webhooks.confirmDelete'),
      cancelButtonText: t('integrationHub.webhooks.cancel'),
      type: 'warning'
    });
    emit('delete', webhook.id);
  } catch {
    // User cancelled
  }
}

function eventTagType(event: string): string {
  if (event.startsWith('lead')) return '';
  if (event.startsWith('deal')) return 'success';
  if (event.startsWith('invoice') || event.startsWith('payment')) return 'warning';
  if (event.startsWith('ticket')) return 'danger';
  if (event.startsWith('client')) return 'info';
  return 'info';
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}
</script>

<style lang="scss" scoped>
.webhook-manager {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
