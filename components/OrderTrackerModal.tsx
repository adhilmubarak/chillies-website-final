
import React, { useState, useEffect } from 'react';
import { X, Search, Clock, CheckCircle, XCircle, ShoppingBag, Bike, Store, Flame, User } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Order } from '../types';
import SafeImage from './SafeImage';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ isOpen, onClose, initialOrderId = '' }) => {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);

  useEffect(() => {
    if(initialOrderId) {
        setOrderId(initialOrderId);
        if(isOpen) {
            fetchOrderDetails(initialOrderId);
        }
    }
  }, [initialOrderId, isOpen]);

  if (!isOpen) return null;

  const fetchOrderDetails = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setLoading(true);
    setError('');
    setFoundOrder(null);
    try {
      const q = query(collection(db, 'orders'), where('id', '==', idToFetch.trim()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError('Order not found. Please check your Order ID.');
      } else {
        const data = querySnapshot.docs[0].data() as Order;
        setFoundOrder(data);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to fetch order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrderDetails(orderId);
  };

  const getStatusDisplay = (status: Order['status'], type: Order['type']) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock size={48} className="text-yellow-500 animate-pulse" />, title: 'Order Received', desc: 'Checking order.', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      case 'preparing':
        return { icon: <Flame size={48} className="text-orange-500 animate-bounce-slow" />, title: 'Preparing', desc: 'Cooking your meal.', color: 'text-orange-500', bg: 'bg-orange-500/10' };
       case 'ready':
        return { icon: <ShoppingBag size={48} className="text-blue-500" />, title: 'Ready', desc: type === 'delivery' ? 'Waiting for delivery.' : 'Ready at the counter.', color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'out_for_delivery':
        return { icon: <Bike size={48} className="text-purple-500 animate-pulse" />, title: 'Out for Delivery', desc: 'On its way!', color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'delivered':
        return { icon: <CheckCircle size={48} className="text-green-500" />, title: 'Delivered', desc: 'Enjoy your meal!', color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'cancelled':
        return { icon: <XCircle size={48} className="text-red-500" />, title: 'Cancelled', desc: 'Order was cancelled.', color: 'text-red-500', bg: 'bg-red-500/10' };
      default:
        return { icon: <Clock size={48} />, title: 'Unknown', desc: '', color: 'text-stone-500', bg: 'bg-stone-800' };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-stone-900 border border-gold-500/30 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-stone-950/50">
            <h2 className="font-serif text-xl text-white">Track Your Order</h2>
            <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6">
            <form onSubmit={handleTrack} className="mb-6">
                <div className="relative flex items-center">
                    <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())} placeholder="Order ID (e.g. A1234)" className="w-full bg-stone-950 border border-stone-800 rounded-lg py-3 pl-4 pr-12 text-white placeholder-stone-600 focus:border-gold-500 focus:outline-none transition-colors uppercase tracking-widest font-mono" />
                    <button type="submit" disabled={loading} className="absolute right-2 p-1.5 bg-stone-800 rounded-md text-gold-500 hover:bg-gold-500 hover:text-stone-950 transition-colors disabled:opacity-50"><Search size={18} /></button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2 pl-1 flex items-center gap-1"><XCircle size={10} /> {error}</p>}
            </form>
            {loading && (<div className="flex flex-col items-center py-8"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-2"></div><span className="text-stone-500 text-xs uppercase tracking-widest">Searching...</span></div>)}
            {foundOrder && (
                <div className="animate-fade-in-up">
                    <div className="flex flex-col items-center text-center mb-6">
                        {(() => {
                            const status = getStatusDisplay(foundOrder.status, foundOrder.type);
                            return (<><div className={`p-4 rounded-full ${status.bg} mb-3 shadow-lg`}>{status.icon}</div><h3 className={`text-xl font-bold ${status.color} mb-1`}>{status.title}</h3><p className="text-stone-400 text-xs max-w-[200px]">{status.desc}</p></>);
                        })()}
                    </div>
                    <div className="bg-stone-950/50 rounded-xl border border-white/5 p-4 space-y-3">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-3 mb-1">
                          <div className="w-8 h-8 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center text-gold-500">
                            <User size={14} />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-500 uppercase tracking-widest block">Customer</span>
                            <span className="text-white font-bold text-sm">{foundOrder.customerName}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2"><span className="text-stone-500">Items ({foundOrder.items.length})</span><span className="text-white font-bold">₹{foundOrder.total}</span></div>
                        <div className="space-y-2">
                          {foundOrder.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs text-stone-400 items-center gap-3">
                              <SafeImage src={item.image} containerClassName="w-8 h-8 rounded-md" className="w-full h-full object-cover" />
                              <span className="flex-1">{item.quantity}x {item.name}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-2 mt-2 border-t border-white/5 text-[10px] text-stone-500 uppercase tracking-wide">{foundOrder.type === 'delivery' ? <Bike size={12} /> : <Store size={12} />}{foundOrder.type === 'delivery' && foundOrder.address ? 'Delivery' : 'Pickup'}</div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrderTrackerModal;
