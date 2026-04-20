# Codex Provider Switch

[English](README_EN.md) | [中文](README.md)

🚀 **一键切换 Codex Provider 并自动同步所有会话**

一个轻量级工具，用于快速切换不同的 Codex 模型提供商，同时确保所有聊天会话保持可访问。

**同时提供 Python 和 JavaScript 版本！**

## ✨ 功能特点

- ✅ 自动识别当前 provider
- ✅ 一键切换到目标 provider
- ✅ 自动同步所有会话文件（包括被锁定的文件）
- ✅ 实时验证同步结果
- ✅ 彩色终端输出，清晰易读
- ✅ 支持详细日志模式
- ✅ **Python 版本** - 无需任何依赖！
- ✅ **JavaScript 版本** - 适合 Node.js 用户

## 🚀 快速开始

### Python 版本（推荐）

```bash
# 克隆仓库
git clone https://github.com/yourusername/codex-switch.git
cd codex-switch

# 添加执行权限
chmod +x codex-switch.py

# 查看状态
python codex-switch.py status

# 切换 provider
python codex-switch.py xxxx
```

### JavaScript 版本

```bash
# 需要 Node.js 18+
node codex-switch.js status
node codex-switch.js xxxx
```

## 📖 使用说明

### 查看当前状态

**Python：**
```bash
python codex-switch.py status
```

**JavaScript：**
```bash
node codex-switch.js status
```

**输出示例：**
```
============================================================
Codex Provider 状态
============================================================
ℹ Codex Home: C:\Users\xxx\.codex
ℹ 当前 Provider: xxxx
ℹ 配置的 Providers: openai, xxxx

会话分布:
  ● xxxx: 45 个会话
  ○ openai: 18 个会话
```

### 切换 Provider

**Python：**
```bash
python codex-switch.py <provider-name>
```

**JavaScript：**
```bash
node codex-switch.js <provider-name>
```

**执行流程：**
1. 扫描所有会话文件
2. 更新 config.toml
3. 同步所有会话到新 provider
4. 验证结果

### 高级选项

**Python：**
```bash
# 详细模式（显示详细日志）
python codex-switch.py xxxx --verbose

# 只同步（不修改 config.toml）
python codex-switch.py xxxx --no-config

# 显示帮助
python codex-switch.py help
```

**JavaScript：**
```bash
# 详细模式
node codex-switch.js xxxx --verbose

# 只同步
node codex-switch.js xxxx --no-config

# 显示帮助
node codex-switch.js help
```

## 🔧 工作原理

### 会话文件格式

每个会话文件（`.jsonl`）的第一行包含元数据：

```json
{
  "timestamp": "2026-04-20T08:42:53.000Z",
  "type": "session_meta",
  "payload": {
    "id": "...",
    "model_provider": "openai",
    ...
  }
}
```

工具会修改 `payload.model_provider` 字段来切换 provider。

### 处理被锁定文件

工具直接修改文件内容，即使文件正在被 Codex 使用也能处理。这确保了所有会话都能在一次运行中完成同步。

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

**Python 版本：**
- Python 3.6+
- 无需外部依赖（仅使用标准库）

**JavaScript 版本：**
- Node.js 18+
- 无需外部依赖

**两个版本都需要：**
- 标准 `~/.codex` 目录结构
- Windows / Linux / macOS

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 📄 许可证

MIT

## 💡 为什么提供两个版本？

- **Python**：更通用，无依赖，开箱即用
- **JavaScript**：适合已在 Node.js 生态的用户

选择最适合你工作流程的版本！
