import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, Lock, LogOut, ShoppingBag, MapPin, 
  Send, Check, PhoneCall, User, Navigation, ArrowRight, BellRing, Volume2, Loader2,
  Wallet, CheckCircle
} from 'lucide-react';
import { Order } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, addDoc, setDoc } from 'firebase/firestore';

const renderAddressWithLinks = (address: string) => {
    if (!address) return null;
    const parts = address.split(/(https?:\/\/[^\s,)]+)/g);
    return parts.map((part, i) => 
        part.match(/^https?:\/\//) ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-bold" onClick={(e) => e.stopPropagation()}>{part}</a>
        ) : (
            <span key={i}>{part}</span>
        )
    );
};

interface DeliveryPanelProps {
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: Order['status'], paymentMethod?: string, firestoreId?: string) => Promise<void>;
  onUpdateRiderLocation: (lat: number, lng: number, riderId: string, riderName: string) => Promise<void>;
  deliveryUpiId?: string;
}

const DeliveryPanel: React.FC<DeliveryPanelProps> = ({
  orders, onUpdateOrderStatus, onUpdateRiderLocation, deliveryUpiId
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [loggedInRider, setLoggedInRider] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, 'Cash' | 'UPI'>>({});

  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [isPushRegistered, setIsPushRegistered] = useState(false);
  
  const [activeAlert, setActiveAlert] = useState<{ id: string, orderId: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const deliveryOrders = useMemo(() => {
    return orders.filter(order => 
        order.type === 'delivery' && 
        ['ready', 'out_for_delivery'].includes(order.status) &&
        order.assignedTo === loggedInRider?.id
    );
  }, [orders, loggedInRider]);

  const riderStats = useMemo(() => {
    if (!loggedInRider?.id) return { totalDelivered: 0, totalEarned: 0 };
    
    const deliveredOrders = orders.filter(order => 
      order.type === 'delivery' &&
      order.status === 'delivered' &&
      order.assignedTo === loggedInRider.id
    );

    const totalDelivered = deliveredOrders.length;
    const totalEarned = deliveredOrders.reduce((sum, order) => sum + (order.deliveryCharge || 0), 0);

    return { totalDelivered, totalEarned };
  }, [orders, loggedInRider]);
  
  // Authentication Persistence
  useEffect(() => {
    const saved = localStorage.getItem('chillies_rider_profile');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            setLoggedInRider(parsed);
            setIsAuthenticated(true);
            
            if (localStorage.getItem(`chillies_rider_push_registered_${parsed.id}`) === 'true') {
                setIsPushRegistered(true);
            }
        } catch(e) {
            localStorage.removeItem('chillies_rider_profile');
        }
    }
  }, []);

  const initializeRiderTracking = async (riderId: string, riderName: string) => {
    try {
        const docRef = doc(db, 'tracking', riderId);
        await setDoc(docRef, {
            lat: 9.4981,
            lng: 76.3388,
            name: riderName,
            timestamp: Date.now()
        });
    } catch (e) {
        console.error("Failed to initialize rider tracking:", e);
    }
  };

  // Real-time Rider Location Tracking
  useEffect(() => {
    if (!isAuthenticated || !loggedInRider) return;
    
    // Initialize tracking with shop default immediately to guarantee document exists
    initializeRiderTracking(loggedInRider.id, loggedInRider.name);
    
    let watchId: number;
    if ("geolocation" in navigator) {
        // 1. Get current position immediately to override shop default if location is available
        navigator.geolocation.getCurrentPosition((position) => {
            onUpdateRiderLocation(
                position.coords.latitude, 
                position.coords.longitude,
                loggedInRider.id,
                loggedInRider.name
            );
        }, (error) => {
            console.error("Initial geolocation error:", error);
        });

        // 2. Watch position for active movement updates
        watchId = navigator.geolocation.watchPosition((position) => {
            onUpdateRiderLocation(
                position.coords.latitude, 
                position.coords.longitude,
                loggedInRider.id,
                loggedInRider.name
            );
        }, (error) => {
             console.error("Location tracking error:", error);
        }, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    }
    
    return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isAuthenticated, onUpdateRiderLocation, loggedInRider]);

  // Register Device for FCM push notifications
  const registerPushAlerts = async () => {
      if (!loggedInRider) return;
      setIsRegisteringPush(true);
      try {
          const { Capacitor } = await import('@capacitor/core');
          const isNative = Capacitor.isNativePlatform();
          
          if (isNative) {
              const { PushNotifications } = await import('@capacitor/push-notifications');
              const res = await PushNotifications.requestPermissions();
              if (res.receive === 'granted') {
                  PushNotifications.addListener('registration', async (token) => {
                      const riderRef = doc(db, 'delivery_boys', loggedInRider.id);
                      const snap = await getDocs(query(collection(db, 'delivery_boys')));
                      const myDoc = snap.docs.find(d => d.id === loggedInRider.id);
                      if (myDoc) {
                          const currentTokens = myDoc.data().tokens || [];
                          const updated = Array.from(new Set([...currentTokens, token.value]));
                          await updateDoc(riderRef, { tokens: updated });
                          localStorage.setItem(`chillies_rider_push_registered_${loggedInRider.id}`, 'true');
                          setIsPushRegistered(true);
                          alert('Device registered for native push alerts!');
                      }
                  });
                  await PushNotifications.register();
              } else {
                  alert('Notification permission denied.');
              }
          } else {
              // Web push
              if (typeof window !== 'undefined' && 'Notification' in window) {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                      const { messaging } = await import('../firebase');
                      if (messaging) {
                          const { getToken } = await import('firebase/messaging');
                          const VAPID_KEY = 'BHcAqM5__bhlDGUtAjxBAlLfTxQCq9UxfSi0bCalkbMorZVrRZJ-Xq7fuD9RKjMQkBnAWzJemeja6sZDd8GQRCo';
                          const registration = await navigator.serviceWorker.ready;
                          const token = await getToken(messaging, { 
                              vapidKey: VAPID_KEY,
                              serviceWorkerRegistration: registration
                          });
                          
                          const riderRef = doc(db, 'delivery_boys', loggedInRider.id);
                          const snap = await getDocs(query(collection(db, 'delivery_boys')));
                          const myDoc = snap.docs.find(d => d.id === loggedInRider.id);
                          if (myDoc) {
                              const currentTokens = myDoc.data().tokens || [];
                              const updated = Array.from(new Set([...currentTokens, token]));
                              await updateDoc(riderRef, { tokens: updated });
                              localStorage.setItem(`chillies_rider_push_registered_${loggedInRider.id}`, 'true');
                              setIsPushRegistered(true);
                              alert('Browser registered for push alerts!');
                          }
                      } else {
                          alert('Messaging service unavailable.');
                      }
                  } else {
                      alert('Notification permission denied.');
                  }
              }
          }
      } catch (err: any) {
          console.error("Failed to register push:", err);
          alert("Registration failed: " + err.message);
      } finally {
          setIsRegisteringPush(false);
      }
  };

  // Foreground High Volume Sound Alarm Listener
  useEffect(() => {
      if (!isAuthenticated || !loggedInRider) return;

      const q = query(
          collection(db, 'delivery_notifications'),
          where('deliveryBoyId', '==', loggedInRider.id)
      );
      
      const sessionStart = Date.now();

      const unsubscribe = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                  const data = change.doc.data();
                  // Only alert for notifications created after session start
                  if (data.createdAt && data.createdAt > sessionStart - 5000) {
                      setActiveAlert({ id: change.doc.id, orderId: data.orderId });
                      
                      if (!audioRef.current) {
                          audioRef.current = new Audio('/notification.mp3');
                          audioRef.current.loop = true;
                      }
                      audioRef.current.volume = 1.0;
                      audioRef.current.play().catch(err => {
                          console.warn("Autoplay blocked. Press anywhere on screen to enable alarm sounds.", err);
                      });
                  }
              }
          });
      });

      return () => {
          unsubscribe();
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
      };
  }, [isAuthenticated, loggedInRider]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);
    
    const cleanPhone = phoneInput.trim().replace(/\D/g, '');
    try {
        const q = query(collection(db, 'delivery_boys'), where("phone", "==", cleanPhone));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const docData = snap.docs[0].data();
            const docId = snap.docs[0].id;
            if (docData.password === passwordInput) {
                const riderProfile = { id: docId, name: docData.name, phone: docData.phone };
                localStorage.setItem('chillies_rider_profile', JSON.stringify(riderProfile));
                setLoggedInRider(riderProfile);
                setIsAuthenticated(true);
                setPhoneInput('');
                setPasswordInput('');
                
                if (localStorage.getItem(`chillies_rider_push_registered_${docId}`) === 'true') {
                    setIsPushRegistered(true);
                } else {
                    setIsPushRegistered(false);
                }
                return;
            }
        }
        
        // Fallback for legacy admin
        if (phoneInput === 'admin' && passwordInput === 'admin123') {
            const adminProfile = { id: 'admin', name: 'Admin Rider', phone: 'admin' };
            localStorage.setItem('chillies_rider_profile', JSON.stringify(adminProfile));
            setLoggedInRider(adminProfile);
            setIsAuthenticated(true);
            setPhoneInput('');
            setPasswordInput('');
            return;
        }

        setAuthError(true);
    } catch(err) {
        console.error("Login error:", err);
        setAuthError(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chillies_rider_profile');
    setLoggedInRider(null);
    setIsAuthenticated(false);
  };

  const handleCall = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`tel:${cleanPhone}`, '_self');
  };

  const getDirectionsUrl = (address?: string) => {
    if (!address) return '#';
    const cleaned = address.replace(/\s+/g, ' ').trim();
    const urlMatch = cleaned.match(/https?:\/\/[^\s,)]+/);
    return urlMatch ? urlMatch[0] : `https://www.google.com/maps?q=${encodeURIComponent(cleaned)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950 p-4 font-sans text-stone-200">
        <div className="w-full max-w-md bg-stone-900 border border-brand-500/20 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.08)_0%,_transparent_70%)] rounded-full pointer-events-none"></div>
          <div className="w-16 h-16 bg-stone-950 border border-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Lock className="text-brand-500" />
          </div>
          <h2 className="text-3xl font-serif text-stone-50 mb-2">Delivery Portal</h2>
          <p className="text-stone-500 text-xs uppercase tracking-widest font-bold mb-8">Chillies Rider Access</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1 text-left">
                <label className="text-[9px] text-stone-500 uppercase tracking-wider block font-bold">Registered Phone</label>
                <input 
                  type="tel" 
                  placeholder="Enter phone number" 
                  value={phoneInput} 
                  onChange={e => setPhoneInput(e.target.value)} 
                  className={`w-full bg-stone-950 border rounded-xl p-4 text-center text-stone-50 focus:outline-none focus:border-brand-500 transition-all font-mono tracking-wider ${authError ? 'border-red-500' : 'border-stone-850'}`}
                  autoFocus 
                  required
                />
            </div>
            <div className="space-y-1 text-left">
                <label className="text-[9px] text-stone-500 uppercase tracking-wider block font-bold">Passkey / Password</label>
                <input 
                  type="password" 
                  placeholder="Enter passkey" 
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)} 
                  className={`w-full bg-stone-950 border rounded-xl p-4 text-center text-stone-50 focus:outline-none focus:border-brand-500 transition-all font-mono tracking-wider ${authError ? 'border-red-500' : 'border-stone-850'}`}
                  required
                />
            </div>
            {authError && <p className="text-red-500 text-xs font-bold uppercase tracking-wide animate-pulse">Invalid Credentials</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-stone-950 font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-brand-500/10 hover:shadow-brand-500/30 transition-all hover:scale-[1.01] active:scale-95 mt-6">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-stone-950 flex flex-col font-sans text-stone-200">
      <header className="h-20 border-b border-stone-800 px-6 flex items-center justify-between shrink-0 bg-stone-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white"><ShoppingBag size={20} /></div>
              <div>
                  <h2 className="text-xl font-serif text-stone-50 leading-none">Deliveries</h2>
                  <p className="text-[10px] text-stone-500 leading-none uppercase mt-1">Rider: <span className="text-brand-500 font-bold">{loggedInRider?.name || 'Staff'}</span></p>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <button 
                  onClick={registerPushAlerts}
                  disabled={isPushRegistered || isRegisteringPush}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      isPushRegistered 
                          ? 'bg-green-500/10 text-green-500 border border-green-500/25 cursor-default' 
                          : isRegisteringPush 
                              ? 'bg-stone-900 border border-stone-800 text-stone-500 cursor-wait' 
                              : 'bg-brand-500 text-stone-950 hover:bg-brand-400 border border-brand-500 shadow-md active:scale-95'
                  }`}
              >
                  {isRegisteringPush ? (
                      <Loader2 size={12} className="animate-spin" />
                  ) : (
                      <BellRing size={12} />
                  )}
                  {isPushRegistered ? 'Alerts Enabled 🔊' : 'Enable Alerts'}
              </button>
              <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-red-500 hover:bg-stone-800 transition-colors shadow-inner" title="Logout">
                  <LogOut size={16} />
              </button>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-950">
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 gap-4">
                {/* Delivered Card */}
                <div className="bg-stone-900/40 backdrop-blur-md border border-emerald-500/10 rounded-3xl p-6 flex items-center gap-4 relative overflow-hidden group hover:border-emerald-500/25 transition-all duration-300 shadow-xl">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08)_0%,_transparent_70%)] rounded-full pointer-events-none"></div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
                        <CheckCircle size={22} className="group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Delivered</span>
                        <span className="text-2xl font-serif font-black text-white">{riderStats.totalDelivered}</span>
                    </div>
                </div>

                {/* Total Earned Card */}
                <div className="bg-stone-900/40 backdrop-blur-md border border-purple-500/10 rounded-3xl p-6 flex items-center gap-4 relative overflow-hidden group hover:border-purple-500/25 transition-all duration-300 shadow-xl">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.08)_0%,_transparent_70%)] rounded-full pointer-events-none"></div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-lg">
                        <Wallet size={22} className="group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Total Earned</span>
                        <span className="text-2xl font-serif font-black text-white">₹{riderStats.totalEarned}</span>
                    </div>
                </div>
            </div>

            {deliveryOrders.length === 0 ? (
                <div className="py-32 text-center border-2 border-dashed border-stone-800 rounded-[3rem] bg-stone-900/20">
                    <Check className="mx-auto text-stone-300 mb-6 opacity-20" size={64} />
                    <p className="text-stone-500 uppercase tracking-[0.2em] text-xs font-bold">No active deliveries</p>
                    <p className="text-stone-600 text-[10px] mt-2">You're all caught up! Great job.</p>
                </div>
            ) : deliveryOrders.map(order => {
                const method = paymentMethods[order.id] || 'Cash';
                return (
                <div key={order.firestoreId || order.id} className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
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
                                <a href={`tel:${order.contactNumber?.replace(/\D/g, '')}`} className="p-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all">
                                    <PhoneCall size={18} />
                                </a>
                            </div>

                            {order.address && (
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-stone-950 flex items-center justify-center text-stone-500 shrink-0"><MapPin size={18} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-stone-500 text-[10px] uppercase font-bold tracking-widest mb-0.5">Address</p>
                                        <p className="text-stone-300 text-sm leading-relaxed">{renderAddressWithLinks(order.address)}</p>
                                    </div>
                                    <a 
                                        href={getDirectionsUrl(order.address)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all"
                                    >
                                        <Navigation size={18} />
                                    </a>
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
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setPaymentMethods(p => ({...p, [order.id]: 'Cash'}))}
                                        className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${method === 'Cash' ? 'bg-brand-500 text-white border-brand-500 shadow-lg' : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-white hover:border-stone-700'}`}
                                    >Cash</button>
                                    <button 
                                        onClick={() => setPaymentMethods(p => ({...p, [order.id]: 'UPI'}))}
                                        className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${method === 'UPI' ? 'bg-purple-500 text-white border-purple-500 shadow-lg' : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-white hover:border-stone-700'}`}
                                    >UPI QR</button>
                                </div>
                                
                                {method === 'UPI' && (
                                    <div className="bg-white p-5 rounded-3xl flex flex-col items-center justify-center space-y-3 mx-auto w-fit shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-purple-500/20 animate-fade-in">
                                        <div className="w-48 h-48 bg-white overflow-hidden relative rounded-xl flex items-center justify-center">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${deliveryUpiId || '8301032794@ybl'}&pn=Chillies&am=${order.total}&cu=INR`)}`} 
                                                alt="UPI QR Code" 
                                                className="w-full h-full object-contain"
                                                onLoad={() => console.log("QR Code loaded successfully")}
                                                onError={(e) => {
                                                    console.error("QR Code failed to load");
                                                    e.currentTarget.src = "https://placehold.co/300x300?text=QR+Error";
                                                }}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-purple-600 font-black text-xs uppercase tracking-widest">Scan to Pay ₹{order.total}</p>
                                            <p className="text-stone-400 text-[8px] uppercase tracking-tighter mt-1">{deliveryUpiId || '8301032794@ybl'}</p>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={() => onUpdateOrderStatus(order.id, 'delivered', method, order.firestoreId)} 
                                    className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95"
                                > 
                                    <Check size={18} /> Mark as Delivered 
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )})}
        </div>
      </main>

      {activeAlert && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-950/90 p-4 animate-fade-in">
              <div className="w-full max-w-md bg-stone-900 border-4 border-red-500 rounded-[2.5rem] p-10 text-center shadow-[0_0_80px_rgba(239,68,68,0.5)] relative animate-pulse-slow">
                  <div className="w-24 h-24 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                      <BellRing className="text-red-500 animate-pulse" size={48} />
                  </div>
                  <h2 className="text-3xl font-serif text-white font-bold mb-3 tracking-wide animate-pulse">NEW ORDER ASSIGNED!</h2>
                  <p className="text-stone-300 text-sm mb-2 font-mono">Order ID: #{activeAlert.orderId}</p>
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-8 flex items-center justify-center gap-1.5 animate-pulse">
                      <Volume2 size={14} /> Loud Sound Alert Active
                  </p>
                  
                  <button 
                      onClick={() => {
                          if (audioRef.current) {
                              audioRef.current.pause();
                          }
                          setActiveAlert(null);
                      }} 
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95"
                  >
                      Acknowledge & Dismiss
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default DeliveryPanel;
