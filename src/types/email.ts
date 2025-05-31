
export interface Email {
  id: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  html?: string;
  status: 'draft' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'received';
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  html?: string;
  variables: string[];
  created_at: string;
}

export interface EmailStats {
  total_sent: number;
  total_received: number;
  total_failed: number;
  total_delivered: number;
  sent_today: number;
  received_today: number;
  failed_today: number;
  delivery_rate: number;
}
