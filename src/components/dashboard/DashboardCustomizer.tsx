"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Trash2, GripVertical, Eye, EyeOff, Save, RotateCcw } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface DashboardSection {
  id: string;
  type: 'quick-notes' | 'lead-form' | 'metrics' | 'recent-activity' | 'charts' | 'custom';
  title: string;
  visible: boolean;
  order: number;
  config?: Record<string, any>;
}

interface DashboardCustomizerProps {
  sections: DashboardSection[];
  onSectionsChange: (sections: DashboardSection[]) => void;
}

const AVAILABLE_SECTION_TYPES = [
  { value: 'quick-notes', label: 'Quick Notes', description: 'Add and manage quick notes' },
  { value: 'lead-form', label: 'Lead Add Form', description: 'Form to add new leads' },
  { value: 'metrics', label: 'Performance Metrics', description: 'Key performance indicators' },
  { value: 'recent-activity', label: 'Recent Activity', description: 'Latest activities and updates' },
  { value: 'charts', label: 'Analytics Charts', description: 'Visual data representations' },
  { value: 'custom', label: 'Custom Section', description: 'Create a custom section' }
];

export default function DashboardCustomizer({ sections, onSectionsChange }: DashboardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSections, setLocalSections] = useState<DashboardSection[]>(sections);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSectionType, setNewSectionType] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');

  useEffect(() => {
    setLocalSections(sections);
  }, [sections]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(localSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedSections = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setLocalSections(updatedSections);
  };

  const toggleSectionVisibility = (sectionId: string) => {
    const updatedSections = localSections.map(section =>
      section.id === sectionId
        ? { ...section, visible: !section.visible }
        : section
    );
    setLocalSections(updatedSections);
  };

  const removeSection = (sectionId: string) => {
    const updatedSections = localSections.filter(section => section.id !== sectionId);
    setLocalSections(updatedSections);
  };

  const addNewSection = () => {
    if (!newSectionType || !newSectionTitle) return;

    const newSection: DashboardSection = {
      id: `section-${Date.now()}`,
      type: newSectionType as any,
      title: newSectionTitle,
      visible: true,
      order: localSections.length,
      config: {}
    };

    setLocalSections([...localSections, newSection]);
    setNewSectionType('');
    setNewSectionTitle('');
    setShowAddDialog(false);
  };

  const saveChanges = () => {
    onSectionsChange(localSections);
    setIsOpen(false);
  };

  const resetToDefault = () => {
    const defaultSections: DashboardSection[] = [
      { id: 'metrics', type: 'metrics', title: 'Performance Metrics', visible: true, order: 0 },
      { id: 'quick-notes', type: 'quick-notes', title: 'Quick Notes', visible: true, order: 1 },
      { id: 'lead-form', type: 'lead-form', title: 'Lead Add Form', visible: true, order: 2 },
      { id: 'recent-activity', type: 'recent-activity', title: 'Recent Activity', visible: true, order: 3 },
      { id: 'charts', type: 'charts', title: 'Analytics Charts', visible: true, order: 4 }
    ];
    setLocalSections(defaultSections);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/80 hover:bg-white border-[#7A8063]/30 hover:border-[#7A8063]/50 text-[#7A8063] hover:text-[#5C6047] transition-all duration-200"
        >
          <Settings className="w-4 h-4 mr-2" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Dashboard Customization
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Drag and drop to reorder sections, toggle visibility, or add new custom sections to your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Section</DialogTitle>
                  <DialogDescription>
                    Choose a section type and provide a title for your new dashboard section.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="section-type">Section Type</Label>
                    <Select value={newSectionType} onValueChange={setNewSectionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section type" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_SECTION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="section-title">Section Title</Label>
                    <Input
                      id="section-title"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="Enter section title"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addNewSection} disabled={!newSectionType || !newSectionTitle}>
                      Add Section
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={resetToDefault}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          {/* Sections List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Dashboard Sections</h3>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {localSections
                      .sort((a, b) => a.order - b.order)
                      .map((section, index) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`transition-all duration-200 ${
                                snapshot.isDragging ? 'shadow-lg scale-105' : 'shadow-sm'
                              } ${!section.visible ? 'opacity-60' : ''}`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600"
                                    >
                                      <GripVertical className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{section.title}</h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="text-xs">
                                          {AVAILABLE_SECTION_TYPES.find(t => t.value === section.type)?.label || section.type}
                                        </Badge>
                                        <Badge variant={section.visible ? 'default' : 'outline'} className="text-xs">
                                          {section.visible ? 'Visible' : 'Hidden'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleSectionVisibility(section.id)}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      {section.visible ? (
                                        <Eye className="w-4 h-4" />
                                      ) : (
                                        <EyeOff className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSection(section.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Save Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveChanges} className="bg-[#7A8063] hover:bg-[#5C6047] text-white">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}