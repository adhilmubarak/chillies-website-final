import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Lock, LogOut, ShoppingBag, MapPin, 
  Send, Check, PhoneCall, User, Navigation, ArrowRight, Map, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { Order } from '../types';

interface DeliveryPanelProps {
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: Order['status'], paymentMethod?: string) => void;
  onUpdateRiderLocation?: (lat: number, lng: number) => void;
  deliveryUpiId?: string;
}

const DeliveryPanel: React.FC<DeliveryPanelProps> = ({
  orders, onUpdateOrderStatus, onUpdateRiderLocation, deliveryUpiId = ''
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, 'Cash' | 'UPI'>>({});
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem('chillies_rider_token') === 'authorized') {
      setHasSavedSession(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !onUpdateRiderLocation) return;
    
    let watchId: number;
    if ("geolocation" in navigator) {
      // Force initial prompt to catch strict denials immediately
      navigator.geolocation.getCurrentPosition(
        () => setLocationError(null),
        (err) => {
            if (err.code === err.PERMISSION_DENIED) {
                setLocationError('Location Access Denied. You must enable GPS tracking to use the Rider App.');
            } else {
                setLocationError('Unable to fetch GPS signal. Ensure location services are ON.');
            }
        },
        { enableHighAccuracy: true }
      );

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocationError(null);
          onUpdateRiderLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error watching location:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError('Location Access Denied. You must enable GPS to use the Rider App.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
             setLocationError('Location Unavailable. Please check your GPS signal.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isAuthenticated, onUpdateRiderLocation]);

  const deliveryOrders = useMemo(() => {
    return orders.filter(order => 
        order.type === 'delivery' && 
        ['ready', 'out_for_delivery'].includes(order.status)
    ).sort((a: any, b: any) => Number(a.assignedAt || a.createdAt || 0) - Number(b.assignedAt || b.createdAt || 0));
  }, [orders]);

  const dailyDeliveredCount = useMemo(() => {
    const today = new Date().toLocaleDateString();
    return orders.filter(order => order.type === 'delivery' && order.status === 'delivered' && order.date === today).length;
  }, [orders]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'rider123' || passwordInput === 'admin123') {
        setIsAuthenticated(true);
        setAuthError(false);
        setPasswordInput('');
        localStorage.setItem('chillies_rider_token', 'authorized');
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
    const urlMatch = address.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
       window.open(urlMatch[0], '_blank');
    } else {
       window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent"></div>
        
        <div className="w-full max-w-sm bg-stone-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl relative animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-600 to-brand-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(212,175,55,0.4)]">
            <Lock className="text-stone-950" size={32} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-1">Rider Portal</h2>
          <p className="text-brand-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Authorized Access Only</p>
          
          {hasSavedSession ? (
            <div className="space-y-4">
                <button 
                  onClick={() => setIsAuthenticated(true)} 
                  className="w-full bg-brand-500 hover:bg-brand-400 text-stone-950 font-black py-4 rounded-2xl uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                    <ShieldCheck size={20} /> Resume Shift
                </button>
                <button 
                  onClick={() => { setHasSavedSession(false); localStorage.removeItem('chillies_rider_token'); }} 
                  className="text-stone-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors mt-6 block mx-auto py-2"
                >
                    Switch Account
                </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
                <input 
                  type="password" 
                  placeholder="Enter Passkey" 
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)} 
                  className={`w-full bg-stone-950/80 border rounded-2xl py-4 text-center text-white text-lg tracking-[0.2em] font-mono focus:outline-none focus:border-brand-500 transition-all shadow-inner ${authError ? 'border-red-500 text-red-100' : 'border-white/10'}`}
                  autoFocus 
                />
                <button type="submit" className="w-full bg-stone-100 hover:bg-white text-stone-950 font-black py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                    Connect <ArrowRight size={18} />
                </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Location enforcement overlay
  if (locationError) {
      return (
        <div className="fixed inset-0 z-[300] bg-stone-950/95 backdrop-blur-3xl flex items-center justify-center p-6 text-center animate-fade-in">
           <div className="max-w-md w-full bg-stone-900 border border-red-500/20 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(239,68,68,0.15)] flex flex-col items-center">
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <MapPin className="text-red-500" size={40} />
              </div>
              <h2 className="text-2xl font-serif text-white mb-3">GPS Required</h2>
              <p className="text-stone-400 text-sm leading-relaxed mb-8">{locationError}</p>
              <div className="bg-stone-950 border border-white/5 p-4 rounded-2xl w-full text-left flex gap-3 text-sm text-stone-500">
                  <AlertTriangle size={20} className="text-yellow-500 shrink-0" />
                  <p>You cannot receive or deliver orders until location tracking is permitted through your browser settings.</p>
              </div>
              <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-stone-200 transition-colors">
                  Check Again
              </button>
           </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#0c0c0c] flex flex-col font-sans overflow-hidden">
      
      {/* Floating Glass Header */}
      <header className="fixed top-0 inset-x-0 h-24 border-b border-white/5 px-4 md:px-8 flex items-center justify-between z-50 bg-stone-950/70 backdrop-blur-2xl">
          <div className="flex items-center gap-4">
              <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-brand-400 rounded-2xl flex items-center justify-center text-stone-950 shadow-lg shadow-brand-500/20">
                      <Map size={24} strokeWidth={2.5} />
                  </div>
                  {/* Pulsing online indicator */}
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-stone-950 flex items-center justify-center">
                      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50"></div>
                  </div>
              </div>
              <div className="pt-1">
                  <h2 className="text-2xl font-black tracking-tighter text-white leading-none">RIDER ZONE</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-[10px] text-brand-400 font-bold uppercase tracking-[0.2em]">{deliveryOrders.length} Active Drops</p>
                      <span className="w-1 h-1 rounded-full bg-stone-700"></span>
                      <p className="text-[10px] text-green-500 font-bold uppercase tracking-[0.2em]">{dailyDeliveredCount} Completed</p>
                  </div>
              </div>
          </div>
          <button onClick={() => { setIsAuthenticated(false); localStorage.removeItem('chillies_rider_token'); setHasSavedSession(false); }} className="w-12 h-12 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm">
              <LogOut size={18} />
          </button>
      </header>

      {/* Main Content Space */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-32 pb-24 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed" style={{ backgroundSize: '100px', backgroundColor: '#0c0c0c', backgroundBlendMode: 'overlay'}}>
        <div className="max-w-3xl mx-auto space-y-6">
            
            {deliveryOrders.length === 0 ? (
                <div className="py-40 flex flex-col items-center justify-center text-center animate-fade-in-up">
                    <div className="w-32 h-32 bg-stone-900 rounded-[3rem] rotate-12 flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                        <Check className="text-stone-700" size={64} />
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-2">Zone is Clear</h3>
                    <p className="text-stone-500 uppercase tracking-[0.2em] text-[10px] font-black">Waiting for next dispatch...</p>
                </div>
            ) : deliveryOrders.map((order, i) => {
                const method = paymentMethods[order.id] || 'Cash';
                const isOut = order.status === 'out_for_delivery';
                
                return (
                <div key={order.id} className="bg-gradient-to-br from-stone-900 to-stone-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                    
                    {/* Status Glow Bar */}
                    <div className={`h-1.5 w-full ${isOut ? 'bg-gradient-to-r from-purple-500 to-purple-400' : 'bg-gradient-to-r from-brand-500 to-brand-300'}`}></div>

                    <div className="p-6 md:p-8 flex justify-between items-start border-b border-white/5 relative bg-white/[0.01]">
                        <div>
                            <span className="text-white font-black text-3xl tracking-tighter block mb-2 drop-shadow-md">#{order.id}</span>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${isOut ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-brand-500/10 text-brand-400 border-brand-500/20'}`}>
                                {isOut ? <Navigation size={10} className="animate-pulse" /> : <ShoppingBag size={10} />}
                                {isOut ? 'On The Way' : 'Ready to Collect'}
                            </div>
                        </div>
                        <div className="text-right bg-stone-950 p-4 rounded-3xl border border-white/5 shadow-inner">
                            <span className="text-[9px] text-stone-500 uppercase font-black tracking-[0.2em] block mb-1">To Collect</span>
                            <span className="text-gold-400 text-2xl font-black tracking-tighter block">₹{order.total}</span>
                        </div>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-6">
                        
                        {/* Customer Logic Block */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-stone-950/50 p-4 rounded-3xl border border-white/5 flex-wrap sm:flex-nowrap">
                                <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center text-stone-400 shrink-0 border border-white/5"><User size={20} /></div>
                                <div className="flex-1 min-w-0 pr-4 border-r border-white/5">
                                    <p className="text-stone-500 text-[9px] uppercase font-black tracking-[0.2em] mb-1">Recipient</p>
                                    <p className="text-white font-bold text-lg truncate tracking-tight">{order.customerName}</p>
                                </div>
                                <button onClick={() => handleCall(order.contactNumber)} className="w-12 h-12 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-2xl transition-all flex items-center justify-center shrink-0">
                                    <PhoneCall size={20} />
                                </button>
                            </div>

                            {order.address && (
                                <div className="flex items-start gap-4 p-4 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-blue-500/20 animate-pulse"></div>
                                        <MapPin size={20} className="relative z-10" />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="text-blue-400/60 text-[9px] uppercase font-black tracking-[0.2em] mb-1">Drop Location</p>
                                        <p className="text-stone-300 text-sm leading-relaxed">{order.address}</p>
                                    </div>
                                    <button onClick={() => handleDirections(order.address)} className="h-16 w-16 bg-blue-500 text-white hover:bg-blue-400 rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex flex-col items-center justify-center gap-1 shrink-0 active:scale-95">
                                        <Navigation size={20} />
                                        <span className="text-[8px] font-black uppercase">GO</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Order Items Small preview */}
                        <div className="border border-white/5 rounded-[2rem] p-5 bg-white/[0.02]">
                           {order.items.slice(0,3).map((it: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-start text-sm text-stone-300 mb-2 last:mb-0">
                                    <div className="flex gap-3 items-start">
                                       <span className="bg-stone-800 text-white font-black text-xs px-2 py-0.5 rounded-md shrink-0 border border-white/10">{it.quantity}</span> 
                                       <span className="font-bold tracking-tight">{it.name}</span>
                                    </div>
                                </div>
                            ))}
                            {order.items.length > 3 && <div className="text-[10px] uppercase font-black tracking-widest text-stone-500 mt-3 pt-3 border-t border-white/5">+ {order.items.length - 3} more items</div>}
                        </div>

                        {/* Action Area */}
                        {!isOut ? (
                            <button 
                                onClick={() => onUpdateOrderStatus(order.id, 'out_for_delivery')} 
                                className="w-full h-16 bg-brand-500 hover:bg-brand-400 text-stone-950 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] active:scale-95 group"
                            > 
                                Start Delivery <ArrowRight className="group-hover:translate-x-2 transition-transform" /> 
                            </button>
                        ) : (
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <p className="text-center text-[10px] text-stone-400 uppercase tracking-widest font-black">Select Collection Method</p>
                                <div className="grid grid-cols-2 gap-4 bg-stone-950 p-2 rounded-3xl border border-white/5">
                                    <button 
                                        onClick={() => setPaymentMethods(p => ({...p, [order.id]: 'Cash'}))}
                                        className={`py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${method === 'Cash' ? 'bg-white text-stone-950' : 'bg-transparent text-stone-500 hover:text-white'}`}
                                    >💵 Cash</button>
                                    <button 
                                        onClick={() => setPaymentMethods(p => ({...p, [order.id]: 'UPI'}))}
                                        className={`py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${method === 'UPI' ? 'bg-purple-500 text-white shadow-purple-500/20' : 'bg-transparent text-stone-500 hover:text-white'}`}
                                    >📱 UPI QR</button>
                                </div>
                                
                                {method === 'UPI' && (
                                    <div className="bg-white p-6 rounded-[3rem] flex flex-col items-center justify-center space-y-4 mx-auto w-full max-w-[280px] shadow-2xl border-8 border-stone-950 relative overflow-hidden animate-fade-in">
                                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                                        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest text-center mt-2">To Collect exactly</p>
                                        <p className="text-stone-950 font-black text-3xl font-mono tracking-tighter text-center">₹{order.total}</p>
                                        <div className="w-48 h-48 bg-white relative rounded-2xl overflow-hidden border border-stone-200">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${deliveryUpiId || '8301032794@ybl'}&pn=Chillies&am=${order.total}&cu=INR`)}`} 
                                                alt="UPI QR Code" 
                                                className="w-full h-full object-contain p-2"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={() => onUpdateOrderStatus(order.id, 'delivered', method)} 
                                    className="w-full h-16 bg-green-500 hover:bg-green-400 text-stone-950 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] active:scale-95 hover:shadow-[0_10px_40px_rgba(34,197,94,0.5)] mt-4"
                                > 
                                    <Check strokeWidth={3} size={20} /> Handed Over
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )})}
        </div>
      </main>
    </div>
  );
};

export default DeliveryPanel;
