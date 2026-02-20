<template lang="pug">
.pro-doc-builder
  //- Toolbar
  ProToolbar(:editor="editor" @toggle-variables="showVariables = !showVariables")

  //- Main content area
  .builder-body.flex.mt-3(style="height: calc(100vh - 220px)")
    //- Variable Picker (collapsible side panel)
    transition(name="slide")
      .variables-panel.glass-card.rounded-xl.overflow-hidden(
        v-if="showVariables"
        style="width: 280px; min-width: 280px; border: 1px solid var(--glass-border-color)"
      )
        VariablePicker(@insert="handleInsertVariable")

    //- Editor pane
    .editor-pane.flex-1.mx-3.glass-card.rounded-xl.overflow-hidden(
      style="border: 1px solid var(--glass-border-color)"
    )
      //- Slash command menu
      .slash-menu.glass-card.rounded-xl.shadow-lg(
        v-if="showSlashMenu"
        :style="slashMenuPosition"
        ref="slashMenuRef"
      )
        .p-2
          .slash-item.flex.items-center.gap-2.px-3.py-2.rounded-lg.cursor-pointer.transition-all(
            v-for="(item, index) in filteredSlashItems"
            :key="item.label"
            :class="{ active: index === slashMenuIndex }"
            @click="executeSlashCommand(item)"
            @mouseenter="slashMenuIndex = index"
          )
            .flex.items-center.justify-center.rounded-lg(
              style="width: 32px; height: 32px; background: rgba(120, 73, 255, 0.08)"
            )
              Icon(:name="item.icon" size="16" style="color: #7849ff")
            div
              .text-xs.font-semibold(style="color: var(--text-primary)") {{ item.label }}
              .text-xs(style="color: var(--text-muted)") {{ item.description }}

      //- TipTap Editor
      .editor-content.overflow-y-auto(style="height: 100%")
        editor-content.tiptap-editor(:editor="editor")

    //- Preview pane
    .preview-pane.rounded-xl.overflow-hidden(
      style="width: 40%; min-width: 320px; border: 1px solid var(--glass-border-color)"
    )
      PDFPreview(
        :htmlContent="editorHtml"
        :exporting="exporting"
        @export-pdf="handleExportPDF"
      )
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import ImageExt from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import type { JSONContent } from '@tiptap/vue-3';

import { VariableNode } from './extensions/VariableNode';
import { SignatureBlock } from './extensions/SignatureBlock';
import { PageBreak } from './extensions/PageBreak';
import ProToolbar from './ProToolbar.vue';
import VariablePicker from './VariablePicker.vue';
import PDFPreview from './PDFPreview.vue';
import { useDocumentBuilder } from '~/composables/useDocumentBuilder';

// ── Props & Emits ─────────────────────────────────────────────────────
const props = defineProps<{
  templateId?: string;
  initialContent?: JSONContent;
  variables?: string[];
}>();

const emit = defineEmits<{
  save: [content: JSONContent];
  'export-pdf': [];
}>();

// ── State ─────────────────────────────────────────────────────────────
const showVariables = ref(false);
const exporting = ref(false);
const editorHtml = ref('');
const { exportPDF } = useDocumentBuilder();

// ── Slash command menu ────────────────────────────────────────────────
const showSlashMenu = ref(false);
const slashMenuPosition = ref({ top: '0px', left: '0px' });
const slashMenuIndex = ref(0);
const slashMenuQuery = ref('');
const slashMenuRef = ref<HTMLElement | null>(null);

interface SlashMenuItem {
  label: string;
  description: string;
  icon: string;
  command: (editor: any) => void;
}

const slashItems: SlashMenuItem[] = [
  {
    label: 'Heading 1',
    description: 'Large section heading',
    icon: 'ph:text-h-one-bold',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: 'ph:text-h-two-bold',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Heading 3',
    description: 'Small section heading',
    icon: 'ph:text-h-three-bold',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: 'Bullet List',
    description: 'Unordered list of items',
    icon: 'ph:list-bullets-bold',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: 'Numbered List',
    description: 'Ordered list of items',
    icon: 'ph:list-numbers-bold',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: 'Task List',
    description: 'Checklist with checkboxes',
    icon: 'ph:check-square-bold',
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    label: 'Table',
    description: 'Insert a 3x3 table',
    icon: 'ph:table-bold',
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    label: 'Horizontal Rule',
    description: 'Visual divider line',
    icon: 'ph:minus-bold',
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    label: 'Page Break',
    description: 'Break to next page in PDF',
    icon: 'ph:scissors-bold',
    command: (editor) => editor.chain().focus().insertPageBreak().run(),
  },
  {
    label: 'Signature Block',
    description: 'Signature line with date',
    icon: 'ph:pen-nib-bold',
    command: (editor) => editor.chain().focus().insertSignatureBlock({ label: 'Signature', showDate: true }).run(),
  },
  {
    label: 'Blockquote',
    description: 'Indented quote block',
    icon: 'ph:quotes-bold',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    label: 'Code Block',
    description: 'Code snippet block',
    icon: 'ph:code-bold',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
];

const filteredSlashItems = computed(() => {
  const q = slashMenuQuery.value.toLowerCase();
  if (!q) return slashItems;
  return slashItems.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q),
  );
});

