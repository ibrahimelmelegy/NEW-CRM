<template>
  <div
    :class="[
      'border-2 rounded-2xl overflow-hidden bg-white transition-all focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 border-slate-100 shadow-inner'
    ]"
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

      <!-- Font Size -->
      <select
        class="bg-transparent text-sm border-none focus:ring-0 cursor-pointer text-gray-600"
        :value="currentFontSize"
        @change="onFontSizeChange"
      >
        <option v-for="size in fontSizes" :key="size" :value="size">{{ size }}</option>
      </select>

      <div class="w-px h-4 bg-gray-300 mx-1"></div>
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
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-gray-200 text-black': editor.isActive('subscript') }]"
        title="Subscript"
        @click="editor.chain().focus().toggleSubscript().run()"
      >
        <SubIcon :size="16" />
      </button>
      <button
        :class="['p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors', { 'bg-gray-200 text-black': editor.isActive('superscript') }]"
        title="Superscript"
        @click="editor.chain().focus().toggleSuperscript().run()"
      >
        <SupIcon :size="16" />
      </button>
      <input
        type="color"
        :value="editor.getAttributes('textStyle').color || '#000000'"
        class="w-8 h-8 p-0 border-0 rounded cursor-pointer ml-1"
        title="Color"
        @input="onColorChange"
      />

      <!-- Alignment & Direction -->
      <button
        :class="[
          'p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors',
          { 'bg-gray-200 text-black': editor.isActive({ textAlign: 'left' }) }
        ]"
        title="Align Left (LTR)"
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
        title="Align Right (RTL)"
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

      <input ref="fileInputRef" type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
      <button
        class="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
        title="Upload Image"
        @click="($refs.fileInputRef as HTMLInputElement)?.click()"
      >
        <ImageIcon :size="16" />
      </button>

      <div class="w-px h-4 bg-gray-300 mx-1"></div>

      <!-- Utils -->
      <button class="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Copy as Markdown" @click="copyMarkdown">
        <Copy :size="16" />
      </button>
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
      <span v-if="maxLength">/ {{ maxLength }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import ImageExt from '@tiptap/extension-image';
import LinkExt from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import HighlightExt from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import SubscriptExt from '@tiptap/extension-subscript';
import SuperscriptExt from '@tiptap/extension-superscript';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Extension } from '@tiptap/core';

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
  Highlighter,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Copy
} from 'lucide-vue-next';

import { ElNotification } from 'element-plus';

// ---- Inline FontSize extension (avoids external dependency) ----
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            }
          }
        }
      }
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: unknown) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }: unknown) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        }
    } as unknown;
  }
});

// ---- Props ----
export interface MentionItem {
  id: string;
  label: string;
}

