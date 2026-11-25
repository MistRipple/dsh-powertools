import { lstat, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { RequestError, requireValue } from './errors.js'
import { confinedPath, inside, moveLocal, statOrMissing } from './platform.js'

const allowedArtifactFile = /^(?:session(?:\.v\d+)?\.jsonl(?:\.zstd?)?|session\.lock|[\w.-]+\.jsonl(?:\.zstd?)?)$/i

function buildLineage(items) {
  const byId = new Map(items.map(item => [item.id, item]))
  const subagentChildren = new Map()
  for (const item of items) {
    if (item.isSubagent && item.parentSessionId && byId.has(item.parentSessionId)) {
      const list = subagentChildren.get(item.parentSessionId) ?? []
      list.push(item.id)
      subagentChildren.set(item.parentSessionId, list)
    }
  }
  function collectDescendants(rootId) {
    const result = []
    const visited = new Set([rootId])
    const queue = [rootId]
    while (queue.length > 0) {
      const current = queue.shift()
      for (const childId of subagentChildren.get(current) ?? []) {
        if (visited.has(childId)) continue
        visited.add(childId)
        result.push(childId)
        queue.push(childId)
      }
    }
    return result
  }
  function rootAncestor(item) {
    const visited = new Set([item.id])
    let cursor = item
    while (cursor.isSubagent && cursor.parentSessionId && byId.has(cursor.parentSessionId)) {
      if (visited.has(cursor.parentSessionId)) break
      visited.add(cursor.parentSessionId)
      cursor = byId.get(cursor.parentSessionId)
    }
    return cursor.id
  }
  return { byId, subagentChildren, collectDescendants, rootAncestor }
}

async function validateJsonlSessionDirectory(location, workspacePaths) {
  if (!location || location.kind !== 'jsonl' || typeof location.path !== 'string' || !path.isAbsolute(location.path)) {
    return { ok: false, reason: '当前会话尚未落盘或后端不支持单会话目录回收（如 SQLite 存储）。' }
  }
  const file = path.resolve(location.path)
  const dir = path.dirname(file)
  if (!dir || dir === path.dirname(dir)) {
    return { ok: false, reason: '会话文件位置异常，已拒绝删除。' }
  }
  for (const wsPath of workspacePaths) {
    if (!wsPath) continue
    const resolvedWs = path.resolve(wsPath)
    if (dir === resolvedWs || inside(dir, resolvedWs) || inside(resolvedWs, dir)) {
      return { ok: false, reason: '会话位置与工作区目录重叠，已拒绝删除以保护工作区文件。' }
    }
  }
  const dirInfo = await statOrMissing(dir)
  const fileInfo = await statOrMissing(file)
  if (!dirInfo?.isDirectory() || dirInfo.isSymbolicLink() || !fileInfo?.isFile() || fileInfo.isSymbolicLink()) {
    return { ok: false, reason: '会话目录或文件不存在，或是符号链接，已拒绝删除。' }
  }
  if (!await confinedPath(dir, file)) {
    return { ok: false, reason: '会话文件路径超出所属目录范围，已拒绝删除。' }
  }
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || !allowedArtifactFile.test(entry.name)) {
      return { ok: false, reason: `会话目录包含非预期文件（${entry.name}），已拒绝删除以防止误删数据。` }
    }
  }
  return { ok: true, dir, file }
}

