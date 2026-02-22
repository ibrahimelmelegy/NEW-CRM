<template lang="pug">
.document-version-history
  .flex.items-center.justify-between.mb-6
    h3.text-lg.font-bold(style="color: var(--text-primary)") Version History
    el-tag(size="small" round effect="plain") {{ versions.length }} versions

  .space-y-3(v-if="versions.length > 0")
    .glass-card.p-4.rounded-xl.flex.items-start.gap-4.group.transition-all.hover_shadow-md(
      v-for="version in versions"
      :key="version.id"
      :class="{ 'ring-2 ring-purple-500/30 border-purple-300': version.version === currentVersion }"
    )
      //- Version badge
      .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.font-bold.text-sm(
        :style="version.version === currentVersion ? 'background: rgba(124,58,237,0.15); color: #7c3aed;' : 'background: rgba(107,114,128,0.1); color: #6b7280;'"
      ) v{{ version.version }}

      //- Version details
      .flex-1.min-w-0
        .flex.items-center.gap-2
          span.font-bold.text-sm(style="color: var(--text-primary)")
            | {{ version.changeNote || `Version ${version.version}` }}
          el-tag(v-if="version.version === currentVersion" size="small" type="success" round effect="dark") Current

        .flex.items-center.gap-3.mt-1
          span.text-xs(style="color: var(--text-muted)")
            Icon(name="ph:user" size="12" class="inline mr-1")
            | {{ version.editor?.name || 'Unknown' }}
          span.text-xs(style="color: var(--text-muted)")
            Icon(name="ph:clock" size="12" class="inline mr-1")
            | {{ formatDate(version.createdAt) }}

      //- Actions
      .flex.gap-1.opacity-0.group-hover_opacity-100.transition-opacity
        el-tooltip(content="View this version" placement="top")
          el-button(size="small" circle plain @click="$emit('view', version)")
            Icon(name="ph:eye" size="14")
        el-tooltip(v-if="version.version !== currentVersion" content="Restore this version" placement="top")
          el-button(size="small" circle type="warning" plain @click="handleRestore(version)")
            Icon(name="ph:arrow-counter-clockwise" size="14")

  .text-center.py-8(v-else)
    Icon(name="ph:clock-counter-clockwise" size="48" class="text-gray-300 mb-3")
    p.text-sm(style="color: var(--text-muted)") No version history available
</template>

<script setup lang="ts">
import type { DocBuilderVersion } from '~/composables/useDocBuilder';

const props = defineProps<{
  versions: DocBuilderVersion[];
  currentVersion: number;
}>();

const emit = defineEmits<{
  (e: 'view', version: DocBuilderVersion): void;
  (e: 'restore', version: DocBuilderVersion): void;
}>();

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

async function handleRestore(version: DocBuilderVersion) {
  try {
    await ElMessageBox.confirm(
      `Restore to version ${version.version}? This will create a new version with the restored content.`,
      'Restore Version',
      { confirmButtonText: 'Restore', type: 'warning' }
    );
    emit('restore', version);
  } catch { /* cancelled */ }
}
</script>
