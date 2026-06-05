import { createClient } from '@supabase/supabase-js'

// 1. Leemos las variables de entorno que ocultamos en el paso anterior
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Verificamos que las variables existan (útil para atrapar errores rápido)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las variables de entorno de Supabase. Revisa tu archivo .env.local");
}

// 3. Creamos y exportamos el "cliente"
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

