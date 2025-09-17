import { createScheduledBackupManager, BACKUP_SCHEDULES } from './scheduled-backup';
import path from 'path';

// Global backup manager instance
let backupManager: any = null;

/**
 * Initialize and start the backup service
 */
export const initializeBackupService = () => {
  if (backupManager) {
    console.log('⚠️ Backup service is already initialized');
    return backupManager;
  }

  try {
    // Create backup manager with environment-based configuration
    backupManager = createScheduledBackupManager({
      databasePath: process.env.DATABASE_PATH || path.join(process.cwd(), 'prisma', 'dev.db'),
      backupDirectory: process.env.BACKUP_DIRECTORY || path.join(process.cwd(), 'backups'),
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || 'secure-backup-key-2024-change-in-production',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      compressionEnabled: process.env.BACKUP_COMPRESSION !== 'false',
      schedule: process.env.BACKUP_SCHEDULE || BACKUP_SCHEDULES.DAILY_2AM,
      maxBackups: parseInt(process.env.MAX_BACKUP_COUNT || '50'),
      enableHealthChecks: process.env.BACKUP_HEALTH_CHECKS !== 'false',
      notificationWebhook: process.env.BACKUP_NOTIFICATION_WEBHOOK
    });

    // Start the scheduled backup service
    backupManager.start();
    
    console.log('✅ Database backup service initialized successfully');
    console.log('🔐 Encryption: Enabled');
    console.log('📅 Schedule:', process.env.BACKUP_SCHEDULE || BACKUP_SCHEDULES.DAILY_2AM);
    console.log('📁 Backup Directory:', process.env.BACKUP_DIRECTORY || path.join(process.cwd(), 'backups'));
    
    return backupManager;
  } catch (error) {
    console.error('❌ Failed to initialize backup service:', error);
    throw error;
  }
};

/**
 * Get the current backup manager instance
 */
export const getBackupManager = () => {
  if (!backupManager) {
    throw new Error('Backup service not initialized. Call initializeBackupService() first.');
  }
  return backupManager;
};

/**
 * Stop the backup service
 */
export const stopBackupService = () => {
  if (backupManager) {
    backupManager.stop();
    backupManager = null;
    console.log('🛑 Backup service stopped');
  }
};

/**
 * Get backup service status
 */
export const getBackupStatus = () => {
  if (!backupManager) {
    return {
      initialized: false,
      isRunning: false,
      message: 'Backup service not initialized'
    };
  }
  
  const status = backupManager.getStatus();
  return {
    initialized: true,
    ...status
  };
};

/**
 * Perform immediate backup
 */
export const performImmediateBackup = async () => {
  if (!backupManager) {
    throw new Error('Backup service not initialized');
  }
  
  return await backupManager.performImmediateBackup();
};

// Auto-initialize in production environments
if (process.env.NODE_ENV === 'production' && process.env.AUTO_START_BACKUP === 'true') {
  try {
    initializeBackupService();
  } catch (error) {
    console.error('Failed to auto-initialize backup service:', error);
  }
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping backup service...');
  stopBackupService();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping backup service...');
  stopBackupService();
  process.exit(0);
});