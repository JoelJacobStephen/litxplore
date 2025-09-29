#!/bin/bash

# ==============================================================================
# Universal VPS Setup Script (v2.1)
# Description: Automates the setup of a production-ready server with Traefik
#              reverse proxy and auto-deployment for any Docker-based project
# Author: Updated for Universal Use
# Version: 2.1
# ==============================================================================

# --- Configuration & Colors ---
set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# --- Helper Functions ---
function print_info {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function print_prompt {
    echo -e "${YELLOW}[PROMPT]${NC} $1"
}

function print_error {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

function print_header {
    echo -e "${BLUE}$1${NC}"
}

function print_step {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# --- Pre-flight Instructions ---
function show_prerequisites() {
    clear
    print_header "=============================================================================="
    print_header "                      Universal VPS Setup Script v2.1"
    print_header "=============================================================================="
    echo ""
    print_info "This script will set up a production-ready VPS with:"
    echo "  • Docker & Docker Compose"
    echo "  • Traefik reverse proxy with automatic SSL"
    echo "  • Watchtower for auto-updates"
    echo "  • UFW firewall configuration"
    echo "  • SSH hardening"
    echo "  • fail2ban intrusion prevention system"
    echo ""
    print_header "PREREQUISITES - Please complete these steps BEFORE running this script:"
    print_header "=============================================================================="
    echo ""
    print_error "1. CREATE A NON-ROOT USER:"
    echo "   Run these commands as root:"
    echo "   adduser yourusername"
    echo "   usermod -aG sudo yourusername"
    echo "   mkdir -p /home/yourusername/.ssh"
    echo "   cp ~/.ssh/authorized_keys /home/yourusername/.ssh/"
    echo "   chown -R yourusername:yourusername /home/yourusername/.ssh"
    echo "   chmod 700 /home/yourusername/.ssh"
    echo "   chmod 600 /home/yourusername/.ssh/authorized_keys"
    echo ""
    print_error "2. DOMAIN SETUP:"
    echo "   • Point your domain's A record to this server's IP address"
    echo "   • Wait for DNS propagation (usually 5-10 minutes)"
    echo ""
    print_prompt "Have you completed ALL the prerequisites above? (y/N): "
    read -r prerequisites_done
    
    if [[ ! "$prerequisites_done" =~ ^[Yy]$ ]]; then
        print_error "Please complete the prerequisites and run the script again."
        exit 1
    fi
    
    print_info "Great! Let's proceed with the setup..."
    echo ""
}

# --- Collect User Information ---
function collect_user_info() {
    print_step "Collecting project information..."
    echo ""
    
    # Non-root user
    print_prompt "Enter the non-root username you created: "
    read -r NEW_USER
    
    # Validate user exists
    if ! id "$NEW_USER" &>/dev/null; then
        print_error "User '$NEW_USER' does not exist. Please create the user first."
        exit 1
    fi
    
    # GitHub repository
    print_prompt "Enter your GitHub repository URL (https or ssh): "
    read -r GITHUB_REPO
    
    # Project directory name
    PROJECT_NAME=$(basename "$GITHUB_REPO" .git)
    print_prompt "Enter project directory name [$PROJECT_NAME]: "
    read -r input_project_name
    if [ -n "$input_project_name" ]; then
        PROJECT_NAME="$input_project_name"
    fi
    
    # Docker Compose file path
    print_prompt "Enter the path to your Docker Compose file (relative to project root) [docker-compose.yml]: "
    read -r COMPOSE_FILE_RELATIVE
    if [ -z "$COMPOSE_FILE_RELATIVE" ]; then
        COMPOSE_FILE_RELATIVE="docker-compose.yml"
    fi
    
    COMPOSE_FILE_PATH="/home/$NEW_USER/$PROJECT_NAME/$COMPOSE_FILE_RELATIVE"
    
    # Domain name
    print_prompt "Enter your domain name (e.g., example.com): "
    read -r DOMAIN_NAME
    
    # Email for Let's Encrypt
    print_prompt "Enter your email for Let's Encrypt SSL certificates: "
    read -r LETSENCRYPT_EMAIL
    
    # Main application service name
    print_prompt "Enter the name of your main application service from your Compose file (e.g., 'api', 'app', 'web'): "
    read -r APP_SERVICE_NAME
    
    # Application port
    print_prompt "Enter the port your application runs on inside the container [8000]: "
    read -r APP_PORT
    if [ -z "$APP_PORT" ]; then
        APP_PORT="8000"
    fi
    
    # CORS origins
    print_prompt "Enter allowed CORS origins (comma-separated, e.g., https://myapp.com,http://localhost:3000): "
    read -r CORS_ORIGINS
    
    # Validate inputs
    if [ -z "$NEW_USER" ] || [ -z "$GITHUB_REPO" ] || [ -z "$DOMAIN_NAME" ] || [ -z "$LETSENCRYPT_EMAIL" ] || [ -z "$APP_SERVICE_NAME" ]; then
        print_error "All required inputs must be provided. Please run the script again."
        exit 1
    fi
    
    # Convert CORS origins to proper format
    if [ -n "$CORS_ORIGINS" ]; then
        CORS_ORIGINS_FORMATTED=$(echo "$CORS_ORIGINS" | sed "s/,/\\\`,\\\`/g")
    else
        CORS_ORIGINS_FORMATTED="https://$DOMAIN_NAME"
    fi
    
    echo ""
    print_info "Configuration Summary:"
    echo "  User: $NEW_USER"
    echo "  Repository: $GITHUB_REPO"
    echo "  Project: $PROJECT_NAME"
    echo "  Compose File: $COMPOSE_FILE_PATH"
    echo "  Domain: $DOMAIN_NAME"
    echo "  Email: $LETSENCRYPT_EMAIL"
    echo "  Service: $APP_SERVICE_NAME"
    echo "  Port: $APP_PORT"
    echo "  CORS Origins: $CORS_ORIGINS_FORMATTED"
    echo ""
    
    print_prompt "Does this look correct? (y/N): "
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_error "Setup cancelled. Please run the script again."
        exit 1
    fi
}

# --- SSH Hardening ---
function harden_ssh() {
    print_step "Hardening SSH configuration..."
    
    if [ ! -f "/etc/ssh/sshd_config.backup" ]; then
        cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
        print_info "Backed up original SSH configuration."
    fi
    
    if grep -q "# Universal VPS Setup - SSH Hardening Applied" /etc/ssh/sshd_config; then
        print_info "SSH hardening has already been applied. Skipping."
        return
    fi
    
    cat >> /etc/ssh/sshd_config << 'EOF'

# Universal VPS Setup - SSH Hardening Applied
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
X11Forwarding no
Protocol 2
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

    if systemctl is-active --quiet sshd; then
        systemctl restart sshd
    elif systemctl is-active --quiet ssh; then
        systemctl restart ssh
    fi
    
    print_info "SSH has been hardened."
}

# --- Firewall Configuration ---
function configure_firewall() {
    print_step "Configuring UFW firewall..."
    
    if ufw status | grep -q "Status: active"; then
        print_info "UFW is already active. Skipping firewall setup."
        return
    fi
    
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow http
    ufw allow https
    ufw --force enable
    
    print_info "Firewall configured and enabled."
}

# --- Install and Configure fail2ban ---
function install_fail2ban() {
    print_step "Installing and configuring fail2ban for intrusion prevention..."
    
    if command -v fail2ban-server &> /dev/null; then
        print_info "fail2ban is already installed."
        if systemctl is-active --quiet fail2ban; then
            print_info "fail2ban is running. Skipping configuration."
            return
        fi
    else
        apt-get update
        apt-get install -y fail2ban
        print_info "fail2ban installed successfully."
    fi
    
    # Backup original configuration if it exists
    if [ -f "/etc/fail2ban/jail.conf" ] && [ ! -f "/etc/fail2ban/jail.conf.backup" ]; then
        cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.conf.backup
        print_info "Backed up original fail2ban configuration."
    fi
    
    # Create comprehensive jail configuration
  cat > /etc/fail2ban/jail.local << EOF
# Universal VPS Setup - Fail2Ban Configuration
# This configuration provides robust protection for the SSH service.

[DEFAULT]
# Ban settings: ban for 1 hour after 3 failures within 10 minutes.
bantime = 1h
findtime = 10m
maxretry = 3
backend = systemd

# Whitelist trusted IPs (localhost)
ignoreip = 127.0.0.1/8 ::1

# SSH Protection - The most important jail for any server
[sshd]
enabled = true

# More aggressive SSH protection against distributed attacks
[sshd-ddos]
enabled = true
EOF 

    # Create custom filter for HTTP GET DoS (optional)
    cat > /etc/fail2ban/filter.d/http-get-dos.conf << 'EOF'
# Custom filter for HTTP GET flood attacks
[Definition]
failregex = ^<HOST> -.*"(GET|POST).*HTTP.*" (200|404) .*$
ignoreregex =
EOF

    # Enable and start fail2ban
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    # Wait a moment for service to start
    sleep 2
    
    # Verify installation
    if systemctl is-active --quiet fail2ban; then
        print_info "fail2ban is running successfully."
        
        # Show status
        print_info "Active fail2ban jails:"
        fail2ban-client status 2>/dev/null | grep "Jail list:" || print_info "  SSH protection is active"
    else
        print_error "fail2ban failed to start. Please check the configuration."
    fi
    
    print_info "fail2ban configured with comprehensive protection for SSH and web services."
}

# --- Docker Installation ---
function install_docker() {
    print_step "Installing Docker and Docker Compose..."
    
    if command -v docker &> /dev/null; then
        print_info "Docker is already installed."
    else
        apt-get update
        apt-get install -y ca-certificates curl
        install -m 0755 -d /etc/apt/keyrings
        
        if [ ! -f "/etc/apt/keyrings/docker.asc" ]; then
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
            chmod a+r /etc/apt/keyrings/docker.asc
        fi
        
        if [ ! -f "/etc/apt/sources.list.d/docker.list" ]; then
            echo \
              "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
              $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
              tee /etc/apt/sources.list.d/docker.list > /dev/null
        fi
        
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi

    if groups "$NEW_USER" | grep -q "\bdocker\b"; then
        print_info "User '$NEW_USER' is already in the docker group."
    else
        usermod -aG docker "$NEW_USER"
        print_info "Added user '$NEW_USER' to the docker group."
    fi
}

# --- Clone Repository ---
function clone_repository() {
    print_step "Cloning repository..."
    
    PROJECT_PATH="/home/$NEW_USER/$PROJECT_NAME"
    
    if [ -d "$PROJECT_PATH" ]; then
        print_info "Project directory already exists. Pulling latest changes..."
        sudo -u "$NEW_USER" bash -c "cd '$PROJECT_PATH' && git pull"
    else
        print_info "Cloning repository..."
        sudo -u "$NEW_USER" bash -c "cd /home/$NEW_USER && git clone '$GITHUB_REPO' '$PROJECT_NAME'"
    fi
    
    if [ ! -f "$COMPOSE_FILE_PATH" ]; then
        print_error "Docker Compose file not found at: $COMPOSE_FILE_PATH"
        exit 1
    fi
    
    print_info "Repository cloned successfully."
}

# --- Generate Docker Compose Override ---
function generate_compose_override() {
    print_step "Generating docker-compose.override.yml..."
    
    OVERRIDE_FILE_PATH="$(dirname "$COMPOSE_FILE_PATH")/docker-compose.override.yml"
    
    if [ -f "$OVERRIDE_FILE_PATH" ]; then
        print_prompt "docker-compose.override.yml already exists. Overwrite? (y/N): "
        read -r overwrite
        if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
            print_info "Skipping override file generation."
            return
        fi
    fi

    cat << EOF > "$OVERRIDE_FILE_PATH"
# Auto-generated by Universal VPS Setup Script v2.1
# Adds Traefik reverse proxy with SSL and Watchtower auto-updates

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
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.myresolver.acme.tlschallenge=true
      - --certificatesresolvers.myresolver.acme.email=${LETSENCRYPT_EMAIL}
      - --certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json
      - --entrypoints.web.http.redirections.entryPoint.to=websecure
      - --entrypoints.web.http.redirections.entryPoint.scheme=https
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    networks: [web]

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: always
    command: ["--label-enable", "--interval", "300", "--rolling-restart"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    labels:
      - com.centurylinklabs.watchtower.enable=false

  ${APP_SERVICE_NAME}:
    restart: always
    networks: [web]
    ports: []
    labels:
      - traefik.enable=true
      - traefik.docker.network=web
      - traefik.http.services.${APP_SERVICE_NAME}.loadbalancer.server.port=${APP_PORT}
      - traefik.http.middlewares.cors.headers.accesscontrolallowmethods=GET,POST,PUT,PATCH,DELETE,OPTIONS
      - traefik.http.middlewares.cors.headers.accesscontrolallowheaders=Authorization,Content-Type,Cache-Control,Pragma,Accept,Origin,Expires,expires,X-CSRF-Token,X-Requested-With
      - traefik.http.middlewares.cors.headers.accesscontrolalloworiginlist=\`${CORS_ORIGINS_FORMATTED}\`
      - traefik.http.middlewares.cors.headers.accesscontrolallowcredentials=true
      - traefik.http.middlewares.cors.headers.accesscontrolmaxage=86400
      - traefik.http.middlewares.cors.headers.addvaryheader=true
      - traefik.http.middlewares.security.headers.framedeny=true
      - traefik.http.middlewares.security.headers.contenttypenosniff=true
      - traefik.http.middlewares.security.headers.browserxssfilter=true
      - traefik.http.middlewares.security.headers.forcestsheader=true
      - traefik.http.middlewares.security.headers.stsincludesubdomains=true
      - traefik.http.middlewares.security.headers.stsseconds=31536000
      - traefik.http.middlewares.api-ratelimit.ratelimit.average=100
      - traefik.http.middlewares.api-ratelimit.ratelimit.period=1m
      - traefik.http.middlewares.api-ratelimit.ratelimit.burst=50
      - traefik.http.middlewares.api-ratelimit.ratelimit.sourcecriterion.ipstrategy.depth=1
      - traefik.http.middlewares.strict-ratelimit.ratelimit.average=10
      - traefik.http.middlewares.strict-ratelimit.ratelimit.period=1m
      - traefik.http.middlewares.strict-ratelimit.ratelimit.burst=5
      - traefik.http.middlewares.upload-ratelimit.ratelimit.average=5
      - traefik.http.middlewares.upload-ratelimit.ratelimit.period=1m
      - traefik.http.middlewares.upload-ratelimit.ratelimit.burst=2
      - traefik.http.routers.${APP_SERVICE_NAME}.rule=Host(\`${DOMAIN_NAME}\`)
      - traefik.http.routers.${APP_SERVICE_NAME}.entrypoints=websecure
      - traefik.http.routers.${APP_SERVICE_NAME}.tls.certresolver=myresolver
      - traefik.http.routers.${APP_SERVICE_NAME}.middlewares=cors,security,api-ratelimit
      - com.centurylinklabs.watchtower.enable=true
EOF

    chown "$NEW_USER:$NEW_USER" "$OVERRIDE_FILE_PATH"
    print_info "docker-compose.override.yml generated successfully."
}

# --- Deploy Application ---
function deploy_application() {
    print_step "Deploying application..."
    
    if ! docker network inspect web &>/dev/null; then
        docker network create web
        print_info "Created 'web' network for Traefik."
    fi
    
    PROJECT_DIR=$(dirname "$COMPOSE_FILE_PATH")
    COMPOSE_FILE=$(basename "$COMPOSE_FILE_PATH")
    
    sudo -u "$NEW_USER" bash -c "cd '$PROJECT_DIR' && docker compose -f '$COMPOSE_FILE' up -d"
    
    print_info "Application deployed successfully!"
}

# --- Final Instructions ---
function final_instructions() {
    PROJECT_DIR="/home/$NEW_USER/$PROJECT_NAME"
    COMPOSE_FILE_RELATIVE_PATH="$PROJECT_DIR/$COMPOSE_FILE_RELATIVE"

    print_header "=============================================================================="
    print_header "                             🎉 SETUP COMPLETE! 🎉"
    print_header "=============================================================================="
    echo ""
    print_info "Your application has been successfully deployed!"
    echo ""
    print_info "📋 Summary:"
    echo "  • Domain: https://$DOMAIN_NAME"
    echo "  • SSL: Automatic via Let's Encrypt"
    echo "  • Auto-updates: Enabled via Watchtower"
    echo "  • Firewall: Configured and active"
    echo "  • SSH: Hardened (root login disabled)"
    echo "  • Intrusion Prevention: fail2ban monitoring and blocking attacks"
    echo "  • Rate Limiting: Traefik protecting against DDoS and abuse"
    echo ""
    print_info "🔧 Management Commands:"
    echo "  • View logs: cd '$PROJECT_DIR' && docker compose -f '$COMPOSE_FILE_RELATIVE' logs -f"
    echo "  • Restart: cd '$PROJECT_DIR' && docker compose -f '$COMPOSE_FILE_RELATIVE' restart"
    echo "  • Update: cd '$PROJECT_DIR' && git pull && docker compose -f '$COMPOSE_FILE_RELATIVE' up -d --build"
    echo "  • fail2ban status: fail2ban-client status"
    echo "  • Unban IP: fail2ban-client set sshd unbanip <IP_ADDRESS>"
    echo "  • View Traefik logs: docker logs traefik"
    echo "  • Monitor rate limits: docker logs traefik | grep ratelimit"
    echo ""
    print_info "🔒 Security Notes:"
    echo "  • Root SSH access is now disabled"
    echo "  • Only user '$NEW_USER' can SSH in"
    echo "  • Firewall only allows HTTP, HTTPS, and SSH"
    echo ""
    print_info "🌐 Your site should be live at: https://$DOMAIN_NAME"
    print_info "SSL certificate may take a few minutes to provision."
    echo ""
    print_header "=============================================================================="
    print_prompt "Press Enter to exit..."
    read -r
}

# --- Main Execution ---
function main() {
    if [ "$(id -u)" -ne 0 ]; then
        print_error "This script must be run as root. Please use 'sudo ./setup-vps.sh'."
        exit 1
    fi
    
    show_prerequisites
    collect_user_info
    harden_ssh
    configure_firewall
    install_fail2ban
    install_docker
    clone_repository
    generate_compose_override
    deploy_application
    final_instructions
}

# Run the main function
main "$@"