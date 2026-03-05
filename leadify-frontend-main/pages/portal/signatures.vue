<template lang="pug">
.portal-signatures
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold.mb-1(style="color: var(--text-primary)") {{ $t('portal.signatures.title') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('portal.signatures.subtitle') }}

  //- Loading State
  .glass-card.p-12.text-center(v-if="loading")
    el-skeleton(:rows="4" animated)

  //- Signing Dialog
  el-dialog(
    v-model="showSignDialog"
    :title="$t('portal.esignature.title')"
    width="680px"
    :close-on-click-modal="false"
    destroy-on-close
  )
    PortalESignature(
      v-if="selectedDocument"
      :document-id="selectedDocument.id"
      :document-name="selectedDocument.title"
      @signed="handleSigned"
      @cancel="showSignDialog = false"
    )

  //- Pending Contracts
  .mb-8(v-if="!loading")
    h3.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('portal.signatures.pendingDocuments') }}
    .space-y-3(v-if="pendingContracts.length")
      .glass-card.p-5(
        v-for="contract in pendingContracts"
        :key="contract.id"
      )
        .flex.items-center.justify-between
          .flex.items-center.gap-4
            .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(249, 115, 22, 0.12)")
              Icon(name="ph:file-text-bold" size="24" class="text-orange-500" aria-label="Contract")
            div
              p.font-semibold(style="color: var(--text-primary)") {{ contract.title }}
              .flex.items-center.gap-2.mt-1
                el-tag(size="small" :type="contractStatusType(contract.status)" effect="dark") {{ contract.status }}
                span.text-xs(v-if="contract.deal" style="color: var(--text-muted)") {{ contract.deal.name }}
          el-button(type="primary" @click="openSignDialog(contract)")
            Icon(name="ph:pen-nib-bold" size="16" aria-label="Sign")
            span.ml-2 {{ $t('portal.signatures.signNow') }}

    .glass-card.p-12.text-center(v-else)
      Icon(name="ph:check-circle" size="64" class="text-green-500" aria-label="All signed")
      p.text-lg.font-semibold.mt-4(style="color: var(--text-primary)") {{ $t('portal.signatures.allSigned') }}
      p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('portal.signatures.allSignedHint') }}

  //- Signed Contracts
  .mt-8(v-if="!loading && signedContracts.length")
    h3.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('portal.signatures.signedDocuments') }}
    .glass-card.p-4
      .signed-item(
        v-for="contract in signedContracts"
        :key="contract.id"
      )
        .flex.items-center.gap-3
          .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
            Icon(name="ph:check-bold" size="16" class="text-green-500" aria-label="Signed")
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ contract.title }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('portal.signatures.signedOn') }} {{ formatDate(contract.signedAt) }}
        el-tag(size="small" type="success" effect="dark") {{ $t('portal.signatures.signed') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useEnhancedPortal, type PortalSignatureDoc } from '~/composables/usePortal';

definePageMeta({ layout: 'portal' });

const { portalFetch, init, isAuthenticated } = usePortalAuth();
const { signDocument, fetchDashboard, dashboard, loading } = useEnhancedPortal();

const showSignDialog = ref(false);
const selectedDocument = ref<PortalSignatureDoc | null>(null);
const allContracts = ref<Record<string, unknown>[]>([]);

const pendingContracts = computed(() => allContracts.value.filter(c => c.status === 'SENT' || c.status === 'VIEWED'));

const signedContracts = computed(() => allContracts.value.filter(c => c.status === 'SIGNED'));

onMounted(async () => {
  init();
  if (!isAuthenticated()) {
    navigateTo('/portal/login');
    return;
  }
  await loadContracts();
});

async function loadContracts() {
  loading.value = true;
  const res = await portalFetch('contracts');
  if (res.success && res.body) {
    allContracts.value = res.body as unknown[];
  }
  loading.value = false;
}

function openSignDialog(contract: unknown) {
  selectedDocument.value = { id: contract.id, title: contract.title, status: contract.status, deal: contract.deal || null };
  showSignDialog.value = true;
}

async function handleSigned(data: { signatureData: string; signatureType: 'DRAWN' | 'TYPED'; typedName?: string }) {
  if (!selectedDocument.value) return;

  const result = await signDocument(selectedDocument.value.id, data.signatureData, data.signatureType, data.typedName);

  if (result.success) {
    showSignDialog.value = false;
    selectedDocument.value = null;
    await loadContracts();
  }
}

function contractStatusType(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'info',
    SENT: 'warning',
    VIEWED: '',
    SIGNED: 'success',
    EXPIRED: 'danger',
    CANCELLED: 'danger'
  };
  return map[status] || 'info';
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<style scoped>
.signed-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-default);
}

.signed-item:last-child {
  border-bottom: none;
}
</style>
