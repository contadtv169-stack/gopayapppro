import { useEffect, useState } from 'react';
import { Save, Key, User, Building, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const gatewayInfo = {
  abacatepay: { name: 'AbacatePay', fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }, { key: 'secret', label: 'Webhook Secret', type: 'password' }], docs: 'https://api.abacatepay.com' },
  kryptgateway: { name: 'KryptGateway', fields: [{ key: 'clientId', label: 'Client ID', type: 'text' }, { key: 'clientSecret', label: 'Client Secret', type: 'password' }], docs: 'https://kryptgateway.netlify.app' },
  pixgo: { name: 'PixGo', fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }, { key: 'secret', label: 'Webhook Secret', type: 'password' }], docs: 'https://pixgo.org' },
};

export default function Settings() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', document: '', business_name: '', business_logo: '' });
  const [gateways, setGateways] = useState<Record<string, any>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get('/users/me').then(({ data }) => setProfile(data));
    api.get('/gateways').then(({ data }) => {
      const map: any = {};
      data.forEach((g: any) => { map[g.gateway] = { isActive: g.is_active }; });
      setGateways(map);
    });
  }, []);

  const saveProfile = async () => {
    try {
      await api.put('/users/me', profile);
      toast.success('Perfil atualizado!');
    } catch (err: any) { toast.error(err.message); }
  };

  const saveGateway = async (gateway: string) => {
    const creds: any = {};
    gatewayInfo[gateway as keyof typeof gatewayInfo].fields.forEach(f => {
      const val = (document.getElementById(`gw-${gateway}-${f.key}`) as HTMLInputElement)?.value;
      if (val) creds[f.key] = val;
    });
    if (Object.keys(creds).length === 0) return toast.error('Preencha pelo menos uma chave');
    try {
      await api.post(`/gateways/${gateway}`, creds);
      toast.success(`${gatewayInfo[gateway as keyof typeof gatewayInfo].name} configurado!`);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erro'); }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Perfil</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-sm text-gray-600">Nome</label><input className="input-field mt-1" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
          <div><label className="text-sm text-gray-600">Email</label><input className="input-field mt-1" value={profile.email} disabled /></div>
          <div><label className="text-sm text-gray-600">Telefone</label><input className="input-field mt-1" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} /></div>
          <div><label className="text-sm text-gray-600">CPF/CNPJ</label><input className="input-field mt-1" value={profile.document || ''} onChange={e => setProfile({...profile, document: e.target.value})} /></div>
          <div className="sm:col-span-2"><label className="text-sm text-gray-600">Nome da Empresa</label><input className="input-field mt-1" value={profile.business_name || ''} onChange={e => setProfile({...profile, business_name: e.target.value})} /></div>
        </div>
        <button onClick={saveProfile} className="btn-primary flex items-center gap-2 mt-4 !py-2 !px-4 text-sm"><Save className="w-4 h-4" /> Salvar Perfil</button>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Key className="w-5 h-5" /> Integrações de Pagamento</h2>
        <p className="text-sm text-gray-500 mb-6">Configure suas chaves de API dos gateways de pagamento. As chaves são armazenadas criptografadas.</p>
        <div className="space-y-6">
          {Object.entries(gatewayInfo).map(([key, gw]) => (
            <div key={key} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{gw.name}</h3>
                {gateways[key]?.isActive && <span className="flex items-center gap-1 text-xs text-go-600 bg-go-50 px-2 py-1 rounded-full"><Check className="w-3 h-3" /> Ativo</span>}
              </div>
              <div className="space-y-3">
                {gw.fields.map(f => (
                  <div key={f.key}>
                    <label className="text-sm text-gray-600">{f.label}</label>
                    <div className="relative mt-1">
                      <input id={`gw-${key}-${f.key}`} type={showKey[`${key}-${f.key}`] ? 'text' : f.type} className="input-field !pr-10" placeholder={f.label} />
                      <button type="button" onClick={() => setShowKey({...showKey, [`${key}-${f.key}`]: !showKey[`${key}-${f.key}`]})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showKey[`${key}-${f.key}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button onClick={() => saveGateway(key)} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2"><Save className="w-4 h-4" /> Salvar</button>
                <a href={gw.docs} target="_blank" className="text-sm text-go-600 hover:text-go-700">Obter chaves ↗</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
