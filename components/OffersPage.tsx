import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, PartyPopper, Star, Sparkles } from 'lucide-react';
import { CustomOffer } from '../types';

interface OffersPageProps {
  isFlashSaleActive: boolean;
  isHappyHourActive: boolean;
  flashSaleEndTime: string;
  happyHourStartTime: string;
  happyHourEndTime: string;
  customOffers: CustomOffer[];
}

const OffersPage: React.FC<OffersPageProps> = ({ 
  isFlashSaleActive, 
  isHappyHourActive,
  flashSaleEndTime,
  happyHourStartTime,
  happyHourEndTime,
  customOffers
}) => {
  const navigate = useNavigate();
  const [selectedOffer, setSelectedOffer] = useState<CustomOffer | null>(null);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours)) return timeStr;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  };

  return (
    <div className="min-h-[100dvh] bg-stone-950 text-stone-200 font-sans flex flex-col relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-stone-900 to-transparent opacity-50"></div>
        <div className="absolute top-1/4 -right-64 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[150px]"></div>
      </div>

      <header className="fixed top-0 w-full z-40 bg-stone-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-stone-900 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-all border border-white/5 shadow-lg active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
             <Star className="w-5 h-5 text-gold-500" />
             <h1 className="text-xl font-serif text-white tracking-widest uppercase">Special Offers</h1>
          </div>
          <div className="w-11"></div> {/* Spacer to center the title */}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pb-24 pt-32 relative z-10 space-y-12 animate-fade-in">
          
        {/* Flash Sale Banner */}
        {isFlashSaleActive && (
          <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 border border-red-500/30 p-8 shadow-[0_0_50px_rgba(220,38,38,0.1)] group">
             <div className="absolute top-0 right-0 p-8 text-red-500/20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
               <Zap size={120} />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div>
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-md mb-4">
                     <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                     Live Now
                   </div>
                   <h2 className="text-3xl font-serif text-white mb-2">Flash Sale Active!</h2>
                   <p className="text-stone-400 max-w-md text-sm leading-relaxed">Exclusive deep discounts on selected premium dishes. Ends promptly at <span className="text-red-400 font-bold">{formatTime(flashSaleEndTime)}</span>.</p>
                </div>
                <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth'}), 100); }} className="bg-red-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:shadow-red-500/30 transition-all hover:-translate-y-1 active:scale-95 whitespace-nowrap">
                   Shop Flash Sale
                </button>
             </div>
          </div>
        )}

        {/* Happy Hour Banner */}
        {isHappyHourActive ? (
          <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 border border-purple-500/30 p-8 shadow-[0_0_50px_rgba(147,51,234,0.1)] group">
             <div className="absolute top-0 right-0 p-8 text-purple-500/20 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 pointer-events-none">
               <PartyPopper size={120} />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div>
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-md mb-4">
                     <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                     Live Now
                   </div>
                   <h2 className="text-3xl font-serif text-white mb-2">Happy Hour Special!</h2>
                   <p className="text-stone-400 max-w-md text-sm leading-relaxed">Unwind with our recurring daily specials, running from <span className="text-purple-400 font-bold">{formatTime(happyHourStartTime)}</span> to <span className="text-purple-400 font-bold">{formatTime(happyHourEndTime)}</span>.</p>
                </div>
                <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth'}), 100); }} className="bg-purple-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1 active:scale-95 whitespace-nowrap">
                   View Specials
                </button>
             </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-900/50 border border-white/5 p-8 group">
             <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div>
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-800 text-stone-500 text-[10px] font-black uppercase tracking-widest rounded-md mb-4">
                     Upcoming
                   </div>
                   <h2 className="text-2xl font-serif text-white/50 mb-2">Happy Hour</h2>
                   <p className="text-stone-600 max-w-sm text-xs leading-relaxed">Join us daily from {formatTime(happyHourStartTime)} to {formatTime(happyHourEndTime)} for exclusive pricing.</p>
                </div>
                <PartyPopper size={40} className="text-stone-700" />
             </div>
          </div>
        )}

        {/* Custom Offers Grid */}
        <div className="space-y-6">
            <h3 className="text-gold-500 font-black uppercase tracking-[0.2em] text-xs">Special Offers</h3>
            
            {customOffers.filter(o => o.isActive).length === 0 ? (
                <div className="bg-stone-900 border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center">
                    <Sparkles className="w-12 h-12 text-stone-700 mb-4" />
                    <p className="text-stone-400 font-bold">No special custom offers right now.</p>
                    <p className="text-stone-600 text-sm mt-2">Check back later for seasonal discounts and exclusive deals!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customOffers.filter(o => o.isActive).map((offer) => (
                        <div key={offer.id} onClick={() => setSelectedOffer(offer)} className="p-6 bg-stone-900 rounded-3xl border border-white/5 flex flex-col justify-between group hover:border-gold-500/30 transition-colors cursor-pointer relative overflow-hidden min-h-[160px]">
                            {offer.image && (
                                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                    <img src={offer.image} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="absolute top-0 left-0 w-2 h-full bg-gold-500 z-10"></div>
                            
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-stone-950 rounded-xl text-gold-500 border border-white/5 backdrop-blur-md">
                                        <Sparkles size={24} />
                                    </div>
                                    <span className="text-stone-500 text-[10px] uppercase font-black tracking-widest bg-stone-950 px-3 py-1 rounded-full border border-white/5 backdrop-blur-md">Featured Offer</span>
                                </div>
                                <div className="mt-auto">
                                    <h4 className="text-white font-serif font-bold text-xl mb-2">{offer.title}</h4>
                                    <p className="text-stone-400 text-sm line-clamp-2">{offer.description}</p>
                                    <p className="text-gold-500 text-[10px] uppercase tracking-widest font-bold mt-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Read More <ArrowLeft className="w-3 h-3 rotate-180" /></p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </main>

      {/* Offer Details Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedOffer(null)}>
          <div className="bg-stone-900 border border-gold-500/20 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            {selectedOffer.image && (
                <div className="w-full h-48 relative">
                    <img src={selectedOffer.image} alt={selectedOffer.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent"></div>
                </div>
            )}
            <button onClick={() => setSelectedOffer(null)} className="absolute top-6 right-6 p-2 bg-stone-950/80 text-stone-400 hover:text-white rounded-full transition-colors z-10"><ArrowLeft className="w-5 h-5 -rotate-90 hidden" /><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
            <div className={`p-8 ${!selectedOffer.image ? 'pt-12' : 'pt-2'}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/20 text-gold-500 text-[10px] font-black uppercase tracking-widest rounded-md mb-6">
                    <Sparkles size={12} /> Featured Offer
                </div>
                <h3 className="text-3xl font-serif text-white mb-4">{selectedOffer.title}</h3>
                <div className="prose prose-invert prose-stone max-w-none">
                    <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedOffer.description}</p>
                </div>
                <div className="mt-10 pt-8 border-t border-white/5 flex gap-4">
                     <button onClick={() => { setSelectedOffer(null); navigate('/'); setTimeout(() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth'}), 100); }} className="flex-1 bg-gold-500 text-stone-950 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gold-400 transition-colors text-center shadow-lg shadow-gold-500/20">
                         Claim Offer
                     </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersPage;
