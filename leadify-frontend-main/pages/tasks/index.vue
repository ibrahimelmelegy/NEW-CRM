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

  //- Desktop Table
  el-icon.is-loading(:size="32" v-if="loadingAction" style="color: var(--accent-color, #7849ff)")
  .tasks-desktop-view
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

  //- Mobile Card View
  .tasks-mobile-view(v-if="!loadingAction")
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('tasks.title')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.status-pill(
          v-for="filter in mobileTaskFilters"
          :key="filter.value"
          :class="{ 'status-pill--active': mobileTaskStatus === filter.value }"
          :style="mobileTaskStatus === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="mobileTaskStatus = filter.value; vibrate()"
        )
          span {{ filter.label }}
          span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

      .space-y-3(v-if="mobileFilteredTasks.length")
        SwipeCard(
          v-for="task in mobileFilteredTasks"
          :key="task.id"
          :rightActions="[{ name: 'complete', label: task.status === 'DONE' ? $t('tasks.reopen') : $t('tasks.markComplete'), icon: 'ph:check-circle-bold', color: '#10B981' }]"
          :leftActions="[{ name: 'view', label: $t('tasks.viewTask'), icon: 'ph:eye-bold', color: '#7849FF' }]"
          @action="(name) => handleTaskSwipe(name, task)"
        )
          .entity-card.p-4(@click="handleRowClick(task)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: getTaskColor(task.status) + '20', color: getTaskColor(task.status) }"
                )
                  Icon(:name="task.status === 'DONE' ? 'ph:check-circle' : 'ph:list-checks'" size="18")
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ task.taskDetails?.name || task.title || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ task.assign || '' }}
              el-tag.shrink-0(:type="getTaskTagType(task.status)" size="small" effect="dark" round) {{ task.status }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="task.priority")
                Icon(name="ph:flag" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(:style="{ color: getPriorityColor(task.priority) }") {{ task.priority }}
              .flex.items-center.gap-2(v-if="task.dueDate && task.dueDate !== '-'")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ task.dueDate }}

      .text-center.py-12(v-if="!mobileFilteredTasks.length")
        Icon(name="ph:list-checks" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredTasks.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredTasks.length }} {{ $t('tasks.title').toLowerCase() }}

    .mobile-fab(@click="navigateTo('/tasks/create')")
      Icon(name="ph:plus-bold" size="24")
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
const [tasksResponse, statsResponse, usersResponse] = await Promise.all([fetchTasks(), fetchTaskStats(), useApiFetch('users')]);

const tasks = ref<Task[]>(tasksResponse.docs || []);
const pagination = ref(tasksResponse.pagination);
const stats = ref<any>(statsResponse || {});

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

const mappedUsers =
  usersResponse?.body?.docs?.map((e: any) => ({
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
  } catch (e: any) {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileTaskStatus = ref('ALL');
const mobileRefreshing = ref(false);

const mobileTaskFilters = computed(() => {
  const data = table.value.data || [];
  return [
    { value: 'ALL', label: t('common.all'), color: '#7849ff', count: data.length },
    { value: 'TODO', label: t('tasks.status.TODO'), color: '#94a3b8', count: data.filter((t: any) => t.status === 'TODO').length },
    {
      value: 'IN_PROGRESS',
      label: t('tasks.status.IN_PROGRESS'),
      color: '#3b82f6',
      count: data.filter((t: any) => t.status === 'IN_PROGRESS').length
    },
    { value: 'DONE', label: t('tasks.status.DONE'), color: '#10b981', count: data.filter((t: any) => t.status === 'DONE').length }
  ];
});

const mobileFilteredTasks = computed(() => {
  let data = table.value.data || [];
  if (mobileTaskStatus.value !== 'ALL') data = data.filter((tk: any) => tk.status === mobileTaskStatus.value);
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((tk: any) => {
    const name = (tk.taskDetails?.name || tk.title || '').toLowerCase();
    const assign = (tk.assign || '').toLowerCase();
    return name.includes(q) || assign.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    await handleTabChange(activeTab.value);
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function handleTaskSwipe(name: string, task: any) {
  vibrate();
  if (name === 'view') navigateTo(`/tasks/${task.id}`);
  if (name === 'complete') handleComplete(task);
}

function getTaskColor(status: string): string {
  const map: Record<string, string> = { TODO: '#94a3b8', IN_PROGRESS: '#3b82f6', DONE: '#10b981', CANCELLED: '#ef4444' };
  return map[status] || '#94a3b8';
}
function getTaskTagType(status: string): string {
  const map: Record<string, string> = { TODO: 'info', IN_PROGRESS: '', DONE: 'success', CANCELLED: 'danger' };
  return map[status] || 'info';
}
function getPriorityColor(priority: string): string {
  const map: Record<string, string> = { LOW: '#94a3b8', MEDIUM: '#f59e0b', HIGH: '#ef4444', URGENT: '#dc2626' };
  return map[priority] || 'var(--text-secondary)';
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('tasks', #7849ff);
</style>
