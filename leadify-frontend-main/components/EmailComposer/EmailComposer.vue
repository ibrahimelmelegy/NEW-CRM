<template lang="pug">
el-dialog(
  :model-value="visible"
  @close="$emit('close')"
  :fullscreen="isMobile"
  width="900px"
  class="email-composer-dialog"
  :show-close="false"
  append-to-body
  destroy-on-close
)
  template(#header)
    .flex.items-center.justify-between.w-full
      .flex.items-center.gap-2
        Icon(name="ph:envelope-bold" size="20" class="text-[var(--brand-primary)]")
        span(class="text-lg font-semibold text-[var(--text-primary)]") {{ $t('emailComposer.title') }}
      button(class="p-1 rounded hover:bg-[var(--glass-bg)] transition-colors" @click="$emit('close')")
        Icon(name="ph:x-bold" size="18" class="text-[var(--text-muted)]")

  .composer-layout
    //- Left: Compose
    .composer-form
      //- Template Selector (collapsible)
      el-collapse(v-model="activeCollapse")
        el-collapse-item(:title="$t('emailComposer.templates')" name="templates")
          TemplateSelector(
            :templates="templates"
            :selected="selectedTemplate"
            @select="handleTemplateSelect"
          )

      //- To field
      .form-field
        label(class="text-xs font-medium text-[var(--text-muted)] mb-1 block") {{ $t('emailComposer.to') }}
        el-input(
          v-model="emailForm.to"
          :placeholder="$t('emailComposer.to')"
          size="default"
        )
          template(#prefix)
            Icon(name="ph:user" size="14")

      //- CC / BCC toggle and fields
      .flex.gap-2.mb-1
        el-button(
          v-if="!showCc"
          size="small"
          text
          @click="showCc = true"
        ) + {{ $t('emailComposer.cc') }}
        el-button(
          v-if="!showBcc"
          size="small"
          text
          @click="showBcc = true"
        ) + {{ $t('emailComposer.bcc') }}

      .form-field(v-if="showCc")
        label(class="text-xs font-medium text-[var(--text-muted)] mb-1 block") {{ $t('emailComposer.cc') }}
        el-input(v-model="emailForm.cc" :placeholder="$t('emailComposer.cc')" size="default")

      .form-field(v-if="showBcc")
        label(class="text-xs font-medium text-[var(--text-muted)] mb-1 block") {{ $t('emailComposer.bcc') }}
        el-input(v-model="emailForm.bcc" :placeholder="$t('emailComposer.bcc')" size="default")

      //- Subject
      .form-field
        label(class="text-xs font-medium text-[var(--text-muted)] mb-1 block") {{ $t('emailComposer.subject') }}
        el-input(v-model="emailForm.subject" :placeholder="$t('emailComposer.subject')" size="default")

      //- Variable inserter
      .mb-3
        VariableInserter(
          :variables="availableVariables"
          :context="context"
          @insert="insertVariableAtCursor"
        )

      //- Body editor
      .form-field
        el-input(
          ref="bodyEditorRef"
          v-model="emailForm.body"
          type="textarea"
          :rows="12"
          :placeholder="$t('emailComposer.bodyPlaceholder')"
          resize="vertical"
        )

      //- Best send time indicator
      .flex.items-center.gap-2.mt-3(class="text-sm text-[var(--text-muted)]")
        Icon(name="ph:clock-bold" size="16")
        span {{ $t('emailComposer.bestTime') }}: {{ bestSendTime }}

    //- Right: Preview
    .composer-preview
      EmailPreview(
        :subject="previewSubject"
        :body="previewBody"
        :to="emailForm.to"
      )

  template(#footer)
    .flex.justify-end.gap-3
      el-button(@click="$emit('close')") {{ $t('common.cancel') }}
      el-button(
        type="primary"
        @click="handleSend"
        :loading="sending"
        :disabled="!canSend"
      )
        Icon(name="ph:paper-plane-tilt-bold" size="16")
        span(class="ml-1") {{ $t('emailComposer.send') }}
</template>

<script setup lang="ts">
const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  contextData?: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'sent', data: any): void;
}>();

const {
  templates,
  selectedTemplate,
  loading,
  emailForm,
  context,
  availableVariables,
  bestSendTime,
  fetchTemplates,
  selectTemplate,
  injectVariables,
  resetForm,
} = useEmailComposer();

const sending = ref(false);
const showCc = ref(false);
const showBcc = ref(false);
const activeCollapse = ref<string[]>([]);
const bodyEditorRef = ref<any>(null);

// Responsive check
const isMobile = ref(false);
function checkMobile() {
  isMobile.value = typeof window !== 'undefined' && window.innerWidth < 768;
}
onMounted(() => {
  checkMobile();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkMobile);
  }
});
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkMobile);
  }
});

