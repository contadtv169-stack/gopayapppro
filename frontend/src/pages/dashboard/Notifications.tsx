import { useEffect, useState } from 'react';
import { Bell, Check, Loader2, RefreshCw, DollarSign, ShoppingCart, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { getNotifications, markNotificationRead } from '../../services/supabaseData';
import { Link } from 'react-router-dom';

const typeIcons: Record<string, any> = {
  payment: DollarSign,
  order: ShoppingCart,
  alert: AlertTriangle,
  info: Info,
};

const typeColors: Record<string, string> = {
  payment: 'bg-green-100 text-green-600',
  order: 'bg-blue-100 text-blue-600',
  alert: 'bg-red-100 text-red-600',
  info: 'bg-purple-100 text-purple-600',
};

export default function Notifications() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setNotifs(await getNotifications()); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unread = notifs.filter(n => !n.is_read).length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-500 text-sm mt-1">{unread > 0 ? `${unread} não lida(s)` : 'Todas lidas'}</p>
        </div>
        <button onClick={load} className="btn-secondary !py-2 !px-3 text-sm flex items-center gap-1"><RefreshCw className="w-4 h-4" /> Atualizar</button>
      </div>

      {notifs.length === 0 && (
        <div className="card text-center py-16">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma notificação</p>
          <p className="text-sm text-gray-400 mt-1">Você receberá alertas de pedidos e pagamentos aqui</p>
        </div>
      )}

      <div className="space-y-2">
        {notifs.map((n: any) => {
          const Icon = typeIcons[n.type] || Bell;
          const color = typeColors[n.type] || 'bg-gray-100 text-gray-600';
          return (
            <button key={n.id} onClick={() => !n.is_read && handleRead(n.id)}
              className={`w-full text-left card !p-4 flex items-start gap-4 transition-all hover:shadow-md ${!n.is_read ? 'border-l-4 border-l-go-500 bg-go-50/30' : 'opacity-70'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(n.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                {n.message && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>}
                {n.type === 'order' && n.data?.order_id && (
                  <Link to="/dashboard/orders" className="text-xs text-go-600 hover:underline mt-1 inline-block">Ver pedido</Link>
                )}
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-go-500 flex-shrink-0 mt-2" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
