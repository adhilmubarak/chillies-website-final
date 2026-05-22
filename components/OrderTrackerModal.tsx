
import React, { useState, useEffect } from 'react';
import { X, Search, Clock, CheckCircle, XCircle, ShoppingBag, Bike, Store, Flame, User, Star, Navigation, MapPin, AlertCircle, MessageSquare, Send } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { Order } from '../types';
import SafeImage from './SafeImage';
import { MapContainer, TileLayer, Marker, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet icons need to be handled carefully in React
const getRiderIcon = () => {
    if (typeof L === 'undefined') return null;
    return new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        className: 'drop-shadow-xl saturate-200'
    });
};

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [orderMessages, setOrderMessages] = useState<any[]>([]);

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
        setOrderId(''); // Reset input if opened empty
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

  // Early return removed from here and moved to JSX level to prevent Hook mismatch error #310

  const fetchOrderDetails = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setLoading(true);
    setError('');
    
    // Sanitize ID: Remove # and trim whitespace
    const targetId = idToFetch.trim().replace(/^#/, '').toUpperCase();
    
    try {
        // 1. Try local search first for speed
        let found = orders.find(o => o.id === targetId);
        
        // 2. Fallback to direct Firestore query for reliability
        if (!found) {
            const q = query(collection(db, 'orders'), where("id", "==", targetId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                found = { ...snap.docs[0].data(), firestoreId: snap.docs[0].id } as Order;
            }
        }
        
        if (!found) {
            setError(`Order #${targetId} not found. Please check the ID.`);
            setFoundOrder(null);
        } else {
            setFoundOrder(found);
            setOrderId(targetId); // Normalize the input field
            
            // Save to recent orders
            try {
                let savedIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
                if (!savedIds.includes(targetId)) {
                    savedIds.push(targetId);
                    if (savedIds.length > 10) savedIds = savedIds.slice(-10);
                    localStorage.setItem('myOrders', JSON.stringify(savedIds));
                    // Update the visual history list immediately
                    const history = orders.filter(o => savedIds.includes(o.id)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    setMyHistory(history);
                }
            } catch(e) {}
        }
    } catch (err) {
        console.error("Search error:", err);
        setError("Search failed. Check your internet connection.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!foundOrder?.id) return;
    const q = query(collection(db, 'orders'), where("id", "==", foundOrder.id));
    const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
            const data = snap.docs[0].data() as Order;
            setFoundOrder(data);
            setOrderMessages((data as any).messages || []);
        }
    });
    return () => unsub();
  }, [foundOrder?.id]);

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !foundOrder?.id) return;
    const q = query(collection(db, 'orders'), where("id", "==", foundOrder.id));
    const snap = await getDocs(q);
    if (!snap.empty) {
        const orderDoc = snap.docs[0];
        const messages = orderDoc.data().messages || [];
        await updateDoc(orderDoc.ref, {
            messages: [...messages, {
                text: chatMessage,
                sender: 'customer',
                timestamp: Date.now()
            }]
        });
        setChatMessage('');
    }
  };

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchOrderDetails(orderId);
  };

  const handleRatingSubmit = async (rating: number) => {
    if (!foundOrder || foundOrder.status !== 'delivered') return;
    setIsSubmittingRating(true);
    try {
       if (foundOrder.firestoreId) {
         await updateDoc(doc(db, 'orders', foundOrder.firestoreId), { deliveryRating: rating });
       } else {
         const q = query(collection(db, 'orders'), where("id", "==", foundOrder.id));
         const snap = await getDocs(q);
         snap.forEach(d => updateDoc(d.ref, { deliveryRating: rating }));
       }
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

  const renderKitchenVisual = (status: Order['status'], type: Order['type']) => {
    let content = null;

    switch (status) {
      case 'pending':
        content = (
          <div className="flex flex-col items-center py-6 text-center">
            {/* Animated Receipt Printer Container */}
            <div className="relative w-36 h-28 flex flex-col items-center justify-end bg-stone-900/60 rounded-2xl border border-white/5 shadow-inner overflow-hidden p-2">
              {/* Receipt Slot */}
              <div className="absolute top-4 w-24 h-1.5 bg-stone-950 rounded-full border-t border-white/10 shadow-inner"></div>
              {/* Receipt Paper */}
              <div className="w-18 bg-white text-stone-950 px-2 py-3 rounded-b shadow-md flex flex-col gap-1 items-center animate-print-receipt relative z-10 select-none">
                <div className="w-12 h-1 bg-stone-300 rounded"></div>
                <div className="w-8 h-1 bg-stone-300 rounded"></div>
                <div className="w-10 h-1 bg-stone-300 rounded"></div>
                <Clock size={12} className="text-gold-500 mt-1 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/0 via-gold-500/5 to-gold-500/10 pointer-events-none animate-scan"></div>
            </div>
            
            <h4 className="text-white font-serif text-base mt-4 font-semibold tracking-wide">Ticket Received</h4>
            <p className="text-stone-400 text-xs px-6 mt-1.5 leading-relaxed max-w-xs">
              Your order is in queue. The kitchen staff is preparing to stamp and start cooking.
            </p>
          </div>
        );
        break;

      case 'preparing':
        content = (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="relative w-44 h-28 flex items-center justify-center">
              {/* Stove Flames */}
              <div className="absolute bottom-2 flex gap-1 justify-center items-end z-0">
                <div className="w-3 h-8 bg-orange-500 rounded-full animate-flicker-1 origin-bottom"></div>
                <div className="w-4 h-10 bg-yellow-500 rounded-full animate-flicker-2 origin-bottom"></div>
                <div className="w-3 h-8 bg-red-600 rounded-full animate-flicker-1 origin-bottom"></div>
                <div className="w-4 h-9 bg-orange-500 rounded-full animate-flicker-2 origin-bottom"></div>
              </div>

              {/* Wok/Pan cooking */}
              <div className="relative w-28 h-16 bg-stone-950 rounded-b-3xl border-x border-b border-stone-800 shadow-2xl flex items-center justify-center animate-wok-toss z-10">
                {/* Wok Handle */}
                <div className="absolute -left-6 top-1 w-6 h-2 bg-stone-800 rounded-l-full origin-right rotate-12"></div>
                <div className="absolute -right-6 top-1 w-6 h-2 bg-stone-800 rounded-r-full origin-left -rotate-12"></div>
                {/* Food contents */}
                <div className="absolute top-1 flex gap-1">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>

              {/* Cutting Board / Knife */}
              <div className="absolute -left-10 top-0 w-16 h-12 flex flex-col items-center justify-end z-20">
                <div className="w-14 h-2 bg-amber-800 rounded shadow-md"></div>
                {/* Knife */}
                <div className="absolute -top-3 w-10 h-6 border-b-2 border-stone-400 border-r-2 rounded-br animate-chop origin-bottom-right">
                  <div className="w-4 h-1 bg-stone-700 absolute -left-4 top-4 rounded-l"></div>
                </div>
              </div>

              {/* Floating Steam */}
              <div className="absolute top-2 w-full flex justify-center gap-4 pointer-events-none z-20">
                <div className="w-2 h-6 bg-white/20 rounded-full blur-xs animate-steam-1"></div>
                <div className="w-3 h-8 bg-white/20 rounded-full blur-xs animate-steam-2"></div>
                <div className="w-2 h-6 bg-white/20 rounded-full blur-xs animate-steam-3"></div>
              </div>
            </div>

            <h4 className="text-white font-serif text-base mt-4 font-semibold tracking-wide flex items-center gap-1.5 justify-center">
              Sizzling in the Kitchen <Flame size={16} className="text-orange-500 animate-pulse" />
            </h4>
            <p className="text-stone-400 text-xs px-6 mt-1.5 leading-relaxed max-w-xs">
              Our culinary chefs are pan-searing and plating your gourmet recipe to absolute perfection!
            </p>
          </div>
        );
        break;

      case 'ready':
        content = (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="relative w-40 h-28 flex items-center justify-center">
              {/* Cloche glowing aura */}
              <div className="absolute w-28 h-28 rounded-full bg-gold-500/10 blur-xl animate-aura-pulse"></div>

              {/* Cloche / Plate Cover */}
              <div className="relative w-28 h-20 flex flex-col items-center justify-end z-10">
                {/* Platter Plate */}
                <div className="w-32 h-2.5 bg-stone-750 border border-white/10 rounded-full shadow-lg z-0"></div>
                
                {/* Dome Cloche */}
                <div className="absolute bottom-2.5 w-24 h-14 bg-gradient-to-b from-amber-400/90 to-amber-600/95 rounded-t-full shadow-[0_8px_20px_rgba(212,175,55,0.3)] flex flex-col items-center justify-start border-t border-white/20 animate-cloche-lift origin-bottom">
                  {/* Cloche Knob */}
                  <div className="w-4 h-4 bg-amber-500 border border-white/20 rounded-full -mt-2 shadow"></div>
                </div>

                {/* Steam Particles */}
                <div className="absolute top-2 w-full flex justify-center gap-3 pointer-events-none z-20">
                  <div className="w-2 h-5 bg-gold-500/30 rounded-full blur-xs animate-steam-1"></div>
                  <div className="w-2 h-5 bg-gold-500/30 rounded-full blur-xs animate-steam-2"></div>
                </div>
              </div>
            </div>

            <h4 className="text-white font-serif text-base mt-4 font-semibold tracking-wide">
              {type === 'delivery' ? 'Waiting for Courier' : 'Plated & Ready for Pickup!'}
            </h4>
            <p className="text-stone-400 text-xs px-6 mt-1.5 leading-relaxed max-w-xs">
              {type === 'delivery' 
                ? 'Your order is hot-packed and waiting at the counter for our delivery rider.' 
                : 'Your fresh gourmet package is waiting at our service counter. Come grab it!'}
            </p>
          </div>
        );
        break;

      case 'out_for_delivery':
        content = (
          <div className="flex flex-col items-center py-6 text-center">
            {/* Animated Road & Scooter */}
            <div className="relative w-64 h-28 flex flex-col justify-end items-center overflow-hidden bg-stone-950/40 rounded-2xl border border-white/5 shadow-inner p-2">
              {/* Horizontally scrolling speed lines representing high speed */}
              <div className="absolute bottom-6 w-full h-10 pointer-events-none z-0">
                <div className="absolute top-2 left-0 w-8 h-0.5 bg-purple-500/30 rounded animate-speed-lines-1"></div>
                <div className="absolute top-5 left-0 w-12 h-0.5 bg-purple-500/30 rounded animate-speed-lines-2"></div>
                <div className="absolute top-8 left-0 w-10 h-0.5 bg-purple-500/30 rounded animate-speed-lines-3"></div>
              </div>

              {/* Delivery Rider Scooter */}
              <div className="relative z-10 flex flex-col items-center animate-drive">
                <Bike className="text-purple-500 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]" size={48} />
                {/* Small dust particles behind the scooter */}
                <div className="absolute bottom-1 -left-4 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-stone-600 rounded-full animate-ping"></div>
                  <div className="w-1 h-1 bg-stone-700 rounded-full animate-ping" style={{ animationDelay: '0.1s' }}></div>
                </div>
              </div>

              {/* Road Line */}
              <div className="w-full h-1 bg-stone-800 rounded-full mt-2 relative z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
              </div>
            </div>

            <h4 className="text-white font-serif text-base mt-4 font-semibold tracking-wide flex items-center gap-1.5 justify-center">
              Out for Delivery <Bike size={16} className="text-purple-500 animate-bounce" />
            </h4>
            <p className="text-stone-400 text-xs px-6 mt-1.5 leading-relaxed max-w-xs">
              Our high-speed delivery courier is racing across the streets straight to your doorstep!
            </p>
          </div>
        );
        break;

      case 'delivered':
        content = (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="relative w-40 h-28 flex items-center justify-center">
              {/* Confetti Explosion */}
              <div className="absolute w-20 h-20 rounded-full bg-green-500/10 blur-xl animate-aura-pulse"></div>

              {/* Floating Confetti dots */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full absolute top-6 left-6 animate-ping" style={{ '--tw-x': '-20px', '--tw-y': '-20px' } as React.CSSProperties}></div>
                <div className="w-2 h-2 bg-red-400 rounded-full absolute top-4 right-10 animate-ping" style={{ '--tw-x': '20px', '--tw-y': '-15px', animationDelay: '0.3s' } as React.CSSProperties}></div>
                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full absolute bottom-8 left-8 animate-ping" style={{ '--tw-x': '-15px', '--tw-y': '20px', animationDelay: '0.6s' } as React.CSSProperties}></div>
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full absolute bottom-6 right-8 animate-ping" style={{ '--tw-x': '15px', '--tw-y': '15px', animationDelay: '0.9s' } as React.CSSProperties}></div>
              </div>

              {/* Celebrating Check Circle */}
              <div className="w-18 h-18 bg-green-500 rounded-full flex items-center justify-center text-stone-950 shadow-[0_0_25px_rgba(34,197,94,0.4)] scale-110 border-4 border-stone-900 z-10">
                <CheckCircle size={36} className="text-stone-950" />
              </div>
            </div>

            <h4 className="text-white font-serif text-base mt-4 font-semibold tracking-wide">Enjoy Your Meal!</h4>
            <p className="text-stone-400 text-xs px-6 mt-1.5 leading-relaxed max-w-xs">
              Order successfully received! Savor the fresh flavors of Chillies. Thank you for dining with us!
            </p>
          </div>
        );
        break;

      default:
        content = null;
    }

    if (!content) return null;

    return (
      <div className="mb-6 bg-stone-950/60 border border-white/5 rounded-2xl shadow-xl p-4 relative z-10 overflow-hidden">
        {/* Style tag injected locally inside component */}
        <style>{`
          @keyframes printReceipt {
            0% { height: 0; opacity: 0; transform: translateY(-10px); }
            100% { height: 50px; opacity: 1; transform: translateY(0); }
          }
          @keyframes scan {
            0%, 100% { transform: translateY(-3px) scale(1); }
            50% { transform: translateY(3px) scale(1.04); }
          }
          @keyframes flicker {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.2) translateY(-2px); opacity: 1; filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.7)); }
          }
          @keyframes wokToss {
            0%, 100% { transform: rotate(-5deg) translateY(0); }
            50% { transform: rotate(5deg) translateY(-8px); }
          }
          @keyframes steamRise {
            0% { transform: translateY(0) scale(0.8); opacity: 0; }
            30% { opacity: 0.6; }
            100% { transform: translateY(-24px) scale(1.3); opacity: 0; }
          }
          @keyframes chop {
            0%, 100% { transform: rotate(0deg) translateY(0); }
            50% { transform: rotate(-28deg) translateY(-6px) translateX(-2px); }
          }
          @keyframes clocheLift {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-14px) rotate(-10deg); }
          }
          @keyframes drive {
            0%, 100% { transform: translateY(0) scaleX(1); }
            50% { transform: translateY(-3px) scaleX(1.02); }
          }
          @keyframes speedLines {
            0% { transform: translateX(120%); opacity: 0; }
            30% { opacity: 0.4; }
            70% { opacity: 0.4; }
            100% { transform: translateX(-120%); opacity: 0; }
          }
          @keyframes auraPulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.05); opacity: 0.5; }
          }
          .animate-print-receipt { animation: printReceipt 1.2s ease-out forwards; }
          .animate-scan { animation: scan 2s ease-in-out infinite; }
          .animate-flicker-1 { animation: flicker 0.6s infinite alternate ease-in-out; }
          .animate-flicker-2 { animation: flicker 0.9s infinite alternate ease-in-out 0.2s; }
          .animate-wok-toss { animation: wokToss 1.2s infinite ease-in-out; }
          .animate-chop { animation: chop 0.5s infinite ease-in-out; }
          .animate-cloche-lift { animation: clocheLift 1.8s infinite ease-in-out; }
          .animate-drive { animation: drive 0.4s infinite ease-in-out; }
          .animate-speed-lines-1 { animation: speedLines 1.5s infinite linear; }
          .animate-speed-lines-2 { animation: speedLines 1.5s infinite linear 0.5s; }
          .animate-speed-lines-3 { animation: speedLines 1.5s infinite linear 1s; }
          .animate-aura-pulse { animation: auraPulse 2.5s infinite ease-in-out; }
          .animate-steam-1 { animation: steamRise 1.8s infinite linear; }
          .animate-steam-2 { animation: steamRise 1.8s infinite linear 0.6s; }
          .animate-steam-3 { animation: steamRise 1.8s infinite linear 1.2s; }
        `}</style>
        {content}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95" onClick={onClose}>
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
      <div className="bg-stone-900 border border-gold-500/50 rounded-3xl w-full max-w-md shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent z-20"></div>
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-stone-950 relative z-10">
            <div>
              <h2 className="font-serif text-xl text-white">Order Command Center</h2>
              <p className="text-stone-500 text-[9px] uppercase tracking-widest font-black mt-1">Live Status Tracking</p>
            </div>
            <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors p-2 bg-stone-900 rounded-full border border-white/5"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto scrollbar-hide flex-1">
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
                            <div key={histOrder.id} onClick={() => fetchOrderDetails(histOrder.id)} className="bg-stone-950 border border-white/10 w-full py-3 md:py-4 rounded-2xl shadow-inner group-hover:border-gold-500/30 transition-colors duration-500 px-4 flex justify-between items-center group">
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
                    
                    {renderKitchenVisual(foundOrder.status, foundOrder.type)}
                    
                    <div className="mb-6 flex justify-center">
                        <a 
                            href={`/complaints?oid=${foundOrder.id}`} 
                            className="text-[10px] text-stone-500 hover:text-gold-500 transition-colors uppercase font-black tracking-widest flex items-center gap-2 border-b border-stone-800 pb-1"
                        >
                            <AlertCircle size={12} /> Report a Problem with this Order
                        </a>
                    </div>
                    
                    <div className="bg-stone-950 border-b border-white/5 py-4 shadow-2xl rounded-xl border border-white/5 p-4 space-y-3">
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

        {/* Live Chat Overlay */}
        {foundOrder && (
            <div className={`fixed bottom-6 right-6 z-[2000] flex flex-col items-end gap-4 transition-all duration-500 ${isChatOpen ? 'w-full max-w-sm' : 'w-fit'}`}>
                {isChatOpen && (
                    <div className="w-full bg-stone-900 border border-stone-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[500px] animate-fade-in">
                        <div className="p-5 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center text-brand-500"><MessageSquare size={16} /></div>
                                <span className="text-white font-bold text-sm tracking-tight">Support Chat</span>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="text-stone-500 hover:text-white transition-colors"><X size={18} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-hide">
                            {orderMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                    <MessageSquare size={32} className="mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Ask us anything about your order!</p>
                                </div>
                            ) : (
                                orderMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${msg.sender === 'customer' ? 'bg-brand-500 text-stone-950 font-bold rounded-tr-none shadow-lg' : 'bg-stone-800 text-stone-200 rounded-tl-none'}`}>
                                            {msg.text}
                                            <div className="text-[8px] mt-1 opacity-50">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-stone-950 border-t border-stone-800 flex gap-2">
                            <input 
                                type="text" 
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                                placeholder="Type here..."
                                className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-2 text-white text-xs focus:border-brand-500 outline-none"
                            />
                            <button onClick={sendChatMessage} className="p-3 bg-brand-500 text-stone-950 rounded-xl hover:bg-brand-400 transition-all shadow-lg"><Send size={16} /></button>
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="w-16 h-16 bg-brand-500 text-stone-950 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative group"
                >
                    <MessageSquare size={28} className={isChatOpen ? 'hidden' : 'block group-hover:rotate-12 transition-transform'} />
                    <X size={28} className={isChatOpen ? 'block' : 'hidden'} />
                    {!isChatOpen && orderMessages.some(m => m.sender === 'admin') && (
                         <div className="absolute top-0 right-0 w-5 h-5 bg-blue-500 border-4 border-stone-950 rounded-full animate-bounce"></div>
                    )}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackerModal;
