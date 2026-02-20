<template lang="pug">
.mobile-nav(v-if="isMobile")
  .mobile-nav-bar
    NuxtLink.nav-tab(
      v-for="tab in mainTabs"
      :key="tab.route"
      :to="tab.route"
      :class="{ active: isActive(tab.route) }"
    )
      Icon(:name="tab.icon" size="22")
      span.tab-label {{ $t(tab.labelKey) }}

    button.nav-tab(
      :class="{ active: moreOpen }"
      @click.stop="moreOpen = !moreOpen"
    )
      Icon(:name="moreOpen ? 'ph:x-bold' : 'ph:dots-three-bold'" size="22")
      span.tab-label {{ $t('mobile.more') }}

  //- Bottom sheet for "More" menu
  transition(name="slide-up")
    .more-sheet(v-if="moreOpen" @click.self="moreOpen = false")
      .more-sheet-content
        .sheet-handle
        h3.sheet-title {{ $t('mobile.moreOptions') }}
        .more-items
          NuxtLink.more-item(
            v-for="item in moreItems"
            :key="item.route"
            :to="item.route"
            @click="moreOpen = false"
          )
            .more-item-icon(:style="{ background: item.color }")
              Icon(:name="item.icon" size="20" class="text-white")
            .more-item-text
              span.more-item-label {{ $t(item.labelKey) }}
              span.more-item-desc {{ $t(item.descKey) }}
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMain } from '~/stores/common';

const route = useRoute();
const mainStore = useMain();
const { mobile } = storeToRefs(mainStore);

const isMobile = computed(() => mobile.value);
const moreOpen = ref(false);

const mainTabs = [
  { route: '/', icon: 'ph:house-bold', labelKey: 'navigation.dashboard' },
  { route: '/sales/leads', icon: 'ph:users-three-bold', labelKey: 'navigation.leads' },
  { route: '/sales/deals', icon: 'ph:handshake-bold', labelKey: 'navigation.deals' },
  { route: '/tasks', icon: 'ph:list-checks-bold', labelKey: 'mobile.tasks' },
];

const moreItems = [
  { route: '/sales/clients', icon: 'ph:buildings-bold', labelKey: 'navigation.clients', descKey: 'mobile.clientsDesc', color: '#3B82F6' },
  { route: '/sales/opportunities', icon: 'ph:target-bold', labelKey: 'navigation.opportunities', descKey: 'mobile.opportunitiesDesc', color: '#8B5CF6' },
  { route: '/messaging', icon: 'ph:chat-circle-dots-bold', labelKey: 'navigation.messaging', descKey: 'mobile.messagingDesc', color: '#10B981' },
  { route: '/calendar', icon: 'ph:calendar-bold', labelKey: 'navigation.calendar', descKey: 'mobile.calendarDesc', color: '#F59E0B' },
  { route: '/reports', icon: 'ph:chart-bar-bold', labelKey: 'navigation.reports', descKey: 'mobile.reportsDesc', color: '#EF4444' },
  { route: '/settings', icon: 'ph:gear-bold', labelKey: 'navigation.settings', descKey: 'mobile.settingsDesc', color: '#6366F1' },
];

function isActive(link: string) {
  if (link === '/') return route.path === '/';
  return route.path.startsWith(link);
}

// Close more sheet on route change
watch(() => route.path, () => {
  moreOpen.value = false;
});

// Close on escape
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') moreOpen.value = false;
}

onMounted(() => document.addEventListener('keydown', onKeyDown));
onUnmounted(() => document.removeEventListener('keydown', onKeyDown));
</script>

<style lang="scss" scoped>
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.mobile-nav-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
  background: var(--glass-bg-primary);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-top: 1px solid var(--glass-border-color);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 56px;
  min-height: 44px;
  padding: 4px 8px;
  color: var(--text-muted);
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.92);
  }

  &.active {
    color: var(--brand-primary);

    .tab-label {
      font-weight: 600;
    }
  }
}

.tab-label {
  font-size: 10px;
  line-height: 1.2;
  white-space: nowrap;
}

// More bottom sheet
.more-sheet {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
}

.more-sheet-content {
  width: 100%;
  max-height: 70vh;
  overflow-y: auto;
  background: var(--glass-bg-primary);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-top: 1px solid var(--glass-border-color);
  border-radius: 20px 20px 0 0;
  padding: 12px 20px calc(80px + env(safe-area-inset-bottom, 0px));
}

.sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--text-disabled);
  margin: 0 auto 16px;
}

.sheet-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.more-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.more-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 14px;
  text-decoration: none;
  transition: background 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--glass-bg-active);
  }
}

.more-item-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.more-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.more-item-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.more-item-desc {
  font-size: 12px;
  color: var(--text-muted);
}

// Slide up transition
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  .more-sheet-content {
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;

  .more-sheet-content {
    transform: translateY(100%);
  }
}
</style>
