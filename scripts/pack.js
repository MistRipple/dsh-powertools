import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

mkdirSync('dist', { recursive: true })
execFileSync(process.execPath, [process.env.npm_execpath, 'pack', '--pack-destination', 'dist'], { stdio: 'inherit' })
