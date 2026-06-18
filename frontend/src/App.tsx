import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CheckoutPage from './pages/CheckoutPage';
import PaymentLinkPage from './pages/PaymentLinkPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Products from './pages/dashboard/Products';
import Orders from './pages/dashboard/Orders';
import PaymentLinks from './pages/dashboard/PaymentLinks';
import Settings from './pages/dashboard/Settings';
import Editor from './pages/dashboard/Editor';
import api from './services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('gopay_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gopay_token');
    if (token) {
      api.get('/users/me').then(({ data }) => {
        setUser(data);
      }).catch(() => {
        localStorage.removeItem('gopay_token');
        localStorage.removeItem('gopay_refresh');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-go-500"></div></div>;

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', background: '#1e293b', color: '#fff' } }} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/checkout/product/:slug" element={<CheckoutPage />} />
        <Route path="/checkout/link/:slug" element={<PaymentLinkPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout user={user}><Dashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/products" element={<ProtectedRoute><DashboardLayout user={user}><Products /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/orders" element={<ProtectedRoute><DashboardLayout user={user}><Orders /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/links" element={<ProtectedRoute><DashboardLayout user={user}><PaymentLinks /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/editor" element={<ProtectedRoute><DashboardLayout user={user}><Editor /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardLayout user={user}><Settings /></DashboardLayout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
