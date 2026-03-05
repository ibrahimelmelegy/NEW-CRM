<template>
  <div class="bg-white rounded-2xl border border-gray-100 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-violet-100 rounded-xl">
          <CheckCircle :size="20" class="text-violet-600" />
        </div>
        <div>
          <h3 class="font-bold text-gray-900">Approval Workflow</h3>
          <p class="text-xs text-gray-500">Manage proposal status and approvals</p>
        </div>
      </div>

      <!-- Status Badge -->
      <div :class="['inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', statusConfig.color]">
        <component :is="statusConfig.icon" :size="16" />
        {{ statusConfig.label }}
      </div>
    </div>

    <!-- Actions based on status -->
    <div class="flex flex-wrap gap-3">
      <!-- Draft - Can submit for approval -->
      <button
        v-if="status === 'DRAFT'"
        :disabled="loading || isLoading"
        class="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="handleAction('submit', () => emit('statusChange', 'WAITING_APPROVAL'))"
      >
        <Loader2 v-if="loadingAction === 'submit'" :size="18" class="animate-spin" />
        <Clock v-else :size="18" />
        Submit for Approval
      </button>

      <!-- Waiting Approval - Can approve or reject -->
      <template v-if="status === 'WAITING_APPROVAL'">
        <button
          :disabled="loading || isLoading"
          class="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="handleAction('approve', () => emit('statusChange', 'APPROVED'))"
        >
          <Loader2 v-if="loadingAction === 'approve'" :size="18" class="animate-spin" />
          <CheckCircle v-else :size="18" />
          Approve
        </button>
        <button
          :disabled="loading || isLoading"
          class="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="showRejectModal = true"
        >
          <XCircle :size="18" />
          Reject
        </button>
      </template>

      <!-- Approved - Can send to client -->
      <button
        v-if="status === 'APPROVED'"
        :disabled="loading || isLoading"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="handleAction('send', () => emit('statusChange', 'SENT'))"
      >
        <Loader2 v-if="loadingAction === 'send'" :size="18" class="animate-spin" />
        <Send v-else :size="18" />
        Send to Client
      </button>

      <!-- Rejected - Can resubmit -->
      <button
        v-if="status === 'REJECTED'"
        :disabled="loading || isLoading"
        class="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="handleAction('submit', () => emit('statusChange', 'WAITING_APPROVAL'))"
      >
        <Loader2 v-if="loadingAction === 'submit'" :size="18" class="animate-spin" />
        <Clock v-else :size="18" />
        Resubmit for Approval
      </button>
    </div>

    <!-- Rejection Reason Display -->
    <div v-if="status === 'REJECTED' && rejectionReason" class="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
      <p class="text-sm font-medium text-red-700 mb-1">Rejection Reason:</p>
      <p class="text-sm text-red-600">{{ rejectionReason }}</p>
    </div>

    <!-- Reject Modal -->
    <Teleport to="body">
      <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-red-100 rounded-xl">
              <MessageSquare :size="20" class="text-red-600" />
            </div>
            <h3 class="font-bold text-lg text-gray-900">Rejection Reason</h3>
          </div>
          <p class="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this proposal.</p>
          <textarea
            v-model="rejectReason"
            :placeholder="$t('proposals.rejectionReason')"
            :rows="4"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4 resize-none"
            autofocus
          ></textarea>
          <div class="flex gap-3">
            <button class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50" @click="cancelReject">
              Cancel
            </button>
            <button
              :disabled="!rejectReason.trim() || isLoading"
              class="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              @click="handleReject"
            >
              <Loader2 v-if="loadingAction === 'reject'" :size="18" class="animate-spin" />
              Reject Proposal
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { ref, computed } from 'vue';
import { CheckCircle, XCircle, Clock, Send, AlertCircle, Loader2, MessageSquare } from 'lucide-vue-next';

// ---- Types ----
type ProposalStatus = 'DRAFT' | 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SENT' | 'ARCHIVED';

// ---- Props ----
interface Props {
  proposalId: string | number;
  status: ProposalStatus;
  rejectionReason?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rejectionReason: '',
  loading: false
});

// ---- Emits ----
const emit = defineEmits<{
  statusChange: [newStatus: string];
}>();

// ---- State ----
const isLoading = ref(false);
const showRejectModal = ref(false);
const rejectReason = ref('');
const loadingAction = ref<string | null>(null);

// ---- Computed ----
const statusConfig = computed(() => {
  const configs: Record<ProposalStatus, { color: string; icon: unknown; label: string }> = {
    DRAFT: { color: 'bg-gray-100 text-gray-600', icon: Clock, label: 'Draft' },
    WAITING_APPROVAL: { color: 'bg-amber-100 text-amber-600', icon: Clock, label: 'Waiting Approval' },
    APPROVED: { color: 'bg-green-100 text-green-600', icon: CheckCircle, label: 'Approved' },
    REJECTED: { color: 'bg-red-100 text-red-600', icon: XCircle, label: 'Rejected' },
    SENT: { color: 'bg-blue-100 text-blue-600', icon: Send, label: 'Sent to Client' },
    ARCHIVED: { color: 'bg-slate-100 text-slate-600', icon: AlertCircle, label: 'Archived' }
  };
  return configs[props.status] || configs.DRAFT;
});

// ---- Methods ----
const handleAction = async (action: string, callback: () => void) => {
  loadingAction.value = action;
  isLoading.value = true;
  try {
    callback();
  } catch (error) {
    console.error(`${action} failed:`, error);
  } finally {
    isLoading.value = false;
    loadingAction.value = null;
  }
};

const handleReject = async () => {
  if (!rejectReason.value.trim()) return;
  loadingAction.value = 'reject';
  isLoading.value = true;
  try {
    emit('statusChange', 'REJECTED');
  } catch (error) {
    console.error('Reject failed:', error);
  } finally {
    isLoading.value = false;
    loadingAction.value = null;
    showRejectModal.value = false;
    rejectReason.value = '';
  }
};

const cancelReject = () => {
  showRejectModal.value = false;
  rejectReason.value = '';
};
</script>