export async function collectAllSessions(ctx, signal) {
  const persistence = ctx.sessionPersistence
  const persisted = await persistence.list({ signal })
  const liveSessions = typeof ctx.sessions?.list === 'function' ? ctx.sessions.list() : []
  const workspaces = typeof ctx.workspaceRegistry?.list === 'function' ? ctx.workspaceRegistry.list() : []
  const archivedSet = new Set(ctx.workspaceRegistry?.archivedSessionIds ?? [])

  const wsBySession = new Map()
  for (const ws of workspaces) {
    for (const id of ws.sessionIds ?? []) {
      const list = wsBySession.get(id) ?? []
      list.push({ workspaceId: ws.workspaceId, title: ws.title, path: ws.path })
      wsBySession.set(id, list)
    }
  }

  const byId = new Map()
  for (const snap of persisted) {
    const header = snap.header
    if (!header?.id) continue
    byId.set(header.id, {
      id: header.id,
      createdAt: header.createdAt ?? 0,
      cwd: header.cwd ?? '',
      parentSessionId: header.parentSession ?? null,
      isSubagent: header.origin === 'subagent',
      isFork: Boolean(header.parentSession && header.origin !== 'subagent'),
      delegationDepth: header.delegationDepth ?? null,
      agentPreset: header.agentPreset ?? null,
      persisted: true,
      resident: false,
      running: false,
      archived: archivedSet.has(header.id),
      sizeBytes: snap.sizeBytes ?? null,
      eventCount: snap.eventCount ?? null,
      location: snap.location ?? null,
      formatStatus: snap.formatStatus ?? null,
      workspaces: wsBySession.get(header.id) ?? [],
    })
  }

  for (const session of liveSessions) {
    const header = session?.header
    if (!header?.id) continue
    const agent = ctx.agents?.get?.(header.id)
    const existing = byId.get(header.id)
    const running = agent?.status === 'running'
    byId.set(header.id, {
      id: header.id,
      createdAt: header.createdAt ?? existing?.createdAt ?? 0,
      cwd: header.cwd ?? existing?.cwd ?? '',
      parentSessionId: header.parentSession ?? existing?.parentSessionId ?? null,
      isSubagent: header.origin === 'subagent' || Boolean(existing?.isSubagent),
      isFork: Boolean((header.parentSession ?? existing?.parentSessionId) && header.origin !== 'subagent'),
      delegationDepth: header.delegationDepth ?? existing?.delegationDepth ?? null,
      agentPreset: header.agentPreset ?? existing?.agentPreset ?? null,
      persisted: Boolean(existing?.persisted),
      resident: true,
      running,
      archived: archivedSet.has(header.id),
      sizeBytes: existing?.sizeBytes ?? null,
      eventCount: existing?.eventCount ?? null,
      location: existing?.location ?? null,
      formatStatus: existing?.formatStatus ?? 'current',
      workspaces: wsBySession.get(header.id) ?? existing?.workspaces ?? [],
    })
  }

  const items = [...byId.values()]
  const { subagentChildren, collectDescendants, rootAncestor } = buildLineage(items)

  return items.map(item => {
    const descendantIds = collectDescendants(item.id)
    const directSubagentIds = subagentChildren.get(item.id) ?? []
    const rootId = rootAncestor(item)
    const orphanSubagent = item.isSubagent && (!item.parentSessionId || !byId.has(item.parentSessionId))
    const cascadeIds = [item.id, ...descendantIds]
    let deletable = true
    let deleteReason = ''

    for (const targetId of cascadeIds) {
      const target = byId.get(targetId)
      if (!target) continue
      if (target.running) {
        deletable = false
        deleteReason = target.id === item.id ? '会话正在运行中，请先停止后再删除。' : '关联子 Agent 正在运行中，请先停止后再删除。'
        break
      }
      if (target.resident) {
        deletable = false
        deleteReason = target.id === item.id
          ? '会话正由当前 DSH 进程打开持有，请关闭或重启 DSH 释放句柄后再删除。'
          : '关联子 Agent 正由当前 DSH 进程持有，请等待结束或重启 DSH 后再删除。'
        break
      }
      if (target.location?.kind !== 'jsonl' || !target.location?.path) {
        deletable = false
        deleteReason = '当前会话或关联子 Agent 未落盘为 JSONL 单会话目录（如 SQLite 后端），暂不支持安全删除。'
        break
      }
    }

    return {
      id: item.id,
      createdAt: item.createdAt,
      cwd: item.cwd,
      parentSessionId: item.parentSessionId,
      rootSessionId: rootId,
      isSubagent: item.isSubagent,
      isFork: item.isFork,
      orphanSubagent,
      delegationDepth: item.delegationDepth,
      agentPreset: item.agentPreset,
      persisted: item.persisted,
      resident: item.resident,
      running: item.running,
      archived: item.archived,
      sizeBytes: item.sizeBytes,
      eventCount: item.eventCount,
      backendKind: item.location?.kind ?? (item.persisted ? 'unknown' : 'pending'),
      workspaces: item.workspaces.map(({ workspaceId, title }) => ({ workspaceId, title })),
      directSubagentIds,
      descendantSubagentIds: descendantIds,
      deletable,
      deleteReason: deleteReason || undefined,
      _location: item.location,
    }
  })
}

