
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '@/types/config';

let supabaseClient: SupabaseClient | null = null;

export const initializeSupabase = (config: SupabaseConfig) => {
  supabaseClient = createClient(config.url, config.anon_key);
  return supabaseClient;
};

export const getSupabase = () => {
  if (!supabaseClient) {
    // Try to get from localStorage if available
    const savedConfig = localStorage.getItem('supabase_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig) as SupabaseConfig;
      return initializeSupabase(config);
    }
    throw new Error('Supabase not initialized. Please configure Supabase settings first.');
  }
  return supabaseClient;
};

export const isSupabaseConfigured = () => {
  return supabaseClient !== null || localStorage.getItem('supabase_config') !== null;
};
