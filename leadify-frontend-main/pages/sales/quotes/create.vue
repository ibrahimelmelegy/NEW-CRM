<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="quote"
    backUrl="/sales/quotes"
    :backLabel="$t('documents.backToQuotes')"
  )
</template>

<script setup lang="ts">
import DocumentHubWrapper from '~/components/DocumentBuilder/DocumentHubWrapper.vue';

definePageMeta({
  layout: 'default',
  middleware: ['permissions']
});
</script>
