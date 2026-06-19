export const demoProducts = [
  { id: '1', name: 'Curso Online Marketing Digital', description: 'Aprenda marketing digital do zero', price: 197, status: 'active', created_at: new Date().toISOString(), sales_count: 23, image_url: '' },
  { id: '2', name: 'E-book Receitas Saudáveis', description: '50 receitas para uma vida melhor', price: 47, status: 'active', created_at: new Date().toISOString(), sales_count: 87, image_url: '' },
  { id: '3', name: 'Consultoria Personalizada', description: 'Sessão de 1h com especialista', price: 350, status: 'active', created_at: new Date().toISOString(), sales_count: 12, image_url: '' },
  { id: '4', name: 'Plugin WordPress Pro', description: 'Plugin exclusivo para lojas virtuais', price: 97, status: 'inactive', created_at: new Date().toISOString(), sales_count: 0, image_url: '' },
];

export const demoOrders = [
  { id: 'ORD-001', customer_name: 'Ana Silva', customer_email: 'ana@email.com', amount: 197, gateway: 'pixgo', status: 'paid', created_at: new Date(Date.now() - 86400000).toISOString(), product_name: 'Curso Online Marketing Digital' },
  { id: 'ORD-002', customer_name: 'Carlos Santos', customer_email: 'carlos@email.com', amount: 47, gateway: 'abacatepay', status: 'paid', created_at: new Date(Date.now() - 172800000).toISOString(), product_name: 'E-book Receitas Saudáveis' },
  { id: 'ORD-003', customer_name: 'Mariana Lima', customer_email: 'mariana@email.com', amount: 350, gateway: 'kryptgateway', status: 'pending', created_at: new Date(Date.now() - 3600000).toISOString(), product_name: 'Consultoria Personalizada' },
  { id: 'ORD-004', customer_name: 'Pedro Oliveira', customer_email: 'pedro@email.com', amount: 197, gateway: 'pixgo', status: 'paid', created_at: new Date(Date.now() - 259200000).toISOString(), product_name: 'Curso Online Marketing Digital' },
  { id: 'ORD-005', customer_name: 'Julia Costa', customer_email: 'julia@email.com', amount: 47, gateway: 'pixgo', status: 'refunded', created_at: new Date(Date.now() - 345600000).toISOString(), product_name: 'E-book Receitas Saudáveis' },
];

export const demoLinks = [
  { id: '1', title: 'Meu Curso Completo', slug: 'meu-curso', amount: 197, active: true, created_at: new Date().toISOString(), sales_count: 5 },
  { id: '2', title: 'Doação Apoio', slug: 'doacao-apoio', amount: 0, active: true, created_at: new Date().toISOString(), sales_count: 12 },
  { id: '3', title: 'Workshop Exclusivo', slug: 'workshop-exclusivo', amount: 97, active: false, created_at: new Date().toISOString(), sales_count: 0 },
];

export const demoCheckout = {
  banner_url: '',
  logo_url: '',
  primary_color: '#10b981',
  secondary_color: '#059669',
  show_video: false,
  video_url: '',
  show_quiz: false,
  quiz_title: '',
  quiz_questions: [],
  show_gallery: false,
  gallery_images: [],
  show_reviews: false,
  reviews: [],
  custom_css: '',
  custom_js: '',
  demo_mode: true,
};

export const demoGatewayCreds = {
  abacatepay: { apiKey: '********', webhookSecret: '********' },
  kryptgateway: { clientId: 'krypt_ci_982568e2deb01be2c1', clientSecret: 'krypt_cs_9670f14f480666d50720f4526eb34a5c' },
  pixgo: { apiKey: '********', webhookSecret: '********' },
};

export function getDemoStats() {
  const totalSales = demoOrders.filter(o => o.status === 'paid').length;
  const revenue = demoOrders.filter(o => o.status === 'paid').reduce((s, o) => s + o.amount, 0);
  const pending = demoOrders.filter(o => o.status === 'pending').length;
  return { totalSales, revenue, pending, products: demoProducts.length, links: demoLinks.length };
}
