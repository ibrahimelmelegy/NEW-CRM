<script setup lang="ts">
import { useThemeStore } from '@/stores/theme';
const themeStore = useThemeStore();
</script>

<template>
    <button class="mode-toggle" @click="themeStore.toggleTheme" :title="themeStore.isLight ? $t('common.darkMode') : $t('common.lightMode')">
        <span class="icon">{{ themeStore.isLight ? '🌙' : '☀️' }}</span>
    </button>
</template>

<style scoped lang="scss">
.mode-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: var(--bg-card);
    cursor: pointer;
    transition: all 0.3s ease;

    .icon {
        font-size: 20px;
    }

    &:hover {
        transform: scale(1.1);
    }
}
</style>
