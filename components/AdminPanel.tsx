import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, Plus, Trash2, Tag, List, 
  Settings, LayoutDashboard, Search, Trophy,
  Lock, LogOut, ShoppingBag, User, Clock, Copy, Check, Printer, Ticket, Zap, PartyPopper,
  ChefHat, Calendar, MapPin, Send, Timer, DollarSign, Image as ImageIcon, ChevronRight, TrendingUp, BarChart3,
  Layers, AlertTriangle, Scan, CameraOff, Edit2, Filter, EyeOff, Flame, SearchX, Camera, MessageCircle, Menu, Minus, Wallet, Star, ChevronUp, ChevronDown, Phone, Navigation, MessageSquare, Sparkles, Gift, Award, BellRing, VolumeX, Download, Smartphone, RefreshCw, Upload
} from 'lucide-react';
import { MenuItem, Order, Coupon, CategoryConfig, FoodRating, CustomOffer, LoyaltyAccount, Complaint } from '../types';
import { printThermalBill, printKOT, printNetworkKOT, discoverNetworkPrinters } from '../App';
import SafeImage from './SafeImage';
import { Html5Qrcode } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { MapContainer, TileLayer, Marker, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { messaging, db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
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

const renderAddressWithLinks = (address: string) => {
    if (!address) return null;
    const parts = address.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) => 
        part.match(/^https?:\/\//) ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-bold" onClick={(e) => e.stopPropagation()}>{part}</a>
        ) : (
            <span key={i}>{part}</span>
        )
    );
};

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  categories: CategoryConfig[];
  orders: Order[];
  coupons?: Coupon[];
  isStoreOpen: boolean;
  promoSettings: {
    isFlashSaleActive: boolean;
    flashSaleDate: string;
    flashSaleStartTime: string;
    flashSaleEndTime: string;
    isHappyHourActive: boolean;
    happyHourStartTime: string;
    happyHourEndTime: string;
  };
  storeSettings: { acceptingOrders: boolean; startTime: string; endTime: string; deliveryUpiId?: string; announcement?: string; isAnnouncementActive?: boolean; loyaltyPointsRatio?: number; minimumPointsToRedeem?: number; latestBroadcast?: { title: string; body: string; timestamp: number } | null; adminTokens?: string[]; kotPrinters?: {name: string, ip: string}[]; selectedTheme?: 'classic' | 'professional' };
  onAddItem: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onAddCategory: (category: string) => void;
  onUpdateCategory?: (category: CategoryConfig) => void;
  onDeleteCategory: (category: string) => void;
  onUpdateOrderStatus: (id: string, status: Order['status'], paymentMethod?: string, firestoreId?: string) => void;
  riderLocation?: {lat: number, lng: number, timestamp: number} | null;
  onAddCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (id: string) => void;
  onUpdateStoreSettings: (settings: { acceptingOrders: boolean; startTime: string; endTime: string; deliveryUpiId?: string; announcement?: string; isAnnouncementActive?: boolean; loyaltyPointsRatio?: number; minimumPointsToRedeem?: number; latestBroadcast?: { title: string; body: string; timestamp: number } | null; adminTokens?: string[]; kotPrinters?: {name: string, ip: string}[]; selectedTheme?: 'classic' | 'professional' }) => void;
  onUpdatePromos: (promos: any) => void;
  onAddOrder?: (order: Order) => Promise<void>;
  onTestNotification?: () => void;
  foodRatings?: FoodRating[];
  customOffers?: CustomOffer[];
  onAddCustomOffer?: (offer: CustomOffer) => void;
  onUpdateCustomOffer?: (offer: CustomOffer) => void;
  onDeleteCustomOffer?: (id: string) => void;
  onReorderCategory?: (direction: 'up' | 'down', index: number) => void;
  loyaltyAccounts?: LoyaltyAccount[];
  onAddLoyaltyAccount?: (phone: string, points: number) => Promise<void>;
  onUpdateLoyaltyAccount?: (id: string, points: number) => Promise<void>;
  complaints?: Complaint[];
  onUpdateComplaint?: (id: string, status: 'open' | 'resolved') => Promise<void>;
  onDeleteComplaint?: (id: string) => Promise<void>;
}

