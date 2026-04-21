# Codex Provider Switch

[English](README_EN.md) | [中文](README.md)

🚀 **一键切换 Codex Provider 并自动同步所有会话**

一个轻量级工具，用于快速切换不同的 Codex 模型提供商，同时确保所有聊天会话保持可访问。

**整合 [codex-provider-sync](https://github.com/Dailin521/codex-provider-sync) 提供完整的同步能力！**

## ✨ 功能特点

- ✅ 自动识别当前 provider
- ✅ 一键切换到目标 provider
- ✅ **同步 Rollout 文件和 SQLite 数据库**（完整同步！）
- ✅ 自动备份，支持回滚
- ✅ 实时验证同步结果
- ✅ 彩色终端输出，清晰易读
- ✅ 处理锁定文件
- ✅ **Python 版本** - 无需任何依赖！
- ✅ **JavaScript 版本** - 整合 codex-provider-sync

## 🚀 快速开始

### 前置要求

JavaScript 版本需要先安装 `codex-provider-sync`：

```bash
npm install -g github:Dailin521/codex-provider-sync
```

### JavaScript 版本（推荐）

```bash
# 克隆仓库
git clone https://github.com/yourusername/codex-switch.git
cd codex-switch

# 查看状态
node codex-switch.js status

# 切换 provider
node codex-switch.js xxxx

# 仅同步（不修改 config.toml）
node codex-switch.js sync
node codex-switch.js sync xxxx
```

### Python 版本

```bash
# 添加执行权限
chmod +x codex-switch.py

# 查看状态
python codex-switch.py status

# 切换 provider
python codex-switch.py xxxx
```

## 📖 使用说明

### 查看当前状态

**JavaScript：**
```bash
node codex-switch.js status
```

**Python：**
```bash
python codex-switch.py status
```

**输出示例：**
```
============================================================
Codex Provider Status
============================================================
ℹ Codex Home: C:\Users\xxx\.codex
ℹ Current Provider: openai
ℹ Configured Providers: openai, xxxx

📊 Rollout Files:
  ● openai: 68 sessions

💿 SQLite Database:
  ● openai: 68 sessions

✅ Rollout files and SQLite are in sync.
```

### 切换 Provider

**JavaScript：**
```bash
node codex-switch.js <provider-name>
```

**Python：**
```bash
python codex-switch.py <provider-name>
```

**执行流程：**
1. 修改 config.toml
2. 同步所有 Rollout 文件
3. 同步 SQLite 数据库
4. 自动备份
5. 验证结果

### 仅同步（不修改 config.toml）

**JavaScript：**
```bash
node codex-switch.js sync
node codex-switch.js sync <provider-name>
```

**Python：**
```bash
python codex-switch.py <provider-name> --no-config
```

## 🔧 工作原理

### JavaScript 版本（完整同步）

JavaScript 版本整合了 [codex-provider-sync](https://github.com/Dailin521/codex-provider-sync)，提供完整的同步能力：

1. **Rollout 文件同步**
   - 修改 `.jsonl` 文件的第一行元数据
   - 更新 `payload.model_provider` 字段

2. **SQLite 数据库同步**
   - 更新 `state_5.sqlite` 中的 provider 元数据
   - 确保数据库和文件保持一致

3. **自动备份**
   - 每次操作前自动备份到 `~/.codex/backups_state/provider-sync/`
   - 默认保留最近 5 份备份
   - 支持回滚恢复

### Python 版本（轻量级）

Python 版本直接修改文件内容，适合快速操作和无 Node.js 环境：

```python
# 修改会话文件的第一行
first_line = json.loads(lines[0])
first_line['payload']['model_provider'] = target_provider
lines[0] = json.dumps(first_line)
```

**特点**：
- ✅ 无需任何依赖（仅使用 Python 标准库）
- ✅ 快速启动，适合脚本化
- ✅ 跨平台兼容
- ⚠️ 只处理 Rollout 文件，不处理 SQLite 数据库
- ⚠️ 无自动备份功能

**适用场景**：
- 没有 Node.js 环境
- 需要快速脚本化操作
- 只需要基本的 provider 切换功能
- 可以接受手动处理 SQLite 数据库

## 📊 性能

快速高效：
- 扫描 65 个会话：~200ms
- 修改 18 个文件：~50ms
- 总操作时间：~250ms

## 🧪 测试

**Python：**
```bash
python test.py
```

**JavaScript：**
```bash
node test.js
```

**测试覆盖：**
- ✅ 环境检查
- ✅ status 命令输出
- ✅ 配置文件解析
- ✅ 会话文件扫描
- ✅ 帮助信息显示

## 📋 环境要求

**JavaScript 版本：**
- Node.js 18+
- codex-provider-sync（全局安装）
  ```bash
  npm install -g github:Dailin521/codex-provider-sync
  ```

**Python 版本：**
- Python 3.6+
- 无需外部依赖（仅使用标准库）

**两个版本都需要：**
- 标准 `~/.codex` 目录结构
- Windows / Linux / macOS

## 💡 版本选择

### 推荐使用 JavaScript 版本

如果你有 Node.js 环境，**强烈推荐使用 JavaScript 版本**：

- ✅ **完整同步**：同时处理 Rollout 文件和 SQLite 数据库
- ✅ **自动备份**：每次操作前自动备份，支持回滚
- ✅ **更可靠**：基于成熟的 codex-provider-sync 工具
- ✅ **数据一致性**：确保所有会话在切换后都可见

### Python 版本适用场景

在以下情况下使用 Python 版本：

- ❌ 没有 Node.js 环境
- ✅ 需要快速脚本化操作
- ✅ 只需要基本的 provider 切换
- ⚠️ 可以接受只同步 Rollout 文件（可能需要手动处理 SQLite）

### 对比表格

| 特性 | JavaScript 版本 | Python 版本 |
|------|----------------|-------------|
| Rollout 文件同步 | ✅ | ✅ |
| SQLite 数据库同步 | ✅ | ❌ |
| 自动备份 | ✅ | ❌ |
| 回滚支持 | ✅ | ❌ |
| 依赖 | Node.js + codex-provider-sync | 仅 Python 3.6+ |
| 可靠性 | 高 | 中等 |
| 启动速度 | 中等 | 快 |

### 为什么 Python 版本不更新？

1. **保持轻量级**：Python 版本的核心价值是无依赖、快速启动
2. **codex-provider-sync 是 Node.js 工具**：无法在纯 Python 环境中使用
3. **不同的使用场景**：两个版本服务于不同的用户需求

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 📄 许可证

MIT

## 💡 为什么提供两个版本？

- **JavaScript**：完整同步（Rollout + SQLite），自动备份，更可靠，推荐使用
- **Python**：快速操作，仅处理 Rollout 文件，无需额外依赖

选择最适合你工作流程的版本！

## 📝 更新日志

### V2.0.0 (2026-04-21)

- ✨ JavaScript 版本整合 codex-provider-sync
- ✨ 同时处理 Rollout 文件和 SQLite 数据库
- ✨ 自动备份和回滚支持
- ✨ 新增 `sync` 命令（仅同步，不修改 config.toml）
- 📝 更新文档和使用说明

### V1.0.0 (2026-04-20)

- 🎉 初始版本
- ✨ 支持切换 provider
- ✨ 同步 Rollout 文件
- ✨ Python 和 JavaScript 双版本
