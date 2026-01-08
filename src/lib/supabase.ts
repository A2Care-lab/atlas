import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bujfhgsjckknpcxyzvkz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amZoZ3NqY2trbnBjeHl6dmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk4MzIsImV4cCI6MjA4MzIxNTgzMn0.B63ceOgb6u8V2xfjZuLcBH3LDksx4OIIl70djdh3Lbc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)