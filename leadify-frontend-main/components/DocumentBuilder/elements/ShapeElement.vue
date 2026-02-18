<template lang="pug">
.shape-element(
  :style="elementStyle"
  @mousedown.stop="$emit('select')"
)
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

const elementStyle = computed(() => {
  const isCircle = props.element.props?.shape === 'circle';
  return {
    width: '100%',
    height: '100%',
    background: props.element.props?.fill || '#e0e0e0',
    borderRadius: isCircle
      ? '50%'
      : props.element.props?.borderRadius
        ? `${props.element.props.borderRadius * props.scale}px`
        : '0',
    border: props.element.props?.borderWidth
      ? `${props.element.props.borderWidth * props.scale}px solid ${props.element.props?.borderColor || '#ccc'}`
      : 'none'
  };
});
</script>

<style scoped>
.shape-element {
  cursor: pointer;
  user-select: none;
}
</style>
