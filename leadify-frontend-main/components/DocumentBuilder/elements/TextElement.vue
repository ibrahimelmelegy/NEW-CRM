<template lang="pug">
.text-element(
  :style="elementStyle"
  @mousedown.stop="$emit('select')"
)
  span {{ displayContent }}
</template>

<script setup lang="ts">
const props = defineProps<{
  element: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    props: Record<string, any>;
  };
  scale: number;
}>();

defineEmits(['select']);

const displayContent = computed(() => {
  const content = props.element.props?.content || 'Text';
  return content.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => `[${key}]`);
});

const elementStyle = computed(() => ({
  width: '100%',
  height: '100%',
  fontSize: `${(props.element.props?.fontSize || 12) * props.scale}px`,
  fontWeight: props.element.props?.fontWeight || 'normal',
  fontFamily: props.element.props?.fontFamily || 'Helvetica, sans-serif',
  color: props.element.props?.color || '#333333',
  textAlign: props.element.props?.align || 'left',
  lineHeight: 1.3,
  overflow: 'hidden',
  wordBreak: 'break-word' as const,
  letterSpacing: props.element.props?.letterSpacing ? `${props.element.props.letterSpacing * props.scale}px` : undefined
}));
</script>

<style scoped>
.text-element {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: flex-start;
}
</style>
