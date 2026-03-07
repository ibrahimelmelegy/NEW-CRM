<template lang="pug">
.create-task-page.p-8
  //- Back Button
  .flex.items-center.gap-2.mb-6.cursor-pointer(@click="goBack")
    Icon(name="ph:arrow-left-bold" size="20" style="color: var(--text-muted)")
    span.text-sm(style="color: var(--text-muted)") {{ $t('common.back') }}

  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('tasks.createTask') }}

  .max-w-2xl
    .glass-card.p-6
      el-form(:model="form" label-position="top" ref="formRef")
        el-form-item(:label="$t('tasks.form.title')" prop="title" required)
          el-input(v-model="form.title" :placeholder="$t('tasks.form.titlePlaceholder')" size="large")

        el-form-item(:label="$t('tasks.form.description')")
          el-input(v-model="form.description" type="textarea" :rows="4" :placeholder="$t('tasks.form.descriptionPlaceholder')")

        .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
          el-form-item(:label="$t('tasks.form.assignee')")
            el-select(v-model="form.assigneeId" :placeholder="$t('tasks.form.assigneePlaceholder')" filterable clearable style="width: 100%" size="large")
              el-option(v-for="u in users" :key="u.value" :label="u.label" :value="u.value")

          el-form-item(:label="$t('tasks.form.priority')")
            el-select(v-model="form.priority" style="width: 100%" size="large")
              el-option(v-for="p in priorityOptions" :key="p.value" :label="p.label" :value="p.value")

        .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
          el-form-item(:label="$t('tasks.form.dueDate')")
            el-date-picker(v-model="form.dueDate" type="date" style="width: 100%" size="large")

          el-form-item(:label="$t('tasks.form.entityType')")
            el-select(v-model="form.entityType" clearable style="width: 100%" size="large" @change="form.entityId = null")
              el-option(:label="$t('tasks.form.entityTypeLead')" value="lead")
              el-option(:label="$t('tasks.form.entityTypeDeal')" value="deal")
              el-option(:label="$t('tasks.form.entityTypeClient')" value="client")
              el-option(:label="$t('tasks.form.entityTypeOpportunity')" value="opportunity")
              el-option(:label="$t('tasks.form.entityTypeProject')" value="project")

        el-form-item(:label="$t('tasks.form.entityId')" v-if="form.entityType")
          el-input-number(v-model="form.entityId" :min="1" style="width: 100%" size="large")

        .flex.justify-end.gap-3.mt-4
          el-button(size="large" @click="goBack" class="!rounded-xl") {{ $t('common.cancel') }}
          el-button(size="large" type="primary" @click="handleSubmit" :loading="submitting" class="!rounded-xl") {{ $t('tasks.createTask') }}
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElNotification } from 'element-plus';
import { createTask } from '~/composables/useTasks';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Create Task' });

const router = useRouter();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const submitting = ref(false);

const form = reactive({
  title: '',
  description: '',
  assigneeId: null as number | null,
  priority: 'MEDIUM' as string,
  dueDate: null as string | null,
  entityType: '' as string,
  entityId: null as number | null
});

const priorityOptions = [
  { label: t('tasks.priority.LOW'), value: 'LOW' },
  { label: t('tasks.priority.MEDIUM'), value: 'MEDIUM' },
  { label: t('tasks.priority.HIGH'), value: 'HIGH' },
  { label: t('tasks.priority.URGENT'), value: 'URGENT' }
];

// Fetch users
const usersResponse: unknown = await useApiFetch('users');
const users = ref(usersResponse?.body?.docs?.map(u => ({ label: u.name, value: u.id })) || []);

function goBack() {
  router.back();
}

async function handleSubmit() {
  if (!form.title.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }

  submitting.value = true;
  try {
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      priority: form.priority
    };
    if (form.assigneeId) payload.assigneeId = form.assigneeId;
    if (form.dueDate) payload.dueDate = form.dueDate;
    if (form.entityType) payload.entityType = form.entityType;
    if (form.entityId) payload.entityId = form.entityId;

    const response = await createTask(payload);
    if (response?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.created') });
      router.push('/tasks');
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: response?.message || t('common.error') });
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.create-task-page {
  animation: fadeIn 0.5s ease-out;
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
