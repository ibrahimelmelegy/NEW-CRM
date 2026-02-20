<template lang="pug">
.security-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('security.title') }}
    p(style="color: var(--text-muted)") {{ $t('security.subtitle') }}

  //- Tabs
  el-tabs(v-model="activeTab" class="security-tabs")
    //- Overview Tab
    el-tab-pane(:label="$t('security.tabOverview')" name="overview")
      .grid.gap-4.mb-6(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
        .stat-card.glass-card.p-5(v-for="stat in dashboardStats" :key="stat.label")
          .flex.items-center.justify-between
            div
              .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ stat.label }}
              .text-2xl.font-bold(style="color: var(--text-primary)") {{ stat.value }}
            .stat-icon(:style="{ background: stat.bgColor }")
              Icon(:name="stat.icon" size="24" :style="{ color: stat.color }")

      //- Recent Login Activity
      .glass-card.p-6
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('security.recentActivity') }}
        el-table(:data="recentLogins" v-loading="dashboardLoading" style="width: 100%")
          el-table-column(:label="$t('security.date')" width="180")
            template(#default="{ row }")
              .text-sm {{ formatDate(row.createdAt) }}
          el-table-column(:label="$t('security.user')" min-width="200")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-7.h-7.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(style="background: linear-gradient(135deg, #7849ff, #a78bfa)") {{ getInitials(row.user?.name) }}
                div
                  .text-sm.font-medium(style="color: var(--text-primary)") {{ row.user?.name || '--' }}
                  .text-xs(style="color: var(--text-muted)") {{ row.user?.email || '' }}
          el-table-column(:label="$t('security.ipAddress')" width="150")
            template(#default="{ row }")
              span.font-mono.text-xs(style="color: var(--text-secondary)") {{ row.ip }}
          el-table-column(:label="$t('security.status')" width="120" align="center")
            template(#default="{ row }")
              el-tag(:type="getStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
          template(#empty)
            .py-6.text-center
              Icon(name="ph:shield-check-bold" size="40" style="color: var(--text-muted)")
              p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('security.noRecentActivity') }}

    //- Authentication Tab (2FA + Password)
    el-tab-pane(:label="$t('security.tabAuthentication')" name="authentication")
      .max-w-2xl
        //- 2FA Section
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.mb-6
            .flex.items-center.gap-4
              .icon-box(style="background: rgba(120, 73, 255, 0.1)")
                Icon(name="ph:shield-check-bold" size="28" class="text-[#7849ff]" aria-hidden="true")
              div
                h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('security.twoFactorAuth') }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('security.twoFactorSubtitle') }}
            el-tag(:type="is2FAEnabled ? 'success' : 'info'" effect="dark" size="large") {{ is2FAEnabled ? $t('security.enabled') : $t('security.disabled') }}

          template(v-if="is2FAEnabled")
            .flex.items-center.gap-3.p-4.rounded-xl.mb-4(style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.2)")
              Icon(name="ph:check-circle-bold" size="20" class="text-green-500" aria-hidden="true")
              span.text-sm(style="color: var(--text-primary)") {{ $t('security.twoFactorActive') }}

            template(v-if="showDisable")
              SettingsTwoFactorDisable(@disabled="onDisabled" @cancel="showDisable = false")
            template(v-else)
              el-button(type="danger" plain @click="showDisable = true" class="!rounded-xl") {{ $t('security.disableTwoFactor') }}

          template(v-else)
            SettingsTwoFactorSetup(@enabled="onEnabled")

        //- Password Section
        .glass-card.p-6
          .flex.items-center.gap-4.mb-6
            .icon-box(style="background: rgba(255, 123, 0, 0.1)")
              Icon(name="ph:key-bold" size="28" class="text-[#ff7b00]" aria-hidden="true")
            div
              h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('security.passwordSettings') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('security.passwordSubtitle') }}

          NuxtLink(to="/forget-password")
            el-button(type="primary" plain class="!rounded-xl") {{ $t('security.changePassword') }}

    //- Active Sessions Tab
    el-tab-pane(:label="$t('security.tabSessions')" name="sessions")
      SecurityActiveSessions

    //- Login History Tab
    el-tab-pane(:label="$t('security.tabLoginHistory')" name="history")
      SecurityLoginHistory

    //- IP Whitelist Tab
    el-tab-pane(:label="$t('security.tabIPWhitelist')" name="whitelist")
      SecurityIPWhitelist

    //- Data Export Tab
    el-tab-pane(:label="$t('security.tabDataExport')" name="export")
      .max-w-2xl
        .glass-card.p-6
          .flex.items-center.gap-4.mb-6
            .icon-box(style="background: rgba(34, 197, 94, 0.1)")
              Icon(name="ph:download-bold" size="28" class="text-green-500" aria-hidden="true")
            div
              h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('security.gdprExport') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('security.gdprExportDescription') }}

          .p-4.rounded-xl.mb-6(style="background: rgba(120, 73, 255, 0.05); border: 1px solid rgba(120, 73, 255, 0.15)")
            .flex.items-start.gap-3
              Icon(name="ph:info-bold" size="20" class="text-[#7849ff] mt-0.5" aria-hidden="true")
              div
                p.text-sm.font-medium.mb-1(style="color: var(--text-primary)") {{ $t('security.gdprInfoTitle') }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('security.gdprInfoDescription') }}

          el-button(
            type="primary"
            size="large"
            @click="handleExport"
            :loading="exportLoading"
            class="!rounded-xl"
          )
            Icon(name="ph:file-arrow-down-bold" size="18")
            span.ml-2 {{ $t('security.exportMyData') }}

          //- Export Preview
          template(v-if="exportedData")
            .mt-6.p-4.rounded-xl(style="background: var(--glass-bg); border: 1px solid var(--glass-border-color)")
              .flex.items-center.justify-between.mb-3
                span.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('security.exportPreview') }}
                el-button(type="primary" link size="small" @click="downloadExport")
                  Icon(name="ph:download-simple-bold" size="16")
                  span.ml-1 {{ $t('security.downloadJSON') }}
              .text-xs.font-mono.overflow-auto.max-h-64(style="color: var(--text-secondary)") {{ JSON.stringify(exportedData, null, 2) }}
