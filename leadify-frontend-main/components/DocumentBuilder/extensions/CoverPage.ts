import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CoverPageNode from './CoverPageNode.vue'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        coverPage: {
            insertCoverPage: (options?: any) => ReturnType
        }
    }
}

export const CoverPage = Node.create({
    name: 'coverPage',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            title: { default: 'Executive Proposal' },
            subtitle: { default: 'Prepared exclusively for our valued client' },
            date: { default: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
            preparedBy: { default: 'Leadify Inc.' },
            coverImage: { default: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop' },
            themeColor: { default: '#7849ff' }
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-type="cover-page"]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'cover-page' })]
    },

    addNodeView() {
        return VueNodeViewRenderer(CoverPageNode)
    },

    addCommands() {
        return {
            insertCoverPage: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                })
            },
        }
    },
})
