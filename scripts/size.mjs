/**
 * Gzipped size of dist/assets/*.js and *.css, summed the way CI sums it.
 * Run after `npm run build`. Exits 1 when the total is over the budget.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const LIMIT = 122880 // 120 kB, keep in step with .github/workflows/ci.yml
const dir = join(process.cwd(), 'dist', 'assets')

let total = 0
for (const name of readdirSync(dir).filter((f) => /\.(js|css)$/.test(f))) {
  // Level 6 is the default for the gzip command CI uses.
  const size = gzipSync(readFileSync(join(dir, name)), { level: 6 }).length
  console.log(`  ${name.padEnd(34)} ${String(size).padStart(7)} bytes gzipped`)
  total += size
}
console.log('  ----')
console.log(`  total: ${total} bytes gzipped (limit ${LIMIT}, headroom ${LIMIT - total})`)
if (total > LIMIT) {
  console.error(`Bundle is over the ${LIMIT} byte budget.`)
  process.exit(1)
}
