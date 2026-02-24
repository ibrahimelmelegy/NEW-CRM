<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="contract"
    backUrl="/sales/contracts"
    backLabel="Back to Contracts"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';

definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'CREATE_CONTRACT'
});
</script>
