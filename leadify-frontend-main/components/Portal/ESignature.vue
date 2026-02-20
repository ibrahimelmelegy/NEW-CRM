<template lang="pug">
.e-signature-container
  .glass-card.p-6
    .flex.items-center.justify-between.mb-6
      div
        h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('portal.esignature.title') }}
        p.text-sm(style="color: var(--text-muted)") {{ documentName }}
      .flex.items-center.gap-2
        el-radio-group(v-model="mode" size="small")
          el-radio-button(value="draw") {{ $t('portal.esignature.draw') }}
          el-radio-button(value="type") {{ $t('portal.esignature.type') }}

    //- Draw Mode
    .signature-draw-area(v-if="mode === 'draw'")
      .flex.items-center.justify-between.mb-3
        .flex.items-center.gap-2
          span.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.esignature.penColor') }}
          button.color-swatch(
            :class="{ active: penColor === '#000000' }"
            style="background: #000000"
            @click="penColor = '#000000'"
          )
          button.color-swatch(
            :class="{ active: penColor === '#1a3b7a' }"
            style="background: #1a3b7a"
            @click="penColor = '#1a3b7a'"
          )
        .flex.items-center.gap-2
          el-button(size="small" @click="clearCanvas" :icon="Delete")
            | {{ $t('portal.esignature.clear') }}
      .canvas-wrapper
        canvas(
          ref="canvasRef"
          :width="canvasWidth"
          :height="canvasHeight"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @touchstart.prevent="startDrawingTouch"
          @touchmove.prevent="drawTouch"
          @touchend.prevent="stopDrawing"
        )
      p.text-xs.mt-2.text-center(style="color: var(--text-muted)") {{ $t('portal.esignature.drawHint') }}

    //- Type Mode
    .signature-type-area(v-else)
      el-input(
        v-model="typedName"
        :placeholder="$t('portal.esignature.typePlaceholder')"
        size="large"
        clearable
      )
      .signature-type-preview.mt-4(v-if="typedName")
        .preview-label.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('portal.esignature.preview') }}
        .typed-signature-display {{ typedName }}

    //- Signature Preview (for draw mode)
    .signature-preview.mt-4(v-if="mode === 'draw' && hasDrawn")
      .preview-label.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('portal.esignature.preview') }}
      .preview-image
        img(:src="previewDataUrl" alt="Signature preview")

    //- Legal Agreement
    .legal-agreement.mt-6
      el-checkbox(v-model="agreed")
        span.text-sm(style="color: var(--text-secondary)") {{ $t('portal.esignature.agreement') }}

    //- Actions
    .flex.items-center.justify-end.gap-3.mt-6
      el-button(size="large" @click="$emit('cancel')") {{ $t('common.cancel') }}
      el-button(
        type="primary"
        size="large"
        :disabled="!canSubmit"
        :loading="submitting"
        @click="handleSign"
      )
        Icon(name="ph:pen-nib-bold" size="16" aria-label="Sign")
        span.ml-2 {{ $t('portal.esignature.signAndSubmit') }}
</template>

<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue';

const props = defineProps<{
  documentId: string;
  documentName: string;
}>();

const emit = defineEmits<{
  (e: 'signed', data: { signatureData: string; signatureType: 'DRAWN' | 'TYPED'; typedName?: string }): void;
  (e: 'cancel'): void;
}>();

const mode = ref<'draw' | 'type'>('draw');
const penColor = ref('#000000');
const typedName = ref('');
const agreed = ref(false);
const submitting = ref(false);
const hasDrawn = ref(false);
const previewDataUrl = ref('');

// Canvas refs and state
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const canvasWidth = 560;
const canvasHeight = 200;

let ctx: CanvasRenderingContext2D | null = null;

const canSubmit = computed(() => {
  if (!agreed.value) return false;
  if (mode.value === 'draw') return hasDrawn.value;
  if (mode.value === 'type') return typedName.value.trim().length >= 2;
  return false;
});

