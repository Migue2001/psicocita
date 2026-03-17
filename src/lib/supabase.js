import { createClient } from '@supabase/supabase-js';

const forceDemo = import.meta.env.VITE_DEMO_MODE === 'true';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (forceDemo || !supabaseUrl || !supabaseAnonKey) {
  console.warn('Modo Demo activo: se usarán datos locales y logins demo.');
}

// FIX #2: eliminamos multiTab: false — esa opción impedía que otras pestañas
// vieran la sesión activa, causando que se quedaran en blanco o en /login.
// Supabase maneja multi-pestaña correctamente por defecto con BroadcastChannel.
export const supabase = (!forceDemo && supabaseUrl && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'psicocita-auth',
        autoRefreshToken: true,
        persistSession: true,
        // multiTab: false  ← ELIMINADO: esto rompía otras pestañas
      }
    })
  : null;
