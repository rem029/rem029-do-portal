#!/bin/bash
# survey_db_restore_v3.sh

set -e  # Exit immediately if any command fails

# The exact path provided for PayloadCMS v3 Medias
# DEST_MEDIA_PATH="/home/lawrenceponce/survey-doha-quest/apps/backend-admin-v3/medias"

# Sample usage from project root folder
# bash scripts/common/survey_db_restore_v3.sh   scripts/common/.temp/restore_tmp   scripts/common/.temp/payload-v3-backup_20260816_115305.zip   apps/backend-admin-v3   5432

# Inputs
BACKUP_FOLDER="$1"
ZIP_FILE="$2"
DEST_MEDIA_PATH="$3/medias"
PORT="$4"

# -----------------------------------------------------------------------------
# Configuration (Hardcoded for your local environment)
# -----------------------------------------------------------------------------
DB_URI="postgres://postgres:123@localhost:${PORT}/survey_employee_prod_v3"
DB_NAME="survey_employee_prod_v3"
DB_MAINTENANCE_URI="postgres://postgres:123@localhost:${PORT}/postgres"

# Validation
if [ -z "$BACKUP_FOLDER" ] || [ -z "$ZIP_FILE" ] || [ -z "$PORT" ]; then
  echo "❌ Usage: ./survey_db_restore_v3.sh <temp_extract_folder> <zip_file> <port>"
  echo "Example: ./survey_db_restore_v3.sh ./temp ./my_backup.zip 5454"
  exit 1
fi

# -----------------------------------------------------------------------------
# 1. Cleanup & Extraction
# -----------------------------------------------------------------------------

# Check if unzip is installed, if not install it
if ! command -v unzip &> /dev/null; then
  echo "⚠️  unzip not found. Installing..."
  if command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y unzip
  elif command -v yum &> /dev/null; then
    sudo yum install -y unzip
  elif command -v dnf &> /dev/null; then
    sudo dnf install -y unzip
  elif command -v pacman &> /dev/null; then
    sudo pacman -Sy --noconfirm unzip
  else
    echo "❌ Error: Could not detect package manager. Please install unzip manually."
    exit 1
  fi
  echo "✅ unzip installed successfully."
fi

if [ -d "$BACKUP_FOLDER" ]; then
  echo "🧹 Cleaning temporary folder: $BACKUP_FOLDER"
  rm -rf "${BACKUP_FOLDER:?}"/*
else
  echo "📁 Creating temporary folder: $BACKUP_FOLDER"
  mkdir -p "$BACKUP_FOLDER"
fi

echo "📦 Unzipping backup..."
unzip -q "$ZIP_FILE" -d "$BACKUP_FOLDER"

# -----------------------------------------------------------------------------
# 2. Database User & Database Reset
# -----------------------------------------------------------------------------

# Check if survey_user exists, if not create it
echo "👤 Checking PostgreSQL user survey_user..."
USER_EXISTS=$(psql "$DB_MAINTENANCE_URI" -tAc "SELECT 1 FROM pg_roles WHERE rolname='survey_user'")
if [ "$USER_EXISTS" != "1" ]; then
  echo "⚠️  User survey_user not found. Creating..."
  psql "$DB_MAINTENANCE_URI" -c "CREATE USER survey_user WITH PASSWORD '123';"
  echo "✅ User survey_user created successfully."
else
  echo "✅ User survey_user already exists."
fi

echo "🔄 Dropping and recreating database $DB_NAME..."
# Connect to 'postgres' DB to drop the target DB (prevents "database is being accessed" error)
psql "$DB_MAINTENANCE_URI" -c "DROP DATABASE IF EXISTS \"$DB_NAME\" WITH (FORCE);"
psql "$DB_MAINTENANCE_URI" -c "CREATE DATABASE \"$DB_NAME\" OWNER postgres;"
psql "$DB_MAINTENANCE_URI" -c "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO survey_user;"

echo "📥 Restoring SQL data from db.sql..."
if [ -f "$BACKUP_FOLDER/db.sql" ]; then
  psql -v ON_ERROR_STOP=1 "$DB_URI" -f "$BACKUP_FOLDER/db.sql" > /dev/null
  echo "✅ Database restored successfully."
else
  echo "❌ Error: db.sql not found in $BACKUP_FOLDER"
  exit 1
fi

# -----------------------------------------------------------------------------
# 3. Media Folder Merging
# -----------------------------------------------------------------------------
# Sync all files and folders to the destination, excluding the database SQL file
mkdir -p "$DEST_MEDIA_PATH"
FOUND_ITEMS=false

for item in "$BACKUP_FOLDER"/*; do
    # Skip the pattern if it didn't match anything
    [ -e "$item" ] || continue
    
    # Get the basename of the item
    item_name=$(basename "$item")
    
    # Skip the database SQL file
    if [ "$item_name" = "db.sql" ]; then
        continue
    fi
    
    echo "📂 Syncing $item to $DEST_MEDIA_PATH..."
    # Using -a (archive) to preserve timestamps/perms and -v (verbose)
    # If it's a directory, we use -r to ensure recursive sync (included in -a)
    rsync -av "$item" "$DEST_MEDIA_PATH/"
    FOUND_ITEMS=true
done

if [ "$FOUND_ITEMS" = false ]; then
    echo "⚠️  No files or folders found in the backup (excluding db.sql)."
fi

echo "🚀 All systems go. Backup restoration complete!"

# -----------------------------------------------------------------------------
# 4. Cleanup
# -----------------------------------------------------------------------------
echo "🧹 Cleaning up temporary folder: $BACKUP_FOLDER"
rm -rf "$BACKUP_FOLDER"
echo "✅ Cleanup complete!"
