
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu as MenuIcon, X, Search, Clock, Calendar } from 'lucide-react';

interface NavbarProps {
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenTracker: () => void;
  hasTicker?: boolean;
  currentTime?: Date;
}

const Navbar: React.FC<NavbarProps> = ({ 
  cartItemCount, 
  onOpenCart, 
  onOpenTracker, 
  hasTicker = false,
  currentTime = new Date()
}) => {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const navLinkClass = "text-stone-300 hover:text-gold-400 transition-colors uppercase text-xs tracking-[0.2em] relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-gold-400 after:transition-all after:duration-300 hover:after:w-full cursor-pointer";

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
        {/* Logo & Clock */}
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-8">
          <div className="flex items-center group cursor-pointer" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="font-serif text-lg md:text-2xl text-gold-400 font-bold tracking-wider group-hover:text-gold-300 transition-colors uppercase">
              CHILLIES <span className="text-white">RESTAURANT</span>
              <span className="text-gold-500">.</span>
            </span>
          </div>
          
          {/* Enhanced Premium Live Clock for Desktop */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 bg-stone-900/40 rounded-2xl border border-white/10 backdrop-blur-xl shadow-inner group/clock overflow-hidden relative">
            <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-hover/clock:opacity-100 transition-opacity duration-700"></div>
            
            <div className="flex items-center gap-2 border-r border-white/10 pr-3">
              <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>
              <span className="font-serif italic text-stone-300 text-[11px] whitespace-nowrap">
                {formatDate(currentTime)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-gold-500" />
              <span className="text-[11px] font-mono font-black text-white uppercase tracking-wider tabular-nums">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-10 items-center">
          <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className={navLinkClass}>Home</a>
          <a href="#menu" onClick={(e) => handleNavClick(e, 'menu')} className={navLinkClass}>Menu</a>
          <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className={navLinkClass}>Contact</a>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Tablet Clock View */}
          <div className="hidden md:flex lg:hidden flex-col items-end gap-0.5 text-stone-500 border-r border-white/10 pr-4">
             <span className="text-[9px] font-serif italic text-stone-400 leading-none">{formatDate(currentTime)}</span>
             <span className="text-[11px] font-mono font-bold text-gold-500 leading-none">{formatTime(currentTime).split(' ')[0]}</span>
          </div>

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
      <div className={`md:hidden fixed inset-0 z-40 bg-stone-950/98 backdrop-blur-2xl transition-transform duration-500 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full justify-center items-center space-y-8 p-8 relative">
            {/* Background Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-white transition-colors"
            >
                <X size={32} />
            </button>
            
            <div className="flex flex-col items-center gap-6 mb-12 relative z-10">
              <span className="font-serif text-3xl text-gold-400 font-bold uppercase text-center tracking-tighter">CHILLIES<br/>RESTAURANT.</span>
              
              <div className="flex flex-col items-center bg-white/5 rounded-3xl p-6 border border-white/10 shadow-2xl min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
                   <span className="text-[10px] uppercase tracking-[0.3em] font-black text-stone-500">Live Time</span>
                </div>
                <span className="text-4xl font-mono font-black text-white tabular-nums tracking-wider mb-2">{formatTime(currentTime).split(' ')[0]}</span>
                <span className="text-xs font-serif italic text-gold-400/80">{formatDate(currentTime)}</span>
              </div>
            </div>

            <nav className="flex flex-col items-center space-y-8 relative z-10">
              <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className="text-2xl text-stone-300 hover:text-gold-400 font-serif transition-colors">Home</a>
              <a href="#menu" onClick={(e) => handleNavClick(e, 'menu')} className="text-2xl text-stone-300 hover:text-gold-400 font-serif transition-colors">Menu</a>
              <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className="text-2xl text-stone-300 hover:text-gold-400 font-serif transition-colors">Contact</a>
            </nav>
            
            <div className="flex flex-col gap-4 w-full max-w-xs pt-12 border-t border-white/5 relative z-10">
                 <button
                    onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenTracker();
                    }}
                    className="flex items-center justify-center gap-2 border border-gold-500/30 text-gold-500 px-8 py-4 rounded-full transition-all text-xs font-black uppercase tracking-[0.2em] hover:bg-gold-500 hover:text-stone-950 shadow-lg"
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
