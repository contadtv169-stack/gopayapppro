import { useEffect, useState } from 'react';
import { Save, Key, User, Loader2, Eye, EyeOff, Camera, Check, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import NotificationSettings from './NotificationSettings';
import { useNavigate } from 'react-router-dom';

const gatewayInfo = {
  abacatepay: { name: 'AbacatePay', fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }, { key: 'secret', label: 'Webhook Secret', type: 'password' }], docs: 'https://api.abacatepay.com' },
  kryptgateway: { name: 'KryptGateway', fields: [{ key: 'clientId', label: 'Client ID', type: 'text' }, { key: 'clientSecret', label: 'Client Secret', type: 'password' }], docs: 'https://kryptgateway.netlify.app' },
  pixgo: { name: 'PixGo', fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }, { key: 'secret', label: 'Webhook Secret', type: 'password' }], docs: 'https://pixgo.org' },
};

export default function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', document: '', business_name: '', business_logo: '' });
  const [gateways, setGateways] = useState<Record<string, any>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const capturedImage = localStorage.getItem('gopay_face');

  useEffect(() => {
    const user = localStorage.getItem('gopay_user');
    if (user) setProfile(prev => ({ ...prev, ...JSON.parse(user) }));
    (async () => {
      const { data } = await supabase.from('gateway_credentials').select('*');
      const map: any = {};
      (data || []).forEach((g: any) => { map[g.gateway] = { isActive: g.is_active }; });
      setGateways(map);
    })();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const user = JSON.parse(localStorage.getItem('gopay_user') || '{}');
    Object.assign(user, profile);
    localStorage.setItem('gopay_user', JSON.stringify(user));
    await supabase.auth.updateUser({ data: profile });
    toast.success('Perfil atualizado!');
    setSaving(false);
  };

  const saveGateway = async (gateway: string, creds: Record<string, string>) => {
    try {
      await supabase.from('gateway_credentials').upsert({ gateway, encrypted_api_key: creds.apiKey || '', encrypted_secret: creds.secret || creds.clientSecret || '', is_active: true, user_id: (JSON.parse(localStorage.getItem('gopay_user') || '{}')).id });
      toast.success(`${gatewayInfo[gateway as keyof typeof gatewayInfo].name} salvo!`);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <NotificationSettings />

      <div className="card !p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-go-100 rounded-xl flex items-center justify-center"><User className="w-5 h-5 text-go-600" /></div>
          <div><h2 className="font-semibold text-gray-900">Perfil</h2><p className="text-sm text-gray-500">Suas informações</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[{ key: 'name', label: 'Nome' }, { key: 'email', label: 'Email', disabled: true }, { key: 'phone', label: 'Telefone' }, { key: 'document', label: 'CPF/CNPJ' }, { key: 'business_name', label: 'Nome da Loja' }].map(f => (
            <div key={f.key}><label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label><input value={(profile as any)[f.key] || ''} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} className="input-field" disabled={(f as any).disabled} /></div>
          ))}
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2 mt-4">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar</button>
      </div>

      <div className="card !p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/camfacial')}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${capturedImage ? 'bg-green-100' : 'bg-blue-100'}`}>
            {capturedImage ? <Check className="w-5 h-5 text-green-600" /> : <Camera className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">CamFacial</h2>
            <p className="text-sm text-gray-500">{capturedImage ? 'Rosto verificado' : 'Verificação facial inteligente'}</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {Object.entries(gatewayInfo).map(([key, gw]) => (
        <div key={key} className="card !p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center"><Key className="w-5 h-5 text-primary-600" /></div>
            <div><h2 className="font-semibold text-gray-900">{gw.name}</h2><p className="text-xs text-gray-400"><a href={gw.docs} target="_blank" rel="noopener noreferrer" className="text-go-600 hover:underline">Documentação</a></p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gw.fields.map((f: any) => (
              <div key={f.key}><label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <div className="relative">
                  <input type={showKey[`${key}_${f.key}`] ? 'text' : f.type} className="input-field pr-10" placeholder={`${gw.name} ${f.label}`} />
                  <button onClick={() => setShowKey({ ...showKey, [`${key}_${f.key}`]: !showKey[`${key}_${f.key}`] })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showKey[`${key}_${f.key}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => { const c: Record<string, string> = {}; gw.fields.forEach((f: any) => c[f.key] = (document.querySelector(`[placeholder="${gw.name} ${f.label}"]`) as HTMLInputElement)?.value || ''); saveGateway(key, c); }} className="btn-primary flex items-center gap-2 mt-4"><Save className="w-4 h-4" /> Salvar {gw.name}</button>
        </div>
      ))}
    </div>
  );
}
