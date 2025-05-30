
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Terminal,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeployStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  log?: string;
}

interface ServerInfo {
  domain: string;
  ip: string;
  adminEmail: string;
  sshKey?: string;
}

const Deploy = () => {
  const [serverInfo, setServerInfo] = useState<ServerInfo>({
    domain: 'correio.desenvolve.one',
    ip: '161.97.100.37',
    adminEmail: '',
  });
  
  const [deploySteps, setDeploySteps] = useState<DeployStep[]>([
    {
      id: 'validation',
      name: 'Validação',
      description: 'Verificar conectividade e DNS',
      status: 'pending'
    },
    {
      id: 'dependencies',
      name: 'Dependências',
      description: 'Instalar Docker, Docker Compose e dependências',
      status: 'pending'
    },
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Instalar e configurar Supabase self-hosted',
      status: 'pending'
    },
    {
      id: 'database',
      name: 'Banco de Dados',
      description: 'Configurar schema e políticas',
      status: 'pending'
    },
    {
      id: 'application',
      name: 'Aplicação',
      description: 'Deploy do Mail Nexus Gateway',
      status: 'pending'
    },
    {
      id: 'ssl',
      name: 'SSL/HTTPS',
      description: 'Configurar certificados e Nginx',
      status: 'pending'
    },
    {
      id: 'verification',
      name: 'Verificação',
      description: 'Testar funcionamento completo',
      status: 'pending'
    }
  ]);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployLog, setDeployLog] = useState('');
  const [installCommand, setInstallCommand] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    generateInstallCommand();
  }, [serverInfo]);

  const generateInstallCommand = () => {
    const baseUrl = 'https://raw.githubusercontent.com/seu-repo/mail-nexus/main/deploy';
    const cmd = `curl -sSL ${baseUrl}/install.sh | bash -s -- \\
  --domain ${serverInfo.domain} \\
  --ip ${serverInfo.ip} \\
  --email ${serverInfo.adminEmail}`;
    
    setInstallCommand(cmd);
  };

  const validateServer = async () => {
    // Simular validação
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 2000);
    });
  };

  const updateStepStatus = (stepId: string, status: DeployStep['status'], log?: string) => {
    setDeploySteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, log: log || step.log }
        : step
    ));
  };

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDeployLog(prev => `${prev}[${timestamp}] ${message}\n`);
  };

  const runDeployStep = async (step: DeployStep, index: number) => {
    updateStepStatus(step.id, 'running');
    addToLog(`Iniciando: ${step.name}`);
    
    try {
      // Simular execução do passo
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
      
      updateStepStatus(step.id, 'completed');
      addToLog(`✅ Concluído: ${step.name}`);
      
      setDeployProgress(((index + 1) / deploySteps.length) * 100);
      
    } catch (error) {
      updateStepStatus(step.id, 'error', `Erro: ${error}`);
      addToLog(`❌ Falha: ${step.name} - ${error}`);
      throw error;
    }
  };

  const startDeploy = async () => {
    if (!serverInfo.domain || !serverInfo.ip || !serverInfo.adminEmail) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    setDeployProgress(0);
    setDeployLog('');
    
    // Reset all steps
    setDeploySteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
    
    addToLog('🚀 Iniciando deploy do Mail Nexus Gateway...');
    addToLog(`📍 Servidor: ${serverInfo.ip}`);
    addToLog(`🌐 Domínio: ${serverInfo.domain}`);
    addToLog(`📧 Admin: ${serverInfo.adminEmail}`);
    addToLog('');

    try {
      for (let i = 0; i < deploySteps.length; i++) {
        await runDeployStep(deploySteps[i], i);
      }
      
      addToLog('');
      addToLog('🎉 Deploy concluído com sucesso!');
      addToLog(`✅ Aplicação disponível em: https://${serverInfo.domain}`);
      addToLog(`🔧 Supabase Studio: http://${serverInfo.ip}:8000`);
      
      toast({
        title: "Deploy Concluído",
        description: "Mail Nexus Gateway foi instalado com sucesso!",
      });
      
    } catch (error) {
      addToLog('');
      addToLog('❌ Deploy falhou. Verifique os logs acima.');
      
      toast({
        title: "Erro no Deploy",
        description: "Falha durante a instalação. Verifique os logs.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Comando copiado para a área de transferência.",
    });
  };

  const getStepIcon = (status: DeployStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Deploy Automatizado</h1>
          <p className="text-gray-600">Deploy completo do Mail Nexus Gateway com Supabase</p>
        </div>
      </div>

      <Tabs defaultValue="configure" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configure">
            <Server className="h-4 w-4 mr-2" />
            Configurar
          </TabsTrigger>
          <TabsTrigger value="deploy">
            <Download className="h-4 w-4 mr-2" />
            Deploy
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Terminal className="h-4 w-4 mr-2" />
            Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configure">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Servidor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="domain">Domínio *</Label>
                  <Input
                    id="domain"
                    value={serverInfo.domain}
                    onChange={(e) => setServerInfo({ ...serverInfo, domain: e.target.value })}
                    placeholder="correio.desenvolve.one"
                  />
                </div>
                <div>
                  <Label htmlFor="ip">IP do Servidor *</Label>
                  <Input
                    id="ip"
                    value={serverInfo.ip}
                    onChange={(e) => setServerInfo({ ...serverInfo, ip: e.target.value })}
                    placeholder="161.97.100.37"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="adminEmail">Email do Administrador *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={serverInfo.adminEmail}
                  onChange={(e) => setServerInfo({ ...serverInfo, adminEmail: e.target.value })}
                  placeholder="admin@desenvolve.one"
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Pré-requisitos:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Servidor Ubuntu/Debian ou CentOS/RHEL</li>
                    <li>• Acesso root via SSH</li>
                    <li>• DNS configurado para o domínio</li>
                    <li>• Portas 80, 443, 3000, 8000 liberadas</li>
                    <li>• Mínimo 4GB RAM e 20GB de armazenamento</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Progresso do Deploy
                  {!isDeploying && (
                    <Button onClick={startDeploy} disabled={isDeploying}>
                      <Download className="h-4 w-4 mr-2" />
                      Iniciar Deploy
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={deployProgress} className="w-full" />
                  
                  <div className="space-y-3">
                    {deploySteps.map((step, index) => (
                      <div key={step.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        {getStepIcon(step.status)}
                        <div className="flex-1">
                          <div className="font-medium">{step.name}</div>
                          <div className="text-sm text-gray-600">{step.description}</div>
                          {step.log && (
                            <div className="text-sm text-red-600 mt-1">{step.log}</div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {index + 1} / {deploySteps.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Terminal className="h-4 w-4 mr-2" />
                  Log de Deploy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={deployLog}
                  readOnly
                  className="font-mono text-sm h-64 bg-black text-green-400"
                  placeholder="Os logs do deploy aparecerão aqui..."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manual">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Instalação Manual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Comando de Instalação</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Textarea
                      value={installCommand}
                      readOnly
                      className="font-mono text-sm flex-1"
                      rows={4}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(installCommand)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertDescription>
                    Execute este comando no seu servidor via SSH como usuário root.
                    O script irá automaticamente instalar e configurar todos os componentes necessários.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Passos Manuais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">1. Conectar ao servidor</h4>
                    <code className="block mt-1 p-2 bg-gray-100 rounded text-sm">
                      ssh root@{serverInfo.ip}
                    </code>
                  </div>

                  <div>
                    <h4 className="font-semibold">2. Baixar e executar o script</h4>
                    <code className="block mt-1 p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">
                      {installCommand}
                    </code>
                  </div>

                  <div>
                    <h4 className="font-semibold">3. Aguardar conclusão</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      A instalação pode levar entre 10-20 minutos dependendo da velocidade da internet.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">4. Verificar funcionamento</h4>
                    <div className="space-y-2 mt-2">
                      <Button variant="outline" size="sm" className="flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Abrir https://{serverInfo.domain}
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Supabase Studio: http://{serverInfo.ip}:8000
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comandos Úteis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label>Verificar status dos serviços</Label>
                    <code className="block mt-1 p-2 bg-gray-100 rounded text-sm">
                      /opt/mail-nexus/health-check.sh
                    </code>
                  </div>

                  <div>
                    <Label>Ver logs do Supabase</Label>
                    <code className="block mt-1 p-2 bg-gray-100 rounded text-sm">
                      cd /opt/mail-nexus/supabase/docker && docker-compose logs -f
                    </code>
                  </div>

                  <div>
                    <Label>Reiniciar serviços</Label>
                    <code className="block mt-1 p-2 bg-gray-100 rounded text-sm">
                      systemctl restart nginx && cd /opt/mail-nexus/supabase/docker && docker-compose restart
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Deploy;
