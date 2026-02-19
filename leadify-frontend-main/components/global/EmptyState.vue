<template lang="pug">
.empty-state
  .empty-state-illustration
    .empty-state-circle
      .empty-state-circle-inner
        Icon(:name="icon" size="36")

    //- Decorative floating dots
    .empty-state-dot.dot-1
    .empty-state-dot.dot-2
    .empty-state-dot.dot-3

  h3.empty-state-title {{ title }}
  p.empty-state-description(v-if="description") {{ description }}

  .empty-state-action(v-if="actionLabel")
    NuxtLink(v-if="actionRoute" :to="actionRoute")
      button.empty-state-btn
        span {{ actionLabel }}
    button.empty-state-btn(v-else @click="$emit('action')")
      span {{ actionLabel }}
</template>

<script setup lang="ts">
interface Props {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionRoute?: string;
}

withDefaults(defineProps<Props>(), {
  icon: 'ph:folder-open',
  description: undefined,
  actionLabel: undefined,
  actionRoute: undefined
});

defineEmits<{
  action: [];
}>();
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  animation: fadeInUp 0.5s ease;
}

.empty-state-illustration {
  position: relative;
  margin-bottom: 28px;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.08) 0%,
    rgba(249, 115, 22, 0.04) 100%
  );
  border: 1px solid rgba(124, 58, 237, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: float 4s ease-in-out infinite;
}

.empty-state-circle-inner {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.12) 0%,
    rgba(249, 115, 22, 0.06) 100%
  );
  border: 1px solid rgba(124, 58, 237, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-purple, #a78bfa);
}

// Decorative floating dots
.empty-state-dot {
  position: absolute;
  border-radius: 50%;
  background: var(--accent-purple, #a78bfa);
  opacity: 0.3;
  animation: floatDot 3s ease-in-out infinite;

  &.dot-1 {
    width: 6px;
    height: 6px;
    top: 8px;
    right: 12px;
    animation-delay: 0s;
  }

  &.dot-2 {
    width: 4px;
    height: 4px;
    bottom: 16px;
    left: 8px;
    animation-delay: 0.8s;
  }

  &.dot-3 {
    width: 5px;
    height: 5px;
    top: 50%;
    left: 2px;
    animation-delay: 1.6s;
  }
}

.empty-state-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #ffffff);
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.empty-state-description {
  font-size: 0.875rem;
  color: var(--text-muted, #71717a);
  margin: 0 0 24px;
  max-width: 360px;
  line-height: 1.6;
}

.empty-state-action {
  a {
    text-decoration: none;
  }
}

.empty-state-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--gradient-primary, linear-gradient(135deg, #7c3aed, #a855f7));
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.25);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(124, 58, 237, 0.35);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes floatDot {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-4px);
    opacity: 0.6;
  }
}

// Light mode
html.light-mode .empty-state-circle {
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.06) 0%,
    rgba(249, 115, 22, 0.03) 100%
  );
  border-color: rgba(124, 58, 237, 0.1);
}

html.light-mode .empty-state-circle-inner {
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.08) 0%,
    rgba(249, 115, 22, 0.04) 100%
  );
  border-color: rgba(124, 58, 237, 0.12);
  color: var(--accent-purple, #7c3aed);
}

html.light-mode .empty-state-dot {
  background: var(--accent-purple, #7c3aed);
  opacity: 0.2;
}

html.light-mode .empty-state-title {
  color: var(--text-primary, #18181b);
}

html.light-mode .empty-state-description {
  color: var(--text-muted, #71717a);
}

// Responsive
@media (max-width: 640px) {
  .empty-state {
    padding: 32px 16px;
  }

  .empty-state-title {
    font-size: 1rem;
  }

  .empty-state-description {
    font-size: 0.8125rem;
    max-width: 280px;
  }
}
</style>
