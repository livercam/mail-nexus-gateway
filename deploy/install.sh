
#!/bin/bash

# Mail Nexus Gateway - Script de Instalação Automatizada
# Versão: 1.0.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis padrão
DOMAIN=""
VPS_IP=""
ADMIN_EMAIL=""
INSTALL_DIR="/opt/mail-nexus"
SUPABASE_DIR="$INSTALL_DIR/supabase"
APP_DIR="$INSTALL_DIR/app"

# Funções utilitárias
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se é root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script deve ser executado como root"
    fi
}

# Detectar sistema operacional
detect_os() {
    if [[ -f /etc/debian_version ]]; then
        OS="debian"
        DISTRO=$(lsb_release -si 2>/dev/null || echo "Debian")
    elif [[ -f /etc/redhat-release ]]; then
        OS="rhel"
        DISTRO=$(cat /etc/redhat-release | cut -d' ' -f1)
    else
        error "Sistema operacional não suportado"
    fi
    log "Sistema detectado: $DISTRO"
}

# Instalar dependências
install_dependencies() {
    log "Instalando dependências..."
    
    if [[ $OS == "debian" ]]; then
        apt-get update
        apt-get install -y curl wget git jq docker.io docker-compose certbot nginx ufw
    elif [[ $OS == "rhel" ]]; then
        yum update -y
        yum install -y curl wget git jq docker docker-compose certbot nginx firewalld
        systemctl start docker
    fi
    
    systemctl enable docker
    systemctl start docker
    
    # Verificar se Docker está funcionando
    if ! docker --version > /dev/null 2>&1; then
        error "Falha na instalação do Docker"
    fi
    
    log "Dependências instaladas com sucesso"
}

# Configurar firewall
setup_firewall() {
    log "Configurando firewall..."
    
    if [[ $OS == "debian" ]]; then
        ufw --force enable
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3000/tcp
        ufw allow 8000/tcp
    elif [[ $OS == "rhel" ]]; then
        systemctl enable firewalld
        systemctl start firewalld
        firewall-cmd --permanent --add-port=22/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --permanent --add-port=8000/tcp
        firewall-cmd --reload
    fi
    
    log "Firewall configurado"
}

# Configurar DNS e SSL
setup_ssl() {
    log "Configurando SSL para $DOMAIN..."
    
    # Parar nginx se estiver rodando
    systemctl stop nginx 2>/dev/null || true
    
    # Gerar certificado SSL
    certbot certonly --standalone \
        -d $DOMAIN \
        --email $ADMIN_EMAIL \
        --agree-tos \
        --non-interactive
    
    if [[ $? -eq 0 ]]; then
        log "Certificado SSL gerado com sucesso"
        
        # Configurar renovação automática
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    else
        warn "Falha na geração do certificado SSL. Continuando sem SSL..."
    fi
}

# Instalar Supabase Self-hosted
install_supabase() {
    log "Instalando Supabase Self-hosted..."
    
    mkdir -p $SUPABASE_DIR
    cd $SUPABASE_DIR
    
    # Baixar Supabase self-hosted
    git clone --depth 1 https://github.com/supabase/supabase.git .
    cd docker
    
    # Copiar arquivo de exemplo
    cp .env.example .env
    
    # Gerar chaves aleatórias
    JWT_SECRET=$(openssl rand -base64 32)
    ANON_KEY=$(openssl rand -base64 32)
    SERVICE_ROLE_KEY=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    
    # Configurar .env
    sed -i "s/POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
    sed -i "s/JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/ANON_KEY=.*$/ANON_KEY=$ANON_KEY/" .env
    sed -i "s/SERVICE_ROLE_KEY=.*$/SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY/" .env
    sed -i "s/SITE_URL=.*$/SITE_URL=https:\/\/$DOMAIN/" .env
    
    # Iniciar Supabase
    docker-compose up -d
    
    # Aguardar Supabase inicializar
    log "Aguardando Supabase inicializar..."
    sleep 30
    
    # Verificar se está funcionando
    for i in {1..10}; do
        if curl -s http://localhost:8000/health > /dev/null; then
            log "Supabase iniciado com sucesso"
            break
        fi
        log "Tentativa $i/10 - Aguardando Supabase..."
        sleep 10
    done
    
    # Salvar credenciais
    cat > $INSTALL_DIR/supabase-credentials.json << EOF
{
    "url": "http://localhost:8000",
    "anon_key": "$ANON_KEY",
    "service_role_key": "$SERVICE_ROLE_KEY",
    "postgres_password": "$POSTGRES_PASSWORD",
    "jwt_secret": "$JWT_SECRET"
}
EOF
    
    log "Supabase instalado e configurado"
}

