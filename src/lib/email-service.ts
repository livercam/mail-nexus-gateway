
import { getSupabase } from './supabase';
import { Email, EmailStats, EmailTemplate } from '@/types/email';
import { EmailFiltersState } from '@/components/email/EmailFilters';

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

  async getEmails(type: 'sent' | 'received' | 'all' = 'all', filters?: EmailFiltersState): Promise<Email[]> {
    const supabase = this.getSupabaseClient();
    
    let query = supabase.from('emails').select('*');
    
    // Apply type filter
    if (type === 'sent') {
      query = query.in('status', ['sent', 'delivered', 'failed', 'bounced']);
    } else if (type === 'received') {
      query = query.eq('status', 'received');
    }

    // Apply search filter
    if (filters?.search) {
      query = query.or(`subject.ilike.%${filters.search}%,body.ilike.%${filters.search}%,to.ilike.%${filters.search}%,from.ilike.%${filters.search}%`);
    }

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Apply date range filter
    if (filters?.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query = query.gte('created_at', startDate.toISOString());
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getEmailStats(): Promise<EmailStats> {
    const supabase = this.getSupabaseClient();
    
    const { data, error } = await supabase.rpc('get_email_stats');
    if (error) {
      // Fallback calculation if RPC doesn't exist
      const emails = await this.getEmails('all');
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const totalSent = emails.filter(e => ['sent', 'delivered', 'failed', 'bounced'].includes(e.status)).length;
      const totalReceived = emails.filter(e => e.status === 'received').length;
      const totalFailed = emails.filter(e => e.status === 'failed').length;
      const totalDelivered = emails.filter(e => e.status === 'delivered').length;
      
      const sentToday = emails.filter(e => 
        ['sent', 'delivered', 'failed', 'bounced'].includes(e.status) &&
        new Date(e.created_at) >= startOfDay
      ).length;
      
      const receivedToday = emails.filter(e => 
        e.status === 'received' &&
        new Date(e.created_at) >= startOfDay
      ).length;
      
      const failedToday = emails.filter(e => 
        e.status === 'failed' &&
        new Date(e.created_at) >= startOfDay
      ).length;
      
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      
      return {
        total_sent: totalSent,
        total_received: totalReceived,
        total_failed: totalFailed,
        total_delivered: totalDelivered,
        sent_today: sentToday,
        received_today: receivedToday,
        failed_today: failedToday,
        delivery_rate: Math.round(deliveryRate),
      };
    }
    return data;
  }

  async getTemplates(): Promise<EmailTemplate[]> {
    const supabase = this.getSupabaseClient();
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
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

  async deleteTemplate(templateId: string): Promise<void> {
    const supabase = this.getSupabaseClient();
    
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  }

  async updateTemplate(templateId: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const supabase = this.getSupabaseClient();
    
    const { data, error } = await supabase
      .from('email_templates')
      .update(template)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteEmail(emailId: string): Promise<void> {
    const supabase = this.getSupabaseClient();
    
    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('id', emailId);

    if (error) throw error;
  }
}

export const emailService = new EmailService();
