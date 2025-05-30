
export interface Email {
  id: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: EmailAttachment[];
  status: 'draft' | 'sent' | 'delivered' | 'failed' | 'bounced';
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  html?: string;
  variables?: string[];
  created_at: string;
}

export interface EmailStats {
  total_sent: number;
  total_received: number;
  delivery_rate: number;
  bounce_rate: number;
  last_24h: number;
}
