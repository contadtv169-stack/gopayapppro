import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, Mail, Lock, User, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Preencha todos os campos');
    if (password.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('gopay_token', data.accessToken);
      localStorage.setItem('gopay_refresh', data.refreshToken);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-go-50 to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-go-500 to-primary-600 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div>
          <span className="text-2xl font-bold text-gray-900">GoPay</span>
        </Link>
        <div className="card !p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta</h1>
          <p className="text-gray-500 mb-6">Comece a receber pagamentos em minutos.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field !pl-10" placeholder="Seu nome completo" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field !pl-10" placeholder="seu@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field !pl-10" placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" /> : <><UserPlus className="w-5 h-5" /> Criar Conta Grátis</>}
            </button>
          </form>
          <p className="text-center text-gray-500 mt-6 text-sm">Já tem conta? <Link to="/login" className="text-go-600 font-semibold hover:text-go-700">Entrar</Link></p>
        </div>
      </div>
    </div>
  );
}
