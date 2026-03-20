import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rabhabdcryijovazkfmm.supabase.co'
const supabaseAnonKey = 'sb_publishable_BH_hgoYbrcdfqf9fOvFrQA_CxG5nLaR'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)