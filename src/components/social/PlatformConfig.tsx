"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Key,
  Globe,
  Users
} from "lucide-react";
import { toast } from "sonner";

// Types
interface PlatformConfig {
  id: string;
  platform: string;
  displayName: string;
  isEnabled: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  accountId?: string;
  accountName?: string;
  createdAt: string;
  updatedAt: string;
}

// Platform configurations
const PLATFORMS = {
  facebook: {
    name: 'Facebook',
    color: 'bg-blue-500',
    icon: '📘',
    description: 'Connect your Facebook page to schedule posts',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true },
      { key: 'pageId', label: 'Page ID', type: 'text', required: true }
    ],
    validation: {
      maxTextLength: 63206,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      maxFileSize: '100MB'
    }
  },
  twitter: {
    name: 'Twitter',
    color: 'bg-sky-500',
    icon: '🐦',
    description: 'Connect your Twitter account to schedule tweets',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'bearerToken', label: 'Bearer Token', type: 'password', required: true }
    ],
    validation: {
      maxTextLength: 280,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
      maxFileSize: '512MB'
    }
  },
  instagram: {
    name: 'Instagram',
    color: 'bg-pink-500',
    icon: '📷',
    description: 'Connect your Instagram business account',
    authUrl: 'https://api.instagram.com/oauth/authorize',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'accountId', label: 'Business Account ID', type: 'text', required: true }
    ],
    validation: {
      maxTextLength: 2200,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      maxFileSize: '100MB'
    }
  },
  linkedin: {
    name: 'LinkedIn',
    color: 'bg-blue-700',
    icon: '💼',
    description: 'Connect your LinkedIn company page',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'companyId', label: 'Company ID', type: 'text', required: false }
    ],
    validation: {
      maxTextLength: 3000,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      maxFileSize: '200MB'
    }
  },
  youtube: {
    name: 'YouTube',
    color: 'bg-red-600',
    icon: '📺',
    description: 'Connect your YouTube channel to upload videos',
    authUrl: 'https://accounts.google.com/oauth2/auth',
    fields: [
      { key: 'channelId', label: 'Channel ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true }
    ],
    validation: {
      maxTitleLength: 100,
      maxDescriptionLength: 5000,
      supportedMediaTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
      maxFileSize: '256GB',
      requiredScopes: ['https://www.googleapis.com/auth/youtube.upload']
    }
  },
  tiktok: {
    name: 'TikTok',
    color: 'bg-black',
    icon: '🎵',
    description: 'Connect your TikTok account to schedule videos',
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true }
    ],
    validation: {
      maxTextLength: 150,
      supportedMediaTypes: ['video/mp4', 'video/mov'],
      maxFileSize: '287MB',
      minDuration: '3s',
      maxDuration: '3min',
      requiredAspectRatio: '9:16'
    }
  },
  custom: {
    name: 'Custom Platform',
    color: 'bg-gray-600',
    icon: '⚙️',
    description: 'Connect a custom platform via webhook or API',
    authUrl: '',
    fields: [
      { key: 'name', label: 'Platform Name', type: 'text', required: true },
      { key: 'baseUrl', label: 'Base URL', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', required: false }
    ],
    validation: {
      maxTextLength: 1000,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      maxFileSize: '50MB'
    },
    configurable: true
  }
};

