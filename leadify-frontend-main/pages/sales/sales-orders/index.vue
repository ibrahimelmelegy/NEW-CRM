<template lang="pug">
DocumentListPage(document-type="sales_order")
</template>

<script setup lang="ts">
import DocumentListPage from '~/components/DocumentBuilder/DocumentListPage.vue';
definePageMeta({ middleware: 'permissions' });
</script>