// ── TipTap Editor ─────────────────────────────────────────────────────
const editor = useEditor({
  content: props.initialContent || {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [],
      },
    ],
  },
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    TextStyle,
    Color,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    ImageExt.configure({
      inline: false,
      allowBase64: true,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    Placeholder.configure({
      placeholder: 'Type / to insert blocks, or start writing...',
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    VariableNode,
    SignatureBlock,
    PageBreak,
  ],
  onUpdate: ({ editor: ed }) => {
    editorHtml.value = ed.getHTML();
    emit('save', ed.getJSON());
  },
  editorProps: {
    handleKeyDown: (view, event) => {
      // Slash command trigger
      if (event.key === '/' && !showSlashMenu.value) {
        nextTick(() => {
          openSlashMenu();
        });
        return false;
      }

      // Slash menu navigation
      if (showSlashMenu.value) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          slashMenuIndex.value = (slashMenuIndex.value + 1) % filteredSlashItems.value.length;
          return true;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          slashMenuIndex.value = (slashMenuIndex.value - 1 + filteredSlashItems.value.length) % filteredSlashItems.value.length;
          return true;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          const item = filteredSlashItems.value[slashMenuIndex.value];
          if (item) executeSlashCommand(item);
          return true;
        }
        if (event.key === 'Escape') {
          showSlashMenu.value = false;
          return true;
        }
        // Update filter query on typing
        if (event.key.length === 1) {
          slashMenuQuery.value += event.key;
          slashMenuIndex.value = 0;
        }
        if (event.key === 'Backspace') {
          if (slashMenuQuery.value.length > 0) {
            slashMenuQuery.value = slashMenuQuery.value.slice(0, -1);
          } else {
            showSlashMenu.value = false;
          }
        }
      }

      return false;
    },
    handleClick: () => {
      if (showSlashMenu.value) {
        showSlashMenu.value = false;
      }
    },
  },
});

// Initialize HTML on mount
onMounted(() => {
  if (editor.value) {
    editorHtml.value = editor.value.getHTML();
  }
});

// Watch for external content changes
watch(
  () => props.initialContent,
  (newContent) => {
    if (newContent && editor.value) {
      const currentJson = JSON.stringify(editor.value.getJSON());
      const newJson = JSON.stringify(newContent);
      if (currentJson !== newJson) {
        editor.value.commands.setContent(newContent);
        editorHtml.value = editor.value.getHTML();
      }
    }
  },
);

function openSlashMenu() {
  if (!editor.value) return;

  const { view } = editor.value;
  const { from } = view.state.selection;
  const coords = view.coordsAtPos(from);
  const editorRect = view.dom.closest('.editor-content')?.getBoundingClientRect();

  if (editorRect) {
    slashMenuPosition.value = {
      top: `${coords.bottom - editorRect.top + 8}px`,
      left: `${coords.left - editorRect.left}px`,
    };
  }

  showSlashMenu.value = true;
  slashMenuIndex.value = 0;
  slashMenuQuery.value = '';
}

function executeSlashCommand(item: SlashMenuItem) {
  if (!editor.value) return;

  // Delete the "/" character that triggered the menu plus any typed query chars
  const deleteCount = 1 + slashMenuQuery.value.length;
  const { from } = editor.value.state.selection;
  editor.value
    .chain()
    .deleteRange({ from: from - deleteCount, to: from })
    .run();

  item.command(editor.value);
  showSlashMenu.value = false;
}

function handleInsertVariable(path: string) {
  if (!editor.value) return;
  editor.value.chain().focus().insertVariable(path).run();
}

async function handleExportPDF() {
  if (!editor.value) return;
  exporting.value = true;
  try {
    await exportPDF(editor.value.getHTML(), 'document.pdf');
  } finally {
    exporting.value = false;
  }
}

