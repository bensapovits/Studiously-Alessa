import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';

// Create a custom extension for font size
const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`
              };
            }
          }
        }
      }
    ];
  },

  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      }
    };
  }
});

export const NotionLikeKit = Extension.create({
  name: 'notionLikeKit',

  addExtensions() {
    return [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: false, // Disable default bullet list to use our custom config
        listItem: false // Disable default list item to use our custom config
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc ml-4'
        },
        keepMarks: true,
        keepAttributes: true
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'my-1'
        }
      }),
      Highlight,
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Placeholder.configure({
        placeholder: 'Type your notes here...',
        showOnlyWhenEditable: true
      }),
      TextStyle,
      Underline,
      FontSize
    ];
  }
});

export const editorStyles = {
  '.ProseMirror': {
    'min-height': '100%',
    'height': '100%',
    'padding': '1rem',
    'background-color': '#ffffff',
    'outline': 'none',
    'p': {
      'margin': '0.5em 0'
    },
    'h1': {
      'font-size': '1.875em',
      'font-weight': '600',
      'margin': '1em 0 0.5em',
      'color': '#111827'
    },
    'h2': {
      'font-size': '1.5em',
      'font-weight': '600',
      'margin': '0.83em 0',
      'color': '#1F2937'
    },
    'h3': {
      'font-size': '1.25em',
      'font-weight': '600',
      'margin': '0.67em 0',
      'color': '#374151'
    },
    'ul': {
      'padding-left': '1.5em',
      'margin': '0.5em 0',
      'list-style-type': 'disc',
      'li': {
        'margin': '0.2em 0'
      },
      'p': {
        'margin': '0'
      }
    },
    'ol': {
      'padding-left': '1.5em',
      'margin': '0.5em 0'
    },
    'ul[data-type="taskList"]': {
      'list-style': 'none',
      'padding': '0',
      'p': {
        'margin': '0'
      },
      'li': {
        'display': 'flex',
        'align-items': 'center',
        '> label': {
          'margin-right': '0.5em',
          'user-select': 'none'
        },
        '> div': {
          'flex': '1',
          '> p': {
            'margin': '0'
          }
        }
      },
      'input[type="checkbox"]': {
        'cursor': 'pointer'
      }
    },
    'mark': {
      'background-color': '#fef3c7',
      'color': '#92400e'
    },
    'u': {
      'text-decoration': 'underline'
    },
    'code': {
      'background-color': '#f3f4f6',
      'color': '#111827',
      'padding': '0.2em 0.4em',
      'border-radius': '0.25em',
      'font-size': '0.875em'
    },
    '&:focus': {
      'outline': 'none',
      'box-shadow': 'none'
    },
    '&::placeholder': {
      'color': '#9CA3AF'
    }
  }
};