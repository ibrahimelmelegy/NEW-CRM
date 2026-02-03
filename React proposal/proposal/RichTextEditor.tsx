
import React, { useEffect, useRef } from 'react';
// @ts-ignore
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
// @ts-ignore
import FontSize from 'tiptap-extension-font-size';

import Mention from '@tiptap/extension-mention';
import { Markdown } from 'tiptap-markdown';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Undo, Redo, Link as LinkIcon,
  Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table as TableIcon, Plus, Trash2, CheckSquare,
  Highlighter, Subscript as SubIcon, Superscript as SupIcon,
  Copy
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '@/api';
import toast from 'react-hot-toast';
import { suggestion } from './MentionList';
import 'tippy.js/dist/tippy.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const promise = (async () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'PROPOSAL');

      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        const fileName = response.data.body;
        const url = `/assets/${fileName}`;
        editor.chain().focus().setImage({ src: url }).run();
      } else {
        throw new Error('Upload failed');
      }
    })();

    toast.promise(promise, {
      loading: 'Uploading image...',
      success: 'Image uploaded!',
      error: 'Failed to upload image',
    });

    event.target.value = '';
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const copyMarkdown = () => {
    const markdown = editor.storage.markdown.getMarkdown();
    navigator.clipboard.writeText(markdown);
    toast.success('Copied as Markdown!');
  }

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px'];


  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 flex-wrap sticky top-0 z-10">
      {/* Headings */}
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('heading', { level: 1 }) && 'bg-gray-200 text-black font-bold border-gray-400')} title="Heading 1">H1</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('heading', { level: 2 }) && 'bg-gray-200 text-black font-bold border-gray-400')} title="Heading 2">H2</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('heading', { level: 3 }) && 'bg-gray-200 text-black font-bold border-gray-400')} title="Heading 3">H3</button>

      <div className="w-px h-4 bg-gray-300 mx-1"></div>

      {/* Font Size */}
      <select
        onChange={e => editor.chain().focus().setFontSize(e.target.value).run()}
        className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer text-gray-600"
        value={editor.getAttributes('textStyle').fontSize || '16px'}
      >
        {fontSizes.map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>

      <div className="w-px h-4 bg-gray-300 mx-1"></div>
      <div className="w-px h-4 bg-gray-300 mx-1"></div>

      {/* Text Formatting */}
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('bold') && 'bg-gray-200 text-black')} title="Bold"><Bold size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('italic') && 'bg-gray-200 text-black')} title="Italic"><Italic size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('underline') && 'bg-gray-200 text-black')} title="Underline"><UnderlineIcon size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('strike') && 'bg-gray-200 text-black')} title="Strikethrough"><Strikethrough size={16} /></button>

      {/* Advanced Formatting */}
      <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('highlight') && 'bg-yellow-200 text-black')} title="Highlight"><Highlighter size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleSubscript().run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('subscript') && 'bg-gray-200 text-black')} title="Subscript"><SubIcon size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleSuperscript().run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('superscript') && 'bg-gray-200 text-black')} title="Superscript"><SupIcon size={16} /></button>
      <input
        type="color"
        onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
        value={editor.getAttributes('textStyle').color || '#000000'}
        className="w-8 h-8 p-0 border-0 rounded cursor-pointer ml-1"
        title="Color"
      />



      {/* Alignment & Direction */}
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive({ textAlign: 'left' }) && 'bg-gray-200 text-black')} title="Align Left (LTR)"><AlignLeft size={16} /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive({ textAlign: 'center' }) && 'bg-gray-200 text-black')} title="Align Center"><AlignCenter size={16} /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive({ textAlign: 'right' }) && 'bg-gray-200 text-black')} title="Align Right (RTL)"><AlignRight size={16} /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive({ textAlign: 'justify' }) && 'bg-gray-200 text-black')} title="Justify"><AlignJustify size={16} /></button>

      <div className="w-px h-4 bg-gray-300 mx-1"></div>

      {/* Lists */}
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('bulletList') && 'bg-gray-200 text-black')} title="Bullet List"><List size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('orderedList') && 'bg-gray-200 text-black')} title="Ordered List"><ListOrdered size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('taskList') && 'bg-gray-200 text-black')} title="Task List"><CheckSquare size={16} /></button>

      <div className="w-px h-4 bg-gray-300 mx-1"></div>

      {/* Tables */}
      <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Insert Table"><TableIcon size={16} /></button>
      {editor.isActive('table') && (
        <>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Add Column"><Plus size={14} className="rotate-90" /></button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Delete Column"><Trash2 size={14} className="rotate-90" /></button>
          <button onClick={() => editor.chain().focus().addRowAfter().run()} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Add Row"><Plus size={14} /></button>
          <button onClick={() => editor.chain().focus().deleteRow().run()} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Delete Row"><Trash2 size={14} /></button>
        </>
      )}

      <div className="w-px h-4 bg-gray-300 mx-1"></div>

      {/* Media & Links */}
      <button onClick={setLink} className={clsx("p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors", editor.isActive('link') && 'bg-gray-200 text-black')} title="Link"><LinkIcon size={16} /></button>

      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
      <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Upload Image"><ImageIcon size={16} /></button>

      <div className="w-px h-4 bg-gray-300 mx-1"></div>

      {/* Utils */}
      <button onClick={copyMarkdown} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Copy as Markdown"><Copy size={16} /></button>
      <button onClick={() => editor.chain().focus().undo().run()} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Undo"><Undo size={16} /></button>
      <button onClick={() => editor.chain().focus().redo().run()} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Redo"><Redo size={16} /></button>
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className = '', minHeight = '200px' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Typography,
      Subscript,
      Superscript,
      Color,
      TextStyle,
      FontFamily,
      Placeholder.configure({ placeholder: placeholder || 'Write something...' }),
      CharacterCount,
      Mention.configure({
        HTMLAttributes: { class: 'mention text-violet-600 font-semibold bg-violet-50 px-1 rounded' },
        suggestion,
      }),
      Markdown,
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'p-4 outline-none prose prose-sm max-w-none text-gray-700 leading-relaxed overflow-y-auto custom-scrollbar focus:outline-none',
        style: `min-height: ${minHeight};`
      }
    }
  });

  // Sync content from outside
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (editor.isEmpty && value) {
        editor.commands.setContent(value);
      } else if (value === '' && !editor.isEmpty) {
        editor.commands.clearContent();
      }
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={`border-2 rounded-2xl overflow-hidden bg-white transition-all focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 border-slate-100 shadow-inner ${className}`}>
      <MenuBar editor={editor} />

      <EditorContent editor={editor} />

      <div className="bg-gray-50 border-t border-gray-100 px-4 py-1 text-xs text-gray-400 flex justify-end gap-3">
        <span>{editor.storage.characterCount.words()} words</span>
        <span>{editor.storage.characterCount.characters()} characters</span>
      </div>

      <style>{`
            .ProseMirror p.is-editor-empty:first-child::before {
                color: #9ca3af;
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
            .ProseMirror td, .ProseMirror th {
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
                content: "";
                left: 0; right: 0; top: 0; bottom: 0;
                background: rgba(200, 200, 255, 0.4);
                pointer-events: none;
            }
            ul[data-type="taskList"] {
                list-style: none;
                padding: 0;
            }
            ul[data-type="taskList"] li {
                display: flex;
                align-items: center;
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
            .prose h1, .prose h2, .prose h3 {
                margin: unset;
                font-weight: unset;
                font-size: unset;
            }

        `}</style>
    </div>
  );
};
