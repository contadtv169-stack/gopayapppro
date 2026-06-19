import { useState } from 'react';
import { Bell, ArrowRight, Check, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function NotificationSettings() {
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'denied');

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') { toast.error('Notificações não suportadas neste navegador'); return; }
    if (notifPerm === 'granted') { toast('Notificações já permitidas'); return; }
    const result = await Notification.requestPermission();
    setNotifPerm(result);
    if (result === 'granted') {
      toast.success('Notificações ativadas!');
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('GoPay', { body: 'Notificações ativadas com sucesso!', icon: './icons/icon-192.png' });
      }
    } else toast.error('Permissão de notificações negada');
  };

  const canSend = notifPerm === 'granted';

  return (
    <div className="card !p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${canSend ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Bell className={`w-5 h-5 ${canSend ? 'text-green-600' : 'text-gray-400'}`} />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Notificações Push</h2>
          <p className="text-sm text-gray-500">{canSend ? 'Notificações ativas' : 'Permita notificações para receber alertas'}</p>
        </div>
        <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${canSend ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
          {canSend ? 'Ativo' : notifPerm === 'denied' ? 'Bloqueado' : 'Inativo'}
        </span>
      </div>
      <div className="space-y-3 text-sm text-gray-600 mb-4">
        <p className="flex items-center gap-2"><Check className={`w-4 h-4 ${canSend ? 'text-go-500' : 'text-gray-300'}`} /> Alertas de novos pedidos</p>
        <p className="flex items-center gap-2"><Check className={`w-4 h-4 ${canSend ? 'text-go-500' : 'text-gray-300'}`} /> Confirmação de pagamento</p>
        <p className="flex items-center gap-2"><Check className={`w-4 h-4 ${canSend ? 'text-go-500' : 'text-gray-300'}`} /> Atualizações de vendas</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={requestPermission} className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm">
          <Bell className="w-4 h-4" /> {canSend ? 'Gerenciar' : notifPerm === 'denied' ? 'Permitir nas Configurações' : 'Ativar Notificações'}
        </button>
        <Link to="/dashboard/notifications" className="text-go-600 text-sm hover:underline flex items-center gap-1">
          Ver histórico <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {notifPerm === 'denied' && (
        <p className="text-xs text-gray-400 mt-3">Notificações bloqueadas pelo navegador. Permita nas configurações do site.</p>
      )}
    </div>
  );
}
