import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', image_url: '', product_type: 'digital' });

  const load = async () => {
    try { setProducts((await api.get('/products')).data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', price: '', image_url: '', product_type: 'digital' }); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, description: p.description || '', price: String(p.price), image_url: p.image_url || '', product_type: p.product_type }); setShowModal(true); };

  const save = async () => {
    if (!form.name || !form.price) return toast.error('Nome e preço são obrigatórios');
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, { ...form, price: Number(form.price) });
        toast.success('Produto atualizado');
      } else {
        await api.post('/products', { ...form, price: Number(form.price) });
        toast.success('Produto criado');
      }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erro ao salvar'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir produto?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Excluído'); load(); } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm"><Plus className="w-4 h-4" /> Novo Produto</button>
      </div>

      {products.length === 0 && <div className="card text-center py-12"><p className="text-gray-400 mb-4">Nenhum produto cadastrado</p><button onClick={openCreate} className="btn-primary">Criar Primeiro Produto</button></div>}

      <div className="grid gap-4">
        {products.map((p) => (
          <div key={p.id} className="card flex items-center gap-4">
            {p.image_url && <img src={p.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
              <p className="text-sm text-gray-500 truncate">{p.description}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">R$ {Number(p.price).toFixed(2)}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-go-50 text-go-700' : 'bg-gray-50 text-gray-400'}`}>{p.product_type}</span>
            </div>
            {p.checkout_url && <a href={`/checkout/product/${p.checkout_url}`} target="_blank" className="text-gray-400 hover:text-go-500"><ExternalLink className="w-5 h-5" /></a>}
            <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-primary-500"><Edit2 className="w-5 h-5" /></button>
            <button onClick={() => remove(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editing ? 'Editar' : 'Novo'} Produto</h2>
            <div className="space-y-3">
              <input className="input-field" placeholder="Nome do produto *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <textarea className="input-field" placeholder="Descrição" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <input className="input-field" placeholder="Preço (R$) *" type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
              <input className="input-field" placeholder="URL da imagem" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
              <select className="input-field" value={form.product_type} onChange={e => setForm({...form, product_type: e.target.value})}>
                <option value="digital">Digital</option>
                <option value="physical">Físico</option>
                <option value="subscription">Assinatura</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} className="btn-primary flex-1">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
