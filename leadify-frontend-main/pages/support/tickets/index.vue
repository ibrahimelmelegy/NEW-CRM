<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize Support Tickets
    .flex.items-center.gap-x-3
      NuxtLink(to="/support/tickets/create")
        el-button(size="large" type="primary" :icon="Plus" class="!rounded-2xl") New Ticket

  //- Status Tabs
  .glass-card.py-8.animate-entrance
    .px-6.mb-6
      el-tabs(v-model="activeTab" @tab-change="handleTabChange")
        el-tab-pane(label="All" name="ALL")
        el-tab-pane(label="Open" name="OPEN")
        el-tab-pane(label="In Progress" name="IN_PROGRESS")
        el-tab-pane(label="Waiting Customer" name="WAITING_CUSTOMER")
        el-tab-pane(label="Resolved" name="RESOLVED")
        el-tab-pane(label="Closed" name="CLOSED")

    //- Filters
    .px-6.flex.items-center.flex-wrap.gap-3.mb-6
      .input.table-search(class="w-full md:w-[250px]")
        el-input(size="large" style="height:50px" v-model="search" placeholder="Search tickets..." clearable @input="debounceLoad")
          template(#prefix)
            el-icon
              Search
      el-select(v-model="priorityFilter" clearable placeholder="Priority" @change="loadTickets" class="w-40" size="large")
        el-option(v-for="p in priorityOptions" :key="p.value" :value="p.value" :label="p.label")
      el-switch(v-model="assignedToMe" active-text="Assigned to Me" @change="loadTickets" class="ml-2")

    //- Table
    .px-6
      el-table(:data="tickets" v-loading="loading" style="width: 100%" @row-click="handleRowClick" row-class-name="cursor-pointer" stripe)
        el-table-column(label="#" width="120")
          template(#default="{ row }")
            span.font-mono.font-bold(style="color: var(--el-color-primary)") {{ row.ticketNumber }}
        el-table-column(label="Subject" min-width="280")
          template(#default="{ row }")
            .flex.flex-col
              span.font-semibold {{ row.subject }}
              span.text-xs(style="color: var(--text-muted)") {{ row.description ? row.description.substring(0, 80) + '...' : '' }}
        el-table-column(label="Status" width="160" align="center")
          template(#default="{ row }")
            el-tag(:color="getStatusColor(row.status)" effect="dark" round size="small") {{ getStatusLabel(row.status) }}
        el-table-column(label="Priority" width="120" align="center")
          template(#default="{ row }")
            el-tag(:color="getPriorityColor(row.priority)" effect="dark" round size="small") {{ row.priority }}
        el-table-column(label="Assignee" width="160")
          template(#default="{ row }")
            span(v-if="row.assignee") {{ row.assignee.name }}
            span.text-gray-400(v-else) Unassigned
        el-table-column(label="Client" width="160")
          template(#default="{ row }")
            span(v-if="row.client") {{ row.client.clientName }}
            span.text-gray-400(v-else) --
        el-table-column(label="Created" width="140")
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.createdAt) }}
        el-table-column(label="SLA" width="100" align="center")
          template(#default="{ row }")
            SupportSLAIndicator(v-if="row.slaDeadline" :deadline="row.slaDeadline" :resolvedAt="row.resolvedAt")
            span.text-gray-400(v-else) --

    //- Pagination
    .px-6.mt-6.flex.justify-center
      el-pagination(
        v-if="pagination.totalPages > 1"
        layout="prev, pager, next"
        :total="pagination.totalItems"
        :page-size="pagination.limit"
        :current-page="pagination.page"
        @current-change="handlePageChange"
      )
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Search } from '@element-plus/icons-vue';
import { fetchTickets, ticketStatusOptions, ticketPriorityOptions, getStatusOption, getPriorityOption } from '@/composables/useSupport';

const router = useRouter();

const loading = ref(false);
const tickets = ref<any[]>([]);
const search = ref('');
const activeTab = ref('ALL');
const priorityFilter = ref('');
const assignedToMe = ref(false);
const priorityOptions = ticketPriorityOptions;

const pagination = ref({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0
});

let debounceTimer: ReturnType<typeof setTimeout>;

function debounceLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1;
    loadTickets();
  }, 400);
}

async function loadTickets() {
  loading.value = true;
  try {
    const query: Record<string, any> = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: search.value || undefined
    };

    if (activeTab.value !== 'ALL') {
      query.status = activeTab.value;
    }
    if (priorityFilter.value) {
      query.priority = priorityFilter.value;
    }

    const { body, success } = await fetchTickets(query);
    if (success && body) {
      tickets.value = body.docs || [];
      pagination.value = body.pagination || pagination.value;
    }
  } finally {
    loading.value = false;
  }
}

function handleTabChange() {
  pagination.value.page = 1;
  loadTickets();
}

function handlePageChange(page: number) {
  pagination.value.page = page;
  loadTickets();
}

function handleRowClick(row: any) {
  router.push(`/support/tickets/${row.id}`);
}

function getStatusColor(status: string): string {
  return getStatusOption(status)!.color;
}

function getStatusLabel(status: string): string {
  return getStatusOption(status)!.label;
}

function getPriorityColor(priority: string): string {
  return getPriorityOption(priority)!.color;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

onMounted(() => {
  loadTickets();
});
</script>
