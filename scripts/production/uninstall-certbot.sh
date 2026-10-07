#!/bin/bash

sudo certbot delete
sudo apt purge python3-certbot-nginx
sudo apt purge certbot
sudo a2dissite 000-default-le-ssl.conf
sudo rm -rf /etc/letsencrypt/
 sudo rm -rf /var/lib/letsencrypt/
 sudo rm -rf /var/log/letsencrypt/
sudo apt update
 sudo apt upgrade
 sudo apt autoremove
