'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Trash2,
  Edit,
  Copy,
  Save,
  Eye,
  Mail,
  Clock,
  Users,
  Filter,
  ArrowRight,
  ArrowDown,
  Split,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MousePointer,
  Reply,
  Tag,
  Calendar,
  Globe,
  Smartphone,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';

interface Condition {
  id: string;
  type: 'engagement' | 'behavior' | 'attribute' | 'time' | 'custom';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  field: string;
  value: string | number | boolean;
  timeframe?: {
    amount: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
}

interface Action {
  id: string;
  type: 'send_email' | 'wait' | 'add_tag' | 'remove_tag' | 'update_field' | 'webhook' | 'stop_sequence' | 'move_to_sequence';
  data: {
    templateId?: string;
    duration?: number;
    durationUnit?: 'minutes' | 'hours' | 'days' | 'weeks';
    tagName?: string;
    fieldName?: string;
    fieldValue?: string;
    webhookUrl?: string;
    sequenceId?: string;
    subject?: string;
    message?: string;
  };
}

interface BranchingRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  conditions: Condition[];
  conditionLogic: 'AND' | 'OR';
  trueActions: Action[];
  falseActions: Action[];
  stats?: {
    triggered: number;
    truePath: number;
    falsePath: number;
    lastTriggered?: string;
  };
}

interface ConditionalBranchingProps {
  rules?: BranchingRule[];
  onSave: (rules: BranchingRule[]) => void;
  templates: Array<{ id: string; name: string; category: string }>;
  sequences: Array<{ id: string; name: string; status: string }>;
  isLoading?: boolean;
}

