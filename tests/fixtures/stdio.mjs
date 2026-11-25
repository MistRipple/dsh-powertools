import { createInterface } from 'node:readline'
import { reply } from './mcp.js'

for await (const line of createInterface({ input: process.stdin })) {
  const result = reply(JSON.parse(line))
  if (result) process.stdout.write(`${JSON.stringify(result)}\n`)
}
