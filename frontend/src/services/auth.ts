import { supabase } from './supabase';

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message);
  const user = {
    id: data.user.id,
    email: data.user.email!,
    name: data.user.user_metadata?.name || email.split('@')[0],
    business_name: data.user.user_metadata?.business_name || '',
  };
  localStorage.setItem('gopay_user', JSON.stringify(user));
  localStorage.setItem('gopay_token', data.session?.access_token || '');
  localStorage.setItem('gopay_refresh', data.session?.refresh_token || '');
  return { user, accessToken: data.session?.access_token, refreshToken: data.session?.refresh_token };
}

export async function register(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  const user = { id: data.user!.id, email, name, business_name: '' };
  localStorage.setItem('gopay_user', JSON.stringify(user));
  localStorage.setItem('gopay_token', data.session?.access_token || '');
  localStorage.setItem('gopay_refresh', data.session?.refresh_token || '');
  return { user, accessToken: data.session?.access_token, refreshToken: data.session?.refresh_token };
}

export async function getStoredUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const local = localStorage.getItem('gopay_user');
    if (local) return JSON.parse(local);
    const user = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
      business_name: session.user.user_metadata?.business_name || '',
    };
    localStorage.setItem('gopay_user', JSON.stringify(user));
    return user;
  }
  try {
    const u = localStorage.getItem('gopay_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem('gopay_user');
  localStorage.removeItem('gopay_token');
  localStorage.removeItem('gopay_refresh');
}
