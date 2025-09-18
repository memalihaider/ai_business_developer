'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote,
  Undo,
  Redo,
  Type,
  Palette
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = '',
  readOnly = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  // Sanitize HTML content to prevent XSS
  const sanitizeHTML = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = html;
    return tempDiv.innerHTML;
  };

  // Safe HTML update with sanitization
  const updateEditorContent = (content: string) => {
    if (editorRef.current) {
      // Create a temporary element to sanitize content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Remove potentially dangerous elements and attributes
      const scripts = tempDiv.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      
      const dangerousElements = tempDiv.querySelectorAll('[onclick], [onload], [onerror], [onmouseover]');
      dangerousElements.forEach(el => {
        el.removeAttribute('onclick');
        el.removeAttribute('onload');
        el.removeAttribute('onerror');
        el.removeAttribute('onmouseover');
      });
      
      editorRef.current.innerHTML = tempDiv.innerHTML;
    }
  };

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      updateEditorContent(value);
    }
  }, [value]);

  const executeCommand = (command: string, value?: string) => {
    if (readOnly) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current && !readOnly) {
      const sanitizedContent = editorRef.current.innerHTML;
      onChange(sanitizedContent);
    }
  };

  const handleBlur = () => {
    if (editorRef.current) {
      const sanitizedContent = editorRef.current.innerHTML;
      onChange(sanitizedContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;
    
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          executeCommand('undo');
          break;
        case 'y':
          e.preventDefault();
          executeCommand('redo');
          break;
      }
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  const insertLink = () => {
    if (readOnly) return;
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const insertImage = () => {
    if (readOnly) return;
    const url = prompt('Enter image URL:');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  const formatBlock = (tag: string) => {
    if (readOnly) return;
    executeCommand('formatBlock', tag);
  };

  const changeFontSize = (size: string) => {
    if (readOnly) return;
    executeCommand('fontSize', size);
  };

  const changeTextColor = (color: string) => {
    if (readOnly) return;
    executeCommand('foreColor', color);
  };

  const toolbarButtons = [
    {
      icon: Bold,
      command: 'bold',
      tooltip: 'Bold (Ctrl+B)',
      shortcut: 'Ctrl+B'
    },
    {
      icon: Italic,
      command: 'italic',
      tooltip: 'Italic (Ctrl+I)',
      shortcut: 'Ctrl+I'
    },
    {
      icon: Underline,
      command: 'underline',
      tooltip: 'Underline (Ctrl+U)',
      shortcut: 'Ctrl+U'
    },
    {
      icon: AlignLeft,
      command: 'justifyLeft',
      tooltip: 'Align Left'
    },
    {
      icon: AlignCenter,
      command: 'justifyCenter',
      tooltip: 'Align Center'
    },
    {
      icon: AlignRight,
      command: 'justifyRight',
      tooltip: 'Align Right'
    },
    {
      icon: List,
      command: 'insertUnorderedList',
      tooltip: 'Bullet List'
    },
    {
      icon: ListOrdered,
      command: 'insertOrderedList',
      tooltip: 'Numbered List'
    },
    {
      icon: Quote,
      command: 'formatBlock',
      value: 'blockquote',
      tooltip: 'Quote'
    },
    {
      icon: Code,
      command: 'formatBlock',
      value: 'pre',
      tooltip: 'Code Block'
    },
    {
      icon: Undo,
      command: 'undo',
      tooltip: 'Undo (Ctrl+Z)'
    },
    {
      icon: Redo,
      command: 'redo',
      tooltip: 'Redo (Ctrl+Y)'
    }
  ];

  return (
    <TooltipProvider>
      <Card className={`overflow-hidden ${className}`}>
        {!readOnly && (
          <div className="border-b bg-gray-50 p-2">
            <div className="flex flex-wrap items-center gap-1">
              {/* Format Dropdown */}
              <Select onValueChange={formatBlock}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="div">Normal</SelectItem>
                  <SelectItem value="h1">Heading 1</SelectItem>
                  <SelectItem value="h2">Heading 2</SelectItem>
                  <SelectItem value="h3">Heading 3</SelectItem>
                  <SelectItem value="h4">Heading 4</SelectItem>
                  <SelectItem value="h5">Heading 5</SelectItem>
                  <SelectItem value="h6">Heading 6</SelectItem>
                </SelectContent>
              </Select>

              {/* Font Size Dropdown */}
              <Select onValueChange={changeFontSize}>
                <SelectTrigger className="w-16 h-8">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">8pt</SelectItem>
                  <SelectItem value="2">10pt</SelectItem>
                  <SelectItem value="3">12pt</SelectItem>
                  <SelectItem value="4">14pt</SelectItem>
                  <SelectItem value="5">18pt</SelectItem>
                  <SelectItem value="6">24pt</SelectItem>
                  <SelectItem value="7">36pt</SelectItem>
                </SelectContent>
              </Select>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Formatting Buttons */}
              {toolbarButtons.map((button, index) => {
                const Icon = button.icon;
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => executeCommand(button.command, button.value)}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{button.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Link and Image Buttons */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={insertLink}
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Insert Link</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={insertImage}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Insert Image</p>
                </TooltipContent>
              </Tooltip>

              {/* Color Picker */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                    <input
                      type="color"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => changeTextColor(e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Text Color</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable={!readOnly}
          className={`
            min-h-[200px] p-4 outline-none focus:ring-0
            ${readOnly ? 'cursor-default' : 'cursor-text'}
            ${isEditorFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
          `}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsEditorFocused(true)}
          onBlur={() => setIsEditorFocused(false)}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          data-placeholder={placeholder}
          style={{
            minHeight: '200px'
          }}
        />

        {!readOnly && (
          <div className="border-t bg-gray-50 px-4 py-2 text-sm text-gray-500">
            <div className="flex justify-between items-center">
              <span>
                {selectedText ? `Selected: "${selectedText.slice(0, 30)}${selectedText.length > 30 ? '...' : ''}"` : 'Ready to edit'}
              </span>
              <span className="text-xs">
                Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline
              </span>
            </div>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
};

export default RichTextEditor;

// CSS for placeholder and editor styling
const editorStyles = `
  [contenteditable="true"]:empty:before {
    content: attr(data-placeholder);
    color: #9ca3af;
    pointer-events: none;
  }
  
  [contenteditable="true"] h1 {
    font-size: 2em;
    font-weight: bold;
    margin: 0.67em 0;
  }
  
  [contenteditable="true"] h2 {
    font-size: 1.5em;
    font-weight: bold;
    margin: 0.75em 0;
  }
  
  [contenteditable="true"] h3 {
    font-size: 1.17em;
    font-weight: bold;
    margin: 0.83em 0;
  }
  
  [contenteditable="true"] blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: #6b7280;
  }
  
  [contenteditable="true"] pre {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.375rem;
    font-family: 'Courier New', monospace;
    overflow-x: auto;
  }
  
  [contenteditable="true"] ul, [contenteditable="true"] ol {
    padding-left: 2rem;
    margin: 1rem 0;
  }
  
  [contenteditable="true"] li {
    margin: 0.5rem 0;
  }
  
  [contenteditable="true"] a {
    color: #3b82f6;
    text-decoration: underline;
  }
  
  [contenteditable="true"] img {
    max-width: 100%;
    height: auto;
    border-radius: 0.375rem;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = editorStyles;
  document.head.appendChild(styleSheet);
}