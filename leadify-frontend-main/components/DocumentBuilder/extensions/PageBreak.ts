import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import { defineComponent, h } from 'vue';

/**
 * Vue component that renders the page break inside the editor.
 */
const PageBreakView = defineComponent({
  name: 'PageBreakView',
  setup() {
    return () =>
      h(
        'div',
        {
          class: 'page-break-node',
          contenteditable: 'false',
          style: {
            margin: '20px 0',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            cursor: 'default'
          }
        },
        [
          // Left dashed line
          h('div', {
            style: {
              flex: '1',
              height: '0',
              borderTop: '2px dashed rgba(120, 73, 255, 0.3)'
            }
          }),
          // Label
          h(
            'span',
            {
              style: {
                padding: '2px 12px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#7849ff',
                background: 'rgba(120, 73, 255, 0.08)',
                borderRadius: '10px',
                border: '1px solid rgba(120, 73, 255, 0.2)',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }
            },
            'Page Break'
          ),
          // Right dashed line
          h('div', {
            style: {
              flex: '1',
              height: '0',
              borderTop: '2px dashed rgba(120, 73, 255, 0.3)'
            }
          })
        ]
      );
  }
});

export interface PageBreakOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Insert a page break.
       */
      insertPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create<PageBreakOptions>({
  name: 'pageBreak',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'page-break',
        class: 'page-break-node',
        style: 'page-break-before: always; margin: 20px 0; border-top: 2px dashed #ccc; text-align: center; position: relative; padding: 8px 0;'
      }),
      [
        'span',
        {
          style:
            'background: #f5f5f5; padding: 2px 12px; font-size: 11px; color: #999; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px;'
        },
        'Page Break'
      ]
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(PageBreakView as unknown);
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name
          });
        }
    };
  },

  // Keyboard shortcut: Ctrl+Enter for page break
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.insertPageBreak()
    };
  }
});

export default PageBreak;
