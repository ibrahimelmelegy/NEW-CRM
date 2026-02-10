<template lang="pug">
.stats-card-container.glass-card.interactive(:class="[`border-${colorType}`, 'group', 'animate-entrance']")
  //- Aurora Background Effect
  .aurora-blur(:class="[`aurora-${colorType}`]")
  
  .flex.items-center.justify-between.mb-6.relative.z-10
    .icon-wrapper(:class="[`bg-gradient-${colorType}`, `shadow-glow-${colorType}`]")
      Icon(:name="icon" size="26" class="text-white")
    .trend-indicator(v-if="rate")
       span(:class="rate > 0 ? 'text-emerald-500' : 'text-rose-500'") 
          | {{ rate > 0 ? '↑' : '↓' }} {{ Math.abs(rate) }}%
  
  .content-wrapper.relative.z-10
    p.text-xs.font-bold.text-muted.uppercase.tracking-widest.mb-2 {{ name || '---' }}
    p.text-4xl.font-black.text-primary.tracking-tighter.tabular-nums {{ data || '0' }}
</template>

<script lang="ts" setup>
const props = defineProps({
  name: String,
  data: [Number, String],
  rate: Number,
  icon: {
    type: String,
    default: 'ph:chart-line-up-bold'
  },
  colorType: {
    type: String,
    default: 'purple'
  }
});
</script>

<style lang="scss" scoped>
.stats-card-container {
  padding: 30px;
  position: relative;
  overflow: hidden;

  // Gradient border stroke (use ::after to avoid mica-material ::before conflict)
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.5px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
    transition: var(--transition-smooth);

    html.light-mode & {
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.02));
    }
  }

  // Gradient border colors by type on hover/active
  &.border-purple:hover::after {
    background: linear-gradient(135deg, #0078D4, #ec4899);
  }
  &.border-indigo:hover::after {
    background: linear-gradient(135deg, #6366f1, #0078D4);
  }
  &.border-cyan:hover::after {
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
  }
  &.border-rose:hover::after {
    background: linear-gradient(135deg, #f43f5e, #F7630C);
  }
  &.border-emerald:hover::after {
    background: linear-gradient(135deg, #10b981, #34d399);
  }
  &.border-amber:hover::after {
    background: linear-gradient(135deg, #F7630C, #fbbf24);
  }

  &:hover {
    .aurora-blur {
      opacity: 0.15;
      transform: scale(1.2) translateY(-20%);
    }
  }

  .aurora-blur {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    filter: blur(60px);
    opacity: 0;
    transition: all 0.8s ease;
    pointer-events: none;
    &.aurora-purple {
      background: var(--accent-purple);
    }
    &.aurora-indigo {
      background: var(--accent-indigo);
    }
    &.aurora-cyan {
      background: var(--accent-cyan);
    }
    &.aurora-rose {
      background: var(--accent-rose);
    }
    &.aurora-emerald {
      background: var(--accent-emerald);
    }
    &.aurora-amber {
      background: var(--accent-amber);
    }
  }

  .icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-smooth);

    .group:hover & {
      transform: rotate(-8deg) scale(1.1);
    }
  }

  .trend-indicator {
    font-size: 13px;
    font-weight: 700;
    background: var(--color-surface-hover);
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid var(--color-border-default);
  }

  .bg-gradient-purple {
    background: var(--gradient-purple);
  }
  .bg-gradient-indigo {
    background: var(--gradient-indigo);
  }
  .bg-gradient-cyan {
    background: var(--gradient-ocean);
  }
  .bg-gradient-rose {
    background: var(--gradient-sunset);
  }
  .bg-gradient-emerald {
    background: var(--gradient-mint);
  }
  .bg-gradient-amber {
    background: linear-gradient(135deg, #F7630C 0%, #d97706 100%);
  }

  .shadow-glow-purple {
    box-shadow: var(--glow-purple);
  }
  .shadow-glow-indigo {
    box-shadow: 0 0 25px rgba(99, 102, 241, 0.3);
  }
  .shadow-glow-cyan {
    box-shadow: 0 0 25px rgba(6, 182, 212, 0.3);
  }
  .shadow-glow-rose {
    box-shadow: 0 0 25px rgba(244, 63, 94, 0.3);
  }
  .shadow-glow-amber {
    box-shadow: 0 0 25px rgba(246, 99, 12, 0.3);
  }
}
</style>
