<template lang="pug">
div
  ModuleHeader(
    :title="$t('reports.title')"
    :subtitle="$t('reportsPage.subtitle')"
  )
    template(#actions)
      NuxtLink(to="/reports/builder")
        el-button(size="large" type="primary" class="!rounded-2xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
          Icon(name="ph:plus-bold" size="16")
          span.ml-1 {{ $t('reportsPage.createReport') }}

  el-tabs.demo-tabs(v-model="activeName")
    //- Saved Reports Tab
    el-tab-pane(:label="$t('reportsPage.savedReports')" name="saved")
      .glass-card.py-6.animate-entrance
        .px-6.flex.items-center.gap-2.mb-6
          .input.table-search(class="w-full md:w-[300px]")
            el-input(size="large" v-model="search" :placeholder="$t('reportsPage.searchReports')" clearable)
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="16")
          el-select(v-model="filterEntity" clearable :placeholder="$t('reportsPage.allEntities')" size="large" class="w-44")
            el-option(:label="$t('reportsPage.allEntities')" value="")
            el-option(value="LEAD" :label="$t('navigation.leads')")
            el-option(value="DEAL" :label="$t('navigation.deals')")
            el-option(value="OPPORTUNITY" :label="$t('navigation.opportunities')")
            el-option(value="CLIENT" :label="$t('navigation.clients')")

        el-table(:data="filteredReports" v-loading="loading" style="width: 100%")
          el-table-column(:label="$t('reportsPage.reportName')" min-width="200")
            template(#default="{ row }")
              NuxtLink(:to="`/reports/${row.id}`" class="font-bold hover:underline" style="color: var(--accent-color, #7849ff)") {{ row.name }}
          el-table-column(:label="$t('reportsPage.entityType')" width="150")
            template(#default="{ row }")
              el-tag(size="small" effect="plain" round) {{ row.entityType }}
          el-table-column(:label="$t('reportsPage.createdBy')" width="160")
            template(#default="{ row }")
              span.text-sm {{ row.createdBy?.name || row.userId || '--' }}
          el-table-column(:label="$t('reportsPage.lastRun')" width="160")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ row.lastRunAt ? new Date(row.lastRunAt).toLocaleDateString() : '--' }}
          el-table-column(:label="$t('common.actions')" width="200" fixed="right")
            template(#default="{ row }")
              .flex.items-center.gap-1
                el-button(link size="small" @click="navigateTo(`/reports/${row.id}`)")
                  Icon(name="ph:play-bold" size="16" style="color: #10B981")
                el-button(link size="small" @click="editReport(row)")
                  Icon(name="ph:pencil-simple-bold" size="16" style="color: #3B82F6")
                ExportButton(:filename="row.name" @export="(format: string) => handleExport(row, format)")
                el-button(link size="small" @click="confirmDelete(row)")
                  Icon(name="ph:trash-bold" size="16" class="text-red-400")
          template(#empty)
            el-empty(:description="$t('reportsPage.noReports')")

        .pagination.mt-5.flex.items-center.flex-wrap.gap-2.px-6(class="sm:justify-between justify-center" v-if="filteredReports.length > pageSize")
          span.text-xs(style="color: var(--text-muted)") {{ filteredReports.length }} {{ $t('common.entries') }}
          el-pagination(background style="direction:ltr" :pager-count="4" v-model:current-page="currentPage" :page-size="pageSize" layout="prev, pager, next" :total="filteredReports.length")

    //- Standard Reports Tabs
    el-tab-pane(:label="$t('reports.tabs.sales')" name="sales")
      ReportSalesFilter(:user="user")
    el-tab-pane(:label="$t('reports.tabs.projects')" name="projects")
      ReportProjectsFilter(:user="user")
    el-tab-pane(:label="$t('reports.tabs.performance')" name="performance")
      ReportPerformanceFilter(:user="user")
</template>

<script setup lang="ts">
import { ElMessageBox, ElNotification } from 'element-plus';
import { fetchSavedReports, deleteSavedReport, exportReportCSV, type SavedReport } from '~/composables/useReportBuilder';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const activeName = ref('saved');
const user = ref();
const loading = ref(false);
const search = ref('');
const filterEntity = ref('');
const currentPage = ref(1);
const pageSize = 15;
const reports = ref<SavedReport[]>([]);

// Load user
const response = await useApiFetch('auth/me');
user.value = response?.body;

// Load saved reports
async function loadReports() {
  loading.value = true;
  try {
    reports.value = await fetchSavedReports();
  } finally {
    loading.value = false;
  }
}

const filteredReports = computed(() => {
  let result = reports.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(r => r.name.toLowerCase().includes(q));
  }
  if (filterEntity.value) {
    result = result.filter(r => r.entityType === filterEntity.value);
  }
  return result;
});

function editReport(report: SavedReport) {
  navigateTo({ path: '/reports/builder', query: { id: report.id } });
}

async function confirmDelete(report: SavedReport) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), {
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
    await deleteSavedReport(report.id);
    reports.value = reports.value.filter(r => r.id !== report.id);
    ElNotification({ type: 'success', title: t('common.deleted'), message: '' });
  } catch {}
}

async function handleExport(report: SavedReport, format: string) {
  try {
    const csv = await exportReportCSV(report.config);
    if (csv) {
      const blob = new Blob([csv as string], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (e: any) {
    ElNotification({ type: 'error', title: t('common.error'), message: e?.message || '' });
  }
}

onMounted(() => loadReports());
</script>
