<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="sla"
    backUrl="/operations/sla"
    backLabel="Back to SLAs"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';
definePageMeta({ layout: 'main', middleware: 'auth' });
</script>
