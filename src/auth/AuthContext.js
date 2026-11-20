import { createContext, useContext, useSyncExternalStore } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
  const store = useContext(AuthContext);
  if (!store) throw new Error('AuthProvider required');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { ...state, retry: store.retry };
}
