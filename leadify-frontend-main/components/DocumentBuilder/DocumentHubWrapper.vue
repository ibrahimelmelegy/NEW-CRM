<template lang="pug">
.pro-builder-page
  //- Header bar
  .header-bar.glass-card.rounded-xl.px-4.py-3.mb-3.flex.items-center.justify-between.shrink-0
    .flex.items-center.gap-3
      el-button(text size="small" @click="goBack")
        Icon(name="ph:arrow-left-bold" size="18")
        span.ml-1 {{ backLabel || 'Back' }}
      el-divider(direction="vertical")
      
      //- Document Type Badge
      .flex.items-center.gap-2.bg-gray-100.px-3.py-1.rounded-full
        Icon(:name="typeIcon" size="14" class="text-gray-500")
        span.text-xs.font-bold.text-gray-600.uppercase.tracking-wider {{ displayType }}

      el-input.max-w-64(
        v-model="documentName"
        :placeholder="namePlaceholder"
        size="default"
      )

    .flex.items-center.gap-2
      //- Auto-save indicator
      .flex.items-center.gap-1(v-if="builder.state.lastSaved")
        Icon(name="ph:cloud-check-bold" size="14" style="color: #10b981")
        span.text-xs(style="color: var(--text-muted)") Saved {{ formatTimeSince(builder.state.lastSaved) }}
      .flex.items-center.gap-1(v-else-if="builder.state.isDirty")
        Icon(name="ph:circle-bold" size="10" style="color: #f59e0b")
        span.text-xs(style="color: var(--text-muted)") Unsaved changes

      el-divider(direction="vertical")

      el-button(
        type="primary"
        size="default"
        :loading="builder.state.saving"
        @click="handleSave"
        class="!rounded-xl"
      )
        Icon(name="ph:floppy-disk-bold" size="16" class="mr-1")
        span Save {{ displayType }}

  //- Editor Engine
  .flex-1.min-h-0
    ProDocBuilder(
      ref="docBuilderRef"
      :documentType="documentType"
      :templateId="templateId || undefined"
      :initialContent="initialContent"
      @save="handleContentUpdate"
    )
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElNotification } from 'element-plus';
import type { JSONContent } from '@tiptap/vue-3';
import ProDocBuilder from '~/components/DocumentBuilder/ProDocBuilder.vue';
import { useDocumentBuilder } from '~/composables/useDocumentBuilder';

const props = defineProps<{
  documentType: 'proposal' | 'invoice' | 'purchase_order' | 'credit_note' | 'contract' | 'rfq' | 'sales_order';
  backUrl: string;
  backLabel?: string;
}>();

const router = useRouter();
const route = useRoute();
const builder = useDocumentBuilder();

const templateId = computed(() => (route.query.id as string) || null);
const documentName = ref('Untitled Document');
const initialContent = ref<JSONContent | null>(null);
const docBuilderRef = ref<InstanceType<typeof ProDocBuilder> | null>(null);

// UI Helpers
const displayType = computed(() => props.documentType.replace('_', ' '));
const namePlaceholder = computed(() => `${displayType.value} Name`);

const typeIcon = computed(() => {
  const map: Record<string, string> = {
    invoice: 'ph:receipt-bold',
    purchase_order: 'ph:shopping-cart-bold',
    proposal: 'ph:file-text-bold',
    contract: 'ph:signature-bold',
    rfq: 'ph:clipboard-text-bold',
    sales_order: 'ph:tag-bold',
    credit_note: 'ph:arrow-u-down-left-bold'
  };
  return map[props.documentType] || 'ph:file-doc-bold';
});

onMounted(async () => {
  if (templateId.value) {
    const tpl = await builder.load(templateId.value);
    if (tpl) {
      documentName.value = tpl.name;
      if (tpl.layout?.proContent) {
        initialContent.value = tpl.layout.proContent;
      }
    }
  }
});

onUnmounted(() => {
  builder.stopAutoSave();
});

function goBack() {
  router.push(props.backUrl);
}

// ── Content update handler ────────────
function handleContentUpdate(content: JSONContent) {
  builder.state.isDirty = true;
  // Map our UI document types to the backend template types for saving
  const mappedType = props.documentType.toUpperCase() as any;
  builder.autoSave(templateId.value, documentName.value, mappedType, content);
}

// ── Manual save ───────────────────────────────────────────────────────
async function handleSave() {
  if (!documentName.value.trim()) {
    ElNotification({ type: 'warning', title: 'Warning', message: 'Please enter a document name.' });
    return;
  }

  const content = docBuilderRef.value?.getContent();
  if (!content) return;

  const mappedType = props.documentType.toUpperCase() as any;
  const result: any = await builder.save(templateId.value, documentName.value, mappedType, content);

  if (result.success) {
    ElNotification({ type: 'success', title: 'Success', message: `${displayType.value} saved successfully.` });
    if (!templateId.value && result.body?.id) {
      router.replace({ query: { id: result.body.id } });
    }
  } else {
    ElNotification({ type: 'error', title: 'Error', message: result.message || 'Failed to save.' });
  }
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
