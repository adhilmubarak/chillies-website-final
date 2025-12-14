import React from 'react';
import { MenuItem, CartItem } from '../types';
import MenuItemCard from './MenuItemCard';
import { PartyPopper, Wine } from 'lucide-react';

interface HappyHourViewProps {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
  isHappyHourActive?: boolean;
  checkAvailability?: (catName: string) => { isAvailable: boolean; availabilityTime?: string };
  isStoreOpen?: boolean;
  // Added Props
  cartItems?: CartItem[];
  allMenuItems?: MenuItem[];
  onShowSuggestion?: (suggestion: MenuItem) => void;
}

const HappyHourView: React.FC<HappyHourViewProps> = ({ 
  items, 
  onAdd, 
  isHappyHourActive = true, 
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

  return (
    <div className="w-full space-y-12 animate-fade-in">
      {/* Moving Photos Banner (Marquee) - Purple/Neon Theme */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-2xl border border-purple-900/30 bg-gradient-to-r from-purple-950/20 to-black">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-stone-950 via-transparent to-stone-950 pointer-events-none"></div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="bg-purple-600/90 text-white px-6 py-2 rounded-full font-bold uppercase tracking-[0.3em] text-sm md:text-base backdrop-blur-sm shadow-[0_0_30px_rgba(147,51,234,0.5)] flex items-center gap-3 animate-pulse">
                <PartyPopper fill="currentColor" className="text-pink-300" /> Happy Hour
            </div>
            <p className="text-purple-200/80 text-xs mt-3 font-serif tracking-widest">Exclusive Drink & Dine Offers</p>
        </div>
        
        {/* The Marquee Track */}
        <div className="flex absolute top-0 left-0 h-full animate-marquee hover:[animation-play-state:paused]">
            {marqueeItems.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="h-full w-48 md:w-64 flex-shrink-0 relative border-r border-black/20">
                    <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-500 grayscale-[0.3]"
                    />
                </div>
            ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {items.length === 0 ? (
            <div className="col-span-full text-center py-12">
                <p className="text-stone-500">No items currently in Happy Hour.</p>
            </div>
        ) : (
            items.map((item, index) => {
                const availability = checkAvailability ? checkAvailability(item.category) : { isAvailable: true };
                return (
                    <div key={item.id} className="relative">
                        {/* Special Happy Hour Badge overlaying the card */}
                        <div className="absolute -top-4 -right-4 z-30 bg-purple-600 text-white p-2 rounded-lg shadow-xl border border-purple-400/30 rotate-[10deg]">
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[10px] font-bold uppercase">Special</span>
                                <Wine size={16} fill="currentColor" className="text-pink-300 my-0.5" />
                            </div>
                        </div>
                        <div className="ring-2 ring-purple-900/30 rounded-3xl h-full transition-all hover:ring-purple-500/50">
                            <MenuItemCard 
                                item={item} 
                                onAdd={onAdd} 
                                index={index} 
                                isHappyHourActive={isHappyHourActive} 
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

export default HappyHourView;