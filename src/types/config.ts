
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
}

export interface SupabaseConfig {
  url: string;
  anon_key: string;
  service_role_key?: string;
}

export interface ServerConfig {
  vps_ip: string;
  domain: string;
  ssl_enabled: boolean;
}

export interface AppConfig {
  smtp: SMTPConfig;
  supabase: SupabaseConfig;
  server: ServerConfig;
  app_name: string;
  timezone: string;
  default_password?: string;
}

export interface DeployConfig {
  docker_compose: string;
  nginx_config: string;
  ssl_setup_script: string;
  environment_vars: Record<string, string>;
}
