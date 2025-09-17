import { createBackupService, BackupConfig } from './backup-service';
import { CronJob } from 'cron';
import path from 'path';

interface ScheduledBackupConfig extends BackupConfig {
  schedule: string; // Cron expression
  maxBackups: number;
  enableHealthChecks: boolean;
  notificationWebhook?: string;
}

export class ScheduledBackupManager {
  private backupService: any;
  private config: ScheduledBackupConfig;
  private cronJob: CronJob | null = null;
  private isRunning = false;

  constructor(config: ScheduledBackupConfig) {
    this.config = config;
    this.backupService = createBackupService(config);
  }

  /**
   * Start the scheduled backup service
   */
  start(): void {
    if (this.cronJob) {
      console.log('⚠️ Scheduled backup is already running');
      return;
    }

    try {
      this.cronJob = new CronJob(
        this.config.schedule,
        () => this.executeBackup(),
        null,
        true,
        'UTC'
      );

      this.isRunning = true;
      console.log(`✅ Scheduled backup started with schedule: ${this.config.schedule}`);
      console.log(`📁 Backup directory: ${this.config.backupDirectory}`);
      console.log(`🔒 Encryption: Enabled`);
      console.log(`📅 Retention: ${this.config.retentionDays} days`);
    } catch (error) {
      console.error('❌ Failed to start scheduled backup:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduled backup service
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      console.log('🛑 Scheduled backup stopped');
    }
  }

  /**
   * Execute backup with error handling and notifications
   */
  private async executeBackup(): Promise<void> {
    const startTime = Date.now();
    console.log(`🔄 Starting scheduled backup at ${new Date().toISOString()}`);

    try {
      // Step 1: Create backup
      const metadata = await this.backupService.createBackup();
      
      // Step 2: Cleanup old backups
      await this.backupService.cleanupOldBackups();
      
      // Step 3: Verify backup integrity
      if (this.config.enableHealthChecks) {
        const isValid = await this.backupService.verifyBackup(metadata.filename);
        if (!isValid) {
          throw new Error('Backup verification failed');
        }
      }
      
      // Step 4: Enforce max backup limit
      await this.enforceMaxBackupLimit();
      
      const duration = Date.now() - startTime;
      const successMessage = `✅ Scheduled backup completed successfully in ${duration}ms`;
      console.log(successMessage);
      console.log(`📄 Backup file: ${metadata.filename}`);
      console.log(`📊 Size: ${this.formatBytes(metadata.size)}`);
      
      // Send success notification
      await this.sendNotification({
        status: 'success',
        message: successMessage,
        metadata,
        duration
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = `❌ Scheduled backup failed: ${error.message}`;
      console.error(errorMessage);
      
      // Send failure notification
      await this.sendNotification({
        status: 'error',
        message: errorMessage,
        error: error.message,
        duration
      });
    }
  }

  /**
   * Enforce maximum backup limit
   */
  private async enforceMaxBackupLimit(): Promise<void> {
    try {
      const backups = await this.backupService.listBackups();
      
      if (backups.length > this.config.maxBackups) {
        const excessCount = backups.length - this.config.maxBackups;
        console.log(`🗑️ Removing ${excessCount} excess backups (max: ${this.config.maxBackups})`);
        
        // Sort by timestamp and remove oldest backups
        const sortedBackups = backups.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        const toRemove = sortedBackups.slice(0, excessCount);
        
        for (const backup of toRemove) {
          try {
            const fs = await import('fs/promises');
            const backupPath = path.join(this.config.backupDirectory, backup.filename);
            await fs.unlink(backupPath);
            console.log(`🗑️ Removed excess backup: ${backup.filename}`);
          } catch (error) {
            console.warn(`⚠️ Failed to remove backup ${backup.filename}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('Failed to enforce backup limit:', error);
    }
  }

  /**
   * Send notification webhook
   */
  private async sendNotification(data: any): Promise<void> {
    if (!this.config.notificationWebhook) {
      return;
    }

    try {
      const response = await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          service: 'database-backup',
          ...data
        })
      });

      if (!response.ok) {
        console.warn(`⚠️ Notification webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to send notification:', error.message);
    }
  }

  /**
   * Get backup service status
   */
  getStatus(): {
    isRunning: boolean;
    schedule: string;
    nextRun: Date | null;
    config: ScheduledBackupConfig;
  } {
    return {
      isRunning: this.isRunning,
      schedule: this.config.schedule,
      nextRun: this.cronJob ? this.cronJob.nextDate().toDate() : null,
      config: this.config
    };
  }

  /**
   * Perform immediate backup (outside of schedule)
   */
  async performImmediateBackup(): Promise<void> {
    console.log('🚀 Performing immediate backup...');
    await this.executeBackup();
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Factory function to create scheduled backup manager
export const createScheduledBackupManager = (customConfig?: Partial<ScheduledBackupConfig>): ScheduledBackupManager => {
  const defaultConfig: ScheduledBackupConfig = {
    databasePath: path.join(process.cwd(), 'prisma', 'dev.db'),
    backupDirectory: path.join(process.cwd(), 'backups'),
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || 'secure-backup-key-2024',
    retentionDays: 30,
    compressionEnabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM UTC
    maxBackups: 50,
    enableHealthChecks: true,
    notificationWebhook: process.env.BACKUP_NOTIFICATION_WEBHOOK
  };
  
  const config = { ...defaultConfig, ...customConfig };
  return new ScheduledBackupManager(config);
};

// Backup schedule presets
export const BACKUP_SCHEDULES = {
  HOURLY: '0 * * * *',
  EVERY_6_HOURS: '0 */6 * * *',
  DAILY_2AM: '0 2 * * *',
  DAILY_MIDNIGHT: '0 0 * * *',
  WEEKLY_SUNDAY: '0 2 * * 0',
  MONTHLY: '0 2 1 * *'
};

// Export types
export type { ScheduledBackupConfig };