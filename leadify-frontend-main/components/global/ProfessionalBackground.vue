<template>
  <div class="professional-background absolute inset-0 z-0 overflow-hidden isolate" :style="{ backgroundColor: themeStore.isLight ? '#f8f7fa' : '#0b0a12' }">
    <!-- Mesh Gradient Layer -->
    <div class="mesh-gradient absolute inset-0 opacity-80"></div>

    <!-- SVG Noise Texture -->
    <div class="noise-overlay absolute inset-0 opacity-[0.03] pointer-events-none"></div>

    <!-- Dynamic Ambient Glows -->
    <div class="ambient-glows absolute inset-0">
      <div class="glow glow-1 absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-[#7849ff]/30 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div
        class="glow glow-2 absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-[#ff7b00]/20 rounded-full blur-[150px] animate-pulse-slow"
        style="animation-delay: 3s"
      ></div>
    </div>
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
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-primary, #0b0a12);
  transition: background-color 0.5s ease;

  .mesh-gradient {
    background:
      radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%),
      radial-gradient(at 50% 0%, hsla(255,100%,64%,0.15) 0, transparent 50%),
      radial-gradient(at 100% 0%, hsla(29,100%,50%,0.1) 0, transparent 50%),
      radial-gradient(at 0% 100%, hsla(255,100%,64%,0.1) 0, transparent 50%),
      radial-gradient(at 50% 100%, hsla(253,16%,7%,1) 0, transparent 50%),
      radial-gradient(at 100% 100%, hsla(29,100%,50%,0.15) 0, transparent 50%);
    filter: blur(40px);
    transition: all 0.5s ease;
  }

  :global(html.light-mode) & {
    .mesh-gradient {
      opacity: 0.15;
      background:
        radial-gradient(at 0% 0%, hsla(255,100%,64%,0.3) 0, transparent 50%),
        radial-gradient(at 100% 100%, hsla(29,100%,50%,0.2) 0, transparent 50%);
    }
  }

  .noise-overlay {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  .animate-pulse-slow {
    animation: pulse 8s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.5;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.1);
    }
  }
}
</style>
