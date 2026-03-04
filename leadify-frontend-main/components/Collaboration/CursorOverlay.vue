<template lang="pug">
.cursor-overlay(v-if="visibleCursors.length > 0")
  TransitionGroup(name="cursor-fade")
    .remote-cursor(
      v-for="cursor in visibleCursors"
      :key="cursor.socketId"
      :style="cursorStyle(cursor)"
    )
      //- SVG Cursor Arrow
      svg(
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      )
        path(
          d="M0 0L16 12L8 12L6 20L0 0Z"
          :fill="cursor.color"
        )
        path(
          d="M0 0L16 12L8 12L6 20L0 0Z"
          stroke="rgba(0,0,0,0.2)"
          stroke-width="0.5"
          :fill="cursor.color"
        )
      CursorLabel(:name="cursor.name" :color="cursor.color")
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import CursorLabel from './CursorLabel.vue';
import { useCollaborationCursors } from '~/composables/useCollaborationCursors';

const props = defineProps<{
  page: string;
  userId: number;
  userName: string;
}>();

const { visibleCursors, init, destroy } = useCollaborationCursors();

interface CursorData {
  x: number;
  y: number;
}

function cursorStyle(cursor: CursorData) {
  // Convert percentage-based coordinates back to viewport pixels
  const px = (cursor.x / 100) * window.innerWidth;
  const py = (cursor.y / 100) * window.innerHeight;
  return {
    transform: `translate(${px}px, ${py}px)`
  };
}

onMounted(() => {
  init(props.page, props.userId, props.userName);
});

onUnmounted(() => {
  destroy();
});
</script>

<style scoped>
.cursor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9998;
  overflow: hidden;
}

.remote-cursor {
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.1s ease;
  will-change: transform;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.cursor-fade-enter-active,
.cursor-fade-leave-active {
  transition: opacity 0.3s ease;
}

.cursor-fade-enter-from,
.cursor-fade-leave-to {
  opacity: 0;
}
</style>
