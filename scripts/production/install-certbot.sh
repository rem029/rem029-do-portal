#!/bin/bash

# Allow 443 on firewall
sudo ufw allow 443
sudo ufw allow 443/tcp
sudo ufw status

# Install lets encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx --non-interactive --agree-tos -m lawrence.ponce@dohaoasis.com -d public.dohaoasis.com -v
sudo systemctl status certbot.timer


# sudo certbot --nginx -m lawrence.ponce@dohaoasis.com -d staging.store.dohaquest.com -v
# sudo certbot --nginx -m lawrence.ponce@dohaoasis.com -d api.staging.store.dohaquest.com -v