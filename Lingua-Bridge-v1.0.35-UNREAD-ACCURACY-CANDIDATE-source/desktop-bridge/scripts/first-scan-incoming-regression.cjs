const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'service-preload.cjs'), 'utf8');
const start = source.indexOf('function scanMessages(force = false)');
const end = source.indexOf('\nfunction scheduleScan()', start);
assert(start >= 0 && end > start, 'scanMessages exists');
const scan = source.slice(start, end);

// A first conversation scan must still process the newest incoming messages
// even when automatic historical translation is disabled.
assert.match(scan, /const newestFirst = found\.slice\(\)\.reverse\(\)/);
assert.match(scan, /const recentRealtimeNodes = new Set\([\s\S]*?slice\(0, 3\)/);
assert.match(scan, /!recentRealtimeNodes\.has\(node\)/);
assert.doesNotMatch(scan, /if \(!settings\.autoTranslateHistorical && !force\) return;/);

// Existing cached history remains locally restorable and older history remains
// eligible for a manual translation action rather than provider calls.
assert.match(scan, /restoreCachedTranslation\(node, fp, settings\.incomingTarget \|\| 'en', conversationKey\)/);
assert.match(scan, /ensureManualTranslateAction\(node\)/);
assert.match(scan, /if \(requestIncomingTranslation\(node, 'realtime', force\)\)/);
console.log('PASS first conversation scan translates newest incoming messages while preserving local history cache');
