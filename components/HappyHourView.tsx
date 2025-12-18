
import React from 'react';
import { MenuItem, CartItem } from '../types';
import MenuItemCard from './MenuItemCard';
import { PartyPopper, Wine, Sparkles } from 'lucide-react';

interface HappyHourViewProps {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
  isHappyHourActive?: boolean;
  checkAvailability?: (catName: string) => { isAvailable: boolean; availabilityTime?: string };
  isStoreOpen?: boolean;
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
  const marqueeItems = items.length > 0 
    ? [...items, ...items, ...items, ...items].slice(0, 12) 
    : [];

  return (
    <div className="w-full space-y-12 animate-fade-in">
      <div className="relative w-full h-72 md:h-96 overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-black to-stone-950 group">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-stone-950 via-transparent to-stone-950 pointer-events-none"></div>
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
            <div className="bg-purple-600/80 text-white px-8 py-3 rounded-full font-bold uppercase tracking-[0.3em] text-sm md:text-xl backdrop-blur-md shadow-[0_0_40px_rgba(147,51,234,0.4)] flex items-center gap-3 animate-pulse border border-purple-400/20">
                <PartyPopper fill="currentColor" className="text-pink-300" /> HAPPY HOUR LIVE
            </div>
            <div className="mt-4 space-y-2">
                <p className="text-purple-300/80 text-[10px] md:text-xs font-serif tracking-[0.5em] uppercase font-bold">Unwind & Elevate Your Evening</p>
                <h3 className="text-white text-2xl md:text-4xl font-serif">Signature Sips <span className="text-purple-400 italic">& Savory Bites</span></h3>
            </div>
            <div className="mt-6 flex items-center gap-4 text-purple-400/60">
                <Sparkles size={16} />
                <span className="text-[10px] uppercase tracking-widest font-bold">Special Pricing Active</span>
                <Sparkles size={16} />
            </div>
        </div>
        <div className="flex absolute top-0 left-0 h-full animate-marquee grayscale-[0.3] opacity-30 hover:grayscale-0 hover:opacity-80 transition-all duration-1000">
            {marqueeItems.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="h-full w-56 md:w-80 flex-shrink-0 relative border-r border-purple-500/5">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                </div>
            ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {items.map((item, index) => {
            const availability = checkAvailability ? checkAvailability(item.category) : { isAvailable: true };
            return (
                <div key={item.id} className="relative group">
                    <div className="absolute -top-4 -right-4 z-30 bg-purple-600 text-white p-2 rounded-lg shadow-xl rotate-[10deg] group-hover:scale-110 transition-transform">
                        <Wine size={16} fill="currentColor" className="text-pink-300" />
                    </div>
                    <div className="ring-2 ring-purple-900/30 rounded-3xl h-full transition-all hover:ring-purple-500/50 hover:shadow-[0_0_30px_rgba(147,51,234,0.15)]">
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
        })}
      </div>
    </div>
  );
};

export default HappyHourView;
