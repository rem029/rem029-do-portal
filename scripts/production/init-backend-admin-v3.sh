#!/bin/bash

PROJECT_FOLDER=${1:-survey-do}
APP_DIR=$HOME/$PROJECT_FOLDER

chown -R $USER $APP_DIR

cd "$APP_DIR/apps/backend-admin-v3"

echo 'Running yarn install... @backend-admin-v3'
yarn install;
# yarn upgrade;

echo 'Running yarn build... @backend-admin-v3'
yarn build;

echo 'Deleting current pm2 process... @backend-admin-v3'
pm2 delete do-app-backend-admin-v3;

echo 'Running migrate:latest... @backend-admin-v3'
yarn migrate:latest

echo 'Restarting pm2 process... @backend-admin-v3'
yarn start:pm2;

cd $APP_DIR