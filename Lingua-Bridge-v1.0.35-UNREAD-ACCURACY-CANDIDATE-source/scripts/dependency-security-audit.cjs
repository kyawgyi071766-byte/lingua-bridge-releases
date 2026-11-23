#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function parseVersion(value) {
  const match = /^([0-9]+)[.]([0-9]+)[.]([0-9]+)/.exec(String(value || ''));
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

function major(value) {
  return parseVersion(value)[0];
}

function findPackages(packages, name) {
  return Object.entries(packages)
    .filter(([packagePath]) =>
      packagePath === `node_modules/${name}` ||
      packagePath.endsWith(`/node_modules/${name}`)
    )
    .map(([packagePath, data]) => ({ path: packagePath, version: data.version }));
}

function requireMinimum(packages, name, minimum, predicate = () => true) {
  const entries = findPackages(packages, name).filter(predicate);
  if (entries.length === 0) {
    throw new Error(`Missing locked package: ${name}`);
  }
  const outdated = entries.filter((entry) => !atLeast(entry.version, minimum));
  if (outdated.length > 0) {
    const found = outdated.map((entry) => `${entry.path}=${entry.version}`).join(', ');
    throw new Error(`${name} must be >=${minimum}; outdated: ${found}`);
  }
}

function main() {
  const lockPath = path.join(__dirname, '..', 'package-lock.json');
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const packages = lock.packages;

  if (lock.lockfileVersion !== 3 || !packages) {
    throw new Error('Expected npm package-lock v3');
  }

  requireMinimum(packages, 'electron', '44.9.1');
  requireMinimum(packages, 'next', '15.5.29');
  requireMinimum(packages, 'postcss', '8.5.23');
  requireMinimum(packages, 'sharp', '0.35.5');
  requireMinimum(packages, 'tar', '7.5.21');
  requireMinimum(packages, 'qs', '6.16.1');
  requireMinimum(packages, 'fast-uri', '3.1.9');
  requireMinimum(packages, 'source-map-js', '1.2.2');
  requireMinimum(packages, 'postcss-selector-parser', '6.1.5');

  requireMinimum(packages, 'rimraf', '6.1.4', (entry) =>
    entry.path.includes('@capacitor/cli')
  );
  requireMinimum(packages, 'glob', '14.0.2', (entry) =>
    entry.path.includes('@capacitor/cli') && major(entry.version) >= 9
  );
  requireMinimum(packages, 'undici', '7.30.1', (entry) => major(entry.version) === 7);
  requireMinimum(packages, 'undici', '6.29.1', (entry) => major(entry.version) === 6);
  requireMinimum(packages, 'minimatch', '11.0.9', (entry) => major(entry.version) >= 7);

  const electron = findPackages(packages, 'electron').find((entry) =>
    entry.path === 'node_modules/electron'
  );
  const next = findPackages(packages, 'next').find((entry) =>
    entry.path === 'node_modules/next'
  );
  const postcss = findPackages(packages, 'postcss').find((entry) =>
    entry.path === 'node_modules/postcss'
  );
  if (!electron || !next || !postcss) {
    throw new Error('Could not verify the hoisted dependency lock entries');
  }

  const electronEntry = packages['node_modules/electron'];
  if (!electronEntry.integrity || !electronEntry.integrity.startsWith('sha512-')) {
    throw new Error('Electron lock entry must retain its SHA-512 integrity');
  }

  console.log('Dependency security lock audit passed:');
  console.log(`- Electron ${electron.version}`);
  console.log(`- Next.js ${next.version} + PostCSS ${postcss.version}`);
  console.log('- Patched sharp, tar, qs, fast-uri, source-map-js, selector parser, glob, rimraf and undici');
  console.log('- minimatch >=11.0.9 for all affected package paths');
}

try {
  main();
} catch (error) {
  console.error(`Dependency security lock audit failed: ${error.message}`);
  process.exitCode = 1;
}
