import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface SeedFood {
  id: string
  name: string
  aliases: string[]
  category: string
  week_status: Record<string, string>
  category_override: Record<string, Record<string, string>> | null
  moderation_note: string | null
  never_friendly: boolean
  is_sugar_name: boolean
}

interface SeedFile {
  foods: SeedFood[]
  total_entries: number
}

async function seed() {
  console.log('Reading foods-seed.json...')
  const seedPath = path.join(process.cwd(), 'foods-seed.json')
  const raw = fs.readFileSync(seedPath, 'utf-8')
  const data: SeedFile = JSON.parse(raw)

  const foods = data.foods
  console.log(`Loaded ${foods.length} entries from foods-seed.json`)

  const BATCH_SIZE = 100
  let inserted = 0
  let errors = 0

  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const batch = foods.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(foods.length / BATCH_SIZE)

    console.log(`Upserting batch ${batchNum}/${totalBatches} (${batch.length} items)...`)

    const { error } = await supabase
      .from('food_items')
      .upsert(batch, { onConflict: 'id' })

    if (error) {
      console.error(`Batch ${batchNum} error:`, error.message)
      errors++
    } else {
      inserted += batch.length
    }
  }

  console.log(`\nSeed complete: ${inserted} items upserted, ${errors} batch errors`)
  if (errors > 0) {
    process.exit(1)
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
