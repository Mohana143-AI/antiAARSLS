import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://gspnicasvllrlzumdstq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcG5pY2Fzdmxscmx6dW1kc3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODEwODUsImV4cCI6MjA5MTA1NzA4NX0.tHNlhQJrC_JJzofWQ0f9EE81to_LJufWgc43oZOS8Q0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
