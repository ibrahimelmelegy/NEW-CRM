<template lang="pug">
  el-tabs.demo-tabs(v-model="activeName", @tab-click="handleClick")
    el-tab-pane(:label="$t('operations.dailyTasks.tabs.info')" name="info")
      OperationsDailyTasksStatistics
    el-tab-pane(:label="$t('operations.dailyTasks.tabs.active')" name="active")
      .glass-card.p-10.rounded-3xl.mt-3
        .flex.items-center.justify-between.m-5
          .title.font-bold.text-2xl.mb-1.capitalize {{ $t('operations.dailyTasks.tabs.active') }}
          .flex.items-center.gap-2
            el-button(type="primary" ,size='large' ,class="w-full !my-4 !rounded-2xl", @click="exportToPDF")
              .flex.items-center
                Icon.mr-2(name="IconExport", size="20")
                p.text-sm {{ $t('operations.dailyTasks.buttons.exportPdf') }}
            NuxtLink(to="/operations/daily-task/add-task?status=Active")
              el-button(size='large' ,class="w-full !my-4 !rounded-2xl", plain, type="primary")
                .flex.items-center
                  Icon.mr-2(name="IconAdd", size="20")
                p.text-sm {{ $t('operations.dailyTasks.buttons.addProject') }}
        .flex.justify-center.items-center.h-64(v-if="loading")
          .animate-spin.rounded-full.h-12.w-12.border-4.border-primary-purple-400.border-t-transparent
        .dtask-desktop-view(v-else)
          AppTable(
            v-slot="{ data }",
            :columns="activeColumns",
            :data="activeProjects",
            :loading="loading",
            :pageInfo="activeProjectsPagination",
            @page-change="handlePageChange",
            @search="handleSearch",
            without-filters,
            position="daily-task"
          )
           .flex.items-center.py-2(@click.stop)
             el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/daily-task/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/daily-task/edits/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}
                      el-dropdown-item(@click="deleteId = data?.id; deleteDialog = true")
                        .flex.items-center
                          Icon.text-md.mr-2(name="IconDelete")
                          p.text-sm.text-red-500 {{ $t('common.delete') }}
        //- Mobile card view for active tab
        .dtask-mobile-view(v-if="!loading")
          .space-y-3(v-if="activeProjects.length")
            .entity-card.p-4(v-for="task in activeProjects" :key="task.id" @click="handleView(task)")
              .flex.items-start.justify-between.mb-3
                .flex.items-center.gap-3.min-w-0.flex-1
                  .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                    :style="{ background: '#f59e0b20', color: '#f59e0b' }"
                  ) {{ (task.name || '?').charAt(0).toUpperCase() }}
                  .min-w-0.flex-1
                    p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ task.clientName || '--' }}
                    p.text-xs.truncate(style="color: var(--text-muted)") {{ task.createdAt || '' }}
                el-tag.shrink-0(:type="getTaskTagType(task.status)" size="small" effect="dark" round) {{ task.status }}
              .flex.flex-col.gap-1
                p.text-xs.truncate(v-if="task.name" style="color: var(--text-secondary)") {{ task.name }}
                .flex.items-center.gap-2(v-if="task.assignedToName")
                  Icon(name="ph:user" size="14" style="color: var(--text-muted)")
                  span.text-xs.truncate(style="color: var(--text-secondary)") {{ task.assignedToName }}
          .text-center.py-12(v-if="!activeProjects.length")
            Icon(name="ph:clipboard-text" size="48" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

    el-tab-pane(:label="$t('operations.dailyTasks.tabs.completed')" name="completed")
      .glass-card.p-10.rounded-3xl.mt-3
        .flex.items-center.justify-between.m-5
          .title.font-bold.text-2xl.mb-1.capitalize {{ $t('operations.dailyTasks.tabs.completed') }}
          .flex.items-center.gap-2
            el-button(type="primary", size='large' ,class="w-full !my-4 !rounded-2xl", @click="exportToPDF")
              .flex.items-center
                Icon.mr-2(name="IconExport", size="20")
                p.text-sm {{ $t('operations.dailyTasks.buttons.exportPdf') }}
            NuxtLink(to="/operations/daily-task/add-task?status=Completed")
              el-button(size='large' ,class="w-full !my-4 !rounded-2xl", plain, type="primary")
                .flex.items-center
                  Icon.mr-2(name="IconAdd", size="20")
                  p.text-sm {{ $t('operations.dailyTasks.buttons.addProject') }}
        .flex.justify-center.items-center.h-64(v-if="loading")
          .animate-spin.rounded-full.h-12.w-12.border-4.border-primary-purple-400.border-t-transparent
        .dtask-desktop-view(v-else)
          AppTable(
            v-slot="{ data }",
            :columns="completedColumns",
            :data="completedProjects",
            :loading="loading",
            :pageInfo="completedProjectsPagination",
            @page-change="handlePageChange",
            @search="handleSearch",
            without-filters,
            position="daily-task"
          )
           .flex.items-center.py-2(@click.stop)
            el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/daily-task/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/daily-task/edits/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}
                      el-dropdown-item(@click="deleteId = data?.id; deleteDialog = true")
                        .flex.items-center
                          Icon.text-md.mr-2(name="IconDelete")
                          p.text-sm.text-red-500 {{ $t('common.delete') }}
        //- Mobile card view for completed tab
        .dtask-mobile-view(v-if="!loading")
          .space-y-3(v-if="completedProjects.length")
            .entity-card.p-4(v-for="task in completedProjects" :key="task.id" @click="handleView(task)")
              .flex.items-start.justify-between.mb-3
                .flex.items-center.gap-3.min-w-0.flex-1
                  .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                    :style="{ background: '#f59e0b20', color: '#f59e0b' }"
                  ) {{ (task.name || '?').charAt(0).toUpperCase() }}
                  .min-w-0.flex-1
                    p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ task.clientName || '--' }}
                    p.text-xs.truncate(style="color: var(--text-muted)") {{ task.createdAt || '' }}
                el-tag.shrink-0(:type="getTaskTagType(task.status)" size="small" effect="dark" round) {{ task.status }}
              .flex.flex-col.gap-1
                p.text-xs.truncate(v-if="task.name" style="color: var(--text-secondary)") {{ task.name }}
                .flex.items-center.gap-2(v-if="task.assignedToName")
                  Icon(name="ph:user" size="14" style="color: var(--text-muted)")
                  span.text-xs.truncate(style="color: var(--text-secondary)") {{ task.assignedToName }}
          .text-center.py-12(v-if="!completedProjects.length")
            Icon(name="ph:clipboard-text" size="48" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

    el-tab-pane(:label="$t('operations.dailyTasks.tabs.granted')" name="granted")
      .glass-card.p-10.rounded-3xl.mt-3
        .flex.items-center.justify-between.m-5
          .title.font-bold.text-2xl.mb-1.capitalize {{ $t('operations.dailyTasks.tabs.granted') }}
          .flex.items-center.gap-2
            el-button(type="primary",size='large' ,class="w-full !my-4 !rounded-2xl", @click="exportToPDF")
              .flex.items-center
                Icon.mr-2(name="IconExport", size="20")
                p.text-sm {{ $t('operations.dailyTasks.buttons.exportPdf') }}
            NuxtLink(to="/operations/daily-task/add-task?status=Granted")
              el-button(size='large' ,class="w-full !my-4 !rounded-2xl", plain, type="primary")
               .flex.items-center
                Icon.mr-2(name="IconAdd", size="20")
                p.text-sm {{ $t('operations.dailyTasks.buttons.addProject') }}
        .flex.justify-center.items-center.h-64(v-if="loading")
          .animate-spin.rounded-full.h-12.w-12.border-4.border-primary-purple-400.border-t-transparent
        .dtask-desktop-view(v-else)
          AppTable(
            v-slot="{ data }",
            :columns="grantedColumns",
            :loading="loading",
            :pageInfo="grantedProjectsPagination",
            :data="grantedProjects",
            @handleRowClick="handleView",
            without-filters,
            position="daily-task"
          )
           .flex.items-center.py-2(@click.stop)
             el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/daily-task/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/daily-task/edits/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}
                      el-dropdown-item(@click="deleteId = data?.id; deleteDialog = true")
                        .flex.items-center
                          Icon.text-md.mr-2(name="IconDelete")
                          p.text-sm.text-red-500 {{ $t('common.delete') }}
        //- Mobile card view for granted tab
        .dtask-mobile-view(v-if="!loading")
          .space-y-3(v-if="grantedProjects.length")
            .entity-card.p-4(v-for="task in grantedProjects" :key="task.id" @click="handleView(task)")
              .flex.items-start.justify-between.mb-3
                .flex.items-center.gap-3.min-w-0.flex-1
                  .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                    :style="{ background: '#f59e0b20', color: '#f59e0b' }"
                  ) {{ (task.name || '?').charAt(0).toUpperCase() }}
                  .min-w-0.flex-1
                    p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ task.clientName || '--' }}
                    p.text-xs.truncate(style="color: var(--text-muted)") {{ task.createdAt || '' }}
                el-tag.shrink-0(:type="getTaskTagType(task.status)" size="small" effect="dark" round) {{ task.status }}
              .flex.flex-col.gap-1
                p.text-xs.truncate(v-if="task.name" style="color: var(--text-secondary)") {{ task.name }}
                .flex.items-center.gap-2(v-if="task.assignedToName")
                  Icon(name="ph:user" size="14" style="color: var(--text-muted)")
                  span.text-xs.truncate(style="color: var(--text-secondary)") {{ task.assignedToName }}
          .text-center.py-12(v-if="!grantedProjects.length")
            Icon(name="ph:clipboard-text" size="48" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

  ActionModel(v-model="deleteDialog" :loading="deleting" :description="$t('common.deleteConfirmMessage')" @confirm="handleDelete")
  </template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import OperationsDailyTasksStatistics from '@/components/operations/daily-tasks/Statistics.vue';
import logger from '~/utils/logger';

const { t } = useI18n();
const activeName = ref('info');
const loading = ref(false);
const router = useRouter();
const deleteDialog = ref(false);
const deleteId = ref(null);
const deleting = ref(false);

onMounted(async () => {
  await handleClick({ props: { name: activeName.value } });
});

// Table columns configuration
const activeColumns = [
  {
    prop: 'createdAt',
    label: useI18n().t('operations.dailyTasks.table.date'),
    component: 'Text',
    sortable: true,
    width: 150,
    pdf: 'Date',
    type: 'font-default'
  },
  {
    prop: 'clientName',
    label: useI18n().t('operations.dailyTasks.table.client'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Client Name',
    type: 'font-default'
  },
  {
    prop: 'name',
    label: useI18n().t('operations.dailyTasks.table.description'),
    component: 'Text',
    width: 300,
    pdf: 'Description',
    type: 'font-default'
  },
  {
    prop: 'salesRepresentativeName',
    label: useI18n().t('operations.dailyTasks.table.salesRep'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Sales',
    type: 'font-default'
  },
  {
    prop: 'assignedToName',
    label: useI18n().t('operations.dailyTasks.table.assignedTo'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Assigned',
    type: 'font-default'
  },
  {
    prop: 'priority',
    label: useI18n().t('operations.dailyTasks.table.priority'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Priority',
    type: 'font-default'
  },
  {
    prop: 'notes',
    label: useI18n().t('operations.dailyTasks.table.notes'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Notes',
    type: 'font-default'
  },
  {
    prop: 'status',
    label: useI18n().t('operations.dailyTasks.table.status'),
    component: 'Label',
    sortable: true,
    width: 200,
    pdf: 'Status',
    type: 'outline'
  },
  {
    prop: 'action',
    label: useI18n().t('common.action'),
    component: 'Action'
  }
];

// Reuse the same columns structure for other tabs
const completedColumns = [
  {
    prop: 'createdAt',
    label: useI18n().t('operations.dailyTasks.table.date'),
    component: 'Text',
    sortable: true,
    width: 100,
    pdf: 'Date',
    type: 'font-default'
  },
  {
    prop: 'clientName',
    label: useI18n().t('operations.dailyTasks.table.client'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Client',
    type: 'font-default'
  },
  {
    prop: 'name',
    label: useI18n().t('operations.dailyTasks.table.description'),
    component: 'Text',
    width: 300,
    pdf: 'Description',
    type: 'font-default'
  },
  {
    prop: 'salesRepresentativeName',
    label: useI18n().t('operations.dailyTasks.table.salesRep'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Sales',
    type: 'font-default'
  },
  {
    prop: 'assignedToName',
    label: useI18n().t('operations.dailyTasks.table.assignedTo'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Assigned',
    type: 'font-default'
  },
  {
    prop: 'notes',
    label: useI18n().t('operations.dailyTasks.table.notes'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Notes',
    type: 'font-default'
  },
  {
    prop: 'status',
    label: useI18n().t('operations.dailyTasks.table.status'),
    component: 'Label',
    sortable: true,
    width: 200,
    pdf: 'Status',
    type: 'outline'
  },
  {
    prop: 'cost',
    label: useI18n().t('operations.dailyTasks.table.cost'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Cost',
    type: 'font-default'
  },
  {
    prop: 'totalPaid',
    label: useI18n().t('operations.dailyTasks.table.amountPaid'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Amount paid',
    type: 'font-default'
  },
  {
    prop: 'rest',
    label: useI18n().t('operations.dailyTasks.table.rest'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Rest',
    type: 'font-default'
  },
  {
    prop: 'action',
    label: useI18n().t('common.action'),
    component: 'Action'
  }
];

const grantedColumns = [
  {
    prop: 'createdAt',
    label: useI18n().t('operations.dailyTasks.table.date'),
    component: 'Text',
    sortable: true,
    width: 150,
    pdf: 'Date',
    type: 'font-default'
  },
  {
    prop: 'clientName',
    label: useI18n().t('operations.dailyTasks.table.client'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Client',
    type: 'font-default'
  },
  {
    prop: 'name',
    label: useI18n().t('operations.dailyTasks.table.description'),
    component: 'Text',
    width: 300,
    pdf: 'Description',
    type: 'font-default'
  },
  {
    prop: 'cost',
    label: useI18n().t('operations.dailyTasks.table.cost'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Cost',
    type: 'font-default'
  },
  {
    prop: 'downPayment',
    label: useI18n().t('operations.dailyTasks.table.downPayment'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Down Payment',
    type: 'font-default'
  },
  {
    prop: 'salesRepresentativeName',
    label: useI18n().t('operations.dailyTasks.table.salesRep'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Sales',
    type: 'font-default'
  },
  {
    prop: 'assignedToName',
    label: useI18n().t('operations.dailyTasks.table.assignedTo'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Assigned',
    type: 'font-default'
  },
  {
    prop: 'notes',
    label: useI18n().t('operations.dailyTasks.table.notes'),
    component: 'Text',
    sortable: true,
    width: 200,
    pdf: 'Notes',
    type: 'font-default'
  },
  {
    prop: 'status',
    label: useI18n().t('operations.dailyTasks.table.status'),
    component: 'Label',
    sortable: true,
    width: 200,
    pdf: 'Status',
    type: 'outline'
  },
  {
    prop: 'action',
    label: useI18n().t('common.action'),
    component: 'Action'
  }
];

// Mock data - Replace with actual API calls
const activeProjects = ref([]);
const completedProjects = ref([]);
const grantedProjects = ref([]);

// Mock data - Replace with actual API calls
const activeProjectsPagination = ref([]);
const completedProjectsPagination = ref([]);
const grantedProjectsPagination = ref([]);

// Handle tab click
const handleClick = async tab => {
  try {
    // Fetch data based on selected tab
    loading.value = true;
    switch (tab.props.name) {
      case 'active': {
        const response = await useTableFilter('daily-task', { status: 'ACTIVE,ON_HOLD' });
        activeProjects.value = await response.formattedData?.map(task => ({
          ...task,
          createdAt: task.date,
          updatedAt: '-',
          clientName: task.client?.clientName,
          salesRepresentativeName: task.salesRepresentative?.name,
          assignedToName: task.user?.name
        }));
        activeProjectsPagination.value = await response.pagination;

        break;
      }
      case 'completed': {
        const responseCompleted = await useTableFilter('daily-task', {
          status: 'COMPLETED'
        });
        completedProjects.value = responseCompleted.formattedData?.map(task => ({
          ...task,
          createdAt: task?.date,
          updatedAt: '-',
          clientName: task.client?.clientName,
          salesRepresentativeName: task.salesRepresentative?.name,
          assignedToName: task.user?.name
        }));
        completedProjectsPagination.value = responseCompleted.pagination;
        break;
      }
      case 'granted': {
        const responseGranted = await useTableFilter('daily-task', {
          status: 'WAITING_FOR_CONTRACT,CONTRACT_SIGNED'
        });
        grantedProjects.value = responseGranted.formattedData?.map(task => ({
          ...task,
          createdAt: task?.date,
          updatedAt: '-',
          clientName: task.client?.clientName,
          salesRepresentativeName: task.salesRepresentative?.name,
          assignedToName: task.user?.name
        }));

        grantedProjectsPagination.value = responseGranted.pagination;
        break;
      }
    }
  } catch (error) {
    logger.error('Error fetching data:', error);
    ElMessage.error(t('common.fetchError'));
  } finally {
    loading.value = false;
  }
};

// Export to PDF
const exportToPDF = async () => {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const CairoFont = (await import('../assets/fonts/Cairo-SemiBold.ttf')).default;

  const data =
    activeName.value === 'active' ? activeProjects.value : activeName.value === 'completed' ? completedProjects.value : grantedProjects.value;
  const name =
    activeName.value === 'active'
      ? t('operations.dailyTasks.tabs.active')
      : activeName.value === 'completed'
        ? t('operations.dailyTasks.tabs.completed')
        : t('operations.dailyTasks.tabs.granted');
  const columns = activeName.value === 'active' ? activeColumns : activeName.value === 'completed' ? completedColumns : grantedColumns;

  // Initialize jsPDF
  const doc = new JsPDF({
    orientation: 'l', // Portrait mode
    unit: 'mm',
    format: [500, 210] // Wider page (500mm width, 210mm height)
  });
  // Center title (h2 format)

  doc.addFont(CairoFont, 'Cairo', 'normal');
  doc.setFont('Cairo');
  doc.text(`${name}`, 250, 10);

  // Use the imported `autoTable` function
  autoTable(doc, {
    head: [columns.map(column => column.pdf)],
    body: data.map(item => columns.map(column => item[column.prop] ?? 'N/A')),
    headStyles: {
      fillColor: [248, 247, 250], // Background color as rgba(231, 230, 233, 1)
      textColor: [101, 101, 101], // Ensuring text is visible
      fontStyle: 'normal',
      fontSize: 12,
      font: 'Cairo'
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      font: 'Cairo'
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    styles: {
      lineWidth: 0.4, // Border width set to 1px
      lineColor: [231, 230, 233] // Black border
    }
  });
  // Save the PDF
  doc.save(`${name}${new Date().toLocaleDateString()}.pdf`);
};
const addTask = () => {
  // Implement add task logic
  ElMessage.success(t('dailyTask.taskAdding'));
};
// Format date
const formatDate = date => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

// Handle delete
async function handleDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const res = await useApiFetch('daily-task/' + deleteId.value, 'DELETE');
    if (res?.success) {
      ElMessage.success(t('common.deletedSuccess'));
      // Refresh current tab data
      await handleClick({ props: { name: activeName.value } });
    } else {
      ElMessage.error(t('common.deleteError'));
    }
  } catch {
    ElMessage.error(t('common.deleteError'));
  } finally {
    deleting.value = false;
    deleteDialog.value = false;
    deleteId.value = null;
  }
}

// Handle view action
const handleView = row => {
  router.push(`/operations/daily-task/${row?.id}`);
};

// Mobile helper
function getTaskTagType(status) {
  const map = { ACTIVE: 'warning', ON_HOLD: 'info', COMPLETED: 'success', WAITING_FOR_CONTRACT: '', CONTRACT_SIGNED: 'success' };
  return map[status] || 'info';
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('dtask', #f59e0b);

.demo-tabs {
  @apply w-full;
}
</style>
