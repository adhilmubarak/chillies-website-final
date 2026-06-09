
import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MenuItemCard from './components/MenuItemCard';
import CartSidebar from './components/CartSidebar';

const OrderTrackerModal = lazy(() => import('./components/OrderTrackerModal'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
import { Category, MenuItem, CartItem, Order, CategoryConfig, Coupon, CustomOffer, LoyaltyAccount, FoodRating, Complaint } from './types';
import { MENU_ITEMS } from './data.ts';
import { db } from './firebase';
import { collection, addDoc, query, onSnapshot, doc, setDoc, updateDoc, getDocs, where, deleteDoc } from 'firebase/firestore';
import { Search, Bike, Store, Clock, Flame, ShoppingBag, CheckCircle, XCircle, User, Star, AlertCircle, MessageSquare, Send, X, Info, ChevronRight, Trophy, Sparkles } from 'lucide-react';
import BottomNav from './components/BottomNav';
import NotificationTicker from './components/NotificationTicker';
import SmartSuggestion from './components/SmartSuggestion';
import ChefsChoice from './components/ChefsChoice';
import FlashSaleView from './components/FlashSaleView';
import HappyHourView from './components/HappyHourView';
import StoreStatusAlert from './components/StoreStatusAlert';
import FeedbackModal from './components/FeedbackModal';
import ShawarmaLoader from './components/ShawarmaLoader';
import { Capacitor } from '@capacitor/core';

const OffersPage = lazy(() => import('./components/OffersPage'));
const RewardsPage = lazy(() => import('./components/RewardsPage'));
const ScreamChallenge = lazy(() => import('./components/ScreamChallenge'));
const ComplaintsPage = lazy(() => import('./components/ComplaintsPage'));
const DeliveryPanel = lazy(() => import('./components/DeliveryPanel'));
const KitchenPanel = lazy(() => import('./components/KitchenPanel'));
const ARViewerModal = lazy(() => import('./components/ARViewerModal'));
const SignagePage = lazy(() => import('./components/SignagePage'));
const PredictPage = lazy(() => import('./components/PredictPage'));

const PredictPageFallback = () => {
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center py-16 min-h-[320px] text-center space-y-6 animate-fade-in w-full">
        <div className="relative w-64 h-48 mx-auto bg-stone-900/40 border border-white/5 rounded-[2.5rem] p-4 flex items-center justify-center shadow-2xl backdrop-blur-sm overflow-hidden group">
          {/* Ambient background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-gold-500/15 transition-all duration-700"></div>
          
          <svg viewBox="0 0 300 160" className="w-full h-full relative z-10">
            <defs>
              {/* 3D Spherical Shading Gradient */}
              <radialGradient id="sphere-shading-fallback" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="80%" stopColor="#000000" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
              </radialGradient>
              
              {/* Gold/Amber Glow for the Ball Core */}
              <radialGradient id="gold-glow-fallback" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--brand-400)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--brand-600)" stopOpacity="0" />
              </radialGradient>

              {/* Field light under the ball */}
              <radialGradient id="field-gradient-fallback" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>

              {/* Spotlight Gradients */}
              <linearGradient id="spotlight-left-fallback" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--brand-500)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="spotlight-right-fallback" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--brand-500)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Stadium Spotlights Background */}
            <polygon points="0,-20 90,-20 150,130 0,130" fill="url(#spotlight-left-fallback)" className="pointer-events-none" opacity="0.4" />
            <polygon points="300,-20 210,-20 150,130 300,130" fill="url(#spotlight-right-fallback)" className="pointer-events-none" opacity="0.4" />

            {/* Soft Green Turf Glow */}
            <ellipse cx="150" cy="130" rx="70" ry="12" fill="url(#field-gradient-fallback)" opacity="0.25" className="pointer-events-none" />

            {/* Swaying Grass Blades */}
            <g className="animate-grass-sway" style={{ transformOrigin: '150px 132px' }}>
              <path d="M138,132 Q135,122 130,118 Q134,123 139,132" fill="#047857" />
              <path d="M144,132 Q142,118 137,112 Q141,120 145,132" fill="#10b981" />
              <path d="M150,132 Q152,115 156,108 Q153,118 151,132" fill="#059669" />
              <path d="M156,132 Q160,120 165,114 Q159,122 157,132" fill="#10b981" />
              <path d="M162,132 Q166,124 170,120 Q165,125 163,132" fill="#047857" />
            </g>

            {/* Synchronized Ground Shadow */}
            <ellipse cx="150" cy="130" rx="22" ry="6" className="fill-stone-950/90 animate-shadow-bounce pointer-events-none" style={{ transformOrigin: '150px 130px' }} />

            {/* Bouncing Soccer Ball Group */}
            <g className="animate-realistic-bounce" style={{ transformOrigin: '150px 121px' }}>
              {/* Ball Gold Aura Glow */}
              <circle cx="150" cy="95" r="30" fill="url(#gold-glow-fallback)" className="pointer-events-none" />

              {/* Ball Base */}
              <circle cx="150" cy="95" r="26" fill="#fafafa" stroke="var(--brand-500)" strokeWidth="1.2" />

              {/* Center pentagon */}
              <polygon points="150,87 158,92.5 155,101.5 145,101.5 142,92.5" fill="#1c1917" stroke="var(--brand-500)" strokeWidth="0.8" />
              
              {/* Seam lines radiating from center pentagon corners */}
              <line x1="150" y1="87" x2="150" y2="77" stroke="var(--brand-500)" strokeWidth="0.8" />
              <line x1="158" y1="92.5" x2="167" y2="90" stroke="var(--brand-500)" strokeWidth="0.8" />
              <line x1="155" y1="101.5" x2="161" y2="110.5" stroke="var(--brand-500)" strokeWidth="0.8" />
              <line x1="145" y1="101.5" x2="139" y2="110.5" stroke="var(--brand-500)" strokeWidth="0.8" />
              <line x1="142" y1="92.5" x2="133" y2="90" stroke="var(--brand-500)" strokeWidth="0.8" />

              {/* Outer panels */}
              <polygon points="150,77 140,73 133,82 133,90 142,92.5 150,87" fill="#fafafa" stroke="var(--brand-500)" strokeWidth="0.8" />
              <polygon points="150,77 160,73 167,82 167,90 158,92.5 150,87" fill="#fafafa" stroke="var(--brand-500)" strokeWidth="0.8" />
              <polygon points="155,101.5 161,110.5 150,116 139,110.5 145,101.5" fill="#1c1917" stroke="var(--brand-500)" strokeWidth="0.8" />
              <polygon points="142,92.5 133,90 127,99 139,110.5 145,101.5" fill="#fafafa" stroke="var(--brand-500)" strokeWidth="0.8" />
              <polygon points="158,92.5 167,90 173,99 161,110.5 155,101.5" fill="#fafafa" stroke="var(--brand-500)" strokeWidth="0.8" />
              
              {/* Outer curved boundary arcs to simulate 3D projection */}
              <path d="M 127 99 A 26 26 0 0 0 139 110.5" fill="none" stroke="var(--brand-500)" strokeWidth="0.8" />
              <path d="M 161 110.5 A 26 26 0 0 0 173 99" fill="none" stroke="var(--brand-500)" strokeWidth="0.8" />
              <path d="M 167 82 A 26 26 0 0 0 160 73" fill="none" stroke="var(--brand-500)" strokeWidth="0.8" />
              <path d="M 140 73 A 26 26 0 0 0 133 82" fill="none" stroke="var(--brand-500)" strokeWidth="0.8" />

              {/* 3D Spherical Shading Overlay */}
              <circle cx="150" cy="95" r="26" fill="url(#sphere-shading-fallback)" className="pointer-events-none" />
            </g>

            {/* Stadium dust particles */}
            <circle cx="45" cy="50" r="1.5" fill="var(--brand-300)" className="pointer-events-none" style={{ animation: 'float-up 4s infinite linear', animationDelay: '0s' }} />
            <circle cx="255" cy="80" r="1.2" fill="var(--brand-300)" className="pointer-events-none" style={{ animation: 'float-up 3.5s infinite linear', animationDelay: '1.2s' }} />
            <circle cx="80" cy="30" r="1.8" fill="var(--brand-300)" className="pointer-events-none" style={{ animation: 'float-up 4.5s infinite linear', animationDelay: '2.5s' }} />
            <circle cx="220" cy="60" r="1" fill="var(--brand-300)" className="pointer-events-none" style={{ animation: 'float-up 5s infinite linear', animationDelay: '0.8s' }} />
          </svg>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] text-gold-500 font-mono tracking-[0.25em] uppercase font-black text-glow-gold animate-pulse">
            Kicking Off Match Center
          </div>
          <div className="text-[9px] text-stone-500 uppercase tracking-widest font-black font-sans">
            Preparing the field...
          </div>
        </div>
      </div>
    </div>
  );
};
import { App as CapApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerPlugin } from '@capacitor/core';

