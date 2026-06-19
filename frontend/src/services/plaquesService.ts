import { supabase } from './supabase';
import { getOrders } from './supabaseData';

function getUserId() {
  try {
    const u = localStorage.getItem('gopay_user');
    return u ? JSON.parse(u).id : null;
  } catch { return null; }
}

const PLAQUE_TEMPLATES = [
  { name: 'Primeira Venda', description: 'Realize sua primeira venda', goal_type: 'sales', goal_value: 1, icon: 'star', color_scheme: 'bronze' },
  { name: '5 Vendas', description: 'Acumule 5 vendas realizadas', goal_type: 'sales', goal_value: 5, icon: 'trending-up', color_scheme: 'silver' },
  { name: '10 Vendas', description: 'Acumule 10 vendas realizadas', goal_type: 'sales', goal_value: 10, icon: 'award', color_scheme: 'gold' },
  { name: '50 Vendas', description: 'Acumule 50 vendas realizadas', goal_type: 'sales', goal_value: 50, icon: 'zap', color_scheme: 'platinum' },
  { name: '100 Vendas', description: 'Acumule 100 vendas realizadas!', goal_type: 'sales', goal_value: 100, icon: 'diamond', color_scheme: 'diamond' },
  { name: 'R$ 100 em vendas', description: 'Acumule R$ 100 em vendas', goal_type: 'revenue', goal_value: 100, icon: 'dollar-sign', color_scheme: 'bronze' },
  { name: 'R$ 500 em vendas', description: 'Acumule R$ 500 em vendas', goal_type: 'revenue', goal_value: 500, icon: 'dollar-sign', color_scheme: 'silver' },
  { name: 'R$ 1.000 em vendas', description: 'Acumule R$ 1.000 em vendas!', goal_type: 'revenue', goal_value: 1000, icon: 'diamond', color_scheme: 'gold' },
  { name: 'Meta noturna', description: 'Faça uma venda após as 22h', goal_type: 'special', goal_value: 1, icon: 'moon', color_scheme: 'dark' },
  { name: 'Cliente fiel', description: 'Mesmo cliente comprar 3 vezes', goal_type: 'special', goal_value: 3, icon: 'heart', color_scheme: 'ruby' },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; gradient: string; medal: string }> = {
  bronze: { bg: '#fef3e2', text: '#9c6b3e', border: '#d4a373', gradient: 'linear-gradient(135deg, #cd7f32, #b87333)', medal: '#cd7f32' },
  silver: { bg: '#f0f4f8', text: '#64748b', border: '#94a3b8', gradient: 'linear-gradient(135deg, #c0c0c0, #a8a8a8)', medal: '#c0c0c0' },
  gold: { bg: '#fef9e7', text: '#b8860b', border: '#f0d060', gradient: 'linear-gradient(135deg, #ffd700, #daa520)', medal: '#ffd700' },
  platinum: { bg: '#e8f4f8', text: '#2c7a9e', border: '#5fa8c7', gradient: 'linear-gradient(135deg, #e5e4e2, #b0c4de)', medal: '#b0c4de' },
  diamond: { bg: '#e8f0fe', text: '#1a5276', border: '#3b82f6', gradient: 'linear-gradient(135deg, #b9f2ff, #87ceeb)', medal: '#00bfff' },
  dark: { bg: '#1e293b', text: '#e2e8f0', border: '#334155', gradient: 'linear-gradient(135deg, #0f172a, #1e293b)', medal: '#64748b' },
  ruby: { bg: '#fef2f2', text: '#991b1b', border: '#f87171', gradient: 'linear-gradient(135deg, #e0115f, #c21e56)', medal: '#e0115f' },
};

async function getSalesCount(userId: string) {
  try {
    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['paid', 'completed']);
    return count || 0;
  } catch { return 0; }
}

async function getRevenue(userId: string) {
  try {
    const { data } = await supabase.from('orders').select('amount').eq('user_id', userId).in('status', ['paid', 'completed']);
    return (data || []).reduce((s: number, o: any) => s + Number(o.amount), 0);
  } catch { return 0; }
}

export async function syncPlaques() {
  const uid = getUserId();
  if (!uid) return;
  const sales = await getSalesCount(uid);
  const revenue = await getRevenue(uid);
  const { data: existing } = await supabase.from('plaques').select('*').eq('user_id', uid);
  const existingNames = new Set((existing || []).map((p: any) => p.name));

  for (const tmpl of PLAQUE_TEMPLATES) {
    if (existingNames.has(tmpl.name)) continue;
    const current = tmpl.goal_type === 'sales' ? sales : revenue;
    const unlocked = current >= tmpl.goal_value;
    await supabase.from('plaques').insert({
      user_id: uid,
      name: tmpl.name,
      description: tmpl.description,
      goal_type: tmpl.goal_type,
      goal_value: tmpl.goal_value,
      current_value: Math.min(current, tmpl.goal_value),
      icon: tmpl.icon,
      color_scheme: tmpl.color_scheme,
      is_unlocked: unlocked,
      unlocked_at: unlocked ? new Date().toISOString() : null,
    }).maybeSingle();
  }
}

export async function getPlaques() {
  const uid = getUserId();
  if (!uid) return [];
  const { data } = await supabase.from('plaques').select('*').eq('user_id', uid).order('goal_value', { ascending: true });
  return data || [];
}

export async function updatePlaqueProgress(id: string, current: number, unlocked: boolean) {
  await supabase.from('plaques').update({
    current_value: current,
    is_unlocked: unlocked,
    unlocked_at: unlocked ? new Date().toISOString() : null,
  }).eq('id', id);
}

export async function deletePlaque(id: string) {
  await supabase.from('plaques').delete().eq('id', id);
}

export { PLAQUE_TEMPLATES, COLOR_MAP, getSalesCount, getRevenue };
