import React, { useEffect, useState } from 'react';
import { MenuItem } from '../types';
import { Plus, X, Sparkles, TrendingUp } from 'lucide-react';

interface SmartSuggestionProps {
  suggestion: MenuItem;
  onAdd: (item: MenuItem) => void;
  onClose: () => void;
  isFlashSaleActive?: boolean;
  isHappyHourActive?: boolean;
}

const SmartSuggestion: React.FC<SmartSuggestionProps> = ({ suggestion, onAdd, onClose, isFlashSaleActive = false, isHappyHourActive = false }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay to allow enter animation
    const timer = setTimeout(() => setVisible(true), 100);
    
    // Auto hide after 8 seconds
    const hideTimer = setTimeout(() => {
        handleClose();
    }, 8000);

    return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
    };
  }, [suggestion]);

  const handleClose = () => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
  };

  const handleAdd = () => {
      onAdd(suggestion);
      handleClose();
  };

  // Check for prices respecting priority: Flash Sale > Happy Hour > Regular
  let price = suggestion.price;
  if (isFlashSaleActive && suggestion.isFlashSale && suggestion.flashSalePrice) {
      price = suggestion.flashSalePrice;
  } else if (isHappyHourActive && suggestion.isHappyHour && suggestion.happyHourPrice) {
      price = suggestion.happyHourPrice;
  }

  return (
    <div 
        className={`fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 z-[60] transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
            visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
        }`}
    >
        <div className="bg-stone-50/95 backdrop-blur-xl border border-brand-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-3 flex items-center gap-2 border-b border-stone-900/5">
                <Sparkles className="text-brand-500 w-4 h-4 animate-pulse" />
                <span className="text-xs font-bold text-brand-500 uppercase tracking-widest">Perfect Pairing</span>
                <button 
                    onClick={handleClose} 
                    className="absolute top-3 right-3 text-stone-500 hover:text-stone-900 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="p-4 flex gap-4 items-center">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-stone-900/10 shadow-lg relative group">
                    <img 
                        src={suggestion.image || undefined} 
                        alt={suggestion.name} 
                        className="w-full h-full object-cover"
                    />
                    {/* Tiny overlay for fries hint */}
                    {suggestion.name.toLowerCase().includes('fries') && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrendingUp size={16} className="text-stone-900" />
                        </div>
                    )}
                </div>
                
                <div className="flex-grow min-w-0">
                    <p className="text-[10px] text-stone-600 mb-1">Most people add this with their order:</p>
                    <h4 className="text-stone-900 font-bold text-sm truncate">{suggestion.name}</h4>
                    <span className="text-brand-400 font-serif font-bold">₹{price}</span>
                </div>
            </div>

            <button 
                onClick={handleAdd}
                className="w-full py-3 bg-stone-100 hover:bg-brand-500 hover:text-white text-stone-900 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border-t border-stone-900/5"
            >
                <Plus size={14} /> Add to Order
            </button>
        </div>
    </div>
  );
};

export default SmartSuggestion;