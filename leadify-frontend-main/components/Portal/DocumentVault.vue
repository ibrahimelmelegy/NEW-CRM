<template lang="pug">
.document-vault
  //- Header with Search and View Toggle
  .flex.items-center.justify-between.mb-6.flex-wrap.gap-4
    div
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('portal.documents.title') }}
      p.text-sm(style="color: var(--text-muted)") {{ filteredDocuments.length }} {{ $t('portal.documents.documentsCount') }}
    .flex.items-center.gap-3
      el-input(
        v-model="searchQuery"
        :placeholder="$t('portal.documents.search')"
        prefix-icon="Search"
        clearable
        size="default"
        style="width: 240px"
      )
      el-radio-group(v-model="viewMode" size="small")
        el-radio-button(value="grid")
          Icon(name="ph:squares-four-bold" size="16" aria-label="Grid View")
        el-radio-button(value="list")
          Icon(name="ph:list-bold" size="16" aria-label="List View")

  //- Category Filter
  .flex.items-center.gap-2.mb-6.flex-wrap
    el-tag.cursor-pointer(
      v-for="cat in categories"
      :key="cat"
      :type="activeCategory === cat ? '' : 'info'"
      :effect="activeCategory === cat ? 'dark' : 'plain'"
      round
      @click="activeCategory = activeCategory === cat ? '' : cat"
    )
      | {{ cat }} ({{ getCategoryCount(cat) }})

  //- Grid View
  .document-grid(v-if="viewMode === 'grid' && filteredDocuments.length")
    .document-card.glass-card(
      v-for="doc in filteredDocuments"
      :key="doc.id"
    )
      .document-card-icon
        Icon(:name="getFileIcon(doc.mimeType)" size="32" :style="{ color: getFileColor(doc.mimeType) }" :aria-label="doc.mimeType")
      .document-card-info
        p.text-sm.font-semibold.truncate(style="color: var(--text-primary)" :title="doc.name") {{ doc.name }}
        .flex.items-center.gap-2.mt-1
          span.text-xs(style="color: var(--text-muted)") {{ formatFileSize(doc.size) }}
          span.text-xs(style="color: var(--text-muted)") {{ formatDate(doc.uploadedAt) }}
        .flex.items-center.gap-1.mt-1(v-if="doc.category")
          el-tag(size="small" effect="plain" round) {{ doc.category }}
      .document-card-actions
        el-tooltip(:content="$t('portal.documents.preview')" placement="top")
          el-button(
            v-if="isPreviewable(doc.mimeType)"
            circle
            size="small"
            @click="handlePreview(doc)"
          )
            Icon(name="ph:eye-bold" size="14" aria-label="Preview")
        el-tooltip(:content="$t('portal.documents.download')" placement="top")
          el-button(circle size="small" @click="handleDownload(doc)")
            Icon(name="ph:download-simple-bold" size="14" aria-label="Download")

  //- List View
  .glass-card.p-4(v-else-if="viewMode === 'list' && filteredDocuments.length")
    .document-list-item(
      v-for="doc in filteredDocuments"
      :key="doc.id"
    )
      .flex.items-center.gap-3.flex-1.min-w-0
        .document-list-icon
          Icon(:name="getFileIcon(doc.mimeType)" size="24" :style="{ color: getFileColor(doc.mimeType) }" :aria-label="doc.mimeType")
        .flex-1.min-w-0
          p.text-sm.font-semibold.truncate(style="color: var(--text-primary)") {{ doc.name }}
          .flex.items-center.gap-3.mt-1
            span.text-xs(style="color: var(--text-muted)") {{ formatFileSize(doc.size) }}
            span.text-xs(style="color: var(--text-muted)") {{ formatDate(doc.uploadedAt) }}
            el-tag(v-if="doc.category" size="small" effect="plain" round) {{ doc.category }}
      .flex.items-center.gap-2
        el-button(
          v-if="isPreviewable(doc.mimeType)"
          text
          size="small"
          @click="handlePreview(doc)"
        )
          Icon(name="ph:eye-bold" size="14" aria-label="Preview")
          span.ml-1 {{ $t('portal.documents.preview') }}
        el-button(text size="small" @click="handleDownload(doc)")
          Icon(name="ph:download-simple-bold" size="14" aria-label="Download")
          span.ml-1 {{ $t('portal.documents.download') }}

  //- Empty State
  .empty-state.glass-card.p-12.text-center(v-if="!filteredDocuments.length")
    Icon(name="ph:folder-open" size="64" style="color: var(--text-muted)" aria-label="No Documents")
    p.text-lg.font-semibold.mt-4(style="color: var(--text-primary)") {{ $t('portal.documents.noDocuments') }}
    p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('portal.documents.noDocumentsHint') }}
</template>

<script setup lang="ts">
import type { PortalDocument } from '~/composables/usePortal';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  documents: PortalDocument[];
}>();

const searchQuery = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const activeCategory = ref('');

const categories = computed(() => {
  const cats = new Set<string>();
  props.documents.forEach(doc => {
    if (doc.category) cats.add(doc.category);
  });
  return Array.from(cats).sort();
});

const filteredDocuments = computed(() => {
  let result = [...props.documents];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      doc =>
        doc.name.toLowerCase().includes(query) ||
        (doc.category || '').toLowerCase().includes(query) ||
        (doc.tags || []).some(t => t.toLowerCase().includes(query))
    );
  }

  if (activeCategory.value) {
    result = result.filter(doc => doc.category === activeCategory.value);
  }

  return result;
});

function getCategoryCount(category: string): number {
  return props.documents.filter(doc => doc.category === category).length;
}

function getFileIcon(mimeType: string): string {
  if (!mimeType) return 'ph:file-bold';
  if (mimeType.includes('pdf')) return 'ph:file-pdf-bold';
  if (mimeType.includes('image')) return 'ph:file-image-bold';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'ph:file-doc-bold';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'ph:file-xls-bold';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'ph:file-ppt-bold';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'ph:file-zip-bold';
  if (mimeType.includes('text')) return 'ph:file-text-bold';
  return 'ph:file-bold';
}

function getFileColor(mimeType: string): string {
  if (!mimeType) return 'var(--text-muted)';
  if (mimeType.includes('pdf')) return '#ef4444';
  if (mimeType.includes('image')) return '#8b5cf6';
  if (mimeType.includes('word') || mimeType.includes('document')) return '#3b82f6';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '#22c55e';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '#f59e0b';
  return 'var(--text-muted)';
}

function isPreviewable(mimeType: string): boolean {
  if (!mimeType) return false;
  return mimeType.includes('pdf') || mimeType.includes('image');
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function handlePreview(doc: PortalDocument) {
  ElMessage({ type: 'info', message: `Preview: ${doc.name}` });
}

function handleDownload(doc: PortalDocument) {
  ElMessage({ type: 'info', message: `Download: ${doc.name}` });
}
</script>

<style scoped>
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.document-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s;
  cursor: default;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.document-card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-card-info {
  flex: 1;
  min-width: 0;
}

.document-card-actions {
  display: flex;
  gap: 8px;
}

.document-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-default);
  gap: 12px;
}

.document-list-item:last-child {
  border-bottom: none;
}

.document-list-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (max-width: 640px) {
  .document-grid {
    grid-template-columns: 1fr;
  }
}
</style>
