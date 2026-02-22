<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="proposal"
    backUrl="/sales/proposals"
    backLabel="Back to Proposals"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';

definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'CREATE_PROPOSALS'
});
</script>
