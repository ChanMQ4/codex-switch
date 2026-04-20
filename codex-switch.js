#!/usr/bin/env node

/**
 * Codex Provider Switch Tool
 * A lightweight tool for switching Codex providers and syncing all sessions
 *
 * @license MIT
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CODEX_HOME = process.env.CODEX_HOME || path.join(process.env.USERPROFILE || process.env.HOME, '.codex');
const CONFIG_PATH = path.join(CODEX_HOME, 'config.toml');
const SESSIONS_DIR = path.join(CODEX_HOME, 'sessions');

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
 * Read current provider from config.toml
 */
function getCurrentProvider() {
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const match = configContent.match(/model_provider\s*=\s*"([^"]+)"/);
    return match ? match[1] : null;
  } catch (error) {
    logError(`Failed to read config file: ${error.message}`);
    return null;
  }
}

/**
 * Get all configured providers
 */
function getConfiguredProviders() {
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const providers = [];
    const regex = /\[model_providers\.([^\]]+)\]/g;
    let match;
    while ((match = regex.exec(configContent)) !== null) {
      providers.push(match[1]);
    }
    return providers;
  } catch (error) {
    logError(`Failed to read config file: ${error.message}`);
    return [];
  }
}

/**
 * Scan all session files and count providers
 */
function scanSessionProviders() {
  const providerCounts = {};

  try {
    const result = execSync(
      `grep -r "\\"model_provider\\":" "${SESSIONS_DIR}" --include="*.jsonl" -h`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = result.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const match = line.match(/"model_provider"\s*:\s*"([^"]+)"/);
        if (match) {
          const provider = match[1];
          providerCounts[provider] = (providerCounts[provider] || 0) + 1;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  } catch (error) {
    logWarning('Error scanning session files, using fallback method');
  }

  return providerCounts;
}

/**
 * Find all session files for a specific provider
 */
function findSessionsByProvider(provider) {
  const files = [];

  try {
    const result = execSync(
      `grep -r "\\"model_provider\\"" "${SESSIONS_DIR}" --include="*.jsonl" -l`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = result.split('\n').filter(line => line.trim());

    // Filter files by provider
    for (const filePath of lines) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const firstLine = content.split('\n')[0];
        const match = firstLine.match(/"model_provider"\s*:\s*"([^"]+)"/);
        if (match && match[1] === provider) {
          files.push(filePath);
        }
      } catch (e) {
        // Ignore read errors
      }
    }
  } catch (error) {
    // grep returns non-zero exit code when no matches found
    if (!error.message.includes('Command failed')) {
      logWarning(`Error finding session files: ${error.message}`);
    }
  }

  return files;
}

/**
 * Update provider in a session file
 */
function updateSessionProvider(filePath, targetProvider) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    if (lines.length === 0 || !lines[0].includes('"model_provider"')) {
      return { success: false, reason: 'no_provider_field' };
    }

    const firstLine = JSON.parse(lines[0]);
    const currentProvider = firstLine.payload?.model_provider;

    if (currentProvider === targetProvider) {
      return { success: true, skipped: true, currentProvider };
    }

    firstLine.payload.model_provider = targetProvider;
    lines[0] = JSON.stringify(firstLine);

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

    return { success: true, skipped: false, currentProvider };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * Switch provider in config.toml
 */
function switchConfigProvider(targetProvider) {
  try {
    let configContent = fs.readFileSync(CONFIG_PATH, 'utf8');

    // Check if provider exists
    if (!configContent.includes(`[model_providers.${targetProvider}]`)) {
      logError(`Provider "${targetProvider}" is not configured in config.toml`);
      return false;
    }

    // Replace model_provider
    configContent = configContent.replace(
      /model_provider\s*=\s*"[^"]+"/,
      `model_provider = "${targetProvider}"`
    );

    fs.writeFileSync(CONFIG_PATH, configContent, 'utf8');
    return true;
  } catch (error) {
    logError(`Failed to modify config file: ${error.message}`);
    return false;
  }
}

/**
 * Show current status
 */
