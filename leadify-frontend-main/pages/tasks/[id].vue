<template lang="pug">
.task-detail-page.p-8
  //- Back Button
  .flex.items-center.gap-2.mb-6.cursor-pointer(@click="goBack")
    Icon(name="ph:arrow-left-bold" size="20" style="color: var(--text-muted)")
    span.text-sm(style="color: var(--text-muted)") {{ $t('common.back') }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else-if="task")
    //- Header
    .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
      div
        h2.text-3xl.font-bold.mb-2.flex.items-center.gap-x-3(style="color: var(--text-primary)")
          | {{ task.title }}
          el-tag(:type="statusTagType" effect="dark" size="large") {{ $t('tasks.status.' + task.status) }}
        .flex.items-center.gap-4.mt-2
          .flex.items-center.gap-1(v-if="task.priority")
            Icon(name="ph:flag-bold" size="16" :style="{ color: priorityColor }")
            span.text-sm(:style="{ color: priorityColor }") {{ $t('tasks.priority.' + task.priority) }}
          .flex.items-center.gap-1(v-if="task.dueDate")
            Icon(name="ph:calendar-bold" size="16" style="color: var(--text-muted)")
            span.text-sm(style="color: var(--text-muted)") {{ formatDate(task.dueDate) }}

      .flex.items-center.gap-3
        el-button(v-if="task.status !== 'DONE'" type="success" @click="handleComplete" class="!rounded-xl")
          Icon.mr-1(name="ph:check-circle-bold" size="16")
          | {{ $t('tasks.markComplete') }}
        el-button(v-else type="info" @click="handleReopen" class="!rounded-xl")
          Icon.mr-1(name="ph:arrow-counter-clockwise-bold" size="16")
          | {{ $t('tasks.reopen') }}
        el-button(type="primary" @click="editDialogVisible = true" class="!rounded-xl")
          Icon.mr-1(name="ph:pencil-bold" size="16")
          | {{ $t('common.edit') }}

    //- Content
    .flex.gap-6(class="flex-col xl:flex-row")
      //- Main Details
      .flex-1
        .glass-card.p-6.mb-6
          h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('tasks.taskDetails') }}
          .space-y-4
            div(v-if="task.description")
              p.text-xs.font-semibold.uppercase.mb-1(style="color: var(--text-muted)") {{ $t('tasks.form.description') }}
              p.text-sm(style="color: var(--text-primary); white-space: pre-wrap") {{ task.description }}
            .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
              div
                p.text-xs.font-semibold.uppercase.mb-1(style="color: var(--text-muted)") {{ $t('tasks.table.status') }}
                el-select(v-model="task.status" @change="handleStatusChange" style="width: 100%")
                  el-option(v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value")
              div
                p.text-xs.font-semibold.uppercase.mb-1(style="color: var(--text-muted)") {{ $t('tasks.table.priority') }}
                p.text-sm(style="color: var(--text-primary)")
                  el-tag(:type="priorityTagType" size="small") {{ $t('tasks.priority.' + task.priority) }}
              div
                p.text-xs.font-semibold.uppercase.mb-1(style="color: var(--text-muted)") {{ $t('tasks.table.assignee') }}
                .flex.items-center.gap-2
                  el-avatar(:size="28" :src="task.assignee?.profilePicture" v-if="task.assignee")
                  span.text-sm(style="color: var(--text-primary)") {{ task.assignee?.name || '-' }}
              div
                p.text-xs.font-semibold.uppercase.mb-1(style="color: var(--text-muted)") {{ $t('tasks.table.dueDate') }}
                p.text-sm(style="color: var(--text-primary)") {{ task.dueDate ? formatDate(task.dueDate) : '-' }}

        //- Linked Entity
        .glass-card.p-6.mb-6(v-if="task.entityType && task.entityId")
          h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('tasks.linkedEntity') }}
          NuxtLink.flex.items-center.gap-3.p-3.rounded-xl(:to="entityLink" style="background: rgba(120, 73, 255, 0.08); border: 1px solid rgba(120, 73, 255, 0.2)")
            Icon(name="ph:link-bold" size="20" class="text-[#7849ff]")
            div
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ task.entityType }}
              p.text-xs(style="color: var(--text-muted)") ID: {{ task.entityId }}

      //- Sidebar
      .w-full(class="xl:w-80")
        .glass-card.p-6
          h4.text-sm.font-bold.uppercase.mb-4(style="color: var(--text-muted)") {{ $t('common.timeline') }}
          .space-y-3
            .flex.items-center.gap-3
              Icon(name="ph:clock-bold" size="16" style="color: var(--text-muted)")
              div
                p.text-xs(style="color: var(--text-muted)") {{ $t('tasks.table.created') }}
                p.text-sm(style="color: var(--text-primary)") {{ task.createdAt ? formatDate(task.createdAt) : '-' }}
            .flex.items-center.gap-3(v-if="task.completedAt")
              Icon(name="ph:check-circle-bold" size="16" style="color: #22c55e")
              div
                p.text-xs(style="color: var(--text-muted)") {{ $t('tasks.markComplete') }}
                p.text-sm(style="color: var(--text-primary)") {{ formatDate(task.completedAt) }}
            .flex.items-center.gap-3(v-if="task.creator")
              Icon(name="ph:user-bold" size="16" style="color: var(--text-muted)")
              div
                p.text-xs(style="color: var(--text-muted)") Created By
                p.text-sm(style="color: var(--text-primary)") {{ task.creator?.name }}

  //- Edit Dialog
  el-dialog(v-model="editDialogVisible" :title="$t('tasks.editTask')" width="600px")
    el-form(:model="editForm" label-position="top")
      el-form-item(:label="$t('tasks.form.title')")
        el-input(v-model="editForm.title" :placeholder="$t('tasks.form.titlePlaceholder')")
      el-form-item(:label="$t('tasks.form.description')")
        el-input(v-model="editForm.description" type="textarea" :rows="4" :placeholder="$t('tasks.form.descriptionPlaceholder')")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('tasks.form.priority')")
          el-select(v-model="editForm.priority" style="width: 100%")
            el-option(v-for="p in priorityOptions" :key="p.value" :label="p.label" :value="p.value")
        el-form-item(:label="$t('tasks.form.dueDate')")
          el-date-picker(v-model="editForm.dueDate" type="date" style="width: 100%")
      el-form-item(:label="$t('tasks.form.assignee')")
        el-select(v-model="editForm.assigneeId" :placeholder="$t('tasks.form.assigneePlaceholder')" filterable style="width: 100%")
          el-option(v-for="u in users" :key="u.value" :label="u.label" :value="u.value")
    template(#footer)
      el-button(@click="editDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSaveEdit" :loading="saving") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ElNotification } from 'element-plus';
