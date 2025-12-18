
import React, { useState, useEffect } from 'react';
import { Clock, Moon, Calendar, Phone, Timer, BellRing, Sparkles } from 'lucide-react';

interface StoreStatusAlertProps {
  isStoreOpen: boolean;
  startTime: string;
  endTime: string;
}

const StoreStatusAlert: React.FC<StoreStatusAlertProps> = ({ isStoreOpen, startTime, endTime }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (isStoreOpen) return;

    const calculateTime = () => {
      const now = new Date();
      const [startH, startM] = startTime.split(':').map(Number);
      
      let openingTime = new Date();
      openingTime.setHours(startH, startM, 0, 0);

      if (now > openingTime) {
        openingTime.setDate(openingTime.getDate() + 1);
      }

      const diff = openingTime.getTime() - now.getTime();
      
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      };
    };

    setTimeLeft(calculateTime());
    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);

    return () => clearInterval(timer);
  }, [isStoreOpen, startTime]);

  if (isStoreOpen || !isHydrated) return null;

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
      <div className="bg-stone-950/50 backdrop-blur-md border border-white/10 w-full py-3 md:py-4 rounded-2xl shadow-inner group-hover:border-gold-500/30 transition-colors duration-500">
        <span className="text-2xl md:text-4xl font-mono font-bold text-white tabular-nums tracking-tighter">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-stone-500 font-black mt-2">{label}</span>
    </div>
  );

  return (
    <div className="w-full px-4 md:px-8 mt-16 md:mt-24 animate-fade-in relative z-10">
      <div className="max-w-4xl mx-auto group">
        {/* Glow Effects */}
        <div className="absolute -inset-2 bg-gradient-to-r from-red-900/20 via-gold-500/10 to-red-900/20 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-80 transition duration-1000"></div>
        
        <div className="relative bg-stone-900/40 backdrop-blur-2xl border border-white/5 p-8 md:p-16 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/40 to-transparent"></div>
          <Moon className="absolute -top-10 -right-10 text-gold-500/5 rotate-12 pointer-events-none" size={240} />
          <Sparkles className="absolute bottom-10 left-10 text-gold-500/5 pointer-events-none animate-pulse" size={120} />

          <div className="flex flex-col items-center text-center space-y-8 md:space-y-12 w-full max-w-2xl">
            
            {/* Status Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 bg-stone-950 border border-white/5 px-5 py-2 rounded-full shadow-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                <span className="text-stone-400 uppercase tracking-[0.3em] text-[9px] md:text-[10px] font-black">Kitchen Offline</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight">
                Our Chefs are <br />
                <span className="italic text-gold-400">Perfecting the Menu</span>
              </h2>
              
              <p className="text-stone-400 text-sm md:text-lg font-light leading-relaxed max-w-lg mx-auto">
                We are curating the finest ingredients for our next service. Prepare your palate for an exquisite experience.
              </p>
            </div>

            {/* Countdown Centerpiece */}
            <div className="w-full space-y-6">
                <div className="flex items-center justify-center gap-4 md:gap-8">
                    <TimeUnit value={timeLeft.hours} label="Hours" />
                    <div className="text-gold-500 font-serif text-2xl md:text-4xl pb-6 md:pb-8 animate-pulse">:</div>
                    <TimeUnit value={timeLeft.minutes} label="Minutes" />
                    <div className="text-gold-500 font-serif text-2xl md:text-4xl pb-6 md:pb-8 animate-pulse">:</div>
                    <TimeUnit value={timeLeft.seconds} label="Seconds" />
                </div>
            </div>

            {/* Info Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full border-t border-white/5">
                <div className="flex items-center gap-3 text-stone-300">
                    <Calendar size={16} className="text-gold-500" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Resuming Service at {formatTime(startTime)}</span>
                </div>
                <div className="hidden sm:block w-1.5 h-1.5 bg-stone-700 rounded-full"></div>
                <div className="flex items-center gap-3 text-stone-300">
                    <BellRing size={16} className="text-gold-500" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Daily: 07 AM - 12 PM</span>
                </div>
            </div>

            <button 
                onClick={() => {
                    const el = document.getElementById('menu');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex items-center gap-3 text-gold-500 hover:text-gold-300 transition-all duration-300 text-[10px] md:text-xs uppercase font-black tracking-[0.2em] border-b border-gold-500/20 pb-2 hover:border-gold-400"
            >
                Browse Menu for Later <Timer size={14} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreStatusAlert;
