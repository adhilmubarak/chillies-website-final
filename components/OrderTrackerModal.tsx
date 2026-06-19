
import React, { useState, useEffect } from 'react';
import { X, Search, Clock, CheckCircle, XCircle, ShoppingBag, Bike, Store, Flame, User, Star, Navigation, MapPin, AlertCircle, MessageSquare, Send, VolumeX } from 'lucide-react';
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

// Procedural Web Audio Synthesizer for premium, self-contained soundscapes
class WebAudioSynth {
  private ctx: AudioContext | null = null;
  private currentNodes: { stop?: () => void }[] = [];
  private isMuted: boolean = true;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {}

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.ctx.state === 'suspended' && !muted) {
      this.ctx.resume();
    }
    if (muted) {
      this.stopAll();
    }
  }

  private stopAll() {
    this.currentNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
      } catch (e) {}
    });
    this.currentNodes = [];
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  playState(status: string) {
    this.init();
    this.stopAll();
    if (this.isMuted || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const ctx = this.ctx;
    const now = ctx.currentTime;

    try {
      if (status === 'pending') {
        // Quiet, high-tech printer scan hum
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(160, now + 1);
        osc.frequency.linearRampToValueAtTime(150, now + 2);
        
        gain.gain.setValueAtTime(0.04, now);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        
        const interval = setInterval(() => {
          if (this.currentNodes.length === 0 || this.isMuted) {
            clearInterval(interval);
            return;
          }
          try {
            const t = ctx.currentTime;
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(160, t + 1);
            osc.frequency.linearRampToValueAtTime(150, t + 2);
          } catch (e) {}
        }, 2000);

        this.currentNodes.push({
          stop: () => {
            clearInterval(interval);
            try { osc.stop(); } catch(e) {}
          }
        });

      } else if (status === 'preparing') {
        // Rich bubbling / sizzling grease cooking sound
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = this.getNoiseBuffer(ctx);
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(3200, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.06, now);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(1.5, now);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.015, now);
        
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        
        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        lfo.start(now);
        noiseSource.start(now);

        const crackleInterval = setInterval(() => {
          if (this.currentNodes.length === 0 || this.isMuted) {
            clearInterval(crackleInterval);
            return;
          }
          try {
            const popOsc = ctx.createOscillator();
            const popGain = ctx.createGain();
            popOsc.type = 'sine';
            popOsc.frequency.setValueAtTime(3500 + Math.random() * 4500, ctx.currentTime);
            
            popGain.gain.setValueAtTime(0.003 + Math.random() * 0.012, ctx.currentTime);
            popGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
            
            popOsc.connect(popGain);
            popGain.connect(ctx.destination);
            popOsc.start();
            popOsc.stop(ctx.currentTime + 0.02);
          } catch(e) {}
        }, 120);

        this.currentNodes.push({
          stop: () => {
            clearInterval(crackleInterval);
            try { noiseSource.stop(); } catch(e) {}
            try { lfo.stop(); } catch(e) {}
          }
        });

      } else if (status === 'ready') {
        // High-end crystal hotel/counter chime ding!
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now); // B5 note
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1975.53, now); // B6 octave harmonic
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.04, now);

        osc1.connect(gain);
        osc2.connect(osc2Gain);
        osc2Gain.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.6);
        osc2.stop(now + 2.6);

        this.currentNodes.push({
          stop: () => {
            try { osc1.stop(); osc2.stop(); } catch(e) {}
          }
        });

      } else if (status === 'out_for_delivery') {
        // Gentle engine cylinder idling / scooter rumble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(58, now); // 58Hz rumble
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, now);

        gain.gain.setValueAtTime(0.1, now);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(8, now);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(6, now);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        lfo.start(now);
        osc.start(now);

        this.currentNodes.push({
          stop: () => {
            try { osc.stop(); } catch(e) {}
            try { lfo.stop(); } catch(e) {}
          }
        });

      } else if (status === 'delivered') {
        // Celebratory major arpeggio chime!
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const playChimeNote = (freq: number, startDelay: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + startDelay);
          
          gain.gain.setValueAtTime(0.06, now + startDelay);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + startDelay);
          osc.stop(now + startDelay + duration + 0.1);
          
          this.currentNodes.push({
            stop: () => {
              try { osc.stop(); } catch(e) {}
            }
          });
        };

        playChimeNote(notes[0], 0, 0.5);
        playChimeNote(notes[1], 0.1, 0.5);
        playChimeNote(notes[2], 0.2, 0.5);
        playChimeNote(notes[3], 0.3, 1.6);
      }
    } catch(e) {
      console.warn("Failed to play synthesized sound:", e);
    }
  }
}

