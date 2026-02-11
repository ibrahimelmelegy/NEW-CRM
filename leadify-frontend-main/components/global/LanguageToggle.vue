<script setup lang="ts">
const { locale, locales, setLocale } = useI18n();

const toggleLanguage = () => {
  const nextLocale = locale.value === 'en' ? 'ar' : 'en';
  setLocale(nextLocale);

  // Update document direction
  if (process.client) {
    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLocale;
  }
};

// Ensure direction is set on mount
onMounted(() => {
  if (process.client) {
    document.documentElement.dir = locale.value === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale.value;
  }
});
</script>

<template>
  <button class="lang-toggle premium-nav-btn" :title="locale === 'en' ? $t('common.arabic') : $t('common.english')" @click="toggleLanguage">
    <span class="text-xs font-bold">{{ locale === 'en' ? 'AR' : 'EN' }}</span>
  </button>
</template>

<style scoped lang="scss">
.lang-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // Match Obsidian Glass theme
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border-default);
  color: var(--text-primary);

  &:hover {
    background: var(--color-primary-alpha-10);
    border-color: var(--color-primary-alpha-30);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--color-primary-alpha-20);
  }

  span {
    letter-spacing: 0.5px;
  }
}

:global(html.light-mode) .lang-toggle {
    background: var(--color-surface-hover);
    border-color: var(--color-border-subtle);

    &:hover {
        background: var(--color-primary-alpha-05);
        border-color: var(--color-primary-alpha-20);
    }
}
</style>
