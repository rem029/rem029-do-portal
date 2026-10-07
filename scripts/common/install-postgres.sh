#!/bin/bash

# Default values
DEFAULT_ECOM_USER="ecom_user"
DEFAULT_ECOM_PASSWORD="123"
DEFAULT_POSTGRES_PASSWORD="123"
DEFAULT_DB_NAME="quest_dev"

# Read username with default
read -p "Enter username for the new postgres user: default($DEFAULT_ECOM_USER): " POSTGRES_ECOM_USER
POSTGRES_ECOM_USER=${POSTGRES_ECOM_USER:-$DEFAULT_ECOM_USER}
echo

# Read password for new user with default
read -sp "Enter password for the new postgres $POSTGRES_ECOM_USER: default($DEFAULT_ECOM_PASSWORD): " POSTGRES_ECOM_PASSWORD
POSTGRES_ECOM_PASSWORD=${POSTGRES_ECOM_PASSWORD:-$DEFAULT_ECOM_PASSWORD}
echo

# Read password for default postgres user with default
read -sp "Enter password for the default postgres user: default($DEFAULT_POSTGRES_PASSWORD): " POSTGRES_PASSWORD
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$DEFAULT_POSTGRES_PASSWORD}
echo

# Read database name with default
read -p "Enter Postgres database name: default($DEFAULT_DB_NAME): " POSTGRES_DB_NAME
POSTGRES_DB_NAME=${POSTGRES_DB_NAME:-$DEFAULT_DB_NAME}
echo

# Update the package lists:
sudo apt upgrade

echo 'Installing Postgres...'
# Install Postgres

# Create the file repository configuration:
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import the repository signing key:
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -


# Install the latest version of PostgreSQL.
# If you want a specific version, use 'postgresql-16' or similar instead of 'postgresql':
sudo apt-get -y install postgresql

# Start Postgres
sudo systemctl start postgresql

# Status Postgres
sudo systemctl status postgresql

# Setup Postgres
echo 'Setting postgres password...'
sudo -u postgres psql -c "ALTER USER postgres WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD'"

echo "Creating user $POSTGRES_ECOM_USER with password $POSTGRES_ECOM_PASSWORD"
sudo -u postgres createuser $POSTGRES_ECOM_USER

echo "Set user postgres with password $POSTGRES_ECOM_PASSWORD"
sudo -u postgres psql -c "ALTER USER $POSTGRES_ECOM_USER WITH ENCRYPTED PASSWORD '$POSTGRES_ECOM_PASSWORD'"

echo "Creating postgres database name $POSTGRES_DB_NAME under $POSTGRES_ECOM_USER"
sudo -u postgres psql -c "CREATE DATABASE $POSTGRES_DB_NAME OWNER $POSTGRES_ECOM_USER"

echo "DB_USER_NAME=$POSTGRES_ECOM_USER"
echo "DB_USER_PASSWORD=$POSTGRES_ECOM_PASSWORD"
echo "DB_NAME=$POSTGRES_DB_NAME"

echo 'Installing Postgres... Done.'