import { supabase } from '../config/supabase';
import CryptoJS from 'crypto-js';
import { config } from '../config';

const KEY = config.jwt.secret;

export class GatewayCredentialService {
  private encrypt(text: string): string { return CryptoJS.AES.encrypt(text, KEY).toString(); }
  private decrypt(ciphertext: string): string { return CryptoJS.AES.decrypt(ciphertext, KEY).toString(CryptoJS.enc.Utf8); }

  async save(userId: string, gateway: string, creds: { apiKey?: string; secret?: string; clientId?: string; clientSecret?: string }) {
    const encrypted: any = {};
    if (creds.apiKey) encrypted.encrypted_api_key = this.encrypt(creds.apiKey);
    if (creds.secret) encrypted.encrypted_secret = this.encrypt(creds.secret);
    if (creds.clientId) encrypted.encrypted_api_key = this.encrypt(creds.clientId);
    if (creds.clientSecret) encrypted.encrypted_secret = this.encrypt(creds.clientSecret);
    const existing = await supabase.from('gateway_credentials').select('id').eq('user_id', userId).eq('gateway', gateway).single();
    if (existing.data) {
      const { data, error } = await supabase.from('gateway_credentials').update({ ...encrypted, updated_at: new Date().toISOString() }).eq('id', existing.data.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const { data, error } = await supabase.from('gateway_credentials').insert({ user_id: userId, gateway, ...encrypted }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async get(userId: string, gateway: string) {
    const { data, error } = await supabase.from('gateway_credentials').select('*').eq('user_id', userId).eq('gateway', gateway).single();
    if (error || !data) return null;
    return { apiKey: data.encrypted_api_key ? this.decrypt(data.encrypted_api_key) : null, secret: data.encrypted_secret ? this.decrypt(data.encrypted_secret) : null, isActive: data.is_active };
  }

  async list(userId: string) {
    const { data, error } = await supabase.from('gateway_credentials').select('gateway, is_active, created_at').eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async remove(userId: string, gateway: string) {
    const { error } = await supabase.from('gateway_credentials').delete().eq('user_id', userId).eq('gateway', gateway);
    if (error) throw new Error(error.message);
    return true;
  }
}
export const gatewayCredentialService = new GatewayCredentialService();
