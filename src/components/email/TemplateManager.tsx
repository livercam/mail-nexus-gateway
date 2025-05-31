
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { EmailTemplate } from '@/types/email';
import { emailService } from '@/lib/email-service';
import { useToast } from '@/hooks/use-toast';

interface TemplateManagerProps {
  templates: EmailTemplate[];
  onTemplateUpdate: () => void;
  onTemplateSelect?: (template: EmailTemplate) => void;
}

const TemplateManager = ({ templates, onTemplateUpdate, onTemplateSelect }: TemplateManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    html: '',
  });
  const { toast } = useToast();

  const handleOpenDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        html: template.html || '',
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        subject: '',
        body: '',
        html: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha nome, assunto e corpo do template.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingTemplate) {
        await emailService.updateTemplate(editingTemplate.id, {
          name: formData.name,
          subject: formData.subject,
          body: formData.body,
          html: formData.html || undefined,
          variables: [], // Could extract variables from template
        });
      } else {
        await emailService.saveTemplate({
          name: formData.name,
          subject: formData.subject,
          body: formData.body,
          html: formData.html || undefined,
          variables: [], // Could extract variables from template
        });
      }

      toast({
        title: "Template Salvo",
        description: "O template foi salvo com sucesso.",
      });

      setIsDialogOpen(false);
      onTemplateUpdate();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar o template.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      await emailService.deleteTemplate(templateId);
      toast({
        title: "Template Excluído",
        description: "O template foi excluído com sucesso.",
      });
      onTemplateUpdate();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir o template.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Templates de Email</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Nome do Template</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Boas-vindas"
                />
              </div>
              <div>
                <Label htmlFor="template-subject">Assunto</Label>
                <Input
                  id="template-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Assunto do email"
                />
              </div>
              <div>
                <Label htmlFor="template-body">Corpo do Email</Label>
                <Textarea
                  id="template-body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Conteúdo do email..."
                  className="min-h-32"
                />
              </div>
              <div>
                <Label htmlFor="template-html">HTML (Opcional)</Label>
                <Textarea
                  id="template-html"
                  value={formData.html}
                  onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                  placeholder="<p>Versão HTML...</p>"
                  className="min-h-24 font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveTemplate}>
                  {editingTemplate ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium">{template.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{template.subject}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{template.body}</p>
                </div>
                <div className="flex gap-2">
                  {onTemplateSelect && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTemplateSelect(template)}
                    >
                      Usar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TemplateManager;
