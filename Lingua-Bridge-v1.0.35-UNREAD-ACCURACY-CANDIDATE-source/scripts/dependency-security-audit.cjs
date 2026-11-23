#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function parseVersion(value) {
  const match = /^(\\d+)\\.(\\d+)\\.(\\d+)/.exec(String(value || ''));
  if (!match) throw new Error(`Invalid package version: ${value}`);
  return match.slice(1).map(Number);
}

function atLeast(actual, minimum) {
  const a = parseVersion(actual);
  const b = parseVersion(minimum);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return true;
}

function main() {
  const lockPath = path.join(__dirname, '..', 'package-lock.json');
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (lock.lockfileVersion !== 3 || !lock.packages) {
    throw new Error('Expected npm package-lock v3');
  }

  const electron = lock.packages['node_modules/electron'];
  const postcss = lock.packages['node_modules/next/node_modules/postcss'];
  const next = lock.packages['node_modules/next'];

  if (!electron || !atLeast(electron.version, '44.9.1')) {
    throw new Error(`Electron must be >=44.9.1; found ${electron?.version || 'missing'}`);
  }
  if (!electron.integrity || !electron.integrity.startsWith('sha512-')) {
    throw new Error('Electron lock entry must retain its SHA-512 integrity');
  }
  if (!postcss || !atLeast(postcss.version, '8.5.23')) {
    throw new Error(`Next.js PostCSS must be >=8.5.23; found ${postcss?.version || 'missing'}`);
  }
  if (!next || !String(next.dependencies?.postcss || '').length) {
    throw new Error('Could not verify Next.js PostCSS dependency');
  }

  console.log(`Dependency security lock audit passed: electron ${electron.version}; next/postcss ${postcss.version}`);
}

try {
  main();
} catch (error) {
  console.error(`Dependency security lock audit failed: ${error.message}`);
  process.exitCode = 1;
}
