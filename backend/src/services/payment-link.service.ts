import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

export class PaymentLinkService {
  async list(userId: string) {
    const { data, error } = await supabase.from('payment_links').select('*, products(name, price)').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getBySlug(slug: string) {
    const { data, error } = await supabase.from('payment_links').select('*, users!inner(business_name, business_logo), products(name, price, description, image_url)').eq('slug', slug).eq('is_active', true).single();
    if (error) throw new Error('Link não encontrado');
    return data;
  }

  async create(userId: string, data: any) {
    const slug = data.slug || (uuidv4().slice(0, 8) + '-' + data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30));
    const { data: result, error } = await supabase.from('payment_links').insert({
      user_id: userId, product_id: data.product_id || null, title: data.title, description: data.description || '',
      amount: data.amount, slug, max_payments: data.max_payments || null,
    }).select().single();
    if (error) throw new Error(error.message);
    return result;
  }

  async update(id: string, userId: string, data: any) {
    const { data: result, error } = await supabase.from('payment_links').update(data).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw new Error(error.message);
    return result;
  }

  async remove(id: string, userId: string) {
    const { error } = await supabase.from('payment_links').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }
}
export const paymentLinkService = new PaymentLinkService();
