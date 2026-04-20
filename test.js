#!/usr/bin/env node

/**
 * Codex Provider Switch - Test Suite
 * Comprehensive tests for all functionality
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function logTest(name) {
  log(`\n${'='.repeat(60)}`, 'bold');
  log(`Test: ${name}`, 'bold');
  log('='.repeat(60), 'bold');
}

function logPass(message) {
  log(`✓ PASS: ${message}`, 'green');
}

function logFail(message) {
  log(`✗ FAIL: ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    logPass(message);
    passCount++;
  } else {
    logFail(message);
    failCount++;
  }
}

// Test 1: Check environment
logTest('Environment Check');

const CODEX_HOME = process.env.CODEX_HOME || path.join(process.env.USERPROFILE || process.env.HOME, '.codex');
const CONFIG_PATH = path.join(CODEX_HOME, 'config.toml');
const SESSIONS_DIR = path.join(CODEX_HOME, 'sessions');

assert(fs.existsSync(CODEX_HOME), `Codex Home exists: ${CODEX_HOME}`);
assert(fs.existsSync(CONFIG_PATH), `Config file exists: ${CONFIG_PATH}`);
assert(fs.existsSync(SESSIONS_DIR), `Sessions directory exists: ${SESSIONS_DIR}`);

// Test 2: Status command
logTest('Status Command');

try {
  const output = execSync('node codex-switch.js status', { encoding: 'utf8', cwd: __dirname });
  assert(output.includes('Codex Provider Status'), 'Status command output is correct');
  assert(output.includes('Current Provider'), 'Shows current provider');
  assert(output.includes('Session Distribution'), 'Shows session distribution');
  logInfo('Output preview:\n' + output.split('\n').slice(0, 10).join('\n'));
} catch (error) {
  logFail(`Status command failed: ${error.message}`);
  failCount++;
}

// Test 3: Read current config
logTest('Read Current Config');

try {
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  const match = configContent.match(/model_provider\s*=\s*"([^"]+)"/);
  const currentProvider = match ? match[1] : null;

  assert(currentProvider !== null, `Successfully read current provider: ${currentProvider}`);

  const providersMatch = configContent.match(/\[model_providers\.([^\]]+)\]/g);
  const providers = providersMatch ? providersMatch.map(m => m.match(/\[model_providers\.([^\]]+)\]/)[1]) : [];

  assert(providers.length > 0, `Found ${providers.length} configured providers: ${providers.join(', ')}`);
} catch (error) {
  logFail(`Failed to read config: ${error.message}`);
  failCount++;
}

// Test 4: Scan session files
logTest('Scan Session Files');

try {
  const result = execSync(
    `grep -r "\\"model_provider\\":" "${SESSIONS_DIR}" --include="*.jsonl" -h`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  const lines = result.split('\n').filter(line => line.trim());
  const providerCounts = {};

  for (const line of lines) {
    const match = line.match(/"model_provider":"([^"]+)"/);
    if (match) {
      const provider = match[1];
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    }
  }

  const totalSessions = Object.values(providerCounts).reduce((a, b) => a + b, 0);
  assert(totalSessions > 0, `Found ${totalSessions} sessions`);

  for (const [provider, count] of Object.entries(providerCounts)) {
    logInfo(`  ${provider}: ${count} sessions`);
  }
} catch (error) {
  logFail(`Failed to scan sessions: ${error.message}`);
  failCount++;
}

// Test 5: Help information
logTest('Help Information');

try {
  const output = execSync('node codex-switch.js help', { encoding: 'utf8', cwd: __dirname });
  assert(output.includes('Usage'), 'Shows usage information');
  assert(output.includes('Examples'), 'Shows examples');
} catch (error) {
  logFail(`Help command failed: ${error.message}`);
  failCount++;
}

// Test summary
log('\n' + '='.repeat(60), 'bold');
log('Test Summary', 'bold');
log('='.repeat(60), 'bold');

log(`\nPassed: ${passCount}`, 'green');
log(`Failed: ${failCount}`, failCount > 0 ? 'red' : 'reset');
log(`Total: ${passCount + failCount}\n`);

if (failCount === 0) {
  log('🎉 All tests passed!', 'green');
  process.exit(0);
} else {
  log('⚠️  Some tests failed', 'yellow');
  process.exit(1);
}
