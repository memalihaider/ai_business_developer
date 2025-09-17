'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Type,
  Palette,
  Eye,
  Save,
  X,
  Plus,
  Code,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

interface EmailTemplate {
  id?: string;
  name: string;
  description: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  category: string;
  tags: string[];
  variables: string[];
  thumbnail?: string;
  settings: {
    allowPersonalization: boolean;
    trackOpens: boolean;
    trackClicks: boolean;
    enableABTesting: boolean;
  };
}

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<EmailTemplate>({
    name: template?.name || '',
    description: template?.description || '',
    subject: template?.subject || '',
    htmlContent: template?.htmlContent || '<div>Start creating your email template...</div>',
    textContent: template?.textContent || '',
    category: template?.category || 'custom',
    tags: Array.isArray(template?.tags) ? template.tags : [],
    variables: Array.isArray(template?.variables) ? template.variables : [],
    settings: {
      allowPersonalization: template?.settings?.allowPersonalization ?? true,
      trackOpens: template?.settings?.trackOpens ?? true,
      trackClicks: template?.settings?.trackClicks ?? true,
      enableABTesting: template?.settings?.enableABTesting ?? false,
      ...template?.settings
    }
  });

  const [activeTab, setActiveTab] = useState('design');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [newTag, setNewTag] = useState('');
  const [newVariable, setNewVariable] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState('');

  // Auto-extract variables from content
  useEffect(() => {
    const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g;
    const extractedVars = new Set<string>();
    
    let match;
    while ((match = variableRegex.exec(formData.htmlContent)) !== null) {
      extractedVars.add(match[1]);
    }
    
    const newVariables = Array.from(extractedVars);
    if (JSON.stringify(newVariables) !== JSON.stringify(formData.variables)) {
      setFormData(prev => ({ ...prev, variables: newVariables }));
    }
  }, [formData.htmlContent]);

  const handleInputChange = (field: keyof EmailTemplate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable.trim()]
      }));
      setNewVariable('');
    }
  };

  const insertVariable = (variable: string) => {
    const variableTag = `{{${variable}}}`;
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(variableTag));
        setFormData(prev => ({ ...prev, htmlContent: editorRef.current?.innerHTML || '' }));
      }
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setFormData(prev => ({ ...prev, htmlContent: editorRef.current?.innerHTML || '' }));
    }
  };

  const insertTemplate = (templateType: string) => {
    let templateHtml = '';
    
    switch (templateType) {
      case 'header':
        templateHtml = `
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #dee2e6;">
            <h1 style="color: #333; margin: 0; font-size: 24px;">{{company_name}}</h1>
          </div>
        `;
        break;
      case 'button':
        templateHtml = `
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{button_url}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">{{button_text}}</a>
          </div>
        `;
        break;
      case 'footer':
        templateHtml = `
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
            <p>{{company_name}} | {{company_address}}</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
          </div>
        `;
        break;
    }
    
    if (editorRef.current && templateHtml) {
      editorRef.current.innerHTML += templateHtml;
      setFormData(prev => ({ ...prev, htmlContent: editorRef.current?.innerHTML || '' }));
    }
  };

  const generateTextVersion = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formData.htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    setFormData(prev => ({ ...prev, textContent }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const previewStyles = {
    desktop: { width: '100%', maxWidth: '600px' },
    tablet: { width: '100%', maxWidth: '480px' },
    mobile: { width: '100%', maxWidth: '320px' }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-semibold">
            {template ? 'Edit Template' : 'Create New Template'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Design and customize your email template
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Template Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-xs">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Template name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-xs">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Template description"
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="subject" className="text-xs">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Email subject"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-xs">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-2">
                  {Array.isArray(formData.tags) && formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    className="text-xs"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Variables */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-3">
                  {Array.isArray(formData.variables) && formData.variables.map((variable, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {`{{${variable}}}`}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => insertVariable(variable)}
                        className="h-6 px-2"
                      >
                        Insert
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Input
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    placeholder="Variable name"
                    className="text-xs"
                    onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                  />
                  <Button size="sm" onClick={addVariable}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Template Blocks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Template Blocks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => insertTemplate('header')}
                  className="w-full justify-start text-xs"
                >
                  Header Block
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => insertTemplate('button')}
                  className="w-full justify-start text-xs"
                >
                  Button Block
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => insertTemplate('footer')}
                  className="w-full justify-start text-xs"
                >
                  Footer Block
                </Button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Allow Personalization</Label>
                  <input
                    type="checkbox"
                    checked={formData.settings.allowPersonalization}
                    onChange={(e) => handleSettingsChange('allowPersonalization', e.target.checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Track Opens</Label>
                  <input
                    type="checkbox"
                    checked={formData.settings.trackOpens}
                    onChange={(e) => handleSettingsChange('trackOpens', e.target.checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Track Clicks</Label>
                  <input
                    type="checkbox"
                    checked={formData.settings.trackClicks}
                    onChange={(e) => handleSettingsChange('trackClicks', e.target.checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Enable A/B Testing</Label>
                  <input
                    type="checkbox"
                    checked={formData.settings.enableABTesting}
                    onChange={(e) => handleSettingsChange('enableABTesting', e.target.checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="design" className="flex-1 flex flex-col mt-0">
              {/* Toolbar */}
              <div className="border-b p-2 flex items-center gap-1 flex-wrap">
                <Button size="sm" variant="ghost" onClick={() => formatText('bold')}>
                  <Bold className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => formatText('italic')}>
                  <Italic className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => formatText('underline')}>
                  <Underline className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button size="sm" variant="ghost" onClick={() => formatText('justifyLeft')}>
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => formatText('justifyCenter')}>
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => formatText('justifyRight')}>
                  <AlignRight className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button size="sm" variant="ghost" onClick={() => formatText('insertUnorderedList')}>
                  <List className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => formatText('insertOrderedList')}>
                  <ListOrdered className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button size="sm" variant="ghost" onClick={() => formatText('createLink', prompt('Enter URL:') || '')}>
                  <Link className="w-4 h-4" />
                </Button>
              </div>

              {/* Editor */}
              <div className="flex-1 p-4 overflow-auto">
                <div
                  ref={editorRef}
                  contentEditable
                  className="min-h-96 p-4 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ maxWidth: '600px', margin: '0 auto' }}
                  dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                  onInput={(e) => {
                    setFormData(prev => ({ ...prev, htmlContent: e.currentTarget.innerHTML }));
                  }}
                  onMouseUp={() => {
                    const selection = window.getSelection();
                    setSelectedText(selection?.toString() || '');
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="html" className="flex-1 mt-0">
              <div className="p-4 h-full">
                <Textarea
                  value={formData.htmlContent}
                  onChange={(e) => handleInputChange('htmlContent', e.target.value)}
                  className="h-full font-mono text-sm"
                  placeholder="Enter HTML content..."
                />
                <div className="mt-2">
                  <Button size="sm" onClick={generateTextVersion}>
                    Generate Text Version
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 mt-0">
              <div className="p-4 h-full">
                {/* Preview Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={previewMode === 'desktop' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewMode === 'tablet' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('tablet')}
                    >
                      <Tablet className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewMode === 'mobile' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex justify-center">
                  <div
                    className="border rounded-lg bg-white shadow-sm transition-all duration-200"
                    style={previewStyles[previewMode]}
                  >
                    <div className="p-4">
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Subject:</strong> {formData.subject || 'No subject'}
                      </div>
                      <Separator className="mb-4" />
                      <div
                        dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                        className="prose max-w-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;