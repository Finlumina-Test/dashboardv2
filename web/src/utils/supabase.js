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

// Debug logging
console.log('🔍 Supabase Config Check:');
console.log('  - Running on:', typeof window !== 'undefined' ? 'CLIENT' : 'SERVER');
console.log('  - URL configured:', !!supabaseUrl, supabaseUrl ? `(${supabaseUrl.substring(0, 30)}...)` : '(MISSING)');
console.log('  - Key configured:', !!supabaseAnonKey, supabaseAnonKey ? `(${supabaseAnonKey.substring(0, 20)}...)` : '(MISSING)');

if (typeof window !== 'undefined') {
  console.log('  - Available env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
}

// Create a single supabase client for the entire app
// Use dummy values if not configured to prevent errors during build
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTY0MDAsImV4cCI6MTk2MDc3MjQwMH0.placeholder';

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey,
  {
    auth: {
      persistSession: false, // We don't need auth session for this app
    },
  }
);

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  if (!isConfigured) {
    console.warn('⚠️ Supabase not configured! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }
  return isConfigured;
};
