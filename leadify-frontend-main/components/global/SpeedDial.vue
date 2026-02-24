<template lang="pug">
.speed-dial-container(v-if="actions.length")
  //- Action buttons (expand upward)
  Transition(name="speed-dial")
    .speed-dial-actions(v-show="isOpen")
      TransitionGroup(name="speed-action" tag="div")
        button.speed-action-btn(
          v-for="(action, index) in actions"
          :key="action.label"
          :style="{ '--delay': index * 50 + 'ms', '--action-color': action.color || 'var(--accent-color)' }"
          @click="executeAction(action)"
          :title="action.label"
        )
          .action-icon
            Icon(:name="action.icon" size="20")
          span.action-label {{ action.label }}

  //- Main FAB button
  button.speed-dial-fab(
    @click="toggle"
    :class="{ 'is-open': isOpen }"
  )
    Icon.fab-icon(name="ph:plus-bold" size="24")
</template>

<script setup lang="ts">
const { actions, isOpen, toggle, executeAction } = useSpeedDial();
</script>

<style lang="scss" scoped>
.speed-dial-container {
  position: fixed;
  bottom: 110px;
  right: 24px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.speed-dial-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-color, #7849ff);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(120, 73, 255, 0.4);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 30px rgba(120, 73, 255, 0.6);
  }

  &.is-open {
    transform: rotate(45deg);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .fab-icon {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.speed-dial-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.speed-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 12px;
  background: var(--glass-bg-primary, rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.1));
  border-radius: 28px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: speedActionIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--delay, 0ms);
  opacity: 0;
  transform: translateY(10px) scale(0.9);

  .action-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--action-color);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .action-label {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }

  &:hover {
    transform: translateX(-4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
}

@keyframes speedActionIn {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// Transition for the actions panel
.speed-dial-enter-active,
.speed-dial-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.speed-dial-enter-from,
.speed-dial-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

// Transition for individual action buttons
.speed-action-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.speed-action-leave-active {
  transition: all 0.2s ease;
}

.speed-action-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.8);
}

.speed-action-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.8);
}
</style>
