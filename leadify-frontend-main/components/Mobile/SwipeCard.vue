<template lang="pug">
.swipe-card-wrapper(ref="cardRef")
  //- Left actions (revealed on swipe right)
  .swipe-actions.swipe-actions--left(v-if="rightActions.length")
    button.swipe-action-btn(
      v-for="action in rightActions"
      :key="action.name"
      :style="{ background: action.color || '#10B981' }"
      @click="onAction(action.name)"
    )
      Icon(:name="action.icon" size="20" class="text-white")
      span.action-label {{ action.label }}

  //- Main card content
  .swipe-card-content(
    ref="contentRef"
    :style="contentStyle"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
  )
    slot

  //- Right actions (revealed on swipe left)
  .swipe-actions.swipe-actions--right(v-if="leftActions.length")
    button.swipe-action-btn(
      v-for="action in leftActions"
      :key="action.name"
      :style="{ background: action.color || '#EF4444' }"
      @click="onAction(action.name)"
    )
      Icon(:name="action.icon" size="20" class="text-white")
      span.action-label {{ action.label }}
</template>

<script setup lang="ts">
interface SwipeAction {
  name: string;
  label: string;
  icon: string;
  color?: string;
}

const props = withDefaults(defineProps<{
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
}>(), {
  leftActions: () => [],
  rightActions: () => [],
  threshold: 80,
});

const emit = defineEmits<{
  action: [name: string];
}>();

const cardRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

const translateX = ref(0);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const currentX = ref(0);
const isHorizontalSwipe = ref<boolean | null>(null);

const ACTION_WIDTH = 80;
const maxLeftSwipe = computed(() => props.leftActions.length * ACTION_WIDTH);
const maxRightSwipe = computed(() => props.rightActions.length * ACTION_WIDTH);

const contentStyle = computed(() => ({
  transform: `translateX(${translateX.value}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
}));

function onTouchStart(e: TouchEvent) {
  const touch = e.touches[0];
  if (!touch) return;
  startX.value = touch.clientX;
  startY.value = touch.clientY;
  currentX.value = translateX.value;
  isDragging.value = true;
  isHorizontalSwipe.value = null;
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return;

  const touch = e.touches[0];
  if (!touch) return;
  const diffX = touch.clientX - startX.value;
  const diffY = touch.clientY - startY.value;

  // Determine swipe direction on first significant move
  if (isHorizontalSwipe.value === null) {
    if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
      isHorizontalSwipe.value = Math.abs(diffX) > Math.abs(diffY);
    }
    return;
  }

  if (!isHorizontalSwipe.value) return;

  let newX = currentX.value + diffX;

  // Clamp with rubber-band effect
  if (newX > 0) {
    // Swiping right - reveal right actions (call, email)
    if (props.rightActions.length === 0) {
      newX = newX * 0.2; // rubber band
    } else {
      const max = maxRightSwipe.value;
      if (newX > max) {
        newX = max + (newX - max) * 0.2;
      }
    }
  } else {
    // Swiping left - reveal left actions (delete, archive)
    if (props.leftActions.length === 0) {
      newX = newX * 0.2; // rubber band
    } else {
      const max = -maxLeftSwipe.value;
      if (newX < max) {
        newX = max + (newX - max) * 0.2;
      }
    }
  }

  translateX.value = newX;
}

function onTouchEnd() {
  isDragging.value = false;
  isHorizontalSwipe.value = null;
  snapToPosition();
}

// Mouse support for development/testing
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let mouseUpHandler: (() => void) | null = null;

function onMouseDown(e: MouseEvent) {
  startX.value = e.clientX;
  startY.value = e.clientY;
  currentX.value = translateX.value;
  isDragging.value = true;
  isHorizontalSwipe.value = null;

  mouseMoveHandler = (ev: MouseEvent) => {
    if (!isDragging.value) return;

    const diffX = ev.clientX - startX.value;
    const diffY = ev.clientY - startY.value;

    if (isHorizontalSwipe.value === null) {
      if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
        isHorizontalSwipe.value = Math.abs(diffX) > Math.abs(diffY);
      }
      return;
    }

    if (!isHorizontalSwipe.value) return;

    let newX = currentX.value + diffX;

    if (newX > 0) {
      if (props.rightActions.length === 0) {
        newX = newX * 0.2;
      } else {
        const max = maxRightSwipe.value;
        if (newX > max) {
          newX = max + (newX - max) * 0.2;
        }
      }
    } else {
      if (props.leftActions.length === 0) {
        newX = newX * 0.2;
      } else {
        const max = -maxLeftSwipe.value;
        if (newX < max) {
          newX = max + (newX - max) * 0.2;
        }
      }
    }

    translateX.value = newX;
  };

  mouseUpHandler = () => {
    isDragging.value = false;
    isHorizontalSwipe.value = null;
    snapToPosition();
    if (mouseMoveHandler) document.removeEventListener('mousemove', mouseMoveHandler);
    if (mouseUpHandler) document.removeEventListener('mouseup', mouseUpHandler);
  };

  document.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);
}

function snapToPosition() {
  const x = translateX.value;

  if (x > 0) {
    // Swiped right
    if (x >= props.threshold && props.rightActions.length > 0) {
      translateX.value = maxRightSwipe.value;
    } else {
      translateX.value = 0;
    }
  } else if (x < 0) {
    // Swiped left
    if (Math.abs(x) >= props.threshold && props.leftActions.length > 0) {
      translateX.value = -maxLeftSwipe.value;
    } else {
      translateX.value = 0;
    }
  }
}

function onAction(name: string) {
  emit('action', name);
  // Reset position after action
  translateX.value = 0;
}

// Reset when clicking outside
function onOutsideClick(e: MouseEvent) {
  if (translateX.value !== 0 && cardRef.value && !cardRef.value.contains(e.target as Node)) {
    translateX.value = 0;
  }
}

onMounted(() => document.addEventListener('click', onOutsideClick));
onUnmounted(() => {
  document.removeEventListener('click', onOutsideClick);
  if (mouseMoveHandler) document.removeEventListener('mousemove', mouseMoveHandler);
  if (mouseUpHandler) document.removeEventListener('mouseup', mouseUpHandler);
});
</script>

<style lang="scss" scoped>
.swipe-card-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg, 14px);
}

.swipe-card-content {
  position: relative;
  z-index: 2;
  background: var(--bg-card);
  border-radius: var(--radius-lg, 14px);
  user-select: none;
  touch-action: pan-y;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.swipe-actions {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  z-index: 1;

  &--left {
    left: 0;
  }

  &--right {
    right: 0;
  }
}

.swipe-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 80px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.8;
  }
}

.action-label {
  font-size: 10px;
  color: white;
  font-weight: 500;
}
</style>
