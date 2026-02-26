<template lang="pug">
  ElConfigProvider(:locale="elLocale")
    div#global-background
    NuxtLayout
      NuxtPage
</template>

<script setup lang="ts">
import elEn from 'element-plus/dist/locale/en.mjs';
import elAr from 'element-plus/dist/locale/ar.mjs';

// Theme initialization is handled by ColorModeToggle.vue component
// Removing duplicate logic here to prevent race conditions on refresh

// Global locale direction handler — ensures RTL/LTR is always in sync
const { locale } = useI18n();

const elLocaleMap: Record<string, any> = { en: elEn, ar: elAr };
const elLocale = computed(() => elLocaleMap[locale.value] || elEn);

watch(locale, (val) => {
  if (import.meta.client) {
    document.documentElement.dir = val === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = val;
  }
}, { immediate: true });
</script>
