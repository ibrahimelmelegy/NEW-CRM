<template>
  <!-- eslint-disable vue/no-v-html -->
  <div class="min-h-screen bg-slate-50">
    <!-- Loading State -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <el-icon class="is-loading mb-4" :size="40" color="#7c3aed"><Loading /></el-icon>
        <p class="text-gray-500">Loading proposal...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="!proposal" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <Icon name="ph:warning-circle" size="48" class="text-red-500 mx-auto mb-4" />
        <p class="text-gray-700 font-medium mb-2">Proposal not found</p>
        <button class="text-violet-600 hover:text-violet-700 font-medium" @click="navigateTo('/sales/proposals')">Back to Proposals</button>
      </div>
    </div>

    <!-- Proposal Content -->
    <template v-else>
      <!-- Header -->
      <header class="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button class="p-2 hover:bg-gray-100 rounded-xl transition-colors" @click="navigateTo('/sales/proposals')">
              <ArrowLeft :size="20" class="text-gray-600" />
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">{{ proposal.title || 'Untitled Proposal' }}</h1>
              <p class="text-sm text-gray-500">{{ proposal.reference || `REF-${proposal.id}` }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button class="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Refresh" @click="reloadProposal">
              <RefreshCw :size="18" class="text-gray-500" />
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
              @click="navigateTo(`/sales/proposals/edit/${proposalId}`)"
            >
              <Edit :size="16" />
              Edit
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50"
              @click="handleDeleteClick"
            >
              <Trash2 :size="16" />
              Delete
            </button>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="max-w-7xl mx-auto px-6 py-8">
        <div class="grid grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="col-span-2 space-y-6">
            <!-- Status Card -->
            <div class="bg-white rounded-2xl p-6 border border-gray-100">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-xl" :class="statusConfig.color">
                    <component :is="statusConfig.icon" :size="20" />
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Status</p>
                    <p class="font-bold text-gray-900">{{ statusConfig.label }}</p>
                  </div>
                </div>
                <div class="px-4 py-2 rounded-full text-sm font-medium" :class="statusConfig.color">
                  {{ statusConfig.label }}
                </div>
              </div>

              <!-- Approval Actions -->
              <ProposalApprovalActions :proposal-id="proposal.id" :status="proposal.status || 'DRAFT'" @updated="reloadProposal" />
            </div>

            <!-- Executive Summary / Introduction -->
            <div
              v-if="content?.sections?.introduction || content?.sections?.executiveSummary"
              class="bg-white rounded-2xl p-6 border border-gray-100"
            >
              <h3 class="text-lg font-bold text-gray-900 mb-4">Executive Summary</h3>
              <div class="prose prose-sm max-w-none" v-html="content.sections.introduction || content.sections.executiveSummary" />
            </div>

            <!-- Solution & Scope -->
            <div v-if="content?.sections?.scopeOfWork || content?.sections?.solutionScope" class="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Solution & Scope</h3>
              <div class="prose prose-sm max-w-none" v-html="content.sections.scopeOfWork || content.sections.solutionScope" />
            </div>

            <!-- Methodology -->
            <div v-if="content?.sections?.methodology" class="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Methodology</h3>
              <div class="prose prose-sm max-w-none" v-html="content.sections.methodology" />
            </div>

            <!-- Custom Sections -->
            <div v-for="(section, idx) in content?.sections?.customSections || []" :key="idx" class="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4">{{ section.title || `Section ${Number(idx) + 1}` }}</h3>
              <div class="prose prose-sm max-w-none" v-html="section.content" />
            </div>

            <!-- Financial Summary -->
            <div v-if="content?.finance?.items && content.finance.items.length > 0" class="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign :size="20" class="text-violet-600" />
                Financial Summary
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr class="text-xs text-gray-500 uppercase">
                      <th class="py-3 px-4 text-left">Description</th>
                      <th class="py-3 px-4 text-center">Qty</th>
                      <th class="py-3 px-4 text-right">Rate</th>
                      <th class="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="(item, idx) in content.finance.items" :key="idx">
                      <td class="py-3 px-4 font-medium">{{ item.description }}</td>
                      <td class="py-3 px-4 text-center">{{ item.quantity }}</td>
                      <td class="py-3 px-4 text-right">{{ item.rate?.toLocaleString() }}</td>
                      <td class="py-3 px-4 text-right font-bold">
                        {{ ((item.quantity || 0) * (item.rate || 0)).toLocaleString() }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="border-t-2 border-gray-200">
                    <tr>
                      <td colspan="3" class="py-3 px-4 text-right font-bold text-gray-700">Subtotal</td>
                      <td class="py-3 px-4 text-right font-bold text-gray-900">{{ subtotal.toLocaleString() }}</td>
                    </tr>
                    <tr v-if="content.finance.discount">
                      <td colspan="3" class="py-2 px-4 text-right text-gray-500">
                        Discount ({{ content.finance.discountType === 'percent' ? `${content.finance.discount}%` : content.finance.discount }})
                      </td>
                      <td class="py-2 px-4 text-right text-red-500">-{{ discountAmount.toLocaleString() }}</td>
                    </tr>
                    <tr v-if="content.finance.taxRate">
                      <td colspan="3" class="py-2 px-4 text-right text-gray-500">Tax ({{ content.finance.taxRate }}%)</td>
                      <td class="py-2 px-4 text-right text-gray-700">{{ taxAmount.toLocaleString() }}</td>
                    </tr>
                    <tr>
                      <td colspan="3" class="py-3 px-4 text-right font-bold text-lg text-gray-900">Total</td>
                      <td class="py-3 px-4 text-right font-bold text-lg text-violet-600">
                        {{ content.finance.currency || 'SAR' }} {{ grandTotal.toLocaleString() }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- File Attachments -->
            <div v-if="proposal.fileAttachments && proposal.fileAttachments.length > 0" class="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText :size="20" class="text-violet-600" />
                Attachments
              </h3>
              <div class="space-y-2">
                <a
                  v-for="(file, idx) in proposal.fileAttachments"
                  :key="idx"
                  :href="file"
                  target="_blank"
                  class="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Download :size="18" class="text-gray-500" />
                  <span class="font-medium text-gray-700 truncate">{{ extractFileName(file) }}</span>
                  <ExternalLink :size="14" class="text-gray-400 ml-auto flex-shrink-0" />
                </a>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Related Entity -->
            <div v-if="proposal.relatedEntityType" class="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Related To</h3>
              <div class="flex items-center gap-3">
                <div class="p-3 bg-violet-100 rounded-xl">
                  <Building2 :size="20" class="text-violet-600" />
                </div>
                <div>
                  <p class="font-bold text-gray-900">
                    {{ proposal.relatedEntity?.name || `ID: ${proposal.relatedEntityId}` }}
                  </p>
                  <p class="text-sm text-gray-500">{{ proposal.relatedEntityType }}</p>
                </div>
              </div>
            </div>

            <!-- Client Info -->
            <div class="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Client</h3>
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <User :size="18" class="text-gray-400" />
                  <span class="text-gray-900">{{ proposal.proposalFor || 'Not specified' }}</span>
                </div>
                <div v-if="content?.client?.company" class="flex items-center gap-3">
                  <Building2 :size="18" class="text-gray-400" />
                  <span class="text-gray-900">{{ content.client.company }}</span>
                </div>
                <div v-if="content?.client?.email" class="flex items-center gap-3">
                  <ExternalLink :size="18" class="text-gray-400" />
                  <a :href="`mailto:${content.client.email}`" class="text-violet-600 hover:underline">
                    {{ content.client.email }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Dates -->
            <div class="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Dates</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Created</span>
                  <span class="font-medium text-gray-900">{{ formatDate(proposal.createdAt) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Proposal Date</span>
                  <span class="font-medium text-gray-900">{{ formatDate(proposal.proposalDate || proposal.createdAt) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Last Modified</span>
                  <span class="font-medium text-gray-900">{{ formatDate(proposal.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Proposal Meta -->
            <div class="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Details</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Type</span>
                  <el-tag size="small" effect="plain" round>{{ proposal.type || 'MIXED' }}</el-tag>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Version</span>
                  <span class="font-medium text-gray-900">v{{ proposal.version || 1 }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div class="space-y-2">
                <button
                  class="w-full flex items-center gap-3 px-4 py-3 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors text-left"
                  @click="navigateTo(`/sales/proposals/document/${proposalId}`)"
                >
                  <FileText :size="18" class="text-violet-600" />
                  <span class="font-medium text-violet-700">View Proposal Page</span>
                </button>
                <button
                  class="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                  @click="handleDownloadPdf"
                >
                  <Download :size="18" class="text-gray-500" />
                  <span class="font-medium text-gray-700">Download PDF</span>
                </button>
                <button
                  class="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                  @click="handleSendToClient"
                >
                  <Send :size="18" class="text-gray-500" />
                  <span class="font-medium text-gray-700">Send to Client</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Building2,
  User,
  DollarSign,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  FileText
} from 'lucide-vue-next';
import { getProposal, deleteProposal as deleteProposalApi } from '~/composables/useProposals';
import ProposalApprovalActions from '~/components/DocumentBuilder/ProposalApprovalActions.vue';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const route = useRoute();
const proposalId = computed(() => route.params.slug as string);

const loading = ref(true);
const proposal = ref<Record<string, unknown> | null>(null);
const deleting = ref(false);

// Parse content JSON
const content = computed(() => {
  if (!proposal.value?.content) return null;
  try {
    return typeof proposal.value.content === 'string' ? JSON.parse(proposal.value.content) : proposal.value.content;
  } catch {
    return null;
  }
});

// Financial calculations
const subtotal = computed(() => {
  const items = content.value?.finance?.items || [];
  return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
});

const discountAmount = computed(() => {
  const finance = content.value?.finance;
  if (!finance?.discount) return 0;
  if (finance.discountType === 'percent') {
    return subtotal.value * (finance.discount / 100);
  }
  return finance.discount;
});

const taxAmount = computed(() => {
  const finance = content.value?.finance;
  if (!finance?.taxRate) return 0;
  const afterDiscount = subtotal.value - discountAmount.value;
  return afterDiscount * (finance.taxRate / 100);
});

const grandTotal = computed(() => {
  return subtotal.value - discountAmount.value + taxAmount.value;
});

// Status configuration
const statusConfig = computed(() => {
  const status = proposal.value?.status || 'DRAFT';
  const configs: Record<string, { color: string; icon: unknown; label: string }> = {
    DRAFT: { color: 'bg-gray-100 text-gray-600', icon: Clock, label: 'Draft' },
    WAITING_APPROVAL: { color: 'bg-amber-100 text-amber-600', icon: Clock, label: 'Waiting Approval' },
    APPROVED: { color: 'bg-green-100 text-green-600', icon: CheckCircle, label: 'Approved' },
    REJECTED: { color: 'bg-red-100 text-red-600', icon: XCircle, label: 'Rejected' },
    SENT: { color: 'bg-blue-100 text-blue-600', icon: Send, label: 'Sent to Client' },
    ARCHIVED: { color: 'bg-slate-100 text-slate-600', icon: AlertCircle, label: 'Archived' }
  };
  return (configs[status] || configs.DRAFT)!;
});

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function extractFileName(url: string) {
  if (!url) return 'Attachment';
  const parts = url.split('/');
  return decodeURIComponent(parts[parts.length - 1] || '') || 'Attachment';
}

async function reloadProposal() {
  loading.value = true;
  try {
    const data = await getProposal(proposalId.value);
    proposal.value = data && Object.keys(data).length > 0 ? data : null;
  } catch (error) {
    console.error('Failed to load proposal:', error);
    proposal.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleDeleteClick() {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this proposal? This action cannot be undone.', 'Delete Proposal', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
      confirmButtonClass: '!bg-red-500 !border-red-500 hover:!bg-red-600'
    });
    deleting.value = true;
    const ok = await deleteProposalApi(proposalId.value);
    if (ok) {
      navigateTo('/sales/proposals');
    }
  } catch {
    // User cancelled
  } finally {
    deleting.value = false;
  }
}

function handleDownloadPdf() {
  // Open document view for printing/PDF
  window.open(`/sales/proposals/document/${proposalId.value}`, '_blank');
}

function handleSendToClient() {
  ElNotification({
    type: 'info',
    title: 'Coming Soon',
    message: 'Send to client functionality will be available soon.'
  });
}

onMounted(() => {
  reloadProposal();
});
</script>
