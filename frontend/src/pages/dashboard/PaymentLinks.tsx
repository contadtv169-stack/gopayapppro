import { useEffect, useState } from 'react';
import { Plus, Copy, Trash2, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function PaymentLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', amount: '', slug: '' });

  const load = async () => {
    try { setLinks((await api.get('/payment-links')).data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title || !form.amount) return toast.error('Título e valor são obrigatórios');
    try {
      await api.post('/payment-links', { ...form, amount: Number(form.amount) });
      toast.success('Link criado!');
      setShowModal(false);
      setForm({ title: '', description: '', amount: '', slug: '' });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erro'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir link?')) return;
    try { await api.delete(`/payment-links/${id}`); toast.success('Excluído'); load(); } catch {}
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/checkout/link/${slug}`);
    toast.success('Link copiado!');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Links de Pagamento</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm"><Plus className="w-4 h-4" /> Novo Link</button>
      </div>

      {links.length === 0 && <div className="card text-center py-12"><p className="text-gray-400 mb-4">Nenhum link de pagamento</p><button onClick={() => setShowModal(true)} className="btn-primary">Criar Link</button></div>}

      <div className="grid gap-4">
        {links.map((l) => (
          <div key={l.id} className="card flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{l.title}</h3>
              <p className="text-sm text-gray-500 truncate">{l.description || l.products?.name || ''}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">R$ {Number(l.amount).toFixed(2)}</p>
              <p className="text-xs text-gray-400">{l.current_payments || 0} pagamentos</p>
            </div>
            <button onClick={() => copyLink(l.slug)} className="text-gray-400 hover:text-go-500"><Copy className="w-5 h-5" /></button>
            <a href={`/checkout/link/${l.slug}`} target="_blank" className="text-gray-400 hover:text-go-500"><ExternalLink className="w-5 h-5" /></a>
            <button onClick={() => remove(l.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Novo Link de Pagamento</h2>
            <div className="space-y-3">
              <input className="input-field" placeholder="Título *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <textarea className="input-field" placeholder="Descrição" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <input className="input-field" placeholder="Valor (R$) *" type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              <input className="input-field" placeholder="Slug (URL personalizada)" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={create} className="btn-primary flex-1">Criar Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