export function sessionOperations(ctx) {
  let tail = Promise.resolve()

  async function list(signal) {
    const rows = await collectAllSessions(ctx, signal)
    return {
      sessions: rows.map(({ _location, ...publicRow }) => publicRow),
    }
  }

  async function executeDelete(requestedIds, singleRootId, signal) {
    const all = await collectAllSessions(ctx, signal)
    const byId = new Map(all.map(row => [row.id, row]))
    const roots = []
    for (const sessionId of requestedIds) {
      const root = byId.get(sessionId)
      requireValue(root, requestedIds.length === 1 ? '目标会话不存在或已被移除，请刷新列表。' : `目标会话（${sessionId}）不存在或已被移除，请刷新列表。`, 404)
      roots.push(root)
    }

    const targetIdSet = new Set()
    for (const root of roots) {
      targetIdSet.add(root.id)
      for (const subId of root.descendantSubagentIds) {
        if (byId.has(subId)) targetIdSet.add(subId)
      }
    }
    const targets = [...targetIdSet].map(id => byId.get(id)).filter(Boolean)
    const requestedSet = new Set(requestedIds)
    const workspaces = typeof ctx.workspaceRegistry?.list === 'function' ? ctx.workspaceRegistry.list() : []
    const workspacePaths = workspaces.map(ws => ws.path).filter(Boolean)

    // Phase 1: Validate every target & acquire write ownership atomically (sorted to prevent lock ordering issues).
    const sortedTargets = [...targets].sort((a, b) => a.id.localeCompare(b.id))
    const handles = []
    const validated = []
    try {
      for (const target of sortedTargets) {
        signal.throwIfAborted()
        const isDirect = requestedSet.has(target.id)
        if (target.running || ctx.agents?.get?.(target.id)?.status === 'running') {
          throw new RequestError(isDirect && singleRootId
            ? '会话正在运行中，请先停止后再删除。'
            : `${isDirect ? '会话' : '关联子 Agent'}（${target.id}）正在运行中，请先停止后再删除。`, 409)
        }
        if (target.resident || ctx.sessions?.get?.(target.id) || ctx.agents?.get?.(target.id)) {
          throw new RequestError(isDirect && singleRootId
            ? '会话正由当前 DSH 进程打开持有，请切换或重启 DSH 释放写句柄后再删除。'
            : `${isDirect ? '会话' : '关联子 Agent'}（${target.id}）正由当前 DSH 进程持有，请等待释放或重启 DSH 后再删除。`, 409)
        }
        const check = await validateJsonlSessionDirectory(target._location, workspacePaths)
        if (!check.ok) throw new RequestError(check.reason, 409)
        let handle
        try {
          handle = await ctx.sessionPersistence.open(target.id, 'write', { signal })
        } catch (error) {
          if (error?.name === 'SessionAlreadyOwnedError') {
            throw new RequestError(`会话 ${target.id} 正在被其他进程或句柄写入，已拒绝删除。`, 409)
          }
          if (error?.name === 'SessionPersistenceNotFoundError') {
            throw new RequestError(`会话 ${target.id} 已不存在，请刷新列表。`, 404)
          }
          throw error
        }
        handles.push(handle)
        validated.push({ target, dir: check.dir, file: check.file })
      }
    } finally {
      // Release all write leases before moving directories (required on Windows and clean on macOS).
      for (const handle of handles.reverse()) {
        await handle.close().catch(() => {})
      }
    }

    signal.throwIfAborted()

    // Phase 2: Move all session directories into a single recoverable batch folder (rollback on partial error).
    const profileDir = ctx.profileContext?.dir
    requireValue(typeof profileDir === 'string' && path.isAbsolute(profileDir), '无法定位 Profile 可恢复目录。', 503)
    const recoveryRoot = path.join(profileDir, 'powertools-session-recovery')
    await mkdir(recoveryRoot, { recursive: true, mode: 0o700 })
    const batchDir = await mkdtemp(path.join(recoveryRoot, 'deleted-'))
    const padWidth = Math.max(2, String(validated.length).length)
    const moved = []
    try {
      for (let index = 0; index < validated.length; index++) {
        const entry = validated[index]
        const folderName = `${String(index + 1).padStart(padWidth, '0')}-${path.basename(entry.dir)}`
        const destination = path.join(batchDir, folderName)
        await moveLocal(entry.dir, destination)
        moved.push({
          id: entry.target.id,
          isSubagent: entry.target.isSubagent,
          parentSessionId: entry.target.parentSessionId,
          sourceDir: entry.dir,
          recoveredDir: destination,
        })
      }
      const manifestPayload = {
        deletedAt: Date.now(),
        ...(singleRootId ? { rootSessionId: singleRootId } : {}),
        rootSessionIds: requestedIds,
        items: moved,
      }
      await writeFile(
        path.join(batchDir, 'manifest.json'),
        JSON.stringify(manifestPayload, null, 2) + '\n',
        { mode: 0o600 },
      )
    } catch (error) {
      for (const item of moved.reverse()) {
        await moveLocal(item.recoveredDir, item.sourceDir).catch(() => {})
      }
      await rm(batchDir, { recursive: true, force: true }).catch(() => {})
      throw error
    }

    // Phase 3: Best-effort cleanup of archive/pin registry entries so deleted IDs don't linger.
    for (const item of moved) {
      if (typeof ctx.workspaceRegistry?.unarchiveSession === 'function') {
        await ctx.workspaceRegistry.unarchiveSession(item.id).catch(() => {})
      }
      if (typeof ctx.workspaceRegistry?.unpinSession === 'function') {
        await ctx.workspaceRegistry.unpinSession(item.id).catch(() => {})
      }
    }

    return {
      deletedIds: moved.map(item => item.id),
      requestedCount: requestedIds.length,
      subagentCount: singleRootId
        ? moved.filter(item => item.id !== singleRootId).length
        : moved.filter(item => item.isSubagent).length,
      cascadedCount: moved.filter(item => !requestedSet.has(item.id)).length,
      recovery: batchDir,
    }
  }

  async function remove(body, signal) {
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
    requireValue(sessionId, '请指定要删除的会话 ID。')
    requireValue(body.confirm === sessionId, '请确认要删除的目标会话。', 409)
    return executeDelete([sessionId], sessionId, signal)
  }

  async function batchRemove(body, signal) {
    requireValue(Array.isArray(body.sessionIds) && body.sessionIds.length > 0, '请至少选择一条要删除的会话。')
    requireValue(body.sessionIds.length <= 500, '单次批量删除最多支持 500 条会话，请分批处理。')
    requireValue(body.confirm === true, '请确认批量删除的目标会话。', 409)
    const uniqueIds = [...new Set(body.sessionIds.map(id => typeof id === 'string' ? id.trim() : '').filter(Boolean))]
    requireValue(uniqueIds.length === body.sessionIds.length, '批量删除列表中包含无效或重复的会话 ID。')
    return executeDelete(uniqueIds, null, signal)
  }

  return (body, signal) => {
    if (body.action === 'list') return list(signal)
    if (body.action === 'delete') {
      const pending = tail.then(() => remove(body, signal))
      tail = pending.catch(() => {})
      return pending
    }
    if (body.action === 'batch-delete') {
      const pending = tail.then(() => batchRemove(body, signal))
      tail = pending.catch(() => {})
      return pending
    }
    throw new RequestError('会话操作无效。')
  }
}
