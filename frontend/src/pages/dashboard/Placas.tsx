import { useEffect, useState, useRef } from 'react';
import { Trophy, Star, TrendingUp, Award, Zap, Heart, Moon, DollarSign, Diamond, Download, Printer, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPlaques, syncPlaques, COLOR_MAP, getSalesCount, getRevenue } from '../../services/plaquesService';

const ICON_MAP: Record<string, any> = { star: Star, 'trending-up': TrendingUp, award: Award, zap: Zap, diamond: Diamond, 'dollar-sign': DollarSign, heart: Heart, moon: Moon };

const MEDAL_LABELS: Record<string, string> = {
  bronze: 'Bronze', silver: 'Prata', gold: 'Ouro', platinum: 'Platina', diamond: 'Diamante', dark: 'Noturno', ruby: 'Rubi',
};

export default function Placas() {
  const [plaques, setPlaques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesCount, setSalesCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const load = async () => {
    const uid = (JSON.parse(localStorage.getItem('gopay_user') || '{}')).id;
    if (!uid) return;
    const [p, sc, rv] = await Promise.all([getPlaques(), getSalesCount(uid), getRevenue(uid)]);
    setPlaques(p);
    setSalesCount(sc);
    setRevenue(rv);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    await syncPlaques();
    await load();
    setSyncing(false);
    toast.success('Placas atualizadas!');
  };

  const downloadPNG = (plaque: any) => {
    const el = cardRefs.current[plaque.id];
    if (!el) return;
    import('html2canvas').then(html2canvas => {
      html2canvas.default(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = `placa-${plaque.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Placa baixada!');
      });
    });
  };

  const printPlaque = (plaque: any) => {
    const el = cardRefs.current[plaque.id];
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const colors = COLOR_MAP[plaque.color_scheme] || COLOR_MAP.gold;
    win.document.write(`<html><head><title>${plaque.name}</title><style>
      body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; font-family: Arial, sans-serif; }
      .plaque { width: 400px; border: 4px solid ${colors.border}; border-radius: 20px; background: ${colors.bg}; overflow: hidden; text-align: center; padding: 30px; }
      .medal { width: 80px; height: 80px; border-radius: 50%; background: ${colors.gradient}; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
      h2 { margin: 0 0 8px; color: ${colors.text}; font-size: 22px; }
      p { color: #666; font-size: 14px; margin: 0 0 16px; }
      .seal { display: inline-block; background: ${colors.gradient}; color: white; padding: 6px 20px; border-radius: 20px; font-size: 13px; font-weight: bold; }
    </style></head><body>
      <div class="plaque">
        <div class="medal"><span style="font-size:36px">🏆</span></div>
        <h2>${plaque.name}</h2>
        <p>${plaque.description || ''}</p>
        <div class="seal">${plaque.is_unlocked ? '✔ DESBLOQUEADA' : '🔒 BLOQUEADA'}</div>
        <div style="margin-top:16px;font-size:12px;color:#999">GoPay - ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </body></html>`);
    win.document.close();
    win.print();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;

  const unlocked = plaques.filter(p => p.is_unlocked);
  const locked = plaques.filter(p => !p.is_unlocked);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placas</h1>
          <p className="text-sm text-gray-500">Metas e conquistas da sua loja</p>
        </div>
        <button onClick={handleSync} disabled={syncing} className="btn-secondary flex items-center gap-2 !py-2 !px-4 text-sm">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Sincronizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card !p-4 text-center">
          <p className="text-3xl font-bold text-go-600">{salesCount}</p>
          <p className="text-sm text-gray-500">Vendas</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-3xl font-bold text-go-600">R$ {revenue.toFixed(0)}</p>
          <p className="text-sm text-gray-500">Receita</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-3xl font-bold text-go-600">{unlocked.length}/{plaques.length}</p>
          <p className="text-sm text-gray-500">Placas desbloqueadas</p>
        </div>
      </div>

      {unlocked.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Desbloqueadas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unlocked.map((plaque) => {
              const colors = COLOR_MAP[plaque.color_scheme] || COLOR_MAP.gold;
              const Icon = ICON_MAP[plaque.icon] || Star;
              return (
                <div key={plaque.id} ref={el => cardRefs.current[plaque.id] = el} className="rounded-2xl overflow-hidden border-2 transition-all hover:shadow-lg"
                  style={{ borderColor: colors.border, background: colors.bg }}>
                  <div className="p-5 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: colors.gradient }}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg" style={{ color: colors.text }}>{plaque.name}</h3>
                    <p className="text-xs mt-1" style={{ color: colors.text + 'cc' }}>{plaque.description}</p>
                    <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: colors.gradient }}>
                      🏅 {MEDAL_LABELS[plaque.color_scheme] || plaque.color_scheme}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => downloadPNG(plaque)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium hover:opacity-80"
                        style={{ background: colors.border + '33', color: colors.text }}><Download className="w-3.5 h-3.5" /> PNG</button>
                      <button onClick={() => printPlaque(plaque)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium hover:opacity-80"
                        style={{ background: colors.border + '33', color: colors.text }}><Printer className="w-3.5 h-3.5" /> Imprimir</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔒 Bloqueadas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((plaque) => {
              const colors = COLOR_MAP[plaque.color_scheme] || COLOR_MAP.gold;
              const progress = plaque.goal_value > 0 ? Math.min(100, (plaque.current_value / plaque.goal_value) * 100) : 0;
              return (
                <div key={plaque.id} className="rounded-2xl border-2 border-dashed p-5 text-center" style={{ borderColor: colors.border + '66', background: colors.bg + '80' }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 opacity-50" style={{ background: colors.gradient }}>
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg" style={{ color: colors.text }}>{plaque.name}</h3>
                  <p className="text-xs mt-1" style={{ color: colors.text + '99' }}>{plaque.description}</p>
                  <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: colors.gradient }} />
                  </div>
                  <p className="text-xs mt-1 font-medium" style={{ color: colors.text }}>
                    {plaque.goal_type === 'sales' ? `${salesCount} / ${plaque.goal_value} vendas` : `R$ ${revenue.toFixed(0)} / R$ ${plaque.goal_value.toFixed(0)}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {plaques.length === 0 && (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Nenhuma placa disponível</p>
          <button onClick={handleSync} className="btn-primary">Sincronizar Placas</button>
        </div>
      )}
    </div>
  );
}

function Lock(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
