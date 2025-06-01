
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Server, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Terminal,
  Docker,
  Globe,
  Shield
} from 'lucide-react';
import { loadConfig, isConfigured } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';

const Deploy = () => {
  const [deployConfig, setDeployConfig] = useState({
    domain: '',
    vps_ip: '',
    admin_email: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const config = loadConfig();

  const generateDockerCompose = () => {
    return `version: '3.8'

services:
  mail-nexus-gateway:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${config.supabase?.url || 'YOUR_SUPABASE_URL'}
      - SUPABASE_ANON_KEY=${config.supabase?.anon_key || 'YOUR_SUPABASE_ANON_KEY'}
      - SUPABASE_SERVICE_ROLE_KEY=${config.supabase?.service_role_key || 'YOUR_SUPABASE_SERVICE_KEY'}
      - SMTP_HOST=${config.server.smtp_host || 'YOUR_SMTP_HOST'}
      - SMTP_PORT=${config.server.smtp_port || 587}
      - SMTP_USER=${config.server.smtp_user || 'YOUR_SMTP_USER'}
      - SMTP_PASS=${config.server.smtp_password || 'YOUR_SMTP_PASSWORD'}
      - SMTP_SECURE=true
      - DOMAIN=${deployConfig.domain || config.server.domain || 'localhost'}
      - VPS_IP=${deployConfig.vps_ip || config.server.vps_ip || '127.0.0.1'}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    depends_on:
      - redis
    networks:
      - mail-nexus-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - mail-nexus-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    restart: unless-stopped
    depends_on:
      - mail-nexus-gateway
    networks:
      - mail-nexus-network

volumes:
  redis_data:

networks:
  mail-nexus-network:
    driver: bridge
`;
  };

  const generateInstallScript = () => {
    return `#!/bin/bash

# Mail Nexus Gateway - Script de Instalação Automatizada
curl -sSL https://raw.githubusercontent.com/mail-nexus/gateway/main/deploy/install.sh | bash -s -- \\
  --domain "${deployConfig.domain}" \\
  --ip "${deployConfig.vps_ip}" \\
  --email "${deployConfig.admin_email}"
`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const checkReadiness = () => {
    const issues = [];
    if (!config.server.domain) issues.push('Domínio não configurado');
    if (!config.server.smtp_host) issues.push('SMTP não configurado');
    if (!config.supabase?.url) issues.push('Supabase não configurado');
    return issues;
  };

  const readinessIssues = checkReadiness();
  const isReady = readinessIssues.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Server className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Deploy</h1>
      </div>

      {/* Status de Prontidão */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isReady ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
            Status de Prontidão para Deploy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isReady ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Sistema pronto para deploy!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-yellow-800 mb-3">Problemas encontrados:</p>
              {readinessIssues.map((issue, index) => (
                <div key={index} className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{issue}</span>
                </div>
              ))}
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/settings'}
                className="mt-3"
              >
                Ir para Configurações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuração de Deploy */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configuração de Deploy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deploy_domain">Domínio de Produção</Label>
              <Input
                id="deploy_domain"
                value={deployConfig.domain}
                onChange={(e) => setDeployConfig({
                  ...deployConfig,
                  domain: e.target.value
                })}
                placeholder="correio.exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="deploy_ip">IP do VPS</Label>
              <Input
                id="deploy_ip"
                value={deployConfig.vps_ip}
                onChange={(e) => setDeployConfig({
                  ...deployConfig,
                  vps_ip: e.target.value
                })}
                placeholder="192.168.1.100"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="admin_email">Email do Administrador</Label>
            <Input
              id="admin_email"
              type="email"
              value={deployConfig.admin_email}
              onChange={(e) => setDeployConfig({
                ...deployConfig,
                admin_email: e.target.value
              })}
              placeholder="admin@exemplo.com"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Docker Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Docker className="h-5 w-5" />
              Docker Compose
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={generateDockerCompose()}
                readOnly
                rows={12}
                className="font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateDockerCompose(), 'Docker Compose')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(generateDockerCompose(), 'docker-compose.yml')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Script de Instalação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Script de Instalação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={generateInstallScript()}
                readOnly
                rows={8}
                className="font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateInstallScript(), 'Script de Instalação')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(generateInstallScript(), 'install.sh')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instruções de Deploy */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Instruções de Deploy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Preparação do Servidor</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                <li>Ubuntu 20.04+ ou Debian 11+ recomendado</li>
                <li>Mínimo 2GB RAM, 20GB disco</li>
                <li>Docker e Docker Compose instalados</li>
                <li>Portas 80, 443, 3000, 8000 abertas</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">2. Instalação Automática</h3>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                curl -sSL https://raw.githubusercontent.com/mail-nexus/gateway/main/deploy/install.sh | bash
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">3. Configuração DNS</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                <li>Apontar domínio para o IP do VPS</li>
                <li>Configurar registro A: {deployConfig.domain || 'seu-dominio.com'} → {deployConfig.vps_ip || 'IP_DO_VPS'}</li>
                <li>Aguardar propagação DNS (até 24h)</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">4. Verificação</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                <li>Acessar https://{deployConfig.domain || 'seu-dominio.com'}</li>
                <li>Verificar certificado SSL</li>
                <li>Testar envio de email</li>
                <li>Monitorar logs: docker-compose logs -f</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Deploy;
