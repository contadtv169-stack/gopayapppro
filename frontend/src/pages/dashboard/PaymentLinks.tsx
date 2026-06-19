import { useEffect, useState } from 'react';
import { Plus, Copy, Trash2, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPaymentLinks, createPaymentLink, deletePaymentLink } from '../../services/supabaseData';

const BASE_URL = 'https://contadtv169-stack.github.io/gopayapppro';

export default function PaymentLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', amount: '', slug: '' });

  const load = async () => {
    try { setLinks(await getPaymentLinks()); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title || !form.amount) return toast.error('Título e valor são obrigatórios');
    try {
      await createPaymentLink({
        title: form.title,
        description: form.description,
        amount: Number(form.amount),
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      });
      toast.success('Link criado!');
      setShowModal(false);
      setForm({ title: '', description: '', amount: '', slug: '' });
      load();
    } catch (err: any) { toast.error(err.message || 'Erro'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir link?')) return;
    try { await deletePaymentLink(id); toast.success('Excluído'); load(); } catch {}
  };

  const copyLink = (slug: string) => {
    const url = `${BASE_URL}/#/checkout/link/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Links de Pagamento</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm"><Plus className="w-4 h-4" /> Novo Link</button>
      </div>

      {links.length === 0 && <div className="card text-center py-12"><p className="text-gray-400 mb-4">Nenhum link de pagamento</p><button onClick={() => setShowModal(true)} className="btn-primary">Criar Primeiro Link</button></div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <div key={link.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{link.title}</h3>
                {link.description && <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${link.is_active ? 'bg-go-50 text-go-700' : 'bg-gray-50 text-gray-500'}`}>
                {link.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-lg font-bold text-go-600 mb-3">{link.amount > 0 ? `R$ ${Number(link.amount).toFixed(2)}` : 'Valor livre'}</p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">{link.sales_count || 0} vendas</span>
              <div className="flex gap-1">
                <button onClick={() => copyLink(link.slug)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Copiar link"><Copy className="w-4 h-4 text-gray-500" /></button>
                <a href={`${BASE_URL}/#/checkout/link/${link.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 rounded-lg"><ExternalLink className="w-4 h-4 text-gray-500" /></a>
                <button onClick={() => remove(link.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Link de Pagamento</h2>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Título" />
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="input-field" placeholder="URL personalizada (slug)" />
              <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field" type="number" step="0.01" placeholder="Valor (R$) - 0 para valor livre" />
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
