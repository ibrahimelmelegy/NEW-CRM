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
  border-radius: var(--radius-card);
  padding: 30px;
  position: relative;
  overflow: hidden;
  transition: var(--transition-smooth);
  backdrop-filter: blur(15px);

  // Gradient border stroke (thin line around the card)
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: var(--radius-card);
    padding: 2px; // Border thickness
    background: linear-gradient(135deg, #7C3AED, #EC4899, #F97316, #7C3AED); // Default aurora gradient
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
  }

  // Gradient border colors by type
  &.border-purple::before { 
    background: linear-gradient(135deg, #7C3AED, #EC4899, #F97316, #7C3AED); 
  }
  &.border-indigo::before { 
    background: linear-gradient(135deg, #6366F1, #A855F7, #EC4899, #6366F1); 
  }
  &.border-cyan::before { 
    background: linear-gradient(135deg, #06B6D4, #22D3EE, #06B6D4); 
  }
  &.border-rose::before { 
    background: linear-gradient(135deg, #F43F5E, #F97316, #F43F5E); 
  }
  &.border-emerald::before { 
    background: linear-gradient(135deg, #10B981, #34D399, #10B981); 
  }
  &.border-amber::before { 
    background: linear-gradient(135deg, #F97316, #FBBF24, #F97316); 
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-premium);
    
    &::before {
      padding: 3px; // Thicker border on hover
    }
    
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