import { fetchTasks, updateTask, completeTask } from '~/composables/useTasks';
import type { Task } from '~/composables/useTasks';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Task Details' });

const route = useRoute();
const router = useRouter();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const id = route.params.id as string;
const loading = ref(true);
const saving = ref(false);
const editDialogVisible = ref(false);
const task = ref<Task | null>(null);
const users = ref<{ label: string; value: number }[]>([]);

const statusOptions = [
  { label: t('tasks.status.TODO'), value: 'TODO' },
  { label: t('tasks.status.IN_PROGRESS'), value: 'IN_PROGRESS' },
  { label: t('tasks.status.DONE'), value: 'DONE' },
  { label: t('tasks.status.CANCELLED'), value: 'CANCELLED' }
];

const priorityOptions = [
  { label: t('tasks.priority.LOW'), value: 'LOW' },
  { label: t('tasks.priority.MEDIUM'), value: 'MEDIUM' },
  { label: t('tasks.priority.HIGH'), value: 'HIGH' },
  { label: t('tasks.priority.URGENT'), value: 'URGENT' }
];

const editForm = reactive({
  title: '',
  description: '',
  priority: 'MEDIUM' as string,
  dueDate: null as string | null,
  assigneeId: null as number | null
});

// Load task and users
try {
  const [taskRes, usersRes] = await Promise.all([useApiFetch(`tasks/${id}`), useApiFetch('users')]);
  if (taskRes?.success && taskRes?.body) {
    task.value = taskRes.body as Task;
    editForm.title = task.value.title;
    editForm.description = task.value.description || '';
    editForm.priority = task.value.priority;
    editForm.dueDate = task.value.dueDate || null;
    editForm.assigneeId = task.value.assigneeId || null;
  }
  if (usersRes?.body?.docs) {
    users.value = usersRes.body.docs.map((u: any) => ({ label: u.name, value: u.id }));
  }
} catch (e) {
  console.error('Failed to load task', e);
} finally {
  loading.value = false;
}

const statusTagType = computed(() => {
  const map: Record<string, string> = { TODO: 'info', IN_PROGRESS: 'warning', DONE: 'success', CANCELLED: 'danger' };
  return map[task.value?.status || 'TODO'] || 'info';
});

const priorityColor = computed(() => {
  const map: Record<string, string> = { LOW: '#22c55e', MEDIUM: '#3b82f6', HIGH: '#f59e0b', URGENT: '#ef4444' };
  return map[task.value?.priority || 'MEDIUM'] || '#3b82f6';
});

const priorityTagType = computed(() => {
  const map: Record<string, string> = { LOW: 'success', MEDIUM: '', HIGH: 'warning', URGENT: 'danger' };
  return map[task.value?.priority || 'MEDIUM'] || '';
});

const entityLink = computed(() => {
  if (!task.value?.entityType || !task.value?.entityId) return '#';
  const map: Record<string, string> = {
    lead: '/sales/leads/',
    deal: '/sales/deals/',
    client: '/sales/clients/',
    opportunity: '/sales/opportunity/',
    project: '/operations/projects/'
  };
  const base = map[task.value.entityType.toLowerCase()] || '/';
  return base + task.value.entityId;
});

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function goBack() {
  router.back();
}

async function handleStatusChange(status: string) {
  if (!task.value) return;
  try {
    await updateTask(task.value.id, { status: status as Task['status'] });
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

async function handleComplete() {
  if (!task.value) return;
  try {
    await completeTask(task.value.id);
    task.value.status = 'DONE';
    task.value.completedAt = new Date().toISOString();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

async function handleReopen() {
  if (!task.value) return;
  try {
    await updateTask(task.value.id, { status: 'TODO' });
    task.value.status = 'TODO';
    task.value.completedAt = undefined;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

async function handleSaveEdit() {
  if (!task.value) return;
  saving.value = true;
  try {
    await updateTask(task.value.id, {
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority as Task['priority'],
      dueDate: editForm.dueDate || undefined,
      assigneeId: editForm.assigneeId || undefined
    });
    task.value.title = editForm.title;
    task.value.description = editForm.description;
    task.value.priority = editForm.priority as Task['priority'];
    task.value.dueDate = editForm.dueDate || undefined;
    task.value.assigneeId = editForm.assigneeId || undefined;
    editDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.task-detail-page {
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
