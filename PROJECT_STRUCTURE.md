# Project Structure

```
codex-switch/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI configuration
├── codex-switch.py             # Python version (recommended)
├── codex-switch.js             # JavaScript version (Node.js 18+)
├── test.py                     # Python test suite
├── test.js                     # JavaScript test suite
├── package.json                # NPM package configuration
├── LICENSE                     # MIT License
├── README.md                   # English documentation
├── README_ZH.md                # Chinese documentation
├── CHANGELOG.md                # Version history
├── CONTRIBUTING.md             # Contribution guidelines
└── .gitignore                  # Git ignore rules
```

## File Descriptions

### Core Files

- **codex-switch.py** (11KB) **[Recommended]**
  - Python implementation
  - No dependencies required (uses standard library)
  - Works with Python 3.6+
  - ~300 lines of clean code

- **codex-switch.js** (10KB)
  - JavaScript implementation
  - Requires Node.js 18+
  - Uses ES6+ modules
  - ~300 lines of clean code

### Test Files

- **test.py** (5KB)
  - Python test suite
  - 12 test cases covering all features
  - Validates environment, commands, and functionality

- **test.js** (4.7KB)
  - JavaScript test suite
  - 11 test cases covering all features
  - Validates environment, commands, and functionality

### Configuration

- **package.json**
  - NPM package metadata
  - Scripts: `test`, `status`
  - Bin entry: `codex-switch`
  - Node.js 18+ requirement

- **.gitignore**
  - Standard Node.js ignore patterns
  - IDE and OS-specific files

### Documentation

- **README.md** (English)
  - Quick start guide
  - Usage examples
  - Feature comparison
  - Performance metrics

- **README_ZH.md** (Chinese)
  - Complete Chinese translation
  - Same structure as English version

- **CHANGELOG.md**
  - Version history
  - Release notes
  - Breaking changes

- **CONTRIBUTING.md**
  - Contribution guidelines
  - Code style guide
  - Development setup

- **LICENSE**
  - MIT License
  - Open source friendly

### CI/CD

- **.github/workflows/ci.yml**
  - GitHub Actions workflow
  - Multi-OS testing (Ubuntu, Windows, macOS)
  - Multi-version Node.js (18.x, 20.x, 22.x)

## Key Features

### 1. Single File Implementation
- All functionality in one file
- No external dependencies
- Easy to understand and modify

### 2. Comprehensive Testing
- 11 test cases
- 100% pass rate
- Real environment validation

### 3. Multi-language Support
- English and Chinese documentation
- Localized help messages
- International community friendly

### 4. Production Ready
- CI/CD pipeline
- Semantic versioning
- Clear contribution guidelines

## Development Workflow

```bash
# Clone and setup
git clone <repo-url>
cd codex-switch

# Run tests
npm test

# Check status
npm run status

# Use the tool
node codex-switch.js <provider>
```

## Publishing to NPM

```bash
# Login to NPM
npm login

# Publish
npm publish
```

## GitHub Release

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit changes
4. Create tag: `git tag v1.0.0`
5. Push: `git push --tags`
6. Create GitHub release

## Maintenance

- Keep dependencies minimal
- Maintain test coverage
- Update documentation
- Follow semantic versioning
- Respond to issues promptly
