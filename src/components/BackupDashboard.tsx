'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Database, 
  Clock, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  HardDrive,
  Lock
} from 'lucide-react';

interface BackupInfo {
  filename: string;
  timestamp: string;
  size: number;
  checksum: string;
  encrypted: boolean;
}

interface BackupStatus {
  initialized: boolean;
  isRunning: boolean;
  lastBackup?: string;
  nextBackup?: string;
  totalBackups: number;
  totalSize: number;
  message?: string;
}

export default function BackupDashboard() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup');
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups || []);
        setStatus(data.status);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch backups' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to backup service' });
    }
  };

  const performBackup = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Backup created successfully!' });
        await fetchBackups();
      } else {
        setMessage({ type: 'error', text: data.error || 'Backup failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' });
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete backup: ${filename}?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup', filename })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Backup deleted successfully!' });
        await fetchBackups();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete backup' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete backup' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    fetchBackups();
    const interval = setInterval(fetchBackups, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Database Backup Management</h2>
          <p className="text-muted-foreground">Secure, encrypted database backups with automated scheduling</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchBackups} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={performBackup} disabled={loading}>
            <Database className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Backup'}
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={status?.isRunning ? 'default' : 'secondary'}>
                {status?.isRunning ? 'Running' : 'Stopped'}
              </Badge>
              <Lock className="h-3 w-3 text-green-600" title="Encryption Enabled" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.totalBackups || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(status?.totalSize || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {status?.lastBackup ? formatDate(status.lastBackup) : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            All backups are encrypted with AES-256-CBC encryption
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backups found</p>
              <p className="text-sm">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup, index) => (
                <div key={backup.filename} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      {backup.encrypted && <Lock className="h-4 w-4 text-green-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{backup.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(backup.timestamp)} • {formatFileSize(backup.size)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Checksum: {backup.checksum.substring(0, 16)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteBackup(backup.filename)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}