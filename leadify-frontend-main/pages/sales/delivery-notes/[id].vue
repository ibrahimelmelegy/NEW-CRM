<template lang="pug">
DocumentDetailPage(
  documentType="delivery_note"
  :documentId="$route.params.id as string"
)
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });
</script>
