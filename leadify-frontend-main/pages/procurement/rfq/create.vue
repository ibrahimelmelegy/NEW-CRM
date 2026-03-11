<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="rfq"
    backUrl="/procurement/rfq"
    :backLabel="$t('procurement.rfq.backLabel')"
  )
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'CREATE_PROCUREMENT'
});
</script>
