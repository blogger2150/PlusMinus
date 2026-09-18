/* PlusMinus Supabase client. The publishable key is safe for browser use when RLS is enabled. */
const SUPABASE_URL = "https://nyyokudeuyjxwlrucort.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lDb3oBlX7mhHSjoze39CSg_waaRpIjS";
window.pmSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
