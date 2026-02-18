<template lang="pug">
div
  ModuleHeader(
    :title="$t('navigation.auditLogs')"
    :subtitle="$t('auditLogs.subtitle')"
  )
    template(#actions)
      el-button(size="large" type="primary" @click="fetchLogs" :loading="loading" class="!rounded-2xl")
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-1 {{ $t('common.refresh') }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    .px-6.flex.items-center.flex-wrap.gap-2.mb-6.justify-start
      .input.table-search(class="w-full md:w-[250px]")
        el-input(size="large" style="height:50px" v-model="search" :placeholder="$t('auditLogs.searchPlaceholder')" clearable)
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16")
      el-select(v-model="filterAction" clearable :placeholder="$t('auditLogs.action')" @change="applyFilters" class="w-44" size="large")
        el-option(:label="$t('auditLogs.all')" value="")
        el-option(:label="$t('auditLogs.create')" value="create")
        el-option(:label="$t('auditLogs.update')" value="update")
        el-option(:label="$t('auditLogs.delete')" value="delete")
      el-select(v-model="filterModule" clearable :placeholder="$t('auditLogs.allModules')" @change="applyFilters" class="w-44" size="large")
        el-option(:label="$t('auditLogs.allModules')" value="")
        el-option(v-for="mod in availableModules" :key="mod" :label="capitalizeModule(mod)" :value="mod")

    el-table(:data="paginatedLogs" v-loading="loading" style="width: 100%")
      el-table-column(:label="$t('auditLogs.timestamp')" width="190")
        template(#default="{ row }")
          .text-sm {{ formatDate(row.createdAt) }}
      el-table-column(:label="$t('auditLogs.actor')" min-width="200")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-9.h-9.rounded-full.flex.items-center.justify-center.text-white.text-sm.font-bold(style="background: linear-gradient(135deg, #7849ff, #a78bfa)") {{ getInitials(row.user?.name) }}
            div
              .font-bold(style="color: var(--text-primary)") {{ row.user?.name || 'System' }}
              .text-xs(style="color: var(--text-muted)") {{ row.user?.email || '' }}
      el-table-column(:label="$t('auditLogs.action')" width="130")
        template(#default="{ row }")
          span.border.rounded-xl.text-xs.px-2(:class="getActionClass(row.status)") {{ (row.status || '').toUpperCase() }}
      el-table-column(:label="$t('auditLogs.module')" width="150")
        template(#default="{ row }")
          span.font-medium(style="color: var(--text-primary)") {{ capitalizeModule(row.entityType) }}
      el-table-column(:label="$t('auditLogs.description')" min-width="280")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-secondary)") {{ row.description || '—' }}
      template(#empty)
        el-empty(:description="$t('common.noData')" image="/images/empty.png")

    .pagination.mt-5.flex.items-center.flex-wrap.gap-2.px-6(class="sm:justify-between justify-center" v-if="totalPages > 1")
      span.text-xs(style="color: var(--text-muted)") {{ filteredLogs.length }} {{ $t('common.entries') }}
      el-pagination(background style="direction:ltr" :pager-count="4" v-model:current-page="currentPage" :page-size="pageSize" layout="prev, pager, next" :total="filteredLogs.length" @current-change="onPageChange")
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const logs = ref<any[]>([]);
const search = ref('');
const filterAction = ref('');
const filterModule = ref('');
const currentPage = ref(1);
const pageSize = 20;

onMounted(async () => {
  await fetchLogs();
});

const fetchLogs = async () => {
  loading.value = true;
  try {
    const response: any = await useApiFetch('activity?limit=100');
    if (response.success && response.body) {
      logs.value = Array.isArray(response.body) ? response.body : [];
    }
  } finally {
    loading.value = false;
  }
};

const availableModules = computed(() => {
  const modules = new Set(logs.value.map((log: any) => log.entityType).filter(Boolean));
  return Array.from(modules).sort();
});

const filteredLogs = computed(() => {
  return logs.value.filter((log: any) => {
    const matchesSearch = !search.value
      || log.description?.toLowerCase().includes(search.value.toLowerCase())
      || log.user?.name?.toLowerCase().includes(search.value.toLowerCase())
      || log.entityType?.toLowerCase().includes(search.value.toLowerCase());
    const matchesAction = !filterAction.value || log.status === filterAction.value;
    const matchesModule = !filterModule.value || log.entityType === filterModule.value;
    return matchesSearch && matchesAction && matchesModule;
  });
});

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / pageSize));

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredLogs.value.slice(start, start + pageSize);
});

const summaryStats = computed(() => [
  { label: t('auditLogs.totalLogs'), value: logs.value.length, icon: 'ph:list-bullets-bold', color: '#7849ff' },
  { label: t('auditLogs.creates'), value: logs.value.filter((l: any) => l.status === 'create').length, icon: 'ph:plus-circle-bold', color: '#22c55e' },
  { label: t('auditLogs.updates'), value: logs.value.filter((l: any) => l.status === 'update').length, icon: 'ph:pencil-simple-bold', color: '#f59e0b' },
  { label: t('auditLogs.deletes'), value: logs.value.filter((l: any) => l.status === 'delete').length, icon: 'ph:trash-bold', color: '#ef4444' }
]);

function applyFilters() {
  currentPage.value = 1;
}

function onPageChange(page: number) {
  currentPage.value = page;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name?: string): string {
  if (!name) return 'S';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getActionClass(status: string): string {
  switch (status) {
    case 'create': return 'label-outline-green';
    case 'update': return 'label-outline-orange';
    case 'delete': return 'label-outline-red';
    default: return 'label-outline-green';
  }
}

function capitalizeModule(mod?: string): string {
  if (!mod) return '—';
  return mod.charAt(0).toUpperCase() + mod.slice(1).replace(/([A-Z])/g, ' $1');
}
</script>
