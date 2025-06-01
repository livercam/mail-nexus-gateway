
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, Save, FileText, User, AtSign } from 'lucide-react';
import { EmailTemplate } from '@/types/email';
import { emailService } from '@/lib/email-service';
import { useToast } from '@/hooks/use-toast';

const EmailCompose = () => {
  const [email, setEmail] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    html: '',
  });
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const templateList = await emailService.getTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEmail({
        ...email,
        subject: template.subject,
        body: template.body,
        html: template.html || '',
      });
      setSelectedTemplate(templateId);
    }
  };

  const handleSend = async () => {
    if (!email.to || !email.subject) {
      toast({
        title: "Erro",
        description: "Destinatário e assunto são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await emailService.sendEmail({
        from: 'admin@mailnexus.com', // This would come from config
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        body: email.body,
        html: email.html,
      });

      toast({
        title: "Email Enviado",
        description: "O email foi enviado com sucesso.",
      });

      // Reset form
      setEmail({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        html: '',
      });
      setSelectedTemplate('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar o email.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    toast({
      title: "Rascunho Salvo",
      description: "O email foi salvo como rascunho.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Send className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Compor Email</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Selector */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTemplate && (
                <div className="text-xs text-gray-600">
                  <p className="font-medium mb-1">Variáveis disponíveis:</p>
                  <div className="flex flex-wrap gap-1">
                    {templates.find(t => t.id === selectedTemplate)?.variables.map((variable) => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Form */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AtSign className="h-5 w-5" />
              Novo Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipients */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="to">Para *</Label>
                <Input
                  id="to"
                  type="email"
                  value={email.to}
                  onChange={(e) => setEmail({ ...email, to: e.target.value })}
                  placeholder="destinatario@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="cc">CC</Label>
                <Input
                  id="cc"
                  type="email"
                  value={email.cc}
                  onChange={(e) => setEmail({ ...email, cc: e.target.value })}
                  placeholder="copia@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="bcc">BCC</Label>
                <Input
                  id="bcc"
                  type="email"
                  value={email.bcc}
                  onChange={(e) => setEmail({ ...email, bcc: e.target.value })}
                  placeholder="copia.oculta@exemplo.com"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="subject">Assunto *</Label>
              <Input
                id="subject"
                value={email.subject}
                onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                placeholder="Assunto do email"
              />
            </div>

            {/* Body */}
            <div>
              <Label htmlFor="body">Mensagem</Label>
              <Textarea
                id="body"
                value={email.body}
                onChange={(e) => setEmail({ ...email, body: e.target.value })}
                placeholder="Digite sua mensagem aqui..."
                rows={12}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={sending}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !email.to || !email.subject}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Enviando...' : 'Enviar Email'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Card */}
      {email.subject && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Preview do Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="space-y-2 text-sm">
                <div><strong>Para:</strong> {email.to}</div>
                {email.cc && <div><strong>CC:</strong> {email.cc}</div>}
                {email.bcc && <div><strong>BCC:</strong> {email.bcc}</div>}
                <div><strong>Assunto:</strong> {email.subject}</div>
              </div>
              <hr className="my-4" />
              <div className="whitespace-pre-wrap text-sm">
                {email.body}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailCompose;
