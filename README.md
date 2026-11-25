# DSH 工具箱

DSH PowerTools 是一个 DeepSeek Harness 插件。通过侧栏「工具箱」或「插件 → DSH 工具箱」管理会话、MCP 和 Skill。发送按钮左边的增强图标可直接改写输入框里的草稿。DSH 可以直接加载本地源码目录。

## 安装

在源码目录安装依赖一次，再用 DSH 的插件命令链接此目录。`index.js` 和 `client.js` 可直接加载。

```sh
npm ci
dsh plugin --profile desktop add "link:$PWD"
```

- **Desktop** 先完成首次启动，再完全退出并执行上述命令，随后重开应用。Desktop 菜单可启用其自带的 `dsh` 命令。
- **Web Profile** 将命令里的 `desktop` 改为 `web`，然后用 `dsh web` 启动或重启。首次运行的预览版说明需要点击「继续」。
- **Windows 路径** 使用完整盘符路径，例如 `dsh plugin --profile desktop add "link:C:\code\dsh-powertools"`。
- **更新** 修改源码后重启对应 DSH 进程即可。移动源码目录后，需要用新路径重新链接。
- **卸载** 在「插件」移除工具箱，或运行 `dsh plugin --profile web remove dsh-powertools`。Desktop 命令将 `web` 改为 `desktop`，并在应用完全退出后执行。MCP 配置和 Skill 都由 DSH 持久化，可以继续在 DSH 中使用。

安装后，从侧栏打开「工具箱」。再切到一个可编辑会话，确认发送按钮左边有同尺寸的纯色圆形增强按钮。Desktop 安装命令及 Profile 隔离见 [DSH Desktop 文档](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.3-alpha.2/apps/desktop/README.zh.md)。

## 验收步骤

1. **布局与无感大数据量浏览** 在侧栏与「插件 → DSH 工具箱」两处入口切换会话、MCP 和 Skill。切换 DSH 亮色和暗色主题，缩窄 Web 窗口。顶栏不展示诊断徽章或版本号噪音，而是由带实时计数的可点击分段标签、搜索框、精简筛选器与静默旋转刷新图标组成；桌面宽度下滚动长列表时顶栏吸顶，滚动触底前通过 `IntersectionObserver` 自动无感加载后续批次（无手动翻页按钮）；操作反馈采用右下角自动淡出的悬浮轻提示，不推挤列表布局。页底「使用与诊断」默认收起，可查看插件版本、宿主能力与 Profile 配置路径。
2. **会话** 在隔离工作区发送一条测试消息，打开「工具箱 → 会话」。通过顶部 `未归档` / `已归档` / `子 Agent` 分段标签直接切换视图并查看对应数量，支持按标题/ID、工作区及排序方式（最近活跃 / 最早创建 / 占用最大 / 子会话最多）检索。悬停任意会话行即可在行尾**一步打开、归档、恢复或删除**；含子 Agent 的主会话在行上显示 `N 子会话` 角标，展开后可查看工作目录与限高折叠的子 Agent 清单。无需切换模式，直接在行首勾选复选框（支持 `Shift` 连选）即在底部浮现悬浮批量操作条，可一键全选、仅选可删项、批量归档恢复或批量关联清理（自动跳过运行中或当前进程持有的会话），将目标会话与所有递归关联子 Agent 一并移至 Profile 下的可恢复目录（含 `manifest.json`）。
3. **MCP** 通过顶部 `全部` / `已连接` / `异常` / `已停用` 分段标签与来源筛选定位服务器，搜索框同时匹配服务器名与已探测工具名。用户配置的服务器可在**行尾开关一步启停**，悬停行尾也可一键触发连接测试。用「表单录入」新增本地 `stdio` 服务器，或用「JSON 录入」粘贴 `streamable-http` / `mcpServers` 配置片段并互相同步。探测工具较多时默认展示前 24 个并提供行内工具名过滤与展开滚动容器。正常和停用条目默认收起，启用后等待凭据等异常默认展开。HTTP 地址通过 DSH 的 `${credential:KEY}` 引用已配置凭据。
4. **Skill** 可编辑的项目与个人 Skill 始终置顶展示，顶部通过 `全部` / `可编辑` / `项目` / `个人` / `只读` 分段标签及调用权限筛选。导入包含 `SKILL.md`、自定义 YAML 字段和随附文件的目录后，展开对应行即可**直接勾选切换「模型调用 / 手动调用」**，或点击预览/编辑修改正文与描述，自定义字段与随附文件完整保留。移除时确认名称并可在悬浮提示中复制恢复目录。打开「仓库管理」添加 GitHub 仓库，支持按安装状态（全部 / 仅未安装 / 已安装）和关键词筛选并无感滚动浏览大量仓库 Skill。
5. **增强** 在会话里输入多行纯文本草稿，点击发送键左边的增强图标。请求期间图标旋转，再点一次可取消。成功后在输入框中检查改写结果，点击撤销图标可恢复原文。分别在请求中继续编辑或切换会话，确认随后返回的结果没有覆盖草稿。确认内容后，手动发送。

