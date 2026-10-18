'use strict';
// Regression guard: opting into visible history must re-scan already seen bubbles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'service-preload.cjs'), 'utf8');
assert.match(source, /const historyEnabled = !previous\.autoTranslateHistorical && settings\.autoTranslateHistorical/);
assert.match(source, /if \(translationChanged \|\| historyEnabled\) clearMessageFingerprints\(\)/);
assert.match(source, /incomingEnabled \|\| historyEnabled/);
assert.match(source, /node\.dataset\.linguaFingerprint === fp && !settings\.autoTranslateHistorical/);
console.log('Visible history opt-in regression guards passed');
