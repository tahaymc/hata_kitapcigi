import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const COLORS = {
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    green: '#22c55e',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    pink: '#ec4899',
    slate: '#64748b'
};

const RichTextEditor = forwardRef(({ value, onChange, placeholder, className, onKeyDown }, ref) => {
    const editorRef = useRef(null);
    const isInternalUpdate = useRef(false);

    useImperativeHandle(ref, () => ({
        format: (type, val) => {
            const editor = editorRef.current;
            if (!editor) return;

            editor.focus();

            switch (type) {
                case 'bold':
                    document.execCommand('bold', false, null);
                    break;
                case 'italic':
                    document.execCommand('italic', false, null);
                    break;
                case 'color':
                    const hexColor = COLORS[val] || val;
                    document.execCommand('foreColor', false, hexColor);
                    break;
            }
            handleInput(); // Trigger update after format
        },
        focus: () => {
            editorRef.current?.focus();
        }
    }));

    useEffect(() => {
        if (editorRef.current && !isInternalUpdate.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
        // Reset internal flag
        isInternalUpdate.current = false;
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            isInternalUpdate.current = true;
            const html = editorRef.current.innerHTML;
            // Validate: if empty or just <br>, return empty string
            const cleanHtml = html === '<br>' ? '' : html;
            onChange(cleanHtml);
        }
    };

    return (
        <div
            ref={editorRef}
            contentEditable
            className={`overflow-y-auto whitespace-pre-wrap outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 cursor-text ${className}`}
            onInput={handleInput}
            onKeyDown={onKeyDown}
            data-placeholder={placeholder}
            spellCheck={false}
        />
    );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
