#!/bin/bash
APP_DIR="/home/$USER"

# Update the package lists:
sudo apt upgrade

echo 'Installing PM2...'

# Install PM2 globally using npm
echo "Installing PM2..."
sudo npm install -g pm2@latest 

# Set PM2 to startup on system boot
echo "Setting PM2 to autostart on system boot..."
sudo pm2 startup

# Installing PM2-logrotate
echo "Installing PM2-logrotate..."
sudo pm2 install pm2-logrotate

# Configuring PM2-logrotate
echo "Configuring PM2-logrotate..."
sudo pm2 set pm2-logrotate:max_size 10M  # Max size of a log file
sudo pm2 set pm2-logrotate:retain 30     # Number of days to keep a log file
sudo pm2 set pm2-logrotate:compress true # Compress (gzip) log files on rotation

# Saving PM2 process list and configurations
sudo pm2 save

echo "PM2 and PM2-logrotate have been successfully installed and configured."