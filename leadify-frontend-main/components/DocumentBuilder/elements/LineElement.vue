<template lang="pug">
.line-element(
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

const elementStyle = computed(() => ({
  width: '100%',
  height: '100%',
  background: props.element.props?.color || '#000000'
}));
</script>

<style scoped>
.line-element {
  cursor: pointer;
  user-select: none;
}
</style>
