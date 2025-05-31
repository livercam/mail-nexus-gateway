
export interface ServerConfig {
  domain: string;
  vps_ip: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  imap_host: string;
  imap_port: number;
}

export interface SupabaseConfig {
  url: string;
  anon_key: string;
  service_role_key?: string;
}

export interface AppConfig {
  app_name: string;
  server: ServerConfig;
  supabase?: SupabaseConfig;
}
