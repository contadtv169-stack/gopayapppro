import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstall(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service Worker registered');
      }).catch(() => {});
    }
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!showInstall || isInstalled) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-72 animate-in slide-in-from-bottom-4">
      <button onClick={() => setShowInstall(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-go-500 to-primary-600 rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Instalar GoPay</p>
          <p className="text-xs text-gray-500">Instale como aplicativo</p>
        </div>
      </div>
      <button onClick={install} className="btn-primary w-full text-sm !py-2">
        Instalar App
      </button>
    </div>
  );
}
