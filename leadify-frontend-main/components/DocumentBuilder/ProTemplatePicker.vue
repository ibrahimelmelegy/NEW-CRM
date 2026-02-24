<template lang="pug">
el-dialog(
  v-model="visible"
  title="Choose a Template"
  width="880px"
  @close="$emit('close')"
  class="pro-template-picker-dialog"
)
  //- Category filter
  .flex.items-center.gap-2.mb-5
    el-radio-group(v-model="selectedCategory" size="small")
      el-radio-button(value="") All
      el-radio-button(value="Sales") Sales
      el-radio-button(value="Legal") Legal
      el-radio-button(value="Finance") Finance
      el-radio-button(value="General") General

  //- Template grid
  .grid.gap-4(class="grid-cols-2 lg:grid-cols-3")
    .template-card.glass-card.p-4.cursor-pointer.transition-all(
      v-for="tpl in filteredTemplates"
      :key="tpl.id"
      @click="selectTemplate(tpl)"
    )
      .flex.items-center.gap-3.mb-3
        .icon-circle.flex.items-center.justify-center.rounded-xl(
          style="width: 40px; height: 40px; background: rgba(120, 73, 255, 0.1)"
        )
          Icon(:name="tpl.icon" size="20" style="color: #7849ff")
        div
          .font-bold.text-sm(style="color: var(--text-primary)") {{ tpl.name }}
          el-tag.mt-1(size="small" effect="plain" round) {{ tpl.category }}

      //- Content preview (miniature)
      .preview-box.rounded-lg.mb-3.overflow-hidden(
        style="height: 140px; background: var(--bg-input); border: 1px solid var(--glass-border-color); padding: 8px"
      )
        .preview-content
          template(v-for="(node, idx) in previewNodes(tpl)" :key="idx")
            .preview-heading(v-if="node.type === 'heading'" :class="'level-' + node.level")
              .preview-line(:style="{ width: node.width }")
            .preview-paragraph(v-else-if="node.type === 'paragraph'")
              .preview-line(v-for="n in node.lines" :key="n" :style="{ width: n === node.lines ? '60%' : '90%' }")
            .preview-table(v-else-if="node.type === 'table'")
              .preview-table-header
              .preview-table-row(v-for="n in 2" :key="n")
            .preview-rule(v-else-if="node.type === 'rule'")
            .preview-sig(v-else-if="node.type === 'signature'")
              .preview-sig-line

      p.text-xs(style="color: var(--text-muted)") {{ tpl.description }}

  template(#footer)
    el-button(@click="visible = false") {{ $t('common.cancel') }}
    el-button(type="primary" @click="$emit('start-blank')" class="!rounded-2xl")
      Icon(name="ph:file-bold" size="16" class="mr-1")
      span Start Blank
</template>

<script setup lang="ts">
import type { ProTemplateDefinition } from '~/composables/useDocumentBuilder';

const props = defineProps<{
  show: boolean;
  templates: ProTemplateDefinition[];
}>();

const emit = defineEmits<{
  close: [];
  select: [template: ProTemplateDefinition];
  'start-blank': [];
}>();

const visible = computed({
  get: () => props.show,
  set: (v) => { if (!v) emit('close'); },
});

const selectedCategory = ref('');

const filteredTemplates = computed(() => {
  if (!selectedCategory.value) return props.templates;
  return props.templates.filter((t) => t.category === selectedCategory.value);
});

function selectTemplate(tpl: ProTemplateDefinition) {
  emit('select', tpl);
}

/**
 * Build a simplified preview structure from the template's TipTap JSON
 * for the miniature thumbnail rendering.
 */
function previewNodes(tpl: ProTemplateDefinition) {
  const nodes: Array<{ type: string; level?: number; width?: string; lines?: number }> = [];
  const content = tpl.content?.content || [];

  for (const node of content.slice(0, 12)) {
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const widths: Record<number, string> = { 1: '55%', 2: '45%', 3: '35%' };
      nodes.push({ type: 'heading', level, width: widths[level] || '40%' });
    } else if (node.type === 'paragraph') {
      nodes.push({ type: 'paragraph', lines: 2 });
    } else if (node.type === 'table') {
      nodes.push({ type: 'table' });
    } else if (node.type === 'horizontalRule') {
      nodes.push({ type: 'rule' });
    } else if (node.type === 'signatureBlock') {
      nodes.push({ type: 'signature' });
    } else if (node.type === 'bulletList' || node.type === 'orderedList' || node.type === 'taskList') {
      nodes.push({ type: 'paragraph', lines: 3 });
    }
  }

  return nodes;
}
</script>

<style scoped>
.template-card {
  border: 1px solid var(--glass-border-color);
}

.template-card:hover {
  border-color: #7849ff;
  box-shadow: 0 4px 16px rgba(120, 73, 255, 0.12);
  transform: translateY(-2px);
}

.preview-content {
  transform: scale(0.45);
  transform-origin: top left;
  width: 220%;
  pointer-events: none;
}

.preview-heading {
  margin-bottom: 4px;
}

.preview-heading .preview-line {
  height: 6px;
  border-radius: 2px;
  background: var(--text-primary);
  opacity: 0.5;
}

.preview-heading.level-1 .preview-line {
  height: 8px;
  opacity: 0.6;
}

.preview-heading.level-2 .preview-line {
  height: 6px;
}

.preview-heading.level-3 .preview-line {
  height: 5px;
}

.preview-paragraph {
  margin-bottom: 4px;
}

.preview-paragraph .preview-line {
  height: 3px;
  border-radius: 1px;
  background: var(--text-muted);
  opacity: 0.3;
  margin-bottom: 2px;
}

.preview-table {
  margin-bottom: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.preview-table-header {
  height: 6px;
  background: rgba(120, 73, 255, 0.2);
}

.preview-table-row {
  height: 5px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.preview-rule {
  height: 1px;
  background: var(--text-muted);
  opacity: 0.3;
  margin: 4px 0;
}

.preview-sig {
  margin: 4px 0;
  padding-top: 4px;
}

.preview-sig-line {
  width: 40%;
  height: 1px;
  background: var(--text-muted);
  opacity: 0.4;
}
</style>
