<template lang="pug">
.record-tasks
  //- Header
  .flex.items-center.justify-between.mb-4
    .flex.items-center.gap-2
      Icon(name="ph:check-square-bold" size="18" style="color: var(--accent-color, #7849ff)")
      span.font-semibold(style="color: var(--text-primary)") {{ $t('common.tasks') || 'Tasks' }}
      el-badge.ml-1(v-if="tasks.length > 0" :value="tasks.length" type="info")
    el-button(size="small" type="primary" @click="openAddDialog" class="!rounded-xl")
      Icon(name="ph:plus-bold" size="14")
      span.ml-1 {{ $t('common.addTask') || 'Add Task' }}

  //- Task list
  .space-y-2(v-if="tasks.length > 0")
    .glass-card.p-3.task-item(
      v-for="task in sortedTasks"
      :key="task.id"
      :class="{ 'task-overdue': isOverdue(task), 'task-done': task.status === 'DONE' }"
    )
      .flex.items-start.gap-3
        //- Complete checkbox
        div(class="pt-0.5")
          el-checkbox(
            :model-value="task.status === 'DONE'"
            @change="(val: boolean) => toggleComplete(task, val)"
            size="large"
          )
        //- Task content
        .flex-1.min-w-0(@click="toggleExpand(task.id)")
          .flex.items-center.gap-2.flex-wrap
            span.font-medium.text-sm(
              :style="{ color: task.status === 'DONE' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.status === 'DONE' ? 'line-through' : 'none' }"
            ) {{ task.title }}
            el-tag(
              :type="priorityType(task.priority)"
              size="small"
              round
              effect="plain"
            ) {{ task.priority }}
          .flex.items-center.gap-3(class="mt-1.5")
            //- Assignee
            .flex.items-center.gap-1(v-if="task.assignee")
              img.w-4.h-4.rounded-full.object-cover(:src="task.assignee.profilePicture || '/images/avatar.png'" :alt="task.assignee.name")
              span.text-xs(style="color: var(--text-muted)") {{ task.assignee.name }}
            //- Due date
            .flex.items-center.gap-1(v-if="task.dueDate")
              Icon(name="ph:calendar-bold" size="12" :style="{ color: isOverdue(task) ? '#ef4444' : 'var(--text-muted)' }")
              span.text-xs(:style="{ color: isOverdue(task) ? '#ef4444' : 'var(--text-muted)', fontWeight: isOverdue(task) ? '600' : '400' }") {{ formatDate(task.dueDate) }}
            //- Status
            .flex.items-center.gap-1
              div(class="w-1.5 h-1.5 rounded-full" :style="{ background: statusColor(task.status) }")
              span.text-xs(style="color: var(--text-muted)") {{ formatStatus(task.status) }}

        //- Actions
        el-dropdown(trigger="click" size="small" @command="(cmd: string) => handleAction(cmd, task)")
          Icon.cursor-pointer(name="ph:dots-three-vertical-bold" size="16" style="color: var(--text-muted)")
          template(#dropdown)
            el-dropdown-menu
              el-dropdown-item(command="edit")
                .flex.items-center
                  Icon(name="ph:pencil-bold" size="14" class="mr-2")
                  span {{ $t('common.edit') }}
              el-dropdown-item(command="delete" divided)
                .flex.items-center.text-red-500
                  Icon(name="ph:trash-bold" size="14" class="mr-2")
                  span {{ $t('common.delete') }}

      //- Expanded details
      Transition(name="expand")
        .mt-3.pt-3(v-if="expandedTaskId === task.id" style="border-top: 1px solid var(--glass-border-color, rgba(255,255,255,0.06))")
          p.text-sm.mb-2(v-if="task.description" style="color: var(--text-secondary)") {{ task.description }}
          .text-xs(style="color: var(--text-muted)") {{ $t('common.created') || 'Created' }}: {{ formatDateTime(task.createdAt) }}

  //- Empty state
  .text-center.py-8(v-else-if="!loading")
    Icon(name="ph:check-square" size="40" style="color: var(--text-muted)")
    p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noTasks') || 'No tasks yet' }}
    el-button.mt-3(type="primary" size="small" @click="openAddDialog" class="!rounded-xl")
      Icon(name="ph:plus-bold" size="14")
      span.ml-1 {{ $t('common.addTask') || 'Add Task' }}

  //- Loading
  .flex.justify-center.py-4(v-if="loading")
    el-skeleton(:rows="3" animated)

  //- Add/Edit dialog
  el-dialog(
    v-model="dialogVisible"
    :title="editingTask ? ($t('common.editTask') || 'Edit Task') : ($t('common.addTask') || 'Add Task')"
    width="480px"
    append-to-body
    destroy-on-close
  )
    el-form(:model="formData" label-position="top")
      el-form-item(:label="$t('common.title') || 'Title'" required)
        el-input(v-model="formData.title" :placeholder="$t('common.taskTitlePlaceholder') || 'Enter task title'" maxlength="200")
      el-form-item(:label="$t('common.description') || 'Description'")
        el-input(v-model="formData.description" type="textarea" :rows="3" :placeholder="$t('common.descriptionPlaceholder') || 'Add details...'" resize="none")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('common.priority') || 'Priority'")
          el-select(v-model="formData.priority" style="width: 100%")
            el-option(label="Low" value="LOW")
            el-option(label="Medium" value="MEDIUM")
            el-option(label="High" value="HIGH")
            el-option(label="Urgent" value="URGENT")
        el-form-item(:label="$t('common.dueDate') || 'Due Date'")
          el-date-picker(v-model="formData.dueDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" :placeholder="$t('common.selectDate') || 'Select date'")
      el-form-item(:label="$t('common.status') || 'Status'")
        el-select(v-model="formData.status" style="width: 100%")
          el-option(label="To Do" value="TODO")
          el-option(label="In Progress" value="IN_PROGRESS")
          el-option(label="Done" value="DONE")
          el-option(label="Cancelled" value="CANCELLED")
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
        el-button(type="primary" :loading="saving" :disabled="!formData.title.trim()" @click="saveTask" class="!rounded-xl") {{ editingTask ? $t('common.save') : ($t('common.create') || 'Create') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import {
  fetchTasksByEntity,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  type Task
} from '~/composables/useTasks';

const props = defineProps<{
  entityType: string;
  entityId: string | number;
}>();

const tasks = ref<Task[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingTask = ref<Task | null>(null);
const expandedTaskId = ref<number | null>(null);

const formData = reactive({
  title: '',
  description: '',
  priority: 'MEDIUM' as string,
  status: 'TODO' as string,
  dueDate: '' as string
});

const sortedTasks = computed(() => {
  return [...tasks.value].sort((a, b) => {
    // Done tasks go to bottom
    if (a.status === 'DONE' && b.status !== 'DONE') return 1;
    if (a.status !== 'DONE' && b.status === 'DONE') return -1;
    // Then sort by priority
    const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    if (pDiff !== 0) return pDiff;
    // Then by due date
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
});

async function loadTasks() {
  loading.value = true;
  try {
    tasks.value = await fetchTasksByEntity(props.entityType, props.entityId);
  } finally {
    loading.value = false;
  }
}

function openAddDialog() {
  editingTask.value = null;
  formData.title = '';
  formData.description = '';
  formData.priority = 'MEDIUM';
  formData.status = 'TODO';
  formData.dueDate = '';
  dialogVisible.value = true;
}

function handleAction(cmd: string, task: Task) {
  if (cmd === 'edit') {
    editingTask.value = task;
    formData.title = task.title;
    formData.description = task.description || '';
    formData.priority = task.priority;
    formData.status = task.status;
    formData.dueDate = task.dueDate || '';
    dialogVisible.value = true;
  } else if (cmd === 'delete') {
    confirmDeleteTask(task);
  }
}

async function saveTask() {
  if (!formData.title.trim()) return;
  saving.value = true;
  try {
    const data = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate || undefined,
      entityType: props.entityType,
      entityId: Number(props.entityId)
    };

    if (editingTask.value) {
      await updateTask(editingTask.value.id, data);
    } else {
      await createTask(data);
    }
    dialogVisible.value = false;
    await loadTasks();
    ElNotification({ type: 'success', message: editingTask.value ? 'Task updated' : 'Task created', duration: 2000 });
  } finally {
    saving.value = false;
  }
}

async function toggleComplete(task: Task, completed: boolean) {
  if (completed) {
    await completeTask(task.id);
  } else {
    await updateTask(task.id, { status: 'TODO' });
  }
  await loadTasks();
}

async function confirmDeleteTask(task: Task) {
  try {
    await ElMessageBox.confirm(
      `Delete task "${task.title}"?`,
      'Delete Task',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' }
    );
    await deleteTask(task.id);
    await loadTasks();
    ElNotification({ type: 'success', message: 'Task deleted', duration: 2000 });
  } catch {
    // cancelled
  }
}

function toggleExpand(id: number) {
  expandedTaskId.value = expandedTaskId.value === id ? null : id;
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'DONE' || task.status === 'CANCELLED') return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

function priorityType(priority: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    LOW: 'info',
    MEDIUM: '',
    HIGH: 'warning',
    URGENT: 'danger'
  };
  return map[priority] || 'info';
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    TODO: '#6b7280',
    IN_PROGRESS: '#3b82f6',
    DONE: '#22c55e',
    CANCELLED: '#ef4444'
  };
  return map[status] || '#6b7280';
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
    CANCELLED: 'Cancelled'
  };
  return map[status] || status;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - new Date(now.toDateString()).getTime();
  const days = Math.round(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0 && days <= 7) return `In ${days} days`;
  if (days < 0 && days >= -7) return `${Math.abs(days)} days ago`;
  return date.toLocaleDateString();
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString();
}

onMounted(() => loadTasks());
watch(() => [props.entityType, props.entityId], () => loadTasks());
</script>

<style scoped>
.task-item {
  transition: all 0.2s ease;
  cursor: pointer;
}
.task-item:hover {
  border-color: var(--glass-border-color, rgba(255,255,255,0.12));
}

.task-overdue {
  border-left: 3px solid #ef4444;
}

.task-done {
  opacity: 0.7;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}
</style>
