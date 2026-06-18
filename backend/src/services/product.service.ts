import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';

export class ProductService {
  async list(userId: string) {
    const { data, error } = await supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) throw new Error('Produto não encontrado');
    return data;
  }

  async getByCheckoutUrl(slug: string) {
    const { data, error } = await supabase.from('products').select('*, users!inner(business_name, business_logo)')
      .eq('checkout_url', slug).eq('is_active', true).single();
    if (error) throw new Error('Produto não encontrado');
    return data;
  }

  async create(userId: string, data: any) {
    const checkoutUrl = uuidv4().slice(0, 8) + '-' + data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    const { data: result, error } = await supabase.from('products').insert({
      user_id: userId,
      name: data.name,
      description: data.description || '',
      price: data.price,
      image_url: data.image_url || '',
      product_type: data.product_type || 'digital',
      checkout_url: checkoutUrl,
    }).select().single();
    if (error) throw new Error(error.message);
    return result;
  }

  async update(id: string, userId: string, data: any) {
    const { data: result, error } = await supabase.from('products').update({
      name: data.name,
      description: data.description,
      price: data.price,
      image_url: data.image_url,
      product_type: data.product_type,
      is_active: data.is_active,
    }).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw new Error(error.message);
    return result;
  }

  async remove(id: string, userId: string) {
    const { error } = await supabase.from('products').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }
}

export const productService = new ProductService();
