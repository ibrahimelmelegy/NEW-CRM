<script setup lang="ts">
import { useThemeStore } from '@/stores/theme';
const themeStore = useThemeStore();

const handleToggle = () => {
  // Add transition class before toggling for smooth color transitions
  document.documentElement.classList.add('theme-transition');
  themeStore.toggleTheme();

  // Remove the transition class after animation completes to avoid
  // performance overhead on every subsequent DOM change
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transition');
  }, 400);
};
</script>

<template lang="pug">
  button.theme-toggle.premium-nav-btn(
    :title="themeStore.isDark ? $t('theme.switchToLight') : $t('theme.switchToDark')"
    :aria-label="themeStore.isDark ? $t('theme.switchToLight') : $t('theme.switchToDark')"
    @click="handleToggle"
  )
    .theme-toggle__icon-wrapper
      Transition(name="theme-icon" mode="out-in")
        //- Sun icon shown in dark mode (click to go light)
        Icon.theme-toggle__icon(
          v-if="themeStore.isDark"
          name="ph:sun-bold"
          key="sun"
        )
        //- Moon icon shown in light mode (click to go dark)
        Icon.theme-toggle__icon(
          v-else
          name="ph:moon-bold"
          key="moon"
        )
</template>

<style scoped lang="scss">
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  // Match Obsidian Glass theme (same as LanguageToggle)
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(120, 73, 255, 0.1);
    border-color: rgba(120, 73, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(120, 73, 255, 0.2);
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }
}

.theme-toggle__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.theme-toggle__icon {
  font-size: 18px;
  line-height: 1;
}

/* Icon transition animations */
.theme-icon-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-icon-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}

/* Light mode styling override */
:global(html.light-mode) .theme-toggle {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);

  &:hover {
    background: rgba(120, 73, 255, 0.05);
    border-color: rgba(120, 73, 255, 0.2);
  }
}
</style>
