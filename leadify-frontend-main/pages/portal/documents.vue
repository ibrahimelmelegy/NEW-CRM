<template lang="pug">
.portal-documents
  //- Loading State
  .glass-card.p-12.text-center(v-if="loading")
    el-skeleton(:rows="4" animated)

  //- Document Vault
  PortalDocumentVault(v-else :documents="documents")
</template>

<script setup lang="ts">
import { useEnhancedPortal } from '~/composables/usePortal';

definePageMeta({ layout: 'portal' });

const { init, isAuthenticated } = usePortalAuth();
const { documents, loading, fetchDocuments } = useEnhancedPortal();

onMounted(async () => {
  init();
  if (!isAuthenticated()) {
    navigateTo('/portal/login');
    return;
  }
  await fetchDocuments();
});
</script>
