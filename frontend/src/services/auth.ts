const DEMO_USER = {
  id: 'demo-user-1',
  name: 'Vendedor GoPay',
  email: 'demo@gopay.com.br',
  business_name: 'Minha Loja',
  phone: '(11) 99999-8888',
  document: '12.345.678/0001-90',
};

export async function login(email: string, password: string) {
  await new Promise(r => setTimeout(r, 800));
  if (password === '123456') {
    const tokens = { accessToken: 'demo-token-' + Date.now(), refreshToken: 'demo-refresh-' + Date.now() };
    localStorage.setItem('gopay_user', JSON.stringify({ ...DEMO_USER, email }));
    localStorage.setItem('gopay_token', tokens.accessToken);
    localStorage.setItem('gopay_refresh', tokens.refreshToken);
    return { user: { ...DEMO_USER, email }, ...tokens };
  }
  throw new Error('Credenciais inválidas. Use qualquer email com senha 123456');
}

export async function register(name: string, email: string, password: string) {
  await new Promise(r => setTimeout(r, 800));
  const user = { ...DEMO_USER, id: 'demo-' + Date.now(), name, email };
  const tokens = { accessToken: 'demo-token-' + Date.now(), refreshToken: 'demo-refresh-' + Date.now() };
  localStorage.setItem('gopay_user', JSON.stringify(user));
  localStorage.setItem('gopay_token', tokens.accessToken);
  localStorage.setItem('gopay_refresh', tokens.refreshToken);
  return { user, ...tokens };
}

export function getStoredUser() {
  try {
    const u = localStorage.getItem('gopay_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export function logout() {
  localStorage.removeItem('gopay_user');
  localStorage.removeItem('gopay_token');
  localStorage.removeItem('gopay_refresh');
}
