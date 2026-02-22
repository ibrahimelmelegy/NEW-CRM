<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="purchase_order"
    backUrl="/procurement/purchase-orders"
    backLabel="Back to POs"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';

definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'CREATE_PURCHASE_ORDER'
});
</script>
