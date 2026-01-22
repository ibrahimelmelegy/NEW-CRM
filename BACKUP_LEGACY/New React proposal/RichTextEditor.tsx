
import React, { useRef, useState, useEffect } from 'react';
import { Bold, Heading1, Heading2, Heading3, Image as ImageIcon, Type, List, Table as TableIcon } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className = '', minHeight = '200px' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync content from outside only if editor is not focused to prevent cursor jumping
  useEffect(() => {
    if (editorRef.current && !isFocused) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, arg: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  return (
    <div className={`border-2 rounded-2xl overflow-hidden bg-white transition-all ${isFocused ? 'border-violet-500 ring-4 ring-violet-500/10' : 'border-slate-100 shadow-inner'} ${className}`}>
        <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 flex-wrap">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"><Bold size={16}/></button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'H1'); }} className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"><Heading1 size={16}/></button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'H2'); }} className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"><Heading2 size={16}/></button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'P'); }} className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"><Type size={16}/></button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"><List size={16}/></button>
        </div>
        
        <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="p-6 outline-none prose prose-sm max-w-none text-gray-700 leading-relaxed overflow-y-auto custom-scrollbar"
            style={{ minHeight }}
            data-placeholder={placeholder}
        />
        <style>{`
            [contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: #9ca3af;
                pointer-events: none;
                display: block;
            }
        `}</style>
    </div>
  );
}
