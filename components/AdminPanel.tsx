import React, { useState, useMemo } from 'react';
import { 
  X, Plus, Edit2, Trash2, Tag, List, 
  Settings, LayoutDashboard, Search, 
  UtensilsCrossed, Lock, LogOut, ShoppingBag, Phone, User, MessageCircle, Clock, Copy, Check, Printer, Ticket, Zap, PartyPopper, Image, ArrowLeft
} from 'lucide-react';
import { MenuItem, Order, Coupon, CategoryConfig } from '../types';
import { printThermalBill } from '../App';
import SafeImage from './SafeImage';

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
    totalOrders: orders.length,
    totalRevenue: orders.reduce((acc, o) => acc + o.total, 0),
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

  const handleAddNewClick = () => {
    setEditingItem({
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
    });
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

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    onUpdateOrderStatus(order.id, newStatus);
    if (newStatus === 'pending') return;

    let statusMsg = '';
    switch (newStatus) {
        case 'preparing': statusMsg = 'is now being prepared in our kitchen 👨‍🍳'; break;
        case 'ready': statusMsg = order.type === 'pickup' ? 'is ready for pickup! 🛍️' : 'is packed and ready for delivery 📦'; break;
        case 'out_for_delivery': statusMsg = 'is out for delivery! 🛵'; break;
        case 'delivered': statusMsg = 'has been delivered. Enjoy your meal! ✅'; break;
        case 'cancelled': statusMsg = 'has been cancelled ❌'; break;
        default: return;
    }

    const message = `Hi ${order.customerName}, update on Order #${order.id} from Chillies:\n\nYour order ${statusMsg}`;
    const trackingPart = order.trackingLink ? `\n\nTrack Status: ${order.trackingLink}` : '';
    const phone = order.contactNumber.replace(/\D/g, '');
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message + trackingPart)}`, '_blank');
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

  if (!isAuthenticated) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950 p-4">
             <div className="relative w-full max-w-md bg-stone-900/60 backdrop-blur-xl border border-gold-500/20 rounded-3xl p-10 shadow-2xl overflow-hidden text-center">
                <button onClick={onClose} className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors"><X size={24} /></button>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
                <div className="inline-flex items-center justify-center p-4 bg-stone-950 rounded-full border border-gold-500/20 shadow-[0_0_30px_rgba(212,175,55,0.1)] mb-6"><Lock className="text-gold-500 w-8 h-8" /></div>
                <h2 className="text-3xl font-serif text-white mb-2 tracking-wide">Admin Access</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <input type="password" placeholder="Enter Passkey" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className={`w-full bg-stone-950 border rounded-xl px-4 py-4 text-white focus:outline-none transition-all text-center tracking-[0.5em] font-bold ${authError ? 'border-red-500' : 'border-stone-800'}`} autoFocus />
                    {authError && <p className="text-red-500 text-xs font-bold">Access Denied.</p>}
                    <button type="submit" className="w-full py-4 bg-gold-500 text-stone-950 font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)]">Unlock Panel</button>
                </form>
             </div>
        </div>
      )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950 text-stone-200 font-sans flex overflow-hidden">
      <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-stone-900/80 backdrop-blur-xl border-r border-white/5 z-50 transform transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <div className="p-8 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-700 rounded-lg flex items-center justify-center shadow-lg"><span className="font-serif text-stone-950 font-bold text-xl">C</span></div>
                <div><h1 className="font-serif text-xl text-white font-bold tracking-wide">CHILLIES</h1><span className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold">Admin Panel</span></div>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <NavButton tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavButton tab="orders" icon={ShoppingBag} label="Orders" />
                <NavButton tab="items" icon={List} label="Menu Items" />
                <NavButton tab="categories" icon={Tag} label="Categories" />
                <NavButton tab="coupons" icon={Ticket} label="Coupons" />
            </nav>
             <div className="p-4 border-t border-white/5 space-y-1">
                <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full px-4 py-3 rounded-lg text-sm font-medium"><Lock size={18} /><span>Logout</span></button>
                <button onClick={onClose} className="flex items-center gap-3 text-stone-500 hover:text-white transition-colors w-full px-4 py-3 rounded-lg hover:bg-white/5 text-sm font-medium"><LogOut size={18} /><span>Exit</span></button>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-stone-950">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-10 bg-stone-950/50 backdrop-blur-sm shrink-0">
            <h2 className="text-xl md:text-2xl font-serif text-white capitalize">{activeTab.replace('-', ' ')}</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 min-h-0">
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 rounded-2xl border border-white/5 bg-stone-900/50">
                        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Orders</p>
                        <h3 className="text-3xl font-serif text-white">{stats.totalOrders}</h3>
                    </div>
                    <div className="p-6 rounded-2xl border border-white/5 bg-stone-900/50">
                        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Revenue</p>
                        <h3 className="text-3xl font-serif text-white">₹{stats.totalRevenue.toLocaleString()}</h3>
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-6">
                    <div className="flex p-1 bg-stone-900 rounded-xl mb-6 self-start border border-white/5">
                        {['new', 'processing', 'history'].map((stage) => (
                            <button key={stage} onClick={() => setOrderStage(stage as any)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${orderStage === stage ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-white'}`}>
                                {stage === 'new' ? 'New' : stage === 'processing' ? 'Processing' : 'History'}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="bg-stone-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6 relative group hover:border-gold-500/20 transition-colors">
                                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                                    <span className="text-gold-500 font-bold text-lg">#{order.id}</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => printThermalBill(order)} 
                                            className="p-2 bg-stone-800 rounded-lg text-gold-500 hover:bg-gold-500 hover:text-stone-950 transition-all"
                                            title="Print Bill"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.type === 'delivery' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                            {order.type}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <p className="text-white font-medium">{order.customerName}</p>
                                    <div className="bg-stone-950/50 p-3 rounded-lg border border-white/5 max-h-32 overflow-y-auto scrollbar-hide text-sm text-stone-300">
                                        {order.items.map((item, idx) => <div key={idx}><span className="text-gold-500 font-bold">{item.quantity}x</span> {item.name}</div>)}
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xs text-stone-500 uppercase tracking-widest">Total</span>
                                        <span className="text-xl font-serif text-white">₹{order.total}</span>
                                    </div>
                                </div>
                                <select value={order.status} onChange={(e) => handleStatusChange(order, e.target.value as Order['status'])} className="w-full bg-stone-950 border border-stone-800 text-white text-xs p-3 rounded-lg focus:border-gold-500 outline-none uppercase tracking-wide font-bold">
                                    <option value="pending">🟡 Pending</option>
                                    <option value="preparing">🟠 Preparing</option>
                                    <option value="ready">🔵 Ready</option>
                                    <option value="out_for_delivery">🟣 Out for Delivery</option>
                                    <option value="delivered">🟢 Delivered</option>
                                    <option value="cancelled">🔴 Cancelled</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'items' && !isFormOpen && (
                <div className="space-y-6">
                    <button onClick={handleAddNewClick} className="bg-gold-500 text-stone-950 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2">
                        <Plus size={18} /> Add New Item
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-stone-900/60 border border-white/5 rounded-2xl overflow-hidden group">
                                <SafeImage src={item.image} containerClassName="h-32 w-full" className="h-full w-full object-cover" />
                                <div className="p-4">
                                    <h4 className="text-white font-bold truncate">{item.name}</h4>
                                    <p className="text-gold-400 font-serif font-bold text-lg">₹{item.price}</p>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => { setEditingItem(item); setIsFormOpen(true); }} className="flex-1 py-2 bg-stone-800 rounded-lg text-xs uppercase font-bold">Edit</button>
                                        <button onClick={() => onDeleteItem(item.id)} className="p-2 bg-red-900/20 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </main>

      {isFormOpen && editingItem && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-white/10 rounded-3xl p-8 max-w-xl w-full">
            <h2 className="text-xl font-bold text-white mb-6">Item Editor</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Name" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-white" />
              <input type="number" placeholder="Price" value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-white" />
              <div className="flex gap-4">
                <button onClick={handleSaveItem} className="flex-1 bg-gold-500 text-stone-950 font-bold py-3 rounded-xl uppercase">Save</button>
                <button onClick={() => setIsFormOpen(false)} className="flex-1 bg-stone-800 text-white font-bold py-3 rounded-xl uppercase">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;