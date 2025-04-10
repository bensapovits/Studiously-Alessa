import React, { useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { NotionLikeKit, editorStyles } from '../lib/editor';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Highlighter,
  Slash,
  Type
} from 'lucide-react';

interface NotionEditorProps {
  content?: string;
  onChange?: (content: string) => void;
}

export default function NotionEditor({ content = '', onChange }: NotionEditorProps) {
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({ x: 0, y: 0 });

  const editor = useEditor({
    extensions: [NotionLikeKit],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onKeyDown: ({ event }) => {
      if (event.key === '/') {
        const { view } = editor;
        const coords = view.coordsAtPos(view.state.selection.from);
        setCommandMenuPosition({ x: coords.left, y: coords.bottom });
        setShowCommandMenu(true);
      }
    }
  });

  if (!editor) {
    return null;
  }

  const handleFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run();
  };

  const commandItems = [
    {
      title: 'Heading 1',
      icon: <Heading1 className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
      title: 'Heading 2',
      icon: <Heading2 className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      title: 'Heading 3',
      icon: <Heading3 className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      title: 'Bullet List',
      icon: <List className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleBulletList().run()
    },
    {
      title: 'Numbered List',
      icon: <ListOrdered className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleOrderedList().run()
    },
    {
      title: 'Task List',
      icon: <CheckSquare className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleTaskList().run()
    }
  ];

  return (
    <div className="relative">
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center space-x-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-gray-100 ${
              editor.isActive('bold') ? 'bg-gray-100' : ''
            }`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-gray-100 ${
              editor.isActive('italic') ? 'bg-gray-100' : ''
            }`}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-gray-100 ${
              editor.isActive('underline') ? 'bg-gray-100' : ''
            }`}
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1 rounded hover:bg-gray-100 ${
              editor.isActive('code') ? 'bg-gray-100' : ''
            }`}
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1 rounded hover:bg-gray-100 ${
              editor.isActive('highlight') ? 'bg-gray-100' : ''
            }`}
          >
            <Highlighter className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <div className="relative group">
            <button className="p-1 rounded hover:bg-gray-100">
              <Type className="h-4 w-4" />
            </button>
            <div className="absolute hidden group-hover:block top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[100px]">
              <button
                onClick={() => handleFontSize('12px')}
                className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
              >
                Small
              </button>
              <button
                onClick={() => handleFontSize('16px')}
                className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
              >
                Normal
              </button>
              <button
                onClick={() => handleFontSize('20px')}
                className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
              >
                Large
              </button>
            </div>
          </div>
        </BubbleMenu>
      )}

      {showCommandMenu && (
        <div
          className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 w-64"
          style={{
            left: commandMenuPosition.x,
            top: commandMenuPosition.y
          }}
        >
          <div className="p-2 border-b border-gray-200 flex items-center">
            <Slash className="h-4 w-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Type a command"
              className="w-full focus:outline-none text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowCommandMenu(false);
                }
              }}
            />
          </div>
          <div className="py-1">
            {commandItems.map((item, index) => (
              <button
                key={index}
                className="w-full px-3 py-2 text-sm text-left flex items-center hover:bg-gray-100"
                onClick={() => {
                  item.command();
                  setShowCommandMenu(false);
                }}
              >
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <EditorContent
        editor={editor}
        className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none"
        onClick={() => setShowCommandMenu(false)}
      />

      <style dangerouslySetInnerHTML={{
        __html: Object.entries(editorStyles).map(([selector, styles]) => `
          ${selector} {
            ${Object.entries(styles).map(([prop, value]) => `${prop}: ${value};`).join('\n')}
          }
        `).join('\n')
      }} />
    </div>
  );
}