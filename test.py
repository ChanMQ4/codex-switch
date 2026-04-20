#!/usr/bin/env python3
"""
Codex Provider Switch - Test Suite
Comprehensive tests for all functionality
"""

import os
import sys
import subprocess
from pathlib import Path

# Terminal colors
class Colors:
    RESET = '\033[0m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    RED = '\033[31m'
    CYAN = '\033[36m'
    BOLD = '\033[1m'

def log(message: str, color: str = Colors.RESET):
    print(f"{color}{message}{Colors.RESET}")

def log_test(name: str):
    log(f"\n{'=' * 60}", Colors.BOLD)
    log(f"Test: {name}", Colors.BOLD)
    log('=' * 60, Colors.BOLD)

def log_pass(message: str):
    log(f"✓ PASS: {message}", Colors.GREEN)

def log_fail(message: str):
    log(f"✗ FAIL: {message}", Colors.RED)

def log_info(message: str):
    log(f"ℹ {message}", Colors.CYAN)

pass_count = 0
fail_count = 0

def assert_test(condition: bool, message: str):
    global pass_count, fail_count
    if condition:
        log_pass(message)
        pass_count += 1
    else:
        log_fail(message)
        fail_count += 1

# Test 1: Check environment
log_test('Environment Check')

CODEX_HOME = os.environ.get('CODEX_HOME') or os.path.join(os.path.expanduser('~'), '.codex')
CONFIG_PATH = os.path.join(CODEX_HOME, 'config.toml')
SESSIONS_DIR = os.path.join(CODEX_HOME, 'sessions')

assert_test(os.path.exists(CODEX_HOME), f"Codex Home exists: {CODEX_HOME}")
assert_test(os.path.exists(CONFIG_PATH), f"Config file exists: {CONFIG_PATH}")
assert_test(os.path.exists(SESSIONS_DIR), f"Sessions directory exists: {SESSIONS_DIR}")

# Test 2: Status command
log_test('Status Command')

try:
    result = subprocess.run(
        [sys.executable, 'codex-switch.py', 'status'],
        capture_output=True,
        text=True,
        timeout=10
    )
    output = result.stdout
    assert_test('Codex Provider Status' in output, 'Status command output is correct')
    assert_test('Current Provider' in output, 'Shows current provider')
    assert_test('Session Distribution' in output, 'Shows session distribution')
    log_info('Output preview:\n' + '\n'.join(output.split('\n')[:10]))
except Exception as e:
    log_fail(f"Status command failed: {e}")
    fail_count += 1

# Test 3: Read current config
log_test('Read Current Config')

try:
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
        import re
        match = re.search(r'model_provider\s*=\s*"([^"]+)"', content)
        current_provider = match.group(1) if match else None

    assert_test(current_provider is not None, f"Successfully read current provider: {current_provider}")

    providers = re.findall(r'\[model_providers\.([^\]]+)\]', content)
    assert_test(len(providers) > 0, f"Found {len(providers)} configured providers: {', '.join(providers)}")
except Exception as e:
    log_fail(f"Failed to read config: {e}")
    fail_count += 1

# Test 4: Scan session files
log_test('Scan Session Files')

try:
    import glob
    pattern = os.path.join(SESSIONS_DIR, '**', '*.jsonl')
    files = glob.glob(pattern, recursive=True)

    provider_counts = {}
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                first_line = f.readline()
                if '"model_provider"' in first_line:
                    match = re.search(r'"model_provider":"([^"]+)"', first_line)
                    if match:
                        provider = match.group(1)
                        provider_counts[provider] = provider_counts.get(provider, 0) + 1
        except Exception:
            continue

    total_sessions = sum(provider_counts.values())
    assert_test(total_sessions > 0, f"Found {total_sessions} sessions")

    for provider, count in provider_counts.items():
        log_info(f"  {provider}: {count} sessions")
except Exception as e:
    log_fail(f"Failed to scan sessions: {e}")
    fail_count += 1

# Test 5: Help information
log_test('Help Information')

try:
    result = subprocess.run(
        [sys.executable, 'codex-switch.py', 'help'],
        capture_output=True,
        text=True,
        timeout=10
    )
    output = result.stdout
    assert_test('Usage' in output, 'Shows usage information')
    assert_test('Examples' in output, 'Shows examples')
except Exception as e:
    log_fail(f"Help command failed: {e}")
    fail_count += 1

# Test 6: Python version check
log_test('Python Version Check')

python_version = sys.version_info
assert_test(python_version >= (3, 6), f"Python version is 3.6+: {python_version.major}.{python_version.minor}")

# Test summary
log('\n' + '=' * 60, Colors.BOLD)
log('Test Summary', Colors.BOLD)
log('=' * 60, Colors.BOLD)

log(f"\nPassed: {pass_count}", Colors.GREEN)
log(f"Failed: {fail_count}", Colors.RED if fail_count > 0 else Colors.RESET)
log(f"Total: {pass_count + fail_count}\n")

if fail_count == 0:
    log('🎉 All tests passed!', Colors.GREEN)
    sys.exit(0)
else:
    log('⚠️  Some tests failed', Colors.YELLOW)
    sys.exit(1)
