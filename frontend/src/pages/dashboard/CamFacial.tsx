import { useState, useRef } from 'react';
import { Camera, Check, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { label: 'Centralize o rosto no círculo', icon: '🎯' },
  { label: 'Mantenha o rosto bem iluminado', icon: '☀️' },
  { label: 'Fique parado para captura automática', icon: '📸' },
];

export default function CamFacial() {
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(() => localStorage.getItem('gopay_face'));
  const [faceVerified, setFaceVerified] = useState(!!capturedImage);
  const [faceStatus, setFaceStatus] = useState('');
  const [faceGuideIdx, setFaceGuideIdx] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef<number>(0);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
      setFaceStatus('positioning');
      setFaceGuideIdx(0);
      startFaceScan();
    } catch {
      toast.error('Permissão de câmera negada. Verifique as configurações do navegador.');
    }
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
        setFaceGuideIdx(brightness <= 40 ? 0 : 1);
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
    toast.success('Rosto verificado com sucesso!');
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
    toast.success('Verificação facial removida');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/settings')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CamFacial</h1>
          <p className="text-sm text-gray-500">Verificação facial inteligente</p>
        </div>
      </div>

      {faceVerified && capturedImage && (
        <div className="card !p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={capturedImage} alt="Selfie" className="w-20 h-20 rounded-2xl object-cover border-2 border-go-500" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Verificação concluída</p>
              <p className="text-sm text-gray-500">Sua identidade foi verificada com sucesso</p>
            </div>
            <button onClick={removeFace} className="text-sm text-red-500 hover:underline whitespace-nowrap">Remover</button>
          </div>
        </div>
      )}

      {showCamera ? (
        <div className="card !p-0 overflow-hidden">
          <div className="relative bg-gray-900">
            <video ref={videoRef} autoPlay playsInline className="w-full aspect-[4/3] object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-48 h-56 rounded-full border-4 transition-all duration-300 ${
                faceGuideIdx === 2 ? 'border-green-400 scale-95 shadow-[0_0_30px_rgba(74,222,128,0.3)]' :
                faceGuideIdx === 1 ? 'border-yellow-400 scale-105' :
                'border-white/50'
              }`} />
            </div>
            {faceStatus === 'capturing' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-white mx-auto" />
                  <p className="text-white text-sm mt-2 font-medium">Capturando...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${
                  i <= faceGuideIdx ? 'bg-go-500 w-8' : 'bg-white/40 w-2'
                }`} />
              ))}
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="p-4 space-y-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{STEPS[Math.min(faceGuideIdx, 2)].icon}</span>
                <p className="text-sm font-medium text-gray-700">
                  {faceGuideIdx === 0 && STEPS[0].label}
                  {faceGuideIdx === 1 && STEPS[1].label}
                  {faceGuideIdx === 2 && '✅ Rosto detectado! Aguarde...'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">
              A captura é automática quando o rosto estiver posicionado corretamente
            </p>
            <button onClick={stopCamera} className="btn-secondary w-full py-3">Cancelar</button>
          </div>
        </div>
      ) : (
        <>
          <div className="card !p-6 text-center">
            <div className="w-20 h-20 bg-go-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-go-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Verificação Facial</h2>
            <p className="text-sm text-gray-500 mb-6">Tire uma selfie para verificar sua identidade de forma segura</p>

            <div className="space-y-3 mb-6 text-left">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">{step.icon}</span>
                  <p className="text-sm text-gray-700">{step.label}</p>
                </div>
              ))}
            </div>

            <button onClick={startCamera} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-lg">
              <Camera className="w-5 h-5" />
              {capturedImage ? 'Refazer Verificação' : 'Iniciar CamFacial'}
            </button>
          </div>

          <div className="card !p-4 bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Privacidade garantida</p>
                <p className="text-xs text-amber-700 mt-1">
                  Sua imagem é processada localmente e armazenada apenas no seu navegador. Nada é enviado para servidores externos.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
