<template lang="pug">
div
  //- Header
  .flex.items-center.gap-4.mb-8
    el-button(text @click="router.back()")
      el-icon
        ArrowLeft
      span {{ $t('common.back') }}
    .title.font-bold.text-2xl.capitalize {{ $t('support.createTicket') }}

  .glass-card.p-8.animate-entrance(class="max-w-3xl")
    el-form(ref="formRef" :model="form" label-position="top" size="large")
      el-form-item(:label="$t('support.subject')" prop="subject" :rules="[{ required: true, message: $t('support.subjectRequired') }]")
        el-input(v-model="form.subject" :placeholder="$t('support.subject')")

      el-form-item(:label="$t('support.messages')" prop="description")
        el-input(v-model="form.description" type="textarea" :rows="5" :placeholder="$t('support.writeInternalNote')")

      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('support.priority')" prop="priority")
          el-select(v-model="form.priority" :placeholder="$t('support.selectPriority')" class="w-full")
            el-option(v-for="p in priorityOptions" :key="p.value" :value="p.value" :label="p.label")

        el-form-item(:label="$t('support.source')" prop="source")
          el-select(v-model="form.source" :placeholder="$t('support.selectSource')" class="w-full")
            el-option(v-for="s in sourceOptions" :key="s.value" :value="s.value" :label="s.label")

      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('support.category')" prop="categoryId")
          el-select(v-model="form.categoryId" :placeholder="$t('support.selectCategory')" clearable class="w-full")
            el-option(v-for="cat in categories" :key="cat.id" :value="cat.id" :label="cat.name")

        el-form-item(:label="$t('support.assignedTo')" prop="clientId")
          el-select(v-model="form.clientId" :placeholder="$t('support.selectClient')" clearable filterable class="w-full")
            el-option(v-for="c in clients" :key="c.id" :value="c.id" :label="c.clientName")

      el-form-item(:label="$t('support.tags')")
        el-select(
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          :placeholder="$t('support.addTags')"
          class="w-full"
        )

      el-form-item(:label="$t('support.slaDeadline')")
        el-date-picker(
          v-model="form.slaDeadline"
          type="datetime"
          :placeholder="$t('support.selectSlaDeadline')"
          class="!w-full"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss"
        )

      .flex.justify-end.gap-3.mt-6
        el-button(size="large" @click="router.back()") {{ $t('common.cancel') }}
        el-button(type="primary" size="large" @click="handleSubmit" :loading="submitting" class="!rounded-2xl") {{ $t('support.createTicketBtn') }}
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { createTicket, fetchCategories, ticketPriorityOptions, ticketSourceOptions, TicketPriority, TicketSource } from '@/composables/useSupport';
import { useApiFetch } from '@/composables/useApiFetch';

const router = useRouter();
const { t } = useI18n();
const formRef = ref<FormInstance>();
const submitting = ref(false);
const categories = ref<Array<{ id: string; name: string }>>([]);
const clients = ref<Array<{ id: string; clientName: string }>>([]);
const priorityOptions = ticketPriorityOptions;
const sourceOptions = ticketSourceOptions;

const form = reactive({
  subject: '',
  description: '',
  priority: TicketPriority.MEDIUM,
  source: TicketSource.PORTAL,
  categoryId: '',
  clientId: '',
  tags: [] as string[],
  slaDeadline: ''
});

async function loadCategories() {
  const { body, success } = await fetchCategories();
  if (success && body) {
    categories.value = Array.isArray(body) ? body : [];
  }
}

async function loadClients() {
  const { body, success } = await useApiFetch('client?limit=200');
  if (success && body) {
    clients.value = Array.isArray(body) ? body : (body as any)?.docs || [];
  }
}

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const payload: Record<string, any> = {
      subject: form.subject,
      description: form.description || undefined,
      priority: form.priority,
      source: form.source,
      tags: form.tags.length > 0 ? form.tags : undefined
    };

    if (form.categoryId) payload.categoryId = form.categoryId;
    if (form.clientId) payload.clientId = form.clientId;
    if (form.slaDeadline) payload.slaDeadline = form.slaDeadline;

    const { body, success }: any = await createTicket(payload);
    if (success && body) {
      ElNotification({
        type: 'success',
        title: t('common.success'),
        message: `${body.ticketNumber} ${t('support.ticketCreatedMsg')}`
      });
      router.push(`/support/tickets/${body.id}`);
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadClients()]);
});
</script>
