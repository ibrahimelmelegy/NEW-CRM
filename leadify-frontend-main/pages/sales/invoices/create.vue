<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="invoice"
    backUrl="/sales/invoices"
    :backLabel="$t('documents.backToInvoices')"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';

definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'CREATE_INVOICES'
});
</script>
