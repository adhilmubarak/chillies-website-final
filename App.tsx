
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ChefsChoice from './components/ChefsChoice';
import MenuItemCard from './components/MenuItemCard';
import FlashSaleView from './components/FlashSaleView';
import HappyHourView from './components/HappyHourView';
import CartSidebar from './components/CartSidebar';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import OrderTrackerModal from './components/OrderTrackerModal';
import SmartSuggestion from './components/SmartSuggestion';
import NotificationTicker from './components/NotificationTicker';
import StoreStatusAlert from './components/StoreStatusAlert';
import { MENU_ITEMS as INITIAL_MENU_ITEMS } from './data';
import { MenuItem, CartItem, Category, Order, Coupon, CategoryConfig } from './types';
import { Search } from 'lucide-react';

import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  setDoc
} from 'firebase/firestore';

export const printThermalBill = (order: Order) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemsHtml = order.items
    .map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>${item.quantity}x ${item.name}</span>
        <span>₹${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `)
    .join('');

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.id}&bgcolor=ffffff&color=000000&margin=0`;

  printWindow.document.write(`
    <html>
      <head>
        <title>Order #${order.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 10px; margin: 0; color: #000; background: #fff; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .order-highlight { 
            font-size: 24px; 
            font-weight: bold; 
            border: 2px solid #000; 
            display: inline-block; 
            padding: 5px 15px; 
            margin: 10px 0;
          }
          .customer-info { 
            text-align: left; 
            font-size: 14px; 
            margin-bottom: 10px; 
            padding-bottom: 5px;
            border-bottom: 1px dotted #000;
          }
          .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 12px; }
          .total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
          .qr-section { text-align: center; margin-top: 15px; padding: 10px; border: 1px solid #eee; border-radius: 8px; }
          .qr-label { font-size: 10px; margin-bottom: 5px; color: #666; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px; }
          h2 { margin: 5px 0; }
          p { margin: 2px 0; font-size: 12px; }
          img { max-width: 120px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>CHILLIES</h2>
          <p>Valiyakulam, Alappuzha</p>
          <div class="order-highlight">#${order.id}</div>
          <p>${order.date} ${order.timestamp}</p>
        </div>
        <div class="customer-info">
          <div><strong>Name:</strong> ${order.customerName}</div>
          <div><strong>Phone:</strong> ${order.contactNumber}</div>
          ${order.address ? `<div><strong>Addr:</strong> ${order.address}</div>` : ''}
          <div><strong>Type:</strong> ${order.type.toUpperCase()}</div>
        </div>
        <div style="font-size: 14px;">${itemsHtml}</div>
        <div class="total" style="font-size: 14px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>₹${(order.subtotal || 0).toFixed(2)}</span>
          </div>
          ${order.deliveryCharge ? `<div style="display: flex; justify-content: space-between;"><span>Delivery:</span><span>₹${order.deliveryCharge.toFixed(2)}</span></div>` : ''}
          ${order.discount ? `<div style="display: flex; justify-content: space-between;"><span>Discount:</span><span>-₹${order.discount.toFixed(2)}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 1.1em; margin-top: 5px;">
            <span>TOTAL:</span>
            <span>₹${order.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="qr-section">
          <div class="qr-label">Scan to search order</div>
          <img src="${qrUrl}" alt="QR Code" />
        </div>

        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>Spread Happiness</p>
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

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dbCategories, setDbCategories] = useState<CategoryConfig[]>([
      { id: '1', name: 'Starters' },
      { id: '2', name: 'Main Course' },
      { id: '3', name: 'Desserts' },
      { id: '4', name: 'Drinks' }
  ]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
      endTime: '23:00'
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [initialTrackId, setInitialTrackId] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestion, setSuggestion] = useState<MenuItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Live time update every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Optimized tracking parameter detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('tid') || params.get('trackId');
    if (trackId) {
      setInitialTrackId(trackId);
      setIsTrackerOpen(true);
      
      // Clean URL immediately for a better user experience
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
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

  const checkTimeRange = (startStr?: string, endStr?: string): boolean => {
      if (!startStr || !endStr) return true;
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const currMin = currentTime.getHours() * 60 + currentTime.getMinutes();
      if (startMin <= endMin) return currMin >= startMin && currMin <= endMin;
      return currMin >= startMin || currMin <= endMin;
  };

  const isStoreOpen = storeSettings.acceptingOrders && checkTimeRange(storeSettings.startTime, storeSettings.endTime);

  const checkAvailability = (catName: string) => {
      if (!isStoreOpen) return { isAvailable: false, reason: 'Store Closed' };
      const config = dbCategories.find(c => c.name === catName);
      if (!config) return { isAvailable: true };
      const active = checkTimeRange(config.startTime, config.endTime);
      return { isAvailable: active, availabilityTime: config.startTime };
  };

  useEffect(() => {
    const q = query(collection(db, 'menuItems'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
      setMenuItems(items.length > 0 ? items : INITIAL_MENU_ITEMS);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig));
      if (fetched.length > 0) setDbCategories(fetched);
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
    const q = query(collection(db, 'coupons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Coupon)));
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
                acceptingOrders: data.acceptingOrders ?? true,
                startTime: data.startTime || '07:00',
                endTime: data.endTime || '23:00'
            });
        }
    });
    return () => unsubscribe();
  }, []);

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
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = false;
    if (activeCategory === 'Flash Sale') matchesCategory = !!item.isFlashSale;
    else if (activeCategory === 'Happy Hour') matchesCategory = !!item.isHappyHour;
    else if (activeCategory === 'All') matchesCategory = !item.isExclusive;
    else matchesCategory = item.category === activeCategory && !item.isExclusive;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative min-h-screen font-sans text-stone-200 overflow-x-hidden">
      <div className="fixed inset-0 bg-stone-950 -z-10" />
      
      <NotificationTicker 
        isFlashSaleActive={isFlashSaleActive} 
        isHappyHourActive={isHappyHourActive}
        flashSaleEndTime={promoSettings.flashSaleEndTime}
        isStoreOpen={isStoreOpen}
        startTime={storeSettings.startTime}
      />

      <Navbar 
        currentTime={currentTime}
        cartItemCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenTracker={() => {
            setInitialTrackId('');
            setIsTrackerOpen(true);
        }}
        hasTicker={!isStoreOpen || isFlashSaleActive || isHappyHourActive}
      />
      
      <Hero />
      
      <StoreStatusAlert 
        isStoreOpen={isStoreOpen} 
        startTime={storeSettings.startTime} 
        endTime={storeSettings.endTime} 
      />

      <ChefsChoice 
        items={menuItems.filter(item => item.isChefChoice && !item.isExclusive)} 
        onAdd={addToCart} 
        isFlashSaleActive={isFlashSaleActive}
        checkAvailability={checkAvailability}
        isStoreOpen={isStoreOpen}
        cartItems={cartItems}
        allMenuItems={menuItems}
        onShowSuggestion={setSuggestion}
      />

      <section id="menu" className="pb-24 pt-12 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24 md:scroll-mt-32">
        <div className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6">
          <span className="text-gold-500 uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold block">Our Selection</span>
          <h2 className="text-3xl md:text-6xl font-serif text-white relative inline-block">
            Curated Menu
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 md:w-24 h-1 bg-gold-500 rounded-full"></span>
          </h2>
        </div>

        <div className="max-w-md mx-auto mb-10 md:mb-12 px-2">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input
                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu..."
                    className="block w-full pl-12 pr-4 py-4 bg-stone-900 border border-stone-800 rounded-full text-stone-200 focus:border-gold-500 focus:outline-none"
                />
            </div>
        </div>

        <div className="flex flex-col items-center gap-6 mb-12">
            <div className="flex w-full overflow-x-auto scrollbar-hide md:flex-wrap md:justify-center gap-2 px-4 pb-4">
                {['All', 'Flash Sale', 'Happy Hour', ...dbCategories.map(c => c.name)].map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 px-6 md:px-8 py-3 rounded-full border transition-all text-[10px] md:text-xs font-bold uppercase tracking-widest ${
                            activeCategory === cat ? 'bg-gold-500 border-gold-500 text-stone-950' : 'bg-transparent border-stone-800 text-stone-500'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : (
            <>
              {activeCategory === 'Flash Sale' && (
                <FlashSaleView 
                  items={menuItems.filter(i => i.isFlashSale)} 
                  onAdd={addToCart} 
                  isFlashSaleActive={isFlashSaleActive}
                  flashSaleEndTime={promoSettings.flashSaleEndTime}
                  checkAvailability={checkAvailability}
                  isStoreOpen={isStoreOpen}
                  cartItems={cartItems}
                  allMenuItems={menuItems}
                  onShowSuggestion={setSuggestion}
                />
              )}
              {activeCategory === 'Happy Hour' && (
                <HappyHourView 
                  items={menuItems.filter(i => i.isHappyHour)} 
                  onAdd={addToCart} 
                  isHappyHourActive={isHappyHourActive}
                  checkAvailability={checkAvailability}
                  isStoreOpen={isStoreOpen}
                  cartItems={cartItems}
                  allMenuItems={menuItems}
                  onShowSuggestion={setSuggestion}
                />
              )}
              {activeCategory !== 'Flash Sale' && activeCategory !== 'Happy Hour' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                    {filteredItems.map((item, index) => (
                        <MenuItemCard 
                            key={item.id} item={item} onAdd={addToCart} index={index} 
                            isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive}
                            isAvailable={checkAvailability(item.category).isAvailable}
                            isStoreOpen={isStoreOpen} cartItems={cartItems} allMenuItems={menuItems} onShowSuggestion={setSuggestion}
                        />
                    ))}
                </div>
              )}
            </>
        )}
      </section>

      <Footer onOpenAdmin={() => setIsAdminOpen(true)} onOpenTC={() => {}} />
      <OrderTrackerModal 
        isOpen={isTrackerOpen} 
        onClose={() => {
            setIsTrackerOpen(false);
            setInitialTrackId('');
        }} 
        initialOrderId={initialTrackId}
      />
      {suggestion && <SmartSuggestion suggestion={suggestion} onAdd={addToCart} onClose={() => setSuggestion(null)} isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive} />}
      
      <CartSidebar
        isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems}
        onUpdateQuantity={(id, delta) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0, i.quantity + delta)} : i).filter(i => i.quantity > 0))}
        onRemove={id => setCartItems(prev => prev.filter(i => i.id !== id))}
        onClearCart={() => setCartItems([])} onShowNotification={() => {}} onAddOrder={async o => { await addDoc(collection(db, 'orders'), o); }}
        onTrackOrder={() => {
            setIsCartOpen(false);
            setIsTrackerOpen(true);
        }} coupons={coupons}
      />
      
      {isAdminOpen && (
        <AdminPanel 
            isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} items={menuItems} categories={dbCategories} orders={orders} coupons={coupons} isStoreOpen={isStoreOpen} promoSettings={promoSettings} storeSettings={storeSettings}
            onAddItem={async i => { const {id, ...d} = i; await addDoc(collection(db, 'menuItems'), d); }}
            onUpdateItem={async i => { if(i.id) await updateDoc(doc(db, 'menuItems', i.id), {...i}); }}
            onDeleteItem={async id => await deleteDoc(doc(db, 'menuItems', id))}
            onAddCategory={n => addDoc(collection(db, 'categories'), {name: n, startTime: '00:00', endTime: '23:59'})}
            onUpdateCategory={c => updateDoc(doc(db, 'categories', c.id), {name: c.name, startTime: c.startTime || '00:00', endTime: c.endTime || '23:59'})}
            onDeleteCategory={async n => { const q = query(collection(db, 'categories'), where("name", "==", n)); const s = await getDocs(q); s.forEach(d => deleteDoc(d.ref)); }}
            onUpdateOrderStatus={async (id, s) => { const q = query(collection(db, 'orders'), where("id", "==", id)); const snap = await getDocs(q); snap.forEach(d => updateDoc(d.ref, {status: s})); }}
            onAddCoupon={c => addDoc(collection(db, 'coupons'), c)} onDeleteCoupon={id => deleteDoc(doc(db, 'coupons', id))}
            onUpdateStoreSettings={s => setDoc(doc(db, 'settings', 'general'), s, {merge: true})}
            onUpdatePromos={p => setDoc(doc(db, 'settings', 'general'), p, {merge: true})}
        />
      )}
    </div>
  );
}

export default App;
