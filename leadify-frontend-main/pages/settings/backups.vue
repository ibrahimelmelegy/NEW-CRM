<template lang="pug">
.backup-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('backups.title') }}
    p(style="color: var(--text-muted)") {{ $t('backups.subtitle') }}

  //- Stats Cards
  .grid.gap-4.mb-6(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
    .glass-card.p-5
      .flex.items-center.justify-between
        div
          .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.totalBackups') }}
          .text-2xl.font-bold(style="color: var(--text-primary)") {{ stats?.totalBackups || 0 }}
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
          Icon(name="ph:database-bold" size="22" class="text-[#7849ff]")
    .glass-card.p-5
      .flex.items-center.justify-between
        div
          .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.completedBackups') }}
          .text-2xl.font-bold.text-green-500 {{ stats?.completedBackups || 0 }}
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.1)")
          Icon(name="ph:check-circle-bold" size="22" class="text-green-500")
    .glass-card.p-5
      .flex.items-center.justify-between
        div
          .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.totalSize') }}
          .text-2xl.font-bold(style="color: var(--text-primary)") {{ formatSize(stats?.totalSize || 0) }}
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.1)")
          Icon(name="ph:hard-drives-bold" size="22" class="text-blue-500")
    .glass-card.p-5
      .flex.items-center.justify-between
        div
          .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.autoBackup') }}
          .text-2xl.font-bold(:class="stats?.autoBackupActive ? 'text-green-500' : 'text-gray-400'") {{ stats?.autoBackupActive ? $t('backups.active') : $t('backups.inactive') }}
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(255, 123, 0, 0.1)")
          Icon(name="ph:clock-clockwise-bold" size="22" class="text-[#ff7b00]")

  //- Action Bar
  .glass-card.p-4.mb-6
    .flex.items-center.flex-wrap.gap-3.justify-between
      .flex.items-center.gap-3
        el-button(type="primary" size="large" @click="handleCreateBackup" :loading="actionLoading" class="!rounded-2xl")
          Icon(name="ph:plus-bold" size="16")
          span.ml-1 {{ $t('backups.createBackup') }}
        el-button(size="large" @click="handleCleanup" :loading="actionLoading" class="!rounded-2xl")
          Icon(name="ph:broom-bold" size="16")
          span.ml-1 {{ $t('backups.cleanup') }}
      .flex.items-center.gap-3
        el-switch(
          v-model="autoBackupEnabled"
          :active-text="$t('backups.autoBackupOn')"
          :inactive-text="$t('backups.autoBackupOff')"
          @change="handleToggleAutoBackup"
        )
        el-button(size="large" @click="refreshAll" :loading="loading" class="!rounded-2xl")
          Icon(name="ph:arrows-clockwise-bold" size="16")
          span.ml-1 {{ $t('common.refresh') }}

  //- Last Backup Info
  .glass-card.p-5.mb-6(v-if="stats?.lastSuccessfulBackup")
    .flex.items-center.gap-4
      .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.1)")
        Icon(name="ph:shield-check-bold" size="28" class="text-green-500")
      div
        .text-sm.font-bold(style="color: var(--text-primary)") {{ $t('backups.lastSuccessful') }}
        .text-xs(style="color: var(--text-muted)") {{ formatDate(stats.lastSuccessfulBackup.completedAt) }} - {{ formatSize(stats.lastSuccessfulBackup.fileSize) }}

  //- Backups Table
  .glass-card.py-8.animate-entrance
    .px-6.flex.items-center.flex-wrap.gap-2.mb-6.justify-start
      el-select(v-model="filterStatus" clearable :placeholder="$t('backups.allStatuses')" @change="applyFilters" class="w-44" size="large")
        el-option(:label="$t('backups.allStatuses')" value="")
        el-option(:label="$t('backups.statusCompleted')" value="completed")
        el-option(:label="$t('backups.statusFailed')" value="failed")
        el-option(:label="$t('backups.statusPending')" value="pending")
        el-option(:label="$t('backups.statusInProgress')" value="in_progress")
      el-select(v-model="filterType" clearable :placeholder="$t('backups.allTypes')" @change="applyFilters" class="w-44" size="large")
        el-option(:label="$t('backups.allTypes')" value="")
        el-option(:label="$t('backups.typeFull')" value="full")
        el-option(:label="$t('backups.typeManual')" value="manual")
        el-option(:label="$t('backups.typeIncremental')" value="incremental")

    el-table(:data="backups" v-loading="loading" style="width: 100%")
      el-table-column(:label="$t('backups.filename')" min-width="280")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-9.h-9.rounded-lg.flex.items-center.justify-center(:style="getTypeStyle(row.backupType)")
              Icon(:name="getTypeIcon(row.backupType)" size="18")
            div
              .text-sm.font-bold(style="color: var(--text-primary)") {{ row.filename }}
              .text-xs(style="color: var(--text-muted)") {{ row.creator?.name || $t('backups.system') }}
      el-table-column(:label="$t('backups.type')" width="130")
        template(#default="{ row }")
          el-tag(:type="getTypeTagType(row.backupType)" effect="plain" size="small" round) {{ getTypeLabel(row.backupType) }}
      el-table-column(:label="$t('backups.status')" width="140")
        template(#default="{ row }")
          .flex.items-center.gap-2
            .w-2.h-2.rounded-full(:class="getStatusDotClass(row.status)")
            span.text-sm(:style="{ color: getStatusColor(row.status) }") {{ getStatusLabel(row.status) }}
      el-table-column(:label="$t('backups.size')" width="120")
        template(#default="{ row }")
          span.text-sm.font-medium(style="color: var(--text-primary)") {{ row.status === 'completed' ? formatSize(row.fileSize) : '--' }}
      el-table-column(:label="$t('backups.date')" width="190")
        template(#default="{ row }")
          div
            .text-sm(style="color: var(--text-primary)") {{ formatDate(row.startedAt) }}
            .text-xs(style="color: var(--text-muted)" v-if="row.completedAt") {{ getDuration(row.startedAt, row.completedAt) }}
      el-table-column(:label="$t('backups.actions')" width="180" align="center")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-1
            el-tooltip(:content="$t('backups.download')" v-if="row.status === 'completed'")
              el-button(link type="primary" @click="handleDownload(row.id)")
                Icon(name="ph:download-simple-bold" size="18")
            el-tooltip(:content="$t('backups.restore')" v-if="row.status === 'completed'")
              el-button(link type="warning" @click="confirmRestore(row)")
                Icon(name="ph:arrow-counter-clockwise-bold" size="18")
            el-tooltip(:content="$t('backups.viewDetails')" v-if="row.metadata")
              el-button(link type="info" @click="showDetails(row)")
                Icon(name="ph:info-bold" size="18")
            el-tooltip(:content="$t('backups.deleteBackup')")
              el-button(link type="danger" @click="confirmDelete(row)")
                Icon(name="ph:trash-bold" size="18")
      template(#empty)
        .py-10.text-center
          Icon(name="ph:database-bold" size="48" style="color: var(--text-muted)")
          p.mt-3.text-sm(style="color: var(--text-muted)") {{ $t('backups.noBackups') }}
          el-button(type="primary" class="!rounded-2xl mt-4" @click="handleCreateBackup" :loading="actionLoading")
            Icon(name="ph:plus-bold" size="16")
            span.ml-1 {{ $t('backups.createFirst') }}

    //- Pagination
    .pagination.mt-5.flex.items-center.flex-wrap.gap-2.px-6(class="sm:justify-between justify-center" v-if="paginationData.totalPages > 1")
      span.text-xs(style="color: var(--text-muted)") {{ paginationData.totalItems }} {{ $t('common.entries') }}
      el-pagination(
        background
        style="direction:ltr"
        :pager-count="4"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="paginationData.totalItems"
        @current-change="onPageChange"
      )

  //- Restore Confirmation Dialog
  el-dialog(
    v-model="restoreDialogVisible"
    :title="$t('backups.restoreConfirmTitle')"
    width="480px"
    :close-on-click-modal="false"
  )
    .text-center.py-4
      .w-16.h-16.rounded-full.flex.items-center.justify-center.mx-auto.mb-4(style="background: rgba(255, 165, 0, 0.1)")
        Icon(name="ph:warning-bold" size="36" class="text-orange-500")
      p.text-base.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('backups.restoreWarning') }}
      p.text-sm.mb-4(style="color: var(--text-muted)") {{ $t('backups.restoreWarningDetail') }}
      .p-3.rounded-xl.text-left(style="background: rgba(255, 0, 0, 0.05); border: 1px solid rgba(255, 0, 0, 0.15)")
        .text-xs.font-bold.mb-1.text-red-500 {{ $t('backups.restoreFilename') }}:
        .text-sm.font-mono(style="color: var(--text-primary)") {{ selectedBackup?.filename }}
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="restoreDialogVisible = false" class="!rounded-xl") {{ $t('common.cancel') }}
        el-button(type="warning" @click="handleRestore" :loading="actionLoading" class="!rounded-xl") {{ $t('backups.confirmRestore') }}

  //- Details Dialog
  el-dialog(
    v-model="detailsDialogVisible"
    :title="$t('backups.backupDetails')"
    width="600px"
  )
    template(v-if="selectedBackup")
      .space-y-4
        .grid.gap-4(class="grid-cols-2")
          div
            .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.filename') }}
            .text-sm.font-mono(style="color: var(--text-primary)") {{ selectedBackup.filename }}
          div
            .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.status') }}
            el-tag(:type="getStatusTagType(selectedBackup.status)" size="small" round) {{ getStatusLabel(selectedBackup.status) }}
          div
            .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.size') }}
            .text-sm(style="color: var(--text-primary)") {{ formatSize(selectedBackup.fileSize) }}
          div
            .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.type') }}
            .text-sm(style="color: var(--text-primary)") {{ getTypeLabel(selectedBackup.backupType) }}
          div
            .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.startedAt') }}
            .text-sm(style="color: var(--text-primary)") {{ formatDate(selectedBackup.startedAt) }}
          div
            .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.completedAt') }}
            .text-sm(style="color: var(--text-primary)") {{ selectedBackup.completedAt ? formatDate(selectedBackup.completedAt) : '--' }}

        //- Metadata
        template(v-if="selectedBackup.metadata")
          el-divider
          div(v-if="selectedBackup.metadata.pgVersion")
            .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('backups.pgVersion') }}
            .text-sm.font-mono(style="color: var(--text-primary)") {{ selectedBackup.metadata.pgVersion }}
          div(v-if="selectedBackup.metadata.tables")
            .text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('backups.tablesIncluded') }} ({{ selectedBackup.metadata.tables.length }})
            .max-h-48.overflow-y-auto.rounded-xl.p-3(style="background: var(--bg-secondary)")
              .flex.flex-wrap.gap-1
                el-tag(
                  v-for="table in selectedBackup.metadata.tables"
                  :key="table"
                  size="small"
                  type="info"
                  effect="plain"
                ) {{ table }}

        //- Error
        template(v-if="selectedBackup.error")
          el-divider
          .p-3.rounded-xl(style="background: rgba(255, 0, 0, 0.05); border: 1px solid rgba(255, 0, 0, 0.15)")
            .text-xs.font-bold.mb-1.text-red-500 {{ $t('backups.errorDetails') }}
            .text-sm.font-mono.text-red-400 {{ selectedBackup.error }}

  //- Cleanup Dialog
  el-dialog(
    v-model="cleanupDialogVisible"
    :title="$t('backups.cleanupTitle')"
    width="420px"
  )
    .py-2
      p.text-sm.mb-4(style="color: var(--text-secondary)") {{ $t('backups.cleanupDescription') }}
      el-form-item(:label="$t('backups.retentionDays')")
        el-input-number(v-model="retentionDays" :min="1" :max="365" size="large")
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="cleanupDialogVisible = false" class="!rounded-xl") {{ $t('common.cancel') }}
        el-button(type="primary" @click="executeCleanup" :loading="actionLoading" class="!rounded-xl") {{ $t('backups.runCleanup') }}
