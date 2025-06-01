
import { AppConfig } from '@/types/config';

const DEFAULT_CONFIG: AppConfig = {
  app_name: 'Mail Nexus Gateway',
  server: {
    domain: '',
    vps_ip: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    imap_host: '',
    imap_port: 993,
  },
};

export const loadConfig = (): AppConfig => {
  const savedConfig = localStorage.getItem('app_config');
  if (savedConfig) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
    } catch (error) {
      console.error('Failed to parse saved config:', error);
    }
  }
  return DEFAULT_CONFIG;
};

export const saveConfig = (config: AppConfig): void => {
  localStorage.setItem('app_config', JSON.stringify(config));
};

export const isConfigured = (): boolean => {
  const config = loadConfig();
  return !!(
    config.server.domain &&
    config.server.smtp_host &&
    config.server.smtp_user &&
    config.supabase?.url &&
    config.supabase?.anon_key
  );
};
