<template lang="pug">
el-dialog(v-model="visible" :title="$t('documentTemplates.builder.pickTemplate')" width="800px" @close="$emit('close')")
  .grid.grid-cols-3.gap-4
    .glass-card.p-4.cursor-pointer.transition-all.template-card(
      v-for="tpl in filteredTemplates"
      :key="tpl.name"
      @click="selectTemplate(tpl)"
    )
      .preview-box.rounded-lg.mb-3.flex.items-center.justify-center.overflow-hidden(
        style="height: 180px; background: #f8f9fa"
      )
        .page-preview
          template(v-for="el in (tpl.layout?.elements || []).slice(0, 20)" :key="el.id")
            .absolute(:style="thumbStyle(el)")
              //- Wireframe lines for text elements
              template(v-if="el.type === 'text'")
                .thumb-text-line(
                  v-for="n in textLines(el)"
                  :key="n"
                  :style="textLineStyle(el, n)"
                )
              //- Grid for table elements
              template(v-if="el.type === 'table'")
                .thumb-table-header(:style="{ background: el.props?.headerBg || '#666', height: '20%', borderRadius: '1px' }")
                .thumb-table-row(v-for="n in 3" :key="n" :style="{ borderBottom: `1px solid ${el.props?.borderColor || '#e0e0e0'}`, height: '20%' }")
              //- Placeholder for image elements
              template(v-if="el.type === 'image'")
                .thumb-image
                  .thumb-image-x
      .font-bold.text-sm(style="color: var(--text-primary)") {{ tpl.name }}
      .flex.items-center.gap-2.mt-1
        el-tag(size="small" effect="dark" round :class="tpl.type === 'INVOICE' ? '!bg-purple-500/20 !text-white !border-purple-500/30' : '!bg-orange-500/20 !text-white !border-orange-500/30'") {{ tpl.type === 'INVOICE' ? $t('documentTemplates.invoice') : $t('documentTemplates.purchaseOrder') }}

  template(#footer)
    el-button(@click="visible = false") {{ $t('common.cancel') }}
    el-button(type="primary" @click="$emit('start-blank')" class="!rounded-2xl") {{ $t('documentTemplates.builder.startFromScratch') }}
</template>

<script setup lang="ts">
import type { DocumentTemplate } from '~/composables/useDocumentTemplates';

const props = defineProps<{
  show: boolean;
  templates: DocumentTemplate[];
  typeFilter?: string;
}>();

const emit = defineEmits(['close', 'select', 'start-blank']);

const visible = computed({
  get: () => props.show,
  set: v => {
    if (!v) emit('close');
  }
});

const filteredTemplates = computed(() => {
  if (!props.typeFilter) return props.templates;
  return props.templates.filter(t => t.type === props.typeFilter);
});

function selectTemplate(tpl: DocumentTemplate) {
  emit('select', tpl);
}

// Scale factors: preview is 120x170 representing 210x297mm
const SX = 120 / 210;
const SY = 170 / 297;

function thumbStyle(el: any) {
  const base: Record<string, string | undefined> = {
    left: `${el.x * SX}px`,
    top: `${el.y * SY}px`,
    width: `${Math.max(el.width * SX, 1)}px`,
    height: `${Math.max(el.height * SY, 1)}px`,
    overflow: 'hidden'
  };

  if (el.type === 'shape') {
    base.background = el.props?.fill || '#e0e0e0';
    base.borderRadius = el.props?.borderRadius ? `${el.props.borderRadius * SX}px` : undefined;
  } else if (el.type === 'line') {
    base.borderTop = `${Math.max(1, el.props?.thickness || 1)}px solid ${el.props?.color || '#ccc'}`;
    base.height = '0px';
  }

  return base;
}

function textLines(el: any): number {
  const scaledH = el.height * SY;
  if (scaledH < 3) return 1;
  if (scaledH < 5) return el.props?.fontWeight === 'bold' ? 1 : 2;
  return Math.min(Math.floor(scaledH / 2.5), 4);
}

function textLineStyle(el: any, lineIndex: number) {
  const isBold = el.props?.fontWeight === 'bold';
  const color = el.props?.color || '#333';
  const scaledW = el.width * SX;
  // Last line is shorter for a more natural look
  const isLast = lineIndex === textLines(el);
  const width = isLast ? `${Math.max(40, Math.random() * 30 + 50)}%` : '90%';

  return {
    height: isBold ? '2.5px' : '1.5px',
    background: color,
    opacity: isBold ? '0.7' : '0.35',
    width: scaledW < 10 ? '100%' : width,
    marginBottom: '1.5px',
    borderRadius: '1px'
  };
}
</script>

<style scoped>
.template-card {
  border: 1px solid var(--border-default);
}
.template-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.page-preview {
  position: relative;
  width: 120px;
  height: 170px;
  background: white;
  border-radius: 3px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.12),
    0 0 1px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.thumb-text-line {
  display: block;
}

.thumb-table-header {
  width: 100%;
}
.thumb-table-row {
  width: 100%;
}

.thumb-image {
  width: 100%;
  height: 100%;
  background: #e8eaed;
  border: 1px solid #dadce0;
  border-radius: 1px;
  position: relative;
  overflow: hidden;
}
.thumb-image-x {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top right, transparent calc(50% - 0.5px), #bbb calc(50% - 0.5px), #bbb calc(50% + 0.5px), transparent calc(50% + 0.5px)),
    linear-gradient(to bottom right, transparent calc(50% - 0.5px), #bbb calc(50% - 0.5px), #bbb calc(50% + 0.5px), transparent calc(50% + 0.5px));
}
</style>
