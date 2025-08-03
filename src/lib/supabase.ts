import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for our lighthouse_results table
export interface LighthouseResult {
  id?: number
  created_at?: string
  first_content_paint: number
  speed_index: number
  largest_content_paint: number
  total_blocking_time: number
  time_to_interactive: number
  url?: string // Adding URL field to track which site was tested
  device_strategy?: string // Track whether test was run on desktop or mobile
}
