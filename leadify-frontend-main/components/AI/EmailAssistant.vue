<template lang="pug">
.email-assistant.glass-card
  //- Header
  .ea-header
    .flex.items-center.gap-3
      .ea-icon
        Icon(name="ph:envelope-simple-bold" size="20" class="text-white")
      div
        h3.ea-title {{ $t('ai.emailAssistant') }}
        p.ea-subtitle {{ $t('ai.emailAssistantDesc') }}

  //- Configuration Form
  .ea-form
    //- Purpose Selector
    .form-group
      label.form-label {{ $t('ai.emailPurpose') }}
      .purpose-grid
        button.purpose-chip(
          v-for="p in purposes"
          :key="p.value"
          :class="{ active: purpose === p.value }"
          @click="purpose = p.value"
        )
          Icon(:name="p.icon" size="16")
          span {{ p.label }}

    //- Tone Selector
    .form-group
      label.form-label {{ $t('ai.emailTone') }}
      .tone-grid
        button.tone-chip(
          v-for="t in tones"
          :key="t.value"
          :class="{ active: tone === t.value }"
          @click="tone = t.value"
        )
          | {{ t.label }}

    //- Context Fields
    .form-row
      .form-group.flex-1
        label.form-label {{ $t('ai.recipientName') }}
        el-input(
          v-model="recipientName"
          :placeholder="$t('ai.recipientNamePlaceholder')"
          size="default"
        )
      .form-group.flex-1
        label.form-label {{ $t('ai.recipientCompany') }}
        el-input(
          v-model="recipientCompany"
          :placeholder="$t('ai.recipientCompanyPlaceholder')"
          size="default"
        )

    //- Custom Instructions (for custom purpose)
    .form-group(v-if="purpose === 'custom'")
      label.form-label {{ $t('ai.customInstructions') }}
      el-input(
        v-model="customInstructions"
        type="textarea"
        :rows="2"
        :placeholder="$t('ai.customInstructionsPlaceholder')"
      )

    //- Generate Button
    .form-actions
      el-button.generate-btn(
        type="primary"
        :loading="isEmailLoading"
        @click="handleGenerate"
        :disabled="!canGenerate"
      )
        Icon(name="ph:magic-wand-bold" size="18" v-if="!isEmailLoading")
        span {{ $t('ai.generateEmail') }}

  //- Generated Email Preview
  transition(name="fade-slide")
    .ea-preview(v-if="generatedEmail")
      .preview-header
        h4.preview-title {{ $t('ai.generatedEmail') }}
        .preview-actions
          el-tooltip(:content="$t('ai.copyToClipboard')" placement="top")
            el-button.action-btn(circle size="small" @click="copyToClipboard")
              Icon(name="ph:copy-bold" size="14")

      //- Subject
      .preview-subject
        span.subject-label {{ $t('ai.subject') }}:
        span.subject-text {{ generatedEmail.subject }}

      //- Body - Editable
      .preview-body
        el-input(
          v-model="editableBody"
          type="textarea"
          :autosize="{ minRows: 6, maxRows: 15 }"
        )

      //- Improve Section
      .improve-section
        .improve-input-row
          el-input(
            v-model="improveInstruction"
            :placeholder="$t('ai.improvePlaceholder')"
            size="default"
          )
            template(#prefix)
              Icon(name="ph:sparkle-bold" size="16" class="text-purple-400")
          el-button.improve-btn(
            @click="handleImprove"
            :loading="isEmailLoading"
            :disabled="!improveInstruction.trim()"
            size="default"
          )
            Icon(name="ph:magic-wand-bold" size="14" v-if="!isEmailLoading")
            span {{ $t('ai.improve') }}

      //- Quick Improve Actions
      .quick-actions
        el-button(
          v-for="action in quickImproveActions"
          :key="action.instruction"
          size="small"
          @click="quickImprove(action.instruction)"
        )
          | {{ action.label }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useAI } from '~/composables/useAI';

const props = defineProps<{
  context?: {
    to?: string;
    toCompany?: string;
    dealInfo?: { name?: string; price?: number; stage?: string };
    clientInfo?: { name?: string; company?: string; industry?: string };
    senderName?: string;
    senderCompany?: string;
  };
}>();

const emit = defineEmits<{
  (e: 'use-email', payload: { subject: string; body: string }): void;
}>();

const { t } = useI18n();
const { generatedEmail, isEmailLoading, generateEmailDraft, improveEmail } = useAI();

// Form state
const purpose = ref<string>('follow-up');
const tone = ref<string>('professional');
const recipientName = ref(props.context?.to || '');
const recipientCompany = ref(props.context?.toCompany || '');
const customInstructions = ref('');
const editableBody = ref('');
const improveInstruction = ref('');

// Watch for context prop changes
watch(
  () => props.context,
  ctx => {
    if (ctx?.to) recipientName.value = ctx.to;
    if (ctx?.toCompany) recipientCompany.value = ctx.toCompany;
  },
  { immediate: true }
);

// Watch for generated email to populate editable body
watch(
  () => generatedEmail.value,
  email => {
    if (email?.body) {
      editableBody.value = email.body;
    }
  }
);

const purposes = [
  { value: 'follow-up', label: t('ai.purposeFollowUp'), icon: 'ph:arrow-bend-up-right-bold' },
  { value: 'introduction', label: t('ai.purposeIntroduction'), icon: 'ph:handshake-bold' },
  { value: 'proposal', label: t('ai.purposeProposal'), icon: 'ph:file-text-bold' },
  { value: 'thank-you', label: t('ai.purposeThankYou'), icon: 'ph:heart-bold' },
  { value: 'meeting-request', label: t('ai.purposeMeeting'), icon: 'ph:calendar-bold' },
  { value: 'custom', label: t('ai.purposeCustom'), icon: 'ph:pencil-simple-bold' }
];

const tones = [
  { value: 'professional', label: t('ai.toneProfessional') },
  { value: 'friendly', label: t('ai.toneFriendly') },
  { value: 'formal', label: t('ai.toneFormal') },
  { value: 'casual', label: t('ai.toneCasual') }
];

const quickImproveActions = [
  { label: t('ai.makeShorter'), instruction: 'Make it shorter and more concise' },
  { label: t('ai.makeMoreFormal'), instruction: 'Make the tone more formal and corporate' },
  { label: t('ai.addUrgency'), instruction: 'Add a sense of urgency' },
  { label: t('ai.softenTone'), instruction: 'Soften the tone and make it more friendly' }
];

const canGenerate = computed(() => {
  if (purpose.value === 'custom') return customInstructions.value.trim().length > 0;
  return true;
});

async function handleGenerate() {
  const context = {
    to: recipientName.value || undefined,
    toCompany: recipientCompany.value || undefined,
    purpose: purpose.value,
    tone: tone.value,
    dealInfo: props.context?.dealInfo,
    clientInfo: props.context?.clientInfo,
    customInstructions: purpose.value === 'custom' ? customInstructions.value : undefined,
    senderName: props.context?.senderName,
    senderCompany: props.context?.senderCompany
  };

  await generateEmailDraft(context);
}

async function handleImprove() {
  if (!editableBody.value.trim() || !improveInstruction.value.trim()) return;

  const draft = generatedEmail.value?.subject ? `Subject: ${generatedEmail.value.subject}\n\n${editableBody.value}` : editableBody.value;

  const result = await improveEmail(draft, improveInstruction.value);
  if (result) {
    editableBody.value = result.body;
    improveInstruction.value = '';
  }
}

async function quickImprove(instruction: string) {
  improveInstruction.value = instruction;
  await handleImprove();
}

async function copyToClipboard() {
  try {
    const fullText = generatedEmail.value?.subject ? `Subject: ${generatedEmail.value.subject}\n\n${editableBody.value}` : editableBody.value;
    await navigator.clipboard.writeText(fullText);
    ElNotification({ type: 'success', title: t('common.success'), message: t('ai.copiedToClipboard') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('ai.copyFailed') });
  }
}
</script>

<style lang="scss" scoped>
.email-assistant {
  padding: 20px;
  border-radius: 16px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-color);
}

