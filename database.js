import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vynxuwyuewfnzkbpuwye.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bnh1d3l1ZXdmbnprYnB1d3llIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTMxMzE1MywiZXhwIjoyMDk0ODg5MTUzfQ.Sc8ghVj51BUESLScFK3owXSslmac4C7Nx55SDc6WAeY';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables.');
  process.exit(1);
}

// Create the Supabase administrative client using the Service Role Key
// This client bypasses RLS policies to perform secure server-side CRUD operations.
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Mock SQLite function mappings to avoid server load crash in server.js during transition phase
export async function initDB() {
  console.log('⚡ Connected to Supabase Cloud Database');
  return true;
}

export default supabase;
