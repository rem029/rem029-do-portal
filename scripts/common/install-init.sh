#!/bin/bash

APP_DIR="/home/$USER/survey_do"
sudo mkdir $APP_DIR
sudo chown -R $USER $APP_DIR

source /home/$USER/survey_do/scripts/common/install-node.sh
source /home/$USER/survey_do/scripts/common/install-nvm.sh
source /home/$USER/survey_do/scripts/common/install-pm2.sh
source /home/$USER/survey_do/scripts/common/install-nginx.sh

sudo chown -R $USER $APP_DIR