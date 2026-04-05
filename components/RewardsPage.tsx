import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Search, CheckCircle, Award, Gift } from 'lucide-react';
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
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gold-500/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-stone-500/10 rounded-full blur-[120px]"></div>
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
            <div className="bg-stone-900/50 backdrop-blur-xl border border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 blur-[50px] rounded-full"></div>
                
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
                                <div className="relative w-full max-w-[360px] aspect-[1.586/1] rounded-2xl p-6 md:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group hover:scale-[1.02] transition-transform duration-500 ease-out">
                                    {/* Card Background gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-black z-0"></div>
                                    
                                    {/* Geometric/Luxury Accents */}
                                    <div className="absolute top-[-50%] right-[-20%] w-[120%] h-[120%] bg-gradient-to-br from-gold-500/20 to-transparent rounded-full blur-[50px] z-0 pointer-events-none"></div>
                                    <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-tr from-stone-600/30 to-transparent rounded-full blur-[40px] z-0 pointer-events-none"></div>
                                    
                                    {/* Card Edge Highlights */}
                                    <div className="absolute inset-0 border border-white/10 rounded-2xl z-10 pointer-events-none"></div>
                                    <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-gold-500/50 to-transparent z-10"></div>
                                    
                                    {/* Card Content */}
                                    <div className="flex flex-col justify-between h-full relative z-20">
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <Award size={28} className="text-gold-500 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                                                <span className="font-serif text-2xl text-white font-bold tracking-widest uppercase drop-shadow-md">Chillies</span>
                                            </div>
                                            <span className="text-[9px] text-gold-400 font-black uppercase tracking-[0.3em] px-2.5 py-1 bg-stone-950/50 backdrop-blur-md rounded-sm border border-gold-500/20 shadow-inner">Elite Tier</span>
                                        </div>
                                        
                                        {/* Card Number & Chip */}
                                        <div className="mt-6 flex flex-col gap-2 text-left">
                                            <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-100/90 via-yellow-400/90 to-yellow-600/90 shadow-inner border border-yellow-700/50 relative overflow-hidden">
                                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-yellow-800/40"></div>
                                                <div className="absolute left-1/2 top-0 w-[1px] h-full bg-yellow-800/40"></div>
                                                <div className="absolute w-6 h-4 border border-yellow-800/40 rounded-[2px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                                <div className="absolute w-4 h-2 border border-yellow-800/40 rounded-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                            </div>
                                            <div className="font-mono text-xl md:text-2xl mt-1 tracking-[0.25em] text-stone-200 drop-shadow-md font-medium text-shadow font-bold">
                                                {searchedAccount.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex justify-between items-end mt-4 pt-1">
                                            <div className="text-left w-1/2 truncate">
                                                <span className="block text-[8px] text-stone-400 uppercase tracking-widest mb-1">Cardholder</span>
                                                <span className="text-sm md:text-md font-black text-white tracking-[0.1em] uppercase drop-shadow-md truncate block mr-2">{searchedAccount.customerName || 'Loyal Diner'}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[8px] text-stone-400 uppercase tracking-widest mb-1">Points Balance</span>
                                                <span className="font-serif text-3xl text-gold-500 font-bold drop-shadow-[0_0_10px_rgba(212,175,55,0.4)] leading-none">{searchedAccount.points}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Interactive Glare overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-30 mix-blend-overlay pointer-events-none"></div>
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
