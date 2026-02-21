import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import PricingTableNodeView from './PricingTableNodeView.vue';

export interface PricingTableOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pricingTable: {
      insertPricingTable: (options?: { items?: any[], taxRate?: number }) => ReturnType;
    };
  }
}

export const PricingTableBlock = Node.create<PricingTableOptions>({
  name: 'pricingTable',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'pricing-table-block',
      },
    };
  },

  addAttributes() {
    return {
      items: {
        default: [
          { description: 'Consulting Services', qty: 1, price: 1500 },
          { description: 'Software License', qty: 12, price: 50 },
        ],
      },
      taxRate: { default: 15 },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pricing-table"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'pricing-table' })];
  },

  addNodeView() {
    return VueNodeViewRenderer(PricingTableNodeView);
  },

  addCommands() {
    return {
      insertPricingTable:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
