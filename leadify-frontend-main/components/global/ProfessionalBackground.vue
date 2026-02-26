<template>
  <div class="professional-background" :class="{ 'light-theme': themeStore.isLight }">
    <!-- Dark Mode: Mesh Gradient + Glows -->
    <template v-if="!themeStore.isLight">
      <div class="mesh-gradient"></div>
      <div class="ambient-glows">
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
      </div>
    </template>
    
    <!-- Light Mode: Clean solid background -->
    <template v-else>
      <div class="light-pattern"></div>
    </template>
    
    <!-- Subtle noise texture for both modes -->
    <div class="noise-overlay"></div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '~/stores/theme';
const themeStore = useThemeStore();
</script>

<style lang="scss" scoped>
.professional-background {
  position: fixed;
  z-index: -1;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background-color: #0a0a0f;
  transition: background-color 0.3s ease;
  
  // ========== DARK MODE (Default) ==========
  .mesh-gradient {
    position: absolute;
    inset: 0;
    opacity: 0.8;
    background:
      radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%),
      radial-gradient(at 50% 0%, hsla(255,100%,64%,0.15) 0, transparent 50%),
      radial-gradient(at 100% 0%, hsla(29,100%,50%,0.1) 0, transparent 50%),
      radial-gradient(at 0% 100%, hsla(255,100%,64%,0.1) 0, transparent 50%),
      radial-gradient(at 100% 100%, hsla(29,100%,50%,0.15) 0, transparent 50%);
    filter: blur(40px);
  }

  .ambient-glows {
    position: absolute;
    inset: 0;
    
    .glow {
      position: absolute;
      border-radius: 50%;
      animation: pulse 8s ease-in-out infinite;
    }
    
    .glow-1 {
      top: -10%;
      left: -5%;
      width: 50%;
      height: 50%;
      background: rgba(120, 73, 255, 0.25);
      filter: blur(100px);
    }
    
    .glow-2 {
      bottom: -10%;
      right: -5%;
      width: 50%;
      height: 50%;
      background: rgba(255, 123, 0, 0.15);
      filter: blur(120px);
      animation-delay: 3s;
    }
  }
  
  // ========== LIGHT MODE ==========
  &.light-theme {
    background-color: #f8f9fa;
    
    .light-pattern {
      position: absolute;
      inset: 0;
      // Subtle gradient - NO BLUR
      background: 
        linear-gradient(135deg, rgba(124, 58, 237, 0.03) 0%, transparent 50%),
        linear-gradient(225deg, rgba(249, 115, 22, 0.02) 0%, transparent 50%);
    }
  }

  // Noise texture (very subtle)
  .noise-overlay {
    position: absolute;
    inset: 0;
    opacity: 0.015;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.4;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.05);
    }
  }
}
</style>
