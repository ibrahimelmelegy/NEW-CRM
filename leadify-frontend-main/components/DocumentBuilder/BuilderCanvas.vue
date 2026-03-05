<template lang="pug">
.builder-canvas-wrapper.flex-1.overflow-auto.flex.flex-col(
  style="background: var(--bg-input)"
)
  //- Zoom controls
  .flex.items-center.justify-center.gap-2.py-2
    el-button(text size="small" @click="zoomOut" :disabled="zoomLevel <= 50")
      Icon(name="ph:minus-bold" size="16")
    .text-xs.font-bold.w-12.text-center(style="color: var(--text-muted)") {{ zoomLevel }}%
    el-button(text size="small" @click="zoomIn" :disabled="zoomLevel >= 200")
      Icon(name="ph:plus-bold" size="16")
    el-button(text size="small" @click="zoomReset")
      Icon(name="ph:arrows-in-bold" size="14")
    el-divider(direction="vertical")
    el-checkbox(v-model="showGrid" size="small") Grid
    el-checkbox(v-model="snapToGrid" size="small") Snap

  .flex-1.overflow-auto.flex.items-start.justify-center.p-6(
    ref="scrollContainer"
    @mousedown.self="$emit('deselect')"
  )
    //- Grid overlay
    .a4-canvas.relative.shadow-xl(
      ref="canvasRef"
      :style="canvasStyle"
    )
      //- Grid lines
      svg.absolute.inset-0.pointer-events-none(v-if="showGrid" :width="canvasWidth" :height="canvasHeight" style="opacity: 0.15")
        template(v-for="i in verticalLines" :key="'v'+i")
          line(:x1="i * gridSpacePx" :y1="0" :x2="i * gridSpacePx" :y2="canvasHeight" stroke="#7849ff" stroke-width="0.5")
        template(v-for="i in horizontalLines" :key="'h'+i")
          line(:x1="0" :y1="i * gridSpacePx" :x2="canvasWidth" :y2="i * gridSpacePx" stroke="#7849ff" stroke-width="0.5")

      template(v-for="el in elements" :key="el.id")
        .element-wrapper(
          :class="{ 'is-selected': selectedId === el.id }"
          :style="wrapperStyle(el)"
          @mousedown.stop="startDrag(el, $event)"
        )
          TextElement(v-if="el.type === 'text'" :element="el" :scale="currentScale" @select="$emit('select', el.id)")
          ImageElement(v-if="el.type === 'image'" :element="el" :scale="currentScale" @select="$emit('select', el.id)")
          TableElement(v-if="el.type === 'table'" :element="el" :scale="currentScale" @select="$emit('select', el.id)")
          LineElement(v-if="el.type === 'line'" :element="el" :scale="currentScale" @select="$emit('select', el.id)")
          ShapeElement(v-if="el.type === 'shape'" :element="el" :scale="currentScale" @select="$emit('select', el.id)")

          //- Resize handle
          .resize-handle(
            v-if="selectedId === el.id"
            @mousedown.stop="startResize(el, $event)"
          )
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import TextElement from './elements/TextElement.vue';
import ImageElement from './elements/ImageElement.vue';
import TableElement from './elements/TableElement.vue';
import LineElement from './elements/LineElement.vue';
import ShapeElement from './elements/ShapeElement.vue';

const props = defineProps<{
  elements: Record<string, unknown>[];
  selectedId: string | null;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
}>();

const emit = defineEmits(['select', 'deselect', 'move-element', 'resize-element']);

const canvasRef = ref<HTMLElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);

// Zoom
const zoomLevel = ref(100);
const showGrid = ref(false);
const snapToGrid = ref(false);
const GRID_SIZE_MM = 5; // 5mm grid

function zoomIn() {
  zoomLevel.value = Math.min(200, zoomLevel.value + 10);
}
function zoomOut() {
  zoomLevel.value = Math.max(50, zoomLevel.value - 10);
}
function zoomReset() {
  zoomLevel.value = 100;
}

// A4 in mm: 210 x 297 (portrait) or 297 x 210 (landscape)
const pageWidth = computed(() => (props.orientation === 'portrait' ? 210 : 297));
const pageHeight = computed(() => (props.orientation === 'portrait' ? 297 : 210));

// Scale factor: base 2.8px/mm, adjusted by zoom
const baseScale = 2.8;
const currentScale = computed(() => baseScale * (zoomLevel.value / 100));

const canvasWidth = computed(() => pageWidth.value * currentScale.value);
const canvasHeight = computed(() => pageHeight.value * currentScale.value);

const gridSpacePx = computed(() => GRID_SIZE_MM * currentScale.value);
const verticalLines = computed(() => Math.floor(pageWidth.value / GRID_SIZE_MM));
const horizontalLines = computed(() => Math.floor(pageHeight.value / GRID_SIZE_MM));

const canvasStyle = computed(() => ({
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
  background: 'white',
  borderRadius: '4px',
  position: 'relative' as const
}));

function snapValue(val: number): number {
  if (!snapToGrid.value) return Math.round(val);
  return Math.round(val / GRID_SIZE_MM) * GRID_SIZE_MM;
}

function wrapperStyle(el: unknown) {
  return {
    position: 'absolute' as const,
    left: `${el.x * currentScale.value}px`,
    top: `${el.y * currentScale.value}px`,
    width: `${el.width * currentScale.value}px`,
    height: `${el.height * currentScale.value}px`,
    pointerEvents: 'auto' as const
  };
}

// Drag state
let dragging = false;
let resizing = false;
let dragEl: unknown = null;
let startX = 0;
let startY = 0;
let startElX = 0;
let startElY = 0;
let startElW = 0;
let startElH = 0;

function startDrag(el: unknown, e: MouseEvent) {
  emit('select', el.id);
  dragging = true;
  dragEl = el;
  startX = e.clientX;
  startY = e.clientY;
  startElX = el.x;
  startElY = el.y;
}

function startResize(el: unknown, e: MouseEvent) {
  resizing = true;
  dragEl = el;
  startX = e.clientX;
  startY = e.clientY;
  startElW = el.width;
  startElH = el.height;
}

function onMouseMove(e: MouseEvent) {
  if (!dragEl) return;
  const dx = (e.clientX - startX) / currentScale.value;
  const dy = (e.clientY - startY) / currentScale.value;

  if (dragging) {
    const newX = snapValue(Math.max(0, Math.min(pageWidth.value - dragEl.width, startElX + dx)));
    const newY = snapValue(Math.max(0, Math.min(pageHeight.value - dragEl.height, startElY + dy)));
    emit('move-element', { id: dragEl.id, x: newX, y: newY });
  } else if (resizing) {
    const newW = snapValue(Math.max(5, startElW + dx));
    const newH = snapValue(Math.max(5, startElH + dy));
    emit('resize-element', { id: dragEl.id, width: newW, height: newH });
  }
}

function onMouseUp() {
  dragging = false;
  resizing = false;
  dragEl = null;
}

// Keyboard: Ctrl+scroll to zoom
function onWheel(e: WheelEvent) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  }
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  scrollContainer.value?.addEventListener('wheel', onWheel, { passive: false });
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  scrollContainer.value?.removeEventListener('wheel', onWheel);
});
</script>

<style scoped>
.element-wrapper {
  z-index: 1;
}
.element-wrapper.is-selected {
  outline: 2px solid #7849ff;
  outline-offset: 1px;
  z-index: 10;
}
.resize-handle {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 8px;
  height: 8px;
  background: #7849ff;
  border-radius: 2px;
  cursor: se-resize;
  z-index: 20;
}
.a4-canvas {
  flex-shrink: 0;
}
</style>
