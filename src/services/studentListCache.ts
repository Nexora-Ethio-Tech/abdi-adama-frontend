// Memory only: never persist student records to browser storage.
const TTL = 60_000;
const MAX_ENTRIES = 30;
const entries = new Map<string, { value: unknown; expires: number }>();
const pending = new Map<string, Promise<unknown>>();
let currentScope = '';
let generation = 0;

export function invalidateStudentLists() {
  generation++;
  entries.clear();
  pending.clear();
}

export function cachedStudentList<T>(scope: string, key: string, fetcher: () => Promise<T>): Promise<T> {
  if (scope !== currentScope) {
    invalidateStudentLists();
    currentScope = scope;
  }
  const cached = entries.get(key);
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value as T);
  entries.delete(key);
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;
  const requestGeneration = generation;
  const request = fetcher().then(value => {
    if (generation === requestGeneration) {
      entries.set(key, { value, expires: Date.now() + TTL });
      if (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value!);
    }
    return value;
  }).finally(() => {
    if (pending.get(key) === request) pending.delete(key);
  });
  pending.set(key, request);
  return request;
}
