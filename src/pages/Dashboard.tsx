
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Send, Inbox, Settings, TrendingUp, AlertCircle } from 'lucide-react';
import { EmailStats } from '@/types/email';
import { emailService } from '@/lib/email-service';
import { isConfigured } from '@/lib/config';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setConfigured(isConfigured());
    
    if (isConfigured()) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, []);

  const loadStats = async () => {
    try {
      const emailStats = await emailService.getEmailStats();
      setStats(emailStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sistema Não Configurado</h1>
          <p className="text-gray-600 mb-6">
            Configure o sistema antes de começar a usar o Mail Nexus Gateway.
          </p>
          <Button onClick={() => navigate('/settings')} size="lg">
            <Settings className="h-4 w-4 mr-2" />
            Ir para Configurações
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mail Nexus Gateway</h1>
          <p className="text-gray-600">Dashboard do sistema de email</p>
        </div>
        <Button onClick={() => navigate('/compose')} size="lg">
          <Mail className="h-4 w-4 mr-2" />
          Novo Email
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_sent || 0}</div>
            <p className="text-xs text-muted-foreground">Total enviados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Recebidos</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_received || 0}</div>
            <p className="text-xs text-muted-foreground">Total recebidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.delivery_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">Entrega bem-sucedida</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimas 24h</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.last_24h || 0}</div>
            <p className="text-xs text-muted-foreground">Emails processados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate('/compose')} 
              className="w-full justify-start"
              variant="outline"
            >
              <Mail className="h-4 w-4 mr-2" />
              Compor Email
            </Button>
            <Button 
              onClick={() => navigate('/inbox')} 
              className="w-full justify-start"
              variant="outline"
            >
              <Inbox className="h-4 w-4 mr-2" />
              Ver Caixa de Entrada
            </Button>
            <Button 
              onClick={() => navigate('/settings')} 
              className="w-full justify-start"
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Servidor SMTP</span>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span>Supabase</span>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span>SSL Certificate</span>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
