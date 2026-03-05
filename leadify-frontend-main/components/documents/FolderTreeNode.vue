<template lang="pug">
div
  //- Folder item
  .folder-tree-item.flex.items-center.gap-2.p-2.rounded-lg.cursor-pointer.mb-1.group(
    :class="{ 'active-folder': selectedId === folder.id }"
    :style="{ paddingLeft: `${(depth * 16) + 8}px` }"
    @click.stop="$emit('select', folder.id)"
  )
    //- Expand/collapse arrow
    span.flex-shrink-0.cursor-pointer(
      v-if="hasChildren"
      @click.stop="expanded = !expanded"
    )
      Icon(:name="expanded ? 'ph:caret-down-bold' : 'ph:caret-right-bold'" size="12" style="color: var(--text-muted)")
    span.w-3.flex-shrink-0(v-else)
    //- Folder icon
    Icon(name="ph:folder-bold" size="16" :style="{ color: folder.color || '#7849ff' }")
    //- Name
    span.text-sm.truncate.flex-1(style="color: var(--text-primary)") {{ folder.name }}
    //- Action buttons (hover)
    .hidden.flex-shrink-0(class="group-hover:flex" style="gap: 4px")
      span.cursor-pointer(@click.stop="$emit('edit', folder)")
        Icon(name="ph:pencil-simple-bold" size="12" style="color: var(--text-muted)")
      span.cursor-pointer(@click.stop="$emit('delete', folder)")
        Icon(name="ph:trash-bold" size="12" style="color: var(--text-muted)")

  //- Children (recursive)
  template(v-if="expanded && hasChildren")
    FolderTreeNode(
      v-for="child in folder.children"
      :key="child.id"
      :folder="child"
      :selected-id="selectedId"
      :depth="depth + 1"
      @select="(id: number) => $emit('select', id)"
      @edit="(f: unknown) => $emit('edit', f)"
      @delete="(f: unknown) => $emit('delete', f)"
    )
</template>

<script setup lang="ts">
import type { DocumentFolder } from '~/composables/useDocuments';

const props = defineProps<{
  folder: DocumentFolder;
  selectedId: number | null;
  depth: number;
}>();

defineEmits<{
  select: [id: number];
  edit: [folder: DocumentFolder];
  delete: [folder: DocumentFolder];
}>();

const expanded = ref(false);
const hasChildren = computed(() => props.folder.children && props.folder.children.length > 0);
</script>

<style scoped>
.folder-tree-item:hover {
  background: rgba(120, 73, 255, 0.05);
}

.active-folder {
  background: rgba(120, 73, 255, 0.1) !important;
}
</style>
