#!/bin/bash
# restore_full_backup.sh

set -e  # Exit immediately if any command fails

# -----------------------------------------------------------------------------
# Configuration & Inputs
# -----------------------------------------------------------------------------
DB_NAME="$1"
DB_USER="$2"
BACKUP_FOLDER="$3"
ZIP_FILE="$4"
DB_PORT="${5:-5432}"

read -p "Enter the destination project folder location for media [default: $HOME/survey-doha-quest/apps/backend-admin/src]: " input_path
DEST_MEDIA_PATH="${input_path:-$HOME/survey-doha-quest/apps/backend-admin/src}"
# -----------------------------------------------------------------------------
# Validation
# -----------------------------------------------------------------------------
if [[ -z "$DB_NAME" || -z "$DB_USER" || -z "$BACKUP_FOLDER" || -z "$ZIP_FILE" ]]; then
  echo "Usage: $0 <db_name> <db_user> <backup_folder> <zip_file> [db_port]"
  echo "Example: $0 my_db my_user ./temp_restore ./backup.zip 5432"
  exit 1
fi

# Security: Prevent disastrous deletions
if [[ "$BACKUP_FOLDER" == "/" || -z "$BACKUP_FOLDER" ]]; then
  echo "❌ Error: BACKUP_FOLDER cannot be root or empty."
  exit 1
fi

# -----------------------------------------------------------------------------
# Execution
# -----------------------------------------------------------------------------

# 1. Handle Backup Folder (Requested Logic)
if [ -d "$BACKUP_FOLDER" ]; then
  echo "🧹 Directory '$BACKUP_FOLDER' exists. Cleaning it..."
  rm -rf "${BACKUP_FOLDER:?}"/* # Safe deletion of contents only
else
  echo "📁 Creating directory '$BACKUP_FOLDER'..."
  mkdir -p "$BACKUP_FOLDER"
fi

# 2. Unzip Backup
echo "📦 Unzipping '$ZIP_FILE'..."
unzip -q "$ZIP_FILE" -d "$BACKUP_FOLDER"

SQL_FILE="$BACKUP_FOLDER/db.sql"
MEDIA_FOLDER="$BACKUP_FOLDER/media"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: SQL file not found at $SQL_FILE"
  exit 1
fi

# 3. Database Restoration
echo "🔄 Dropping database $DB_NAME (forcing connection close)..."
# Using 'postgres' db to connect allows us to drop the target db
psql -p "$DB_PORT" postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\" WITH (FORCE);"

echo "🆕 Creating database $DB_NAME owned by $DB_USER..."
psql -p "$DB_PORT" postgres -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"

echo "📥 Restoring schema and data..."
# Use -v ON_ERROR_STOP=1 to ensure psql actually fails if SQL errors occur
psql -p "$DB_PORT" -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$SQL_FILE" > /dev/null

# 4. Media Sync
if [ -d "$MEDIA_FOLDER" ]; then
  echo "🖼️  Found media folder: $MEDIA_FOLDER"
  echo "📂 Syncing media to $DEST_MEDIA_PATH..."
  
  # Ensure destination exists
  mkdir -p "$DEST_MEDIA_PATH"
  
  # rsync flags: 
  # -a: archive mode (preserves permissions, times, etc.)
  # -v: verbose
  # --delete: (Optional) Deletes files in destination that aren't in source. 
  #           I omitted this for safety, but add it if you want an exact mirror.
  rsync -av "$MEDIA_FOLDER/" "$DEST_MEDIA_PATH/media/"
else
  echo "⚠️  Warning: No media folder found in backup."
fi

echo "✅ Database and media restored successfully!"

echo "🧹 Cleaning up temporary backup folder..."
rm -rf "$BACKUP_FOLDER"
echo "✨ Cleanup complete!"
