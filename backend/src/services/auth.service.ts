import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export class AuthService {
  async register(name: string, email: string, password: string) {
    const existing = await supabase.from('users').select('id').eq('email', email).single();
    if (existing.data) throw new Error('Email já cadastrado');

    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert({
      name,
      email,
      password_hash: passwordHash,
    }).select().single();

    if (error) throw new Error(error.message);
    const tokens = this.generateTokens(data.id, data.email);
    return { user: { id: data.id, name: data.name, email: data.email }, ...tokens };
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !data) throw new Error('Credenciais inválidas');

    const valid = await bcrypt.compare(password, data.password_hash);
    if (!valid) throw new Error('Credenciais inválidas');

    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', data.id);
    const tokens = this.generateTokens(data.id, data.email);
    return { user: { id: data.id, name: data.name, email: data.email, business_name: data.business_name }, ...tokens };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      const { data: stored } = await supabase.from('refresh_tokens')
        .select('*').eq('token', refreshToken).eq('revoked', false).single();
      if (!stored) throw new Error('Refresh token inválido');

      const { data: user } = await supabase.from('users').select('id, email').eq('id', decoded.userId).single();
      if (!user) throw new Error('Usuário não encontrado');

      await supabase.from('refresh_tokens').update({ revoked: true }).eq('id', stored.id);
      return this.generateTokens(user.id, user.email);
    } catch {
      throw new Error('Refresh token inválido ou expirado');
    }
  }

  async getUser(userId: string) {
    const { data, error } = await supabase.from('users').select('id, name, email, phone, document, business_name, business_logo, created_at, is_active, two_factor_enabled')
      .eq('id', userId).single();
    if (error) throw new Error('Usuário não encontrado');
    return data;
  }

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  private generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
    const refreshToken = jwt.sign({ userId, email }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn as any });
    supabase.from('refresh_tokens').insert({
      user_id: userId,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).then();
    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
