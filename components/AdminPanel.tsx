
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, Plus, Trash2, Tag, List, 
  Settings, LayoutDashboard, Search, 
  Lock, LogOut, ShoppingBag, User, Clock, Copy, Check, Printer, Ticket, Zap, PartyPopper,
  ChefHat, Calendar, MapPin, Send, Timer, DollarSign, Image as ImageIcon, ChevronRight,
  Layers, AlertTriangle, Scan, CameraOff, Edit2, Filter, EyeOff, Flame, SearchX, Camera, MessageCircle, Menu, Minus, Wallet, Star, ChevronUp, ChevronDown, Phone, Navigation, MessageSquare, Sparkles
} from 'lucide-react';
import { MenuItem, Order, Coupon, CategoryConfig, FoodRating, CustomOffer } from '../types';
import { printThermalBill } from '../App';
import SafeImage from './SafeImage';
import { Html5Qrcode } from 'html5-qrcode';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
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
  storeSettings: { acceptingOrders: boolean; startTime: string; endTime: string; deliveryUpiId?: string; announcement?: string; isAnnouncementActive?: boolean };
  onAddItem: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onAddCategory: (category: string) => void;
  onUpdateCategory?: (category: CategoryConfig) => void;
  onDeleteCategory: (category: string) => void;
  onUpdateOrderStatus: (id: string, status: Order['status'], paymentMethod?: string) => void;
  riderLocation?: {lat: number, lng: number, timestamp: number} | null;
  onAddCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (id: string) => void;
  onUpdateStoreSettings: (settings: { acceptingOrders: boolean; startTime: string; endTime: string; deliveryUpiId?: string; announcement?: string; isAnnouncementActive?: boolean }) => void;
  onUpdatePromos: (promos: any) => void;
  onAddOrder?: (order: Order) => Promise<void>;
  foodRatings?: FoodRating[];
  customOffers?: CustomOffer[];
  onAddCustomOffer?: (offer: CustomOffer) => void;
  onUpdateCustomOffer?: (offer: CustomOffer) => void;
  onDeleteCustomOffer?: (id: string) => void;
  onReorderCategory?: (direction: 'up' | 'down', index: number) => void;
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
    <div className="fixed inset-0 z-[300] bg-stone-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg aspect-square bg-stone-900 border border-gold-500/30 rounded-[3rem] overflow-hidden relative shadow-[0_0_50px_rgba(212,175,55,0.15)] flex items-center justify-center">
        {error ? (
          <div className="p-10 text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <CameraOff size={32} />
            </div>
            <h3 className="text-white font-serif text-xl mb-2">Camera Access Required</h3>
            <p className="text-stone-500 text-sm leading-relaxed mb-8">{error}</p>
            <button onClick={onClose} className="px-8 py-3 bg-stone-800 text-white rounded-xl font-bold uppercase tracking-widest text-xs">Dismiss</button>
          </div>
        ) : !isReady ? (
            <div className="flex flex-col items-center gap-6 p-10 text-center">
                <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center text-gold-500 mb-2 border border-gold-500/20">
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
            <div className="absolute inset-0 border-[2px] border-gold-500/20 pointer-events-none rounded-[3rem]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-gold-500 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-gold-500/50 absolute top-1/2 animate-pulse"></div>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-12 flex flex-col items-center gap-6">
          {isReady && !error && <p className="text-gold-500 font-serif text-lg tracking-widest uppercase">Align Code within Frame</p>}
          <button onClick={onClose} className="px-12 py-4 border border-white/10 text-stone-400 hover:text-white hover:bg-stone-950/5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all">Cancel Scan</button>
      </div>
    </div>
  );
};

