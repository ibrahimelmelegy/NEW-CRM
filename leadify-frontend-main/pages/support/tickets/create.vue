<template lang="pug">
div
  //- Header
  .flex.items-center.gap-4.mb-8
    el-button(text @click="router.back()")
      el-icon
        ArrowLeft
      span Back
    .title.font-bold.text-2xl.capitalize Create Support Ticket

  .glass-card.p-8.animate-entrance(class="max-w-3xl")
    el-form(ref="formRef" :model="form" label-position="top" size="large")
      el-form-item(label="Subject" prop="subject" :rules="[{ required: true, message: 'Subject is required' }]")
        el-input(v-model="form.subject" placeholder="Brief summary of the issue")

      el-form-item(label="Description" prop="description")
        el-input(v-model="form.description" type="textarea" :rows="5" placeholder="Detailed description of the issue...")

      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(label="Priority" prop="priority")
          el-select(v-model="form.priority" placeholder="Select priority" class="w-full")
            el-option(v-for="p in priorityOptions" :key="p.value" :value="p.value" :label="p.label")

        el-form-item(label="Source" prop="source")
          el-select(v-model="form.source" placeholder="Select source" class="w-full")
            el-option(v-for="s in sourceOptions" :key="s.value" :value="s.value" :label="s.label")

      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(label="Category" prop="categoryId")
          el-select(v-model="form.categoryId" placeholder="Select category" clearable class="w-full")
            el-option(v-for="cat in categories" :key="cat.id" :value="cat.id" :label="cat.name")

        el-form-item(label="Client" prop="clientId")
          el-select(v-model="form.clientId" placeholder="Select client" clearable filterable class="w-full")
            el-option(v-for="c in clients" :key="c.id" :value="c.id" :label="c.clientName")

      el-form-item(label="Tags")
        el-select(
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="Add tags..."
          class="w-full"
        )

      el-form-item(label="SLA Deadline")
        el-date-picker(
          v-model="form.slaDeadline"
          type="datetime"
          placeholder="Select SLA deadline"
          class="!w-full"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss"
        )

      .flex.justify-end.gap-3.mt-6
        el-button(size="large" @click="router.back()") Cancel
        el-button(type="primary" size="large" @click="handleSubmit" :loading="submitting" class="!rounded-2xl") Create Ticket
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import type { FormInstance } from 'element-plus';
import {
  createTicket,
  fetchCategories,
  ticketPriorityOptions,
  ticketSourceOptions,
  TicketPriority,
  TicketSource
} from '@/composables/useSupport';
import { useApiFetch } from '@/composables/useApiFetch';

const router = useRouter();
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

    const { body, success } = await createTicket(payload);
    if (success && body) {
      ElNotification({
        type: 'success',
        title: 'Created',
        message: `Ticket ${body.ticketNumber} created successfully`
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