// Watch visibility to load templates
watch(() => props.visible, async (val) => {
  if (val) {
    if (props.contextData) {
      context.value = { ...props.contextData };
    }
    await fetchTemplates();
  } else {
    resetForm();
    showCc.value = false;
    showBcc.value = false;
    activeCollapse.value = [];
  }
});

// Apply context data when it changes
watch(() => props.contextData, (val) => {
  if (val) {
    context.value = { ...val };
  }
}, { deep: true });

function handleTemplateSelect(template: any) {
  selectTemplate(template);
  // Close template section after selection
  activeCollapse.value = [];
  ElMessage.success(t('emailComposer.templateApplied'));
}

function insertVariableAtCursor(variable: string) {
  const tag = `{{${variable}}}`;
  // Try to insert at cursor position in body textarea
  const textareaEl = bodyEditorRef.value?.$el?.querySelector('textarea');
  if (textareaEl) {
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const before = emailForm.body.substring(0, start);
    const after = emailForm.body.substring(end);
    emailForm.body = before + tag + after;
    // Restore cursor position after the inserted tag
    nextTick(() => {
      textareaEl.selectionStart = start + tag.length;
      textareaEl.selectionEnd = start + tag.length;
      textareaEl.focus();
    });
  } else {
    // Fallback: append to body
    emailForm.body += tag;
  }
}

// Preview with variables injected
const previewSubject = computed(() => injectVariables(emailForm.subject));
const previewBody = computed(() => {
  const raw = emailForm.body;
  // If the body looks like HTML, inject variables directly
  if (raw.includes('<')) {
    return injectVariables(raw);
  }
  // Otherwise convert plain text to basic HTML paragraphs
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const html = escaped
    .split('\n\n')
    .map((p: string) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return injectVariables(html);
});

const canSend = computed(() => {
  return emailForm.to.trim() !== '' && emailForm.subject.trim() !== '' && emailForm.body.trim() !== '';
});

async function handleSend() {
  if (!canSend.value) return;

  sending.value = true;
  try {
    const payload = {
      to: emailForm.to,
      subject: previewSubject.value,
      body: previewBody.value,
      cc: emailForm.cc || undefined,
      bcc: emailForm.bcc || undefined
    };

    const { success } = await useApiFetch('email/messages/send', 'POST', payload);

    if (success) {
      ElMessage.success(t('emailComposer.sent'));
      emit('sent', payload);
      emit('close');
    } else {
      ElMessage.error(t('common.error') || 'Failed to send email');
    }
  } catch (err) {
    console.error('Failed to send email:', err);
    ElMessage.error(t('common.error') || 'Failed to send email');
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.composer-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .composer-layout {
    grid-template-columns: 1fr 1fr;
  }
}

.composer-form {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.composer-preview {
  display: none;
}

@media (min-width: 1024px) {
  .composer-preview {
    display: block;
  }
}

.form-field {
  margin-bottom: 0.75rem;
}
</style>

<style>
/* Global overrides for the composer dialog */
.email-composer-dialog .el-dialog__header {
  border-bottom: 1px solid var(--glass-border);
  padding: 1rem 1.25rem;
  margin: 0;
}

.email-composer-dialog .el-dialog__body {
  padding: 1.25rem;
}

.email-composer-dialog .el-dialog__footer {
  border-top: 1px solid var(--glass-border);
  padding: 0.75rem 1.25rem;
}

.email-composer-dialog .el-collapse {
  border: none;
  margin-bottom: 0.75rem;
}

.email-composer-dialog .el-collapse-item__header {
  background: transparent;
  border-bottom: 1px solid var(--glass-border);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  height: 40px;
}

.email-composer-dialog .el-collapse-item__wrap {
  background: transparent;
  border-bottom: none;
}

.email-composer-dialog .el-collapse-item__content {
  padding: 0.75rem 0;
}
</style>