## 版本与接口

2026-11-24 核对的两条官方渠道是 **Alpha `0.2.3-alpha.2`** 和 **Stable `0.2.2-rc.5`**。Stable 更新源、官网默认安装包和 npm `latest` 都指向 `0.2.2-rc.5`，其 GitHub Release 及 SemVer 仍为 RC。上游当时没有发现已发布的无预发布后缀版本。参见 [Alpha Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.3-alpha.2)、[RC Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.2-rc.5)、[macOS Stable 更新源](https://download.deepseek.com/dsh-desk/feeds/mac-arm64/stable-mac.yml)、[Windows Stable 更新源](https://download.deepseek.com/dsh-desk/feeds/win-x64/stable.yml)。

`engines.dsh` 精确接受这两个版本。两条目标的 DSH 使用 SemVer `includePrerelease: true`，项目测试另外检查了默认语义，且验证相邻未验证版本被拒绝。未来版本需要重新核对接口后再扩大范围。参见 [Alpha 兼容检查](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.3-alpha.2/packages/boot/app-boot/src/plugin-compatibility.ts) 和 [RC 兼容检查](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.5/packages/boot/app-boot/src/plugin-compatibility.ts)。

| 功能 | 两条发行线共用接口 |
| --- | --- |
| 前端 | `main`、`sidebar.panellist`、`plugins.bundle.config`、`conversation.input.activity`。 |
| 会话 | `sessionPersistence.list()` + `sessions` + `agents` 拉取全量会话（含 `origin: 'subagent'` 与 `parentSession` 关联树）；`open(id, 'write')` 校验单写者租约后按 `location` 关联移入 Profile 恢复目录；Workspace Registry 提供归档、恢复和活动检查 |
| MCP | `mcpManager` 管理连接和探测。`settings.mutate` 按修订号更新 Profile 配置。DSH 解析凭据引用 |
| Skill | `skills` 的发现结果及调用策略。用活动会话的 preset scope 或默认 preset scope 获取目录 |
| 增强 | DSH 所选模型的 `llm.stream`。原生输入编辑器按草稿修订号应用替换和撤销 |

会话列表同时汇总前端 `sessionController` 与宿主 `sessionPersistence.list()`，因此可完整展示所有持久化会话及子 Agent 记录（`origin: 'subagent'`），并按 `parentSession` 递归建立多级关联。删除不写死存储路径：仅在 `location.kind === 'jsonl'`、通过单会话目录安全校验、且对目标及全部关联子 Agent 成功获取并释放 `sessionPersistence.open(id, 'write')` 单写者租约后，才将各会话目录整体移至 `<profileDir>/powertools-session-recovery/` 并写入 `manifest.json`；若会话正在运行、被当前进程打开持有或后端为 SQLite（未暴露单会话文件位置），则明确拒绝并提示原因。独立分支会话（`origin !== 'subagent'`）与工作区文件均受保护。

Magi Code 的会话导航、MCP 表单与 JSON 切换，以及 Skill 仓库与安装库流程用于交互参考。插件使用 DSH 宿主接口。工具箱与常用操作图标沿用 Magi Code 分发的 Lucide 图形，许可证见 `licenses/`。参见 [Magi 设置界面](https://github.com/MistRipple/magi-code/blob/4d5d1b176cbca16489e63e13be7718bb09793414/web/src/components/SettingsPanel.svelte)、[MCP 与 Skill](https://github.com/MistRipple/magi-code/blob/main/crates/magi-api/src/routes/mcp_skills_repos.rs) 和 [会话生命周期](https://github.com/MistRipple/magi-code/blob/main/crates/magi-api/src/routes/sessions.rs)。

## 运行记录

macOS 27.2.1 arm64 上实测两条渠道的官方签名 **Desktop**（内置 DSH 与 pnpm）和 **Web Profile**（官方 `@deepseek-ai/dsh`、Node 26.13.1、Chrome）。macOS 表中结果覆盖两个 Profile，均从 `link:` 加载工具箱 `0.2.0` 源码。测试使用临时 DSH Home、Agents Home 及工作区，使用真实 `stdio` 和 `streamable-http` 传输，模型使用 localhost 上的 Messages API 替身。模型替身验证了请求里只有一条用户草稿和增强系统指令，未验证商业模型的改写质量。

| 平台 × 渠道 | 安装 | Host 和前端加载 | 会话 | MCP | Skill | 增强 |
| --- | --- | --- | --- | --- | --- | --- |
| macOS arm64 · Alpha `0.2.3-alpha.2` | 通过 | 通过 | 全量列表（含子 Agent）、分页、排序、打开、归档恢复、单条与批量关联回收及驻留拦截通过 | 两种传输、工具筛选与凭据脱敏通过 | 置顶排序、筛选、导入、预览、一键编辑、独立权限、仓库安装及回收通过 | 纯色圆形按钮、会话上下文注入、直接替换、撤销、失败和竞态通过 |
| macOS arm64 · Stable `0.2.2-rc.5` | 通过 | 通过 | 全量列表（含子 Agent）、分页、排序、打开、归档恢复、单条与批量关联回收及驻留拦截通过 | 两种传输、工具筛选与凭据脱敏通过 | 置顶排序、筛选、导入、预览、一键编辑、独立权限、仓库安装及回收通过 | 纯色圆形按钮、会话上下文注入、直接替换、撤销、失败和竞态通过 |
| Windows x64 · Alpha `0.2.3-alpha.2` | 未验证 | 未验证 | 未验证 | 未验证 | 未验证 | 未验证 |
| Windows x64 · Stable `0.2.2-rc.5` | 未验证 | 未验证 | 未验证 | 未验证 | 未验证 | 未验证 |

增强回归覆盖亮暗主题下的实心底色、与原生发送键相同的圆形轮廓和尺寸，以及悬停、禁用、加载动画、减少动态效果、直接替换、撤销、取消和过期响应保护。

十二项单元测试通过，包括 Windows 参数分隔、跨平台只读打开标志、MCP 传输切换与凭据响应清理、增强会话上下文提取与最低思考档位选择、全量会话含多级子 Agent 单条与批量关联删除及模型超时。带无预发布后缀的正式版、Windows 和 macOS Intel 实机均未验证。

## 已知限制

- 会话删除采用可恢复回收机制，仅支持 `location.kind === 'jsonl'` 的已落盘且未被占用的会话；正在运行、正被当前 DSH 进程打开持有写句柄、尚未落盘或使用 SQLite 后端的会话会被安全拒绝。删除主会话时会递归关联删除全部 `origin: 'subagent'` 子 Agent 记录，但不会误删独立分支会话或工作区文件。
- 继承和插件注册的 MCP 条目保留来源所有权，可按宿主能力探测和重连。其启停及移除由来源管理。宿主对插件注册项未公开传输方式，工具箱显示「传输方式未公开」。OAuth 授权仍在 DSH 的原生界面处理。新建条目从停用状态开始。
- Skill 写入支持 DSH 发现的标准项目和个人目录。内置、插件、自定义目录及符号链接条目按只读处理。可编辑的文件型 Skill 显示原始 Markdown。只读提供者的预览显示宿主返回的正文。导入只接受常规目录、普通文件及最多 500 项、32 MiB 的目录内容。权限独立保存在 `disable-model-invocation` 和 `user-invocable`，两项关闭的 Skill 仍可在工具箱管理。
- 仓库管理支持 GitHub HTTPS 仓库，需本机 Git 与网络。刷新更新的是仓库目录，已安装的 Skill 是独立副本。
- 增强复用当前会话正在使用的主对话模型（未初始化时回退到 DSH 默认模型），优先通过 `llm.prepareCall` 选择该路由的最低思考档位以降低延迟。支持 32 KiB 内的纯文本草稿；带原生内联引用、引用块或斜线指令的草稿不可增强。改写请求只把当前草稿作为唯一用户消息发送，同时按严格字数上限（最多最近 6 条纯文本对话、总计 ≤ 3.2 KiB 及非默认工作区名称/目录）将只读 `<session_context>` 放入系统指令用于消解指代，不包含思考过程、工具输出、附件或工具定义。模型请求上限 45 秒。自动替换前会核对会话及原生草稿修订号；撤销按钮提示实际使用的模型与参考上下文条数，用户继续编辑后可使用原生编辑器的撤销历史。

## 从源码重现

需要满足目标 DSH 的 Node 版本要求，测试通过的版本是 Node `26.13.1`。Web Profile 安装另需 `pnpm`。端到端测试使用本机 Chrome，可通过 `DSH_CHROME_CHANNEL` 改用已安装的其他 Chromium 渠道。

```sh
npm ci
npm test
npm run smoke -- /absolute/path/to/dsh/lib/bin.js 0.2.3-alpha.2
npm run smoke -- /absolute/path/to/dsh/lib/bin.js 0.2.2-rc.5
```

每个 `smoke` 参数中的路径应指向对应 npm 安装的 `@deepseek-ai/dsh` CLI，测试会核对声明的实际版本、把源码链接到新 Profile 并运行本地隔离夹具。可设 `DSH_KEEP_FIXTURES=1` 保留测试数据以定位问题。

设置 `DSH_SMOKE_ENHANCE_ONLY=1` 可单独运行增强回归。

macOS 的 Desktop 测试可指定官方 `.app` 路径和其中自带的 `dsh` 命令。测试单独创建 Electron 用户数据与 Desktop Profile。

```sh
DSH_DESKTOP_APP="/Applications/DeepSeek Harness.app" npm run smoke -- \
  "/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" 0.2.3-alpha.2
```
