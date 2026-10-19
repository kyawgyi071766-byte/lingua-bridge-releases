'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
function configure(config, manifest, template) {
  assert(/^[a-zA-Z]\w*(\.[a-zA-Z]\w*)+$/.test(config.appId), 'Invalid native application ID');
  const server = new URL(config.server.url);
  assert(server.protocol === 'https:' && !server.username && !server.password, 'HTTPS server without URL credentials required');
  assert(server.pathname === '/' && !server.search && !server.hash, 'Server must be an origin');
  const activity = /(<activity\b[^>]*android:name="\.MainActivity"[^>]*>)([\s\S]*?)(<\/activity>)/;
  assert(activity.test(manifest), 'Generated MainActivity not found');
  const filters = [
    '<intent-filter><action android:name="android.intent.action.SEND"/><category android:name="android.intent.category.DEFAULT"/><data android:mimeType="text/plain"/></intent-filter>',
    '<intent-filter><action android:name="android.intent.action.PROCESS_TEXT"/><category android:name="android.intent.category.DEFAULT"/><data android:mimeType="text/plain"/></intent-filter>'
  ].join('\n');
  assert(!manifest.includes('android.intent.action.SEND'), 'Share receiver already configured');
  return {
    manifest:manifest.replace(activity, (_all,open,inside,close)=>open+inside+'\n'+filters+'\n'+close),
    java:template.replace('__PACKAGE__',config.appId).replace('__ENDPOINT__',JSON.stringify(server.origin+'/share-target'))
  };
}
module.exports = {configure};
if (require.main === module) {
  const android = path.join(root,'android/app/src/main');
  const config = JSON.parse(fs.readFileSync(path.join(android,'assets/capacitor.config.json'),'utf8'));
  const manifestPath = path.join(android,'AndroidManifest.xml');
  const result = configure(config,fs.readFileSync(manifestPath,'utf8'),fs.readFileSync(path.join(root,'mobile-native/MainActivity.java.template'),'utf8'));
  const javaPath = path.join(android,'java',...config.appId.split('.'),'MainActivity.java');
  assert(fs.existsSync(javaPath), 'Expected generated MainActivity source absent');
  fs.writeFileSync(javaPath,result.java);
  fs.writeFileSync(manifestPath,result.manifest);
  console.log('Configured Android text share and selected-text receiver; no message content logged.');
}