</template>

<script setup lang="ts">
import { user as currentUser } from '~/composables/useUser';
import { useSecurity, type SecurityDashboard } from '~/composables/useSecurity';

const { $i18n } = useNuxtApp();
const t = $i18n.t;

definePageMeta({
  title: 'Security Settings'
});

const activeTab = ref('overview');
const showDisable = ref(false);
const exportLoading = ref(false);
const dashboardLoading = ref(false);
const exportedData = ref<Record<string, any> | null>(null);

const {
  dashboard,
  fetchDashboard,
  exportData
} = useSecurity();

const is2FAEnabled = computed(() => !!currentUser.value?.twoFactorEnabled);

const recentLogins = computed(() => dashboard.value?.recentLogins || []);

const dashboardStats = computed(() => [
  {
    label: t('security.totalLoginsToday'),
    value: dashboard.value?.totalLoginsToday ?? 0,
    icon: 'ph:sign-in-bold',
    color: '#7849ff',
    bgColor: 'rgba(120, 73, 255, 0.1)'
  },
  {
    label: t('security.failedAttempts'),
    value: dashboard.value?.failedAttemptsToday ?? 0,
    icon: 'ph:warning-circle-bold',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)'
  },
  {
    label: t('security.activeSessionsCount'),
    value: dashboard.value?.activeSessions ?? 0,
    icon: 'ph:devices-bold',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)'
  },
  {
    label: t('security.uniqueIPs'),
    value: dashboard.value?.uniqueIPsToday ?? 0,
    icon: 'ph:globe-bold',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)'
  }
]);

onMounted(async () => {
  dashboardLoading.value = true;
  await fetchDashboard();
  dashboardLoading.value = false;
});

async function onEnabled() {
  await useUser();
}

async function onDisabled() {
  showDisable.value = false;
  await useUser();
}

async function handleExport() {
  exportLoading.value = true;
  const data = await exportData();
  exportLoading.value = false;
  if (data) {
    exportedData.value = data;
    ElMessage.success(t('security.exportSuccess'));
  } else {
    ElMessage.error(t('security.exportFailed'));
  }
}

function downloadExport() {
  if (!exportedData.value) return;
  const blob = new Blob([JSON.stringify(exportedData.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function getStatusType(status: string): 'success' | 'danger' | 'warning' | 'info' {
  switch (status) {
    case 'SUCCESS': return 'success';
    case 'FAILED': return 'danger';
    case 'BLOCKED': return 'warning';
    default: return 'info';
  }
}

function getInitials(name?: string): string {
  if (!name) return 'S';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
</script>

<style lang="scss" scoped>
.security-page {
  animation: fadeIn 0.5s ease-out;
}

.icon-box {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.stat-card {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

:deep(.security-tabs) {
  .el-tabs__header {
    margin-bottom: 24px;
  }

  .el-tabs__item {
    font-size: 14px;
    font-weight: 500;
  }
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