# Configurar banco de dados
setup_database() {
    log "Configurando banco de dados..."
    
    # Ler credenciais
    POSTGRES_PASSWORD=$(jq -r '.postgres_password' $INSTALL_DIR/supabase-credentials.json)
    
    # Executar SQL de inicialização
    docker exec -i supabase-db psql -U postgres << 'EOF'
-- Criar schema para emails
CREATE TABLE IF NOT EXISTS emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    cc VARCHAR(255),
    bcc VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body TEXT,
    html TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    html TEXT,
    variables JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar função para estatísticas
CREATE OR REPLACE FUNCTION get_email_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_sent', COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')),
        'total_failed', COUNT(*) FILTER (WHERE status = 'failed'),
        'total_pending', COUNT(*) FILTER (WHERE status = 'draft'),
        'delivery_rate', 
            CASE 
                WHEN COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'failed')) = 0 THEN 0
                ELSE ROUND(
                    (COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::FLOAT / 
                     COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'failed'))::FLOAT) * 100, 2
                )
            END
    ) INTO result
    FROM emails
    WHERE created_at >= NOW() - INTERVAL '30 days';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from_email);
CREATE INDEX IF NOT EXISTS idx_emails_to ON emails(to_email);
EOF
    
    log "Banco de dados configurado"
}

# Instalar Mail Nexus Gateway
install_mail_nexus() {
    log "Instalando Mail Nexus Gateway..."
    
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Criar docker-compose para a aplicação
    cat > docker-compose.yml << EOF
version: '3.8'
services:
  mail-nexus:
    image: node:18-alpine
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      - SUPABASE_URL=http://host.docker.internal:8000
      - SUPABASE_ANON_KEY=$(jq -r '.anon_key' $INSTALL_DIR/supabase-credentials.json)
      - DOMAIN=$DOMAIN
      - VPS_IP=$VPS_IP
    volumes:
      - ./app:/app
      - /var/run/docker.sock:/var/run/docker.sock
    command: sh -c "npm install && npm run dev"
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
EOF
    
    log "Mail Nexus Gateway configurado"
}

# Configurar Nginx
setup_nginx() {
    log "Configurando Nginx..."
    
    cat > /etc/nginx/sites-available/mail-nexus << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
    }
    
    location /supabase/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # Habilitar site
    ln -sf /etc/nginx/sites-available/mail-nexus /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    nginx -t
    
    # Reiniciar nginx
    systemctl restart nginx
    systemctl enable nginx
    
    log "Nginx configurado"
}

# Criar script de health check
create_health_check() {
    cat > $INSTALL_DIR/health-check.sh << 'EOF'
#!/bin/bash

DOMAIN="__DOMAIN__"
INSTALL_DIR="/opt/mail-nexus"

check_service() {
    local service=$1
    local url=$2
    local expected_status=$3
    
    status=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null || echo "000")
    
    if [[ $status == $expected_status ]]; then
        echo "✅ $service: OK"
        return 0
    else
        echo "❌ $service: FALHA (Status: $status)"
        return 1
    fi
}

echo "🔍 Verificando serviços do Mail Nexus Gateway..."
echo "=================================================="

# Verificar Supabase
check_service "Supabase API" "http://localhost:8000/health" "200"
supabase_ok=$?

