
# Mail Nexus Gateway - Guia Completo de Deploy no CapRover

Este guia fornece instruções detalhadas para fazer deploy do Mail Nexus Gateway no CapRover de diferentes formas.

## 📋 Pré-requisitos

- CapRover instalado e configurado no seu servidor
- Domínio configurado e apontando para o CapRover
- Acesso ao painel administrativo do CapRover
- Projeto Supabase configurado (ou usar Supabase self-hosted)

## 🚀 Método 1: One-Click App (Recomendado)

### Passo 1: Preparar o Template
1. Acesse o painel do CapRover
2. Vá para **"Apps"** → **"One-Click Apps/Databases"**
3. Clique na aba **">> TEMPLATE <<"**

### Passo 2: Usar o Template
1. Cole o JSON do One-Click App (disponível na interface web em `/deploy`)
2. Clique em **"LOAD"**
3. Preencha as variáveis obrigatórias:
   - `SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_ANON_KEY`: Chave anônima do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase
   - `SMTP_HOST`: Servidor SMTP (ex: smtp.gmail.com)
   - `SMTP_USER`: Usuário do SMTP
   - `SMTP_PASS`: Senha do SMTP
   - `DOMAIN`: Seu domínio (ex: mail.seudominio.com)
   - `VPS_IP`: IP do servidor

### Passo 3: Deploy
1. Clique em **"DEPLOY"**
2. Aguarde a instalação completar
3. Configure o domínio personalizado
4. Ative o SSL

## 📁 Método 2: Upload do Código

### Passo 1: Preparar o Projeto
1. Baixe o arquivo `captain-definition` da interface web
2. Coloque na raiz do seu projeto
3. Certifique-se que o `Dockerfile` está presente

### Passo 2: Criar App no CapRover
1. No painel do CapRover, vá para **"Apps"**
2. Clique em **"Create New App"**
3. Digite um nome para a app (ex: `mail-nexus-gateway`)
4. Marque **"Has Persistent Data"** se necessário

### Passo 3: Upload do Código
Você pode fazer upload de 3 formas:

#### Via Upload Direto:
1. Crie um arquivo .tar do seu projeto: `tar -czf mail-nexus.tar.gz .`
2. Na aba **"Deployment"** da sua app, faça upload do arquivo

#### Via Git:
1. Conecte seu repositório Git
2. Configure branch e deploy automático

#### Via CLI:
```bash
npm install -g caprover
caprover login
caprover deploy
```

### Passo 4: Configurar Variáveis
1. Vá para a aba **"App Configs"**
2. Adicione as variáveis de ambiente:

```env
NODE_ENV=production
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-servico
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
SMTP_SECURE=true
DOMAIN=mail.seudominio.com
VPS_IP=123.456.789.0
```

## 🔧 Método 3: Docker Compose

### Passo 1: Preparar Docker Compose
1. Baixe o arquivo `docker-compose.caprover.yml` da interface web
2. Coloque na raiz do projeto como `docker-compose.yml`

### Passo 2: Deploy via Compose
1. Na sua app no CapRover, vá para **"App Configs"**
2. Role até **"Bulk Edit"**
3. Cole o conteúdo do docker-compose
4. Salve e faça deploy

## ⚙️ Configurações Avançadas

### SSL/HTTPS
1. Na aba **"HTTP Settings"** da sua app
2. Marque **"HTTPS"**
3. Marque **"Force HTTPS by redirecting all HTTP traffic to HTTPS"**
4. Configure seu domínio personalizado

### Domínio Personalizado
1. Vá para **"HTTP Settings"**
2. Em **"Custom Domain"**, adicione seu domínio
3. Clique em **"Connect New Domain"**
4. Aguarde a validação SSL

### Monitoramento e Logs
```bash
# Ver logs em tempo real
caprover logs --app mail-nexus-gateway

# Ver status da app
caprover list
```

## 🔍 Verificação Pós-Deploy

### Verificar Saúde da Aplicação
1. Acesse `https://seu-dominio.com`
2. Verifique se carrega sem erros
3. Teste o envio de um email
4. Verifique os logs por erros

### Health Check Automático
O sistema inclui health checks automáticos. Para verificar manualmente:

```bash
# Via curl
curl -f https://seu-dominio.com/health

# Ou acesse diretamente no navegador
https://seu-dominio.com/health
```

## 🚨 Troubleshooting

### App não inicia
1. Verifique os logs: **"Monitoring"** → **"View Logs"**
2. Certifique-se que todas as variáveis estão configuradas
3. Verifique se o Dockerfile está correto

### Erro de SSL
1. Aguarde alguns minutos para propagação
2. Verifique se o domínio está correto
3. Tente forçar renovação do SSL

### Erro de SMTP
1. Verifique credenciais SMTP
2. Para Gmail, use senha de app específica
3. Verifique se SMTP_SECURE está como 'true' ou 'false' conforme necessário

### Erro de Supabase
1. Verifique se a URL do Supabase está correta
2. Confirme se as chaves estão válidas
3. Teste conexão diretamente no navegador

## 📊 Monitoramento Contínuo

### Métricas importantes:
- CPU e RAM usage
- Logs de erro
- Taxa de entrega de emails
- Tempo de resposta da aplicação

### Backup
O CapRover faz backup automático das configurações. Para dados:
1. Configure backup regular do Supabase
2. Monitore volumes persistentes se usando

## 🔄 Atualizações

Para atualizar a aplicação:
1. Faça novo deploy com código atualizado
2. As variáveis de ambiente são mantidas
3. Zero downtime se configurado corretamente

## 📞 Suporte

- Logs detalhados estão disponíveis no painel CapRover
- Use o health check para diagnóstico rápido
- Verifique a documentação oficial do CapRover para configurações avançadas

---

**Dica**: Sempre teste em ambiente de desenvolvimento primeiro antes de fazer deploy em produção.