// KOT Printing Helper
export const printKOT = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=600,height=600');
  if (!printWindow) return;
  
  const itemsHtml = order.items.map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 22px;">
      <span>${item.quantity}x ${item.name}</span>
    </div>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>KOT - #${order.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 10px; margin: 0; color: #000; background: #fff; font-weight: bold; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
          .order-highlight { 
            font-size: 32px; 
            font-weight: 900; 
            border: 4px solid #000; 
            display: inline-block; 
            padding: 10px 25px; 
            margin: 10px 0;
          }
          .details { 
            text-align: left; 
            font-size: 18px; 
            margin-bottom: 15px; 
            padding-bottom: 10px;
            border-bottom: 2px dashed #000;
          }
          h2 { margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 2px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>KOT</h2>
          <div class="order-highlight">#${order.id}</div>
          <p style="font-size: 16px; margin: 5px 0;">${order.date} | ${order.timestamp}</p>
        </div>
        <div class="details">
          <div style="font-size: 24px; text-decoration: underline; margin-bottom: 10px;"><strong>TYPE:</strong> ${order.type.toUpperCase()}</div>
          ${order.type === 'delivery' && order.customerName ? `<div><strong>For:</strong> ${order.customerName}</div>` : ''}
        </div>
        <div style="font-size: 20px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase;">Items to prepare:</div>
        <div>${itemsHtml}</div>
        <div style="text-align: center; margin-top: 30px; font-size: 14px; border-top: 2px solid #000; padding-top: 10px;">
          End of Ticket
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

export const printThermalBill = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=600,height=600');
  if (!printWindow) return;
  const itemsHtml = order.items.map(item => `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>${item.quantity}x ${item.name}</span><span>₹${item.price * item.quantity}</span></div>`).join('');
  printWindow.document.write(`<html><head><style>body { font-family: monospace; width: 80mm; padding: 10px; margin: 0; }</style></head><body><h2 style="text-align:center">Chillies Restaurant</h2><p style="text-align:center">Order #${order.id}</p><hr/>${itemsHtml}<hr/><div style="display:flex; justify-content:space-between; font-weight:bold"><span>Total</span><span>₹${order.total}</span></div><p style="text-align:center; margin-top:20px">Thank you!</p></body></html>`);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
};

