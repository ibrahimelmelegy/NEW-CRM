<template lang="pug">
DocumentListPage(document-type="proforma_invoice")
</template>

<script setup lang="ts">
import DocumentListPage from '~/components/DocumentBuilder/DocumentListPage.vue';
definePageMeta({ middleware: 'permissions' });
</script>
