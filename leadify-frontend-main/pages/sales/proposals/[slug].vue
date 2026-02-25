<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <!-- Header bar for navigation + approval actions -->
    <div
      v-if="!loading"
      class="flex items-center justify-between px-6 py-3 border-b shrink-0"
      style="border-color: var(--border-default); background: var(--bg-surface)"
    >
      <div class="flex items-center gap-3">
        <el-button circle @click="navigateTo('/sales/proposals')">
          <Icon name="ph:arrow-left" size="18" />
        </el-button>
        <div>
          <h1 class="text-lg font-bold" style="color: var(--text-primary)">{{ proposal?.title || 'Proposal' }}</h1>
          <span class="text-xs font-mono" style="color: var(--text-muted)">{{ proposal?.reference }}</span>
        </div>
        <el-tag v-if="proposal?.status" :type="statusTagType(proposal.status) as any" effect="dark" round size="small">
          {{ formatStatus(proposal.status) }}
        </el-tag>
      </div>
      <ProposalApprovalActions v-if="proposal" :proposal-id="proposal.id" :status="proposal.status" @updated="reloadProposal" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
    </div>

    <!-- Builder -->
    <div v-else-if="parsedContent" class="flex-1 overflow-hidden">
      <ProDocBuilder document-type="proposal" :proposal-id="proposalId" :initial-data="parsedContent" @saved="onSaved" />
    </div>

    <!-- Error fallback -->
    <div v-else class="flex-1 flex flex-col items-center justify-center gap-4">
      <Icon name="ph:warning-circle" size="48" class="text-red-400" />
      <p class="text-lg font-bold" style="color: var(--text-primary)">Failed to load proposal</p>
      <el-button type="primary" @click="reloadProposal">Retry</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { getProposal } from '~/composables/useProposals';
import ProDocBuilder from '~/components/DocumentBuilder/ProDocBuilder.vue';
import ProposalApprovalActions from '~/components/DocumentBuilder/ProposalApprovalActions.vue';

definePageMeta({
  layout: 'full-width',
  middleware: 'permissions'
});

const route = useRoute();
const proposalId = computed(() => route.params.slug as string);

const loading = ref(true);
const proposal = ref<any>(null);
const parsedContent = ref<any>(null);

function statusTagType(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'info',
    WAITING_APPROVAL: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    ARCHIVED: 'info'
  };
  return map[status] || '';
}

function formatStatus(status: string) {
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

async function reloadProposal() {
  loading.value = true;
  try {
    const data = await getProposal(proposalId.value);
    proposal.value = data;

    // Parse content JSON back into ProposalData
    if (data?.content) {
      try {
        parsedContent.value = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      } catch {
        // Content is not valid JSON — use basic fields
        parsedContent.value = {
          title: data.title || '',
          refNumber: data.reference || '',
          clientCompany: data.proposalFor || '',
          type: data.type || 'MIXED',
          notes: data.notes || ''
        };
      }
    } else {
      // No content saved yet — initialize from proposal fields
      parsedContent.value = {
        title: data?.title || '',
        refNumber: data?.reference || '',
        clientCompany: data?.proposalFor || '',
        type: data?.type || 'MIXED',
        notes: data?.notes || ''
      };
    }
  } catch (error) {
    console.error('Failed to load proposal:', error);
    parsedContent.value = null;
  } finally {
    loading.value = false;
  }
}

function onSaved() {
  reloadProposal();
}

onMounted(() => {
  reloadProposal();
});
</script>
