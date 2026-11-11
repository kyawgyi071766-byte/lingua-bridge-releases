'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../electron/service-preload.cjs'),'utf8');
const disk=new Map();let scope='chat:A',saves=0,scans=0;const painted=[];
const c=vm.createContext({
settings:{isActive:true,incomingTarget:'en'},translationCache:new Map(),TRANSLATION_CACHE_LIMIT:5000,TRANSLATION_CACHE_MAX_BYTES:4096,TRANSLATION_CACHE_STORAGE_KEY:'test',translationCacheSaveTimer:null,
detectConversationInfo:()=>({key:scope}),localStorage:{getItem:k=>disk.get(k),setItem:(k,v)=>disk.set(k,v)},
setTimeout:()=>++saves,clearTimeout:()=>{},window:{addEventListener:()=>{}},cleanText:x=>String(x||'').trim(),
findBubble:n=>({querySelector:()=>n.card||null}),ensureTranslationHost:n=>n,setInlineTranslation:(n,t)=>painted.push(t),
pendingIncoming:new Map(),pendingIncomingFingerprints:new Set(),clearTranslationFailure:()=>{},scheduleScan:()=>scans++,
ipcRenderer:{on:(_ch,fn)=>{c.reply=fn}}
});
vm.runInContext(source.slice(source.indexOf('function currentConversationCacheScope()'),source.indexOf('\nfunction requestIncomingTranslation')),c);
const start=source.indexOf("ipcRenderer.on('lingua-translation-result'");
vm.runInContext(source.slice(start,source.indexOf("  if (String(result.id || '').startsWith('out_'))",start))+'});',c);
function pending(id,text){const n={innerText:text,dataset:{linguaFingerprint:text},isConnected:true};c.pendingIncoming.set(id,{node:n,fp:text,targetLang:'en',pendingKey:id,conversationKey:'chat:A'});c.pendingIncomingFingerprints.add(id);return n;}

const paints={label:0,body:0};
const meta={get textContent(){return this.value||''},set textContent(v){this.value=v;paints.label++}};
const body={get textContent(){return this.value||''},set textContent(v){this.value=v;paints.body++}};
const paintContext=vm.createContext({
settings:{incomingTarget:'en',incomingTargetLabel:'English'},
fingerprint:x=>x,cleanText:x=>x,currentConversationCacheScope:()=> 'chat:A',
ensureTranslationRefreshButton:()=>{}
});
vm.runInContext(source.slice(source.indexOf('function setInlineTranslation('),source.indexOf('function currentConversationCacheScope()')),paintContext);
const host={dataset:{},querySelector:s=>s.includes('meta')?meta:body};
paintContext.setInlineTranslation(host,'translated','mock',{innerText:'source'});
paintContext.setInlineTranslation(host,'translated','mock',{innerText:'source'});
assert.equal(paints.label,1,'unchanged cached label must not trigger repeated mutations');
assert.equal(paints.body,1,'unchanged cached body must not trigger repeated mutations');

async function run(){
assert.notEqual(c.fingerprint('costarring'),c.fingerprint('liquid'));
for(let i=0;i<30;i++)c.rememberTranslation('text '+i,'translation '+i,'mock','en','chat:A');
assert.equal(saves,1);c.flushTranslationCache();assert(disk.get('test').length*2<=4096);
c.translationCache.clear();c.loadTranslationCache();
assert(c.restoreCachedTranslation({},'text 29','en','chat:A')===false);
const reopened={isConnected:true};assert(c.restoreCachedTranslation(reopened,'text 29','en','chat:A'));
assert(!c.restoreCachedTranslation(reopened,'text 29','es','chat:A'));assert(!c.restoreCachedTranslation(reopened,'text 29','en','chat:B'));painted.length=0;
let removed=0;const edited=pending('in_1','old');edited.innerText='corrected';edited.card={dataset:{linguaSourceFingerprint:'old',linguaConversation:'chat:A',linguaTarget:'en'},remove:()=>removed++};
await c.reply(null,{id:'in_1',ok:true,translatedText:'late old translation'});
assert.equal(painted.length,0);assert.equal(removed,1);
assert(c.translationCache.has(c.translationCacheKey('old','en','chat:A')));
const gone=pending('in_2','history');gone.isConnected=false;
await c.reply(null,{id:'in_2',ok:true,translatedText:'cached history'});
assert(c.translationCache.has(c.translationCacheKey('history','en','chat:A')));
scope='chat:B';pending('in_3','chat A text');await c.reply(null,{id:'in_3',ok:true,translatedText:'A result'});assert.equal(painted.length,0);
scope='chat:A';pending('in_4','corrected');await c.reply(null,{id:'in_4',ok:true,translatedText:'correct result'});assert.equal(painted.at(-1),'correct result');assert(scans>=4);
console.log('PASS translation persistence, bounded batched storage, exact text identity, language/chat isolation, edits before scan, late replies, virtualization, corrected translation');
}
run().catch(e=>{console.error(e);process.exitCode=1});
