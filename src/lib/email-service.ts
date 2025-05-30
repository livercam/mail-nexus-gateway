
import { getSupabase } from './supabase';
import { Email, EmailStats, EmailTemplate } from '@/types/email';

export class EmailService {
  private getSupabaseClient() {
    return getSupabase();
  }

  async sendEmail(email: Omit<Email, 'id' | 'created_at' | 'status'>): Promise<Email> {
    const supabase = this.getSupabaseClient();
    
    const { data, error } = await supabase
      .from('emails')
      .insert({
        ...email,
        status: 'draft',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Call edge function to actually send the email
    const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-email', {
      body: { email_id: data.id }
    });

    if (sendError) {
      console.error('Failed to send email:', sendError);
      // Update status to failed
      await supabase
        .from('emails')
        .update({ status: 'failed', error_message: sendError.message })
        .eq('id', data.id);
    }

    return data;
  }

  async getEmails(type: 'sent' | 'received' | 'all' = 'all'): Promise<Email[]> {
    const supabase = this.getSupabaseClient();
    
    let query = supabase.from('emails').select('*').order('created_at', { ascending: false });
    
    if (type === 'sent') {
      query = query.in('status', ['sent', 'delivered', 'failed', 'bounced']);
    } else if (type === 'received') {
      query = query.eq('status', 'received');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getEmailStats(): Promise<EmailStats> {
    const supabase = this.getSupabaseClient();
    
    const { data, error } = await supabase.rpc('get_email_stats');
    if (error) throw error;
    return data;
  }

  async getTemplates(): Promise<EmailTemplate[]> {
    const supabase = this.getSupabaseClient();
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async saveTemplate(template: Omit<EmailTemplate, 'id' | 'created_at'>): Promise<EmailTemplate> {
    const supabase = this.getSupabaseClient();
    
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...template,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const emailService = new EmailService();
