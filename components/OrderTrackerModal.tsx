
import React, { useState, useEffect } from 'react';
import { X, Search, Clock, CheckCircle, XCircle, ShoppingBag, Bike, Store, Flame, User, Star, Navigation, MapPin } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { Order } from '../types';
import SafeImage from './SafeImage';
import { MapContainer, TileLayer, Marker, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const riderIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    className: 'drop-shadow-xl saturate-200'
});

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    React.useEffect(() => {
        map.setView(center, map.getZoom() || 16, { animate: true });
        setTimeout(() => map.invalidateSize(), 200);
    }, [center, map]);
    return null;
}

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  riderLocation?: {lat: number, lng: number, timestamp: number} | null;
  orders?: Order[];
}

const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ isOpen, onClose, initialOrderId = '', riderLocation, orders = [] }) => {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [myHistory, setMyHistory] = useState<Order[]>([]);
  const [isPagerActive, setIsPagerActive] = useState(false);

  // Audio ref for the pager
  const pagerAudio = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isPagerActive) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 500, 200, 500, 100, 200, 100, 500]);
      
      const audio = new Audio('/chime.mp3');
      audio.loop = true;
      pagerAudio.current = audio;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
         playPromise.catch(e => console.log('Audio blocked:', e));
      }
    } else {
      if (pagerAudio.current) {
        pagerAudio.current.pause();
        pagerAudio.current.currentTime = 0;
      }
      if ('vibrate' in navigator) navigator.vibrate(0);
    }
    
    return () => {
      if (pagerAudio.current) {
         pagerAudio.current.pause();
      }
    };
  }, [isPagerActive]);

  useEffect(() => {
      if (foundOrder) {
          const updatedOrder = orders.find(o => o.id === foundOrder.id);
          if (updatedOrder) {
              if (updatedOrder.type === 'pickup' && updatedOrder.status === 'ready' && foundOrder.status !== 'ready') {
                  setIsPagerActive(true);
              }
              setFoundOrder(updatedOrder);
          }
      }
  }, [orders]);

  useEffect(() => {
    if(initialOrderId) {
        setOrderId(initialOrderId);
        if(isOpen) {
            fetchOrderDetails(initialOrderId);
        }
    } else if (isOpen) {
        setFoundOrder(null);
    }
  }, [initialOrderId, isOpen]);

  useEffect(() => {
    if (isOpen) {
        try {
            const savedIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
            if (savedIds.length > 0) {
                const history = orders.filter(o => savedIds.includes(o.id)).sort((a, b) => b.createdAt - a.createdAt);
                setMyHistory(history);
            }
        } catch(e) { console.error('Error loading history:', e); }
    }
  }, [isOpen, orders]);

  if (!isOpen) return null;

  const fetchOrderDetails = (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setError('');
    
    const targetId = idToFetch.trim().toUpperCase();
    const found = orders.find(o => o.id === targetId);
    
    if (!found) {
        setError('Order not found. Please check your Order ID.');
        setFoundOrder(null);
    } else {
        setFoundOrder(found);
        
        // Also save to standard history if not present
        try {
            const savedIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
            if (!savedIds.includes(targetId)) {
                savedIds.push(targetId);
                localStorage.setItem('myOrders', JSON.stringify(savedIds));
                const history = orders.filter(o => savedIds.includes(o.id)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setMyHistory(history);
            }
        } catch(e) {}
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrderDetails(orderId);
  };

  const handleRatingSubmit = async (rating: number) => {
    if (!foundOrder || foundOrder.status !== 'delivered') return;
    setIsSubmittingRating(true);
    try {
       const q = query(collection(db, 'orders'), where("id", "==", foundOrder.id));
       const snap = await getDocs(q);
       snap.forEach(d => updateDoc(d.ref, { deliveryRating: rating }));
       setFoundOrder(prev => prev ? {...prev, deliveryRating: rating} : null);
    } catch (e) {
       console.error("Error rating delivery:", e);
    } finally {
       setIsSubmittingRating(false);
    }
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
      {isPagerActive && (
         <div className="fixed inset-0 z-[110] bg-green-500 flex flex-col items-center justify-center p-6 animate-pulse" onClick={e => e.stopPropagation()}>
            <ShoppingBag size={120} className="text-stone-950 mb-8 animate-bounce" />
            <h1 className="text-4xl md:text-6xl font-black text-stone-950 text-center uppercase tracking-tighter mb-4">Your Order is Ready!</h1>
            <p className="text-stone-900 text-lg md:text-2xl font-bold mb-12 text-center uppercase tracking-widest">Please collect it at the counter.</p>
            <button 
               onClick={() => setIsPagerActive(false)}
               className="bg-stone-950 text-green-500 w-full max-w-sm py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-95 transition-all"
            >
               Dismiss Alarm
            </button>
         </div>
      )}
      <div className="bg-stone-900 border border-gold-500/30 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-stone-950/50">
            <h2 className="font-serif text-xl text-white">Track Your Order</h2>
            <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors p-1 hover:bg-stone-950/5 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6">
            <form onSubmit={handleTrack} className="mb-6">
                <div className="relative flex items-center">
                    <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())} placeholder="Order ID (e.g. A1234)" className="w-full bg-stone-950 border border-stone-800 rounded-lg py-3 pl-4 pr-12 text-white placeholder-stone-600 focus:border-gold-500 focus:outline-none transition-colors uppercase tracking-widest font-mono" />
                    <button type="submit" disabled={loading || !orderId.trim()} className="absolute right-2 p-1.5 bg-stone-800 rounded-md text-gold-500 hover:bg-gold-500 hover:text-stone-950 transition-colors disabled:opacity-50"><Search size={18} /></button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2 pl-1 flex items-center gap-1"><XCircle size={10} /> {error}</p>}
            </form>
            {loading && (<div className="flex flex-col items-center py-8"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-2"></div><span className="text-stone-500 text-xs uppercase tracking-widest">Searching...</span></div>)}
            
            {!foundOrder && !loading && myHistory.length > 0 && (
                <div className="animate-fade-in-up">
                    <h3 className="text-stone-400 text-xs uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2"><Clock size={14}/> Recent Orders</h3>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
                        {myHistory.map(histOrder => (
                            <div key={histOrder.id} onClick={() => fetchOrderDetails(histOrder.id)} className="p-4 bg-stone-950/50 border border-white/5 rounded-xl cursor-pointer hover:border-gold-500/30 transition-all flex justify-between items-center group">
                                <div>
                                    <h4 className="text-white font-mono font-bold tracking-wider">{histOrder.id}</h4>
                                    <p className="text-stone-500 text-[10px] uppercase tracking-widest mt-1">
                                        {new Date(histOrder.createdAt).toLocaleDateString()} • ₹{histOrder.total}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {(() => {
                                        const status = getStatusDisplay(histOrder.status, histOrder.type);
                                        return (
                                            <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded border border-current ${status.color} bg-stone-900 flex items-center gap-1`}>
                                                {histOrder.status.replace(/_/g, ' ')}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {foundOrder && (
                <div className="animate-fade-in-up">
                    <div className="mb-8">
                        {foundOrder.status === 'cancelled' ? (
                            <div className="flex flex-col items-center text-center">
                                <div className="p-4 rounded-full bg-red-500/10 mb-3 shadow-lg"><XCircle size={48} className="text-red-500" /></div>
                                <h3 className="text-xl font-bold text-red-500 mb-1">Order Cancelled</h3>
                                <p className="text-stone-400 text-xs max-w-[200px]">Your order was cancelled by the branch.</p>
                            </div>
                        ) : (
                            <div className="w-full relative px-2 animate-fade-in">
                                {(() => {
                                    const deliverySteps = [
                                        { id: 'pending', title: 'Received', icon: Clock },
                                        { id: 'preparing', title: 'Preparing', icon: Flame },
                                        { id: 'out_for_delivery', title: 'On the Way', icon: Bike },
                                        { id: 'delivered', title: 'Delivered', icon: CheckCircle }
                                    ];
                                    const pickupSteps = [
                                        { id: 'pending', title: 'Received', icon: Clock },
                                        { id: 'preparing', title: 'Preparing', icon: Flame },
                                        { id: 'ready', title: 'Ready', icon: ShoppingBag },
                                        { id: 'delivered', title: 'Collected', icon: CheckCircle }
                                    ];
                                    const steps = foundOrder.type === 'delivery' ? deliverySteps : pickupSteps;
                                    const currentPhaseIndex = steps.findIndex(s => s.id === foundOrder.status);
                                    const activeIndex = currentPhaseIndex >= 0 ? currentPhaseIndex : 0;

                                    return (
                                        <div className="relative flex justify-between items-start w-full">
                                            {/* Connecting Line Base */}
                                            <div className="absolute top-5 left-[12.5%] right-[12.5%] h-1 bg-stone-800 rounded-full z-0 block"></div>
                                            
                                            {/* Connecting Line Active */}
                                            <div className="absolute top-5 left-[12.5%] h-1 bg-brand-500 rounded-full z-0 transition-all duration-1000 ease-in-out block" style={{ width: `${(activeIndex / (steps.length - 1)) * 75}%` }}></div>

                                            {steps.map((step, index) => {
                                                const Icon = step.icon;
                                                const isActive = index === activeIndex;
                                                const isCompleted = index <= activeIndex;
                                                
                                                return (
                                                    <div key={step.id} className="relative z-10 flex flex-col items-center w-1/4 transition-all duration-300">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 shadow-xl ${
                                                            isActive ? 'bg-brand-500 text-stone-950 scale-125 ring-4 ring-brand-500/30 shadow-brand-500/40' : 
                                                            isCompleted ? 'bg-brand-500 text-stone-950' : 
                                                            'bg-stone-900 border border-stone-700 text-stone-600'
                                                        }`}>
                                                            <Icon size={isActive ? 20 : 18} className={isActive ? 'animate-pulse' : ''} />
                                                        </div>
                                                        <span className={`mt-4 text-[9px] md:text-[10px] uppercase tracking-widest font-black text-center leading-tight transition-colors duration-500 ${
                                                            isActive ? 'text-brand-500 shadow-brand-500 drop-shadow-md' : 
                                                            isCompleted ? 'text-white' : 
                                                            'text-stone-600'
                                                        }`}>
                                                            {step.title}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                    
                    {foundOrder.status === 'out_for_delivery' && foundOrder.type === 'delivery' && riderLocation && (
                        <div className="mb-6 rounded-2xl overflow-hidden border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)] relative bg-stone-950 animate-fade-in">
                            <div className="p-3 bg-stone-950 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 relative shrink-0">
                                        <Bike size={16} />
                                        <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-xs uppercase tracking-widest leading-none mb-1">Live Rider Tracking</h4>
                                        <p className="text-stone-500 text-[9px] uppercase tracking-[0.2em] font-mono leading-none">Last Synced: {new Date(riderLocation.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                                <a href={`https://www.google.com/maps/search/?api=1&query=${riderLocation.lat},${riderLocation.lng}`} target="_blank" rel="noreferrer" className="text-purple-500 hover:text-white transition-colors p-2 bg-stone-900 rounded-lg shrink-0">
                                    <MapPin size={16} />
                                </a>
                            </div>
                            <div className="w-full h-48 relative z-0">
                                <MapContainer 
                                    center={[riderLocation.lat, riderLocation.lng]} 
                                    zoom={16} 
                                    scrollWheelZoom={false} 
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer 
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    />
                                    <MapUpdater center={[riderLocation.lat, riderLocation.lng]} />
                                    <CircleMarker center={[9.4818520, 76.3307510]} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.5, weight: 2 }} radius={8}>
                                        <Tooltip permanent direction="top" className="bg-stone-900 border-none text-green-500 font-bold uppercase tracking-widest text-[9px] shadow-lg">Shop</Tooltip>
                                    </CircleMarker>
                                    <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon} />
                                </MapContainer>
                            </div>
                        </div>
                    )}
                    
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
                    
                    {foundOrder.status === 'delivered' && foundOrder.type === 'delivery' && (
                        <div className="mt-6 bg-stone-900 border border-gold-500/20 rounded-2xl p-5 text-center shadow-lg animate-fade-in">
                            <h4 className="text-white font-serif text-lg mb-1">How was your delivery?</h4>
                            <p className="text-stone-500 text-[10px] uppercase font-bold tracking-widest mb-4">Rate your rider</p>
                            
                            {foundOrder.deliveryRating ? (
                                <div className="flex justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} size={24} className={star <= foundOrder.deliveryRating! ? "fill-gold-500 text-gold-500" : "text-stone-700"} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            key={star}
                                            disabled={isSubmittingRating}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => handleRatingSubmit(star)}
                                            className="p-1 transition-all disabled:opacity-50 hover:scale-110 active:scale-95"
                                        >
                                            <Star size={32} className={(hoverRating >= star) ? "fill-gold-500 text-gold-500" : "text-stone-700"} />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {foundOrder.deliveryRating && <p className="text-gold-500 text-xs mt-3 font-bold">Thank you for your feedback!</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrderTrackerModal;
