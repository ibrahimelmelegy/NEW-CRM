import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';

/**
 * MentionList component for the Tiptap Mention extension.
 * Handles the display and selection of mention suggestions.
 */
export const MentionList = forwardRef((props: { items: string[]; command: (id: { id: string }) => void }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];

        if (item) {
            props.command({ id: item });
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[180px] p-1 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5">
            {props.items.length ? (
                props.items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => selectItem(index)}
                        className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${index === selectedIndex
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100'
                            }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${index === selectedIndex ? 'bg-white' : 'bg-violet-400 opacity-50'}`}></div>
                        {item}
                    </button>
                ))
            ) : (
                <div className="px-3 py-2 text-sm text-slate-400 italic">No results found</div>
            )}
        </div>
    );
});

MentionList.displayName = 'MentionList';

/**
 * Suggestion configuration for the Tiptap Mention extension.
 * Defines how items are loaded, filtered, and rendered.
 */
export const suggestion = {
    items: ({ query }: { query: string }) => {
        // These are common variables used in CRM proposals
        const variables = [
            'ClientName',
            'ClientCompany',
            'ClientEmail',
            'ProposalTitle',
            'ProposalTotal',
            'ProjectScope',
            'ValidUntil',
            'Date',
            'RefNumber',
            'Currency',
        ];

        return variables
            .filter(item => item.toLowerCase().startsWith(query.toLowerCase()))
            .slice(0, 5);
    },

    render: () => {
        let component: ReactRenderer;
        let popup: TippyInstance[];

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(MentionList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }

                return (component.ref as any)?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};
