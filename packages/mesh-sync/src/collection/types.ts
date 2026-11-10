export interface Identifiable {
  id: string;
}

export interface Collection<T extends Identifiable> {
  readonly name: string;
  add(item: T): T;
  update(id: string, partial: Partial<Omit<T, 'id'>>): T | null;
  delete(id: string): boolean;
  get(id: string): T | undefined;
  getAll(): T[];
  query(predicate?: (item: T) => boolean): T[];
  observe(callback: (items: T[]) => void): () => void;
  count(): number;
  clear(): void;
}
