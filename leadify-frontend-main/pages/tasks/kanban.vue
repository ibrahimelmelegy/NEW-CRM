<template lang="pug">
.tasks-kanban-page.p-6
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") Tasks Board
      p.text-sm(style="color: var(--text-muted)") Organize tasks with drag and drop
    .flex.items-center.gap-3
      el-switch(v-model="showMyOnly" active-text="My Tasks" @change="loadTasks")
      NuxtLink(to="/tasks")
        el-button
          Icon(name="ph:list" size="16")
          span.ml-1 List View
      NuxtLink(to="/tasks/create")
        el-button(type="primary" class="!bg-[#7849ff] !border-none")
          Icon(name="ph:plus" size="16")
          span.ml-1 New Task

  //- Kanban Board
  .kanban-board.flex.gap-4.overflow-x-auto.pb-4(v-loading="loading")
    .kanban-column.flex-shrink-0(
      v-for="column in columns"
      :key="column.status"
      style="width: 300px"
    )
      //- Column Header
      .glass-card.p-3.rounded-t-2xl.flex.items-center.justify-between(
        :style="{ borderBottom: '3px solid ' + column.color }"
      )
        .flex.items-center.gap-2
          .w-3.h-3.rounded-full(:style="{ background: column.color }")
          span.text-sm.font-bold(style="color: var(--text-primary)") {{ column.label }}
        el-tag(round size="small" effect="plain") {{ getColumnTasks(column.status).length }}

      //- Cards
      .kanban-cards.space-y-3.p-2.rounded-b-2xl.min-h-48(
        style="background: var(--bg-input, rgba(255,255,255,0.02))"
        @dragover.prevent
        @drop="onDrop($event, column.status)"
      )
        .task-card.glass-card.p-4.rounded-xl.cursor-grab(
          v-for="task in getColumnTasks(column.status)"
          :key="task.id"
          draggable="true"
          @dragstart="onDragStart($event, task)"
          @click="router.push(`/tasks/${task.id}`)"
        )
          .flex.items-start.justify-between.mb-2
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ task.title }}
            el-tag(:type="getPriorityType(task.priority)" size="small" round) {{ task.priority }}

          p.text-xs.mb-3(v-if="task.description" style="color: var(--text-muted)") {{ task.description?.substring(0, 60) }}{{ task.description?.length > 60 ? '...' : '' }}

          .flex.items-center.justify-between
            .flex.items-center.gap-2
              .w-6.h-6.rounded-full.flex.items-center.justify-center.text-xs(
                v-if="task.assignee"
                style="background: rgba(120,73,255,0.15); color: #7849ff; font-size: 10px"
              ) {{ task.assignee?.name?.charAt(0) || '?' }}
              span.text-xs(v-if="task.assignee" style="color: var(--text-muted)") {{ task.assignee?.name }}
            .flex.items-center.gap-1(v-if="task.dueDate")
              Icon(name="ph:calendar" size="12" :style="{ color: isOverdue(task.dueDate) ? '#ef4444' : 'var(--text-muted)' }")
              span.text-xs(:style="{ color: isOverdue(task.dueDate) ? '#ef4444' : 'var(--text-muted)' }") {{ formatDate(task.dueDate) }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { fetchTasks, fetchMyTasks, updateTask } from '~/composables/useTasks';

definePageMeta({ middleware: 'permissions' });

const router = useRouter();
const loading = ref(false);
const tasks = ref<any[]>([]);
const showMyOnly = ref(false);
let draggedTask: any = null;

const columns = [
  { status: 'TODO', label: 'To Do', color: '#64748b' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6' },
  { status: 'REVIEW', label: 'Review', color: '#f59e0b' },
  { status: 'DONE', label: 'Done', color: '#10b981' },
  { status: 'CANCELLED', label: 'Cancelled', color: '#ef4444' }
];

function getColumnTasks(status: string) {
  return tasks.value.filter(t => t.status === status);
}

function getPriorityType(priority: string): string {
  if (priority === 'URGENT') return 'danger';
  if (priority === 'HIGH') return 'warning';
  if (priority === 'MEDIUM') return 'info';
  return '';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function onDragStart(event: DragEvent, task: any) {
  draggedTask = task;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id);
  }
}

async function onDrop(event: DragEvent, newStatus: string) {
  event.preventDefault();
  if (!draggedTask || draggedTask.status === newStatus) return;

  const oldStatus = draggedTask.status;
  draggedTask.status = newStatus;

  try {
    await updateTask(draggedTask.id, { status: newStatus });
    ElNotification({ type: 'success', title: 'Updated', message: `Task moved to ${newStatus.replace(/_/g, ' ')}` });
  } catch {
    draggedTask.status = oldStatus;
    ElNotification({ type: 'error', title: 'Error', message: 'Could not update task' });
  }

  draggedTask = null;
}

async function loadTasks() {
  loading.value = true;
  try {
    const response = showMyOnly.value ? await fetchMyTasks() : await fetchTasks();
    tasks.value = response.docs || [];
  } catch {
    /* silent */
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.tasks-kanban-page {
  animation: fadeIn 0.3s ease-out;
}

.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

.task-card {
  transition:
    transform 0.15s,
    box-shadow 0.15s,
    border-color 0.15s;
}
.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(120, 73, 255, 0.15);
  border-color: rgba(120, 73, 255, 0.3);
}
.task-card:active {
  cursor: grabbing;
}

.kanban-board {
  min-height: calc(100vh - 200px);
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
