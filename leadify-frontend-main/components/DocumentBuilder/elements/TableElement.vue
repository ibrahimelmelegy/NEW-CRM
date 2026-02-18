<template lang="pug">
.table-element(
  :style="elementStyle"
  @mousedown.stop="$emit('select')"
)
  table.w-full(style="border-collapse: collapse")
    thead
      tr(:style="headerStyle")
        th(v-for="col in columns" :key="col" :style="thStyle") {{ col }}
    tbody
      tr(v-for="r in 3" :key="r" :style="r % 2 === 0 && stripedBg ? { background: stripedBg } : {}")
        td(v-for="col in columns" :key="col" :style="tdStyle") ---
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

const columns = computed(() => props.element.props?.columns || ['Column 1', 'Column 2', 'Column 3']);
const stripedBg = computed(() => props.element.props?.stripedBg);

const elementStyle = computed(() => ({
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  fontSize: `${(props.element.props?.fontSize || 9) * props.scale}px`,
  fontFamily: props.element.props?.fontFamily || 'Helvetica, sans-serif'
}));

const headerStyle = computed(() => ({
  background: props.element.props?.headerBg || '#f0f0f0',
  color: props.element.props?.headerColor || '#000'
}));

const thStyle = computed(() => ({
  padding: `${2 * props.scale}px ${4 * props.scale}px`,
  textAlign: 'left' as const,
  borderBottom: `1px solid ${props.element.props?.borderColor || '#ccc'}`,
  fontSize: `${(props.element.props?.fontSize || 9) * props.scale}px`
}));

const tdStyle = computed(() => ({
  padding: `${2 * props.scale}px ${4 * props.scale}px`,
  borderBottom: `1px solid ${props.element.props?.borderColor || '#eee'}`,
  color: '#666',
  fontSize: `${(props.element.props?.fontSize || 9) * props.scale}px`
}));
</script>

<style scoped>
.table-element {
  cursor: pointer;
  user-select: none;
}
</style>
