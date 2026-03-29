
import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

const Hero: React.FC = () => {
  const scrollToMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 z-0 select-none">
        <img
          src="https://images.unsplash.com/photo-1514362545857-3bc16549766b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
          alt="Fine Dining"
          className="w-full h-full object-cover scale-105" 
        />
        <div className="absolute inset-0 bg-stone-950/70"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="animate-fade-in-up text-3xl sm:text-5xl md:text-7xl font-serif text-white leading-[1.2] mb-6 md:mb-8">
          Always a Class <br className="hidden sm:block" />
          <span className="text-gold-400 italic">Above the Ordinary.</span>
        </h1>
        
        <p className="animate-fade-in-up [animation-delay:200ms] text-stone-300 text-sm sm:text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-light mb-10 md:mb-12 px-4">
          A symphony of flavors crafted with passion. Order your exclusive dining experience directly via WhatsApp.
        </p>
        
        <div className="animate-fade-in-up [animation-delay:400ms] w-full sm:w-auto px-8 sm:px-0">
          <a
            href="#menu"
            onClick={scrollToMenu}
            className="group w-full sm:w-auto inline-flex items-center justify-center bg-gold-500 text-stone-950 px-10 py-4 rounded-full font-black tracking-[0.2em] uppercase text-[10px] sm:text-xs transition-all hover:scale-105 active:scale-95 shadow-[0_15px_30px_rgba(212,175,55,0.3)]"
          >
            Explore Menu <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      <a 
        href="#menu" 
        onClick={scrollToMenu}
        className="absolute bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow text-stone-500 hover:text-gold-400 transition-colors"
      >
        <ChevronDown size={32} />
      </a>
    </section>
  );
};

export default Hero;
