import { RequestError } from './lib/errors.js'
import { mcpAction, mcpList } from './lib/mcp.js'
import { skillOperations } from './lib/skills.js'
import { enhanceDraft, extractEnhanceContext } from './lib/enhance.js'
import { sessionOperations } from './lib/sessions.js'
import manifest from './package.json' with { type: 'json' }

export const name = 'dsh-powertools'
export const inject = ['connection']

async function jsonBody(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') ?? '')) {
    throw new RequestError('请求须使用 JSON。', 415)
  }
  const raw = await request.text()
  if (Buffer.byteLength(raw) > 3 * 1024 * 1024) throw new RequestError('请求过大。', 413)
  let value
  try { value = JSON.parse(raw) } catch { throw new RequestError('无效的 JSON。') }
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new RequestError('请求须为 JSON 对象。')
  return value
}

export function apply(ctx) {
  const handlers = new Map()
  const requiredServices = new Map()
  // Groups activate independently, so an unavailable Host service only disables
  // its own feature. The Connection carrier restricts exact /api routes to owners.
  function feature(group, services, setup) {
    requiredServices.set(group, services)
    ctx.inject(services, child => child.effect(() => {
      const handler = setup(child)
      handlers.set(group, handler)
      return () => handlers.delete(group)
    }, `dsh-powertools ${group}`))
  }
  feature('sessions', ['sessionPersistence', 'sessions', 'agents', 'workspaceRegistry', 'profileContext'], sessionOperations)
  feature('mcp', ['mcpManager', 'settings'], child => (body, signal) => body.action === 'list'
    ? mcpList(child.mcpManager, child.settings)
    : mcpAction(child.mcpManager, child.settings, body, signal))
  feature('skills', ['skills', 'workspaceRegistry', 'agentPresets', 'agents', 'profileContext'], skillOperations)
  feature('enhance', ['llm', 'agentDefaultModel', 'agents'], child => (body, signal) => {
    const agent = typeof body.sessionId === 'string' ? child.agents.get(body.sessionId) : undefined
    const selection = agent?.model.current() ?? child.agentDefaultModel.currentSelection()
    const context = extractEnhanceContext(agent, child.get('workspaceRegistry'), body.sessionId)
    return enhanceDraft(child.llm, selection, body.draft, signal, undefined, context)
  })

  const lifecycle = new AbortController()
  ctx.effect(() => () => lifecycle.abort(), 'dsh-powertools lifetime')
  ctx.connection.fetch.register({
    path: '/api/dsh-powertools', methods: ['POST'], requestBody: 'buffered',
    fetch: async request => {
      const reply = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store' } })
      try {
        const body = await jsonBody(request)
        if (body.feature === 'capabilities') return reply({
          version: manifest.version, profilePath: ctx.get('profileContext')?.patchPath,
          sessionDelete: handlers.has('sessions'),
          mcp: handlers.has('mcp'), skills: handlers.has('skills'), enhance: handlers.has('enhance'),
        })
        const featureName = body.feature === 'session-delete' ? 'sessions' : body.feature
        const payload = body.feature === 'session-delete' ? { ...body, action: 'delete' } : body
        const handler = handlers.get(featureName)
        if (!handler) {
          const needed = requiredServices.get(featureName)
          const missing = needed?.filter(service => !ctx.get(service)) ?? []
          const detail = missing.length
            ? `缺少宿主服务：${missing.join('、')}。`
            : '若刚刚更新了插件源码，请完全退出并重启 DSH 进程。'
          return reply({ error: `当前 DSH 配置未加载此功能所需的服务（${detail}）` }, 503)
        }
        return reply(await handler(payload, AbortSignal.any([request.signal, lifecycle.signal])))
      } catch (error) {
        if (error instanceof RequestError) return reply({ error: error.message }, error.status)
        return reply({ error: '操作未完成。请检查 DSH 服务、文件权限或连接配置后重试。' }, 502)
      }
    },
  })
}
