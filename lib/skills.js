import { skillRepositories } from './skill-repositories.js'
import { constants } from 'node:fs'
import { access, copyFile, lstat, mkdir, mkdtemp, open, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { parseDocument } from 'yaml'
import { requireValue } from './errors.js'
import { confinedPath, homeRoot, inside, moveLocal, readOpenFlags, statOrMissing } from './platform.js'

const maxMarkdown = 512 * 1024
const filesystemSources = new Set(['project-dsh', 'project-agents', 'user-dsh', 'user-agents'])
const validName = name => typeof name === 'string' && name.length <= 100 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)
const digest = text => createHash('sha256').update(text).digest('hex')

export function parseSkill(text) {
  const match = /^---\r?\n([\s\S]*?)^---(?:\r?\n|$)/m.exec(text)
  requireValue(match?.index === 0, 'SKILL.md 缺少 YAML frontmatter。')
  const document = parseDocument(match[1])
  requireValue(!document.errors.length, 'SKILL.md 的 YAML frontmatter 无效。')
  const data = document.toJS()
  requireValue(data && validName(data.name) && typeof data.description === 'string' && data.description.trim(), 'Skill 须有有效的 name 和 description。')
  requireValue(!['disableModelInvocation', 'modelInvocable', 'userInvocable'].some(key => Object.hasOwn(data, key)), '请使用 disable-model-invocation 和 user-invocable。')
  for (const key of ['disable-model-invocation', 'user-invocable']) {
    if (!Object.hasOwn(data, key)) continue
    requireValue(['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(String(data[key]).toLowerCase()), `${key} 值无效。`)
  }
  return { document, data, body: text.slice(match[0].length), eol: text.startsWith('---\r\n') ? '\r\n' : '\n' }
}

async function readSkillFile(file) {
  const info = await lstat(file)
  requireValue(info.isFile() && info.nlink === 1 && info.size <= maxMarkdown, 'SKILL.md 须为普通文件，且不超过 512 KiB。', 409)
  const handle = await open(file, readOpenFlags())
  try {
    const opened = await handle.stat()
    requireValue(opened.isFile() && opened.ino === info.ino && opened.dev === info.dev && opened.nlink === 1 && opened.size <= maxMarkdown, 'SKILL.md 已变化，请刷新。', 409)
    const buffer = Buffer.alloc(maxMarkdown + 1)
    const { bytesRead } = await handle.read({ buffer, length: buffer.length })
    requireValue(bytesRead <= maxMarkdown, 'SKILL.md 超过 512 KiB。', 409)
    return { text: buffer.subarray(0, bytesRead).toString('utf8'), mode: opened.mode & 0o777 }
  } finally { await handle.close() }
}

async function projectRoot(cwd) {
  for (let current = cwd; ; current = path.dirname(current)) {
    if (await statOrMissing(path.join(current, '.git'))) return current
    if (path.dirname(current) === current) return cwd
  }
}

async function rootsFor(home, cwd) {
  const project = cwd ? await projectRoot(cwd) : undefined
  return {
    'user-dsh': path.join(home ?? homeRoot(process.env.DSH_HOME, '.dsh'), 'skills'),
    'user-agents': path.join(homeRoot(process.env.DSH_AGENTS_HOME, '.agents'), 'skills'),
    ...(project && {
      'project-dsh': path.join(project, '.dsh', 'skills'),
      'project-agents': path.join(project, '.agents', 'skills'),
    }),
  }
}

async function editableFile(skill, roots) {
  const root = roots[skill.source]
  if (skill.provider !== 'filesystem' || !root || !skill.path || !inside(root, skill.path)) return undefined
  const segments = path.relative(root, skill.path).split(path.sep)
  if (segments[0] === '.system') return undefined
  if (!(segments.length === 1 || segments.length === 2 && segments[1] === 'SKILL.md')) return undefined
  const target = segments.length === 1 ? skill.path : path.dirname(skill.path)
  try {
    if (!(await lstat(root)).isDirectory() || !(await lstat(path.dirname(root))).isDirectory()) return undefined
    const info = await lstat(skill.path)
    const targetInfo = await lstat(target)
    if (info.isFile() && info.nlink === 1 && !targetInfo.isSymbolicLink() && await confinedPath(root, skill.path)) {
      await access(skill.path, constants.W_OK)
      await access(path.dirname(skill.path), constants.W_OK)
      return { file: skill.path, target, root }
    }
  } catch (error) {
    if (!['ENOENT', 'EACCES', 'EPERM', 'EROFS'].includes(error.code)) throw error
  }
  return undefined
}

async function safeSkillRoot(root) {
  // The resolved workspace/home may itself be a link. New discovery folders
  // below it must be real directories, so an import cannot escape that anchor.
  const parent = path.dirname(root)
  await mkdir(parent, { recursive: true })
  requireValue((await lstat(parent)).isDirectory(), 'Skill 目录的上级必须是本地目录。', 409)
  await mkdir(root, { recursive: true })
  requireValue((await lstat(root)).isDirectory(), 'Skill 根目录必须是本地目录。', 409)
}

async function importFolder(source, destination) {
  let size = 0
  let count = 0
  async function copy(from, to, depth) {
    requireValue(depth <= 20, 'Skill 目录层级过深。')
    for (const item of await readdir(from, { withFileTypes: true })) {
      requireValue(++count <= 500, 'Skill 文件数量超过 500。')
      if (item.name === '.git') continue
      const input = path.join(from, item.name)
      const output = path.join(to, item.name)
      if (item.isDirectory()) {
        await mkdir(output)
        await copy(input, output, depth + 1)
      } else {
        requireValue(item.isFile(), 'Skill 导入目录仅支持普通文件和目录。')
        const info = await lstat(input)
        requireValue(info.isFile() && info.nlink === 1, 'Skill 导入目录仅支持独立的普通文件。')
        size += info.size
        requireValue(size <= 32 * 1024 * 1024, 'Skill 导入目录超过 32 MiB。')
        await copyFile(input, output, constants.COPYFILE_EXCL)
      }
    }
  }
  await copy(source, destination, 0)
}

async function listSkillFiles(target, skillFile) {
  const info = await statOrMissing(target)
  if (!info?.isDirectory()) return []
  const files = []
  async function walk(dir, prefix, depth) {
    if (depth > 5 || files.length >= 100) return
    const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
    for (const item of entries) {
      if (files.length >= 100) break
      if (item.name.startsWith('.powertools-')) continue
      const full = path.join(dir, item.name)
      const rel = prefix ? `${prefix}/${item.name}` : item.name
      if (item.isDirectory()) {
        await walk(full, rel, depth + 1)
      } else if (item.isFile() && full !== skillFile) {
        const stat = await statOrMissing(full)
        if (stat?.isFile()) files.push({ path: rel, size: stat.size })
      }
    }
  }
  await walk(target, '', 0)
  return files
}

function summarizeFrontmatter(data) {
  if (!data || typeof data !== 'object') return []
  const skip = new Set(['name', 'description', 'disable-model-invocation', 'user-invocable'])
  return Object.entries(data)
    .filter(([key]) => !skip.has(key))
    .map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }))
}