const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen, onClose, items, categories, orders, coupons = [], customOffers = [], foodRatings = [], isStoreOpen, promoSettings, storeSettings, riderLocation,
  onAddItem, onUpdateItem, onDeleteItem, onAddCategory, onUpdateCategory, onDeleteCategory, onUpdateOrderStatus,
  onAddCoupon, onDeleteCoupon, onAddCustomOffer, onUpdateCustomOffer, onDeleteCustomOffer, onReorderCategory, onUpdateStoreSettings, onUpdatePromos, onAddOrder
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'items' | 'categories' | 'coupons' | 'promotions' | 'reviews' | 'payment' | 'settings'>('dashboard');
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
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
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponVal, setNewCouponVal] = useState(0);
  const [openingCountdown, setOpeningCountdown] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [manualOrderItems, setManualOrderItems] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualContact, setManualContact] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualOrderType, setManualOrderType] = useState<'delivery'|'pickup'>('pickup');
  const [manualOrderSearch, setManualOrderSearch] = useState('');

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
    const totalRev = orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (o.total || 0), 0);
    const delivered = orders.filter(o => o.status === 'delivered').length;
    return {
      totalItems: items.length,
      totalOrders: orders.length,
      deliveredOrders: delivered,
      totalRevenue: totalRev,
      avgOrderValue: delivered ? Math.round(totalRev / delivered) : 0,
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
        setIsAuthenticated(true);
        setAuthError(false);
        setPasswordInput('');
    } else {
        setAuthError(true);
    }
  };

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    onUpdateOrderStatus(order.id, newStatus);
    const phone = order.contactNumber.replace(/\D/g, '');
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    let msg = `Hi ${order.customerName}, your order #${order.id} is now ${newStatus.replace('_', ' ')}.`;
    if (newStatus === 'out_for_delivery') msg += " Our rider is on the way! 🛵";
    if (newStatus === 'ready') msg += " Please collect it from the counter. 🛍️";
    if (newStatus !== 'pending') {
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
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
    setIsAuthenticated(false);
    onClose();
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950 p-4" onClick={onClose}>
        <div className="w-full max-w-md bg-stone-900 border border-gold-500/20 rounded-3xl p-10 text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-6 right-6 text-stone-600 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-stone-950 border border-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
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

  return (
    <div className="fixed inset-0 z-[200] bg-stone-950 flex overflow-hidden font-sans text-stone-200">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-stone-900 border-r border-white/5 flex flex-col shrink-0 h-full transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center font-serif text-stone-950 font-bold text-xl shadow-lg shadow-gold-500/20">C</div>
            <div>
                <h1 className="text-white font-serif font-bold text-lg leading-none uppercase tracking-tight">CHILLIES</h1>
                <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Admin Console</span>
            </div>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto scrollbar-hide">
            {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                { id: 'orders', icon: ShoppingBag, label: 'Orders' },
                { id: 'items', icon: List, label: 'Inventory' },
                { id: 'categories', icon: Tag, label: 'Categories' },
                { id: 'coupons', icon: Ticket, label: 'Coupons' },
                { id: 'promotions', icon: Zap, label: 'Marketing' },
                { id: 'reviews', icon: Star, label: 'Feedback' },
                { id: 'payment', icon: Wallet, label: 'Payment' },
                { id: 'settings', icon: Settings, label: 'Operations' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                        activeTab === tab.id ? 'bg-gold-500 text-stone-950 shadow-xl' : 'text-stone-400 hover:text-white hover:bg-stone-950/5'
                    }`}
                >
                    <tab.icon size={18} className={activeTab === tab.id ? 'stroke-[2.5]' : ''} />
                    <span className="text-sm font-bold tracking-wide">{tab.label}</span>
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-white/5 space-y-2">
            <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 text-sm font-bold hover:bg-red-500/5 rounded-xl transition-colors"><LogOut size={16} /> Logout</button>
            <button onClick={handleExit} className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 text-sm font-bold hover:text-white transition-colors"><X size={16} /> Exit Panel</button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-stone-950/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 bg-stone-950 h-full overflow-hidden">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between shrink-0 bg-stone-900/20 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-stone-500 hover:text-white transition-colors">
                    <Menu size={24} />
                </button>
                <h2 className="text-2xl font-serif text-white capitalize">{activeTab}</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${isStoreOpen ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isStoreOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{isStoreOpen ? 'Active' : 'Offline'}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center text-stone-400">
                    <User size={20} />
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-stone-950/50">
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
                    {!isStoreOpen && openingCountdown && (
                        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex items-center justify-between shadow-lg shadow-red-500/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500 text-white rounded-xl"><Clock size={24} /></div>
                                <div>
                                    <h4 className="text-white font-bold uppercase tracking-widest text-xs">Kitchen Offline</h4>
                                    <p className="text-stone-400 text-[10px]">Prepare for your next service session.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-stone-500 text-[9px] uppercase tracking-[0.2em] font-black block mb-1">Resuming In</span>
                                <span className="text-red-500 font-mono text-2xl font-bold">{openingCountdown}</span>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Revenue', val: `₹${stats.totalRevenue}`, icon: Zap, color: 'text-green-500' },
                            { label: 'Total Orders', val: stats.totalOrders, icon: ShoppingBag, color: 'text-gold-500' },
                            { label: 'Delivered', val: stats.deliveredOrders, icon: Check, color: 'text-blue-500' },
                            { label: 'Avg. Order', val: `₹${stats.avgOrderValue}`, icon: Filter, color: 'text-purple-500' }
                        ].map((s: {label: string, val: string | number, icon: any, color: string}, i: number) => (
                            <div key={i} className="bg-stone-900/50 border border-white/5 p-6 rounded-2xl group hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl bg-stone-950 border border-white/5 ${s.color} shadow-lg shadow-black/40`}><s.icon size={20} /></div>
                                    <span className="text-green-500 text-[10px] font-bold">+5.2%</span>
                                </div>
                                <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">{s.label}</p>
                                <h3 className="text-3xl font-serif text-white">{s.val}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                        <div className="flex p-1.5 bg-stone-900 border border-white/5 rounded-2xl w-full lg:w-fit shadow-inner">
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
                                    {s.count > 0 && <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${orderStage === s.id ? 'bg-stone-950 text-gold-500' : 'bg-stone-800 text-stone-400'}`}>{s.count}</span>}
                                </button>
                            ))}
                        </div>
                        {orderStage === 'history' && (
                            <div className="flex p-1.5 bg-stone-900 border border-white/5 rounded-2xl shadow-inner">
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
                                    className="w-full bg-stone-900 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-xs text-white focus:border-gold-500 outline-none shadow-inner"
                                />
                                <button onClick={() => setIsScannerOpen(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500 hover:text-gold-400 transition-colors" title="Scan QR Code"><Scan size={18} /></button>
                            </div>
                            {orderStage === 'active' && (
                                <button 
                                    onClick={() => riderLocation ? setIsRiderMapOpen(true) : alert("Rider Location is completely unavailable. Waiting for them to open the Delivery Portal and grant GPS tracking permissions.")} 
                                    className={`p-4 rounded-2xl transition-all shadow-lg shrink-0 flex items-center justify-center gap-2 ${riderLocation ? 'bg-brand-500 text-white hover:bg-brand-400' : 'bg-stone-900 border border-white/5 text-stone-600 hover:text-stone-400'}`} 
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
                            <div className="col-span-full py-32 text-center border-2 border-dashed border-stone-800 rounded-[3rem] bg-stone-900/20">
                                <ShoppingBag className="mx-auto text-stone-300 mb-6 opacity-20" size={64} />
                                <p className="text-stone-500 uppercase tracking-[0.3em] text-xs font-bold">No matching records found</p>
                            </div>
                        ) : filteredOrders.map(order => (
                            <div key={order.id} className="bg-stone-900/80 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-gold-500/40 transition-all duration-500 flex flex-col shadow-xl">
                                <div className="p-8 border-b border-white/5 flex justify-between items-start bg-stone-950/30">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gold-400 font-mono font-bold text-2xl tracking-tighter">#{order.id}</span>
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${order.type === 'delivery' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{order.type}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-stone-500 font-bold uppercase tracking-widest text-[10px]">
                                            <Calendar size={12} /> {order.date} <span className="opacity-30 mx-1">|</span> {order.timestamp}
                                        </div>
                                        {order.paymentMethod && order.status === 'delivered' && (
                                            <div className={`mt-3 inline-flex border border-white/5 items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-xl shadow-sm ${order.paymentMethod === 'UPI' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {order.paymentMethod === 'UPI' ? '📱 UPI' : '💵 Cash'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => copyOrderBrief(order)} title="Copy Info" className="p-3 bg-stone-950 text-stone-400 hover:text-white rounded-2xl border border-white/5 transition-all">
                                            {copiedId === order.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                        </button>
                                        <button onClick={() => printThermalBill(order)} title="Print" className="p-3 bg-stone-950 text-stone-600 hover:text-brand-500 rounded-2xl border border-stone-900/5 transition-all">
                                            <Printer size={18} />
                                        </button>
                                        <button onClick={() => {
                                            const phone = order.contactNumber.replace(/\D/g, '');
                                            const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
                                            const text = `Hi ${order.customerName},\n\nYour order #${order.id} is confirmed!\nYou can track your order status live here:\n${window.location.origin}/?tid=${order.id}\n\nThank you for choosing Chillies!`;
                                            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                        }} title="WhatsApp Tracking Link" className="p-3 bg-stone-950 text-stone-600 hover:text-green-500 rounded-2xl border border-stone-900/5 transition-all">
                                            <MessageCircle size={18} />
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
                                        <div className="p-4 bg-stone-950/40 rounded-2xl border border-white/5 space-y-2">
                                            <span className="text-[9px] text-stone-600 uppercase tracking-[0.2em] font-black block">Location</span>
                                            <p className="text-stone-400 text-xs flex items-start gap-3 leading-relaxed">
                                                <MapPin size={16} className="text-gold-500 shrink-0 mt-0.5" /> {order.address}
                                            </p>
                                        </div>
                                    )}
                                    <div className="bg-stone-950 rounded-[1.5rem] border border-white/5 p-6 shadow-inner">
                                        <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-4">
                                            {order.items.map((it: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <SafeImage src={it.image} containerClassName="w-10 h-10 rounded-xl shrink-0" className="w-full h-full object-cover" />
                                                        <span className="text-stone-200 truncate font-medium"><span className="text-gold-500 font-black mr-2">{it.quantity}x</span> {it.name}</span>
                                                    </div>
                                                    <span className="text-stone-500 font-mono text-xs ml-4 whitespace-nowrap">₹{it.price * it.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-end">
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-stone-600 uppercase font-black tracking-[0.2em]">Grand Total</span>
                                                <div className="text-3xl font-serif text-white font-bold leading-none">₹{order.total}</div>
                                            </div>
                                            <button onClick={() => handleStatusChange(order, order.status)} className="p-4 bg-green-500/10 text-green-500 rounded-2xl border border-green-500/20 hover:bg-green-500 hover:text-white transition-all">
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-stone-950/40 border-t border-white/5">
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
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
                    <div className="bg-stone-900 border border-white/5 p-10 rounded-[3rem] shadow-xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-gold-500/10 rounded-2xl flex items-center justify-center text-gold-500 border border-gold-500/20"><Tag size={24} /></div>
                            <div>
                                <h4 className="text-2xl font-serif text-white">Menu Categories</h4>
                                <p className="text-stone-500 text-xs uppercase tracking-widest font-bold">Structure your offerings</p>
                            </div>
                        </div>
                        <div className="flex gap-4 mb-12">
                            <div className="relative flex-1">
                                <Layers size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500" />
                                <input type="text" placeholder="Enter new category name..." value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-gold-500 outline-none transition-all" />
                            </div>
                            <button onClick={() => { if(newCatInput.trim()) { onAddCategory(newCatInput.trim()); setNewCatInput(''); } }} className="bg-gold-500 text-stone-950 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg"> <Plus size={18} /> Add </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {categories.map((cat, index) => (
                                <div key={cat.id} className={`flex items-center justify-between p-6 bg-stone-950/50 rounded-2xl border transition-all group ${cat.isUnavailable ? 'border-red-500/20 opacity-60 grayscale' : 'border-white/5 hover:border-gold-500/30'}`}>
                                    <div className="flex items-center gap-4">
                                        
                                        <div className="flex flex-col items-center justify-center -ml-2 mr-2 opacity-50 hover:opacity-100 transition-opacity">
                                            <button 
                                                disabled={index === 0} 
                                                onClick={() => onReorderCategory && onReorderCategory('up', index)} 
                                                className="p-1 text-stone-500 hover:text-gold-500 disabled:opacity-20 transition-all rounded"
                                            >
                                                <ChevronUp size={20} className="stroke-[3]" />
                                            </button>
                                            <button 
                                                disabled={index === categories.length - 1} 
                                                onClick={() => onReorderCategory && onReorderCategory('down', index)} 
                                                className="p-1 text-stone-500 hover:text-gold-500 disabled:opacity-20 transition-all rounded"
                                            >
                                                <ChevronDown size={20} className="stroke-[3]" />
                                            </button>
                                        </div>

                                        <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform"><Tag size={18} /></div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-bold tracking-tight">{cat.name}</p>
                                                {cat.isUnavailable && <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded-sm">Offline</span>}
                                            </div>
                                            {cat.startTime && cat.endTime && <p className="text-[9px] text-stone-500 font-mono">{cat.startTime} - {cat.endTime}</p>}
                                            <p className="text-[10px] text-stone-500 uppercase font-black">{items.filter(i => i.category === cat.name).length} Dishes</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => onUpdateCategory && onUpdateCategory({ ...cat, isUnavailable: !cat.isUnavailable })}
                                            className={`group relative flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-all duration-300 ease-in-out focus:outline-none ${!cat.isUnavailable ? 'bg-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'bg-stone-800 border border-stone-700'}`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow-lg ring-0 transition duration-300 ease-in-out ${!cat.isUnavailable ? 'translate-x-4 bg-stone-950' : 'translate-x-0 bg-stone-900'}`}
                                            />
                                        </button>
                                        <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                                        <button onClick={() => setEditingCategory(cat)} className="p-2 text-stone-600 hover:text-gold-500 hover:bg-gold-500/5 rounded-xl transition-all"> <Edit2 size={16} /> </button>
                                        <button onClick={() => onDeleteCategory(cat.name)} className="p-2 text-stone-600 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"> <Trash2 size={18} /> </button>
                                    </div>
                                </div>
                            ))}
                        </div>
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

                        {!storeSettings.acceptingOrders && (
                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center gap-4 text-red-500 animate-pulse">
                                <AlertTriangle size={24} />
                                <div className="flex-1">
                                    <h5 className="font-bold text-sm uppercase tracking-widest">Kitchen Forced Closed</h5>
                                    <p className="text-xs opacity-80">The restaurant is manually marked as offline.</p>
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
                                         placeholder="e.g. Special Holiday Hours: We open at 4 PM tomorrow!"
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
                    </div>
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
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-2xl animate-fade-in overflow-y-auto">
            <div className="bg-stone-900 border border-white/10 rounded-[3rem] w-full max-w-4xl shadow-[0_0_100px_rgba(0,0,0,0.8)] my-8 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-stone-950/40 shrink-0">
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
                            <h4 className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white/5 pb-4">Menu Items</h4>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search items..." 
                                    value={manualOrderSearch}
                                    onChange={e => setManualOrderSearch(e.target.value)}
                                    className="w-full bg-stone-950 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs text-white focus:border-gold-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide flex-1">
                            {items.filter(i => i.name.toLowerCase().includes(manualOrderSearch.toLowerCase())).map(item => {
                                const cartItem = manualOrderItems.find(i => i.item.id === item.id);
                                const qty = cartItem ? cartItem.quantity : 0;
                                return (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-stone-950 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <p className="text-white text-sm font-bold truncate">{item.name}</p>
                                            <p className="text-gold-500 text-[10px] font-mono font-bold">₹{item.price}</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-stone-900 rounded-xl border border-white/10 p-1">
                                            <button onClick={() => {
                                                if (qty > 1) {
                                                    setManualOrderItems(prev => prev.map(p => p.item.id === item.id ? {...p, quantity: p.quantity - 1} : p));
                                                } else if (qty === 1) {
                                                    setManualOrderItems(prev => prev.filter(p => p.item.id !== item.id));
                                                }
                                            }} className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-white"><Minus size={14} /></button>
                                            <span className="w-4 text-center text-white text-xs font-bold">{qty}</span>
                                            <button onClick={() => {
                                                if (qty === 0) {
                                                    setManualOrderItems(prev => [...prev, {item, quantity: 1}]);
                                                } else {
                                                    setManualOrderItems(prev => prev.map(p => p.item.id === item.id ? {...p, quantity: p.quantity + 1} : p));
                                                }
                                            }} className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-white"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    {/* Right Side: Order Details */}
                    <div className="space-y-6 flex flex-col h-full">
                        <h4 className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white/5 pb-4">Customer Details</h4>
                        <div className="space-y-4">
                            <input type="text" placeholder="Customer Name" value={manualCustomerName} onChange={e => setManualCustomerName(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none" />
                            <input type="tel" placeholder="Contact Number (Optional for walk-in)" value={manualContact} onChange={e => setManualContact(e.target.value.replace(/\D/g, '').slice(0,10))} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setManualOrderType('pickup')} className={`py-4 rounded-xl border text-[10px] uppercase font-black tracking-[0.2em] transition-all ${manualOrderType === 'pickup' ? 'bg-gold-500 text-stone-950 border-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-stone-950 text-stone-500 border-stone-800 hover:border-stone-700'}`}>Pickup/Dine-in</button>
                                <button onClick={() => setManualOrderType('delivery')} className={`py-4 rounded-xl border text-[10px] uppercase font-black tracking-[0.2em] transition-all ${manualOrderType === 'delivery' ? 'bg-gold-500 text-stone-950 border-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-stone-950 text-stone-500 border-stone-800 hover:border-stone-700'}`}>Delivery</button>
                            </div>
                            {manualOrderType === 'delivery' && (
                                <textarea placeholder="Delivery Address" value={manualAddress} onChange={e => setManualAddress(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none h-24 resize-none" />
                            )}
                        </div>
                        
                        <div className="bg-stone-950 p-6 rounded-[2rem] border border-white/5 mt-auto shadow-inner flex flex-col flex-1 min-h-0">
                            <h4 className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white/5 pb-3 mb-4 shrink-0">Added Items</h4>
                            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-3 mb-4">
                                {manualOrderItems.length === 0 ? (
                                    <p className="text-stone-600 text-xs italic text-center py-4">Cart is empty</p>
                                ) : (
                                    manualOrderItems.map(item => (
                                        <div key={item.item.id} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                                <span className="text-gold-500 font-bold shrink-0">{item.quantity}x</span>
                                                <span className="text-stone-300 truncate">{item.item.name}</span>
                                            </div>
                                            <span className="text-white font-mono shrink-0">₹{(item.item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="pt-4 border-t border-white/5 shrink-0">
                                <div className="flex justify-between items-center text-white mb-3">
                                    <span className="text-stone-500 text-[10px] uppercase tracking-widest font-black">Subtotal</span>
                                    <span className="font-mono text-sm">₹{manualOrderItems.reduce((acc, i) => acc + (i.item.price * i.quantity), 0)}</span>
                                </div>
                            {manualOrderType === 'delivery' && (
                                <div className="flex justify-between items-center text-white mb-3">
                                    <span className="text-stone-500 text-[10px] uppercase tracking-widest font-black">Delivery Fee</span>
                                    <span className="font-mono text-sm">₹20</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-gold-500 text-2xl font-serif pt-4 border-t border-white/5 mt-2">
                                <span>Total Payable</span>
                                <span>₹{manualOrderItems.reduce((acc, i) => acc + (i.item.price * i.quantity), 0) + (manualOrderType === 'delivery' ? 20 : 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-stone-950/40 shrink-0">
                    <button 
                        disabled={manualOrderItems.length === 0 || (manualOrderType === 'delivery' && !manualAddress)}
                        onClick={() => {
                            if (!onAddOrder) return;
                            const subtotal = manualOrderItems.reduce((acc, i) => acc + (i.item.price * i.quantity), 0);
                            const total = subtotal + (manualOrderType === 'delivery' ? 20 : 0);
                            const newOrderId = `CHILL${Math.floor(10000 + Math.random() * 90000)}`;
                            const now = new Date();
                            const baseUrl = window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");
                            const newOrder: Order = {
                                id: newOrderId,
                                items: manualOrderItems.map(i => ({...i.item, quantity: i.quantity, selectedVariations: {}} as any)),
                                subtotal,
                                deliveryCharge: manualOrderType === 'delivery' ? 20 : 0,
                                total,
                                customerName: manualCustomerName.trim() || 'Walk-in Guest',
                                contactNumber: manualContact,
                                address: manualOrderType === 'delivery' ? manualAddress : '',
                                type: manualOrderType,
                                status: 'pending',
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
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-2xl animate-fade-in">
            <div className="bg-stone-900 border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 space-y-8">
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
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-2xl animate-fade-in overflow-y-auto">
            <div className="bg-stone-900 border border-white/10 rounded-[3rem] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] my-8 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-stone-950/40">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center text-stone-950 shadow-lg shadow-gold-500/20"><Plus size={24} className="stroke-[3]" /></div>
                        <h3 className="text-xl font-serif text-white">{editingItem.id ? 'Edit Dish' : 'Craft New Dish'}</h3>
                    </div>
                    <button onClick={() => setIsItemFormOpen(false)} className="text-stone-500 hover:text-white transition-all"><X size={28} /></button>
                </div>

                <div className="p-8 space-y-8">
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
                                        <img src={editingItem.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <ImageIcon size={32} />
                                            <span className="text-[8px] uppercase font-black tracking-widest">No Asset</span>
                                        </div>
                                    )}
                                </div>
                                <input type="text" placeholder="Paste Image URL" value={editingItem.image || ''} onChange={e => setEditingItem({...editingItem, image: e.target.value})} className="w-full bg-stone-900/50 border border-stone-800 rounded-2xl p-4 text-white text-[10px] font-mono focus:border-gold-500 outline-none mt-2 shadow-inner" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-stone-950/40 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {[
                                { key: 'isChefChoice', label: 'Chef Pick', icon: ChefHat },
                                { key: 'isFlashSale', label: 'Flash', icon: Zap },
                                { key: 'isHappyHour', label: 'Happy', icon: PartyPopper },
                                { key: 'isExclusive', label: 'Exclusive', icon: EyeOff }
                            ].map((flag) => (
                                <label key={flag.key} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${editingItem[flag.key as keyof MenuItem] ? 'bg-gold-500/10 border-gold-500 text-gold-500 shadow-lg shadow-gold-500/5' : 'bg-stone-900/30 border-stone-800 text-stone-600 hover:border-stone-700'}`}>
                                    <input type="checkbox" className="hidden" checked={!!editingItem[flag.key as keyof MenuItem]} onChange={() => setEditingItem({...editingItem, [flag.key]: !editingItem[flag.key as keyof MenuItem]})} />
                                    <flag.icon size={18} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{flag.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {(editingItem.isFlashSale || editingItem.isHappyHour) && (
                        <div className="bg-stone-950/40 p-6 rounded-[2rem] border border-white/5 shadow-inner mt-4">
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

                <div className="p-8 border-t border-white/5 bg-stone-950/40 flex gap-4">
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
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-2xl animate-fade-in overflow-y-auto">
            <div className="bg-stone-900 border border-white/10 rounded-[3rem] w-full max-w-xl shadow-2xl my-8 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-stone-950/40">
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
                    <label className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer select-none transition-all ${editingOffer.isActive ? 'bg-gold-500/10 border-gold-500 text-gold-500' : 'bg-stone-950 border-stone-800 text-stone-600'}`}>
                        <input type="checkbox" className="hidden" checked={!!editingOffer.isActive} onChange={() => setEditingOffer({...editingOffer, isActive: !editingOffer.isActive})} />
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${editingOffer.isActive ? 'bg-gold-500 border-gold-500 text-stone-950' : 'border-stone-600'}`}>
                            {editingOffer.isActive && <Check size={14} className="stroke-[4]" />}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest">Publish to public board</span>
                    </label>
                </div>
                <div className="p-8 border-t border-white/5 bg-stone-950/40 flex gap-4">
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
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 w-full max-w-2xl rounded-3xl overflow-hidden relative border border-brand-500/20 shadow-2xl">
            <button onClick={() => setIsRiderMapOpen(false)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black border border-white/10 rounded-full flex items-center justify-center text-white transition-all"><X size={20} /></button>
            <div className="p-6 bg-stone-950 border-b border-brand-500/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 relative">
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
                    <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon} />
                </MapContainer>
            </div>
            <div className="p-4 bg-stone-950 border-t border-brand-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-stone-500 text-[10px] uppercase tracking-widest font-mono">LAT {riderLocation.lat.toFixed(6)} | LNG {riderLocation.lng.toFixed(6)}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${riderLocation.lat},${riderLocation.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl uppercase font-black text-[10px] tracking-widest hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20 active:scale-95">
                    Open in Google Maps <MapPin size={14} />
                </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
