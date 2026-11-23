'use strict';
// Regression guard: opting into visible history must re-scan already seen bubbles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'service-preload.cjs'), 'utf8');
assert.match(source, /const historyEnabled = !previous\.autoTranslateHistorical && settings\.autoTranslateHistorical/);
assert.match(source, /if \(translationChanged \|\| historyEnabled\) clearMessageFingerprints\(\)/);
assert.match(source, /incomingEnabled \|\| historyEnabled/);
// First open must still auto-translate the newest customer message when history is off.
assert.match(source, /const newestIncomingNode = found\.slice\(\)\.reverse\(\)\.find\(node => !isOutgoingMessage\(node\)\)/);
assert.match(source, /newestIncomingNode\.dataset\.linguaFingerprint = ''/);
assert.match(source, /removeManualTranslateAction\(newestIncomingNode\)/);
// Changing the target language must remove stale cards so they cannot block a new request.
assert.match(source, /function clearMessageFingerprints\(\{ removeTranslations = false \} = \{\}\)/);
assert.match(source, /removeTranslations: previous\.incomingTarget !== settings\.incomingTarget/);
assert.match(source, /findBubble\(node\)\?\.querySelector\(':scope > \.lingua-inline-translation'\)\?\.remove\(\)/);
assert.match(source, /node\.dataset\.linguaFingerprint === fp\) \{/);
console.log('Visible history opt-in regression guards passed');
