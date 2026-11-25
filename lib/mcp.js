import { RequestError, requireValue } from './errors.js'
import { stdioFields } from './platform.js'

const namespace = 'mcp-manager'
const fields = ['command', 'args', 'cwd', 'env', 'url', 'headers']
const empty = { command: '', args: [], cwd: '', env: {}, url: '', headers: {} }
const transports = ['stdio', 'streamable-http']

function servers(section) { return section?.servers ?? {} }

function descriptor(settings) {
  return settings.describe({ redactSecrets: true }).find(row => row.ns === namespace)
}

export function mcpList(manager, settings) {
  const doc = descriptor(settings)
  const effective = servers(doc?.value)
  const writable = Boolean(doc && settings.writable && typeof settings.mutate === 'function')
  return {
    revision: doc?.revision,
    writable,
    servers: manager.list().map(({ name, status, configured }) => {
      const entry = Object.hasOwn(effective, name) ? effective[name] : undefined
      const source = !configured ? 'retired' : !entry ? 'plugin' : Object.hasOwn(servers(doc.base), name) ? 'inherited' : 'user'
      return {
        name, source, transport: entry?.transport ?? null,
        enabled: configured && (entry?.enabled ?? true),
        status: status.state, toolCount: status.state === 'connected' ? status.toolCount : undefined,
        editable: source === 'user' && writable && Object.hasOwn(servers(doc.user), name),
        testable: configured && typeof manager.probe === 'function',
        reconnectable: configured && (entry?.enabled ?? true) && typeof manager.restart === 'function',
      }
    }),
  }
}

function credentialTemplates(input, allowHeaderPrefix) {
  requireValue(input && typeof input === 'object' && !Array.isArray(input), '凭据映射须为 JSON 对象。')
  const keyPattern = allowHeaderPrefix ? /^[!#$%&'*+.^_\x60|~\w-]+$/ : /^[A-Za-z_][A-Za-z0-9_]*$/
  for (const [key, value] of Object.entries(input)) {
    requireValue(keyPattern.test(key) && !['__proto__', 'prototype', 'constructor'].includes(key), '凭据映射键无效。')
    const template = /^(?:Bearer )?\$\{credential:[^\s{}]+\}$/
    requireValue(typeof value === 'string' && template.test(value), '请使用 DSH 凭据引用，例如 ${credential:mcp.example.token}。')
  }
  return input
}

function httpUrl(value) {
  try {
    const url = new URL(value)
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash) return url.href
  } catch { /* Report a field-level validation error without echoing the URL. */ }
  throw new RequestError('请输入 HTTP(S) MCP 地址。认证请使用 DSH 凭据引用。')
}

function configEdits(input, previous) {
  const transport = input.transport ?? previous?.transport
  requireValue(transports.includes(transport), '请选择 MCP 传输方式。')
  const switching = previous && transport !== previous.transport
  requireValue(!switching || !previous.oauth, '请先在 DSH 中清除这个服务器的 OAuth 配置，再切换传输方式。')
  const entry = { ...previous, ...switching && empty, transport }
  const edited = { ...switching && empty, transport }
  const allowed = transport === 'stdio' ? ['command', 'args', 'cwd', 'env'] : ['url', 'headers']
  for (const field of allowed) {
    if (!Object.hasOwn(input, field)) continue
    const value = input[field]
    edited[field] = field === 'env' || field === 'headers' ? credentialTemplates(value, field === 'headers') : value
  }
  if (transport === 'stdio') {
    const next = { ...entry, ...edited }
    const validated = stdioFields(next.command, next.args ?? [], next.cwd ?? '')
    if (Object.hasOwn(edited, 'command')) edited.command = validated.command
  } else if (Object.hasOwn(edited, 'url') || !previous || switching) {
    edited.url = httpUrl(edited.url)
  }
  return edited
}

export async function mcpAction(manager, settings, body, signal) {
  const { action, name, revision } = body
  const view = mcpList(manager, settings)
  const row = view.servers.find(server => server.name === name)
  if (action === 'probe') {
    requireValue(row?.testable, '此服务器无法探测。', 409)
    const result = await manager.probe(name, { signal, maxToolNames: 128 })
    return { ok: result.ok, stage: result.ok ? undefined : result.stage, durationMs: result.durationMs,
      toolCount: result.ok ? result.toolNames.length : undefined,
      toolNames: result.ok ? result.toolNames : undefined,
      truncated: result.ok ? result.truncated : undefined,
      closed: result.closeConfirmed && !result.cleanupError }
  }
  if (action === 'restart') {
    requireValue(row?.reconnectable, '请先启用服务器。', 409)
    await manager.restart(name)
    return {}
  }
  requireValue(view.writable && revision === view.revision, 'MCP 配置已变化或不可写，请刷新后重试。', 409)
  requireValue(['create', 'edit', 'enable', 'disable', 'remove'].includes(action), 'MCP 操作无效。')
  requireValue(typeof name === 'string' && /^[\w-]{1,64}$/.test(name) && !['__proto__', 'prototype', 'constructor'].includes(name), '服务器名称须为 1–64 个字母、数字、下划线或连字符。')
  const key = ['servers', name]
  let ops
  if (action === 'create') {
    requireValue(!row, '服务器名称已存在。', 409)
    ops = [{ op: 'set', path: key, value: { ...configEdits(body, undefined), enabled: false } }]
  } else {
    requireValue(row?.editable, '只有用户配置的服务器可以修改。', 409)
    if (action === 'edit') {
      const previous = servers(descriptor(settings)?.value)[name]
      const updated = configEdits(body, previous)
      ops = fields.concat('transport').flatMap(field => {
        return Object.hasOwn(updated, field) ? [{ op: 'set', path: [...key, field], value: updated[field] }] : []
      })
    } else if (action === 'remove') ops = [{ op: 'unset', path: key }]
    else ops = [{ op: 'set', path: [...key, 'enabled'], value: action === 'enable' }]
  }
  try {
    await settings.mutate(namespace, ops, revision)
  } catch (error) {
    if (error.code === 'SETTINGS_CONFLICT') throw new RequestError('MCP 配置已变化，请刷新后重试。', 409)
    // Lower-layer diagnostics can contain configured endpoint data or arguments.
    throw new RequestError('DSH 拒绝写入 MCP 配置。请检查服务器名称、传输配置及凭据引用。', 409)
  }
  return {}
}
