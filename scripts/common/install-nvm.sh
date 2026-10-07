#!/bin/bash

# Install NVM
echo 'Installing NVM...'
APP_DIR="/home/$USER"

cd $APP_DIR 
sudo apt install curl 
sudo curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | sudo bash
sudo git clone http://github.com/creationix/nvm.git .nvm

source "$APP_DIR/.nvm/nvm.sh"

nvm -v

echo 'Installing NVM... Done.'