const BarcodeScanner: React.FC<{ onScan: (text: string) => void, onClose: () => void }> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startScanner = async () => {
    try {
      setIsReady(true);
      setError(null);
      scannerRef.current = new Html5Qrcode("scanner-target");
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            onScan(decodedText);
            scannerRef.current?.stop().catch(e => console.error(e));
          },
          () => {}
        );
      } catch (firstErr) {
        console.warn("Environment camera failed, trying fallback...", firstErr);
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          await scannerRef.current.start(
            devices[0].id,
            config,
            (decodedText: string) => {
              onScan(decodedText);
              scannerRef.current?.stop().catch(e => console.error(e));
            },
            () => {}
          );
        } else {
          throw new Error("No cameras found on this device.");
        }
      }
    } catch (err: any) {
      console.error("Scanner failed to start", err);
      setError(err.message || "Failed to access camera. Check permissions.");
      setIsReady(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(e => console.error(e));
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[300] bg-stone-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg aspect-square bg-stone-900 border border-gold-500 rounded-[3rem] overflow-hidden relative shadow-[0_0_50px_rgba(212,175,55,0.15)] flex items-center justify-center">
        {error ? (
          <div className="p-10 text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-950 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <CameraOff size={32} />
            </div>
            <h3 className="text-white font-serif text-xl mb-2">Camera Access Required</h3>
            <p className="text-stone-500 text-sm leading-relaxed mb-8">{error}</p>
            <button onClick={onClose} className="px-8 py-3 bg-stone-800 text-white rounded-xl font-bold uppercase tracking-widest text-xs">Dismiss</button>
          </div>
        ) : !isReady ? (
            <div className="flex flex-col items-center gap-6 p-10 text-center">
                <div className="w-20 h-20 bg-stone-950 rounded-full flex items-center justify-center text-gold-500 mb-2 border border-gold-500">
                    <Camera size={32} />
                </div>
                <div>
                    <h3 className="text-white font-serif text-2xl mb-2">Initialize Scanner</h3>
                    <p className="text-stone-500 text-sm max-w-xs mx-auto">Click below to grant camera access and start scanning order codes.</p>
                </div>
                <button 
                    onClick={startScanner}
                    className="px-10 py-4 bg-gold-500 text-stone-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-gold-400 transition-all active:scale-95"
                >
                    Start Camera
                </button>
            </div>
        ) : (
          <>
            <div id="scanner-target" className="w-full h-full"></div>
            <div className="absolute inset-0 border-[2px] border-stone-800 pointer-events-none rounded-[3rem]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-gold-500 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-gold-500 absolute top-1/2 animate-pulse"></div>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-12 flex flex-col items-center gap-6">
          {isReady && !error && <p className="text-gold-500 font-serif text-lg tracking-widest uppercase">Align Code within Frame</p>}
          <button onClick={onClose} className="px-12 py-4 border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all">Cancel Scan</button>
      </div>
    </div>
  );
};

const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen, onClose, items, categories, orders, coupons = [], customOffers = [], foodRatings = [], isStoreOpen, promoSettings, storeSettings, riderLocation,
  onAddItem, onUpdateItem, onDeleteItem, onAddCategory, onUpdateCategory, onDeleteCategory, onUpdateOrderStatus,
  onAddCoupon, onDeleteCoupon, onAddCustomOffer, onUpdateCustomOffer, onDeleteCustomOffer, onReorderCategory, onUpdateStoreSettings, onUpdatePromos, onAddOrder,
  loyaltyAccounts, onAddLoyaltyAccount, onUpdateLoyaltyAccount, onTestNotification,
  complaints = [], onUpdateComplaint, onDeleteComplaint
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('chillies_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'items' | 'categories' | 'coupons' | 'promotions' | 'reviews' | 'payment' | 'settings' | 'loyalty' | 'complaints' | 'predictions'>('dashboard');
  
  // FIFA predictions states
  const [worldCupMatches, setWorldCupMatches] = useState<any[]>([]);
  const [isMatchFormOpen, setIsMatchFormOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [matchTeamA, setMatchTeamA] = useState('');
  const [matchTeamB, setMatchTeamB] = useState('');
  const [matchTeamAFlag, setMatchTeamAFlag] = useState('🇧🇷');
  const [matchTeamBFlag, setMatchTeamBFlag] = useState('🇭🇷');
  const [matchDateInput, setMatchDateInput] = useState('');
  const [matchTimeInput, setMatchTimeInput] = useState('');
  const [matchStatusInput, setMatchStatusInput] = useState<'upcoming' | 'live' | 'finished'>('upcoming');
  const [matchWinnerInput, setMatchWinnerInput] = useState<'teamA' | 'teamB' | 'draw' | ''>('');
  const [matchVotesTeamA, setMatchVotesTeamA] = useState(0);
  const [matchVotesTeamB, setMatchVotesTeamB] = useState(0);
  const [matchVotesDraw, setMatchVotesDraw] = useState(0);
  const [luckyWinnerMatchId, setLuckyWinnerMatchId] = useState<string | null>(null);
  const [luckyWinnerPhone, setLuckyWinnerPhone] = useState<string | null>(null);
  const [isDrawingLuckyWinner, setIsDrawingLuckyWinner] = useState<Record<string, boolean>>({});
  const [viewingVotersMatch, setViewingVotersMatch] = useState<any | null>(null);
  const [votersList, setVotersList] = useState<any[]>([]);
  const [isLoadingVoters, setIsLoadingVoters] = useState(false);
  const [isSyncingMatches, setIsSyncingMatches] = useState(false);

  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isOfferFormOpen, setIsOfferFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<CustomOffer> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStage, setOrderStage] = useState<'new' | 'active' | 'history'>('new');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'Cash' | 'UPI'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRiderMapOpen, setIsRiderMapOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponVal, setNewCouponVal] = useState(0);
  const [loyaltySearchPhone, setLoyaltySearchPhone] = useState('');
  const [openingCountdown, setOpeningCountdown] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [manualOrderItems, setManualOrderItems] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualContact, setManualContact] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualOrderType, setManualOrderType] = useState<'delivery'|'pickup'>('pickup');
  const [manualDeliveryCharge, setManualDeliveryCharge] = useState(20);
  const [manualOrderSearch, setManualOrderSearch] = useState('');

  const [pushTitle, setPushTitle] = useState('Chillies Update');
  const [pushBody, setPushBody] = useState('We have some exciting news for you. Open the app to see!');
  
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterIp, setNewPrinterIp] = useState('');
  const [isScanningPrinters, setIsScanningPrinters] = useState(false);

  const [isRinging, setIsRinging] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  // Marketing Poster Generator States
  const [posterTitle, setPosterTitle] = useState('Spicy Shawarma Deal');
  const [posterSubtitle, setPosterSubtitle] = useState('Freshly Grilled & Roasted Daily');
  const [posterBadgeText, setPosterBadgeText] = useState('15% OFF');
  const [posterTheme, setPosterTheme] = useState<'lava' | 'gold' | 'midnight'>('lava');
  const [posterFormat, setPosterFormat] = useState<'square' | 'story'>('square');
  const [selectedPosterItemId, setSelectedPosterItemId] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState('Premium delicious Shawarma wrap with sizzling red hot fire embers');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [posterBgImage, setPosterBgImage] = useState<string>('');

  const handleDownloadPoster = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isSquare = posterFormat === 'square';
    const width = 1080;
    const height = isSquare ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;

    const drawContent = () => {
      // 2. Draw Premium Border
      ctx.strokeStyle = posterTheme === 'gold' ? '#d4af37' : '#ef4444';
      ctx.lineWidth = 16;
      ctx.strokeRect(24, 24, width - 48, height - 48);

      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // 3. Draw Brand Name "CHILLIES RESTAURANT"
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '8px';
      ctx.fillText('CHILLIES RESTAURANT', width / 2, 120);

      // 4. Draw Poster Title
      ctx.fillStyle = posterTheme === 'gold' ? '#d4af37' : '#ef4444';
      ctx.font = 'italic bold 72px Georgia, serif';
      ctx.fillText(posterTitle.toUpperCase(), width / 2, height * 0.28);

      // 5. Draw Poster Subtitle
      ctx.fillStyle = '#a8a29e';
      ctx.font = '32px sans-serif';
      ctx.fillText(posterSubtitle, width / 2, height * 0.34);

      // 6. Draw main item details or badge
      ctx.fillStyle = posterTheme === 'gold' ? '#d4af37' : '#ef4444';
      ctx.beginPath();
      ctx.arc(width/2, height * 0.52, 140, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#050505';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText(posterBadgeText.toUpperCase(), width / 2, height * 0.52 + 10);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('LIMITED TIME', width / 2, height * 0.52 + 50);

      // 7. If there is a featured item selected
      const featuredItem = items.find(item => item.id === selectedPosterItemId);
      if (featuredItem) {
         ctx.fillStyle = '#ffffff';
         ctx.font = 'bold 44px Georgia, serif';
         ctx.fillText(featuredItem.name.toUpperCase(), width / 2, height * 0.72);

         ctx.fillStyle = posterTheme === 'gold' ? '#d4af37' : '#ef4444';
         ctx.font = 'bold 36px monospace';
         ctx.fillText(`JUST R${featuredItem.price}/-`, width / 2, height * 0.77);
      }

      // 8. Draw Call to Action
      ctx.fillStyle = '#ffffff';
      ctx.font = '30px sans-serif';
      ctx.fillText('ORDER NOW VIA WHATSAPP', width / 2, height * 0.88);

      ctx.fillStyle = posterTheme === 'gold' ? '#d4af37' : '#ef4444';
      ctx.font = 'bold 36px monospace';
      ctx.fillText('+91 83010 32794', width / 2, height * 0.92);

      // Trigger Download
      const link = document.createElement('a');
      link.download = `chillies_poster_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    if (posterBgImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Draw background image scaled to fill
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > canvasRatio) {
          drawWidth = height * imgRatio;
          offsetX = (width - drawWidth) / 2;
        } else {
          drawHeight = width / imgRatio;
          offsetY = (height - drawHeight) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Radial dark shadow overlay so text is highly legible
        const overlay = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width * 0.8);
        overlay.addColorStop(0, 'rgba(5, 5, 5, 0.45)');
        overlay.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, height);

        drawContent();
      };
      img.src = posterBgImage;
    } else {
      // 1. Draw Background Gradient
      const grad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width * 0.8);
      if (posterTheme === 'lava') {
        grad.addColorStop(0, '#2b0707');
        grad.addColorStop(1, '#050101');
      } else if (posterTheme === 'gold') {
        grad.addColorStop(0, '#1c1507');
        grad.addColorStop(1, '#070502');
      } else { // midnight
        grad.addColorStop(0, '#111111');
        grad.addColorStop(1, '#000000');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      drawContent();
    }
  };
  const [latestNewOrderId, setLatestNewOrderId] = useState<string | null>(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [orderMessages, setOrderMessages] = useState<any[]>([]);
  
  const prevPendingCountRef = useRef(orders.filter(o => o.status === 'pending').length);
  const prevOpenComplaintsCountRef = useRef((complaints || []).filter(c => c.status === 'open').length);
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const currentOpenCount = (complaints || []).filter(c => c.status === 'open').length;
    if (currentOpenCount > prevOpenComplaintsCountRef.current) {
        // Trigger alert for new complaint. The other useEffect handles actual audio play based on `isRinging`
        setIsRinging(true);
    }
    prevOpenComplaintsCountRef.current = currentOpenCount;
  }, [complaints, audioBlocked]);

  useEffect(() => {
      const pendingOrders = orders.filter(o => o.status === 'pending');
      const currentPendingCount = pendingOrders.length;
      
      if (currentPendingCount > prevPendingCountRef.current) {
          setIsRinging(true);
          const oldestPending = pendingOrders[pendingOrders.length - 1];
          setLatestNewOrderId(oldestPending.id);
      } else if (currentPendingCount === 0) {
          setIsRinging(false);
          setLatestNewOrderId(null);
      }
      
      prevPendingCountRef.current = currentPendingCount;
  }, [orders]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  useEffect(() => {
      if (isRinging) {
         if (!ringAudioRef.current) {
            ringAudioRef.current = new Audio('/notification.mp3');
            ringAudioRef.current.loop = true;
            ringAudioRef.current.volume = 1.0;
         }
         const playPromise = ringAudioRef.current.play();
         if (playPromise !== undefined) {
            playPromise.then(() => setAudioBlocked(false)).catch(e => {
                console.log("Audio play failed:", e);
                setAudioBlocked(true);
            });
         }
      } else {
         if (ringAudioRef.current) {
            ringAudioRef.current.pause();
            ringAudioRef.current.currentTime = 0;
            setAudioBlocked(false);
         }
      }
  }, [isRinging]);

  useEffect(() => {
    if (isStoreOpen) {
        setOpeningCountdown('');
        return;
    }
    const timer = setInterval(() => {
        const now = new Date();
        const [startH, startM] = storeSettings.startTime.split(':').map(Number);
        let openingTime = new Date();
        openingTime.setHours(startH, startM, 0, 0);
        if (now > openingTime) openingTime.setDate(openingTime.getDate() + 1);
        const diff = openingTime.getTime() - now.getTime();
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setOpeningCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStoreOpen, storeSettings.startTime]);

  const stats = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRev = deliveredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const deliveredCount = deliveredOrders.length;
    
    // Preparation Time Analytics (Time from pending to ready)
    const preppedOrders = orders.filter(o => o.assignedAt && o.createdAt);
    const totalPrepTime = preppedOrders.reduce((acc, o) => {
        const prepTime = Math.max(0, (o.assignedAt! - o.createdAt) / (1000 * 60)); 
        return acc + prepTime;
    }, 0);
    const avgPrepTime = preppedOrders.length ? Math.round(totalPrepTime / preppedOrders.length) : 0;

    // Daily Revenue (Last 7 days) - Includes all non-cancelled orders for the trend
    const dailyRevData: Record<string, number> = {};
    const today = new Date();
    
    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayKey = d.toLocaleDateString('en-US', { weekday: 'short' });
        dailyRevData[dayKey] = 0;
    }
    
    validOrders.forEach(o => {
        const orderDate = new Date(o.createdAt);
        const dayKey = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (dailyRevData[dayKey] !== undefined) {
            // Check if it's within the last 7 days
            const diffTime = Math.abs(today.getTime() - orderDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                dailyRevData[dayKey] += (o.total || 0);
            }
        }
    });

    // Busy Hours (All valid orders)
    const hourStats = Array(24).fill(0);
    validOrders.forEach(o => {
        const hour = new Date(o.createdAt).getHours();
        if (hour >= 0 && hour < 24) {
            hourStats[hour]++;
        }
    });

    return {
      totalItems: items.length,
      totalOrders: orders.length,
      deliveredOrders: deliveredCount,
      totalRevenue: totalRev,
      avgOrderValue: deliveredCount ? Math.round(totalRev / deliveredCount) : 0,
      avgPrepTime,
      dailyRev: Object.entries(dailyRevData).reverse(),
      busyHours: hourStats
    };
  }, [items, orders]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = inventoryStatusFilter === 'all' || 
                           (inventoryStatusFilter === 'available' && !item.isUnavailable) ||
                           (inventoryStatusFilter === 'unavailable' && item.isUnavailable);
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchTerm, inventoryStatusFilter, categoryFilter]);

  const filteredOrders = useMemo(() => {
    const searchActive = orderSearch.trim() !== '';
    return orders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
                             order.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                             order.contactNumber.includes(orderSearch);
        
        let matchesPayment = true;
        if (orderStage === 'history' && paymentFilter !== 'all') {
            matchesPayment = order.paymentMethod === paymentFilter;
        }

        if (searchActive) {
            return matchesSearch && matchesPayment;
        }

        if (!matchesSearch) return false;
        if (!matchesPayment) return false;

        if (orderStage === 'new') return order.status === 'pending';
        if (orderStage === 'active') return ['preparing', 'ready', 'out_for_delivery'].includes(order.status);
        if (orderStage === 'history') return ['delivered', 'cancelled'].includes(order.status);
        return false;
    });
  }, [orders, orderStage, orderSearch, paymentFilter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin123') {
        localStorage.setItem('chillies_admin_auth', 'true');
        setIsAuthenticated(true);
        setAuthError(false);
        setPasswordInput('');
    } else {
        setAuthError(true);
    }
  };

  const downloadExcelReport = () => {
    const data = orders.map(o => ({
      'Order ID': o.id,
      'Date': o.date,
      'Time': o.timestamp,
      'Customer': o.customerName,
      'Contact': o.contactNumber,
      'Type': o.type,
      'Status': o.status,
      'Total (₹)': o.total,
      'Payment': o.paymentMethod || 'N/A',
      'Items': o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, `Chillies_Report_${new Date().toLocaleDateString()}.xlsx`);
  };

  const sendChatMessage = async (orderId: string) => {
    if (!chatMessage.trim()) return;
    const q = query(collection(db, 'orders'), where("id", "==", orderId));
    const snap = await getDocs(q);
    if (!snap.empty) {
        const orderDoc = snap.docs[0];
        const messages = orderDoc.data().messages || [];
        await updateDoc(orderDoc.ref, {
            messages: [...messages, {
                text: chatMessage,
                sender: 'admin',
                timestamp: Date.now()
            }]
        });
        setChatMessage('');
    }
  };

  useEffect(() => {
    if (!activeChatOrderId) return;
    const q = query(collection(db, 'orders'), where("id", "==", activeChatOrderId));
    const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
            setOrderMessages(snap.docs[0].data().messages || []);
        }
    });
    return () => unsub();
  }, [activeChatOrderId]);

  useEffect(() => {
    const q = query(collection(db, 'worldcup_matches'));
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      fetched.sort((a, b) => {
        const dateTimeA = new Date(`${a.matchDate}T${a.matchTime || '00:00'}`).getTime();
        const dateTimeB = new Date(`${b.matchDate}T${b.matchTime || '00:00'}`).getTime();
        return dateTimeA - dateTimeB;
      });
      setWorldCupMatches(fetched);
    });
    return () => unsub();
  }, []);

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchTeamA || !matchTeamB || !matchDateInput || !matchTimeInput) {
      alert("Please fill in all match details.");
      return;
    }

    const matchData: any = {
      teamA: matchTeamA.trim(),
      teamB: matchTeamB.trim(),
      teamAFlag: matchTeamAFlag.trim() || '🏳️',
      teamBFlag: matchTeamBFlag.trim() || '🏳️',
      matchDate: matchDateInput,
      matchTime: matchTimeInput,
      status: matchStatusInput,
      winner: matchWinnerInput || null,
      createdAt: editingMatch ? (editingMatch.createdAt || Date.now()) : Date.now()
    };

    if (editingMatch) {
      matchData.votesTeamA = Number(matchVotesTeamA) || 0;
      matchData.votesTeamB = Number(matchVotesTeamB) || 0;
      matchData.votesDraw = Number(matchVotesDraw) || 0;
    }

    try {
      if (editingMatch && editingMatch.id) {
        await updateDoc(doc(db, 'worldcup_matches', editingMatch.id), matchData);
        alert("Match updated successfully!");
      } else {
        await addDoc(collection(db, 'worldcup_matches'), {
          ...matchData,
          votesTeamA: 0,
          votesTeamB: 0,
          votesDraw: 0
        });
        alert("Match created successfully!");
      }
      setIsMatchFormOpen(false);
      resetMatchForm();
    } catch (err) {
      console.error("Error saving match:", err);
      alert("Failed to save match.");
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (confirm("Are you sure you want to delete this match? All predictions for this match will become dangling.")) {
      try {
        await deleteDoc(doc(db, 'worldcup_matches', id));
        alert("Match deleted.");
      } catch (err) {
        console.error("Error deleting match:", err);
      }
    }
  };

  const handleDeleteAllMatches = async () => {
    if (confirm("WARNING: Are you sure you want to delete ALL matches? This action cannot be undone!")) {
      try {
        const querySnapshot = await getDocs(collection(db, 'worldcup_matches'));
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        alert("All matches deleted successfully.");
      } catch (err) {
        console.error("Error deleting all matches:", err);
        alert("Failed to delete all matches.");
      }
    }
  };

  const handleDrawLuckyWinner = async (match: any) => {
    if (!match.winner) {
      alert("Please declare a match winner first!");
      return;
    }
    
    setIsDrawingLuckyWinner(prev => ({ ...prev, [match.id]: true }));
    try {
      const q = query(
        collection(db, 'worldcup_predictions'),
        where('matchId', '==', match.id),
        where('predictedWinner', '==', match.winner)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        alert("No correct predictions found for this match!");
        return;
      }
      
      const correctPreds = snap.docs.map(doc => doc.data());
      const randomIdx = Math.floor(Math.random() * correctPreds.length);
      const chosen = correctPreds[randomIdx];
      
      // Update match document in Firestore to persist
      await updateDoc(doc(db, 'worldcup_matches', match.id), {
        luckyWinnerPhone: chosen.phone,
        luckyWinnerName: chosen.name || 'Anonymous'
      });
      
      setLuckyWinnerMatchId(match.id);
      setLuckyWinnerPhone(chosen.phone);
    } catch (err) {
      console.error("Error drawing lucky winner:", err);
      alert("Failed to draw lucky winner.");
    } finally {
      setIsDrawingLuckyWinner(prev => ({ ...prev, [match.id]: false }));
    }
  };

  const handleViewVoters = async (match: any) => {
    setViewingVotersMatch(match);
    setIsLoadingVoters(true);
    setVotersList([]);
    try {
      const q = query(collection(db, 'worldcup_predictions'), where('matchId', '==', match.id));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          phone: data.phone,
          name: data.name || 'Anonymous',
          billNumber: data.billNumber || 'N/A',
          predictedWinner: data.predictedWinner,
          createdAt: data.createdAt
        };
      });
      // Sort by date newest first
      fetched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setVotersList(fetched);
    } catch (err) {
      console.error("Error fetching voters list:", err);
      alert("Failed to load voters list.");
    } finally {
      setIsLoadingVoters(false);
    }
  };

  const handleSyncMatchesFromAPI = async () => {
    setIsSyncingMatches(true);
    try {
      let response = await fetch('https://raw.githubusercontent.com/openfootball/world-cup.json/master/2026/worldcup.json');
      if (!response.ok) {
        response = await fetch('https://raw.githubusercontent.com/openfootball/world-cup.json/master/2022/worldcup.json');
      }
      if (!response.ok) {
        response = await fetch('https://raw.githubusercontent.com/openfootball/world-cup.json/master/2018/worldcup.json');
      }
      const data = await response.json();
      
      const getTeamFlag = (teamName: string): string => {
        const flags: Record<string, string> = {
          'Russia': '🇷🇺', 'Saudi Arabia': '🇸🇦', 'Egypt': '🇪🇬', 'Uruguay': '🇺🇾',
          'Portugal': '🇵🇹', 'Spain': '🇪🇸', 'Morocco': '🇲🇦', 'Iran': '🇮🇷',
          'France': '🇫🇷', 'Australia': '🇦🇺', 'Peru': '🇵🇪', 'Denmark': '🇩🇰',
          'Argentina': '🇦🇷', 'Iceland': '🇮🇸', 'Croatia': '🇭🇷', 'Nigeria': '🇳🇬',
          'Brazil': '🇧🇷', 'Switzerland': '🇨🇭', 'Costa Rica': '🇨🇷', 'Serbia': '🇷🇸',
          'Germany': '🇩🇪', 'Mexico': '🇲🇽', 'Sweden': '🇸🇪', 'South Korea': '🇰🇷',
          'Belgium': '🇧🇪', 'Panama': '🇵🇦', 'Tunisia': '🇹🇳', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          'Poland': '🇵🇱', 'Senegal': '🇸🇳', 'Colombia': '🇨🇴', 'Japan': '🇯🇵',
          'Qatar': '🇶🇦', 'Ecuador': '🇪🇨', 'Netherlands': '🇳🇱', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
          'USA': '🇺🇸', 'United States': '🇺🇸', 'Canada': '🇨🇦', 'Ghana': '🇬🇭', 'Cameroon': '🇨🇲',
          'South Africa': '🇿🇦', 'Czech Republic': '🇨🇿', 'Czechia': '🇨🇿',
          'Bosnia & Herzegovina': '🇧🇦', 'Bosnia and Herzegovina': '🇧🇦',
          'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Haiti': '🇭🇹', 'Paraguay': '🇵🇾',
          'Turkey': '🇹🇷', 'Türkiye': '🇹🇷', 'Ivory Coast': '🇨🇮', 'Curaçao': '🇨🇼',
          'New Zealand': '🇳🇿', 'Cape Verde': '🇨🇻', 'Norway': '🇳🇴', 'Iraq': '🇮🇶',
          'Austria': '🇦🇹', 'Algeria': '🇩🇿', 'Jordan': '🇯🇴', 'Uzbekistan': '🇺🇿',
          'DR Congo': '🇨🇩'
        };
        return flags[teamName] || '🏳️';
      };

      let addedCount = 0;
      let matchesToProcess: any[] = [];

      if (data.name && data.name.includes("2026")) {
        const groupsData = [
          { name: 'Group A', teams: ['Mexico', 'South Africa', 'South Korea', 'Czech Republic'] },
          { name: 'Group B', teams: ['Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland'] },
          { name: 'Group C', teams: ['Brazil', 'Morocco', 'Scotland', 'Haiti'] },
          { name: 'Group D', teams: ['United States', 'Paraguay', 'Australia', 'Turkey'] },
          { name: 'Group E', teams: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'] },
          { name: 'Group F', teams: ['Netherlands', 'Japan', 'Tunisia', 'Sweden'] },
          { name: 'Group G', teams: ['Belgium', 'Iran', 'Egypt', 'New Zealand'] },
          { name: 'Group H', teams: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'] },
          { name: 'Group I', teams: ['France', 'Senegal', 'Norway', 'Iraq'] },
          { name: 'Group J', teams: ['Argentina', 'Austria', 'Algeria', 'Jordan'] },
          { name: 'Group K', teams: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'] },
          { name: 'Group L', teams: ['England', 'Croatia', 'Panama', 'Ghana'] }
        ];

        const generatedMatches: any[] = [];
        groupsData.forEach((g, gIdx) => {
          const [t1, t2, t3, t4] = g.teams;
          
          const r1Offset = Math.floor(gIdx / 3); 
          const r2Offset = Math.floor(gIdx / 3); 
          const r3Offset = Math.floor(gIdx / 3); 

          const r1Date = `2026-06-${11 + r1Offset}`;
          const r2Date = `2026-06-${18 + r2Offset}`;
          const r3Date = `2026-06-${24 + r3Offset}`;

          generatedMatches.push(
            { round: 'Matchday 1', date: r1Date, time: '16:00', team1: t1, team2: t2, group: g.name },
            { round: 'Matchday 1', date: r1Date, time: '20:00', team1: t3, team2: t4, group: g.name },
            { round: 'Matchday 2', date: r2Date, time: '16:00', team1: t1, team2: t3, group: g.name },
            { round: 'Matchday 2', date: r2Date, time: '20:00', team1: t4, team2: t2, group: g.name },
            { round: 'Matchday 3', date: r3Date, time: '16:00', team1: t4, team2: t1, group: g.name },
            { round: 'Matchday 3', date: r3Date, time: '20:00', team1: t2, team2: t3, group: g.name }
          );
        });

        matchesToProcess = generatedMatches;
      } else {
        if (Array.isArray(data.matches)) {
          matchesToProcess = data.matches;
        } else if (Array.isArray(data.rounds)) {
          for (const round of data.rounds) {
            if (Array.isArray(round.matches)) {
              matchesToProcess.push(...round.matches);
            }
          }
        }
      }

      for (const m of matchesToProcess) {
        const date = m.date;
        const time = m.time || '18:00';
        
        const teamA = typeof m.team1 === 'string' ? m.team1 : m.team1?.name;
        const teamB = typeof m.team2 === 'string' ? m.team2 : m.team2?.name;
        
        if (!teamA || !teamB) continue;

        const exists = worldCupMatches.some(ex => 
          ex.teamA === teamA && 
          ex.teamB === teamB && 
          ex.matchDate === date
        );
        
        if (!exists) {
          await addDoc(collection(db, 'worldcup_matches'), {
            teamA,
            teamB,
            teamAFlag: getTeamFlag(teamA),
            teamBFlag: getTeamFlag(teamB),
            matchDate: date,
            matchTime: time,
            status: 'upcoming',
            winner: null,
            votesTeamA: 0,
            votesTeamB: 0,
            votesDraw: 0,
            createdAt: Date.now()
          });
          addedCount++;
        }
      }
      
      alert(`Synchronized successfully! Imported ${addedCount} new match fixtures.`);
    } catch (err) {
      console.error("Error syncing matches:", err);
      alert("Failed to sync matches from football API.");
    } finally {
      setIsSyncingMatches(false);
    }
  };

  const handleUploadJSONMatches = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const data = JSON.parse(text);
        
        const getTeamFlag = (teamName: string): string => {
          const flags: Record<string, string> = {
            'Russia': '🇷🇺', 'Saudi Arabia': '🇸🇦', 'Egypt': '🇪🇬', 'Uruguay': '🇺🇾',
            'Portugal': '🇵🇹', 'Spain': '🇪🇸', 'Morocco': '🇲🇦', 'Iran': '🇮🇷',
            'France': '🇫🇷', 'Australia': '🇦🇺', 'Peru': '🇵🇪', 'Denmark': '🇩🇰',
            'Argentina': '🇦🇷', 'Iceland': '🇮🇸', 'Croatia': '🇭🇷', 'Nigeria': '🇳🇬',
            'Brazil': '🇧🇷', 'Switzerland': '🇨🇭', 'Costa Rica': '🇨🇷', 'Serbia': '🇷🇸',
            'Germany': '🇩🇪', 'Mexico': '🇲🇽', 'Sweden': '🇸🇪', 'South Korea': '🇰🇷',
            'Belgium': '🇧🇪', 'Panama': '🇵🇦', 'Tunisia': '🇹🇳', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
            'Poland': '🇵🇱', 'Senegal': '🇸🇳', 'Colombia': '🇨🇴', 'Japan': '🇯🇵',
            'Qatar': '🇶🇦', 'Ecuador': '🇪🇨', 'Netherlands': '🇳🇱', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
            'USA': '🇺🇸', 'United States': '🇺🇸', 'Canada': '🇨🇦', 'Ghana': '🇬🇭', 'Cameroon': '🇨🇲',
            'South Africa': '🇿🇦', 'Czech Republic': '🇨🇿', 'Czechia': '🇨🇿',
            'Bosnia & Herzegovina': '🇧🇦', 'Bosnia and Herzegovina': '🇧🇦',
            'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Haiti': '🇭🇹', 'Paraguay': '🇵🇾',
            'Turkey': '🇹🇷', 'Türkiye': '🇹🇷', 'Ivory Coast': '🇨🇮', 'Curaçao': '🇨🇼',
            'New Zealand': '🇳🇿', 'Cape Verde': '🇨🇻', 'Norway': '🇳🇴', 'Iraq': '🇮🇶',
            'Austria': '🇦🇹', 'Algeria': '🇩🇿', 'Jordan': '🇯🇴', 'Uzbekistan': '🇺🇿',
            'DR Congo': '🇨🇩'
          };
          return flags[teamName] || '🏳️';
        };

        let matchesToProcess: any[] = [];
        if (Array.isArray(data)) {
          matchesToProcess = data;
        } else if (Array.isArray(data.matches)) {
          matchesToProcess = data.matches;
        } else if (Array.isArray(data.rounds)) {
          for (const round of data.rounds) {
            if (Array.isArray(round.matches)) {
              matchesToProcess.push(...round.matches);
            }
          }
        }

        let addedCount = 0;
        for (const m of matchesToProcess) {
          const teamA = m.teamA || (typeof m.team1 === 'string' ? m.team1 : m.team1?.name);
          const teamB = m.teamB || (typeof m.team2 === 'string' ? m.team2 : m.team2?.name);
          const date = m.matchDate || m.date;
          const time = m.matchTime || m.time || '18:00';
          
          if (!teamA || !teamB || !date) continue;

          const exists = worldCupMatches.some(ex => 
            ex.teamA === teamA && 
            ex.teamB === teamB && 
            ex.matchDate === date
          );

          if (!exists) {
            await addDoc(collection(db, 'worldcup_matches'), {
              teamA,
              teamB,
              teamAFlag: m.teamAFlag || getTeamFlag(teamA),
              teamBFlag: m.teamBFlag || getTeamFlag(teamB),
              matchDate: date,
              matchTime: time,
              status: m.status || 'upcoming',
              winner: m.winner || null,
              votesTeamA: m.votesTeamA || 0,
              votesTeamB: m.votesTeamB || 0,
              votesDraw: m.votesDraw || 0,
              createdAt: Date.now()
            });
            addedCount++;
          }
        }

        alert(`Successfully imported ${addedCount} matches from JSON file!`);
      } catch (err) {
        console.error("JSON parsing error:", err);
        alert("Failed to parse JSON file. Ensure it is a valid match fixtures file.");
      }
    };
    reader.readAsText(file);
  };

  const maskPhone = (ph: string) => {
    if (!ph || ph.length < 4) return ph || '';
    return `${ph.slice(0, 2)}*****${ph.slice(-3)}`;
  };

  const resetMatchForm = () => {
    setMatchTeamA('');
    setMatchTeamB('');
    setMatchTeamAFlag('🇧🇷');
    setMatchTeamBFlag('🇭🇷');
    setMatchDateInput('');
    setMatchTimeInput('');
    setMatchStatusInput('upcoming');
    setMatchWinnerInput('');
    setMatchVotesTeamA(0);
    setMatchVotesTeamB(0);
    setMatchVotesDraw(0);
    setEditingMatch(null);
  };

  const openNewMatchModal = () => {
    resetMatchForm();
    setIsMatchFormOpen(true);
    // Scroll to form smoothly
    setTimeout(() => {
      const el = document.getElementById('match-form-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const openEditMatchModal = (match: any) => {
    setEditingMatch(match);
    setMatchTeamA(match.teamA || '');
    setMatchTeamB(match.teamB || '');
    setMatchTeamAFlag(match.teamAFlag || '🏳️');
    setMatchTeamBFlag(match.teamBFlag || '🏳️');
    setMatchDateInput(match.matchDate || '');
    setMatchTimeInput(match.matchTime || '');
    setMatchStatusInput(match.status || 'upcoming');
    setMatchWinnerInput(match.winner || '');
    setMatchVotesTeamA(match.votesTeamA || 0);
    setMatchVotesTeamB(match.votesTeamB || 0);
    setMatchVotesDraw(match.votesDraw || 0);
    setIsMatchFormOpen(true);
    
    // Scroll to form smoothly
    setTimeout(() => {
      const el = document.getElementById('match-form-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleStatusChange = async (order: Order, newStatus: Order['status'], paymentMethod?: string) => {
    onUpdateOrderStatus(order.id, newStatus, undefined, order.firestoreId);
  };

  const copyOrderBrief = (order: Order) => {
    const brief = `Order: #${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}\nItems: ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`;
    navigator.clipboard.writeText(brief);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openNewItemModal = (name = '') => {
      setEditingItem({ 
          name: name, 
          description: '', 
          price: 0, 
          category: categories[0]?.name || 'Starters', 
          image: '', 
          isFlashSale: false, 
          isHappyHour: false, 
          isChefChoice: false, 
          isExclusive: false, 
          spicyLevel: 'none' 
      });
      setIsItemFormOpen(true);
  };

  const handleDrop = (sourceId: string, targetId: string) => {
    const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const sourceIndex = sorted.findIndex(i => i.id === sourceId);
    const targetIndex = sorted.findIndex(i => i.id === targetId);
    
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const newSorted = [...sorted];
    const [movedItem] = newSorted.splice(sourceIndex, 1);
    newSorted.splice(targetIndex, 0, movedItem);

    newSorted.forEach((item, index) => {
        if (item.sortOrder !== index) {
            onUpdateItem({ ...item, sortOrder: index } as MenuItem);
        }
    });
  };

  const handleExit = () => {
    onClose();
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950 p-4" onClick={onClose}>
        <div className="w-full max-w-md bg-stone-900 border border-gold-500 rounded-3xl p-10 text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-6 right-6 text-stone-600 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-stone-950 border border-gold-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-gold-500" />
          </div>
          <h2 className="text-2xl font-serif text-white mb-6">Chillies HQ Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Admin Passkey" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)} 
              className={`w-full bg-stone-950 border rounded-xl p-4 text-center text-white focus:outline-none focus:border-gold-500 ${authError ? 'border-red-500' : 'border-stone-800'}`}
              autoFocus 
            />
            <button type="submit" className="w-full bg-gold-500 text-stone-950 font-bold py-4 rounded-xl uppercase tracking-widest shadow-lg">Authenticate</button>
          </form>
        </div>
      </div>
    );
  }

  const currentPendingOrder = latestNewOrderId ? orders.find(o => o.id === latestNewOrderId) : null;

  return (
    <div className="fixed inset-0 z-[200] bg-stone-950 flex overflow-hidden font-sans text-stone-200">
      {currentPendingOrder && currentPendingOrder.status === 'pending' && (
         <div className="fixed inset-0 z-[1000] bg-stone-950 flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in overflow-hidden">
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] sm:w-[80vw] sm:h-[80vw] bg-red-950 rounded-full animate-pulse -z-10 blur-[100px] pointer-events-none"></div>

             <div className="w-full max-w-lg bg-stone-900 border border-red-800 rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(239,68,68,0.2)] relative flex flex-col max-h-[85vh]">
                  
                  <div className="bg-gradient-to-br from-red-500 to-orange-600 p-6 sm:p-8 text-center relative overflow-hidden shrink-0">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                      <BellRing className="text-white mx-auto mb-3 animate-bounce" size={40} />
                      <h2 className="text-2xl sm:text-3xl font-serif text-white uppercase tracking-widest font-black leading-tight">Incoming<br/>Order</h2>
                      <p className="text-white/80 mt-2 tracking-widest text-[10px] sm:text-xs uppercase font-bold">Action Required</p>
                  </div>
                  
                  <div className="p-6 sm:p-8 overflow-y-auto scrollbar-hide flex-1 space-y-6 bg-stone-950">
                      
                      <div className="flex justify-between items-center bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-800 shadow-inner">
                          <div>
                              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black block mb-1">Order No.</span>
                              <span className="text-gold-400 font-mono font-bold text-lg sm:text-2xl tracking-tighter shrink-0">#{currentPendingOrder.id}</span>
                          </div>
                          <div className="text-right">
                              <span className={`inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm ${currentPendingOrder.type === 'delivery' ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-orange-950 text-orange-400 border border-orange-800'}`}>
                                  {currentPendingOrder.type === 'delivery' ? '🛵 Delivery' : '🛍️ Pickup'}
                              </span>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:gap-6">
                           <div className="space-y-1 sm:space-y-2 bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-800">
                               <span className="text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-widest font-black block">Customer</span>
                               <p className="text-xs sm:text-sm font-bold text-white truncate">{currentPendingOrder.customerName}</p>
                               <p className="text-[10px] sm:text-xs font-mono text-stone-400 truncate">{currentPendingOrder.contactNumber}</p>
                           </div>
                           <div className="space-y-1 sm:space-y-2 bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-800 text-right flex flex-col justify-center">
                               <span className="text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-widest font-black block">Grand Total</span>
                               <p className="text-xl sm:text-2xl font-serif text-white font-bold leading-none shrink-0">₹{currentPendingOrder.total}</p>
                           </div>
                      </div>
                      
                      {currentPendingOrder.address && (
                          <div className="p-4 sm:p-5 bg-stone-900 rounded-2xl border border-stone-800 flex items-start gap-3">
                              <div className="p-2 bg-stone-950 rounded-xl shrink-0"><MapPin size={16} className="text-gold-500" /></div>
                              <div className="min-w-0">
                                <span className="text-[9px] text-stone-500 uppercase tracking-widest font-black block mb-1">Delivery Address</span>
                                <p className="text-stone-300 text-[10px] sm:text-xs leading-relaxed truncate whitespace-normal line-clamp-3">
                                    {renderAddressWithLinks(currentPendingOrder.address)}
                                </p>
                              </div>
                          </div>
                      )}
                      
                      <div className="bg-stone-900 rounded-[1.5rem] border border-stone-800 p-5 sm:p-6 shadow-inner space-y-3">
                           <span className="text-[9px] text-stone-500 uppercase tracking-widest font-black block mb-3 border-b border-stone-800 pb-2">Order Items</span>
                           {currentPendingOrder.items.map((it: any, idx: number) => (
                               <div key={idx} className="flex justify-between items-center text-[11px] sm:text-sm border-b border-stone-800 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                                   <div className="flex items-center gap-3 overflow-hidden">
                                       <span className="text-gold-500 font-black bg-stone-950 px-2 py-0.5 rounded-md shrink-0">{it.quantity}x</span>
                                       <span className="text-stone-200 font-medium truncate">{it.name}</span>
                                   </div>
                               </div>
                           ))}
                      </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 bg-stone-950 border-t border-stone-800 shrink-0 relative z-10">
                    <button 
                         onClick={() => {
                             handleStatusChange(currentPendingOrder, 'preparing');
                         }}
                         className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-stone-950 text-sm sm:text-lg font-black uppercase tracking-widest py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex justify-center items-center gap-3 overflow-hidden relative group"
                     >
                         <div className="absolute inset-0 w-1/4 h-full bg-white/10 skew-x-12 -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000 ease-in-out"></div>
                         <Check size={24} className="animate-pulse" /> Accept & Prepare
                     </button>
                  </div>
             </div>
         </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-stone-950 border-r border-gold-500/10 flex flex-col shrink-0 h-full transition-transform duration-500 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full shadow-none'}`}>
        <div className="p-8 border-b border-white/5 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent"></div>
            <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center font-serif text-stone-950 font-black text-2xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] relative z-10">C</div>
            <div className="relative z-10">
                <h1 className="text-white font-serif font-black text-xl leading-none uppercase tracking-tighter">CHILLIES</h1>
                <span className="text-[9px] text-gold-500/60 uppercase tracking-[0.3em] font-black mt-1 block">Command Center</span>
            </div>
        </div>
        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto scrollbar-hide">
            <div className="text-[9px] text-stone-600 font-black uppercase tracking-[0.2em] mb-4 px-4">Menu Navigation</div>
            {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                { id: 'orders', icon: ShoppingBag, label: 'Orders' },
                { id: 'items', icon: List, label: 'Inventory' },
                { id: 'categories', icon: Tag, label: 'Categories' },
                { id: 'coupons', icon: Ticket, label: 'Coupons' },
                { id: 'promotions', icon: Zap, label: 'Marketing' },
                { id: 'loyalty', icon: Award, label: 'Loyalty Program' },
                { id: 'reviews', icon: Star, label: 'Feedback' },
                { id: 'complaints', icon: AlertTriangle, label: 'Complaints' },
                { id: 'payment', icon: Wallet, label: 'Payment' },
                { id: 'predictions', icon: Trophy, label: 'FIFA Predictions' },
                { id: 'settings', icon: Settings, label: 'Operations' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 relative group ${
                        activeTab === tab.id ? 'bg-white text-stone-950 shadow-[0_20px_40px_rgba(0,0,0,0.5)] scale-[1.02]' : 'text-stone-500 hover:text-stone-200 hover:bg-white/5'
                    }`}
                >
                    <tab.icon size={18} className={activeTab === tab.id ? 'stroke-[2.5]' : 'opacity-50'} />
                    <span className="text-[11px] font-black tracking-[0.1em] uppercase flex-1 text-left">{tab.label}</span>
                    
                    {tab.id === 'orders' && orders.filter(o => o.status === 'pending').length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeTab === 'orders' ? 'bg-stone-950 text-gold-500' : 'bg-gold-500 text-stone-950 animate-pulse'}`}>
                            {orders.filter(o => o.status === 'pending').length}
                        </span>
                    )}

                    {tab.id === 'complaints' && (complaints || []).filter(c => c.status === 'open').length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeTab === 'complaints' ? 'bg-stone-950 text-red-500' : 'bg-red-500 text-white animate-bounce'}`}>
                            {(complaints || []).filter(c => c.status === 'open').length}
                        </span>
                    )}
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-stone-800 space-y-2">
            <button onClick={() => { localStorage.removeItem('chillies_admin_auth'); setIsAuthenticated(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 text-sm font-bold hover:bg-red-950 rounded-xl transition-colors"><LogOut size={16} /> Logout</button>
            <button onClick={handleExit} className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 text-sm font-bold hover:text-white transition-colors"><X size={16} /> Exit Panel</button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-stone-950 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 bg-stone-950 h-full overflow-hidden">
        <header className="h-20 border-b border-stone-800 px-8 flex items-center justify-between shrink-0 bg-stone-900">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-stone-500 hover:text-white transition-colors">
                    <Menu size={24} />
                </button>
                <h2 className="text-2xl font-serif text-white capitalize">{activeTab}</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${isStoreOpen ? 'bg-green-950 border-green-800 text-green-500' : 'bg-red-950 border-red-800 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isStoreOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{isStoreOpen ? 'Active' : 'Offline'}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400">
                    <User size={20} />
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-stone-950 relative">
            {audioBlocked && (
                <div onClick={() => {
                   if (ringAudioRef.current) {
                      ringAudioRef.current.play().then(() => setAudioBlocked(false)).catch(e => console.error(e));
                   }
                }} className="absolute top-4 left-6 right-6 z-50 cursor-pointer animate-bounce-slow">
                    <div className="bg-red-500 rounded-2xl p-4 shadow-[0_0_50px_rgba(239,68,68,0.5)] border border-red-400 flex items-center justify-center gap-4 text-white hover:bg-red-600 transition-colors">
                        <Flame size={32} className="animate-pulse" />
                        <div>
                            <h3 className="font-black text-xl uppercase tracking-widest">Notification Sound Blocked by Browser!</h3>
                            <p className="text-sm font-bold opacity-90">Click here to UNMUTE loud order alerts.</p>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'dashboard' && (
                <div className="space-y-10 animate-fade-in max-w-7xl mx-auto px-4 sm:px-8 py-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-serif text-white mb-2">
                                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, Admin
                            </h1>
                            <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.3em]">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • Chillies Central
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all shadow-xl ${isStoreOpen ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${isStoreOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className="text-[11px] font-black uppercase tracking-widest">{isStoreOpen ? 'Kitchen Live' : 'Kitchen Offline'}</span>
                            </div>
                        </div>
                    </div>

                    {!isStoreOpen && openingCountdown && (
                        <div className="bg-gradient-to-r from-red-950/40 to-transparent border border-red-800/30 p-8 rounded-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-red-500/20 text-red-500 rounded-2xl border border-red-500/20"><Clock size={28} /></div>
                                <div>
                                    <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-1">Service Paused</h4>
                                    <p className="text-stone-500 text-[10px] font-medium max-w-[200px]">The store is currently closed. Prepare your inventory for the next shift.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-stone-600 text-[9px] uppercase tracking-[0.2em] font-black block mb-2">Resuming In</span>
                                <span className="text-red-500 font-mono text-4xl font-bold tracking-tighter">{openingCountdown}</span>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'View Orders', icon: ShoppingBag, color: 'bg-gold-500', action: () => { setActiveTab('orders'); setOrderStage('new'); } },
                            { label: 'Sales Report', icon: Download, color: 'bg-blue-500', action: downloadExcelReport },
                            { label: 'Live Map', icon: Navigation, color: 'bg-green-500', action: () => { setActiveTab('orders'); setOrderStage('active'); } },
                            { label: 'New Promotion', icon: Sparkles, color: 'bg-purple-500', action: () => setActiveTab('promotions') }
                        ].map((act, i) => (
                            <button 
                                key={i} 
                                onClick={act.action}
                                className="group bg-stone-900 border border-stone-800 p-5 rounded-2xl flex flex-col items-center gap-3 hover:border-gold-500/50 transition-all active:scale-95 shadow-lg shadow-black/20"
                            >
                                <div className={`p-3 rounded-xl ${act.color} text-stone-950 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <act.icon size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 group-hover:text-white transition-colors">{act.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Revenue', val: `₹${stats.totalRevenue}`, icon: Zap, color: 'text-green-500', sub: 'Real-time', glow: 'shadow-green-500/20' },
                            { label: 'Avg. Prep Time', val: `${stats.avgPrepTime}m`, icon: Clock, color: 'text-orange-500', sub: 'Performance', glow: 'shadow-orange-500/20' },
                            { label: 'Delivered', val: stats.deliveredOrders, icon: Check, color: 'text-blue-500', sub: 'Completed', glow: 'shadow-blue-500/20' },
                            { label: 'Avg. Order', val: `₹${stats.avgOrderValue}`, icon: Filter, color: 'text-purple-500', sub: 'Efficiency', glow: 'shadow-purple-500/20' }
                        ].map((s: any, i: number) => (
                            <div key={i} className={`bg-stone-900 border border-white/5 p-8 rounded-[2.5rem] group hover:border-gold-500/30 transition-all relative overflow-hidden shadow-2xl ${s.glow}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 blur-[50px] rounded-full group-hover:bg-gold-500/10 transition-all"></div>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className={`p-4 rounded-2xl bg-stone-950 border border-white/5 ${s.color} shadow-xl group-hover:scale-110 transition-transform`}><s.icon size={24} /></div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 bg-stone-950 px-3 py-1.5 rounded-full border border-white/5">{s.sub}</div>
                                </div>
                                <p className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-black mb-2 opacity-60">{s.label}</p>
                                <h3 className="text-4xl font-serif text-white group-hover:text-gold-400 transition-colors">{s.val}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Daily Revenue Chart */}
                        <div className="bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 group/chart relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/5 blur-[120px] -z-10"></div>
                            <div className="flex items-center justify-between mb-12 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-stone-950 text-gold-500 rounded-2xl flex items-center justify-center border border-white/5 shadow-xl"><TrendingUp size={24} /></div>
                                    <div>
                                        <h4 className="text-white font-serif text-2xl tracking-tight">Revenue Trend</h4>
                                        <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-black mt-1">7-Day Performance Insight</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                    <span className="text-[9px] font-black uppercase text-green-500 tracking-widest">Live Data Feed</span>
                                </div>
                            </div>

                            <div className="h-72 relative mt-4">
                                {/* Technical Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.02] z-0">
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-white"></div>)}
                                </div>
                                
                                <div className="h-full flex items-end justify-between gap-4 px-2 relative z-10">
                                    {stats.dailyRev.map(([day, rev], i) => {
                                        const maxRev = Math.max(...stats.dailyRev.map(d => d[1] as number), 1);
                                        const height = (rev / maxRev) * 100;
                                        return (
                                            <div key={day} className="flex-1 flex flex-col items-center gap-5 group cursor-pointer h-full justify-end">
                                                <div className="w-full relative flex flex-col justify-end h-full">
                                                    <div 
                                                        style={{ height: `${Math.max(4, height)}%` }}
                                                        className={`w-full bg-gradient-to-t from-gold-700 via-gold-500 to-gold-300 rounded-t-xl transition-all duration-700 shadow-[0_0_30px_rgba(212,175,55,0.05)] relative overflow-hidden group-hover:shadow-[0_0_50px_rgba(212,175,55,0.3)] group-hover:scale-x-[1.05] origin-bottom ${rev > 0 ? 'opacity-90' : 'opacity-10'}`}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    </div>
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-stone-900/95 backdrop-blur-xl border border-gold-500/30 text-white px-4 py-2.5 rounded-2xl text-[12px] font-black shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 whitespace-nowrap z-50 pointer-events-none">
                                                        <span className="text-gold-500 mr-2">₹</span>{rev.toLocaleString()}
                                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-stone-900 border-r border-b border-gold-500/30 rotate-45"></div>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-stone-600 group-hover:text-white transition-colors tracking-widest">{day}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Busy Hours Chart */}
                        <div className="bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 group/chart relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/5 blur-[120px] -z-10"></div>
                            <div className="flex items-center justify-between mb-12 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-stone-950 text-gold-400 rounded-2xl flex items-center justify-center border border-white/5 shadow-xl"><BarChart3 size={24} /></div>
                                    <div>
                                        <h4 className="text-white font-serif text-2xl tracking-tight">Busy Hours</h4>
                                        <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-black mt-1">Order Volume Distribution</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-gold-500/10 border border-gold-500/20 rounded-full flex items-center gap-2">
                                    <Sparkles className="text-gold-500" size={14} />
                                    <span className="text-[9px] font-black uppercase text-gold-500 tracking-widest">Peak Detected</span>
                                </div>
                            </div>

                            <div className="h-72 relative mt-4">
                                <div className="h-full flex items-end justify-between gap-1.5 px-1 relative z-10">
                                    {stats.busyHours.map((count, hour) => {
                                        const maxCount = Math.max(...stats.busyHours, 1);
                                        const height = (count / maxCount) * 100;
                                        const isBusy = count > 0;
                                        return (
                                            <div key={hour} className="flex-1 flex flex-col items-center gap-5 group h-full justify-end cursor-pointer">
                                                <div 
                                                    style={{ height: `${Math.max(8, height)}%` }}
                                                    className={`w-full rounded-t-lg transition-all duration-700 origin-bottom ${isBusy ? 'bg-gold-500/80 group-hover:bg-gold-400 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] group-hover:scale-x-110' : 'bg-stone-800 opacity-20'}`}
                                                >
                                                    {count > 0 && (
                                                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-stone-900/95 backdrop-blur-xl border border-gold-500/30 text-white px-4 py-2.5 rounded-2xl text-[11px] font-black shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 whitespace-nowrap z-50 pointer-events-none">
                                                            {count} <span className="text-stone-500 ml-1">Orders</span>
                                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-stone-900 border-r border-b border-gold-500/30 rotate-45"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                {(hour % 4 === 0 || hour === 23) && (
                                                    <span className="text-[8px] font-black text-stone-700 group-hover:text-white transition-colors uppercase tracking-widest">{hour}h</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                        <div className="flex p-1.5 bg-stone-900 border border-stone-800 rounded-2xl w-full lg:w-fit shadow-inner">
                            {[
                                { id: 'new', label: 'New', count: orders.filter(o => o.status === 'pending').length },
                                { id: 'active', label: 'Active', count: orders.filter(o => ['preparing', 'ready', 'out_for_delivery'].includes(o.status)).length },
                                { id: 'history', label: 'History', count: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length }
                            ].map(s => (
                                <button 
                                    key={s.id} 
                                    onClick={() => setOrderStage(s.id as any)}
                                    className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                                        orderStage === s.id ? 'bg-gold-500 text-stone-950 shadow-lg' : 'text-stone-500 hover:text-white'
                                    }`}
                                >
                                    {s.label}
                                    {s.count > 0 && <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${orderStage === s.id ? 'bg-stone-900 text-gold-500' : 'bg-stone-800 text-stone-400'}`}>{s.count}</span>}
                                </button>
                            ))}
                        </div>
                        {orderStage === 'history' && (
                            <div className="flex p-1.5 bg-stone-900 border border-stone-800 rounded-2xl shadow-inner">
                                {['all', 'Cash', 'UPI'].map(pf => (
                                    <button
                                        key={pf}
                                        onClick={() => setPaymentFilter(pf as any)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                            paymentFilter === pf ? 'bg-brand-500 text-white shadow-lg' : 'text-stone-500 hover:text-white'
                                        }`}
                                    >
                                        {pf === 'all' ? 'All Payments' : pf}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="relative w-full lg:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search by ID, Name or Phone..." 
                                    value={orderSearch}
                                    onChange={e => setOrderSearch(e.target.value)}
                                    className="w-full bg-stone-900 border border-stone-800 rounded-2xl py-4 pl-12 pr-12 text-xs text-white focus:border-gold-500 outline-none shadow-inner"
                                />
                                <button onClick={() => setIsScannerOpen(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500 hover:text-gold-400 transition-colors" title="Scan QR Code"><Scan size={18} /></button>
                            </div>
                            {orderStage === 'active' && (
                                <button 
                                    onClick={() => riderLocation ? setIsRiderMapOpen(true) : alert("Rider Location is completely unavailable. Waiting for them to open the Delivery Portal and grant GPS tracking permissions.")} 
                                    className={`p-4 rounded-2xl transition-all shadow-lg shrink-0 flex items-center justify-center gap-2 ${riderLocation ? 'bg-brand-500 text-white hover:bg-brand-400' : 'bg-stone-900 border border-stone-800 text-stone-600 hover:text-stone-400'}`} 
                                    title={riderLocation ? "Open Live Track Feed" : "Signal Missing"}
                                >
                                    <Navigation size={20} className={riderLocation ? "animate-pulse" : ""} />
                                </button>
                            )}
                            <button onClick={() => setIsManualOrderOpen(true)} className="bg-gold-500 text-stone-950 p-4 rounded-2xl hover:bg-gold-400 transition-colors shadow-lg shrink-0" title="Create Manual Order">
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {filteredOrders.length === 0 ? (
                            <div className="col-span-full py-32 text-center border-2 border-dashed border-stone-800 rounded-[3rem] bg-stone-900">
                                <ShoppingBag className="mx-auto text-stone-300 mb-6 opacity-20" size={64} />
                                <p className="text-stone-500 uppercase tracking-[0.3em] text-xs font-bold">No matching records found</p>
                            </div>
                        ) : filteredOrders.map(order => (
                            <div key={order.firestoreId || order.id} className="bg-stone-900 border border-stone-800 rounded-[2.5rem] overflow-hidden group hover:border-gold-500 transition-all duration-500 flex flex-col shadow-xl">
                                <div className="p-4 sm:p-8 border-b border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-950">
                                    <div className="space-y-2 w-full sm:w-auto">
                                        <div className="flex items-center justify-between sm:justify-start gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gold-400 font-mono font-bold text-2xl tracking-tighter">#{order.id}</span>
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${order.type === 'delivery' ? 'bg-blue-950 text-blue-400' : 'bg-orange-950 text-orange-400'}`}>{order.type}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-stone-500 font-bold uppercase tracking-widest text-[10px]">
                                            <Calendar size={12} /> {order.date} <span className="opacity-30 mx-1">|</span> {order.timestamp}
                                        </div>
                                        {order.paymentMethod && order.status === 'delivered' && (
                                            <div className={`mt-3 inline-flex border border-stone-800 items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-xl shadow-sm ${order.paymentMethod === 'UPI' ? 'bg-purple-950 text-purple-400' : 'bg-green-950 text-green-400'}`}>
                                                {order.paymentMethod === 'UPI' ? '📱 UPI' : '💵 Cash'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 w-full sm:flex sm:w-auto">
                                        <button onClick={() => printThermalBill(order)} title="Print" className="p-3 bg-stone-950 text-stone-600 hover:text-brand-500 rounded-2xl border border-stone-800 transition-all flex justify-center items-center">
                                            <Printer size={18} />
                                        </button>
                                        <button onClick={() => {
                                            if (storeSettings.kotPrinters && storeSettings.kotPrinters.length > 0) {
                                                printNetworkKOT(order, storeSettings.kotPrinters);
                                            } else {
                                                printKOT(order);
                                            }
                                        }} title="Print KOT" className="p-3 bg-stone-950 text-stone-600 hover:text-orange-500 rounded-2xl border border-stone-800 transition-all flex justify-center items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-receipt-text"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>
                                        </button>
                                        <button onClick={() => {
                                            const phone = order.contactNumber.replace(/\D/g, '');
                                            const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
                                            const text = `Hi ${order.customerName},\n\nYour order #${order.id} is confirmed!\nYou can track your order status live here:\n${window.location.origin}/?tid=${order.id}\n\nThank you for choosing Chillies!`;
                                            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                        }} title="WhatsApp Tracking Link" className="p-3 bg-stone-950 text-stone-600 hover:text-green-500 rounded-2xl border border-stone-900/5 transition-all flex justify-center items-center">
                                            <MessageCircle size={18} />
                                        </button>
                                        <button onClick={() => setActiveChatOrderId(order.id)} title="Live Chat" className="p-3 bg-stone-950 text-stone-600 hover:text-blue-500 rounded-2xl border border-stone-800 transition-all flex justify-center items-center relative">
                                            <MessageSquare size={18} />
                                            {order.messages?.some((m: any) => m.sender === 'customer' && !m.read) && (
                                                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 space-y-8 flex-1">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-stone-600 uppercase tracking-widest font-black block">Customer</span>
                                            <p className="text-sm font-bold truncate text-white">{order.customerName}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-stone-600 uppercase tracking-widest font-black block">Contact</span>
                                            <p className="text-sm font-mono text-stone-300">{order.contactNumber}</p>
                                        </div>
                                    </div>
                                    {order.address && (
                                        <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
                                            <span className="text-[9px] text-stone-600 uppercase tracking-[0.2em] font-black block">Location</span>
                                            <p className="text-stone-400 text-xs flex items-start gap-3 leading-relaxed">
                                                <MapPin size={16} className="text-gold-500 shrink-0 mt-0.5" /> <div>{renderAddressWithLinks(order.address)}</div>
                                            </p>
                                        </div>
                                    )}
                                    <div className="bg-stone-950 rounded-[1.5rem] border border-stone-800 p-6 shadow-inner">
                                        <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-4">
                                            {order.items.map((it: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-stone-800 pb-3 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <SafeImage src={it.image} containerClassName="w-10 h-10 rounded-xl shrink-0" className="w-full h-full object-cover" />
                                                        <span className="text-stone-200 truncate font-medium"><span className="text-gold-500 font-black mr-2">{it.quantity}x</span> {it.name}</span>
                                                    </div>
                                                    <span className="text-stone-500 font-mono text-xs ml-4 whitespace-nowrap">₹{it.price * it.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-stone-800 flex justify-between items-end">
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-stone-600 uppercase font-black tracking-[0.2em]">Grand Total</span>
                                                <div className="text-3xl font-serif text-white font-bold leading-none">₹{order.total}</div>
                                            </div>
                                            <button onClick={() => {
                                                const newStatus = order.type === 'delivery' ? 'out_for_delivery' : 'ready';
                                                handleStatusChange(order, newStatus);
                                            }} className="p-4 bg-green-950 text-green-500 rounded-2xl border border-green-800 hover:bg-green-500 hover:text-white transition-all">
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-stone-950 border-t border-stone-800">
                                    <select 
                                        value={order.status} 
                                        onChange={(e) => handleStatusChange(order, e.target.value as any)}
                                        className={`w-full bg-stone-950 border-2 font-black uppercase text-[11px] p-5 rounded-2xl focus:outline-none cursor-pointer tracking-widest transition-all ${
                                            order.status === 'delivered' ? 'border-green-500/40 text-green-500' : 
                                            order.status === 'cancelled' ? 'border-red-500/40 text-red-500' : 'border-gold-500/40 text-gold-500'
                                        }`}
                                    >
                                        <option value="pending">🟡 Pending Verification</option>
                                        <option value="preparing">🟠 Preparing</option>
                                        <option value="ready">🔵 Ready</option>
                                        <option value="out_for_delivery">🟣 In Transit</option>
                                        <option value="delivered">🟢 Delivered</option>
                                        <option value="cancelled">🔴 Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'items' && (
                <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
                    <div className="bg-stone-900 border border-white/5 p-4 rounded-3xl flex flex-col xl:flex-row items-center gap-4 shadow-xl">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search inventory..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="w-full bg-stone-950 border border-stone-800 rounded-2xl py-3.5 pl-12 pr-4 text-xs text-white focus:border-gold-500 outline-none transition-all shadow-inner" 
                            />
                        </div>
                        
                        <div className="flex p-1 bg-stone-950 border border-stone-800 rounded-2xl w-full xl:w-auto overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'all', label: 'All Stock' },
                                { id: 'available', label: 'Live' },
                                { id: 'unavailable', label: 'Sold' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setInventoryStatusFilter(filter.id as any)}
                                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        inventoryStatusFilter === filter.id 
                                        ? 'bg-gold-500 text-stone-950 shadow-lg' 
                                        : 'text-stone-500 hover:text-white'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full xl:w-auto">
                            <select 
                                value={categoryFilter} 
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 rounded-2xl py-3.5 pl-4 pr-10 text-[10px] uppercase font-bold tracking-widest text-stone-400 focus:border-gold-500 focus:text-white outline-none transition-all shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="All">All Categories</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                        </div>
                        
                        <button 
                            onClick={() => openNewItemModal()} 
                            className="w-full xl:w-auto bg-stone-800 border border-gold-500/20 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all hover:bg-gold-500 hover:text-stone-950 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-95 group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
                            <span>New Dish</span>
                        </button>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="py-32 text-center border-2 border-dashed border-stone-800 rounded-[3rem] bg-stone-900/20 animate-fade-in">
                            <SearchX className="mx-auto text-stone-300 mb-6 opacity-20" size={64} />
                            <p className="text-stone-500 uppercase tracking-[0.3em] text-xs font-bold mb-8">No results for "{searchTerm}"</p>
                            {searchTerm && (
                                <button 
                                    onClick={() => openNewItemModal(searchTerm)}
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-gold-500/10 border border-gold-500/30 text-gold-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-500 hover:text-stone-950 transition-all group"
                                >
                                    <Plus size={16} /> 
                                    Create "{searchTerm}" Dish
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {filteredItems.map(item => (
                                <div 
                                    key={item.id} 
                                    draggable
                                    onDragStart={(e) => setDraggedItemId(item.id || null)}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverItemId(item.id || null); }}
                                    onDragLeave={() => setDragOverItemId(null)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedItemId && draggedItemId !== item.id) {
                                            handleDrop(draggedItemId, item.id || '');
                                        }
                                        setDraggedItemId(null);
                                        setDragOverItemId(null);
                                    }}
                                    className={`bg-stone-900 border ${dragOverItemId === item.id ? 'border-gold-500 border-2 border-dashed shadow-[inset_0_0_30px_rgba(212,175,55,0.2)] z-10' : 'border-white/5'} rounded-3xl overflow-hidden group relative transition-all duration-300 ${item.isUnavailable ? 'opacity-40 grayscale' : 'hover:border-gold-500/30'} ${draggedItemId === item.id ? 'opacity-30 scale-95 border-dashed border-2 border-gold-500 ring-4 ring-gold-500/10' : ''} cursor-grab active:cursor-grabbing`}
                                >
                                    <div className="h-44 relative overflow-hidden">
                                        <SafeImage src={item.image} containerClassName="w-full h-full pointer-events-none" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    </div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-stone-600 text-[8px] uppercase font-black tracking-[0.2em]">{item.category}</p>
                                        </div>
                                        
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-white font-bold text-sm truncate flex-1 pr-2">{item.name}</h4>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${!item.isUnavailable ? 'text-gold-500' : 'text-stone-600'}`}>
                                                    {item.isUnavailable ? 'OFF' : 'LIVE'}
                                                </span>
                                                <button 
                                                    onClick={() => onUpdateItem({ ...item, isUnavailable: !item.isUnavailable })}
                                                    className={`group relative flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-all duration-300 ease-in-out focus:outline-none ${!item.isUnavailable ? 'bg-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'bg-stone-800 border border-stone-700'}`}
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow-lg ring-0 transition duration-300 ease-in-out ${!item.isUnavailable ? 'translate-x-4 bg-stone-950' : 'translate-x-0 bg-stone-9000'}`}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-gold-400 font-serif font-bold text-lg">₹{item.price}</span>
                                            <div className="flex gap-1 items-center">
                                                {item.spicyLevel && item.spicyLevel !== 'none' && <Flame size={12} className="text-red-500" />}
                                                {item.isFlashSale && <Zap size={12} className="text-red-500" />}
                                                {item.isChefChoice && <ChefHat size={12} className="text-gold-500" />}
                                                {item.isExclusive && <EyeOff size={12} className="text-purple-500" />}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingItem(item); setIsItemFormOpen(true); }} className="flex-1 bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Edit</button>
                                            <button onClick={() => onDeleteItem(item.id)} className="p-2 bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="space-y-12 animate-fade-in max-w-7xl mx-auto pb-20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-stone-900 border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-serif text-white mb-2">Departments</h2>
                            <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em]">Operational Menu Sections & Time Schedules</p>
                        </div>
                        <div className="flex w-full md:w-auto gap-4 relative z-10">
                            <div className="relative flex-1 md:w-80">
                                <Layers size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-600" />
                                <input 
                                    type="text" 
                                    placeholder="Add new department..." 
                                    value={newCatInput} 
                                    onChange={(e) => setNewCatInput(e.target.value)} 
                                    className="w-full bg-stone-950 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm focus:border-gold-500 outline-none transition-all shadow-inner" 
                                />
                            </div>
                            <button 
                                onClick={() => { if(newCatInput.trim()) { onAddCategory(newCatInput.trim()); setNewCatInput(''); } }}
                                className="bg-gold-500 text-stone-950 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_20px_40px_rgba(212,175,55,0.2)] hover:bg-gold-400 transition-all active:scale-95 flex items-center gap-3"
                            >
                                <Plus size={18} /> Deploy
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.sort((a, b) => (a.order || 0) - (b.order || 0)).map((cat, index) => (
                            <div key={cat.id} className="bg-stone-900 border border-white/5 rounded-[3rem] p-10 group hover:border-gold-500/30 transition-all relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-gold-500/5 blur-[80px] -z-10 group-hover:bg-gold-500/10 transition-all"></div>
                                
                                <div className="flex justify-between items-start mb-10">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-stone-950 border border-white/5 rounded-xl flex items-center justify-center text-gold-500 shadow-inner group-hover:scale-110 transition-transform"><Tag size={18} /></div>
                                            <span className="text-stone-600 text-[8px] font-black uppercase tracking-[0.2em] font-mono">SEC-0{index + 1}</span>
                                        </div>
                                        <h3 className="text-white text-3xl font-serif tracking-tight pr-4">{cat.name}</h3>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-lg ${!cat.isUnavailable ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                        {!cat.isUnavailable ? '● Live' : '○ Hidden'}
                                    </div>
                                </div>

                                <div className="space-y-5 mb-12">
                                    <div className="flex items-center gap-4 text-stone-400 bg-stone-950/50 p-4 rounded-2xl border border-white/5">
                                        <div className="p-2 bg-stone-950 rounded-lg text-gold-500 shadow-inner"><Clock size={16} /></div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-stone-600 uppercase font-black tracking-widest mb-1">Operational Hours</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                                                {cat.startTime && cat.endTime ? `${cat.startTime} — ${cat.endTime}` : 'UNRESTRICTED (24/7)'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-stone-400 bg-stone-950/50 p-4 rounded-2xl border border-white/5">
                                        <div className="p-2 bg-stone-950 rounded-lg text-gold-500 shadow-inner"><Layers size={16} /></div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-stone-600 uppercase font-black tracking-widest mb-1">Inventory Volume</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                                                {items.filter(i => i.category === cat.name).length} REGISTERED ITEMS
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-8 border-t border-white/5 relative z-10">
                                    <button 
                                        onClick={() => { setEditingCategory(cat); setCategoryInput(cat.name); setIsCategoryFormOpen(true); }}
                                        className="flex-1 py-4 bg-stone-950 border border-white/5 text-stone-400 hover:text-white hover:border-gold-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-inner active:scale-95"
                                    >
                                        Configure
                                    </button>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onReorderCategory && onReorderCategory('up', index)}
                                            className="p-4 bg-stone-950 border border-white/5 text-stone-500 hover:text-gold-500 rounded-2xl transition-all shadow-inner active:scale-95"
                                            disabled={index === 0}
                                        >
                                            <ChevronUp size={18} strokeWidth={3} />
                                        </button>
                                        <button 
                                            onClick={() => onReorderCategory && onReorderCategory('down', index)}
                                            className="p-4 bg-stone-950 border border-white/5 text-stone-500 hover:text-gold-500 rounded-2xl transition-all shadow-inner active:scale-95"
                                            disabled={index === categories.length - 1}
                                        >
                                            <ChevronDown size={18} strokeWidth={3} />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => onDeleteCategory(cat.name)}
                                        className="p-4 bg-stone-950 border border-white/5 text-stone-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all shadow-inner active:scale-95"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'coupons' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
                    <div className="bg-stone-900 border border-white/5 p-10 rounded-[3rem] shadow-xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-gold-500/10 rounded-2xl flex items-center justify-center text-gold-500 border border-gold-500/20"><Ticket size={24} /></div>
                            <div><h4 className="text-2xl font-serif text-white">Promo Hub</h4><p className="text-stone-500 text-xs uppercase tracking-widest font-bold">Vouchers & Discounts</p></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                            <input type="text" placeholder="CODE" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())} className="bg-stone-950 border border-stone-800 rounded-2xl px-6 py-5 text-white font-mono focus:border-gold-500 outline-none uppercase" />
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500" />
                                <input type="number" placeholder="Discount ₹" value={newCouponVal || ''} onChange={(e) => setNewCouponVal(Number(e.target.value))} className="w-full bg-stone-950 border border-stone-800 rounded-2xl py-5 pl-12 pr-6 text-white focus:border-gold-500 outline-none" />
                            </div>
                            <button onClick={() => { if(newCouponCode && newCouponVal) { onAddCoupon({ code: newCouponCode, value: newCouponVal, type: 'flat' }); setNewCouponCode(''); setNewCouponVal(0); } }} className="bg-gold-500 text-stone-950 rounded-2xl font-black uppercase tracking-widest text-xs py-5 transition-all shadow-lg"> Create Coupon </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {coupons.map((coupon) => (
                                <div key={coupon.id} className="p-6 bg-stone-950/50 rounded-2xl border border-white/5 flex justify-between items-center group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gold-500 shadow-[2px_0_10px_rgba(212,175,55,0.4)]"></div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3.5 rounded-xl bg-gold-500/10 text-gold-500"><Ticket size={24} /></div>
                                        <div><p className="text-white font-mono font-bold text-lg">{coupon.code}</p><p className="text-stone-500 text-[10px] uppercase font-black tracking-widest">₹{coupon.value} Flat Off</p></div>
                                    </div>
                                    <button onClick={() => coupon.id && onDeleteCoupon(coupon.id)} className="p-3 text-stone-300 hover:text-red-500 transition-all hover:bg-red-500/5 rounded-xl"> <Trash2 size={20} /> </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'promotions' && (
                <div className="max-w-4xl animate-fade-in space-y-12 mx-auto pb-12">
                    <div className="grid grid-cols-1 gap-12">
                        <div className={`bg-stone-900/80 border p-10 rounded-[3rem] transition-all duration-700 ${promoSettings.isFlashSaleActive ? 'border-red-500/40 shadow-[0_0_50px_rgba(220,38,38,0.1)]' : 'border-white/5'}`}>
                            <div className="flex justify-between items-start mb-10">
                                <div className={`p-5 rounded-[1.5rem] ${promoSettings.isFlashSaleActive ? 'bg-red-500 text-white shadow-lg' : 'bg-stone-950 text-stone-600 border border-white/5'}`}><Zap size={40} /></div>
                                <button onClick={() => onUpdatePromos({ ...promoSettings, isFlashSaleActive: !promoSettings.isFlashSaleActive })} className={`relative w-16 h-8 rounded-full transition-colors ${promoSettings.isFlashSaleActive ? 'bg-red-500' : 'bg-stone-800'}`}><div className={`absolute top-1 w-6 h-6 bg-stone-950 rounded-full shadow-lg transition-all ${promoSettings.isFlashSaleActive ? 'left-9' : 'left-1'}`}></div></button>
                            </div>
                            <div className="space-y-2 mb-8"><h4 className="text-3xl font-serif text-white">Flash Sale</h4><p className="text-stone-500 text-xs">Timed aggressive discounts.</p></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3"><label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Calendar size={14} className="text-red-500"/> Date</label><input type="date" value={promoSettings.flashSaleDate} onChange={e => onUpdatePromos({...promoSettings, flashSaleDate: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:border-red-500 [color-scheme:dark]" /></div>
                                <div className="space-y-3"><label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Clock size={14} className="text-red-500"/> Start</label><input type="time" value={promoSettings.flashSaleStartTime} onChange={e => onUpdatePromos({...promoSettings, flashSaleStartTime: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:border-red-500 [color-scheme:dark]" /></div>
                                <div className="space-y-3"><label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Clock size={14} className="text-red-500"/> End</label><input type="time" value={promoSettings.flashSaleEndTime} onChange={e => onUpdatePromos({...promoSettings, flashSaleEndTime: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:border-red-500 [color-scheme:dark]" /></div>
                            </div>
                        </div>
                        <div className={`bg-stone-900/80 border p-10 rounded-[3rem] transition-all duration-700 ${promoSettings.isHappyHourActive ? 'border-purple-500/40 shadow-[0_0_50px_rgba(147,51,234,0.1)]' : 'border-white/5'}`}>
                            <div className="flex justify-between items-start mb-10">
                                <div className={`p-5 rounded-[1.5rem] ${promoSettings.isHappyHourActive ? 'bg-purple-500 text-white shadow-lg' : 'bg-stone-950 text-stone-600 border border-white/5'}`}><PartyPopper size={40} /></div>
                                <button onClick={() => onUpdatePromos({ ...promoSettings, isHappyHourActive: !promoSettings.isHappyHourActive })} className={`relative w-16 h-8 rounded-full transition-colors ${promoSettings.isHappyHourActive ? 'bg-purple-500' : 'bg-stone-800'}`}><div className={`absolute top-1 w-6 h-6 bg-stone-950 rounded-full shadow-lg transition-all ${promoSettings.isHappyHourActive ? 'left-9' : 'left-1'}`}></div></button>
                            </div>
                            <div className="space-y-2 mb-8"><h4 className="text-3xl font-serif text-white">Happy Hour</h4><p className="text-stone-500 text-xs">Daily recurring special pricing.</p></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3"><label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Clock size={14} className="text-purple-500"/> Opens</label><input type="time" value={promoSettings.happyHourStartTime} onChange={e => onUpdatePromos({...promoSettings, happyHourStartTime: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:border-purple-500 [color-scheme:dark]" /></div>
                                <div className="space-y-3"><label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Clock size={14} className="text-purple-500"/> Closes</label><input type="time" value={promoSettings.happyHourEndTime} onChange={e => onUpdatePromos({...promoSettings, happyHourEndTime: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:border-purple-500 [color-scheme:dark]" /></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-stone-900/80 border border-white/5 rounded-[3rem] p-10 mt-12 shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gold-500/10 rounded-2xl flex items-center justify-center text-gold-500 border border-gold-500/20"><Sparkles size={24} /></div>
                                <div>
                                    <h4 className="text-2xl font-serif text-white">Custom Offers</h4>
                                    <p className="text-stone-500 text-xs uppercase tracking-widest font-bold">Manage Public Banners</p>
                                </div>
                            </div>
                            <button onClick={() => { setEditingOffer({ title: '', description: '', image: '', isActive: true }); setIsOfferFormOpen(true); }} className="bg-stone-800 border border-gold-500/20 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-gold-500 hover:text-stone-950 transition-all shadow-lg active:scale-95"> <Plus size={16} /> New Offer </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {customOffers.map(offer => (
                                <div key={offer.id} className="p-6 bg-stone-950 rounded-[2rem] border border-white/5 flex flex-col group relative overflow-hidden transition-all hover:border-gold-500/20">
                                    {offer.image && (
                                        <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <img src={offer.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="relative z-10 flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${offer.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className="text-[10px] text-stone-500 uppercase font-black tracking-widest">{offer.isActive ? 'Active' : 'Draft'}</span>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setEditingOffer(offer); setIsOfferFormOpen(true); }} className="p-2 text-stone-500 hover:text-gold-500 transition-colors bg-stone-900 rounded-lg"><Edit2 size={16} /></button>
                                            <button onClick={() => offer.id && onDeleteCustomOffer && onDeleteCustomOffer(offer.id)} className="p-2 text-stone-500 hover:text-red-500 transition-colors bg-stone-900 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="relative z-10 flex-1">
                                        <h5 className="text-white font-serif text-xl mb-2 pr-4">{offer.title}</h5>
                                        <p className="text-stone-400 text-xs leading-relaxed line-clamp-2">{offer.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Professional Marketing Poster & Banner Generator */}
                    <div className="bg-stone-900/80 border border-white/5 rounded-[3rem] p-10 mt-12 shadow-2xl space-y-10">
                        <div className="flex items-center gap-4 border-b border-white/[0.03] pb-6">
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20"><ImageIcon size={24} /></div>
                            <div>
                                <h4 className="text-2xl font-serif text-white">Marketing Poster Studio</h4>
                                <p className="text-stone-500 text-xs uppercase tracking-widest font-black mt-1">Design & Export High-Res Social Graphics</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Controls Panel */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* AI Creative Asset Generator */}
                                <div className="p-6 bg-stone-950/80 border border-white/5 rounded-3xl space-y-4">
                                    <div className="flex items-center gap-2 text-red-500">
                                        <Sparkles size={16} className="animate-pulse" />
                                        <span className="text-[10px] uppercase font-black tracking-widest text-stone-200">AI Background Generator</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] text-stone-500 uppercase tracking-widest font-black">AI Image Prompt</label>
                                        <textarea 
                                            value={aiPrompt}
                                            onChange={e => setAiPrompt(e.target.value)}
                                            rows={2}
                                            placeholder="e.g. Delicious grilled chicken shawarma wrap with hot fire sparks and embers..."
                                            className="w-full bg-stone-900 border border-white/5 rounded-xl p-3.5 text-stone-200 text-xs outline-none focus:border-red-500 resize-none font-light leading-relaxed"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setIsGeneratingAi(true);
                                            setTimeout(() => {
                                                const p = aiPrompt.toLowerCase();
                                                let chosenUrl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1080'; // Default Michelin culinary presentation
                                                
                                                if (p.includes('shawarma') || p.includes('roll') || p.includes('wrap') || p.includes('kebab')) {
                                                    chosenUrl = 'https://images.unsplash.com/photo-1662116765994-1e0e84b574fa?auto=format&fit=crop&q=80&w=1080';
                                                } else if (p.includes('burger') || p.includes('patty') || p.includes('bun')) {
                                                    chosenUrl = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1080';
                                                } else if (p.includes('pizza') || p.includes('crust')) {
                                                    chosenUrl = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1080';
                                                } else if (p.includes('grill') || p.includes('skewers') || p.includes('tandoori') || p.includes('bbq')) {
                                                    chosenUrl = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1080';
                                                } else if (p.includes('drink') || p.includes('mojito') || p.includes('cocktail') || p.includes('juice')) {
                                                    chosenUrl = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=1080';
                                                } else if (p.includes('sweet') || p.includes('dessert') || p.includes('cake')) {
                                                    chosenUrl = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1080';
                                                } else if (p.includes('chilli') || p.includes('spicy') || p.includes('fire')) {
                                                    chosenUrl = 'https://images.unsplash.com/photo-1518047601542-79f18c655718?auto=format&fit=crop&q=80&w=1080';
                                                }
                                                
                                                setPosterBgImage(chosenUrl);
                                                setIsGeneratingAi(false);
                                            }, 2200);
                                        }}
                                        disabled={isGeneratingAi}
                                        className="w-full py-3 bg-red-650/10 border border-red-500/20 text-red-500 font-bold uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        {isGeneratingAi ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Synthesizing Culinary AI Assets...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={12} />
                                                <span>Generate AI Background</span>
                                            </>
                                        )}
                                    </button>
                                    {posterBgImage && (
                                        <button 
                                            onClick={() => setPosterBgImage('')}
                                            className="w-full text-center text-[8px] text-stone-500 hover:text-white transition-colors uppercase font-black tracking-widest"
                                        >
                                            Reset Background to Theme Gradient
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black">Poster Title</label>
                                    <input 
                                        type="text" 
                                        value={posterTitle} 
                                        onChange={e => setPosterTitle(e.target.value)} 
                                        className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white text-xs outline-none focus:border-red-500" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black">Subtitle / Pitch</label>
                                    <input 
                                        type="text" 
                                        value={posterSubtitle} 
                                        onChange={e => setPosterSubtitle(e.target.value)} 
                                        className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white text-xs outline-none focus:border-red-500" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black">Offer / Badge Text</label>
                                        <input 
                                            type="text" 
                                            value={posterBadgeText} 
                                            onChange={e => setPosterBadgeText(e.target.value)} 
                                            className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white text-xs outline-none focus:border-red-500" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black">Featured Item</label>
                                        <select 
                                            value={selectedPosterItemId} 
                                            onChange={e => setSelectedPosterItemId(e.target.value)} 
                                            className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white text-xs outline-none focus:border-red-500"
                                        >
                                            <option value="">-- No Featured Item --</option>
                                            {items.map(item => (
                                                <option key={item.id} value={item.id}>{item.name} (₹{item.price})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black">Theme Palette</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'lava', label: 'Lava Red' },
                                                { id: 'gold', label: 'Gold Dust' },
                                                { id: 'midnight', label: 'Charcoal' }
                                            ].map(t => (
                                                <button 
                                                    key={t.id} 
                                                    onClick={() => setPosterTheme(t.id as any)} 
                                                    className={`py-3.5 rounded-xl border text-[9px] font-black uppercase transition-all ${posterTheme === t.id ? 'border-red-500 bg-red-500/10 text-white' : 'border-white/5 bg-stone-950 text-stone-500 hover:text-white'}`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black">Aspect Ratio</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'square', label: 'Square 1:1' },
                                                { id: 'story', label: 'Story 9:16' }
                                            ].map(f => (
                                                <button 
                                                    key={f.id} 
                                                    onClick={() => setPosterFormat(f.id as any)} 
                                                    className={`py-3.5 rounded-xl border text-[9px] font-black uppercase transition-all ${posterFormat === f.id ? 'border-red-500 bg-red-500/10 text-white' : 'border-white/5 bg-stone-950 text-stone-500 hover:text-white'}`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleDownloadPoster} 
                                    className="w-full py-5 bg-gradient-to-r from-red-650 via-orange-500 to-red-650 text-stone-950 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 shadow-xl transition-all active:scale-95 mt-4"
                                >
                                    <Download size={16} strokeWidth={2.5} /> Export High-Res PNG
                                </button>
                            </div>

                            {/* Live Interactive Canvas Mock Preview */}
                            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-stone-950 border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden shadow-inner min-h-[450px]">
                                <div className="absolute inset-0 bg-[#0c0505]/40 blur-3xl pointer-events-none"></div>
                                <div className="text-[9px] text-stone-600 uppercase font-black tracking-[0.3em] mb-4 relative z-10">Live Design Preview</div>
                                
                                {/* Poster Body container */}
                                <div 
                                    className={`relative border transition-all duration-500 overflow-hidden shadow-2xl flex flex-col items-center justify-between p-8 text-center select-none ${
                                        posterFormat === 'square' ? 'w-[320px] h-[320px]' : 'w-[250px] h-[400px]'
                                    } ${
                                        posterTheme === 'lava' ? 'border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.15)]' :
                                        posterTheme === 'gold' ? 'border-yellow-500/40 shadow-[0_0_50px_rgba(234,179,8,0.15)]' :
                                        'border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]'
                                    }`}
                                    style={posterBgImage ? {
                                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.85)), url(${posterBgImage})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    } : {
                                        background: posterTheme === 'lava' ? 'linear-gradient(to bottom, #2b0707, #050101)' :
                                                    posterTheme === 'gold' ? 'linear-gradient(to bottom, #1c1507, #070502)' :
                                                    'linear-gradient(to bottom, #111111, #000000)'
                                    }}
                                >
                                    {/* Poster Borders */}
                                    <div className={`absolute inset-2 border ${posterTheme === 'gold' ? 'border-yellow-500/10' : 'border-red-500/10'} pointer-events-none`}></div>
                                    
                                    {/* Header */}
                                    <div className="relative z-10 space-y-1">
                                        <div className="text-[7px] text-white tracking-[0.2em] font-serif font-black uppercase opacity-90">CHILLIES RESTAURANT</div>
                                        <div className="w-8 h-[1px] bg-white/20 mx-auto"></div>
                                    </div>

                                    {/* Title & Subtitle */}
                                    <div className="relative z-10 space-y-1.5 px-4 my-auto">
                                        <h4 className={`font-serif leading-none tracking-wide font-black transition-all ${
                                            posterFormat === 'square' ? 'text-xl' : 'text-lg'
                                        } ${
                                            posterTheme === 'gold' ? 'text-yellow-400' : 'text-red-500'
                                        }`}>{posterTitle || 'OFFER TITLE'}</h4>
                                        <p className="text-[8px] text-stone-400 font-light leading-relaxed line-clamp-2">{posterSubtitle || 'A culinary masterpiece'}</p>
                                    </div>

                                    {/* Featured Item Preview */}
                                    {items.find(item => item.id === selectedPosterItemId) ? (
                                        <div className="relative z-10 py-1 px-4 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center gap-3 w-5/6 mx-auto mb-2">
                                            <div className="text-left">
                                                <div className="text-[7px] text-stone-400 uppercase font-black leading-tight line-clamp-1">{items.find(item => item.id === selectedPosterItemId)?.name}</div>
                                                <div className="text-[8px] text-white font-mono font-black">Just ₹{items.find(item => item.id === selectedPosterItemId)?.price}/-</div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Default Badge shape */
                                        <div className={`relative z-10 flex flex-col items-center justify-center rounded-full w-20 h-20 shadow-xl ${
                                            posterTheme === 'gold' ? 'bg-yellow-500 text-stone-950' : 'bg-red-500 text-white'
                                        }`}>
                                            <span className="text-[10px] font-black tracking-tighter uppercase font-mono leading-none">{posterBadgeText || 'DEAL'}</span>
                                            <span className="text-[5px] font-black uppercase tracking-widest mt-1 opacity-70">LIMIT TIME</span>
                                        </div>
                                    )}

                                    {/* Footer / CTA */}
                                    <div className="relative z-10 space-y-1">
                                        <div className="text-[6px] text-stone-400 tracking-wider font-light uppercase">ORDER NOW VIA WHATSAPP</div>
                                        <div className={`text-[8px] font-mono font-black ${
                                            posterTheme === 'gold' ? 'text-yellow-400' : 'text-red-500'
                                        }`}>+91 83010 32794</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'complaints' && (
                <div className="max-w-4xl animate-fade-in space-y-12 mx-auto pb-12">
                    <div className="bg-stone-900 border border-white/5 p-10 rounded-[3rem] shadow-xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20"><AlertTriangle size={24} /></div>
                            <div>
                                <h4 className="text-2xl font-serif text-white">Registered Complaints</h4>
                                <p className="text-stone-500 text-xs mt-1">Review and resolve customer issues</p>
                            </div>
                        </div>

                        {complaints.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-stone-800 rounded-3xl">
                                <Check className="mx-auto text-stone-600 mb-4" size={48} />
                                <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Zero Complaints! Great job.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {complaints.map(complaint => (
                                    <div key={complaint.id} className="bg-stone-950 border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-bold text-white text-lg">{complaint.customerName}</span>
                                                        <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-full ${complaint.status === 'resolved' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                                            {complaint.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-stone-500 text-xs font-mono mb-2">
                                                        {complaint.phone} {complaint.orderId && `• Order #${complaint.orderId}`} • {new Date(complaint.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-stone-900 p-4 rounded-2xl border border-white/5">
                                                <h5 className="text-white font-bold text-sm mb-2">{complaint.subject}</h5>
                                                <p className="text-stone-400 text-sm leading-relaxed">{complaint.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex md:flex-col gap-2 shrink-0 md:w-32 justify-end">
                                            {complaint.status === 'open' ? (
                                                <button 
                                                    onClick={() => onUpdateComplaint && complaint.id && onUpdateComplaint(complaint.id, 'resolved')}
                                                    className="flex-1 md:flex-none p-3 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-all border border-green-500/20 flex items-center justify-center gap-2"
                                                    title="Mark Resolved"
                                                >
                                                    <Check size={18} /> <span className="text-xs font-bold md:hidden">Resolve</span>
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => onUpdateComplaint && complaint.id && onUpdateComplaint(complaint.id, 'open')}
                                                    className="flex-1 md:flex-none p-3 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white rounded-xl transition-all border border-orange-500/20 flex items-center justify-center gap-2"
                                                    title="Reopen"
                                                >
                                                    <AlertTriangle size={18} /> <span className="text-xs font-bold md:hidden">Reopen</span>
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => onDeleteComplaint && complaint.id && onDeleteComplaint(complaint.id)}
                                                className="flex-1 md:flex-none p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 flex items-center justify-center gap-2"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={18} /> <span className="text-xs font-bold md:hidden">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'reviews' && (
                <div className="max-w-4xl animate-fade-in space-y-12 mx-auto pb-12">
                    <div className="bg-stone-900 border border-white/5 p-10 rounded-[3rem] shadow-xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-gold-500/10 rounded-2xl flex items-center justify-center text-gold-500 border border-gold-500/20"><Star size={24} /></div>
                            <div>
                                <h4 className="text-2xl font-serif text-white">Customer Reviews</h4>
                                <p className="text-stone-500 text-xs uppercase tracking-widest font-bold">Feedback Portal</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {(foodRatings || []).map(rating => (
                                <div key={rating.id} className="p-6 bg-stone-950/50 rounded-3xl border border-white/5 space-y-4 shadow-inner relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="flex gap-1 justify-end">
                                            {[1,2,3,4,5].map(star => <Star key={star} size={14} className={star <= rating.rating ? "fill-gold-500 text-gold-500" : "text-stone-800"} />)}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{rating.customerName}</p>
                                        <p className="text-stone-500 text-[10px] font-mono mt-1 w-fit">{new Date(rating.createdAt).toLocaleDateString()} at {new Date(rating.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        {rating.contactNumber && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 border border-white/5 rounded-md text-stone-300 text-[10px] font-mono mt-3 shadow-inner">
                                                <Phone size={10} className="text-gold-500" />
                                                {rating.contactNumber}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-stone-300 text-sm italic py-2 border-l-2 border-gold-500/30 pl-4">{rating.comment}</p>
                                </div>
                            ))}
                            {(!foodRatings || foodRatings.length === 0) && (
                                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                    <MessageCircle size={40} className="mx-auto text-stone-700 mb-4" />
                                    <p className="text-stone-500">No feedback received yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'payment' && (
                <div className="max-w-4xl animate-fade-in mx-auto pb-12">
                    <div className="bg-stone-900/80 border border-white/5 rounded-[3rem] p-12 space-y-8 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gold-500/10 rounded-2xl flex items-center justify-center text-gold-500 border border-gold-500/20"><Wallet size={24} /></div>
                            <div>
                                <h4 className="text-2xl font-serif text-white">Payment Gateway Config</h4>
                                <p className="text-stone-500 text-xs uppercase tracking-widest font-bold">Manage Checkout & Rider Payments</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h5 className="text-white text-base font-bold flex items-center gap-3"><Scan size={20} className="text-purple-500" /> Rider App UPI Integration</h5>
                            <div className="bg-stone-950 p-6 rounded-2xl border border-white/5 space-y-3">
                                <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2">Delivery Rider UPI ID</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 9876543210@ybl"
                                    value={storeSettings.deliveryUpiId || ''} 
                                    onChange={e => onUpdateStoreSettings({...storeSettings, deliveryUpiId: e.target.value})} 
                                    className="w-full bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white text-xs outline-none focus:border-purple-500 font-mono tracking-widest"
                                />
                                <p className="text-[10px] text-stone-500 max-w-sm">Dynamic QRs in the rider delivery portal (<span className="text-purple-400 font-mono">/delivery</span>) will receive payments on this ID.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'loyalty' && (
                <div className="max-w-4xl animate-fade-in space-y-12 mx-auto pb-12">
                     <div className="bg-stone-900/80 border border-white/5 rounded-[3rem] p-12 space-y-8 shadow-2xl">
                         <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 bg-gold-500/10 rounded-2xl flex items-center justify-center text-gold-500 border border-gold-500/20"><Award size={24} /></div>
                             <div>
                                 <h4 className="text-2xl font-serif text-white">Loyalty Management</h4>
                                 <p className="text-stone-500 text-xs uppercase tracking-widest font-bold">Manage Points & Accounts</p>
                             </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="bg-stone-950 p-6 rounded-2xl border border-white/5 space-y-4">
                                 <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Phone size={14} className="text-gold-500" /> Customer Search</label>
                                 <input 
                                     type="tel"
                                     value={loyaltySearchPhone}
                                     onChange={e => setLoyaltySearchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                     placeholder="10-digit number"
                                     className="w-full bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-gold-500 font-mono tracking-widest text-center"
                                 />
                                 
                                 {loyaltySearchPhone.length === 10 && (() => {
                                     const account = loyaltyAccounts?.find(a => a.phone === loyaltySearchPhone);
                                     if (account) {
                                         return (
                                             <div className="pt-4 border-t border-white/5 text-center space-y-4">
                                                 <div><h5 className="text-gold-500 font-serif text-3xl font-bold">{account.points} <span className="text-sm text-stone-500 font-sans italic font-normal">pts</span></h5></div>
                                                 <div className="flex flex-col gap-3 mt-4">
                                                     <div className="flex items-center gap-2">
                                                         <input type="number" placeholder="Qty" id={`pts-${account.id}`} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white text-sm outline-none focus:border-gold-500 text-center font-mono" />
                                                         <button onClick={() => { const input = document.getElementById(`pts-${account.id}`) as HTMLInputElement; const pts = Number(input.value); if(pts && !isNaN(pts) && onUpdateLoyaltyAccount && account.id) { onUpdateLoyaltyAccount(account.id, account.points + pts); input.value = ''; } }} className="bg-green-500/10 hover:bg-green-500/20 text-green-500 px-5 py-3 rounded-xl font-bold text-xs transition-colors whitespace-nowrap">Add</button>
                                                         <button onClick={() => { const input = document.getElementById(`pts-${account.id}`) as HTMLInputElement; const pts = Number(input.value); if(pts && !isNaN(pts) && onUpdateLoyaltyAccount && account.id) { onUpdateLoyaltyAccount(account.id, Math.max(0, account.points - pts)); input.value = ''; } }} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-5 py-3 rounded-xl font-bold text-xs transition-colors whitespace-nowrap">Deduct</button>
                                                     </div>
                                                 </div>
                                             </div>
                                         )
                                     } else {
                                         return (
                                              <div className="pt-4 border-t border-white/5 text-center space-y-4">
                                                 <p className="text-stone-500 text-xs">No account found.</p>
                                                 <button onClick={() => { if(onAddLoyaltyAccount) onAddLoyaltyAccount(loyaltySearchPhone, 0); }} className="w-full bg-stone-800 hover:bg-gold-500 hover:text-stone-950 text-white py-3 rounded-xl font-bold text-xs transition-all uppercase tracking-widest">Create Account</button>
                                              </div>
                                         )
                                     }
                                 })()}
                             </div>
                             
                             <div className="bg-stone-950 p-6 rounded-2xl border border-white/5 space-y-4 max-h-[300px] overflow-y-auto">
                                 <h5 className="text-[10px] text-stone-600 uppercase tracking-widest font-black mb-4">Top Members</h5>
                                 {loyaltyAccounts?.sort((a, b) => b.points - a.points).slice(0, 5).map((acc, i) => (
                                     <div key={acc.id} className="flex items-center justify-between p-3 bg-stone-900 rounded-xl border border-white/5 relative overflow-hidden">
                                        {i === 0 && <div className="absolute top-0 right-0 w-2 h-full bg-gold-500"></div>}
                                        <div className="font-mono text-stone-300 tracking-wider text-sm">{acc.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}</div>
                                        <div className="font-bold text-gold-500 text-sm">{acc.points} <span className="text-[10px] text-stone-500 uppercase">pts</span></div>
                                     </div>
                                 ))}
                                 {(!loyaltyAccounts || loyaltyAccounts.length === 0) && <p className="text-stone-500 text-xs text-center py-4">No enrolled members.</p>}
                             </div>
                         </div>
                         <div className="pt-8 border-t border-white/5 space-y-6">
                             <h5 className="text-white text-base font-bold flex items-center gap-3"><Settings size={20} className="text-gold-500" /> Program Configurations</h5>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="bg-stone-950 p-6 rounded-2xl border border-white/5 space-y-3">
                                     <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2">Points Ratio (₹ per Point)</label>
                                     <input 
                                         type="number" 
                                         min="1"
                                         value={storeSettings.loyaltyPointsRatio || 10}
                                         onChange={e => onUpdateStoreSettings({ ...storeSettings, loyaltyPointsRatio: Math.max(1, Number(e.target.value)) })}
                                         className="w-full bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-brand-500 font-mono"
                                     />
                                     <p className="text-[10px] text-stone-500 leading-relaxed">Spend required to earn 1 point.</p>
                                 </div>
                                 <div className="bg-stone-950 p-6 rounded-2xl border border-white/5 space-y-3">
                                     <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2">Minimum Redemption Balance</label>
                                     <input 
                                         type="number" 
                                         min="0"
                                         value={storeSettings.minimumPointsToRedeem !== undefined ? storeSettings.minimumPointsToRedeem : 50}
                                         onChange={e => onUpdateStoreSettings({ ...storeSettings, minimumPointsToRedeem: Math.max(0, Number(e.target.value)) })}
                                         className="w-full bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-gold-500 font-mono"
                                     />
                                     <p className="text-[10px] text-stone-500 leading-relaxed">Balance required before points can be applied to orders.</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-4xl animate-fade-in mx-auto pb-12">
                    <div className="bg-stone-900/80 border border-white/5 rounded-[3rem] p-12 space-y-12 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-serif text-white">Manual Status Toggle</h4>
                                <p className="text-stone-500 text-sm">Instantly open or close kitchen availability.</p>
                            </div>
                            <button 
                                onClick={() => onUpdateStoreSettings({ ...storeSettings, acceptingOrders: !storeSettings.acceptingOrders })} 
                                className={`px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 ${storeSettings.acceptingOrders ? 'bg-green-600 text-white hover:bg-green-500 shadow-green-500/10' : 'bg-red-600 text-white hover:bg-red-500 shadow-red-500/10'}`}
                            >
                                {storeSettings.acceptingOrders ? 'Accepting Orders' : 'Not Accepting Orders'}
                            </button>
                        </div>

                        {storeSettings.acceptingOrders && (
                            <div className="pt-8 border-t border-white/10 space-y-6">
                                <h5 className="text-white text-base font-bold flex items-center gap-3"><Layers size={20} className="text-gold-500" /> Customer Side Theme</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => onUpdateStoreSettings({ ...storeSettings, selectedTheme: 'classic' })}
                                        className={`p-6 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${storeSettings.selectedTheme === 'classic' || !storeSettings.selectedTheme ? 'bg-gold-500/10 border-gold-500' : 'bg-stone-950 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Classic Gold</span>
                                            <div className="flex gap-1.5">
                                                <div className="w-4 h-4 rounded-full bg-[#d4af37] border border-white/10"></div>
                                                <div className="w-4 h-4 rounded-full bg-[#0c0c0c] border border-white/10"></div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-stone-500 leading-relaxed uppercase tracking-wide">The iconic vibrant gold and deep stone aesthetic. Warm, authentic, and high-energy.</p>
                                        {(!storeSettings.selectedTheme || storeSettings.selectedTheme === 'classic') && <div className="absolute top-0 right-0 p-2"><Check size={12} className="text-gold-500" /></div>}
                                    </button>

                                    <button 
                                        onClick={() => onUpdateStoreSettings({ ...storeSettings, selectedTheme: 'professional' })}
                                        className={`p-6 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${storeSettings.selectedTheme === 'professional' ? 'bg-brand-500/10 border-brand-500' : 'bg-stone-950 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Modern Professional</span>
                                            <div className="flex gap-1.5">
                                                <div className="w-4 h-4 rounded-full bg-[#10b981] border border-white/10"></div>
                                                <div className="w-4 h-4 rounded-full bg-[#020617] border border-white/10"></div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-stone-500 leading-relaxed uppercase tracking-wide">Sleek emerald and midnight slate. Minimalist, premium, and calm for a modern feel.</p>
                                        {storeSettings.selectedTheme === 'professional' && <div className="absolute top-0 right-0 p-2"><Check size={12} className="text-brand-500" /></div>}
                                    </button>

                                    <button 
                                        onClick={async () => {
                                            if (confirm('This will log out notifications on ALL admin devices. You will need to click "Register Android App" again on this phone. Continue?')) {
                                                onUpdateStoreSettings({ ...storeSettings, adminTokens: [] });
                                                alert('Registry cleared. Please click "Register Android App" below to re-link this phone.');
                                            }
                                        }}
                                        className="p-6 rounded-[2rem] border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all text-left group md:col-span-2 mt-4"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Troubleshooting: Reset Registry</span>
                                            <Trash2 size={16} className="text-red-500" />
                                        </div>
                                        <p className="text-[10px] text-stone-500 leading-relaxed uppercase tracking-wide">Fixes "sometimes not receiving" issues by clearing old/dead device tokens. Use this if notifications are inconsistent.</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/10">
                            <div className="space-y-6 md:col-span-2">
                                <h5 className="text-white text-base font-bold flex items-center gap-3"><MessageSquare size={20} className="text-brand-500" /> Customer Bulletin</h5>
                                <div className="bg-stone-950 p-6 rounded-2xl border border-white/5 space-y-4">
                                     <div className="flex items-center justify-between">
                                        <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2">Enable Announcement Banner</label>
                                        <button 
                                            onClick={() => onUpdateStoreSettings({ ...storeSettings, isAnnouncementActive: !storeSettings.isAnnouncementActive })}
                                            className={`group relative flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-1 transition-all duration-300 ease-in-out focus:outline-none ${storeSettings.isAnnouncementActive ? 'bg-brand-500 shadow-[0_0_15px_rgba(255,107,107,0.3)]' : 'bg-stone-800 border border-stone-700'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full ring-0 transition duration-300 ease-in-out ${storeSettings.isAnnouncementActive ? 'translate-x-5 bg-white' : 'translate-x-0 bg-stone-500'}`} />
                                        </button>
                                     </div>
                                     <textarea 
                                         value={storeSettings.announcement || ''}
                                         onChange={e => onUpdateStoreSettings({ ...storeSettings, announcement: e.target.value })}
                                         placeholder="e.g. Holiday Hours!\n(Press ENTER to add multiple announcements)"
                                         className={`w-full bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-brand-500 outline-none h-24 resize-none transition-all ${!storeSettings.isAnnouncementActive ? 'opacity-50' : ''}`}
                                         disabled={!storeSettings.isAnnouncementActive}
                                     />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h5 className="text-white text-base font-bold flex items-center gap-3"><Clock size={20} className="text-gold-500" /> Opening Window</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-stone-950 p-5 rounded-2xl border border-white/5 space-y-1">
                                        <label className="text-[8px] text-stone-600 uppercase tracking-[0.2em] block font-black">Opening</label>
                                        <input type="time" value={storeSettings.startTime} onChange={e => onUpdateStoreSettings({ ...storeSettings, startTime: e.target.value })} className="w-full bg-transparent text-white font-mono focus:outline-none [color-scheme:dark]" />
                                    </div>
                                    <div className="bg-stone-950 p-5 rounded-2xl border border-white/5 space-y-1">
                                        <label className="text-[8px] text-stone-600 uppercase tracking-[0.2em] block font-black">Closing</label>
                                        <input type="time" value={storeSettings.endTime} onChange={e => onUpdateStoreSettings({ ...storeSettings, endTime: e.target.value })} className="w-full bg-transparent text-white font-mono focus:outline-none [color-scheme:dark]" />
                                    </div>
                                </div>
                            </div>
                            
                            
                            <div className="space-y-6">
                                <h5 className="text-white text-base font-bold flex items-center gap-3"><MessageCircle size={20} className="text-gold-500" /> Feedback Portal</h5>
                                <div className="bg-stone-950 p-6 rounded-2xl border border-white/5 space-y-3">
                                    <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2">Customer Rating Link</label>
                                    <div className="flex gap-2">
                                        <input 
                                            readOnly 
                                            value={`${window.location.origin}/feedback`}
                                            className="w-full bg-stone-900 border border-stone-800 rounded-2xl p-4 text-stone-500 text-xs outline-none font-mono"
                                        />
                                        <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/feedback`)} className="px-6 bg-gold-500 text-stone-950 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-gold-400 whitespace-nowrap border border-gold-500">Copy URL</button>
                                    </div>
                                    <p className="text-[10px] text-stone-500 max-w-xs leading-relaxed">Share this link directly with customers to collect their dining experience ratings.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-stone-800 space-y-6 mt-10">
                            <h5 className="text-white text-base font-bold flex items-center gap-3"><Printer size={20} className="text-gold-500" /> Network KOT Printers</h5>
                            <div className="bg-stone-950 p-6 rounded-2xl border border-white/5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input 
                                        type="text" 
                                        placeholder="Printer Name (e.g. Kitchen Main)" 
                                        value={newPrinterName} 
                                        onChange={e => setNewPrinterName(e.target.value)} 
                                        className="col-span-1 bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-gold-500"
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="IP Address (e.g. 192.168.1.100)" 
                                        value={newPrinterIp} 
                                        onChange={e => setNewPrinterIp(e.target.value)} 
                                        className="col-span-1 bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-gold-500 font-mono tracking-wider"
                                    />
                                    <button 
                                        onClick={() => {
                                            if(newPrinterName && newPrinterIp) {
                                                const updatedPrinters = [...(storeSettings.kotPrinters || []), {name: newPrinterName, ip: newPrinterIp}];
                                                onUpdateStoreSettings({...storeSettings, kotPrinters: updatedPrinters});
                                                setNewPrinterName('');
                                                setNewPrinterIp('');
                                            }
                                        }}
                                        className="col-span-1 bg-gold-500 text-stone-950 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-gold-400"
                                    >
                                        Add Printer
                                    </button>
                                </div>
                                <button
                                    onClick={async () => {
                                        setIsScanningPrinters(true);
                                        try {
                                            const { printers, scannedSubnets } = await discoverNetworkPrinters();
                                            if (printers && printers.length > 0) {
                                                setNewPrinterIp(printers[0]);
                                                if (!newPrinterName) setNewPrinterName("Auto Discovered Printer");
                                                alert(`Found ${printers.length} printer(s)! IP ${printers[0]} has been filled in.`);
                                            } else {
                                                const subnetMsg = scannedSubnets.length > 0 ? `\n\nScanned Subnets: ${scannedSubnets.join(', ')}\nEnsure your printer is on one of these subnets.` : "";
                                                alert("No ESC/POS network printers found on port 9100." + subnetMsg);
                                            }
                                        } catch (e) {
                                            alert("Scanner failed. Ensure you are running the native Android app and connected to WiFi.");
                                        } finally {
                                            setIsScanningPrinters(false);
                                        }
                                    }}
                                    disabled={isScanningPrinters}
                                    className={`w-full ${isScanningPrinters ? 'bg-brand-500/50 cursor-wait' : 'bg-brand-500 hover:bg-brand-400'} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all p-3 flex items-center justify-center gap-2`}
                                >
                                    <Search size={16} className={isScanningPrinters ? "animate-spin" : ""} />
                                    {isScanningPrinters ? 'Scanning WiFi Subnet...' : 'Auto-Detect Printers on WiFi'}
                                </button>
                                <div className="space-y-3 mt-6">
                                    {(storeSettings.kotPrinters || []).map((printer, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-stone-900 border border-stone-800 rounded-2xl">
                                            <div>
                                                <p className="text-white font-bold text-sm">{printer.name}</p>
                                                <p className="text-stone-500 font-mono text-[10px] uppercase tracking-widest mt-1">IP: {printer.ip} | Port: 9100</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        const updated = (storeSettings.kotPrinters || []).filter((_, i) => i !== index);
                                                        onUpdateStoreSettings({...storeSettings, kotPrinters: updated});
                                                    }}
                                                    className="p-3 text-red-500 hover:bg-red-950 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!storeSettings.kotPrinters || storeSettings.kotPrinters.length === 0) && (
                                        <p className="text-stone-600 text-xs text-center py-4 italic">No network printers configured. System will fallback to browser print dialog.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-stone-800 space-y-6 mt-10">
                            <h5 className="text-white text-base font-bold flex items-center gap-3"><BellRing size={20} className="text-brand-500" /> Background Notifications</h5>
                            <div className="bg-stone-950 p-6 rounded-2xl border border-brand-800 space-y-4">
                                <div className="flex flex-col gap-4">
                                    <p className="text-[10px] text-stone-500 max-w-sm leading-relaxed">Register this device to receive secure Push Notifications for new orders, even if the app is completely closed.</p>
                                    
                                    <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">FCM Registry</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${storeSettings.adminTokens && storeSettings.adminTokens.length > 0 ? 'bg-green-500 shadow-lg' : 'bg-red-500 animate-pulse'}`}></div>
                                                <span className="text-[9px] text-stone-500 uppercase tracking-widest font-bold">
                                                    {storeSettings.adminTokens && storeSettings.adminTokens.length > 0 
                                                        ? `${storeSettings.adminTokens.length} Admin Device(s)` 
                                                        : 'Unregistered'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Permission Checklist for Android */}
                                        <div className="pt-3 border-t border-stone-800 space-y-2">
                                            <p className="text-[8px] text-stone-600 uppercase font-black tracking-[0.2em]">Required Android Settings</p>
                                            <div className="flex items-center gap-2">
                                                <Check size={10} className="text-green-500" />
                                                <span className="text-[10px] text-stone-500">Notifications: Allowed</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle size={10} className="text-gold-500" />
                                                <span className="text-[10px] text-stone-500">Display Over Apps: Check Settings</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Zap size={10} className="text-gold-500" />
                                                <span className="text-[10px] text-stone-500">Battery: Unrestricted (Recommended)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={async () => {
                                        try {
                                            const { Capacitor } = await import('@capacitor/core');
                                            const isNative = Capacitor.isNativePlatform();
                                            
                                            if (isNative) {
                                                console.log("Triggering Native Push Sync...");
                                                const { PushNotifications } = await import('@capacitor/push-notifications');
                                                const res = await PushNotifications.requestPermissions();
                                                if (res.receive === 'granted') {
                                                    await PushNotifications.register();
                                                    alert("Native Sync Triggered! If your device wasn't already registered, it is now syncing with the database. Check the 'Admin Device(s)' count above in a few seconds.");
                                                } else {
                                                    alert("Notification permission denied in Android Settings. Please enable them to receive alerts.");
                                                }
                                            } else {

                                                // WEB PUSH PATH
                                                console.log("Registering for Web Push...");
                                                if (!messaging) {
                                                    alert('Push notifications are not supported in this browser environment.');
                                                    return;
                                                }
                                                const permission = await Notification.requestPermission();
                                                if (permission === 'granted') {
                                                    const { getToken } = await import('firebase/messaging');
                                                    // IMPORTANT: Replace the key below with your actual VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push Certificates
                                                    const VAPID_KEY = 'BHcAqM5__bhlDGUtAjxBAlLfTxQCq9UxfSi0bCalkbMorZVrRZJ-Xq7fuD9RKjMQkBnAWzJemeja6sZDd8GQRCo';
                                                    
                                                    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
                                                    const updatedTokens = Array.from(new Set([...(storeSettings.adminTokens || []), token]));
                                                    onUpdateStoreSettings({...storeSettings, adminTokens: updatedTokens});
                                                    alert('Web Browser Push Registered Successfully!');
                                                }
                                            }
                                        } catch (e: any) {
                                            console.error('Registration Error:', e);
                                            if (e.message?.includes('vapidKey')) {
                                                alert('VAPID Key Error: Please ensure you have generated and pasted your Web Push Certificate key from the Firebase Console into AdminPanel.tsx');
                                            } else {
                                                alert('Failed to register: ' + e.message);
                                            }
                                        }
                                    }}
                                    className="w-full bg-stone-900 border border-brand-800 text-brand-500 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-brand-500 hover:text-white p-4 flex items-center justify-center gap-2"
                                >
                                    Register This Device
                                </button>
                            </div>
                        </div>


                        <div className="pt-10 border-t border-stone-800 space-y-6 mt-10">
                            <h5 className="text-white text-base font-bold flex items-center gap-3"><Smartphone size={20} className="text-brand-500" /> App Installation</h5>
                            {deferredPrompt ? (
                                <button 
                                    onClick={handleInstallClick}
                                    className="px-8 py-4 bg-brand-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-400 transition-all shadow-lg active:scale-95 flex items-center gap-2 w-fit"
                                >
                                    <Download size={16} /> Install Admin App
                                </button>
                            ) : (
                                <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl w-fit">
                                    <p className="text-stone-500 text-[10px] uppercase font-black tracking-[0.1em]">Install option unavailable</p>
                                    <p className="text-stone-600 text-xs mt-1 max-w-xs">If on iOS, tap 'Share' then 'Add to Home Screen'. Otherwise, app may already be installed.</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-10 border-t border-stone-800 space-y-6 mt-10">
                            <h5 className="text-white text-base font-bold flex items-center gap-3"><Send size={20} className="text-brand-500" /> Dispatch Push Notification</h5>
                            <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black">Notification Title</label>
                                    <input 
                                        type="text"
                                        value={pushTitle}
                                        onChange={e => setPushTitle(e.target.value)}
                                        className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black">Message Body</label>
                                    <textarea 
                                        value={pushBody}
                                        onChange={e => setPushBody(e.target.value)}
                                        className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none h-20 resize-none transition-all"
                                    />
                                </div>
                                <button 
                                    onClick={async () => {
                                        if (pushTitle && pushBody) {
                                            try {
                                                await addDoc(collection(db, 'broadcasts'), {
                                                    title: pushTitle,
                                                    body: pushBody,
                                                    timestamp: Date.now()
                                                });
                                                alert("Broadcast sequence initiated! All registered devices will receive the push shortly.");
                                            } catch (e) {
                                                console.error("Broadcast failed:", e);
                                                alert("Failed to initiate broadcast. Check connection.");
                                            }
                                        }
                                    }}
                                    className="w-full bg-brand-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] hover:bg-brand-400 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Send size={16} /> Broadcast Now
                                </button>
                                <p className="text-[10px] text-stone-500 max-w-xs leading-relaxed text-center w-full">This directly prompts all active, opted-in users who have notifications enabled.</p>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-stone-800 space-y-6 mt-10">
                            <h5 className="text-white text-base font-bold flex items-center gap-3"><MessageCircle size={20} className="text-gold-500" /> System Diagnostics</h5>
                            <button 
                                onClick={() => { if(onTestNotification) onTestNotification(); }} 
                                className="px-8 py-4 bg-stone-950 border border-stone-800 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] hover:border-gold-500 hover:text-gold-500 transition-all shadow-inner"
                            >
                                Test Push Notifications
                            </button>
                            <p className="text-stone-500 text-xs mt-3">Click to verify that your browser has granted permission and the ServiceWorker is capable of dispatching local Push Notification alerts.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'predictions' && (
                <div className="max-w-6xl animate-fade-in mx-auto pb-12 px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-serif text-white">FIFA World Cup Predictions</h3>
                            <p className="text-stone-500 text-xs mt-1">Add, edit matches, set statuses, and declare winners to tally votes.</p>
                        </div>
                        <div className="flex gap-3">
                            <input 
                                type="file" 
                                accept=".json"
                                onChange={handleUploadJSONMatches}
                                className="hidden"
                                id="json-match-file-upload"
                            />
                            <button 
                                onClick={() => document.getElementById('json-match-file-upload')?.click()}
                                className="bg-stone-900 hover:bg-stone-800 border border-stone-850 text-gold-500 hover:text-gold-450 font-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Upload size={14} /> Upload Matches JSON
                            </button>
                            <button 
                                onClick={handleSyncMatchesFromAPI}
                                disabled={isSyncingMatches}
                                className="bg-stone-900 hover:bg-stone-800 border border-stone-850 text-gold-500 hover:text-gold-450 font-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <RefreshCw size={14} className={isSyncingMatches ? 'animate-spin' : ''} /> {isSyncingMatches ? 'Syncing...' : 'Sync Matches from API'}
                            </button>
                            <button 
                                onClick={handleDeleteAllMatches}
                                className="bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white font-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete All Matches
                            </button>
                            <button 
                                onClick={openNewMatchModal}
                                className="bg-gold-500 hover:bg-gold-400 text-stone-950 font-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={14} className="stroke-[3]" /> Add Match
                            </button>
                        </div>
                    </div>

                    {isMatchFormOpen && (
                        <div id="match-form-container" className="bg-stone-900/90 border border-gold-500/20 rounded-[2.5rem] p-8 mb-8 shadow-2xl animate-fade-in relative">
                            <button onClick={() => setIsMatchFormOpen(false)} className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h4 className="text-lg font-serif text-white mb-6">{editingMatch ? 'Edit World Cup Match' : 'Add World Cup Match'}</h4>
                            <form onSubmit={handleSaveMatch} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Team A</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Flag Emoji (e.g. 🇧🇷)" 
                                                value={matchTeamAFlag}
                                                onChange={e => setMatchTeamAFlag(e.target.value)}
                                                className="w-20 bg-stone-950 border border-stone-800 rounded-xl p-4 text-center text-xl focus:border-gold-500 outline-none text-white"
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Team A Name (e.g. Brazil)" 
                                                value={matchTeamA}
                                                onChange={e => setMatchTeamA(e.target.value)}
                                                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-sm focus:border-gold-500 outline-none text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Team B</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Flag Emoji (e.g. 🇭🇷)" 
                                                value={matchTeamBFlag}
                                                onChange={e => setMatchTeamBFlag(e.target.value)}
                                                className="w-20 bg-stone-950 border border-stone-800 rounded-xl p-4 text-center text-xl focus:border-gold-500 outline-none text-white"
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Team B Name (e.g. Croatia)" 
                                                value={matchTeamB}
                                                onChange={e => setMatchTeamB(e.target.value)}
                                                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-sm focus:border-gold-500 outline-none text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Match Date</label>
                                        <input 
                                            type="date" 
                                            value={matchDateInput}
                                            onChange={e => setMatchDateInput(e.target.value)}
                                            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-sm focus:border-gold-500 outline-none text-white [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Match Time</label>
                                        <input 
                                            type="time" 
                                            value={matchTimeInput}
                                            onChange={e => setMatchTimeInput(e.target.value)}
                                            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-sm focus:border-gold-500 outline-none text-white [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Match Status</label>
                                        <select 
                                            value={matchStatusInput}
                                            onChange={e => setMatchStatusInput(e.target.value as any)}
                                            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-sm focus:border-gold-500 outline-none text-white"
                                        >
                                            <option value="upcoming">Upcoming</option>
                                            <option value="live">Live</option>
                                            <option value="finished">Finished</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Declared Winner (Finished Status only)</label>
                                        <select 
                                            value={matchWinnerInput}
                                            onChange={e => setMatchWinnerInput(e.target.value as any)}
                                            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-sm focus:border-gold-500 outline-none text-white"
                                            disabled={matchStatusInput !== 'finished'}
                                        >
                                            <option value="">Undecided / None</option>
                                            <option value="teamA">{matchTeamA || 'Team A'} Winner</option>
                                            <option value="teamB">{matchTeamB || 'Team B'} Winner</option>
                                            <option value="draw">Draw / Tie</option>
                                        </select>
                                    </div>
                                    
                                    {editingMatch && (
                                        <div className="grid grid-cols-3 gap-4 border-t border-stone-800 pt-6 col-span-1 md:col-span-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Votes {matchTeamA || 'Team A'}</label>
                                                <input 
                                                    type="number" 
                                                    value={matchVotesTeamA}
                                                    onChange={e => setMatchVotesTeamA(Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-sm focus:border-gold-500 outline-none text-white font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Votes Draw</label>
                                                <input 
                                                    type="number" 
                                                    value={matchVotesDraw}
                                                    onChange={e => setMatchVotesDraw(Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-sm focus:border-gold-500 outline-none text-white font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-stone-500 uppercase tracking-widest font-black block">Votes {matchTeamB || 'Team B'}</label>
                                                <input 
                                                    type="number" 
                                                    value={matchVotesTeamB}
                                                    onChange={e => setMatchVotesTeamB(Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-sm focus:border-gold-500 outline-none text-white font-mono"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        type="submit"
                                        className="bg-gold-500 hover:bg-gold-400 text-stone-950 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Save Match
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsMatchFormOpen(false)}
                                        className="bg-stone-800 hover:bg-stone-700 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="bg-stone-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden p-6 md:p-10 shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-stone-800 text-[10px] text-stone-500 uppercase tracking-widest font-black">
                                        <th className="pb-6 pl-4">Match</th>
                                        <th className="pb-6">Date & Time</th>
                                        <th className="pb-6">Status</th>
                                        <th className="pb-6">Votes (A / Draw / B)</th>
                                        <th className="pb-6 pr-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-800/40 text-xs">
                                    {worldCupMatches.map(match => (
                                        <tr key={match.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="py-6 pl-4 font-serif font-bold text-sm text-white">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl shrink-0">{match.teamAFlag}</span>
                                                    <span>{match.teamA}</span>
                                                    <span className="text-stone-600 font-light font-sans text-xs">vs</span>
                                                    <span className="text-xl shrink-0">{match.teamBFlag}</span>
                                                    <span>{match.teamB}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 text-stone-300 font-mono">
                                                {match.matchDate} @ {match.matchTime}
                                            </td>
                                            <td className="py-6">
                                                {match.status === 'live' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-950 text-red-400 border border-red-800/30 animate-pulse">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Live
                                                    </span>
                                                ) : match.status === 'finished' ? (
                                                    <div className="flex flex-col gap-1.5 items-start">
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-950 text-green-400 border border-green-800/30">
                                                            Winner: {match.winner === 'teamA' ? match.teamA : match.winner === 'teamB' ? match.teamB : match.winner === 'draw' ? 'Draw' : 'TBD'}
                                                        </span>
                                                        {match.winner && (
                                                            <div className="flex flex-col gap-1 items-start mt-1">
                                                                {match.luckyWinnerPhone && (
                                                                    (() => {
                                                                        const matchingOrder = orders.find(o => o.id === match.luckyWinnerPhone);
                                                                        const displayName = matchingOrder ? `${matchingOrder.customerName} (#${match.luckyWinnerPhone})` : `Bill #${match.luckyWinnerPhone}`;
                                                                        return (
                                                                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gold-400 text-glow-gold mb-1">
                                                                                🎁 Lucky: {displayName}
                                                                            </span>
                                                                        );
                                                                    })()
                                                                )}
                                                                <button 
                                                                    onClick={() => handleDrawLuckyWinner(match)}
                                                                    disabled={isDrawingLuckyWinner[match.id]}
                                                                    className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gold-500 hover:text-gold-400 transition-colors"
                                                                >
                                                                    <Gift size={10} className={isDrawingLuckyWinner[match.id] ? 'animate-spin' : ''} /> 
                                                                    {match.luckyWinnerPhone ? 'Redraw Winner 🔄' : 'Draw Lucky Winner 🎲'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-stone-800 text-stone-400 border border-stone-700/30">
                                                        Upcoming
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-6 font-mono text-stone-300">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gold-500 font-bold">{match.votesTeamA || 0}</span>
                                                    <span className="text-stone-700">/</span>
                                                    <span className="text-stone-500">{match.votesDraw || 0}</span>
                                                    <span className="text-stone-700">/</span>
                                                    <span className="text-gold-500 font-bold">{match.votesTeamB || 0}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 pr-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleViewVoters(match)}
                                                        className="p-2.5 text-stone-400 hover:text-blue-400 hover:bg-stone-800/50 rounded-xl transition-all"
                                                        title="View Predictions & Voter Contacts"
                                                    >
                                                        <User size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => openEditMatchModal(match)}
                                                        className="p-2.5 text-stone-400 hover:text-gold-500 hover:bg-stone-800/50 rounded-xl transition-all"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteMatch(match.id)}
                                                        className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-stone-800/50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {worldCupMatches.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-stone-600 italic">No matches created yet. Click "+ Add Match" to get started.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Lucky Winner Celebration Modal */}
                    {luckyWinnerPhone && (
                      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => { setLuckyWinnerPhone(null); setLuckyWinnerMatchId(null); }}>
                        <div className="bg-stone-900 border border-gold-500 rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
                          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent pointer-events-none"></div>
                          
                          {/* Sparkles / Celebration Icon */}
                          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-gold-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold-500/20 relative animate-bounce-slow">
                            <PartyPopper size={36} className="text-stone-950" />
                          </div>
                          
                          <h3 className="text-2xl font-serif text-white mb-2 uppercase tracking-wide">Lucky Winner Drawn!</h3>
                          <p className="text-stone-500 text-xs leading-relaxed mb-6">A predictor has been randomly selected from the correct answers pool for this match!</p>
                          
                          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 mb-8 shadow-inner">
                            {(() => {
                              const matchingOrder = orders.find(o => o.id === luckyWinnerPhone);
                              if (matchingOrder) {
                                return (
                                  <div className="space-y-3">
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black block mb-1">Customer Name</span>
                                      <span className="text-lg font-bold text-white capitalize">{matchingOrder.customerName}</span>
                                    </div>
                                    <div className="flex flex-col items-center mt-3">
                                      <span className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black block mb-1">Contact Number</span>
                                      <span className="font-mono text-xl font-black text-gold-400 tracking-wider text-glow-gold select-all">{matchingOrder.contactNumber}</span>
                                    </div>
                                    <div className="flex flex-col items-center mt-3">
                                      <span className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black block mb-1">Verified Bill</span>
                                      <span className="font-mono text-xs text-stone-500 font-bold">#{luckyWinnerPhone}</span>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <>
                                  <span className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black block mb-2">Selected Account Phone</span>
                                  <span className="font-mono text-2xl font-black text-gold-400 tracking-wider text-glow-gold">{luckyWinnerPhone}</span>
                                </>
                              );
                            })()}
                          </div>
                          
                          <button 
                            onClick={() => { setLuckyWinnerPhone(null); setLuckyWinnerMatchId(null); }}
                            className="w-full bg-gradient-to-r from-amber-600 via-gold-500 to-amber-600 text-stone-950 font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg"
                          >
                            Excellent
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Voters / Predictions list modal */}
                    {viewingVotersMatch && (
                      <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setViewingVotersMatch(null)}>
                        <div className="bg-stone-900 border border-stone-800 rounded-[2.5rem] w-full max-w-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                          {/* Modal Header */}
                          <div className="p-8 border-b border-stone-800 flex justify-between items-center bg-stone-950 shrink-0">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center text-stone-950 shadow-lg"><User size={20} className="stroke-[3]" /></div>
                              <div>
                                <h3 className="text-xl font-serif text-white leading-none">Predictions & Voter Contacts</h3>
                                <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">
                                  {viewingVotersMatch.teamA} vs {viewingVotersMatch.teamB}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => setViewingVotersMatch(null)} className="text-stone-500 hover:text-white transition-all"><X size={28} /></button>
                          </div>

                          {/* Modal Body */}
                          <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {isLoadingVoters ? (
                              <div className="text-center py-12 text-stone-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Voters...</div>
                            ) : votersList.length === 0 ? (
                              <p className="text-center text-stone-600 italic py-12 bg-stone-950/40 border border-white/5 rounded-2xl">No votes cast yet for this match.</p>
                            ) : (
                              <div className="overflow-x-auto bg-stone-950/40 border border-white/5 rounded-2xl">
                                <table className="w-full border-collapse text-left text-xs text-stone-300">
                                  <thead>
                                    <tr className="border-b border-stone-800 text-[10px] text-stone-500 uppercase tracking-widest font-black">
                                      <th className="py-4 pl-6">Voter Name</th>
                                      <th className="py-4">Bill No.</th>
                                      <th className="py-4">Voter Phone</th>
                                      <th className="py-4">Selection</th>
                                      <th className="py-4 pr-6 text-right">Time Cast</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-stone-800/40 font-mono">
                                    {votersList.map(voter => {
                                      const dateStr = voter.createdAt ? new Date(voter.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'N/A';
                                      const selStr = voter.predictedWinner === 'teamA' ? viewingVotersMatch.teamA : voter.predictedWinner === 'teamB' ? viewingVotersMatch.teamB : 'Draw';
                                      const selColor = voter.predictedWinner === 'draw' ? 'text-stone-450' : 'text-gold-400 font-bold';
                                      
                                      const matchingOrder = orders.find(o => o.id === voter.billNumber);
                                      const voterName = matchingOrder ? matchingOrder.customerName : (voter.name && !voter.name.startsWith('Voter #') ? voter.name : 'Anonymous');
                                      const voterPhone = matchingOrder ? matchingOrder.contactNumber : (voter.phone && voter.phone !== voter.billNumber ? voter.phone : 'N/A');

                                      return (
                                        <tr key={voter.id} className="hover:bg-white/3 transition-colors">
                                          <td className="py-4 pl-6 text-stone-400 font-sans">{voterName}</td>
                                          <td className="py-4 text-gold-400 font-bold font-mono">#{voter.billNumber || 'N/A'}</td>
                                          <td className="py-4 text-white font-bold select-all">{voterPhone}</td>
                                          <td className={`py-4 ${selColor}`}>{selStr}</td>
                                          <td className="py-4 pr-6 text-right text-stone-500">{dateStr}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          {/* Modal Footer */}
                          <div className="p-6 bg-stone-950 border-t border-stone-800 shrink-0 flex justify-between items-center text-[10px] uppercase font-bold text-stone-500">
                            <span>Total Predictions: {votersList.length}</span>
                            <button onClick={() => setViewingVotersMatch(null)} className="px-6 py-3 bg-stone-900 border border-white/5 hover:border-white/10 rounded-xl text-white font-black uppercase tracking-widest">Close</button>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
            )}
        </div>
      </main>

      {isScannerOpen && (
        <BarcodeScanner 
          onScan={(text) => { setOrderSearch(text); setIsScannerOpen(false); }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* Manual Order Modal */}
      {isManualOrderOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-stone-950 animate-fade-in overflow-y-auto">
            <div className="bg-stone-900 border border-stone-800 rounded-[3rem] w-full max-w-4xl shadow-[0_0_100px_rgba(0,0,0,0.8)] my-8 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-stone-800 flex justify-between items-center bg-stone-950 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center text-stone-950 shadow-lg shadow-gold-500/20"><ShoppingBag size={24} className="stroke-[3]" /></div>
                        <div>
                            <h3 className="text-xl font-serif text-white leading-none">Walk-in Order</h3>
                            <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">Manual POS System</p>
                        </div>
                    </div>
                    <button onClick={() => setIsManualOrderOpen(false)} className="text-stone-500 hover:text-white transition-all"><X size={28} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Side: Items Selection */}
                    <div className="space-y-6 flex flex-col h-full">
                        <div className="space-y-4">
                            <h4 className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-stone-800 pb-4">Menu Items</h4>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search items..." 
                                    value={manualOrderSearch}
                                    onChange={e => setManualOrderSearch(e.target.value)}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-white focus:border-gold-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide flex-1 auto-rows-max">
                            {items.filter(i => i.name.toLowerCase().includes(manualOrderSearch.toLowerCase())).map(item => {
                                const cartItem = manualOrderItems.find(i => i.item.id === item.id);
                                const qty = cartItem ? cartItem.quantity : 0;
                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => {
                                            setManualOrderItems(prev => {
                                                const existing = prev.find(p => p.item.id === item.id);
                                                if (existing) {
                                                    return prev.map(p => p.item.id === item.id ? {...p, quantity: p.quantity + 1} : p);
                                                }
                                                return [...prev, {item, quantity: 1}];
                                            });
                                        }}
                                        className="relative bg-stone-950 rounded-2xl border border-stone-800 hover:border-gold-500 overflow-hidden cursor-pointer group flex flex-col h-40 transition-all active:scale-95 shadow-lg"
                                    >
                                        <div className="absolute top-2 right-2 bg-stone-900 px-2 py-1 rounded-lg text-gold-500 font-mono font-bold text-[10px] z-10 shadow-sm">₹{item.price}</div>
                                        {qty > 0 && <div className="absolute top-2 left-2 bg-gold-500 text-stone-950 px-2 py-1 rounded-lg font-black text-[10px] z-10 shadow-sm">{qty}x</div>}
                                        <div className="h-24 w-full shrink-0 relative bg-stone-900">
                                            {item.image ? (
                                                <SafeImage src={item.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center opacity-30"><ImageIcon size={24} className="text-stone-500" /></div>
                                            )}
                                        </div>
                                        <div className="p-3 flex-1 flex items-center justify-center text-center bg-stone-950">
                                            <p className="text-white text-xs font-bold line-clamp-2 leading-tight group-hover:text-gold-500 transition-colors">{item.name}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    {/* Right Side: Order Details */}
                    <div className="space-y-6 flex flex-col h-full">
                        <h4 className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-stone-800 pb-4">Customer Details</h4>
                        <div className="space-y-4">
                            <input type="text" placeholder="Customer Name" value={manualCustomerName} onChange={e => setManualCustomerName(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none" />
                            <input type="tel" placeholder="Contact Number (Optional for walk-in)" value={manualContact} onChange={e => setManualContact(e.target.value.replace(/\D/g, '').slice(0,10))} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setManualOrderType('pickup')} className={`py-4 rounded-xl border text-[10px] uppercase font-black tracking-[0.2em] transition-all ${manualOrderType === 'pickup' ? 'bg-gold-500 text-stone-950 border-gold-500 shadow-lg' : 'bg-stone-950 text-stone-500 border-stone-800 hover:border-stone-700'}`}>Pickup/Dine-in</button>
                                <button onClick={() => setManualOrderType('delivery')} className={`py-4 rounded-xl border text-[10px] uppercase font-black tracking-[0.2em] transition-all ${manualOrderType === 'delivery' ? 'bg-gold-500 text-stone-950 border-gold-500 shadow-lg' : 'bg-stone-950 text-stone-500 border-stone-800 hover:border-stone-700'}`}>Delivery</button>
                            </div>
                            {manualOrderType === 'delivery' && (
                                <textarea placeholder="Delivery Address" value={manualAddress} onChange={e => setManualAddress(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none h-24 resize-none" />
                            )}
                        </div>
                        
                        <div className="bg-stone-950 p-6 rounded-[2rem] border border-stone-800 mt-auto shadow-inner flex flex-col flex-1 min-h-0">
                            <h4 className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-stone-800 pb-3 mb-4 shrink-0">Added Items</h4>
                            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-3 mb-4">
                                {manualOrderItems.length === 0 ? (
                                    <p className="text-stone-600 text-xs italic text-center py-4">Cart is empty</p>
                                ) : (
                                    manualOrderItems.map(item => (
                                        <div key={item.item.id} className="flex flex-col gap-3 p-4 bg-stone-900 rounded-xl border border-stone-800">
                                            <div className="flex justify-between items-start text-sm gap-2">
                                                <span className="text-stone-200 font-bold leading-tight">{item.item.name}</span>
                                                <span className="text-gold-500 font-mono shrink-0 font-bold">₹{(item.item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 bg-stone-950 rounded-lg border border-stone-800 p-1">
                                                    <button onClick={() => {
                                                        if (item.quantity > 1) {
                                                            setManualOrderItems(prev => prev.map(p => p.item.id === item.item.id ? {...p, quantity: p.quantity - 1} : p));
                                                        } else {
                                                            setManualOrderItems(prev => prev.filter(p => p.item.id !== item.item.id));
                                                        }
                                                    }} className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-red-500 transition-colors"><Minus size={12} /></button>
                                                    <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => {
                                                        setManualOrderItems(prev => prev.map(p => p.item.id === item.item.id ? {...p, quantity: p.quantity + 1} : p));
                                                    }} className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-green-500 transition-colors"><Plus size={12} /></button>
                                                </div>
                                                <button onClick={() => {
                                                    setManualOrderItems(prev => prev.filter(p => p.item.id !== item.item.id));
                                                }} className="text-[10px] text-red-500 hover:text-red-400 uppercase tracking-widest font-black transition-colors bg-red-950 px-3 py-1.5 rounded-lg">Remove</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="pt-4 border-t border-stone-800 shrink-0">
                                <div className="flex justify-between items-center text-white mb-3">
                                    <span className="text-stone-500 text-[10px] uppercase tracking-widest font-black">Subtotal</span>
                                    <span className="font-mono text-sm">₹{manualOrderItems.reduce((acc, i) => acc + (i.item.price * i.quantity), 0)}</span>
                                </div>
                            {manualOrderType === 'delivery' && (
                                <div className="flex justify-between items-center text-white mb-3">
                                    <span className="text-stone-500 text-[10px] uppercase tracking-widest font-black">Delivery Fee</span>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={manualDeliveryCharge}
                                        onChange={(e) => setManualDeliveryCharge(Number(e.target.value))}
                                        className="w-20 bg-stone-900 border border-stone-800 rounded-lg p-2 text-right text-xs font-mono focus:border-gold-500 outline-none"
                                    />
                                </div>
                            )}
                            <div className="flex justify-between items-center text-gold-500 text-2xl font-serif pt-4 border-t border-stone-800 mt-2">
                                <span>Total Payable</span>
                                <span>₹{manualOrderItems.reduce((acc, i) => acc + (i.item.price * i.quantity), 0) + (manualOrderType === 'delivery' ? manualDeliveryCharge : 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                <div className="p-8 border-t border-stone-800 bg-stone-950 shrink-0">
                    <button 
                        disabled={manualOrderItems.length === 0 || (manualOrderType === 'delivery' && !manualAddress)}
                        onClick={() => {
                            if (!onAddOrder) return;
                            const subtotal = manualOrderItems.reduce((acc, i) => acc + (i.item.price * i.quantity), 0);
                            const total = subtotal + (manualOrderType === 'delivery' ? manualDeliveryCharge : 0);
                            const newOrderId = `CHILL${Math.floor(10000 + Math.random() * 90000)}`;
                            const now = new Date();
                            const baseUrl = window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");
                            const newOrder: Order = {
                                id: newOrderId,
                                items: manualOrderItems.map(i => ({...i.item, quantity: i.quantity, selectedVariations: {}} as any)),
                                subtotal,
                                deliveryCharge: manualOrderType === 'delivery' ? manualDeliveryCharge : 0,
                                total,
                                customerName: manualCustomerName.trim() || 'Walk-in Guest',
                                contactNumber: manualContact,
                                address: manualOrderType === 'delivery' ? manualAddress : '',
                                type: manualOrderType,
                                status: 'preparing',
                                timestamp: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
                                date: now.toLocaleDateString(),
                                createdAt: now.getTime(),
                                trackingLink: `${baseUrl}?tid=${newOrderId}`
                            };
                            onAddOrder(newOrder);
                            setIsManualOrderOpen(false);
                            setManualOrderItems([]);
                            setManualCustomerName('');
                            setManualContact('');
                            setManualAddress('');
                            setManualOrderSearch('');
                        }}
                        className="w-full bg-gold-500 text-stone-950 font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs transition-all shadow-xl hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gold-500"
                    >
                        Confirm Internal Order
                    </button>
                    <p className="text-center text-stone-600 text-[10px] mt-4 uppercase tracking-[0.2em] font-bold">This will add the order to the main queue instantly.</p>
                </div>
            </div>
        </div>
      )}

      {/* Category Editor Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-stone-950 animate-fade-in">
            <div className="bg-stone-900 border border-stone-800 rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-serif text-white">Edit Category</h3>
                    <button onClick={() => setEditingCategory(null)} className="text-stone-500 hover:text-white transition-all"><X size={24} /></button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Category Name</label>
                        <input type="text" value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-white text-sm focus:border-gold-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Availability Start</label>
                            <input type="time" value={editingCategory.startTime || ''} onChange={e => setEditingCategory({...editingCategory, startTime: e.target.value})} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-white font-mono [color-scheme:dark]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Availability End</label>
                            <input type="time" value={editingCategory.endTime || ''} onChange={e => setEditingCategory({...editingCategory, endTime: e.target.value})} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-white font-mono [color-scheme:dark]" />
                        </div>
                    </div>
                </div>
                <button 
                  onClick={() => { if(onUpdateCategory && editingCategory) onUpdateCategory(editingCategory); setEditingCategory(null); }} 
                  className="w-full bg-gold-500 text-stone-950 font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg hover:bg-gold-400"
                >
                  Save Category
                </button>
            </div>
        </div>
      )}

      {/* Item Add/Edit Modal */}
      {isItemFormOpen && editingItem && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-stone-900 border border-stone-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-stone-800 flex justify-between items-center bg-stone-950">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center text-stone-950 shadow-lg shadow-gold-500/20"><Plus size={24} className="stroke-[3]" /></div>
                        <h3 className="text-xl font-serif text-white">{editingItem.id ? 'Edit Dish' : 'Craft New Dish'}</h3>
                    </div>
                    <button onClick={() => setIsItemFormOpen(false)} className="text-stone-500 hover:text-white transition-all"><X size={28} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Identity</label>
                                <input type="text" placeholder="Item Name" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Price (₹)</label>
                                    <input type="number" placeholder="250" value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white font-mono text-lg focus:border-gold-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Menu</label>
                                    <select value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none appearance-none">
                                        <option value="" disabled>Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Heat Level (Spicy)</label>
                                <div className="flex gap-2">
                                    {['none', 'mild', 'medium', 'hot'].map((level) => (
                                        <button 
                                            key={level}
                                            type="button"
                                            onClick={() => setEditingItem({...editingItem, spicyLevel: level as any})}
                                            className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                                editingItem.spicyLevel === level 
                                                ? 'bg-red-500 text-white border-red-500' 
                                                : 'bg-stone-950 text-stone-500 border-stone-800 hover:border-stone-700'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Story</label>
                                <textarea placeholder="A brief description..." value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-xs focus:border-gold-500 outline-none h-24 resize-none" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Visual Asset</label>
                                <div className="aspect-square rounded-3xl overflow-hidden border border-stone-800 bg-stone-950 flex flex-col items-center justify-center relative shadow-inner">
                                    {editingItem.image ? (
                                        <img src={editingItem.image} alt="" className={`w-full h-full object-cover transition-all duration-700 ${isGeneratingImage ? 'blur-md scale-110' : ''}`} />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <ImageIcon size={32} />
                                            <span className="text-[8px] uppercase font-black tracking-widest">No Asset</span>
                                        </div>
                                    )}
                                    {isGeneratingImage && (
                                        <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                                            <Sparkles size={32} className="text-gold-500 animate-spin" />
                                            <p className="text-[10px] text-gold-500 font-black uppercase tracking-[0.2em] animate-pulse">AI is Crafting...</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <input type="text" placeholder="Paste Image URL" value={editingItem.image || ''} onChange={e => setEditingItem({...editingItem, image: e.target.value})} className="flex-1 bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white text-[10px] font-mono focus:border-gold-500 outline-none shadow-inner" />
                                    <button 
                                        type="button"
                                        disabled={!editingItem.name || isGeneratingImage}
                                        onClick={async () => {
                                            setIsGeneratingImage(true);
                                            // Simulated AI Generation Delay
                                            setTimeout(() => {
                                                const dish = editingItem.name || 'Gourmet Dish';
                                                // High-quality food photography placeholder that looks like AI generation
                                                const aiImages = [
                                                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
                                                    'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?auto=format&fit=crop&w=800&q=80',
                                                    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
                                                    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80'
                                                ];
                                                const randomImg = aiImages[Math.floor(Math.random() * aiImages.length)];
                                                setEditingItem({...editingItem, image: randomImg});
                                                setIsGeneratingImage(false);
                                            }, 2500);
                                        }}
                                        className="bg-stone-950 border border-stone-800 hover:border-gold-500 text-gold-500 px-4 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 active:scale-90 shadow-lg"
                                        title="Generate with AI"
                                    >
                                        <Sparkles size={18} className={isGeneratingImage ? 'animate-pulse' : ''} />
                                    </button>
                                </div>
                                <p className="text-[9px] text-stone-600 mt-2 italic px-2">Tip: Fill the Dish Name first to help the AI understand the plate.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-stone-950 p-6 rounded-[2rem] border border-stone-800 shadow-inner">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {[
                                { key: 'isChefChoice', label: 'Chef Pick', icon: ChefHat },
                                { key: 'isFlashSale', label: 'Flash', icon: Zap },
                                { key: 'isHappyHour', label: 'Happy', icon: PartyPopper },
                                { key: 'isExclusive', label: 'Exclusive', icon: EyeOff }
                            ].map((flag) => (
                                <label key={flag.key} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${editingItem[flag.key as keyof MenuItem] ? 'bg-stone-950 border-gold-500 text-gold-500 shadow-lg' : 'bg-stone-900 border-stone-800 text-stone-600 hover:border-stone-700'}`}>
                                    <input type="checkbox" className="hidden" checked={!!editingItem[flag.key as keyof MenuItem]} onChange={() => setEditingItem({...editingItem, [flag.key]: !editingItem[flag.key as keyof MenuItem]})} />
                                    <flag.icon size={18} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{flag.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {(editingItem.isFlashSale || editingItem.isHappyHour) && (
                        <div className="bg-stone-950 p-6 rounded-[2rem] border border-stone-800 shadow-inner mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {editingItem.isFlashSale && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black flex items-center gap-2"><Zap size={14} className="text-red-500"/> Flash Sale Price (₹)</label>
                                        <input type="number" placeholder="Offer Price" value={editingItem.flashSalePrice || ''} onChange={e => setEditingItem({...editingItem, flashSalePrice: Number(e.target.value)})} className="w-full bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white font-mono text-lg focus:border-red-500 outline-none" />
                                    </div>
                                )}
                                {editingItem.isHappyHour && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black flex items-center gap-2"><PartyPopper size={14} className="text-purple-500"/> Happy Hour Price (₹)</label>
                                        <input type="number" placeholder="Offer Price" value={editingItem.happyHourPrice || ''} onChange={e => setEditingItem({...editingItem, happyHourPrice: Number(e.target.value)})} className="w-full bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white font-mono text-lg focus:border-purple-500 outline-none" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-stone-800 bg-stone-950 flex gap-4 shrink-0">
                    <button onClick={() => { 
                        if(!editingItem || !editingItem.name || !editingItem.price) return; 
                        if(editingItem.id) onUpdateItem(editingItem as MenuItem); 
                        else onAddItem({ ...editingItem as MenuItem, id: Math.random().toString(36).substr(2,9) } as MenuItem); 
                        setIsItemFormOpen(false); 
                    }} className="flex-1 bg-gold-500 text-stone-950 font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-xs transition-all shadow-xl hover:bg-gold-400 active:scale-95 flex items-center justify-center gap-2"> {editingItem.id ? 'Save Changes' : 'Publish Dish'} <ChevronRight size={16} /> </button>
                    <button onClick={() => setIsItemFormOpen(false)} className="px-8 border border-stone-800 text-stone-500 hover:text-white rounded-2xl uppercase tracking-widest text-[10px] font-black transition-all">Cancel</button>
                </div>
            </div>
        </div>
      )}

      {/* Offer Editor Modal */}
      {isOfferFormOpen && editingOffer && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-stone-950 animate-fade-in overflow-y-auto">
            <div className="bg-stone-900 border border-stone-800 rounded-[3rem] w-full max-w-xl shadow-2xl my-8 overflow-hidden">
                <div className="p-8 border-b border-stone-800 flex justify-between items-center bg-stone-950">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center text-stone-950 shadow-lg shadow-gold-500/20"><Sparkles size={24} className="stroke-[3]" /></div>
                        <h3 className="text-xl font-serif text-white">{editingOffer.id ? 'Edit Offer' : 'Create Offer'}</h3>
                    </div>
                    <button onClick={() => setIsOfferFormOpen(false)} className="text-stone-500 hover:text-white transition-all"><X size={28} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Title</label>
                        <input type="text" value={editingOffer.title} onChange={e => setEditingOffer({...editingOffer, title: e.target.value})} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Description</label>
                        <textarea value={editingOffer.description} onChange={e => setEditingOffer({...editingOffer, description: e.target.value})} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none h-24 resize-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Background Image URL (Optional)</label>
                        <input type="text" value={editingOffer.image || ''} onChange={e => setEditingOffer({...editingOffer, image: e.target.value})} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-xs font-mono focus:border-gold-500 outline-none" />
                    </div>
                    <label className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer select-none transition-all ${editingOffer.isActive ? 'bg-stone-950 border-gold-500 text-gold-500' : 'bg-stone-950 border-stone-800 text-stone-600'}`}>
                        <input type="checkbox" className="hidden" checked={!!editingOffer.isActive} onChange={() => setEditingOffer({...editingOffer, isActive: !editingOffer.isActive})} />
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${editingOffer.isActive ? 'bg-gold-500 border-gold-500 text-stone-950' : 'border-stone-600'}`}>
                            {editingOffer.isActive && <Check size={14} className="stroke-[4]" />}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest">Publish to public board</span>
                    </label>
                </div>
                <div className="p-8 border-t border-stone-800 bg-stone-950 flex gap-4">
                    <button onClick={() => {
                        if (!editingOffer.title || !editingOffer.description) return;
                        if (editingOffer.id && onUpdateCustomOffer) {
                            onUpdateCustomOffer(editingOffer as CustomOffer);
                        } else if (onAddCustomOffer) {
                            onAddCustomOffer(editingOffer as CustomOffer);
                        }
                        setIsOfferFormOpen(false);
                    }} className="flex-1 bg-gold-500 text-stone-950 font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-xs transition-all shadow-xl hover:bg-gold-400"> Save Offer </button>
                </div>
            </div>
        </div>
      )}

      {isRiderMapOpen && riderLocation && (
        <div className="fixed inset-0 z-[300] bg-stone-950/95 flex items-center justify-center p-4">
          <div className="bg-stone-900 w-full max-w-2xl rounded-3xl overflow-hidden relative border border-brand-500 shadow-2xl">
            <button onClick={() => setIsRiderMapOpen(false)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black hover:bg-black border border-stone-800 rounded-full flex items-center justify-center text-white transition-all"><X size={20} /></button>
            <div className="p-6 bg-stone-950 border-b border-brand-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-stone-900 border border-brand-500 flex items-center justify-center text-brand-500 relative">
                  <Navigation size={24} />
                  <div className="absolute top-0 right-0 w-3 h-3 bg-brand-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg uppercase tracking-widest">Live Rider Feed</h3>
                <p className="text-brand-500 text-[10px] uppercase font-black tracking-[0.2em] mt-1 hidden sm:block">Coordinates Last Synced: {new Date(riderLocation.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="w-full h-80 relative bg-stone-950 z-0">
                <MapContainer 
                    center={[riderLocation.lat, riderLocation.lng]} 
                    zoom={17} 
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer 
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution="&copy; <a href='https://carto.com/'>CARTO</a>"
                    />
                    <MapUpdater center={[riderLocation.lat, riderLocation.lng]} />
                    <CircleMarker center={[9.4818520, 76.3307510]} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.5, weight: 2 }} radius={8}>
                        <Tooltip permanent direction="top" className="bg-stone-900 border-none text-green-500 font-bold uppercase tracking-widest text-[9px] shadow-lg">Shop</Tooltip>
                    </CircleMarker>
                    <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon} />
                </MapContainer>
            </div>
            <div className="p-4 bg-stone-950 border-t border-brand-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-stone-500 text-[10px] uppercase tracking-widest font-mono">LAT {riderLocation.lat.toFixed(6)} | LNG {riderLocation.lng.toFixed(6)}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${riderLocation.lat},${riderLocation.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl uppercase font-black text-[10px] tracking-widest hover:bg-brand-400 transition-colors shadow-lg active:scale-95">
                    Open in Google Maps <MapPin size={14} />
                </a>
            </div>
          </div>
        </div>
      )}

      {isRinging && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[400] flex justify-center p-2 animate-fade-in pointer-events-none">
            <div className="bg-red-500 text-white p-6 rounded-3xl shadow-[0_10px_50px_rgba(239,68,68,0.5)] flex items-center gap-6 pointer-events-auto border border-red-400">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                    <BellRing size={24} />
                </div>
                <div>
                    <h3 className="font-serif text-xl font-bold">
                        {latestNewOrderId ? 'New Order Received!' : 'New Customer Complaint!'}
                    </h3>
                    <p className="text-red-100 text-xs uppercase tracking-widest font-black mt-1">
                        {latestNewOrderId ? 'Check Pending Queue' : 'Check Complaints Tab'}
                    </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {latestNewOrderId ? (
                      <button 
                          onClick={() => {
                              onUpdateOrderStatus(latestNewOrderId, 'preparing');
                              setIsRinging(false);
                          }} 
                          className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-100 transition-all shadow-lg active:scale-95"
                      >
                          <Check size={16} className="stroke-[3]" /> Accept Order
                      </button>
                  ) : (
                      <button 
                          onClick={() => {
                              setActiveTab('complaints');
                              setIsRinging(false);
                          }} 
                          className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-100 transition-all shadow-lg active:scale-95"
                      >
                          <AlertTriangle size={16} /> View Complaint
                      </button>
                  )}
                  <button 
                      onClick={() => setIsRinging(false)} 
                      className="flex items-center gap-2 bg-stone-950 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-900 transition-all shadow-lg active:scale-95 border border-red-500/50"
                  >
                      <VolumeX size={16} /> Silence
                  </button>
                </div>
            </div>
        </div>
      )}

        {/* Live Chat Modal */}
        {activeChatOrderId && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-stone-950/90 backdrop-blur-sm animate-fade-in">
                <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-[2.5rem] shadow-2xl flex flex-col h-[80vh] overflow-hidden">
                    <div className="p-6 border-b border-stone-800 bg-stone-950 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center"><MessageSquare size={20} /></div>
                            <div>
                                <h4 className="text-white font-serif text-lg">Order Chat #{activeChatOrderId}</h4>
                                <p className="text-stone-500 text-[10px] uppercase tracking-widest font-bold">Direct Support</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveChatOrderId(null)} className="p-2 text-stone-500 hover:text-white transition-colors"><X size={20} /></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                        {orderMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                <MessageSquare size={48} className="mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
                            </div>
                        ) : (
                            orderMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.sender === 'admin' ? 'bg-gold-500 text-stone-950 font-medium rounded-tr-none' : 'bg-stone-800 text-white rounded-tl-none'}`}>
                                        {msg.text}
                                        <div className={`text-[8px] mt-1 opacity-50 ${msg.sender === 'admin' ? 'text-stone-900' : 'text-stone-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 border-t border-stone-800 bg-stone-950 flex gap-3">
                        <input 
                            type="text" 
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage(activeChatOrderId)}
                            placeholder="Type a message..."
                            className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-4 text-white text-sm focus:border-blue-500 outline-none"
                        />
                        <button 
                            onClick={() => sendChatMessage(activeChatOrderId)}
                            className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-lg"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Category Configuration Modal */}
        {isCategoryFormOpen && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
                <div className="bg-stone-900 border border-white/5 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-stone-900/50">
                        <div>
                            <h3 className="text-2xl font-serif text-white">{editingCategory ? 'Update Department' : 'New Department'}</h3>
                            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black mt-1">Operational Configuration</p>
                        </div>
                        <button onClick={() => { setIsCategoryFormOpen(false); setEditingCategory(null); }} className="p-3 text-stone-500 hover:text-white hover:bg-white/5 rounded-full"><X size={24} /></button>
                    </div>
                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                        <div className="space-y-3">
                            <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Tag size={14} className="text-gold-500" /> Department Name</label>
                            <input type="text" value={categoryInput} onChange={e => setCategoryInput(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-white text-sm focus:border-gold-500 outline-none shadow-inner" placeholder="e.g. Signature Cocktails" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Clock size={14} className="text-gold-500" /> Start Time</label>
                                <input type="time" value={editingCategory?.startTime || ''} onChange={e => setEditingCategory(prev => prev ? {...prev, startTime: e.target.value} : null)} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-white text-xs outline-none focus:border-gold-500 [color-scheme:dark]" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Clock size={14} className="text-gold-500" /> End Time</label>
                                <input type="time" value={editingCategory?.endTime || ''} onChange={e => setEditingCategory(prev => prev ? {...prev, endTime: e.target.value} : null)} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-white text-xs outline-none focus:border-gold-500 [color-scheme:dark]" />
                            </div>
                        </div>
                        <div className="p-6 bg-stone-950 rounded-2xl border border-white/5 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">Visibility Status</span>
                                <span className="text-[9px] text-stone-600 uppercase font-bold">Show or hide this section from customers</span>
                            </div>
                            <button 
                                onClick={() => setEditingCategory(prev => prev ? {...prev, isUnavailable: !prev.isUnavailable} : null)}
                                className={`relative w-14 h-7 rounded-full transition-all duration-500 ${!editingCategory?.isUnavailable ? 'bg-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-stone-800'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-stone-950 rounded-full transition-all duration-500 ${!editingCategory?.isUnavailable ? 'left-8' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                    <div className="p-8 bg-stone-900 border-t border-white/5 flex gap-4">
                        <button onClick={() => { setIsCategoryFormOpen(false); setEditingCategory(null); }} className="flex-1 py-5 bg-stone-950 text-stone-500 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">Discard</button>
                        <button 
                            onClick={() => {
                                if (editingCategory && onUpdateCategory) {
                                    onUpdateCategory({ ...editingCategory, name: categoryInput });
                                    setIsCategoryFormOpen(false);
                                    setEditingCategory(null);
                                } else if (!editingCategory && onAddCategory) {
                                    onAddCategory(categoryInput);
                                    setIsCategoryFormOpen(false);
                                }
                            }}
                            className="flex-1 py-5 bg-gold-500 text-stone-950 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-gold-400 transition-all active:scale-95"
                        >
                            {editingCategory ? 'Sync Department' : 'Deploy Section'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminPanel;
