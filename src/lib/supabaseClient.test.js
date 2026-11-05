import test from 'node:test';
import assert from 'node:assert/strict';
import { supabase } from './supabaseClient.js';

function assertNotConfigured(result) {
  assert.equal(result.error?.code, 'SUPABASE_NOT_CONFIGURED');
  assert.match(result.error.message, /VITE_SUPABASE_URL/);
}

test('missing configuration leaves the public app signed out', async () => {
  const result = await supabase.auth.getSession();
  assert.equal(result.data.session, null);
  assert.equal(result.error, null);
  const { data } = supabase.auth.onAuthStateChange(() => {});
  assert.doesNotThrow(() => data.subscription.unsubscribe());
});

test('missing configuration rejects login, signup and account changes', async () => {
  for (const action of ['signInWithPassword', 'signUp', 'updateUser']) {
    const result = await supabase.auth[action]({});
    assertNotConfigured(result);
    assert.equal(result.data.user, null);
  }
});

test('missing configuration reports failed reads through the application query chains', async () => {
  for (const result of [
    await supabase.from('profiles').select('*').eq('id', 'user-123').maybeSingle(),
    await supabase.from('concepts').select('*').in('id', ['card-1']).order('id').limit(5),
  ]) {
    assertNotConfigured(result);
    assert.equal(result.data, null);
  }
});

test('missing configuration cannot report saved progress or deleted records', async () => {
  for (const action of ['insert', 'update', 'upsert', 'delete']) {
    const result = await supabase.from('progress')[action]({ score: 100 }).select('id').single();
    assertNotConfigured(result);
    assert.equal(result.data, null);
  }
});

test('missing configuration cannot approve usernames, invoke AI or invent uploaded images', async () => {
  for (const result of [
    await supabase.rpc('is_username_available', { check_username: 'learner' }),
    await supabase.functions.invoke('ai-practice-session', { body: {} }),
    await supabase.storage.from('avatars').upload('learner/avatar', {}),
  ]) {
    assertNotConfigured(result);
    assert.equal(result.data, null);
  }
  const url = supabase.storage.from('avatars').getPublicUrl('learner/avatar');
  assertNotConfigured(url);
  assert.equal(url.data.publicUrl, null);
});
