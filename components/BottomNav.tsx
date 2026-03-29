
import React from 'react';
import { Home, UtensilsCrossed, ShoppingBag, Search, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavProps {
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenTracker: () => void;
  activeSection: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ cartItemCount, onOpenCart, onOpenTracker, activeSection }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (id: string) => {
    if (id === 'offers') {
        navigate('/offers');
        return;
    }
    
    if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else if (id === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        return;
    }

    const el = document.getElementById(id);
    if (el) {
    }
  };

  const navItemClass = (id: string) => `
    flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300
    ${activeSection === id ? 'text-gold-400' : 'text-stone-500'}
  `;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-stone-950/90 backdrop-blur-2xl border-t border-white/5 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around h-16 px-1">
        <button onClick={() => handleNavClick('home')} className={navItemClass('home')}>
          <Home size={18} className={activeSection === 'home' ? 'fill-gold-400/10' : ''} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Home</span>
        </button>

        <button onClick={() => handleNavClick('menu')} className={navItemClass('menu')}>
          <UtensilsCrossed size={18} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Menu</span>
        </button>

        <div className="relative -mt-8">
            <button 
                onClick={onOpenCart}
                className="w-14 h-14 bg-gold-500 rounded-full flex items-center justify-center text-stone-950 shadow-[0_8px_20px_rgba(212,175,55,0.4)] border-4 border-stone-950 active:scale-90 transition-transform"
            >
                <ShoppingBag size={24} />
                {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-stone-950">
                        {cartItemCount}
                    </span>
                )}
            </button>
        </div>

        <button onClick={onOpenTracker} className={navItemClass('track')}>
          <Search size={18} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Track</span>
        </button>

        <button onClick={() => handleNavClick('offers')} className={navItemClass('offers')}>
          <Sparkles size={18} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Offers</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;
