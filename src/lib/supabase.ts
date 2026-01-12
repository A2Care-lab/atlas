import { createClient } from '@supabase/supabase-js'

const envUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL
const envAnon = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY

export const supabaseUrl = envUrl || 'https://bujfhgsjckknpcxyzvkz.supabase.co'
export const supabaseAnonKey = envAnon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amZoZ3NqY2trbnBjeHl6dmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk4MzIsImV4cCI6MjA4MzIxNTgzMn0.B63ceOgb6u8V2xfjZuLcBH3LDksx4OIIl70djdh3Lbc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
