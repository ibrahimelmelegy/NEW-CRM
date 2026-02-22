<template lang="pug">
.p-6.animate-entrance
  PremiumPageHeader(
    title="Proposals"
    description="Manage all your business proposals"
    icon="ph:file-text-bold"
    primaryColor="#7c3aed"
  )
    template(#actions)
      NuxtLink(to="/sales/proposals/create")
        el-button(size="large" type="primary" class="!rounded-2xl" style="background: var(--bg-obsidian); border: none;")
          Icon(name="ph:plus" size="18" style="margin-right: 6px;")
          | New Proposal

  //- KPI Cards
  PremiumKPICards(:metrics="kpiMetrics")

  //- Filters
  .glass-card.p-4.rounded-2xl.mb-4
    .flex.items-center.gap-4
      el-input(
        v-model="searchKey"
        placeholder="Search proposals..."
        size="large"
        class="!rounded-xl max-w-xs"
        clearable
        @input="debouncedFetch"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="18")

      el-select(v-model="statusFilter" placeholder="All Statuses" size="large" class="w-48" clearable @change="fetchProposals")
        el-option(label="All Statuses" value="")
        el-option(v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value")

      el-select(v-model="typeFilter" placeholder="All Types" size="large" class="w-44" clearable @change="fetchProposals")
        el-option(label="All Types" value="")
        el-option(label="Financial" value="FINANCIAL")
        el-option(label="Technical" value="TECHNICAL")
        el-option(label="Mixed" value="MIXED")

      .ml-auto
        el-button(size="large" class="!rounded-xl" @click="fetchProposals")
          Icon(name="ph:arrows-clockwise" size="16" style="margin-right: 6px;")
          | Refresh

  //- Table
  .glass-card.rounded-2xl.overflow-hidden
    el-table(:data="proposals" v-loading="loading" stripe style="width: 100%;" @sort-change="handleSortChange")
      el-table-column(prop="reference" label="Reference" width="160" sortable="custom")
        template(#default="{ row }")
          span.font-mono.font-bold.text-sm {{ row.reference || '—' }}

      el-table-column(prop="title" label="Title" min-width="200" sortable="custom")
        template(#default="{ row }")
          NuxtLink(:to="`/sales/proposals/${row.id}`" class="font-bold hover:text-purple-600 transition-colors")
            | {{ row.title }}

      el-table-column(prop="proposalFor" label="Client" min-width="160")
        template(#default="{ row }")
          span {{ row.proposalFor || '—' }}

      el-table-column(prop="type" label="Type" width="120" sortable="custom")
        template(#default="{ row }")
          el-tag(size="small" :type="typeTagColor(row.type)" effect="plain" round) {{ row.type }}

      el-table-column(prop="status" label="Status" width="160" sortable="custom")
        template(#default="{ row }")
          el-tag(size="small" :type="statusTagType(row.status)" effect="dark" round) {{ formatStatus(row.status) }}

      el-table-column(prop="createdAt" label="Created" width="130" sortable="custom")
        template(#default="{ row }")
          span.text-sm {{ formatDate(row.createdAt) }}

      el-table-column(label="Actions" width="200" fixed="right")
        template(#default="{ row }")
          .flex.items-center.gap-1
            el-tooltip(content="View / Edit" placement="top")
              el-button(size="small" circle @click="navigateTo(`/sales/proposals/${row.id}`)")
                Icon(name="ph:eye" size="14")
            el-tooltip(v-if="row.status === 'DRAFT'" content="Submit for Approval" placement="top")
              el-button(size="small" circle type="primary" @click="handleSubmitForApproval(row)")
                Icon(name="ph:paper-plane-tilt" size="14")
            el-tooltip(v-if="row.status === 'WAITING_APPROVAL'" content="Approve" placement="top")
              el-button(size="small" circle type="success" @click="handleApprove(row)")
                Icon(name="ph:check" size="14")
            el-tooltip(v-if="row.status === 'WAITING_APPROVAL'" content="Reject" placement="top")
              el-button(size="small" circle type="danger" @click="openRejectDialog(row)")
                Icon(name="ph:x" size="14")
            el-tooltip(content="Delete" placement="top")
              el-button(size="small" circle type="danger" plain @click="handleDelete(row)")
                Icon(name="ph:trash" size="14")

    //- Pagination
    .flex.justify-between.items-center.p-4.border-t(style="border-color: var(--border-default);")
      span.text-sm(style="color: var(--text-muted)") Showing {{ proposals.length }} of {{ totalItems }} proposals
      el-pagination(
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalItems"
        :page-sizes="[10, 20, 50]"
        layout="sizes, prev, pager, next"
        @current-change="fetchProposals"
        @size-change="fetchProposals"
      )

  //- Reject Dialog
  el-dialog(v-model="rejectDialogVisible" title="Reject Proposal" width="420px")
    p.mb-4(style="color: var(--text-secondary)") Please provide a reason for rejection:
    el-input(v-model="rejectReason" type="textarea" :rows="3" placeholder="Enter rejection reason...")
    template(#footer)
      el-button(@click="rejectDialogVisible = false") Cancel
      el-button(type="danger" @click="handleReject" :loading="actionLoading") Reject
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { submitForApproval, approveProposal, rejectProposal, deleteProposal } from '~/composables/useProposals';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';

definePageMeta({ middleware: 'permissions' });

const loading = ref(false);
const actionLoading = ref(false);
const proposals = ref<any[]>([]);
const totalItems = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchKey = ref('');
const statusFilter = ref('');
const typeFilter = ref('');
const sortBy = ref('createdAt');
const sortOrder = ref('DESC');

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Waiting Approval', value: 'WAITING_APPROVAL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const rejectDialogVisible = ref(false);
const rejectReason = ref('');
const rejectTarget = ref<any>(null);

const kpiMetrics = computed<KPIMetric[]>(() => [
  { label: 'Total Proposals', value: totalItems.value, icon: 'ph:file-text-bold', color: '#7c3aed' },
  { label: 'Draft', value: proposals.value.filter(p => p.status === 'DRAFT').length, icon: 'ph:pencil-simple-bold', color: '#6b7280' },
  { label: 'Pending', value: proposals.value.filter(p => p.status === 'WAITING_APPROVAL').length, icon: 'ph:clock-bold', color: '#f59e0b' },
  { label: 'Approved', value: proposals.value.filter(p => p.status === 'APPROVED').length, icon: 'ph:check-circle-bold', color: '#10b981' },
]);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchProposals(), 400);
}

async function fetchProposals() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.set('page', String(currentPage.value));
    params.set('limit', String(pageSize.value));
    params.set('sortBy', sortBy.value);
    params.set('sort', sortOrder.value);
    if (searchKey.value) params.set('searchKey', searchKey.value);
    if (statusFilter.value) params.append('status', statusFilter.value);
    if (typeFilter.value) params.append('type', typeFilter.value);

    const response = await useApiFetch(`proposal/?${params.toString()}`);
    if (response?.success) {
      proposals.value = response.body?.docs || response.body?.proposals || [];
      totalItems.value = response.body?.pagination?.totalItems || response.body?.totalItems || 0;
    }
  } catch (error) {
    console.error('Failed to fetch proposals:', error);
  } finally {
    loading.value = false;
  }
}

function handleSortChange({ prop, order }: any) {
  if (prop) {
    sortBy.value = prop;
    sortOrder.value = order === 'ascending' ? 'ASC' : 'DESC';
  } else {
    sortBy.value = 'createdAt';
    sortOrder.value = 'DESC';
  }
  fetchProposals();
}

function formatStatus(status: string) {
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function statusTagType(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'info', WAITING_APPROVAL: 'warning', APPROVED: 'success',
    REJECTED: 'danger', ARCHIVED: 'info', SENT: '',
  };
  return map[status] || '';
}

function typeTagColor(type: string) {
  const map: Record<string, string> = { FINANCIAL: 'success', TECHNICAL: '', MIXED: 'warning' };
  return map[type] || '';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function handleSubmitForApproval(row: any) {
  try {
    await ElMessageBox.confirm('Submit this proposal for approval?', 'Confirm', { type: 'info' });
    actionLoading.value = true;
    const ok = await submitForApproval(row.id);
    if (ok) fetchProposals();
  } catch { /* cancelled */ }
  finally { actionLoading.value = false; }
}

async function handleApprove(row: any) {
  try {
    await ElMessageBox.confirm('Approve this proposal?', 'Confirm', { type: 'success' });
    actionLoading.value = true;
    const ok = await approveProposal(row.id);
    if (ok) fetchProposals();
  } catch { /* cancelled */ }
  finally { actionLoading.value = false; }
}

function openRejectDialog(row: any) {
  rejectTarget.value = row;
  rejectReason.value = '';
  rejectDialogVisible.value = true;
}

async function handleReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('Please provide a rejection reason');
    return;
  }
  actionLoading.value = true;
  const ok = await rejectProposal(rejectTarget.value.id, rejectReason.value);
  if (ok) {
    rejectDialogVisible.value = false;
    fetchProposals();
  }
  actionLoading.value = false;
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`Delete proposal "${row.title}"? This action cannot be undone.`, 'Delete', { type: 'warning' });
    actionLoading.value = true;
    const ok = await deleteProposal(row.id);
    if (ok) fetchProposals();
  } catch { /* cancelled */ }
  finally { actionLoading.value = false; }
}

onMounted(() => fetchProposals());
</script>
