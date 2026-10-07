#!/bin/bash
ENV="production"
APP_DIR="/home/$USER/survey_do/scripts/$ENV/"
DEFAULT_INSTALL_CERTBOT="no"

read -p "Should install certbot: default($DEFAULT_INSTALL_CERTBOT) (yes/no): " RESPONSE
INSTALL_CERTBOT=${RESPONSE:-$DEFAULT_INSTALL_CERTBOT}
echo


source $APP_DIR/nginx-meilisearch.sh
source $APP_DIR/nginx-do-app.sh

if [ "$INSTALL_CERTBOT" = "yes" ]; then
    source $APP_DIR/install-certbot.sh    
fi

sudo nginx -t
