<template>
  <div
    class="rich-text-editor border-2 rounded-2xl overflow-hidden bg-white transition-all focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 border-slate-100 shadow-inner"
    :class="className"
  >
    <!-- Toolbar -->
    <div v-if="editor" class="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 flex-wrap sticky top-0 z-10">
      <!-- Headings -->
      <button
        :class="[
          'p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors',
          { 'bg-gray-200 text-black font-bold border-gray-400': editor.isActive('heading', { level: 1 }) }
        ]"
        title="Heading 1"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        H1
      </button>
      <button
        :class="[
          'p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors',
          { 'bg-gray-200 text-black font-bold border-gray-400': editor.isActive('heading', { level: 2 }) }
        ]"
        title="Heading 2"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        H2
      </button>
      <button
        :class="[
          'p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors',
          { 'bg-gray-200 text-black font-bold border-gray-400': editor.isActive('heading', { level: 3 }) }
        ]"
        title="Heading 3"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        H3
      </button>

      <div class="w-px h-4 bg-gray-300 mx-1"></div>

      <!-- Text Formatting -->
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-gray-200 text-black': editor.isActive('bold') }]"
        title="Bold"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <Bold :size="16" />
      </button>
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-gray-200 text-black': editor.isActive('italic') }]"
        title="Italic"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <Italic :size="16" />
      </button>
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-gray-200 text-black': editor.isActive('underline') }]"
        title="Underline"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <UnderlineIcon :size="16" />
      </button>
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-gray-200 text-black': editor.isActive('strike') }]"
        title="Strikethrough"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <Strikethrough :size="16" />
      </button>

      <!-- Advanced Formatting -->
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-yellow-200 text-black': editor.isActive('highlight') }]"
        title="Highlight"
        @click="editor.chain().focus().toggleHighlight().run()"
      >
        <Highlighter :size="16" />
      </button>

      <div class="w-px h-4 bg-gray-300 mx-1"></div>

      <!-- Alignment & Direction -->
      <button
        :class="[
          'p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors',
          { 'bg-gray-200 text-black': editor.isActive({ textAlign: 'left' }) }
        ]"
        title="Align Left"
        @click="editor.chain().focus().setTextAlign('left').run()"
      >
        <AlignLeft :size="16" />
      </button>
      <button
        :class="[
          'p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors',
          { 'bg-gray-200 text-black': editor.isActive({ textAlign: 'center' }) }
        ]"
        title="Align Center"
        @click="editor.chain().focus().setTextAlign('center').run()"
      >
        <AlignCenter :size="16" />
      </button>
      <button
        :class="[
          'p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors',
          { 'bg-gray-200 text-black': editor.isActive({ textAlign: 'right' }) }
        ]"
        title="Align Right"
        @click="editor.chain().focus().setTextAlign('right').run()"
      >
        <AlignRight :size="16" />
      </button>
      <button
        :class="[
          'p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors',
          { 'bg-gray-200 text-black': editor.isActive({ textAlign: 'justify' }) }
        ]"
        title="Justify"
        @click="editor.chain().focus().setTextAlign('justify').run()"
      >
        <AlignJustify :size="16" />
      </button>

      <div class="w-px h-4 bg-gray-300 mx-1"></div>

      <!-- Lists -->
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-gray-200 text-black': editor.isActive('bulletList') }]"
        title="Bullet List"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <List :size="16" />
      </button>
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-gray-200 text-black': editor.isActive('orderedList') }]"
        title="Ordered List"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <ListOrdered :size="16" />
      </button>
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-gray-200 text-black': editor.isActive('taskList') }]"
        title="Task List"
        @click="editor.chain().focus().toggleTaskList().run()"
      >
        <CheckSquare :size="16" />
      </button>

      <div class="w-px h-4 bg-gray-300 mx-1"></div>

      <!-- Tables -->
      <button
        class="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
        title="Insert Table"
        @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
      >
        <TableIcon :size="16" />
      </button>
      <template v-if="editor.isActive('table')">
        <button class="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Add Column" @click="editor.chain().focus().addColumnAfter().run()">
          <Plus :size="14" class="rotate-90" />
        </button>
        <button class="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Delete Column" @click="editor.chain().focus().deleteColumn().run()">
          <Trash2 :size="14" class="rotate-90" />
        </button>
        <button class="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Add Row" @click="editor.chain().focus().addRowAfter().run()">
          <Plus :size="14" />
        </button>
        <button class="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Delete Row" @click="editor.chain().focus().deleteRow().run()">
          <Trash2 :size="14" />
        </button>
      </template>

      <div class="w-px h-4 bg-gray-300 mx-1"></div>

      <!-- Media & Links -->
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-gray-200 text-black': editor.isActive('link') }]"
        title="Link"
        @click="setLink"
      >
        <LinkIcon :size="16" />
      </button>

      <div class="w-px h-4 bg-gray-300 mx-1"></div>

      <!-- Utils -->
      <button class="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Undo" @click="editor.chain().focus().undo().run()">
        <Undo :size="16" />
      </button>
      <button class="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Redo" @click="editor.chain().focus().redo().run()">
        <Redo :size="16" />
      </button>
    </div>

    <editor-content :editor="editor" />

    <div v-if="editor" class="bg-gray-50 border-t border-gray-100 px-4 py-1 text-xs text-gray-400 flex justify-end gap-3">
      <span>{{ editor.storage.characterCount.words() }} words</span>
      <span>{{ editor.storage.characterCount.characters() }} characters</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import ImageExt from '@tiptap/extension-image';
