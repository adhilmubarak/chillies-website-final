
import React from 'react';
import { ArrowRight, ChevronDown, Flame } from 'lucide-react';

const Hero: React.FC = () => {
  const scrollToMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden px-4 bg-stone-950">
      {/* Premium Abstract Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#d4af3715,_transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#d4af3705,_transparent_40%)]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/5 blur-[120px] rounded-full animate-pulse [animation-delay:1s]"></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
        {/* The Crown Jewel Icon */}
        <div className="mb-12 relative group animate-fade-in-up">
            <div className="absolute inset-0 bg-gold-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-stone-900 border border-gold-500/30 rounded-[2.5rem] flex items-center justify-center text-gold-500 shadow-2xl rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <Flame size={64} fill="currentColor" className="drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] animate-bounce-slow" />
            </div>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-stone-950 shadow-lg animate-bounce">
                <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
        </div>

        <h1 className="animate-fade-in-up [animation-delay:200ms] text-4xl sm:text-6xl md:text-8xl font-serif text-white leading-[1.1] mb-8 tracking-tight">
          Crafting <span className="text-gold-500 italic block sm:inline">Excellence</span> <br className="hidden sm:block" />
          Beyond Ordinary.
        </h1>
        
        <p className="animate-fade-in-up [animation-delay:400ms] text-stone-400 text-sm sm:text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-light mb-12 md:mb-16 px-6 uppercase tracking-[0.2em]">
          Taste the symphony of authentic spices and <br className="hidden md:block"/> premium culinary craftsmanship.
        </p>
        
        <div className="animate-fade-in-up [animation-delay:600ms] w-full sm:w-auto px-8 sm:px-0">
          <a
            href="#menu"
            onClick={scrollToMenu}
            className="group w-full sm:w-auto inline-flex items-center justify-center bg-gold-500 text-stone-950 px-12 py-5 rounded-full font-black tracking-[0.3em] uppercase text-[10px] sm:text-xs transition-all hover:scale-105 active:scale-95 shadow-[0_15px_40px_rgba(212,175,55,0.3)] hover:shadow-[0_20px_50px_rgba(212,175,55,0.4)]"
          >
            Enter the Menu <ArrowRight className="w-4 h-4 ml-3 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      <a 
        href="#menu" 
        onClick={scrollToMenu}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce-slow text-stone-700 hover:text-gold-500 transition-colors"
      >
        <ChevronDown size={32} />
      </a>
    </section>
  );
};

export default Hero;
