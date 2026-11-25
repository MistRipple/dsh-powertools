import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import semver from 'semver'
import { constants } from 'node:fs'
import { enhanceDraft, extractEnhanceContext } from '../lib/enhance.js'
import { mcpAction, mcpList } from '../lib/mcp.js'
import { readOpenFlags, stdioFields } from '../lib/platform.js'
import { sessionOperations } from '../lib/sessions.js'
import { parseSkill } from '../lib/skills.js'

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url)))

test('DSH and default SemVer semantics admit the two reviewed releases', () => {
  for (const includePrerelease of [true, false]) {
    for (const version of ['0.2.3-alpha.2', '0.2.2-rc.5']) {
      assert.ok(semver.satisfies(version, manifest.engines.dsh, { includePrerelease }))
    }
    for (const version of ['0.2.3-alpha.1', '0.2.2-rc.4', '0.2.4', '0.3.0-alpha.1']) {
      assert.ok(!semver.satisfies(version, manifest.engines.dsh, { includePrerelease }))
    }
  }
})

test('Win32 and POSIX stdio keep whitespace inside independent arguments', () => {
  const args = ['C:\\Program Files\\mcp server.js', 'a b', 'literal;char']
  assert.deepEqual(stdioFields(' C:\\Program Files\\node.exe ', args, 'C:\\Isolated workspace', 'win32'), {
    command: 'C:\\Program Files\\node.exe', args, cwd: 'C:\\Isolated workspace',
  })
  assert.equal(stdioFields('/opt/example dir/node', ['arg a'], '/tmp/example dir', 'darwin').command, '/opt/example dir/node')
  assert.throws(() => stdioFields('npm.cmd', args, 'C:\\temp', 'win32'), /\.exe/)
  assert.throws(() => stdioFields('node.exe', args, 'some\\folder', 'win32'), /绝对路径/)
})

test('enhancement keeps the original as the sole user message and ignores reasoning', async () => {
  let options
  const llm = { async *stream(input) {
    options = input
    yield { type: 'reasoning-delta', index: 0, text: 'private reasoning' }
    yield { type: 'text-delta', index: 1, text: '目标' }
    yield { type: 'block-end', index: 1, block: { type: 'text', text: '目标：修改草稿' } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  } }
  const result = await enhanceDraft(llm, { provider: 'configured', model: 'selected' }, '修改草稿', new AbortController().signal)
  assert.deepEqual(options.messages, [{ role: 'user', content: [{ type: 'text', text: '修改草稿' }] }])
  assert.equal(options.sessionId, undefined)
  assert.equal(options.tools, undefined)
  assert.deepEqual(result, { text: '目标：修改草稿', model: 'selected', provider: 'configured', contextTurns: 0 })
})

test('enhancement cancels and times out even if the provider stalls', async () => {
  const llm = { async *stream() { await setTimeout(50) } }
  const selection = { provider: 'fixture', model: 'fixture' }
  const controller = new AbortController()
  const cancelled = enhanceDraft(llm, selection, 'Draft', controller.signal)
  controller.abort()
  await assert.rejects(cancelled, { status: 409 })
  await assert.rejects(enhanceDraft(llm, selection, 'Draft', new AbortController().signal, 5), { status: 504 })
})

test('MCP list never returns configured secrets and inherited entries refuse mutation', async () => {
  const secret = 'secret-fixture'
  const entry = { transport: 'stdio', command: '/private/setup', args: [secret], env: { TOKEN: secret }, enabled: true }
  const settings = {
    writable: true,
    describe: () => [{ ns: 'mcp-manager', revision: 11,
      value: { servers: { user: entry, inherited: entry } }, base: { servers: { inherited: entry } }, user: { servers: { user: entry } } }],
    mutate: () => assert.fail('must not mutate'),
  }
  const manager = { list: () => ['user', 'inherited', 'plugin'].map(name => ({ name, configured: true, status: { state: 'connected' } })) }
  const list = mcpList(manager, settings)
  assert.doesNotMatch(JSON.stringify(list), /secret-fixture|\/private\/setup|TOKEN/)
  assert.deepEqual(list.servers.map(row => [row.source, row.editable]), [['user', true], ['inherited', false], ['plugin', false]])
  await assert.rejects(mcpAction(manager, settings, { action: 'remove', name: 'inherited', revision: 11 }), { status: 409 })
  await assert.rejects(mcpAction(manager, settings, { action: 'disable', name: 'user', revision: 10 }), { status: 409 })
})

test('Skill parser accepts DSH invocation fields and keeps custom YAML data and CRLF', () => {
  const raw = ['---', 'name: sample-skill', 'description: A description', 'custom: {keep: yes}', 'user-invocable: false', '---', '', 'Instruction'].join('\r\n')
  const { data, eol, body } = parseSkill(raw)
  assert.deepEqual(data.custom, { keep: 'yes' })
  assert.equal(data['user-invocable'], false)
  assert.equal(eol, '\r\n')
  assert.equal(body, '\r\nInstruction')
  assert.throws(() => parseSkill(raw.replace('user-invocable', 'userInvocable')), /disable-model-invocation/)
})

test('platform readOpenFlags omits POSIX-only flags on win32 and includes them on darwin', () => {
  assert.equal(readOpenFlags('win32'), constants.O_RDONLY)
  assert.equal(readOpenFlags('darwin'), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0))
})

