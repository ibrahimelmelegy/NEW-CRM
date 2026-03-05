<template>
  <div v-if="editor" class="ultimate-editor-container">
    <!-- STICKY PROFESSIONAL TOOLBAR -->
    <div class="toolbar-wrapper sticky-top">
      <div class="toolbar">
        <!-- Group: History -->
        <div class="toolbar-group">
          <button :disabled="!editor.can().chain().focus().undo().run()" title="Undo" @click="editor.chain().focus().undo().run()">
            <i class="ri-arrow-go-back-line"></i>
          </button>
          <button :disabled="!editor.can().chain().focus().redo().run()" title="Redo" @click="editor.chain().focus().redo().run()">
            <i class="ri-arrow-go-forward-line"></i>
          </button>
        </div>

        <div class="divider"></div>

        <!-- Group: Text Formatting -->
        <div class="toolbar-group">
          <button :class="{ 'is-active': editor.isActive('bold') }" title="Bold" @click="editor.chain().focus().toggleBold().run()">
            <i class="ri-bold"></i>
          </button>
          <button :class="{ 'is-active': editor.isActive('italic') }" title="Italic" @click="editor.chain().focus().toggleItalic().run()">
            <i class="ri-italic"></i>
          </button>
          <button :class="{ 'is-active': editor.isActive('underline') }" title="Underline" @click="editor.chain().focus().toggleUnderline().run()">
            <i class="ri-underline"></i>
          </button>
          <button :class="{ 'is-active': editor.isActive('strike') }" title="Strikethrough" @click="editor.chain().focus().toggleStrike().run()">
            <i class="ri-strikethrough"></i>
          </button>
          <button :class="{ 'is-active': editor.isActive('highlight') }" title="Highlight" @click="editor.chain().focus().toggleHighlight().run()">
            <i class="ri-mark-pen-line"></i>
          </button>
        </div>

        <div class="divider"></div>

        <!-- Group: Colors & Headings -->
        <div class="toolbar-group">
          <input
            type="color"
            :value="editor.getAttributes('textStyle').color || '#000000'"
            title="Text Color"
            class="color-picker"
            @input="
              editor
                .chain()
                .focus()
                .setColor(($event.target as HTMLInputElement).value)
                .run()
            "
          />

          <select class="heading-select" @change="setHeading($event)">
            <option value="p" :selected="editor.isActive('paragraph')">Normal</option>
            <option value="1" :selected="editor.isActive('heading', { level: 1 })">Heading 1</option>
            <option value="2" :selected="editor.isActive('heading', { level: 2 })">Heading 2</option>
            <option value="3" :selected="editor.isActive('heading', { level: 3 })">Heading 3</option>
          </select>
        </div>

        <div class="divider"></div>

        <!-- Group: Alignment -->
        <div class="toolbar-group">
          <button
            :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
            title="Align Left"
            @click="editor.chain().focus().setTextAlign('left').run()"
          >
            <i class="ri-align-left"></i>
          </button>
          <button
            :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
            title="Align Center"
            @click="editor.chain().focus().setTextAlign('center').run()"
          >
            <i class="ri-align-center"></i>
          </button>
          <button
            :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
            title="Align Right"
            @click="editor.chain().focus().setTextAlign('right').run()"
          >
            <i class="ri-align-right"></i>
          </button>
          <button
            :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
            title="Justify"
            @click="editor.chain().focus().setTextAlign('justify').run()"
          >
            <i class="ri-align-justify"></i>
          </button>
        </div>

        <div class="divider"></div>

        <!-- Group: Lists -->
        <div class="toolbar-group">
          <button
            :class="{ 'is-active': editor.isActive('bulletList') }"
            title="Bullet List"
            @click="editor.chain().focus().toggleBulletList().run()"
          >
            <i class="ri-list-unordered"></i>
          </button>
          <button
            :class="{ 'is-active': editor.isActive('orderedList') }"
            title="Ordered List"
            @click="editor.chain().focus().toggleOrderedList().run()"
          >
            <i class="ri-list-ordered"></i>
          </button>
          <button :class="{ 'is-active': editor.isActive('taskList') }" title="Task List" @click="editor.chain().focus().toggleTaskList().run()">
            <i class="ri-checkbox-line"></i>
          </button>
        </div>

        <div class="divider"></div>

        <!-- Group: Insert -->
        <div class="toolbar-group">
          <button title="Insert Image" @click="addImage">
            <i class="ri-image-add-line"></i>
          </button>
          <button :class="{ 'is-active': editor.isActive('link') }" title="Link" @click="setLink">
            <i class="ri-link"></i>
          </button>
          <button title="Insert Table" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()">
            <i class="ri-table-2"></i>
          </button>
        </div>
      </div>

      <!-- SUB-TOOLBAR: TABLE CONTROLS (Conditional) -->
      <div v-if="editor.isActive('table')" class="sub-toolbar">
        <span class="label">Table Controls:</span>
        <button @click="editor.chain().focus().addColumnBefore().run()">Add Col Before</button>
        <button @click="editor.chain().focus().addColumnAfter().run()">Add Col After</button>
        <button @click="editor.chain().focus().deleteColumn().run()">Del Col</button>
        <div class="divider small"></div>
        <button @click="editor.chain().focus().addRowBefore().run()">Add Row Before</button>
        <button @click="editor.chain().focus().addRowAfter().run()">Add Row After</button>
        <button @click="editor.chain().focus().deleteRow().run()">Del Row</button>
        <div class="divider small"></div>
        <button @click="editor.chain().focus().mergeCells().run()">Merge</button>
        <button @click="editor.chain().focus().splitCell().run()">Split</button>
        <button class="danger" @click="editor.chain().focus().deleteTable().run()">Delete Table</button>
      </div>
    </div>

    <!-- BUBBLE MENU -->
    <bubble-menu v-if="editor" :editor="editor" :tippy-options="{ duration: 100 }">
      <div class="bubble-menu-content">
        <button :class="{ 'is-active': editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()">
          <i class="ri-bold"></i>
        </button>
        <button :class="{ 'is-active': editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()">
          <i class="ri-italic"></i>
        </button>
        <button :class="{ 'is-active': editor.isActive('highlight') }" @click="editor.chain().focus().toggleHighlight().run()">
          <i class="ri-mark-pen-line"></i>
        </button>
      </div>
    </bubble-menu>

    <!-- EDITOR AREA (A4 PAPER LOOK) -->
    <div class="editor-viewport">
      <editor-content :editor="editor" class="ultimum-paper" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Placeholder } from '@tiptap/extension-placeholder';

