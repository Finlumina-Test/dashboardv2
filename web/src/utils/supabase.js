import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials (safe to expose - protected by RLS)
const supabaseUrl = 'https://uouqgvvdnkzzpypaffjq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdXFndnZkbmt6enB5cGFmZmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTY0OTMsImV4cCI6MjA3ODg3MjQ5M30.B1TYDbZUuy8pNOLJLQxxRppXyJjWwY96Zi2WRjL_a0s';

console.log('🔍 Supabase Config: HARDCODED');
console.log('  - URL:', supabaseUrl);
console.log('  - Key:', supabaseAnonKey.substring(0, 20) + '...');

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return true; // Always configured now
};
