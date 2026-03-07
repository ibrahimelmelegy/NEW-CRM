import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import cron, { ScheduledTask } from 'node-cron';
import { Op } from 'sequelize';
import Backup, { BackupType, BackupStatus, BackupMetadata } from './backupModel';
import { sequelize } from '../config/db';

const execAsync = promisify(exec);
const statAsync = promisify(fs.stat);
const unlinkAsync = promisify(fs.unlink);
const existsAsync = (p: string): Promise<boolean> => new Promise(resolve => fs.access(p, fs.constants.F_OK, err => resolve(!err)));

// Backups are stored relative to the project root
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

/**
 * Build the pg_dump / psql connection string flags from env vars.
 */
function getPgConnectionEnv(): Record<string, string> {
  return {
    PGHOST: process.env.DB_HOST || 'localhost',
    PGPORT: process.env.DB_PORT || '5432',
    PGDATABASE: process.env.DB_NAME || 'leadify',
    PGUSER: process.env.DB_USER || 'postgres',
    PGPASSWORD: process.env.DB_PASSWORD || ''
  };
}

// ─── Create Backup ────────────────────────────────────────────────────────────

export async function createBackup(type: BackupType = BackupType.MANUAL, userId?: number): Promise<Backup> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${type}_${timestamp}.sql.gz`;
  const filePath = path.join(BACKUPS_DIR, filename);

  // Create the backup record in pending state
  const backup = await Backup.create({
    filename,
    filePath,
    fileSize: 0,
    backupType: type,
    status: BackupStatus.PENDING,
    startedAt: new Date(),
    createdBy: userId || null,
    metadata: {}
  });

  try {
    // Mark as in-progress
    await backup.update({ status: BackupStatus.IN_PROGRESS });

    const pgEnv = getPgConnectionEnv();

    // Gather metadata: pg version and table info
    let pgVersion = 'unknown';
    try {
      const { stdout: versionOut } = await execAsync('psql --version');
      pgVersion = versionOut.trim().split('\n')[0];
    } catch {
      // pg version detection failed - non-critical
    }

    // Get table row counts for metadata
    const rowCounts: Record<string, number> = {};
    let tables: string[] = [];
    try {
      const [results] = await sequelize.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
      tables = (results as Array<{ tablename: string }>).map(r => r.tablename);

      // Get row counts for top tables (limit to avoid timeout)
      // Whitelist: only allow alphanumeric + underscore table names to prevent SQL injection
      const SAFE_TABLE_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
      for (const table of tables.slice(0, 50)) {
        if (!SAFE_TABLE_NAME.test(table)) {
          rowCounts[table] = -1; // skip unsafe table name
          continue;
        }
        try {
          const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}"`);
          rowCounts[table] = parseInt(String((countResult as Array<{ count: string }>)[0]?.count || '0'), 10);
        } catch {
          rowCounts[table] = -1; // error reading count
        }
      }
    } catch {
      // Metadata collection failed - non-critical
    }

    // Execute pg_dump with gzip compression
    // Use custom format for faster restore, pipe through gzip for plain SQL
    const dumpCmd = `pg_dump --no-owner --no-acl --clean --if-exists --format=plain | gzip > "${filePath}"`;

    await execAsync(dumpCmd, {
      env: { ...process.env, ...pgEnv },
      maxBuffer: 1024 * 1024 * 100, // 100 MB buffer
      timeout: 600000 // 10 minutes
    });

    // Get file size
    const fileStats = await statAsync(filePath);

    const metadata: BackupMetadata = {
      tables,
      rowCounts,
      pgVersion,
      dumpFormat: 'plain+gzip'
    };

    // Mark as completed
    await backup.update({
      status: BackupStatus.COMPLETED,
      completedAt: new Date(),
      fileSize: fileStats.size,
      metadata
    });

    return backup.reload();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);

    // Mark as failed
    await backup.update({
      status: BackupStatus.FAILED,
      completedAt: new Date(),
      error: errMsg
    });

    // Clean up partial file if it exists
    if (await existsAsync(filePath)) {
      try {
        await unlinkAsync(filePath);
      } catch {
        // Cleanup failed - non-critical
      }
    }

    return backup.reload();
  }
}

// ─── Restore Backup ───────────────────────────────────────────────────────────

