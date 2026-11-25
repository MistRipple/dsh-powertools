import assert from 'node:assert/strict'
import { access, mkdtemp, mkdir, readdir, readFile, writeFile, realpath, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { once } from 'node:events'
import { setTimeout } from 'node:timers/promises'
import { constants as zlibConstants, zstdCompressSync, zstdDecompressSync } from 'node:zlib'

const cli = process.argv[2]
const expectedVersion = process.argv[3]
const desktop = process.env.DSH_DESKTOP_APP
const enhanceOnly = process.env.DSH_SMOKE_ENHANCE_ONLY === '1'
const screenDirectory = process.env.DSH_SMOKE_SCREENSHOTS
const playwright = process.env.DSH_PLAYWRIGHT_MODULE ?? 'playwright-core'
assert(cli && expectedVersion, 'Usage: node tests/smoke.mjs <DSH cli .mjs> <version>')
const { chromium } = await import(playwright)
const repo = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(await readFile(path.join(repo, 'package.json'), 'utf8'))
const root = await realpath(await mkdtemp(path.join(tmpdir(), 'dsh-powertools-smoke-')))
const home = path.join(root, 'dsh')
const cwd = path.join(root, 'isolated workspace')
const documents = path.join(root, 'Documents')
const sessionWorkspace = path.join(documents, 'deepseek-harness', 'default-workspace')
const imported = path.join(root, 'skill with spaces')
const modelRequests = path.join(root, 'model-requests.jsonl')
const processes = []
let browser

function start(script, args, env = {}, executable = false) {
  const child = spawn(executable ? script : process.execPath, executable ? args : [script, ...args], { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
  processes.push(child)
  let output = ''
  child.stdout.on('data', chunk => { output += chunk })
  child.stderr.on('data', chunk => { output += chunk })
  return { child, output: () => output }
}
async function until(fn, description, timeout = 15000) {
  const end = Date.now() + timeout
  do {
    const value = await fn()
    if (value) return value
    await setTimeout(100)
  } while (Date.now() < end)
  throw new Error(`Timed out: ${description}`)
}
async function command(args, env) {
  const process = start(cli, args, env, Boolean(desktop))
  const [code] = await once(process.child, 'exit')
  assert.equal(code, 0, process.output())
  return process.output()
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  child.kill()
  await Promise.race([once(child, 'exit'), setTimeout(3000)])
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL')
    await once(child, 'exit')
  }
}

smoke: try {
  await mkdir(cwd)
  await mkdir(imported)
  await mkdir(sessionWorkspace, { recursive: true })
  await mkdir(path.join(root, 'agents'))
  await writeFile(path.join(sessionWorkspace, 'untouched.txt'), 'keep this workspace file\n')
  await writeFile(path.join(imported, 'SKILL.md'), [
    '---', 'name: powertools-smoke-skill', 'description: Initial fixture', 'custom-fields:', '  preserve: true', '---', '', 'Fixture body', '',
  ].join('\n'))
  await writeFile(path.join(imported, 'resource.txt'), 'keep this resource\n')
  const services = start(path.join(repo, 'tests/fixtures/services.mjs'), ['0', modelRequests])
  const servicePort = await until(() => services.output().match(/^\d+/)?.[0], 'fixture port')
  const env = { DSH_HOME: home, DSH_AGENTS_HOME: path.join(root, 'agents'), DEEPSEEK_API_KEY: 'powertools-fixture-only', POWERTOOLS_ISOLATED_TEST_KEY: 'powertools-fixture-only', DSH_TELEMETRY_DISABLED: '1' }
  const patch = path.join(root, 'model.yml')
  const overrides = `- id: llm-deepseek\n  config:\n    baseURL: http://127.0.0.1:${servicePort}\n    apiKeyEnv: POWERTOOLS_ISOLATED_TEST_KEY\n    thinking: disabled\n- id: session-titles\n  disabled: true\n- id: workspace-controller\n  config:\n    documentsDirectory: ${JSON.stringify(documents)}\n`
  await writeFile(patch, overrides)
  assert.match(await command(['--version'], env), new RegExp(expectedVersion.replaceAll('.', '\\.')))
  const profile = desktop ? 'desktop' : 'web'
  const sourceDependency = `link:${repo}`
  let page
  if (desktop) {
    const executable = path.join(desktop, 'Contents/MacOS/DeepSeek Harness')
    const flags = [`--user-data-dir=${path.join(root, 'electron')}`, '--remote-debugging-port=0', '--lang=zh-CN']
    const warmup = start(executable, flags, env, true)
    await until(() => warmup.output().includes('dsh web:'), 'Desktop isolated profile boot', 30_000)
    await stop(warmup.child)
    const profilePatch = path.join(home, 'profiles', profile, 'cordis.patch.yml')
    const firstUsePatch = (await readFile(profilePatch, 'utf8')).replace(/^\[\][ \t]*$/m, '')
    await writeFile(profilePatch, `${firstUsePatch}\n${overrides}`)
    await command(['plugin', '--profile', profile, 'add', sourceDependency], env)
    const host = start(executable, flags, env, true)
    const debuggerURL = await until(() => host.output().match(/DevTools listening on ws:\/\/(127\.0\.0\.1:\d+)\//)?.[1], 'Desktop test debugger port', 30_000)
    browser = await chromium.connectOverCDP(`http://${debuggerURL}`)
    page = await until(() => browser.contexts()[0]?.pages().find(candidate => candidate.url().startsWith('dsh-app://app/')), 'Desktop main renderer', 30_000)
  } else {
    await command(['plugin', '--profile', profile, 'add', sourceDependency], env)
    const host = start(cli, ['web', '--patch', patch, '--no-open', '--port', '0'], env)
    const url = await until(() => host.output().match(/dsh web: (http[^\s]+)/)?.[1], 'DSH web port', 30_000)
    browser = await chromium.launch({ channel: process.env.DSH_CHROME_CHANNEL ?? 'chrome', headless: true })
    page = await browser.newPage({ locale: 'zh-CN', viewport: { width: 1280, height: 850 } })
    await page.goto(url)
  }
  const pageErrors = []
  assert.equal(await realpath(path.join(home, 'profiles', profile, 'node_modules', manifest.name)), await realpath(repo))
  page.on('pageerror', error => pageErrors.push(error.message))
  const button = (name, parent = page) => parent.getByRole('button', { name, exact: true })
  const seg = (prefix, parent = page) => parent.locator('.dpt-seg-btn').filter({ hasText: new RegExp(`^${prefix}`) })
  const dialog = page.getByRole('dialog')
  const toast = page.locator('.dpt-toast')
  const composer = page.locator('[contenteditable="true"][role="textbox"]').first()
  const next = page.getByRole('button', { name: /^(继续|Continue)$/ })
  if (await next.isVisible({ timeout: 2000 })) await next.click()
  else await next.waitFor({ state: 'visible', timeout: 3000 }).then(() => next.click(), () => {})
  await button('工具箱').waitFor()
  const enhance = button('增强')
  const cancelEnhancement = button('取消增强')
  const send = page.locator('[data-composer-card]').getByRole('button', { name: /^(发送消息|Send message)$/i })
  await enhance.waitFor()
  assert.equal(await enhance.isDisabled(), true)
  await checkEnhanceButton(enhance)
  const mainPanel = page.locator('.dpt-page')
  async function screenshot(label) {
    if (!screenDirectory) return
    await mkdir(screenDirectory, { recursive: true })
    await page.screenshot({ animations: 'disabled', path: path.join(screenDirectory, `${profile}-${expectedVersion}-${label}.png`) })
  }
  if (!enhanceOnly) {
    await page.getByRole('button', { name: /^(插件|Plugins)$/ }).click()
    const bundleCard = page.locator('[data-plugin-package="dsh-powertools"]')
    await bundleCard.getByText(/^(DSH 工具箱|DSH PowerTools)$/).click()
    const embedded = page.locator('[data-plugin-detail="dsh-powertools"] [data-plugin-config] .dpt-inline')
    await seg('未归档', embedded).waitFor()
    assert.equal(await embedded.locator('h1').count(), 0)
    assert.equal(await embedded.getByText('服务已注册').count(), 0)
    assert.deepEqual(await embedded.evaluate(node => {
      const css = getComputedStyle(node)
      return [css.maxWidth, css.padding, css.overflowY, css.containerType]
    }), ['none', '0px', 'visible', 'inline-size'])
    const embeddedHelp = button('使用与诊断', embedded)
    assert.equal(await embeddedHelp.getAttribute('aria-expanded'), 'false')
    await embeddedHelp.click()
    await embedded.getByText('工具箱尚无已保存的覆盖规则。', { exact: true }).waitFor()
    await embedded.getByRole('heading', { name: 'Profile 配置' }).waitFor()
    assert.equal(await embedded.locator('.dpt-maintenance code[dir=ltr]').first().innerText(), manifest.version)
    await embeddedHelp.click()
    await button('MCP', embedded).click()
    await button('新增服务器', embedded).waitFor()
    await button('工具箱').click()
    const titleStyle = await mainPanel.getByRole('heading', { name: '工具箱', exact: true }).evaluate(node => {
      const css = getComputedStyle(node)
      return [css.fontSize, css.lineHeight, css.fontWeight]
    })
    assert.deepEqual(titleStyle, ['20px', '28px', '500'])
    await mainPanel.locator('.dpt-page-head svg[data-icon="layout-grid"]').waitFor()
    await button('工具箱').locator('svg[data-icon="layout-grid"]').waitFor()
    assert.equal(await mainPanel.locator('.dpt-page-inner').evaluate(node => getComputedStyle(node).maxWidth), '960px')
    if (desktop) {
      assert.equal(await page.locator('html').getAttribute('data-platform'), 'darwin')
      assert.equal(await mainPanel.locator('.dpt-page-head').evaluate(node => {
        const css = getComputedStyle(node)
        return parseFloat(css.paddingTop) === 28 + (parseFloat(css.getPropertyValue('--dsh-frame-top-clearance')) || 0)
      }), true)
    }
    await page.getByText(/^(新会话|New [Ss]ession)$/).first().click()
    console.log('PASS Sidebar and bundle configuration entry, clean header without diagnostic noise, and container sizing')
  }
  const api = (feature, payload = {}) => page.evaluate(async ({ feature, payload }) => {
    const response = await fetch('api/dsh-powertools', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ feature, ...payload }) })
    return { status: response.status, value: await response.json() }
  }, { feature, payload })
  assert.deepEqual((await api('capabilities')).value, {
    version: manifest.version, profilePath: path.join(home, 'profiles', profile, 'cordis.patch.yml'),
    sessionDelete: true, mcp: true, skills: true, enhance: true,
  })
  const checkDraft = expected => until(async () => (await composer.innerText()).trim() === expected, `draft ${expected}`)
  await composer.fill('整理季度销售数据，保留原始文件。\n输出按地区汇总。')
  async function checkEnhanceButton(control) {
    assert.equal(await control.innerText(), '')
    const native = await send.elementHandle()
    try {
      const actual = await control.evaluate((node, primary) => {
        const a = node.getBoundingClientRect(), b = primary.getBoundingClientRect()
        const css = getComputedStyle(node), nativeCSS = getComputedStyle(primary)
        return {
          shape: [a.width === a.height && a.width === b.width && a.height === b.height,
            Math.abs(a.top - b.top) < .5, a.right < b.left && primary.previousElementSibling.contains(node),
            css.borderRadius === nativeCSS.borderRadius, css.getPropertyValue('corner-shape') === nativeCSS.getPropertyValue('corner-shape')],
          fill: css.backgroundColor, image: css.backgroundImage, opacity: css.opacity,
        }
      }, native)
      assert.deepEqual(actual.shape, [true, true, true, true, true])
      assert.match(actual.fill, /^rgb\(/)
      assert.equal(actual.image, 'none')
      assert.equal(actual.opacity, '1')
    } finally { await native.dispose() }
  }
  await enhance.locator('svg').waitFor()
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme })
    await until(() => page.locator('body').evaluate((node, dark) => node.hasAttribute('data-ds-dark-theme') === dark,
      colorScheme === 'dark'), 'composer ' + colorScheme + ' theme')
    await checkEnhanceButton(enhance)
    await enhance.hover()
    await until(() => enhance.evaluate(node => !node.getAnimations().length), 'enhance hover transition')
    await checkEnhanceButton(enhance)
    await page.mouse.move(0, 0)
    await screenshot('composer-' + colorScheme)
  }
  await enhance.click()
  await checkDraft('目标：整理季度销售数据，保留原始文件。\n输出按地区汇总。\n交付物：待确认。')
  assert.equal(await dialog.count(), 0)
  assert.equal(await composer.evaluate(node => document.activeElement === node), true)
  const undoEnhancement = button('撤销增强')
  await undoEnhancement.locator('svg').waitFor()
  await checkEnhanceButton(enhance)
  await undoEnhancement.click()
  await checkDraft('整理季度销售数据，保留原始文件。\n输出按地区汇总。')
  const lines = (await readFile(modelRequests, 'utf8')).trim().split('\n').map(line => JSON.parse(line))
  assert.equal(lines.length, 1)
  assert.equal(lines[0].messages.length, 1)
  assert.equal(lines[0].messages[0].role, 'user')
  assert.equal(lines[0].text, '整理季度销售数据，保留原始文件。\n输出按地区汇总。')
  assert.ok(!lines[0].tools?.length)
  await composer.fill('模拟失败')
  await button('增强').click()
  await page.locator('.dpt-composer [role=alert]').waitFor()
  await button('关闭反馈', page.locator('.dpt-composer')).click()
  await page.locator('.dpt-composer [role=alert]').waitFor({ state: 'hidden' })
  await checkDraft('模拟失败')
  await composer.fill('模拟慢速并取消')
  await enhance.click()
  await checkEnhanceButton(cancelEnhancement)
  assert.equal(await cancelEnhancement.getAttribute('aria-busy'), 'true')
  const spinner = cancelEnhancement.locator('svg')
  assert.notEqual(await spinner.evaluate(node => getComputedStyle(node).animationName), 'none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await spinner.evaluate(node => getComputedStyle(node).animationName), 'none')
  await page.emulateMedia({ reducedMotion: null })
  await cancelEnhancement.click()
  await enhance.waitFor()
  await checkDraft('模拟慢速并取消')
  await composer.fill('模拟慢速并继续编辑')
  await button('增强').click()
  await composer.fill('保留用户新编辑')
  await enhance.waitFor()
  await setTimeout(2300)
  assert.equal(await dialog.count(), 0)
  await checkDraft('保留用户新编辑')
  await composer.fill('工具箱会话验证 A')
  await composer.press('Enter')
  await page.getByText('隔离测试会话回复。', { exact: true }).last().waitFor({ timeout: 20_000 })
  await composer.fill('顺手补充上面回复的细节')
  await enhance.click()
  await checkDraft('目标：顺手补充上面回复的细节\n交付物：待确认。')
  assert.match(await undoEnhancement.getAttribute('title') ?? '', /参考最近 2 条上下文/)
  const contextualLog = (await readFile(modelRequests, 'utf8')).trim().split('\n').map(line => JSON.parse(line)).at(-1)
  assert.equal(contextualLog.enhancement, true)
  assert.equal(contextualLog.messages.length, 1)
  assert.equal(contextualLog.text, '顺手补充上面回复的细节')
  const contextualSystem = JSON.stringify(contextualLog.system)
  assert.match(contextualSystem, /<session_context>/)
  assert.match(contextualSystem, /工具箱会话验证 A/)
  assert.match(contextualSystem, /隔离测试会话回复。/)
  await undoEnhancement.click()
  await checkDraft('顺手补充上面回复的细节')
  await composer.fill('模拟慢速并切换会话')
  await button('增强').click()
  await page.getByText(/^(新会话|New [Ss]ession)$/).first().click()
  await checkDraft('')
  await setTimeout(2300)
  assert.equal(await dialog.count(), 0)
  await screenshot('composer-enhance')
  console.log('PASS Enhance matches Send circle, size and alignment with opaque light/dark fill, animation, direct replace, undo, cancel and draft protection')
  if (enhanceOnly) {
    assert.deepEqual(pageErrors, [])
    console.log(`PASS ${process.platform} ${process.arch} @deepseek-ai/dsh ${expectedVersion} ${profile} enhancement integration`)
    break smoke
  }

  await button('工具箱').click()
  await page.getByRole('heading', { name: '工具箱', exact: true }).waitFor()
  const sessionRows = page.locator('.dpt-page li[data-session-id]')
  await sessionRows.first().waitFor()
  // Verify Overview card & diagnostic noise & primary refresh button & "已刷新" banner are completely gone
  assert.equal(await mainPanel.getByText('服务已注册').count(), 0)
  assert.equal(await mainPanel.locator('.dpt-primary').count(), 0)
  await button('刷新会话', mainPanel).click()
  assert.equal(await mainPanel.getByText('会话列表已刷新').count(), 0)
  assert.equal(await toast.count(), 0)

  const first = sessionRows.filter({ hasNotText: '运行中' }).last()
  const title = await first.locator('strong').innerText()
  const toggle = first.locator('.dpt-disclosure')
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
  assert.doesNotMatch(await toggle.innerText(), /dsh-powertools-smoke-/)
  await toggle.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  assert.equal(await toggle.evaluate(node => getComputedStyle(node).outlineStyle), 'solid')
  await toggle.press('Enter')
  assert.match(await first.locator('.dpt-drawer').innerText(), /dsh-powertools-smoke-/)
  if (!desktop) {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    const copy = button('复制路径', first)
    const width = await copy.evaluate(node => node.getBoundingClientRect().width)
    await copy.click()
    const copied = button('已复制路径', first)
    assert.equal(await copied.evaluate(node => node.getBoundingClientRect().width), width)
    await copy.waitFor({ timeout: 4000 })
  }
  await toggle.click()
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false')

  const sessionId = await first.getAttribute('data-session-id')
  assert.ok(sessionId)
  const targetSession = sessionRows.and(page.locator(`[data-session-id="${sessionId}"]`))
  await page.getByRole('searchbox', { name: '搜索会话标题' }).fill('no-matching-powertools-fixture')
  await page.getByText('没有符合条件的会话。', { exact: true }).waitFor()
  await button('重置筛选', mainPanel).click()
  await page.getByRole('searchbox', { name: '搜索会话标题' }).fill(title)
  await page.getByRole('combobox', { name: '工作区', exact: true }).selectOption({ label: '默认工作区' })
  // Resident live session must refuse deletion (409)
  assert.equal(await button(`删除 ${title}`, first).isDisabled(), true)
  assert.equal((await api('sessions', { action: 'delete', sessionId, confirm: sessionId })).status, 409)

  // 1-click inline Archive & Restore directly from the collapsed row without expanding!
  const listTopBefore = await mainPanel.locator('ul.dpt-card').first().evaluate(node => node.getBoundingClientRect().top)
  await first.hover()
  await button(`归档 ${title}`, first).click()
  await toast.getByText('会话已归档', { exact: true }).waitFor()
  await seg('已归档', mainPanel).click()
  await targetSession.waitFor()
  assert.equal(await mainPanel.locator('ul.dpt-card').first().evaluate(node => node.getBoundingClientRect().top), listTopBefore)
  await targetSession.hover()
  await button(`恢复 ${title}`, targetSession).click()
  await toast.getByText('会话已恢复', { exact: true }).waitFor()
  await seg('未归档', mainPanel).click()
  await button('重置筛选', mainPanel).click()

  // Seed persisted parent + 2-level subagents + independent fork + 58 bulk sessions + 8 subagents
  async function findRealSessionArtifact(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const found = await findRealSessionArtifact(full)
        if (found) return found
      } else if (/^session\.v\d+\.jsonl(?:\.zstd?)?$/.test(entry.name)) {
        return full
      }
    }
    return null
  }
  const templateArtifact = await findRealSessionArtifact(path.join(home, 'sessions'))
  assert.ok(templateArtifact, 'expected materialized session artifact under isolated DSH_HOME/sessions')
  const projectSessionsDir = path.dirname(path.dirname(templateArtifact))
  const artifactFileName = path.basename(templateArtifact)
  const rawTemplate = await readFile(templateArtifact)
  const isZstd = artifactFileName.endsWith('.zstd') || artifactFileName.endsWith('.zst')
  const decodedTemplate = (isZstd ? zstdDecompressSync(rawTemplate) : rawTemplate).toString('utf8')
  const templateHeader = JSON.parse(decodedTemplate.split('\n')[0])
  async function seedPersistedSession(id, overrides) {
    const dir = path.join(projectSessionsDir, id)
    await mkdir(dir, { recursive: true })
    const header = { ...templateHeader, id, ...overrides }
    const line = `${JSON.stringify(header)}\n`
    const payload = isZstd
      ? zstdCompressSync(Buffer.from(line), { params: { [zlibConstants.ZSTD_c_checksumFlag]: 1 } })
      : Buffer.from(line)
    await writeFile(path.join(dir, artifactFileName), payload)
    return dir
  }
  const cascadeParentDir = await seedPersistedSession('dpt-cascade-parent', {
    createdAt: Date.now() - 5000, cwd: sessionWorkspace, isSeeded: false, delegationDepth: 0,
  })
  const cascadeSub1Dir = await seedPersistedSession('dpt-cascade-sub1', {
    createdAt: Date.now() - 4000, cwd: sessionWorkspace, parentSession: 'dpt-cascade-parent',
    origin: 'subagent', delegationDepth: 1, agentPreset: 'research', isSeeded: false,
  })
  const cascadeSub2Dir = await seedPersistedSession('dpt-cascade-sub2', {
    createdAt: Date.now() - 3000, cwd: sessionWorkspace, parentSession: 'dpt-cascade-sub1',
    origin: 'subagent', delegationDepth: 2, isSeeded: false,
  })
  const independentForkDir = await seedPersistedSession('dpt-independent-fork', {
    createdAt: Date.now() - 2000, cwd: sessionWorkspace, parentSession: 'dpt-cascade-parent',
    isSeeded: false, delegationDepth: 0,
  })

  await button('刷新会话', mainPanel).click()
  const parentRow = sessionRows.and(page.locator('[data-session-id="dpt-cascade-parent"]'))
  await parentRow.waitFor()
  await parentRow.getByText('2 子会话', { exact: true }).waitFor()
  await parentRow.locator('.dpt-disclosure').click()
  await parentRow.locator('[data-subagent-id="dpt-cascade-sub1"]').waitFor()
  await parentRow.locator('[data-subagent-id="dpt-cascade-sub2"]').waitFor()
  await seg('子 Agent', mainPanel).click()
  await sessionRows.and(page.locator('[data-session-id="dpt-cascade-sub1"]')).waitFor()
  await sessionRows.and(page.locator('[data-session-id="dpt-cascade-sub2"]')).waitFor()
  await seg('未归档', mainPanel).click()

  await button('关联删除（3）', parentRow).click()
  await dialog.getByRole('heading', { name: '将移除' }).waitFor()
  await dialog.getByText(/dpt-cascade-sub1/).waitFor()
  await dialog.getByText(/dpt-cascade-sub2/).waitFor()
  await button('确认关联删除（3 条）', dialog).click()
  await parentRow.waitFor({ state: 'hidden' })
  await toast.getByText(/已关联删除 3 条会话（含 2 条子 Agent）/).waitFor()
  const recoveryBatchDir = await toast.locator('code[dir=ltr]').innerText()
  const recoveryManifest = JSON.parse(await readFile(path.join(recoveryBatchDir, 'manifest.json'), 'utf8'))
  assert.deepEqual(recoveryManifest.items.map(item => item.id).sort(), ['dpt-cascade-parent', 'dpt-cascade-sub1', 'dpt-cascade-sub2'])
  for (const removedDir of [cascadeParentDir, cascadeSub1Dir, cascadeSub2Dir]) {
    await assert.rejects(access(removedDir))
  }
  await access(independentForkDir)
  await sessionRows.and(page.locator('[data-session-id="dpt-independent-fork"]')).waitFor()

  // High-volume seamless infinite scroll (58 extra sessions -> >60 active, initial 50, zero load-more button)
  const bulkDirs = []
  for (let i = 1; i <= 58; i++) {
    const id = `dpt-bulk-${String(i).padStart(2, '0')}`
    bulkDirs.push(await seedPersistedSession(id, {
      createdAt: Date.now() - (60_000 + i * 1000), cwd: sessionWorkspace, isSeeded: false, delegationDepth: 0,
    }))
  }
  for (let s = 1; s <= 8; s++) {
    bulkDirs.push(await seedPersistedSession(`dpt-bulk-01-sub-${s}`, {
      createdAt: Date.now() - (59_000 + s * 100), cwd: sessionWorkspace,
      parentSession: 'dpt-bulk-01', origin: 'subagent', delegationDepth: 1, agentPreset: 'research', isSeeded: false,
    }))
  }
  await button('刷新会话', mainPanel).click()
  await until(async () => await sessionRows.count() === 50, 'infinite scroll initial batch capped at 50')
  assert.equal(await page.getByRole('button', { name: /显示更多/ }).count(), 0)
  // Scroll container down -> IntersectionObserver seamlessly loads remaining rows
  await mainPanel.evaluate(node => { node.scrollTop = node.scrollHeight })
  await until(async () => await sessionRows.count() >= 60, 'infinite scroll automatically loads next batch')
  await mainPanel.evaluate(node => { node.scrollTop = 0 })

  await page.getByRole('combobox', { name: '排序方式' }).selectOption('subagents')
  assert.equal(await sessionRows.first().getAttribute('data-session-id'), 'dpt-bulk-01')
  const bulkLeader = sessionRows.and(page.locator('[data-session-id="dpt-bulk-01"]'))
  await bulkLeader.locator('.dpt-disclosure').click()
  assert.equal(await bulkLeader.locator('li[data-subagent-id]').count(), 6)
  await button('展开全部 8 条', bulkLeader).click()
  assert.equal(await bulkLeader.locator('li[data-subagent-id]').count(), 8)
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme })
    await until(() => page.locator('body').evaluate((node, dark) => node.hasAttribute('data-ds-dark-theme') === dark, scheme === 'dark'), `sessions ${scheme}`)
    await screenshot(`sessions-${scheme}`)
  }
  await button('重置筛选', mainPanel).click()

  // Zero-mode hover checkbox -> floating bottom batch dock (does not shift list top!)
  const topBeforeSelect = await mainPanel.locator('ul.dpt-card').first().evaluate(node => node.getBoundingClientRect().top)
  await sessionRows.first().hover()
  await sessionRows.first().locator('input[type="checkbox"]').check()
  const batchDock = mainPanel.locator('.dpt-floating-batch')
  await batchDock.waitFor()
  assert.equal(await mainPanel.locator('ul.dpt-card').first().evaluate(node => node.getBoundingClientRect().top), topBeforeSelect)
  await batchDock.getByRole('button', { name: /^全选/ }).click()
  await screenshot('sessions-floating-batch')
  await batchDock.getByRole('button', { name: /^删除/ }).click()
  await dialog.getByText(/已自动跳过的 \d+ 条运行中或当前进程打开的会话/).waitFor()
  await dialog.getByRole('button', { name: /^确认批量删除/ }).click()
  await toast.getByText(/已批量清理 67 条会话（含 8 条子 Agent）/).waitFor()
  for (const dir of bulkDirs) await assert.rejects(access(dir))
  await button('关闭提示', toast).click()

  // 1-click Open directly on the collapsed session row!
  await targetSession.hover()
  await button(`打开 ${title}`, targetSession).click()
  await page.getByText('工具箱会话验证 A', { exact: true }).waitFor()
  await checkDraft('模拟慢速并切换会话')
  assert.equal(await readFile(path.join(sessionWorkspace, 'untouched.txt'), 'utf8'), 'keep this workspace file\n')
  console.log('PASS Session segmented views, 1-click inline open/archive/restore, seamless infinite scroll, hover multi-select floating dock, and cascade deletion')

  await button('工具箱').click()
  await button('MCP').click()
  await seg('全部', mainPanel).waitFor()
  async function checkFixedEditor(textarea) {
    const original = await textarea.inputValue()
    await textarea.fill(Array.from({ length: 40 }, (_, i) => `测试滚动 ${i + 1}`).join('\n'))
    assert.deepEqual(await textarea.evaluate(node => {
      const css = getComputedStyle(node)
      return [node.getBoundingClientRect().height, css.resize, css.overflowY, node.scrollHeight > node.clientHeight]
    }), [180, 'none', 'auto', true])
    await textarea.fill(original)
  }
  const mcpRow = name => mainPanel.locator('.dpt-row').filter({ has: button(name) })
  async function addMcp(name, transport, fields) {
    await button('新增服务器').click()
    const editor = mainPanel.locator('.dpt-edit')
    if (transport === 'stdio') {
      await editor.getByLabel('服务器名称').fill(name)
      await editor.getByLabel('可执行文件', { exact: true }).fill(fields.command)
      await editor.getByLabel('启动目录（绝对路径，可选）').fill(fields.cwd)
      for (const arg of fields.args) {
        await button('添加参数', editor).click()
        await editor.getByRole('textbox', { name: /^参数 \d+$/ }).last().fill(arg)
      }
      await button('JSON 录入', editor).click()
      assert.deepEqual(JSON.parse(await editor.getByLabel('MCP JSON').inputValue()).mcpServers[name].args, fields.args)
      await button('表单录入', editor).click()
      assert.deepEqual(await editor.getByRole('textbox', { name: /^参数 \d+$/ }).evaluateAll(nodes => nodes.map(node => node.value)), fields.args)
    } else {
      await button('JSON 录入', editor).click()
      await checkFixedEditor(editor.getByLabel('MCP JSON'))
      await editor.getByLabel('MCP JSON').fill('{')
      await button('表单录入', editor).click()
      await editor.getByText(/JSON 格式无效/).waitFor()
      await editor.getByLabel('MCP JSON').fill(JSON.stringify({ mcpServers: { [name]: { type: 'http', ...fields } } }))
    }
    await button('保存', editor).click()
    await mcpRow(name).waitFor()
    assert.equal(await button(name, mcpRow(name)).getAttribute('aria-expanded'), 'false')
    // 1-click inline Switch enables & disables directly on the row without expanding!
    await mcpRow(name).getByRole('switch', { name: `启用 ${name}` }).click()
    await mcpRow(name).getByText('已连接', { exact: true }).waitFor()
    await button(name, mcpRow(name)).click()
    await button('测试连接', mcpRow(name)).click()
    await toast.getByText(new RegExp(`${name} 测试通过`)).waitFor()
    await button('重连', mcpRow(name)).click()
    await toast.getByText(`${name} 已请求重连`).waitFor()
    await mcpRow(name).getByText('已连接', { exact: true }).waitFor()
    await mcpRow(name).getByRole('switch', { name: `停用 ${name}` }).click()
    await mcpRow(name).getByText('已停用', { exact: true }).waitFor()
  }
  await addMcp('dpt-stdio', 'stdio', { command: process.execPath, cwd,
    args: [path.join(repo, 'tests/fixtures/stdio.mjs'), 'isolated argument with spaces'] })
  await addMcp('dpt-http', 'streamable-http', { url: `http://127.0.0.1:${servicePort}/mcp` })
  const arrows = await mainPanel.locator('.dpt-chevron').evaluateAll(nodes => nodes.map(node => {
    const arrow = node.getBoundingClientRect()
    const rowBox = node.closest('.dpt-row-main').getBoundingClientRect()
    return [Math.round(rowBox.right - arrow.right), Math.round(arrow.right), Math.round(arrow.width)]
  }))
  assert.equal(arrows.length, 3)
  assert.deepEqual(arrows, Array(3).fill([16, arrows[0][1], 20]))
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme })
    await until(() => page.locator('body').evaluate((node, dark) => node.hasAttribute('data-ds-dark-theme') === dark, scheme === 'dark'),
      `native DSH ${scheme} theme`)
    const colors = await mainPanel.locator('.dpt-drawer').first().evaluate(node => {
      const style = getComputedStyle(node)
      return [style.backgroundColor, getComputedStyle(node.closest('.dpt-page')).backgroundColor, style.getPropertyValue('--dpt-module').trim()]
    })
    assert.notEqual(colors[0], colors[1])
    assert.ok(colors[2])
    await screenshot(`mcp-${scheme}`)
  }
  if (!desktop) {
    await page.setViewportSize({ width: 560, height: 800 })
    const frame = page.locator('[data-sidebar-drawer]')
    await frame.waitFor()
    if (await frame.getAttribute('data-sidebar-collapsed') === null) {
      await frame.locator('[data-sidebar-mask]').click({ position: { x: 500, y: 100 } })
    }
    await page.locator('[data-sidebar-drawer][data-sidebar-collapsed]').waitFor()
    await frame.locator('[inert] button[data-sidebar-toggle]').waitFor({ state: 'hidden' })
    await mainPanel.getByRole('heading', { name: '工具箱' }).waitFor()
    assert.equal(await mainPanel.locator('.dpt-page-inner').evaluate(node => getComputedStyle(node).paddingLeft), '20px')
    assert.equal(await mainPanel.evaluate(node => node.scrollWidth <= node.clientWidth), true)
    assert.equal(await mcpRow('dpt-stdio').locator('.dpt-row-summary').evaluate(node => getComputedStyle(node).whiteSpace), 'normal')
    assert.deepEqual(await mcpRow('dpt-stdio').locator('.dpt-drawer').evaluate(node => {
      const style = getComputedStyle(node)
      const actions = node.querySelector('.dpt-actions')
      const last = actions.lastElementChild
      return [style.marginInlineStart, style.paddingInlineStart, Math.round(actions.getBoundingClientRect().right - last.getBoundingClientRect().right)]
    }), ['0px', '12px', 0])
    await screenshot('mcp-narrow')
    await page.setViewportSize({ width: 1280, height: 850 })
    await frame.waitFor({ state: 'detached' })
  }
  console.log('PASS Light and dark layers, aligned disclosure arrows and responsive layout')
  await button('编辑', mcpRow('dpt-http')).click()
  await button('添加请求头', mcpRow('dpt-http')).click()
  await mcpRow('dpt-http').getByLabel('请求头 1 名称').fill('Authorization')
  await mcpRow('dpt-http').getByLabel('请求头 1 值').fill('Bearer ${credential:DEEPSEEK_API_KEY}')
  await button('保存', mcpRow('dpt-http')).click()
  await toast.getByText('服务器配置已更新', { exact: true }).waitFor()
  assert.doesNotMatch(JSON.stringify(await api('mcp', { action: 'list' })), /DEEPSEEK_API_KEY|powertools-fixture-only|127\.0\.0\.1|stdio\.mjs/)
  await button('测试连接', mcpRow('dpt-http')).click()
  await toast.getByText(/dpt-http 测试通过/).waitFor()
  for (const name of ['dpt-http', 'dpt-stdio']) {
    await button('移除', mcpRow(name)).click()
    await dialog.getByRole('heading', { name: '将移除' }).waitFor()
    await dialog.getByRole('heading', { name: '将保留' }).waitFor()
    assert.ok(await dialog.evaluate(node => node.getBoundingClientRect().width <= 480))
    await button('移除服务器', dialog).click()
    await mcpRow(name).waitFor({ state: 'hidden' })
  }
  const issueName = 'dpt-missing-credential'
  const mcpRevision = async () => (await api('mcp', { action: 'list' })).value.revision
  async function changeIssue(action, extra) {
    assert.equal((await api('mcp', { action, name: issueName, revision: await mcpRevision(), ...extra })).status, 200)
  }
  await changeIssue('create', { transport: 'streamable-http', url: `http://127.0.0.1:${servicePort}/mcp`,
    headers: { Authorization: 'Bearer ${credential:DPT_SMOKE_MISSING_CREDENTIAL}' } })
  await mcpRow(issueName).waitFor()
  assert.equal(await button(issueName, mcpRow(issueName)).getAttribute('aria-expanded'), 'false')
  await changeIssue('enable')
  await mcpRow(issueName).getByText('等待凭据', { exact: true }).waitFor()
  assert.equal(await button(issueName, mcpRow(issueName)).getAttribute('aria-expanded'), 'true')
  await mcpRow(issueName).getByText('请在 DSH 中检查此服务器引用的凭据。', { exact: true }).waitFor()
  assert.doesNotMatch(await mcpRow(issueName).locator('.dpt-disclosure').innerText(), /DPT_SMOKE_MISSING_CREDENTIAL/)
  await seg('异常', mainPanel).click()
  await mcpRow(issueName).waitFor()
  await seg('全部', mainPanel).click()
  await changeIssue('remove')
  await mcpRow(issueName).waitFor({ state: 'hidden' })
  // High-volume MCP tool probe & inline tool filter
  const manyName = 'dpt-many-tools'
  assert.equal((await api('mcp', { action: 'create', name: manyName, revision: await mcpRevision(), transport: 'streamable-http', url: `http://127.0.0.1:${servicePort}/mcp-many` })).status, 200)
  await mcpRow(manyName).waitFor()
  await button(manyName, mcpRow(manyName)).click()
  await button('测试连接', mcpRow(manyName)).click()
  await toast.getByText(new RegExp(`${manyName} 测试通过 · 30 个工具`)).waitFor()
  assert.equal(await mcpRow(manyName).locator('.dpt-tool-chip').count(), 24)
  await screenshot('mcp-many-tools')
  await button('展开全部 30 个', mcpRow(manyName)).click()
  assert.equal(await mcpRow(manyName).locator('.dpt-tool-chip').count(), 30)
  await mcpRow(manyName).getByRole('searchbox', { name: `筛选 ${manyName} 工具` }).fill('bulk_tool_29')
  assert.equal(await mcpRow(manyName).locator('.dpt-tool-chip').count(), 1)
  await page.getByRole('searchbox', { name: '搜索 MCP 服务器' }).fill('bulk_tool_15')
  await mcpRow(manyName).waitFor()
  await button('重置筛选', mainPanel).click()
  assert.equal((await api('mcp', { action: 'remove', name: manyName, revision: await mcpRevision() })).status, 200)
  await mcpRow(manyName).waitFor({ state: 'hidden' })
  console.log('PASS MCP segmented status pills, 1-click inline switch, form/JSON round trip, 30-tool cap & inline filter, credential redaction and remove')

  await button('Skill').click()
  await button('导入 Skill').click()
  const importEditor = mainPanel.locator('.dpt-edit')
  await importEditor.getByLabel('来源目录（包含 SKILL.md）').fill(imported)
  await importEditor.getByRole('combobox').selectOption('personal')
  await button('导入', importEditor).click()
  const skill = mainPanel.locator('.dpt-row').filter({ has: button('powertools-smoke-skill') })
  await skill.waitFor()
  // Editable skills surface at the very top of the Skill list before bundled/plugin skills
  assert.match(await mainPanel.locator('ul.dpt-card').first().locator('.dpt-row').first().innerText(), /powertools-smoke-skill/)
  await button('powertools-smoke-skill', skill).click()
  await screenshot('skills-list')
  await button('预览 powertools-smoke-skill').click()
  await skill.locator('pre').filter({ hasText: 'custom-fields' }).waitFor()
  await button('编辑内容与权限', skill).click()
  await checkFixedEditor(skill.getByLabel('正文'))
  await skill.getByLabel('描述').fill('Edited fixture')
  await skill.getByLabel('允许模型调用').uncheck()
  await skill.getByLabel('允许用户手动调用').uncheck()
  await button('保存 Skill', skill).click()
  await skill.getByText('模型停用', { exact: true }).waitFor()
  await skill.getByText('手动停用', { exact: true }).waitFor()
  const localSkill = path.join(home, 'skills', 'powertools-smoke-skill')
  const edited = await readFile(path.join(localSkill, 'SKILL.md'), 'utf8')
  assert.match(edited, /custom-fields:\n  preserve: true/)
  assert.match(edited, /disable-model-invocation: true/)
  assert.match(edited, /user-invocable: false/)
  assert.equal(await readFile(path.join(localSkill, 'resource.txt'), 'utf8'), 'keep this resource\n')
  // Segmented source pills + 1-click inline permission toggle inside drawer without opening form!
  await seg('可编辑', mainPanel).click()
  await page.getByRole('combobox', { name: '调用权限' }).selectOption('restricted')
  await skill.waitFor()
  await button('重置筛选', mainPanel).click()
  await skill.getByLabel('手动调用').check()
  await toast.getByText('powertools-smoke-skill 调用权限已更新', { exact: true }).waitFor()
  assert.equal(await skill.getByText('手动停用', { exact: true }).count(), 0)
  await button('移除', skill).click()
  await dialog.getByRole('heading', { name: '将保留' }).waitFor()
  await button('移除 Skill', dialog).click()
  await skill.waitFor({ state: 'hidden' })
  const recoveredPath = await toast.locator('code[dir=ltr]').innerText()
  assert.equal(await readFile(path.join(recoveredPath, 'powertools-smoke-skill/resource.txt'), 'utf8'), 'keep this resource\n')
  assert.equal(await readFile(path.join(imported, 'resource.txt'), 'utf8'), 'keep this resource\n')
  await button('关闭提示', toast).click()
  console.log('PASS Skill priority ordering, segmented source pills, 1-click inline permission switches, preview/edit, metadata/resource preservation, recoverable remove')
  await button('仓库管理').click()
  await mainPanel.getByText('尚未添加 Skill 仓库。', { exact: true }).waitFor()
  const publicRepository = process.env.DSH_TEST_SKILL_REPOSITORY
  if (publicRepository) {
    const repositoryName = new URL(publicRepository).pathname.slice(1).replace(/\.git$/, '')
    const candidateName = process.env.DSH_TEST_REPOSITORY_SKILL ?? 'skill-creator'
    await mainPanel.getByLabel('GitHub 仓库地址').fill(publicRepository)
    await button('添加仓库').click()
    const repoRow = mainPanel.locator('.dpt-row').filter({ has: button(repositoryName) })
    await repoRow.getByText('已同步', { exact: true }).waitFor({ timeout: 50_000 })
    await mainPanel.getByLabel('仓库 Skill 安装位置').selectOption('personal')
    await mainPanel.getByRole('searchbox', { name: '搜索仓库 Skill' }).fill(candidateName)
    await button(`预览 Skill ${candidateName}`, repoRow).click()
    await repoRow.locator('pre').waitFor()
    await button(`安装 ${candidateName}`, repoRow).click()
    await toast.getByText(`已从仓库安装 ${candidateName}`, { exact: true }).waitFor()
    await button('刷新仓库', repoRow).click()
    await toast.getByText('仓库已同步更新', { exact: true }).waitFor({ timeout: 50_000 })
    await button('移除仓库', repoRow).click()
    await button('确认移除仓库', dialog).click()
    await repoRow.waitFor({ state: 'detached' })
    const installed = await readFile(path.join(home, 'skills', candidateName, 'SKILL.md'), 'utf8')
    assert.match(installed, new RegExp(candidateName))
    console.log('PASS Public repository add, filter, preview, direct install, refresh, and removal preserving the installed skill')
  }
  assert.deepEqual(pageErrors, [])
  console.log(`PASS ${process.platform} ${process.arch} @deepseek-ai/dsh ${expectedVersion} ${profile} profile install and client/Host integration`)
} finally {
  await browser?.close()
  for (const child of processes.reverse()) await stop(child)
  if (process.env.DSH_KEEP_FIXTURES) console.error(`Isolated fixture directory: ${root}`)
  else await rm(root, { recursive: true, force: true })
}
