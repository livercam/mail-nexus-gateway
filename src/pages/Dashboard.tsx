import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  Inbox, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Server,
  RefreshCw 
} from 'lucide-react';
import { EmailStats, Email } from '@/types/email';
import { emailService } from '@/lib/email-service';
import { loadConfig, isConfigured } from '@/lib/config';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [stats, setStats] = useState<EmailStats>({
    total_sent: 0,
    total_received: 0,
    total_failed: 0,
    total_delivered: 0,
    sent_today: 0,
    received_today: 0,
    failed_today: 0,
    delivery_rate: 0,
  });
  const [recentEmails, setRecentEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'warning'>('online');
  const navigate = useNavigate();
  const { toast } = useToast();
  const config = loadConfig();

  useEffect(() => {
    loadDashboardData();
    checkSystemStatus();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (isConfigured()) {
        const [emailStats, emails] = await Promise.all([
          emailService.getEmailStats(),
          emailService.getEmails('all')
        ]);
        setStats(emailStats);
        setRecentEmails(emails.slice(0, 5)); // Últimos 5 emails
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSystemStatus = () => {
    const config = loadConfig();
    if (!config) {
      setSystemStatus('offline');
    } else if (!config.supabase?.url || !config.server.smtp_host) {
      setSystemStatus('warning');
    } else {
      setSystemStatus('online');
    }
  };

  const getStatusColor = (status: typeof systemStatus) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: typeof systemStatus) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const statsCards = [
    {
      title: 'Emails Enviados',
      value: stats.total_sent,
      today: stats.sent_today,
      icon: Send,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Emails Recebidos',
      value: stats.total_received,
      today: stats.received_today,
      icon: Inbox,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Emails Entregues',
      value: stats.total_delivered,
      today: 0,
      icon: CheckCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Falhas',
      value: stats.total_failed,
      today: stats.failed_today,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Visão geral do sistema de email</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${getStatusColor(systemStatus)}`}>
            {getStatusIcon(systemStatus)}
            <span className="text-sm font-medium">
              {systemStatus === 'online' ? 'Sistema Online' : 
               systemStatus === 'warning' ? 'Configuração Incompleta' : 
               'Sistema Offline'}
            </span>
          </div>
          <Button onClick={loadDashboardData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Sistema Status */}
      {systemStatus !== 'online' && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800">
                  {systemStatus === 'warning' 
                    ? 'Configure o Supabase e SMTP nas configurações para usar o sistema completo.'
                    : 'Sistema não configurado. Configure nas configurações.'
                  }
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/settings')}
                className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.today > 0 && (
                    <p className="text-xs text-gray-500">+{stat.today} hoje</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxa de Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Taxa de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {stats.delivery_rate.toFixed(1)}%
              </div>
              <p className="text-gray-600">Taxa de sucesso nas entregas</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.delivery_rate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistema Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Domínio:</span>
                <span className="font-medium">{config?.server.domain || 'Não configurado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IP do Servidor:</span>
                <span className="font-medium">{config?.server.vps_ip || 'Não configurado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SMTP Host:</span>
                <span className="font-medium">{config?.server.smtp_host || 'Não configurado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SMTP:</span>
                <Badge variant={config?.server.smtp_host ? 'default' : 'secondary'}>
                  {config?.server.smtp_host ? 'Configurado' : 'Pendente'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Supabase:</span>
                <Badge variant={config?.supabase?.url ? 'default' : 'secondary'}>
                  {config?.supabase?.url ? 'Configurado' : 'Pendente'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emails Recentes */}
      {recentEmails.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Emails Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEmails.map((email) => (
                <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium truncate">{email.subject}</p>
                    <p className="text-sm text-gray-600 truncate">{email.from} → {email.to}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        email.status === 'sent' || email.status === 'delivered' ? 'default' :
                        email.status === 'failed' || email.status === 'bounced' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {email.status === 'sent' ? 'Enviado' :
                       email.status === 'delivered' ? 'Entregue' :
                       email.status === 'failed' ? 'Falhou' :
                       email.status === 'bounced' ? 'Rejeitado' :
                       email.status === 'received' ? 'Recebido' :
                       'Rascunho'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(email.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => navigate('/inbox')}>
                Ver Todos os Emails
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => navigate('/compose')} className="h-16">
              <Send className="h-5 w-5 mr-2" />
              Compor Email
            </Button>
            <Button variant="outline" onClick={() => navigate('/inbox')} className="h-16">
              <Inbox className="h-5 w-5 mr-2" />
              Ver Inbox
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings')} className="h-16">
              <Server className="h-5 w-5 mr-2" />
              Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
