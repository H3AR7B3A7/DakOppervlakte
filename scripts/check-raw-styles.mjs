import { readFileSync } from 'node:fs'

const FILES = ['src/components/DakoppervlakteApp.tsx', 'src/components/Header.tsx']
const NEEDLE = 'style={{'

const violations = FILES.filter((file) => readFileSync(file, 'utf8').includes(NEEDLE))

if (violations.length > 0) {
  console.error('Raw style={{ found in smart components:')
  for (const file of violations) console.error(`  ${file}`)
  process.exit(1)
}

// biome-ignore lint/suspicious/noConsole: build-script success message
console.log('\u2714 no raw style={{ in smart components')
