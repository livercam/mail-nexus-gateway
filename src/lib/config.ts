
import { AppConfig } from '@/types/config';

const CONFIG_KEY = 'mail_nexus_config';

export const saveConfig = (config: AppConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const loadConfig = (): AppConfig | null => {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (!saved) return null;
  
  try {
    return JSON.parse(saved) as AppConfig;
  } catch {
    return null;
  }
};

export const getDefaultConfig = (): AppConfig => ({
  smtp: {
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    from_email: '',
    from_name: 'Mail Nexus Gateway',
  },
  supabase: {
    url: '',
    anon_key: '',
  },
  server: {
    vps_ip: '161.97.100.37',
    domain: 'correio.desenvolve.one',
    ssl_enabled: true,
  },
  app_name: 'Mail Nexus Gateway',
  timezone: 'America/Sao_Paulo',
});

export const isConfigured = (): boolean => {
  const config = loadConfig();
  return !!(config?.supabase.url && config?.supabase.anon_key);
};
