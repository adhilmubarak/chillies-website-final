import React, { useState, useEffect, useMemo } from 'react';
import { Award, Clock, Flame, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, QrCode } from 'lucide-react';
import { MenuItem, CategoryConfig, Order, Category } from '../types';

interface SignagePageProps {
  menuItems: MenuItem[];
  dbCategories: CategoryConfig[];
  orders: Order[];
  storeSettings: any;
  promoSettings: any;
  currentTime: Date;
}

const SignagePage: React.FC<SignagePageProps> = ({
  menuItems = [],
  dbCategories = [],
  orders = [],
  storeSettings = {},
  promoSettings = {},
  currentTime: appTime = new Date()
}) => {
  // 1. Digital Clock with ticking state
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format running clock
  const timeString = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateString = time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // 2. Filter Active Promo settings in real-time
  const isFlashSaleActive = useMemo(() => {
    if (!promoSettings?.isFlashSaleActive) return false;
    const todayStr = time.toISOString().split('T')[0];
    if (promoSettings.flashSaleDate && todayStr !== promoSettings.flashSaleDate) return false;
    const [startH, startM] = (promoSettings.flashSaleStartTime || '18:00').split(':').map(Number);
    const [endH, endM] = (promoSettings.flashSaleEndTime || '21:00').split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const currMin = time.getHours() * 60 + time.getMinutes();
    return currMin >= startMin && currMin < endMin;
  }, [promoSettings, time]);

  const isHappyHourActive = useMemo(() => {
    if (!promoSettings?.isHappyHourActive) return false;
    const [startH, startM] = (promoSettings.happyHourStartTime || '16:00').split(':').map(Number);
    const [endH, endM] = (promoSettings.happyHourEndTime || '18:00').split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const currMin = time.getHours() * 60 + time.getMinutes();
    return currMin >= startMin && currMin < endMin;
  }, [promoSettings, time]);

  // Price calculation helper
  const getItemPrice = (item: MenuItem) => {
    if (!item) return 0;
    if (isFlashSaleActive && item.isFlashSale && item.flashSalePrice) return item.flashSalePrice;
    if (isHappyHourActive && item.isHappyHour && item.happyHourPrice) return item.happyHourPrice;
    return item.price || 0;
  };

  // 3. Category rotation list (1 category per slide to display all items)
  const activeCategories = useMemo(() => {
    return (dbCategories || [])
      .filter(c => c && !c.isUnavailable)
      .map(c => c.name);
  }, [dbCategories]);

  // Rotator Timer for Category Pages (12 seconds)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideFade, setSlideFade] = useState(true);

  useEffect(() => {
    if (activeCategories.length <= 1) return;
    const timer = setInterval(() => {
      setSlideFade(false);
      setTimeout(() => {
        setActiveSlideIndex(prev => (prev + 1) % activeCategories.length);
        setSlideFade(true);
      }, 500); // 500ms fade transition
    }, 12000);
    return () => clearInterval(timer);
  }, [activeCategories]);

  // Current category name to render
  const currentCategoryName = activeCategories[activeSlideIndex] || '';

  // 3b. Category-specific items list
  const currentCategoryItems = useMemo(() => {
    return (menuItems || []).filter(item => item && item.category === currentCategoryName);
  }, [menuItems, currentCategoryName]);

  // 4. Chef's Choice visual showcase carousel (6 seconds)
  const showcaseItems = useMemo(() => {
    return (menuItems || []).filter(item => item && item.isChefChoice);
  }, [menuItems]);

  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [showcaseFade, setShowcaseFade] = useState(true);

  useEffect(() => {
    if (showcaseItems.length <= 1) return;
    const timer = setInterval(() => {
      setShowcaseFade(false);
      setTimeout(() => {
        setShowcaseIndex(prev => (prev + 1) % showcaseItems.length);
        setShowcaseFade(true);
      }, 400);
    }, 6000);
    return () => clearInterval(timer);
  }, [showcaseItems]);

  const currentShowcaseItem = showcaseItems[showcaseIndex];

  // 5. Duplicated menu items list for infinite pricing board marquee
  const scrollingMenuItems = useMemo(() => {
    const items = menuItems || [];
    return [...items, ...items];
  }, [menuItems]);

  return (
    <div className="min-h-screen bg-[#030303] text-stone-200 font-sans p-6 overflow-hidden flex flex-col justify-between select-none relative w-full h-screen">
      {/* Styles Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatGlow {
          0%, 100% { opacity: 0.15; transform: scale(1.0); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes kenBurns {
          0% { transform: scale(1.0); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1.0); }
        }
        @keyframes sweep {
          0% { transform: translateX(-150%) skewX(-25deg); }
          100% { transform: translateX(150%) skewX(-25deg); }
        }
        @keyframes blinkGold {
          0%, 100% { border-color: rgba(212,175,55,0.25); box-shadow: 0 0 10px rgba(212,175,55,0.05); }
          50% { border-color: rgba(212,175,55,0.7); box-shadow: 0 0 25px rgba(212,175,55,0.25); }
        }
        .anim-glow {
          animation: floatGlow 8s infinite ease-in-out;
        }
        .anim-marquee {
          animation: marquee 25s linear infinite;
        }
        .anim-kenburns {
          animation: kenBurns 12s infinite ease-in-out;
        }
        .anim-sweep {
          animation: sweep 4s infinite ease-in-out;
        }
        .anim-blink-gold {
          animation: blinkGold 2s infinite ease-in-out;
        }
        @keyframes scrollMenu {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .anim-scroll-menu {
          animation: scrollMenu 45s linear infinite;
        }
        .anim-scroll-menu:hover {
          animation-play-state: paused;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,_rgba(212,175,55,0.04)_0%,_transparent_75%)] rounded-full anim-glow"></div>
        <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-[radial-gradient(circle,_rgba(212,175,55,0.03)_0%,_transparent_75%)] rounded-full anim-glow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* 1. SIGNAGE HEADER */}
      <header className="relative z-10 w-full bg-[#0a0a0a]/90 backdrop-blur-md border border-white/[0.03] p-4 rounded-[1.5rem] flex items-center justify-between shadow-[0_10px_35px_rgba(0,0,0,0.8)] gap-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Award size={28} className="text-gold-400 relative z-10 animate-pulse" />
            <div className="absolute inset-0 bg-gold-500 blur-md opacity-35"></div>
          </div>
          <div className="text-left">
            <span className="font-serif text-lg tracking-[0.25em] text-stone-100 uppercase">Chillies <strong className="text-gold-400">Elite</strong></span>
            <span className="block text-[7px] text-stone-500 font-mono tracking-widest uppercase">Digital Signage Grid</span>
          </div>
        </div>

        {/* Live Announcement Marquee */}
        {storeSettings?.isAnnouncementActive && storeSettings?.announcement && (
          <div className="flex-1 max-w-[40%] bg-stone-950/80 border border-white/5 rounded-full py-1.5 px-6 overflow-hidden relative hidden md:block">
            <div className="anim-marquee whitespace-nowrap text-[9px] uppercase tracking-widest text-gold-400 font-black">
              📢 {storeSettings.announcement} &bull; MINT ORDERING ACTIVE &bull; REGISTER ONLINE FOR AUTO CASHBACK
            </div>
          </div>
        )}

        {/* Dynamic running clock */}
        <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 px-5 py-2 rounded-xl">
          <div className="text-right">
            <span className="block font-mono text-base font-black text-stone-100 tracking-wider leading-none">{timeString}</span>
            <span className="block text-[8px] uppercase tracking-widest text-stone-500 mt-1 font-bold">{dateString}</span>
          </div>
          <Clock size={20} className="text-gold-500/80" />
        </div>
      </header>

      {/* 2. DYNAMIC MAIN DASHBOARD */}
      <main className="relative z-10 grid grid-cols-12 gap-6 my-5 flex-1 w-full overflow-hidden min-h-0">
        
        {/* LEFT 2/3 COLUMN: Category menu items rotation grid */}
        <section className="col-span-8 flex flex-col justify-between overflow-hidden min-h-0 bg-[#080808]/40 border border-white/[0.02] p-5 rounded-[2rem]">
          <div className={`flex flex-col gap-6 flex-1 transition-opacity duration-500 min-h-0 ${slideFade ? 'opacity-100' : 'opacity-0'}`}>
            {currentCategoryName && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Category Header */}
                <div className="flex justify-between items-center mb-3.5 border-b border-white/[0.04] pb-1.5 shrink-0">
                  <span className="text-xs tracking-[0.3em] font-serif text-gold-400 uppercase font-black">{currentCategoryName}</span>
                  <span className="text-[7.5px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full font-mono text-stone-500 uppercase tracking-widest">
                    Category {activeSlideIndex + 1} of {activeCategories.length}
                  </span>
                </div>

                {/* Menu items grid - Auto layouts all items in the category cleanly */}
                <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto scrollbar-none pr-1 align-content-start">
                  {currentCategoryItems.map(item => {
                    const finalPrice = getItemPrice(item);
                    const hasDiscount = finalPrice < (item.price || 0);

                    return (
                      <div
                        key={item.id}
                        className="bg-[#0b0b0b] border border-white/[0.03] p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-[#ffb732]/30 transition-colors h-fit min-h-[95px]"
                      >
                        {/* Elegant premium left border accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#ffb732]/90 via-[#ffb732]/30 to-transparent"></div>

                        {/* Ambient glow sweep */}
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
                          <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-[#ffb732]/[0.025] to-transparent anim-sweep"></div>
                        </div>

                        <div className="relative z-10 flex gap-3.5 pl-1.5">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-14 h-14 object-cover rounded-xl border border-white/5 shrink-0"
                            />
                          )}
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-serif text-sm md:text-[14px] font-black tracking-wide leading-tight bg-gradient-to-r from-white via-[#ffe29c] to-[#ffb732] bg-clip-text text-transparent truncate flex-1">{item.name}</h4>
                              {item.isChefChoice && <Sparkles size={10} className="text-[#ffb732] animate-pulse shrink-0" />}
                              {item.isSpicy && <Flame size={10} className="text-red-500 shrink-0" />}
                            </div>
                            <p className="text-stone-500 text-[9px] mt-1 leading-normal font-light line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Pricing Row */}
                        <div className="relative z-10 flex justify-between items-center mt-2.5 pt-2 border-t border-white/[0.02] pl-1.5">
                          <div className="flex items-center gap-2">
                            {item.isVegetarian ? (
                              <span className="inline-flex border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[6.5px] font-bold tracking-wider uppercase shrink-0">VEG</span>
                            ) : (
                              <span className="inline-flex border border-rose-500/25 bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded text-[6.5px] font-bold tracking-wider uppercase shrink-0">NON-VEG</span>
                            )}
                            <span className="text-[7.5px] uppercase tracking-widest text-stone-500 font-mono">Elite Selection</span>
                          </div>

                          <div className="text-right flex items-center gap-2">
                            {hasDiscount && (
                              <span className="text-[9px] line-through text-stone-600 font-mono">₹{item.price}</span>
                            )}
                            <div className="bg-gradient-to-r from-[#141414] to-[#0d0d0d] border border-white/[0.06] group-hover:border-[#ffb732]/30 px-3.5 py-1 rounded-full flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 shrink-0 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffb732]/5 to-transparent -translate-x-[100%] anim-sweep pointer-events-none"></div>
                              <span className="font-mono text-[9px] font-bold text-[#ffb732]/70">₹</span>
                              <span className="w-[1px] h-3 bg-white/10"></span>
                              <span className="font-mono text-xs md:text-sm font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-[#ffe39d] to-[#ffb732] drop-shadow-[0_2px_8px_rgba(255,183,50,0.4)]">{finalPrice}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT 1/3 COLUMN: Chef showcase and QR code ordering */}
        <section className="col-span-4 flex flex-col justify-between overflow-hidden h-full min-h-0">
          
          {/* Full-Height Chef Showcase slides & QR Code */}
          <div className="flex-1 h-full bg-[#080808]/80 border border-white/[0.03] p-6 rounded-[2rem] flex flex-col justify-between overflow-hidden relative min-h-0">
            {currentShowcaseItem ? (
              <div className={`flex flex-col justify-between flex-1 transition-opacity duration-400 min-h-0 ${showcaseFade ? 'opacity-100' : 'opacity-0'}`}>
                {/* Visual Image container with Ken burns zoom */}
                <div className="relative w-full flex-1 rounded-2xl overflow-hidden border border-white/5 shadow-inner min-h-0 mb-5">
                  <img
                    src={currentShowcaseItem.image}
                    alt={currentShowcaseItem.name}
                    className="w-full h-full object-cover anim-kenburns"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                  
                  {/* Floating Chef Choice Badge */}
                  <span className="absolute top-3 left-3 px-3 py-1 bg-gold-500 text-stone-950 font-black uppercase text-[7.5px] tracking-widest rounded-lg flex items-center gap-1 shadow-md">
                    <Sparkles size={9} /> Chef's Masterpiece
                  </span>
                </div>

                {/* Info and scan to order wrapper */}
                <div className="flex items-center justify-between gap-4 shrink-0">
                  <div className="text-left flex-1 min-w-0">
                    <span className="text-[7.5px] uppercase tracking-widest text-[#ffb732] font-mono font-bold block mb-1">Featured Delicacy</span>
                    <h3 className="font-serif text-sm md:text-base font-black bg-gradient-to-r from-white via-[#ffe29c] to-[#ffb732] bg-clip-text text-transparent tracking-wide truncate">{currentShowcaseItem.name}</h3>
                    <p className="text-stone-500 text-[9.5px] leading-relaxed font-light mt-1 line-clamp-2">{currentShowcaseItem.description}</p>
                    
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="bg-gradient-to-r from-[#141414] to-[#0d0d0d] border border-white/[0.06] px-3.5 py-1 rounded-full flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffb732]/5 to-transparent -translate-x-[100%] anim-sweep pointer-events-none"></div>
                        <span className="font-mono text-[9px] font-bold text-[#ffb732]/70">₹</span>
                        <span className="w-[1px] h-3 bg-white/10"></span>
                        <span className="font-mono text-xs md:text-sm font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-[#ffe39d] to-[#ffb732] drop-shadow-[0_2px_8px_rgba(255,183,50,0.4)]">
                          {getItemPrice(currentShowcaseItem)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Card */}
                  <div className="flex flex-col items-center shrink-0 bg-white p-1.5 rounded-xl shadow-lg border border-[#ffb732]/30">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window?.location?.origin || '')}&bgcolor=ffffff&color=000000&margin=0`} 
                      alt="Order Scan" 
                      className="w-12 h-12 rounded"
                    />
                    <span className="text-[5.5px] text-stone-800 font-mono tracking-widest mt-1 uppercase font-bold">SCAN TO ORDER</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1">
                <p className="text-stone-500 font-mono text-[9px] uppercase tracking-widest">Showcase Empty</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 3. SIGNAGE FOOTER */}
      <footer className="relative z-10 w-full bg-[#0a0a0a]/90 backdrop-blur-md border border-white/[0.03] p-3.5 rounded-[1.5rem] flex items-center justify-between text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] gap-6">
        <div>
          <span className="text-[7.5px] text-stone-500 uppercase tracking-widest font-mono block">Chillies Kitchen</span>
          <span className="text-[9px] font-serif font-black text-stone-300 uppercase tracking-wider block">Fresh &middot; Culinary &middot; Craftsmanship</span>
        </div>

        {/* Live Promo Banner Marquee */}
        <div className="flex-1 max-w-[50%] bg-stone-950/80 border border-white/5 rounded-xl py-1 px-4 text-center overflow-hidden">
          {isFlashSaleActive ? (
            <span className="text-[8.5px] uppercase tracking-[0.2em] text-red-500 font-black animate-pulse">
              🔥 LIVE FLASH SALE ACTIVE: UP TO 30% OFF PREMIUM SELECTIONS!
            </span>
          ) : isHappyHourActive ? (
            <span className="text-[8.5px] uppercase tracking-[0.2em] text-gold-400 font-black animate-pulse">
              🎉 HAPPY HOUR MODE ACTIVE: SPECIFIED PRICES LOADED ON SCREEN!
            </span>
          ) : (
            <span className="text-[8px] uppercase tracking-widest text-stone-500 font-mono">
              Scan QR Code on the board to order instantly on WhatsApp &bull; Save up to 10% auto-cashback!
            </span>
          )}
        </div>

        <div className="text-right">
          <span className="text-[7.5px] text-stone-500 uppercase tracking-widest font-mono block">Order Help Desk</span>
          <span className="text-[9px] font-mono font-black text-gold-400 tracking-wider block">+91 98765 43210</span>
        </div>
      </footer>
    </div>
  );
};

export default SignagePage;
