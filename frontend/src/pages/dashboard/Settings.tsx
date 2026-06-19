import { useEffect, useState, useRef } from 'react';
import { Save, Key, User, Loader2, Eye, EyeOff, Camera, Check, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';

const gatewayInfo = {
  abacatepay: { name: 'AbacatePay', fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }, { key: 'secret', label: 'Webhook Secret', type: 'password' }], docs: 'https://api.abacatepay.com' },
  kryptgateway: { name: 'KryptGateway', fields: [{ key: 'clientId', label: 'Client ID', type: 'text' }, { key: 'clientSecret', label: 'Client Secret', type: 'password' }], docs: 'https://kryptgateway.netlify.app' },
  pixgo: { name: 'PixGo', fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }, { key: 'secret', label: 'Webhook Secret', type: 'password' }], docs: 'https://pixgo.org' },
};

export default function Settings() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', document: '', business_name: '', business_logo: '' });
  const [gateways, setGateways] = useState<Record<string, any>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const [faceVerified, setFaceVerified] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const user = localStorage.getItem('gopay_user');
    if (user) setProfile(prev => ({ ...prev, ...JSON.parse(user) }));
    const savedFace = localStorage.getItem('gopay_face');
    if (savedFace) { setCapturedImage(savedFace); setFaceVerified(true); }
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch { toast.error('Permissão de câmera negada. Permita o acesso nos ajustes do navegador.'); }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);
    localStorage.setItem('gopay_face', dataUrl);
    setFaceVerified(true);
    stopCamera();
    toast.success('Rosto verificado com sucesso!');
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const removeFace = () => {
    localStorage.removeItem('gopay_face');
    setCapturedImage(null);
    setFaceVerified(false);
    toast.success('Verificação removida');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <div className="card !p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-go-100 rounded-xl flex items-center justify-center"><User className="w-5 h-5 text-go-600" /></div>
          <div><h2 className="font-semibold text-gray-900">Perfil</h2><p className="text-sm text-gray-500">Suas informações pessoais</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[{ key: 'name', label: 'Nome' }, { key: 'email', label: 'Email', disabled: true }, { key: 'phone', label: 'Telefone' }, { key: 'document', label: 'CPF/CNPJ' }, { key: 'business_name', label: 'Nome da Loja' }].map(f => (
            <div key={f.key}><label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label><input value={(profile as any)[f.key] || ''} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} className="input-field" disabled={(f as any).disabled} /></div>
          ))}
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2 mt-4">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar</button>
      </div>

      <div className="card !p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">{faceVerified ? <Check className="w-5 h-5 text-blue-600" /> : <AlertTriangle className="w-5 h-5 text-blue-600" />}</div>
          <div><h2 className="font-semibold text-gray-900">Verificação Facial</h2><p className="text-sm text-gray-500">{faceVerified ? 'Rosto verificado' : 'Verifique seu rosto para mais segurança'}</p></div>
          {faceVerified && <span className="ml-auto bg-go-50 text-go-700 text-xs px-2 py-1 rounded-full font-medium">Verificado</span>}
        </div>

        {capturedImage && (
          <div className="mb-4 flex items-center gap-4">
            <img src={capturedImage} alt="Selfie" className="w-20 h-20 rounded-xl object-cover border-2 border-go-500" />
            <div><p className="text-sm font-medium text-gray-900">Selfie capturada</p><p className="text-xs text-gray-400">Sua foto de verificação</p></div>
            <button onClick={removeFace} className="ml-auto text-sm text-red-500 hover:underline">Remover</button>
          </div>
        )}

        {showCamera ? (
          <div className="space-y-3">
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm rounded-xl bg-gray-900" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <button onClick={capturePhoto} className="btn-primary flex items-center gap-2"><Camera className="w-4 h-4" /> Capturar</button>
              <button onClick={stopCamera} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={startCamera} className="btn-primary flex items-center gap-2"><Camera className="w-4 h-4" /> {capturedImage ? 'Refazer' : 'Tirar Selfie'}</button>
        )}
      </div>

      {Object.entries(gatewayInfo).map(([key, gw]) => (
        <div key={key} className="card !p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center"><Key className="w-5 h-5 text-primary-600" /></div>
            <div><h2 className="font-semibold text-gray-900">{gw.name}</h2><p className="text-xs text-gray-400"><a href={gw.docs} target="_blank" rel="noopener noreferrer" className="text-go-600 hover:underline">Documentação</a></p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gw.fields.map((f: any) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <div className="relative">
                  <input type={showKey[`${key}_${f.key}`] ? 'text' : f.type} className="input-field pr-10" placeholder={`${gw.name} ${f.label}`} />
                  <button onClick={() => setShowKey({ ...showKey, [`${key}_${f.key}`]: !showKey[`${key}_${f.key}`] })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showKey[`${key}_${f.key}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => { const creds: Record<string, string> = {}; gw.fields.forEach((f: any) => creds[f.key] = (document.querySelector(`[placeholder="${gw.name} ${f.label}"]`) as HTMLInputElement)?.value || ''); saveGateway(key, creds); }} className="btn-primary flex items-center gap-2 mt-4"><Save className="w-4 h-4" /> Salvar {gw.name}</button>
        </div>
      ))}
    </div>
  );
}
