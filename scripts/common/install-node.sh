#!/bin/bash
APP_DIR="/home/$USER"

# Update the package lists:
sudo apt upgrade

echo 'Installing Node...'

# Install NodeJS

sudo apt install -y nodejs
node -v

echo 'Installing Node... Done.'

# Install NPM
sudo apt install -y npm
sudo npm i -g yarn

echo 'Installing NPM... Done.'