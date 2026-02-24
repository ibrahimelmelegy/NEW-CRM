<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="sales_order"
    backUrl="/sales/sales-orders"
    backLabel="Back to Sales Orders"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';

definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'CREATE_SALES_ORDER'
});
</script>
