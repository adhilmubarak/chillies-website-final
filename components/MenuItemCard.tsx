import React, { useState } from 'react';
import { Plus, Leaf, Check, ChefHat, Lock } from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import SafeImage from './SafeImage';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  index?: number;
  isFlashSaleActive?: boolean;
  isHappyHourActive?: boolean;
  isAvailable?: boolean;
  availabilityTime?: string;
  isStoreOpen?: boolean;
  cartItems?: CartItem[];
  allMenuItems?: MenuItem[];
  onShowSuggestion?: (suggestion: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, onAdd, index = 0, isFlashSaleActive = false, isHappyHourActive = false, 
  isAvailable = true, availabilityTime, isStoreOpen = true, cartItems = [], 
  allMenuItems = [], onShowSuggestion 
}) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    if (!isAvailable || !isStoreOpen || item.isUnavailable) return;
    onAdd(item);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  const isFlashSale = isFlashSaleActive && item.isFlashSale && item.flashSalePrice;
  const isHappyHour = !isFlashSale && isHappyHourActive && item.isHappyHour && item.happyHourPrice;
  const isItemInteractable = isAvailable && isStoreOpen && !item.isUnavailable;

  return (
    <div className={`group flex flex-col h-full bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden transition-all duration-300 ${isItemInteractable ? 'hover:border-gold-500/50 hover:shadow-2xl' : 'opacity-80'}`}>
      <div className="relative h-60 sm:h-72 w-full overflow-hidden">
        <SafeImage
          src={item.image}
          alt={item.name}
          containerClassName="w-full h-full"
          className={`w-full h-full object-cover transition-transform duration-500 ${isItemInteractable ? 'group-hover:scale-105' : ''}`}
          loading="lazy"
        />
        
        {!isItemInteractable && (
            <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-20">
                <Lock className="text-stone-400 mb-2" size={24} />
                <span className="text-white font-bold uppercase tracking-widest text-[10px]">Temporarily Unavailable</span>
            </div>
        )}

        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
            {item.isChefChoice && <div className="bg-gold-500 text-stone-950 p-1.5 rounded-full shadow-lg"><ChefHat size={12} /></div>}
            {item.isVegetarian && <div className="bg-stone-950/80 text-green-400 p-1.5 rounded-full border border-green-500/20"><Leaf size={12} /></div>}
        </div>

        <div className="absolute top-3 right-3 z-10">
            <div className="bg-stone-950/80 backdrop-blur-md text-gold-400 font-bold px-3 py-1.5 rounded-lg border border-white/10 text-sm">
                ₹{isFlashSale ? item.flashSalePrice : isHappyHour ? item.happyHourPrice : item.price}
            </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-grow p-5 md:p-6">
        <h3 className="font-serif text-lg md:text-xl text-white font-medium mb-2 group-hover:text-gold-400 transition-colors line-clamp-1">{item.name}</h3>
        <p className="text-stone-500 text-xs md:text-sm font-light line-clamp-2 mb-6 flex-grow">{item.description}</p>
        
        <button
          onClick={handleAdd}
          disabled={isAdded || !isItemInteractable}
          className={`w-full py-3.5 rounded-xl font-bold uppercase text-[10px] md:text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${
              isAdded ? 'bg-green-600 text-white' : isItemInteractable ? 'bg-stone-800 text-white hover:bg-gold-500 hover:text-stone-950' : 'bg-stone-950 text-stone-600 cursor-not-allowed'
          }`}
        >
          {isAdded ? <Check size={14} /> : <Plus size={14} />}
          <span>{isAdded ? 'Added' : 'Add to Order'}</span>
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;