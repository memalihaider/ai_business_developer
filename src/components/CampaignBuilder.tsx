'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Mail,
  Clock,
  Users,
  Filter,
  ArrowRight,
  ArrowDown,
  Settings,
  Copy,
  Trash2,
  Play,
  Pause,
  Save,
  Eye,
  BarChart3,
  Split,
  Timer,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  MousePointer
} from 'lucide-react';

interface CampaignStep {
  id: string;
  type: 'email' | 'wait' | 'condition' | 'action';
  position: { x: number; y: number };
  data: {
    name: string;
    description?: string;
    templateId?: string;
    waitDuration?: number;
    waitUnit?: 'minutes' | 'hours' | 'days' | 'weeks';
    condition?: {
      type: 'opened' | 'clicked' | 'replied' | 'tag' | 'custom';
      value?: string;
      operator?: 'equals' | 'contains' | 'greater_than' | 'less_than';
    };
    action?: {
      type: 'add_tag' | 'remove_tag' | 'update_field' | 'webhook';
      value?: string;
    };
  };
  connections: {
    yes?: string; // For conditions
    no?: string;  // For conditions
    next?: string; // For linear steps
  };
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

interface Campaign {
  id?: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  steps: CampaignStep[];
  settings: {
    startTrigger: 'manual' | 'form_submit' | 'tag_added' | 'date';
    startDate?: string;
    timezone: string;
    sendTimeOptimization: boolean;
    respectUnsubscribes: boolean;
    maxEmailsPerDay: number;
  };
  stats?: {
    totalRecipients: number;
    emailsSent: number;
    opens: number;
    clicks: number;
    replies: number;
    unsubscribes: number;
  };
}

interface CampaignBuilderProps {
  campaign?: Campaign;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
  templates: Array<{ id: string; name: string; category: string }>;
  isLoading?: boolean;
}

const CampaignBuilder: React.FC<CampaignBuilderProps> = ({
  campaign,
  onSave,
  onCancel,
  templates = [],
  isLoading = false
}) => {
  const [campaignData, setCampaignData] = useState<Campaign>({
    name: campaign?.name || '',
    description: campaign?.description || '',
    status: campaign?.status || 'draft',
    steps: campaign?.steps || [],
    settings: {
      startTrigger: 'manual',
      timezone: 'UTC',
      sendTimeOptimization: true,
      respectUnsubscribes: true,
      maxEmailsPerDay: 10,
      ...campaign?.settings
    },
    stats: campaign?.stats
  });

  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<CampaignStep | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const stepTemplates = {
    email: {
      type: 'email' as const,
      data: {
        name: 'New Email',
        description: 'Send an email to recipients'
      },
      connections: {}
    },
    wait: {
      type: 'wait' as const,
      data: {
        name: 'Wait',
        description: 'Wait for a specified duration',
        waitDuration: 1,
        waitUnit: 'days' as const
      },
      connections: {}
    },
    condition: {
      type: 'condition' as const,
      data: {
        name: 'Condition',
        description: 'Branch based on recipient behavior',
        condition: {
          type: 'opened' as const,
          operator: 'equals' as const
        }
      },
      connections: {}
    },
    action: {
      type: 'action' as const,
      data: {
        name: 'Action',
        description: 'Perform an action',
        action: {
          type: 'add_tag' as const
        }
      },
      connections: {}
    }
  };

  const addStep = (type: keyof typeof stepTemplates, position?: { x: number; y: number }) => {
    const newStep: CampaignStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: position || { x: 100, y: 100 },
      status: 'draft',
      ...stepTemplates[type]
    };

    setCampaignData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const updateStep = (stepId: string, updates: Partial<CampaignStep>) => {
    setCampaignData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  };

  const deleteStep = (stepId: string) => {
    setCampaignData(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }));
    if (selectedStep === stepId) {
      setSelectedStep(null);
    }
  };

  const duplicateStep = (stepId: string) => {
    const stepToDuplicate = campaignData.steps.find(step => step.id === stepId);
    if (stepToDuplicate) {
      const newStep: CampaignStep = {
        ...stepToDuplicate,
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: stepToDuplicate.position.x + 50,
          y: stepToDuplicate.position.y + 50
        },
        connections: {}
      };
      setCampaignData(prev => ({
        ...prev,
        steps: [...prev.steps, newStep]
      }));
    }
  };

  const connectSteps = (fromId: string, toId: string, connectionType: 'next' | 'yes' | 'no' = 'next') => {
    updateStep(fromId, {
      connections: {
        ...campaignData.steps.find(s => s.id === fromId)?.connections,
        [connectionType]: toId
      }
    });
  };

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (draggedStep && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: (e.clientX - rect.left - canvasOffset.x) / zoom,
        y: (e.clientY - rect.top - canvasOffset.y) / zoom
      };
      addStep(draggedStep.type as keyof typeof stepTemplates, position);
      setDraggedStep(null);
    }
  }, [draggedStep, canvasOffset, zoom]);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'wait': return <Clock className="w-4 h-4" />;
      case 'condition': return <Split className="w-4 h-4" />;
      case 'action': return <Zap className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getStepColor = (type: string, status?: string) => {
    const baseColors = {
      email: 'bg-blue-500',
      wait: 'bg-yellow-500',
      condition: 'bg-purple-500',
      action: 'bg-green-500'
    };
    
    if (status === 'active') return baseColors[type as keyof typeof baseColors] || 'bg-gray-500';
    if (status === 'paused') return 'bg-gray-400';
    if (status === 'completed') return 'bg-green-600';
    return 'bg-gray-300';
  };

  const renderStep = (step: CampaignStep) => {
    const isSelected = selectedStep === step.id;
    
    return (
      <div
        key={step.id}
        className={`absolute cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          left: step.position.x,
          top: step.position.y,
          transform: `scale(${zoom})`
        }}
        onClick={() => setSelectedStep(step.id)}
        onMouseDown={(e) => {
          // Handle dragging logic here
          e.preventDefault();
        }}
      >
        <Card className="w-48 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded text-white ${getStepColor(step.type, step.status)}`}>
                  {getStepIcon(step.type)}
                </div>
                <span className="font-medium text-sm">{step.data.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {step.status === 'active' && <CheckCircle className="w-3 h-3 text-green-500" />}
                {step.status === 'paused' && <Pause className="w-3 h-3 text-yellow-500" />}
                {step.status === 'draft' && <AlertCircle className="w-3 h-3 text-gray-400" />}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-gray-600 mb-2">{step.data.description}</p>
            
            {step.type === 'email' && step.data.templateId && (
              <Badge variant="outline" className="text-xs">
                Template: {templates.find(t => t.id === step.data.templateId)?.name || 'Unknown'}
              </Badge>
            )}
            
            {step.type === 'wait' && (
              <Badge variant="outline" className="text-xs">
                Wait: {step.data.waitDuration} {step.data.waitUnit}
              </Badge>
            )}
            
            {step.type === 'condition' && step.data.condition && (
              <Badge variant="outline" className="text-xs">
                If: {step.data.condition.type}
              </Badge>
            )}
            
            {step.type === 'action' && step.data.action && (
              <Badge variant="outline" className="text-xs">
                Action: {step.data.action.type}
              </Badge>
            )}
            
            {/* Connection points */}
            <div className="flex justify-between mt-2">
              {step.type === 'condition' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full cursor-pointer" title="Yes" />
                    <div className="w-3 h-3 bg-red-500 rounded-full cursor-pointer" title="No" />
                  </div>
                </>
              ) : (
                <div className="w-3 h-3 bg-blue-500 rounded-full cursor-pointer" title="Next" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderConnections = () => {
    return campaignData.steps.map(step => {
      const connections = [];
      
      if (step.connections.next) {
        const targetStep = campaignData.steps.find(s => s.id === step.connections.next);
        if (targetStep) {
          connections.push(
            <line
              key={`${step.id}-next`}
              x1={step.position.x + 96}
              y1={step.position.y + 80}
              x2={targetStep.position.x + 96}
              y2={targetStep.position.y}
              stroke="#3b82f6"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        }
      }
      
      if (step.connections.yes) {
        const targetStep = campaignData.steps.find(s => s.id === step.connections.yes);
        if (targetStep) {
          connections.push(
            <line
              key={`${step.id}-yes`}
              x1={step.position.x + 96}
              y1={step.position.y + 80}
              x2={targetStep.position.x + 96}
              y2={targetStep.position.y}
              stroke="#10b981"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        }
      }
      
      if (step.connections.no) {
        const targetStep = campaignData.steps.find(s => s.id === step.connections.no);
        if (targetStep) {
          connections.push(
            <line
              key={`${step.id}-no`}
              x1={step.position.x + 96}
              y1={step.position.y + 80}
              x2={targetStep.position.x + 96}
              y2={targetStep.position.y}
              stroke="#ef4444"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        }
      }
      
      return connections;
    }).flat();
  };

  const selectedStepData = selectedStep ? campaignData.steps.find(s => s.id === selectedStep) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-semibold">
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Build your email sequence with drag-and-drop
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(campaignData)} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Campaign'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Campaign Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-xs">Campaign Name</Label>
                  <Input
                    id="name"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Campaign name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-xs">Description</Label>
                  <Textarea
                    id="description"
                    value={campaignData.description}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Campaign description"
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select 
                    value={campaignData.status} 
                    onValueChange={(value: any) => setCampaignData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Step Library */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Step Library</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(stepTemplates).map(([key, template]) => (
                  <div
                    key={key}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    draggable
                    onDragStart={() => setDraggedStep(template)}
                    onClick={() => addStep(key as keyof typeof stepTemplates)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded text-white ${getStepColor(template.type)}`}>
                        {getStepIcon(template.type)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{template.data.name}</div>
                        <div className="text-xs text-gray-600">{template.data.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Step Properties */}
            {selectedStepData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Step Properties
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => duplicateStep(selectedStepData.id)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteStep(selectedStepData.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={selectedStepData.data.name}
                      onChange={(e) => updateStep(selectedStepData.id, {
                        data: { ...selectedStepData.data, name: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={selectedStepData.data.description || ''}
                      onChange={(e) => updateStep(selectedStepData.id, {
                        data: { ...selectedStepData.data, description: e.target.value }
                      })}
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  {selectedStepData.type === 'email' && (
                    <div>
                      <Label className="text-xs">Email Template</Label>
                      <Select
                        value={selectedStepData.data.templateId || ''}
                        onValueChange={(value) => updateStep(selectedStepData.id, {
                          data: { ...selectedStepData.data, templateId: value }
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedStepData.type === 'wait' && (
                    <>
                      <div>
                        <Label className="text-xs">Wait Duration</Label>
                        <Input
                          type="number"
                          value={selectedStepData.data.waitDuration || 1}
                          onChange={(e) => updateStep(selectedStepData.id, {
                            data: { ...selectedStepData.data, waitDuration: parseInt(e.target.value) }
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Select
                          value={selectedStepData.data.waitUnit || 'days'}
                          onValueChange={(value: any) => updateStep(selectedStepData.id, {
                            data: { ...selectedStepData.data, waitUnit: value }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutes">Minutes</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedStepData.type === 'condition' && (
                    <>
                      <div>
                        <Label className="text-xs">Condition Type</Label>
                        <Select
                          value={selectedStepData.data.condition?.type || 'opened'}
                          onValueChange={(value: any) => updateStep(selectedStepData.id, {
                            data: {
                              ...selectedStepData.data,
                              condition: { ...selectedStepData.data.condition, type: value }
                            }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="opened">Email Opened</SelectItem>
                            <SelectItem value="clicked">Link Clicked</SelectItem>
                            <SelectItem value="replied">Email Replied</SelectItem>
                            <SelectItem value="tag">Has Tag</SelectItem>
                            <SelectItem value="custom">Custom Field</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedStepData.type === 'action' && (
                    <>
                      <div>
                        <Label className="text-xs">Action Type</Label>
                        <Select
                          value={selectedStepData.data.action?.type || 'add_tag'}
                          onValueChange={(value: any) => updateStep(selectedStepData.id, {
                            data: {
                              ...selectedStepData.data,
                              action: { ...selectedStepData.data.action, type: value }
                            }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add_tag">Add Tag</SelectItem>
                            <SelectItem value="remove_tag">Remove Tag</SelectItem>
                            <SelectItem value="update_field">Update Field</SelectItem>
                            <SelectItem value="webhook">Webhook</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={selectedStepData.data.action?.value || ''}
                          onChange={(e) => updateStep(selectedStepData.id, {
                            data: {
                              ...selectedStepData.data,
                              action: { ...selectedStepData.data.action, value: e.target.value }
                            }
                          })}
                          className="mt-1"
                          placeholder="Enter value"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Campaign Stats */}
            {campaignData.stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Campaign Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Recipients:</span>
                    <span className="font-medium">{campaignData.stats.totalRecipients}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Emails Sent:</span>
                    <span className="font-medium">{campaignData.stats.emailsSent}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Opens:</span>
                    <span className="font-medium">{campaignData.stats.opens}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Clicks:</span>
                    <span className="font-medium">{campaignData.stats.clicks}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Replies:</span>
                    <span className="font-medium">{campaignData.stats.replies}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              -
            </Button>
            <span className="text-sm px-2">{Math.round(zoom * 100)}%</span>
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
              +
            </Button>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="w-full h-full bg-gray-100 relative overflow-auto"
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => setSelectedStep(null)}
          >
            {/* Grid */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />

            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
              </defs>
              {renderConnections()}
            </svg>

            {/* Steps */}
            {campaignData.steps.map(renderStep)}

            {/* Empty state */}
            {campaignData.steps.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MousePointer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Start Building Your Campaign
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Drag steps from the sidebar or click to add them to your canvas
                  </p>
                  <Button onClick={() => addStep('email', { x: 200, y: 200 })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Step
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilder;