
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, User, Eye, Trash2 } from 'lucide-react';
import { Email } from '@/types/email';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailPreviewProps {
  email: Email;
  onView?: (email: Email) => void;
  onDelete?: (emailId: string) => void;
}

const EmailPreview = ({ email, onView, onDelete }: EmailPreviewProps) => {
  const getStatusColor = (status: Email['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-500';
      case 'delivered':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'bounced':
        return 'bg-orange-500';
      case 'received':
        return 'bg-purple-500';
      case 'draft':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Email['status']) => {
    switch (status) {
      case 'sent':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'failed':
        return 'Falhou';
      case 'bounced':
        return 'Rejeitado';
      case 'received':
        return 'Recebido';
      case 'draft':
        return 'Rascunho';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-medium truncate">
              {email.subject || 'Sem assunto'}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="truncate max-w-48">
                  {email.status === 'received' ? email.from : email.to}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(email.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(email.status)} text-white`}>
              {getStatusText(email.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-700 text-sm line-clamp-2 mb-4">
          {email.body || 'Sem conteúdo'}
        </p>
        
        {email.attachments && email.attachments.length > 0 && (
          <div className="text-xs text-gray-500 mb-3">
            📎 {email.attachments.length} anexo(s)
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {email.sent_at && `Enviado: ${format(new Date(email.sent_at), 'dd/MM HH:mm', { locale: ptBR })}`}
            {email.delivered_at && ` • Entregue: ${format(new Date(email.delivered_at), 'dd/MM HH:mm', { locale: ptBR })}`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(email)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete?.(email.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailPreview;
