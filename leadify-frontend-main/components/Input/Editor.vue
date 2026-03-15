<template>
  <el-form-item :label="label" :error="errorMessage" class="!mb-6">
    <div class="editor-wrapper border rounded-md" :class="{ 'is-error': errorMessage, 'is-disabled': disabled }">
      <!-- Toolbar -->
      <div v-if="editor && !disabled" class="toolbar p-2 border-b bg-gray-50 flex gap-2 flex-wrap">
        <button
          :class="{ 'is-active': editor.isActive('bold') }"
          title="Bold"
          type="button"
          @click.prevent="editor.chain().focus().toggleBold().run()"
        >
          <i class="ri-bold"></i>
        </button>
        <button
          :class="{ 'is-active': editor.isActive('italic') }"
          title="Italic"
          type="button"
          @click.prevent="editor.chain().focus().toggleItalic().run()"
        >
          <i class="ri-italic"></i>
        </button>
        <button
          :class="{ 'is-active': editor.isActive('underline') }"
          title="Underline"
          type="button"
          @click.prevent="editor.chain().focus().toggleUnderline().run()"
        >
          <i class="ri-underline"></i>
        </button>
        <button
          :class="{ 'is-active': editor.isActive('strike') }"
          title="Strikethrough"
          type="button"
          @click.prevent="editor.chain().focus().toggleStrike().run()"
        >
          <i class="ri-strikethrough"></i>
        </button>

        <div class="w-px h-6 bg-gray-300 mx-1"></div>

        <button
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
          title="Align Left"
          type="button"
          @click.prevent="editor.chain().focus().setTextAlign('left').run()"
        >
          <i class="ri-align-left"></i>
        </button>
        <button
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
          title="Align Center"
          type="button"
          @click.prevent="editor.chain().focus().setTextAlign('center').run()"
        >
          <i class="ri-align-center"></i>
        </button>
        <button
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
          title="Align Right"
          type="button"
          @click.prevent="editor.chain().focus().setTextAlign('right').run()"
        >
          <i class="ri-align-right"></i>
        </button>

        <div class="w-px h-6 bg-gray-300 mx-1"></div>

        <button
          :class="{ 'is-active': editor.isActive('bulletList') }"
          title="Bullet List"
          type="button"
          @click.prevent="editor.chain().focus().toggleBulletList().run()"
        >
          <i class="ri-list-unordered"></i>
        </button>
        <button
          :class="{ 'is-active': editor.isActive('orderedList') }"
          title="Ordered List"
          type="button"
          @click.prevent="editor.chain().focus().toggleOrderedList().run()"
        >
          <i class="ri-list-ordered"></i>
        </button>

        <div class="w-px h-6 bg-gray-300 mx-1"></div>

        <button title="Insert Image" type="button" @click.prevent="triggerImageUpload">
          <i class="ri-image-add-line"></i>
        </button>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleImageUpload" />

        <button :class="{ 'is-active': editor.isActive('link') }" title="Link" type="button" @click.prevent="setLink">
          <i class="ri-link"></i>
        </button>
      </div>

      <!-- Editor Content -->
      <editor-content :editor="editor" class="editor-content p-4 min-h-[160px]" />
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import logger from '~/utils/logger';

const props = defineProps({
  type: {
    type: String,
    default: 'text',
    required: false
  },
  name: {
    type: String,
    default: '',
    required: false
  },
  append: {
    type: Boolean
  },
  value: {
    type: String,
    default: '',
    required: false
  },
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false,
    required: false
  },
  optional: {
    type: Boolean,
    default: false,
    required: false
  },
  model: {
    type: String // Used for upload path
  }
});

const {
  value: inputValue,
  errorMessage,
  handleBlur,
  handleChange
} = useField(props.name, undefined, {
  initialValue: props.value
});

const fileInput = ref<HTMLInputElement | null>(null);

const editor = useEditor({
  content: props.value || '',
  editable: !props.disabled,
  extensions: [
    StarterKit,
    Image,
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    Link.configure({
      openOnClick: false
    }),
    Placeholder.configure({
      placeholder: props.placeholder || `Enter ${props.label}`
    })
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none'
    }
  },
  onUpdate: ({ editor }) => {
    const content = editor.getHTML();
    // If content is just empty paragraph, treat as empty string
    inputValue.value = content === '<p></p>' ? '' : content;
  },
  onBlur: ({ event }) => {
    handleBlur(event);
  }
});

// Watch for external value changes
watch(
  () => props.value,
  newValue => {
    const isSame = editor.value?.getHTML() === newValue;
    if (!isSame && editor.value) {
      editor.value.commands.setContent(newValue || '', { emitUpdate: false });
    }
  }
);

watch(
  () => props.disabled,
  val => {
    editor.value?.setEditable(!val);
  }
);

// Image Upload Logic
const triggerImageUpload = () => {
  fileInput.value?.click();
};

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file && props.model) {
    try {
      const filePath = await uploadFile({ file });
      const url = useRuntimeConfig().public.BUCKET_URL + filePath;

      if (editor.value) {
        editor.value.chain().focus().setImage({ src: url }).run();
      }
    } catch (error) {
      logger.error('Upload failed:', error);
      // You might want to show a toast/notification here
    }
  } else if (file) {
    // Fallback if no model prop is provided (e.g. createObjectURL)
    const url = URL.createObjectURL(file);
    if (editor.value) {
      editor.value.chain().focus().setImage({ src: url }).run();
    }
  }

  // Reset input
  target.value = '';
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
</script>

<style lang="scss" scoped>
.editor-wrapper {
  background-color: white;
  transition: border-color 0.2s;

  &.is-error {
    border-color: var(--el-color-danger);
  }

  &.is-disabled {
    background-color: var(--el-disabled-bg-color);
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.toolbar button {
  padding: 4px;
  border-radius: 4px;
  color: #606266;

  &:hover {
    background-color: #f2f3f5;
    color: var(--el-color-primary);
  }

  &.is-active {
    background-color: #ecf5ff;
    color: var(--el-color-primary);
  }
}

:deep(.ProseMirror) {
  min-height: 160px;
  outline: none;

  p.is-editor-empty:first-child::before {
    color: #a8abb2;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 10px 0;

    &.ProseMirror-selectednode {
      outline: 2px solid var(--el-color-primary);
    }
  }
}
</style>
