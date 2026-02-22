<template>
  <div class="flex items-center gap-3">
    <!-- Status Badge -->
    <el-tag
      :type="statusConfig.type"
      effect="dark"
      round
      size="default"
      class="!text-xs !font-bold !px-3"
    >
      <Icon :name="statusConfig.icon" size="14" class="mr-1 align-middle" />
      {{ statusConfig.label }}
    </el-tag>

    <!-- Draft → Submit for Approval -->
    <el-button
      v-if="status === 'DRAFT'"
      type="primary"
      size="default"
      class="!rounded-xl"
      :loading="loading"
      @click="handleSubmit"
    >
      <Icon name="ph:paper-plane-tilt" size="16" class="mr-1.5" />
      Submit for Approval
    </el-button>

    <!-- Waiting Approval → Approve / Reject -->
    <template v-if="status === 'WAITING_APPROVAL'">
      <el-button
        type="success"
        size="default"
        class="!rounded-xl"
        :loading="loading"
        @click="handleApprove"
      >
        <Icon name="ph:check-circle" size="16" class="mr-1.5" />
        Approve
      </el-button>
      <el-button
        type="danger"
        size="default"
        class="!rounded-xl"
        :loading="loading"
        @click="openRejectDialog"
      >
        <Icon name="ph:x-circle" size="16" class="mr-1.5" />
        Reject
      </el-button>
    </template>

    <!-- Rejected → Resubmit -->
    <el-button
      v-if="status === 'REJECTED'"
      type="warning"
      size="default"
      class="!rounded-xl"
      :loading="loading"
      @click="handleSubmit"
    >
      <Icon name="ph:arrow-counter-clockwise" size="16" class="mr-1.5" />
      Resubmit
    </el-button>

    <!-- Reject Dialog -->
    <el-dialog v-model="rejectDialogVisible" title="Reject Proposal" width="420px" append-to-body>
      <p class="mb-4" style="color: var(--text-secondary);">Please provide a reason for rejection:</p>
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        placeholder="Enter rejection reason..."
      />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">Cancel</el-button>
        <el-button type="danger" :loading="loading" @click="handleReject">Reject</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { submitForApproval, approveProposal, rejectProposal } from '~/composables/useProposals';

const props = defineProps<{
  proposalId: string | number;
  status: string;
}>();

const emit = defineEmits(['updated']);

const loading = ref(false);
const rejectDialogVisible = ref(false);
const rejectReason = ref('');

const statusConfig = computed(() => {
  const map: Record<string, { label: string; type: string; icon: string }> = {
    DRAFT: { label: 'Draft', type: 'info', icon: 'ph:pencil-simple' },
    WAITING_APPROVAL: { label: 'Waiting Approval', type: 'warning', icon: 'ph:hourglass' },
    APPROVED: { label: 'Approved', type: 'success', icon: 'ph:check-circle' },
    REJECTED: { label: 'Rejected', type: 'danger', icon: 'ph:x-circle' },
    ARCHIVED: { label: 'Archived', type: 'info', icon: 'ph:archive' },
    SENT: { label: 'Sent', type: '', icon: 'ph:paper-plane-tilt' },
  };
  return map[props.status] || { label: props.status, type: '', icon: 'ph:question' };
});

async function handleSubmit() {
  loading.value = true;
  const ok = await submitForApproval(props.proposalId);
  loading.value = false;
  if (ok) emit('updated');
}

async function handleApprove() {
  try {
    await ElMessageBox.confirm('Approve this proposal?', 'Confirm Approval', { type: 'success' });
    loading.value = true;
    const ok = await approveProposal(props.proposalId);
    loading.value = false;
    if (ok) emit('updated');
  } catch { /* cancelled */ }
}

function openRejectDialog() {
  rejectReason.value = '';
  rejectDialogVisible.value = true;
}

async function handleReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('Please provide a rejection reason');
    return;
  }
  loading.value = true;
  const ok = await rejectProposal(props.proposalId, rejectReason.value);
  loading.value = false;
  if (ok) {
    rejectDialogVisible.value = false;
    emit('updated');
  }
}
</script>