</template>

<script setup lang="ts">
import { useBackups, type BackupRecord } from '~/composables/useBackups';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const {
  backups,
  pagination: paginationData,
  stats,
  loading,
  actionLoading,
  fetchBackups,
  fetchStats,
  createBackup,
  restoreBackup,
  deleteBackup,
  downloadBackup,
  cleanupBackups,
  updateSchedule
} = useBackups();

// ─── State ────────────────────────────────────────────────────────────────────

const currentPage = ref(1);
const pageSize = 20;
const filterStatus = ref('');
const filterType = ref('');
const autoBackupEnabled = ref(false);
const restoreDialogVisible = ref(false);
const detailsDialogVisible = ref(false);
const cleanupDialogVisible = ref(false);
const selectedBackup = ref<BackupRecord | null>(null);
const retentionDays = ref(30);

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
  await refreshAll();
});

async function refreshAll() {
  await Promise.all([fetchBackups(currentPage.value, pageSize, filterStatus.value || undefined, filterType.value || undefined), fetchStats()]);
  autoBackupEnabled.value = stats.value?.autoBackupActive || false;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleCreateBackup() {
  const result = await createBackup('manual');
  if (result) {
    ElMessage.success(t('backups.createSuccess'));
    await fetchStats();
  } else {
    ElMessage.error(t('backups.createFailed'));
  }
}

function confirmRestore(backup: BackupRecord) {
  selectedBackup.value = backup;
  restoreDialogVisible.value = true;
}

async function handleRestore() {
  if (!selectedBackup.value) return;
  const success = await restoreBackup(selectedBackup.value.id);
  restoreDialogVisible.value = false;
  if (success) {
    ElMessage.success(t('backups.restoreSuccess'));
  } else {
    ElMessage.error(t('backups.restoreFailed'));
  }
}

function confirmDelete(backup: BackupRecord) {
  ElMessageBox.confirm(t('backups.deleteConfirm'), t('backups.deleteTitle'), {
    confirmButtonText: t('common.delete'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  })
    .then(async () => {
      const success = await deleteBackup(backup.id);
      if (success) {
        ElMessage.success(t('backups.deleteSuccess'));
        await fetchStats();
      } else {
        ElMessage.error(t('backups.deleteFailed'));
      }
    })
    .catch(() => {
      // User cancelled
    });
}

function handleDownload(id: number) {
  downloadBackup(id);
}

function showDetails(backup: BackupRecord) {
  selectedBackup.value = backup;
  detailsDialogVisible.value = true;
}

function handleCleanup() {
  cleanupDialogVisible.value = true;
}

async function executeCleanup() {
  const result = await cleanupBackups(retentionDays.value);
  cleanupDialogVisible.value = false;
  if (result) {
    ElMessage.success(t('backups.cleanupSuccess', { count: result.deleted }));
    await fetchStats();
  } else {
    ElMessage.error(t('backups.cleanupFailed'));
  }
}

async function handleToggleAutoBackup(val: boolean) {
  const success = await updateSchedule(val);
  if (success) {
    ElMessage.success(val ? t('backups.autoBackupEnabled') : t('backups.autoBackupDisabled'));
  } else {
    // Revert the toggle
    autoBackupEnabled.value = !val;
    ElMessage.error(t('backups.scheduleFailed'));
  }
}

function applyFilters() {
  currentPage.value = 1;
  fetchBackups(1, pageSize, filterStatus.value || undefined, filterType.value || undefined);
}

function onPageChange(page: number) {
  currentPage.value = page;
  fetchBackups(page, pageSize, filterStatus.value || undefined, filterType.value || undefined);
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleString();
}

function getDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return '<1s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = seconds % 60;
  return `${minutes}m ${remainingSec}s`;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    full: t('backups.typeFull'),
    incremental: t('backups.typeIncremental'),
    manual: t('backups.typeManual')
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: t('backups.statusPending'),
    in_progress: t('backups.statusInProgress'),
    completed: t('backups.statusCompleted'),
    failed: t('backups.statusFailed')
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    completed: '#22c55e',
    failed: '#ef4444'
  };
  return colors[status] || 'var(--text-secondary)';
}

function getStatusDotClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'bg-amber-400',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500'
  };
  return classes[status] || 'bg-gray-400';
}

function getStatusTagType(status: string): string {
  const types: Record<string, string> = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    failed: 'danger'
  };
  return types[status] || 'info';
}

function getTypeTagType(type: string): string {
  const types: Record<string, string> = {
    full: 'primary',
    incremental: '',
    manual: 'info'
  };
  return types[type] || 'info';
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    full: 'ph:database-bold',
    incremental: 'ph:arrows-merge-bold',
    manual: 'ph:hand-bold'
  };
  return icons[type] || 'ph:database-bold';
}

function getTypeStyle(type: string): Record<string, string> {
  const defaultStyle = { background: 'rgba(255, 123, 0, 0.1)', color: '#ff7b00' };
  const styles: Record<string, Record<string, string>> = {
    full: { background: 'rgba(120, 73, 255, 0.1)', color: '#7849ff' },
    incremental: { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
    manual: defaultStyle
  };
  return styles[type] ?? defaultStyle;
}
</script>
