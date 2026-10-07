#!/bin/bash
# db-restore.sh
# Thin wrapper around survey_db_restore_v3.sh so it can be run as:
#   yarn db:restore <filename> [port]
# <filename> is just the backup zip's filename inside scripts/common/.temp/

set -e

FILENAME="$1"
PORT="${2:-5432}"

if [ -z "$FILENAME" ]; then
  echo "❌ Usage: yarn db:restore <filename> [port]"
  echo "Example: yarn db:restore payload-v3-backup_20260916_122835.zip 5432"
  exit 1
fi

ZIP_FILE="scripts/common/.temp/$FILENAME"

if [ ! -f "$ZIP_FILE" ]; then
  echo "❌ Error: $ZIP_FILE not found."
  exit 1
fi

bash scripts/common/survey_db_restore_v3.sh \
  scripts/common/.temp/restore_tmp \
  "$ZIP_FILE" \
  apps/backend-admin-v3 \
  "$PORT"