const trackerSynth = new WebAudioSynth();

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
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [activeRiderLocation, setActiveRiderLocation] = useState<{lat: number, lng: number, timestamp: number} | null>(null);

  useEffect(() => {
    if (!foundOrder?.assignedTo || foundOrder.status !== 'out_for_delivery') {
      setActiveRiderLocation(null);
      return;
    }

    const riderTrackingRef = doc(db, 'tracking', foundOrder.assignedTo);
    const unsubscribe = onSnapshot(riderTrackingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setActiveRiderLocation({
          lat: data.lat,
          lng: data.lng,
          timestamp: data.timestamp || Date.now()
        });
      } else {
        setActiveRiderLocation(null);
      }
    }, (err) => {
      console.error("Error listening to rider tracking:", err);
    });

    return () => unsubscribe();
  }, [foundOrder?.assignedTo, foundOrder?.status]);

  useEffect(() => {
    trackerSynth.setMute(!isAudioOn);
    if (foundOrder && isAudioOn) {
      trackerSynth.playState(foundOrder.status);
    } else {
      trackerSynth.setMute(true);
    }
    return () => {
      trackerSynth.setMute(true);
    };
  }, [foundOrder?.status, isAudioOn]);

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
              <div className="w-20 bg-white text-stone-950 px-2 py-3 rounded-b shadow-md flex flex-col gap-1 items-center animate-print-receipt relative z-10 select-none">
                <div className="text-[7px] font-mono font-bold tracking-tighter text-stone-400">CHILLIES KITCHEN</div>
                <div className="w-12 h-0.5 bg-stone-300 rounded"></div>
                <div className="text-[9px] font-mono font-black text-brand-500 my-0.5 tracking-wider">
                  {foundOrder ? foundOrder.id : 'TICKET'}
                </div>
                <div className="w-10 h-0.5 bg-stone-300 rounded"></div>
                <Clock size={10} className="text-gold-500 mt-1 animate-spin" style={{ animationDuration: '6s' }} />
                
                {/* Stamp overlay */}
                <div className="absolute -bottom-1 -right-2 bg-rose-600 text-white border border-rose-500 text-[6px] font-black uppercase tracking-widest px-1 py-0.5 rounded rotate-[-15deg] shadow-[0_0_8px_rgba(225,29,72,0.4)] animate-stamp-bounce z-20 select-none">
                  APPROVED
                </div>
              </div>
              {/* Laser Scanner Sweep Line */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b] pointer-events-none animate-laser-sweep z-20"></div>
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
              {/* Stove Multi-Layered SVG Flames */}
              <div className="absolute bottom-2 flex gap-1.5 justify-center items-end z-0">
                {/* Indigo Flame Base */}
                <svg className="w-4 h-9 fill-indigo-600/60 animate-flame-3 origin-bottom" viewBox="0 0 100 150">
                  <path d="M50 0 C80 50 100 100 100 150 C100 150 0 150 0 150 C0 100 20 50 50 0 Z" />
                </svg>
                {/* Orange Flame Body */}
                <svg className="w-6 h-12 fill-orange-500/80 animate-flame-2 origin-bottom" viewBox="0 0 100 150" style={{ animationDelay: '0.1s' }}>
                  <path d="M50 0 C85 45 100 95 100 150 C100 150 0 150 0 150 C0 95 15 45 50 0 Z" />
                </svg>
                {/* Yellow Flame Hot Tips */}
                <svg className="w-5 h-10 fill-yellow-400 animate-flame-1 origin-bottom" viewBox="0 0 100 150" style={{ animationDelay: '0.2s' }}>
                  <path d="M50 0 C90 40 100 90 100 150 C100 150 0 150 0 150 C0 90 10 40 50 0 Z" />
                </svg>
                {/* Secondary Orange Flame */}
                <svg className="w-4 h-9 fill-orange-600/80 animate-flame-3 origin-bottom" viewBox="0 0 100 150" style={{ animationDelay: '0.3s' }}>
                  <path d="M50 0 C80 50 100 100 100 150 C100 150 0 150 0 150 C0 100 20 50 50 0 Z" />
                </svg>
              </div>

              {/* Sizzling Embers / Gold Sparks */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-28 h-20 overflow-hidden pointer-events-none z-20">
                <div className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-rise-spark" style={{ left: '20%', animationDelay: '0.1s', '--spark-x': '12px' } as React.CSSProperties}></div>
                <div className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full animate-rise-spark" style={{ left: '45%', animationDelay: '0.4s', '--spark-x': '-8px' } as React.CSSProperties}></div>
                <div className="absolute w-1 h-1 bg-yellow-100 rounded-full animate-rise-spark" style={{ left: '75%', animationDelay: '0.25s', '--spark-x': '6px' } as React.CSSProperties}></div>
                <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full animate-rise-spark" style={{ left: '35%', animationDelay: '0.65s', '--spark-x': '-15px' } as React.CSSProperties}></div>
                <div className="absolute w-1 h-1 bg-amber-500 rounded-full animate-rise-spark" style={{ left: '60%', animationDelay: '0.85s', '--spark-x': '18px' } as React.CSSProperties}></div>
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
                <div className="absolute bottom-2.5 w-24 h-14 bg-gradient-to-b from-amber-400/90 to-amber-600/95 rounded-t-full shadow-[0_8px_20px_rgba(212,175,55,0.3)] flex flex-col items-center justify-start border-t border-white/20 animate-cloche-lift origin-bottom overflow-hidden">
                  {/* Cloche Knob */}
                  <div className="w-4 h-4 bg-amber-500 border border-white/20 rounded-full -mt-2 shadow z-10"></div>
                  
                  {/* Specular metallic sweep */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-specular-sweep" style={{ transform: 'skewX(-25deg)', animationDuration: '2.5s' }}></div>
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
        const riderIcon = getRiderIcon();
        content = (
          <div className="flex flex-col items-center py-6 text-center w-full">
            {activeRiderLocation ? (
              <div className="w-full space-y-4 px-2">
                {/* Live Tracking Map */}
                <div className="w-full h-60 relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-lg bg-stone-950 z-0">
                  <MapContainer 
                    center={[activeRiderLocation.lat, activeRiderLocation.lng]} 
                    zoom={16} 
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer 
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution="&copy; <a href='https://carto.com/'>CARTO</a>"
                    />
                    <MapUpdater center={[activeRiderLocation.lat, activeRiderLocation.lng]} />
                    
                    {/* Shop Location (Valiyakulam, Alappuzha) */}
                    <CircleMarker center={[9.4981, 76.3388]} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.5, weight: 2 }} radius={8}>
                        <Tooltip permanent direction="top" className="bg-stone-900 border-none text-green-500 font-bold uppercase tracking-widest text-[9px] shadow-lg">Chillies Restaurant</Tooltip>
                    </CircleMarker>
                    
                    {/* Rider Marker */}
                    {riderIcon && (
                      <Marker position={[activeRiderLocation.lat, activeRiderLocation.lng]} icon={riderIcon}>
                        <Tooltip permanent direction="top" className="bg-stone-900 border-none text-purple-400 font-bold uppercase tracking-widest text-[9px] shadow-lg">
                          Rider ({foundOrder?.assignedToName || 'Courier'})
                        </Tooltip>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
                
                <div className="flex items-center justify-between gap-3 text-[10px] uppercase font-bold tracking-widest text-stone-500 px-1">
                  <span>Last Seen: {new Date(activeRiderLocation.timestamp).toLocaleTimeString()}</span>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${activeRiderLocation.lat},${activeRiderLocation.lng}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-1.5 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/40 text-purple-400 px-3 py-1.5 rounded-lg text-[9px] transition-all active:scale-95"
                  >
                    Google Maps <MapPin size={10} />
                  </a>
                </div>
              </div>
            ) : (
              /* Fallback Animated Road & Scooter */
              <div className="relative w-64 h-28 flex flex-col justify-end items-center overflow-hidden bg-stone-950/40 rounded-2xl border border-white/5 shadow-inner p-2">
                {/* Repeating Parallax City Skyline Background */}
                <div className="absolute inset-x-0 bottom-6 h-14 opacity-20 pointer-events-none z-0 overflow-hidden">
                  <div className="w-[300%] h-full bg-repeat-x animate-scroll-skyline" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40' width='100' height='40'%3E%3Cpath d='M0,40 L0,30 L10,30 L10,20 L25,20 L25,25 L40,25 L40,15 L60,15 L60,32 L75,32 L75,22 L90,22 L90,30 L100,30 L100,40 Z' fill='%23a855f7'/%3E%3C/svg%3E")`,
                    backgroundSize: '100px 40px',
                    backgroundPosition: 'bottom'
                  }}></div>
                </div>

                {/* Horizontally scrolling speed lines representing high speed */}
                <div className="absolute bottom-6 w-full h-10 pointer-events-none z-0">
                  <div className="absolute top-2 w-14 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent animate-speed-lines-1"></div>
                  <div className="absolute top-6 w-20 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent animate-speed-lines-2"></div>
                  <div className="absolute top-10 w-16 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent animate-speed-lines-3"></div>
                </div>

                {/* Delivery Rider Scooter */}
                <div className="relative z-10 flex flex-col items-center animate-drive-vibe">
                  <Bike className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" size={48} />
                  {/* Small dust particles behind the scooter */}
                  <div className="absolute bottom-1 -left-4 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-ping"></div>
                    <div className="w-1 h-1 bg-purple-500/20 rounded-full animate-ping" style={{ animationDelay: '0.15s' }}></div>
                  </div>
                </div>

                {/* Rapidly scrolling road dashed markers */}
                <div className="w-full h-1.5 bg-stone-900 rounded-full mt-2 relative z-10 overflow-hidden">
                  <div className="absolute inset-0 flex gap-4 animate-scroll-road w-[200%]">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="w-6 h-full bg-purple-400/50 rounded-sm"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <h4 className="text-white font-serif text-base mt-4 font-semibold tracking-wide flex items-center gap-1.5 justify-center">
              Out for Delivery <Bike size={16} className="text-purple-500 animate-bounce" />
            </h4>
            <p className="text-stone-400 text-xs px-6 mt-1.5 leading-relaxed max-w-xs">
              {activeRiderLocation 
                ? `Rider ${foundOrder?.assignedToName || 'Courier'} is bringing your order. Follow them on the map!` 
                : 'Our high-speed delivery courier is racing across the streets straight to your doorstep!'}
            </p>
          </div>
        );
        break;

      case 'delivered':
        content = (
          <div className="flex flex-col items-center py-6 text-center relative overflow-hidden">
            {/* Confetti Explosion Particles */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti-1" style={{ left: '30%', top: '50%' }}></div>
              <div className="absolute w-2.5 h-2.5 bg-pink-500 rounded animate-confetti-2" style={{ left: '45%', top: '45%' }}></div>
              <div className="absolute w-2 h-3 bg-blue-400 rounded-sm animate-confetti-3" style={{ left: '55%', top: '55%' }}></div>
              <div className="absolute w-3 h-1.5 bg-emerald-400 rounded animate-confetti-4" style={{ left: '70%', top: '50%' }}></div>
              <div className="absolute w-2 h-2 bg-orange-400 rounded-full animate-confetti-5" style={{ left: '50%', top: '35%' }}></div>
            </div>

            <div className="relative w-40 h-28 flex items-center justify-center">
              {/* Confetti Explosion Aura */}
              <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 blur-xl animate-aura-pulse"></div>

              {/* Celebrating Check Circle */}
              <div className="w-18 h-18 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full flex items-center justify-center text-stone-950 shadow-[0_0_30px_rgba(34,197,94,0.5)] scale-110 border-4 border-stone-900 z-10 animate-delivered-bounce">
                <CheckCircle size={36} className="text-stone-950 stroke-[2.5]" />
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
        {/* Interactive Audio Equalizer Button Overlay */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsAudioOn(!isAudioOn);
          }}
          className="absolute top-3 right-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/80 backdrop-blur-md border border-white/10 shadow-lg text-[9px] font-black uppercase tracking-widest text-gold-500 cursor-pointer hover:bg-stone-850 hover:text-white transition-all select-none duration-300"
        >
          {isAudioOn ? (
            <>
              <span>Sizzling ON</span>
              <div className="flex items-end gap-0.5 h-3.5 w-4 overflow-hidden">
                <div className="w-0.5 bg-gold-500 rounded-full animate-eq-bar-1" style={{ height: '4px' }}></div>
                <div className="w-0.5 bg-gold-500 rounded-full animate-eq-bar-2" style={{ height: '8px' }}></div>
                <div className="w-0.5 bg-gold-500 rounded-full animate-eq-bar-3" style={{ height: '12px' }}></div>
                <div className="w-0.5 bg-gold-500 rounded-full animate-eq-bar-4" style={{ height: '6px' }}></div>
              </div>
            </>
          ) : (
            <>
              <span className="text-stone-400">Sound Off</span>
              <VolumeX size={12} className="text-stone-400 animate-pulse" />
            </>
          )}
        </button>

        {/* Style tag injected locally inside component */}
        <style>{`
          @keyframes printReceipt {
            0% { height: 0; opacity: 0; transform: translateY(-10px); }
            100% { height: 55px; opacity: 1; transform: translateY(0); }
          }
          @keyframes scan {
            0%, 100% { transform: translateY(-3px) scale(1); }
            50% { transform: translateY(3px) scale(1.04); }
          }
          @keyframes laserSweep {
            0%, 100% { top: 10%; opacity: 0.3; }
            50% { top: 90%; opacity: 1; }
          }
          @keyframes stampBounce {
            0% { transform: scale(3) rotate(-35deg); opacity: 0; }
            70% { transform: scale(0.9) rotate(-12deg); opacity: 0.9; }
            100% { transform: scale(1) rotate(-15deg); opacity: 1; }
          }
          @keyframes flameRise1 {
            0%, 100% { transform: scaleY(0.9) scaleX(0.95) rotate(-1deg); }
            50% { transform: scaleY(1.1) scaleX(1.05) rotate(1deg); }
          }
          @keyframes flameRise2 {
            0%, 100% { transform: scaleY(1.15) scaleX(1.02) rotate(1deg); }
            50% { transform: scaleY(0.85) scaleX(0.95) rotate(-1deg); }
          }
          @keyframes flameRise3 {
            0%, 100% { transform: scaleY(1) scaleX(1.1) rotate(0deg); }
            50% { transform: scaleY(1.2) scaleX(0.9) rotate(2deg); }
          }
          @keyframes riseSpark {
            0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 0.8; }
            100% { transform: translateY(-60px) translateX(var(--spark-x, 10px)) scale(1.2); opacity: 0; }
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
          @keyframes specularSweep {
            0% { transform: translateX(-150%) rotate(25deg); opacity: 0; }
            15% { opacity: 0.5; }
            85% { opacity: 0.5; }
            100% { transform: translateX(150%) rotate(25deg); opacity: 0; }
          }
          @keyframes scrollSkyline {
            0% { background-position: 0px 0px; }
            100% { background-position: -100px 0px; }
          }
          @keyframes scrollRoad {
            0% { transform: translateX(0); }
            100% { transform: translateX(-40px); }
          }
          @keyframes speedLines {
            0% { transform: translateX(120%); opacity: 0; }
            30% { opacity: 0.4; }
            70% { opacity: 0.4; }
            100% { transform: translateX(-120%); opacity: 0; }
          }
          @keyframes driveVibe {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-1.5px) rotate(-1deg); }
            75% { transform: translateY(1px) rotate(1deg); }
          }
          @keyframes auraPulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.05); opacity: 0.5; }
          }
          @keyframes deliveredBounce {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.15); }
            70% { transform: scale(0.95); }
            100% { transform: scale(1.1) rotate(0deg); }
          }
          @keyframes confetti1 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate(-35px, -70px) rotate(360deg); opacity: 0; }
          }
          @keyframes confetti2 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate(45px, -80px) rotate(-360deg); opacity: 0; }
          }
          @keyframes confetti3 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate(-55px, -50px) rotate(180deg); opacity: 0; }
          }
          @keyframes confetti4 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate(40px, -60px) rotate(-180deg); opacity: 0; }
          }
          @keyframes confetti5 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate(0px, -90px) rotate(720deg); opacity: 0; }
          }
          @keyframes equalizerBar {
            0% { height: 4px; }
            100% { height: 16px; }
          }
          @keyframes stepperFlow {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
          
          .animate-print-receipt { animation: printReceipt 1.2s ease-out forwards; }
          .animate-scan { animation: scan 2s ease-in-out infinite; }
          .animate-laser-sweep { animation: laserSweep 2s ease-in-out infinite; }
          .animate-stamp-bounce { animation: stampBounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.6s forwards; opacity: 0; }
          .animate-flame-1 { animation: flameRise1 0.7s infinite alternate ease-in-out; }
          .animate-flame-2 { animation: flameRise2 0.5s infinite alternate ease-in-out; }
          .animate-flame-3 { animation: flameRise3 0.6s infinite alternate ease-in-out; }
          .animate-rise-spark { animation: riseSpark 1.2s infinite linear; }
          .animate-wok-toss { animation: wokToss 1.2s infinite ease-in-out; }
          .animate-chop { animation: chop 0.5s infinite ease-in-out; }
          .animate-cloche-lift { animation: clocheLift 1.8s infinite ease-in-out; }
          .animate-specular-sweep { animation: specularSweep 3s infinite linear; }
          .animate-scroll-skyline { animation: scrollSkyline 10s infinite linear; }
          .animate-scroll-road { animation: scrollRoad 0.6s infinite linear; }
          .animate-speed-lines-1 { animation: speedLines 1.5s infinite linear; }
          .animate-speed-lines-2 { animation: speedLines 1.5s infinite linear 0.5s; }
          .animate-speed-lines-3 { animation: speedLines 1.5s infinite linear 1s; }
          .animate-drive-vibe { animation: driveVibe 0.25s infinite linear; }
          .animate-aura-pulse { animation: auraPulse 2.5s infinite ease-in-out; }
          .animate-steam-1 { animation: steamRise 1.8s infinite linear; }
          .animate-steam-2 { animation: steamRise 1.8s infinite linear 0.6s; }
          .animate-steam-3 { animation: steamRise 1.8s infinite linear 1.2s; }
          .animate-delivered-bounce { animation: deliveredBounce 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
          .animate-confetti-1 { animation: confetti1 2s infinite ease-out; }
          .animate-confetti-2 { animation: confetti2 2s infinite ease-out 0.4s; }
          .animate-confetti-3 { animation: confetti3 2s infinite ease-out 0.8s; }
          .animate-confetti-4 { animation: confetti4 2s infinite ease-out 1.2s; }
          .animate-confetti-5 { animation: confetti5 2s infinite ease-out 1.6s; }
          .animate-eq-bar-1 { animation: equalizerBar 0.8s ease-in-out infinite alternate; }
          .animate-eq-bar-2 { animation: equalizerBar 0.5s ease-in-out infinite alternate 0.15s; }
          .animate-eq-bar-3 { animation: equalizerBar 0.7s ease-in-out infinite alternate 0.3s; }
          .animate-eq-bar-4 { animation: equalizerBar 0.6s ease-in-out infinite alternate 0.45s; }
          .animate-stepper-flow { animation: stepperFlow 2s linear infinite; }
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
                                            <div className="absolute top-5 left-[12.5%] h-1 rounded-full z-0 transition-all duration-1000 ease-in-out block bg-gradient-to-r from-amber-500 via-rose-500 to-yellow-400 bg-[length:200%_auto] animate-stepper-flow" style={{ width: `${(activeIndex / (steps.length - 1)) * 75}%` }}></div>

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
