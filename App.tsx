
import React, { useState, useEffect, useRef } from 'react';
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
import { MENU_ITEMS as INITIAL_MENU_ITEMS } from './data';
import { MenuItem, CartItem, Category, Order, Coupon, CategoryConfig } from './types';
import { CheckCircle, X, WifiOff, Search, Zap, Clock, Lock, PartyPopper } from 'lucide-react';

// Firebase Imports
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
  writeBatch,
  setDoc
} from 'firebase/firestore';

function App() {
  // Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS); // Start with local data immediately
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Categories now store full config objects
  const [dbCategories, setDbCategories] = useState<CategoryConfig[]>([
      { id: '1', name: 'Starters' },
      { id: '2', name: 'Main Course' },
      { id: '3', name: 'Desserts' },
      { id: '4', name: 'Drinks' }
  ]);
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  // Settings State
  const [isFlashSaleActive, setIsFlashSaleActive] = useState(false);
  const [flashSaleEndTime, setFlashSaleEndTime] = useState('23:59'); // Default end time
  const [isHappyHourActive, setIsHappyHourActive] = useState(false);
  
  // Ref to track if we've handled the initial settings load
  const settingsLoadedRef = useRef(false);
  
  const [storeSettings, setStoreSettings] = useState({
      acceptingOrders: true,
      startTime: '07:00',
      endTime: '23:00'
  });

  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ show: boolean; message: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [suggestion, setSuggestion] = useState<MenuItem | null>(null);
  const [showTC, setShowTC] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // New state for URL tracking
  const [trackingOrderId, setTrackingOrderId] = useState('');

  // Handle URL Tracking Param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('trackId');
    if (trackId) {
        setTrackingOrderId(trackId);
        setIsTrackerOpen(true);
        // Clean URL to avoid re-triggering on refresh if desired (optional)
        window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Timer to update current time every minute (to re-eval category availability)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper: Check time range
  const checkTimeRange = (startStr?: string, endStr?: string): boolean => {
      if (!startStr || !endStr) return true;
      
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
          return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
          // Overnight
          return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
  };

  // Check Global Store Status
  const isStoreOpen = storeSettings.acceptingOrders && checkTimeRange(storeSettings.startTime, storeSettings.endTime);

  // Helper: Check Availability for a specific category name (passed to children)
  const checkAvailability = (catName: string) => {
      // 1. Check Global Store Status
      if (!isStoreOpen) {
          return { isAvailable: false, reason: 'Store Closed' };
      }

      // 2. Check Category Status
      const config = dbCategories.find(c => c.name === catName);
      if (!config) return { isAvailable: true };
      
      const active = checkTimeRange(config.startTime, config.endTime);
      return {
          isAvailable: active,
          availabilityTime: config.startTime
      };
  };

  // Computed Categories for Display (User View)
  const displayCategoryNames = ['All', ...dbCategories.map(c => c.name)];

  // --- FIREBASE SYNC ---

  // 1. Sync Menu Items
  useEffect(() => {
    const q = query(collection(db, 'menuItems'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
      if (items.length > 0) {
          setMenuItems(items);
      } else {
          seedDatabase();
      }
      setIsLoading(false);
      setIsOfflineMode(false);
    }, (error) => {
        setIsLoading(false);
        if (error.code === 'permission-denied') {
            console.warn("Firestore permissions missing. Running in Offline Mode.");
            setIsOfflineMode(true);
        } else {
            console.error("Firebase Sync Error (Items):", error);
        }
    });
    return () => unsubscribe();
  }, []);

  // 2. Sync Categories (Updated to fetch time configs)
  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => ({ 
          id: doc.id,
          name: doc.data().name,
          startTime: doc.data().startTime,
          endTime: doc.data().endTime
      } as CategoryConfig));
      
      if (fetchedCategories.length > 0) {
        setDbCategories(fetchedCategories);
      }
    }, (error) => {
        if (error.code !== 'permission-denied') {
            console.error("Firebase Sync Error (Categories):", error);
        }
    });
    return () => unsubscribe();
  }, []);

  // 3. Sync Orders
  useEffect(() => {
    const q = query(collection(db, 'orders')); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id } as any));
      const sortedOrders = fetchedOrders.sort((a: any, b: any) => {
         const timeA = a.createdAt || 0;
         const timeB = b.createdAt || 0;
         return timeB - timeA;
      });
      setOrders(sortedOrders);
    }, (error) => {
        if (error.code !== 'permission-denied') {
            console.error("Firebase Sync Error (Orders):", error);
        }
    });
    return () => unsubscribe();
  }, []);

  // 4. Sync Coupons
  useEffect(() => {
    const q = query(collection(db, 'coupons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCoupons = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Coupon));
      setCoupons(fetchedCoupons);
    }, (error) => {
        if (error.code !== 'permission-denied') {
            console.error("Firebase Sync Error (Coupons):", error);
        }
    });
    return () => unsubscribe();
  }, []);

  // 5. Sync Settings (Flash Sale & Happy Hour & Store Hours)
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const flashActive = data.isFlashSaleActive || false;
            const happyHourActive = data.isHappyHourActive || false;
            
            setIsFlashSaleActive(flashActive);
            setFlashSaleEndTime(data.flashSaleEndTime || '23:59');
            setIsHappyHourActive(happyHourActive);

            setStoreSettings({
                acceptingOrders: data.acceptingOrders !== undefined ? data.acceptingOrders : true,
                startTime: data.startTime || '07:00',
                endTime: data.endTime || '23:00'
            });

            // Default to Special views on initial load if active
            // Only runs once per session to avoid overriding user navigation later
            if (!settingsLoadedRef.current) {
                if (flashActive) {
                    setActiveCategory('Flash Sale');
                } else if (happyHourActive) {
                    setActiveCategory('Happy Hour');
                }
                settingsLoadedRef.current = true;
            }

            // If special view turns off and user is currently viewing it, reset to All
            setActiveCategory(currentCategory => {
                if (currentCategory === 'Flash Sale' && !flashActive) return 'All';
                if (currentCategory === 'Happy Hour' && !happyHourActive) return 'All';
                return currentCategory;
            });

        } else {
            // Create default settings if not exists
            if (!isOfflineMode) {
                setDoc(settingsRef, { 
                    isFlashSaleActive: false,
                    flashSaleEndTime: '23:59',
                    isHappyHourActive: false,
                    acceptingOrders: true,
                    startTime: '07:00',
                    endTime: '23:00'
                }, { merge: true });
            }
        }
    }, (error) => {
         if (error.code !== 'permission-denied') {
            console.error("Firebase Sync Error (Settings):", error);
        }
    });
    return () => unsubscribe();
  }, [isOfflineMode]);

  // Helper: Seed Database if empty
  const seedDatabase = async () => {
    if (isOfflineMode) return;
    try {
        const snap = await getDocs(collection(db, 'menuItems'));
        if (!snap.empty) return;

        console.log("Seeding Database...");
        const batch = writeBatch(db);
        
        INITIAL_MENU_ITEMS.forEach(item => {
            const { id, ...itemData } = item; 
            const docRef = doc(collection(db, 'menuItems'));
            batch.set(docRef, itemData);
        });

        const initialCats = ['Starters', 'Main Course', 'Desserts', 'Drinks'];
        initialCats.forEach(cat => {
            const docRef = doc(collection(db, 'categories'));
            batch.set(docRef, { name: cat });
        });
        
        // Seed Settings
        const settingsRef = doc(db, 'settings', 'general');
        batch.set(settingsRef, { 
            isFlashSaleActive: false,
            flashSaleEndTime: '23:59',
            isHappyHourActive: false,
            acceptingOrders: true,
            startTime: '07:00',
            endTime: '23:00'
        });

        await batch.commit();
        setNotification({ show: true, message: 'Database seeded successfully!', type: 'success' });
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            setIsOfflineMode(true);
        } else {
            console.error("Error seeding database:", e);
        }
    }
  };

  // --- ACTIONS ---

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Logic for Category Filtering & Exclusion
    let matchesCategory = false;
    
    if (activeCategory === 'Flash Sale') {
        matchesCategory = !!item.isFlashSale;
    } else if (activeCategory === 'Happy Hour') {
        matchesCategory = !!item.isHappyHour;
    } else if (activeCategory === 'All') {
        // Show everything EXCEPT items marked as Exclusive
        matchesCategory = !item.isExclusive;
    } else {
        // Standard category selection (e.g., Starters)
        // Also respect exclusivity - if it's exclusive, it shouldn't show in standard categories
        matchesCategory = item.category === activeCategory && !item.isExclusive;
    }

    return matchesCategory && matchesSearch;
  });
    
  const chefsChoiceItems = menuItems.filter(item => item.isChefChoice && !item.isExclusive);
  const hasTicker = isFlashSaleActive || isHappyHourActive;

  useEffect(() => {
    if (notification?.show) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleShowNotification = (message: string) => {
    setNotification({ show: true, message, type: 'success' });
  };

  const addToCart = (item: MenuItem) => {
    if (!isStoreOpen) {
        setNotification({ show: true, message: 'Restaurant is currently closed for online orders.', type: 'error' });
        return;
    }

    // Pricing Logic: Flash Sale > Happy Hour > Regular
    let effectivePrice = item.price;
    if (isFlashSaleActive && item.isFlashSale && item.flashSalePrice) {
        effectivePrice = item.flashSalePrice;
    } else if (isHappyHourActive && item.isHappyHour && item.happyHourPrice) {
        effectivePrice = item.happyHourPrice;
    }

    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1, price: effectivePrice } : i);
      }
      return [...prev, { ...item, quantity: 1, price: effectivePrice }];
    });
    
    setNotification({ show: true, message: `${item.name} added to your selection`, type: 'success' });
  };

  const handleShowSuggestion = (item: MenuItem) => {
      setSuggestion(item);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Order Action
  const handleAddOrder = async (order: Order) => {
    // Optimistic Update: Add order locally first so it appears in Admin Panel immediately
    setOrders(prev => {
        if (prev.find(o => o.id === order.id)) return prev;
        return [order, ...prev];
    });

    if (isOfflineMode) {
        setNotification({ show: true, message: 'Offline Mode: Order sent to WhatsApp only.', type: 'info' });
        return;
    }
    try {
        await addDoc(collection(db, 'orders'), order);
    } catch (e: any) {
        console.error("Error adding order: ", e);
        if (e.code === 'permission-denied') {
             setIsOfflineMode(true);
             setNotification({ show: true, message: 'Offline Mode: Order generated locally.', type: 'info' });
        } else {
             setNotification({ show: true, message: 'Error saving order to cloud (saved locally).', type: 'info' });
        }
    }
  };

  // Admin Actions
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    if (isOfflineMode) {
        setNotification({ show: true, message: 'Offline Mode: Status updated locally.', type: 'info' });
        return;
    }
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where("id", "==", orderId));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (d) => {
             await updateDoc(doc(db, 'orders', d.id), { status });
        });
    } catch (e) {
        console.error("Error updating status: ", e);
    }
  };

  const handleAddMenuItem = async (newItem: MenuItem) => {
      if (isOfflineMode) return;
      try {
          const { id, ...data } = newItem;
          await addDoc(collection(db, 'menuItems'), data);
      } catch (e) { console.error(e); }
  };

  const handleUpdateMenuItem = async (updatedItem: MenuItem) => {
      if (isOfflineMode || !updatedItem.id) return;
      try {
          const itemRef = doc(db, 'menuItems', updatedItem.id);
          const { id, ...data } = updatedItem;
          await updateDoc(itemRef, data);
      } catch (e) { console.error(e); }
  };

  const handleDeleteMenuItem = async (id: string) => {
      if (isOfflineMode) return;
      try {
          await deleteDoc(doc(db, 'menuItems', id));
      } catch (e) { console.error(e); }
  };

  const handleAddCategory = async (catName: string) => {
      if (isOfflineMode) return;
      try {
          await addDoc(collection(db, 'categories'), { name: catName });
      } catch (e) { console.error(e); }
  };
  
  const handleUpdateCategory = async (cat: CategoryConfig) => {
      if (isOfflineMode) return;
      try {
          const catRef = doc(db, 'categories', cat.id);
          await updateDoc(catRef, { 
              name: cat.name,
              startTime: cat.startTime || null,
              endTime: cat.endTime || null
          });
      } catch (e) { console.error(e); }
  };

  const handleDeleteCategory = async (catName: string) => {
      if (isOfflineMode) return;
      try {
          const q = query(collection(db, 'categories'), where("name", "==", catName));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach(async (d) => {
              await deleteDoc(doc(db, 'categories', d.id));
          });
      } catch (e) { console.error(e); }
  };

  const handleAddCoupon = async (coupon: Coupon) => {
      if (isOfflineMode) return;
      try {
          await addDoc(collection(db, 'coupons'), coupon);
      } catch (e) { console.error(e); }
  };

  const handleDeleteCoupon = async (id: string) => {
      if (isOfflineMode) return;
      try {
          await deleteDoc(doc(db, 'coupons', id));
      } catch (e) { console.error(e); }
  };

  const handleToggleFlashSale = async (isActive: boolean) => {
      if (isOfflineMode) return;
      try {
          const settingsRef = doc(db, 'settings', 'general');
          await setDoc(settingsRef, { isFlashSaleActive: isActive }, { merge: true });
      } catch (e) { console.error(e); }
  };

  const handleUpdateFlashSaleEndTime = async (time: string) => {
    if (isOfflineMode) return;
    try {
        const settingsRef = doc(db, 'settings', 'general');
        await setDoc(settingsRef, { flashSaleEndTime: time }, { merge: true });
    } catch (e) { console.error(e); }
  };

  const handleToggleHappyHour = async (isActive: boolean) => {
      if (isOfflineMode) return;
      try {
          const settingsRef = doc(db, 'settings', 'general');
          await setDoc(settingsRef, { isHappyHourActive: isActive }, { merge: true });
      } catch (e) { console.error(e); }
  };
  
  const handleUpdateStoreSettings = async (settings: { acceptingOrders: boolean, startTime: string, endTime: string }) => {
      if (isOfflineMode) return;
      try {
          const settingsRef = doc(db, 'settings', 'general');
          await setDoc(settingsRef, settings, { merge: true });
      } catch (e) { console.error(e); }
  };

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Determine current formatted time for display
  const formatTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const suffix = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  // Compute dynamic background based on active events
  const getBackgroundGradient = () => {
    if (isFlashSaleActive) {
        return "from-red-900/60 via-stone-950 to-black";
    }
    if (isHappyHourActive) {
        return "from-purple-900/60 via-stone-950 to-black";
    }
    return "from-stone-900 via-stone-950 to-black";
  };

  // Compute selection color based on active events
  const getSelectionClass = () => {
    if (isFlashSaleActive) {
        return "selection:bg-red-500 selection:text-white";
    }
    if (isHappyHourActive) {
        return "selection:bg-purple-500 selection:text-white";
    }
    return "selection:bg-gold-500 selection:text-black";
  };

  return (
    <div className={`relative min-h-screen font-sans text-stone-200 ${getSelectionClass()}`}>
      {/* Background with transition */}
      <div className={`fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${getBackgroundGradient()} -z-10 transition-all duration-1000 ease-in-out`} />
      
      <NotificationTicker 
        isFlashSaleActive={isFlashSaleActive} 
        isHappyHourActive={isHappyHourActive}
        flashSaleEndTime={flashSaleEndTime}
      />

      <Navbar 
        cartItemCount={cartItemCount} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenTracker={() => setIsTrackerOpen(true)}
        hasTicker={hasTicker}
      />
      
      {/* Toast Notification */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[80] transition-all duration-300 transform ${notification?.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        {notification && (
            <div className="bg-stone-900/90 backdrop-blur-md border border-gold-500/30 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <div className={`p-1 rounded-full ${notification.type === 'error' ? 'bg-red-500/20' : notification.type === 'info' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                {notification.type === 'error' ? <X size={16} className="text-red-500" /> : 
                 notification.type === 'info' ? <WifiOff size={16} className="text-blue-500" /> :
                 <CheckCircle size={16} className="text-green-500" />}
            </div>
            <span className="text-sm font-medium tracking-wide">{notification.message}</span>
            </div>
        )}
      </div>
      
      {/* Closed Store Banner */}
      {!isStoreOpen && !isLoading && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-red-900/95 backdrop-blur-md border-t border-red-500/30 p-4 text-center shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-white">
                <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
                    <Lock size={16} /> Restaurant Currently Closed
                </div>
                <span className="text-xs md:text-sm opacity-80 font-light">
                    We are accepting orders from {formatTime(storeSettings.startTime)} to {formatTime(storeSettings.endTime)}.
                </span>
            </div>
        </div>
      )}

      {/* Smart Suggestion Overlay */}
      {suggestion && (
          <SmartSuggestion 
            suggestion={suggestion} 
            onAdd={addToCart} 
            onClose={() => setSuggestion(null)} 
            isFlashSaleActive={isFlashSaleActive}
            isHappyHourActive={isHappyHourActive}
          />
      )}

      <Hero />
      
      <ChefsChoice 
        items={chefsChoiceItems} 
        onAdd={addToCart} 
        isFlashSaleActive={isFlashSaleActive}
        checkAvailability={checkAvailability}
        isStoreOpen={isStoreOpen}
        cartItems={cartItems}
        allMenuItems={menuItems}
        onShowSuggestion={handleShowSuggestion}
      />

      <section id="menu" className="pb-24 pt-8 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-32">
        <div className="text-center mb-16 space-y-6">
          <span className="text-gold-500 uppercase tracking-[0.3em] text-xs font-bold block animate-fade-in">Our Selection</span>
          <h2 className="text-4xl md:text-6xl font-serif text-white relative inline-block">
            Curated Menu
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></span>
          </h2>
          
          {isOfflineMode && (
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 rounded-full border border-stone-800 text-stone-500 text-xs mt-4">
                <WifiOff size={12} />
                <span>Offline Mode (Database Unavailable)</span>
             </div>
          )}

          <p className="text-stone-400 max-w-2xl mx-auto pt-6 font-light">
             Explore our diverse menu featuring the finest ingredients, expertly prepared to create an unforgettable dining experience.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12 relative animate-fade-in">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-stone-500 group-focus-within:text-gold-500 transition-colors" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes (e.g., Truffle, Spicy...)"
                    className="block w-full pl-12 pr-4 py-4 bg-stone-900/80 border border-stone-800 rounded-full text-stone-200 placeholder-stone-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition-all shadow-lg"
                />
            </div>
        </div>

        {/* Categories & Specials Tab */}
        <div className="flex flex-col items-center gap-6 mb-16">
            
            <div className="flex gap-4">
                {/* Flash Sale Button */}
                {isFlashSaleActive && (
                    <button
                        onClick={() => { setActiveCategory('Flash Sale'); setSearchQuery(''); }}
                        className={`relative group px-10 py-4 rounded-full font-bold uppercase tracking-widest text-sm transition-all duration-300 flex items-center gap-3 overflow-hidden ${
                            activeCategory === 'Flash Sale'
                            ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] scale-105 border-transparent'
                            : 'bg-stone-900/80 text-red-500 border border-red-500/30 hover:border-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                        }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <Zap size={18} fill="currentColor" className={`${activeCategory === 'Flash Sale' ? 'text-yellow-300' : 'text-red-500'} animate-pulse`} />
                        <span>Flash Sale</span>
                    </button>
                )}

                {/* Happy Hour Button */}
                {isHappyHourActive && (
                    <button
                        onClick={() => { setActiveCategory('Happy Hour'); setSearchQuery(''); }}
                        className={`relative group px-10 py-4 rounded-full font-bold uppercase tracking-widest text-sm transition-all duration-300 flex items-center gap-3 overflow-hidden ${
                            activeCategory === 'Happy Hour'
                            ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-[0_0_30px_rgba(147,51,234,0.5)] scale-105 border-transparent'
                            : 'bg-stone-900/80 text-purple-500 border border-purple-500/30 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                        }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <PartyPopper size={18} fill="currentColor" className={`${activeCategory === 'Happy Hour' ? 'text-pink-300' : 'text-purple-500'} animate-bounce-slow`} />
                        <span>Happy Hour</span>
                    </button>
                )}
            </div>

            {/* Standard Categories */}
            <div className="flex flex-wrap justify-center gap-4">
            {displayCategoryNames.map(cat => (
                <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
                className={`px-8 py-3 rounded-full border transition-all duration-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                    activeCategory === cat
                    ? 'bg-gold-500 border-gold-500 text-stone-950 shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                    : 'bg-transparent border-stone-800 text-stone-500 hover:border-gold-500 hover:text-gold-400 hover:bg-stone-900'
                }`}
                >
                {cat}
                </button>
            ))}
            </div>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-stone-500 text-sm tracking-widest uppercase">Syncing Menu...</p>
            </div>
        ) : (
            <>
                {/* Content Rendering Logic */}
                {activeCategory === 'Flash Sale' ? (
                    <FlashSaleView 
                        items={filteredItems} 
                        onAdd={addToCart} 
                        isFlashSaleActive={isFlashSaleActive}
                        flashSaleEndTime={flashSaleEndTime}
                        checkAvailability={checkAvailability}
                        isStoreOpen={isStoreOpen}
                        cartItems={cartItems}
                        allMenuItems={menuItems}
                        onShowSuggestion={handleShowSuggestion}
                    />
                ) : activeCategory === 'Happy Hour' ? (
                    <HappyHourView 
                        items={filteredItems} 
                        onAdd={addToCart} 
                        isHappyHourActive={isHappyHourActive}
                        checkAvailability={checkAvailability}
                        isStoreOpen={isStoreOpen}
                        cartItems={cartItems}
                        allMenuItems={menuItems}
                        onShowSuggestion={handleShowSuggestion}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredItems.map((item, index) => {
                            const availability = checkAvailability(item.category);
                            return (
                                <MenuItemCard 
                                    key={item.id} 
                                    item={item} 
                                    onAdd={addToCart} 
                                    index={index} 
                                    isFlashSaleActive={isFlashSaleActive}
                                    isHappyHourActive={isHappyHourActive}
                                    isAvailable={availability.isAvailable}
                                    availabilityTime={availability.availabilityTime}
                                    isStoreOpen={isStoreOpen}
                                    cartItems={cartItems}
                                    allMenuItems={menuItems}
                                    onShowSuggestion={handleShowSuggestion}
                                />
                            );
                        })}
                        {filteredItems.length === 0 && (
                            <div className="col-span-full text-center py-12 text-stone-500 bg-stone-900/30 rounded-2xl border border-white/5 border-dashed">
                                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-lg text-white font-serif mb-2">No items found</p>
                                <p className="text-sm">We couldn't find any dishes matching "{searchQuery}" in {activeCategory}.</p>
                            </div>
                        )}
                    </div>
                )}
            </>
        )}
      </section>

      <Footer onOpenAdmin={() => setIsAdminOpen(true)} onOpenTC={() => setShowTC(true)} />
      
      {/* Modals */}
      <OrderTrackerModal 
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialOrderId={trackingOrderId}
      />

      {showTC && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowTC(false)}>
            <div className="bg-stone-900 border border-gold-500/20 rounded-2xl p-0 max-w-lg w-full shadow-2xl relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-stone-900 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gold-500/10 rounded-full text-gold-500">
                            <CheckCircle size={20} />
                        </div>
                        <h3 className="text-lg font-serif text-white font-bold">30-Minute Guaranteed Delivery</h3>
                    </div>
                    <button onClick={() => setShowTC(false)} className="text-stone-500 hover:text-white transition-colors p-1"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6 text-stone-400 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-stone-900">
                    <section>
                        <h4 className="text-gold-500 font-bold mb-1">1. Delivery Promise</h4>
                        <p>Our 30-minute delivery guarantee applies only to orders placed directly through the official Chillies Restaurant ordering channels (website, app, or phone).</p>
                    </section>
                    <section>
                        <h4 className="text-gold-500 font-bold mb-1">2. Delivery Radius</h4>
                        <p>The guarantee is valid only for addresses within our designated delivery zones. Areas outside this zone are not eligible.</p>
                    </section>
                    <section>
                        <h4 className="text-gold-500 font-bold mb-1">3. Order Timing</h4>
                        <p>The 30-minute countdown starts once the order is confirmed by our team. Peak hours, festivals, and high-traffic days may affect eligibility.</p>
                    </section>
                    <section>
                        <h4 className="text-gold-500 font-bold mb-1">4. Eligible Orders</h4>
                        <ul className="list-disc pl-5 space-y-1 mt-1">
                            <li>Minimum order value may apply based on location.</li>
                            <li>Bulk orders, catering orders, and special items with longer prep time are not included.</li>
                        </ul>
                    </section>
                    <section>
                        <h4 className="text-gold-500 font-bold mb-1">5. Unforeseen Delays</h4>
                        <p>The guarantee does not apply in cases of:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-1">
                            <li>Heavy rain, storms, or extreme weather</li>
                            <li>Road closures, strikes, or unexpected traffic blocks</li>
                            <li>Festival rush or government-mandated restrictions</li>
                            <li>Incorrect or unreachable delivery address</li>
                            <li>Customer not answering the phone / gate / door</li>
                        </ul>
                    </section>
                    <section>
                        <h4 className="text-gold-500 font-bold mb-1">6. Compensation</h4>
                        <p>If your eligible order is delivered after 30 minutes, you will receive a <strong>₹50 voucher</strong> on your next order.</p>
                    </section>
                    <section>
                        <h4 className="text-gold-500 font-bold mb-1">7. Tracking & Verification</h4>
                        <p>Delivery timing will be based on our system timestamps and GPS logs for verification.</p>
                    </section>
                    <section>
                        <h4 className="text-gold-500 font-bold mb-1">8. No Cash Refunds</h4>
                        <p>Compensation is provided only in the form of vouchers, discounts, or loyalty points. No monetary refunds will be issued.</p>
                    </section>
                    <section>
                        <h4 className="text-gold-500 font-bold mb-1">9. Right to Modify</h4>
                        <p>Chillies Restaurant reserves the right to modify or cancel the 30-minute guarantee offer at any time without prior notice.</p>
                    </section>
                    <section>
                        <h4 className="text-gold-500 font-bold mb-1">10. Final Decision</h4>
                        <p>In case of disputes, the decision of Chillies Restaurant management is final.</p>
                    </section>
                </div>
                <div className="p-6 border-t border-white/5 shrink-0 bg-stone-900 rounded-b-2xl">
                    <button onClick={() => setShowTC(false)} className="w-full py-3 bg-gold-500 text-stone-950 font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-gold-400 transition-colors">I Understand</button>
                </div>
            </div>
        </div>
      )}

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onClearCart={clearCart}
        onShowNotification={handleShowNotification}
        onAddOrder={handleAddOrder}
        onTrackOrder={() => setIsTrackerOpen(true)}
        coupons={coupons}
      />
      
      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        items={menuItems}
        categories={dbCategories}
        orders={orders}
        coupons={coupons}
        isFlashSaleActive={isFlashSaleActive}
        flashSaleEndTime={flashSaleEndTime}
        isHappyHourActive={isHappyHourActive}
        storeSettings={storeSettings}
        onAddItem={handleAddMenuItem}
        onUpdateItem={handleUpdateMenuItem}
        onDeleteItem={handleDeleteMenuItem}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onAddCoupon={handleAddCoupon}
        onDeleteCoupon={handleDeleteCoupon}
        onToggleFlashSale={handleToggleFlashSale}
        onUpdateFlashSaleEndTime={handleUpdateFlashSaleEndTime}
        onToggleHappyHour={handleToggleHappyHour}
        onUpdateStoreSettings={handleUpdateStoreSettings}
      />
    </div>
  );
}

export default App;
