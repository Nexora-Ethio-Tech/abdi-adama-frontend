import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(name, imports = {}, globals = {}) {
  const source = readFileSync(new URL(`../src/services/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  vm.runInNewContext(outputText, { exports: module.exports, module, require: key => {
    assert.ok(key in imports, `Unexpected import: ${key}`);
    return imports[key];
  }, ...globals });
  return module.exports;
}

function cacheFixture() {
  let now = 0;
  const cache = load('studentListCache', {}, { Date: { now: () => now } });
  return { ...cache, advance: ms => { now += ms; } };
}

test('deduplicates concurrent requests and reuses fresh pages, expiring after one minute', async () => {
  const cache = cacheFixture();
  let calls = 0;
  const fetcher = async () => ++calls;
  const first = cache.cachedStudentList('session-a', 'page-1', fetcher);
  const second = cache.cachedStudentList('session-a', 'page-1', fetcher);
  assert.equal(first, second);
  assert.equal(await first, 1);
  cache.advance(59_999);
  assert.equal(await cache.cachedStudentList('session-a', 'page-1', fetcher), 1);
  cache.advance(1);
  assert.equal(await cache.cachedStudentList('session-a', 'page-1', fetcher), 2);
});

test('isolates pages and users, and limits retained pages', async () => {
  const cache = cacheFixture();
  let calls = 0;
  const fetcher = async () => ++calls;
  for (let i = 0; i < 31; i++) await cache.cachedStudentList('a', String(i), fetcher);
  assert.equal(await cache.cachedStudentList('a', '0', fetcher), 32);
  assert.equal(await cache.cachedStudentList('b', '0', fetcher), 33);
  assert.equal(await cache.cachedStudentList('a', '0', fetcher), 34);
});

test('a response started before a mutation cannot overwrite the refreshed cache', async () => {
  const cache = cacheFixture();
  let resolveOld;
  const old = cache.cachedStudentList('a', 'page', () => new Promise(resolve => { resolveOld = resolve; }));
  cache.invalidateStudentLists();
  assert.equal(await cache.cachedStudentList('a', 'page', async () => 'new'), 'new');
  resolveOld('old');
  await old;
  assert.equal(await cache.cachedStudentList('a', 'page', async () => 'wrong'), 'new');
});

test('failed fetches are retried, not cached', async () => {
  const cache = cacheFixture();
  await assert.rejects(cache.cachedStudentList('a', 'page', async () => { throw new Error('offline'); }));
  assert.equal(await cache.cachedStudentList('a', 'page', async () => 'recovered'), 'recovered');
});

function serviceFixture(get) {
  return load('studentService', { './api': { __esModule: true, default: { get } }, './studentListCache': cacheFixture() }, {
    localStorage: { getItem: () => 'test-session' },
  }).default;
}

test('export and select-all traverse every matching page with the same filters', async () => {
  const requests = [];
  const service = serviceFixture(async (url, { params }) => {
    requests.push({ url, params });
    return { data: { data: [{ id: `student-${params.page}` }], pagination: { page: params.page, totalPages: 3 } } };
  });
  const rows = await service.getMatchingStudents({ grade: '7', status: 'Active', search: 'test', section: '2' });
  assert.deepEqual(Array.from(rows, r => r.id), ['student-1', 'student-2', 'student-3']);
  assert.equal(requests.length, 3);
  for (const [index, request] of requests.entries()) {
    assert.equal(request.url, '/school-admin/students');
    assert.equal(JSON.stringify(request.params), JSON.stringify({ grade: '7', status: 'Active', search: 'test', section: '2', page: index + 1, pageSize: 100 }));
  }
});

test('partial export/selection fails if any page fails', async () => {
  const service = serviceFixture(async (_url, { params }) => {
    if (params.page === 2) throw new Error('offline');
    return { data: { data: [{ id: 'student-1' }], pagination: { page: 1, totalPages: 2 } } };
  });
  await assert.rejects(service.getMatchingStudents({}), /offline/);
});

test('returning to the same page reuses cache; different filters fetch separately', async () => {
  let calls = 0;
  const service = serviceFixture(async () => { calls++; return { data: { data: [], pagination: {} } }; });
  await service.getStudentPage({}, 1, 25, 'branch-a');
  await service.getStudentPage({}, 2, 25, 'branch-a');
  await service.getStudentPage({}, 1, 25, 'branch-a');
  assert.equal(calls, 2);
  await service.getStudentPage({ grade: '1' }, 1, 25, 'branch-a');
  assert.equal(calls, 3);
  service.invalidateLists();
  await service.getStudentPage({}, 1, 25, 'branch-a');
  assert.equal(calls, 4);
});