# Verificar Mail Nexus
check_service "Mail Nexus App" "http://localhost:3000" "200"
app_ok=$?

# Verificar Nginx
check_service "Nginx (HTTP)" "http://$DOMAIN" "301"
nginx_http_ok=$?

check_service "Nginx (HTTPS)" "https://$DOMAIN" "200"
nginx_https_ok=$?

# Verificar banco de dados
if docker exec supabase-db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL: OK"
    postgres_ok=0
else
    echo "❌ PostgreSQL: FALHA"
    postgres_ok=1
fi

echo "=================================================="

total_checks=5
failed_checks=$((supabase_ok + app_ok + nginx_http_ok + nginx_https_ok + postgres_ok))
success_rate=$(( (total_checks - failed_checks) * 100 / total_checks ))

echo "📊 Status geral: $success_rate% dos serviços funcionando"

if [[ $failed_checks -eq 0 ]]; then
    echo "🎉 Todos os serviços estão funcionando perfeitamente!"
    exit 0
else
    echo "⚠️  $failed_checks serviço(s) com problema(s)"
    exit 1
fi
EOF
    
    sed -i "s/__DOMAIN__/$DOMAIN/g" $INSTALL_DIR/health-check.sh
    chmod +x $INSTALL_DIR/health-check.sh
}

# Função principal
main() {
    log "🚀 Iniciando instalação do Mail Nexus Gateway"
    
    # Parse argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --ip)
                VPS_IP="$2"
                shift 2
                ;;
            --email)
                ADMIN_EMAIL="$2"
                shift 2
                ;;
            *)
                error "Parâmetro desconhecido: $1"
                ;;
        esac
    done
    
    # Validar parâmetros obrigatórios
    if [[ -z "$DOMAIN" ]]; then
        read -p "Digite o domínio (ex: correio.desenvolve.one): " DOMAIN
    fi
    
    if [[ -z "$VPS_IP" ]]; then
        read -p "Digite o IP do VPS: " VPS_IP
    fi
    
    if [[ -z "$ADMIN_EMAIL" ]]; then
        read -p "Digite o email do administrador: " ADMIN_EMAIL
    fi
    
    log "Configuração:"
    log "  Domínio: $DOMAIN"
    log "  IP: $VPS_IP"
    log "  Email Admin: $ADMIN_EMAIL"
    log "  Diretório: $INSTALL_DIR"
    
    read -p "Continuar com a instalação? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Instalação cancelada"
        exit 0
    fi
    
    # Executar instalação
    check_root
    detect_os
    install_dependencies
    setup_firewall
    
    mkdir -p $INSTALL_DIR
    cd $INSTALL_DIR
    
    install_supabase
    setup_database
    install_mail_nexus
    
    # SSL só se tiver domínio válido
    if [[ $DOMAIN != *"localhost"* ]] && [[ $DOMAIN != *"127.0.0.1"* ]]; then
        setup_ssl
        setup_nginx
    else
        warn "Domínio local detectado. Pulando configuração SSL/Nginx."
    fi
    
    create_health_check
    
    log "🎉 Instalação concluída com sucesso!"
    log ""
    log "📋 Informações importantes:"
    log "  • URL da aplicação: https://$DOMAIN"
    log "  • Supabase Studio: http://$VPS_IP:8000"
    log "  • Diretório de instalação: $INSTALL_DIR"
    log "  • Credenciais do Supabase: $INSTALL_DIR/supabase-credentials.json"
    log ""
    log "🔧 Comandos úteis:"
    log "  • Verificar status: $INSTALL_DIR/health-check.sh"
    log "  • Ver logs: docker-compose -f $SUPABASE_DIR/docker/docker-compose.yml logs -f"
    log "  • Reiniciar: systemctl restart nginx && docker-compose -f $SUPABASE_DIR/docker/docker-compose.yml restart"
    log ""
    log "⚠️  Importante: Guarde as credenciais em local seguro!"
    
    # Executar health check final
    log "🔍 Executando verificação final..."
    sleep 5
    $INSTALL_DIR/health-check.sh
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
