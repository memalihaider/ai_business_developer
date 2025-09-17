'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Type, Image, Button, Layout, Save } from 'lucide-react';

interface TemplateBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'spacer';
  content: string;
  styles: {
    fontSize?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    textAlign?: 'left' | 'center' | 'right';
    borderRadius?: string;
  };
}

interface EmailTemplateBuilderProps {
  onSave: (template: { name: string; subject: string; content: string; blocks: TemplateBlock[] }) => void;
  initialTemplate?: {
    name: string;
    subject: string;
    content: string;
    blocks?: TemplateBlock[];
  };
}

export default function EmailTemplateBuilder({ onSave, initialTemplate }: EmailTemplateBuilderProps) {
  const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
  const [subject, setSubject] = useState(initialTemplate?.subject || '');
  const [blocks, setBlocks] = useState<TemplateBlock[]>(initialTemplate?.blocks || [
    {
      id: '1',
      type: 'text',
      content: 'Welcome to our newsletter!',
      styles: {
        fontSize: '24px',
        color: '#333333',
        textAlign: 'center',
        padding: '20px'
      }
    }
  ]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const addBlock = (type: TemplateBlock['type']) => {
    const newBlock: TemplateBlock = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type)
    };
    setBlocks([...blocks, newBlock]);
  };

  const getDefaultContent = (type: TemplateBlock['type']): string => {
    switch (type) {
      case 'text': return 'Your text content here...';
      case 'image': return 'https://via.placeholder.com/600x200';
      case 'button': return 'Click Here';
      case 'spacer': return '';
      default: return '';
    }
  };

  const getDefaultStyles = (type: TemplateBlock['type']) => {
    switch (type) {
      case 'text':
        return {
          fontSize: '16px',
          color: '#333333',
          padding: '10px',
          textAlign: 'left' as const
        };
      case 'image':
        return {
          padding: '10px',
          textAlign: 'center' as const
        };
      case 'button':
        return {
          backgroundColor: '#007bff',
          color: '#ffffff',
          padding: '12px 24px',
          textAlign: 'center' as const,
          borderRadius: '6px'
        };
      case 'spacer':
        return {
          padding: '20px'
        };
      default:
        return {};
    }
  };

  const updateBlock = (id: string, updates: Partial<TemplateBlock>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    if (selectedBlock === id) {
      setSelectedBlock(null);
    }
  };

  const generateHTML = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .block { display: block; width: 100%; }
    .text-block { font-family: Arial, sans-serif; line-height: 1.6; }
    .button-block { display: inline-block; text-decoration: none; }
    .image-block { max-width: 100%; height: auto; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .block { padding: 10px !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${blocks.map(block => {
      const styleString = Object.entries(block.styles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');
      
      switch (block.type) {
        case 'text':
          return `<div class="block text-block" style="${styleString}">${block.content}</div>`;
        case 'image':
          return `<div class="block" style="${styleString}"><img src="${block.content}" class="image-block" alt="Email Image" /></div>`;
        case 'button':
          return `<div class="block" style="text-align: ${block.styles.textAlign || 'center'}; padding: ${block.styles.padding || '10px'};"><a href="#" class="button-block" style="${styleString}">${block.content}</a></div>`;
        case 'spacer':
          return `<div class="block" style="${styleString}">&nbsp;</div>`;
        default:
          return '';
      }
    }).join('\n    ')}
  </div>
</body>
</html>`;
    return html;
  };

  const handleSave = () => {
    const htmlContent = generateHTML();
    onSave({
      name: templateName,
      subject,
      content: htmlContent,
      blocks
    });
  };

  const selectedBlockData = blocks.find(block => block.id === selectedBlock);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Template Builder</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter template name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter subject line"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3">Add Elements</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addBlock('text')}
              className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Type className="h-5 w-5 mb-1" />
              <span className="text-xs">Text</span>
            </button>
            <button
              onClick={() => addBlock('image')}
              className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Image className="h-5 w-5 mb-1" />
              <span className="text-xs">Image</span>
            </button>
            <button
              onClick={() => addBlock('button')}
              className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Button className="h-5 w-5 mb-1" />
              <span className="text-xs">Button</span>
            </button>
            <button
              onClick={() => addBlock('spacer')}
              className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Layout className="h-5 w-5 mb-1" />
              <span className="text-xs">Spacer</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-96">
            <div className="p-6">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`relative group mb-2 cursor-pointer ${
                    selectedBlock === block.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedBlock(block.id)}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBlock(block.id);
                      }}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {block.type === 'text' && (
                    <div
                      style={{
                        fontSize: block.styles.fontSize,
                        color: block.styles.color,
                        textAlign: block.styles.textAlign,
                        padding: block.styles.padding
                      }}
                    >
                      {block.content}
                    </div>
                  )}
                  
                  {block.type === 'image' && (
                    <div style={{ textAlign: block.styles.textAlign, padding: block.styles.padding }}>
                      <img src={block.content} alt="Email content" className="max-w-full h-auto" />
                    </div>
                  )}
                  
                  {block.type === 'button' && (
                    <div style={{ textAlign: block.styles.textAlign, padding: block.styles.padding }}>
                      <button
                        style={{
                          backgroundColor: block.styles.backgroundColor,
                          color: block.styles.color,
                          padding: block.styles.padding,
                          borderRadius: block.styles.borderRadius,
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {block.content}
                      </button>
                    </div>
                  )}
                  
                  {block.type === 'spacer' && (
                    <div style={{ padding: block.styles.padding }}>&nbsp;</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedBlockData && (
        <div className="w-64 bg-white border-l border-gray-200 p-4">
          <h4 className="text-sm font-semibold mb-4">Properties</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              {selectedBlockData.type === 'text' || selectedBlockData.type === 'button' ? (
                <textarea
                  value={selectedBlockData.content}
                  onChange={(e) => updateBlock(selectedBlockData.id, { content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              ) : selectedBlockData.type === 'image' ? (
                <input
                  type="url"
                  value={selectedBlockData.content}
                  onChange={(e) => updateBlock(selectedBlockData.id, { content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Image URL"
                />
              ) : null}
            </div>
            
            {selectedBlockData.type !== 'spacer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Align</label>
                  <select
                    value={selectedBlockData.styles.textAlign || 'left'}
                    onChange={(e) => updateBlock(selectedBlockData.id, {
                      styles: { ...selectedBlockData.styles, textAlign: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={selectedBlockData.styles.color || '#333333'}
                    onChange={(e) => updateBlock(selectedBlockData.id, {
                      styles: { ...selectedBlockData.styles, color: e.target.value }
                    })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </>
            )}
            
            {selectedBlockData.type === 'button' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <input
                  type="color"
                  value={selectedBlockData.styles.backgroundColor || '#007bff'}
                  onChange={(e) => updateBlock(selectedBlockData.id, {
                    styles: { ...selectedBlockData.styles, backgroundColor: e.target.value }
                  })}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
              <input
                type="text"
                value={selectedBlockData.styles.padding || '10px'}
                onChange={(e) => updateBlock(selectedBlockData.id, {
                  styles: { ...selectedBlockData.styles, padding: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g., 10px or 10px 20px"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}