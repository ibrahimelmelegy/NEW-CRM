<template lang="pug">
DocumentDetailPage(
  documentType="proforma_invoice"
  :documentId="$route.params.id as string"
)
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });
</script>
