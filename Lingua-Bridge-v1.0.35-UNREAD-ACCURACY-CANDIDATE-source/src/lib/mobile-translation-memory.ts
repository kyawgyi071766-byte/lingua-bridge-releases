export interface MobileTranslation {
  text: string; target: string; translated: string; at: number;
}
const PREFIX = 'lingua-mobile-memory-v1:';
const MAX_BYTES = 500_000;
export function getMobileStorage(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}
export function loadMobileMemory(storage: Storage | null, owner: string): MobileTranslation[] {
  try {
    const raw = storage?.getItem(PREFIX + owner);
    if (!raw || raw.length * 2 > MAX_BYTES) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((r): r is MobileTranslation =>
      !!r && typeof r.text === 'string' && r.text.length <= 10000 &&
      typeof r.target === 'string' && typeof r.translated === 'string' &&
      r.translated.length <= 30000 && Number.isFinite(r.at)).slice(-100);
  } catch { return []; }
}
export function saveMobileMemory(storage: Storage | null, owner: string, item: MobileTranslation): boolean {
  if (!storage || !owner || !item.text.trim() || !item.translated.trim()) return false;
  const rows = loadMobileMemory(storage, owner).filter(r => r.text !== item.text || r.target !== item.target);
  rows.push(item);
  while (rows.length > 100 || JSON.stringify(rows).length * 2 > MAX_BYTES) rows.shift();
  try { storage.setItem(PREFIX + owner, JSON.stringify(rows)); return true; } catch { return false; }
}
export function clearMobileMemory(storage: Storage | null, owner: string): boolean {
  if (!storage) return false;
  try { storage.removeItem(PREFIX + owner); return true; } catch { return false; }
}
export class LatestMobileRequest {
  private generation = 0;
  private controller: AbortController | null = null;
  cancel() { this.generation++; this.controller?.abort(); this.controller = null; }
  begin() {
    this.cancel();
    this.controller = new AbortController();
    const generation = this.generation;
    return { signal: this.controller.signal, current: () => this.generation === generation };
  }
}
