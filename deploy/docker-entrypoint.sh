
#!/bin/sh

# Docker entrypoint script for Mail Nexus Gateway
set -e

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting Mail Nexus Gateway..."

# Create necessary directories
mkdir -p /var/log/nginx
mkdir -p /var/cache/nginx
mkdir -p /etc/nginx/ssl

# Set environment variables in nginx config if provided
if [ ! -z "$DOMAIN" ]; then
    log "Setting domain to: $DOMAIN"
    sed -i "s/__DOMAIN__/$DOMAIN/g" /etc/nginx/nginx.conf
fi

if [ ! -z "$VPS_IP" ]; then
    log "Setting VPS IP to: $VPS_IP"
    sed -i "s/__VPS_IP__/$VPS_IP/g" /etc/nginx/nginx.conf
fi

# Generate self-signed certificate if SSL certificates don't exist
if [ ! -f "/etc/nginx/ssl/cert.pem" ]; then
    log "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/key.pem \
        -out /etc/nginx/ssl/cert.pem \
        -subj "/C=BR/ST=State/L=City/O=Organization/CN=${DOMAIN:-localhost}"
fi

# Test nginx configuration
log "Testing nginx configuration..."
nginx -t

log "Mail Nexus Gateway started successfully"

# Execute the main command
exec "$@"
