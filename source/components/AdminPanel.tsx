import React, { useState, useMemo, useEffect } from 'react';
import * as xlsx from 'xlsx';
import { 
  X, Plus, Trash2, Tag, List, 
  Settings, LayoutDashboard, Search, 
  Lock, LogOut, ShoppingBag, User, Clock, Copy, Check, Printer, Ticket, Zap, PartyPopper,
  ChefHat, Calendar, MapPin, Send, DollarSign, Image as ImageIcon, ChevronRight,
  Layers, AlertTriangle, Edit2, Filter, EyeOff, Flame, SearchX, Minus, ShoppingCart, Upload, Download
} from 'lucide-react';
import { MenuItem, Order, Coupon, CategoryConfig, CartItem } from '../types';
import { printThermalBill } from '../App';
import SafeImage from './SafeImage';

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
  storeSettings: { acceptingOrders: boolean; startTime: string; endTime: string };
  onAddItem: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onAddCategory: (category: string) => void;
  onUpdateCategory?: (category: CategoryConfig) => void;
  onDeleteCategory: (category: string) => void;
  onUpdateOrderStatus: (id: string, status: Order['status']) => void;
  onAddCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (id: string) => void;
  onUpdateStoreSettings: (settings: { acceptingOrders: boolean; startTime: string; endTime: string }) => void;
  onUpdatePromos: (promos: any) => void;
  onAddOrder?: (order: Order) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen, onClose, items, categories, orders, coupons = [], isStoreOpen, promoSettings, storeSettings,
  onAddItem, onUpdateItem, onDeleteItem, onAddCategory, onUpdateCategory, onDeleteCategory, onUpdateOrderStatus,
  onAddCoupon, onDeleteCoupon, onUpdateStoreSettings, onUpdatePromos, onAddOrder
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'items' | 'categories' | 'coupons' | 'promotions' | 'settings'>('dashboard');
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStage, setOrderStage] = useState<'new' | 'active' | 'history'>('new');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponVal, setNewCouponVal] = useState(0);
  const [openingCountdown, setOpeningCountdown] = useState<string>('');

  // Manual Order States
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [manualOrderItems, setManualOrderItems] = useState<CartItem[]>([]);
  const [manualCustomer, setManualCustomer] = useState({ name: '', phone: '', address: '', type: 'pickup' as 'pickup' | 'delivery' });
  const [manualItemSearch, setManualItemSearch] = useState('');

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
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, inventoryStatusFilter]);

  const filteredOrders = useMemo(() => {
    const searchActive = orderSearch.trim() !== '';
    return orders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
                             order.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                             order.contactNumber.includes(orderSearch);
        
        if (searchActive) {
            return matchesSearch;
        }

        if (!matchesSearch) return false;
        if (orderStage === 'new') return order.status === 'pending';
        if (orderStage === 'active') return ['preparing', 'ready', 'out_for_delivery'].includes(order.status);
        if (orderStage === 'history') return ['delivered', 'cancelled'].includes(order.status);
        return false;
    });
  }, [orders, orderStage, orderSearch]);

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

  const handleManualOrderSubmit = () => {
    if (!manualCustomer.name || !manualCustomer.phone || manualOrderItems.length === 0) return;
    if (manualCustomer.type === 'delivery' && !manualCustomer.address) return;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newOrderId = '';
    for (let i = 0; i < 6; i++) {
        newOrderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const now = new Date();
    const subtotal = manualOrderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const deliveryCharge = manualCustomer.type === 'delivery' ? 20 : 0;

    const newOrder: Order = {
        id: newOrderId,
        customerName: manualCustomer.name,
        contactNumber: manualCustomer.phone,
        address: manualCustomer.address,
        type: manualCustomer.type,
        items: manualOrderItems,
        total: subtotal + deliveryCharge,
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        status: 'pending',
        timestamp: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
        date: now.toLocaleDateString(),
        createdAt: now.getTime()
    };

    if (onAddOrder) onAddOrder(newOrder);
    setIsManualOrderOpen(false);
    setManualOrderItems([]);
    setManualCustomer({ name: '', phone: '', address: '', type: 'pickup' });
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = xlsx.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = xlsx.utils.sheet_to_json(ws);
      
      data.forEach((row: any) => {
        if (row.name && row.price) {
          const newItem: MenuItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: row.name,
            description: row.description || '',
            price: Number(row.price),
            category: row.category || categories[0]?.name || 'Starters',
            image: row.image || '',
            isFlashSale: !!row.isFlashSale,
            isHappyHour: !!row.isHappyHour,
            isChefChoice: !!row.isChefChoice,
            isExclusive: !!row.isExclusive,
            isUnavailable: !!row.isUnavailable,
            spicyLevel: ['none', 'mild', 'medium', 'hot'].includes(row.spicyLevel) ? row.spicyLevel : 'none'
          };
          onAddItem(newItem);
        }
      });
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleDownloadSample = () => {
    const ws = xlsx.utils.json_to_sheet([
      {
        name: 'Sample Dish',
        price: 250,
        description: 'A delicious sample dish',
        category: 'Starters',
        image: 'https://example.com/image.jpg',
        isFlashSale: false,
        isHappyHour: false,
        isChefChoice: true,
        isExclusive: false,
        isUnavailable: false,
        spicyLevel: 'medium'
      }
    ]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Menu Items');
    xlsx.writeFile(wb, 'menu_import_sample.xlsx');
  };

  const handleExit = () => {
    setIsAuthenticated(false);
    onClose();
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white p-4" onClick={onClose}>
        <div className="w-full max-w-md bg-stone-50 border border-brand-500/20 rounded-3xl p-10 text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-6 right-6 text-stone-600 hover:text-stone-900 transition-colors">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-white border border-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-brand-500" />
          </div>
          <h2 className="text-2xl font-serif text-stone-900 mb-6">Chillies HQ Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Admin Passkey" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)} 
              className={`w-full bg-white border rounded-xl p-4 text-center text-stone-900 focus:outline-none focus:border-brand-500 ${authError ? 'border-red-500' : 'border-stone-200'}`}
              autoFocus 
            />
            <button type="submit" className="w-full bg-brand-500 text-stone-900 font-bold py-4 rounded-xl uppercase tracking-widest shadow-lg">Authenticate</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex overflow-hidden font-sans text-stone-800">
      <aside className="w-72 bg-stone-50 border-r border-stone-900/5 flex flex-col shrink-0 h-full hidden md:flex">
        <div className="p-8 border-b border-stone-900/5 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center font-serif text-stone-900 font-bold text-xl shadow-lg shadow-brand-500/20">C</div>
            <div>
                <h1 className="text-stone-900 font-serif font-bold text-lg leading-none uppercase tracking-tight">CHILLIES</h1>
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
                { id: 'settings', icon: Settings, label: 'Operations' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                        activeTab === tab.id ? 'bg-brand-500 text-stone-900 shadow-xl' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-900/5'
                    }`}
                >
                    <tab.icon size={18} className={activeTab === tab.id ? 'stroke-[2.5]' : ''} />
                    <span className="text-sm font-bold tracking-wide">{tab.label}</span>
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-stone-900/5 space-y-2">
            <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 text-sm font-bold hover:bg-red-500/5 rounded-xl transition-colors"><LogOut size={16} /> Logout</button>
            <button onClick={handleExit} className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 text-sm font-bold hover:text-stone-900 transition-colors"><X size={16} /> Exit Panel</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white h-full overflow-hidden">
        <header className="h-20 border-b border-stone-900/5 px-8 flex items-center justify-between shrink-0 bg-stone-50/20 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <button onClick={handleExit} className="md:hidden p-2 text-stone-500 hover:text-stone-900 transition-colors">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-serif text-stone-900 capitalize">{activeTab}</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${isStoreOpen ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isStoreOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{isStoreOpen ? 'Active' : 'Offline'}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-900/10 flex items-center justify-center text-stone-600">
                    <User size={20} />
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-stone-50">
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
                    {!isStoreOpen && openingCountdown && (
                        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex items-center justify-between shadow-lg shadow-red-500/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500 text-stone-900 rounded-xl"><Clock size={24} /></div>
                                <div>
                                    <h4 className="text-stone-900 font-bold uppercase tracking-widest text-xs">Kitchen Offline</h4>
                                    <p className="text-stone-600 text-[10px]">Prepare for your next service session.</p>
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
                            { label: 'Total Orders', val: stats.totalOrders, icon: ShoppingBag, color: 'text-brand-500' },
                            { label: 'Delivered', val: stats.deliveredOrders, icon: Check, color: 'text-blue-500' },
                            { label: 'Avg. Order', val: `₹${stats.avgOrderValue}`, icon: Filter, color: 'text-purple-500' }
                        ].map((s: {label: string, val: string | number, icon: any, color: string}, i: number) => (
                            <div key={i} className="bg-stone-50/50 border border-stone-900/5 p-6 rounded-2xl group hover:border-stone-900/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl bg-white border border-stone-900/5 ${s.color} shadow-lg shadow-black/40`}><s.icon size={20} /></div>
                                    <span className="text-green-500 text-[10px] font-bold">+5.2%</span>
                                </div>
                                <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">{s.label}</p>
                                <h3 className="text-3xl font-serif text-stone-900">{s.val}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                        <div className="flex p-1.5 bg-stone-50 border border-stone-900/5 rounded-2xl w-full lg:w-fit shadow-inner">
                            {[
                                { id: 'new', label: 'New', count: orders.filter(o => o.status === 'pending').length },
                                { id: 'active', label: 'Active', count: orders.filter(o => ['preparing', 'ready', 'out_for_delivery'].includes(o.status)).length },
                                { id: 'history', label: 'History', count: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length }
                            ].map(s => (
                                <button 
                                    key={s.id} 
                                    onClick={() => setOrderStage(s.id as any)}
                                    className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                                        orderStage === s.id ? 'bg-brand-500 text-stone-900 shadow-lg' : 'text-stone-500 hover:text-stone-900'
                                    }`}
                                >
                                    {s.label}
                                    {s.count > 0 && <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${orderStage === s.id ? 'bg-white text-brand-500' : 'bg-stone-100 text-stone-600'}`}>{s.count}</span>}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full lg:max-w-xl flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search orders..." 
                                    value={orderSearch}
                                    onChange={e => setOrderSearch(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-900/5 rounded-2xl py-4 pl-12 pr-12 text-xs text-stone-900 focus:border-brand-500 outline-none shadow-inner"
                                />
                            </div>
                            <button 
                                onClick={() => setIsManualOrderOpen(true)}
                                className="bg-stone-100 border border-brand-500/20 text-stone-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-brand-500 hover:text-stone-900 transition-all shadow-lg active:scale-95"
                            >
                                <ShoppingCart size={16} /> Manual Order
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {filteredOrders.length === 0 ? (
                            <div className="col-span-full py-32 text-center border-2 border-dashed border-stone-200 rounded-[3rem] bg-stone-50/20">
                                <ShoppingBag className="mx-auto text-stone-700 mb-6 opacity-20" size={64} />
                                <p className="text-stone-500 uppercase tracking-[0.3em] text-xs font-bold">No matching records found</p>
                            </div>
                        ) : filteredOrders.map(order => (
                            <div key={order.id} className="bg-stone-50/80 border border-stone-900/5 rounded-[2.5rem] overflow-hidden group hover:border-brand-500/40 transition-all duration-500 flex flex-col shadow-xl">
                                <div className="p-8 border-b border-stone-900/5 flex justify-between items-start bg-white/30">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-brand-400 font-mono font-bold text-2xl tracking-tighter">#{order.id}</span>
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${order.type === 'delivery' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{order.type}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-stone-500 font-bold uppercase tracking-widest text-[10px]">
                                            <Calendar size={12} /> {order.date} <span className="opacity-30 mx-1">|</span> {order.timestamp}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => copyOrderBrief(order)} title="Copy Info" className="p-3 bg-white text-stone-600 hover:text-stone-900 rounded-2xl border border-stone-900/5 transition-all">
                                            {copiedId === order.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                        </button>
                                        <button onClick={() => printThermalBill(order)} title="Print" className="p-3 bg-white text-stone-600 hover:text-brand-500 rounded-2xl border border-stone-900/5 transition-all">
                                            <Printer size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 space-y-8 flex-1">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-stone-600 uppercase tracking-widest font-black block">Customer</span>
                                            <p className="text-sm font-bold truncate text-stone-900">{order.customerName}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-stone-600 uppercase tracking-widest font-black block">Contact</span>
                                            <p className="text-sm font-mono text-stone-700">{order.contactNumber}</p>
                                        </div>
                                    </div>
                                    {order.address && (
                                        <div className="p-4 bg-white/40 rounded-2xl border border-stone-900/5 space-y-2">
                                            <span className="text-[9px] text-stone-600 uppercase tracking-[0.2em] font-black block">Location</span>
                                            <p className="text-stone-600 text-xs flex items-start gap-3 leading-relaxed">
                                                <MapPin size={16} className="text-brand-500 shrink-0 mt-0.5" /> {order.address}
                                            </p>
                                        </div>
                                    )}
                                    <div className="bg-white rounded-[1.5rem] border border-stone-900/5 p-6 shadow-inner">
                                        <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-4">
                                            {order.items.map((it: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-stone-900/5 pb-3 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <SafeImage src={it.image} containerClassName="w-10 h-10 rounded-xl shrink-0" className="w-full h-full object-cover" />
                                                        <span className="text-stone-800 truncate font-medium"><span className="text-brand-500 font-black mr-2">{it.quantity}x</span> {it.name}</span>
                                                    </div>
                                                    <span className="text-stone-500 font-mono text-xs ml-4 whitespace-nowrap">₹{it.price * it.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-stone-900/10 flex justify-between items-end">
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-stone-600 uppercase font-black tracking-[0.2em]">Grand Total</span>
                                                <div className="text-3xl font-serif text-stone-900 font-bold leading-none">₹{order.total}</div>
                                            </div>
                                            <button onClick={() => handleStatusChange(order, order.status)} className="p-4 bg-green-500/10 text-green-500 rounded-2xl border border-green-500/20 hover:bg-green-500 hover:text-stone-900 transition-all">
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-white/40 border-t border-stone-900/5">
                                    <select 
                                        value={order.status} 
                                        onChange={(e) => handleStatusChange(order, e.target.value as any)}
                                        className={`w-full bg-white border-2 font-black uppercase text-[11px] p-5 rounded-2xl focus:outline-none cursor-pointer tracking-widest transition-all ${
                                            order.status === 'delivered' ? 'border-green-500/40 text-green-500' : 
                                            order.status === 'cancelled' ? 'border-red-500/40 text-red-500' : 'border-brand-500/40 text-brand-500'
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
                    <div className="bg-stone-50 border border-stone-900/5 p-4 rounded-3xl flex flex-col xl:flex-row items-center gap-4 shadow-xl">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search inventory..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="w-full bg-white border border-stone-200 rounded-2xl py-3.5 pl-12 pr-4 text-xs text-stone-900 focus:border-brand-500 outline-none transition-all shadow-inner" 
                            />
                        </div>
                        
                        <div className="flex p-1 bg-white border border-stone-200 rounded-2xl w-full xl:w-auto overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'all', label: 'All Stock' },
                                { id: 'available', label: 'Live' },
                                { id: 'unavailable', label: 'Sold' }
                            ].map((filter: any) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setInventoryStatusFilter(filter.id as any)}
                                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        inventoryStatusFilter === filter.id 
                                        ? 'bg-brand-500 text-stone-900 shadow-lg' 
                                        : 'text-stone-500 hover:text-stone-900'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex gap-2 w-full xl:w-auto">
                            <button 
                                onClick={handleDownloadSample}
                                className="flex-1 xl:flex-none bg-stone-100 border border-brand-500/20 text-stone-900 px-4 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all hover:bg-brand-500 hover:text-stone-900 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 group"
                                title="Download Sample Excel"
                            >
                                <Download size={18} className="group-hover:translate-y-1 transition-transform duration-300" />
                            </button>
                            <label className="flex-1 xl:flex-none cursor-pointer bg-stone-100 border border-brand-500/20 text-stone-900 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all hover:bg-brand-500 hover:text-stone-900 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 group">
                                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
                                <Upload size={18} className="group-hover:-translate-y-1 transition-transform duration-300" />
                                <span>Import</span>
                            </label>
                            <button 
                                onClick={() => openNewItemModal()} 
                                className="flex-1 xl:flex-none bg-stone-100 border border-brand-500/20 text-stone-900 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all hover:bg-brand-500 hover:text-stone-900 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 group"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
                                <span>New Dish</span>
                            </button>
                        </div>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="py-32 text-center border-2 border-dashed border-stone-200 rounded-[3rem] bg-stone-50/20 animate-fade-in">
                            <SearchX className="mx-auto text-stone-700 mb-6 opacity-20" size={64} />
                            <p className="text-stone-500 uppercase tracking-[0.3em] text-xs font-bold mb-8">No results for "{searchTerm}"</p>
                            {searchTerm && (
                                <button 
                                    onClick={() => openNewItemModal(searchTerm)}
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-brand-500/10 border border-brand-500/30 text-brand-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-stone-900 transition-all group"
                                >
                                    <Plus size={16} /> 
                                    Create "{searchTerm}" Dish
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {filteredItems.map(item => (
                                <div key={item.id} className={`bg-stone-50 border border-stone-900/5 rounded-3xl overflow-hidden group relative transition-all duration-500 ${item.isUnavailable ? 'opacity-40 grayscale' : 'hover:border-brand-500/30'}`}>
                                    <div className="h-44 relative overflow-hidden">
                                        <SafeImage src={item.image} containerClassName="w-full h-full" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    </div>
                                    <div className="p-5">
                                        <p className="text-stone-600 text-[8px] uppercase font-black tracking-[0.2em] mb-1">{item.category}</p>
                                        
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-stone-900 font-bold text-sm truncate flex-1">{item.name}</h4>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${!item.isUnavailable ? 'text-brand-500' : 'text-stone-600'}`}>
                                                    {item.isUnavailable ? 'OFF' : 'LIVE'}
                                                </span>
                                                <button 
                                                    onClick={() => onUpdateItem({ ...item, isUnavailable: !item.isUnavailable })}
                                                    className={`group relative flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-all duration-300 ease-in-out focus:outline-none ${!item.isUnavailable ? 'bg-brand-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-stone-100 border border-stone-700'}`}
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow-lg ring-0 transition duration-300 ease-in-out ${!item.isUnavailable ? 'translate-x-4 bg-white' : 'translate-x-0 bg-stone-500'}`}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-brand-400 font-serif font-bold text-lg">₹{item.price}</span>
                                            <div className="flex gap-1 items-center">
                                                {item.spicyLevel && item.spicyLevel !== 'none' && <Flame size={12} className="text-red-500" />}
                                                {item.isFlashSale && <Zap size={12} className="text-red-500" />}
                                                {item.isChefChoice && <ChefHat size={12} className="text-brand-500" />}
                                                {item.isExclusive && <EyeOff size={12} className="text-purple-500" />}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingItem(item); setIsItemFormOpen(true); }} className="flex-1 bg-stone-100 text-stone-700 hover:text-stone-900 hover:bg-stone-700 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Edit</button>
                                            <button onClick={() => onDeleteItem(item.id)} className="p-2 bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-stone-900 rounded-lg transition-all"><Trash2 size={14} /></button>
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
                    <div className="bg-stone-50 border border-stone-900/5 p-10 rounded-[3rem] shadow-xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 border border-brand-500/20"><Tag size={24} /></div>
                            <div>
                                <h4 className="text-2xl font-serif text-stone-900">Menu Categories</h4>
                                <p className="text-stone-500 text-xs uppercase tracking-widest font-bold">Structure your offerings</p>
                            </div>
                        </div>
                        <div className="flex gap-4 mb-12">
                            <div className="relative flex-1">
                                <Layers size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500" />
                                <input type="text" placeholder="Enter new category name..." value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} className="w-full bg-white border border-stone-200 rounded-2xl py-5 pl-14 pr-6 text-stone-900 focus:border-brand-500 outline-none transition-all" />
                            </div>
                            <button onClick={() => { if(newCatInput.trim()) { onAddCategory(newCatInput.trim()); setNewCatInput(''); } }} className="bg-brand-500 text-stone-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg"> <Plus size={18} /> Add </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {categories.map((cat: any) => (
                                <div key={cat.id} className="flex items-center justify-between p-6 bg-stone-50 rounded-2xl border border-stone-900/5 hover:border-brand-500/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform"><Tag size={18} /></div>
                                        <div>
                                            <p className="text-stone-900 font-bold tracking-tight">{cat.name}</p>
                                            {cat.startTime && cat.endTime && <p className="text-[9px] text-stone-500 font-mono">{cat.startTime} - {cat.endTime}</p>}
                                            <p className="text-[10px] text-stone-500 uppercase font-black">{items.filter(i => i.category === cat.name).length} Dishes</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setEditingCategory(cat)} className="p-3 text-stone-600 hover:text-brand-500 hover:bg-brand-500/5 rounded-xl transition-all"> <Edit2 size={18} /> </button>
                                        <button onClick={() => onDeleteCategory(cat.name)} className="p-3 text-stone-600 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"> <Trash2 size={20} /> </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'coupons' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
                    <div className="bg-stone-50 border border-stone-900/5 p-10 rounded-[3rem] shadow-xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 border border-brand-500/20"><Ticket size={24} /></div>
                            <div><h4 className="text-2xl font-serif text-stone-900">Promo Hub</h4><p className="text-stone-500 text-xs uppercase tracking-widest font-bold">Vouchers & Discounts</p></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                            <input type="text" placeholder="CODE" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())} className="bg-white border border-stone-200 rounded-2xl px-6 py-5 text-stone-900 font-mono focus:border-brand-500 outline-none uppercase" />
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500" />
                                <input type="number" placeholder="Discount ₹" value={newCouponVal || ''} onChange={(e) => setNewCouponVal(Number(e.target.value))} className="w-full bg-white border border-stone-200 rounded-2xl py-5 pl-12 pr-6 text-stone-900 focus:border-brand-500 outline-none" />
                            </div>
                            <button onClick={() => { if(newCouponCode && newCouponVal) { onAddCoupon({ code: newCouponCode, value: newCouponVal, type: 'flat' }); setNewCouponCode(''); setNewCouponVal(0); } }} className="bg-brand-500 text-stone-900 rounded-2xl font-black uppercase tracking-widest text-xs py-5 transition-all shadow-lg"> Create Coupon </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {coupons.map((coupon: any) => (
                                <div key={coupon.id} className="p-6 bg-stone-50 rounded-2xl border border-stone-900/5 flex justify-between items-center group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500 shadow-[2px_0_10px_rgba(249,115,22,0.4)]"></div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3.5 rounded-xl bg-brand-500/10 text-brand-500"><Ticket size={24} /></div>
                                        <div><p className="text-stone-900 font-mono font-bold text-lg">{coupon.code}</p><p className="text-stone-500 text-[10px] uppercase font-black tracking-widest">₹{coupon.value} Flat Off</p></div>
                                    </div>
                                    <button onClick={() => coupon.id && onDeleteCoupon(coupon.id)} className="p-3 text-stone-700 hover:text-red-500 transition-all hover:bg-red-500/5 rounded-xl"> <Trash2 size={20} /> </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'promotions' && (
                <div className="max-w-4xl animate-fade-in space-y-12 mx-auto pb-12">
                    <div className="grid grid-cols-1 gap-12">
                        <div className={`bg-stone-50/80 border p-10 rounded-[3rem] transition-all duration-700 ${promoSettings.isFlashSaleActive ? 'border-red-500/40 shadow-[0_0_50px_rgba(220,38,38,0.1)]' : 'border-stone-900/5'}`}>
                            <div className="flex justify-between items-start mb-10">
                                <div className={`p-5 rounded-[1.5rem] ${promoSettings.isFlashSaleActive ? 'bg-red-500 text-stone-900 shadow-lg' : 'bg-white text-stone-600 border border-stone-900/5'}`}><Zap size={40} /></div>
                                <button onClick={() => onUpdatePromos({ ...promoSettings, isFlashSaleActive: !promoSettings.isFlashSaleActive })} className={`relative w-16 h-8 rounded-full transition-colors ${promoSettings.isFlashSaleActive ? 'bg-red-500' : 'bg-stone-100'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${promoSettings.isFlashSaleActive ? 'left-9' : 'left-1'}`}></div></button>
                            </div>
                            <div className="space-y-2 mb-8"><h4 className="text-3xl font-serif text-stone-900">Flash Sale</h4><p className="text-stone-500 text-xs">Timed aggressive discounts.</p></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3"><label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Calendar size={14} className="text-red-500"/> Date</label><input type="date" value={promoSettings.flashSaleDate} onChange={e => onUpdatePromos({...promoSettings, flashSaleDate: e.target.value})} className="w-full bg-white border border-stone-900/5 rounded-2xl p-5 text-stone-900 text-xs outline-none focus:border-red-500 [color-scheme:dark]" /></div>
                                <div className="space-y-3"><label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Clock size={14} className="text-red-500"/> Start</label><input type="time" value={promoSettings.flashSaleStartTime} onChange={e => onUpdatePromos({...promoSettings, flashSaleStartTime: e.target.value})} className="w-full bg-white border border-stone-900/5 rounded-2xl p-5 text-stone-900 text-xs outline-none focus:border-red-500 [color-scheme:dark]" /></div>
                                <div className="space-y-3"><label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Clock size={14} className="text-red-500"/> End</label><input type="time" value={promoSettings.flashSaleEndTime} onChange={e => onUpdatePromos({...promoSettings, flashSaleEndTime: e.target.value})} className="w-full bg-white border border-stone-900/5 rounded-2xl p-5 text-stone-900 text-xs outline-none focus:border-red-500 [color-scheme:dark]" /></div>
                            </div>
                        </div>
                        <div className={`bg-stone-50/80 border p-10 rounded-[3rem] transition-all duration-700 ${promoSettings.isHappyHourActive ? 'border-purple-500/40 shadow-[0_0_50px_rgba(147,51,234,0.1)]' : 'border-stone-900/5'}`}>
                            <div className="flex justify-between items-start mb-10">
                                <div className={`p-5 rounded-[1.5rem] ${promoSettings.isHappyHourActive ? 'bg-purple-500 text-stone-900 shadow-lg' : 'bg-white text-stone-600 border border-stone-900/5'}`}><PartyPopper size={40} /></div>
                                <button onClick={() => onUpdatePromos({ ...promoSettings, isHappyHourActive: !promoSettings.isHappyHourActive })} className={`relative w-16 h-8 rounded-full transition-colors ${promoSettings.isHappyHourActive ? 'bg-purple-500' : 'bg-stone-100'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${promoSettings.isHappyHourActive ? 'left-9' : 'left-1'}`}></div></button>
                            </div>
                            <div className="space-y-2 mb-8"><h4 className="text-3xl font-serif text-stone-900">Happy Hour</h4><p className="text-stone-500 text-xs">Daily recurring special pricing.</p></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3"><label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Clock size={14} className="text-purple-500"/> Opens</label><input type="time" value={promoSettings.happyHourStartTime} onChange={e => onUpdatePromos({...promoSettings, happyHourStartTime: e.target.value})} className="w-full bg-white border border-stone-900/5 rounded-2xl p-5 text-stone-900 text-xs outline-none focus:border-purple-500 [color-scheme:dark]" /></div>
                                <div className="space-y-3"><label className="text-[10px] text-stone-600 uppercase tracking-widest font-black flex items-center gap-2"><Clock size={14} className="text-purple-500"/> Closes</label><input type="time" value={promoSettings.happyHourEndTime} onChange={e => onUpdatePromos({...promoSettings, happyHourEndTime: e.target.value})} className="w-full bg-white border border-stone-900/5 rounded-2xl p-5 text-stone-900 text-xs outline-none focus:border-purple-500 [color-scheme:dark]" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-4xl animate-fade-in mx-auto pb-12">
                    <div className="bg-stone-50/80 border border-stone-900/5 rounded-[3rem] p-12 space-y-12 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-serif text-stone-900">Manual Status Toggle</h4>
                                <p className="text-stone-500 text-sm">Instantly open or close kitchen availability.</p>
                            </div>
                            <button 
                                onClick={() => onUpdateStoreSettings({ ...storeSettings, acceptingOrders: !storeSettings.acceptingOrders })} 
                                className={`px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 ${storeSettings.acceptingOrders ? 'bg-green-600 text-stone-900 hover:bg-green-500 shadow-green-500/10' : 'bg-red-600 text-stone-900 hover:bg-red-500 shadow-red-500/10'}`}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-stone-900/10">
                            <div className="space-y-6">
                                <h5 className="text-stone-900 text-base font-bold flex items-center gap-3"><Clock size={20} className="text-brand-500" /> Opening Window</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-stone-900/5 space-y-1">
                                        <label className="text-[8px] text-stone-600 uppercase tracking-[0.2em] block font-black">Opening</label>
                                        <input type="time" value={storeSettings.startTime} onChange={e => onUpdateStoreSettings({ ...storeSettings, startTime: e.target.value })} className="w-full bg-transparent text-stone-900 font-mono focus:outline-none [color-scheme:dark]" />
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-stone-900/5 space-y-1">
                                        <label className="text-[8px] text-stone-600 uppercase tracking-[0.2em] block font-black">Closing</label>
                                        <input type="time" value={storeSettings.endTime} onChange={e => onUpdateStoreSettings({ ...storeSettings, endTime: e.target.value })} className="w-full bg-transparent text-stone-900 font-mono focus:outline-none [color-scheme:dark]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* Category Editor Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-white/95 backdrop-blur-2xl animate-fade-in">
            <div className="bg-stone-50 border border-stone-900/10 rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-serif text-stone-900">Edit Category</h3>
                    <button onClick={() => setEditingCategory(null)} className="text-stone-500 hover:text-stone-900 transition-all"><X size={24} /></button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Category Name</label>
                        <input type="text" value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl p-4 text-stone-900 text-sm focus:border-brand-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Availability Start</label>
                            <input type="time" value={editingCategory.startTime || ''} onChange={e => setEditingCategory({...editingCategory, startTime: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl p-4 text-stone-900 font-mono [color-scheme:dark]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Availability End</label>
                            <input type="time" value={editingCategory.endTime || ''} onChange={e => setEditingCategory({...editingCategory, endTime: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl p-4 text-stone-900 font-mono [color-scheme:dark]" />
                        </div>
                    </div>
                </div>
                <button 
                  onClick={() => { if(onUpdateCategory && editingCategory) onUpdateCategory(editingCategory); setEditingCategory(null); }} 
                  className="w-full bg-brand-500 text-stone-900 font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg hover:bg-brand-400"
                >
                  Save Category
                </button>
            </div>
        </div>
      )}

      {/* Manual Order Modal */}
      {isManualOrderOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-white/95 backdrop-blur-2xl animate-fade-in overflow-y-auto">
            <div className="bg-stone-50 border border-stone-900/10 rounded-[3rem] w-full max-w-4xl shadow-[0_0_100px_rgba(0,0,0,0.8)] my-8 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-stone-900/5 flex justify-between items-center bg-white/40 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-stone-900 shadow-lg shadow-brand-500/20"><ShoppingCart size={24} className="stroke-[3]" /></div>
                        <h3 className="text-xl font-serif text-stone-900">Create Manual Order</h3>
                    </div>
                    <button onClick={() => setIsManualOrderOpen(false)} className="text-stone-500 hover:text-stone-900 transition-all"><X size={28} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-8">
                    {/* Left: Customer Details & Cart */}
                    <div className="flex-1 space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-stone-900 border-b border-stone-200 pb-2">Customer Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Name" value={manualCustomer.name} onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm focus:border-brand-500 outline-none" />
                                <input type="text" placeholder="Phone" value={manualCustomer.phone} onChange={e => setManualCustomer({...manualCustomer, phone: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm focus:border-brand-500 outline-none" />
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="radio" checked={manualCustomer.type === 'pickup'} onChange={() => setManualCustomer({...manualCustomer, type: 'pickup'})} className="accent-brand-500" /> Pickup
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="radio" checked={manualCustomer.type === 'delivery'} onChange={() => setManualCustomer({...manualCustomer, type: 'delivery'})} className="accent-brand-500" /> Delivery
                                </label>
                            </div>
                            {manualCustomer.type === 'delivery' && (
                                <textarea placeholder="Delivery Address" value={manualCustomer.address} onChange={e => setManualCustomer({...manualCustomer, address: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm focus:border-brand-500 outline-none h-20 resize-none" />
                            )}
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-stone-900 border-b border-stone-200 pb-2">Order Items</h4>
                            {manualOrderItems.length === 0 ? (
                                <p className="text-stone-500 text-sm italic">No items added yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {manualOrderItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-stone-100">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-stone-900">{item.name}</p>
                                                <p className="text-xs text-stone-500">₹{item.price} x {item.quantity}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-stone-50 rounded-lg p-1">
                                                    <button onClick={() => setManualOrderItems(prev => prev.map(i => i.id === item.id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))} className="p-1 hover:bg-stone-200 rounded"><Minus size={14} /></button>
                                                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => setManualOrderItems(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))} className="p-1 hover:bg-stone-200 rounded"><Plus size={14} /></button>
                                                </div>
                                                <button onClick={() => setManualOrderItems(prev => prev.filter(i => i.id !== item.id))} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {manualOrderItems.length > 0 && (
                                <div className="pt-4 border-t border-stone-200">
                                    <div className="flex justify-between text-sm mb-1"><span>Subtotal</span><span>₹{manualOrderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0)}</span></div>
                                    {manualCustomer.type === 'delivery' && <div className="flex justify-between text-sm mb-1"><span>Delivery</span><span>₹20</span></div>}
                                    <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-stone-200">
                                        <span>Total</span>
                                        <span>₹{manualOrderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0) + (manualCustomer.type === 'delivery' ? 20 : 0)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Menu Selection */}
                    <div className="flex-1 space-y-4 border-t lg:border-t-0 lg:border-l border-stone-200 pt-8 lg:pt-0 lg:pl-8">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input type="text" placeholder="Search menu to add..." value={manualItemSearch} onChange={e => setManualItemSearch(e.target.value)} className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-brand-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
                            {items.filter(i => i.name.toLowerCase().includes(manualItemSearch.toLowerCase()) || i.category.toLowerCase().includes(manualItemSearch.toLowerCase())).map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-stone-100 hover:border-brand-500 transition-colors cursor-pointer" onClick={() => {
                                    setManualOrderItems(prev => {
                                        const existing = prev.find(i => i.id === item.id);
                                        if (existing) return prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i);
                                        return [...prev, { ...item, quantity: 1 }];
                                    });
                                }}>
                                    <div>
                                        <p className="text-sm font-bold text-stone-900">{item.name}</p>
                                        <p className="text-xs text-stone-500">₹{item.price}</p>
                                    </div>
                                    <button className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-brand-500 hover:text-white transition-colors"><Plus size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-stone-900/5 bg-white/40 flex gap-4 shrink-0">
                    <button 
                        onClick={handleManualOrderSubmit} 
                        disabled={!manualCustomer.name || !manualCustomer.phone || manualOrderItems.length === 0 || (manualCustomer.type === 'delivery' && !manualCustomer.address)}
                        className="flex-1 bg-brand-500 text-stone-900 font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-xs transition-all shadow-xl hover:bg-brand-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    > 
                        Create Order <ChevronRight size={16} /> 
                    </button>
                    <button onClick={() => setIsManualOrderOpen(false)} className="px-8 border border-stone-200 text-stone-500 hover:text-stone-900 rounded-2xl uppercase tracking-widest text-[10px] font-black transition-all">Cancel</button>
                </div>
            </div>
        </div>
      )}

      {/* Item Add/Edit Modal */}
      {isItemFormOpen && editingItem && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-white/95 backdrop-blur-2xl animate-fade-in overflow-y-auto">
            <div className="bg-stone-50 border border-stone-900/10 rounded-[3rem] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] my-8 overflow-hidden">
                <div className="p-8 border-b border-stone-900/5 flex justify-between items-center bg-white/40">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-stone-900 shadow-lg shadow-brand-500/20"><Plus size={24} className="stroke-[3]" /></div>
                        <h3 className="text-xl font-serif text-stone-900">{editingItem.id ? 'Edit Dish' : 'Craft New Dish'}</h3>
                    </div>
                    <button onClick={() => setIsItemFormOpen(false)} className="text-stone-500 hover:text-stone-900 transition-all"><X size={28} /></button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Identity</label>
                                <input type="text" placeholder="Item Name" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-stone-900 text-sm focus:border-brand-500 outline-none transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Price (₹)</label>
                                    <input type="number" placeholder="250" value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-stone-900 font-mono text-lg focus:border-brand-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Menu</label>
                                    <select value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-stone-900 text-sm focus:border-brand-500 outline-none appearance-none">
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
                                                ? 'bg-red-500 text-stone-900 border-red-500' 
                                                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-700'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Story</label>
                                <textarea placeholder="A brief description..." value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-stone-900 text-xs focus:border-brand-500 outline-none h-24 resize-none" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-stone-600 uppercase tracking-[0.2em] font-black">Visual Asset</label>
                                <div className="aspect-square rounded-3xl overflow-hidden border border-stone-200 bg-white flex flex-col items-center justify-center relative shadow-inner">
                                    {editingItem.image ? (
                                        <img src={editingItem.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <ImageIcon size={32} />
                                            <span className="text-[8px] uppercase font-black tracking-widest">No Asset</span>
                                        </div>
                                    )}
                                </div>
                                <input type="text" placeholder="Paste Image URL" value={editingItem.image || ''} onChange={e => setEditingItem({...editingItem, image: e.target.value})} className="w-full bg-stone-50/50 border border-stone-200 rounded-2xl p-4 text-stone-900 text-[10px] font-mono focus:border-brand-500 outline-none mt-2 shadow-inner" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/40 p-6 rounded-[2rem] border border-stone-900/5 shadow-inner">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {[
                                { key: 'isChefChoice', label: 'Chef Pick', icon: ChefHat },
                                { key: 'isFlashSale', label: 'Flash', icon: Zap },
                                { key: 'isHappyHour', label: 'Happy', icon: PartyPopper },
                                { key: 'isExclusive', label: 'Exclusive', icon: EyeOff }
                            ].map((flag) => (
                                <label key={flag.key} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${editingItem[flag.key as keyof MenuItem] ? 'bg-brand-500/10 border-brand-500 text-brand-500 shadow-lg shadow-brand-500/5' : 'bg-stone-50/30 border-stone-200 text-stone-600 hover:border-stone-700'}`}>
                                    <input type="checkbox" className="hidden" checked={!!editingItem[flag.key as keyof MenuItem]} onChange={() => setEditingItem({...editingItem, [flag.key]: !editingItem[flag.key as keyof MenuItem]})} />
                                    <flag.icon size={18} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{flag.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-stone-900/5 bg-white/40 flex gap-4">
                    <button onClick={() => { 
                        if(!editingItem || !editingItem.name || !editingItem.price) return; 
                        if(editingItem.id) onUpdateItem(editingItem as MenuItem); 
                        else onAddItem({ ...editingItem as MenuItem, id: Math.random().toString(36).substr(2,9) } as MenuItem); 
                        setIsItemFormOpen(false); 
                    }} className="flex-1 bg-brand-500 text-stone-900 font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-xs transition-all shadow-xl hover:bg-brand-400 active:scale-95 flex items-center justify-center gap-2"> {editingItem.id ? 'Save Changes' : 'Publish Dish'} <ChevronRight size={16} /> </button>
                    <button onClick={() => setIsItemFormOpen(false)} className="px-8 border border-stone-200 text-stone-500 hover:text-stone-900 rounded-2xl uppercase tracking-widest text-[10px] font-black transition-all">Cancel</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;