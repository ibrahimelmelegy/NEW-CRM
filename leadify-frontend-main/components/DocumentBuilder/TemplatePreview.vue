<template lang="pug">
el-dialog(v-model="visible" :title="$t('documentTemplates.builder.preview')" width="680px" @close="$emit('close')")
  .flex.justify-center.p-4(style="background: #e5e7eb")
    .a4-preview.relative.shadow-lg(
      :style="previewStyle"
    )
      template(v-for="el in elements" :key="el.id")
        .element-wrap(:style="wrapStyle(el)")
          TextElement(v-if="el.type === 'text'" :element="el" :scale="previewScale")
          ImageElement(v-if="el.type === 'image'" :element="el" :scale="previewScale")
          TableElement(v-if="el.type === 'table'" :element="el" :scale="previewScale")
          LineElement(v-if="el.type === 'line'" :element="el" :scale="previewScale")
          ShapeElement(v-if="el.type === 'shape'" :element="el" :scale="previewScale")
</template>

<script setup lang="ts">
import TextElement from './elements/TextElement.vue';
import ImageElement from './elements/ImageElement.vue';
import TableElement from './elements/TableElement.vue';
import LineElement from './elements/LineElement.vue';
import ShapeElement from './elements/ShapeElement.vue';

const props = defineProps<{
  show: boolean;
  elements: Record<string, unknown>[];
  orientation: 'portrait' | 'landscape';
}>();

const emit = defineEmits(['close']);

const visible = computed({
  get: () => props.show,
  set: v => {
    if (!v) emit('close');
  }
});

const pageWidth = computed(() => (props.orientation === 'portrait' ? 210 : 297));
const pageHeight = computed(() => (props.orientation === 'portrait' ? 297 : 210));
const previewScale = computed(() => 2.2);

const previewStyle = computed(() => ({
  width: `${pageWidth.value * previewScale.value}px`,
  height: `${pageHeight.value * previewScale.value}px`,
  background: 'white',
  position: 'relative' as const,
  overflow: 'hidden',
  borderRadius: '2px'
}));

function wrapStyle(el: unknown) {
  return {
    position: 'absolute' as const,
    left: `${el.x * previewScale.value}px`,
    top: `${el.y * previewScale.value}px`,
    width: `${el.width * previewScale.value}px`,
    height: `${el.height * previewScale.value}px`
  };
}
</script>
