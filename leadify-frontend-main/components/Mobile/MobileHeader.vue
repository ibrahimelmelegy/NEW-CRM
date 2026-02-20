<template lang="pug">
header.mobile-header
  .header-left
    button.header-btn(
      v-if="showBack"
      @click="$emit('back')"
      :aria-label="$t('common.back')"
    )
      Icon(name="ph:arrow-left-bold" size="20")
    button.header-btn(
      v-else
      @click="$emit('menu-toggle')"
      :aria-label="$t('mobile.toggleMenu')"
    )
      Icon(name="ph:list-bold" size="20")

  h1.header-title {{ title }}

  .header-right
    button.header-btn(
      v-if="showSearch"
      @click="$emit('search')"
      :aria-label="$t('common.search')"
    )
      Icon(name="ph:magnifying-glass-bold" size="20")
    slot(name="right")
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
}>(), {
  title: '',
  showBack: false,
  showSearch: true,
});

defineEmits<{
  'menu-toggle': [];
  'search': [];
  'back': [];
}>();
</script>

<style lang="scss" scoped>
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 12px;
  background: var(--glass-bg-primary);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: 1px solid var(--glass-border-color);
  box-shadow: var(--glass-shadow);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 44px;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--glass-bg-active);
    transform: scale(0.95);
  }
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  padding: 0 8px;
}
</style>
