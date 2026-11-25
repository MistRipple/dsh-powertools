**插件地址 / Plugin link**

`dsh-powertools` — https://github.com/MistRipple/dsh-powertools

**简短说明 / Summary**

一个侧栏「工具箱」面板，把会话、MCP 和 Skill 的日常管理集中到一处：会话可检索、按父子 Agent 关联、归档恢复与可恢复批量清理；MCP 服务器可在行尾一步启停、连接测试、表单或 JSON 录入；Skill 可导入、预览、编辑，并直接切换「模型调用 / 手动调用」。另外提供发送按钮左边的草稿增强按钮，改写结果直接替换输入框内容并支持撤销。

One sidebar toolbox for DSH: browse and archive sessions (including subagent trees), toggle MCP servers, import and edit skills, and rewrite composer drafts with undo.

**补充信息 / Additional details**

- Logo: https://github.com/MistRipple/dsh-powertools/blob/main/icon.svg
- 已验证 DSH：0.2.3-alpha.2 与 0.2.2-rc.5（macOS Desktop 与 Web Profile）
- 许可证：MIT
- npm：`dsh-powertools@0.2.0`
- `engines.dsh`：`0.2.3-alpha.2 || 0.2.2-rc.5`
- 插件本身不主动联网。只有用户在界面里操作时才会访问网络或读写文件：MCP 连接测试与工具探测走用户已配置的服务器；Skill 仓库管理会拉取用户添加的 GitHub 仓库；草稿增强调用 DSH 当前所选模型。
- 会话删除只在后端为 `jsonl` 且成功取得单写者租约时，把会话目录移到 Profile 下的 `powertools-session-recovery/` 并写 `manifest.json`，可恢复；运行中或当前进程持有的会话会被拒绝。
- MCP 配置中的凭据通过 DSH 的 `${credential:KEY}` 引用，列表接口不会返回密钥原文。
