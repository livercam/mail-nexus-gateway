
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Server, Database, Save, TestTube } from 'lucide-react';
import { AppConfig } from '@/types/config';
import { loadConfig, saveConfig } from '@/lib/config';
import { initializeSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const [config, setConfig] = useState<AppConfig>(loadConfig());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      saveConfig(config);
      
      // Initialize Supabase if configured
      if (config.supabase?.url && config.supabase?.anon_key) {
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
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    toast({
      title: "Teste de Conexão",
      description: "Funcionalidade em desenvolvimento.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="server" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="server">
            <Server className="h-4 w-4 mr-2" />
            Servidor
          </TabsTrigger>
          <TabsTrigger value="supabase">
            <Database className="h-4 w-4 mr-2" />
            Supabase
          </TabsTrigger>
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="server">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Servidor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="domain">Domínio</Label>
                  <Input
                    id="domain"
                    value={config.server.domain}
                    onChange={(e) => setConfig({
                      ...config,
                      server: { ...config.server, domain: e.target.value }
                    })}
                    placeholder="exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="vps_ip">IP do VPS</Label>
                  <Input
                    id="vps_ip"
                    value={config.server.vps_ip}
                    onChange={(e) => setConfig({
                      ...config,
                      server: { ...config.server, vps_ip: e.target.value }
                    })}
                    placeholder="192.168.1.1"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Configurações SMTP</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_host">Host SMTP</Label>
                    <Input
                      id="smtp_host"
                      value={config.server.smtp_host}
                      onChange={(e) => setConfig({
                        ...config,
                        server: { ...config.server, smtp_host: e.target.value }
                      })}
                      placeholder="smtp.exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_port">Porta SMTP</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={config.server.smtp_port}
                      onChange={(e) => setConfig({
                        ...config,
                        server: { ...config.server, smtp_port: parseInt(e.target.value) || 587 }
                      })}
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_user">Usuário SMTP</Label>
                    <Input
                      id="smtp_user"
                      value={config.server.smtp_user}
                      onChange={(e) => setConfig({
                        ...config,
                        server: { ...config.server, smtp_user: e.target.value }
                      })}
                      placeholder="usuario@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_password">Senha SMTP</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      value={config.server.smtp_password}
                      onChange={(e) => setConfig({
                        ...config,
                        server: { ...config.server, smtp_password: e.target.value }
                      })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Configurações IMAP</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imap_host">Host IMAP</Label>
                    <Input
                      id="imap_host"
                      value={config.server.imap_host}
                      onChange={(e) => setConfig({
                        ...config,
                        server: { ...config.server, imap_host: e.target.value }
                      })}
                      placeholder="imap.exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imap_port">Porta IMAP</Label>
                    <Input
                      id="imap_port"
                      type="number"
                      value={config.server.imap_port}
                      onChange={(e) => setConfig({
                        ...config,
                        server: { ...config.server, imap_port: parseInt(e.target.value) || 993 }
                      })}
                      placeholder="993"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={testConnection} variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar Conexão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supabase">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Supabase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="supabase_url">URL do Projeto</Label>
                <Input
                  id="supabase_url"
                  value={config.supabase?.url || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    supabase: { ...config.supabase, url: e.target.value, anon_key: config.supabase?.anon_key || '' }
                  })}
                  placeholder="https://seu-projeto.supabase.co"
                />
              </div>
              <div>
                <Label htmlFor="supabase_anon_key">Chave Anônima</Label>
                <Input
                  id="supabase_anon_key"
                  type="password"
                  value={config.supabase?.anon_key || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    supabase: { ...config.supabase, anon_key: e.target.value, url: config.supabase?.url || '' }
                  })}
                  placeholder="eyJ..."
                />
              </div>
              <div>
                <Label htmlFor="supabase_service_key">Chave de Serviço (Opcional)</Label>
                <Input
                  id="supabase_service_key"
                  type="password"
                  value={config.supabase?.service_role_key || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    supabase: { 
                      ...config.supabase, 
                      service_role_key: e.target.value,
                      url: config.supabase?.url || '',
                      anon_key: config.supabase?.anon_key || ''
                    }
                  })}
                  placeholder="eyJ..."
                />
              </div>
              {isSupabaseConfigured() && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-green-800 text-sm">✅ Supabase configurado e conectado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="app_name">Nome da Aplicação</Label>
                <Input
                  id="app_name"
                  value={config.app_name}
                  onChange={(e) => setConfig({ ...config, app_name: e.target.value })}
                  placeholder="Mail Nexus Gateway"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
