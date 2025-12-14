
import React from 'react';
import { MenuItem, CartItem } from '../types';
import MenuItemCard from './MenuItemCard';
import { ChefHat, Star } from 'lucide-react';

interface ChefsChoiceProps {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
  isFlashSaleActive?: boolean;
  checkAvailability?: (catName: string) => { isAvailable: boolean; availabilityTime?: string };
  isStoreOpen?: boolean;
  // Added Props
  cartItems?: CartItem[];
  allMenuItems?: MenuItem[];
  onShowSuggestion?: (suggestion: MenuItem) => void;
}

const ChefsChoice: React.FC<ChefsChoiceProps> = ({ 
  items, 
  onAdd, 
  isFlashSaleActive = false, 
  checkAvailability, 
  isStoreOpen = true,
  cartItems,
  allMenuItems,
  onShowSuggestion
}) => {
  if (items.length === 0) return null;

  return (
    <section className="pb-20 pt-8 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-stone-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-gold-500/10 via-stone-900 to-stone-950"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full border border-gold-500/20 mb-4 animate-fade-in">
            <ChefHat className="text-gold-500 w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-white mb-4">
            Chef's <span className="text-gold-500 italic">Masterpieces</span>
          </h2>
          <p className="text-stone-400 font-light max-w-xl mx-auto flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-gold-500/50"></span>
            <span>Exquisite selections hand-picked by our culinary experts</span>
            <span className="w-8 h-px bg-gold-500/50"></span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {items.map((item, index) => {
            const availability = checkAvailability ? checkAvailability(item.category) : { isAvailable: true };
            return (
              <div key={item.id} className="relative group">
                 {/* Gold Glow Effect behind cards */}
                 <div className="absolute inset-0 bg-gold-500/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>
                 
                 <div className="relative transform transition-transform duration-500 hover:-translate-y-2 h-full">
                    {/* Badge */}
                    <div className="absolute -top-3 -right-3 z-30 bg-gold-500 text-stone-950 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> Signature
                    </div>
                    
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
    </section>
  );
};

export default ChefsChoice;
