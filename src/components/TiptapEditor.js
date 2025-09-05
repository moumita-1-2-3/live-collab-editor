import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import './TiptapEditor.css';

const TiptapEditor = forwardRef(({ content, onChange, onSelectionChange, placeholder }, ref) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: {
                    depth: 100,
                },
            }),
            CharacterCount.configure({
                limit: 10000,
            }),
            Highlight.configure({
                multicolor: true,
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'tiptap-editor-content',
                'data-placeholder': placeholder || 'Start writing your document here...',
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const text = editor.getText();
            onChange && onChange(html, text);
        },
        onSelectionUpdate: ({ editor }) => {
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to);
            
            if (selectedText.trim() && selectedText.length > 3) {
                const coords = editor.view.coordsAtPos(from);
                onSelectionChange && onSelectionChange({
                    text: selectedText,
                    range: { from, to },
                    position: {
                        x: coords.left,
                        y: coords.top - 60
                    }
                });
            } else {
                onSelectionChange && onSelectionChange(null);
            }
        },
    });

    // Expose editor methods through ref
    useImperativeHandle(ref, () => ({
        getEditor: () => editor,
        getHTML: () => editor?.getHTML(),
        getText: () => editor?.getText(),
        setContent: (content) => editor?.commands.setContent(content),
        replaceRange: (from, to, content) => {
            editor?.chain().focus().deleteRange({ from, to }).insertContent(content).run();
        },
        getSelection: () => {
            const { from, to } = editor?.state.selection || { from: 0, to: 0 };
            return {
                from,
                to,
                text: editor?.state.doc.textBetween(from, to) || ''
            };
        }
    }));

    // Update content when prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, false);
        }
    }, [editor, content]);

    if (!editor) {
        return null;
    }

    return (
        <div className="tiptap-editor">
            {/* Toolbar */}
            <div className="tiptap-toolbar">
                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={editor.isActive('bold') ? 'is-active' : ''}
                        title="Bold"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'is-active' : ''}
                        title="Italic"
                    >
                        <em>I</em>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={editor.isActive('strike') ? 'is-active' : ''}
                        title="Strikethrough"
                    >
                        <s>S</s>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        className={editor.isActive('highlight') ? 'is-active' : ''}
                        title="Highlight"
                    >
                        🖍️
                    </button>
                </div>

                <div className="toolbar-separator"></div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                        title="Heading 1"
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                        title="Heading 2"
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                        title="Heading 3"
                    >
                        H3
                    </button>
                </div>

                <div className="toolbar-separator"></div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={editor.isActive('bulletList') ? 'is-active' : ''}
                        title="Bullet List"
                    >
                        • List
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={editor.isActive('orderedList') ? 'is-active' : ''}
                        title="Numbered List"
                    >
                        1. List
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        className={editor.isActive('taskList') ? 'is-active' : ''}
                        title="Task List"
                    >
                        ☑️ Tasks
                    </button>
                </div>

                <div className="toolbar-separator"></div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={editor.isActive('blockquote') ? 'is-active' : ''}
                        title="Quote"
                    >
                        " Quote
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={editor.isActive('codeBlock') ? 'is-active' : ''}
                        title="Code Block"
                    >
                        {'</>'}
                    </button>
                </div>

                <div className="toolbar-separator"></div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo"
                    >
                        ↶
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo"
                    >
                        ↷
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />

            {/* Status Bar */}
            <div className="tiptap-status-bar">
                <div className="status-info">
                    <span>{editor.storage.characterCount.characters()} characters</span>
                    <span>{editor.storage.characterCount.words()} words</span>
                </div>
            </div>
        </div>
    );
});

TiptapEditor.displayName = 'TiptapEditor';

export default TiptapEditor;
