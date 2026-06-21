import { useEffect, useState, useRef } from 'react';
import { Save, User, Loader2, Camera, Trash2, Smartphone, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import NotificationSettings from './NotificationSettings';

export default function Settings() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', document: '', business_name: '', avatar_url: '', pix_key: '' });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = localStorage.getItem('gopay_user');
    if (user) { const u = JSON.parse(user); setProfile(prev => ({ ...prev, ...u })); setAvatarPreview(u.avatar_url || ''); }
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const user = JSON.parse(localStorage.getItem('gopay_user') || '{}');
    Object.assign(user, { ...profile, avatar_url: avatarPreview });
    localStorage.setItem('gopay_user', JSON.stringify(user));
    await supabase.auth.updateUser({ data: { ...profile, avatar_url: avatarPreview } });
    try {
      const session = await supabase.auth.getSession();
      const uid = session?.data?.session?.user?.id || user.id;
      if (uid) {
        const { error } = await supabase.from('profiles').upsert({
          user_id: uid,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          document: profile.document,
          business_name: profile.business_name,
          avatar_url: avatarPreview,
          pix_key: profile.pix_key,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        if (error) console.warn('Profiles upsert error:', error.message);
      }
    } catch (err) {
      console.warn('Could not save to profiles table:', err);
    }
    toast.success('Perfil atualizado!');
    setSaving(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Máximo 5MB');
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setAvatarPreview(url);
      const user = JSON.parse(localStorage.getItem('gopay_user') || '{}');
      user.avatar_url = url;
      localStorage.setItem('gopay_user', JSON.stringify(user));
      toast.success('Foto de perfil atualizada!');
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarPreview('');
    const user = JSON.parse(localStorage.getItem('gopay_user') || '{}');
    delete user.avatar_url;
    localStorage.setItem('gopay_user', JSON.stringify(user));
    toast.success('Foto removida');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <NotificationSettings />

      <div className="card !p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-go-500 to-primary-600 flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
              <Camera className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {avatarPreview && (
              <button onClick={removeAvatar} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-2.5 h-2.5 text-white" />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Perfil</h2>
            <p className="text-sm text-gray-500">Suas informações</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Nome' },
            { key: 'email', label: 'Email', disabled: true },
            { key: 'phone', label: 'Telefone (Chave Pix)' },
            { key: 'document', label: 'CPF/CNPJ' },
            { key: 'pix_key', label: 'Chave Pix (outra)' },
            { key: 'business_name', label: 'Nome da Conta / Loja' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <div className="relative">
                {f.key === 'phone' && <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                {f.key === 'pix_key' && <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                <input value={(profile as any)[f.key] || ''} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                  className={`input-field ${f.key === 'phone' || f.key === 'pix_key' ? 'pl-9' : ''}`}
                  disabled={(f as any).disabled}
                  placeholder={f.key === 'phone' ? '(11) 99999-9999' : f.key === 'pix_key' ? 'CPF, email ou aleatória' : ''} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2 mt-4">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
        </button>
      </div>

      <div className="card !p-6 bg-gradient-to-r from-go-50 to-primary-50 border-go-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-go-100 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-go-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">GoPay Pix</h3>
            <p className="text-sm text-gray-500">Seu telefone e chave Pix serão usados para receber pagamentos. Taxa de R$ 7 por transação.</p>
          </div>
        </div>
      </div>
    </div>
  );
}