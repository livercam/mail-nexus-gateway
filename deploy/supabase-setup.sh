
#!/bin/bash

# Script específico para configuração do Supabase
# Usado pelo script principal de instalação

SUPABASE_DIR=${1:-"/opt/mail-nexus/supabase"}
DOMAIN=${2:-"localhost"}

log() {
    echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[0;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
    exit 1
}

setup_supabase_advanced() {
    log "Configurando Supabase com configurações avançadas..."
    
    cd $SUPABASE_DIR/docker
    
    # Backup do .env original
    cp .env .env.backup
    
    # Configurações avançadas
    cat >> .env << EOF

# Mail Nexus Gateway - Configurações Avançadas
ENABLE_EMAIL_CONFIRMATIONS=false
ENABLE_PHONE_CONFIRMATIONS=false
ENABLE_PHONE_AUTOCONFIRM=true
ENABLE_EMAIL_AUTOCONFIRM=true

# SMTP Configuration (opcional)
SMTP_ADMIN_EMAIL=$ADMIN_EMAIL
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME="Mail Nexus Gateway"

# Storage
STORAGE_BACKEND=file
FILE_SIZE_LIMIT=52428800
FILE_STORAGE_BACKEND_PATH=/var/lib/storage

# Configurações de segurança
GOTRUE_DISABLE_SIGNUP=false
GOTRUE_SITE_URL=https://$DOMAIN
GOTRUE_URI_ALLOW_LIST=https://$DOMAIN/*
GOTRUE_JWT_ADMIN_ROLES=service_role
GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated

# Rate limiting
GOTRUE_RATE_LIMIT_EMAIL_SENT=3
GOTRUE_RATE_LIMIT_TOKEN_REFRESH=10
GOTRUE_RATE_LIMIT_VERIFY=5

# Sessions
GOTRUE_JWT_EXP=3600
GOTRUE_REFRESH_TOKEN_ROTATION_ENABLED=true
GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL=10
EOF
    
    log "Configurações avançadas aplicadas"
}

# Criar edge function para envio de emails
create_email_function() {
    log "Criando edge function para envio de emails..."
    
    mkdir -p $SUPABASE_DIR/docker/volumes/functions/send-email
    
    cat > $SUPABASE_DIR/docker/volumes/functions/send-email/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  email_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email_id }: EmailRequest = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar dados do email
    const { data: email, error: fetchError } = await supabaseClient
      .from('emails')
      .select('*')
      .eq('id', email_id)
      .single()

    if (fetchError) {
      throw new Error(`Erro ao buscar email: ${fetchError.message}`)
    }

    // Aqui você integraria com seu provedor SMTP
    // Por enquanto, vamos apenas simular o envio
    console.log('Enviando email:', {
      to: email.to_email,
      subject: email.subject,
      body: email.body
    })

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Atualizar status do email
    const { error: updateError } = await supabaseClient
      .from('emails')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', email_id)

    if (updateError) {
      throw new Error(`Erro ao atualizar status: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email enviado com sucesso' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
EOF

    log "Edge function criada"
}

# Configurar policies do banco
setup_database_policies() {
    log "Configurando políticas de segurança do banco..."
    
    # Aguardar postgres estar pronto
    sleep 10
    
    docker exec -i supabase-db psql -U postgres << 'EOF'
-- Habilitar RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para emails (permitir tudo por enquanto)
CREATE POLICY "Allow all operations on emails" ON emails
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Políticas para templates
CREATE POLICY "Allow all operations on email_templates" ON email_templates
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Criar função para validar emails
CREATE OR REPLACE FUNCTION validate_email(email_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email_text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar emails antes de inserir
CREATE OR REPLACE FUNCTION validate_email_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_email(NEW.to_email) THEN
        RAISE EXCEPTION 'Email de destino inválido: %', NEW.to_email;
    END IF;
    
    IF NEW.cc IS NOT NULL AND NEW.cc != '' AND NOT validate_email(NEW.cc) THEN
        RAISE EXCEPTION 'Email CC inválido: %', NEW.cc;
    END IF;
    
    IF NEW.bcc IS NOT NULL AND NEW.bcc != '' AND NOT validate_email(NEW.bcc) THEN
        RAISE EXCEPTION 'Email BCC inválido: %', NEW.bcc;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_email_trigger
    BEFORE INSERT OR UPDATE ON emails
    FOR EACH ROW
    EXECUTE FUNCTION validate_email_before_insert();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_emails_status_created ON emails(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_name ON email_templates(name);

COMMIT;
EOF

    log "Políticas de segurança configuradas"
}

# Função principal
main() {
    if [[ ! -d "$SUPABASE_DIR" ]]; then
        error "Diretório do Supabase não encontrado: $SUPABASE_DIR"
    fi
    
    setup_supabase_advanced
    create_email_function
    setup_database_policies
    
    log "Configuração avançada do Supabase concluída"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
