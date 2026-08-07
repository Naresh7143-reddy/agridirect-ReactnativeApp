/**
 * AgriDirect — Pure JS MMKV Stub
 *
 * Provides a clean in-memory fallback for MMKV storage without requiring
 * native C++ / Nitro modules bindings.
 */

export class MMKV {
  private id: string;
  private memory: Map<string, any>;

  constructor(options?: { id?: string }) {
    this.id = options?.id ?? 'default';
    this.memory = new Map<string, any>();
  }

  getString(key: string): string | undefined {
    const val = this.memory.get(key);
    return typeof val === 'string' ? val : undefined;
  }

  set(key: string, value: any): void {
    this.memory.set(key, value);
  }

  getBoolean(key: string): boolean | undefined {
    const val = this.memory.get(key);
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }

  getNumber(key: string): number | undefined {
    const val = this.memory.get(key);
    if (typeof val === 'number') return val;
    if (val !== undefined && val !== null) return Number(val);
    return undefined;
  }

  delete(key: string): void {
    this.memory.delete(key);
  }

  clearAll(): void {
    this.memory.clear();
  }

  getAllKeys(): string[] {
    return Array.from(this.memory.keys());
  }
}

export default MMKV;
