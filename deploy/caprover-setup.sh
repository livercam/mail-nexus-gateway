#!/bin/bash

# Mail Nexus Gateway - Script de Setup para CapRover
# Este script prepara o ambiente para deploy no CapRover

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se CapRover CLI está instalado
check_caprover_cli() {
    if ! command -v caprover &> /dev/null; then
        log "Instalando CapRover CLI..."
        npm install -g caprover
    else
        log "CapRover CLI já está instalado"
    fi
}

# Verificar se está logado no CapRover
check_caprover_login() {
    if ! caprover list &> /dev/null; then
        warn "Você precisa fazer login no CapRover primeiro"
        echo "Execute: caprover login"
        exit 1
    else
        log "Login no CapRover verificado"
    fi
}

# Verificar arquivos necessários
check_required_files() {
    local files=("captain-definition" "Dockerfile" "package.json")
    
    for file in "${files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Arquivo obrigatório não encontrado: $file"
        fi
    done
    
    log "Todos os arquivos obrigatórios encontrados"
}

# Criar arquivo .env de exemplo para CapRover
create_env_example() {
    log "Criando arquivo .env.caprover.example..."
    
    cat > .env.caprover.example << 'EOF'
# Configurações para CapRover
# Copie este arquivo para .env e preencha os valores

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-servico

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-ou-app-password
SMTP_SECURE=true

# Aplicação
DOMAIN=mail.seudominio.com
VPS_IP=123.456.789.0
NODE_ENV=production
EOF

    log "Arquivo .env.caprover.example criado"
}

# Validar captain-definition
validate_captain_definition() {
    log "Validando captain-definition..."
    
    if ! jq empty captain-definition 2>/dev/null; then
        error "captain-definition não é um JSON válido"
    fi
    
    log "captain-definition é válido"
}

# Preparar aplicação para deploy
prepare_app() {
    log "Preparando aplicação para deploy..."
    
    # Instalar dependências se não existir node_modules
    if [[ ! -d "node_modules" ]]; then
        log "Instalando dependências..."
        npm install
    fi
    
    # Fazer build da aplicação
    log "Fazendo build da aplicação..."
    npm run build
    
    log "Aplicação preparada com sucesso"
}

# Mostrar próximos passos
show_next_steps() {
    echo
    log "🎉 Setup concluído com sucesso!"
    echo
    echo -e "${YELLOW}📋 Próximos passos:${NC}"
    echo "1. Configure as variáveis de ambiente na sua app CapRover"
    echo "2. Execute: caprover deploy"
    echo "3. Configure domínio personalizado e SSL"
    echo "4. Teste a aplicação"
    echo
    echo -e "${YELLOW}📄 Arquivos criados:${NC}"
    echo "- .env.caprover.example (configure suas variáveis)"
    echo
    echo -e "${YELLOW}🔗 Comandos úteis:${NC}"
    echo "- caprover deploy            # Fazer deploy"
    echo "- caprover logs --app NAME   # Ver logs"
    echo "- caprover list              # Listar apps"
    echo
}

# Função principal
main() {
    log "🚀 Iniciando setup do Mail Nexus Gateway para CapRover"
    
    check_caprover_cli
    check_caprover_login
    check_required_files
    validate_captain_definition
    create_env_example
    prepare_app
    show_next_steps
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