interface Props {
  modelValue: string;
  placeholder?: string;
  maxLength?: number;
  mentionItems?: MentionItem[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Write something...',
  maxLength: undefined,
  mentionItems: () => []
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// ---- Refs ----
const fileInputRef = ref<HTMLInputElement | null>(null);

// ---- Font sizes ----
const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px'];

// ---- Mention suggestion (inline, uses VueRenderer + tippy) ----
// We define the suggestion config inline to avoid external dependency on @tiptap/extension-mention.
// If @tiptap/extension-mention is installed, you can enable it below.
// For now, mention support is stubbed - install the package and uncomment to enable.

// ---- Build extensions list ----
const buildExtensions = () => {
  const extensions: Record<string, unknown>[] = [
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
    SubscriptExt,
    SuperscriptExt,
    Color,
    TextStyle,
    FontSize,
    Placeholder.configure({ placeholder: props.placeholder }),
    CharacterCount.configure(props.maxLength ? { limit: props.maxLength } : {})
  ];

  // Dynamically add Mention extension if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MentionModule = require('@tiptap/extension-mention');
    const Mention = MentionModule.default || MentionModule;

    // Build suggestion configuration using VueRenderer + tippy
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { VueRenderer } = require('@tiptap/vue-3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tippy = require('tippy.js').default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ProposalMentionList = require('./ProposalMentionList.vue').default;

    const defaultMentionVariables = [
      'ClientName',
      'ClientCompany',
      'ClientEmail',
      'ProposalTitle',
      'ProposalTotal',
      'ProjectScope',
      'ValidUntil',
      'Date',
      'RefNumber',
      'Currency'
    ];

    const suggestion = {
      items: ({ query }: { query: string }) => {
        // Use mentionItems prop if provided, otherwise use defaults
        const variables = props.mentionItems.length > 0 ? props.mentionItems.map(item => item.label) : defaultMentionVariables;

        return variables.filter(item => item.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5);
      },
      render: () => {
        let component: unknown;
        let popup: Record<string, unknown>[];

        return {
          onStart: (renderProps: unknown) => {
            component = new VueRenderer(ProposalMentionList, {
              props: renderProps,
              editor: renderProps.editor
            });

            if (!renderProps.clientRect) return;

            popup = tippy('body', {
              getReferenceClientRect: renderProps.clientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start'
            });
          },
          onUpdate(renderProps: unknown) {
            component.updateProps(renderProps);
            if (!renderProps.clientRect) return;
            popup[0].setProps({ getReferenceClientRect: renderProps.clientRect });
          },
          onKeyDown(renderProps: unknown) {
            if (renderProps.event.key === 'Escape') {
              popup[0].hide();
              return true;
            }
            return component.ref?.onKeyDown(renderProps);
          },
          onExit() {
            popup[0].destroy();
            component.destroy();
          }
        };
      }
    };

    extensions.push(
      Mention.configure({
        HTMLAttributes: { class: 'mention text-violet-600 font-semibold bg-violet-50 px-1 rounded' },
        suggestion
      })
    );
  } catch {
    // @tiptap/extension-mention not installed - mention support disabled
    console.warn('[ProposalRichTextEditor] @tiptap/extension-mention not installed. Mention support is disabled.');
  }

  // Dynamically add Markdown extension if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MarkdownModule = require('tiptap-markdown');
    const Markdown = MarkdownModule.Markdown || MarkdownModule.default || MarkdownModule;
    extensions.push(Markdown);
  } catch {
    // tiptap-markdown not installed - markdown paste support disabled
    console.warn('[ProposalRichTextEditor] tiptap-markdown not installed. Markdown paste support is disabled.');
  }

  return extensions;
};

// ---- Editor ----
const editor = useEditor({
  content: props.modelValue,
  extensions: buildExtensions(),
  editorProps: {
    attributes: {
      class: 'p-4 outline-none prose prose-sm max-w-none text-gray-700 leading-relaxed overflow-y-auto custom-scrollbar focus:outline-none',
      style: 'min-height: 200px;'
    }
  },
  onUpdate: () => {
    if (editor.value) {
      emit('update:modelValue', editor.value.getHTML());
    }
  }
});

// ---- Computed ----
const currentFontSize = computed(() => {
  if (!editor.value) return '16px';
  return editor.value.getAttributes('textStyle').fontSize || '16px';
});

// ---- Watch for external value changes ----
watch(
  () => props.modelValue,
  newValue => {
    if (!editor.value) return;
    if (newValue !== editor.value.getHTML()) {
      if (editor.value.isEmpty && newValue) {
        editor.value.commands.setContent(newValue);
      } else if (newValue === '' && !editor.value.isEmpty) {
        editor.value.commands.clearContent();
      }
    }
  }
);

// ---- Cleanup ----
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

// ---- Methods ----
const onFontSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  if (editor.value) {
    (editor.value.chain().focus() as unknown).setFontSize(target.value).run();
  }
};

const onColorChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (editor.value) {
    editor.value.chain().focus().setColor(target.value).run();
  }
};

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

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !editor.value) return;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'PROPOSAL');

    const response = await useApiFetch('upload', 'POST', formData as unknown, false, true);

    if (response.success && response.body) {
      const fileName = response.body;
      const config = useRuntimeConfig();
      const url = `${config.public.API_BASE_URL}assets/${fileName}`;
      editor.value.chain().focus().setImage({ src: url }).run();
      ElNotification({ type: 'success', title: 'Success', message: 'Image uploaded!' });
    } else {
      throw new Error('Upload failed');
    }
  } catch {
    ElNotification({ type: 'error', title: 'Error', message: 'Failed to upload image' });
  }

  target.value = '';
};

const copyMarkdown = () => {
  if (!editor.value) return;

  // If tiptap-markdown is available, use its getMarkdown()
  try {
    const markdown = (editor.value.storage as unknown).markdown?.getMarkdown();
    if (markdown) {
      navigator.clipboard.writeText(markdown);
      ElNotification({ type: 'success', title: 'Copied', message: 'Copied as Markdown!' });
      return;
    }
  } catch {
    // fallback
  }

  // Fallback: copy as HTML
  navigator.clipboard.writeText(editor.value.getHTML());
  ElNotification({ type: 'success', title: 'Copied', message: 'Copied as HTML!' });
};
</script>

<style>
/* TipTap Editor Styles */
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
/* Override prose-sm if it interferes */
.prose h1,
.prose h2,
.prose h3 {
  margin: unset;
  font-weight: unset;
  font-size: unset;
}
/* Mention styling */
.mention {
  color: #7c3aed;
  font-weight: 600;
  background-color: #f5f3ff;
  padding: 0 0.25rem;
  border-radius: 0.25rem;
}
</style>
