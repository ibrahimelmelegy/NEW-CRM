<template>
  <div class="ultimate-editor-container" v-if="editor">
    <!-- STICKY PROFESSIONAL TOOLBAR -->
    <div class="toolbar-wrapper sticky-top">
      <div class="toolbar">
        
        <!-- Group: History -->
        <div class="toolbar-group">
          <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().chain().focus().undo().run()" title="Undo">
            <i class="ri-arrow-go-back-line"></i>
          </button>
          <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().chain().focus().redo().run()" title="Redo">
            <i class="ri-arrow-go-forward-line"></i>
          </button>
        </div>

        <div class="divider"></div>

        <!-- Group: Text Formatting -->
        <div class="toolbar-group">
          <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" title="Bold">
            <i class="ri-bold"></i>
          </button>
          <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" title="Italic">
            <i class="ri-italic"></i>
          </button>
          <button @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'is-active': editor.isActive('underline') }" title="Underline">
            <i class="ri-underline"></i>
          </button>
          <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }" title="Strikethrough">
            <i class="ri-strikethrough"></i>
          </button>
          <button @click="editor.chain().focus().toggleHighlight().run()" :class="{ 'is-active': editor.isActive('highlight') }" title="Highlight">
            <i class="ri-mark-pen-line"></i>
          </button>
        </div>

        <div class="divider"></div>

        <!-- Group: Colors & Headings -->
        <div class="toolbar-group">
          <input 
            type="color" 
            @input="editor.chain().focus().setColor($event.target.value).run()"
            :value="editor.getAttributes('textStyle').color || '#000000'"
            title="Text Color"
            class="color-picker"
          >
          
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
          <button @click="editor.chain().focus().setTextAlign('left').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }" title="Align Left">
            <i class="ri-align-left"></i>
          </button>
          <button @click="editor.chain().focus().setTextAlign('center').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }" title="Align Center">
            <i class="ri-align-center"></i>
          </button>
          <button @click="editor.chain().focus().setTextAlign('right').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }" title="Align Right">
            <i class="ri-align-right"></i>
          </button>
          <button @click="editor.chain().focus().setTextAlign('justify').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }" title="Justify">
            <i class="ri-align-justify"></i>
          </button>
        </div>

        <div class="divider"></div>

        <!-- Group: Lists -->
        <div class="toolbar-group">
          <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }" title="Bullet List">
            <i class="ri-list-unordered"></i>
          </button>
          <button @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }" title="Ordered List">
            <i class="ri-list-ordered"></i>
          </button>
          <button @click="editor.chain().focus().toggleTaskList().run()" :class="{ 'is-active': editor.isActive('taskList') }" title="Task List">
             <i class="ri-checkbox-line"></i>
          </button>
        </div>

        <div class="divider"></div>

        <!-- Group: Insert -->
        <div class="toolbar-group">
          <button @click="addImage" title="Insert Image">
            <i class="ri-image-add-line"></i>
          </button>
           <button @click="setLink" :class="{ 'is-active': editor.isActive('link') }" title="Link">
            <i class="ri-link"></i>
          </button>
          <button @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()" title="Insert Table">
            <i class="ri-table-2"></i>
          </button>
        </div>
      </div>
      
      <!-- SUB-TOOLBAR: TABLE CONTROLS (Conditional) -->
      <div class="sub-toolbar" v-if="editor.isActive('table')">
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
         <button @click="editor.chain().focus().deleteTable().run()" class="danger">Delete Table</button>
      </div>
    </div>

    <!-- BUBBLE MENU -->
    <bubble-menu :editor="editor" :tippy-options="{ duration: 100 }" v-if="editor">
      <div class="bubble-menu-content">
        <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
          <i class="ri-bold"></i>
        </button>
        <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }">
         <i class="ri-italic"></i>
        </button>
        <button @click="editor.chain().focus().toggleHighlight().run()" :class="{ 'is-active': editor.isActive('highlight') }">
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
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Placeholder from '@tiptap/extension-placeholder'

