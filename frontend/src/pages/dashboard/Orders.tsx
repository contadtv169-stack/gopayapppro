import { useEffect, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { getOrders } from '../../services/supabaseData';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getOrders(filter || undefined).then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  const statusColor: Record<string, string> = {
    paid: 'bg-go-50 text-go-700', pending: 'bg-yellow-50 text-yellow-700', expired: 'bg-red-50 text-red-600', cancelled: 'bg-gray-50 text-gray-500', refunded: 'bg-purple-50 text-purple-700',
  };
  const statusLabel: Record<string, string> = {
    paid: 'Pago', pending: 'Pendente', expired: 'Expirado', cancelled: 'Cancelado', refunded: 'Reembolsado',
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <div className="flex gap-2">
          {['', 'pending', 'paid', 'expired'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === s ? 'bg-go-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s ? statusLabel[s] : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left p-4">Cliente</th><th className="text-left p-4">Produto</th><th className="text-right p-4">Valor</th><th className="text-center p-4">Status</th><th className="text-right p-4">Data</th>
            </tr></thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan={5} className="text-center p-8 text-gray-400">Nenhum pedido encontrado</td></tr>}
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4"><p className="font-medium text-gray-900">{o.customer_name || '—'}</p><p className="text-xs text-gray-400">{o.customer_email}</p></td>
                  <td className="p-4 text-gray-600">{o.product_name || '—'}</td>
                  <td className="p-4 text-right font-semibold text-gray-900">R$ {Number(o.amount).toFixed(2)}</td>
                  <td className="p-4 text-center"><span className={`text-xs px-2 py-1 rounded-full ${statusColor[o.status] || 'bg-gray-50 text-gray-500'}`}>{statusLabel[o.status] || o.status}</span></td>
                  <td className="p-4 text-right text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
