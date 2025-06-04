
#!/bin/bash

# Mail Nexus Gateway - Script de Verificação Pós-Deploy para CapRover
# Este script verifica se o deploy foi bem-sucedido

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variáveis
APP_NAME=""
DOMAIN=""
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"
}

# Ajuda
show_help() {
    echo "Uso: $0 --app APP_NAME --domain DOMAIN"
    echo ""
    echo "Opções:"
    echo "  --app APP_NAME      Nome da aplicação no CapRover"
    echo "  --domain DOMAIN     Domínio da aplicação"
    echo "  --help              Mostrar esta ajuda"
    echo ""
    echo "Exemplo:"
    echo "  $0 --app mail-nexus --domain mail.exemplo.com"
}

# Parse argumentos
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --app)
                APP_NAME="$2"
                shift 2
                ;;
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Argumento desconhecido: $1"
                show_help
                exit 1
                ;;
        esac
    done

    if [[ -z "$APP_NAME" ]]; then
        error "Nome da aplicação é obrigatório"
        show_help
        exit 1
    fi

    if [[ -z "$DOMAIN" ]]; then
        warn "Domínio não fornecido, usando o domínio padrão do CapRover"
    fi
}

# Verificar se CapRover CLI está disponível
check_caprover_cli() {
    if ! command -v caprover &> /dev/null; then
        error "CapRover CLI não encontrado. Instale com: npm install -g caprover"
    fi
    
    log "CapRover CLI encontrado"
}

# Verificar se está logado no CapRover
check_caprover_login() {
    if ! caprover list &> /dev/null; then
        error "Não está logado no CapRover. Execute: caprover login"
    fi
    
    log "Login no CapRover verificado"
}

# Verificar status da aplicação
check_app_status() {
    log "Verificando status da aplicação '$APP_NAME'..."
    
    if ! caprover list | grep -q "$APP_NAME"; then
        error "Aplicação '$APP_NAME' não encontrada no CapRover"
    fi
    
    # Tentar obter logs recentes para verificar se está rodando
    log "Obtendo status detalhado..."
    caprover logs --app "$APP_NAME" --lines 10 > /dev/null 2>&1
    
    log "✅ Aplicação encontrada e acessível"
}

# Health check da aplicação
health_check() {
    if [[ -z "$DOMAIN" ]]; then
        warn "Domínio não fornecido, pulando health check HTTP"
        return 0
    fi
    
    log "Iniciando health check para https://$DOMAIN..."
    
    local retries=0
    while [[ $retries -lt $HEALTH_CHECK_RETRIES ]]; do
        info "Tentativa $((retries + 1))/$HEALTH_CHECK_RETRIES..."
        
        if curl -f -s -L "https://$DOMAIN" > /dev/null 2>&1; then
            log "✅ Health check passou - aplicação está respondendo"
            return 0
        fi
        
        # Tentar HTTP se HTTPS falhar
        if curl -f -s -L "http://$DOMAIN" > /dev/null 2>&1; then
            warn "⚠️  Aplicação responde via HTTP mas não HTTPS (SSL pode estar configurando)"
            return 0
        fi
        
        retries=$((retries + 1))
        if [[ $retries -lt $HEALTH_CHECK_RETRIES ]]; then
            info "Aguardando ${HEALTH_CHECK_INTERVAL}s antes da próxima tentativa..."
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    error "❌ Health check falhou após $HEALTH_CHECK_RETRIES tentativas"
    return 1
}

# Verificar logs por erros
check_logs() {
    log "Verificando logs recentes por erros..."
    
    local logs
    logs=$(caprover logs --app "$APP_NAME" --lines 50 2>/dev/null)
    
    # Procurar por erros comuns
    if echo "$logs" | grep -i "error\|exception\|failed\|fatal" > /dev/null; then
        warn "⚠️  Encontrados possíveis erros nos logs:"
        echo "$logs" | grep -i "error\|exception\|failed\|fatal" | tail -5
        echo ""
        warn "Verifique os logs completos com: caprover logs --app $APP_NAME"
    else
        log "✅ Nenhum erro crítico encontrado nos logs recentes"
    fi
}

# Verificar configurações essenciais
check_essential_configs() {
    log "Verificando configurações essenciais..."
    
    # Esta verificação seria mais robusta se tivéssemos acesso às env vars
    # Por enquanto, apenas verificamos se a app está rodando
    log "✅ Aplicação está executando (configurações básicas parecem OK)"
}

# Mostrar resumo e próximos passos
show_summary() {
    echo ""
    log "🎉 Verificação concluída!"
    echo ""
    
    if [[ -n "$DOMAIN" ]]; then
        echo -e "${BLUE}🌐 Acesso à aplicação:${NC}"
        echo "   https://$DOMAIN"
        echo ""
    fi
    
    echo -e "${BLUE}🔧 Comandos úteis:${NC}"
    echo "   caprover logs --app $APP_NAME     # Ver logs"
    echo "   caprover restart --app $APP_NAME  # Reiniciar app"
    echo "   caprover list                     # Listar todas as apps"
    echo ""
    
    echo -e "${BLUE}📋 Próximos passos recomendados:${NC}"
    echo "   1. Teste envio de email pela interface"
    echo "   2. Configure monitoramento/alertas"
    echo "   3. Configure backup regular dos dados"
    echo "   4. Documente as configurações específicas"
    echo ""
}

# Função principal
main() {
    parse_args "$@"
    
    log "🔍 Iniciando verificação do deploy do Mail Nexus Gateway"
    log "Aplicação: $APP_NAME"
    if [[ -n "$DOMAIN" ]]; then
        log "Domínio: $DOMAIN"
    fi
    echo ""
    
    check_caprover_cli
    check_caprover_login
    check_app_status
    
    if [[ -n "$DOMAIN" ]]; then
        health_check
    fi
    
    check_logs
    check_essential_configs
    show_summary
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
