import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

const envPath = path.join(process.cwd(), '.env')
loadEnv(envPath)

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，请检查 frontend/.env')
  process.exit(1)
}

const supabase = createClient(url, key)

const { count, error } = await supabase.from('words').select('*', { count: 'exact', head: true })
if (error) {
  console.error('读取 words 失败：', error)
  process.exit(1)
}
console.log('words count =', count ?? 0)