// Props & Emits
const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit,
    Image,
    Table.configure({
      resizable: true
    }),
    TableRow,
    TableHeader,
    TableCell,
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({
      nested: true
    }),
    Link.configure({
      openOnClick: false
    }),
    Underline,
    Subscript,
    Superscript,
    Placeholder.configure({
      placeholder: props.placeholder || 'Start typing your proposal here...'
    })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  }
});

// Watch model value for external changes
watch(
  () => props.modelValue,
  newValue => {
    const isSame = editor.value?.getHTML() === newValue;
    if (!isSame && editor.value) {
      editor.value.commands.setContent(newValue || '', { emitUpdate: false });
    }
  }
);

// Toolbar Functions
const addImage = () => {
  const url = window.prompt('URL');
  if (url && editor.value) {
    editor.value.chain().focus().setImage({ src: url }).run();
  }
};

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);

  // cancelled
  if (url === null) {
    return;
  }

  // empty
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  // update
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
};

const setHeading = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value;
  if (!editor.value) return;

  if (value === 'p') {
    editor.value.chain().focus().setParagraph().run();
  } else {
    editor.value
      .chain()
      .focus()
      .toggleHeading({ level: parseInt(value) as unknown })
      .run();
  }
};
</script>

<style lang="scss">
/* --- HOST & LAYOUT --- */
.ultimate-editor-container {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-obsidian) !important;
  height: 100%;
  min-height: 500px;
  border-radius: var(--radius-card);
  overflow: hidden;
  position: relative;
  border: 1px solid var(--border-glass);
}

/* --- TOOLBAR STYLES --- */
.toolbar-wrapper {
  background: var(--bg-sidebar) !important;
  border-bottom: 1px solid var(--border-stroke);
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.sticky-top {
  position: sticky;
  top: 0;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: var(--border-stroke);
  margin: 0 4px;

  &.small {
    height: 16px;
  }
}

button {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-smooth);

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  &.is-active {
    background-color: rgba(124, 58, 237, 0.15);
    color: var(--accent-purple);
    border-color: rgba(124, 58, 237, 0.3);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  i {
    font-size: 20px;
  }
}

/* Color Picker & Select */
.color-picker {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 2px solid var(--border-glass);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  background: transparent;
}

.heading-select {
  background: var(--bg-card);
  border: 1px solid var(--border-stroke);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: var(--accent-purple);
  }
}

