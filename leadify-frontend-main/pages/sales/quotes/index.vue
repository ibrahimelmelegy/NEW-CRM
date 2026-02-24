<template lang="pug">
DocumentListPage(document-type="quote")
</template>

<script setup lang="ts">
import DocumentListPage from '~/components/DocumentBuilder/DocumentListPage.vue';
definePageMeta({ middleware: 'permissions' });
</script>
