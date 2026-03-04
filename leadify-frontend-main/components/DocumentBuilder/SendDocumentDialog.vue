<template lang="pug">
el-dialog(
  v-model="visible"
  title="Send Document"
  width="540px"
  :close-on-click-modal="false"
  @close="handleClose"
)
  .space-y-5(v-loading="sending")
    //- Recipient
    .space-y-1
      label.text-sm.font-semibold(style="color: var(--text-primary)") Recipient Email *
      el-input(
        v-model="form.to"
        placeholder="client@example.com"
        size="large"
        class="!rounded-xl"
        type="email"
      )
        template(#prefix)
          Icon(name="ph:envelope-simple" size="16")

    //- Subject
    .space-y-1
      label.text-sm.font-semibold(style="color: var(--text-primary)") Subject *
      el-input(
        v-model="form.subject"
        placeholder="Document subject..."
        size="large"
        class="!rounded-xl"
      )

    //- Message
    .space-y-1
      label.text-sm.font-semibold(style="color: var(--text-primary)") Message
      el-input(
        v-model="form.message"
        type="textarea"
        :rows="4"
        placeholder="Optional message to include in the email..."
        class="!rounded-xl"
      )

    //- Info box
    .flex.items-start.gap-3.p-3.rounded-xl(style="background: var(--bg-surface)")
      Icon(name="ph:info" size="18" class="text-blue-400 mt-0.5 shrink-0")
      .text-xs(style="color: var(--text-muted)")
        | The document PDF will be automatically generated and attached to the email.
        | The document status will be updated to "Sent".

  template(#footer)
    .flex.justify-end.gap-3
      el-button(size="large" class="!rounded-xl" @click="visible = false") Cancel
      el-button(
        size="large"
        type="primary"
        class="!rounded-xl"
        :loading="sending"
        :disabled="!isValid"
        @click="handleSend"
      )
        Icon(name="ph:paper-plane-tilt" size="16" class="mr-1")
        | Send Document
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDocBuilder } from '~/composables/useDocBuilder';

const props = defineProps<{
  modelValue: boolean;
  documentId: string;
  clientEmail?: string;
  documentReference?: string;
  documentTitle?: string;
  documentType?: string;
}>();

const emit = defineEmits(['update:modelValue', 'sent']);

const { sendDocument } = useDocBuilder();

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

const sending = ref(false);

const form = ref({
  to: '',
  subject: '',
  message: ''
});

const isValid = computed(() => {
  return form.value.to && form.value.to.includes('@') && form.value.subject;
});

// Pre-fill when dialog opens
watch(
  () => props.modelValue,
  val => {
    if (val) {
      const typeLabel = (props.documentType || 'document').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      form.value.to = props.clientEmail || '';
      form.value.subject = `${typeLabel} ${props.documentReference || ''} — ${props.documentTitle || ''}`.trim();
      form.value.message = '';
    }
  }
);

async function handleSend() {
  sending.value = true;
  try {
    const response = await sendDocument(props.documentId, {
      to: form.value.to,
      subject: form.value.subject,
      message: form.value.message || undefined
    });
    if (response?.success) {
      ElMessage.success('Document sent successfully!');
      visible.value = false;
      emit('sent');
    } else {
      ElMessage.error(response?.message || 'Failed to send document');
    }
  } catch {
    ElMessage.error('Failed to send document');
  } finally {
    sending.value = false;
  }
}

function handleClose() {
  form.value = { to: '', subject: '', message: '' };
}
</script>
