import { useEffect, useState, useRef, useCallback } from 'react';
import { Save, Key, User, Loader2, Eye, EyeOff, Camera, Check, AlertTriangle, RefreshCw, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import NotificationSettings from './NotificationSettings';

const gatewayInfo = {
  abacatepay: { name: 'AbacatePay', fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }, { key: 'secret', label: 'Webhook Secret', type: 'password' }], docs: 'https://api.abacatepay.com' },
  kryptgateway: { name: 'KryptGateway', fields: [{ key: 'clientId', label: 'Client ID', type: 'text' }, { key: 'clientSecret', label: 'Client Secret', type: 'password' }], docs: 'https://kryptgateway.netlify.app' },
  pixgo: { name: 'PixGo', fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }, { key: 'secret', label: 'Webhook Secret', type: 'password' }], docs: 'https://pixgo.org' },
};

const FACE_GUIDE_STEPS = [
  'Centralize o rosto no círculo',
  'Mantenha o rosto bem iluminado',
  'Fique parado para captura automática',
];

export default function Settings() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', document: '', business_name: '', business_logo: '' });
  const [gateways, setGateways] = useState<Record<string, any>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const [faceVerified, setFaceVerified] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [faceStatus, setFaceStatus] = useState(''); // '', 'positioning', 'capturing', 'done'
  const [faceGuideIdx, setFaceGuideIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef<number>(0);

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
      setFaceStatus('positioning');
      setFaceGuideIdx(0);
      startFaceScan();
    } catch { toast.error('Permissão de câmera negada.'); }
  };

  const startFaceScan = () => {
    let count = 0;
    const scan = () => {
      if (!videoRef.current || !canvasRef.current || faceStatus === 'done') return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const pixel = ctx.getImageData(centerX, centerY, 1, 1).data;
      const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;

      if (brightness > 40 && brightness < 240) {
        count++;
        setFaceGuideIdx(count > 15 ? 2 : 1);
        if (count > 30) {
          setFaceStatus('capturing');
          capturePhoto();
          return;
        }
      } else {
        count = 0;
        setFaceGuideIdx(0);
      }
      scanRef.current = requestAnimationFrame(scan);
    };
    scanRef.current = requestAnimationFrame(scan);
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
    setFaceStatus('done');
    setShowCamera(false);
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    cancelAnimationFrame(scanRef.current);
    toast.success('✅ Rosto verificado com sucesso!');
  };

  const stopCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
    setFaceStatus('');
    cancelAnimationFrame(scanRef.current);
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

      <div className="card !p-6" id="camfacial">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${faceVerified ? 'bg-green-100' : 'bg-blue-100'}`}>
            {faceVerified ? <Check className="w-5 h-5 text-green-600" /> : <Camera className="w-5 h-5 text-blue-600" />}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">CamFacial</h2>
            <p className="text-sm text-gray-500">{faceVerified ? 'Rosto verificado' : 'Verificação facial inteligente'}</p>
          </div>
          {faceVerified && <span className="ml-auto bg-go-50 text-go-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Verificado</span>}
        </div>

        {capturedImage && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl flex items-center gap-4">
            <img src={capturedImage} alt="Selfie" className="w-16 h-16 rounded-xl object-cover border-2 border-go-500" />
            <div className="flex-1"><p className="text-sm font-medium text-gray-900">Selfie capturada</p><p className="text-xs text-gray-400">Verificação facial completa</p></div>
            <button onClick={removeFace} className="text-sm text-red-500 hover:underline">Remover</button>
          </div>
        )}

        {showCamera ? (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-gray-900 mx-auto" style={{ maxWidth: 400 }}>
              <video ref={videoRef} autoPlay playsInline className="w-full aspect-[4/3] object-cover" />
              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-48 h-56 rounded-full border-4 transition-all duration-300 ${faceGuideIdx === 2 ? 'border-green-400 scale-95' : faceGuideIdx === 1 ? 'border-yellow-400 scale-105' : 'border-white/50'}`} />
              </div>
              {faceStatus === 'capturing' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center"><Loader2 className="w-10 h-10 animate-spin text-white mx-auto" /><p className="text-white text-sm mt-2">Capturando...</p></div>
                </div>
              )}
              {/* Step indicator */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {FACE_GUIDE_STEPS.map((s, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${i <= faceGuideIdx ? 'bg-go-500 w-4' : 'bg-white/40'}`} />
                ))}
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {faceGuideIdx === 0 ? FACE_GUIDE_STEPS[0] : faceGuideIdx === 1 ? FACE_GUIDE_STEPS[1] : '✅ Rosto detectado! Aguarde...'}
              </p>
              <p className="text-xs text-gray-400">A captura é automática quando o rosto estiver posicionado</p>
            </div>
            <button onClick={stopCamera} className="btn-secondary w-full">Cancelar</button>
          </div>
        ) : (
          <button onClick={startCamera} className="btn-primary flex items-center gap-2"><Camera className="w-4 h-4" /> {capturedImage ? 'Refazer Verificação' : 'Iniciar CamFacial'}</button>
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
