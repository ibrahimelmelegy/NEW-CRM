<template lang="pug">
DocumentDetailPage(
  documentType="proforma_invoice"
  :documentId="$route.params.id as string"
)
</template>

<script setup lang="ts">
import DocumentDetailPage from '~/components/DocumentBuilder/DocumentDetailPage.vue';
definePageMeta({ middleware: 'permissions' });
</script>
