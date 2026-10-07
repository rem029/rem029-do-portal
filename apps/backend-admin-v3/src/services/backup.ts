'use server'

/**
 * Handle the backup logic for database and media files.
 * Pass `{ dbOnly: true }` to skip media collection/zipping and stream the
 * raw db.sql dump directly — used by CI to validate migrations without
 * pulling the (potentially large) media library.
 */
export const performBackup = async (req: any, options?: { dbOnly?: boolean }) => {
  // Dynamic imports to prevent bundling Node-only packages on the client side
  const path = await import('path')
  const fs = await import('fs/promises')
  const archiver = (await import('archiver')).default
  const { pgDump, FormatEnum } = await import('pg-dump-restore')
  const moment = (await import('moment')).default

  const { logger } = req.payload

  let tmpDir: string | null = null

  try {
    logger.info(`at performBackup service: init`)

    // --- Config ---
    const connectionString = process.env.DATABASE_URI
    if (!connectionString) {
      logger.error('at performBackup service: DATABASE_URI not configured')
      throw new Error('DATABASE_URI not configured')
    }

    const url = new URL(connectionString)
    const dbConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username,
      password: url.password,
    }

    const MEDIA_ROOT = path.resolve(process.cwd(), 'medias')

    const PREFIX = 'payload-v3'
    const STAMP = moment().format('YYYYMMDD_HHmmss')

    tmpDir = path.join('/tmp', `${PREFIX}_backup_${STAMP}`)
    await fs.mkdir(tmpDir, { recursive: true })

    // --- Step 1: Database Backup ---
    logger.info('Database backup starting…')
    const dbDumpPath = path.join(tmpDir, 'db.sql')

    await pgDump(dbConfig, { filePath: dbDumpPath, format: FormatEnum.Plain })
    logger.info('Database backup complete')

    if (options?.dbOnly) {
      logger.info('dbOnly requested — skipping media collection and returning raw db.sql')
      const sqlBuffer = await fs.readFile(dbDumpPath)
      await fs.rm(tmpDir, { recursive: true, force: true })

      return {
        stream: sqlBuffer,
        archiveName: `${PREFIX}-db_${STAMP}.sql`,
        contentType: 'application/sql',
      }
    }

    // --- Step 2: Copy media directories ---
    logger.info(`Collecting media folders at ${MEDIA_ROOT}...`)
    try {
      const entries = await fs.readdir(MEDIA_ROOT, { withFileTypes: true })
      const mediaDirs = entries.filter(
        (entry) => entry.isDirectory() && entry.name.includes('media'),
      )

      for (const dir of mediaDirs) {
        logger.info(`Processing media folder: ${dir.name}`)
        const srcPath = path.join(MEDIA_ROOT, dir.name)
        const destPath = path.join(tmpDir, dir.name)
        await _copyDirectory(srcPath, destPath, path, fs)
      }
    } catch (err: any) {
      logger.warn(`Media folder collection warning: ${err.message}`)
    }

    // --- Step 3: Create archive ---
    logger.info('Creating archive…')
    const archive = archiver('zip', { zlib: { level: 9 } })

    // Convert Node Stream to Web Stream for standard Response compatibility
    const stream = new ReadableStream({
      async start(controller) {
        archive.on('data', (chunk) => {
          controller.enqueue(chunk)
        })

        archive.on('end', async () => {
          controller.close()
          if (tmpDir) {
            try {
              const fs_cleanup = await import('fs/promises')
              await fs_cleanup.rm(tmpDir, { recursive: true, force: true })
              logger.info('Temp directory cleaned up')
            } catch (cleanupErr: any) {
              logger.error(`Cleanup failed: ${cleanupErr.message}`)
            }
          }
        })

        archive.on('error', (err) => {
          controller.error(err)
        })

        // Add all files from tmpDir to archive
        archive.directory(tmpDir!, false)

        await archive.finalize()
      },
      cancel() {
        archive.abort()
      },
    })

    const archiveName = `${PREFIX}-backup_${STAMP}.zip`

    return {
      stream,
      archiveName,
      contentType: 'application/zip',
    }
  } catch (error: any) {
    if (logger) {
      logger.error(`Error in performBackup service: ${error.message || 'Unknown'}`)
    }
    if (tmpDir) {
      try {
        const fs_cleanup = await import('fs/promises')
        await fs_cleanup.rm(tmpDir, { recursive: true, force: true })
      } catch (cleanupErr: any) {
        if (logger) {
          logger.error(`Error cleanup failed: ${cleanupErr.message}`)
        }
      }
    }
    throw error
  }
}

/**
 * Recursively copy directories using Node.js fs APIs
 * Internal helper for performBackup
 */
async function _copyDirectory(src: string, dest: string, path: any, fs: any): Promise<void> {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await _copyDirectory(srcPath, destPath, path, fs)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}
