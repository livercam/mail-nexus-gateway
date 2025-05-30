
# Mail Nexus Gateway - Deploy Automatizado

Este diretório contém todos os scripts e templates necessários para fazer o deploy automatizado do Mail Nexus Gateway com Supabase self-hosted.

## 🚀 Instalação Rápida

```bash
curl -sSL https://raw.githubusercontent.com/seu-repo/mail-nexus/main/deploy/install.sh | bash -s -- \
  --domain seu-dominio.com \
  --ip 123.456.789.0 \
  --email admin@seu-dominio.com
```

## 📁 Estrutura dos Arquivos

- `install.sh` - Script principal de instalação
- `supabase-setup.sh` - Configuração específica do Supabase
- `templates/` - Templates de configuração
  - `docker-compose.mail-nexus.yml` - Docker compose para a aplicação
  - `nginx.conf` - Configuração do Nginx
- `README.md` - Esta documentação

## 🔧 Funcionalidades

### ✅ Automatizado
- Detecção automática do SO (Ubuntu/Debian/CentOS)
- Instalação de dependências (Docker, Docker Compose, etc.)
- Configuração automática do firewall
- Geração automática de certificados SSL
- Configuração completa do Nginx

### ✅ Supabase Self-hosted
- Download e configuração automática
- Geração de chaves criptográficas
- Configuração do banco de dados
- Criação de edge functions
- Configuração de políticas de segurança

### ✅ Monitoramento
- Script de health check
- Logs centralizados
- Monitoramento de status dos serviços

## 📋 Pré-requisitos

- Servidor Linux (Ubuntu/Debian ou CentOS/RHEL)
- Acesso root via SSH
- DNS configurado para o domínio
- Portas 80, 443, 3000, 8000 liberadas no firewall
- Mínimo 4GB RAM e 20GB de armazenamento

## 🔐 Segurança

- Certificados SSL automáticos via Let's Encrypt
- Rate limiting no Nginx
- Headers de segurança configurados
- Políticas RLS no banco de dados
- Validação de entrada de dados

## 🚀 Uso da Interface Web

1. Acesse a aba "Deploy" nas configurações
2. Preencha os dados do servidor
3. Execute o deploy automático ou use o comando manual
4. Monitore o progresso em tempo real

## 📊 Monitoramento

Após a instalação, use estes comandos para monitorar:

```bash
# Status geral
/opt/mail-nexus/health-check.sh

# Logs do Supabase
cd /opt/mail-nexus/supabase/docker && docker-compose logs -f

# Logs do Nginx
tail -f /var/log/nginx/access.log

# Status dos containers
docker ps
```

## 🔄 Atualizações

Para atualizar o sistema:

```bash
cd /opt/mail-nexus
git pull
./deploy/install.sh --update
```

## 🆘 Troubleshooting

### Problema comum 1: DNS não resolvendo
- Verifique se o DNS está propagado: `nslookup seu-dominio.com`
- Aguarde até 24h para propagação completa

### Problema comum 2: Certificado SSL falha
- Verifique se as portas 80/443 estão abertas
- Certifique-se que não há outros serviços usando essas portas

### Problema comum 3: Supabase não inicia
- Verifique logs: `docker-compose -f /opt/mail-nexus/supabase/docker/docker-compose.yml logs`
- Verifique espaço em disco: `df -h`

## 📝 Logs Importantes

- Instalação: `/opt/mail-nexus/install.log`
- Nginx: `/var/log/nginx/`
- Supabase: `docker-compose logs`
- Aplicação: `/opt/mail-nexus/app/logs/`

## 🔧 Configurações Avançadas

### Personalizar portas
Edite `/opt/mail-nexus/app/docker-compose.yml` e ajuste as portas conforme necessário.

### Configurar SMTP customizado
Edite as variáveis de ambiente no docker-compose da aplicação.

### Backup automático
O sistema inclui backup automático das configurações em `/opt/mail-nexus/backups/`.

## 📞 Suporte

Para suporte técnico:
1. Verifique os logs de erro
2. Execute o health check
3. Consulte a documentação online
4. Abra uma issue no repositório
