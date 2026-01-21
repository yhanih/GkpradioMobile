import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fychjnaxljwmgoptjsxn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Y2hqbmF4bGp3bWdvcHRqc3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODA5ODQsImV4cCI6MjA3NDI1Njk4NH0.PU002pqmbeCo_plcjaCP678Xo5dischMR3a_OTOqp_E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
