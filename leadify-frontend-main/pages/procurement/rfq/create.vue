<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="rfq"
    backUrl="/procurement/rfq"
    backLabel="Back to RFQs"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';

definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'CREATE_RFQ'
});
</script>
