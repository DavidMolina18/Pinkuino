import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { createSessionStore } from './sessionStore';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [store] = useState(() => createSessionStore(supabase.auth));
  useEffect(() => store.start(), [store]);
  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
}
