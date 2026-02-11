<template lang="pug">
el-dialog.glass-dialog(
  v-model="visible" 
  title="AI Email Assistant" 
  width="50%" 
  :before-close="handleClose"
  destroy-on-close
)
  .p-6
    .mb-6
      label.block.text-sm.font-bold.text-muted.mb-2 What do you want to write?
      el-input.glass-input(
        v-model="prompt"
        type="textarea"
        :rows="3"
        placeholder="e.g., Write a polite follow-up email for the quote sent yesterday..."
      )
    
    .flex.justify-end.mb-6
      el-button.premium-btn.glow-purple.glass-button-press(
        type="primary" 
        :loading="loading" 
        @click="generateEmail"
      )
        Icon(name="ph:magic-wand-bold" size="18" class="mr-2")
        | Generate Email

    transition(name="fade")
      .result-area(v-if="generatedEmail")
        label.block.text-sm.font-bold.text-muted.mb-2 Generated Content
        .generated-box.glass-card.p-4.relative
          pre.whitespace-pre-wrap.text-sm {{ generatedEmail }}
          el-button.copy-btn.glass-button-press(
            circle 
            size="small" 
            @click="copyToClipboard"
          )
            Icon(name="ph:copy-bold" size="16")
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElNotification } from 'element-plus';
import { useApiFetch } from '@/composables/useApiFetch';

const props = defineProps({
  modelValue: Boolean,
  context: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
});

const prompt = ref('');
const loading = ref(false);
const generatedEmail = ref('');

async function generateEmail() {
  if (!prompt.value) return;

  loading.value = true;
  try {
    const response: any = await useApiFetch('ai/generate-email', 'POST', {
      prompt: prompt.value,
      context: props.context
    });

    if (response.success) {
      generatedEmail.value = response.data;
    } else {
      throw new Error(response.message || 'Generation failed');
    }
  } catch (error) {
    ElNotification({
      title: 'AI Error',
      message: 'Failed to generate email content. Please check your API key.',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visible.value = false;
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(generatedEmail.value);
    ElNotification({
      title: 'Success',
      message: 'Email copied to clipboard',
      type: 'success'
    });
  } catch (err) {
    console.error('Copy failed', err);
  }
}
</script>

<style lang="scss">
.glass-dialog {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-default);
  border-radius: 24px !important;

  .el-dialog__header {
    border-bottom: 1px solid var(--color-border-subtle);
    margin-right: 0;
    padding-bottom: 20px;
  }

  .el-dialog__title {
    color: var(--primary-color);
    font-weight: 800;
  }
}

.generated-box {
  min-height: 200px;
  background: var(--color-surface-hover) !important;
  border: 1px solid var(--color-primary-alpha-20) !important;

  pre {
    color: var(--color-text-primary);
    font-family: inherit;
  }

  .copy-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: var(--color-primary-alpha-10);
    border: 1px solid var(--color-primary-alpha-30);
    color: var(--color-text-primary);

    &:hover {
      background: var(--color-primary-alpha-20);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