// Expose editor for parent component
defineExpose({
  editor,
  getContent: () => editor.value?.getJSON(),
  getHTML: () => editor.value?.getHTML(),
  setContent: (content: JSONContent) => editor.value?.commands.setContent(content),
});
</script>

<style scoped>
.pro-doc-builder {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.builder-body {
  gap: 0;
}

.editor-pane {
  position: relative;
  display: flex;
  flex-direction: column;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
}

/* Slash command menu */
.slash-menu {
  position: absolute;
  z-index: 100;
  width: 280px;
  max-height: 380px;
  overflow-y: auto;
  border: 1px solid var(--glass-border-color);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
}

.slash-item:hover,
.slash-item.active {
  background: rgba(120, 73, 255, 0.08);
}

/* Slide transition for variables panel */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
  width: 0 !important;
  min-width: 0 !important;
  overflow: hidden;
}

/* TipTap editor styles */
.editor-pane :deep(.tiptap-editor) {
  padding: 40px 48px;
  min-height: 100%;
  outline: none;
}

.editor-pane :deep(.tiptap) {
  outline: none;
  min-height: 100%;
}

.editor-pane :deep(.tiptap > *:first-child) {
  margin-top: 0;
}

.editor-pane :deep(.tiptap h1) {
  font-size: 28px;
  font-weight: 700;
  margin: 24px 0 12px 0;
  color: var(--text-primary);
  line-height: 1.3;
}

.editor-pane :deep(.tiptap h2) {
  font-size: 22px;
  font-weight: 600;
  margin: 20px 0 8px 0;
  color: var(--text-primary);
  line-height: 1.35;
}

.editor-pane :deep(.tiptap h3) {
  font-size: 18px;
  font-weight: 600;
  margin: 16px 0 6px 0;
  color: var(--text-primary);
  line-height: 1.4;
}

.editor-pane :deep(.tiptap p) {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  line-height: 1.6;
}

.editor-pane :deep(.tiptap ul),
.editor-pane :deep(.tiptap ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.editor-pane :deep(.tiptap li) {
  margin: 2px 0;
}

.editor-pane :deep(.tiptap blockquote) {
  border-left: 3px solid #7849ff;
  padding: 8px 16px;
  margin: 12px 0;
  background: rgba(120, 73, 255, 0.04);
  border-radius: 0 8px 8px 0;
}

.editor-pane :deep(.tiptap pre) {
  background: var(--bg-input);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.editor-pane :deep(.tiptap code) {
  background: rgba(120, 73, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'JetBrains Mono', monospace;
}

.editor-pane :deep(.tiptap pre code) {
  background: none;
  padding: 0;
}

.editor-pane :deep(.tiptap hr) {
  border: none;
  border-top: 1px solid var(--glass-border-color);
  margin: 16px 0;
}

.editor-pane :deep(.tiptap a) {
  color: #7849ff;
  text-decoration: underline;
  cursor: pointer;
}

.editor-pane :deep(.tiptap img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 12px 0;
}

.editor-pane :deep(.tiptap img.ProseMirror-selectednode) {
  outline: 2px solid #7849ff;
  outline-offset: 2px;
}

/* Table styles */
.editor-pane :deep(.tiptap table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  table-layout: fixed;
}

.editor-pane :deep(.tiptap th),
.editor-pane :deep(.tiptap td) {
  border: 1px solid var(--glass-border-color);
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
  min-width: 60px;
  position: relative;
}

.editor-pane :deep(.tiptap th) {
  background: rgba(120, 73, 255, 0.06);
  font-weight: 600;
}

.editor-pane :deep(.tiptap .selectedCell::after) {
  background: rgba(120, 73, 255, 0.08);
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.editor-pane :deep(.tiptap .column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: #7849ff;
  pointer-events: none;
}

.editor-pane :deep(.tiptap .tableWrapper) {
  overflow-x: auto;
  margin: 12px 0;
}

/* Task list */
.editor-pane :deep(.tiptap ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
}

.editor-pane :deep(.tiptap ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.editor-pane :deep(.tiptap ul[data-type="taskList"] li > label) {
  flex-shrink: 0;
  margin-top: 4px;
}

.editor-pane :deep(.tiptap ul[data-type="taskList"] li > div) {
  flex: 1;
}

/* Highlight */
.editor-pane :deep(.tiptap mark) {
  border-radius: 2px;
  padding: 1px 2px;
}

/* Placeholder */
.editor-pane :deep(.tiptap p.is-editor-empty:first-child::before) {
  color: var(--text-muted);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Variable, Signature and PageBreak nodes are rendered by their Vue components */
</style>
