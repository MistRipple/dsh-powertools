import { createServer } from 'node:http'
import { appendFile } from 'node:fs/promises'
import { reply } from './mcp.js'

const port = Number(process.argv[2] ?? 0)
const modelLog = process.argv[3]
const server = createServer(async (request, response) => {
  if (request.method !== 'POST') { response.writeHead(405).end(); return }
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  const body = JSON.parse(Buffer.concat(chunks).toString())
  if (request.url === '/mcp' || request.url === '/mcp-many') {
    const result = request.url === '/mcp-many' && body.method === 'tools/list' && body.id !== undefined
      ? { jsonrpc: '2.0', id: body.id, result: { tools: Array.from({ length: 30 }, (_, index) => ({ name: `bulk_tool_${String(index + 1).padStart(2, '0')}`, description: 'Bulk fixture', inputSchema: { type: 'object' } })) } }
      : reply(body)
    if (!result) { response.writeHead(202).end(); return }
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(result))
    return
  }
  if (request.url !== '/v1/messages') { response.writeHead(404).end(); return }
  const text = body.messages.flatMap(message => message.content).map(part => part.text ?? '').join('\n')
  const enhancement = JSON.stringify(body.system).includes('Rewrite the user')
  if (modelLog) await appendFile(modelLog, `${JSON.stringify({ enhancement, text, system: body.system, messages: body.messages, tools: body.tools })}\n`)
  if (enhancement && text.includes('模拟失败')) { response.writeHead(400).end('{"error":{"message":"fixture failure"}}'); return }
  if (enhancement && text.includes('模拟慢速')) await new Promise(resolve => setTimeout(resolve, 2000))
  const result = enhancement ? `目标：${text.trim()}\n交付物：待确认。` : '隔离测试会话回复。'
  const events = [
    { type: 'message_start', message: { id: 'msg_powertools', model: body.model, usage: { input_tokens: 10, output_tokens: 0 } } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: result } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 10 } },
    { type: 'message_stop' },
  ]
  response.writeHead(200, { 'content-type': 'text/event-stream' })
  response.end(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''))
})
server.listen(port, '127.0.0.1', () => process.stdout.write(`${server.address().port}\n`))
