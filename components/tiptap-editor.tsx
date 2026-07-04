'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface TipTapEditorProps {
  content: string
  onChange: (plainText: string) => void
  maxWords?: number
}

export default function TipTapEditor({
  content,
  onChange,
  maxWords = 120
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const plain = html.replace(/<[^>]*>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
      onChange(plain)
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getText()) {
      editor.commands.setContent(content)
    }
  }, [content])

  const wordCount = editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0
  const overLimit = wordCount > maxWords

  return (
    <div style={{
      border: `1px solid ${overLimit ? '#ef4444' : '#e5e7eb'}`,
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#ffffff',
    }}>
      {/* Toolbar — bold and italic only */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '6px 8px',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb',
      }}>
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            background: editor?.isActive('bold') ? '#0f766e' : '#ffffff',
            color: editor?.isActive('bold') ? '#ffffff' : '#374151',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >B</button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            background: editor?.isActive('italic') ? '#0f766e' : '#ffffff',
            color: editor?.isActive('italic') ? '#ffffff' : '#374151',
            fontStyle: 'italic',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >I</button>
      </div>

      {/* Editor area */}
      <div style={{ padding: '12px', minHeight: '120px' }}>
        <EditorContent editor={editor} />
      </div>

      {/* Word count */}
      <div style={{
        padding: '4px 12px',
        borderTop: '1px solid #e5e7eb',
        fontSize: '12px',
        color: overLimit ? '#ef4444' : '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{wordCount} words</span>
        <span>{overLimit ? `${wordCount - maxWords} over limit` : `${maxWords - wordCount} remaining`}</span>
      </div>
    </div>
  )
}
