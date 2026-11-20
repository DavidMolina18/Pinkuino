import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionStore } from '../src/auth/sessionStore.js';

function harness() {
  let resolve;
  let reject;
  let callback;
  let unsubscribed = 0;
  const auth = {
    getSession: () => new Promise((yes, no) => { resolve = yes; reject = no; }),
    onAuthStateChange(fn) {
      callback = fn;
      return { data: { subscription: { unsubscribe() { unsubscribed += 1; } } } };
    },
  };
  const store = createSessionStore(auth);
  return { store, resolve: (v) => resolve(v), reject: () => reject(new Error('offline')),
    emit: (s) => callback('EVENT', s), unsubscribed: () => unsubscribed };
}
const tick = () => new Promise((resolve) => queueMicrotask(resolve));

test('bootstrap signed out and subscriber cleanup', async () => {
  const h = harness();
  let calls = 0;
  const unsubscribe = h.store.subscribe(() => { calls += 1; });
  const stop = h.store.start();
  assert.equal(h.store.getSnapshot().loading, true);
  h.resolve({ data: { session: null } });
  await tick();
  assert.deepEqual(h.store.getSnapshot(), { session: null, loading: false, error: '' });
  unsubscribe();
  const previous = calls;
  h.emit({ user: { id: 'admin' } });
  assert.equal(calls, previous);
  stop();
  assert.equal(h.unsubscribed(), 1);
});

test('new auth event wins over stale bootstrap', async () => {
  const h = harness();
  h.store.start();
  h.emit(null);
  h.resolve({ data: { session: { user: { id: 'stale' } } } });
  await tick();
  assert.equal(h.store.getSnapshot().session, null);
});

test('unmounted bootstrap cannot publish', async () => {
  const h = harness();
  const stop = h.store.start();
  stop();
  const previous = h.store.getSnapshot();
  h.resolve({ data: { session: {} } });
  await tick();
  assert.equal(h.store.getSnapshot(), previous);
});

test('bootstrap failure fails closed and retry recovers', async () => {
  const h = harness();
  h.store.start();
  h.reject();
  await tick();
  assert.equal(h.store.getSnapshot().session, null);
  assert.ok(h.store.getSnapshot().error);
  const pending = h.store.retry();
  h.resolve({ data: { session: { user: { id: 'admin' } } } });
  await pending;
  assert.equal(h.store.getSnapshot().session.user.id, 'admin');
});

test('returned bootstrap auth errors fail closed', async () => {
  const h = harness();
  h.store.start();
  h.resolve({ data: { session: { user: {} } }, error: { message: 'sensitive' } });
  await tick();
  assert.equal(h.store.getSnapshot().session, null);
  assert.ok(h.store.getSnapshot().error);
  assert.equal(h.store.getSnapshot().error.includes('sensitive'), false);
});

test('listener setup failure cannot be reopened by pending bootstrap', async () => {
  let resolve;
  const store = createSessionStore({
    getSession: () => new Promise((yes) => { resolve = yes; }),
    onAuthStateChange() { throw new Error('secret'); },
  });
  store.start();
  resolve({ data: { session: { user: {} } } });
  await tick();
  assert.equal(store.getSnapshot().session, null);
  assert.ok(store.getSnapshot().error);
});

test('StrictMode-style stop/restart ignores old bootstrap and queued listener events', async () => {
  const pending = [];
  const callbacks = [];
  let cleanups = 0;
  const store = createSessionStore({
    getSession: () => new Promise((resolve) => pending.push(resolve)),
    onAuthStateChange(callback) {
      callbacks.push(callback);
      return { data: { subscription: { unsubscribe() { cleanups += 1; } } } };
    },
  });
  const stopFirst = store.start();
  stopFirst();
  const stopSecond = store.start();
  pending[0]({ data: { session: { user: { id: 'stale' } } } });
  callbacks[0]('SIGNED_IN', { user: { id: 'stale' } });
  await tick();
  assert.equal(store.getSnapshot().loading, true);
  pending[1]({ data: { session: null } });
  await tick();
  assert.equal(store.getSnapshot().session, null);
  callbacks[1]('SIGNED_IN', { user: { id: 'current' } });
  assert.equal(store.getSnapshot().session.user.id, 'current');
  callbacks[1]('SIGNED_OUT', null);
  assert.equal(store.getSnapshot().session, null);
  stopSecond();
  assert.equal(cleanups, 2);
});
