#!/bin/bash

PROJECT_FOLDER=${1:-survey-do}
APP_DIR=$HOME/$PROJECT_FOLDER

chown -R $USER $APP_DIR

cd "$APP_DIR/apps/frontend"

echo 'Running yarn install... @frontend'
yarn install;

echo 'Running yarn build... @frontend'
yarn build

# echo 'Running pm2 restart... @frontend'
# yarn pm2 delete survery-frontend
# yarn start:pm2

cd $APP_DIR