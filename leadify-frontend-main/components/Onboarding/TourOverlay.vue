<template lang="pug">
Teleport(to="body")
  //- Backdrop with spotlight cutout
  Transition(name="tour-backdrop")
    .tour-backdrop(v-if="isActive" @click="skipTour")
      .tour-spotlight(ref="spotlightRef" :style="spotlightStyle")

  //- Tooltip
  Transition(name="tour-tooltip")
    .tour-tooltip(v-if="isActive && currentStep" :style="tooltipStyle" ref="tooltipRef")
      //- Progress bar
      .tour-progress
        .tour-progress-bar(:style="{ width: progress + '%' }")

      //- Content
      .tour-content
        .flex.items-center.gap-2.mb-2
          Icon.text-purple-400(name="ph:compass-bold" size="20")
          h4.tour-title {{ currentStep.title }}
        p.tour-description {{ currentStep.description }}

      //- Footer
      .tour-footer
        .flex.items-center.gap-2
          span.tour-counter Step {{ currentStepIndex + 1 }} of {{ totalSteps }}
        .flex.items-center.gap-2
          button.tour-btn-skip(@click="skipTour") Skip
          button.tour-btn-prev(v-if="currentStepIndex > 0" @click="prevStep")
            Icon(name="ph:arrow-left-bold" size="14")
          button.tour-btn-next(@click="handleNext")
            | {{ isLastStep ? 'Finish' : 'Next' }}
            Icon.ml-1(v-if="!isLastStep" name="ph:arrow-right-bold" size="14")
</template>

<script setup lang="ts">
import { useOnboarding } from '~/composables/useOnboarding';
import type { TourStep } from '~/composables/useOnboarding';

const {
  isActive,
  currentStep,
  currentStepIndex,
  progress,
  totalSteps,
  isLastStep,
  nextStep,
  prevStep,
  skipTour,
} = useOnboarding();

const spotlightRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);

// Target element rect, recalculated on each step
const targetRect = ref<DOMRect | null>(null);

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_GAP = 16;
const TOOLTIP_WIDTH = 340;

// Spotlight style computed from target rect
const spotlightStyle = computed(() => {
  if (!targetRect.value) {
    return {
      top: '50%',
      left: '50%',
      width: '0px',
      height: '0px',
      opacity: '0',
    };
  }

  const r = targetRect.value;
  return {
    top: `${r.top - SPOTLIGHT_PADDING}px`,
    left: `${r.left - SPOTLIGHT_PADDING}px`,
    width: `${r.width + SPOTLIGHT_PADDING * 2}px`,
    height: `${r.height + SPOTLIGHT_PADDING * 2}px`,
    opacity: '1',
  };
});

// Tooltip positioning
const tooltipStyle = computed(() => {
  if (!targetRect.value || !currentStep.value) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  const r = targetRect.value;
  const pos = currentStep.value.position;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;

  switch (pos) {
    case 'bottom':
      top = r.bottom + TOOLTIP_GAP;
      left = r.left + r.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'top':
      // Estimate tooltip height; we will push down if it goes off-screen
      top = r.top - TOOLTIP_GAP - 180;
      left = r.left + r.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'left':
      top = r.top + r.height / 2 - 90;
      left = r.left - TOOLTIP_GAP - TOOLTIP_WIDTH;
      break;
    case 'right':
      top = r.top + r.height / 2 - 90;
      left = r.right + TOOLTIP_GAP;
      break;
  }

  // Clamp within viewport
  if (left < 12) left = 12;
  if (left + TOOLTIP_WIDTH > vw - 12) left = vw - TOOLTIP_WIDTH - 12;
  if (top < 12) top = 12;
  if (top > vh - 220) top = vh - 220;

  return {
    top: `${top}px`,
    left: `${left}px`,
  };
});

function findTargetElement(step: TourStep): HTMLElement | null {
  try {
    return document.querySelector<HTMLElement>(step.target);
  } catch {
    return null;
  }
}

function updateTargetRect() {
  if (!currentStep.value) {
    targetRect.value = null;
    return;
  }

  const el = findTargetElement(currentStep.value);
  if (el) {
    targetRect.value = el.getBoundingClientRect();
  } else {
    // If element not found, center spotlight (fallback)
    targetRect.value = new DOMRect(
      window.innerWidth / 2 - 150,
      window.innerHeight / 2 - 50,
      300,
      100
    );
  }
}

function handleNext() {
  nextStep();
}

// Keyboard navigation
function handleKeydown(e: KeyboardEvent) {
  if (!isActive.value) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    skipTour();
  } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
    e.preventDefault();
    nextStep();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevStep();
  }
}

// Recalculate position whenever the step changes
watch(
  [currentStep, isActive],
  () => {
    if (isActive.value && currentStep.value) {
      // Allow DOM to update (especially after route change)
      nextTick(() => {
        // Retry a few times in case the element isn't rendered yet
        updateTargetRect();
        setTimeout(updateTargetRect, 100);
        setTimeout(updateTargetRect, 300);
      });
    } else {
      targetRect.value = null;
    }
  },
  { immediate: true }
);

// Recalculate on scroll/resize
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  window.addEventListener('keydown', handleKeydown, true);
  window.addEventListener('resize', updateTargetRect);
  window.addEventListener('scroll', updateTargetRect, true);

  // Watch for layout changes
  resizeObserver = new ResizeObserver(() => {
    if (isActive.value) updateTargetRect();
  });
  resizeObserver.observe(document.body);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown, true);
  window.removeEventListener('resize', updateTargetRect);
  window.removeEventListener('scroll', updateTargetRect, true);
  resizeObserver?.disconnect();
});
</script>

<style lang="scss" scoped>
.tour-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: all;
}

.tour-spotlight {
  position: absolute;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 16px;
    border: 2px solid var(--accent-color, #7849ff);
    animation: spotlightPulse 2s ease-in-out infinite;
  }
}

@keyframes spotlightPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.tour-tooltip {
  position: fixed;
  z-index: 9999;
  width: 340px;
  background: rgba(20, 20, 40, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(120, 73, 255, 0.3);
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(120, 73, 255, 0.1);
  transition: top 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: all;
}

.tour-progress {
  height: 3px;
  background: rgba(255, 255, 255, 0.05);
}

.tour-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color, #7849ff), #a855f7);
  transition: width 0.4s ease;
}

.tour-content {
  padding: 20px 20px 12px;
}

.tour-title {
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.tour-description {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  margin: 0;
}

.tour-footer {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.tour-counter {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.tour-btn-next {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 20px;
  background: var(--accent-color, #7849ff);
  color: white;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.2);
  }
}

.tour-btn-prev {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.tour-btn-skip {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s ease;

  &:hover {
    color: white;
  }
}

// Backdrop transition
.tour-backdrop-enter-active,
.tour-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.tour-backdrop-enter-from,
.tour-backdrop-leave-to {
  opacity: 0;
}

// Tooltip transition
.tour-tooltip-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.tour-tooltip-leave-active {
  transition: all 0.2s ease;
}

.tour-tooltip-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.tour-tooltip-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
