#!/usr/bin/env python3
"""
Codex Provider Switch Tool
A lightweight tool for switching Codex providers and syncing all sessions
"""

import os
import sys
import json
import re
import glob
from pathlib import Path
from typing import Dict, List, Optional

# Configuration
CODEX_HOME = os.environ.get('CODEX_HOME') or os.path.join(os.path.expanduser('~'), '.codex')
CONFIG_PATH = os.path.join(CODEX_HOME, 'config.toml')
SESSIONS_DIR = os.path.join(CODEX_HOME, 'sessions')

# Terminal colors
class Colors:
    RESET = '\033[0m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    RED = '\033[31m'
    CYAN = '\033[36m'
    BOLD = '\033[1m'

def log(message: str, color: str = Colors.RESET):
    """Print colored message"""
    print(f"{color}{message}{Colors.RESET}")

def log_success(message: str):
    log(f"✓ {message}", Colors.GREEN)

def log_warning(message: str):
    log(f"⚠ {message}", Colors.YELLOW)

def log_error(message: str):
    log(f"✗ {message}", Colors.RED)

def log_info(message: str):
    log(f"ℹ {message}", Colors.CYAN)

def get_current_provider() -> Optional[str]:
    """Read current provider from config.toml"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
            match = re.search(r'model_provider\s*=\s*"([^"]+)"', content)
            return match.group(1) if match else None
    except Exception as e:
        log_error(f"Failed to read config file: {e}")
        return None

def get_configured_providers() -> List[str]:
    """Get all configured providers"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
            providers = re.findall(r'\[model_providers\.([^\]]+)\]', content)
            return providers
    except Exception as e:
        log_error(f"Failed to read config file: {e}")
        return []

def scan_session_providers() -> Dict[str, int]:
    """Scan all session files and count providers"""
    provider_counts = {}

    try:
        # Find all .jsonl files
        pattern = os.path.join(SESSIONS_DIR, '**', '*.jsonl')
        files = glob.glob(pattern, recursive=True)

        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    first_line = f.readline()
                    if '"model_provider"' in first_line:
                        match = re.search(r'"model_provider"\s*:\s*"([^"]+)"', first_line)
                        if match:
                            provider = match.group(1)
                            provider_counts[provider] = provider_counts.get(provider, 0) + 1
            except Exception:
                continue

    except Exception as e:
        log_warning(f"Error scanning session files: {e}")

    return provider_counts

def find_sessions_by_provider(provider: str) -> List[str]:
    """Find all session files for a specific provider"""
    files = []

    try:
        pattern = os.path.join(SESSIONS_DIR, '**', '*.jsonl')
        all_files = glob.glob(pattern, recursive=True)

        for file_path in all_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    first_line = f.readline()
                    if f'"model_provider"' in first_line:
                        match = re.search(r'"model_provider"\s*:\s*"([^"]+)"', first_line)
                        if match and match.group(1) == provider:
                            files.append(file_path)
            except Exception:
                continue

    except Exception as e:
        log_warning(f"Error finding session files: {e}")

    return files

def update_session_provider(file_path: str, target_provider: str) -> dict:
    """Update provider in a session file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')

        if not lines or '"model_provider"' not in lines[0]:
            return {'success': False, 'reason': 'no_provider_field'}

        first_line = json.loads(lines[0])
        current_provider = first_line.get('payload', {}).get('model_provider')

        if current_provider == target_provider:
            return {'success': True, 'skipped': True, 'current_provider': current_provider}

        first_line['payload']['model_provider'] = target_provider
        lines[0] = json.dumps(first_line)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        return {'success': True, 'skipped': False, 'current_provider': current_provider}

    except Exception as e:
        return {'success': False, 'reason': str(e)}

def switch_config_provider(target_provider: str) -> bool:
    """Switch provider in config.toml"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if provider exists
        if f'[model_providers.{target_provider}]' not in content:
            log_error(f'Provider "{target_provider}" is not configured in config.toml')
            return False

        # Replace model_provider
        content = re.sub(
            r'model_provider\s*=\s*"[^"]+"',
            f'model_provider = "{target_provider}"',
            content
        )

        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            f.write(content)

        return True

    except Exception as e:
        log_error(f"Failed to modify config file: {e}")
        return False

def show_status():
    """Show current status"""
    log('\n' + '=' * 60, Colors.BOLD)
    log('Codex Provider Status', Colors.BOLD)
    log('=' * 60, Colors.BOLD)

    current_provider = get_current_provider()
    configured_providers = get_configured_providers()
    provider_counts = scan_session_providers()

    log_info(f"Codex Home: {CODEX_HOME}")
    log_info(f"Current Provider: {current_provider or '(not set)'}")
    log_info(f"Configured Providers: {', '.join(configured_providers)}")

    log('\nSession Distribution:', Colors.BOLD)
    for provider, count in provider_counts.items():
        marker = '●' if provider == current_provider else '○'
        print(f"  {marker} {provider}: {count} sessions")

    print()

def switch_and_sync(target_provider: str, skip_config: bool = False, verbose: bool = False):
    """Switch and sync"""
    log('\n' + '=' * 60, Colors.BOLD)
    log(f'Switching to Provider: {target_provider}', Colors.BOLD)
    log('=' * 60, Colors.BOLD)

    current_provider = get_current_provider()
    log_info(f"Current Provider: {current_provider}")

    # Step 1: Scan current state
    log('\n[1/4] Scanning session files...', Colors.CYAN)
    provider_counts = scan_session_providers()
    total_sessions = sum(provider_counts.values())
    log_info(f"Found {total_sessions} sessions")
    for provider, count in provider_counts.items():
        print(f"  - {provider}: {count} sessions")

    # Step 2: Update config
    if not skip_config:
        log('\n[2/4] Updating config.toml...', Colors.CYAN)
        if switch_config_provider(target_provider):
            log_success(f"Switched to {target_provider}")
        else:
            return False
    else:
        log('\n[2/4] Skipping config update', Colors.YELLOW)

    # Step 3: Sync session files
    log('\n[3/4] Syncing session files...', Colors.CYAN)
    success_count = 0
    skipped_count = 0
    fail_count = 0

    for provider, count in provider_counts.items():
        if provider == target_provider:
            skipped_count += count
            continue

        log_info(f"Processing {count} sessions from {provider}...")
        files = find_sessions_by_provider(provider)

        for file_path in files:
            result = update_session_provider(file_path, target_provider)
            if result['success']:
                if result['skipped']:
                    skipped_count += 1
                else:
                    success_count += 1
                    if verbose:
                        filename = os.path.basename(file_path)
                        print(f"  ✓ {filename} ({result['current_provider']} → {target_provider})")
            else:
                fail_count += 1
                if verbose:
                    filename = os.path.basename(file_path)
                    print(f"  ✗ {filename} ({result['reason']})")

    log_success(f"Success: {success_count}, Skipped: {skipped_count}, Failed: {fail_count}")

    # Step 4: Verify results
    log('\n[4/4] Verifying sync results...', Colors.CYAN)
    new_provider_counts = scan_session_providers()
    new_total = sum(new_provider_counts.values())

    if new_provider_counts.get(target_provider, 0) == total_sessions:
        log_success(f"All {total_sessions} sessions synced to {target_provider}")
    else:
        log_warning(f"After sync: {target_provider} has {new_provider_counts.get(target_provider, 0)} sessions (expected {total_sessions})")

    log('\nFinal Distribution:', Colors.BOLD)
    for provider, count in new_provider_counts.items():
        marker = '●' if provider == target_provider else '○'
        print(f"  {marker} {provider}: {count} sessions")

    log('\n' + '=' * 60, Colors.BOLD)
    log_success('Switch completed!')
    log('=' * 60 + '\n', Colors.BOLD)

    return True

def sync_sessions_only(target_provider: str, verbose: bool = False):
    """Sync all sessions to target provider without touching config"""
    log('\n' + '=' * 60, Colors.BOLD)
    log(f"Syncing Sessions to: {target_provider}", Colors.BOLD)
    log('=' * 60, Colors.BOLD)

    # Scan current state
    log('\nScanning session files...', Colors.CYAN)
    provider_counts = scan_session_providers()
    total_sessions = sum(provider_counts.values())
    log_info(f"Found {total_sessions} sessions")
    for provider, count in provider_counts.items():
        print(f"  - {provider}: {count} sessions")

    # Sync all sessions
    log('\nSyncing session files...', Colors.CYAN)
    success_count = 0
    skipped_count = 0
    fail_count = 0

    # Get all session files
    pattern = os.path.join(SESSIONS_DIR, '**', '*.jsonl')
    all_files = glob.glob(pattern, recursive=True)

    for file_path in all_files:
        result = update_session_provider(file_path, target_provider)
        if result.get('success'):
            if result.get('skipped'):
                skipped_count += 1
            else:
                success_count += 1
                if verbose:
                    log_info(f"Updated: {os.path.basename(file_path)}")
        else:
            fail_count += 1
            if verbose:
                log_warning(f"Failed: {os.path.basename(file_path)}")

    log_success(f"Success: {success_count}, Skipped: {skipped_count}, Failed: {fail_count}")

    # Verify
    log('\nVerifying sync results...', Colors.CYAN)
    final_counts = scan_session_providers()
    target_count = final_counts.get(target_provider, 0)

    if target_count == total_sessions:
        log_success(f"All {total_sessions} sessions synced to {target_provider}")
    else:
        log_warning(f"After sync: {target_provider} has {target_count} sessions (expected {total_sessions})")

    log('\nFinal Distribution:', Colors.BOLD)
    for provider, count in final_counts.items():
        marker = '●' if provider == target_provider else '○'
        print(f"  {marker} {provider}: {count} sessions")

    log('\n' + '=' * 60, Colors.BOLD)
    log_success('Sync completed!')
    log('=' * 60 + '\n', Colors.BOLD)

    return True

def show_help():
    """Show help information"""
    print("""
Codex Provider Switch Tool - Switch provider and sync all sessions

Usage:
  codex-switch.py status                    Show current status
  codex-switch.py <provider>                Switch to specified provider
  codex-switch.py <provider> --no-config    Sync sessions only, don't modify config.toml
  codex-switch.py <provider> --verbose      Show detailed logs
  codex-switch.py sync <provider>           Sync all sessions without touching config

Examples:
  codex-switch.py status
  codex-switch.py yunyi
  codex-switch.py openai --verbose
  codex-switch.py sync openai               # Sync sessions only
""")

def main():
    """Main function"""
    args = sys.argv[1:]

    if not args or args[0] in ['help', '--help', '-h']:
        show_help()
        return

    command = args[0]

    if command == 'status':
        show_status()
        return

    if command == 'sync':
        if len(args) < 2:
            log_error("Usage: codex-switch.py sync <provider>")
            return
        target_provider = args[1]
        verbose = '--verbose' in args or '-v' in args
        sync_sessions_only(target_provider, verbose)
        return

    target_provider = command
    skip_config = '--no-config' in args
    verbose = '--verbose' in args or '-v' in args

    switch_and_sync(target_provider, skip_config, verbose)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        log_error(f"Execution failed: {e}")
        sys.exit(1)

