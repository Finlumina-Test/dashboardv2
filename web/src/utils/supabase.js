import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// In Vite/React Router, client-side env vars need VITE_ prefix
// Server-side (API routes) can use process.env, but we need client access for uploads
const supabaseUrl = typeof window !== 'undefined'
  ? (import.meta.env.VITE_SUPABASE_URL || '')
  : (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '');

const supabaseAnonKey = typeof window !== 'undefined'
  ? (import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  : (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '');

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We don't need auth session for this app
  },
});

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
