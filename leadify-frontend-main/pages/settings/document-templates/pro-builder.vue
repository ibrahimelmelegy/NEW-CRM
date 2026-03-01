<template lang="pug">
.pro-builder-page
  //- Header bar
  .header-bar.glass-card.rounded-xl.px-4.py-3.mb-3.flex.items-center.justify-between.shrink-0
    .flex.items-center.gap-3
      NuxtLink(to="/settings/document-templates")
        el-button(text size="small")
          Icon(name="ph:arrow-left-bold" size="18")
          span.ml-1 {{ $t('documentTemplates.builder.backToTemplates') }}
      el-divider(direction="vertical")
      el-input.max-w-64(
        v-model="templateName"
        :placeholder="$t('documentTemplates.builder.templateName')"
        size="default"
      )
      el-select.max-w-44(
        v-model="templateType"
        :placeholder="$t('documentTemplates.builder.templateType')"
        size="default"
      )
        el-option(:label="$t('documentTemplates.invoice')" value="INVOICE")
        el-option(:label="$t('documentTemplates.purchaseOrder')" value="PURCHASE_ORDER")

    .flex.items-center.gap-2
      //- Auto-save indicator
      .flex.items-center.gap-1(v-if="builder.state.lastSaved")
        Icon(name="ph:cloud-check-bold" size="14" style="color: #10b981")
        span.text-xs(style="color: var(--text-muted)") Saved {{ formatTimeSince(builder.state.lastSaved) }}
      .flex.items-center.gap-1(v-else-if="builder.state.isDirty")
        Icon(name="ph:circle-bold" size="10" style="color: #f59e0b")
        span.text-xs(style="color: var(--text-muted)") Unsaved changes

      el-divider(direction="vertical")

      el-button(size="default" @click="showPicker = true" class="!rounded-xl")
        Icon(name="ph:squares-four-bold" size="16" class="mr-1")
        span Templates

      el-button(
        type="primary"
        size="default"
        :loading="builder.state.saving"
        @click="handleSave"
        class="!rounded-xl"
      )
        Icon(name="ph:floppy-disk-bold" size="16" class="mr-1")
        span {{ $t('documentTemplates.builder.save') }}

  //- Editor
  .flex-1.min-h-0
    ProDocBuilder(
      ref="docBuilderRef"
      :templateId="templateId || undefined"
      :initialContent="initialContent"
      @save="handleContentUpdate"
    )

  //- Template picker dialog
  ProTemplatePicker(
    :show="showPicker"
    :templates="builtInTemplates"
    @close="showPicker = false"
    @select="handleTemplateSelect"
    @start-blank="handleStartBlank"
  )
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { JSONContent } from '@tiptap/vue-3';
import ProDocBuilder from '~/components/DocumentBuilder/ProDocBuilder.vue';
import ProTemplatePicker from '~/components/DocumentBuilder/ProTemplatePicker.vue';
import { useDocumentBuilder } from '~/composables/useDocumentBuilder';
import type { ProTemplateDefinition } from '~/composables/useDocumentBuilder';

definePageMeta({
  middleware: 'permissions',
  permission: 'VIEW_DOCUMENT_TEMPLATES'
});

const route = useRoute();
const router = useRouter();
const builder = useDocumentBuilder();

const templateId = computed(() => (route.query.id as string) || null);
const templateName = ref('Untitled Template');
const templateType = ref<import('~/composables/useDocumentTemplates').DocumentTemplateType>('INVOICE');
const showPicker = ref(false);
const initialContent = ref<JSONContent | null>(null);
const docBuilderRef = ref<InstanceType<typeof ProDocBuilder> | null>(null);
const builtInTemplates = ref<ProTemplateDefinition[]>([]);

onMounted(async () => {
  builtInTemplates.value = builder.getBuiltInTemplates();

  if (templateId.value) {
    const tpl = await builder.load(templateId.value);
    if (tpl) {
      templateName.value = tpl.name;
      templateType.value = tpl.type;
      if (tpl.layout?.proContent) {
        initialContent.value = tpl.layout.proContent;
      }
    }
  } else {
    // Show template picker for new documents
    showPicker.value = true;
  }
});

onUnmounted(() => {
  builder.stopAutoSave();
});

// ── Content update handler (called on every editor change) ────────────
function handleContentUpdate(content: JSONContent) {
  builder.state.isDirty = true;
  builder.autoSave(templateId.value, templateName.value, templateType.value, content);
}

// ── Manual save ───────────────────────────────────────────────────────
async function handleSave() {
  if (!templateName.value.trim()) {
    ElNotification({ type: 'warning', title: 'Warning', message: 'Please enter a template name.' });
    return;
  }

  const content = docBuilderRef.value?.getContent();
  if (!content) return;

  const result = await builder.save(templateId.value, templateName.value, templateType.value, content);

  if (result.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Template saved successfully.' });
    // Update URL with new ID if created
    if (!templateId.value && result.body?.id) {
      router.replace({ query: { id: result.body.id } });
    }
  } else {
    ElNotification({ type: 'error', title: 'Error', message: result.message || 'Failed to save template.' });
  }
}

// ── Template selection ────────────────────────────────────────────────
function handleTemplateSelect(tpl: ProTemplateDefinition) {
  if (!templateId.value) {
    templateName.value = tpl.name;
  }
  initialContent.value = tpl.content;
  docBuilderRef.value?.setContent(tpl.content);
  showPicker.value = false;
}

function handleStartBlank() {
  const blankContent: JSONContent = {
    type: 'doc',
    content: [{ type: 'paragraph' }]
  };
  initialContent.value = blankContent;
  docBuilderRef.value?.setContent(blankContent);
  showPicker.value = false;
}

// ── Time formatting ───────────────────────────────────────────────────
function formatTimeSince(date: Date | null): string {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
</script>

<style scoped>
.pro-builder-page {
  padding: 16px;
  animation: fadeIn 0.3s ease-out;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.header-bar {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-color);
  box-shadow: var(--glass-shadow);
}
</style>
