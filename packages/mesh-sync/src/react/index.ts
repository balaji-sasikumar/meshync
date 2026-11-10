import { useState, useEffect, useMemo, useCallback } from 'react';
import { MeshKernel, MeshKernelConfig, MeshKernelStatus } from '../kernel.js';
import { Collection, Identifiable } from '../collection/types.js';

export function useMeshKernel(config?: MeshKernelConfig) {
  const [kernel, setKernel] = useState<MeshKernel | null>(null);
  const [status, setStatus] = useState<MeshKernelStatus | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    let unsubStatus: (() => void) | undefined;
    let localKernel: MeshKernel | null = null;

    MeshKernel.create(config)
      .then((k) => {
        if (!active) {
          k.destroy();
          return;
        }
        localKernel = k;
        setKernel(k);
        setStatus(k.getStatus());
        setIsReady(true);

        unsubStatus = k.onStatusChange((s) => {
          if (active) setStatus(s);
        });
      })
      .catch((err) => {
        if (active) setError(err);
      });

    return () => {
      active = false;
      unsubStatus?.();
      localKernel?.destroy();
    };
  }, []);

  return { kernel, status, isReady, error };
}

export function useCollection<T extends Identifiable>(
  kernel: MeshKernel | null,
  collectionName: string
) {
  const [items, setItems] = useState<T[]>([]);

  const collection = useMemo(() => {
    if (!kernel) return null;
    return kernel.collection<T>(collectionName);
  }, [kernel, collectionName]);

  useEffect(() => {
    if (!collection) {
      setItems([]);
      return;
    }

    const unsubscribe = collection.observe((newItems) => {
      setItems([...newItems]);
    });

    return () => {
      unsubscribe();
    };
  }, [collection]);

  const add = useCallback(
    (item: T) => {
      if (!collection) throw new Error('Collection is not ready');
      return collection.add(item);
    },
    [collection]
  );

  const update = useCallback(
    (id: string, partial: Partial<Omit<T, 'id'>>) => {
      if (!collection) throw new Error('Collection is not ready');
      return collection.update(id, partial);
    },
    [collection]
  );

  const remove = useCallback(
    (id: string) => {
      if (!collection) throw new Error('Collection is not ready');
      return collection.delete(id);
    },
    [collection]
  );

  const get = useCallback(
    (id: string) => {
      if (!collection) return undefined;
      return collection.get(id);
    },
    [collection]
  );

  return {
    items,
    collection,
    add,
    update,
    remove,
    get,
    count: items.length
  };
}
