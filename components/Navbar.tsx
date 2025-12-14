
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu as MenuIcon, X, Search } from 'lucide-react';

interface NavbarProps {
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenTracker: () => void;
  hasTicker?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ cartItemCount, onOpenCart, onOpenTracker, hasTicker = false }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (id === 'home') {
       window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navLinkClass = "text-stone-300 hover:text-gold-400 transition-colors uppercase text-xs tracking-[0.2em] relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-gold-400 after:transition-all after:duration-300 hover:after:w-full cursor-pointer";

  // Adjust top position based on ticker presence
  const topClass = hasTicker ? 'top-8' : 'top-0';

  return (
    <nav
      className={`fixed ${topClass} w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-stone-950/90 backdrop-blur-md border-b border-white/5 py-4 shadow-2xl' 
          : 'bg-transparent py-4 md:py-8'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center group cursor-pointer" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span className="font-serif text-lg md:text-2xl text-gold-400 font-bold tracking-wider group-hover:text-gold-300 transition-colors uppercase">
            CHILLIES <span className="text-white">RESTAURANT</span>
            <span className="text-gold-500">.</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-10 items-center">
          <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className={navLinkClass}>Home</a>
          <a href="#menu" onClick={(e) => handleNavClick(e, 'menu')} className={navLinkClass}>Menu</a>
          <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className={navLinkClass}>Contact</a>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <button 
             onClick={onOpenTracker}
             className="hidden md:flex items-center gap-2 text-stone-400 hover:text-gold-500 transition-colors text-[10px] uppercase font-bold tracking-widest"
          >
             <Search size={14} /> Track Order
          </button>
          
          <button
            onClick={onOpenCart}
            className="relative p-2 text-stone-300 hover:text-gold-400 transition-colors group"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 stroke-[1.5]" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold-500 text-stone-950 text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full animate-bounce-slow">
                {cartItemCount}
              </span>
            )}
          </button>
          
          <button 
            className="md:hidden text-stone-300 hover:text-gold-400 transition-colors p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden fixed inset-0 z-40 bg-stone-950/95 backdrop-blur-xl transition-transform duration-500 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full justify-center items-center space-y-8 p-8">
            <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-white"
            >
                <X size={32} />
            </button>
            <span className="font-serif text-2xl text-gold-400 font-bold mb-8 uppercase text-center">CHILLIES RESTAURANT.</span>
            <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className="text-xl text-stone-300 hover:text-gold-400 font-serif">Home</a>
            <a href="#menu" onClick={(e) => handleNavClick(e, 'menu')} className="text-xl text-stone-300 hover:text-gold-400 font-serif">Menu</a>
            <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className="text-xl text-stone-300 hover:text-gold-400 font-serif">Contact</a>
            
            <div className="flex flex-col gap-4 w-full max-w-xs pt-8 border-t border-white/5">
                 <button
                    onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenTracker();
                    }}
                    className="flex items-center justify-center gap-2 border border-stone-700 text-stone-300 px-8 py-3 rounded-full transition-all text-sm font-bold uppercase tracking-widest hover:border-gold-500 hover:text-gold-500"
                >
                    <Search size={16} />
                    <span>Track Order</span>
                </button>
            </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
