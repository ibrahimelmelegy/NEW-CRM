<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme';
import { onMounted } from 'vue';

const themeStore = useThemeStore();

// Initialize theme on app mount
onMounted(() => {
  themeStore.initializeTheme();
});
</script>

<style lang="scss">
// Background is now handled by ProfessionalBackground component
</style>