export async function restoreBackup(backupId: number): Promise<{ success: boolean; message: string }> {
  const backup = await Backup.findByPk(backupId);
  if (!backup) {
    return { success: false, message: 'Backup not found' };
  }

  if (backup.status !== BackupStatus.COMPLETED) {
    return { success: false, message: 'Only completed backups can be restored' };
  }

  if (!(await existsAsync(backup.filePath))) {
    return { success: false, message: 'Backup file not found on disk' };
  }

  try {
    const pgEnv = getPgConnectionEnv();

    // Restore: decompress gzip and pipe to psql
    const restoreCmd = `gunzip -c "${backup.filePath}" | psql`;

    await execAsync(restoreCmd, {
      env: { ...process.env, ...pgEnv },
      maxBuffer: 1024 * 1024 * 100,
      timeout: 600000 // 10 minutes
    });

    return { success: true, message: 'Backup restored successfully' };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Restore failed: ${errMsg}` };
  }
}

// ─── List Backups ─────────────────────────────────────────────────────────────

export async function listBackups(
  page: number = 1,
  limit: number = 20,
  status?: string,
  type?: string
): Promise<{
  docs: Backup[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
}> {
  const where: Record<string, any> = {};

  if (status) {
    where.status = status;
  }
  if (type) {
    where.backupType = type;
  }

  const offset = (page - 1) * limit;

  const { rows: docs, count: totalItems } = await Backup.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [
      {
        association: 'creator',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  return {
    docs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}

// ─── Get Single Backup ────────────────────────────────────────────────────────

export async function getBackupById(id: number): Promise<Backup | null> {
  return Backup.findByPk(id, {
    include: [
      {
        association: 'creator',
        attributes: ['id', 'name', 'email']
      }
    ]
  });
}

// ─── Delete Backup ────────────────────────────────────────────────────────────

export async function deleteBackup(backupId: number): Promise<{ success: boolean; message: string }> {
  const backup = await Backup.findByPk(backupId);
  if (!backup) {
    return { success: false, message: 'Backup not found' };
  }

  // Delete the file from disk
  if (await existsAsync(backup.filePath)) {
    try {
      await unlinkAsync(backup.filePath);
    } catch {
      // File deletion failed - continue to delete record
    }
  }

  await backup.destroy();
  return { success: true, message: 'Backup deleted successfully' };
}

// ─── Download Backup ──────────────────────────────────────────────────────────

export async function getBackupFilePath(backupId: number): Promise<{ filePath: string; filename: string } | null> {
  const backup = await Backup.findByPk(backupId);
  if (!backup || backup.status !== BackupStatus.COMPLETED) {
    return null;
  }

  if (!(await existsAsync(backup.filePath))) {
    return null;
  }

  return { filePath: backup.filePath, filename: backup.filename };
}

// ─── Backup Stats ─────────────────────────────────────────────────────────────

export async function getBackupStats(): Promise<{
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  totalSize: number;
  lastBackup: Backup | null;
  lastSuccessfulBackup: Backup | null;
}> {
  const totalBackups = await Backup.count();
  const completedBackups = await Backup.count({
    where: { status: BackupStatus.COMPLETED }
  });
  const failedBackups = await Backup.count({
    where: { status: BackupStatus.FAILED }
  });

  // Sum total file size of completed backups
  const sizeResult = await Backup.findOne({
    attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('fileSize')), 0), 'totalSize']],
    where: { status: BackupStatus.COMPLETED },
    raw: true
  });
  const totalSize = parseInt(String((sizeResult as unknown as { totalSize: string })?.totalSize || '0'), 10);

  const lastBackup = await Backup.findOne({
    order: [['createdAt', 'DESC']],
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }]
  });

  const lastSuccessfulBackup = await Backup.findOne({
    where: { status: BackupStatus.COMPLETED },
    order: [['completedAt', 'DESC']],
    include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }]
  });

  return {
    totalBackups,
    completedBackups,
    failedBackups,
    totalSize,
    lastBackup,
    lastSuccessfulBackup
  };
}

// ─── Cleanup Old Backups ──────────────────────────────────────────────────────

export async function cleanupOldBackups(retentionDays: number = 30): Promise<{ deleted: number; freedBytes: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const oldBackups = await Backup.findAll({
    where: {
      createdAt: { [Op.lt]: cutoffDate },
      status: { [Op.in]: [BackupStatus.COMPLETED, BackupStatus.FAILED] }
    }
  });

  let deleted = 0;
  let freedBytes = 0;

  for (const backup of oldBackups) {
    // Delete file
    if (await existsAsync(backup.filePath)) {
      try {
        await unlinkAsync(backup.filePath);
        freedBytes += parseInt(String(backup.fileSize || 0), 10);
      } catch {
        // File deletion failed - continue
      }
    }
    await backup.destroy();
    deleted++;
  }

  return { deleted, freedBytes };
}

// ─── Schedule Auto Backup ─────────────────────────────────────────────────────

let autoBackupJob: ScheduledTask | null = null;

export function scheduleAutoBackup(cronExpression: string = '0 2 * * *'): void {
  // Stop existing job if running
  if (autoBackupJob) {
    autoBackupJob.stop();
    autoBackupJob = null;
  }

  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    console.warn('[Backup] Invalid cron expression:', cronExpression);
    return;
  }

  autoBackupJob = cron.schedule(cronExpression, async () => {
    try {
      await createBackup(BackupType.FULL);

      // Auto cleanup: remove backups older than 30 days
      const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
      await cleanupOldBackups(retentionDays);
    } catch (error) {
      console.error('[Backup] Automated backup failed:', error);
    }
  });

  // [Backup] Auto-backup scheduled
}

export function stopAutoBackup(): void {
  if (autoBackupJob) {
    autoBackupJob.stop();
    autoBackupJob = null;
  }
}

export function isAutoBackupRunning(): boolean {
  return autoBackupJob !== null;
}
