import { supabase } from '../config/supabase';

export class CustomizationService {
  // Checkout Customization (per product)
  async getCheckoutCustomization(userId: string, productId: string) {
    const { data, error } = await supabase.from('checkout_customizations')
      .select('*').eq('user_id', userId).eq('product_id', productId).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  async saveCheckoutCustomization(userId: string, productId: string, data: any) {
    const existing = await supabase.from('checkout_customizations')
      .select('id').eq('user_id', userId).eq('product_id', productId).single();
    
    const payload = {
      user_id: userId,
      product_id: productId,
      white_label: data.white_label ?? false,
      hide_gopay_branding: data.hide_gopay_branding ?? false,
      logo_url: data.logo_url || null,
      logo_position: data.logo_position || 'center',
      banner_url: data.banner_url || null,
      banner_type: data.banner_type || 'image',
      banner_color: data.banner_color || null,
      banner_gradient_start: data.banner_gradient_start || null,
      banner_gradient_end: data.banner_gradient_end || null,
      video_url: data.video_url || null,
      video_autoplay: data.video_autoplay ?? false,
      video_loop: data.video_loop ?? false,
      quiz_enabled: data.quiz_enabled ?? false,
      quiz_title: data.quiz_title || null,
      quiz_questions: data.quiz_questions || [],
      gallery_images: data.gallery_images || [],
      gallery_layout: data.gallery_layout || 'grid',
      reviews_enabled: data.reviews_enabled ?? false,
      reviews: data.reviews || [],
      reviews_average: data.reviews_average || 0,
      reviews_count: data.reviews_count || 0,
      primary_color: data.primary_color || '#22c55e',
      secondary_color: data.secondary_color || '#6366f1',
      background_color: data.background_color || '#ffffff',
      text_color: data.text_color || '#111827',
      button_color: data.button_color || '#22c55e',
      button_text_color: data.button_text_color || '#ffffff',
      custom_css: data.custom_css || null,
      custom_js: data.custom_js || null,
      theme: data.theme || 'default',
    };

    if (existing.data) {
      const { data: result, error } = await supabase.from('checkout_customizations')
        .update(payload).eq('id', existing.data.id).select().single();
      if (error) throw new Error(error.message);
      return result;
    }

    const { data: result, error } = await supabase.from('checkout_customizations')
      .insert(payload).select().single();
    if (error) throw new Error(error.message);
    return result;
  }

  async getAllCheckoutCustomizations(userId: string) {
    const { data, error } = await supabase.from('checkout_customizations')
      .select('*, products(name)').eq('user_id', userId).order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  // Public: get customization for a product (no auth)
  async getPublicCheckoutCustomization(productId: string) {
    const { data, error } = await supabase.from('checkout_customizations')
      .select('*').eq('product_id', productId).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  // Page Customization (for payment links / general)
  async getPageCustomization(userId: string, pageType: string, pageId?: string) {
    let query = supabase.from('page_customizations')
      .select('*').eq('user_id', userId).eq('page_type', pageType);
    if (pageId) query = query.eq('page_id', pageId);
    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  async savePageCustomization(userId: string, pageType: string, data: any, pageId?: string) {
    const existing = await supabase.from('page_customizations')
      .select('id').eq('user_id', userId).eq('page_type', pageType)
      .eq('page_id', pageId || null).single();

    const payload = {
      user_id: userId,
      page_type: pageType,
      page_id: pageId || null,
      ...data,
    };

    if (existing.data) {
      const { data: result, error } = await supabase.from('page_customizations')
        .update(payload).eq('id', existing.data.id).select().single();
      if (error) throw new Error(error.message);
      return result;
    }

    const { data: result, error } = await supabase.from('page_customizations')
      .insert(payload).select().single();
    if (error) throw new Error(error.message);
    return result;
  }

  // Gallery upload simulation (returns the URL)
  async uploadImage(userId: string, base64Image: string, filename: string) {
    const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const path = `gallery/${userId}/${Date.now()}-${filename}`;
    
    const { data, error } = await supabase.storage.from('gopay-media').upload(path, buffer, {
      contentType: filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
      upsert: true,
    });
    
    if (error) throw new Error(error.message);
    const { data: urlData } = supabase.storage.from('gopay-media').getPublicUrl(path);
    return { url: urlData.publicUrl, path };
  }
}

export const customizationService = new CustomizationService();
