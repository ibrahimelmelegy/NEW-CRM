<template lang="pug">
.pdf-preview
  //- Controls
  .flex.items-center.justify-between.px-4.py-2(style="border-bottom: 1px solid var(--glass-border-color)")
    .flex.items-center.gap-2
      h3.font-bold.text-sm(style="color: var(--text-primary)") Preview
      el-tag(size="small" effect="plain" round) A4

    .flex.items-center.gap-1
      el-tooltip(content="Zoom Out")
        el-button(text size="small" @click="zoomOut" :disabled="zoom <= 50")
          Icon(name="ph:minus-bold" size="14")
      span.text-xs.font-mono.mx-1(style="color: var(--text-muted); min-width: 36px; text-align: center") {{ zoom }}%
      el-tooltip(content="Zoom In")
        el-button(text size="small" @click="zoomIn" :disabled="zoom >= 150")
          Icon(name="ph:plus-bold" size="14")
      .toolbar-divider
      el-tooltip(content="Print")
        el-button(text size="small" @click="handlePrint")
          Icon(name="ph:printer-bold" size="16")
      el-tooltip(content="Download PDF")
        el-button(text size="small" @click="$emit('export-pdf')" :loading="exporting")
          Icon(name="ph:file-pdf-bold" size="16")

  //- Preview area
  .preview-area.flex-1.overflow-auto.p-4(ref="previewAreaRef")
    .preview-page.mx-auto(
      :style="pageStyle"
    )
      .preview-page-content(ref="pageContentRef" v-html="renderedHtml")
</template>

<script setup lang="ts">
const props = defineProps<{
  htmlContent: string;
  exporting?: boolean;
}>();

defineEmits<{
  'export-pdf': [];
}>();

const zoom = ref(80);
const previewAreaRef = ref<HTMLElement | null>(null);
const pageContentRef = ref<HTMLElement | null>(null);

// A4 dimensions in px (at 96dpi: 210mm = 794px, 297mm = 1123px)
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const pageStyle = computed(() => ({
  width: `${A4_WIDTH}px`,
  minHeight: `${A4_HEIGHT}px`,
  transform: `scale(${zoom.value / 100})`,
  transformOrigin: 'top center'
}));

const renderedHtml = computed(
  () => props.htmlContent || '<p style="color: #999; text-align: center; padding-top: 40px;">Start typing in the editor to see a preview here...</p>'
);

function zoomIn() {
  if (zoom.value < 150) zoom.value += 10;
}

function zoomOut() {
  if (zoom.value > 50) zoom.value -= 10;
}

function handlePrint() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Preview</title>
      <style>
        @page { size: A4; margin: 20mm 15mm; }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          padding: 0;
          margin: 0;
        }
        h1 { font-size: 28px; margin: 0 0 12px 0; font-weight: 700; }
        h2 { font-size: 22px; margin: 20px 0 8px 0; font-weight: 600; }
        h3 { font-size: 18px; margin: 16px 0 6px 0; font-weight: 600; }
        p { margin: 0 0 8px 0; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; }
        ul, ol { margin: 6px 0; padding-left: 24px; }
        li { margin: 2px 0; }
        hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
        .variable-node, [data-type="variable"] {
          font-weight: 600;
          color: #7849ff;
        }
        [data-type="page-break"] {
          page-break-before: always;
          display: block;
          height: 0;
          overflow: hidden;
        }
        [data-type="signature-block"] {
          page-break-inside: avoid;
        }
        .signature-block {
          page-break-inside: avoid;
        }
        img { max-width: 100%; height: auto; }
      </style>
    </head>
    <body>${props.htmlContent}</body>
    </html>
  `);
  printWindow.document.close();

  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
}
</script>

<style scoped>
.pdf-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-input);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--glass-border-color);
  margin: 0 4px;
}

.preview-area {
  background: repeating-conic-gradient(rgba(0, 0, 0, 0.03) 0% 25%, transparent 0% 50%) 50% / 16px 16px;
}

.preview-page {
  background: white;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.preview-page-content {
  padding: 60px 55px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.preview-page-content :deep(h1) {
  font-size: 28px;
  margin: 0 0 12px 0;
  font-weight: 700;
  color: #1a1a1a;
}

.preview-page-content :deep(h2) {
  font-size: 22px;
  margin: 20px 0 8px 0;
  font-weight: 600;
  color: #2a2a2a;
}

.preview-page-content :deep(h3) {
  font-size: 18px;
  margin: 16px 0 6px 0;
  font-weight: 600;
  color: #333;
}

.preview-page-content :deep(p) {
  margin: 0 0 8px 0;
}

.preview-page-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}

.preview-page-content :deep(th),
.preview-page-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px 10px;
  text-align: left;
  font-size: 13px;
}

.preview-page-content :deep(th) {
  background: #f5f5f5;
  font-weight: 600;
}

.preview-page-content :deep(ul),
.preview-page-content :deep(ol) {
  margin: 6px 0;
  padding-left: 24px;
}

.preview-page-content :deep(li) {
  margin: 2px 0;
}

.preview-page-content :deep(hr) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 16px 0;
}

.preview-page-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.preview-page-content :deep(a) {
  color: #7849ff;
  text-decoration: underline;
}

.preview-page-content :deep(.variable-node),
.preview-page-content :deep([data-type='variable']) {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.1);
  color: #7849ff;
  font-size: 0.85em;
  font-weight: 600;
  font-family: monospace;
  border: 1px solid rgba(120, 73, 255, 0.2);
}

.preview-page-content :deep([data-type='page-break']) {
  margin: 20px 0;
  border-top: 2px dashed #ccc;
  text-align: center;
  position: relative;
  padding: 8px 0;
}

.preview-page-content :deep(.signature-block),
.preview-page-content :deep([data-type='signature-block']) {
  padding: 20px 0;
  margin: 12px 0;
  border-top: 1px dashed #ccc;
}

.preview-page-content :deep(ul[data-type='taskList']) {
  list-style: none;
  padding-left: 0;
}

.preview-page-content :deep(ul[data-type='taskList'] li) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.preview-page-content :deep(ul[data-type='taskList'] li::before) {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #ccc;
  border-radius: 3px;
  flex-shrink: 0;
  margin-top: 4px;
}

.preview-page-content :deep(mark) {
  border-radius: 2px;
  padding: 1px 2px;
}
</style>
