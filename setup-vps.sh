#!/bin/bash

# ==============================================================================
# Production VPS Setup Script
# Description: Automates the setup of a production-ready server based on
#              the principles of the "Setting up a Production-Ready VPS" blog.
# Author: Gemini
# Version: 1.0
# ==============================================================================

# --- Configuration & Colors ---
# Exit immediately if a command exits with a non-zero status.
set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Helper Functions ---
function print_info {
    echo -e "${GREEN}[INFO] $1${NC}"
}

function print_prompt {
    echo -e "${YELLOW}[PROMPT] $1${NC}"
}

function print_error {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

# --- Main Functions ---

function initial_checks_and_inputs() {
    print_info "Starting initial server setup..."

    # Ensure the script is run as root
    if [ "$(id -u)" -ne 0 ]; then
        print_error "This script must be run as root. Please use 'sudo ./setup_vps.sh'."
        exit 1
    fi

    # Check for docker-compose.yml in the current directory
    if [ ! -f "docker-compose.yml" ]; then
        print_error "No 'docker-compose.yml' found in the current directory."
        print_error "Please run this script from your application's root directory."
        exit 1
    fi

    # Gather user information
    print_prompt "We need some information to configure your server."
    read -p "Enter the username for the new non-root user: " NEW_USER
    read -p "Enter your domain name (e.g., myapp.com): " DOMAIN_NAME
    read -p "Enter your email for Let's Encrypt SSL certificates: " LETSENCRYPT_EMAIL
    read -p "Enter the name of your main application service from docker-compose.yml (e.g., 'guestbook' or 'api'): " APP_SERVICE_NAME

    # Validate inputs
    if [ -z "$NEW_USER" ] || [ -z "$DOMAIN_NAME" ] || [ -z "$LETSENCRYPT_EMAIL" ] || [ -z "$APP_SERVICE_NAME" ]; then
        print_error "All inputs are required. Please run the script again."
        exit 1
    fi
}

function create_non_root_user() {
    print_info "Creating and configuring new user: '$NEW_USER'..."
    if id "$NEW_USER" &>/dev/null; then
        print_info "User '$NEW_USER' already exists. Skipping creation."
    else
        adduser --disabled-password --gecos "" "$NEW_USER"
        print_info "User '$NEW_USER' created."
    fi

    # Add user to the sudo group
    usermod -aG sudo "$NEW_USER"
    print_info "User '$NEW_USER' added to the sudo group."

    # Copy root's SSH authorized keys to the new user for seamless login
    mkdir -p "/home/$NEW_USER/.ssh"
    cp /root/.ssh/authorized_keys "/home/$NEW_USER/.ssh/authorized_keys"
    chown -R "$NEW_USER:$NEW_USER" "/home/$NEW_USER/.ssh"
    chmod 700 "/home/$NEW_USER/.ssh"
    chmod 600 "/home/$NEW_USER/.ssh/authorized_keys"
    print_info "Copied SSH key to new user. You can now log in as '$NEW_USER'."
}

function harden_ssh() {
    print_info "Hardening SSH configuration..."
    # Disable Password Authentication
    sed -i 's/^#?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
    # Disable Root Login
    sed -i 's/^#?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
    # Disable PAM (often used for password auth)
    sed -i 's/^#?UsePAM .*/UsePAM no/' /etc/ssh/sshd_config

    # Remove cloud-init's potentially conflicting SSH config on some providers
    rm -f /etc/ssh/sshd_config.d/50-cloud-init.conf

    # Reload SSH to apply changes
    systemctl reload sshd
    print_info "SSH has been hardened. Root login and password authentication are disabled."
}

function configure_firewall() {
    print_info "Configuring UFW (Uncomplicated Firewall)..."
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing

    # Allow essential ports
    ufw allow ssh     # Port 22
    ufw allow http    # Port 80
    ufw allow https   # Port 443

    # Enable the firewall non-interactively
    ufw --force enable
    print_info "Firewall is now active and configured."
    ufw status verbose
}

function install_docker() {
    print_info "Installing Docker and Docker Compose..."
    # Install dependencies
    apt-get update
    apt-get install -y ca-certificates curl

    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    # Add the repository to Apt sources
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update

    # Install Docker packages
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add new user to the docker group to run docker commands without sudo
    usermod -aG docker "$NEW_USER"
    
    print_info "Docker and Docker Compose installed successfully."
}

function generate_compose_override() {
    print_info "Generating docker-compose.override.yml for Traefik and Watchtower..."

    # Create the docker-compose.override.yml file
    cat << EOF > docker-compose.override.yml
# This file is auto-generated by the setup_vps.sh script.
# It adds Traefik (reverse proxy), Watchtower (auto-updates),
# and connects your application to the web securely.

version: '3.8'

networks:
  web:
    external: true

volumes:
  letsencrypt:

services:
  traefik:
    image: traefik:v3.1
    container_name: traefik
    restart: always
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=${LETSENCRYPT_EMAIL}"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
      # Redirect all HTTP traffic to HTTPS
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    networks:
      - web

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: always
    command:
      - "--label-enable"
      - "--interval"
      - "30" # Check for updates every 30 seconds
      - "--rolling-restart"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    labels:
      - "com.centurylinklabs.watchtower.enable=false" # We don't want watchtower to update itself

  # --- Your Application Configuration ---
  ${APP_SERVICE_NAME}:
    restart: always
    networks:
      - web # Connect your app to the reverse proxy network
    ports: [] # IMPORTANT: Remove direct port exposure
    labels:
      # --- Enable Traefik ---
      - "traefik.enable=true"
      - "traefik.docker.network=web"

      # --- HTTP Router (for HTTPS) ---
      - "traefik.http.routers.${APP_SERVICE_NAME}.rule=Host(\`${DOMAIN_NAME}\`)"
      - "traefik.http.routers.${APP_SERVICE_NAME}.entrypoints=websecure"
      - "traefik.http.routers.${APP_SERVICE_NAME}.tls.certresolver=myresolver"

      # --- Enable Watchtower for this service ---
      - "com.centurylinklabs.watchtower.enable=true"
EOF

    # Make sure the new user owns this file as well
    chown "$NEW_USER:$NEW_USER" docker-compose.override.yml
    
    print_info "docker-compose.override.yml has been created."
}

function final_instructions() {
    print_info "============================================================"
    print_info "✅ Server setup is complete!"
    print_info "============================================================"
    echo ""
    print_info "What's been done:"
    echo "  - New user '$NEW_USER' created with sudo and SSH access."
    echo "  - SSH security has been hardened (root login & password auth disabled)."
    echo "  - Firewall (UFW) is enabled and configured."
    echo "  - Docker and Docker Compose have been installed."
    echo "  - A 'docker-compose.override.yml' file has been generated for your project."
    echo ""
    print_prompt ">>> IMPORTANT NEXT STEPS <<<"
    echo "1. Log out of this root session."
    echo "2. Log back in using your new user:"
    echo -e "   ${YELLOW}ssh $NEW_USER@<your_server_ip>${NC}"
    echo "3. Navigate to your project directory:"
    echo -e "   ${YELLOW}cd $(pwd)${NC}"
    echo "4. Create the shared docker network for Traefik:"
    echo -e "   ${YELLOW}docker network create web${NC}"
    echo "5. Launch your entire application stack:"
    echo -e "   ${YELLOW}docker compose up -d${NC}"
    echo ""
    print_info "Your site will then be live at https://$DOMAIN_NAME"
    print_info "Thanks to Watchtower, pushing a new image to your container registry will automatically update your deployment!"
    echo ""
}


# --- Script Execution ---
main() {
    initial_checks_and_inputs
    create_non_root_user
    harden_ssh
    configure_firewall
    install_docker
    generate_compose_override
    final_instructions
}

main