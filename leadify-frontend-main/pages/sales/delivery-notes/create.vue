<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="delivery_note"
    backUrl="/sales/delivery-notes"
    :backLabel="$t('documents.backToDeliveryNotes')"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';

definePageMeta({
  layout: 'default',
  middleware: ['permissions']
});
</script>