const arrayBufferToBase64 = (buffer: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) binary += String.fromCharCode(buffer[i]);
  return window.btoa(binary);
};

const NetworkPrinter = Capacitor.isNativePlatform() ? registerPlugin<any>('NetworkPrinter') : null;

export const discoverNetworkPrinters = async (): Promise<{printers: string[], scannedSubnets: string[]}> => {
  if (!NetworkPrinter) return { printers: [], scannedSubnets: [] };
  const result = await NetworkPrinter.discoverPrinters();
  return { printers: result.printers || [], scannedSubnets: result.scannedSubnets || [] };
};

export const printNetworkKOT = async (order: Order, printers: {name: string, ip: string}[]) => {
  if (!NetworkPrinter) { printKOT(order); return; }
  let bytes: number[] = [0x1B, 0x40, 0x1B, 0x61, 1, 0x1D, 0x21, 0x11];
  const title = "KOT\n"; for(let i=0; i<title.length; i++) bytes.push(title.charCodeAt(i));
  bytes.push(0x1D, 0x21, 0x00);
  const info = `Order #${order.id}\n${order.date} | ${order.timestamp}\n\n`; for(let i=0; i<info.length; i++) bytes.push(info.charCodeAt(i));
  bytes.push(0x1B, 0x61, 0);
  order.items.forEach(item => { const line = `${item.quantity}x ${item.name}\n`; for(let i=0; i<line.length; i++) bytes.push(line.charCodeAt(i)); });
  bytes.push(0x0A, 0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x00);
  const base64Data = arrayBufferToBase64(new Uint8Array(bytes));
  for (const p of printers) if (p.ip) await NetworkPrinter.print({ ip: p.ip, port: 9100, data: base64Data });
};

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dbCategories, setDbCategories] = useState<CategoryConfig[]>([
      { id: '1', name: 'Breads' },
      { id: '2', name: 'Starters' },
      { id: '3', name: 'Main Course' },
      { id: '4', name: 'Desserts' },
      { id: '5', name: 'Drinks' }
  ]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customOffers, setCustomOffers] = useState<CustomOffer[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<LoyaltyAccount[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [worldCupMatches, setWorldCupMatches] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'worldcup_matches'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort chronologically
      fetched.sort((a, b) => {
        const dateTimeA = new Date(`${a.matchDate}T${a.matchTime || '00:00'}`).getTime();
        const dateTimeB = new Date(`${b.matchDate}T${b.matchTime || '00:00'}`).getTime();
        return dateTimeA - dateTimeB;
      });
      setWorldCupMatches(fetched);
    });
    return () => unsubscribe();
  }, []);

  const votingCloseCountdown = useMemo(() => {
    // Find the next upcoming match whose voting is open (i.e. kickoff is more than 10 minutes in the future)
    const nextMatch = worldCupMatches.find(m => {
      if (m.status !== 'upcoming') return false;
      const kickoff = new Date(`${m.matchDate}T${m.matchTime || '00:00'}`);
      const diffMs = kickoff.getTime() - currentTime.getTime();
      const tenMinsMs = 10 * 60 * 1000;
      return diffMs > tenMinsMs;
    });

    if (!nextMatch) return null;

    const kickoff = new Date(`${nextMatch.matchDate}T${nextMatch.matchTime || '00:00'}`);
    const closeTimeMs = kickoff.getTime() - 10 * 60 * 1000;
    const diffMs = closeTimeMs - currentTime.getTime();

    if (diffMs <= 0) return null;

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const s = diffSecs % 60;
    const m = diffMins % 60;
    const h = diffHours % 24;

    const formattedSecs = String(s).padStart(2, '0');
    const formattedMins = String(m).padStart(2, '0');
    const formattedHours = String(h).padStart(2, '0');

    if (diffDays > 0) {
      return `Voting closes in: ${diffDays}d ${formattedHours}h ${formattedMins}m`;
    }
    if (diffHours > 0) {
      return `Voting closes in: ${formattedHours}h ${formattedMins}m ${formattedSecs}s`;
    }
    return `Voting closes in: ${formattedMins}m ${formattedSecs}s`;
  }, [worldCupMatches, currentTime]);

  const [activeSection, setActiveSection] = useState('home');
  const [foodRatings, setFoodRatings] = useState<FoodRating[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [riderLocation, setRiderLocation] = useState<{lat: number, lng: number, timestamp: number} | null>(null);
  const [promoSettings, setPromoSettings] = useState({
      isFlashSaleActive: false,
      flashSaleDate: new Date().toISOString().split('T')[0],
      flashSaleStartTime: '18:00',
      flashSaleEndTime: '21:00',
      isHappyHourActive: false,
      happyHourStartTime: '16:00',
      happyHourEndTime: '18:00'
  });
  const [storeSettings, setStoreSettings] = useState({
      acceptingOrders: true,
      startTime: '07:00',
      endTime: '23:00',
      deliveryUpiId: '',
      announcement: '',
      isAnnouncementActive: false,
      loyaltyPointsRatio: 10,
      minimumPointsToRedeem: 50,
      latestBroadcast: null as { title: string; body: string; timestamp: number } | null,
      adminTokens: [] as string[],
      kotPrinters: [] as {name: string, ip: string}[],
      selectedTheme: 'classic' as 'classic' | 'professional'
  });

  const [lastSuggestionTime, setLastSuggestionTime] = useState(0);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [initialTrackId, setInitialTrackId] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Breads');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestion, setSuggestion] = useState<MenuItem | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen') || location.pathname.startsWith('/delivery') || location.pathname.startsWith('/signage') || Capacitor.isNativePlatform());
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [arItem, setArItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const isSpecialPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen') || location.pathname.startsWith('/delivery') || location.pathname.startsWith('/signage');
    setIsAdminOpen(isSpecialPath || Capacitor.isNativePlatform());
  }, [location.pathname]);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    const setupForegroundMessaging = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const { messaging } = await import('./firebase');
        if (messaging) {
            const { onMessage } = await import('firebase/messaging');
            onMessage(messaging, (payload) => {
                console.log("Foreground message received:", payload);
                if (Notification.permission === 'granted') {
                    const title = payload.notification?.title || payload.data?.title || 'New Update';
                    const body = payload.notification?.body || payload.data?.body || '';
                    new Notification(title, {
                        body: body,
                        icon: '/pwa-192x192.png'
                    });
                }
            });
        }
      }
    };
    setupForegroundMessaging();
  }, []);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState('');

  const handleViewAR = (item: MenuItem) => {
    window.localStorage.setItem('last_ar_image', item.image);
    setArItem(item);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tid = params.get('tid') || params.get('trackId');
    if (tid || location.pathname === '/track') {
      if (tid) setInitialTrackId(tid);
      setIsTrackerOpen(true);
      if (tid) window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search, location.pathname]);

  useEffect(() => {
    const isDismissed = localStorage.getItem('install_prompt_dismissed');
    if (isDismissed) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = ('standalone' in window.navigator) && !!(window.navigator as any).standalone;
    
    if (isIOSDevice && !isStandalone) {
      setIsIOS(true);
      setShowInstallBanner(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      localStorage.setItem('install_prompt_dismissed', 'true');
    }
    setDeferredPrompt(null);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install_prompt_dismissed', 'true');
  };

  useEffect(() => {
    const q = query(collection(db, 'menuItems'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
      items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setMenuItems(items.length > 0 ? items : MENU_ITEMS);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig));
      if (fetched.length > 0) setDbCategories(fetched.sort((a,b) => (a.order || 0) - (b.order || 0)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'orders')); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id } as any));
      setOrders(fetched.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'complaints'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComplaints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'foodRatings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFoodRatings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodRating)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'loyalty'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLoyaltyAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoyaltyAccount)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'coupons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setPromoSettings({
                isFlashSaleActive: data.isFlashSaleActive || false,
                flashSaleDate: data.flashSaleDate || new Date().toISOString().split('T')[0],
                flashSaleStartTime: data.flashSaleStartTime || '18:00',
                flashSaleEndTime: data.flashSaleEndTime || '21:00',
                isHappyHourActive: data.isHappyHourActive || false,
                happyHourStartTime: data.happyHourStartTime || '16:00',
                happyHourEndTime: data.happyHourEndTime || '18:00'
            });
            setStoreSettings({
                acceptingOrders: data.acceptingOrders !== false,
                startTime: data.startTime || '07:00',
                endTime: data.endTime || '23:00',
                deliveryUpiId: data.deliveryUpiId || '',
                announcement: data.announcement || '',
                isAnnouncementActive: data.isAnnouncementActive || false,
                loyaltyPointsRatio: data.loyaltyPointsRatio || 10,
                minimumPointsToRedeem: data.minimumPointsToRedeem || 50,
                latestBroadcast: data.latestBroadcast || null,
                adminTokens: data.adminTokens || [],
                kotPrinters: data.kotPrinters || [],
                selectedTheme: data.selectedTheme || 'classic'
            });
        }
    });
    return () => unsubscribe();
  }, []);

  const isFlashSaleActive = useMemo(() => {
    if (!promoSettings.isFlashSaleActive) return false;
    const today = currentTime.toISOString().split('T')[0];
    if (promoSettings.flashSaleDate && today !== promoSettings.flashSaleDate) return false;
    const [startH, startM] = promoSettings.flashSaleStartTime.split(':').map(Number);
    const [endH, endM] = promoSettings.flashSaleEndTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const currMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    return currMin >= startMin && currMin < endMin;
  }, [promoSettings, currentTime]);

  const isHappyHourActive = useMemo(() => {
    if (!promoSettings.isHappyHourActive) return false;
    const [startH, startM] = promoSettings.happyHourStartTime.split(':').map(Number);
    const [endH, endM] = promoSettings.happyHourEndTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const currMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    return currMin >= startMin && currMin < endMin;
  }, [promoSettings, currentTime]);

  const isStoreOpen = storeSettings.acceptingOrders && (() => {
      const [startH, startM] = storeSettings.startTime.split(':').map(Number);
      const [endH, endM] = storeSettings.endTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const currMin = currentTime.getHours() * 60 + currentTime.getMinutes();
      if (startMin <= endMin) return currMin >= startMin && currMin <= endMin;
      return currMin >= startMin || currMin <= endMin;
  })();

  const checkAvailability = (catName: string) => {
      if (!isStoreOpen) return { isAvailable: false, reason: 'Store Closed' };
      const config = dbCategories.find(c => c.name === catName);
      if (!config) return { isAvailable: true };
      if (config.isUnavailable) return { isAvailable: false, reason: 'Category Offline' };
      const [startH, startM] = (config.startTime || '00:00').split(':').map(Number);
      const [endH, endM] = (config.endTime || '23:59').split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const currMin = currentTime.getHours() * 60 + currentTime.getMinutes();
      const active = startMin <= endMin ? (currMin >= startMin && currMin <= endMin) : (currMin >= startMin || currMin <= endMin);
      return { isAvailable: active, availabilityTime: config.startTime };
  };

  const addToCart = (item: MenuItem) => {
    if (!isStoreOpen) return;
    let price = item.price;
    if (isFlashSaleActive && item.isFlashSale && item.flashSalePrice) price = item.flashSalePrice;
    else if (isHappyHourActive && item.isHappyHour && item.happyHourPrice) price = item.happyHourPrice;

    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1, price } : i);
      return [...prev, { ...item, quantity: 1, price }];
    });

    // --- AI Smart Pairing Logic ---
    const now = Date.now();
    // Only suggest if we haven't shown one in the last 45 seconds to avoid annoyance
    if (now - lastSuggestionTime > 45000) {
        let targetCategory = '';
        const cat = item.category?.toLowerCase() || '';
        
        if (cat.includes('starter') || cat.includes('bread')) targetCategory = 'Main Course';
        else if (cat.includes('main')) targetCategory = 'Drinks';
        else if (cat.includes('drink')) targetCategory = 'Desserts';
        else if (cat.includes('dessert')) targetCategory = 'Drinks';

        if (targetCategory) {
            const potential = menuItems.filter(m => 
                m.category === targetCategory && 
                !cartItems.find(c => c.id === m.id) &&
                checkAvailability(m.category).isAvailable
            );
            
            if (potential.length > 0) {
                // Prioritize Chef's Choice or high-rated items
                const highQuality = potential.filter(m => m.isChefChoice);
                const pool = highQuality.length > 0 ? highQuality : potential;
                const randomSuggestion = pool[Math.floor(Math.random() * pool.length)];
                
                // Show suggestion with a slight delay for better UX
                setTimeout(() => {
                    setSuggestion(randomSuggestion);
                    setLastSuggestionTime(now);
                }, 800);
            }
        }
    }
  };

  const handleAddOrder = async (order: Order) => {
    try {
      await addDoc(collection(db, 'orders'), {
        ...order,
        createdAt: Date.now()
      });
      const savedIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
      savedIds.push(order.id);
      localStorage.setItem('myOrders', JSON.stringify(savedIds));
    } catch(e) {
      console.error('Error adding order to Firestore:', e);
    }
  };

  const orderedCats = dbCategories.map(c => c.name);
  if (isFlashSaleActive) orderedCats.unshift('Flash Sale');
  if (isHappyHourActive) orderedCats.unshift('Happy Hour');

  const filteredItems = menuItems.filter(item => 
    item.category === activeCategory && 
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const observerTarget = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const currentIndex = orderedCats.indexOf(activeCategory);
        if (currentIndex !== -1 && currentIndex < orderedCats.length - 1) {
          setActiveCategory(orderedCats[currentIndex + 1]);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }, { threshold: 1.0 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [activeCategory, orderedCats]);

  const isPredictPage = location.pathname === '/predict';
  const predictFallback = <PredictPageFallback />;
  const defaultLoader = <div className="min-h-screen bg-stone-950 flex items-center justify-center"><ShawarmaLoader /></div>;
  const currentFallback = isPredictPage ? predictFallback : defaultLoader;

  if (showSplash) {
    return isPredictPage ? predictFallback : defaultLoader;
  }

  return (
    <React.Suspense fallback={currentFallback}>
      {(!isAdminOpen && location.pathname !== '/rewards' && location.pathname !== '/feedback' && location.pathname !== '/scream-challenge' && location.pathname !== '/predict') && (
        <>
          <Navbar 
            currentTime={currentTime}
            cartItemCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} 
            onOpenCart={() => setIsCartOpen(true)} 
            onOpenTracker={() => setIsTrackerOpen(true)}
            hasTicker={!isStoreOpen || isFlashSaleActive || isHappyHourActive || storeSettings.isAnnouncementActive}
          />
          <NotificationTicker 
            isFlashSaleActive={isFlashSaleActive} 
            isHappyHourActive={isHappyHourActive}
            flashSaleEndTime={promoSettings.flashSaleEndTime}
            isStoreOpen={isStoreOpen}
            startTime={storeSettings.startTime}
            announcement={storeSettings.announcement}
            isAnnouncementActive={storeSettings.isAnnouncementActive}
          />
        </>
      )}

      <Suspense fallback={currentFallback}>
      <Routes>
        <Route path="/admin" element={
          <AdminPanel 
            isOpen={true}
            onClose={() => navigate('/')}
            items={menuItems}
            categories={dbCategories}
            orders={orders}
            coupons={coupons}
            isStoreOpen={isStoreOpen}
            promoSettings={promoSettings}
            storeSettings={storeSettings}
            onAddItem={async (item) => { await addDoc(collection(db, 'menuItems'), item); }}
            onUpdateItem={async (item) => { if (item.id) await updateDoc(doc(db, 'menuItems', item.id), item as any); }}
            onDeleteItem={async (id) => { await deleteDoc(doc(db, 'menuItems', id)); }}
            onAddCategory={async (name) => { await addDoc(collection(db, 'categories'), { name, isUnavailable: false, startTime: '00:00', endTime: '23:59' }); }}
            onUpdateCategory={async (c) => {
              if (c.id) {
                await updateDoc(doc(db, 'categories', c.id), {
                  name: c.name,
                  startTime: c.startTime || '00:00',
                  endTime: c.endTime || '23:59',
                  isUnavailable: !!c.isUnavailable
                });
              }
            }}
            onDeleteCategory={async (id) => { await deleteDoc(doc(db, 'categories', id)); }}
            onUpdateOrderStatus={async (id, s, pm, fid) => {
              if (fid) await updateDoc(doc(db, 'orders', fid), { status: s });
              else {
                const q = query(collection(db, 'orders'), where("id", "==", id));
                const snap = await getDocs(q);
                for (const d of snap.docs) await updateDoc(d.ref, { status: s });
              }
            }}
            riderLocation={riderLocation}
            onAddCoupon={async (c) => { await addDoc(collection(db, 'coupons'), c); }}
            onDeleteCoupon={async (id) => { await deleteDoc(doc(db, 'coupons', id)); }}
            onUpdateStoreSettings={async (s) => { await setDoc(doc(db, 'settings', 'general'), s); }}
            onUpdatePromos={async (p) => { await updateDoc(doc(db, 'settings', 'general'), p); }}
            onAddOrder={handleAddOrder}
            foodRatings={foodRatings}
            customOffers={customOffers}
            complaints={complaints}
            onUpdateComplaint={async (id, status) => { await updateDoc(doc(db, 'complaints', id), { status }); }}
            onDeleteComplaint={async (id) => { await deleteDoc(doc(db, 'complaints', id)); }}
            onTestNotification={async () => {
                await addDoc(collection(db, 'test_notifications'), {
                    title: "Test Alert",
                    body: "This is a real-time test notification from your Admin Panel.",
                    createdAt: Date.now()
                });
            }}
            loyaltyAccounts={loyaltyAccounts}
            onAddLoyaltyAccount={async (phone, points) => { await addDoc(collection(db, 'loyalty'), { phone, points, lastUpdated: Date.now() }); }}
            onUpdateLoyaltyAccount={async (id, points) => { await updateDoc(doc(db, 'loyalty', id), { points, lastUpdated: Date.now() }); }}
          />
        } />
        <Route path="/kitchen" element={<KitchenPanel orders={orders} onUpdateOrderStatus={async (id: string, s: Order['status'], pm?: string, fid?: string) => { 
            try {
              const updates: any = { status: s };
              if (s === 'ready') updates.assignedAt = Date.now();
              if (fid) {
                await updateDoc(doc(db, 'orders', fid), updates);
              } else {
                const q = query(collection(db, 'orders'), where("id", "==", id)); 
                const snap = await getDocs(q); 
                for (const d of snap.docs) await updateDoc(d.ref, updates);
              }
            } catch(e) { console.error(e); }
        }} />} />
        <Route path="/delivery" element={<DeliveryPanel orders={orders} onUpdateOrderStatus={async (id: string, s: Order['status'], pm?: string, fid?: string) => {
            try {
              if (fid) await updateDoc(doc(db, 'orders', fid), { status: s });
              else {
                const q = query(collection(db, 'orders'), where("id", "==", id));
                const snap = await getDocs(q);
                for (const d of snap.docs) await updateDoc(d.ref, { status: s });
              }
            } catch(e) { console.error(e); }
        }} onUpdateRiderLocation={async (lat: number, lng: number) => { await setDoc(doc(db, 'tracking', 'rider1'), { lat, lng, timestamp: Date.now() }); }} deliveryUpiId={storeSettings.deliveryUpiId} />} />
        <Route path="/offers" element={<OffersPage isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive} flashSaleEndTime={promoSettings.flashSaleEndTime} happyHourStartTime={promoSettings.happyHourStartTime} happyHourEndTime={promoSettings.happyHourEndTime} customOffers={customOffers} />} />
        <Route path="/rewards" element={<RewardsPage loyaltyAccounts={loyaltyAccounts} onEnrollLoyalty={async (phone: string, name: string) => { await addDoc(collection(db, 'loyalty'), { phone, customerName: name, points: 0, lastUpdated: Date.now() }); }} />} />
        <Route path="/scream-challenge" element={<ScreamChallenge />} />
        <Route path="/feedback" element={<FeedbackModal />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/track" element={<div className="min-h-screen bg-stone-950 flex items-center justify-center"><p className="text-stone-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Tracker...</p></div>} />
        <Route path="/signage" element={
          <SignagePage 
            menuItems={menuItems} 
            dbCategories={dbCategories} 
            orders={orders}
            storeSettings={storeSettings}
            promoSettings={promoSettings}
            currentTime={currentTime}
          />
        } />
        <Route path="/predict" element={
          <Suspense fallback={<PredictPageFallback />}>
            <PredictPage />
          </Suspense>
        } />
        <Route path="/*" element={
          <div className="relative min-h-screen font-sans text-stone-200 overflow-x-hidden bg-stone-950">
            <Hero />
            <StoreStatusAlert isStoreOpen={isStoreOpen} startTime={storeSettings.startTime} endTime={storeSettings.endTime} />
            
            {/* Customer Scream Challenge Live Promo Banner - Temporarily Disabled
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 mb-4">
              <style>{`
                @keyframes btn-shimmer {
                  0% { transform: translateX(-100%) skewX(-15deg); }
                  100% { transform: translateX(200%) skewX(-15deg); }
                }
                .animate-btn-shimmer {
                  animation: btn-shimmer 3s infinite ease-in-out;
                }
              `}</style>
              <div 
                onClick={() => { setComingSoonTitle('Scream Challenge'); setShowComingSoon(true); }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-red-950/25 via-[#0c0c0c] to-stone-900/50 border border-red-500/20 hover:border-gold-500/50 transition-all duration-500 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_40px_rgba(239,68,68,0.06)] group p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-950/30 via-transparent to-gold-950/20 pointer-events-none z-0"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.12)_0%,_transparent_70%)] rounded-full pointer-events-none"></div>

                <div className="flex items-center gap-5 relative z-10 text-center md:text-left flex-col md:flex-row">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-red-600 via-orange-500 to-gold-500 flex items-center justify-center shrink-0 shadow-[0_12px_24px_rgba(239,68,68,0.3)] group-hover:scale-105 transition-transform duration-500 relative">
                    <div className="absolute inset-0 border border-white/20 rounded-3xl"></div>
                    <Flame size={28} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] mb-2.5">
                      Coming Soon
                    </div>
                    <h3 className="text-white text-xl md:text-2xl font-serif leading-tight">
                      Scream For <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 italic font-black">Shawarma!</span>
                    </h3>
                    <p className="text-stone-400 text-xs mt-1.5 max-w-md font-light leading-relaxed">
                      Scream at your screen to roast the virtual Chillies Shawarma spit and unlock up to <strong className="text-gold-400 font-bold">15% off</strong> your order instantly!
                    </p>
                  </div>
                </div>

                <div className="shrink-0 relative z-10 w-full md:w-auto">
                  <button className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-stone-950 font-black uppercase tracking-[0.25em] text-[10px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--brand-500-rgb,212,175,55),0.25)] hover:shadow-[0_0_35px_rgba(var(--brand-500-rgb,212,175,55),0.55)] transition-all duration-300 hover:scale-[1.04] active:scale-[0.97] relative overflow-hidden group/btn">
                    <div className="absolute top-0 bottom-0 left-0 w-12 bg-white/35 -translate-x-full animate-btn-shimmer blur-sm pointer-events-none z-0"></div>
                    
                    <span className="relative z-10 flex items-center gap-2 font-black">
                      Stay Tuned <ChevronRight size={14} className="group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
            */}

            {/* FIFA World Cup Predict & Win Banner */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4 mb-4">
              <div 
                onClick={() => { setComingSoonTitle('FIFA Predictor'); setShowComingSoon(true); }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-950/20 via-[#0c0c0c] to-stone-900/50 border border-emerald-500/20 hover:border-gold-500/50 transition-all duration-500 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_40px_rgba(16,185,129,0.04)] group p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6"
              >
                {/* Glowing decorative background meshes */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/30 via-transparent to-gold-950/20 pointer-events-none z-0"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12)_0%,_transparent_70%)] rounded-full pointer-events-none"></div>

                <div className="flex items-center gap-5 relative z-10 text-center md:text-left flex-col md:flex-row">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-500 to-gold-500 flex items-center justify-center shrink-0 shadow-[0_12px_24px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform duration-500 relative">
                    <div className="absolute inset-0 border border-white/20 rounded-3xl"></div>
                    <Trophy size={28} className="text-white animate-bounce-slow" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-amber-500 text-[9px] font-black uppercase tracking-[0.2em]">
                        Coming Soon
                      </div>
                      {votingCloseCountdown && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[9px] font-black uppercase tracking-wider animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          <Clock size={10} className="animate-spin-slow" />
                          {votingCloseCountdown}
                        </div>
                      )}
                    </div>
                    <h3 className="text-white text-xl md:text-2xl font-serif leading-tight">
                      Predict & Win <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 italic font-black">Free Rewards!</span>
                    </h3>
                    <p className="text-stone-400 text-xs mt-1.5 max-w-md font-light leading-relaxed">
                      Predict match outcomes for the upcoming FIFA World Cup. Top our leaderboard and win direct cash discounts, free meals, and exclusive chef specials!
                    </p>
                  </div>
                </div>

                <div className="shrink-0 relative z-10 w-full md:w-auto">
                  <button className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-stone-950 font-black uppercase tracking-[0.25em] text-[10px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_35px_rgba(212,175,55,0.55)] transition-all duration-300 hover:scale-[1.04] active:scale-[0.97] relative overflow-hidden group/btn">
                    <span className="relative z-10 flex items-center gap-2 font-black">
                      Stay Tuned <ChevronRight size={14} className="group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <ChefsChoice items={menuItems.filter(item => item.isChefChoice)} onAdd={addToCart} isFlashSaleActive={isFlashSaleActive} checkAvailability={checkAvailability} isStoreOpen={isStoreOpen} cartItems={cartItems} allMenuItems={menuItems} onShowSuggestion={setSuggestion} onViewAR={handleViewAR} />
            
            <section id="menu" className="pb-24 pt-12 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24">
              <div className="max-w-md mx-auto mb-12 px-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search menu..." className="w-full pl-12 pr-4 py-4 bg-stone-900 border border-stone-800 rounded-full text-white focus:border-brand-500 outline-none" />
              </div>

              <div className="flex overflow-x-auto gap-2 pb-8 scrollbar-hide">
                {orderedCats.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2 rounded-full border text-[10px] uppercase tracking-widest font-bold ${activeCategory === cat ? 'bg-brand-500 text-white' : 'border-stone-800 text-stone-500'}`}>{cat}</button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map((item, i) => (
                  <MenuItemCard key={item.id} item={item} onAdd={addToCart} index={i} isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive} isAvailable={checkAvailability(item.category).isAvailable} isStoreOpen={isStoreOpen} cartItems={cartItems} allMenuItems={menuItems} onShowSuggestion={setSuggestion} onViewAR={handleViewAR} />
                ))}
              </div>
              <div ref={observerTarget} className="h-20" />
            </section>
            <Footer onOpenAdmin={() => navigate('/admin')} onOpenTC={() => {}} />
          </div>
        } />
      </Routes>
      </Suspense>

      {!isAdminOpen && (
        <BottomNav 
          activeSection={activeSection}
          onOpenCart={() => setIsCartOpen(true)} onOpenTracker={() => setIsTrackerOpen(true)} 
          cartItemCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} 
        />
      )}

      <CartSidebar 
        isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems} 
        onUpdateQuantity={(id: string, delta: number) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0, i.quantity + delta)} : i).filter(i => i.quantity > 0))} 
        onRemove={(id: string) => setCartItems(prev => prev.filter(i => i.id !== id))} 
        onClearCart={() => setCartItems([])} onShowNotification={() => {}} 
        onAddOrder={handleAddOrder} 
        onTrackOrder={(id?: string) => { setIsCartOpen(false); if(id) setInitialTrackId(id); setIsTrackerOpen(true); }} 
        coupons={coupons} allMenuItems={menuItems} onAddToCart={addToCart} 
        loyaltyAccounts={loyaltyAccounts} storeSettings={storeSettings} 
      />
      <Suspense fallback={null}>
      <OrderTrackerModal isOpen={isTrackerOpen} onClose={() => { setIsTrackerOpen(false); setInitialTrackId(''); }} initialOrderId={initialTrackId} riderLocation={riderLocation} orders={orders} />
      </Suspense>
      {suggestion && <SmartSuggestion suggestion={suggestion} onAdd={addToCart} onClose={() => setSuggestion(null)} isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive} />}
      <Suspense fallback={null}>
      <ARViewerModal isOpen={!!arItem} onClose={() => setArItem(null)} itemName={arItem?.name || ''} modelUrl={arItem?.threeDModel} />
      </Suspense>
      
      {showInstallBanner && !isAdminOpen && (
        <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:w-[320px] bg-stone-900/90 backdrop-blur-xl border border-brand-500/30 rounded-3xl p-4 z-[99999] flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in-up">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                C
             </div>
             <div>
               <h4 className="text-white text-xs font-black uppercase tracking-widest">Chillies App</h4>
               <p className="text-stone-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">Fast-track ordering</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={handleInstallClick} 
                className="bg-brand-500 text-stone-950 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-400 active:scale-95 transition-all"
            >
                Install
            </button>
            <button 
                onClick={dismissInstallBanner}
                className="p-2 text-stone-600 hover:text-white transition-colors"
            >
                <X size={18} />
            </button>
          </div>
        </div>
      )}

      {showComingSoon && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowComingSoon(false)}>
          <div 
            className="w-full max-w-md bg-stone-900/90 border border-gold-500/30 rounded-[2.5rem] p-8 sm:p-10 text-center shadow-2xl relative" 
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowComingSoon(false)} className="absolute top-6 right-6 text-stone-600 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-gradient-to-br from-amber-600 via-yellow-500 to-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_12px_24px_rgba(212,175,55,0.25)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Sparkles className="text-stone-950 animate-pulse" size={32} />
            </div>
            <h3 className="text-2xl font-serif text-white mb-3 tracking-wide">
              {comingSoonTitle || 'Offers'} Coming Soon!
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-8">
              We are finalizing some exciting updates for you. This feature and its exclusive rewards will be live shortly. Stay tuned!
            </p>
            <button 
              onClick={() => setShowComingSoon(false)} 
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-stone-950 font-black py-4 rounded-xl uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all duration-300 shadow-lg active:scale-[0.97]"
            >
              Great, I'll Stay Tuned!
            </button>
          </div>
        </div>
      )}
    </React.Suspense>
  );
}

const Footer = ({ onOpenAdmin, onOpenTC }: any) => (
  <footer className="bg-stone-950 border-t border-white/5 py-12 px-4 text-center">
    <h2 className="font-serif text-2xl text-white mb-2">Chillies Restaurant</h2>
    <p className="text-stone-500 text-xs uppercase tracking-widest mb-8">Premium Dining Experience</p>
    <div className="flex justify-center gap-8 mb-8 text-[10px] uppercase tracking-widest font-bold text-stone-500">
      <button onClick={onOpenTC} className="hover:text-brand-500 transition-colors">Terms & Conditions</button>
    </div>
    <p className="text-stone-700 text-[10px]">&copy; 2026 Chillies Restaurant. All rights reserved.</p>
  </footer>
);

export default App;