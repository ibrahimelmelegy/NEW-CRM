<template lang="pug">
.pro-toolbar.glass-card.rounded-xl.px-3.py-2.flex.flex-wrap.items-center.gap-1
  //- History
  .toolbar-group.flex.items-center.gap-0
    el-tooltip(:content="$t('documentTemplates.builder.undo') + ' (Ctrl+Z)'")
      button.toolbar-btn(:class="{ disabled: !editor?.can().undo() }" @click="editor?.chain().focus().undo().run()")
        Icon(name="ph:arrow-counter-clockwise-bold" size="16")
    el-tooltip(:content="$t('documentTemplates.builder.redo') + ' (Ctrl+Y)'")
      button.toolbar-btn(:class="{ disabled: !editor?.can().redo() }" @click="editor?.chain().focus().redo().run()")
        Icon(name="ph:arrow-clockwise-bold" size="16")

  .toolbar-divider

  //- Text style
  .toolbar-group.flex.items-center.gap-0
    el-tooltip(content="Bold (Ctrl+B)")
      button.toolbar-btn(:class="{ active: editor?.isActive('bold') }" @click="editor?.chain().focus().toggleBold().run()")
        Icon(name="ph:text-b-bold" size="16")
    el-tooltip(content="Italic (Ctrl+I)")
      button.toolbar-btn(:class="{ active: editor?.isActive('italic') }" @click="editor?.chain().focus().toggleItalic().run()")
        Icon(name="ph:text-italic-bold" size="16")
    el-tooltip(content="Underline (Ctrl+U)")
      button.toolbar-btn(:class="{ active: editor?.isActive('underline') }" @click="editor?.chain().focus().toggleUnderline().run()")
        Icon(name="ph:text-underline-bold" size="16")
    el-tooltip(content="Strikethrough")
      button.toolbar-btn(:class="{ active: editor?.isActive('strike') }" @click="editor?.chain().focus().toggleStrike().run()")
        Icon(name="ph:text-strikethrough-bold" size="16")

  .toolbar-divider

  //- Headings
  .toolbar-group.flex.items-center.gap-0
    el-tooltip(content="Heading 1")
      button.toolbar-btn(:class="{ active: editor?.isActive('heading', { level: 1 }) }" @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()")
        span.text-xs.font-bold H1
    el-tooltip(content="Heading 2")
      button.toolbar-btn(:class="{ active: editor?.isActive('heading', { level: 2 }) }" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()")
        span.text-xs.font-bold H2
    el-tooltip(content="Heading 3")
      button.toolbar-btn(:class="{ active: editor?.isActive('heading', { level: 3 }) }" @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()")
        span.text-xs.font-bold H3

  .toolbar-divider

  //- Lists
  .toolbar-group.flex.items-center.gap-0
    el-tooltip(content="Bullet List")
      button.toolbar-btn(:class="{ active: editor?.isActive('bulletList') }" @click="editor?.chain().focus().toggleBulletList().run()")
        Icon(name="ph:list-bullets-bold" size="16")
    el-tooltip(content="Ordered List")
      button.toolbar-btn(:class="{ active: editor?.isActive('orderedList') }" @click="editor?.chain().focus().toggleOrderedList().run()")
        Icon(name="ph:list-numbers-bold" size="16")
    el-tooltip(content="Task List")
      button.toolbar-btn(:class="{ active: editor?.isActive('taskList') }" @click="editor?.chain().focus().toggleTaskList().run()")
        Icon(name="ph:check-square-bold" size="16")

  .toolbar-divider

  //- Alignment
  .toolbar-group.flex.items-center.gap-0
    el-tooltip(content="Align Left")
      button.toolbar-btn(:class="{ active: editor?.isActive({ textAlign: 'left' }) }" @click="editor?.chain().focus().setTextAlign('left').run()")
        Icon(name="ph:text-align-left-bold" size="16")
    el-tooltip(content="Align Center")
      button.toolbar-btn(:class="{ active: editor?.isActive({ textAlign: 'center' }) }" @click="editor?.chain().focus().setTextAlign('center').run()")
        Icon(name="ph:text-align-center-bold" size="16")
    el-tooltip(content="Align Right")
      button.toolbar-btn(:class="{ active: editor?.isActive({ textAlign: 'right' }) }" @click="editor?.chain().focus().setTextAlign('right').run()")
        Icon(name="ph:text-align-right-bold" size="16")
    el-tooltip(content="Justify")
      button.toolbar-btn(:class="{ active: editor?.isActive({ textAlign: 'justify' }) }" @click="editor?.chain().focus().setTextAlign('justify').run()")
        Icon(name="ph:text-align-justify-bold" size="16")

  .toolbar-divider

  //- Colors
  .toolbar-group.flex.items-center.gap-0
    el-popover(trigger="click" :width="220" placement="bottom")
      template(#reference)
        el-tooltip(content="Text Color")
          button.toolbar-btn
            Icon(name="ph:paint-brush-bold" size="16")
            .color-indicator(:style="{ background: currentTextColor }")
      .p-2
        p.text-xs.font-bold.mb-2(style="color: var(--text-primary)") Text Color
        .grid.grid-cols-8.gap-1
          .color-swatch(
            v-for="color in textColors"
            :key="color"
            :style="{ background: color }"
            :class="{ 'ring-2 ring-purple-500': currentTextColor === color }"
            @click="setTextColor(color)"
          )
        el-button.mt-2(size="small" text @click="editor?.chain().focus().unsetColor().run()") Reset

    el-popover(trigger="click" :width="220" placement="bottom")
      template(#reference)
        el-tooltip(content="Highlight")
          button.toolbar-btn(:class="{ active: editor?.isActive('highlight') }")
            Icon(name="ph:highlighter-circle-bold" size="16")
      .p-2
        p.text-xs.font-bold.mb-2(style="color: var(--text-primary)") Highlight Color
        .grid.grid-cols-8.gap-1
          .color-swatch(
            v-for="color in highlightColors"
            :key="color"
            :style="{ background: color }"
            @click="setHighlight(color)"
          )
        el-button.mt-2(size="small" text @click="editor?.chain().focus().unsetHighlight().run()") Remove

  .toolbar-divider

  //- Insert elements
  .toolbar-group.flex.items-center.gap-0
    el-tooltip(content="Insert Link")
      button.toolbar-btn(:class="{ active: editor?.isActive('link') }" @click="handleInsertLink")
        Icon(name="ph:link-bold" size="16")

    el-tooltip(content="Insert Image")
      button.toolbar-btn(@click="handleInsertImage")
        Icon(name="ph:image-bold" size="16")

    el-popover(trigger="click" :width="240" placement="bottom" v-model:visible="showTablePicker")
      template(#reference)
        el-tooltip(content="Insert Table")
          button.toolbar-btn
            Icon(name="ph:table-bold" size="16")
      .p-2
        p.text-xs.font-bold.mb-2(style="color: var(--text-primary)") Insert Table
        .table-grid
          template(v-for="row in 6" :key="row")
            template(v-for="col in 6" :key="col")
              .table-grid-cell(
                :class="{ active: row <= tableRows && col <= tableCols }"
                @mouseenter="[tableRows = row, tableCols = col]"
                @click="insertTable"
              )
        p.text-xs.text-center.mt-1(style="color: var(--text-muted)") {{ tableRows }} x {{ tableCols }}

    el-tooltip(content="Horizontal Rule")
      button.toolbar-btn(@click="editor?.chain().focus().setHorizontalRule().run()")
        Icon(name="ph:minus-bold" size="16")

    el-tooltip(content="Page Break (Ctrl+Enter)")
      button.toolbar-btn(@click="editor?.chain().focus().insertPageBreak().run()")
        Icon(name="ph:scissors-bold" size="16")

  .toolbar-divider

  //- Custom blocks
  .toolbar-group.flex.items-center.gap-0
    el-tooltip(content="Insert Variable")
      button.toolbar-btn(@click="$emit('toggle-variables')")
        Icon(name="ph:code-bold" size="16")

    el-popover(trigger="click" :width="200" placement="bottom")
      template(#reference)
        el-tooltip(content="Insert Signature")
          button.toolbar-btn
            Icon(name="ph:pen-nib-bold" size="16")
      .p-3
        p.text-xs.font-bold.mb-2(style="color: var(--text-primary)") Signature Block
        el-input.mb-2(v-model="signatureLabel" placeholder="Label (e.g. Client)" size="small")
        el-checkbox.mb-3(v-model="signatureShowDate" label="Show date line" size="small")
        el-button(type="primary" size="small" @click="insertSignature" class="!rounded-lg w-full") Insert
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';

const props = defineProps<{
  editor: Editor | undefined;
}>();

const emit = defineEmits<{
  'toggle-variables': [];
}>();

// ── Color palettes ────────────────────────────────────────────────────
const textColors = [
  '#000000',
  '#333333',
  '#666666',
  '#999999',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#65a30d',
  '#0d9488',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#1e3a5f',
  '#1a365d',
  '#064e3b',
  '#78350f'
];

const highlightColors = [
  '#fef08a',
  '#fde68a',
  '#fed7aa',
  '#fecaca',
  '#d9f99d',
  '#bbf7d0',
  '#bfdbfe',
  '#ddd6fe',
  '#fbcfe8',
  '#e0e7ff',
  '#ccfbf1',
  '#fef3c7'
];

const currentTextColor = computed(() => {
  return props.editor?.getAttributes('textStyle')?.color || '#333333';
});

// ── Table picker ──────────────────────────────────────────────────────
const showTablePicker = ref(false);
const tableRows = ref(3);
const tableCols = ref(3);

function insertTable() {
  props.editor?.chain().focus().insertTable({ rows: tableRows.value, cols: tableCols.value, withHeaderRow: true }).run();
  showTablePicker.value = false;
  tableRows.value = 3;
  tableCols.value = 3;
}

// ── Text color ────────────────────────────────────────────────────────
function setTextColor(color: string) {
  props.editor?.chain().focus().setColor(color).run();
}

function setHighlight(color: string) {
  props.editor?.chain().focus().toggleHighlight({ color }).run();
}

// ── Link ──────────────────────────────────────────────────────────────
function handleInsertLink() {
  if (props.editor?.isActive('link')) {
    props.editor?.chain().focus().unsetLink().run();
    return;
  }

  const previousUrl = props.editor?.getAttributes('link')?.href || '';
  const url = window.prompt('Enter URL', previousUrl);
  if (url === null) return;

  if (url === '') {
    props.editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  props.editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

// ── Image ─────────────────────────────────────────────────────────────
function handleInsertImage() {
  const url = window.prompt('Enter image URL');
  if (!url) return;
  props.editor?.chain().focus().setImage({ src: url }).run();
}

// ── Signature ─────────────────────────────────────────────────────────
const signatureLabel = ref('Signature');
const signatureShowDate = ref(true);

function insertSignature() {
  props.editor
    ?.chain()
    .focus()
    .insertSignatureBlock({
      label: signatureLabel.value || 'Signature',
      showDate: signatureShowDate.value
    })
    .run();
  signatureLabel.value = 'Signature';
  signatureShowDate.value = true;
}
</script>

<style scoped>
.pro-toolbar {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-color);
  box-shadow: var(--glass-shadow);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--glass-border-color);
  margin: 0 4px;
  flex-shrink: 0;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.toolbar-btn:hover {
  background: rgba(120, 73, 255, 0.08);
  color: #7849ff;
}

.toolbar-btn.active {
  background: rgba(120, 73, 255, 0.15);
  color: #7849ff;
}

.toolbar-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.color-indicator {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 3px;
  border-radius: 2px;
}

.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: transform 0.1s ease;
}

.color-swatch:hover {
  transform: scale(1.2);
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 2px;
}

.table-grid-cell {
  width: 28px;
  height: 28px;
  border: 1px solid var(--glass-border-color);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.table-grid-cell.active {
  background: rgba(120, 73, 255, 0.2);
  border-color: rgba(120, 73, 255, 0.4);
}

.table-grid-cell:hover {
  background: rgba(120, 73, 255, 0.1);
}
</style>
