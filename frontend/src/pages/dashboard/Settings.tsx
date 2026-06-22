import { useEffect, useState, useRef } from 'react';
import { Save, User, Loader2, Camera, Trash2, Smartphone, Key, Eye, EyeOff, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import NotificationSettings from './NotificationSettings';

const GATEWAYS = [
  { id: 'kryptgateway', name: 'KryptGateway', icon: '🔐', color: '#6366f1', fields: [{ key: 'api_key', label: 'API Key' }, { key: 'secret', label: 'Secret' }] },
  { id: 'abacatepay', name: 'AbacatePay', icon: '🥑', color: '#22c55e', fields: [{ key: 'api_key', label: 'API Key' }] },
  { id: 'pixgo', name: 'PixGo', icon: '💳', color: '#f59e0b', fields: [{ key: 'api_key', label: 'API Key' }] },
];

export default function Settings() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', document: '', business_name: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [gwCreds, setGwCreds] = useState<Record<string, Record<string, string>>>({});
  const [gwLoading, setGwLoading] = useState(true);
  const [gwSaving, setGwSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const user = localStorage.getItem('gopay_user');
    if (user) { const u = JSON.parse(user); setProfile(prev => ({ ...prev, ...u })); setAvatarPreview(u.avatar_url || ''); }
    loadGateways();
  }, []);

  const loadGateways = async () => {
    setGwLoading(true);
    try {
      const uid = (JSON.parse(localStorage.getItem('gopay_user') || '{}')).id;
      if (!uid) return;
      const { data } = await supabase.from('gateway_credentials').select('*').eq('user_id', uid);
      const creds: Record<string, any> = {};
      (data || []).forEach((g: any) => {
        creds[g.gateway] = { api_key: g.encrypted_api_key || '', secret: g.encrypted_secret || '' };
      });
      setGwCreds(creds);
    } catch {}
    setGwLoading(false);
  };

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
        await supabase.from('profiles').upsert({
          user_id: uid, name: profile.name, email: profile.email, phone: profile.phone,
          document: profile.document, business_name: profile.business_name, avatar_url: avatarPreview,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    } catch {}
    toast.success('Perfil atualizado!');
    setSaving(false);
  };

  const saveGateway = async (gwId: string) => {
    const cred = gwCreds[gwId];
    if (!cred?.api_key) return toast.error('Preencha a API Key');
    const uid = (JSON.parse(localStorage.getItem('gopay_user') || '{}')).id;
    if (!uid) return toast.error('Faça login novamente');
    setGwSaving(true);
    try {
      const { error } = await supabase.rpc('upsert_gateway_credential', {
        p_user_id: uid, p_gateway: gwId,
        p_encrypted_api_key: cred.api_key,
        p_encrypted_secret: cred.secret || null,
      });
      if (error) {
        const { error: e2 } = await supabase.from('gateway_credentials').upsert({
          user_id: uid, gateway: gwId, encrypted_api_key: cred.api_key, encrypted_secret: cred.secret || null,
        }, { onConflict: 'user_id,gateway' });
        if (e2) throw e2;
      }
      toast.success(`${GATEWAYS.find(g => g.id === gwId)?.name} conectado!`);
    } catch (err: any) {
      toast.error('Erro ao salvar gateway: ' + (err.message || ''));
    }
    setGwSaving(false);
  };

  const removeGateway = async (gwId: string) => {
    const uid = (JSON.parse(localStorage.getItem('gopay_user') || '{}')).id;
    if (!uid) return;
    await supabase.from('gateway_credentials').delete().eq('user_id', uid).eq('gateway', gwId);
    setGwCreds(prev => { const n = { ...prev }; delete n[gwId]; return n; });
    toast.success('Gateway removido');
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

  const gwInfo = (gwId: string) => GATEWAYS.find(g => g.id === gwId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      <NotificationSettings />

      {/* Profile */}
      <div className="card !p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-go-500 to-primary-600 flex items-center justify-center overflow-hidden">
              {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-white" />}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"><Camera className="w-3.5 h-3.5 text-gray-500" /></button>
            {avatarPreview && <button onClick={removeAvatar} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="w-2.5 h-2.5 text-white" /></button>}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div><h2 className="font-semibold text-gray-900">Perfil</h2><p className="text-sm text-gray-500">Suas informações</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Nome' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Telefone' },
            { key: 'document', label: 'CPF/CNPJ' },
            { key: 'business_name', label: 'Nome da Conta / Loja' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <div className="relative">
                {f.key === 'phone' && <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                <input value={(profile as any)[f.key] || ''} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                  className={`input-field ${f.key === 'phone' ? 'pl-9' : ''}`} disabled={f.key === 'email'} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2 mt-4">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
        </button>
      </div>

      {/* Gateways */}
      <div className="card !p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Gateways de Pagamento</h2>
        <p className="text-sm text-gray-500 mb-5">Conecte seus gateways para aparecerem como opção no checkout.</p>
        {gwLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
        ) : (
          <div className="space-y-4">
            {GATEWAYS.map(gw => {
              const cred = gwCreds[gw.id];
              const connected = !!cred?.api_key;
              return (
                <div key={gw.id} className={`rounded-xl border-2 p-4 transition-all ${connected ? 'border-go-200 bg-go-50' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: gw.color + '20' }}><span>{gw.icon}</span></div>
                      <div>
                        <h3 className="font-medium text-gray-900">{gw.name}</h3>
                        <p className="text-xs text-gray-500">{connected ? 'Conectado' : 'Não conectado'}</p>
                      </div>
                    </div>
                    {connected && (
                      <button onClick={() => removeGateway(gw.id)} className="text-red-400 hover:text-red-600 p-1"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                  {gw.fields.map(f => (
                    <div key={f.key} className="mb-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                      <div className="relative">
                        <input type={showSecrets[gw.id] ? 'text' : 'password'} value={cred?.[f.key] || ''} onChange={e => setGwCreds({ ...gwCreds, [gw.id]: { ...gwCreds[gw.id], [f.key]: e.target.value } })}
                          className="input-field pr-9 text-sm" placeholder={f.label} />
                        <button onClick={() => setShowSecrets({ ...showSecrets, [gw.id]: !showSecrets[gw.id] })} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showSecrets[gw.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => saveGateway(gw.id)} disabled={gwSaving} className="btn-primary text-sm !py-2 !px-4 flex items-center gap-2 mt-2">
                    {gwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {connected ? 'Atualizar' : 'Conectar'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}