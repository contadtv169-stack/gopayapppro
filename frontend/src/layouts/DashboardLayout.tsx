import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DollarSign, LayoutDashboard, Package, ShoppingCart, Link as LinkIcon, Settings, LogOut, Bell, Menu, X, ChevronDown, User, PenSquare } from 'lucide-react';
import { useEffect } from 'react';
import api from '../services/api';
import { AIChat } from '../components/AIChat';
import { PWAInstall } from '../components/PWAInstall';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dashboard/products', icon: Package, label: 'Produtos' },
  { path: '/dashboard/editor', icon: PenSquare, label: 'Editor' },
  { path: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos' },
  { path: '/dashboard/links', icon: LinkIcon, label: 'Links' },
  { path: '/dashboard/settings', icon: Settings, label: 'Configurações' },
];

export default function DashboardLayout({ children, user }: { children: React.ReactNode; user: any }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/notifications/unread-count').then(({ data }) => setNotifCount(data.count)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/notifications/unread-count').then(({ data }) => setNotifCount(data.count)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem('gopay_token');
    localStorage.removeItem('gopay_refresh');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-go-500 to-primary-600 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-white" /></div>
            <span className="text-lg font-bold text-gray-900">GoPay</span>
          </Link>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-go-50 text-go-700' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-400">Taxa por transação</p>
          <p className="text-lg font-bold text-go-600">R$ 7,00</p>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notifCount > 9 ? '9+' : notifCount}</span>}
            </button>
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-go-500 to-primary-600 rounded-lg flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name || 'Usuário'}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100"><p className="text-sm font-medium text-gray-900">{user?.name}</p><p className="text-xs text-gray-500">{user?.email}</p></div>
                  <button onClick={() => { navigate('/dashboard/settings'); setShowUserMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"><Settings className="w-4 h-4" /> Configurações</button>
                  <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" /> Sair</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
      <AIChat context="dashboard" />
      <PWAInstall />
    </div>
  );
}
