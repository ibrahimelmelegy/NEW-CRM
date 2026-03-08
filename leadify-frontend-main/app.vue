<template lang="pug">
  ElConfigProvider(:locale="elLocale")
    div#global-background
    //- Global route-change loading indicator
    NuxtLoadingIndicator(:color="'#409EFF'" :height="3")
    NuxtLayout
      NuxtPage(:keepalive="keepAliveProps" :pageKey="$route.fullPath")

</template>

<script setup lang="ts">
// @ts-ignore
import elEn from 'element-plus/dist/locale/en.mjs';
// @ts-ignore
import elAr from 'element-plus/dist/locale/ar.mjs';

// KeepAlive config - cache frequently visited pages for faster back-navigation
const keepAliveProps = {
  max: 10,
  include: ['index', 'sales-leads', 'sales-deals', 'sales-clients', 'sales-invoices', 'crm-contacts', 'operations-projects']
};

// Global locale direction handler — ensures RTL/LTR is always in sync
const { locale } = useI18n();

const elLocaleMap: Record<string, any> = { en: elEn, ar: elAr };
const elLocale = computed(() => elLocaleMap[locale.value] || elEn);

watch(
  locale,
  val => {
    if (import.meta.client) {
      document.documentElement.dir = val === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = val;
      // Chrome applies translateX(-viewport) to <html> when dir=rtl + overflow-x:hidden,
      // creating a containing block that breaks all position:fixed elements.
      // Force transform:none via inline style to override Chrome's rendering engine behavior.
      document.documentElement.style.transform = 'none';
    }
  },
  { immediate: true }
);
</script>
