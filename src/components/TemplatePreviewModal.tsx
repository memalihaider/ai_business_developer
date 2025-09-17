'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  Edit3,
  Save,
  X,
  Copy,
  Download,
  Share2,
  Star,
  StarOff,
  Tag,
  Calendar,
  User,
  BarChart3,
  FileText,
  Settings,
  FileDown
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface Template {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: string;
  content: string;
  sections?: any[];
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  rating: number;
  downloads: number;
  isPopular: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplatePreviewModalProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (template: Template) => void;
  onEdit?: (template: Template) => void;
  onDuplicate?: (template: Template) => void;
  onDelete?: (templateId: string) => void;
  onToggleFavorite?: (templateId: string) => void;
  isFavorite?: boolean;
  onUseTemplate?: (template: Template) => void;
  mode?: 'view' | 'edit';
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onSave,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  isFavorite: initialIsFavorite = false,
  onUseTemplate,
  mode: initialMode = 'view'
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [editedTemplate, setEditedTemplate] = useState<Template | null>(null);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    if (template) {
      setEditedTemplate({ ...template });
      setMode(initialMode);
      setActiveTab('preview');
    }
  }, [template, initialMode]);

  if (!template || !editedTemplate) {
    return null;
  }

  const handleSave = async () => {
    if (onSave && editedTemplate) {
      try {
        await onSave(editedTemplate);
        setMode('view');
        toast.success('Template saved successfully!');
      } catch (error) {
        toast.error('Failed to save template');
      }
    }
  };

  const handleCancel = () => {
    setEditedTemplate({ ...template });
    setMode('view');
  };

  const handleUseTemplate = () => {
    if (onUseTemplate) {
      onUseTemplate(template);
      toast.success('Template applied to proposal builder!');
      onClose();
    }
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(template.content);
      toast.success('Template content copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy template content');
    }
  };

  const handleDownloadTemplate = () => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}_template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Template downloaded successfully!');
  };

  const handleExportPDF = () => {
    if (!template) {
      toast.error('No template data available for export');
      return;
    }

    try {
      // Validate template data
      if (!template.name || !template.content) {
        toast.error('Template is missing required data for PDF export');
        return;
      }

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(template.name, 20, 30);
      
      // Template details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Type: ${template.type || 'N/A'}`, 20, 50);
      doc.text(`Category: ${template.category || 'N/A'}`, 20, 60);
      doc.text(`Created: ${template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A'}`, 20, 70);
      doc.text(`Usage Count: ${template.usageCount || 0}`, 20, 80);
      
      if (template.description) {
        doc.text('Description:', 20, 100);
        const descriptionLines = doc.splitTextToSize(template.description, 170);
        doc.text(descriptionLines, 20, 110);
      }
      
      // Template content
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Template Content:', 20, template.description ? 140 : 100);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const contentLines = doc.splitTextToSize(template.content, 170);
      doc.text(contentLines, 20, template.description ? 155 : 115);
      
      // Tags
      if (template.tags && template.tags.length > 0) {
        try {
          const tagsY = template.description ? 200 : 160;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Tags:', 20, tagsY);
          doc.setFont('helvetica', 'normal');
          
          const parsedTags = Array.isArray(template.tags) 
            ? template.tags 
            : JSON.parse(template.tags);
          doc.text(parsedTags.join(', '), 20, tagsY + 10);
        } catch (tagError) {
          console.warn('Error parsing tags:', tagError);
          // Continue without tags if parsing fails
        }
      }
      
      // Footer
      doc.setFontSize(8);
      doc.text('Generated by AI Business Developer', 105, 280, { align: 'center' });
      
      // Save the PDF with sanitized filename
      const sanitizedName = template.name.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
      const fileName = `${sanitizedName}_template.pdf`;
      doc.save(fileName);
      
      toast.success('Template exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('jsPDF')) {
          toast.error('PDF generation failed. Please try again.');
        } else if (error.message.includes('save')) {
          toast.error('Failed to save PDF file. Check your browser permissions.');
        } else {
          toast.error(`Export failed: ${error.message}`);
        }
      } else {
        toast.error('An unexpected error occurred during PDF export');
      }
    }
  };

  const handleShareTemplate = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: template.name,
          text: template.description || 'Check out this template',
          url: window.location.href
        });
      } catch (error) {
        // Fallback to copying link
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Template link copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Template link copied to clipboard!');
    }
  };

  const toggleFavorite = () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    if (onToggleFavorite) {
      onToggleFavorite(template.id);
    }
    toast.success(newFavoriteState ? 'Added to favorites' : 'Removed from favorites');
  };

  const addTag = () => {
    if (newTag.trim() && editedTemplate && !editedTemplate.tags.includes(newTag.trim())) {
      setEditedTemplate({
        ...editedTemplate,
        tags: [...editedTemplate.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (editedTemplate) {
      setEditedTemplate({
        ...editedTemplate,
        tags: editedTemplate.tags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl font-bold">
                {mode === 'edit' ? 'Edit Template' : template.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant={template.isPublic ? 'default' : 'secondary'}>
                  {template.isPublic ? 'Public' : 'Private'}
                </Badge>
                <Badge variant="outline">{template.category}</Badge>
                <Badge variant="outline">{template.type}</Badge>
                {template.isPopular && (
                  <Badge variant="destructive">Popular</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
              >
                {isFavorite ? (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
              {mode === 'view' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onEdit) {
                      onEdit(template);
                    } else {
                      setMode('edit');
                    }
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="preview" className="h-full">
                <div className="h-full border rounded-lg p-6 bg-white">
                  <div className="prose max-w-none">
                    <RichTextEditor
                      value={editedTemplate.content}
                      onChange={() => {}} // Read-only in preview
                      readOnly={true}
                      className="border-0 shadow-none"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="edit" className="h-full">
                <div className="space-y-4">
                  {mode === 'edit' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                          id="name"
                          value={editedTemplate.name}
                          onChange={(e) => setEditedTemplate({
                            ...editedTemplate,
                            name: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={editedTemplate.category}
                          onValueChange={(value) => setEditedTemplate({
                            ...editedTemplate,
                            category: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedTemplate.description || ''}
                      onChange={(e) => setEditedTemplate({
                        ...editedTemplate,
                        description: e.target.value
                      })}
                      readOnly={mode === 'view'}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Content</Label>
                    <RichTextEditor
                      value={editedTemplate.content}
                      onChange={(value) => setEditedTemplate({
                        ...editedTemplate,
                        content: value
                      })}
                      readOnly={mode === 'view'}
                      placeholder="Enter your template content here..."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Template Information</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Type:</span>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm">{new Date(template.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Last Updated:</span>
                        <span className="text-sm">{new Date(template.updatedAt).toLocaleDateString()}</span>
                      </div>
                      
                      {template.lastUsed && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Last Used:</span>
                          <span className="text-sm">{new Date(template.lastUsed).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {mode === 'edit' && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="public"
                          checked={editedTemplate.isPublic}
                          onCheckedChange={(checked) => setEditedTemplate({
                            ...editedTemplate,
                            isPublic: checked
                          })}
                        />
                        <Label htmlFor="public">Make template public</Label>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Tags</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {editedTemplate.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                          {mode === 'edit' && (
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>

                    {mode === 'edit' && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1"
                        />
                        <Button onClick={addTag} size="sm">
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Usage Count</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-2">{template.usageCount}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Rating</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-2">{template.rating.toFixed(1)}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Downloads</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 mt-2">{template.downloads}</p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">Views</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 mt-2">{Math.floor(template.downloads * 1.5)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Performance Insights</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• This template has been used {template.usageCount} times</p>
                    <p>• Average rating of {template.rating.toFixed(1)} stars</p>
                    <p>• {template.isPopular ? 'Popular template' : 'Growing in popularity'}</p>
                    <p>• Last updated {new Date(template.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyTemplate}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareTemplate}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {onUseTemplate && (
                <Button onClick={handleUseTemplate}>
                  Use Template
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewModal;