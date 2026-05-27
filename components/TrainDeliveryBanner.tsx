import React from 'react';
import { Train, Clock, MapPin, Phone } from 'lucide-react';

const TrainDeliveryBanner: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 mb-6">
      <style>{`
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }
        .animate-subtle-float {
          animation: subtle-float 6s ease-in-out infinite;
        }
        .text-glow-gold {
          text-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
        }
      `}</style>
      
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-stone-900/90 via-[#0c0c0c]/95 to-stone-950/80 border border-brand-500/10 hover:border-brand-500/30 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_40px_rgba(212,175,55,0.02)] group p-6 md:p-10">
        {/* Ambient background glows */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/20 via-transparent to-brand-950/10 pointer-events-none z-0"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[radial-gradient(circle_at_bottom_left,_rgba(212,175,55,0.06)_0%,_transparent_70%)] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left section: Icon + Headings */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 flex items-center justify-center shrink-0 shadow-[0_12px_24px_rgba(212,175,55,0.2)] group-hover:scale-105 transition-transform duration-500 relative animate-subtle-float">
              <div className="absolute inset-0 border border-white/10 rounded-3xl"></div>
              <Train size={28} className="text-stone-950" />
            </div>
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 border border-brand-500/25 rounded-full text-brand-400 text-[9px] font-black uppercase tracking-[0.2em]">
                <MapPin size={10} className="animate-pulse" /> Station Delivery
              </div>
              
              <h2 className="text-white font-serif text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                Train Food Delivery <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-brand-400 to-brand-500 italic font-black text-glow-gold">Alappuzha (ALLP)</span>
              </h2>
              
              <p className="text-stone-400 text-sm max-w-xl font-light leading-relaxed">
                Traveling or passing through Alappuzha Railway Station? Don't settle for pantry food. Order premium, fresh, and delicious hot meals directly to your train coach! 
              </p>
            </div>
          </div>

          {/* Right section: Info / Call to Action */}
          <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="bg-stone-900/60 border border-white/5 px-6 py-4 rounded-2xl flex flex-col justify-center gap-1">
              <span className="text-[9px] text-stone-500 uppercase tracking-widest font-bold">Delivery Hotspot</span>
              <span className="text-xs text-white font-semibold flex items-center gap-1.5">
                <MapPin size={12} className="text-brand-500" /> Platform 1, 2 & 3
              </span>
            </div>

            <a 
              href="tel:+918301032794"
              className="px-8 py-5 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-stone-950 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(212,175,55,0.15)] hover:shadow-[0_15px_35px_rgba(212,175,55,0.3)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Phone size={14} /> Call to Order: +91 83010 32794
            </a>
          </div>
        </div>

        {/* Step Guide / Instructions Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/5">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-stone-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-brand-400 shrink-0">1</div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Pre-order Early</h4>
              <p className="text-stone-500 text-xs font-light leading-relaxed">Place your order at least 30-40 minutes before your train reaches Alappuzha Station.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-stone-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-brand-400 shrink-0">2</div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Provide Coach Details</h4>
              <p className="text-stone-500 text-xs font-light leading-relaxed">Add your Train Number, Coach (e.g., S3, B2), and Seat Number in the checkout notes.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-stone-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-brand-400 shrink-0">3</div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Deliver to Compartment</h4>
              <p className="text-stone-500 text-xs font-light leading-relaxed">Our delivery executive will meet you right at your coach gate on the platform with hot food!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainDeliveryBanner;
