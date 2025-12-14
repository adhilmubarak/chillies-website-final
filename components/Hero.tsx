import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface HeroProps {}

const Hero: React.FC<HeroProps> = () => {
  const scrollToMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Enhanced Overlay */}
      <div className="absolute inset-0 z-0 select-none">
        <img
          src="https://images.unsplash.com/photo-1514362545857-3bc16549766b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
          alt="Fine Dining Atmosphere"
          className="w-full h-full object-cover scale-105 animate-[pulse_20s_infinite_ease-in-out_alternate]" 
        />
        {/* Gradients for text legibility */}
        <div className="absolute inset-0 bg-stone-950/60"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0c0c0c_120%)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto flex flex-col items-center">
        
        <h1 className="opacity-0 animate-fade-in-up [animation-delay:400ms] text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-[1.1] mb-8 drop-shadow-2xl">
          Always a Class <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 italic pr-2">Above the Ordinary.</span>
        </h1>
        
        <p className="opacity-0 animate-fade-in-up [animation-delay:600ms] text-stone-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light mb-12">
          A symphony of flavors crafted with passion. Order your exclusive dining experience directly via WhatsApp.
        </p>
        
        <div className="opacity-0 animate-fade-in-up [animation-delay:800ms] flex flex-col md:flex-row gap-6">
          <a
            href="#menu"
            onClick={scrollToMenu}
            className="group relative bg-gold-500 text-stone-950 px-10 py-4 rounded-full font-bold tracking-widest uppercase text-xs overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-2">
                View Menu <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <a 
        href="#menu" 
        onClick={scrollToMenu}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-400 hover:text-gold-400 transition-colors animate-bounce-slow cursor-pointer z-20"
      >
        <ChevronDown className="w-6 h-6 opacity-60" />
      </a>
    </section>
  );
};

export default Hero;