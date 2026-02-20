<template lang="pug">
.portal-projects
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold.mb-1(style="color: var(--text-primary)") {{ $t('portal.projects.title') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('portal.projects.subtitle') }}

  //- Loading State
  .glass-card.p-12.text-center(v-if="loading")
    el-skeleton(:rows="4" animated)

  //- Project Cards
  .space-y-6(v-else-if="projects.length")
    PortalProjectTracker(
      v-for="project in projects"
      :key="project.id"
      :project="project"
    )

  //- Empty State
  .glass-card.p-12.text-center(v-else)
    Icon(name="ph:kanban" size="64" style="color: var(--text-muted)" aria-label="No projects")
    p.text-lg.font-semibold.mt-4(style="color: var(--text-primary)") {{ $t('portal.projects.noProjects') }}
    p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('portal.projects.noProjectsHint') }}
</template>

<script setup lang="ts">
import { useEnhancedPortal } from '~/composables/usePortal';

definePageMeta({ layout: 'portal' });

const { portalFetch, init, isAuthenticated } = usePortalAuth();
const { projects, loading, fetchProjects } = useEnhancedPortal();

onMounted(async () => {
  init();
  if (!isAuthenticated()) { navigateTo('/portal/login'); return; }
  await fetchProjects();
});
</script>
