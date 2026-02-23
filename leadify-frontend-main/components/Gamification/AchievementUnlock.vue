<template lang="pug">
Teleport(to="body")
  Transition(name="unlock")
    .achievement-overlay(v-if="visible" @click="dismiss")
      canvas.confetti-canvas(ref="canvasRef")
      .unlock-content(@click.stop)
        .unlock-glow
        .unlock-icon
          Icon(:name="achievement?.icon || 'ph:trophy-bold'" size="48")
        h2.unlock-title Achievement Unlocked!
        h3.unlock-name {{ achievement?.name }}
        p.unlock-desc {{ achievement?.description }}
        .unlock-points +{{ achievement?.pointsValue }} XP
        el-button.mt-4(@click="dismiss" type="primary" round) Awesome!
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps<{
  visible: boolean;
  achievement: { name: string; description: string; icon: string; pointsValue: number } | null;
}>();

const emit = defineEmits(['close']);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animId: number | null = null;

function dismiss() {
  emit('close');
}

function launchConfetti() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[] = [];
  const colors = ['#7849ff', '#a855f7', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899'];

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15 - 5,
      color: colors[Math.floor(Math.random() * colors.length)] || '',
      size: Math.random() * 8 + 3,
      life: 1
    });
  }

  function animate() {
    ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
    let alive = false;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= 0.008;
      if (p.life <= 0) continue;
      alive = true;

      ctx!.save();
      ctx!.globalAlpha = p.life;
      ctx!.fillStyle = p.color;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    if (alive) animId = requestAnimationFrame(animate);
  }

  animate();
}

watch(() => props.visible, (val) => {
  if (val) {
    setTimeout(launchConfetti, 100);
    setTimeout(dismiss, 5000);
  }
});

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId);
});
</script>

<style lang="scss" scoped>
.achievement-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.confetti-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.unlock-content {
  position: relative;
  text-align: center;
  padding: 40px;
  border-radius: 24px;
  background: rgba(15, 15, 30, 0.95);
  border: 1px solid rgba(120, 73, 255, 0.3);
  max-width: 380px;
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.unlock-glow {
  position: absolute;
  inset: -2px;
  border-radius: 26px;
  background: linear-gradient(135deg, var(--accent-color, #7849ff), var(--gradient-end, #a855f7));
  opacity: 0.15;
  filter: blur(20px);
  z-index: -1;
}

.unlock-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-color, #7849ff), var(--gradient-end, #a855f7));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: iconPulse 2s infinite;
}

.unlock-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--accent-color, #7849ff);
  margin-bottom: 8px;
}

.unlock-name {
  font-size: 24px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
}

.unlock-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
}

.unlock-points {
  font-size: 20px;
  font-weight: 800;
  color: #fbbf24;
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes iconPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(120, 73, 255, 0.3); }
  50% { box-shadow: 0 0 40px rgba(120, 73, 255, 0.6); }
}

.unlock-enter-active { animation: popIn 0.5s ease; }
.unlock-leave-active { animation: popIn 0.3s ease reverse; }
</style>
