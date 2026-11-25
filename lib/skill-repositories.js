import { execFile } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { devNull } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { RequestError, requireValue } from './errors.js'
import { confinedPath, statOrMissing } from './platform.js'

const git = promisify(execFile)
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 24)

export function githubRepository(input) {
  let url
  try { url = new URL(input) } catch { throw new RequestError('请输入 GitHub 仓库的 HTTPS 地址。') }
  const origin = url.origin === 'https://github.com' && !url.username && !url.password && !url.search && !url.hash
  const name = url.pathname.match(/^\/([a-z0-9-]+)\/([a-z0-9_.-]+)\/?$/i)?.slice(1).join('/').replace(/\.git$/i, '')
  requireValue(origin && name && !name.endsWith('/') && !name.endsWith('/.'), '请输入 GitHub 仓库首页地址，例如 https://github.com/owner/repo。')
  return { id: hash(name.toLowerCase()), name, url: `https://github.com/${name}` }
}

async function cloneRepository(url, checkout, signal) {
  const options = {
    signal, timeout: 45_000, maxBuffer: 512 * 1024, windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: devNull,
      GIT_ALLOW_PROTOCOL: 'https', GIT_LFS_SKIP_SMUDGE: '1' },
  }
  try {
    await git('git', ['clone', '--quiet', '--depth=1', '--no-tags', '--no-recurse-submodules', '--', url, checkout], options)
    const { stdout } = await git('git', ['-C', checkout, 'rev-parse', 'HEAD'], options)
    requireValue(/^[a-f\d]{40,64}$/.test(stdout.trim()), '无法读取仓库提交版本。')
    return stdout.trim()
  } catch (error) {
    signal.throwIfAborted()
    if (error.code === 'ENOENT') throw new RequestError('请先安装 Git，再刷新 Skill 仓库。', 409)
    if (error instanceof RequestError) throw error
    throw new RequestError('无法下载仓库。请检查 GitHub 地址、网络和仓库访问权限。', 502)
  }
}

export function skillRepositories(profileDir, readSkill, parseSkill, clone = cloneRepository) {
  const root = path.join(profileDir, 'powertools-skill-repositories')
  const catalog = path.join(root, 'repositories.json')
  const snapshotPath = name => {
    requireValue(typeof name === 'string' && /^checkout-[a-z0-9]+$/i.test(name), '仓库缓存记录无效。', 409)
    return path.join(root, name)
  }

  async function registry() {
    try {
      const entries = JSON.parse(await readFile(catalog, 'utf8'))
      requireValue(Array.isArray(entries) && entries.every(entry => entry?.snapshot && Array.isArray(entry.skills)), '仓库配置无效。')
      for (const entry of entries) snapshotPath(entry.snapshot)
      return entries
    }
    catch (error) {
      if (error.code === 'ENOENT') return []
      throw new RequestError('Skill 仓库配置无法读取。', 502)
    }
  }

  async function save(entries) {
    const temporary = path.join(root, `.${randomUUID()}.tmp`)
    try {
      await writeFile(temporary, JSON.stringify(entries, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
      await rename(temporary, catalog)
    } finally { await rm(temporary, { force: true }) }
  }

  async function scan(checkout, signal) {
    const skills = []
    let visited = 0
    const directories = [checkout]
    while (directories.length) {
      signal.throwIfAborted()
      const folder = directories.pop()
      if (++visited > 12_000 || skills.length >= 250) throw new RequestError('仓库过大，请添加范围更小的 Skill 仓库。', 422)
      const marker = await statOrMissing(path.join(folder, 'SKILL.md'))
      if (marker?.isFile() && marker.size <= 512 * 1024) {
        try {
          const { text } = await readSkill(path.join(folder, 'SKILL.md'))
          const { data } = parseSkill(text)
          const relative = path.relative(checkout, folder).split(path.sep).join('/')
          skills.push({ id: hash(relative), relative, name: data.name, description: data.description })
          continue
        } catch (error) {
          if (!(error instanceof RequestError)) throw error
        }
      }
      for (const entry of await readdir(folder, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) directories.push(path.join(folder, entry.name))
      }
    }
    return skills.sort((a, b) => a.name.localeCompare(b.name) || a.relative.localeCompare(b.relative))
  }

  function publicRepository({ snapshot, skills, ...info }) {
    return { ...info, skills: skills.map(({ relative, ...skill }) => skill) }
  }

  async function sync(entries, repository, previous, signal) {
    await mkdir(root, { recursive: true, mode: 0o700 })
    const snapshot = await mkdtemp(path.join(root, 'checkout-'))
    try {
      const commit = await clone(`${repository.url}.git`, path.join(snapshot, 'source'), signal)
      const skills = await scan(path.join(snapshot, 'source'), signal)
      signal.throwIfAborted()
      const next = { ...repository, commit, checkedAt: Date.now(), snapshot: path.basename(snapshot), skills }
      const updated = previous ? entries.map(entry => entry.id === repository.id ? next : entry) : [...entries, next]
      await save(updated)
      if (previous) await rm(snapshotPath(previous.snapshot), { recursive: true, force: true }).catch(() => {})
      return { repository: publicRepository(next) }
    } catch (error) {
      await rm(snapshot, { recursive: true, force: true }).catch(() => {})
      throw error
    }
  }

  return async (body, signal) => {
    const entries = await registry()
    if (body.action === 'repository-list') return { repositories: entries.map(publicRepository) }
    if (body.action === 'repository-add') {
      const repository = githubRepository(body.url)
      requireValue(!entries.some(entry => entry.id === repository.id), '此仓库已经添加。', 409)
      return sync(entries, repository, null, signal)
    }
    const entry = entries.find(candidate => candidate.id === body.repositoryId)
    requireValue(entry, '仓库已移除，请刷新列表。', 404)
    if (body.action === 'repository-refresh') {
      return sync(entries, githubRepository(entry.url), entry, signal)
    }
    if (body.action === 'repository-remove') {
      requireValue(body.confirm === entry.id, '请确认要移除的仓库。')
      await save(entries.filter(candidate => candidate.id !== entry.id))
      await rm(snapshotPath(entry.snapshot), { recursive: true, force: true }).catch(() => {})
      return {}
    }
    requireValue(entry.commit === body.commit, '仓库已刷新，请重新打开 Skill。', 409)
    const skill = entry.skills.find(item => item.id === body.skillId)
    requireValue(skill, '仓库中没有找到该 Skill。', 404)
    const checkout = path.join(snapshotPath(entry.snapshot), 'source')
    requireValue(await confinedPath(root, checkout), '无法验证仓库缓存目录。', 409)
    const directory = path.resolve(checkout, skill.relative)
    requireValue(directory === checkout || await confinedPath(checkout, directory), '无法打开仓库中的 Skill 目录。', 409)
    if (body.action === 'repository-preview') {
      const { text } = await readSkill(path.join(directory, 'SKILL.md'))
      return { markdown: text }
    }
    requireValue(body.action === 'repository-install', '仓库操作无效。')
    return { directory }
  }
}
