
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Search, RefreshCw, Send, Inbox } from 'lucide-react';
import { Email } from '@/types/email';
import { emailService } from '@/lib/email-service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EmailInbox = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadEmails();
  }, [activeTab]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const emailList = await emailService.getEmails(
        activeTab === 'all' ? 'all' : 
        activeTab === 'sent' ? 'sent' : 'received'
      );
      setEmails(emailList);
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Email['status']) => {
    const variants: Record<Email['status'], 'default' | 'secondary' | 'destructive'> = {
      draft: 'secondary',
      sent: 'default',
      delivered: 'default',
      failed: 'destructive',
      bounced: 'destructive',
    };

    const labels: Record<Email['status'], string> = {
      draft: 'Rascunho',
      sent: 'Enviado',
      delivered: 'Entregue',
      failed: 'Falhou',
      bounced: 'Rejeitado',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Caixa de Email</h1>
          <p className="text-gray-600">Visualize e gerencie seus emails</p>
        </div>
        <Button onClick={loadEmails} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Emails</CardTitle>
                <Badge variant="secondary">{filteredEmails.length}</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">
                    <Mail className="h-4 w-4 mr-1" />
                    Todos
                  </TabsTrigger>
                  <TabsTrigger value="sent">
                    <Send className="h-4 w-4 mr-1" />
                    Enviados
                  </TabsTrigger>
                  <TabsTrigger value="received">
                    <Inbox className="h-4 w-4 mr-1" />
                    Recebidos
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedEmail?.id === email.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm truncate">
                        {activeTab === 'sent' ? email.to : email.from}
                      </span>
                      {getStatusBadge(email.status)}
                    </div>
                    <p className="text-sm font-medium truncate mb-1">{email.subject}</p>
                    <p className="text-xs text-gray-500 truncate">{email.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(email.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                ))}
                {filteredEmails.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum email encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedEmail ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="mb-2">{selectedEmail.subject}</CardTitle>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>De:</strong> {selectedEmail.from}</p>
                      <p><strong>Para:</strong> {selectedEmail.to}</p>
                      {selectedEmail.cc && <p><strong>CC:</strong> {selectedEmail.cc}</p>}
                      {selectedEmail.bcc && <p><strong>BCC:</strong> {selectedEmail.bcc}</p>}
                      <p><strong>Data:</strong> {new Date(selectedEmail.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedEmail.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-t pt-4">
                  {selectedEmail.html ? (
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{selectedEmail.body}</div>
                  )}
                </div>
                
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Anexos</h4>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm">{attachment.filename}</span>
                          <Badge variant="outline">{(attachment.size / 1024).toFixed(1)} KB</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEmail.error_message && (
                  <div className="border-t pt-4 mt-4">
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <h4 className="font-medium text-red-800 mb-1">Erro no Envio</h4>
                      <p className="text-sm text-red-600">{selectedEmail.error_message}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Selecione um email para visualizar</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailInbox;