// Props & Emits
const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit,
    Image,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Link.configure({
       openOnClick: false,
    }),
    Underline,
    Subscript,
    Superscript,
    Placeholder.configure({
       placeholder: props.placeholder || 'Start typing your proposal here...',
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// Watch model value for external changes
watch(() => props.modelValue, (newValue) => {
  const isSame = editor.value?.getHTML() === newValue
  if (!isSame && editor.value) {
    editor.value.commands.setContent(newValue, false)
  }
})

// Toolbar Functions
const addImage = () => {
   const url = window.prompt('URL')
   if (url && editor.value) {
     editor.value.chain().focus().setImage({ src: url }).run()
   }
}

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)

  // cancelled
  if (url === null) {
    return
  }

  // empty
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  // update
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const setHeading = (event: Event) => {
   const target = event.target as HTMLSelectElement
   const value = target.value
   if(!editor.value) return;

   if(value === 'p') {
      editor.value.chain().focus().setParagraph().run()
   } else {
      editor.value.chain().focus().toggleHeading({ level: parseInt(value) as any }).run()
   }
}

</script>

<style lang="scss">
/* --- HOST & LAYOUT --- */
.ultimate-editor-container {
  display: flex;
  flex-direction: column;
  background-color: #f3f4f6; /* Gray background behind paper */
  height: 100%;
  min-height: 500px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

/* --- TOOLBAR STYLES --- */
.toolbar-wrapper {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.sticky-top {
  position: sticky;
  top: 0;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
  margin: 0 4px;
  
  &.small {
     height: 16px;
  }
}

button {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background-color: #f3f4f6;
    color: #000;
  }

  &.is-active {
    background-color: #e0e7ff; /* Indigo-100 */
    color: #4f46e5; /* Indigo-600 */
    border-color: #c7d2fe;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
     font-size: 18px;
  }
}

/* Color Picker & Select */
.color-picker {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
}

.heading-select {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  color: #374151;
  outline: none;
  
  &:focus {
     border-color: #4f46e5;
  }
}

/* Sub Toolbar */
.sub-toolbar {
   display: flex;
   align-items: center;
   gap: 6px;
   background: #f9fafb;
   padding: 4px 8px;
   border-radius: 4px;
   font-size: 12px;
   flex-wrap: wrap;

   .label {
      font-weight: 600;
      color: #6b7280;
      margin-right: 4px;
   }

   button {
      padding: 2px 6px;
      font-size: 11px;
      border: 1px solid #d1d5db;
      background: white;
      
      &.danger {
         color: #ef4444;
         border-color: #fecaca;
         &:hover { background: #fee2e2; }
      }
   }
}

/* --- EDITOR AREA (THE PAPER) --- */
.editor-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
}

.ultimum-paper {
  outline: none;
  
  /* A4 Dimensions (approx) */
  width: 210mm; 
  min-height: 297mm;
  
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 25mm; /* Standard margins */
  margin-bottom: 40px;
  
  /* Typography basics */
  font-family: 'Inter', sans-serif;
  color: #1f2937;
  line-height: 1.6;
  font-size: 11pt;

  /* RTL Support - Default to auto, but can be forced if needed */
  direction: ltr; /* Elements will define their own dir via textAlign usually, or global 'dir="auto"' */
  
  /* Placeholder Logic */
  .ProseMirror p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
}

/* --- TIPTAP CONTENT STYLES (Make it look like Word) --- */
.ProseMirror {
  outline: none;

  > * + * {
    margin-top: 0.75em;
  }

  ul, ol {
    padding: 0 1rem;
    padding-inline-start: 1.5rem; /* Better RTL support */
  }

  h1, h2, h3, h4, h5, h6 {
    line-height: 1.1;
    font-weight: 700;
    color: #111827;
  }

  code {
    background-color: rgba(#616161, 0.1);
    color: #616161;
  }

  pre {
    background: #0D0D0D;
    color: #FFF;
    font-family: 'JetBrainsMono', monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    display: block;
    margin: 1rem auto; /* Center by default */

    &.ProseMirror-selectednode {
      outline: 3px solid #68CEF8;
    }
  }

  blockquote {
    padding-left: 1rem;
    border-left: 3px solid #d1d5db; /* Gray-300 */
    border-inline-start: 3px solid #d1d5db;
    border-inline-end: none;
    color: #4b5563;
  }

  hr {
    border: none;
    border-top: 2px solid rgba(#0D0D0D, 0.1);
    margin: 2rem 0;
  }
  
  /* --- TABLES --- */
  table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    margin: 0;
    overflow: hidden;

    td, th {
      min-width: 1em;
      border: 2px solid #ced4da;
      padding: 3px 5px;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;

      > * {
        margin-bottom: 0;
      }
    }

    th {
      font-weight: bold;
      text-align: left;
      background-color: #f1f3f5;
    }

    .selectedCell:after {
      z-index: 2;
      position: absolute;
      content: "";
      left: 0; right: 0; top: 0; bottom: 0;
      background: rgba(200, 200, 255, 0.4);
      pointer-events: none;
    }

    .column-resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: #adf;
      pointer-events: none;
    }
  }

  /* --- TASK LISTS --- */
  ul[data-type="taskList"] {
    list-style: none;
    padding: 0;

    li {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      margin-bottom: 0.5rem;

      > label {
        flex: 0 0 auto;
        margin-top: 0.2rem;
        user-select: none;
      }

      > div {
        flex: 1 1 auto;
      }
    }
    
    input[type="checkbox"] {
        cursor: pointer;
        width: 1.1em;
        height: 1.1em;
    }
  }
}

/* --- BUBBLE MENU --- */
.bubble-menu-content {
  display: flex;
  background-color: #0D0D0D;
  padding: 0.2rem;
  border-radius: 0.5rem;

  button {
    border: none;
    background: none;
    color: #FFF;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0 0.2rem;
    opacity: 0.6;

    &:hover,
    &.is-active {
      opacity: 1;
      background: rgba(255,255,255,0.2);
    }
  }
}
</style>
