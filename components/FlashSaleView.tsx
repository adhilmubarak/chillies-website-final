
import React, { useState, useEffect } from 'react';
import { MenuItem, CartItem } from '../types';
import MenuItemCard from './MenuItemCard';
import { Zap, Timer } from 'lucide-react';

interface FlashSaleViewProps {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
  isFlashSaleActive?: boolean;
  flashSaleEndTime?: string;
  checkAvailability?: (catName: string) => { isAvailable: boolean; availabilityTime?: string };
  isStoreOpen?: boolean;
  cartItems?: CartItem[];
  allMenuItems?: MenuItem[];
  onShowSuggestion?: (suggestion: MenuItem) => void;
}

const FlashSaleView: React.FC<FlashSaleViewProps> = ({ 
  items, 
  onAdd, 
  isFlashSaleActive = true, 
  flashSaleEndTime = '23:59', 
  checkAvailability, 
  isStoreOpen = true,
  cartItems,
  allMenuItems,
  onShowSuggestion
}) => {
  const marqueeItems = items.length > 0 
    ? [...items, ...items, ...items, ...items].slice(0, 12) 
    : [];

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      const [h, m] = flashSaleEndTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) target.setHours(h, m, 0, 0);
      else target.setHours(23, 59, 59, 999);
      const difference = target.getTime() - now.getTime();
      if (difference > 0) {
        return {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return { hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [flashSaleEndTime]);

  return (
    <div className="w-full space-y-12 animate-fade-in">
      {/* Big Box Highlight with Running Images */}
      <div className="relative w-full h-80 md:h-[450px] overflow-hidden rounded-3xl border-4 border-red-600/50 bg-stone-950 group shadow-[0_0_60px_rgba(220,38,38,0.25)]">
        {/* Neon Glow Pulse Overlay */}
        <div className="absolute inset-0 bg-red-600/5 animate-pulse z-20 pointer-events-none"></div>
        
        {/* Gradient Mask to focus center */}
        <div className="absolute inset-0 z-30 bg-gradient-to-r from-stone-950 via-transparent to-stone-950 pointer-events-none"></div>
        <div className="absolute inset-0 z-30 bg-gradient-to-t from-stone-950 via-transparent to-transparent pointer-events-none"></div>

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="bg-red-600 text-white px-8 py-3 rounded-full font-bold uppercase tracking-[0.3em] text-sm md:text-2xl shadow-[0_0_40px_rgba(220,38,38,0.8)] flex items-center gap-4 animate-bounce border border-red-400">
                <Zap fill="currentColor" className="text-yellow-300 w-5 h-5 md:w-8 md:h-8" /> FLASH SALE LIVE
            </div>
            
            <div className="space-y-2">
                <p className="text-red-200 text-xs md:text-base font-serif tracking-[0.4em] uppercase font-bold">Exclusive Culinary Steals</p>
                <h3 className="text-white text-3xl md:text-5xl font-serif">Unbeatable Deals <span className="text-red-500 italic">Ending Soon</span></h3>
            </div>
            
            {/* Premium Glassmorphic Countdown */}
            <div className="flex flex-col items-center bg-black/60 backdrop-blur-2xl px-10 py-6 rounded-3xl border border-white/10 shadow-2xl mt-4">
                <div className="flex items-center gap-3 mb-4">
                    <Timer size={18} className="text-red-500" />
                    <span className="text-[10px] md:text-xs text-stone-400 font-bold uppercase tracking-[0.3em]">Offer Ends In</span>
                </div>

                <div className="flex gap-4 md:gap-8 text-white font-mono text-3xl md:text-6xl font-bold tracking-wider">
                    <div className="flex flex-col items-center">
                        <span className="tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
                        <span className="text-[10px] text-stone-500 font-sans tracking-[0.2em] mt-1 uppercase">Hours</span>
                    </div>
                    <span className="text-red-600 animate-pulse">:</span>
                    <div className="flex flex-col items-center">
                        <span className="tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <span className="text-[10px] text-stone-500 font-sans tracking-[0.2em] mt-1 uppercase">Mins</span>
                    </div>
                    <span className="text-red-600 animate-pulse">:</span>
                    <div className="flex flex-col items-center">
                        <span className="tabular-nums text-red-500">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        <span className="text-[10px] text-stone-500 font-sans tracking-[0.2em] mt-1 uppercase">Secs</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Running Images Marquee */}
        <div className="flex absolute top-0 left-0 h-full animate-marquee-fast grayscale-[0.5] opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            {marqueeItems.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="h-full w-56 md:w-[400px] flex-shrink-0 relative">
                    <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover border-x border-white/5"
                    />
                    <div className="absolute bottom-6 left-6 z-10">
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">₹{item.flashSalePrice}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {items.map((item, index) => {
            const availability = checkAvailability ? checkAvailability(item.category) : { isAvailable: true };
            return (
                <div key={item.id} className="relative group">
                    <div className="absolute -top-4 -left-4 z-30 bg-red-600 text-white p-2 rounded-lg shadow-xl rotate-[-10deg] group-hover:scale-110 transition-transform">
                        <Zap size={16} fill="currentColor" className="text-yellow-300" />
                    </div>
                    <div className="ring-2 ring-red-900/30 rounded-3xl h-full transition-all hover:ring-red-500/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                        <MenuItemCard 
                            item={item} 
                            onAdd={onAdd} 
                            index={index} 
                            isFlashSaleActive={isFlashSaleActive} 
                            isAvailable={availability.isAvailable}
                            availabilityTime={availability.availabilityTime}
                            isStoreOpen={isStoreOpen}
                            cartItems={cartItems}
                            allMenuItems={allMenuItems}
                            onShowSuggestion={onShowSuggestion}
                        />
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default FlashSaleView;
