// Injectable and independent of Vite/browser credentials for deterministic tests.
export function createSessionStore(auth) {
  let state = { session: null, loading: true, error: '' };
  let active = false;
  let generation = 0;
  let revision = 0;
  let subscription;
  const listeners = new Set();
  const publish = (next) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  const bootstrap = async () => {
    const current = ++revision;
    publish({ session: null, loading: true, error: '' });
    try {
      const { data, error } = await auth.getSession();
      if (!active || current !== revision) return;
      if (error) throw error;
      publish({ session: data?.session ?? null, loading: false, error: '' });
    } catch {
      if (active && current === revision) {
        publish({ session: null, loading: false, error: 'No se pudo verificar la sesión.' });
      }
    }
  };
  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    retry: bootstrap,
    start() {
      const currentGeneration = ++generation;
      active = true;
      // Begin first so even a synchronous initial auth event supersedes bootstrap.
      void bootstrap();
      try {
        const result = auth.onAuthStateChange((_event, session) => {
          if (!active || currentGeneration !== generation) return;
          revision += 1;
          publish({ session, loading: false, error: '' });
        });
        subscription = result.data.subscription;
      } catch {
        revision += 1;
        publish({ session: null, loading: false, error: 'No se pudo escuchar la sesión.' });
      }
      return () => {
        if (currentGeneration !== generation) return;
        active = false;
        revision += 1;
        subscription?.unsubscribe();
      };
    },
  };
}
