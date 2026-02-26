<template lang="pug">
  div#global-background
  NuxtLayout
    NuxtPage
</template>

<script setup lang="ts">
// Theme initialization is handled by ColorModeToggle.vue component
// Removing duplicate logic here to prevent race conditions on refresh

// Global locale direction handler — ensures RTL/LTR is always in sync
const { locale } = useI18n();

watch(locale, (val) => {
  if (import.meta.client) {
    document.documentElement.dir = val === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = val;
  }
}, { immediate: true });
</script>
