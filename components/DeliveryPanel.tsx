import React, { useState, useMemo } from 'react';
import { 
  X, Lock, LogOut, ShoppingBag, MapPin, 
  Send, Check, PhoneCall, User, Navigation, ArrowRight
} from 'lucide-react';
import { Order } from '../types';

interface DeliveryPanelProps {
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: Order['status']) => void;
}

const DeliveryPanel: React.FC<DeliveryPanelProps> = ({
  orders, onUpdateOrderStatus
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const deliveryOrders = useMemo(() => {
    return orders.filter(order => 
        order.type === 'delivery' && 
        ['ready', 'out_for_delivery'].includes(order.status)
    );
  }, [orders]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'rider123' || passwordInput === 'admin123') {
        setIsAuthenticated(true);
        setAuthError(false);
        setPasswordInput('');
    } else {
        setAuthError(true);
    }
  };

  const handleCall = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`tel:${cleanPhone}`, '_self');
  };

  const handleDirections = (address?: string) => {
    if (!address) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950 p-4">
        <div className="w-full max-w-md bg-stone-900 border border-brand-500/20 rounded-3xl p-10 text-center shadow-2xl relative">
          <div className="w-16 h-16 bg-stone-950 border border-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-brand-500" />
          </div>
          <h2 className="text-2xl font-serif text-stone-50 mb-2">Delivery Portal</h2>
          <p className="text-stone-500 text-sm mb-8">Chillies Rider Access</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Rider Passkey" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)} 
              className={`w-full bg-stone-950 border rounded-xl p-4 text-center text-stone-50 focus:outline-none focus:border-brand-500 ${authError ? 'border-red-500' : 'border-stone-800'}`}
              autoFocus 
            />
            <button type="submit" className="w-full bg-brand-500 text-white font-bold py-4 rounded-xl uppercase tracking-widest shadow-lg">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-stone-950 flex flex-col font-sans text-stone-200">
      <header className="h-20 border-b border-stone-900/10 px-6 flex items-center justify-between shrink-0 bg-stone-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white"><ShoppingBag size={20} /></div>
              <div>
                  <h2 className="text-xl font-serif text-stone-50 leading-none">Deliveries</h2>
                  <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest">{deliveryOrders.length} Active</p>
              </div>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-red-500 hover:bg-stone-800 transition-colors">
              <LogOut size={16} />
          </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-950">
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {deliveryOrders.length === 0 ? (
                <div className="py-32 text-center border-2 border-dashed border-stone-800 rounded-[3rem] bg-stone-900/20">
                    <Check className="mx-auto text-stone-300 mb-6 opacity-20" size={64} />
                    <p className="text-stone-500 uppercase tracking-[0.2em] text-xs font-bold">No active deliveries</p>
                    <p className="text-stone-600 text-[10px] mt-2">You're all caught up! Great job.</p>
                </div>
            ) : deliveryOrders.map(order => (
                <div key={order.id} className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-stone-800 bg-stone-950/50 flex justify-between items-start">
                        <div>
                            <span className="text-brand-500 font-mono font-bold text-xl block mb-1">#{order.id}</span>
                            <div className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${order.status === 'out_for_delivery' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {order.status === 'ready' ? 'Ready for Pickup' : 'Out for Delivery'}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-stone-50 text-2xl font-serif font-bold block">₹{order.total}</span>
                            <span className="text-stone-500 text-[10px] uppercase font-bold tracking-widest">Amount to Collect</span>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-stone-950 flex items-center justify-center text-stone-500 shrink-0"><User size={18} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-stone-500 text-[10px] uppercase font-bold tracking-widest mb-0.5">Customer</p>
                                    <p className="text-stone-50 font-bold text-sm truncate">{order.customerName}</p>
                                </div>
                                <button onClick={() => handleCall(order.contactNumber)} className="p-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all">
                                    <PhoneCall size={18} />
                                </button>
                            </div>

                            {order.address && (
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-stone-950 flex items-center justify-center text-stone-500 shrink-0"><MapPin size={18} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-stone-500 text-[10px] uppercase font-bold tracking-widest mb-0.5">Address</p>
                                        <p className="text-stone-300 text-sm leading-relaxed">{order.address}</p>
                                    </div>
                                    <button onClick={() => handleDirections(order.address)} className="p-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all">
                                        <Navigation size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800">
                            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black mb-3">Order Items</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                {order.items.map((it: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start text-xs text-stone-300">
                                        <span><span className="text-brand-500 font-bold mr-2">{it.quantity}x</span> {it.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {order.status === 'ready' ? (
                            <button 
                                onClick={() => onUpdateOrderStatus(order.id, 'out_for_delivery')} 
                                className="w-full py-4 bg-brand-500 hover:bg-brand-400 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95"
                            > 
                                Start Delivery <ArrowRight size={16} /> 
                            </button>
                        ) : (
                            <button 
                                onClick={() => onUpdateOrderStatus(order.id, 'delivered')} 
                                className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95"
                            > 
                                <Check size={18} /> Mark as Delivered 
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
};

export default DeliveryPanel;
