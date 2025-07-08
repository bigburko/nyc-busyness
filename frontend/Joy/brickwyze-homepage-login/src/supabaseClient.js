
import { createClient } from '@supabase/supabase-js'

// supabaseUrl - Project URL
const supabaseUrl = 'https://kwuwuutcvpdomfivdemt.supabase.co'

// supabaseKey - Anon Public API Key or anon key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dXd1dXRjdnBkb21maXZkZW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NTQzMjAsImV4cCI6MjA2NDQzMDMyMH0.Y6xKCNB4wkaWM2gGKsefH3qoFlUVSfdxiaHd913OTYs'

export const supabase = createClient(supabaseUrl, supabaseKey)
