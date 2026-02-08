<template lang="pug">
.audit-logs-page.p-8
  .header.mb-8.flex.justify-between.items-center
    div
        h2(class="text-3xl font-bold text-primary mb-2") Audit Logs
        p.text-muted Full transparency into system activities and user actions.
    el-button(type="primary" @click="fetchLogs" :loading="loading") 
        Icon(name="ph:arrows-clockwise-bold" size="18" class="mr-1")
        | Refresh
  
  .filters.mb-6.flex.gap-4
    el-input(v-model="search" placeholder="Search logs..." class="glass-input max-w-xs")
    el-select(v-model="filterType" placeholder="Activity Type" class="glass-input")
        el-option(label="All" value="")
        el-option(label="Update" value="update")
        el-option(label="Create" value="create")
        el-option(label="Delete" value="delete")

  .glass-card.p-4.rounded-3xl
    AppTable(
        :data="filteredLogs" 
        :columns="columns"
        :loading="loading"
    )
        template(#status="{ row }")
            el-tag(:type="getTypeColor(row.status)" effect="plain" class="!rounded-lg") {{ row.status.toUpperCase() }}
        
        template(#user="{ row }")
            .flex.items-center.gap-2
                Avatar(:src="row.user?.profilePicture" small)
                span.text-xs {{ row.user?.name || 'System' }}
</template>

<script setup lang="ts">
const loading = ref(false);
const logs = ref<any[]>([]);
const search = ref('');
const filterType = ref('');

const columns = [
  { prop: 'createdAt', label: 'Timestamp', width: 180 },
  { prop: 'user', label: 'Actor', width: 200, slot: 'user' },
  { prop: 'status', label: 'Action', width: 120, slot: 'status' },
  { prop: 'entityType', label: 'Module', width: 120 },
  { prop: 'description', label: 'Description', minWidth: 250 }
];

onMounted(async () => {
  await fetchLogs();
});

const fetchLogs = async () => {
  loading.value = true;
  try {
    const response: any = await useApiFetch('activity?limit=100');
    if (response.success && response.docs) {
      logs.value = response.docs;
    }
  } finally {
    loading.value = false;
  }
};

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchesSearch = log.description?.toLowerCase().includes(search.value.toLowerCase());
    const matchesType = !filterType.value || log.status === filterType.value;
    return matchesSearch && matchesType;
  });
});

const getTypeColor = (status: string) => {
  switch (status) {
    case 'create':
      return 'success';
    case 'update':
      return 'warning';
    case 'delete':
      return 'danger';
    default:
      return 'info';
  }
};
</script>

<style lang="scss" scoped></style>
