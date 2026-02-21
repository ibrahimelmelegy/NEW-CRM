import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import { defineComponent, h } from 'vue';

/**
 * Vue component that renders the variable badge inside the editor.
 * Displayed as an inline purple chip, e.g. {{client.name}}.
 */
const VariableNodeView = defineComponent({
  name: 'VariableNodeView',
  props: {
    node: { type: Object, required: true }
  },
  setup(props) {
    const variableName = computed(() => props.node.attrs.variableName || 'variable');

    return () =>
      h(
        'span',
        {
          class: 'variable-node',
          contenteditable: 'false',
          'data-variable': variableName.value,
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '1px 8px',
            borderRadius: '12px',
            background: 'rgba(120, 73, 255, 0.15)',
            color: '#7849ff',
            fontSize: '0.85em',
            fontWeight: '600',
            fontFamily: 'monospace',
            border: '1px solid rgba(120, 73, 255, 0.3)',
            lineHeight: '1.6',
            userSelect: 'none',
            cursor: 'default',
            whiteSpace: 'nowrap'
          }
        },
        `{{${variableName.value}}}`
      );
  }
});

export interface VariableNodeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variableNode: {
      /**
       * Insert a template variable node at the current cursor position.
       */
      insertVariable: (variableName: string) => ReturnType;
    };
  }
}

export const VariableNode = Node.create<VariableNodeOptions>({
  name: 'variableNode',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      variableName: {
        default: 'variable',
        parseHTML: element => element.getAttribute('data-variable') || 'variable',
        renderHTML: attributes => ({
          'data-variable': attributes.variableName
        })
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="variable"]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'variable',
        class: 'variable-node'
      }),
      `{{${HTMLAttributes['data-variable'] || 'variable'}}}`
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(VariableNodeView as any);
  },

  addCommands() {
    return {
      insertVariable:
        (variableName: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { variableName }
          });
        }
    };
  },

  /**
   * Allow typing {{ to trigger variable insertion via an input rule.
   * When the user types {{ followed by a variable path and }}, it converts
   * to a VariableNode. Example: {{client.name}}
   */
  addInputRules() {
    return [
      {
        find: /\{\{([a-zA-Z0-9_.]+)\}\}$/,
        handler: ({ state, range, match }) => {
          const variableName = match[1];
          if (!variableName) return;

          const { tr } = state;
          tr.replaceWith(range.from, range.to, this.type.create({ variableName }));
        }
      }
    ];
  }
});

export default VariableNode;
