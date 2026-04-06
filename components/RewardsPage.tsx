import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Search, CheckCircle, Award, Gift, Wifi } from 'lucide-react';
import { LoyaltyAccount } from '../types';

interface RewardsPageProps {
  loyaltyAccounts: LoyaltyAccount[];
  onEnrollLoyalty: (phone: string, name: string) => Promise<void>;
}

const RewardsPage: React.FC<RewardsPageProps> = ({ loyaltyAccounts, onEnrollLoyalty }) => {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [searchedAccount, setSearchedAccount] = useState<LoyaltyAccount | null | undefined>(undefined);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollName, setEnrollName] = useState('');

  const handleCheckBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.length === 10) {
      const account = loyaltyAccounts.find(l => l.phone === phoneInput);
      setSearchedAccount(account || null);
    }
  };

  React.useEffect(() => {
    if (phoneInput.length === 10 && searchedAccount === null) {
      const account = loyaltyAccounts.find(l => l.phone === phoneInput);
      if (account) setSearchedAccount(account);
    }
  }, [loyaltyAccounts, phoneInput, searchedAccount]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans selection:bg-gold-500/30 selection:text-gold-200 relative overflow-hidden">
      {/* Background Effects (Optimized) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-full md:w-[60%] h-[50%] bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.08)_0%,_transparent_60%)]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-full md:w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,_rgba(120,113,108,0.12)_0%,_transparent_60%)]"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-stone-950/80 backdrop-blur-md border-b border-white/5 pb-4 pt-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-stone-900 text-stone-400 hover:text-white rounded-full transition-colors border border-white/5">
            <ArrowLeft size={20} />
          </button>
          <span className="font-serif text-xl md:text-2xl text-gold-400 font-bold tracking-wider uppercase">
            Chillies <span className="text-white">Rewards</span><span className="text-gold-500">.</span>
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-32 px-4 pb-24 relative z-10 flex flex-col md:flex-row gap-12">
        <div className="md:w-1/2 space-y-8 animate-fade-in">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/10 text-gold-500 text-[10px] font-black uppercase tracking-widest rounded-md">
                    <Sparkles size={12} /> Elite Tiers
                </div>
                <h1 className="text-4xl md:text-6xl font-serif text-white leading-tight">
                    Earn Points <br/>
                    <span className="text-stone-500 italic font-light">With Every Bite.</span>
                </h1>
                <p className="text-stone-400 text-sm leading-relaxed max-w-sm">
                    No sign-ups required. Your WhatsApp number is your key. Automatically earn and redeem points on every order.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-stone-900 border border-white/5 p-6 rounded-3xl">
                    <Award size={24} className="text-gold-500 mb-4" />
                    <h3 className="text-white font-bold mb-1">Earn</h3>
                    <p className="text-stone-500 text-xs">1 point for every ₹10 spent on the menu.</p>
                </div>
                <div className="bg-stone-900 border border-white/5 p-6 rounded-3xl">
                    <Gift size={24} className="text-gold-500 mb-4" />
                    <h3 className="text-white font-bold mb-1">Redeem</h3>
                    <p className="text-stone-500 text-xs">₹1 flat discount for every point redeemed.</p>
                </div>
            </div>
        </div>

        <div className="md:w-1/2 mt-8 md:mt-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="bg-stone-900/95 md:bg-stone-900/50 md:backdrop-blur-xl border border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.15)_0%,_transparent_70%)] rounded-full translate-x-12 -translate-y-12"></div>
                
                <h2 className="text-2xl font-serif text-white mb-2">Check Balance</h2>
                <p className="text-stone-400 text-xs mb-8">Enter your registered WhatsApp number</p>

                <form onSubmit={handleCheckBalance} className="space-y-6">
                    <div>
                        <div className="relative">
                            <input 
                                type="tel" 
                                value={phoneInput} 
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setPhoneInput(val);
                                    setSearchedAccount(undefined);
                                    setIsEnrolling(false);
                                }} 
                                placeholder="10-digit number"
                                maxLength={10}
                                className="w-full bg-stone-950 border border-stone-800 rounded-2xl py-5 px-6 text-white focus:outline-none focus:border-gold-500 transition-all text-center text-lg tracking-[0.2em] font-mono shadow-inner font-black"
                            />
                        </div>
                    </div>
                    <button 
                        type="submit"
                        disabled={phoneInput.length !== 10}
                        className="w-full py-5 bg-gold-500 text-stone-950 font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20"
                    >
                        <Search size={16} /> Fetch Points
                    </button>
                </form>

                {searchedAccount !== undefined && (
                    <div className={`mt-8 p-6 rounded-2xl border transition-all animate-fade-in ${searchedAccount ? 'bg-gold-500/10 border-gold-500/30' : 'bg-stone-950/80 border-white/5'}`}>
                        {searchedAccount ? (
                            <div className="flex flex-col items-center gap-8 animate-fade-in">
                                {/* The Premium Card */}
                                <div className="relative w-full max-w-[360px] aspect-[1.586/1] rounded-2xl p-6 md:p-8 border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(212,175,55,0.1)] overflow-hidden group hover:scale-[1.03] hover:-translate-y-2 transition-all duration-500 ease-out">
                                    {/* Card Structural Gradients & Metallic Feel */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-black z-0"></div>
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-500/20 via-transparent to-transparent z-0 opacity-60"></div>
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-stone-500/20 via-transparent to-transparent z-0 opacity-40"></div>
                                    
                                    {/* Delicate Texture Pattern */}
                                    <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
                                    
                                    {/* Card Edge Highlights (Metallic rim) */}
                                    <div className="absolute inset-0 rounded-2xl border-[1.5px] border-transparent bg-gradient-to-br from-gold-500/50 via-white/5 to-white/5 mask-image:linear-gradient(white,white) pointer-events-none z-10" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '1.5px' }}></div>
                                    <div className="absolute top-0 right-0 w-[150%] h-[1px] bg-gradient-to-l from-transparent via-gold-300/80 to-transparent z-10 opacity-70 transform rotate-[-5deg] translate-x-10"></div>
                                    
                                    {/* Card Content */}
                                    <div className="flex flex-col justify-between h-full relative z-20">
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <Award size={28} className="text-gold-400 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" strokeWidth={1.5} />
                                                <span className="font-serif text-2xl text-stone-50 tracking-widest uppercase drop-shadow-lg" style={{textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>Chillies</span>
                                            </div>
                                            <span className="text-[10px] text-stone-900 font-black uppercase tracking-[0.3em] px-3 py-1.5 bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.3)]">Elite</span>
                                        </div>
                                        
                                        {/* Card Number & Chip */}
                                        <div className="mt-6 flex flex-col gap-3 text-left">
                                            <div className="flex items-center gap-4">
                                                {/* Fancy Chip */}
                                                <div className="w-11 h-8 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-600 shadow-[inset_0_1px_3px_rgba(255,255,255,0.5),0_2px_5px_rgba(0,0,0,0.5)] border border-yellow-800/60 relative overflow-hidden">
                                                    <div className="absolute top-[35%] left-0 w-full h-[0.5px] bg-yellow-900/50"></div>
                                                    <div className="absolute top-[65%] left-0 w-full h-[0.5px] bg-yellow-900/50"></div>
                                                    <div className="absolute left-[30%] top-0 w-[0.5px] h-full bg-yellow-900/50"></div>
                                                    <div className="absolute left-[70%] top-0 w-[0.5px] h-full bg-yellow-900/50"></div>
                                                    <div className="absolute w-5 h-4 border-[0.5px] border-yellow-900/40 rounded-[2px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                                </div>
                                                {/* Contactless Symbol */}
                                                <Wifi size={24} className="text-stone-400/80 rotate-90 drop-shadow-md" strokeWidth={1.5} />
                                            </div>
                                            
                                            <div className="font-mono text-xl md:text-2xl mt-1 tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-stone-200 to-stone-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-black">
                                                {searchedAccount.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex justify-between items-end mt-2 pt-1 border-t border-white/5 relative">
                                            <div className="text-left w-1/2 truncate pt-3">
                                                <span className="block text-[7px] text-stone-400/80 uppercase tracking-[0.2em] mb-1 font-medium">Cardholder Name</span>
                                                <span className="text-xs md:text-sm font-black text-stone-200 tracking-[0.1em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate block mr-2">{searchedAccount.customerName || 'Loyal Diner'}</span>
                                            </div>
                                            <div className="text-right pt-2 relative">
                                                <span className="block text-[7px] text-stone-400/80 uppercase tracking-[0.2em] mb-1 font-medium transform translate-y-2">Remaining Points</span>
                                                <span className="font-serif text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-gold-300 via-gold-400 to-gold-600 font-bold drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] leading-none italic">{searchedAccount.points}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Sweeping Interactive Glare */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 z-30 pointer-events-none transform -translate-x-full group-hover:translate-x-full"></div>
                                </div>

                                <div className="text-center w-full max-w-[360px] px-2 flex items-center justify-between gap-4">
                                   <div className="text-left flex-1">
                                        <p className="text-stone-300 text-sm mb-1">Your reward is active.</p>
                                        <p className="text-stone-400 text-xs">Enjoy <strong className="text-gold-400">₹{searchedAccount.points} off</strong> on your next order!</p>
                                   </div>
                                    
                                   <div className="bg-stone-900 border border-white/5 rounded-2xl p-3 shrink-0 flex flex-col items-center group relative overflow-hidden hover:border-gold-500/20 transition-all">
                                        <div className="bg-white p-1.5 rounded-lg mb-2 shadow-lg ring-2 ring-white/5 group-hover:ring-gold-500/20 transition-all">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${searchedAccount.id}&bgcolor=ffffff&color=000000&margin=0`} alt="Loyalty QR" className="w-16 h-16 rounded object-contain" />
                                        </div>
                                        <p className="text-stone-500 text-[8px] uppercase font-black tracking-[0.2em] px-1">Scan to Use</p>
                                   </div>
                                </div>
                            </div>
                        ) : isEnrolling ? (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if(enrollName.trim()) {
                                    await onEnrollLoyalty(phoneInput, enrollName.trim());
                                    setIsEnrolling(false);
                                }
                            }} className="text-center space-y-4 animate-fade-in">
                                <div className="space-y-2 mb-4">
                                    <h3 className="text-white font-serif text-xl">Join Elite Rewards</h3>
                                    <p className="text-stone-400 text-xs">Complete your profile to start earning.</p>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Your Full Name" 
                                    value={enrollName}
                                    onChange={e => setEnrollName(e.target.value)}
                                    required
                                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-gold-500 shadow-inner font-bold text-center"
                                />
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setIsEnrolling(false)} className="w-1/3 py-4 bg-stone-900 border border-white/5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-inner">Cancel</button>
                                    <button type="submit" className="w-2/3 py-4 bg-gold-500 border border-gold-400 text-stone-950 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all hover:bg-gold-400 shadow-[0_0_15px_rgba(212,175,55,0.3)]">Complete Setup</button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center space-y-4 animate-fade-in">
                                <div className="space-y-2">
                                    <span className="block text-stone-500 text-sm">No account found for {phoneInput}.</span>
                                    <p className="text-stone-600 text-[10px] uppercase font-bold tracking-widest">Join the elite tier today to start earning!</p>
                                </div>
                                <button 
                                    onClick={() => setIsEnrolling(true)}
                                    className="px-8 py-4 bg-stone-900 border border-gold-500/30 text-gold-500 hover:bg-gold-500 hover:text-stone-950 transition-all font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                                >
                                    Enroll Now
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default RewardsPage;
