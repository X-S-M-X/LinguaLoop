import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(url) {
  if (!url) return '';
  return url.replace(/\/(?:rest|auth)\/v1\/?$/i, '').replace(/\/+$/, '');
}

const viteEnv = import.meta.env ?? {};
const supabaseUrl = normalizeSupabaseUrl(viteEnv.VITE_SUPABASE_URL);
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY;
const configurationMessage =
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable accounts and saved data.';

function configurationFailure(data = null) {
  return {
    data,
    error: { code: 'SUPABASE_NOT_CONFIGURED', message: configurationMessage },
  };
}

function unavailableQuery() {
  const result = () => Promise.resolve(configurationFailure());
  const query = {
    select: () => query,
    eq: () => query,
    in: () => query,
    order: () => query,
    limit: () => query,
    insert: () => query,
    update: () => query,
    upsert: () => query,
    delete: () => query,
    maybeSingle: result,
    single: result,
    then: (resolve, reject) => result().then(resolve, reject),
    catch: (reject) => result().catch(reject),
    finally: (onFinally) => result().finally(onFinally),
  };
  return query;
}

function createUnconfiguredClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
      signInWithPassword: async () =>
        configurationFailure({ session: null, user: null }),
      signUp: async () => configurationFailure({ session: null, user: null }),
      updateUser: async () => configurationFailure({ user: null }),
      signOut: async () => ({ error: null }),
    },
    from: unavailableQuery,
    rpc: async () => configurationFailure(),
    functions: { invoke: async () => configurationFailure() },
    storage: {
      from: () => ({
        upload: async () => configurationFailure(),
        getPublicUrl: () => configurationFailure({ publicUrl: null }),
      }),
    },
  };
}

const configured =
  supabaseUrl && supabaseAnonKey && /^https?:\/\//.test(supabaseUrl);
const supabase = configured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createUnconfiguredClient();

if (!configured) console.warn(configurationMessage);

export { supabase };
