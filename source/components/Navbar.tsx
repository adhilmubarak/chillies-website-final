import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu as MenuIcon, X, Search, Clock, Phone } from 'lucide-react';

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

  const navLinkClass = "text-stone-700 hover:text-brand-400 transition-colors uppercase text-[10px] tracking-[0.2em] relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-brand-400 after:transition-all after:duration-300 hover:after:w-full cursor-pointer font-bold";

  const topClass = hasTicker ? 'top-8' : 'top-0';

  return (
    <nav
      className={`fixed ${topClass} w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-md border-b border-stone-900/5 py-4 shadow-2xl' 
          : 'bg-transparent py-4 md:py-8'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo & Clock */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center group cursor-pointer" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="font-serif text-lg md:text-2xl text-brand-400 font-bold tracking-wider group-hover:text-brand-300 transition-colors uppercase whitespace-nowrap">
              CHILLIES <span className="text-stone-900 hidden sm:inline">RESTAURANT</span>
              <span className="text-brand-500">.</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-stone-50/40 rounded-2xl border border-stone-900/10 backdrop-blur-xl shadow-inner group/clock overflow-hidden relative">
            <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover/clock:opacity-100 transition-opacity duration-700"></div>
            
            <div className="flex items-center gap-2 border-r border-stone-900/10 pr-3">
              <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
              <span className="font-serif italic text-stone-700 text-[11px] whitespace-nowrap">
                {formatDate(currentTime)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock size={10} className="text-brand-500 w-3 h-3" />
              <span className="text-[11px] font-mono font-black text-stone-900 uppercase tracking-wider tabular-nums">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <a 
             href="/source.zip"
             download="source.zip"
             className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white p-2 md:px-4 md:py-2 rounded-xl transition-all shadow-lg shadow-brand-500/20"
             aria-label="Download Source"
          >
             <span className="hidden md:inline uppercase text-[10px] font-black tracking-widest">Download Source</span>
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-4 md:h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </a>
          <button 
             onClick={onOpenTracker}
             className="flex items-center gap-2 bg-stone-50/40 hover:bg-brand-500/10 border border-stone-900/5 md:border-stone-900/10 p-2 md:px-4 md:py-2 rounded-xl transition-all text-stone-700 hover:text-brand-400"
             aria-label="Track Order"
          >
             <Search size={18} className="md:w-4 md:h-4" /> 
             <span className="hidden md:inline uppercase text-[10px] font-black tracking-widest">Track Order</span>
          </button>
          
          <button
            onClick={onOpenCart}
            className={`relative flex items-center gap-2 p-2 md:px-5 md:py-2.5 rounded-full transition-all duration-300 ${
              cartItemCount > 0 
                ? 'bg-brand-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.4)] hover:bg-brand-600 hover:shadow-[0_6px_20px_rgba(249,115,22,0.6)] hover:-translate-y-0.5' 
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 shadow-sm'
            }`}
            aria-label="Open cart"
          >
            <ShoppingBag size={18} className="md:w-5 md:h-5 stroke-[2]" />
            <span className="hidden md:inline uppercase text-[11px] font-bold tracking-widest">
              Cart
            </span>
            {cartItemCount > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 md:static md:ml-1 flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-black rounded-full ${
                cartItemCount > 0 ? 'bg-white text-brand-600 shadow-sm' : 'bg-brand-500 text-white'
              }`}>
                {cartItemCount}
              </span>
            )}
          </button>
          
          <button 
            className="md:hidden bg-stone-50/40 border border-stone-900/5 p-2 rounded-xl text-stone-700 hover:text-brand-400 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <MenuIcon size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden fixed inset-0 z-40 bg-white/98 backdrop-blur-2xl transition-transform duration-500 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full justify-center items-center space-y-8 p-8 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-6 right-6 text-stone-600 hover:text-stone-900 transition-colors"
            >
                <X size={32} />
            </button>
            
            <div className="flex flex-col items-center gap-6 mb-12 relative z-10">
              <span className="font-serif text-3xl text-brand-400 font-bold uppercase text-center tracking-tighter whitespace-nowrap">CHILLIES RESTAURANT.</span>
              
              <div className="flex flex-col items-center bg-stone-900/5 rounded-3xl p-6 border border-stone-900/10 shadow-2xl min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                   <span className="text-[10px] uppercase tracking-[0.3em] font-black text-stone-500">Live Time</span>
                </div>
                <span className="text-4xl font-mono font-black text-stone-900 tabular-nums tracking-wider mb-2">{formatTime(currentTime).split(' ')[0]}</span>
                <span className="text-xs font-serif italic text-brand-400/80">{formatDate(currentTime)}</span>
              </div>
            </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;