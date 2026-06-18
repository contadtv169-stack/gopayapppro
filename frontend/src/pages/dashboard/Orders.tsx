import { useEffect, useState } from 'react';
import { Search, Loader2, ExternalLink } from 'lucide-react';
import api from '../../services/api';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params: any = {};
    if (filter) params.status = filter;
    api.get('/orders', { params }).then(({ data }) => setOrders(data.data || [])).catch(() => {}).finally(() => setLoading(false));
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
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${filter === s ? 'bg-go-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 && <div className="card text-center py-12"><p className="text-gray-400">Nenhum pedido encontrado</p></div>}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
              <th className="p-4 font-medium">Pedido</th>
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Produto</th>
              <th className="p-4 font-medium">Valor</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Gateway</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 text-sm font-mono text-gray-600">#{o.id.slice(0, 8)}</td>
                <td className="p-4 text-sm">{o.customer_name || '—'}</td>
                <td className="p-4 text-sm">{o.products?.name || '—'}</td>
                <td className="p-4 text-sm font-semibold">R$ {Number(o.amount).toFixed(2)}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${statusColor[o.status] || 'bg-gray-50'}`}>{statusLabel[o.status] || o.status}</span></td>
                <td className="p-4 text-sm text-gray-500">{o.gateway || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