export function skillOperations(ctx) {
  const repository = skillRepositories(ctx.profileContext.dir, readSkillFile, parseSkill)
  let tail = Promise.resolve()
  let invalidate = () => {}
  if (typeof ctx.skills.registerProvider === 'function') {
    ctx.skills.registerProvider(control => {
      invalidate = control.invalidate
      return { name: 'dsh-powertools-changes', list: async () => [], get: async () => undefined }
    })
  }
  async function withCatalog(body, signal, operation) {
    const workspace = body.workspaceId ? ctx.workspaceRegistry.get(body.workspaceId) : undefined
    requireValue(!body.workspaceId || workspace, '工作区已移除，请刷新。', 404)
    const session = workspace?.sessionIds.includes(body.sessionId) ? ctx.agents.get(body.sessionId) : undefined
    const presets = ctx.agentPresets
    const registry = (session && presets?.serviceFor?.(session, 'skills')) ?? ctx.skills
    const lease = session ? undefined : await presets?.acquireScope?.()
    try {
      const lookup = { cwd: workspace?.path, scope: session ?? lease?.key, signal }
      const roots = await rootsFor(ctx.profileContext?.home, lookup.cwd)
      return await operation(registry, lookup, roots)
    } finally { await lease?.[Symbol.asyncDispose]() }
  }
  return (body, signal) => {
    const run = () => {
      signal.throwIfAborted()
      if (typeof body.action === 'string' && body.action.startsWith('repository-') && body.action !== 'repository-install') {
        return repository(body, signal)
      }
      return withCatalog(body, signal, async (registry, lookup, roots) => {
        signal.throwIfAborted()
        if (body.action === 'list') {
          const skills = await registry.list(lookup)
          const rows = await Promise.all(skills.map(async skill => ({
            name: skill.name, description: skill.description, source: skill.source,
            provider: skill.provider, ...skill.invocation,
            editable: filesystemSources.has(skill.source) && Boolean(await editableFile(skill, roots)),
          })))
          return { skills: rows }
        }
        if (body.action === 'import' || body.action === 'repository-install') {
          const root = body.destination === 'project' ? roots['project-dsh'] : body.destination === 'personal' ? roots['user-dsh'] : undefined
          requireValue(root, '请选择可用的导入位置。')
          const fromRepository = body.action === 'repository-install'
          const directory = fromRepository ? (await repository(body, signal)).directory : body.directory
          requireValue(typeof directory === 'string' && path.isAbsolute(directory), '请输入本地 Skill 目录的绝对路径。')
          const source = path.resolve(directory)
          requireValue((await lstat(source)).isDirectory(), '请选择包含 SKILL.md 的普通目录。')
          const { text } = await readSkillFile(path.join(source, 'SKILL.md'))
          const { data } = parseSkill(text)
          requireValue(!(await registry.list(lookup)).some(skill => skill.name === data.name), '当前目录范围中已有同名 Skill。', 409)
          const destination = path.join(root, data.name)
          requireValue(!inside(source, destination) && source !== destination, '导入目标不能在源目录内。')
          await safeSkillRoot(root)
          const staging = await mkdtemp(path.join(path.dirname(root), '.powertools-import-'))
          try {
            await importFolder(source, staging)
            const copied = await readSkillFile(path.join(staging, 'SKILL.md'))
            requireValue(copied.text === text, '导入时 SKILL.md 已变化，请重试。', 409)
            signal.throwIfAborted()
            requireValue(!await statOrMissing(destination), '目标目录已存在。', 409)
            await moveLocal(staging, destination)
          } finally { await rm(staging, { recursive: true, force: true }) }
          invalidate()
          return { name: data.name }
        }
        requireValue(validName(body.name), 'Skill 名称无效。')
        const skill = await registry.get(body.name, lookup)
        requireValue(skill, 'Skill 已变化，请刷新。', 404)
        const writable = await editableFile(skill, roots)
        if (body.action === 'preview' && !writable) {
          const content = skill.content ?? ''
          return { name: skill.name, markdown: content, bytes: Buffer.byteLength(content), raw: false, editable: false, files: [], meta: [], ...skill.invocation }
        }
        requireValue(writable, '此 Skill 的来源不支持写入。', 409)
        const { text, mode } = await readSkillFile(writable.file)
        const { document, data, body: markdown, eol } = parseSkill(text)
        requireValue(data.name === body.name, 'Skill 已变化，请刷新。', 409)
        const revision = digest(text)
        if (body.action === 'preview') {
          const files = await listSkillFiles(writable.target, writable.file)
          return { name: skill.name, markdown: text, bytes: Buffer.byteLength(text), raw: true, editable: true, revision,
            description: data.description, body: markdown, files, meta: summarizeFrontmatter(data), ...skill.invocation }
        }
        requireValue(body.revision === revision, '文件已被修改，请重新打开 Skill。', 409)
        if (body.action === 'remove') {
          requireValue(body.confirm === skill.name, '请确认要移除的 Skill。', 409)
          const recovery = await mkdtemp(path.join(path.dirname(writable.root), 'powertools-recovery-'))
          try {
            signal.throwIfAborted()
            await moveLocal(writable.target, path.join(recovery, path.basename(writable.target)))
          } catch (error) {
            await rm(recovery, { recursive: true, force: true })
            throw error
          }
          invalidate()
          return { recovery }
        }
        requireValue(body.action === 'edit', 'Skill 操作无效。')
        requireValue(typeof body.description === 'string' && body.description.trim() && body.description.length <= 8000, '请输入 Skill 描述。')
        requireValue(typeof body.body === 'string' && typeof body.modelInvocable === 'boolean' && typeof body.userInvocable === 'boolean', 'Skill 内容或调用权限无效。')
        if (body.description !== data.description) document.set('description', body.description)
        if (body.modelInvocable !== skill.invocation.modelInvocable) document.set('disable-model-invocation', !body.modelInvocable)
        if (body.userInvocable !== skill.invocation.userInvocable) document.set('user-invocable', body.userInvocable)
        const yaml = document.toString({ lineWidth: 0 }).replace(/\n/g, eol)
        const frontmatter = yaml.endsWith(eol) ? yaml : `${yaml}${eol}`
        const next = `---${eol}${frontmatter}---${eol}${body.body}`
        requireValue(Buffer.byteLength(next) <= maxMarkdown, 'SKILL.md 超过 512 KiB。')
        const temporary = path.join(path.dirname(writable.file), `.powertools-${randomUUID()}.tmp`)
        try {
          await writeFile(temporary, next, { flag: 'wx', mode })
          signal.throwIfAborted()
          requireValue((await readSkillFile(writable.file)).text === text, '文件已被修改，请重新打开 Skill。', 409)
          await moveLocal(temporary, writable.file)
        } finally { await rm(temporary, { force: true }) }
        invalidate()
        return {}
      })
    }
    if (['list', 'preview', 'repository-list'].includes(body.action)) return run()
    const pending = tail.then(run)
    tail = pending.catch(() => {})
    return pending
  }
}
