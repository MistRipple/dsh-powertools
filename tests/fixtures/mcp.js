export function reply(message) {
  if (message.id === undefined) return
  const result = message.method === 'initialize'
    ? { protocolVersion: message.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'powertools-fixture', version: '1.0.0' } }
    : message.method === 'tools/list' ? { tools: [{ name: 'fixture', description: 'Fixture', inputSchema: { type: 'object' } }] } : {}
  return { jsonrpc: '2.0', id: message.id, result }
}
