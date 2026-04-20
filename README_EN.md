# Codex Provider Switch

[English](README_EN.md) | [中文](README.md)

🚀 **One-click switch Codex Provider and automatically sync all sessions**

A lightweight tool for quickly switching between different Codex model providers while ensuring all your chat sessions remain accessible.

**Available in both Python and JavaScript!**

## ✨ Features

- ✅ Automatic detection of current provider
- ✅ One-click switch to target provider
- ✅ Automatic sync of all session files (including locked files)
- ✅ Real-time verification of sync results
- ✅ Colorful terminal output for better readability
- ✅ Verbose mode for detailed logging
- ✅ **Python version** - No dependencies required!
- ✅ **JavaScript version** - For Node.js users

## 🚀 Quick Start

### Python Version (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/codex-switch.git
cd codex-switch

# Make executable
chmod +x codex-switch.py

# Check status
python codex-switch.py status

# Switch provider
python codex-switch.py yunyi
```

### JavaScript Version

```bash
# Requires Node.js 18+
node codex-switch.js status
node codex-switch.js yunyi
```

## 📖 Usage

### View Current Status

**Python:**
```bash
python codex-switch.py status
```

**JavaScript:**
```bash
node codex-switch.js status
```

**Output:**
```
============================================================
Codex Provider Status
============================================================
ℹ Codex Home: C:\Users\xxx\.codex
ℹ Current Provider: yunyi
ℹ Configured Providers: openai, yunyi

Session Distribution:
  ● yunyi: 45 sessions
  ○ openai: 18 sessions
```

### Switch Provider

**Python:**
```bash
python codex-switch.py <provider-name>
```

**JavaScript:**
```bash
node codex-switch.js <provider-name>
```

**Process:**
1. Scan all session files
2. Update config.toml
3. Sync all sessions to new provider
4. Verify results

### Advanced Options

**Python:**
```bash
# Verbose mode (show detailed logs)
python codex-switch.py yunyi --verbose

# Sync only (don't modify config.toml)
python codex-switch.py yunyi --no-config

# Show help
python codex-switch.py help
```

**JavaScript:**
```bash
# Verbose mode
node codex-switch.js yunyi --verbose

# Sync only
node codex-switch.js yunyi --no-config

# Show help
node codex-switch.js help
```

## 🔧 How It Works

### Session File Format

Each session file (`.jsonl`) contains metadata in the first line:

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

The tool modifies the `payload.model_provider` field to switch providers.

### Handling Locked Files

The tool directly modifies file contents, allowing it to process files even when they're in use by Codex. This ensures all sessions are synced in a single run.

## 📊 Performance

Fast and efficient:
- Scans 65 sessions in ~200ms
- Modifies 18 files in ~50ms
- Total operation time ~250ms

## 🧪 Testing

**Python:**
```bash
python test.py
```

**JavaScript:**
```bash
node test.js
```

**Test Coverage:**
- ✅ Environment checks
- ✅ Status command output
- ✅ Config file parsing
- ✅ Session file scanning
- ✅ Help information display

## 📋 Requirements

**Python Version:**
- Python 3.6+
- No external dependencies (uses standard library only)

**JavaScript Version:**
- Node.js 18+
- No external dependencies

**Both versions require:**
- Standard `~/.codex` directory structure
- Windows / Linux / macOS

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT

## 💡 Why Two Versions?

- **Python**: More universal, no dependencies, works out of the box
- **JavaScript**: For users already in Node.js ecosystem

Choose whichever fits your workflow better!
