#!/bin/bash

echo 'Installing Nginx...'

# Install Nginx
sudo apt install -y nginx

# Check Firewall
sudo ufw app list
sudo ufw allow 'Nginx HTTP'
sudo ufw status

sudo systemctl daemon-reload
sudo systemctl enable nginx

echo 'Installing Nginx... Done.'