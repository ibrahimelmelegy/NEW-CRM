<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('tasks.title') }}
    .flex.items-center.gap-x-3
      NuxtLink(to="/tasks/create")
        el-button(size="large" type="primary" :icon="Plus" class="!rounded-2xl") {{ $t('tasks.newTask') }}

  //- Stat Cards
  StatCards(:stats="statCards")

  //- Tabs
  el-tabs(v-model="activeTab" @tab-change="handleTabChange")
    el-tab-pane(:label="$t('tasks.allTasks')" name="all")
    el-tab-pane(:label="$t('tasks.myTasks')" name="my")

  //- Table
  el-icon.is-loading(:size="32" v-if="loadingAction" style="color: var(--accent-color, #7849ff)")
  AppTable(
    v-slot="{ data }"
    v-if="!loadingAction"
    :externalLoading="loading"
    :filterOptions="filterOptions"
    :columns="table.columns"
    position="tasks"
    :pageInfo="pagination"
    :data="table.data"
    :searchPlaceholder="$t('tasks.title')"
    @handleRowClick="handleRowClick"
    :key="tableKey"
  )
    .flex.items-center.py-2(@click.stop)
      el-dropdown(class="outline-0" trigger="click")
        span(class="el-dropdown-link")
          .toggle-icon.text-md
            Icon(name="IconToggle" size="22")
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item
              NuxtLink.flex.items-center(:to="`/tasks/${data?.id}`")
                Icon.text-md.mr-2(name="IconEye")
                p.text-sm {{ $t('tasks.viewTask') }}
            el-dropdown-item(@click="handleComplete(data)")
              .flex.items-center
                Icon.text-md.mr-2(name="ph:check-circle-bold")
                p.text-sm {{ data?.status === 'DONE' ? $t('tasks.reopen') : $t('tasks.markComplete') }}
            el-dropdown-item(@click="handleDelete(data)")
              .flex.items-center
                Icon.text-md.mr-2(name="IconDelete")
                p.text-sm {{ $t('tasks.deleteTask') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { ref, computed } from 'vue';
import { fetchTasks, fetchMyTasks, fetchTaskStats, updateTask, completeTask, deleteTask } from '~/composables/useTasks';
import type { Task } from '~/composables/useTasks';

const router = useRouter();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const loadingAction = ref(false);
const activeTab = ref('all');
const tableKey = ref(0);

// Fetch initial data
const [tasksResponse, statsResponse, usersResponse] = await Promise.all([
  fetchTasks(),
  fetchTaskStats(),
  useApiFetch('users')
]);

const tasks = ref<Task[]>(tasksResponse.docs || []);
const pagination = ref(tasksResponse.pagination);
const stats = ref(statsResponse || {});

// Stat cards
const statCards = computed(() => [
  {
    label: t('tasks.stats.total'),
    value: stats.value?.total || 0,
    icon: 'ph:list-checks-bold',
    color: '#7849ff'
  },
  {
    label: t('tasks.stats.inProgress'),
    value: stats.value?.inProgress || 0,
    icon: 'ph:spinner-bold',
    color: '#3b82f6'
  },
  {
    label: t('tasks.stats.overdue'),
    value: stats.value?.overdue || 0,
    icon: 'ph:warning-circle-bold',
    color: '#ef4444'
  },
  {
    label: t('tasks.stats.dueToday'),
    value: stats.value?.dueToday || 0,
    icon: 'ph:calendar-bold',
    color: '#f59e0b'
  }
]);

// Table config
const table = ref({
  columns: [] as any[],
  data: tasks.value.map(formatTask)
});

function formatTask(task: Task) {
  return {
    ...task,
    taskDetails: { name: task.title, image: task.assignee?.profilePicture },
    assign: task.assignee?.name || '-',
    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-',
    createdAt: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'
  };
}

const updateTableColumns = () => {
  table.value.columns = [
    { prop: 'taskDetails', label: t('tasks.table.title'), component: 'AvatarText', sortable: true, type: 'font-bold', width: 250 },
    {
      prop: 'status',
      label: t('tasks.table.status'),
      component: 'Label',
      sortable: true,
      type: 'select',
      filters: [
        { text: t('tasks.status.TODO'), value: 'TODO' },
        { text: t('tasks.status.IN_PROGRESS'), value: 'IN_PROGRESS' },
        { text: t('tasks.status.DONE'), value: 'DONE' },
        { text: t('tasks.status.CANCELLED'), value: 'CANCELLED' }
      ],
      width: 150
    },
    {
      prop: 'priority',
      label: t('tasks.table.priority'),
      component: 'Label',
      sortable: true,
      type: 'select',
      filters: [
        { text: t('tasks.priority.LOW'), value: 'LOW' },
        { text: t('tasks.priority.MEDIUM'), value: 'MEDIUM' },
        { text: t('tasks.priority.HIGH'), value: 'HIGH' },
        { text: t('tasks.priority.URGENT'), value: 'URGENT' }
      ],
      width: 130
    },
    { prop: 'assign', label: t('tasks.table.assignee'), component: 'Text', type: 'font-default', width: 180 },
    { prop: 'dueDate', label: t('tasks.table.dueDate'), component: 'Text', sortable: true, type: 'font-default', width: 150 },
    { prop: 'createdAt', label: t('tasks.table.created'), component: 'Text', sortable: true, type: 'font-default', width: 150 }
  ];
};

updateTableColumns();

const mappedUsers = usersResponse?.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id
})) || [];

const filterOptions = computed(() => [
  {
    title: t('tasks.table.status'),
    value: 'status',
    options: [
      { label: t('tasks.status.TODO'), value: 'TODO' },
      { label: t('tasks.status.IN_PROGRESS'), value: 'IN_PROGRESS' },
      { label: t('tasks.status.DONE'), value: 'DONE' },
      { label: t('tasks.status.CANCELLED'), value: 'CANCELLED' }
    ]
  },
  {
    title: t('tasks.table.priority'),
    value: 'priority',
    options: [
      { label: t('tasks.priority.LOW'), value: 'LOW' },
      { label: t('tasks.priority.MEDIUM'), value: 'MEDIUM' },
      { label: t('tasks.priority.HIGH'), value: 'HIGH' },
      { label: t('tasks.priority.URGENT'), value: 'URGENT' }
    ]
  },
  {
    title: t('tasks.table.assignee'),
    value: 'assigneeId',
    options: mappedUsers
  },
  {
    title: t('tasks.table.dueDate'),
    value: ['fromDate', 'toDate'],
    type: 'date'
  }
]);

function handleRowClick(val: any) {
  router.push(`/tasks/${val.id}`);
}

async function handleTabChange(tab: string) {
  loadingAction.value = true;
  try {
    const response = tab === 'my' ? await fetchMyTasks() : await fetchTasks();
    tasks.value = response.docs || [];
    pagination.value = response.pagination;
    table.value.data = tasks.value.map(formatTask);
    tableKey.value++;
  } finally {
    loadingAction.value = false;
  }
}

async function handleComplete(data: any) {
  try {
    if (data.status === 'DONE') {
      await updateTask(data.id, { status: 'TODO' });
    } else {
      await completeTask(data.id);
    }
    await handleTabChange(activeTab.value);
    const newStats = await fetchTaskStats();
    stats.value = newStats || {};
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

async function handleDelete(data: any) {
  try {
    await ElMessageBox.confirm(t('tasks.confirmDelete'), t('common.warning'), { type: 'warning' });
    await deleteTask(data.id);
    await handleTabChange(activeTab.value);
    const newStats = await fetchTaskStats();
    stats.value = newStats || {};
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
  } catch {}
}
</script>
