<template lang="pug">
.image-element(
  :style="elementStyle"
  @mousedown.stop="$emit('select')"
)
  .image-placeholder.flex.items-center.justify-center.w-full.h-full
    Icon(name="ph:image" :size="Math.max(16, 24 * scale)" style="color: #aaa")
    span.ml-1.text-xs(v-if="scale > 0.5" style="color: #aaa") {{ displayLabel }}
</template>

<script setup lang="ts">
const props = defineProps<{
  element: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    props: Record<string, unknown>;
  };
  scale: number;
}>();

defineEmits(['select']);

const displayLabel = computed(() => {
  const content = props.element.props?.content || 'Image';
  if (content.includes('{{')) return content.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => k);
  return 'Image';
});

const elementStyle = computed(() => ({
  width: '100%',
  height: '100%',
  border: '1px dashed #ccc',
  borderRadius: '4px',
  background: '#fafafa'
}));
</script>

<style scoped>
.image-element {
  cursor: pointer;
  user-select: none;
}
</style>
