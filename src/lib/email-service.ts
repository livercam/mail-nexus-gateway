import { getSupabase, isSupabaseConfigured } from './supabase';
import { Email, EmailStats, EmailTemplate, EmailFilter } from '@/types/email';

// Mock data for when Supabase is not configured
const mockEmails: Email[] = [
  {
    id: '1',
    from: 'admin@mailnexus.com',
    to: 'user@example.com',
    subject: 'Bem-vindo ao Mail Nexus Gateway',
    body: 'Este é um email de teste do sistema.',
    status: 'sent',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    from: 'noreply@example.com',
    to: 'admin@mailnexus.com',
    subject: 'Confirmação de conta',
    body: 'Sua conta foi criada com sucesso.',
    status: 'received',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Boas-vindas',
    subject: 'Bem-vindo ao {{app_name}}',
    body: 'Olá {{name}}, bem-vindo ao nosso sistema!',
    variables: ['app_name', 'name'],
    created_at: new Date().toISOString(),
  },
];

class EmailService {
  async getEmails(filter: EmailFilter['type'] = 'all'): Promise<Email[]> {
    if (!isSupabaseConfigured()) {
      return this.filterEmails(mockEmails, filter);
    }

    try {
      const supabase = getSupabase();
      let query = supabase.from('emails').select('*').order('created_at', { ascending: false });

      if (filter === 'sent') {
        query = query.in('status', ['sent', 'delivered']);
      } else if (filter === 'received') {
        query = query.eq('status', 'received');
      } else if (filter === 'failed') {
        query = query.eq('status', 'failed');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching emails:', error);
        return this.filterEmails(mockEmails, filter);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEmails:', error);
      return this.filterEmails(mockEmails, filter);
    }
  }

  private filterEmails(emails: Email[], filter: EmailFilter['type']): Email[] {
    switch (filter) {
      case 'sent':
        return emails.filter(email => ['sent', 'delivered'].includes(email.status));
      case 'received':
        return emails.filter(email => email.status === 'received');
      case 'failed':
        return emails.filter(email => email.status === 'failed');
      default:
        return emails;
    }
  }

  async getEmailStats(): Promise<EmailStats> {
    if (!isSupabaseConfigured()) {
      return {
        total_sent: 15,
        total_received: 8,
        total_failed: 2,
        total_delivered: 13,
        sent_today: 3,
        received_today: 1,
        failed_today: 0,
        delivery_rate: 86.7,
      };
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc('get_email_stats');

      if (error) {
        console.error('Error fetching email stats:', error);
        throw error;
      }

      return data || {
        total_sent: 0,
        total_received: 0,
        total_failed: 0,
        total_delivered: 0,
        sent_today: 0,
        received_today: 0,
        failed_today: 0,
        delivery_rate: 0,
      };
    } catch (error) {
      console.error('Error in getEmailStats:', error);
      return {
        total_sent: 0,
        total_received: 0,
        total_failed: 0,
        total_delivered: 0,
        sent_today: 0,
        received_today: 0,
        failed_today: 0,
        delivery_rate: 0,
      };
    }
  }

  async sendEmail(email: Omit<Email, 'id' | 'created_at' | 'status'>): Promise<Email> {
    if (!isSupabaseConfigured()) {
      const newEmail: Email = {
        ...email,
        id: Date.now().toString(),
        status: 'sent',
        created_at: new Date().toISOString(),
      };
      return newEmail;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('emails')
        .insert([{
          from_email: email.from,
          to_email: email.to,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          body: email.body,
          html: email.html,
          status: 'draft'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error sending email:', error);
        throw error;
      }

      // Convert database format to frontend format
      const sentEmail: Email = {
        id: data.id,
        from: data.from_email,
        to: data.to_email,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        body: data.body,
        html: data.html,
        status: data.status,
        created_at: data.created_at,
      };

      return sentEmail;
    } catch (error) {
      console.error('Error in sendEmail:', error);
      throw error;
    }
  }

  async deleteEmail(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Email deleted', id);
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('emails')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting email:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteEmail:', error);
      throw error;
    }
  }

  async getTemplates(): Promise<EmailTemplate[]> {
    if (!isSupabaseConfigured()) {
      return mockTemplates;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        return mockTemplates;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTemplates:', error);
      return mockTemplates;
    }
  }

  async saveTemplate(template: Omit<EmailTemplate, 'id' | 'created_at'>): Promise<EmailTemplate> {
    if (!isSupabaseConfigured()) {
      const newTemplate: EmailTemplate = {
        ...template,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      return newTemplate;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('email_templates')
        .insert([template])
        .select()
        .single();

      if (error) {
        console.error('Error saving template:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in saveTemplate:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    if (!isSupabaseConfigured()) {
      return {
        id,
        ...template,
        created_at: new Date().toISOString(),
      } as EmailTemplate;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('email_templates')
        .update(template)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
