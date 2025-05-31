
import { AppConfig } from '@/types/config';

const CONFIG_KEY = 'mail_nexus_config';
const DEFAULT_PASSWORD_KEY = 'mail_nexus_default_password';

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

export const getDefaultPassword = (): string => {
  let password = localStorage.getItem(DEFAULT_PASSWORD_KEY);
  if (!password) {
    // Gera uma senha padrão segura
    password = generateSecurePassword();
    localStorage.setItem(DEFAULT_PASSWORD_KEY, password);
  }
  return password;
};

export const generateSecurePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const autoFillSMTPConfig = (domain: string, ip: string) => {
  const smtpConfig = {
    host: `mail.${domain}`,
    port: 587,
    secure: false,
    username: `admin@${domain}`,
    password: '',
    from_email: `noreply@${domain}`,
    from_name: 'Mail Nexus Gateway',
  };

  // Se o domínio contém conhecidos provedores, use configurações específicas
  if (domain.includes('gmail.com') || domain.includes('google.com')) {
    smtpConfig.host = 'smtp.gmail.com';
    smtpConfig.port = 587;
    smtpConfig.secure = true;
  } else if (domain.includes('outlook.com') || domain.includes('hotmail.com')) {
    smtpConfig.host = 'smtp-mail.outlook.com';
    smtpConfig.port = 587;
    smtpConfig.secure = true;
  } else if (domain.includes('yahoo.com')) {
    smtpConfig.host = 'smtp.mail.yahoo.com';
    smtpConfig.port = 587;
    smtpConfig.secure = true;
  }

  return smtpConfig;
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
  default_password: getDefaultPassword(),
});

export const isConfigured = (): boolean => {
  const config = loadConfig();
  return !!(config?.supabase.url && config?.supabase.anon_key);
};
