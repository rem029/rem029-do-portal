#!/bin/bash

PROJECT_FOLDER=${1:-survey-do}
APP_DIR=$HOME/$PROJECT_FOLDER

chown -R $USER $APP_DIR

cd "$APP_DIR/apps/backend-admin"

echo 'Running yarn install... @backend-admin'
yarn install;
# yarn upgrade;

echo 'Running yarn build... @backend-admin'
yarn build;

echo 'Running migrate:latest... @backend-admin'
yarn migrate:latest

echo 'Running pm2 restart... @backend-admin'
pm2 delete survey-backend-admin;
pm2 delete survey-backend-employee;
pm2 delete do-app-backend-admin;
yarn start:pm2;

cd $APP_DIR