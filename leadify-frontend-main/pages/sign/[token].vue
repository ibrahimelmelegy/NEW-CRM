<template lang="pug">
.min-h-screen.flex.items-center.justify-center.p-8(style="background: var(--bg-primary)")
  .w-full.max-w-2xl
    //- Loading
    .glass-card.p-8.text-center(v-if="loading")
      el-skeleton(:rows="5" animated)

    //- Error
    .glass-card.p-8.text-center(v-else-if="error")
      Icon(name="ph:warning-circle" size="64" class="text-red-400" aria-hidden="true")
      h2.text-xl.font-bold.mt-4(style="color: var(--text-primary)") {{ error }}

    //- Already Signed
    .glass-card.p-8.text-center(v-else-if="signed")
      Icon(name="ph:check-circle" size="64" class="text-green-400" aria-hidden="true")
      h2.text-xl.font-bold.mt-4(style="color: var(--text-primary)") Contract Signed Successfully
      p.mt-2(style="color: var(--text-muted)") Thank you for signing. You may close this page.

    //- Contract View + Sign
    template(v-else-if="contract")
      .glass-card.p-8.mb-6
        .flex.justify-between.items-start.mb-6
          div
            h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ contract.title }}
            p.text-sm.mt-1(style="color: var(--text-muted)") Please review the contract below and sign at the bottom
          el-tag(:type="contract.status === 'VIEWED' ? '' : 'warning'" size="small" effect="dark") {{ contract.status }}

        .p-6.rounded-xl.mb-6(style="background: var(--bg-input); border: 1px solid var(--border-default)")
          .whitespace-pre-wrap(style="color: var(--text-primary)") {{ contract.content }}

      .glass-card.p-8
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") Sign Below

        .form-group.mb-4
          label.block.text-sm.font-medium.mb-2 Your Name
          el-input(v-model="signerName" placeholder="Enter your full name")

        .form-group.mb-4
          label.block.text-sm.font-medium.mb-2 Signature
          .signature-area.rounded-xl.relative(
            style="background: white; border: 2px solid var(--border-default); height: 200px; cursor: crosshair"
            ref="canvasContainer"
          )
            canvas(ref="signatureCanvas" @mousedown="startDraw" @mousemove="draw" @mouseup="endDraw" @mouseleave="endDraw" @touchstart.prevent="startDrawTouch" @touchmove.prevent="drawTouch" @touchend="endDraw")
          .flex.justify-end.mt-2
            el-button(link size="small" @click="clearSignature") Clear Signature

        el-button.w-full(
          type="primary"
          size="large"
          :loading="submitting"
          @click="submitSignature"
          :disabled="!signerName || !hasSignature"
          class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !rounded-xl"
        ) Sign Contract
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { fetchContractByToken, signContract, type Contract } from '~/composables/useContracts';

definePageMeta({ layout: false });

const route = useRoute();
const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const signed = ref(false);
const contract = ref<Contract | null>(null);
const signerName = ref('');
const hasSignature = ref(false);

const signatureCanvas = ref<HTMLCanvasElement | null>(null);
const canvasContainer = ref<HTMLElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let isDrawing = false;

onMounted(async () => {
  try {
    const token = route.params.token as string;
    contract.value = await fetchContractByToken(token);
    if (!contract.value) {
      error.value = 'Contract not found or link is invalid';
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load contract';
  }
  loading.value = false;

  await nextTick();
  initCanvas();
});

function initCanvas() {
  if (!signatureCanvas.value || !canvasContainer.value) return;
  const canvas = signatureCanvas.value;
  const container = canvasContainer.value;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
}

function getPos(e: MouseEvent) {
  const rect = signatureCanvas.value!.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function startDraw(e: MouseEvent) {
  isDrawing = true;
  const { x, y } = getPos(e);
  ctx?.beginPath();
  ctx?.moveTo(x, y);
}

function draw(e: MouseEvent) {
  if (!isDrawing || !ctx) return;
  const { x, y } = getPos(e);
  ctx.lineTo(x, y);
  ctx.stroke();
  hasSignature.value = true;
}

function endDraw() {
  isDrawing = false;
}

function startDrawTouch(e: TouchEvent) {
  const touch = e.touches[0]!;
  const rect = signatureCanvas.value!.getBoundingClientRect();
  isDrawing = true;
  ctx?.beginPath();
  ctx?.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
}

function drawTouch(e: TouchEvent) {
  if (!isDrawing || !ctx) return;
  const touch = e.touches[0]!;
  const rect = signatureCanvas.value!.getBoundingClientRect();
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
  ctx.stroke();
  hasSignature.value = true;
}

function clearSignature() {
  if (!ctx || !signatureCanvas.value) return;
  ctx.clearRect(0, 0, signatureCanvas.value.width, signatureCanvas.value.height);
  hasSignature.value = false;
}

async function submitSignature() {
  if (!signatureCanvas.value) return;
  submitting.value = true;
  const signatureData = signatureCanvas.value.toDataURL('image/png');
  const token = route.params.token as string;
  const response = await signContract(token, signatureData, signerName.value);
  if (response.success) {
    signed.value = true;
  }
  submitting.value = false;
}
</script>

<style scoped>
.signature-area canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
