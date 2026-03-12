import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import { defineComponent, h } from 'vue';

/**
 * Vue component that renders the signature block inside the editor.
 */
const SignatureBlockView = defineComponent({
  name: 'SignatureBlockView',
  props: {
    node: { type: Object, required: true }
  },
  setup(props) {
    const label = computed(() => props.node.attrs.label || 'Signature');
    const showDate = computed(() => props.node.attrs.showDate !== false);

    return () =>
      h(
        'div',
        {
          class: 'signature-block',
          contenteditable: 'false',
          style: {
            padding: '24px 0',
            margin: '16px 0',
            borderTop: '1px dashed rgba(120, 73, 255, 0.3)',
            userSelect: 'none'
          }
        },
        [
          h(
            'div',
            {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '40px'
              }
            },
            [
              // Signature area
              h('div', { style: { flex: '1' } }, [
                h('div', {
                  style: {
                    borderBottom: '2px solid var(--text-primary, #333)',
                    minWidth: '200px',
                    height: '40px',
                    marginBottom: '6px'
                  }
                }),
                h(
                  'div',
                  {
                    style: {
                      fontSize: '12px',
                      color: 'var(--text-muted, #888)',
                      fontWeight: '600'
                    }
                  },
                  label.value
                )
              ]),
              // Date area
              ...(showDate.value
                ? [
                    h('div', { style: { minWidth: '160px' } }, [
                      h('div', {
                        style: {
                          borderBottom: '2px solid var(--text-primary, #333)',
                          height: '40px',
                          marginBottom: '6px'
                        }
                      }),
                      h(
                        'div',
                        {
                          style: {
                            fontSize: '12px',
                            color: 'var(--text-muted, #888)',
                            fontWeight: '600'
                          }
                        },
                        'Date'
                      )
                    ])
                  ]
                : [])
            ]
          )
        ]
      );
  }
});

export interface SignatureBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    signatureBlock: {
      /**
       * Insert a signature block.
       */
      insertSignatureBlock: (attrs?: { label?: string; showDate?: boolean }) => ReturnType;
    };
  }
}

export const SignatureBlock = Node.create<SignatureBlockOptions>({
  name: 'signatureBlock',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      label: {
        default: 'Signature',
        parseHTML: element => element.getAttribute('data-label') || 'Signature',
        renderHTML: attributes => ({
          'data-label': attributes.label
        })
      },
      showDate: {
        default: true,
        parseHTML: element => element.getAttribute('data-show-date') !== 'false',
        renderHTML: attributes => ({
          'data-show-date': String(attributes.showDate)
        })
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="signature-block"]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes['data-label'] || 'Signature';
    const showDate = HTMLAttributes['data-show-date'] !== 'false';

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'signature-block',
        class: 'signature-block',
        style: 'padding: 24px 0; margin: 16px 0; border-top: 1px dashed #ccc; page-break-inside: avoid;'
      }),
      [
        'div',
        { style: 'display: flex; justify-content: space-between; align-items: flex-end; gap: 40px;' },
        [
          'div',
          { style: 'flex: 1;' },
          ['div', { style: 'border-bottom: 2px solid #333; min-width: 200px; height: 40px; margin-bottom: 6px;' }],
          ['div', { style: 'font-size: 12px; color: #888; font-weight: 600;' }, label]
        ],
        ...(showDate
          ? [
              [
                'div',
                { style: 'min-width: 160px;' },
                ['div', { style: 'border-bottom: 2px solid #333; height: 40px; margin-bottom: 6px;' }],
                ['div', { style: 'font-size: 12px; color: #888; font-weight: 600;' }, 'Date']
              ]
            ]
          : [])
      ]
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(SignatureBlockView as unknown);
  },

  addCommands() {
    return {
      insertSignatureBlock:
        attrs =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              label: attrs?.label || 'Signature',
              showDate: attrs?.showDate !== false
            }
          });
        }
    };
  }
});

export default SignatureBlock;
