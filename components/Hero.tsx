
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Flame } from 'lucide-react';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const scrollToMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden px-4 bg-stone-950">
      {/* Self-contained styling for rising sparks and particle physics */}
      <style>{`
        @keyframes float-ember {
          0% {
            transform: translateY(105vh) translateX(0) scale(0.9) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-15vh) translateX(120px) scale(0.3) rotate(360deg);
            opacity: 0;
          }
        }
        .ember-particle {
          position: absolute;
          bottom: -50px;
          background: radial-gradient(circle, #f97316 0%, #ef4444 65%, transparent 100%);
          border-radius: 50%;
          pointer-events: none;
          mix-blend-mode: screen;
          animation: float-ember linear infinite;
        }
      `}</style>

      {/* Premium Abstract Background with dynamic embers */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#d4af3715,_transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#d4af3705,_transparent_40%)]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/5 blur-[120px] rounded-full animate-pulse [animation-delay:1s]"></div>
        
        {/* Ambient rising embers */}
        {Array.from({ length: 20 }).map((_, i) => {
          const size = Math.random() * 5 + 3; // size 3px to 8px
          const left = Math.random() * 100; // location across width
          const duration = Math.random() * 12 + 10; // slow drift 10s to 22s
          const delay = Math.random() * -20; // negative delay so they spawn fully distributed immediately
          return (
            <div
              key={i}
              className="ember-particle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                filter: `blur(${Math.random() * 1.5}px)`,
                boxShadow: '0 0 10px #f97316',
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
        {/* Criss-Cross Gold Border Red Text Game Ribbon */}
        <button
          onClick={() => navigate('/scream-challenge')}
          className="relative h-16 w-80 mb-8 flex items-center justify-center scale-90 sm:scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        >
          {/* Crossed Ribbon Left */}
          <div className="absolute rotate-[-6deg] bg-stone-950 border border-gold-500 px-6 py-2 shadow-[0_0_20px_rgba(212,175,55,0.15)] flex items-center gap-1.5 group-hover:border-red-500 transition-colors">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-red-500 font-black tracking-widest text-[9px] uppercase">SCREAM CHALLENGE</span>
          </div>
          {/* Crossed Ribbon Right */}
          <div className="absolute rotate-[6deg] bg-stone-950 border border-gold-500 px-6 py-2 shadow-[0_0_20px_rgba(212,175,55,0.15)] flex items-center gap-1.5 group-hover:border-red-500 transition-colors">
            <Flame size={12} className="text-red-500 animate-pulse" />
            <span className="text-red-500 font-black tracking-widest text-[9px] uppercase">FREE SHAWARMA!</span>
          </div>
        </button>

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
