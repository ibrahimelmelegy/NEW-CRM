<template lang="pug">
div
  ModuleHeader(
    :title="$t('navigation.approvalCenter')"
    :subtitle="$t('approvals.subtitle')"
  )
    template(#actions)
      ExportButton(:data="allRequests" :columns="exportColumns" :filename="'approvals-export'" :title="$t('navigation.approvalCenter')")
      el-button(size="large" type="primary" @click="showCreateRequest = true" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('approvals.createRequest') }}

  StatCards(:stats="summaryStats")

  el-tabs.demo-tabs(v-model="activeTab")
    //- Pending My Approval
    el-tab-pane(:label="$t('approvals.pendingApproval')" name="pending")
      .glass-card.py-8.animate-entrance
        el-table(:data="pendingApprovals" v-loading="loadingPending" style="width: 100%" :row-style="{cursor:'pointer'}" @current-change="viewRequest")
          el-table-column(type="index" width="50")
          el-table-column(:label="$t('approvals.requestTitle')" min-width="200")
            template(#default="{ row }")
              .font-bold(style="color: var(--text-primary)") {{ row.title || row.entityType }}
          el-table-column(:label="$t('approvals.entityType')" width="150")
            template(#default="{ row }")
              el-tag(size="small" effect="dark" round class="!border-purple-500/30 !text-white !bg-purple-500/20") {{ row.entityType }}
          el-table-column(:label="$t('approvals.requester')" min-width="150")
            template(#default="{ row }")
              span {{ row.requester?.name || '—' }}
          el-table-column(:label="$t('approvals.currentStep')" width="120")
            template(#default="{ row }")
              span {{ row.currentStep || 1 }} / {{ row.totalSteps || row.workflow?.steps?.length || '?' }}
          el-table-column(:label="$t('approvals.status')" width="130")
            template(#default="{ row }")
              span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getStatusColor(row.status)}`") {{ row.status }}
          el-table-column(:label="$t('common.action')" width="180" fixed="right")
            template(#default="{ row }")
              .flex.gap-2(@click.stop)
                el-button(type="success" size="small" @click="handleApprove(row)" class="!rounded-lg")
                  Icon(name="ph:check-bold" size="14")
                  span.ml-1 {{ $t('hr.leave.approve') }}
                el-button(type="danger" size="small" @click="[rejectTarget = row, rejectPopup = true]" class="!rounded-lg")
                  Icon(name="ph:x-bold" size="14")
                  span.ml-1 {{ $t('hr.leave.reject') }}
          template(#empty)
            el-empty(:description="$t('approvals.noPending')" image="/images/empty.png")

    //- My Requests
    el-tab-pane(:label="$t('approvals.myRequests')" name="requests")
      .glass-card.py-8.animate-entrance
        el-table(:data="allRequests" v-loading="loadingRequests" style="width: 100%" :row-style="{cursor:'pointer'}" @current-change="viewRequest")
          el-table-column(type="index" width="50")
          el-table-column(:label="$t('approvals.requestTitle')" min-width="200")
            template(#default="{ row }")
              .font-bold(style="color: var(--text-primary)") {{ row.title || row.entityType }}
          el-table-column(:label="$t('approvals.entityType')" width="150")
            template(#default="{ row }")
              el-tag(size="small" effect="dark" round class="!border-purple-500/30 !text-white !bg-purple-500/20") {{ row.entityType }}
          el-table-column(:label="$t('approvals.status')" width="130")
            template(#default="{ row }")
              span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getStatusColor(row.status)}`") {{ row.status }}
          el-table-column(:label="$t('common.action')" width="120" fixed="right")
            template(#default="{ row }")
              .flex.items-center(@click.stop)
                el-dropdown(trigger="click")
                  span.el-dropdown-link
                    .toggle-icon.text-md: Icon(name="IconToggle" size="22")
                  template(#dropdown)
                    el-dropdown-menu
                      el-dropdown-item(@click="viewRequest(row)")
                        .flex.items-center
                          Icon.text-md.mr-2(name="IconEye")
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item(v-if="row.status === 'PENDING'" @click="handleCancel(row.id)")
                        .flex.items-center
                          Icon.text-md.mr-2(name="ph:prohibit-bold")
                          p.text-sm {{ $t('common.cancel') }}
          template(#empty)
            el-empty(:description="$t('common.noData')" image="/images/empty.png")

  //- Create Request Dialog
  el-dialog(v-model="showCreateRequest" :title="$t('approvals.createRequest')" width="600px")
    el-form(ref="createFormRef" :model="createForm" label-position="top" size="large")
      el-form-item(:label="$t('approvals.requestTitle')" prop="title")
        el-input(v-model="createForm.title")
      el-form-item(:label="$t('approvals.entityType')" prop="entityType")
        el-select(v-model="createForm.entityType" class="w-full")
          el-option(v-for="et in entityTypes" :key="et" :label="et" :value="et")
      el-form-item(:label="$t('approvals.notes')")
        el-input(v-model="createForm.notes" type="textarea" :rows="3")
    template(#footer)
      el-button(@click="showCreateRequest = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="creating" @click="submitRequest" class="!rounded-2xl") {{ $t('common.submit') }}

  //- View Request Dialog
  el-dialog(v-model="showViewRequest" :title="viewingRequest?.title || 'Request Details'" width="700px")
    .space-y-4(v-if="viewingRequest")
      .grid.grid-cols-2.gap-4
        div
          .text-sm.font-medium(style="color: var(--text-muted)") {{ $t('approvals.entityType') }}
          el-tag.mt-1(size="small" effect="dark") {{ viewingRequest.entityType }}
        div
          .text-sm.font-medium(style="color: var(--text-muted)") {{ $t('approvals.status') }}
          .mt-1: span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getStatusColor(viewingRequest.status)}`") {{ viewingRequest.status }}
        div(v-if="viewingRequest.requester")
          .text-sm.font-medium(style="color: var(--text-muted)") {{ $t('approvals.requester') }}
          p(style="color: var(--text-primary)") {{ viewingRequest.requester?.name }}
        div
          .text-sm.font-medium(style="color: var(--text-muted)") {{ $t('approvals.currentStep') }}
          p(style="color: var(--text-primary)") {{ viewingRequest.currentStep || 1 }} / {{ viewingRequest.totalSteps || '?' }}
      .glass-card.p-4(v-if="viewingRequest.notes")
        p.text-sm(style="color: var(--text-secondary)") {{ viewingRequest.notes }}

  //- Reject Dialog
  el-dialog(v-model="rejectPopup" :title="$t('hr.leave.reject')" width="500px")
    el-form(label-position="top")
      el-form-item(:label="$t('hr.leave.rejectionReason')")
        el-input(v-model="rejectComment" type="textarea" :rows="3")
    template(#footer)
      el-button(@click="rejectPopup = false") {{ $t('common.cancel') }}
      el-button(type="danger" :loading="rejecting" @click="confirmReject" class="!rounded-2xl") {{ $t('hr.leave.reject') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useApprovals } from '~/composables/useApprovals';

const { fetchRequests, fetchPendingApprovals, createRequest, approveRequest, rejectRequest, cancelRequest } = useApprovals();

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;

// Export columns
const exportColumns = [
  { prop: 'title', label: t('approvals.requestTitle') },
  { prop: 'entityType', label: t('approvals.entityType') },
  { prop: 'status', label: t('approvals.status') }
];

const activeTab = ref('pending');
const loadingPending = ref(true);
const loadingRequests = ref(true);
const creating = ref(false);
const rejecting = ref(false);

const pendingApprovals = ref<Record<string, unknown>[]>([]);
const allRequests = ref<Record<string, unknown>[]>([]);
const showCreateRequest = ref(false);
const showViewRequest = ref(false);
const viewingRequest = ref<Record<string, unknown> | null>(null);
const rejectPopup = ref(false);
const rejectTarget = ref<Record<string, unknown> | null>(null);
const rejectComment = ref('');
const createFormRef = ref();

const entityTypes = ['PURCHASE_ORDER', 'INVOICE', 'EXPENSE', 'LEAVE_REQUEST', 'CONTRACT', 'GENERAL'];

const createForm = reactive({
  title: '',
  entityType: 'GENERAL',
  notes: ''
});

const summaryStats = computed(() => [
  { label: t('approvals.pendingApproval'), value: pendingApprovals.value.length, icon: 'ph:clock-bold', color: '#f59e0b' },
  { label: t('approvals.myRequests'), value: allRequests.value.length, icon: 'ph:file-text-bold', color: '#7849ff' },
  {
    label: t('hr.leave.approved'),
    value: allRequests.value.filter((r) => r.status === 'APPROVED').length,
    icon: 'ph:check-circle-bold',
    color: '#22c55e'
  },
  {
    label: t('hr.leave.rejected'),
    value: allRequests.value.filter((r) => r.status === 'REJECTED').length,
    icon: 'ph:x-circle-bold',
    color: '#ef4444'
  }
]);

onMounted(async () => {
  await Promise.all([loadPending(), loadRequests()]);
});

async function loadPending() {
  loadingPending.value = true;
  try {
    const { body, success } = await fetchPendingApprovals();
    if (success && body) pendingApprovals.value = Array.isArray(body) ? body : [];
  } finally {
    loadingPending.value = false;
  }
}

async function loadRequests() {
  loadingRequests.value = true;
  try {
    const { body, success } = await fetchRequests();
    if (success && body) allRequests.value = Array.isArray(body) ? body : [];
  } finally {
    loadingRequests.value = false;
  }
}

function viewRequest(row: unknown) {
  viewingRequest.value = row;
  showViewRequest.value = true;
}

async function handleApprove(row: unknown) {
  const res = await approveRequest(row.id, '');
  if (res?.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.approved') });
    await Promise.all([loadPending(), loadRequests()]);
  }
}

async function confirmReject() {
  if (!rejectTarget.value) return;
  rejecting.value = true;
  try {
    const res = await rejectRequest(rejectTarget.value.id, rejectComment.value);
    if (res?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.rejected') });
      rejectPopup.value = false;
      rejectComment.value = '';
      await Promise.all([loadPending(), loadRequests()]);
    }
  } finally {
    rejecting.value = false;
  }
}

async function handleCancel(id: number) {
  const res = await cancelRequest(id);
  if (res?.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.cancelled') });
    await loadRequests();
  }
}

async function submitRequest() {
  creating.value = true;
  try {
    const res = await createRequest(createForm);
    if (res?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.created') });
      showCreateRequest.value = false;
      createForm.title = '';
      createForm.entityType = 'GENERAL';
      createForm.notes = '';
      await loadRequests();
    }
  } finally {
    creating.value = false;
  }
}
</script>