const ConditionalBranching: React.FC<ConditionalBranchingProps> = ({
  rules = [],
  onSave,
  templates = [],
  sequences = [],
  isLoading = false
}) => {
  const [branchingRules, setBranchingRules] = useState<BranchingRule[]>(rules);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<BranchingRule | null>(null);
  const [showRuleEditor, setShowRuleEditor] = useState(false);

  const conditionTypes = {
    engagement: {
      label: 'Engagement',
      icon: <Activity className="w-4 h-4" />,
      fields: [
        { value: 'email_opened', label: 'Email Opened' },
        { value: 'link_clicked', label: 'Link Clicked' },
        { value: 'email_replied', label: 'Email Replied' },
        { value: 'attachment_downloaded', label: 'Attachment Downloaded' },
        { value: 'unsubscribed', label: 'Unsubscribed' },
        { value: 'bounced', label: 'Email Bounced' }
      ]
    },
    behavior: {
      label: 'Behavior',
      icon: <MousePointer className="w-4 h-4" />,
      fields: [
        { value: 'website_visited', label: 'Website Visited' },
        { value: 'page_viewed', label: 'Page Viewed' },
        { value: 'form_submitted', label: 'Form Submitted' },
        { value: 'purchase_made', label: 'Purchase Made' },
        { value: 'cart_abandoned', label: 'Cart Abandoned' },
        { value: 'login_activity', label: 'Login Activity' }
      ]
    },
    attribute: {
      label: 'Attribute',
      icon: <Users className="w-4 h-4" />,
      fields: [
        { value: 'location', label: 'Location' },
        { value: 'age', label: 'Age' },
        { value: 'gender', label: 'Gender' },
        { value: 'job_title', label: 'Job Title' },
        { value: 'company_size', label: 'Company Size' },
        { value: 'industry', label: 'Industry' },
        { value: 'subscription_plan', label: 'Subscription Plan' }
      ]
    },
    time: {
      label: 'Time-based',
      icon: <Clock className="w-4 h-4" />,
      fields: [
        { value: 'signup_date', label: 'Signup Date' },
        { value: 'last_activity', label: 'Last Activity' },
        { value: 'last_purchase', label: 'Last Purchase' },
        { value: 'subscription_end', label: 'Subscription End Date' },
        { value: 'birthday', label: 'Birthday' },
        { value: 'anniversary', label: 'Anniversary' }
      ]
    },
    custom: {
      label: 'Custom Field',
      icon: <Tag className="w-4 h-4" />,
      fields: [
        { value: 'custom_field', label: 'Custom Field' }
      ]
    }
  };

  const operators = {
    equals: 'Equals',
    not_equals: 'Not Equals',
    greater_than: 'Greater Than',
    less_than: 'Less Than',
    contains: 'Contains',
    not_contains: 'Does Not Contain',
    exists: 'Exists',
    not_exists: 'Does Not Exist'
  };

  const actionTypes = {
    send_email: {
      label: 'Send Email',
      icon: <Mail className="w-4 h-4" />,
      color: 'bg-blue-500'
    },
    wait: {
      label: 'Wait',
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-yellow-500'
    },
    add_tag: {
      label: 'Add Tag',
      icon: <Tag className="w-4 h-4" />,
      color: 'bg-green-500'
    },
    remove_tag: {
      label: 'Remove Tag',
      icon: <Tag className="w-4 h-4" />,
      color: 'bg-red-500'
    },
    update_field: {
      label: 'Update Field',
      icon: <Edit className="w-4 h-4" />,
      color: 'bg-purple-500'
    },
    webhook: {
      label: 'Webhook',
      icon: <Zap className="w-4 h-4" />,
      color: 'bg-orange-500'
    },
    stop_sequence: {
      label: 'Stop Sequence',
      icon: <XCircle className="w-4 h-4" />,
      color: 'bg-gray-500'
    },
    move_to_sequence: {
      label: 'Move to Sequence',
      icon: <ArrowRight className="w-4 h-4" />,
      color: 'bg-indigo-500'
    }
  };

  const createNewRule = () => {
    const newRule: BranchingRule = {
      id: `rule_${Date.now()}`,
      name: 'New Branching Rule',
      description: '',
      priority: branchingRules.length + 1,
      isActive: true,
      conditions: [],
      conditionLogic: 'AND',
      trueActions: [],
      falseActions: []
    };
    setEditingRule(newRule);
    setShowRuleEditor(true);
  };

  const editRule = (rule: BranchingRule) => {
    setEditingRule({ ...rule });
    setShowRuleEditor(true);
  };

  const saveRule = () => {
    if (!editingRule) return;

    const existingIndex = branchingRules.findIndex(r => r.id === editingRule.id);
    if (existingIndex >= 0) {
      const updatedRules = [...branchingRules];
      updatedRules[existingIndex] = editingRule;
      setBranchingRules(updatedRules);
    } else {
      setBranchingRules([...branchingRules, editingRule]);
    }

    setEditingRule(null);
    setShowRuleEditor(false);
  };

  const deleteRule = (ruleId: string) => {
    setBranchingRules(branchingRules.filter(r => r.id !== ruleId));
    if (selectedRule === ruleId) {
      setSelectedRule(null);
    }
  };

  const duplicateRule = (rule: BranchingRule) => {
    const duplicatedRule: BranchingRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      name: `${rule.name} (Copy)`,
      priority: branchingRules.length + 1
    };
    setBranchingRules([...branchingRules, duplicatedRule]);
  };

  const toggleRuleStatus = (ruleId: string) => {
    setBranchingRules(branchingRules.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const addCondition = () => {
    if (!editingRule) return;

    const newCondition: Condition = {
      id: `condition_${Date.now()}`,
      type: 'engagement',
      operator: 'equals',
      field: 'email_opened',
      value: true
    };

    setEditingRule({
      ...editingRule,
      conditions: [...editingRule.conditions, newCondition]
    });
  };

  const updateCondition = (conditionId: string, updates: Partial<Condition>) => {
    if (!editingRule) return;

    setEditingRule({
      ...editingRule,
      conditions: editingRule.conditions.map(condition =>
        condition.id === conditionId ? { ...condition, ...updates } : condition
      )
    });
  };

  const removeCondition = (conditionId: string) => {
    if (!editingRule) return;

    setEditingRule({
      ...editingRule,
      conditions: editingRule.conditions.filter(c => c.id !== conditionId)
    });
  };

  const addAction = (isTrue: boolean) => {
    if (!editingRule) return;

    const newAction: Action = {
      id: `action_${Date.now()}`,
      type: 'send_email',
      data: {}
    };

    const actionKey = isTrue ? 'trueActions' : 'falseActions';
    setEditingRule({
      ...editingRule,
      [actionKey]: [...editingRule[actionKey], newAction]
    });
  };

  const updateAction = (actionId: string, isTrue: boolean, updates: Partial<Action>) => {
    if (!editingRule) return;

    const actionKey = isTrue ? 'trueActions' : 'falseActions';
    setEditingRule({
      ...editingRule,
      [actionKey]: editingRule[actionKey].map(action =>
        action.id === actionId ? { ...action, ...updates } : action
      )
    });
  };

  const removeAction = (actionId: string, isTrue: boolean) => {
    if (!editingRule) return;

    const actionKey = isTrue ? 'trueActions' : 'falseActions';
    setEditingRule({
      ...editingRule,
      [actionKey]: editingRule[actionKey].filter(a => a.id !== actionId)
    });
  };

  const renderConditionEditor = (condition: Condition) => {
    const conditionType = conditionTypes[condition.type];
    
    return (
      <div key={condition.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {conditionType.icon}
            <span className="font-medium text-sm">{conditionType.label}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeCondition(condition.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Field</Label>
            <Select
              value={condition.field}
              onValueChange={(value) => updateCondition(condition.id, { field: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionType.fields.map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Operator</Label>
            <Select
              value={condition.operator}
              onValueChange={(value: any) => updateCondition(condition.id, { operator: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(operators).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Value</Label>
            <Input
              value={condition.value.toString()}
              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
              className="mt-1"
              placeholder="Enter value"
            />
          </div>
        </div>

        {condition.type === 'time' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Timeframe Amount</Label>
              <Input
                type="number"
                value={condition.timeframe?.amount || 1}
                onChange={(e) => updateCondition(condition.id, {
                  timeframe: {
                    ...condition.timeframe,
                    amount: parseInt(e.target.value),
                    unit: condition.timeframe?.unit || 'days'
                  }
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Select
                value={condition.timeframe?.unit || 'days'}
                onValueChange={(value: any) => updateCondition(condition.id, {
                  timeframe: {
                    ...condition.timeframe,
                    amount: condition.timeframe?.amount || 1,
                    unit: value
                  }
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
          </div>
        )}
      </div>
    );
  };

  const renderActionEditor = (action: Action, isTrue: boolean) => {
    const actionType = actionTypes[action.type];
    
    return (
      <div key={action.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded text-white ${actionType.color}`}>
              {actionType.icon}
            </div>
            <span className="font-medium text-sm">{actionType.label}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeAction(action.id, isTrue)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div>
          <Label className="text-xs">Action Type</Label>
          <Select
            value={action.type}
            onValueChange={(value: any) => updateAction(action.id, isTrue, { type: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(actionTypes).map(([key, type]) => (
                <SelectItem key={key} value={key}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {action.type === 'send_email' && (
          <>
            <div>
              <Label className="text-xs">Email Template</Label>
              <Select
                value={action.data.templateId || ''}
                onValueChange={(value) => updateAction(action.id, isTrue, {
                  data: { ...action.data, templateId: value }
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
            <div>
              <Label className="text-xs">Subject Override (Optional)</Label>
              <Input
                value={action.data.subject || ''}
                onChange={(e) => updateAction(action.id, isTrue, {
                  data: { ...action.data, subject: e.target.value }
                })}
                className="mt-1"
                placeholder="Override email subject"
              />
            </div>
          </>
        )}

        {action.type === 'wait' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Duration</Label>
              <Input
                type="number"
                value={action.data.duration || 1}
                onChange={(e) => updateAction(action.id, isTrue, {
                  data: { ...action.data, duration: parseInt(e.target.value) }
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Select
                value={action.data.durationUnit || 'days'}
                onValueChange={(value: any) => updateAction(action.id, isTrue, {
                  data: { ...action.data, durationUnit: value }
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
          </div>
        )}

        {(action.type === 'add_tag' || action.type === 'remove_tag') && (
          <div>
            <Label className="text-xs">Tag Name</Label>
            <Input
              value={action.data.tagName || ''}
              onChange={(e) => updateAction(action.id, isTrue, {
                data: { ...action.data, tagName: e.target.value }
              })}
              className="mt-1"
              placeholder="Enter tag name"
            />
          </div>
        )}

        {action.type === 'update_field' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Field Name</Label>
              <Input
                value={action.data.fieldName || ''}
                onChange={(e) => updateAction(action.id, isTrue, {
                  data: { ...action.data, fieldName: e.target.value }
                })}
                className="mt-1"
                placeholder="Field name"
              />
            </div>
            <div>
              <Label className="text-xs">Field Value</Label>
              <Input
                value={action.data.fieldValue || ''}
                onChange={(e) => updateAction(action.id, isTrue, {
                  data: { ...action.data, fieldValue: e.target.value }
                })}
                className="mt-1"
                placeholder="Field value"
              />
            </div>
          </div>
        )}

        {action.type === 'webhook' && (
          <div>
            <Label className="text-xs">Webhook URL</Label>
            <Input
              value={action.data.webhookUrl || ''}
              onChange={(e) => updateAction(action.id, isTrue, {
                data: { ...action.data, webhookUrl: e.target.value }
              })}
              className="mt-1"
              placeholder="https://example.com/webhook"
            />
          </div>
        )}

        {action.type === 'move_to_sequence' && (
          <div>
            <Label className="text-xs">Target Sequence</Label>
            <Select
              value={action.data.sequenceId || ''}
              onValueChange={(value) => updateAction(action.id, isTrue, {
                data: { ...action.data, sequenceId: value }
              })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select sequence" />
              </SelectTrigger>
              <SelectContent>
                {sequences.map(sequence => (
                  <SelectItem key={sequence.id} value={sequence.id}>
                    {sequence.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  if (showRuleEditor && editingRule) {
    return (
      <div className="h-full flex flex-col">
        {/* Editor Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              {branchingRules.find(r => r.id === editingRule.id) ? 'Edit Rule' : 'Create New Rule'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Define conditions and actions for personalized follow-up paths
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowRuleEditor(false)}>
              Cancel
            </Button>
            <Button onClick={saveRule}>
              <Save className="w-4 h-4 mr-2" />
              Save Rule
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Rule Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    placeholder="Enter rule name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={editingRule.priority}
                    onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  placeholder="Describe what this rule does"
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingRule.isActive}
                  onChange={(e) => setEditingRule({ ...editingRule, isActive: e.target.checked })}
                />
                <Label htmlFor="isActive">Rule is active</Label>
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Conditions
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={editingRule.conditionLogic}
                    onValueChange={(value: 'AND' | 'OR') => setEditingRule({ ...editingRule, conditionLogic: value })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={addCondition}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingRule.conditions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conditions defined</p>
                  <p className="text-sm">Add conditions to trigger this rule</p>
                </div>
              ) : (
                editingRule.conditions.map((condition, index) => (
                  <div key={condition.id}>
                    {index > 0 && (
                      <div className="flex justify-center my-2">
                        <Badge variant="outline">{editingRule.conditionLogic}</Badge>
                      </div>
                    )}
                    {renderConditionEditor(condition)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* True Actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    If True Actions
                  </CardTitle>
                  <Button size="sm" onClick={() => addAction(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Action
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingRule.trueActions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No actions defined</p>
                    <p className="text-sm">Add actions for when conditions are met</p>
                  </div>
                ) : (
                  editingRule.trueActions.map(action => renderActionEditor(action, true))
                )}
              </CardContent>
            </Card>

            {/* False Actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    If False Actions
                  </CardTitle>
                  <Button size="sm" onClick={() => addAction(false)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Action
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingRule.falseActions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No actions defined</p>
                    <p className="text-sm">Add actions for when conditions are not met</p>
                  </div>
                ) : (
                  editingRule.falseActions.map(action => renderActionEditor(action, false))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Conditional Branching</h1>
          <p className="text-gray-600 mt-1">Create personalized follow-up paths based on recipient behavior</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => onSave(branchingRules)} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save All Rules'}
          </Button>
          <Button onClick={createNewRule}>
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {branchingRules.length === 0 ? (
          <div className="text-center py-12">
            <Split className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Branching Rules Created
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create conditional branching rules to personalize your email sequences based on recipient engagement and behavior.
            </p>
            <Button onClick={createNewRule}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Rule
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {branchingRules
              .sort((a, b) => a.priority - b.priority)
              .map((rule) => (
                <Card key={rule.id} className={`${selectedRule === rule.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{rule.name}</h3>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">Priority: {rule.priority}</Badge>
                        </div>
                        {rule.description && (
                          <p className="text-gray-600 text-sm mb-3">{rule.description}</p>
                        )}
                        
                        {/* Rule Summary */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Filter className="w-4 h-4" />
                            {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {rule.trueActions.length} true action{rule.trueActions.length !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-red-600" />
                            {rule.falseActions.length} false action{rule.falseActions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleRuleStatus(rule.id)}
                        >
                          {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateRule(rule)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => editRule(rule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Stats */}
                    {rule.stats && (
                      <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{rule.stats.triggered}</p>
                          <p className="text-xs text-gray-600">Triggered</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{rule.stats.truePath}</p>
                          <p className="text-xs text-gray-600">True Path</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{rule.stats.falsePath}</p>
                          <p className="text-xs text-gray-600">False Path</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            {rule.stats.lastTriggered ? new Date(rule.stats.lastTriggered).toLocaleDateString() : 'Never'}
                          </p>
                          <p className="text-xs text-gray-600">Last Triggered</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionalBranching;