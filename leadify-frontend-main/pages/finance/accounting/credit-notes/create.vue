<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="credit_note"
    backUrl="/finance/accounting/credit-notes"
    :backLabel="$t('accounting.creditNotes.backTo')"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';

definePageMeta({
  layout: 'default',
  middleware: ['permissions']
});
</script>
