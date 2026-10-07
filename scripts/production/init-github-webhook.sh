#!/bin/bash

PROJECT_FOLDER=${1:-survey-do}
APP_DIR=$HOME/$PROJECT_FOLDER

chown -R $USER $APP_DIR

cd "$APP_DIR/apps/github-webhook"

echo 'Running yarn install... @github-webhook'
yarn install;
# yarn upgrade;

echo 'Running pm2 restart... @github-webhook'
pm2 delete do-app-github-webhook;
yarn start:pm2 -f;

cd $APP_DIR