function showStatus() {
  log('\n' + '='.repeat(60), 'bold');
  log('Codex Provider Status', 'bold');
  log('='.repeat(60), 'bold');

  const currentProvider = getCurrentProvider();
  const configuredProviders = getConfiguredProviders();
  const providerCounts = scanSessionProviders();

  logInfo(`Codex Home: ${CODEX_HOME}`);
  logInfo(`Current Provider: ${currentProvider || '(not set)'}`);
  logInfo(`Configured Providers: ${configuredProviders.join(', ')}`);

  log('\nSession Distribution:', 'bold');
  for (const [provider, count] of Object.entries(providerCounts)) {
    const marker = provider === currentProvider ? '●' : '○';
    log(`  ${marker} ${provider}: ${count} sessions`);
  }

  log('');
}

/**
 * Switch and sync
 */
async function switchAndSync(targetProvider, options = {}) {
  log('\n' + '='.repeat(60), 'bold');
  log(`Switching to Provider: ${targetProvider}`, 'bold');
  log('='.repeat(60), 'bold');

  const currentProvider = getCurrentProvider();
  logInfo(`Current Provider: ${currentProvider}`);

  // Step 1: Scan current state
  log('\n[1/4] Scanning session files...', 'cyan');
  const providerCounts = scanSessionProviders();
  const totalSessions = Object.values(providerCounts).reduce((a, b) => a + b, 0);
  logInfo(`Found ${totalSessions} sessions`);
  for (const [provider, count] of Object.entries(providerCounts)) {
    log(`  - ${provider}: ${count} sessions`);
  }

  // Step 2: Update config
  if (!options.skipConfigUpdate) {
    log('\n[2/4] Updating config.toml...', 'cyan');
    if (switchConfigProvider(targetProvider)) {
      logSuccess(`Switched to ${targetProvider}`);
    } else {
      return false;
    }
  } else {
    log('\n[2/4] Skipping config update', 'yellow');
  }

  // Step 3: Sync session files
  log('\n[3/4] Syncing session files...', 'cyan');
  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (const [provider, count] of Object.entries(providerCounts)) {
    if (provider === targetProvider) {
      skippedCount += count;
      continue;
    }

    logInfo(`Processing ${count} sessions from ${provider}...`);
    const files = findSessionsByProvider(provider);

    for (const filePath of files) {
      const result = updateSessionProvider(filePath, targetProvider);
      if (result.success) {
        if (result.skipped) {
          skippedCount++;
        } else {
          successCount++;
          if (options.verbose) {
            log(`  ✓ ${path.basename(filePath)} (${result.currentProvider} → ${targetProvider})`);
          }
        }
      } else {
        failCount++;
        if (options.verbose) {
          log(`  ✗ ${path.basename(filePath)} (${result.reason})`);
        }
      }
    }
  }

  logSuccess(`Success: ${successCount}, Skipped: ${skippedCount}, Failed: ${failCount}`);

  // Step 4: Verify results
  log('\n[4/4] Verifying sync results...', 'cyan');
  const newProviderCounts = scanSessionProviders();
  const newTotal = Object.values(newProviderCounts).reduce((a, b) => a + b, 0);

  if (newProviderCounts[targetProvider] === totalSessions) {
    logSuccess(`All ${totalSessions} sessions synced to ${targetProvider}`);
  } else {
    logWarning(`After sync: ${targetProvider} has ${newProviderCounts[targetProvider]} sessions (expected ${totalSessions})`);
  }

  log('\nFinal Distribution:', 'bold');
  for (const [provider, count] of Object.entries(newProviderCounts)) {
    const marker = provider === targetProvider ? '●' : '○';
    log(`  ${marker} ${provider}: ${count} sessions`);
  }

  log('\n' + '='.repeat(60), 'bold');
  logSuccess('Switch completed!');
  log('='.repeat(60) + '\n', 'bold');

  return true;
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

Usage:
  codex-switch status                    Show current status
  codex-switch <provider>                Switch to specified provider
  codex-switch <provider> --no-config    Sync sessions only, don't modify config.toml
  codex-switch <provider> --verbose      Show detailed logs

Examples:
  codex-switch status
  codex-switch yunyi
  codex-switch openai --verbose
`);
    return;
  }

  if (command === 'status') {
    showStatus();
    return;
  }

  const targetProvider = command;
  const options = {
    skipConfigUpdate: args.includes('--no-config'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  await switchAndSync(targetProvider, options);
}

main().catch(error => {
  logError(`Execution failed: ${error.message}`);
  process.exit(1);
});