.ea-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--glass-border-color);

  .ea-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ea-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .ea-subtitle {
    font-size: 12px;
    color: var(--text-primary);
    opacity: 0.6;
    margin: 2px 0 0;
  }
}

.ea-form {
  .form-group {
    margin-bottom: 14px;
  }

  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
    opacity: 0.8;
  }

  .form-row {
    display: flex;
    gap: 12px;
  }
}

.purpose-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.purpose-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 12px;
  background: rgba(124, 58, 237, 0.06);
  border: 1px solid rgba(124, 58, 237, 0.15);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(124, 58, 237, 0.12);
  }

  &.active {
    background: rgba(124, 58, 237, 0.15);
    border-color: rgba(124, 58, 237, 0.5);
    color: #7c3aed;
    font-weight: 600;
  }
}

.tone-grid {
  display: flex;
  gap: 6px;
}

.tone-chip {
  padding: 5px 14px;
  border-radius: 8px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid var(--glass-border-color);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(124, 58, 237, 0.08);
  }

  &.active {
    background: rgba(124, 58, 237, 0.12);
    border-color: rgba(124, 58, 237, 0.4);
    color: #7c3aed;
    font-weight: 600;
  }
}

.form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.generate-btn {
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
  border: none !important;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    opacity: 0.9;
  }
}

// ===== Preview Section =====
.ea-preview {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--glass-border-color);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .preview-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .preview-actions {
    display: flex;
    gap: 6px;
  }

  .action-btn {
    border-color: rgba(124, 58, 237, 0.3);

    &:hover {
      border-color: #7c3aed;
      color: #7c3aed;
    }
  }
}

.preview-subject {
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(124, 58, 237, 0.06);
  margin-bottom: 10px;
  font-size: 13px;

  .subject-label {
    font-weight: 700;
    color: #7c3aed;
    margin-right: 6px;
  }

  .subject-text {
    color: var(--text-primary);
  }
}

.preview-body {
  margin-bottom: 14px;

  :deep(.el-textarea__inner) {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border-color);
    border-radius: 10px;
    color: var(--text-primary);
    font-size: 13px;
    line-height: 1.6;
  }
}

.improve-section {
  .improve-input-row {
    display: flex;
    gap: 8px;
  }

  .improve-btn {
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;

  :deep(.el-button) {
    border-radius: 8px;
    font-size: 11px;
    border-color: rgba(124, 58, 237, 0.2);
    color: var(--text-primary);
    opacity: 0.7;

    &:hover {
      opacity: 1;
      border-color: rgba(124, 58, 237, 0.5);
      color: #7c3aed;
    }
  }
}

// ===== Transitions =====
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
