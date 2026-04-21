#!/usr/bin/env node

/**
 * Codex Provider Switch Tool
 * A lightweight tool for switching Codex providers and syncing all sessions
 * Enhanced with codex-provider-sync for complete synchronization
 *
 * @license MIT
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

// Configuration
const CODEX_HOME = process.env.CODEX_HOME || path.join(process.env.USERPROFILE || process.env.HOME, '.codex');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

/**
 * Execute codex-provider command
 */
function execCodexProvider(command, options = {}) {
  try {
    const result = execSync(`codex-provider ${command}`, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      env: { ...process.env, CODEX_HOME }
    });
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.stderr || error.message
    };
  }
}

/**
 * Parse status output
 */
function parseStatus(output) {
  const lines = output.split('\n');
  const status = {
    codexHome: '',
    currentProvider: '',
    configuredProviders: [],
    rolloutSessions: {},
    sqliteSessions: {},
  };

  let inRollout = false;
  let inSQLite = false;

  for (const line of lines) {
    if (line.startsWith('Codex home:')) {
      status.codexHome = line.split(':')[1].trim();
    } else if (line.startsWith('Current provider:')) {
      status.currentProvider = line.split(':')[1].trim();
    } else if (line.startsWith('Configured providers:')) {
      const providers = line.split(':')[1].trim();
      status.configuredProviders = providers ? providers.split(',').map(p => p.trim()) : [];
    } else if (line.includes('Rollout files:')) {
      inRollout = true;
      inSQLite = false;
    } else if (line.includes('SQLite state:')) {
      inRollout = false;
      inSQLite = true;
    } else if (line.includes('sessions:') && line.includes(':')) {
      const match = line.match(/sessions:\s+(.+)/);
      if (match) {
        const providers = match[1].split(',').map(p => p.trim());
        providers.forEach(p => {
          const parts = p.split(':').map(s => s.trim());
          if (parts.length === 2) {
            const [name, count] = parts;
            if (inRollout) {
              status.rolloutSessions[name] = parseInt(count);
            } else if (inSQLite) {
              status.sqliteSessions[name] = parseInt(count);
            }
          }
        });
      }
    }
  }

  return status;
}

/**
 * Show current status
 */
function showStatus() {
  log('\n' + '='.repeat(60), 'bold');
  log('Codex Provider Status', 'bold');
  log('='.repeat(60), 'bold');

  const result = execCodexProvider('status', { silent: true });

  if (!result.success) {
    logError('Failed to get status. Make sure codex-provider is installed.');
    logInfo('Install: npm install -g github:Dailin521/codex-provider-sync');
    return;
  }

  const status = parseStatus(result.output);

  logInfo(`Codex Home: ${status.codexHome}`);
  logInfo(`Current Provider: ${status.currentProvider || '(not set)'}`);
  logInfo(`Configured Providers: ${status.configuredProviders.join(', ') || '(none)'}`);

  log('\n📊 Rollout Files:', 'bold');
  if (Object.keys(status.rolloutSessions).length > 0) {
    for (const [provider, count] of Object.entries(status.rolloutSessions)) {
      const marker = provider === status.currentProvider ? '●' : '○';
      log(`  ${marker} ${provider}: ${count} sessions`);
    }
  } else {
    log('  (none)');
  }

  log('\n💿 SQLite Database:', 'bold');
  if (Object.keys(status.sqliteSessions).length > 0) {
    for (const [provider, count] of Object.entries(status.sqliteSessions)) {
      const marker = provider === status.currentProvider ? '●' : '○';
      log(`  ${marker} ${provider}: ${count} sessions`);
    }
  } else {
    log('  (none)');
  }

  // Check for inconsistency
  const allProviders = [...new Set([
    ...Object.keys(status.rolloutSessions),
    ...Object.keys(status.sqliteSessions)
  ])];

  let hasInconsistency = false;
  for (const provider of allProviders) {
    const rolloutCount = status.rolloutSessions[provider] || 0;
    const sqliteCount = status.sqliteSessions[provider] || 0;
    if (rolloutCount !== sqliteCount) {
      hasInconsistency = true;
      break;
    }
  }

  if (hasInconsistency) {
    log('\n⚠️  Inconsistency detected! Run sync to fix.', 'yellow');
  } else {
    log('\n✅ Rollout files and SQLite are in sync.', 'green');
  }

  log('');
}

/**
 * Switch provider
 */
function switchProvider(targetProvider, options = {}) {
  log('\n' + '='.repeat(60), 'bold');
  log(`Switching to Provider: ${targetProvider}`, 'bold');
  log('='.repeat(60) + '\n', 'bold');

  logInfo('Using codex-provider-sync for reliable switching...');

  const result = execCodexProvider(`switch ${targetProvider}`);

  if (result.success) {
    log('\n' + '='.repeat(60), 'bold');
    logSuccess('Switch completed successfully!');
    log('='.repeat(60) + '\n', 'bold');
    return true;
  } else {
    log('\n' + '='.repeat(60), 'bold');
    logError('Switch failed!');
    log('='.repeat(60) + '\n', 'bold');

    if (result.output.includes('is currently in use')) {
      logWarning('SQLite database is locked. Please:');
      log('  1. Close all Codex CLI sessions');
      log('  2. Close Codex App');
      log('  3. Stop app-server');
      log('  4. Try again');
    }

    return false;
  }
}

/**
 * Sync only (don't modify config.toml)
 */
function syncOnly(targetProvider = null) {
  log('\n' + '='.repeat(60), 'bold');
  log('Syncing Sessions', 'bold');
  log('='.repeat(60) + '\n', 'bold');

  const command = targetProvider
    ? `sync --provider ${targetProvider}`
    : 'sync';

  logInfo('Using codex-provider-sync for reliable syncing...');

  const result = execCodexProvider(command);

  if (result.success) {
    log('\n' + '='.repeat(60), 'bold');
    logSuccess('Sync completed successfully!');
    log('='.repeat(60) + '\n', 'bold');
    return true;
  } else {
    log('\n' + '='.repeat(60), 'bold');
    logError('Sync failed!');
    log('='.repeat(60) + '\n', 'bold');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(`
Codex Provider Switch Tool - Switch provider and sync all sessions

This tool wraps codex-provider-sync to provide reliable switching.
It handles both rollout files (.jsonl) and SQLite database synchronization.

Usage:
  codex-switch status                    Show current status
  codex-switch <provider>                Switch to specified provider
  codex-switch sync                      Sync sessions to current provider
  codex-switch sync <provider>           Sync sessions to specified provider

Examples:
  codex-switch status
  codex-switch yunyi
  codex-switch openai
  codex-switch sync
  codex-switch sync apigather

Requirements:
  - codex-provider-sync must be installed globally
  - Install: npm install -g github:Dailin521/codex-provider-sync
`);
    return;
  }

  // Check if codex-provider is installed
  try {
    execSync('codex-provider --version', { stdio: 'ignore' });
  } catch (error) {
    logError('codex-provider is not installed!');
    logInfo('Install it with: npm install -g github:Dailin521/codex-provider-sync');
    process.exit(1);
  }

  if (command === 'status') {
    showStatus();
    return;
  }

  if (command === 'sync') {
    const targetProvider = args[1];
    syncOnly(targetProvider);
    return;
  }

  // Default is to switch provider
  const targetProvider = command;
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  switchProvider(targetProvider, options);
}

main().catch(error => {
  logError(`Execution failed: ${error.message}`);
  process.exit(1);
});
