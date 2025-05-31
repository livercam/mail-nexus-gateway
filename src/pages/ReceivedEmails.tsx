
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Inbox } from 'lucide-react';

const ReceivedEmails = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Inbox className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Emails Recebidos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Caixa de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum email recebido ainda.</p>
            <p className="text-sm mt-2">Os emails recebidos aparecerão aqui.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceivedEmails;
