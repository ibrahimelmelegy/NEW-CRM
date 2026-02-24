<template lang="pug">
DocumentDetailPage(
  documentType="quote"
  :documentId="$route.params.id as string"
)
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });
</script>
