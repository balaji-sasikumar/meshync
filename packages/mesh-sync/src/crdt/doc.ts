import * as Y from 'yjs';

export interface CRDTUpdateEvent {
  update: Uint8Array;
  origin: unknown;
  doc: Y.Doc;
}

export class CRDTDocManager {
  public readonly doc: Y.Doc;
  private updateListeners = new Set<(event: CRDTUpdateEvent) => void>();

  constructor(workspaceId?: string) {
    this.doc = new Y.Doc({
      gc: true,
      guid: workspaceId
    });

    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      const event: CRDTUpdateEvent = { update, origin, doc: this.doc };
      for (const listener of this.updateListeners) {
        try {
          listener(event);
        } catch (err) {
          console.error('[CRDTDocManager] Error in update listener:', err);
        }
      }
    });
  }

  /**
   * Get the current state vector of this document as a compact binary representation.
   */
  public getStateVector(): Uint8Array {
    return Y.encodeStateVector(this.doc);
  }

  /**
   * Compute a binary delta update containing all changes known to this document
   * that are missing from the peer's target state vector.
   * If targetStateVector is omitted, returns the entire document state encoded as an update.
   */
  public getDelta(targetStateVector?: Uint8Array): Uint8Array {
    if (!targetStateVector || targetStateVector.byteLength === 0) {
      return Y.encodeStateAsUpdate(this.doc);
    }
    return Y.encodeStateAsUpdate(this.doc, targetStateVector);
  }

  /**
   * Apply an incoming binary delta update to the local document.
   */
  public applyUpdate(update: Uint8Array, origin: unknown = 'remote'): void {
    if (!update || update.byteLength === 0) return;
    Y.applyUpdate(this.doc, update, origin);
  }

  /**
   * Register a callback triggered whenever the local or remote CRDT state changes.
   */
  public subscribeToUpdates(callback: (event: CRDTUpdateEvent) => void): () => void {
    this.updateListeners.add(callback);
    return () => {
      this.updateListeners.delete(callback);
    };
  }

  /**
   * Export a full standalone snapshot update of the current document.
   */
  public exportSnapshot(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  /**
   * Access or create a named Y.Map collection.
   */
  public getMap<T = unknown>(name: string): Y.Map<T> {
    return this.doc.getMap<T>(name);
  }

  /**
   * Access or create a named Y.Array collection.
   */
  public getArray<T = unknown>(name: string): Y.Array<T> {
    return this.doc.getArray<T>(name);
  }

  /**
   * Clean up document resources.
   */
  public destroy(): void {
    this.updateListeners.clear();
    this.doc.destroy();
  }
}
