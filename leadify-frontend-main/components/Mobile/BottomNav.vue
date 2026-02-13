<template lang="pug">
.bottom-nav.fixed.bottom-0.left-0.right-0.flex.justify-around.items-center.py-2.px-1(
  v-if="isMobile"
  style="background: var(--glass-bg, rgba(10,10,26,0.95)); border-top: 1px solid var(--border-default); z-index: 100; backdrop-filter: blur(20px)"
)
  NuxtLink.bottom-nav-item.flex.flex-col.items-center.gap-1.py-1.px-3(
    v-for="item in navItems"
    :key="item.link"
    :to="item.link"
    :class="{ 'active': isActive(item.link) }"
  )
    Icon(:name="item.icon" size="22" :aria-label="item.label")
    span.text-xs {{ item.label }}
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMain } from '~/stores/common';

const route = useRoute();
const mainStore = useMain();
const { mobile } = storeToRefs(mainStore);

const isMobile = computed(() => mobile.value);

const navItems = [
  { link: '/', icon: 'ph:house-bold', label: 'Home' },
  { link: '/sales/leads', icon: 'ph:users-three-bold', label: 'Leads' },
  { link: '/sales/deals', icon: 'ph:handshake-bold', label: 'Deals' },
  { link: '/messaging', icon: 'ph:chat-circle-dots-bold', label: 'Chat' },
  { link: '/notifications', icon: 'ph:bell-bold', label: 'Alerts' }
];

function isActive(link: string) {
  if (link === '/') return route.path === '/';
  return route.path.startsWith(link);
}
</script>

<style lang="scss" scoped>
.bottom-nav-item {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s ease;
  min-width: 56px;

  &.active {
    color: #7849ff;
  }
}

// Add bottom padding to body when nav is visible
:global(body) {
  @media (max-width: 768px) {
    padding-bottom: 68px;
  }
}
</style>