import LinkExt from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import HighlightExt from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  Plus,
  Trash2,
  CheckSquare,
  Highlighter
} from 'lucide-vue-next';

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Write something...'
  },
  className: {
    type: String,
    default: ''
  },
  minHeight: {
    type: String,
    default: '200px'
  }
});

// Emits
const emit = defineEmits(['update:modelValue']);

// Editor Initialization
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    ImageExt.configure({ inline: true }),
    LinkExt.configure({ openOnClick: false }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    HighlightExt,
    Typography,
    CharacterCount,
    Placeholder.configure({ placeholder: props.placeholder })
  ],
  editorProps: {
    attributes: {
      class: 'p-4 outline-none prose prose-sm max-w-none text-gray-700 leading-relaxed overflow-y-auto custom-scrollbar focus:outline-none',
      style: `min-height: ${props.minHeight};`
    }
  },
  onUpdate: () => {
    emit('update:modelValue', editor.value?.getHTML());
  }
});

// Watch for external value changes
watch(
  () => props.modelValue,
  newValue => {
    if (editor.value && newValue !== editor.value.getHTML()) {
      editor.value.commands.setContent(newValue, false as any);
    }
  }
);

// Cleanup
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

// Methods
const setLink = () => {
  if (!editor.value) return;
  const previousUrl = editor.value.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);

  if (url === null) return;

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
};
</script>

<style>
/* Tiptap Editor Styles ported from React */
.ProseMirror p.is-editor-empty:first-child::before {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
.ProseMirror table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0;
  overflow: hidden;
}
.ProseMirror td,
.ProseMirror th {
  min-width: 1em;
  border: 2px solid #ced4da;
  padding: 3px 5px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}
.ProseMirror th {
  font-weight: bold;
  text-align: left;
  background-color: #f1f3f5;
}
.ProseMirror .selectedCell:after {
  z-index: 2;
  position: absolute;
  content: '';
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(200, 200, 255, 0.4);
  pointer-events: none;
}
ul[data-type='taskList'] {
  list-style: none;
  padding: 0;
}
ul[data-type='taskList'] li {
  display: flex;
  align-items: center;
}
ul[data-type='taskList'] li > label {
  flex: 0 0 auto;
  margin-right: 0.5rem;
  user-select: none;
}
ul[data-type='taskList'] li > div {
  flex: 1 1 auto;
}
.ProseMirror ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 1rem 0;
}
.ProseMirror ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin: 1rem 0;
}
.ProseMirror li {
  margin: 0.25rem 0;
}
.ProseMirror img {
  max-width: 100%;
  height: auto;
}
.ProseMirror h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  line-height: 1.2;
}
.ProseMirror h2 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
  line-height: 1.3;
}
.ProseMirror h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}
.prose h1,
.prose h2,
.prose h3 {
  margin: unset;
  font-weight: unset;
  font-size: unset;
}
</style>
