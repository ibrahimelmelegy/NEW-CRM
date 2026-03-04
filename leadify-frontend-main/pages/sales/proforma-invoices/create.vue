<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="proforma_invoice"
    backUrl="/sales/proforma-invoices"
    :backLabel="$t('documents.backToProformaInvoices')"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';
definePageMeta({});
</script>
