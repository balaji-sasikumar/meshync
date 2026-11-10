import * as Y from 'yjs';
import { Collection, Identifiable } from './types.js';
import { CRDTDocManager } from '../crdt/doc.js';

export function createDeterministicId(prefix = 'item'): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}

export class CRDTCollection<T extends Identifiable> implements Collection<T> {
  private yMap: Y.Map<string>;
  private observers = new Set<(items: T[]) => void>();

  constructor(
    public readonly name: string,
    private docManager: CRDTDocManager
  ) {
    this.yMap = this.docManager.getMap<string>(`col:${name}`);

    // Listen to CRDT mutations on this collection (local or remote)
    this.yMap.observe(() => {
      this.notifyObservers();
    });
  }

  public add(item: T): T {
    if (!item.id) {
      item = { ...item, id: createDeterministicId(this.name) };
    }

    this.docManager.doc.transact(() => {
      this.yMap.set(item.id, JSON.stringify(item));
    });

    return item;
  }

  public update(id: string, partial: Partial<Omit<T, 'id'>>): T | null {
    const existing = this.get(id);
    if (!existing) return null;

    const updated: T = {
      ...existing,
      ...partial,
      id
    };

    this.docManager.doc.transact(() => {
      this.yMap.set(id, JSON.stringify(updated));
    });

    return updated;
  }

  public delete(id: string): boolean {
    if (!this.yMap.has(id)) return false;

    this.docManager.doc.transact(() => {
      this.yMap.delete(id);
    });

    return true;
  }

  public get(id: string): T | undefined {
    const raw = this.yMap.get(id);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  public getAll(): T[] {
    const items: T[] = [];
    this.yMap.forEach((raw) => {
      try {
        items.push(JSON.parse(raw) as T);
      } catch {}
    });
    return items;
  }

  public query(predicate?: (item: T) => boolean): T[] {
    const all = this.getAll();
    if (!predicate) return all;
    return all.filter(predicate);
  }

  public count(): number {
    return this.yMap.size;
  }

  public clear(): void {
    this.docManager.doc.transact(() => {
      this.yMap.clear();
    });
  }

  public observe(callback: (items: T[]) => void): () => void {
    this.observers.add(callback);

    // Immediately deliver current state to the observer
    try {
      callback(this.getAll());
    } catch (err) {
      console.error('[CRDTCollection] Error during initial observe callback:', err);
    }

    return () => {
      this.observers.delete(callback);
    };
  }

  private notifyObservers(): void {
    const items = this.getAll();
    for (const callback of this.observers) {
      try {
        callback(items);
      } catch (err) {
        console.error('[CRDTCollection] Observer notification failed:', err);
      }
    }
  }
}
