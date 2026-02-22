<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="proforma_invoice"
    backUrl="/sales/proforma-invoices"
    backLabel="Back to Proforma Invoices"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';
definePageMeta({ layout: 'main', middleware: 'auth' });
</script>
