import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Search, CheckCircle, Award, Gift } from 'lucide-react';
import { LoyaltyAccount } from '../types';

interface RewardsPageProps {
  loyaltyAccounts: LoyaltyAccount[];
  onEnrollLoyalty: (phone: string) => Promise<void>;
}

const RewardsPage: React.FC<RewardsPageProps> = ({ loyaltyAccounts, onEnrollLoyalty }) => {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [searchedAccount, setSearchedAccount] = useState<LoyaltyAccount | null | undefined>(undefined);

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
                            <div className="text-center space-y-2">
                                <CheckCircle size={24} className="text-gold-500 mx-auto mb-2" />
                                <span className="block text-stone-400 text-[10px] uppercase font-black tracking-widest">Available Balance</span>
                                <span className="block text-4xl font-serif text-gold-400 font-bold">{searchedAccount.points} <span className="text-xl text-stone-500 font-sans tracking-normal font-medium italic">pts</span></span>
                                <p className="text-stone-300 text-xs pt-2">That's ₹{searchedAccount.points} off your next order!</p>
                                <div className="pt-6 pb-2">
                                    <div className="bg-white p-3 inline-block rounded-2xl shadow-xl">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${searchedAccount.id}&bgcolor=ffffff&color=000000&margin=0`} alt="Loyalty QR" className="w-32 h-32 rounded-lg" />
                                    </div>
                                    <p className="text-stone-500 text-[10px] mt-4 uppercase font-black tracking-widest">Scan at Checkout</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="space-y-2">
                                    <span className="block text-stone-500 text-sm">No account found for {phoneInput}.</span>
                                    <p className="text-stone-600 text-[10px] uppercase font-bold tracking-widest">Join the elite tier today to start earning!</p>
                                </div>
                                <button 
                                    onClick={async () => await onEnrollLoyalty(phoneInput)}
                                    className="px-8 py-4 bg-stone-900 border border-gold-500/30 text-gold-500 hover:bg-gold-500 hover:text-stone-950 transition-all font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg"
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
