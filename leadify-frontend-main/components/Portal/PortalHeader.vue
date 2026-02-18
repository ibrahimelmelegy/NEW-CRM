<template lang="pug">
header.portal-header
  .portal-header-inner
    .flex.items-center.gap-3
      NuxtLink.flex.items-center.gap-2(to="/portal")
        Icon(name="ph:buildings-bold" size="24" class="text-[#7849ff]" aria-label="Portal")
        span.text-lg.font-bold(style="color: var(--text-primary)") {{ companyName }}
      span.text-xs.px-2.py-1.rounded-full(style="background: rgba(120,73,255,0.15); color: #7849ff") Client Portal
    .flex.items-center.gap-3
      ColorModeToggle
      LanguageToggle
      el-dropdown
        .flex.items-center.gap-2.cursor-pointer(style="color: var(--text-primary)")
          .w-8.h-8.rounded-full.flex.items-center.justify-center(style="background: rgba(120,73,255,0.15)")
            Icon(name="ph:user-bold" size="16" class="text-[#7849ff]" aria-label="User")
          span.text-sm.font-medium {{ user?.name || 'User' }}
          Icon(name="ph:caret-down" size="14" aria-label="Menu")
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item(@click="$emit('logout')")
              Icon(name="ph:sign-out-bold" size="14" aria-label="Logout")
              span.ml-2 {{ $t('common.logout') }}
</template>

<script setup lang="ts">
import type { PortalUserProfile } from '~/composables/usePortalAuth';

defineProps<{
  user: PortalUserProfile | null;
  companyName?: string;
}>();

defineEmits(['logout']);
</script>

<style scoped>
.portal-header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-default);
}
.portal-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
