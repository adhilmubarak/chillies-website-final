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
  // Added Props
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
  // Duplicate items to ensure marquee is seamless even with few items
  const marqueeItems = items.length > 0 
    ? [...items, ...items, ...items, ...items].slice(0, 12) 
    : [];

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      
      // Parse HH:MM from prop
      const [h, m] = flashSaleEndTime.split(':').map(Number);
      
      // Valid time check
      if (!isNaN(h) && !isNaN(m)) {
          target.setHours(h, m, 0, 0);
      } else {
          // Default to end of day if invalid
          target.setHours(23, 59, 59, 999);
      }
      
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

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSaleEndTime]);

  return (
    <div className="w-full space-y-12 animate-fade-in">
      {/* Moving Photos Banner (Marquee) */}
      <div className="relative w-full h-72 md:h-96 overflow-hidden rounded-2xl border-2 border-red-600/50 bg-stone-950 group shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-stone-950 via-stone-950/80 to-stone-950 pointer-events-none"></div>
        
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 md:gap-6 px-4">
            <div className="bg-red-600 text-white px-4 md:px-8 py-2 md:py-3 rounded-full font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-xl shadow-[0_0_40px_rgba(220,38,38,0.8)] flex items-center gap-2 md:gap-3 animate-pulse border border-red-400">
                <Zap fill="currentColor" className="text-yellow-300 w-4 h-4 md:w-6 md:h-6" /> Flash Sale Live
            </div>
            
            <p className="text-red-200/90 text-xs md:text-sm font-serif tracking-widest uppercase font-bold text-center">Limited Time Offers • Exclusive Deals</p>
            
            {/* Prominent Countdown Timer */}
            <div className="flex flex-col items-center bg-black/80 backdrop-blur-xl px-6 md:px-8 py-3 md:py-4 rounded-2xl border border-red-500/50 shadow-2xl relative overflow-hidden mt-2">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-900/20 to-transparent animate-pulse"></div>
                
                <div className="flex items-center gap-2 mb-1 md:mb-2 relative z-10">
                    <Timer size={14} className="text-red-500 md:w-4 md:h-4" />
                    <span className="text-[8px] md:text-[10px] text-red-400 font-bold uppercase tracking-[0.2em]">Hurry, Ends In</span>
                </div>

                <div className="flex gap-2 md:gap-4 text-white font-mono text-2xl md:text-5xl font-bold tracking-wider relative z-10">
                    <div className="flex flex-col items-center">
                        <span className="tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
                        <span className="text-[8px] md:text-[10px] text-stone-500 font-sans tracking-widest mt-1">HRS</span>
                    </div>
                    <span className="text-red-600 animate-pulse -mt-1 md:-mt-2">:</span>
                    <div className="flex flex-col items-center">
                        <span className="tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <span className="text-[8px] md:text-[10px] text-stone-500 font-sans tracking-widest mt-1">MIN</span>
                    </div>
                    <span className="text-red-600 animate-pulse -mt-1 md:-mt-2">:</span>
                    <div className="flex flex-col items-center">
                        <span className="tabular-nums text-red-500">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        <span className="text-[8px] md:text-[10px] text-stone-500 font-sans tracking-widest mt-1">SEC</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* The Marquee Track */}
        <div className="flex absolute top-0 left-0 h-full animate-marquee hover:[animation-play-state:paused] opacity-30 grayscale-[0.5]">
            {marqueeItems.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="h-full w-48 md:w-96 flex-shrink-0 relative border-r border-red-900/10">
                    <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {items.length === 0 ? (
            <div className="col-span-full text-center py-12">
                <p className="text-stone-500">No items currently in Flash Sale.</p>
            </div>
        ) : (
            items.map((item, index) => {
                const availability = checkAvailability ? checkAvailability(item.category) : { isAvailable: true };
                return (
                    <div key={item.id} className="relative group">
                        {/* Special Flash Sale Badge overlaying the card */}
                        <div className="absolute -top-4 -left-4 z-30 bg-red-600 text-white p-2 rounded-lg shadow-xl border border-red-400/30 rotate-[-10deg] group-hover:scale-110 transition-transform">
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[10px] font-bold uppercase">Deal</span>
                                <Zap size={16} fill="currentColor" className="text-yellow-300 my-0.5" />
                            </div>
                        </div>
                        <div className="ring-2 ring-red-900/30 rounded-3xl h-full transition-all hover:ring-red-500/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.15)]">
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
            })
        )}
      </div>
    </div>
  );
};

export default FlashSaleView;