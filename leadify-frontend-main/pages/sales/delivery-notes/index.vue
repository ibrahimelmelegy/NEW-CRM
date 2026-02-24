<template lang="pug">
DocumentListPage(document-type="delivery_note")
</template>

<script setup lang="ts">
import DocumentListPage from '~/components/DocumentBuilder/DocumentListPage.vue';
definePageMeta({ middleware: 'permissions' });
</script>
