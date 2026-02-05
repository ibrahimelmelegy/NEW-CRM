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
    <button class="lang-toggle premium-nav-btn" @click="toggleLanguage" :title="locale === 'en' ? $t('common.arabic') : $t('common.english')">
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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    
    &:hover {
        background: rgba(120, 73, 255, 0.1);
        border-color: rgba(120, 73, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(120, 73, 255, 0.2);
    }
    
    span {
        letter-spacing: 0.5px;
    }
}

:global(body.light-theme) .lang-toggle {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.08);
    
    &:hover {
        background: rgba(120, 73, 255, 0.05);
        border-color: rgba(120, 73, 255, 0.2);
    }
}
</style>
