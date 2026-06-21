import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop, Sliders, Filter, Sparkles, RotateCw,
  Undo2, Redo, ZoomIn, ZoomOut, Check, X, Eye, EyeOff,
  Sun, Contrast, Droplets, Palette, Target, Thermometer,
  CornerUpLeft, CornerUpRight, RefreshCw, Loader2, Wand2,
  Image, Eraser
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageAnalysis, getFilterSuggestion, getImagePrompt } from '../services/groqService';

type Tool = 'crop' | 'adjust' | 'filters' | 'ai' | 'rotate';
type FilterPreset = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'cinema' | 'dramatic' | 'soft' | 'hdr';
type Tab = 'tools' | 'history';

interface AdjustValues {
  brightness: number; contrast: number; saturation: number;
  hue: number; blur: number; sharpen: number;
  temperature: number; vignette: number;
}

interface CropBox { x: number; y: number; w: number; h: number; }

interface TextOverlay {
  id: string; text: string; x: number; y: number;
  fontSize: number; color: string; bold: boolean; italic: boolean;
}

const DEFAULT_ADJUST: AdjustValues = {
  brightness: 100, contrast: 100, saturation: 100,
  hue: 0, blur: 0, sharpen: 0,
  temperature: 0, vignette: 0,
};

const FILTER_CSS: Record<FilterPreset, string> = {
  none: '',
  grayscale: 'grayscale(1)',
  sepia: 'sepia(0.8) contrast(1.1)',
  vintage: 'sepia(0.4) contrast(0.9) brightness(1.05) saturate(0.8)',
  cinema: 'contrast(1.3) saturate(0.5) brightness(0.9)',
  dramatic: 'contrast(1.5) brightness(0.8) saturate(1.2)',
  soft: 'contrast(0.9) brightness(1.1) saturate(0.9) blur(0.5px)',
  hdr: 'contrast(1.4) saturate(1.4) brightness(1.1)',
};

const FILTER_NAMES: Record<FilterPreset, string> = {
  none: 'Original', grayscale: 'P&B', sepia: 'Sépia',
  vintage: 'Vintage', cinema: 'Cinema', dramatic: 'Dramático',
  soft: 'Suave', hdr: 'HDR',
};

