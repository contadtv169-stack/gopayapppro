import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/supabaseData';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', image_url: '', product_type: 'digital' });

  const load = async () => {
    try { setProducts(await getProducts()); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', price: '', image_url: '', product_type: 'digital' }); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, description: p.description || '', price: String(p.price), image_url: p.image_url || '', product_type: p.product_type }); setShowModal(true); };

  const save = async () => {
    if (!form.name || !form.price) return toast.error('Nome e preço são obrigatórios');
    try {
      if (editing) {
        await updateProduct(editing.id, { ...form, price: Number(form.price) });
        toast.success('Produto atualizado');
      } else {
        await createProduct({ ...form, price: Number(form.price) });
        toast.success('Produto criado');
      }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.message || 'Erro ao salvar'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir produto?')) return;
    try { await deleteProduct(id); toast.success('Excluído'); load(); } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm"><Plus className="w-4 h-4" /> Novo Produto</button>
      </div>

      {products.length === 0 && <div className="card text-center py-12"><p className="text-gray-400 mb-4">Nenhum produto cadastrado</p><button onClick={openCreate} className="btn-primary">Criar Primeiro Produto</button></div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="card">
            {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover rounded-t-2xl -m-4 mb-4" style={{ width: 'calc(100% + 2rem)' }} />}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active !== false ? 'bg-go-50 text-go-700' : 'bg-gray-50 text-gray-500'}`}>
                {p.is_active !== false ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-lg font-bold text-go-600 mb-3">R$ {Number(p.price).toFixed(2)}</p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">{p.sales_count || 0} vendas</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => remove(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Nome do produto" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Descrição (opcional)" rows={3} />
              <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-field" type="number" step="0.01" placeholder="Preço (R$)" />
              <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="URL da imagem (opcional)" />
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
