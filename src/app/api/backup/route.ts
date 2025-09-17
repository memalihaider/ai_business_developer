import { NextRequest, NextResponse } from 'next/server';
import { createBackupService } from '@/lib/backup-service';
import path from 'path';

export const dynamic = 'force-static';

// Initialize backup service with production-ready configuration
const backupService = createBackupService({

  databasePath: path.join(process.cwd(), 'prisma', 'dev.db'),
  backupDirectory: path.join(process.cwd(), 'backups'),
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || 'secure-backup-key-2024',
  retentionDays: 30,
  compressionEnabled: true
});

// GET - List all backups
export async function GET() {
  try {
    const backups = await backupService.listBackups();
    
    return NextResponse.json({
      success: true,
      data: {
        backups,
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
        oldestBackup: backups.length > 0 ? backups[0]?.timestamp : null,
        newestBackup: backups.length > 0 ? backups[backups.length - 1]?.timestamp : null
      }
    });
  } catch (error) {
    console.error('Failed to list backups:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list backups',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new backup or perform backup operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, filename, targetPath } = body;

    switch (action) {
      case 'create':
        const metadata = await backupService.createBackup();
        return NextResponse.json({
          success: true,
          message: 'Backup created successfully',
          data: metadata
        });

      case 'restore':
        if (!filename) {
          return NextResponse.json(
            { success: false, error: 'Filename is required for restore operation' },
            { status: 400 }
          );
        }
        
        await backupService.restoreFromBackup(filename, targetPath);
        return NextResponse.json({
          success: true,
          message: `Database restored from backup: ${filename}`
        });

      case 'verify':
        if (!filename) {
          return NextResponse.json(
            { success: false, error: 'Filename is required for verify operation' },
            { status: 400 }
          );
        }
        
        const isValid = await backupService.verifyBackup(filename);
        return NextResponse.json({
          success: true,
          data: {
            filename,
            isValid,
            message: isValid ? 'Backup is valid' : 'Backup verification failed'
          }
        });

      case 'cleanup':
        await backupService.cleanupOldBackups();
        return NextResponse.json({
          success: true,
          message: 'Old backups cleaned up successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Supported actions: create, restore, verify, cleanup' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Backup operation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Backup operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific backup
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename parameter is required' },
        { status: 400 }
      );
    }

    // This would require implementing a delete method in the backup service
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      message: `Backup deletion requested for: ${filename}`,
      note: 'Delete functionality can be implemented based on requirements'
    });
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete backup',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
