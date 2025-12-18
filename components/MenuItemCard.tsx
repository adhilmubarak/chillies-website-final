
import React, { useState } from 'react';
import { Plus, Leaf, Check, ChefHat, Lock, Ban, Flame, Clock } from 'lucide-react';
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

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours)) return timeStr;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  };

  const handleAdd = () => {
    if (!isAvailable || !isStoreOpen || item.isUnavailable) return;
    
    const modifiedItem = {
        ...item,
        price: isFlashSale ? item.flashSalePrice! : isHappyHour ? item.happyHourPrice! : item.price,
    };
    
    onAdd(modifiedItem);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  const isFlashSale = isFlashSaleActive && item.isFlashSale && item.flashSalePrice;
  const isHappyHour = !isFlashSale && isHappyHourActive && item.isHappyHour && item.happyHourPrice;
  
  const isTimeRestricted = isStoreOpen && !isAvailable && !item.isUnavailable;
  const isItemInteractable = isAvailable && isStoreOpen && !item.isUnavailable;

  const displayPrice = isFlashSale ? item.flashSalePrice! : isHappyHour ? item.happyHourPrice! : item.price;

  const renderSpicyTag = () => {
    const level = item.spicyLevel || (item.isSpicy ? 'medium' : 'none');
    if (level === 'none') return null;

    const styles = {
      mild: { 
        color: 'text-amber-400', 
        bg: 'bg-amber-500/10', 
        border: 'border-amber-500/30', 
        iconCount: 1, 
        label: 'Mild',
        pulse: '' 
      },
      medium: { 
        color: 'text-orange-500', 
        bg: 'bg-orange-500/10', 
        border: 'border-orange-500/30', 
        iconCount: 2, 
        label: 'Medium',
        pulse: '' 
      },
      hot: { 
        color: 'text-red-500', 
        bg: 'bg-red-600/20', 
        border: 'border-red-500/50', 
        iconCount: 3, 
        label: 'Hot',
        pulse: 'animate-pulse' 
      }
    };

    const config = styles[level as keyof typeof styles];
    if (!config) return null;

    return (
      <div className={`flex items-center gap-2 ${config.color} ${config.bg} backdrop-blur-md px-3 py-1.5 rounded-full border ${config.border} shadow-[0_4px_12px_rgba(0,0,0,0.5)] group/spicy transition-all duration-300 hover:scale-110 ${config.pulse}`}>
        <div className="flex -space-x-1">
          {[...Array(config.iconCount)].map((_, i) => (
            <Flame key={i} size={10} fill="currentColor" className="drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          ))}
        </div>
        <div className="h-3 w-px bg-white/20 mx-0.5"></div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
          {config.label}
        </span>
      </div>
    );
  };

  return (
    <div className={`group flex flex-col h-full bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden transition-all duration-500 ${isItemInteractable ? 'hover:border-gold-500/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]' : 'opacity-80'}`}>
      <div className="relative h-60 sm:h-72 w-full overflow-hidden">
        <SafeImage
          src={item.image}
          alt={item.name}
          containerClassName="w-full h-full"
          className={`w-full h-full object-cover transition-transform duration-700 ${isItemInteractable ? 'group-hover:scale-105' : ''}`}
          loading="lazy"
        />
        
        {item.isUnavailable && (
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-20">
                <div className="bg-red-600 text-white px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-xl flex items-center gap-2 mb-2">
                    <Ban size={14} /> Sold Out
                </div>
                <span className="text-stone-400 font-medium text-[9px] uppercase tracking-widest">Available Soon</span>
            </div>
        )}

        {isTimeRestricted && (
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-[3px] flex flex-col items-center justify-center text-center p-4 z-20 animate-fade-in">
                <div className="bg-gold-500/10 border border-gold-500/40 text-gold-500 px-5 py-2.5 rounded-2xl flex flex-col items-center gap-2 shadow-2xl">
                    <Clock size={20} className="animate-pulse" />
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] block">Available From</span>
                        <span className="text-sm font-serif italic font-bold text-white block">
                            {formatTime(availabilityTime)}
                        </span>
                    </div>
                </div>
            </div>
        )}

        {!isStoreOpen && !item.isUnavailable && !isTimeRestricted && (
            <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-20">
                <Lock className="text-stone-400/50 mb-2" size={24} />
                <span className="text-stone-400 font-bold uppercase tracking-[0.2em] text-[9px]">Kitchen Closed</span>
            </div>
        )}

        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10 max-w-[90%]">
            {item.isChefChoice && <div className="bg-gold-500 text-stone-950 p-2 rounded-full shadow-lg border border-gold-300/30"><ChefHat size={12} /></div>}
            {item.isVegetarian && <div className="bg-stone-950/80 backdrop-blur-sm text-green-400 p-2 rounded-full border border-green-500/30"><Leaf size={12} /></div>}
            {renderSpicyTag()}
        </div>

        <div className="absolute top-4 right-4 z-10">
            <div className={`bg-stone-950/80 backdrop-blur-md font-bold px-3 py-1.5 rounded-xl border border-white/10 text-sm transition-colors duration-300 ${!isItemInteractable ? 'text-stone-600' : 'text-gold-400'}`}>
                ₹{displayPrice}
            </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-grow p-5 md:p-7">
        <h3 className={`font-serif text-lg md:text-xl font-medium transition-colors line-clamp-1 mb-2 ${isItemInteractable ? 'text-white group-hover:text-gold-400' : 'text-stone-600'}`}>
            {item.name}
        </h3>

        <p className={`text-xs md:text-sm font-light line-clamp-2 mb-6 flex-grow leading-relaxed ${isItemInteractable ? 'text-stone-500' : 'text-stone-700'}`}>{item.description}</p>
        
        <button
          onClick={handleAdd}
          disabled={isAdded || !isItemInteractable}
          className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
              isAdded ? 'bg-green-600 text-white' : 
              isItemInteractable ? 'bg-stone-800 text-white hover:bg-gold-500 hover:text-stone-950 hover:shadow-[0_10px_20px_rgba(212,175,55,0.2)]' : 
              'bg-stone-950 text-stone-700 cursor-not-allowed border border-stone-800/50'
          }`}
        >
          {isAdded ? <Check size={14} /> : 
           item.isUnavailable ? <Ban size={14} /> : 
           isTimeRestricted ? <Clock size={14} /> :
           <Plus size={14} />}
          <span>
            {isAdded ? 'Added' : 
             item.isUnavailable ? 'Out of Stock' : 
             isTimeRestricted ? 'Soon' :
             'Add to Order'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