test('MCP transport switch clears opposite-transport fields for flat settings schema', async () => {
  let mutated
  const entry = { transport: 'stdio', command: 'node', args: ['/a.js'], cwd: '/tmp', env: { K: '${credential:K}' }, url: '', headers: {}, enabled: false }
  const settings = {
    writable: true,
    describe: () => [{ ns: 'mcp-manager', revision: 4, value: { servers: { demo: entry } }, base: { servers: {} }, user: { servers: { demo: entry } } }],
    mutate: async (ns, ops, rev) => { mutated = { ns, ops, rev } },
  }
  const manager = { list: () => [{ name: 'demo', configured: true, status: { state: 'disabled' } }] }
  await mcpAction(manager, settings, { action: 'edit', name: 'demo', revision: 4, transport: 'streamable-http', url: 'https://example.com/mcp' })
  assert.equal(mutated.ns, 'mcp-manager')
  assert.equal(mutated.rev, 4)
  const byField = Object.fromEntries(mutated.ops.map(op => [op.path.at(-1), op.value]))
  assert.deepEqual(byField, {
    transport: 'streamable-http',
    command: '',
    args: [],
    cwd: '',
    env: {},
    url: 'https://example.com/mcp',
    headers: {},
  })
})

test('Skill repository refresh swaps cached snapshots and removal leaves installed copies', async () => {
  const { mkdtemp, mkdir, readFile, writeFile, cp, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { githubRepository, skillRepositories } = await import('../lib/skill-repositories.js')
  const profile = await mkdtemp(join(tmpdir(), 'dpt-repositories-'))
  const signal = new AbortController().signal
  const url = 'https://github.com/example/tools'
  let head = 'a'.repeat(40)
  const clone = async (source, target) => {
    assert.equal(source, `${url}.git`)
    const folder = join(target, 'skills', 'example-skill')
    await mkdir(folder, { recursive: true })
    await writeFile(join(folder, 'SKILL.md'), '---\nname: example-skill\ndescription: Fixture skill\n---\nInstructions\n')
    await writeFile(join(folder, 'resource.txt'), 'reference')
    return head
  }
  const operation = skillRepositories(profile, async file => ({ text: await readFile(file, 'utf8') }), parseSkill, clone)
  try {
    assert.throws(() => githubRepository('https://github.com.example.com/example/tools'), { status: 400 })
    const { repository } = await operation({ action: 'repository-add', url }, signal)
    await assert.rejects(operation({ action: 'repository-add', url: `${url}.git` }, signal), { status: 409 })
    const selection = { repositoryId: repository.id, commit: repository.commit, skillId: repository.skills[0].id }
    assert.equal(repository.skills[0].relative, undefined)
    assert.match((await operation({ action: 'repository-preview', ...selection }, signal)).markdown, /Instructions/)
    const { directory } = await operation({ action: 'repository-install', ...selection }, signal)
    const installed = join(profile, 'installed-copy')
    await cp(directory, installed, { recursive: true })
    head = 'b'.repeat(40)
    await operation({ action: 'repository-refresh', ...selection }, signal)
    await assert.rejects(operation({ action: 'repository-install', ...selection }, signal), { status: 409 })
    await operation({ action: 'repository-remove', repositoryId: repository.id, confirm: repository.id }, signal)
    assert.deepEqual(await operation({ action: 'repository-list' }, signal), { repositories: [] })
    assert.equal(await readFile(join(installed, 'resource.txt'), 'utf8'), 'reference')
  } finally {
    await rm(profile, { recursive: true, force: true })
  }
})

test('enhancement extracts bounded session context and selects lowest reasoning effort via prepareCall', async () => {
  const agent = {
    session: {
      header: { cwd: '/work/old-dir' },
      snapshotEvents: () => [
        { type: 'working-directory/change', data: { cwd: '/work/magi-code' } },
        { type: 'user/message', data: { source: { kind: 'model-selection' }, content: [{ type: 'text', text: 'internal model change' }] } },
        { type: 'user/message', data: { source: { kind: 'action-cards' }, content: [{ type: 'text', text: 'internal card' }] } },
        { type: 'user/message', data: { source: { kind: 'user' }, content: [{ type: 'text', text: '看一下 MCP 探测失败的原因' }] } },
        { type: 'assistant/message', data: { message: { source: { kind: 'model' }, content: [{ type: 'reasoning', text: 'secret chain' }, { type: 'tool-use', name: 'read' }, { type: 'text', text: '主要原因是 stdio 路径未做引号转义。' }] } } },
      ],
    },
  }
  const workspaces = { list: () => [{ title: 'magi-code', path: '/work/magi-code', sessionIds: ['s1'] }] }
  const context = extractEnhanceContext(agent, workspaces, 's1')
  assert.equal(context.workspace, 'magi-code')
  assert.equal(context.cwd, '/work/magi-code')
  assert.deepEqual(context.turns, [
    { role: 'User', text: '看一下 MCP 探测失败的原因' },
    { role: 'Assistant', text: '主要原因是 stdio 路径未做引号转义。' },
  ])

  let dispatched
  const llm = {
    async prepareCall(config, _signal, configure) {
      const next = configure({ maxTokens: config.maxTokens }, {
        name: 'DeepSeek-V4.1-Flash',
        reasoning: { efforts: [{ id: 'off', name: 'Off' }, { id: 'high', name: 'High' }] },
      })
      return {
        config: { ...config, ...next },
        async *stream(options) {
          dispatched = options
          yield { type: 'block-end', index: 0, block: { type: 'text', text: '目标：修复 stdio 路径引号转义导致的 MCP 探测失败。' } }
          yield { type: 'finish', reason: { kind: 'stop' } }
        },
      }
    },
  }
  const result = await enhanceDraft(
    llm,
    { provider: 'deepseek-official', model: 'deepseek-v4.1-flash', reasoningEffort: 'high' },
    '顺手修一下上面那个问题',
    new AbortController().signal,
    45_000,
    context,
  )
  assert.equal(dispatched.reasoningEffort, 'off')
  assert.deepEqual(dispatched.messages, [{ role: 'user', content: [{ type: 'text', text: '顺手修一下上面那个问题' }] }])
  assert.match(dispatched.system, /<session_context>/)
  assert.match(dispatched.system, /Workspace: magi-code/)
  assert.match(dispatched.system, /stdio 路径未做引号转义/)
  assert.doesNotMatch(dispatched.system, /secret chain|internal card|internal model change/)
  assert.deepEqual(result, {
    text: '目标：修复 stdio 路径引号转义导致的 MCP 探测失败。',
    model: 'DeepSeek-V4.1-Flash',
    provider: 'deepseek-official',
    contextTurns: 2,
  })
})

test('sessionOperations lists all sessions including multi-level subagents and cascade-deletes recoverably while preserving forks and workspaces', async () => {
  const { mkdtemp, mkdir, writeFile, rm, access } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const root = await mkdtemp(join(tmpdir(), 'dpt-sessions-'))
  const profileDir = join(root, 'profile')
  const workspaceDir = join(root, 'workspace')
  const sessionsRoot = join(root, 'sessions', 'proj')
  await mkdir(profileDir, { recursive: true })
  await mkdir(workspaceDir, { recursive: true })
  await writeFile(join(workspaceDir, 'keep.txt'), 'workspace file\n')

  async function seed(id) {
    const dir = join(sessionsRoot, id)
    await mkdir(dir, { recursive: true })
    const file = join(dir, 'session.v4.jsonl.zstd')
    await writeFile(file, `fixture:${id}\n`)
    await writeFile(join(dir, 'session.lock'), '')
    return { dir, file }
  }

  const parent = await seed('session-parent')
  const sub1 = await seed('subagent-l1')
  const sub2 = await seed('subagent-l2')
  const fork = await seed('session-fork')
  const locked = await seed('session-locked')

  let snapshots = [
    { header: { id: 'session-parent', createdAt: 1000, cwd: workspaceDir, isSeeded: false }, sizeBytes: 120, location: { kind: 'jsonl', path: parent.file } },
    { header: { id: 'subagent-l1', createdAt: 1100, cwd: workspaceDir, parentSession: 'session-parent', origin: 'subagent', delegationDepth: 1, agentPreset: 'research', isSeeded: false }, sizeBytes: 80, location: { kind: 'jsonl', path: sub1.file } },
    { header: { id: 'subagent-l2', createdAt: 1200, cwd: workspaceDir, parentSession: 'subagent-l1', origin: 'subagent', delegationDepth: 2, isSeeded: false }, sizeBytes: 60, location: { kind: 'jsonl', path: sub2.file } },
    { header: { id: 'session-fork', createdAt: 1300, cwd: workspaceDir, parentSession: 'session-parent', isSeeded: true }, sizeBytes: 90, location: { kind: 'jsonl', path: fork.file } },
    { header: { id: 'session-locked', createdAt: 1400, cwd: workspaceDir, isSeeded: false }, sizeBytes: 50, location: { kind: 'jsonl', path: locked.file } },
  ]
  const unarchived = []
  const openedWrites = []
  const ctx = {
    profileContext: { dir: profileDir },
    sessions: { list: () => [], get: () => undefined },
    agents: { get: () => undefined },
    workspaceRegistry: {
      archivedSessionIds: ['session-parent'],
      list: () => [{ workspaceId: 'ws1', title: 'proj', path: workspaceDir, sessionIds: ['session-parent', 'session-fork'] }],
      unarchiveSession: async id => { unarchived.push(id) },
      unpinSession: async () => {},
    },
    sessionPersistence: {
      list: async () => snapshots,
      open: async (id, accessMode) => {
        assert.equal(accessMode, 'write')
        if (id === 'session-locked') {
          const err = new Error('owned')
          err.name = 'SessionAlreadyOwnedError'
          throw err
        }
        openedWrites.push(id)
        return { close: async () => {} }
      },
    },
  }
  const op = sessionOperations(ctx)
  try {
    const signal = new AbortController().signal
    const listed = await op({ action: 'list' }, signal)
    assert.equal(listed.sessions.length, 5)
    const parentRow = listed.sessions.find(s => s.id === 'session-parent')
    assert.deepEqual(parentRow.descendantSubagentIds.sort(), ['subagent-l1', 'subagent-l2'])
    assert.equal(parentRow.deletable, true)

    // Locked session refuses deletion with 409 and leaves disk untouched
    await assert.rejects(op({ action: 'delete', sessionId: 'session-locked', confirm: 'session-locked' }, signal), { status: 409 })
    await access(locked.file)

    // Deleting parent cascades to L1 & L2 subagents, preserves fork & workspace files
    const deleted = await op({ action: 'delete', sessionId: 'session-parent', confirm: 'session-parent' }, signal)
    assert.deepEqual(deleted.deletedIds.sort(), ['session-parent', 'subagent-l1', 'subagent-l2'])
    assert.equal(deleted.subagentCount, 2)
    assert.deepEqual(openedWrites.sort(), ['session-parent', 'subagent-l1', 'subagent-l2'])
    assert.ok(unarchived.includes('session-parent'))

    for (const removedDir of [parent.dir, sub1.dir, sub2.dir]) {
      await assert.rejects(access(removedDir))
    }
    await access(fork.file)
    await access(join(workspaceDir, 'keep.txt'))
    const manifestData = JSON.parse(await readFile(join(deleted.recovery, 'manifest.json'), 'utf8'))
    assert.equal(manifestData.rootSessionId, 'session-parent')
    assert.equal(manifestData.items.length, 3)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('sessionOperations batch-delete deduplicates overlapping subagents and rejects atomically if any target is locked', async () => {
  const { mkdtemp, mkdir, writeFile, rm, access } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const root = await mkdtemp(join(tmpdir(), 'dpt-batch-sessions-'))
  const profileDir = join(root, 'profile')
  const workspaceDir = join(root, 'workspace')
  const sessionsRoot = join(root, 'sessions', 'proj')
  await mkdir(profileDir, { recursive: true })
  await mkdir(workspaceDir, { recursive: true })

  async function seed(id) {
    const dir = join(sessionsRoot, id)
    await mkdir(dir, { recursive: true })
    const file = join(dir, 'session.v4.jsonl.zstd')
    await writeFile(file, `fixture:${id}\n`)
    return { dir, file }
  }

  const a = await seed('batch-a')
  const aSub = await seed('batch-a-sub')
  const b = await seed('batch-b')
  const resident = await seed('batch-resident')

  const snapshots = [
    { header: { id: 'batch-a', createdAt: 1000, cwd: workspaceDir }, sizeBytes: 200, location: { kind: 'jsonl', path: a.file } },
    { header: { id: 'batch-a-sub', createdAt: 1100, cwd: workspaceDir, parentSession: 'batch-a', origin: 'subagent', delegationDepth: 1 }, sizeBytes: 80, location: { kind: 'jsonl', path: aSub.file } },
    { header: { id: 'batch-b', createdAt: 1200, cwd: workspaceDir }, sizeBytes: 150, location: { kind: 'jsonl', path: b.file } },
    { header: { id: 'batch-resident', createdAt: 1300, cwd: workspaceDir }, sizeBytes: 100, location: { kind: 'jsonl', path: resident.file } },
  ]
  const ctx = {
    profileContext: { dir: profileDir },
    sessions: {
      list: () => [{ header: { id: 'batch-resident', createdAt: 1300, cwd: workspaceDir } }],
      get: id => id === 'batch-resident' ? { header: { id } } : undefined,
    },
    agents: { get: () => undefined },
    workspaceRegistry: {
      archivedSessionIds: ['batch-b'],
      list: () => [{ workspaceId: 'ws1', title: 'proj', path: workspaceDir, sessionIds: ['batch-a', 'batch-b', 'batch-resident'] }],
      unarchiveSession: async () => {},
      unpinSession: async () => {},
    },
    sessionPersistence: {
      list: async () => snapshots,
      open: async () => ({ close: async () => {} }),
    },
  }
  const op = sessionOperations(ctx)
  try {
    const signal = new AbortController().signal
    // Including resident session aborts entire batch before moving batch-a or batch-b
    await assert.rejects(
      op({ action: 'batch-delete', sessionIds: ['batch-a', 'batch-resident'], confirm: true }, signal),
      { status: 409 },
    )
    await access(a.file)
    await access(b.file)

    // Selecting both parent and its own subagent deduplicates cleanly and deletes all 3 targets once
    const result = await op({ action: 'batch-delete', sessionIds: ['batch-a', 'batch-a-sub', 'batch-b'], confirm: true }, signal)
    assert.deepEqual(result.deletedIds.sort(), ['batch-a', 'batch-a-sub', 'batch-b'])
    assert.equal(result.requestedCount, 3)
    assert.equal(result.subagentCount, 1)
    for (const removedDir of [a.dir, aSub.dir, b.dir]) {
      await assert.rejects(access(removedDir))
    }
    await access(resident.file)
    const manifestData = JSON.parse(await readFile(join(result.recovery, 'manifest.json'), 'utf8'))
    assert.deepEqual(manifestData.rootSessionIds, ['batch-a', 'batch-a-sub', 'batch-b'])
    assert.equal(manifestData.items.length, 3)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
