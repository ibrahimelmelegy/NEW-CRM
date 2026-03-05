<template lang="pug">
.builder-sidebar.glass-card.rounded-xl.p-4(style="width: 240px; min-width: 240px; overflow-y: auto; max-height: calc(100vh - 180px)")
  //- Add Elements
  h3.font-bold.mb-3.text-sm(style="color: var(--text-primary)") {{ $t('documentTemplates.builder.addElement') }}
  .grid.grid-cols-2.gap-2.mb-4
    .element-btn.p-2.rounded-lg.cursor-pointer.flex.flex-col.items-center.gap-1.transition-all(
      v-for="item in elementTypes"
      :key="item.type"
      style="background: var(--bg-input); border: 1px solid var(--border-default)"
      @click="$emit('add-element', item.type)"
    )
      Icon(:name="item.icon" size="20" style="color: #7849ff")
      span.text-xs(style="color: var(--text-primary)") {{ $t(item.label) }}

  el-divider

  //- Element Layers
  h3.font-bold.mb-3.text-sm(style="color: var(--text-primary)") {{ $t('documentTemplates.builder.layers') || 'Layers' }}
  .space-y-1.mb-4(v-if="elements && elements.length")
    .layer-item.px-2.py-1.rounded-lg.cursor-pointer.flex.items-center.gap-2.transition-all(
      v-for="(el, index) in reversedElements"
      :key="el.id"
      :class="{ 'active-layer': selectedId === el.id }"
      style="border: 1px solid transparent"
      @click="$emit('select-element', el.id)"
    )
      Icon(:name="getElementIcon(el.type)" size="14" style="color: var(--text-muted)")
      span.text-xs.flex-1.truncate(style="color: var(--text-primary)") {{ getElementLabel(el) }}
      .flex.gap-0
        el-button(text size="small" @click.stop="$emit('move-layer', { id: el.id, direction: 'up' })" :disabled="index === 0")
          Icon(name="ph:caret-up" size="12")
        el-button(text size="small" @click.stop="$emit('move-layer', { id: el.id, direction: 'down' })" :disabled="index === reversedElements.length - 1")
          Icon(name="ph:caret-down" size="12")
  .text-center.py-3(v-else)
    p.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.noElements') || 'No elements yet' }}

  el-divider

  //- Variables
  h3.font-bold.mb-3.text-sm(style="color: var(--text-primary)") {{ $t('documentTemplates.builder.variables') }}
  .space-y-1.max-h-48.overflow-y-auto
    .variable-btn.px-2.py-1.rounded.cursor-pointer.text-xs.font-mono.transition-all(
      v-for="v in variables"
      :key="v"
      style="color: #7849ff; background: var(--bg-input)"
      @click="$emit('insert-variable', v)"
    )
      span(v-text="'{{' + v + '}}'")

  el-divider

  //- Page Settings
  h3.font-bold.mb-3.text-sm(style="color: var(--text-primary)") {{ $t('documentTemplates.builder.pageSettings') }}
  .space-y-3
    div
      label.text-xs.block.mb-1(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.orientation') }}
      el-radio-group(v-model="localOrientation" size="small" @change="$emit('update:orientation', localOrientation)")
        el-radio-button(value="portrait") {{ $t('documentTemplates.builder.portrait') }}
        el-radio-button(value="landscape") {{ $t('documentTemplates.builder.landscape') }}
</template>

<script setup lang="ts">
const props = defineProps<{
  variables: string[];
  orientation: string;
  elements?: Record<string, unknown>[];
  selectedId?: string | null;
}>();

defineEmits(['add-element', 'insert-variable', 'update:orientation', 'select-element', 'move-layer']);

const localOrientation = ref(props.orientation);
watch(
  () => props.orientation,
  v => {
    localOrientation.value = v;
  }
);

const reversedElements = computed(() => {
  return [...(props.elements || [])].reverse();
});

const elementTypes = [
  { type: 'text', icon: 'ph:text-t-bold', label: 'documentTemplates.builder.text' },
  { type: 'image', icon: 'ph:image-bold', label: 'documentTemplates.builder.image' },
  { type: 'table', icon: 'ph:table-bold', label: 'documentTemplates.builder.table' },
  { type: 'line', icon: 'ph:minus-bold', label: 'documentTemplates.builder.line' },
  { type: 'shape', icon: 'ph:rectangle-bold', label: 'documentTemplates.builder.shape' }
];

function getElementIcon(type: string): string {
  const found = elementTypes.find(e => e.type === type);
  return found?.icon || 'ph:cube-bold';
}

function getElementLabel(el: unknown): string {
  if (el.type === 'text') {
    const content = el.props?.content || '';
    return content.substring(0, 20) || 'Text';
  }
  if (el.type === 'image') return 'Image';
  if (el.type === 'table') return 'Table';
  if (el.type === 'line') return 'Line';
  if (el.type === 'shape') return el.props?.shape || 'Shape';
  return el.type;
}
</script>

<style scoped>
.element-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(120, 73, 255, 0.15);
}
.variable-btn:hover {
  opacity: 0.8;
}
.layer-item:hover {
  background: var(--bg-input);
}
.active-layer {
  background: rgba(120, 73, 255, 0.1) !important;
  border-color: rgba(120, 73, 255, 0.3) !important;
}
</style>
