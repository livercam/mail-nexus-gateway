
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Save, Upload, Template } from 'lucide-react';
import { emailService } from '@/lib/email-service';
import { EmailTemplate } from '@/types/email';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templateList = await emailService.getTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('Failed to load templates:', error);
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
        title: "Campos Obrigatórios",
        description: "Preencha o destinatário e o assunto.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await emailService.sendEmail({
        from: '', // Will be set from config
        to: email.to,
        cc: email.cc || undefined,
        bcc: email.bcc || undefined,
        subject: email.subject,
        body: email.body,
        html: email.html || undefined,
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
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Erro ao Enviar",
        description: "Falha ao enviar o email. Verifique as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!email.subject || !email.body) {
      toast({
        title: "Dados Insuficientes",
        description: "Preencha ao menos o assunto e o corpo do email.",
        variant: "destructive",
      });
      return;
    }

    try {
      await emailService.saveTemplate({
        name: email.subject,
        subject: email.subject,
        body: email.body,
        html: email.html || undefined,
        variables: [],
      });

      toast({
        title: "Template Salvo",
        description: "O template foi salvo com sucesso.",
      });

      loadTemplates();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar o template.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Compor Email</h1>
          <p className="text-gray-600">Redija e envie um novo email</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveAsTemplate} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Salvar como Template
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Template className="h-4 w-4 mr-2" />
                Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant={selectedTemplate === '' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedTemplate('');
                    setEmail({
                      to: '',
                      cc: '',
                      bcc: '',
                      subject: '',
                      body: '',
                      html: '',
                    });
                  }}
                >
                  Em Branco
                </Button>
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate === template.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="to">Para *</Label>
                  <Input
                    id="to"
                    value={email.to}
                    onChange={(e) => setEmail({ ...email, to: e.target.value })}
                    placeholder="destinatario@exemplo.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cc">CC</Label>
                    <Input
                      id="cc"
                      value={email.cc}
                      onChange={(e) => setEmail({ ...email, cc: e.target.value })}
                      placeholder="cc@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bcc">BCC</Label>
                    <Input
                      id="bcc"
                      value={email.bcc}
                      onChange={(e) => setEmail({ ...email, bcc: e.target.value })}
                      placeholder="bcc@exemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    value={email.subject}
                    onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                    placeholder="Assunto do email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="body">Mensagem *</Label>
                  <Textarea
                    id="body"
                    value={email.body}
                    onChange={(e) => setEmail({ ...email, body: e.target.value })}
                    placeholder="Digite sua mensagem aqui..."
                    className="min-h-[200px]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="html">HTML (Opcional)</Label>
                  <Textarea
                    id="html"
                    value={email.html}
                    onChange={(e) => setEmail({ ...email, html: e.target.value })}
                    placeholder="<p>Versão HTML do email...</p>"
                    className="min-h-[100px] font-mono text-sm"
                  />
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Arraste arquivos aqui ou clique para anexar</p>
                  <p className="text-sm text-gray-400">Anexos serão implementados em breve</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailCompose;
