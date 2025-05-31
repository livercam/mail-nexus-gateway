
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Inbox, RefreshCw } from 'lucide-react';
import { Email } from '@/types/email';
import { emailService } from '@/lib/email-service';
import EmailPreview from '@/components/email/EmailPreview';
import { EmailFiltersState } from '@/components/email/EmailFilters';
import EmailFilters from '@/components/email/EmailFilters';
import { useToast } from '@/hooks/use-toast';

const ReceivedEmails = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EmailFiltersState>({
    search: '',
    status: 'all',
    dateRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadReceivedEmails();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [emails, filters]);

  const loadReceivedEmails = async () => {
    try {
      setLoading(true);
      const receivedEmails = await emailService.getEmails('received', filters);
      setEmails(receivedEmails);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar emails recebidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...emails];

    if (filters.search) {
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
        email.from.toLowerCase().includes(filters.search.toLowerCase()) ||
        email.body.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredEmails(filtered);
  };

  const handleDeleteEmail = async (emailId: string) => {
    try {
      await emailService.deleteEmail(emailId);
      toast({
        title: "Email Excluído",
        description: "O email foi excluído com sucesso.",
      });
      loadReceivedEmails();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir o email.",
        variant: "destructive",
      });
    }
  };

  const stats = {
    total: emails.length,
    today: emails.filter(e => {
      const today = new Date();
      const emailDate = new Date(e.created_at);
      return emailDate.toDateString() === today.toDateString();
    }).length,
    unread: emails.filter(e => e.status === 'received').length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Inbox className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold">Emails Recebidos</h1>
            <p className="text-gray-600">Visualize e gerencie emails recebidos</p>
          </div>
        </div>
        <Button onClick={loadReceivedEmails} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-600">Total Recebidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            <p className="text-sm text-gray-600">Hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.unread}</div>
            <p className="text-sm text-gray-600">Não Lidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <EmailFilters filters={filters} onFiltersChange={setFilters} />

      {/* Email List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Caixa de Entrada
            </div>
            <Badge variant="secondary">{filteredEmails.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando emails...</p>
            </div>
          ) : filteredEmails.length > 0 ? (
            <div className="grid gap-4">
              {filteredEmails.map((email) => (
                <EmailPreview
                  key={email.id}
                  email={email}
                  onDelete={handleDeleteEmail}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum email recebido encontrado.</p>
              <p className="text-sm mt-2">Os emails recebidos aparecerão aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceivedEmails;