interface Props {
  imageUrl: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

export default function PhotoEditorPro({ imageUrl, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>('adjust');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjust, setAdjust] = useState<AdjustValues>({ ...DEFAULT_ADJUST });
  const [filter, setFilter] = useState<FilterPreset>('none');
  const [zoom, setZoom] = useState(1);
  const [showBefore, setShowBefore] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  // Crop
  const [cropping, setCropping] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 });
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '4:3' | '16:9'>('free');

  // Rotate
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Text
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [addingText, setAddingText] = useState(false);
  const [textProps, setTextProps] = useState({ text: '', fontSize: 24, color: '#ffffff', bold: false, italic: false });

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  // History
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Background removal
  const [removingBg, setRemovingBg] = useState(false);

  const buildFilterCss = useCallback(() => {
    const a = adjust;
    const parts: string[] = [];
    const base = FILTER_CSS[filter];
    if (base) parts.push(base);
    if (a.brightness !== 100) parts.push(`brightness(${a.brightness}%)`);
    if (a.contrast !== 100) parts.push(`contrast(${a.contrast}%)`);
    if (a.saturation !== 100) parts.push(`saturate(${a.saturation}%)`);
    if (a.hue !== 0) parts.push(`hue-rotate(${a.hue}deg)`);
    if (a.blur > 0) parts.push(`blur(${a.blur}px)`);
    if (a.sharpen > 0) parts.push(`contrast(${100 + a.sharpen * 0.5}%)`);
    return parts.join(' ');
  }, [adjust, filter]);

  const pushHistory = useCallback((dataUrl: string) => {
    setHistory(prev => {
      const next = [...prev.slice(0, historyIdx + 1), dataUrl].slice(-20);
      return next;
    });
    setHistoryIdx(prev => Math.min(prev + 1, 19));
  }, [historyIdx]);

  const handleUndo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(prev => prev - 1);
      loadCanvasFromData(history[historyIdx - 1]);
      setAdjust({ ...DEFAULT_ADJUST });
      setFilter('none');
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(prev => prev + 1);
      loadCanvasFromData(history[historyIdx + 1]);
      setAdjust({ ...DEFAULT_ADJUST });
      setFilter('none');
    }
  };

  const loadCanvasFromData = (dataUrl: string) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.filter = 'none';
      ctx.drawImage(img, 0, 0);
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = dataUrl;
  };

  const getCanvasDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return imageUrl;
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return imageUrl;
    const cssFilter = buildFilterCss();
    ctx.filter = cssFilter;
    ctx.drawImage(canvas, 0, 0);
    return offscreen.toDataURL('image/png');
  };

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setLoading(false);
      const dataUrl = canvas.toDataURL();
      setHistory([dataUrl]);
      setHistoryIdx(0);
      // img loaded
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!cropping) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCropStart({
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    });
    setCropBox({ x: 0, y: 0, w: 0, h: 0 });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!cropStart || !cropping) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / zoom;
    const my = (e.clientY - rect.top) / zoom;
    let w = mx - cropStart.x;
    let h = my - cropStart.y;
    if (aspectRatio === '1:1') { const s = Math.max(Math.abs(w), Math.abs(h)); w = w < 0 ? -s : s; h = h < 0 ? -s : s; }
    else if (aspectRatio === '4:3') { h = w * 3 / 4; }
    else if (aspectRatio === '16:9') { h = w * 9 / 16; }
    setCropBox({
      x: w < 0 ? cropStart.x + w : cropStart.x,
      y: h < 0 ? cropStart.y + h : cropStart.y,
      w: Math.abs(w), h: Math.abs(h),
    });
  };

  const handleCropMouseUp = () => {
    setCropStart(null);
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || cropBox.w < 5 || cropBox.h < 5) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    canvas.width = cropBox.w;
    canvas.height = cropBox.h;
    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL();
    pushHistory(dataUrl);
    setImgSize({ w: cropBox.w, h: cropBox.h });
    setCropBox({ x: 0, y: 0, w: 0, h: 0 });
    setCropping(false);
    toast.success('Imagem cortada!');
  };

  const applyRotation = (deg: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const rad = deg * Math.PI / 180;
    const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
    const nw = Math.ceil(w * cos + h * sin), nh = Math.ceil(w * sin + h * cos);
    const temp = document.createElement('canvas');
    temp.width = nw; temp.height = nh;
    const tctx = temp.getContext('2d');
    if (!tctx) return;
    tctx.translate(nw / 2, nh / 2);
    tctx.rotate(rad);
    tctx.drawImage(canvas, -w / 2, -h / 2);
    canvas.width = nw; canvas.height = nh;
    ctx.drawImage(temp, 0, 0);
    setImgSize({ w: nw, h: nh });
    const dataUrl = canvas.toDataURL();
    pushHistory(dataUrl);
  };

  const applyFlip = (horizontal: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const temp = document.createElement('canvas');
    temp.width = w; temp.height = h;
    const tctx = temp.getContext('2d');
    if (!tctx) return;
    tctx.scale(horizontal ? -1 : 1, horizontal ? 1 : -1);
    tctx.drawImage(canvas, horizontal ? -w : 0, horizontal ? 0 : -h);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(temp, 0, 0);
    const dataUrl = canvas.toDataURL();
    pushHistory(dataUrl);
  };

  const analyzeImage = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      let totalBrightness = 0, totalContrast = 0;
      const colorCounts: Record<string, number> = {};
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        totalBrightness += (r + g + b) / 3;
        const gray = Math.round((r + g + b) / 3);
        const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }
      const avgBrightness = totalBrightness / (pixels.length / 4);
      let minV = 255, maxV = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const v = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        minV = Math.min(minV, v); maxV = Math.max(maxV, v);
      }
      totalContrast = maxV - minV;
      const dominant = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '128,128,128';
      const info = {
        avgBrightness, avgContrast: totalContrast,
        dominantColor: dominant, width: canvas.width, height: canvas.height, hasFace: false,
      };
      const suggestions = await getImageAnalysis(info);
      if (suggestions) {
        setAdjust({
          brightness: suggestions.brightness ?? 100,
          contrast: suggestions.contrast ?? 100,
          saturation: suggestions.saturation ?? 100,
          hue: suggestions.hue ?? 0,
          blur: suggestions.blur ?? 0,
          sharpen: suggestions.sharpen ?? 0,
          temperature: suggestions.temperature ?? 0,
          vignette: suggestions.vignette ?? 0,
        });
        if (suggestions.suggestedFilter && suggestions.suggestedFilter !== 'none') {
          setFilter(suggestions.suggestedFilter as FilterPreset);
        }
        setAiResult(suggestions.description || 'Imagem ajustada com IA!');
        toast.success('IA ajustou a imagem automaticamente!');
      } else {
        toast.error('Não foi possível analisar a imagem.');
      }
    } catch { toast.error('Erro na análise'); }
    setAiLoading(false);
  };

  const removeBackground = async () => {
    setRemovingBg(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      // Sample corners to get background color
      const corners = [
        { r: d[0], g: d[1], b: d[2] },
        { r: d[(canvas.width - 1) * 4], g: d[(canvas.width - 1) * 4 + 1], b: d[(canvas.width - 1) * 4 + 2] },
        { r: d[(canvas.height - 1) * canvas.width * 4], g: d[(canvas.height - 1) * canvas.width * 4 + 1], b: d[(canvas.height - 1) * canvas.width * 4 + 2] },
        { r: d[d.length - 4], g: d[d.length - 3], b: d[d.length - 2] },
      ];
      const bgR = corners.reduce((s, c) => s + c.r, 0) / 4;
      const bgG = corners.reduce((s, c) => s + c.g, 0) / 4;
      const bgB = corners.reduce((s, c) => s + c.b, 0) / 4;
      const threshold = 40;
      for (let i = 0; i < d.length; i += 4) {
        const dr = Math.abs(d[i] - bgR), dg = Math.abs(d[i + 1] - bgG), db = Math.abs(d[i + 2] - bgB);
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < threshold) d[i + 3] = 0;
      }
      ctx.putImageData(imgData, 0, 0);
      pushHistory(canvas.toDataURL());
      toast.success('Fundo removido!');
    } catch { toast.error('Erro ao remover fundo'); }
    setRemovingBg(false);
  };

  const suggestFilter = async () => {
    setAiLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const desc = `Imagem ${canvas.width}x${canvas.height}, ajustes atuais: brilho=${adjust.brightness}, contraste=${adjust.contrast}, saturação=${adjust.saturation}`;
      const suggestion = await getFilterSuggestion(desc);
      if (suggestion?.filter && suggestion.filter !== 'none') {
        setFilter(suggestion.filter as FilterPreset);
        toast.success(`Filtro sugerido: ${FILTER_NAMES[suggestion.filter as FilterPreset] || suggestion.filter}`);
      } else {
        setFilter('none');
        toast('Filtro atual já é o ideal.');
      }
    } catch { toast.error('Erro ao sugerir filtro'); }
    setAiLoading(false);
  };

  const generateImagePrompt = async () => {
    setAiLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const desc = `Imagem ${canvas.width}x${canvas.height} com filtro ${filter}`;
      const prompt = await getImagePrompt(desc);
      setGeneratedPrompt(prompt);
      toast.success('Prompt gerado!');
    } catch { toast.error('Erro ao gerar prompt'); }
    setAiLoading(false);
  };

  const resetAll = () => {
    setAdjust({ ...DEFAULT_ADJUST });
    setFilter('none');
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropping(false);
    setCropBox({ x: 0, y: 0, w: 0, h: 0 });
    if (history.length > 0) {
      loadCanvasFromData(history[0]);
      setHistoryIdx(0);
      setHistory([history[0]]);
    }
    toast.success('Tudo resetado!');
  };

  const handleSave = () => {
    setSaving(true);
    try {
      const dataUrl = getCanvasDataUrl();
      onSave(dataUrl);
      toast.success('Imagem salva!');
    } catch { toast.error('Erro ao salvar'); }
    setSaving(false);
  };

  const getAspectLabel = () => {
    if (aspectRatio === 'free') return 'Livre';
    return aspectRatio;
  };

  // Canvas display size accounting for zoom
  const displayW = imgSize.w * zoom;
  const displayH = imgSize.h * zoom;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          <span className="text-sm font-medium text-gray-300 ml-2">Editor Profissional</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleUndo} disabled={historyIdx <= 0} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-colors" title="Desfazer"><Undo2 className="w-4 h-4" /></button>
          <button onClick={handleRedo} disabled={historyIdx >= history.length - 1} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-colors" title="Refazer"><Redo className="w-4 h-4" /></button>
          <div className="w-px h-6 bg-gray-700 mx-2" />
          <button onClick={() => setShowBefore(!showBefore)} className={`p-2 rounded-lg transition-colors ${showBefore ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`} title="Antes/Depois">
            {showBefore ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <div className="w-px h-6 bg-gray-700 mx-2" />
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1 hover:bg-gray-800 rounded text-gray-400"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-sm text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-1 hover:bg-gray-800 rounded text-gray-400"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => setZoom(1)} className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded ml-1">100%</button>
          <div className="w-px h-6 bg-gray-700 mx-2" />
          <button onClick={resetAll} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded flex items-center gap-1"><RefreshCw className="w-3 h-3" />Reset</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-sm font-medium text-white bg-go-600 hover:bg-go-500 rounded-lg flex items-center gap-1.5 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Salvar
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-3 gap-1">
          {[
            { id: 'adjust' as Tool, icon: Sliders, label: 'Ajustes' },
            { id: 'filters' as Tool, icon: Filter, label: 'Filtros' },
            { id: 'crop' as Tool, icon: Crop, label: 'Cortar' },
            { id: 'rotate' as Tool, icon: RotateCw, label: 'Girar' },
            { id: 'ai' as Tool, icon: Sparkles, label: 'IA' },
          ].map(t => (
            <button key={t.id} onClick={() => { setTool(t.id); if (t.id !== 'crop') setCropping(false); }}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all gap-0.5 ${tool === t.id ? 'bg-go-600/20 text-go-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}>
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] leading-none">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-900" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            {loading ? (
              <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
            ) : (
              <div style={{ position: 'relative', width: displayW, height: displayH }}>
                {/* Before (original) overlay */}
                {showBefore && (
                  <canvas ref={el => {
                    if (el && history[0]) {
                      const img = new window.Image();
                      img.onload = () => { el.width = img.naturalWidth; el.height = img.naturalHeight; el.getContext('2d')?.drawImage(img, 0, 0); };
                      img.src = history[0];
                    }
                  }}
                    style={{ position: 'absolute', inset: 0, width: displayW, height: displayH, zIndex: 10, opacity: 0.5, pointerEvents: 'none', imageRendering: 'pixelated' }}
                  />
                )}
                <canvas ref={canvasRef}
                  onMouseDown={handleCropMouseDown} onMouseMove={handleCropMouseMove} onMouseUp={handleCropMouseUp}
                  style={{ width: displayW, height: displayH, filter: showBefore ? 'none' : buildFilterCss(), cursor: cropping ? 'crosshair' : 'default', imageRendering: showBefore ? 'pixelated' : 'auto' }}
                  className="bg-white"
                />
                {/* Crop overlay */}
                {cropping && cropBox.w > 0 && (
                  <div style={{
                    position: 'absolute', left: cropBox.x * zoom, top: cropBox.y * zoom,
                    width: cropBox.w * zoom, height: cropBox.h * zoom,
                    border: '2px solid #22c55e', backgroundColor: 'rgba(34,197,94,0.1)', pointerEvents: 'none', zIndex: 20,
                  }} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 overflow-y-auto p-4 space-y-4">
          {tool === 'adjust' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Ajustes</h3>
              {[
                { key: 'brightness' as keyof AdjustValues, icon: Sun, label: 'Brilho', min: 0, max: 200 },
                { key: 'contrast' as keyof AdjustValues, icon: Contrast, label: 'Contraste', min: 0, max: 200 },
                { key: 'saturation' as keyof AdjustValues, icon: Droplets, label: 'Saturação', min: 0, max: 200 },
                { key: 'hue' as keyof AdjustValues, icon: Palette, label: 'Matiz', min: -180, max: 180 },
                { key: 'blur' as keyof AdjustValues, icon: Eye, label: 'Desfoque', min: 0, max: 20, step: 0.5 },
                { key: 'sharpen' as keyof AdjustValues, icon: Target, label: 'Nitidez', min: 0, max: 100 },
                { key: 'temperature' as keyof AdjustValues, icon: Thermometer, label: 'Temperatura', min: -100, max: 100 },
                { key: 'vignette' as keyof AdjustValues, icon: Eye, label: 'Vinheta', min: 0, max: 100 },
              ].map(({ key, icon: Icon, label, min, max, step }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-gray-500" /><span className="text-xs text-gray-400">{label}</span></div>
                    <span className="text-xs text-gray-500 font-mono">{adjust[key]}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step || 1} value={adjust[key]}
                    onChange={e => setAdjust({ ...adjust, [key]: Number(e.target.value) })}
                    className="w-full accent-go-500" />
                </div>
              ))}
            </div>
          )}

          {tool === 'filters' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Filtros</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(FILTER_NAMES) as [FilterPreset, string][]).map(([key, name]) => (
                  <button key={key} onClick={() => setFilter(key)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === key ? 'bg-go-600 text-white ring-2 ring-go-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tool === 'crop' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Cortar</h3>
              <div className="flex gap-2">
                {(['free', '1:1', '4:3', '16:9'] as const).map(ar => (
                  <button key={ar} onClick={() => setAspectRatio(ar)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-lg ${aspectRatio === ar ? 'bg-go-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {ar === 'free' ? 'Livre' : ar}
                  </button>
                ))}
              </div>
              <button onClick={() => setCropping(!cropping)}
                className={`w-full py-2 rounded-lg text-sm font-medium ${cropping ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                {cropping ? 'Cancelar Corte' : 'Iniciar Corte'}
              </button>
              {cropping && cropBox.w > 0 && (
                <button onClick={applyCrop} className="w-full py-2 bg-go-600 text-white rounded-lg text-sm font-medium hover:bg-go-500">
                  Aplicar Corte ({Math.round(cropBox.w)}x{Math.round(cropBox.h)})
                </button>
              )}
              {cropping && (
                <p className="text-xs text-gray-500">Clique e arraste na imagem para selecionar a área</p>
              )}
            </div>
          )}

          {tool === 'rotate' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Girar</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => applyRotation(-90)} className="flex items-center justify-center gap-2 px-3 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"><CornerUpLeft className="w-4 h-4" /> 90° Esq</button>
                <button onClick={() => applyRotation(90)} className="flex items-center justify-center gap-2 px-3 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"><CornerUpRight className="w-4 h-4" /> 90° Dir</button>
                <button onClick={() => applyFlip(true)} className="flex items-center justify-center gap-2 px-3 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"><RotateCw className="w-4 h-4" /> Inverter H</button>
                <button onClick={() => applyFlip(false)} className="flex items-center justify-center gap-2 px-3 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"><RotateCw className="w-4 h-4" /> Inverter V</button>
              </div>
            </div>
          )}

          {tool === 'ai' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-go-400" />Ferramentas IA</h3>
              <button onClick={analyzeImage} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-go-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}Ajuste Inteligente
              </button>
              <button onClick={removeBackground} disabled={removingBg} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
                {removingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4" />}Remover Fundo
              </button>
              <button onClick={suggestFilter} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
                <Filter className="w-4 h-4" />Sugerir Filtro
              </button>
              <button onClick={generateImagePrompt} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
                <Image className="w-4 h-4" />Gerar Prompt para Imagem
              </button>
              {aiResult && (
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Resultado IA:</p>
                  <p className="text-sm text-go-400 mt-1">{aiResult}</p>
                </div>
              )}
              {generatedPrompt && (
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Prompt gerado:</p>
                  <p className="text-xs text-gray-300">{generatedPrompt}</p>
                  <button onClick={() => { navigator.clipboard.writeText(generatedPrompt); toast.success('Copiado!'); }}
                    className="mt-2 text-xs text-go-400 hover:text-go-300">Copiar prompt</button>
                </div>
              )}
              <p className="text-xs text-gray-600 mt-2">Use o prompt gerado em ferramentas como DALL-E, Midjourney ou Stable Diffusion para criar imagens similares.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}