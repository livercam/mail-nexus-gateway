import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, Server, Mail, Database, Container } from 'lucide-react';
import { AppConfig, DeployConfig } from '@/types/config';
import { saveConfig, loadConfig, getDefaultConfig } from '@/lib/config';
import { initializeSupabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const [config, setConfig] = useState<AppConfig>(getDefaultConfig());
  const [deployConfig, setDeployConfig] = useState<DeployConfig>({
    docker_compose: '',
    nginx_config: '',
    ssl_setup_script: '',
    environment_vars: {}
  });
  const { toast } = useToast();

  useEffect(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }
    generateDeployConfig();
  }, []);

  const handleSave = () => {
    try {
      saveConfig(config);
      
      // Initialize Supabase with new config
      if (config.supabase.url && config.supabase.anon_key) {
        initializeSupabase(config.supabase);
        localStorage.setItem('supabase_config', JSON.stringify(config.supabase));
      }
      
      toast({
        title: "Configurações Salvas",
        description: "As configurações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar as configurações.",
        variant: "destructive",
      });
    }
  };

  const generateDeployConfig = () => {
    const dockerCompose = `version: '3.8'
services:
  mail-nexus:
    image: mail-nexus-gateway:latest
    ports:
      - "80:3000"
      - "443:3001"
    environment:
      - SUPABASE_URL=${config.supabase.url}
      - SUPABASE_ANON_KEY=${config.supabase.anon_key}
      - SMTP_HOST=${config.smtp.host}
      - SMTP_PORT=${config.smtp.port}
      - SMTP_USER=${config.smtp.username}
      - SMTP_PASS=${config.smtp.password}
      - DOMAIN=${config.server.domain}
      - VPS_IP=${config.server.vps_ip}
    volumes:
      - ./ssl:/app/ssl
      - ./data:/app/data
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - mail-nexus
    restart: unless-stopped`;

    const nginxConfig = `events {
    worker_connections 1024;
}

http {
    upstream mail_nexus {
        server mail-nexus:3000;
    }
    
    server {
        listen 80;
        server_name ${config.server.domain};
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl;
        server_name ${config.server.domain};
        
        ssl_certificate /etc/ssl/certs/fullchain.pem;
        ssl_certificate_key /etc/ssl/certs/privkey.pem;
        
        location / {
            proxy_pass http://mail_nexus;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}`;

    const sslScript = `#!/bin/bash
# Setup SSL with Let's Encrypt
apt-get update
apt-get install -y certbot

# Generate SSL certificate
certbot certonly --standalone -d ${config.server.domain} --email admin@${config.server.domain} --agree-tos --non-interactive

# Copy certificates to docker volume
mkdir -p ./ssl
cp /etc/letsencrypt/live/${config.server.domain}/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/${config.server.domain}/privkey.pem ./ssl/

# Setup auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

echo "SSL setup completed for ${config.server.domain}"`;

    setDeployConfig({
      docker_compose: dockerCompose,
      nginx_config: nginxConfig,
      ssl_setup_script: sslScript,
      environment_vars: {
        SUPABASE_URL: config.supabase.url,
        SUPABASE_ANON_KEY: config.supabase.anon_key,
        SMTP_HOST: config.smtp.host,
        SMTP_PORT: config.smtp.port.toString(),
        DOMAIN: config.server.domain,
        VPS_IP: config.server.vps_ip,
      }
    });
  };

  useEffect(() => {
    generateDeployConfig();
  }, [config]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-gray-600">Configure o sistema de email</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>

      <Tabs defaultValue="server" className="space-y-6">
        <TabsList>
          <TabsTrigger value="server">
            <Server className="h-4 w-4 mr-2" />
            Servidor
          </TabsTrigger>
          <TabsTrigger value="supabase">
            <Database className="h-4 w-4 mr-2" />
            Supabase
          </TabsTrigger>
          <TabsTrigger value="smtp">
            <Mail className="h-4 w-4 mr-2" />
            SMTP
          </TabsTrigger>
          <TabsTrigger value="deploy">
            <Container className="h-4 w-4 mr-2" />
            Deploy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="server">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Servidor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vps_ip">IP do VPS</Label>
                  <Input
                    id="vps_ip"
                    value={config.server.vps_ip}
                    onChange={(e) => setConfig({
                      ...config,
                      server: { ...config.server, vps_ip: e.target.value }
                    })}
                    placeholder="161.97.100.37"
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domínio</Label>
                  <Input
                    id="domain"
                    value={config.server.domain}
                    onChange={(e) => setConfig({
                      ...config,
                      server: { ...config.server, domain: e.target.value }
                    })}
                    placeholder="correio.desenvolve.one"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ssl_enabled"
                  checked={config.server.ssl_enabled}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    server: { ...config.server, ssl_enabled: checked }
                  })}
                />
                <Label htmlFor="ssl_enabled">Habilitar SSL</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supabase">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Supabase Self-hosted</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="supabase_url">URL do Supabase</Label>
                <Input
                  id="supabase_url"
                  value={config.supabase.url}
                  onChange={(e) => setConfig({
                    ...config,
                    supabase: { ...config.supabase, url: e.target.value }
                  })}
                  placeholder="https://sua-instancia.supabase.co"
                />
              </div>
              <div>
                <Label htmlFor="supabase_key">Chave Anônima</Label>
                <Input
                  id="supabase_key"
                  type="password"
                  value={config.supabase.anon_key}
                  onChange={(e) => setConfig({
                    ...config,
                    supabase: { ...config.supabase, anon_key: e.target.value }
                  })}
                  placeholder="sua-chave-anonima"
                />
              </div>
              <div>
                <Label htmlFor="service_role_key">Chave Service Role (Opcional)</Label>
                <Input
                  id="service_role_key"
                  type="password"
                  value={config.supabase.service_role_key || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    supabase: { ...config.supabase, service_role_key: e.target.value }
                  })}
                  placeholder="sua-chave-service-role"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>Configurações SMTP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_host">Servidor SMTP</Label>
                  <Input
                    id="smtp_host"
                    value={config.smtp.host}
                    onChange={(e) => setConfig({
                      ...config,
                      smtp: { ...config.smtp, host: e.target.value }
                    })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">Porta</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={config.smtp.port}
                    onChange={(e) => setConfig({
                      ...config,
                      smtp: { ...config.smtp, port: parseInt(e.target.value) }
                    })}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_username">Usuário</Label>
                  <Input
                    id="smtp_username"
                    value={config.smtp.username}
                    onChange={(e) => setConfig({
                      ...config,
                      smtp: { ...config.smtp, username: e.target.value }
                    })}
                    placeholder="seu-email@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">Senha</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={config.smtp.password}
                    onChange={(e) => setConfig({
                      ...config,
                      smtp: { ...config.smtp, password: e.target.value }
                    })}
                    placeholder="sua-senha"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from_email">Email Remetente</Label>
                  <Input
                    id="from_email"
                    value={config.smtp.from_email}
                    onChange={(e) => setConfig({
                      ...config,
                      smtp: { ...config.smtp, from_email: e.target.value }
                    })}
                    placeholder="noreply@desenvolve.one"
                  />
                </div>
                <div>
                  <Label htmlFor="from_name">Nome Remetente</Label>
                  <Input
                    id="from_name"
                    value={config.smtp.from_name}
                    onChange={(e) => setConfig({
                      ...config,
                      smtp: { ...config.smtp, from_name: e.target.value }
                    })}
                    placeholder="Mail Nexus Gateway"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp_secure"
                  checked={config.smtp.secure}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    smtp: { ...config.smtp, secure: checked }
                  })}
                />
                <Label htmlFor="smtp_secure">Conexão Segura (SSL/TLS)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Docker Compose</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={deployConfig.docker_compose}
                  readOnly
                  className="font-mono text-sm h-64"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuração Nginx</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={deployConfig.nginx_config}
                  readOnly
                  className="font-mono text-sm h-48"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Script de Setup SSL</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={deployConfig.ssl_setup_script}
                  readOnly
                  className="font-mono text-sm h-32"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