onMounted(() => {
  nextTick(() => {
    initCanvas();
  });
});

watch(mode, () => {
  if (mode.value === 'draw') {
    nextTick(() => initCanvas());
  }
});

watch(penColor, () => {
  if (ctx) {
    ctx.strokeStyle = penColor.value;
  }
});

function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.strokeStyle = penColor.value;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw signature line
  ctx.beginPath();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.moveTo(40, canvasHeight - 40);
  ctx.lineTo(canvasWidth - 40, canvasHeight - 40);
  ctx.stroke();

  // Reset drawing style
  ctx.strokeStyle = penColor.value;
  ctx.lineWidth = 2.5;
  hasDrawn.value = false;
  previewDataUrl.value = '';
}

function getCanvasCoords(e: MouseEvent) {
  const canvas = canvasRef.value!;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function getTouchCoords(e: TouchEvent) {
  const canvas = canvasRef.value!;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const touch = e.touches[0];
  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY
  };
}

function startDrawing(e: MouseEvent) {
  if (!ctx) return;
  isDrawing.value = true;
  const { x, y } = getCanvasCoords(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function draw(e: MouseEvent) {
  if (!isDrawing.value || !ctx) return;
  const { x, y } = getCanvasCoords(e);
  ctx.lineTo(x, y);
  ctx.stroke();
  hasDrawn.value = true;
}

function stopDrawing() {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  if (ctx) {
    ctx.closePath();
  }
  updatePreview();
}

function startDrawingTouch(e: TouchEvent) {
  if (!ctx) return;
  isDrawing.value = true;
  const { x, y } = getTouchCoords(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function drawTouch(e: TouchEvent) {
  if (!isDrawing.value || !ctx) return;
  const { x, y } = getTouchCoords(e);
  ctx.lineTo(x, y);
  ctx.stroke();
  hasDrawn.value = true;
}

function clearCanvas() {
  initCanvas();
}

function updatePreview() {
  if (!canvasRef.value) return;
  previewDataUrl.value = canvasRef.value.toDataURL('image/png');
}

function getSignatureData(): string {
  if (mode.value === 'draw' && canvasRef.value) {
    return canvasRef.value.toDataURL('image/png');
  }
  if (mode.value === 'type') {
    // Generate a canvas image from typed text
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 120;
    const tempCtx = canvas.getContext('2d')!;
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, 560, 120);
    tempCtx.font = 'italic 48px "Georgia", "Times New Roman", serif';
    tempCtx.fillStyle = '#1a3b7a';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(typedName.value, 280, 60);
    return canvas.toDataURL('image/png');
  }
  return '';
}

async function handleSign() {
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    const signatureData = getSignatureData();
    emit('signed', {
      signatureData,
      signatureType: mode.value === 'draw' ? 'DRAWN' : 'TYPED',
      typedName: mode.value === 'type' ? typedName.value : undefined
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.e-signature-container {
  max-width: 640px;
}

.canvas-wrapper {
  border: 2px dashed var(--border-default);
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  cursor: crosshair;
}

.canvas-wrapper canvas {
  display: block;
  width: 100%;
  height: auto;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-swatch.active {
  border-color: #7849ff;
  box-shadow: 0 0 0 2px rgba(120, 73, 255, 0.3);
}

.color-swatch:hover {
  transform: scale(1.1);
}

.signature-type-preview {
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 24px;
  background: #ffffff;
  text-align: center;
}

.typed-signature-display {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-style: italic;
  font-size: 40px;
  color: #1a3b7a;
  padding: 16px;
  user-select: none;
}

.preview-image {
  border: 1px solid var(--border-default);
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  padding: 8px;
}

.preview-image img {
  max-width: 280px;
  height: auto;
  display: block;
  margin: 0 auto;
}

.legal-agreement {
  padding: 16px;
  border-radius: 8px;
  background: var(--bg-input);
}
</style>
