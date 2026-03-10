<template lang="pug">
.email-preview
  //- Header label
  .flex.items-center.gap-2.mb-4
    Icon(name="ph:eye-bold" size="18" class="text-[var(--brand-primary)]")
    span(class="font-semibold text-sm text-[var(--text-primary)]") {{ $t('emailComposer.preview') }}

  //- Mock email envelope
  .preview-envelope
    //- Email header fields
    .preview-header
      .preview-field
        span(class="text-xs font-medium text-[var(--text-muted)] w-12 shrink-0") From:
        span(class="text-xs text-[var(--text-secondary)]") you@company.com
      .preview-field(v-if="to")
        span(class="text-xs font-medium text-[var(--text-muted)] w-12 shrink-0") To:
        span(class="text-xs text-[var(--text-secondary)]") {{ to }}
      .preview-field(v-if="subject")
        span(class="text-xs font-medium text-[var(--text-muted)] w-12 shrink-0") Subject:
        span(class="text-xs text-[var(--text-primary)] font-medium") {{ subject }}

    //- Divider
    .preview-divider

    //- Email body
    .preview-body(v-if="body")
      div(v-html="sanitizeHtml(sanitizedBody)")

    //- Empty state
    .preview-empty(v-else)
      Icon(name="ph:envelope-open" size="48" class="text-[var(--text-muted)] mb-3")
      p(class="text-sm text-[var(--text-muted)]") {{ $t('emailComposer.bodyPlaceholder') }}
</template>

<script setup lang="ts">
const props = defineProps<{
  subject: string;
  body: string;
  to: string;
}>();

// Basic HTML sanitization -- strips script tags and event handlers
const sanitizedBody = computed(() => {
  if (!props.body) return '';
  let cleaned = props.body;
  // Remove script tags
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handler attributes
  cleaned = cleaned.replace(/\s+on\w+="[^"]*"/gi, '');
  cleaned = cleaned.replace(/\s+on\w+='[^']*'/gi, '');
  return cleaned;
});
</script>

<style scoped>
.email-preview {
  position: sticky;
  top: 1rem;
}

.preview-envelope {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  overflow: hidden;
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: color-mix(in srgb, var(--glass-bg) 80%, var(--bg-card));
}

.preview-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-divider {
  height: 1px;
  background: var(--glass-border);
}

.preview-body {
  padding: 1.25rem;
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-primary);
  overflow-y: auto;
  max-height: 400px;
}

.preview-body :deep(p) {
  margin-bottom: 0.75rem;
}

.preview-body :deep(ul),
.preview-body :deep(ol) {
  margin-bottom: 0.75rem;
  padding-left: 1.25rem;
}

.preview-body :deep(li) {
  margin-bottom: 0.25rem;
}

.preview-body :deep(a) {
  color: var(--brand-primary);
  text-decoration: underline;
}

.preview-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
</style>
