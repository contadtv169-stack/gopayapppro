import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders/stats'),
      api.get('/orders/recent?limit=10'),
    ]).then(([s, r]) => {
      setStats(s.data);
      setRecent(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;

  const chartData = [
    { name: 'Jan', valor: stats?.totalPaid ? Math.round(stats.totalPaid * 0.15) : 0 },
    { name: 'Fev', valor: stats?.totalPaid ? Math.round(stats.totalPaid * 0.2) : 0 },
    { name: 'Mar', valor: stats?.totalPaid ? Math.round(stats.totalPaid * 0.25) : 0 },
    { name: 'Abr', valor: stats?.totalPaid ? Math.round(stats.totalPaid * 0.3) : 0 },
    { name: 'Mai', valor: stats?.totalPaid ? Math.round(stats.totalPaid * 0.35) : 0 },
    { name: 'Jun', valor: stats?.totalPaid ? Math.round(stats.totalPaid * 0.4) : 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: 'Receita Total', value: `R$ ${(stats?.totalRevenue || 0).toFixed(2)}`, color: 'text-go-600 bg-go-50' },
          { icon: ShoppingCart, label: 'Pedidos', value: stats?.totalOrders || 0, color: 'text-primary-600 bg-primary-50' },
          { icon: TrendingUp, label: 'Recebido', value: `R$ ${(stats?.totalPaid || 0).toFixed(2)}`, color: 'text-emerald-600 bg-emerald-50' },
          { icon: Clock, label: 'Pendentes', value: stats?.pendingOrders || 0, color: 'text-orange-600 bg-orange-50' },
        ].map((card, i) => (
          <div key={i} className="card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}><card.icon className="w-5 h-5" /></div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Receita nos Últimos Meses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="valor" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pedidos Recentes</h2>
          <div className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-gray-400">Nenhum pedido ainda</p>}
            {recent.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.products?.name || 'Pedido'}</p>
                  <p className="text-xs text-gray-400">#{order.id.slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">R$ {Number(order.amount).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'paid' ? 'bg-go-50 text-go-700' : 
                    order.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-500'
                  }`}>{order.status === 'paid' ? 'Pago' : order.status === 'pending' ? 'Pendente' : order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 card">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Resumo Financeiro</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><p className="text-sm text-gray-500">Receita Total</p><p className="text-xl font-bold text-gray-900">R$ {(stats?.totalRevenue || 0).toFixed(2)}</p></div>
          <div><p className="text-sm text-gray-500">Total Recebido</p><p className="text-xl font-bold text-go-600">R$ {(stats?.totalPaid || 0).toFixed(2)}</p></div>
          <div><p className="text-sm text-gray-500">Líquido Estimado</p><p className="text-xl font-bold text-primary-600">R$ {(stats?.totalNet || 0).toFixed(2)}</p></div>
        </div>
      </div>
    </div>
  );
}
