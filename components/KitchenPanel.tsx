import React, { useState, useEffect } from 'react';
import { Check, Clock, User, ArrowRight, CheckCircle, Printer } from 'lucide-react';
import { Order } from '../types';
import { printKOT } from '../App';

interface KitchenPanelProps {
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: Order['status'], paymentMethod?: string) => void;
}

const KitchenPanel: React.FC<KitchenPanelProps> = ({ orders, onUpdateOrderStatus }) => {
  const [crossedItems, setCrossedItems] = useState<Record<string, string[]>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); // update every second
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders
    .filter(o => o.status === 'pending' || o.status === 'preparing')
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  const toggleItem = (orderId: string, itemKey: string, currentStatus: string) => {
    if (currentStatus === 'pending') {
        // Automatically move to preparing if they start cooking
        onUpdateOrderStatus(orderId, 'preparing');
    }

    setCrossedItems(prev => {
      const orderCrossed = prev[orderId] || [];
      if (orderCrossed.includes(itemKey)) {
        return { ...prev, [orderId]: orderCrossed.filter(k => k !== itemKey) };
      } else {
        return { ...prev, [orderId]: [...orderCrossed, itemKey] };
      }
    });
  };

  const getElapsedTime = (timestamp?: number) => {
    if (!timestamp) return '00:00';
    const diffMs = currentTime.getTime() - timestamp;
    if (diffMs < 0) return '00:00';
    
    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans overflow-x-hidden p-4 md:p-6 pb-24">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-widest uppercase">KDS Dashboard</h1>
          <p className="text-brand-500 font-bold uppercase tracking-widest text-[10px] mt-1">{activeOrders.length} Active Tickets</p>
        </div>
        <div className="bg-stone-900 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
            <Clock className="text-gold-500" size={18} />
            <span className="font-mono text-xl whitespace-nowrap">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders.map(order => {
          const orderCrossed = crossedItems[order.id] || [];
          const isAllCrossed = orderCrossed.length === order.items.length && order.items.length > 0;
          const isPending = order.status === 'pending';
          const timeElapsed = getElapsedTime(order.createdAt);
          const isDelayed = order.createdAt && (currentTime.getTime() - order.createdAt) > 10 * 60000; // > 10 mins

          return (
            <div key={order.id} className={`flex flex-col bg-stone-900 rounded-3xl overflow-hidden border shadow-2xl transition-all ${isAllCrossed ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.15)]' : isDelayed ? 'border-red-500/80 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-pulse' : 'border-white/10'}`}>
              
              <div className={`p-4 md:p-5 flex justify-between items-center ${isAllCrossed ? 'bg-green-500 text-stone-950' : isDelayed ? 'bg-red-500 text-white' : 'bg-stone-800 text-white'}`}>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter">#{order.id.slice(-4)}</h2>
                  <div className="flex items-center gap-2 mt-1 opacity-80">
                    <User size={12} />
                    <span className="text-[10px] uppercase tracking-widest font-bold truncate max-w-[120px]">{order.customerName}</span>
                  </div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-mono tracking-tighter font-black">{timeElapsed}</div>
                    <span className="text-[9px] uppercase tracking-widest font-bold opacity-80">{order.type}</span>
                </div>
              </div>

              <div className="flex-1 p-2 md:p-4 bg-stone-950">
                <div className="space-y-2">
                  {order.items.map((item, index) => {
                    const itemKey = `${item.id}-${index}`;
                    const isCrossed = orderCrossed.includes(itemKey);
                    
                    return (
                      <button
                        key={itemKey}
                        onClick={() => toggleItem(order.id, itemKey, order.status)}
                        className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all border ${isCrossed ? 'bg-stone-900/50 border-white/5 opacity-50' : 'bg-stone-800 border-white/10 hover:border-gold-500/50 active:scale-[0.98]'}`}
                      >
                        <div className="flex gap-4 items-center">
                          <span className={`text-xl font-black ${isCrossed ? 'text-stone-600' : 'text-gold-500'}`}>{item.quantity}x</span>
                          <span className={`text-sm md:text-base font-bold ${isCrossed ? 'text-stone-500 line-through' : 'text-white'}`}>{item.name}</span>
                        </div>
                        {isCrossed && <Check className="text-stone-600" size={20} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-stone-950 border-t border-white/10 mt-auto flex flex-col gap-3">
                <div className="flex items-center justify-between px-2 text-stone-500">
                  <span className="text-[10px] uppercase font-black tracking-widest">Status</span>
                  <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${isDelayed ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' : isPending ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-brand-500/10 text-brand-500 border border-brand-500/20'}`}>
                     {isDelayed ? 'Delayed' : isPending ? 'Pending' : 'Preparing'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => printKOT(order)} 
                    title="Print KOT"
                    className="p-4 bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 rounded-2xl border border-white/10 transition-all active:scale-95"
                  >
                    <Printer size={20} />
                  </button>
                  <button 
                    onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${isAllCrossed ? 'bg-green-500 text-stone-950 shadow-[0_10px_40px_rgba(34,197,94,0.3)] animate-pulse hover:bg-green-400' : 'bg-stone-800 text-white hover:bg-stone-700 hover:text-green-400'}`}
                  >
                    <CheckCircle size={20} className={isAllCrossed ? "stroke-[3]" : ""} /> Mark as Ready
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {activeOrders.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-stone-600 border-2 border-dashed border-stone-800 rounded-3xl">
                <CheckCircle size={48} className="mb-6 opacity-20" />
                <h2 className="text-2xl font-serif text-stone-500">Kitchen is Clear</h2>
                <p className="text-xs uppercase tracking-widest mt-2 font-black">All active tickets have been prepared</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default KitchenPanel;
