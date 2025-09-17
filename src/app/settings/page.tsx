'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Settings, 
  Mail, 
  CreditCard, 
  Database, 
  Server, 
  Shield, 
  Bell, 
  Palette, 
  Globe,
  Save,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface PaymentPlatform {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  connectionPool: number;
  timeout: number;
}

interface SystemConfig {
  maintenanceMode: boolean;
  debugMode: boolean;
  logLevel: string;
  maxFileSize: number;
  sessionTimeout: number;
  rateLimitRequests: number;
  rateLimitWindow: number;
  backupFrequency: string;
  cacheEnabled: boolean;
  compressionEnabled: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Profile state
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    website: '',
    bio: '',
    avatar: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false
    },
    dashboard: {
      showWelcome: true,
      compactMode: false,
      autoRefresh: true,
      refreshInterval: 30
    }
  });

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    fromName: '',
    fromEmail: '',
    replyTo: '',
    templates: {
      welcome: '',
      invoice: '',
      payment: '',
      reminder: ''
    }
  });

  // Payment platforms state
  const [paymentPlatforms, setPaymentPlatforms] = useState<PaymentPlatform[]>([
    { id: 'stripe', name: 'Stripe', enabled: false },
    { id: 'paypal', name: 'PayPal', enabled: false },
    { id: 'square', name: 'Square', enabled: false },
    { id: 'razorpay', name: 'Razorpay', enabled: false },
    { id: 'braintree', name: 'Braintree', enabled: false }
  ]);

  // Database configuration state
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfig>({
    host: 'localhost',
    port: 5432,
    database: 'business_db',
    username: '',
    password: '',
    ssl: true,
    connectionPool: 10,
    timeout: 30
  });

  // System configuration state
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    maxFileSize: 10,
    sessionTimeout: 3600,
    rateLimitRequests: 100,
    rateLimitWindow: 60,
    backupFrequency: 'daily',
    cacheEnabled: true,
    compressionEnabled: true
  });

  // System status
  const [systemStatus, setSystemStatus] = useState({
    uptime: '99.9%',
    lastBackup: '2024-01-15 02:00:00',
    diskUsage: '45%',
    memoryUsage: '62%',
    cpuUsage: '23%',
    activeUsers: 156,
    totalRequests: 45230
  });

  // Event handlers
  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: string, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }));
  };

  const handleDashboardChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      dashboard: { ...prev.dashboard, [field]: value }
    }));
  };

  const handleEmailSettingChange = (field: string, value: any) => {
    setEmailSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailTemplateChange = (template: string, value: string) => {
    setEmailSettings(prev => ({
      ...prev,
      templates: { ...prev.templates, [template]: value }
    }));
  };

  const handlePaymentPlatformToggle = (platformId: string) => {
    setPaymentPlatforms(prev => 
      prev.map(platform => 
        platform.id === platformId 
          ? { ...platform, enabled: !platform.enabled }
          : platform
      )
    );
  };

  const handlePaymentPlatformUpdate = (platformId: string, field: string, value: string) => {
    setPaymentPlatforms(prev => 
      prev.map(platform => 
        platform.id === platformId 
          ? { ...platform, [field]: value }
          : platform
      )
    );
  };

  const handleDatabaseConfigChange = (field: keyof DatabaseConfig, value: any) => {
    setDatabaseConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSystemConfigChange = (field: keyof SystemConfig, value: any) => {
    setSystemConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus('saving');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseBackup = async () => {
    setLoading(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Database backup completed successfully!');
    } catch (error) {
      alert('Backup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseRestore = async () => {
    if (confirm('Are you sure you want to restore the database? This action cannot be undone.')) {
      setLoading(true);
      try {
        // Simulate restore process
        await new Promise(resolve => setTimeout(resolve, 3000));
        alert('Database restored successfully!');
      } catch (error) {
        alert('Restore failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gray-50 p-1 rounded-t-xl">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                System
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and profile settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                      <Input
                        placeholder="Enter your full name"
                        value={profile.fullName}
                        onChange={(e) => handleProfileChange('fullName', e.target.value)}
                        className="mt-1 border-gray-200 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className="mt-1 border-gray-200 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                      <Input
                        placeholder="Enter your phone number"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        className="mt-1 border-gray-200 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Company</Label>
                      <Input
                        placeholder="Enter your company name"
                        value={profile.company}
                        onChange={(e) => handleProfileChange('company', e.target.value)}
                        className="mt-1 border-gray-200 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Position</Label>
                      <Input
                        placeholder="Enter your position"
                        value={profile.position}
                        onChange={(e) => handleProfileChange('position', e.target.value)}
                        className="mt-1 border-gray-200 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Website</Label>
                      <Input
                        placeholder="Enter your website URL"
                        value={profile.website}
                        onChange={(e) => handleProfileChange('website', e.target.value)}
                        className="mt-1 border-gray-200 focus:border-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Bio</Label>
                    <Textarea
                      placeholder="Tell us about yourself"
                      value={profile.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      className="mt-1 border-gray-200 focus:border-slate-500 min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="p-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Theme</Label>
                        <Select value={preferences.theme} onValueChange={(value) => handlePreferenceChange('theme', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Language</Label>
                        <Select value={preferences.language} onValueChange={(value) => handlePreferenceChange('language', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Email Notifications</Label>
                          <p className="text-xs text-gray-500">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={preferences.notifications.email}
                          onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Push Notifications</Label>
                          <p className="text-xs text-gray-500">Receive push notifications in browser</p>
                        </div>
                        <Switch
                          checked={preferences.notifications.push}
                          onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">SMS Notifications</Label>
                          <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                        </div>
                        <Switch
                          checked={preferences.notifications.sms}
                          onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email" className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure SMTP settings and email templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">SMTP Host</Label>
                      <Input
                        placeholder="smtp.gmail.com"
                        value={emailSettings.smtpHost}
                        onChange={(e) => handleEmailSettingChange('smtpHost', e.target.value)}
                        className="mt-1 border-gray-200 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">SMTP Port</Label>
                      <Input
                        type="number"
                        placeholder="587"
                        value={emailSettings.smtpPort}
                        onChange={(e) => handleEmailSettingChange('smtpPort', parseInt(e.target.value))}
                        className="mt-1 border-gray-200 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">SMTP Username</Label>
                      <Input
                        placeholder="your-email@gmail.com"
                        value={emailSettings.smtpUser}
                        onChange={(e) => handleEmailSettingChange('smtpUser', e.target.value)}
                        className="mt-1 border-gray-200 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">SMTP Password</Label>
                      <Input
                        type="password"
                        placeholder="Your app password"
                        value={emailSettings.smtpPassword}
                        onChange={(e) => handleEmailSettingChange('smtpPassword', e.target.value)}
                        className="mt-1 border-gray-200 focus:border-slate-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Platforms
                  </CardTitle>
                  <CardDescription>
                    Configure payment processing platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {paymentPlatforms.map((platform) => (
                    <div key={platform.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900">{platform.name}</h3>
                          <Badge variant={platform.enabled ? "default" : "secondary"}>
                            {platform.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <Switch
                          checked={platform.enabled}
                          onCheckedChange={() => handlePaymentPlatformToggle(platform.id)}
                        />
                      </div>
                      {platform.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">API Key</Label>
                            <Input
                              type="password"
                              placeholder="Enter API key"
                              value={platform.apiKey || ''}
                              onChange={(e) => handlePaymentPlatformUpdate(platform.id, 'apiKey', e.target.value)}
                              className="mt-1 border-gray-200 focus:border-slate-500"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Secret Key</Label>
                            <Input
                              type="password"
                              placeholder="Enter secret key"
                              value={platform.secretKey || ''}
                              onChange={(e) => handlePaymentPlatformUpdate(platform.id, 'secretKey', e.target.value)}
                              className="mt-1 border-gray-200 focus:border-slate-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Database Tab */}
            <TabsContent value="database" className="p-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Database Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure database connection and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Host</Label>
                        <Input
                          placeholder="localhost"
                          value={databaseConfig.host}
                          onChange={(e) => handleDatabaseConfigChange('host', e.target.value)}
                          className="mt-1 border-gray-200 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Port</Label>
                        <Input
                          type="number"
                          placeholder="5432"
                          value={databaseConfig.port}
                          onChange={(e) => handleDatabaseConfigChange('port', parseInt(e.target.value))}
                          className="mt-1 border-gray-200 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Database Name</Label>
                        <Input
                          placeholder="business_db"
                          value={databaseConfig.database}
                          onChange={(e) => handleDatabaseConfigChange('database', e.target.value)}
                          className="mt-1 border-gray-200 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Username</Label>
                        <Input
                          placeholder="Enter username"
                          value={databaseConfig.username}
                          onChange={(e) => handleDatabaseConfigChange('username', e.target.value)}
                          className="mt-1 border-gray-200 focus:border-slate-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button onClick={handleDatabaseBackup} disabled={loading} className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        {loading ? 'Backing up...' : 'Backup Database'}
                      </Button>
                      <Button onClick={handleDatabaseRestore} disabled={loading} variant="outline" className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {loading ? 'Restoring...' : 'Restore Database'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="p-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      System Configuration
                    </CardTitle>
                    <CardDescription>
                      Advanced system settings and monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Maintenance Mode</Label>
                          <p className="text-xs text-gray-500">Enable maintenance mode</p>
                        </div>
                        <Switch
                          checked={systemConfig.maintenanceMode}
                          onCheckedChange={(checked) => handleSystemConfigChange('maintenanceMode', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Debug Mode</Label>
                          <p className="text-xs text-gray-500">Enable debug logging</p>
                        </div>
                        <Switch
                          checked={systemConfig.debugMode}
                          onCheckedChange={(checked) => handleSystemConfigChange('debugMode', checked)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Session Timeout (seconds)</Label>
                        <Input
                          type="number"
                          placeholder="3600"
                          value={systemConfig.sessionTimeout}
                          onChange={(e) => handleSystemConfigChange('sessionTimeout', parseInt(e.target.value))}
                          className="mt-1 border-gray-200 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Rate Limit (requests)</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={systemConfig.rateLimitRequests}
                          onChange={(e) => handleSystemConfigChange('rateLimitRequests', parseInt(e.target.value))}
                          className="mt-1 border-gray-200 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Rate Limit Window (minutes)</Label>
                        <Input
                          type="number"
                          placeholder="60"
                          value={systemConfig.rateLimitWindow}
                          onChange={(e) => handleSystemConfigChange('rateLimitWindow', parseInt(e.target.value))}
                          className="mt-1 border-gray-200 focus:border-slate-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{systemStatus.uptime}</div>
                        <div className="text-sm text-gray-600">Uptime</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{systemStatus.activeUsers}</div>
                        <div className="text-sm text-gray-600">Active Users</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{systemStatus.diskUsage}</div>
                        <div className="text-sm text-gray-600">Disk Usage</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{systemStatus.memoryUsage}</div>
                        <div className="text-sm text-gray-600">Memory Usage</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {saveStatus === 'saved' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Settings saved successfully</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Failed to save settings</span>
                  </div>
                )}
              </div>
              <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
