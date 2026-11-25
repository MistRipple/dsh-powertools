import { constants } from 'node:fs'
import { cp, lstat, realpath, rename, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import path, { win32 } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { requireValue } from './errors.js'

export function stdioFields(command, args, cwd, platform = process.platform) {
  requireValue(typeof command === 'string' && command.trim() && !command.includes('\0'), '请输入单独的可执行文件名或绝对路径。')
  requireValue(Array.isArray(args) && args.length <= 100 && args.every(arg => typeof arg === 'string' && arg.length <= 8192 && !arg.includes('\0')), '进程参数须为 JSON 字符串数组。')
  const paths = platform === 'win32' ? win32 : path.posix
  requireValue(typeof cwd === 'string' && (!cwd || paths.isAbsolute(cwd) && !cwd.includes('\0')), '启动目录须为绝对路径。')
  if (platform === 'win32') {
    requireValue(!/\.(cmd|bat|ps1)$/i.test(command.trim()), 'Windows 请指定 .exe，例如 node.exe，并将脚本路径作为独立参数。')
  }
  return { command: command.trim(), args, cwd }
}

export function homeRoot(value, fallback) {
  const configured = value?.trim()
  if (!configured) return path.join(homedir(), fallback)
  if (/^~[/\\]/.test(configured)) return path.resolve(homedir(), configured.slice(2))
  return path.resolve(configured)
}

export function inside(root, candidate) {
  const relative = path.relative(root, candidate)
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

export async function statOrMissing(file) {
  try { return await lstat(file) } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return undefined
    throw error
  }
}

export async function confinedPath(root, candidate) {
  if (!inside(root, candidate)) return false
  const realRoot = await realpath(root)
  const realCandidate = await realpath(candidate)
  return inside(realRoot, realCandidate)
    && path.relative(realRoot, realCandidate) === path.relative(root, candidate)
}

export function readOpenFlags(platform = process.platform) {
  if (platform === 'win32') return constants.O_RDONLY
  return constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0)
}

// Node uses rename(2) on macOS and MoveFileExW on Windows. Transient Windows
// antivirus or indexer locks may fail with EPERM/EBUSY/EACCES; retry briefly
// and otherwise leave the original in place.
export async function moveLocal(source, destination, platform = process.platform) {
  const retryable = new Set(['EPERM', 'EBUSY', 'EACCES'])
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(source, destination)
      return
    } catch (error) {
      if (error.code === 'EXDEV') {
        await cp(source, destination, { recursive: true, errorOnExist: true, force: false })
        await rm(source, { recursive: true, force: true })
        return
      }
      if (platform !== 'win32' || !retryable.has(error.code) || attempt >= 3) throw error
      await setTimeout(50 * (attempt + 1))
    }
  }
}
