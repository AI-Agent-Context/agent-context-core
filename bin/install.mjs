#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contextFile = 'GLOBAL_WORKING_CONTEXT.md';
const beginMarker = '<!-- BEGIN AI Agent Context Core managed instructions -->';
const endMarker = '<!-- END AI Agent Context Core managed instructions -->';

const agentTargets = Object.freeze({
  codex: { directory: '.codex', file: 'AGENTS.md', env: 'CODEX_HOME' },
  'claude-code': { directory: '.claude', file: 'CLAUDE.md', env: 'CLAUDE_CONFIG_DIR' },
  'copilot-cli': { directory: '.copilot', file: 'copilot-instructions.md', env: 'COPILOT_HOME' },
  'gemini-cli': { directory: '.gemini', file: 'GEMINI.md', env: null },
});

export const supportedAgents = Object.freeze(Object.keys(agentTargets));

function lstatOrNull(file) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function regularFile(file) {
  const stat = lstatOrNull(file);
  if (!stat || stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error('Expected a regular file: ' + file);
  }
  return stat;
}

export function getGlobalInstructionDestination(agent = 'codex', {
  home = os.homedir(),
  env = process.env,
} = {}) {
  const target = agentTargets[agent];
  if (!Object.prototype.hasOwnProperty.call(agentTargets, agent) || !target) {
    throw new Error('Unsupported agent "' + agent + '". Choose one of: ' + Object.keys(agentTargets).join(', ') + '.');
  }
  const configuredDirectory = target.env && env[target.env]
    ? path.resolve(env[target.env])
    : path.join(home, target.directory);
  return path.join(configuredDirectory, target.file);
}

function mergeManagedInstructions(existing, context) {
  const startCount = existing.split(beginMarker).length - 1;
  const endCount = existing.split(endMarker).length - 1;
  if (startCount !== endCount || startCount > 1) {
    throw new Error('The managed Global Working Context markers are malformed or duplicated. Fix the instruction file before retrying.');
  }

  const newline = existing.includes('\r\n') ? '\r\n' : '\n';
  const body = context.replace(/\r?\n/g, newline).replace(/[\r\n]+$/u, '');
  if (body.includes(beginMarker) || body.includes(endMarker)) {
    throw new Error('The Global Working Context contains a reserved installer marker.');
  }
  const block = beginMarker + newline + body + newline + endMarker;

  if (startCount === 0) {
    if (!existing) return block + newline;
    const existingContextIndex = existing.indexOf(body);
    if (existingContextIndex >= 0 && existing.indexOf(body, existingContextIndex + body.length) < 0) {
      return existing.slice(0, existingContextIndex) + block + existing.slice(existingContextIndex + body.length);
    }
    const separator = /(?:\r?\n){2}$/u.test(existing) ? '' : /(?:\r?\n)$/u.test(existing) ? newline : newline + newline;
    return existing + separator + block + newline;
  }

  const start = existing.indexOf(beginMarker);
  const end = existing.indexOf(endMarker);
  if (end < start) {
    throw new Error('The managed Global Working Context markers are out of order. Fix the instruction file before retrying.');
  }
  return existing.slice(0, start) + block + existing.slice(end + endMarker.length);
}

function ensureConfigDirectory(directory, root) {
  const resolvedDirectory = path.resolve(directory);
  const resolvedRoot = path.resolve(root);
  const relative = path.relative(resolvedRoot, resolvedDirectory);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    throw new Error('Global instruction destination escapes its configuration root: ' + directory);
  }

  const rootStat = lstatOrNull(resolvedRoot);
  if (rootStat && !rootStat.isDirectory() && !rootStat.isSymbolicLink()) {
    throw new Error('Global configuration root must be a directory: ' + resolvedRoot);
  }

  let current = resolvedRoot;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const stat = lstatOrNull(current);
    if (stat && (stat.isSymbolicLink() || !stat.isDirectory())) {
      throw new Error('Global instruction path must contain regular directories: ' + current);
    }
  }
}

export function installGlobalContext({
  agent = 'codex',
  source = path.join(packageRoot, contextFile),
  home = os.homedir(),
  env = process.env,
  log = console.log,
} = {}) {
  regularFile(source);
  const destination = getGlobalInstructionDestination(agent, { home, env });
  const directory = path.dirname(destination);
  const target = agentTargets[agent];
  const root = target.env && env[target.env]
    ? path.resolve(env[target.env])
    : path.resolve(home);

  ensureConfigDirectory(directory, root);
  const existingStat = lstatOrNull(destination);
  if (existingStat && (existingStat.isSymbolicLink() || !existingStat.isFile())) {
    throw new Error('Global instruction destination must be a regular file: ' + destination);
  }

  const existing = existingStat ? fs.readFileSync(destination, 'utf8') : '';
  const context = fs.readFileSync(source, 'utf8');
  const next = mergeManagedInstructions(existing, context);
  if (next === existing) {
    log('Global Working Context is already up to date: ' + destination);
    return { destination, changed: false };
  }

  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(destination, next, 'utf8');
  log((existingStat ? 'Updated' : 'Installed') + ' global Working Context for ' + agent + ': ' + destination);
  return { destination, changed: true };
}

function installProjectCopy() {
  const source = path.join(packageRoot, contextFile);
  regularFile(source);
  const destination = path.resolve(process.cwd(), contextFile);
  const existing = lstatOrNull(destination);
  if (existing) {
    const identical = !existing.isSymbolicLink()
      && existing.isFile()
      && fs.readFileSync(source).equals(fs.readFileSync(destination));
    if (identical) {
      console.log('Reusing identical existing Global Working Context: ' + destination);
      return 0;
    }
    throw new Error('Destination already exists; will not overwrite: ' + destination);
  }
  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  console.log('Installed project copy of Global Working Context: ' + destination);
  console.log('This copy is not auto-loaded unless the selected agent is configured to read it.');
  return 0;
}

function main(args = process.argv.slice(2)) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('Usage: <package-command> [--agent codex|claude-code|copilot-cli|gemini-cli] | --project');
    console.log('No arguments install Global Working Context into Codex user instructions.');
    console.log('--agent installs it into the selected agent user-instructions file.');
    console.log('--project copies GLOBAL_WORKING_CONTEXT.md into the current project for manual use.');
    return 0;
  }

  if (args.length === 1 && args[0] === '--project') return installProjectCopy();
  if (args.length === 0) {
    installGlobalContext({ agent: 'codex' });
    return 0;
  }
  if (args.length !== 2 || args[0] !== '--agent') {
    throw new Error('Use --agent <codex|claude-code|copilot-cli|gemini-cli> or --project.');
  }
  installGlobalContext({ agent: args[1] });
  return 0;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error('Error: ' + error.message);
    console.error('No package files were installed.');
    process.exitCode = 1;
  }
}
