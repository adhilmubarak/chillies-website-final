
import React, { useState, useEffect } from 'react';
import { Plus, Leaf, Flame, Image as ImageIcon, Check, ChefHat, Clock, Lock, Ban } from 'lucide-react';
import { MenuItem, CartItem } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  index?: number;
  isFlashSaleActive?: boolean;
  isHappyHourActive?: boolean;
  isAvailable?: boolean;
  availabilityTime?: string;
  isStoreOpen?: boolean;
  // Props for Smart Suggestion
  cartItems?: CartItem[];
  allMenuItems?: MenuItem[];
  onShowSuggestion?: (suggestion: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onAdd, 
  index = 0, 
  isFlashSaleActive = false,
  isHappyHourActive = false,
  isAvailable = true,
  availabilityTime,
  isStoreOpen = true,
  cartItems = [],
  allMenuItems = [],
  onShowSuggestion
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Reset image state when image URL changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [item.image]);

  // Determine priority based on index (first 3 items likely above fold on desktop)
  const isPriority = index < 3;

  const checkSmartSuggestion = () => {
    if (!onShowSuggestion || !allMenuItems.length) return;

    let suggestion: MenuItem | undefined;

    // Logic 1: Main Course -> Suggest Fries
    if (item.category === 'Main Course') {
        suggestion = allMenuItems.find(i => i.name.toLowerCase().includes('fries'));
    }
    
    // Logic 2: Starters -> Suggest Drinks
    if (item.category === 'Starters' && !suggestion) {
        suggestion = allMenuItems.find(i => i.category === 'Drinks' && !cartItems.some(ci => ci.id === i.id));
    }

    // Fallback: Suggest Fries if not already adding fries
    if (!suggestion && !item.name.toLowerCase().includes('fries')) {
        suggestion = allMenuItems.find(i => i.name.toLowerCase().includes('fries'));
    }

    // Logic 3: Only suggest if it exists, isn't the item being added, and isn't already in cart
    if (
        suggestion && 
        suggestion.id !== item.id && 
        !cartItems.some(ci => ci.id === suggestion!.id)
    ) {
        onShowSuggestion(suggestion);
    }
  };

  const handleAdd = () => {
    if (!isAvailable || !isStoreOpen || item.isUnavailable) return;
    onAdd(item);
    
    // Trigger Smart Suggestion
    checkSmartSuggestion();

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  // Logic: Flash Sale takes precedence over Happy Hour if both active (edge case)
  const isFlashSale = isFlashSaleActive && item.isFlashSale && item.flashSalePrice;
  const isHappyHour = !isFlashSale && isHappyHourActive && item.isHappyHour && item.happyHourPrice;

  // Format availability time for display
  const formatTime = (time?: string) => {
      if (!time) return '';
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
  };

  const isItemInteractable = isAvailable && isStoreOpen && !item.isUnavailable;

  return (
    <div className={`group relative flex flex-col h-full bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden transition-all duration-500 ${isItemInteractable ? 'hover:shadow-[0_0_40px_-10px_rgba(212,175,55,0.15)] hover:border-gold-500/40 hover:-translate-y-1' : 'opacity-80 grayscale-[0.8]'}`}>
      
      {/* Image Section - Fixed Height for Uniformity */}
      <div className="relative h-72 w-full overflow-hidden bg-stone-850">
        
        {/* Loading Skeleton */}
        {!isLoaded && !hasError && (
            <div className="absolute inset-0 bg-stone-800 animate-pulse z-10 flex items-center justify-center">
                <ImageIcon className="text-stone-700 w-12 h-12 opacity-30" />
            </div>
        )}
        
        {/* Error State */}
        {hasError ? (
             <div className="absolute inset-0 bg-stone-850 z-0 flex flex-col items-center justify-center text-stone-600 gap-2">
                <ImageIcon size={32} className="opacity-50"/>
                <span className="text-[10px] uppercase tracking-widest">Image Unavailable</span>
             </div>
        ) : (
            <img
                src={item.image}
                alt={item.name}
                className={`w-full h-full object-cover transition-transform duration-700 ${isItemInteractable ? 'group-hover:scale-110' : ''} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading={isPriority ? "eager" : "lazy"}
                fetchPriority={isPriority ? "high" : "auto"}
                decoding="async"
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
            />
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-80"></div>
        
        {/* Unavailable/Closed/Sold Out Overlay */}
        {!isItemInteractable && (
            <div className="absolute inset-0 bg-stone-950/70 z-30 flex flex-col items-center justify-center backdrop-blur-[2px]">
                {!isStoreOpen ? (
                    <>
                        <Lock className="text-stone-400 mb-2" size={32} />
                        <span className="text-white font-bold uppercase tracking-widest text-sm">Restaurant Closed</span>
                    </>
                ) : item.isUnavailable ? (
                    <>
                        <Ban className="text-stone-400 mb-2" size={32} />
                        <span className="text-white font-bold uppercase tracking-widest text-sm">Sold Out</span>
                    </>
                ) : (
                    <>
                        <Clock className="text-stone-400 mb-2" size={32} />
                        <span className="text-white font-bold uppercase tracking-widest text-sm">Unavailable Now</span>
                        {availabilityTime && (
                            <span className="text-gold-500 text-xs mt-1 font-bold">Opens at {formatTime(availabilityTime)}</span>
                        )}
                    </>
                )}
            </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
            {item.isChefChoice && (
                <div className="bg-gold-500 text-stone-950 p-2 rounded-full shadow-lg shadow-gold-500/20" title="Chef's Choice">
                    <ChefHat size={14} strokeWidth={2.5} />
                </div>
            )}
            {item.isVegetarian && (
                <div className="bg-stone-950/80 backdrop-blur-md border border-green-500/30 text-green-400 p-2 rounded-full shadow-lg" title="Vegetarian">
                    <Leaf size={14} fill="currentColor" className="opacity-90" />
                </div>
            )}
            {item.isSpicy && (
                <div className="bg-stone-950/80 backdrop-blur-md border border-red-500/30 text-red-400 p-2 rounded-full shadow-lg" title="Spicy">
                    <Flame size={14} fill="currentColor" className="opacity-90" />
                </div>
            )}
        </div>

        {/* Dynamic Tags (Bottom Left) */}
        {item.tags && item.tags.length > 0 && (
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-1 z-20 max-w-[70%]">
                {item.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[10px] uppercase font-bold text-white tracking-wider">
                        {tag}
                    </span>
                ))}
            </div>
        )}

        {/* Price Tag (Floating) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
            {isFlashSale ? (
                <>
                    <div className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg shadow-xl text-lg mb-1 animate-pulse border-2 border-red-400 shadow-red-500/40">
                        ₹{item.flashSalePrice}
                    </div>
                    <div className="bg-black/60 backdrop-blur-md text-stone-300 px-3 py-1 rounded text-sm line-through decoration-stone-400 decoration-1 font-medium">
                        ₹{item.price}
                    </div>
                </>
            ) : isHappyHour ? (
                <>
                    <div className="bg-purple-600 text-white font-bold px-4 py-2 rounded-lg shadow-xl text-lg mb-1 border-2 border-purple-400 shadow-purple-500/40">
                        ₹{item.happyHourPrice}
                    </div>
                    <div className="bg-black/60 backdrop-blur-md text-stone-300 px-3 py-1 rounded text-sm line-through decoration-stone-400 decoration-1 font-medium">
                        ₹{item.price}
                    </div>
                </>
            ) : (
                <div className={`bg-gold-500 text-stone-950 border border-gold-400 font-serif font-bold px-4 py-2 rounded-lg shadow-xl text-lg shadow-gold-500/20 transform transition-transform duration-300 ${isItemInteractable ? 'group-hover:scale-110' : ''}`}>
                    ₹{item.price}
                </div>
            )}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="flex flex-col flex-grow p-6 relative">
        {/* Decorative Divider */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-stone-700 to-transparent group-hover:via-gold-500/50 transition-colors duration-500"></div>

        <div className="mb-4">
            <h3 className={`font-serif text-2xl text-white font-medium leading-tight transition-colors duration-300 ${isItemInteractable ? 'group-hover:text-gold-400' : 'text-stone-400'}`}>
            {item.name}
            </h3>
            {isItemInteractable && (
                <div className="w-12 h-1 bg-gold-500 mt-3 rounded-full opacity-50 group-hover:w-20 transition-all duration-500"></div>
            )}
        </div>
        
        <p className="text-stone-400 text-sm leading-relaxed font-light line-clamp-3 mb-6 flex-grow">
          {item.description}
        </p>
        
        <button
          onClick={handleAdd}
          disabled={isAdded || !isItemInteractable}
          className={`w-full py-3.5 rounded-xl font-bold uppercase text-xs tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 border ${
              !isItemInteractable
              ? 'bg-stone-800 border-stone-800 text-stone-500 cursor-not-allowed'
              : isAdded 
              ? 'bg-green-500 border-green-500 text-white shadow-lg scale-[0.98]' 
              : 'bg-transparent border-stone-700 text-stone-300 hover:border-gold-500 hover:text-gold-400 hover:bg-gold-500/5'
          }`}
        >
          {isAdded ? (
              <>
                <Check size={16} />
                <span>Added</span>
              </>
          ) : !isStoreOpen ? (
              <span>Restaurant Closed</span>
          ) : item.isUnavailable ? (
              <span>Sold Out</span>
          ) : !isAvailable ? (
              <span>Unavailable</span>
          ) : (
              <>
                <Plus size={16} />
                <span>Add to Order</span>
              </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
