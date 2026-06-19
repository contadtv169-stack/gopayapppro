import { demoProducts, demoOrders, demoLinks, demoCheckout, demoGatewayCreds, getDemoStats } from './demoData';

type DemoHandler = (config: any) => any;

const handlers: Record<string, Record<string, DemoHandler>> = {
  GET: {
    '/users/me': () => {
      const u = localStorage.getItem('gopay_user');
      return u ? JSON.parse(u) : { id: 'demo', name: 'Vendedor', email: 'vendedor@demo.com' };
    },
    '/products': () => demoProducts,
    '/orders': () => ({
      data: demoOrders,
      total: demoOrders.length,
      page: 1,
      limit: 50,
    }),
    '/orders/stats': () => {
      const paid = demoOrders.filter(o => o.status === 'paid');
      return {
        totalOrders: demoOrders.length,
        totalRevenue: demoOrders.reduce((s, o) => s + o.amount, 0),
        totalPaid: paid.reduce((s, o) => s + o.amount, 0),
        totalNet: paid.reduce((s, o) => s + o.amount * 0.85, 0),
        pendingOrders: demoOrders.filter(o => o.status === 'pending').length,
      };
    },
    '/orders/recent': () => demoOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10),
    '/payment-links': () => demoLinks,
    '/gateways': () => Object.entries(demoGatewayCreds).map(([gateway, creds]) => ({ gateway, is_active: true, ...creds })),
    '/dashboard/stats': () => getDemoStats(),
    '/checkout/customization': () => demoCheckout,
  },
  POST: {
    '/auth/login': (config: any) => {
      const { email, password } = JSON.parse(config.data || '{}');
      if (email === 'demo@gopay.com.br' && password === '123456') {
        return { accessToken: 'demo-token', refreshToken: 'demo-refresh', user: { id: 'demo', name: 'Vendedor GoPay', email, business_name: 'Minha Loja' } };
      }
      throw new Error('Credenciais inválidas');
    },
    '/auth/register': (config: any) => {
      const { name, email } = JSON.parse(config.data || '{}');
      return { accessToken: 'demo-token', refreshToken: 'demo-refresh', user: { id: 'demo-' + Date.now(), name, email } };
    },
    '/products': (config: any) => {
      const body = JSON.parse(config.data || '{}');
      return { id: String(Date.now()), ...body, sales_count: 0, created_at: new Date().toISOString() };
    },
  },
  PUT: {
    '/users/me': (config: any) => {
      const updates = JSON.parse(config.data || '{}');
      const current = localStorage.getItem('gopay_user');
      if (current) {
        const user = { ...JSON.parse(current), ...updates };
        localStorage.setItem('gopay_user', JSON.stringify(user));
      }
      return { success: true };
    },
    '/checkout/customization': () => ({ success: true }),
  },
};

export async function authHandler(config: any): Promise<any> {
  const method = (config.method || 'get').toUpperCase();
  const url = config.url || '';
  const handler = handlers[method]?.[url];
  if (handler) {
    try {
      return handler(config);
    } catch (e: any) {
      throw e;
    }
  }
  if (url.startsWith('/products/') && method === 'GET') {
    const id = url.replace('/products/', '');
    return demoProducts.find(p => p.id === id) || null;
  }
  if (url.startsWith('/products/') && method === 'PUT') {
    const id = url.replace('/products/', '').split('?')[0];
    const body = JSON.parse(config.data || '{}');
    const idx = demoProducts.findIndex(p => p.id === id);
    if (idx >= 0) demoProducts[idx] = { ...demoProducts[idx], ...body };
    return { success: true };
  }
  if (url.startsWith('/products/') && method === 'DELETE') {
    return { success: true };
  }
  if (url.startsWith('/checkout/product/') && method === 'GET') {
    const slug = url.replace('/checkout/product/', '');
    const p = demoProducts.find(x => x.name.toLowerCase().replace(/\s+/g, '-') === slug);
    if (p) return p;
    return demoProducts[0];
  }
  if (url.startsWith('/checkout/product/') && method === 'POST') {
    return {
      id: 'ord-demo-' + Date.now(),
      status: 'pending',
      copyPaste: '00020126360014br.gov.bcb.pix0114+55119999988880204PAGAMENTO520400005303986540697.005802BR5925Vendedor GoPay6009Sao Paulo62070503***6304E2B7',
      qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjUwIiB5PSIxMDAiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMwMDAiPlBpeCBRUiBDb2RlPC90ZXh0Pjx0ZXh0IHg9IjUwIiB5PSIxMjAiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjYiPlBhZ3VlIGFnb3JhPC90ZXh0Pjwvc3ZnPg==',
      expiresAt: new Date(Date.now() + 1200000).toISOString(),
      amount: 197.00,
    };
  }
  if (url.startsWith('/checkout/order/') && method === 'GET') {
    return { status: 'pending' };
  }
  if (url.startsWith('/checkout/link/') && method === 'GET') {
    const slug = url.replace('/checkout/link/', '');
    const link = demoLinks.find(x => x.slug === slug);
    if (link) return link;
    return demoLinks[0];
  }
  if (url.startsWith('/payment-links/') && method === 'POST') {
    const body = JSON.parse(config.data || '{}');
    return { id: String(Date.now()), ...body, active: true, sales_count: 0, created_at: new Date().toISOString() };
  }
  if (url.startsWith('/notifications/unread-count')) {
    return { count: 3 };
  }
  if (url.startsWith('/customizations/')) {
    return demoCheckout;
  }
  if (url.startsWith('/gateways/') && method === 'POST') {
    return { success: true };
  }
  return null;
}
