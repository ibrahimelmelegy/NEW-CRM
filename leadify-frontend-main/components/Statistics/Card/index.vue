<template lang="pug">
.stats-card-container(:class="[`border-${colorType}`, 'group', 'animate-entrance']")
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
  background: var(--bg-card);
  background-image: var(--gradient-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-card);
  padding: 30px;
  position: relative;
  overflow: hidden;
  transition: var(--transition-smooth);
  backdrop-filter: blur(15px);

  &.border-purple { border-top: 5px solid var(--accent-purple); }
  &.border-indigo { border-top: 5px solid var(--accent-indigo); }
  &.border-cyan { border-top: 5px solid var(--accent-cyan); }
  &.border-rose { border-top: 5px solid var(--accent-rose); }
  &.border-emerald { border-top: 5px solid var(--accent-emerald); }
  &.border-amber { border-top: 5px solid var(--accent-amber); }

  &:hover {
    transform: translateY(-8px);
    border-color: var(--border-highlight);
    box-shadow: var(--shadow-premium);
    
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
    &.aurora-purple { background: var(--accent-purple); }
    &.aurora-indigo { background: var(--accent-indigo); }
    &.aurora-cyan { background: var(--accent-cyan); }
    &.aurora-rose { background: var(--accent-rose); }
    &.aurora-emerald { background: var(--accent-emerald); }
    &.aurora-amber { background: var(--accent-amber); }
  }

  .icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-smooth);
    
    .group:hover & {
      transform: rotate(-12deg) scale(1.15);
    }
  }

  .trend-indicator {
      font-size: 13px;
      font-weight: 700;
      background: rgba(255,255,255,0.03);
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid var(--border-glass);
  }

  .bg-gradient-purple { background: var(--gradient-purple); }
  .bg-gradient-indigo { background: var(--gradient-indigo); }
  .bg-gradient-cyan   { background: var(--gradient-ocean); }
  .bg-gradient-rose   { background: var(--gradient-sunset); }
  .bg-gradient-emerald { background: var(--gradient-mint); }
  .bg-gradient-amber { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }

  .shadow-glow-purple { box-shadow: var(--glow-purple); }
  .shadow-glow-indigo { box-shadow: 0 0 25px rgba(99, 102, 241, 0.3); }
  .shadow-glow-cyan   { box-shadow: 0 0 25px rgba(6, 182, 212, 0.3); }
  .shadow-glow-rose   { box-shadow: 0 0 25px rgba(244, 63, 94, 0.3); }
  .shadow-glow-amber  { box-shadow: 0 0 25px rgba(245, 158, 11, 0.3); }
}
</style>
