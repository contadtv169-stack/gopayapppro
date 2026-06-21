import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Link as LinkIcon, Settings, LogOut, 
  Bell, Menu, X, ChevronDown, User, PenSquare, MessageCircle, Download, 
  Home, Smartphone, Camera, Trophy, TrendingUp, PiggyBank
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logout as authLogout } from '../services/auth';
import { getUnreadCount, markNotificationRead, getNotifications } from '../services/supabaseData';
import { AIChat } from '../components/AIChat';
import { PWAInstall } from '../components/PWAInstall';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dashboard/products', icon: Package, label: 'Produtos' },
  { path: '/dashboard/editor', icon: PenSquare, label: 'Editor' },
  { path: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos' },
  { path: '/dashboard/links', icon: LinkIcon, label: 'Links' },
  { path: '/dashboard/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { path: '/dashboard/facebook-ads', icon: MessageCircle, label: 'Facebook Ads' },
  { path: '/dashboard/viral-products', icon: TrendingUp, label: 'Prod. Virais' },
  { path: '/dashboard/wallet', icon: PiggyBank, label: 'Carteira' },
  { path: '/dashboard/camfacial', icon: Camera, label: 'CamFacial' },
  { path: '/dashboard/placas', icon: Trophy, label: 'Placas' },
  { path: '/dashboard/settings', icon: Settings, label: 'Configurações' },
];

const mobileNav = [
  { path: '/dashboard', icon: Home, label: 'Início' },
  { path: '/dashboard/products', icon: Package, label: 'Produtos' },
  { path: '/dashboard/editor', icon: PenSquare, label: 'Editor' },
  { path: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos' },
  { path: '/dashboard/links', icon: LinkIcon, label: 'Links' },
  { path: '/dashboard/placas', icon: Trophy, label: 'Placas' },
  { path: '/dashboard/settings', icon: Settings, label: 'Ajustes' },
];

export default function DashboardLayout({ children, user }: { children: React.ReactNode; user: any }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userAvatar, setUserAvatar] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const u = localStorage.getItem('gopay_user');
      if (u) setUserAvatar(JSON.parse(u).avatar_url || '');
    } catch {}
  }, []);

  const loadNotifs = async () => {
    try {
      const [count, list] = await Promise.all([getUnreadCount(), getNotifications()]);
      setNotifCount(count);
      setNotifList(list);
    } catch {}
  };

  const handleNotifClick = async (n: any) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      loadNotifs();
    }
    setShowNotif(false);
  };

  const logout = () => {
    authLogout();
    navigate('/');
  };

  const isActive = (path: string) => path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-go-500 to-primary-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">$</span></div>
            <span className="text-lg font-bold text-gray-900">GoPay</span>
          </Link>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path) ? 'bg-go-50 text-go-700' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <button onClick={() => toast('Para instalar, use o menu do navegador > Compartilhar > Adicionar à tela inicial')}
            className="w-full flex items-center gap-2 px-4 py-3 bg-go-50 text-go-700 rounded-xl text-sm font-medium hover:bg-go-100 transition-colors">
            <Download className="w-4 h-4" /> Baixar App
          </button>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400">Taxa por transação</p>
            <p className="text-lg font-bold text-go-600">R$ 7,00</p>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          <div className="hidden lg:block text-sm text-gray-500">Bem-vindo(a), <span className="font-semibold text-gray-900">{user?.name || 'Usuário'}</span></div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
                {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notifCount > 9 ? '9+' : notifCount}</span>}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <div className="p-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">Notificações</p></div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifList.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">Nenhuma notificação</p>}
                    {notifList.map((n: any) => (
                      <button key={n.id} onClick={() => handleNotifClick(n)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-go-50/50' : ''}`}>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-go-500 to-primary-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
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

      {/* Mobile Bottom Nav - removed per user request */}

      <AIChat context="dashboard" />
      <PWAInstall />
    </div>
  );
}