// Platform Card Component
function PlatformCard({ config, platform, onEdit, onDelete, onToggle }: {
  config?: PlatformConfig;
  platform: string;
  onEdit: (platform: string, config?: PlatformConfig) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const platformInfo = PLATFORMS[platform as keyof typeof PLATFORMS];
  const isConnected = !!config;
  const isEnabled = config?.isEnabled || false;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md border-l-4 ${
      isConnected 
        ? isEnabled 
          ? 'border-l-green-500 bg-green-50' 
          : 'border-l-yellow-500 bg-yellow-50'
        : 'border-l-gray-300 bg-gray-50'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{platformInfo.icon}</div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {platformInfo.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {platformInfo.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Badge variant={isEnabled ? "default" : "secondary"} className="flex items-center gap-1">
                  {isEnabled ? (
                    <><CheckCircle className="w-3 h-3" /> Active</>
                  ) : (
                    <><XCircle className="w-3 h-3" /> Disabled</>
                  )}
                </Badge>
                
                {config && (
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => onToggle(config.id, checked)}
                  />
                )}
              </>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Not Connected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isConnected && config ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Account:</span>
                <p className="font-medium">{config.accountName || 'Connected Account'}</p>
              </div>
              <div>
                <span className="text-gray-600">Connected:</span>
                <p className="font-medium">
                  {new Date(config.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(platform, config)}
                className="flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                Edit
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(platformInfo.authUrl, '_blank')}
                className="flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Reconnect
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="flex items-center gap-1">
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Platform</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {platformInfo.name} integration? 
                      This will disable all scheduled posts for this platform.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(config.id)}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {/* Platform validation info */}
            <div className="p-3 bg-gray-100 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Platform Limits</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Max text:</span> {platformInfo.validation.maxTextLength || platformInfo.validation.maxTitleLength || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Max file:</span> {platformInfo.validation.maxFileSize}
                </div>
                {platformInfo.validation.requiredAspectRatio && (
                  <div className="col-span-2">
                    <span className="font-medium">Aspect ratio:</span> {platformInfo.validation.requiredAspectRatio}
                  </div>
                )}
                {platformInfo.validation.minDuration && (
                  <div>
                    <span className="font-medium">Min duration:</span> {platformInfo.validation.minDuration}
                  </div>
                )}
                {platformInfo.validation.maxDuration && (
                  <div>
                    <span className="font-medium">Max duration:</span> {platformInfo.validation.maxDuration}
                  </div>
                )}
                {platformInfo.validation.requiredScopes && (
                  <div className="col-span-2">
                    <span className="font-medium">Required scopes:</span> YouTube upload permissions
                  </div>
                )}
              </div>
              <div className="mt-2">
                <span className="font-medium text-xs text-gray-700">Supported media:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {platformInfo.validation.supportedMediaTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs px-1 py-0">
                      {type.split('/')[1]}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-3">
              Connect your {platformInfo.name} account to start scheduling posts
            </p>
            <Button
              onClick={() => onEdit(platform)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Connect {platformInfo.name}
            </Button>
            
            {/* Platform validation info for unconnected platforms */}
            <div className="p-3 bg-gray-50 rounded-lg mt-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Platform Limits</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Max text:</span> {platformInfo.validation.maxTextLength || platformInfo.validation.maxTitleLength || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Max file:</span> {platformInfo.validation.maxFileSize}
                </div>
                {platformInfo.validation.requiredAspectRatio && (
                  <div className="col-span-2">
                    <span className="font-medium">Aspect ratio:</span> {platformInfo.validation.requiredAspectRatio}
                  </div>
                )}
                {platformInfo.validation.minDuration && (
                  <div>
                    <span className="font-medium">Min duration:</span> {platformInfo.validation.minDuration}
                  </div>
                )}
                {platformInfo.validation.maxDuration && (
                  <div>
                    <span className="font-medium">Max duration:</span> {platformInfo.validation.maxDuration}
                  </div>
                )}
                {platformInfo.validation.requiredScopes && (
                  <div className="col-span-2">
                    <span className="font-medium">Required scopes:</span> YouTube upload permissions
                  </div>
                )}
              </div>
              <div className="mt-2">
                <span className="font-medium text-xs text-gray-700">Supported media:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {platformInfo.validation.supportedMediaTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs px-1 py-0">
                      {type.split('/')[1]}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Platform Configuration Form
function PlatformConfigForm({ platform, config, onSave, onCancel }: {
  platform: string;
  config?: PlatformConfig;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const platformInfo = PLATFORMS[platform as keyof typeof PLATFORMS];
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<Array<{key: string, label: string, type: string, required: boolean}>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) {
      // Pre-fill form with existing config (without sensitive data)
      const baseData = {
        displayName: config.displayName,
        accountName: config.accountName || '',
        accountId: config.accountId || ''
      };
      
      // For custom platforms, also load custom fields
      if (platform === 'custom' && config.customFields) {
        setCustomFields(config.customFields);
        // Add custom field values to form data
        config.customFields.forEach(field => {
          baseData[field.key] = config[field.key] || '';
        });
      }
      
      setFormData(baseData);
    } else {
      setFormData({ displayName: platformInfo.name });
      if (platform === 'custom') {
        setCustomFields([]);
      }
    }
  }, [config, platformInfo.name, platform]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields from platform definition
      const missingFields = platformInfo.fields
        .filter(field => field.required && !formData[field.key])
        .map(field => field.label);

      // For custom platforms, also validate custom fields
      if (platform === 'custom') {
        const missingCustomFields = customFields
          .filter(field => field.required && !formData[field.key])
          .map(field => field.label);
        missingFields.push(...missingCustomFields);
      }

      if (missingFields.length > 0) {
        toast.error(`Please fill in: ${missingFields.join(', ')}`);
        return;
      }

      const configData = {
        platform,
        displayName: formData.displayName || platformInfo.name,
        isEnabled: true,
        ...formData
      };

      // For custom platforms, include custom fields definition
      if (platform === 'custom') {
        configData.customFields = customFields;
      }

      onSave(configData);
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const addCustomField = () => {
    const newField = {
      key: `custom_field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false
    };
    setCustomFields([...customFields, newField]);
  };

  const updateCustomField = (index: number, updates: Partial<typeof customFields[0]>) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], ...updates };
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    const updated = customFields.filter((_, i) => i !== index);
    setCustomFields(updated);
    // Also remove the field data
    const fieldKey = customFields[index].key;
    const newFormData = { ...formData };
    delete newFormData[fieldKey];
    setFormData(newFormData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{platformInfo.icon}</div>
        <div>
          <h3 className="text-lg font-semibold">{platformInfo.name} Configuration</h3>
          <p className="text-sm text-gray-600">{platformInfo.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={formData.displayName || ''}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder={`My ${platformInfo.name} Account`}
          />
        </div>

        {platformInfo.fields.map((field) => (
          <div key={field.key}>
            <Label htmlFor={field.key}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.key}
              type={field.type}
              value={formData[field.key] || ''}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              placeholder={`Enter your ${field.label.toLowerCase()}`}
              required={field.required}
            />
          </div>
        ))}

        {/* Custom Platform Fields Management */}
        {platform === 'custom' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Custom API Fields</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomField}
                className="flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Field
              </Button>
            </div>
            
            {customFields.map((field, index) => (
              <div key={field.key} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-sm">Field {index + 1}</h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomField(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`field-label-${index}`}>Field Label</Label>
                    <Input
                      id={`field-label-${index}`}
                      value={field.label}
                      onChange={(e) => updateCustomField(index, { label: e.target.value })}
                      placeholder="e.g., API Token"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`field-type-${index}`}>Field Type</Label>
                    <select
                      id={`field-type-${index}`}
                      value={field.type}
                      onChange={(e) => updateCustomField(index, { type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="password">Password</option>
                      <option value="url">URL</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`field-required-${index}`}
                    checked={field.required}
                    onChange={(e) => updateCustomField(index, { required: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor={`field-required-${index}`} className="text-sm">
                    Required field
                  </Label>
                </div>
                
                {field.label && (
                  <div>
                    <Label htmlFor={`field-value-${index}`}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={`field-value-${index}`}
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {customFields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No custom fields added yet.</p>
                <p className="text-sm">Click "Add Field" to create custom API configuration fields.</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Key className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">API Configuration</h4>
              <p className="text-sm text-blue-700 mt-1">
                You'll need to create an app in {platformInfo.name} Developer Console to get these credentials.
              </p>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                onClick={() => window.open(platformInfo.authUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open {platformInfo.name} Developer Console
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? 'Saving...' : config ? 'Update Configuration' : 'Save Configuration'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Main Platform Configuration Component
export default function PlatformConfig() {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<PlatformConfig | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/social-platforms');
      const data = await response.json();
      if (data.success) {
        setConfigs(data.data);
      }
    } catch (error) {
      console.error('Error fetching platform configs:', error);
      toast.error('Failed to fetch platform configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (configData: any) => {
    try {
      const response = await fetch('/api/social-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });

      const data = await response.json();
      if (data.success) {
        await fetchConfigs();
        setShowConfigForm(false);
        setEditingPlatform(null);
        setEditingConfig(null);
        toast.success('Platform configuration saved successfully!');
      } else {
        toast.error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      const response = await fetch('/api/social-platforms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });

      const data = await response.json();
      if (data.success) {
        setConfigs(configs.filter(c => c.id !== id));
        toast.success('Platform configuration removed successfully!');
      } else {
        toast.error(data.error || 'Failed to remove configuration');
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Failed to remove configuration');
    }
  };

  const handleToggleConfig = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/social-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isEnabled: enabled })
      });

      const data = await response.json();
      if (data.success) {
        setConfigs(configs.map(c => 
          c.id === id ? { ...c, isEnabled: enabled } : c
        ));
        toast.success(`Platform ${enabled ? 'enabled' : 'disabled'} successfully!`);
      } else {
        toast.error(data.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Error toggling config:', error);
      toast.error('Failed to update configuration');
    }
  };

  const handleEditPlatform = (platform: string, config?: PlatformConfig) => {
    setEditingPlatform(platform);
    setEditingConfig(config || null);
    setShowConfigForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading platform configurations...</div>
      </div>
    );
  }

  // Group configs by platform
  const configsByPlatform = configs.reduce((acc, config) => {
    acc[config.platform] = config;
    return acc;
  }, {} as Record<string, PlatformConfig>);

  const connectedCount = configs.filter(c => c.isEnabled).length;
  const totalPlatforms = Object.keys(PLATFORMS).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Integrations</h2>
          <p className="text-gray-600 mt-1">
            Connect your social media accounts to schedule and publish posts
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">Connected Platforms</div>
            <div className="text-2xl font-bold text-green-600">
              {connectedCount}/{totalPlatforms}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Platforms</p>
                <p className="text-2xl font-bold">{totalPlatforms}</p>
              </div>
              <Globe className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-600">{totalPlatforms - connectedCount}</p>
              </div>
              <Users className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(PLATFORMS).map((platform) => (
          <PlatformCard
            key={platform}
            platform={platform}
            config={configsByPlatform[platform]}
            onEdit={handleEditPlatform}
            onDelete={handleDeleteConfig}
            onToggle={handleToggleConfig}
          />
        ))}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={showConfigForm} onOpenChange={setShowConfigForm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit' : 'Configure'} Platform Integration
            </DialogTitle>
          </DialogHeader>
          {editingPlatform && (
            <PlatformConfigForm
              platform={editingPlatform}
              config={editingConfig || undefined}
              onSave={handleSaveConfig}
              onCancel={() => {
                setShowConfigForm(false);
                setEditingPlatform(null);
                setEditingConfig(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}