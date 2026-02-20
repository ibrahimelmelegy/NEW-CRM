<template lang="pug">
.portal-layout.min-h-screen
  ProfessionalBackground
  PortalHeader(:user="portalUser" @logout="logout")
  .portal-nav
    .portal-nav-inner
      NuxtLink.portal-nav-item(
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="{ active: isActive(item.to) }"
      )
        Icon(:name="item.icon" size="16" :aria-label="item.label")
        span {{ $t(item.label) }}
  .portal-content
    slot
</template>

<script setup lang="ts">
const { portalUser, init, logout, isAuthenticated } = usePortalAuth();
const route = useRoute();

const navItems = [
  { to: '/portal', icon: 'ph:house-bold', label: 'portal.nav.dashboard' },
  { to: '/portal/deals', icon: 'ph:handshake-bold', label: 'portal.nav.deals' },
  { to: '/portal/invoices', icon: 'ph:receipt-bold', label: 'portal.nav.invoices' },
  { to: '/portal/projects', icon: 'ph:kanban-bold', label: 'portal.nav.projects' },
  { to: '/portal/documents', icon: 'ph:folder-open-bold', label: 'portal.nav.documents' },
  { to: '/portal/signatures', icon: 'ph:pen-nib-bold', label: 'portal.nav.signatures' },
  { to: '/portal/tickets', icon: 'ph:ticket-bold', label: 'portal.nav.tickets' }
];

function isActive(path: string): boolean {
  if (path === '/portal') return route.path === '/portal';
  return route.path.startsWith(path);
}

onMounted(() => {
  init();
  if (!isAuthenticated()) {
    navigateTo('/portal/login');
  }
});
</script>

<style scoped>
.portal-layout {
  background: var(--bg-base);
}
.portal-nav {
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-card);
}
.portal-nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  gap: 4px;
}
.portal-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.portal-nav-item:hover {
  color: var(--text-primary);
}
.portal-nav-item.active {
  color: #7849ff;
  border-bottom-color: #7849ff;
}
.portal-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
