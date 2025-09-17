import { promises as fs } from 'fs';
import { createHash, createCipher, createDecipher, randomBytes } from 'crypto';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface BackupConfig {
  databasePath: string;
  backupDirectory: string;
  encryptionKey: string;
  retentionDays: number;
  compressionEnabled: boolean;
}

interface BackupMetadata {
  timestamp: string;
  filename: string;
  size: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
}

export class SecureBackupService {
  private config: BackupConfig;
  private readonly ALGORITHM = 'aes-256-cbc';
  private readonly BACKUP_EXTENSION = '.backup';
  private readonly ENCRYPTED_EXTENSION = '.enc';
  private readonly METADATA_FILE = 'backup-metadata.json';

  constructor(config: BackupConfig) {
    this.config = config;
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.config.backupDirectory);
    } catch {
      await fs.mkdir(this.config.backupDirectory, { recursive: true });
    }
  }

  /**
   * Create a secure backup with encryption
   */
  async createBackup(): Promise<BackupMetadata> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `database-backup-${timestamp}${this.BACKUP_EXTENSION}`;
    const backupPath = path.join(this.config.backupDirectory, backupFilename);
    
    try {
      // Step 1: Create SQLite backup using .backup command
      await this.createSQLiteBackup(backupPath);
      
      // Step 2: Calculate checksum before encryption
      const checksum = await this.calculateChecksum(backupPath);
      
      // Step 3: Encrypt the backup file
      const encryptedPath = await this.encryptFile(backupPath);
      
      // Step 4: Remove unencrypted backup
      await fs.unlink(backupPath);
      
      // Step 5: Get file stats
      const stats = await fs.stat(encryptedPath);
      
      const metadata: BackupMetadata = {
        timestamp,
        filename: path.basename(encryptedPath),
        size: stats.size,
        checksum,
        encrypted: true,
        compressed: this.config.compressionEnabled
      };
      
      // Step 6: Update metadata file
      await this.updateMetadata(metadata);
      
      console.log(`✅ Secure backup created: ${metadata.filename}`);
      return metadata;
      
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Create SQLite backup using the .backup command
   */
  private async createSQLiteBackup(outputPath: string): Promise<void> {
    const command = `sqlite3 "${this.config.databasePath}" ".backup '${outputPath}'"`;;
    
    try {
      await execAsync(command);
    } catch (error) {
      throw new Error(`SQLite backup failed: ${error.message}`);
    }
  }

  /**
   * Encrypt a file using AES-256-CBC
   */
  private async encryptFile(filePath: string): Promise<string> {
    const encryptedPath = filePath + this.ENCRYPTED_EXTENSION;
    const iv = randomBytes(16);
    const cipher = createCipher(this.ALGORITHM, this.config.encryptionKey);
    
    try {
      const input = await fs.readFile(filePath);
      const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
      
      // Prepend IV to encrypted data
      const encryptedWithIV = Buffer.concat([iv, encrypted]);
      await fs.writeFile(encryptedPath, encryptedWithIV);
      
      return encryptedPath;
    } catch (error) {
      throw new Error(`File encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a backup file
   */
  async decryptBackup(encryptedFilePath: string, outputPath: string): Promise<void> {
    try {
      const encryptedData = await fs.readFile(encryptedFilePath);
      
      // Extract IV from the beginning of the file
      const iv = encryptedData.slice(0, 16);
      const encrypted = encryptedData.slice(16);
      
      const decipher = createDecipher(this.ALGORITHM, this.config.encryptionKey);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      
      await fs.writeFile(outputPath, decrypted);
      console.log(`✅ Backup decrypted to: ${outputPath}`);
    } catch (error) {
      throw new Error(`Backup decryption failed: ${error.message}`);
    }
  }

  /**
   * Calculate SHA-256 checksum of a file
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const data = await fs.readFile(filePath);
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Update backup metadata
   */
  private async updateMetadata(newBackup: BackupMetadata): Promise<void> {
    const metadataPath = path.join(this.config.backupDirectory, this.METADATA_FILE);
    
    let metadata: BackupMetadata[] = [];
    
    try {
      const existingData = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(existingData);
    } catch {
      // File doesn't exist or is invalid, start fresh
    }
    
    metadata.push(newBackup);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<void> {
    const metadataPath = path.join(this.config.backupDirectory, this.METADATA_FILE);
    
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata: BackupMetadata[] = JSON.parse(data);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      
      const toDelete = metadata.filter(backup => {
        const backupDate = new Date(backup.timestamp);
        return backupDate < cutoffDate;
      });
      
      for (const backup of toDelete) {
        const backupPath = path.join(this.config.backupDirectory, backup.filename);
        try {
          await fs.unlink(backupPath);
          console.log(`🗑️ Deleted old backup: ${backup.filename}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete backup ${backup.filename}:`, error.message);
        }
      }
      
      // Update metadata to remove deleted backups
      const remainingMetadata = metadata.filter(backup => {
        const backupDate = new Date(backup.timestamp);
        return backupDate >= cutoffDate;
      });
      
      await fs.writeFile(metadataPath, JSON.stringify(remainingMetadata, null, 2));
      
      console.log(`✅ Cleanup completed. Removed ${toDelete.length} old backups.`);
    } catch (error) {
      console.error('❌ Backup cleanup failed:', error);
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    const metadataPath = path.join(this.config.backupDirectory, this.METADATA_FILE);
    
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupFilename: string, targetDatabasePath?: string): Promise<void> {
    const backupPath = path.join(this.config.backupDirectory, backupFilename);
    const tempDecryptedPath = path.join(this.config.backupDirectory, 'temp-restore.db');
    const targetPath = targetDatabasePath || this.config.databasePath;
    
    try {
      // Step 1: Decrypt backup
      await this.decryptBackup(backupPath, tempDecryptedPath);
      
      // Step 2: Verify checksum
      const metadata = await this.listBackups();
      const backupMetadata = metadata.find(m => m.filename === backupFilename);
      
      if (backupMetadata) {
        const currentChecksum = await this.calculateChecksum(tempDecryptedPath);
        if (currentChecksum !== backupMetadata.checksum) {
          throw new Error('Backup integrity check failed - checksum mismatch');
        }
      }
      
      // Step 3: Replace current database
      await fs.copyFile(tempDecryptedPath, targetPath);
      
      // Step 4: Cleanup temp file
      await fs.unlink(tempDecryptedPath);
      
      console.log(`✅ Database restored from backup: ${backupFilename}`);
    } catch (error) {
      // Cleanup temp file if it exists
      try {
        await fs.unlink(tempDecryptedPath);
      } catch {}
      
      throw new Error(`Database restore failed: ${error.message}`);
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupFilename: string): Promise<boolean> {
    const backupPath = path.join(this.config.backupDirectory, backupFilename);
    const tempPath = path.join(this.config.backupDirectory, 'temp-verify.db');
    
    try {
      await this.decryptBackup(backupPath, tempPath);
      
      const metadata = await this.listBackups();
      const backupMetadata = metadata.find(m => m.filename === backupFilename);
      
      if (!backupMetadata) {
        throw new Error('Backup metadata not found');
      }
      
      const checksum = await this.calculateChecksum(tempPath);
      await fs.unlink(tempPath);
      
      return checksum === backupMetadata.checksum;
    } catch (error) {
      try {
        await fs.unlink(tempPath);
      } catch {}
      
      console.error('Backup verification failed:', error);
      return false;
    }
  }
}

// Default configuration
export const createBackupService = (customConfig?: Partial<BackupConfig>): SecureBackupService => {
  const defaultConfig: BackupConfig = {
    databasePath: './prisma/dev.db',
    backupDirectory: './backups',
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production',
    retentionDays: 30,
    compressionEnabled: true
  };
  
  const config = { ...defaultConfig, ...customConfig };
  return new SecureBackupService(config);
};

// Export types
export type { BackupConfig, BackupMetadata };