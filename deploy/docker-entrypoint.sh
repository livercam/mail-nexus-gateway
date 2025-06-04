
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

# Check for Let's Encrypt certificates first, then generate self-signed if needed
if [ ! -z "$DOMAIN" ] && [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log "Using Let's Encrypt certificates for $DOMAIN"
    # Update nginx config to use Let's Encrypt certificates
    sed -i "s|/etc/nginx/ssl/fullchain.pem|/etc/letsencrypt/live/$DOMAIN/fullchain.pem|g" /etc/nginx/nginx.conf
    sed -i "s|/etc/nginx/ssl/privkey.pem|/etc/letsencrypt/live/$DOMAIN/privkey.pem|g" /etc/nginx/nginx.conf
elif [ ! -f "/etc/nginx/ssl/fullchain.pem" ]; then
    log "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/privkey.pem \
        -out /etc/nginx/ssl/fullchain.pem \
        -subj "/C=BR/ST=State/L=City/O=Organization/CN=${DOMAIN:-localhost}" \
        >/dev/null 2>&1
    log "Self-signed certificate generated"
fi

# Fix permissions
chown -R nginx:nginx /var/log/nginx /var/cache/nginx 2>/dev/null || true
chmod -R 755 /var/log/nginx /var/cache/nginx 2>/dev/null || true

# Test nginx configuration
log "Testing nginx configuration..."
if nginx -t >/dev/null 2>&1; then
    log "Nginx configuration is valid"
else
    log "ERROR: Nginx configuration is invalid"
    nginx -t
    exit 1
fi

log "Mail Nexus Gateway started successfully"

# Execute the main command
exec "$@"
