<template lang="pug">
teleport(to="body")
  transition(name="slide-up-nav")
    nav.mobile-bottom-nav(
      v-if="isMobile"
      role="navigation"
      :aria-label="$t('mobile.bottomNavigation')"
    )
      NuxtLink.bottom-nav-tab(
        v-for="tab in tabs"
        :key="tab.route"
        :to="tab.route"
        :class="{ 'is-active': isActive(tab.route) }"
        :aria-label="$t(tab.labelKey)"
        :aria-current="isActive(tab.route) ? 'page' : undefined"
      )
        .tab-icon-wrap(:class="{ 'is-active': isActive(tab.route) }")
          Icon(:name="isActive(tab.route) ? tab.activeIcon : tab.icon" size="22")
        span.tab-text {{ $t(tab.labelKey) }}
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMain } from '~/stores/common';

const route = useRoute();
const mainStore = useMain();
const { mobile } = storeToRefs(mainStore);

const isMobile = computed(() => mobile.value);

const tabs = [
  {
    route: '/',
    icon: 'ph:house-bold',
    activeIcon: 'ph:house-fill',
    labelKey: 'navigation.dashboard',
  },
  {
    route: '/sales/leads',
    icon: 'ph:users-three-bold',
    activeIcon: 'ph:users-three-fill',
    labelKey: 'navigation.leads',
  },
  {
    route: '/sales/deals',
    icon: 'ph:handshake-bold',
    activeIcon: 'ph:handshake-fill',
    labelKey: 'navigation.deals',
  },
  {
    route: '/tasks',
    icon: 'ph:list-checks-bold',
    activeIcon: 'ph:list-checks-fill',
    labelKey: 'mobile.tasks',
  },
  {
    route: '/sales/clients',
    icon: 'ph:dots-three-outline-bold',
    activeIcon: 'ph:dots-three-outline-fill',
    labelKey: 'mobile.more',
  },
];

function isActive(link: string): boolean {
  if (link === '/') return route.path === '/';
  return route.path.startsWith(link);
}
</script>

<style lang="scss" scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: calc(64px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--glass-bg-primary);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-top: 1px solid var(--glass-border-color);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
}

.bottom-nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  min-height: 44px;
  padding: 6px 0;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  position: relative;

  &:active {
    .tab-icon-wrap {
      transform: scale(0.88);
    }
  }

  &.is-active {
    color: var(--brand-primary);
  }
}

.tab-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 28px;
  border-radius: 14px;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);

  &.is-active {
    background: rgba(124, 58, 237, 0.12);
    color: var(--brand-primary);
  }
}

.tab-text {
  font-size: 10px;
  line-height: 1;
  font-weight: 500;
  white-space: nowrap;
}

// Slide up entrance
.slide-up-nav-enter-active,
.slide-up-nav-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-up-nav-enter-from,
.slide-up-nav-leave-to {
  transform: translateY(100%);
}
</style>
