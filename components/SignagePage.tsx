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
  menuItems,
  dbCategories,
  orders,
  storeSettings,
  promoSettings,
  currentTime: appTime
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
    if (!promoSettings.isFlashSaleActive) return false;
    const todayStr = time.toISOString().split('T')[0];
    if (promoSettings.flashSaleDate && todayStr !== promoSettings.flashSaleDate) return false;
    const [startH, startM] = promoSettings.flashSaleStartTime.split(':').map(Number);
    const [endH, endM] = promoSettings.flashSaleEndTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const currMin = time.getHours() * 60 + time.getMinutes();
    return currMin >= startMin && currMin < endMin;
  }, [promoSettings, time]);

  const isHappyHourActive = useMemo(() => {
    if (!promoSettings.isHappyHourActive) return false;
    const [startH, startM] = promoSettings.happyHourStartTime.split(':').map(Number);
    const [endH, endM] = promoSettings.happyHourEndTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const currMin = time.getHours() * 60 + time.getMinutes();
    return currMin >= startMin && currMin < endMin;
  }, [promoSettings, time]);

  // Price calculation helper
  const getItemPrice = (item: MenuItem) => {
    if (isFlashSaleActive && item.isFlashSale && item.flashSalePrice) return item.flashSalePrice;
    if (isHappyHourActive && item.isHappyHour && item.happyHourPrice) return item.happyHourPrice;
    return item.price;
  };

  // 3. Category grouping for rotation slide lists (Groups of 2 categories per slide)
  const categoryPairs = useMemo(() => {
    const activeCats = dbCategories
      .filter(c => !c.isUnavailable)
      .map(c => c.name);
    
    const pairs: string[][] = [];
    for (let i = 0; i < activeCats.length; i += 2) {
      pairs.push(activeCats.slice(i, i + 2));
    }
    return pairs;
  }, [dbCategories]);

  // Rotator Timer for Category Pages (12 seconds)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideFade, setSlideFade] = useState(true);

  useEffect(() => {
    if (categoryPairs.length <= 1) return;
    const timer = setInterval(() => {
      setSlideFade(false);
      setTimeout(() => {
        setActiveSlideIndex(prev => (prev + 1) % categoryPairs.length);
        setSlideFade(true);
      }, 500); // 500ms fade transition
    }, 12000);
    return () => clearInterval(timer);
  }, [categoryPairs]);

  // Current pair of categories to render
  const currentCategories = categoryPairs[activeSlideIndex] || [];

  // 4. Chef's Choice visual showcase carousel (6 seconds)
  const showcaseItems = useMemo(() => {
    return menuItems.filter(item => item.isChefChoice);
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
    return [...menuItems, ...menuItems];
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
        {storeSettings.isAnnouncementActive && storeSettings.announcement && (
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
            {currentCategories.map(catName => {
              const catItems = menuItems.filter(item => item.category === catName).slice(0, 4); // Show max 4 items per category for visual space
              if (catItems.length === 0) return null;

              return (
                <div key={catName} className="flex-1 flex flex-col min-h-0">
                  {/* Category Header */}
                  <div className="flex justify-between items-center mb-3.5 border-b border-white/[0.04] pb-1.5 shrink-0">
                    <span className="text-xs tracking-[0.3em] font-serif text-gold-400 uppercase font-black">{catName}</span>
                    <span className="text-[7.5px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full font-mono text-stone-500 uppercase tracking-widest">
                      Slide {activeSlideIndex + 1} of {categoryPairs.length}
                    </span>
                  </div>

                  {/* Menu items row/grid */}
                  <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
                    {catItems.map(item => {
                      const finalPrice = getItemPrice(item);
                      const hasDiscount = finalPrice < item.price;

                      return (
                        <div
                          key={item.id}
                          className="bg-[#0b0b0b] border border-white/[0.03] p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-gold-500/20 transition-colors"
                        >
                          {/* Ambient glow sweep */}
                          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
                            <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-gold-400/[0.015] to-transparent anim-sweep"></div>
                          </div>

                          <div className="relative z-10 flex gap-3.5">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-xl border border-white/5 shrink-0"
                              />
                            )}
                            <div className="text-left flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-stone-100 text-xs font-bold font-serif tracking-wide truncate">{item.name}</h4>
                                {item.isChefChoice && <Sparkles size={10} className="text-gold-400 animate-pulse shrink-0" />}
                                {item.isSpicy && <Flame size={10} className="text-red-500 shrink-0" />}
                              </div>
                              <p className="text-stone-500 text-[9px] mt-1 leading-normal font-light line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          {/* Pricing Row */}
                          <div className="relative z-10 flex justify-between items-baseline mt-2 pt-2 border-t border-white/[0.02]">
                            <div className="flex items-center gap-1">
                              {item.isVegetarian ? (
                                <span className="inline-flex w-3 h-3 border border-emerald-600 items-center justify-center rounded-sm text-[6px] text-emerald-500 font-bold shrink-0">🟢</span>
                              ) : (
                                <span className="inline-flex w-3 h-3 border border-rose-600 items-center justify-center rounded-sm text-[6px] text-rose-500 font-bold shrink-0">🔴</span>
                              )}
                              <span className="text-[7.5px] uppercase tracking-widest text-stone-500 font-mono">Elite Selection</span>
                            </div>

                            <div className="text-right">
                              {hasDiscount && (
                                <span className="text-[9px] line-through text-stone-600 mr-1.5 font-mono">₹{item.price}</span>
                              )}
                              <span className="font-mono text-xs font-black text-gold-400">₹{finalPrice}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT 1/3 COLUMN: Chef showcase and KOT queue */}
        <section className="col-span-4 flex flex-col justify-between overflow-hidden min-h-0 gap-6">
          
          {/* TOP HALF: Large Chef Showcase slides & QR Code */}
          <div className="flex-1 min-h-[50%] bg-[#080808]/80 border border-white/[0.03] p-5 rounded-[2rem] flex flex-col justify-between overflow-hidden relative">
            {currentShowcaseItem ? (
              <div className={`flex flex-col justify-between flex-1 transition-opacity duration-400 ${showcaseFade ? 'opacity-100' : 'opacity-0'}`}>
                {/* Visual Image container with Ken burns zoom */}
                <div className="relative w-full aspect-[1.8/1] rounded-2xl overflow-hidden border border-white/5 shadow-inner">
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
                <div className="flex items-center justify-between gap-4 mt-4">
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="font-serif text-sm font-black text-stone-100 tracking-wide truncate">{currentShowcaseItem.name}</h3>
                    <p className="text-stone-500 text-[9px] leading-relaxed font-light mt-0.5 line-clamp-2">{currentShowcaseItem.description}</p>
                    <span className="inline-block mt-2 font-mono text-xs font-black text-gold-400">₹{getItemPrice(currentShowcaseItem)}</span>
                  </div>

                  {/* QR Card */}
                  <div className="flex flex-col items-center shrink-0 bg-white p-1.5 rounded-xl shadow-lg border border-gold-500/30">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin)}&bgcolor=ffffff&color=000000&margin=0`} 
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

          {/* BOTTOM HALF: Premium Price Board */}
          <div className="h-[45%] bg-[#080808]/80 border border-white/[0.03] p-5 rounded-[2rem] flex flex-col overflow-hidden relative justify-between">
            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2 shrink-0 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse"></span>
                <span className="text-[10px] tracking-[0.25em] font-serif text-stone-100 uppercase font-black">Pricing Directory</span>
              </div>
              <span className="text-[7.5px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full font-mono text-stone-500 uppercase tracking-widest">
                Classic Menu
              </span>
            </div>

            {/* Scrolling Price Board Container */}
            <div className="flex-1 overflow-hidden relative w-full pr-1 scrollbar-none">
              <div className="anim-scroll-menu flex flex-col gap-2.5">
                {scrollingMenuItems.map((item, idx) => {
                  const finalPrice = getItemPrice(item);
                  const hasDiscount = finalPrice < item.price;
                  return (
                    <div 
                      key={`${item.id}-${idx}`}
                      className="flex justify-between items-center text-[10px] py-1 border-b border-white/[0.02]"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[70%] text-left">
                        {item.isVegetarian ? (
                          <span className="inline-flex w-2.5 h-2.5 border border-emerald-600/40 items-center justify-center rounded-sm text-[5.5px] text-emerald-500 font-bold shrink-0">🟢</span>
                        ) : (
                          <span className="inline-flex w-2.5 h-2.5 border border-rose-600/40 items-center justify-center rounded-sm text-[5.5px] text-rose-500 font-bold shrink-0">🔴</span>
                        )}
                        <span className="font-serif text-stone-300 font-bold tracking-wide truncate">{item.name}</span>
                        {item.isSpicy && <span className="text-[8px] shrink-0 text-red-500">🔥</span>}
                      </div>

                      {/* Dotted menu leader spacer */}
                      <div className="flex-1 border-b border-dashed border-white/[0.06] mx-2 self-end mb-1"></div>

                      <div className="text-right shrink-0 flex items-center gap-1.5">
                        {hasDiscount && (
                          <span className="text-[8px] line-through text-stone-600 font-mono">₹{item.price}</span>
                        )}
                        <span className="font-mono text-[10px] font-black text-gold-400">
                          ₹{finalPrice}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