/* Sub Toolbar */
.sub-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  flex-wrap: wrap;
  margin-top: 4px;

  .label {
    font-weight: 600;
    color: var(--text-muted);
    margin-right: 4px;
  }

  button {
    padding: 4px 10px;
    font-size: 12px;
    border: 1px solid var(--border-stroke);
    background: var(--bg-card);
    color: var(--text-secondary);

    &.danger {
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.2);
      &:hover {
        background: rgba(239, 68, 68, 0.1);
      }
    }

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
  }
}

/* --- EDITOR AREA (THE PAPER) --- */
.editor-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 60px 20px;
  display: flex;
  justify-content: center;
  background: var(--bg-obsidian);
}

.ultimum-paper {
  outline: none;

  /* A4 Dimensions (approx) */
  width: 210mm;
  min-height: 297mm;

  background: #ffffff;
  border-radius: 4px;
  box-shadow: var(--shadow-premium);
  padding: 25mm; /* Standard margins */
  margin-bottom: 40px;

  /* Typography basics */
  font-family: 'Poppins', sans-serif;
  color: #1a1a1a;
  line-height: 1.7;
  font-size: 11pt;

  direction: ltr;

  /* Placeholder Logic */
  .ProseMirror p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
}

/* --- TIPTAP CONTENT STYLES --- */
.ProseMirror {
  outline: none;

  > * + * {
    margin-top: 1em;
  }

  ul,
  ol {
    padding: 0 1rem;
    padding-inline-start: 1.5rem;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.2;
    font-weight: 700;
    color: #111111;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  code {
    background-color: #f1f1f1;
    color: #e83e8c;
    padding: 0.2em 0.4em;
    border-radius: 4px;
  }

  pre {
    background: #1e1e1e;
    color: #d4d4d4;
    font-family: 'JetBrainsMono', monospace;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.9rem;
    }
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    display: block;
    margin: 2rem auto;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);

    &.ProseMirror-selectednode {
      outline: 3px solid var(--accent-purple);
    }
  }

  blockquote {
    padding-left: 1.5rem;
    border-left: 4px solid var(--accent-purple);
    color: #555555;
    font-style: italic;
    background: #f9f9f9;
    padding: 1rem 1.5rem;
    border-radius: 0 8px 8px 0;
  }

  hr {
    border: none;
    border-top: 2px solid #eeeeee;
    margin: 3rem 0;
  }

  /* --- TABLES --- */
  table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    margin: 1.5rem 0;
    overflow: hidden;
    border: 1px solid #dddddd;

    td,
    th {
      min-width: 1em;
      border: 1px solid #cccccc;
      padding: 12px 15px;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;

      > * {
        margin-bottom: 0;
      }
    }

    th {
      font-weight: 700;
      text-align: left;
      background-color: #f8f9fa;
    }

    .selectedCell:after {
      z-index: 2;
      position: absolute;
      content: '';
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background: rgba(124, 58, 237, 0.1);
      pointer-events: none;
    }

    .column-resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: var(--accent-purple);
      pointer-events: none;
    }
  }

  /* --- TASK LISTS --- */
  ul[data-type='taskList'] {
    list-style: none;
    padding: 0;

    li {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 0.75rem;

      > label {
        flex: 0 0 auto;
        margin-top: 0.3rem;
        user-select: none;
      }

      > div {
        flex: 1 1 auto;
      }
    }

    input[type='checkbox'] {
      cursor: pointer;
      width: 1.2em;
      height: 1.2em;
      accent-color: var(--accent-purple);
    }
  }
}

/* --- BUBBLE MENU --- */
.bubble-menu-content {
  display: flex;
  background-color: var(--bg-surface-elevated);
  padding: 6px;
  border-radius: 12px;
  box-shadow: var(--shadow-premium);
  border: 1px solid var(--border-glass);
  backdrop-filter: blur(15px);
  gap: 4px;

  button {
    border: none;
    background: none;
    color: var(--text-secondary);
    padding: 6px;
    border-radius: 6px;

    &:hover,
    &.is-active {
      background: rgba(255, 255, 255, 0.1);
      color: var(--accent-purple);
    }
  }
}
</style>
