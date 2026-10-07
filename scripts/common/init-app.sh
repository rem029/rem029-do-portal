#!/bin/bash

# Check if environment argument is provided
ENV=${1:-development}
PROJECT_FOLDER=${2:-survey-do}
APP_DIR=$HOME/$PROJECT_FOLDER
WITH_V3=${3:-}

echo "Environment: $ENV"
echo "Current working folder is $APP_DIR"

chown -R $USER $APP_DIR

echo 'Running git pull...'
git pull origin $ENV;

source ~/.nvm/nvm.sh
nvm use 20.10.0
npm install -g yarn

# echo "Running@ $APP_DIR/scripts/$ENV/init-backend.sh"
# source "$APP_DIR/scripts/$ENV/init-backend.sh" "$PROJECT_FOLDER"

echo "Running@ $APP_DIR/scripts/$ENV/init-backend-admin.sh"
source "$APP_DIR/scripts/$ENV/init-backend-admin.sh" "$PROJECT_FOLDER"

echo "Running@ $APP_DIR/scripts/$ENV/init-frontend.sh"
source "$APP_DIR/scripts/$ENV/init-frontend.sh" "$PROJECT_FOLDER"

# If third arg is --with-v3 then run the v3 backend init script
if [ "$WITH_V3" = "--with-v3" ]; then
  echo "Running@ $APP_DIR/scripts/$ENV/init-backend-admin-v3.sh"
  source "$APP_DIR/scripts/$ENV/init-backend-admin-v3.sh" "$PROJECT_FOLDER"
fi

pm2 save

