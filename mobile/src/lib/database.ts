import { supabase } from './supabase';

export const getDatabaseSchema = async () => {
  try {
    const { data, error } = await supabase.rpc('get_all_tables');
    
    if (error) {
      console.log('RPC function not available, using alternative method');
      const tables = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');
      
      return tables;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching schema:', error);
    return { data: null, error };
  }
};

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Supabase connection test:', error ? 'Failed' : 'Success');
    return !error;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};
