
import React, { useState, useMemo } from 'react';
import { 
  X, Plus, Edit2, Trash2, Save, Image, Tag, List, 
  CheckSquare, Settings, LayoutDashboard, Search, 
  TrendingUp, UtensilsCrossed, AlertCircle, ArrowLeft,
  DollarSign, PieChart, Coffee, Lock, LogOut, ShoppingBag, MapPin, Phone, User, ChevronDown, MessageCircle, Clock, Bike, Store, ExternalLink, Ticket, Percent, Zap, ToggleLeft, ToggleRight, Share2, Timer, PartyPopper, EyeOff, Menu, Power, Ban, Copy, Check
} from 'lucide-react';
import { MenuItem, Order, Coupon, CategoryConfig } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  categories: CategoryConfig[];
  orders: Order[];
  coupons?: Coupon[];
  isFlashSaleActive?: boolean;
  flashSaleEndTime?: string;
  isHappyHourActive?: boolean;
  storeSettings?: { acceptingOrders: boolean; startTime: string; endTime: string };
  onAddItem: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onAddCategory: (category: string) => void;
  onUpdateCategory?: (category: CategoryConfig) => void;
  onDeleteCategory: (category: string) => void;
  onUpdateOrderStatus: (id: string, status: Order['status']) => void;
  onAddCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (id: string) => void;
  onToggleFlashSale?: (isActive: boolean) => void;
  onUpdateFlashSaleEndTime?: (time: string) => void;
  onToggleHappyHour?: (isActive: boolean) => void;
  onUpdateStoreSettings?: (settings: { acceptingOrders: boolean; startTime: string; endTime: string }) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  items,
  categories,
  orders,
  coupons = [],
  isFlashSaleActive = false,
  flashSaleEndTime = '23:59',
  isHappyHourActive = false,
  storeSettings = { acceptingOrders: true, startTime: '07:00', endTime: '23:00' },
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateOrderStatus,
  onAddCoupon,
  onDeleteCoupon,
  onToggleFlashSale,
  onUpdateFlashSaleEndTime,
  onToggleHappyHour,
  onUpdateStoreSettings
}) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'categories' | 'orders' | 'coupons' | 'flash-sale' | 'happy-hour'>('dashboard');
  
  // Feature State
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponType, setNewCouponType] = useState<'flat' | 'percent'>('flat');
  
  // Copy feedback state
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Tag Input State
  const [tagInput, setTagInput] = useState('');

  // Order Tab State
  const [orderStage, setOrderStage] = useState<'new' | 'processing' | 'history'>('new');

  // Derived State
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        if (orderStage === 'new') return order.status === 'pending';
        if (orderStage === 'processing') return ['preparing', 'ready', 'out_for_delivery'].includes(order.status);
        if (orderStage === 'history') return ['delivered', 'cancelled'].includes(order.status);
        return false;
    });
  }, [orders, orderStage]);

  const stats = {
    totalItems: items.length,
    totalCategories: categories.length, 
    avgPrice: items.length > 0 ? Math.round(items.reduce((acc, i) => acc + i.price, 0) / items.length) : 0,
    vegItems: items.filter(i => i.isVegetarian).length,
    spicyItems: items.filter(i => i.isSpicy).length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((acc, o) => acc + o.total, 0),
  };

  // Form State Handlers
  const initialFormState: Partial<MenuItem> = {
    name: '',
    description: '',
    price: 0,
    category: categories[0]?.name || 'Main Course',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    isVegetarian: false,
    isSpicy: false,
    isFlashSale: false,
    flashSalePrice: 0,
    isHappyHour: false,
    happyHourPrice: 0,
    isExclusive: false,
    tags: [],
    isUnavailable: false
  };

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

  const handleLogout = () => {
      setIsAuthenticated(false);
      setPasswordInput('');
  }

  const handleEditClick = (item: MenuItem) => {
    setEditingItem({ ...item, tags: item.tags || [] });
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingItem(initialFormState);
    setIsFormOpen(true);
  };

  const handleSaveItem = () => {
    if (!editingItem?.name || !editingItem.price) return;

    const itemToSave = {
      ...editingItem,
      id: editingItem.id || Math.random().toString(36).substr(2, 9),
      price: Number(editingItem.price),
    } as MenuItem;

    if (editingItem.id) {
      onUpdateItem(itemToSave);
    } else {
      onAddItem(itemToSave);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleAddCouponSubmit = () => {
      if (!newCouponCode.trim() || !newCouponValue) return;
      const val = parseFloat(newCouponValue);
      if (isNaN(val) || val <= 0) return;
      onAddCoupon({
          code: newCouponCode.trim().toUpperCase(),
          value: val,
          type: newCouponType
      });
      setNewCouponCode('');
      setNewCouponValue('');
  };
  
  const handleCopyLink = (order: Order) => {
      if (order.trackingLink) {
          navigator.clipboard.writeText(order.trackingLink);
          setCopiedOrderId(order.id);
          setTimeout(() => setCopiedOrderId(null), 2000);
      }
  };

  // Logic to handle status change and send WhatsApp notification
  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    onUpdateOrderStatus(order.id, newStatus);

    // Don't send notification for pending
    if (newStatus === 'pending') return;

    let statusMsg = '';
    switch (newStatus) {
        case 'preparing':
            statusMsg = 'is now being prepared in our kitchen 👨‍🍳';
            break;
        case 'ready':
            statusMsg = order.type === 'pickup' ? 'is ready for pickup! 🛍️' : 'is packed and ready for delivery 📦';
            break;
        case 'out_for_delivery':
            statusMsg = 'is out for delivery! 🛵';
            break;
        case 'delivered':
            statusMsg = 'has been delivered. Enjoy your meal! ✅';
            break;
        case 'cancelled':
            statusMsg = 'has been cancelled ❌';
            break;
        default:
            return;
    }

    const message = `Hi ${order.customerName}, update on Order #${order.id} from Chillies:\n\nYour order ${statusMsg}`;
    const trackingPart = order.trackingLink ? `\n\nTrack Status: ${order.trackingLink}` : '';
    
    const fullMessage = message + trackingPart;
    
    // Format phone number (assuming India +91 default if 10 digits)
    const phone = order.contactNumber.replace(/\D/g, '');
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(fullMessage)}`, '_blank');
  };

  // Special Offer Handlers
  const toggleItemFlashSale = (item: MenuItem) => {
      onUpdateItem({
          ...item,
          isFlashSale: !item.isFlashSale,
          flashSalePrice: !item.isFlashSale && !item.flashSalePrice ? item.price : item.flashSalePrice
      });
  };

  const handleUpdateFlashPrice = (item: MenuItem, price: number) => {
      onUpdateItem({ ...item, flashSalePrice: price });
  };

  const toggleItemHappyHour = (item: MenuItem) => {
    onUpdateItem({
        ...item,
        isHappyHour: !item.isHappyHour,
        happyHourPrice: !item.isHappyHour && !item.happyHourPrice ? item.price : item.happyHourPrice
    });
  };

  const handleUpdateHappyHourPrice = (item: MenuItem, price: number) => {
    onUpdateItem({ ...item, happyHourPrice: price });
  };

  // Fix: Defined openWhatsApp function
  const openWhatsApp = (phone: string) => {
      let formatted = phone.replace(/\D/g, '');
      if (formatted.length === 10) formatted = '91' + formatted;
      window.open(`https://wa.me/${formatted}`, '_blank');
  };

  const NavButton = ({ tab, icon: Icon, label }: { tab: typeof activeTab, icon: any, label: string }) => (
    <button 
      onClick={() => { setActiveTab(tab); setIsFormOpen(false); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group ${
        activeTab === tab 
          ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-stone-950 shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
          : 'text-stone-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={18} className={activeTab === tab ? 'text-stone-900' : 'text-stone-500 group-hover:text-gold-500 transition-colors'} />
      <span>{label}</span>
      {activeTab === tab && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-900"></div>}
    </button>
  );

  if (!isOpen) return null;

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black animate-fade-in p-4">
             <div className="relative w-full max-w-md bg-stone-900/60 backdrop-blur-xl border border-gold-500/20 rounded-3xl p-10 shadow-2xl overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-stone-950 rounded-full border border-gold-500/20 shadow-[0_0_30px_rgba(212,175,55,0.1)] mb-6">
                        <Lock className="text-gold-500 w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-serif text-white mb-2 tracking-wide">Admin Access</h2>
                    <p className="text-stone-500 text-sm font-light">Authenticate to manage your restaurant.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <input 
                            type="password" 
                            placeholder="Enter Passkey" 
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className={`w-full bg-stone-950 border rounded-xl px-4 py-4 text-white focus:outline-none transition-all text-center tracking-[0.5em] font-bold ${authError ? 'border-red-500 focus:border-red-500' : 'border-stone-800 focus:border-gold-500'}`}
                            autoFocus
                        />
                        {authError && <p className="text-red-500 text-xs text-center font-bold">Access Denied. Invalid Passkey.</p>}
                    </div>
                    <button 
                        type="submit"
                        className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:-translate-y-1"
                    >
                        Unlock Panel
                    </button>
                </form>
             </div>
        </div>
      )
  }

  // --- MAIN ADMIN UI ---
  return (
    <div className="fixed inset-0 z-[100] bg-stone-950 text-stone-200 font-sans flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-stone-900/80 backdrop-blur-xl border-r border-white/5 z-50 transform transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <div className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-700 rounded-lg flex items-center justify-center shadow-lg">
                        <span className="font-serif text-stone-950 font-bold text-xl">C</span>
                    </div>
                    <div>
                        <h1 className="font-serif text-xl text-white font-bold tracking-wide">CHILLIES</h1>
                        <span className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold">Admin Panel</span>
                    </div>
                </div>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <NavButton tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavButton tab="orders" icon={ShoppingBag} label="Orders" />
                <NavButton tab="items" icon={List} label="Menu Items" />
                <NavButton tab="categories" icon={Tag} label="Categories" />
                <NavButton tab="coupons" icon={Ticket} label="Coupons" />
                <div className="pt-4 pb-2">
                    <p className="px-4 text-[10px] text-stone-600 uppercase tracking-widest font-bold">Marketing</p>
                </div>
                <NavButton tab="flash-sale" icon={Zap} label="Flash Sale" />
                <NavButton tab="happy-hour" icon={PartyPopper} label="Happy Hour" />
            </nav>

             <div className="p-4 border-t border-white/5 space-y-1">
                <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full px-4 py-3 rounded-lg text-sm font-medium">
                    <Lock size={18} />
                    <span>Logout</span>
                </button>
                <button onClick={onClose} className="flex items-center gap-3 text-stone-500 hover:text-white transition-colors w-full px-4 py-3 rounded-lg hover:bg-white/5 text-sm font-medium">
                    <LogOut size={18} />
                    <span>Exit to Website</span>
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-stone-950">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-10 bg-stone-950/50 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-4">
                <button className="md:hidden text-stone-400 hover:text-white" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu size={24} />
                </button>
                <h2 className="text-xl md:text-2xl font-serif text-white capitalize">{activeTab.replace('-', ' ')}</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${storeSettings.acceptingOrders ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                    <div className={`w-2 h-2 rounded-full ${storeSettings.acceptingOrders ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`text-xs font-bold uppercase tracking-wide ${storeSettings.acceptingOrders ? 'text-green-500' : 'text-red-500'}`}>
                        {storeSettings.acceptingOrders ? 'Store Open' : 'Store Closed'}
                    </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center">
                    <User size={20} className="text-stone-400" />
                </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 min-h-0">
            
            {/* === DASHBOARD === */}
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/5' },
                            { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-gold-400', bg: 'from-gold-500/20 to-gold-600/5' },
                            { label: 'Menu Items', value: stats.totalItems, icon: UtensilsCrossed, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/5' },
                            { label: 'Active Categories', value: stats.totalCategories, icon: Tag, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/5' },
                        ].map((stat, i) => (
                            <div key={i} className={`relative p-6 rounded-2xl border border-white/5 bg-gradient-to-br ${stat.bg} overflow-hidden group`}>
                                <div className="relative z-10">
                                    <div className={`w-12 h-12 rounded-xl bg-stone-950/50 flex items-center justify-center mb-4 ${stat.color} shadow-lg`}>
                                        <stat.icon size={24} />
                                    </div>
                                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-serif text-white">{stat.value}</h3>
                                </div>
                                <stat.icon className={`absolute -right-4 -bottom-4 w-32 h-32 opacity-5 ${stat.color} group-hover:scale-110 transition-transform duration-700`} />
                            </div>
                        ))}
                    </div>

                    {/* Quick Settings */}
                    <div className="bg-stone-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Settings className="text-gold-500" size={20} />
                            <h3 className="text-white font-bold text-sm uppercase tracking-widest">Store Configuration</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-stone-950 p-5 rounded-xl border border-white/5">
                                <label className="text-[10px] text-stone-500 uppercase font-bold block mb-3">Accepting Orders</label>
                                <button 
                                    onClick={() => onUpdateStoreSettings?.({ ...storeSettings, acceptingOrders: !storeSettings.acceptingOrders })}
                                    className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${storeSettings.acceptingOrders ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'}`}
                                >
                                    {storeSettings.acceptingOrders ? <><Store size={16}/> Shop is Open</> : <><Lock size={16}/> Shop is Closed</>}
                                </button>
                            </div>
                            <div className="bg-stone-950 p-5 rounded-xl border border-white/5">
                                <label className="text-[10px] text-stone-500 uppercase font-bold block mb-3">Opening Time (24h)</label>
                                <input 
                                    type="time" 
                                    value={storeSettings.startTime}
                                    onChange={(e) => onUpdateStoreSettings?.({ ...storeSettings, startTime: e.target.value })}
                                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-4 py-2.5 text-white focus:border-gold-500 focus:outline-none"
                                />
                            </div>
                            <div className="bg-stone-950 p-5 rounded-xl border border-white/5">
                                <label className="text-[10px] text-stone-500 uppercase font-bold block mb-3">Closing Time (24h)</label>
                                <input 
                                    type="time" 
                                    value={storeSettings.endTime}
                                    onChange={(e) => onUpdateStoreSettings?.({ ...storeSettings, endTime: e.target.value })}
                                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-4 py-2.5 text-white focus:border-gold-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === ORDERS === */}
            {activeTab === 'orders' && (
                <div className="h-full flex flex-col">
                    <div className="flex p-1 bg-stone-900 rounded-xl mb-6 self-start border border-white/5">
                        {['new', 'processing', 'history'].map((stage) => (
                            <button
                                key={stage}
                                onClick={() => setOrderStage(stage as any)}
                                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    orderStage === stage 
                                    ? 'bg-stone-800 text-white shadow-md' 
                                    : 'text-stone-500 hover:text-white'
                                }`}
                            >
                                {stage === 'new' ? 'New Requests' : stage === 'processing' ? 'In Kitchen' : 'Past Orders'}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                        {filteredOrders.length === 0 ? (
                            <div className="col-span-full text-center py-20 opacity-50">
                                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-stone-600" />
                                <p className="text-stone-400">No orders found in this stage.</p>
                            </div>
                        ) : filteredOrders.map(order => (
                            <div key={order.id} className="bg-stone-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6 relative group hover:border-gold-500/20 transition-colors">
                                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                                    <div>
                                        <span className="text-gold-500 font-bold text-lg">#{order.id}</span>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                                            <Clock size={12} /> {order.timestamp}
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        order.type === 'delivery' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'
                                    }`}>
                                        {order.type}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div>
                                        <p className="text-white font-medium">{order.customerName}</p>
                                        <p className="text-stone-500 text-xs flex items-center gap-1 mt-0.5"><Phone size={10}/> {order.contactNumber}</p>
                                    </div>
                                    <div className="bg-stone-950/50 p-3 rounded-lg border border-white/5 max-h-32 overflow-y-auto scrollbar-hide">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm mb-1 last:mb-0">
                                                <span className="text-stone-300"><span className="text-gold-500 font-bold">{item.quantity}x</span> {item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xs text-stone-500 uppercase tracking-widest">Total</span>
                                        <span className="text-xl font-serif text-white">₹{order.total}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <select 
                                        value={order.status} 
                                        onChange={(e) => handleStatusChange(order, e.target.value as Order['status'])}
                                        className="w-full bg-stone-950 border border-stone-800 text-white text-xs p-3 rounded-lg focus:border-gold-500 outline-none uppercase tracking-wide font-bold"
                                    >
                                        <option value="pending">🟡 Pending Verification</option>
                                        <option value="preparing">🟠 Preparing Food</option>
                                        <option value="ready">🔵 Ready for Pickup/Delivery</option>
                                        <option value="out_for_delivery">🟣 Out for Delivery</option>
                                        <option value="delivered">🟢 Delivered</option>
                                        <option value="cancelled">🔴 Cancelled</option>
                                    </select>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => openWhatsApp(order.contactNumber)}
                                            className="py-2.5 rounded-lg bg-green-600/10 text-green-500 border border-green-600/20 hover:bg-green-600 hover:text-white transition-all text-xs font-bold uppercase flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle size={14} /> Chat
                                        </button>
                                        {order.trackingLink && (
                                            <button 
                                                onClick={() => handleCopyLink(order)}
                                                className="py-2.5 rounded-lg bg-stone-800 text-stone-400 border border-white/5 hover:bg-stone-700 hover:text-white transition-all text-xs font-bold uppercase flex items-center justify-center gap-2"
                                            >
                                                {copiedOrderId === order.id ? <Check size={14} /> : <Copy size={14} />} Link
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ... rest of the admin panel tabs (Items, Categories, etc.) ... */}
            {activeTab === 'items' && !isFormOpen && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between bg-stone-900/40 p-4 rounded-2xl border border-white/5">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search menu..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-gold-500 focus:outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleAddNewClick} 
                            className="bg-gold-500 hover:bg-gold-400 text-stone-950 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                        >
                            <Plus size={18} /> Add New Item
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-stone-900/60 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden group hover:border-gold-500/30 transition-all hover:-translate-y-1">
                                <div className="h-32 relative overflow-hidden">
                                    <img src={item.image} alt={item.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${item.isUnavailable ? 'grayscale' : ''}`} />
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {item.isExclusive && <span className="bg-stone-950/80 text-gold-500 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide border border-gold-500/20 backdrop-blur-md">Exclusive</span>}
                                        {item.isUnavailable && <span className="bg-red-950/80 text-red-500 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide border border-red-500/20 backdrop-blur-md">Sold Out</span>}
                                    </div>
                                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                        {item.isFlashSale && <div className="bg-red-600 text-white p-1.5 rounded-lg shadow-lg"><Zap size={14} fill="currentColor"/></div>}
                                        {item.isHappyHour && <div className="bg-purple-600 text-white p-1.5 rounded-lg shadow-lg"><PartyPopper size={14} fill="currentColor"/></div>}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-80"></div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="min-w-0 flex-1 pr-2">
                                            <h4 className="text-white font-bold truncate" title={item.name}>{item.name}</h4>
                                            <span className="text-stone-500 text-xs block">{item.category}</span>
                                        </div>
                                        <span className="text-gold-400 font-serif font-bold text-lg whitespace-nowrap">₹{item.price}</span>
                                    </div>

                                    {/* Availability Toggle */}
                                    <div className="flex items-center justify-between bg-stone-950/50 p-2 rounded-lg border border-white/5 mb-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${item.isUnavailable ? 'text-red-400' : 'text-green-400'}`}>
                                            {item.isUnavailable ? 'Sold Out' : 'Available'}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateItem({ ...item, isUnavailable: !item.isUnavailable });
                                            }}
                                            className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${!item.isUnavailable ? 'bg-green-500' : 'bg-red-500/20 border border-red-500/50'}`}
                                            title={item.isUnavailable ? "Click to mark as Available" : "Click to mark as Sold Out"}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${!item.isUnavailable ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-2 pt-2 border-t border-white/5">
                                        <button onClick={() => handleEditClick(item)} className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors">
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={() => onDeleteItem(item.id)} className="px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* ... other tabs remain unchanged ... */}
            {activeTab === 'items' && isFormOpen && editingItem && (
                 <div className="max-w-4xl mx-auto animate-fade-in pb-20">
                     <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => setIsFormOpen(false)} className="w-10 h-10 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center text-stone-400 hover:text-white hover:border-gold-500 transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-white">{editingItem.id ? 'Edit Item' : 'Create New Item'}</h2>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         {/* Left: Image Preview & Main Info */}
                         <div className="space-y-6">
                            <div className="h-48 w-full rounded-2xl bg-stone-900 border-2 border-dashed border-stone-800 overflow-hidden relative group">
                                {editingItem.image ? (
                                    <img src={editingItem.image} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-600">
                                        <Image size={32} className="mb-2 opacity-50" />
                                        <span className="text-[10px] uppercase tracking-widest">No Image</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs text-stone-500 uppercase font-bold">Image URL</label>
                                <input type="text" placeholder="https://..." value={editingItem.image} onChange={e => setEditingItem({...editingItem, image: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white text-sm focus:border-gold-500 focus:outline-none" />
                            </div>
                         </div>

                         {/* Right: Details Form */}
                         <div className="lg:col-span-2 space-y-6">
                            <div className="bg-stone-900/40 p-6 rounded-2xl border border-white/5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-stone-500 uppercase font-bold">Name</label>
                                        <input type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white focus:border-gold-500 focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-stone-500 uppercase font-bold">Price (₹)</label>
                                        <input type="number" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white focus:border-gold-500 focus:outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-stone-500 uppercase font-bold">Category</label>
                                    <select value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white focus:border-gold-500 focus:outline-none appearance-none">
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-stone-500 uppercase font-bold">Description</label>
                                    <textarea value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white focus:border-gold-500 focus:outline-none h-24 resize-none" />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editingItem.isVegetarian} onChange={e => setEditingItem({...editingItem, isVegetarian: e.target.checked})} className="accent-green-500 w-4 h-4"/>
                                        <span className="text-sm text-stone-300">Vegetarian</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editingItem.isSpicy} onChange={e => setEditingItem({...editingItem, isSpicy: e.target.checked})} className="accent-red-500 w-4 h-4"/>
                                        <span className="text-sm text-stone-300">Spicy</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editingItem.isChefChoice} onChange={e => setEditingItem({...editingItem, isChefChoice: e.target.checked})} className="accent-gold-500 w-4 h-4"/>
                                        <span className="text-sm text-stone-300">Chef's Choice</span>
                                    </label>
                                </div>
                            </div>

                            {/* Offers Section */}
                            <div className="bg-stone-900/40 p-6 rounded-2xl border border-white/5 space-y-4">
                                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"><Ticket size={16} className="text-gold-500"/> Special Offers</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Flash Sale */}
                                    <div className={`p-4 rounded-xl border transition-all ${editingItem.isFlashSale ? 'bg-red-900/10 border-red-500/30' : 'bg-stone-950 border-stone-800'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-white flex items-center gap-2"><Zap size={14} className={editingItem.isFlashSale ? "text-red-500" : "text-stone-500"}/> Flash Sale</span>
                                            <input type="checkbox" checked={editingItem.isFlashSale} onChange={e => setEditingItem({...editingItem, isFlashSale: e.target.checked})} className="accent-red-500 w-4 h-4 cursor-pointer"/>
                                        </div>
                                        {editingItem.isFlashSale && (
                                            <input type="number" placeholder="Sale Price" value={editingItem.flashSalePrice} onChange={e => setEditingItem({...editingItem, flashSalePrice: Number(e.target.value)})} className="w-full bg-stone-900 border border-red-500/30 rounded p-2 text-white text-sm" />
                                        )}
                                    </div>

                                    {/* Happy Hour */}
                                    <div className={`p-4 rounded-xl border transition-all ${editingItem.isHappyHour ? 'bg-purple-900/10 border-purple-500/30' : 'bg-stone-950 border-stone-800'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-white flex items-center gap-2"><PartyPopper size={14} className={editingItem.isHappyHour ? "text-purple-500" : "text-stone-500"}/> Happy Hour</span>
                                            <input type="checkbox" checked={editingItem.isHappyHour} onChange={e => setEditingItem({...editingItem, isHappyHour: e.target.checked})} className="accent-purple-500 w-4 h-4 cursor-pointer"/>
                                        </div>
                                        {editingItem.isHappyHour && (
                                            <input type="number" placeholder="Happy Price" value={editingItem.happyHourPrice} onChange={e => setEditingItem({...editingItem, happyHourPrice: Number(e.target.value)})} className="w-full bg-stone-900 border border-purple-500/30 rounded p-2 text-white text-sm" />
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Unavailable Toggle */}
                                    <div className="flex items-center gap-3 pt-2 p-3 bg-stone-950 rounded-xl border border-stone-800">
                                        <input type="checkbox" id="unavail" checked={editingItem.isUnavailable || false} onChange={e => setEditingItem({...editingItem, isUnavailable: e.target.checked})} className="accent-red-500 w-4 h-4 ml-2"/>
                                        <div>
                                            <label htmlFor="unavail" className="text-sm font-bold text-white cursor-pointer select-none">Mark as Unavailable (Sold Out)</label>
                                            <p className="text-[10px] text-stone-500">Item will appear as 'Sold Out' on the menu.</p>
                                        </div>
                                    </div>

                                    {/* Exclusive Toggle */}
                                    <div className="flex items-center gap-3 pt-2 p-3 bg-stone-950 rounded-xl border border-stone-800">
                                        <input type="checkbox" id="excl" checked={editingItem.isExclusive} onChange={e => setEditingItem({...editingItem, isExclusive: e.target.checked})} className="accent-gold-500 w-4 h-4 ml-2"/>
                                        <div>
                                            <label htmlFor="excl" className="text-sm font-bold text-white cursor-pointer select-none">Exclusive Item</label>
                                            <p className="text-[10px] text-stone-500">Hidden from main menu. Only visible in Flash Sale/Happy Hour.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setIsFormOpen(false)} className="flex-1 py-4 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold transition-colors">Cancel</button>
                                <button onClick={handleSaveItem} className="flex-1 py-4 bg-gold-500 hover:bg-gold-400 text-stone-950 rounded-xl font-bold transition-colors shadow-lg shadow-gold-500/20">Save Changes</button>
                            </div>
                         </div>
                     </div>
                 </div>
            )}

            {activeTab === 'categories' && (
                 <div className="max-w-2xl animate-fade-in">
                     <div className="flex gap-2 mb-8">
                        <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New Category Name" className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-4 text-white focus:border-gold-500 focus:outline-none" />
                        <button onClick={handleAddCategory} className="bg-gold-500 text-stone-950 px-6 rounded-xl font-bold uppercase text-sm">Add</button>
                     </div>
                     <div className="space-y-3">
                        {categories.map(c => (
                            <div key={c.id} className="bg-stone-900/60 p-4 rounded-xl border border-white/5 flex justify-between items-center group">
                                <span className="text-white font-medium">{c.name}</span>
                                {c.name !== 'All' && <button onClick={() => onDeleteCategory(c.name)} className="text-stone-500 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>}
                            </div>
                        ))}
                     </div>
                 </div>
            )}

            {activeTab === 'coupons' && (
                 <div className="max-w-3xl animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-stone-900/40 p-6 rounded-2xl border border-white/5">
                          <input type="text" placeholder="Coupon Code (e.g. SAVE20)" value={newCouponCode} onChange={e => setNewCouponCode(e.target.value)} className="bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 focus:outline-none uppercase" />
                          <div className="flex gap-2">
                              <input type="number" placeholder="Value" value={newCouponValue} onChange={e => setNewCouponValue(e.target.value)} className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 focus:outline-none" />
                              <select value={newCouponType} onChange={e => setNewCouponType(e.target.value as any)} className="w-20 bg-stone-950 border border-stone-800 rounded-xl px-2 text-white focus:border-gold-500 outline-none">
                                  <option value="flat">₹</option>
                                  <option value="percent">%</option>
                              </select>
                          </div>
                          <button onClick={handleAddCouponSubmit} className="bg-gold-500 text-stone-950 rounded-xl font-bold uppercase text-sm shadow-lg shadow-gold-500/20">Create Coupon</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {coupons.map(c => (
                              <div key={c.id} className="bg-stone-900/60 p-5 rounded-xl border border-white/5 flex justify-between items-center relative overflow-hidden group">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold-500 to-gold-700"></div>
                                  <div>
                                      <span className="block text-white font-bold text-lg tracking-wider">{c.code}</span>
                                      <span className="text-xs text-stone-500 uppercase font-bold">{c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`}</span>
                                  </div>
                                  <button onClick={() => c.id && onDeleteCoupon(c.id)} className="text-stone-600 hover:text-red-500 transition-colors bg-stone-950 p-2 rounded-lg border border-white/5"><Trash2 size={16}/></button>
                              </div>
                          ))}
                      </div>
                 </div>
            )}
            
            {/* Reusing existing logic but with new style for Flash Sale tab if needed specifically, though 'items' tab handles assignment now */}
            {(activeTab === 'flash-sale' || activeTab === 'happy-hour') && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <Settings className="w-16 h-16 text-stone-600 mb-4" />
                    <h3 className="text-xl text-white font-bold mb-2">Configure in Menu Items</h3>
                    <p className="text-stone-400 max-w-md">
                        Please use the <strong>Menu Items</strong> tab to add specific items to {activeTab === 'flash-sale' ? 'Flash Sale' : 'Happy Hour'}. 
                        <br/>Global activation is controlled via the dashboard settings or top header.
                    </p>
                    <div className="mt-8 p-6 bg-stone-900 rounded-xl border border-white/5">
                        <h4 className="text-white text-sm font-bold mb-4 uppercase tracking-widest">Global Control</h4>
                        {activeTab === 'flash-sale' ? (
                            <div className="flex items-center gap-4">
                                <div className="text-left">
                                    <span className="block text-xs text-stone-500">Current Status</span>
                                    <span className={`font-bold ${isFlashSaleActive ? 'text-green-500' : 'text-stone-400'}`}>{isFlashSaleActive ? 'Active' : 'Inactive'}</span>
                                </div>
                                {onToggleFlashSale && (
                                    <button onClick={() => onToggleFlashSale(!isFlashSaleActive)} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase ${isFlashSaleActive ? 'bg-red-500 text-white' : 'bg-stone-800 text-stone-400'}`}>
                                        {isFlashSaleActive ? 'Turn Off' : 'Turn On'}
                                    </button>
                                )}
                                <div className="flex items-center gap-2 bg-stone-950 p-2 rounded-lg border border-white/5 ml-4">
                                    <Clock size={14} className="text-stone-500" />
                                    <input 
                                        type="time" 
                                        value={flashSaleEndTime}
                                        onChange={(e) => onUpdateFlashSaleEndTime?.(e.target.value)}
                                        className="bg-transparent text-white text-xs focus:outline-none w-16"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="text-left">
                                    <span className="block text-xs text-stone-500">Current Status</span>
                                    <span className={`font-bold ${isHappyHourActive ? 'text-green-500' : 'text-stone-400'}`}>{isHappyHourActive ? 'Active' : 'Inactive'}</span>
                                </div>
                                {onToggleHappyHour && (
                                    <button onClick={() => onToggleHappyHour(!isHappyHourActive)} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase ${isHappyHourActive ? 'bg-purple-500 text-white' : 'bg-stone-800 text-stone-400'}`}>
                                        {isHappyHourActive ? 'Turn Off' : 'Turn On'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
