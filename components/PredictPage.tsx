import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, increment, getDocs } from 'firebase/firestore';
import { Trophy, Phone, Calendar, Clock, CheckCircle2, XCircle, ChevronRight, Award, ArrowLeft, TrendingUp, Zap, Share2, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PredictPage: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(() => localStorage.getItem('predict_user_phone') || '');
  const [name, setName] = useState(() => localStorage.getItem('predict_user_name') || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [billInput, setBillInput] = useState(() => localStorage.getItem('predict_user_bill') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!phone);
  const [matches, setMatches] = useState<any[]>([]);
  const [userPredictions, setUserPredictions] = useState<Record<string, string>>({}); // matchId -> predictedWinner
  const [leaderboard, setLeaderboard] = useState<{ phone: string; score: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'matches' | 'leaderboard'>('matches');
  const [matchFilter, setMatchFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  
  // Custom interactive prediction selections in memory before confirming: matchId -> selection
  const [selectedPrediction, setSelectedPrediction] = useState<Record<string, 'teamA' | 'teamB' | 'draw'>>({});
  // Track submission progress per matchId
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  // Rules collapse/expand state
  const [rulesOpen, setRulesOpen] = useState(false);
  // Custom toast notification system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Confetti celebration state
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);
  // Track match currently celebrating in popup
  const [celebratingMatch, setCelebratingMatch] = useState<any | null>(null);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load matches
  useEffect(() => {
    const q = query(collection(db, 'worldcup_matches'));
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      // Sort chronologically
      fetched.sort((a, b) => {
        const dateTimeA = new Date(`${a.matchDate}T${a.matchTime || '00:00'}`).getTime();
        const dateTimeB = new Date(`${b.matchDate}T${b.matchTime || '00:00'}`).getTime();
        return dateTimeA - dateTimeB;
      });
      setMatches(fetched);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, []);

  // Load user predictions if logged in
  useEffect(() => {
    if (!isLoggedIn || !phone) return;
    const q = query(collection(db, 'worldcup_predictions'), where('phone', '==', phone));
    const unsub = onSnapshot(q, (snap) => {
      const preds: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        preds[data.matchId] = data.predictedWinner;
      });
      setUserPredictions(preds);
    });
    return () => unsub();
  }, [isLoggedIn, phone]);

  // Compute Leaderboard
  useEffect(() => {
    const computeLeaderboard = async () => {
      try {
        const matchesSnap = await getDocs(query(collection(db, 'worldcup_matches'), where('status', '==', 'finished')));
        const finishedMatches = matchesSnap.docs.map(d => ({ id: d.id, winner: d.data().winner }));
        
        if (finishedMatches.length === 0) {
          setLeaderboard([]);
          return;
        }

        const predsSnap = await getDocs(collection(db, 'worldcup_predictions'));
        const scores: Record<string, number> = {};

        predsSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const match = finishedMatches.find(m => m.id === data.matchId);
          if (match && match.winner === data.predictedWinner) {
            scores[data.phone] = (scores[data.phone] || 0) + 1;
          }
        });

        const sorted = Object.entries(scores)
          .map(([ph, sc]) => ({ phone: ph, score: sc }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Top 10

        setLeaderboard(sorted);
      } catch (e) {
        console.error("Error computing leaderboard:", e);
      }
    };
    computeLeaderboard();
  }, [matches]);

  // Listen for finished matches and check if user predicted correctly to trigger celebration popup
  useEffect(() => {
    if (isLoading || matches.length === 0 || Object.keys(userPredictions).length === 0) return;
    
    const celebratedStr = localStorage.getItem('predict_celebrated_matches') || '[]';
    let celebratedList: string[] = [];
    try {
      celebratedList = JSON.parse(celebratedStr);
    } catch (e) {
      celebratedList = [];
    }

    const uncelebratedCorrectMatch = matches.find(m => {
      if (m.status !== 'finished') return false;
      const pred = userPredictions[m.id];
      if (!pred || pred !== m.winner) return false;
      return !celebratedList.includes(m.id);
    });

    if (uncelebratedCorrectMatch) {
      setCelebratingMatch(uncelebratedCorrectMatch);
      triggerConfetti();
    }
  }, [isLoading, matches, userPredictions]);

  const handleCloseCelebration = () => {
    if (!celebratingMatch) return;
    const celebratedStr = localStorage.getItem('predict_celebrated_matches') || '[]';
    let celebratedList: string[] = [];
    try {
      celebratedList = JSON.parse(celebratedStr);
    } catch (e) {
      celebratedList = [];
    }
    if (!celebratedList.includes(celebratingMatch.id)) {
      celebratedList.push(celebratingMatch.id);
      localStorage.setItem('predict_celebrated_matches', JSON.stringify(celebratedList));
    }
    setCelebratingMatch(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();
    const cleanName = nameInput.trim();

    if (!cleanName) {
      showToast("Please enter your name.", "error");
      return;
    }
    if (cleanPhone.length < 10) {
      showToast("Please enter a 10-digit mobile number.", "error");
      return;
    }

    localStorage.setItem('predict_user_phone', cleanPhone);
    localStorage.setItem('predict_user_name', cleanName);
    setPhone(cleanPhone);
    setName(cleanName);
    setIsLoggedIn(true);
    showToast("Successfully logged into Prediction Center!");
  };

  const handleLogout = () => {
    localStorage.removeItem('predict_user_phone');
    localStorage.removeItem('predict_user_name');
    localStorage.removeItem('predict_user_bill');
    setPhone('');
    setName('');
    setPhoneInput('');
    setNameInput('');
    setBillInput('');
    setIsLoggedIn(false);
    setUserPredictions({});
    setSelectedPrediction({});
    showToast("Signed out of your account.");
  };

  const triggerConfetti = () => {
    const newConfetti = Array.from({ length: 45 }).map((_, i) => ({
      id: Math.random(),
      left: Math.random() * 100, // Left %
      delay: Math.random() * 1.5, // delay seconds
      color: ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#a855f7'][Math.floor(Math.random() * 6)]
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 4000);
  };

  // Modern Two-Step Prediction Confirm
  const handleConfirmPredict = async (matchId: string) => {
    const matchObj = matches.find(m => m.id === matchId);
    if (!matchObj || matchObj.status !== 'live') {
      showToast("Voting is only allowed when match is live!", "error");
      return;
    }

    const selection = selectedPrediction[matchId];
    if (!selection) return;
    if (userPredictions[matchId]) return;

    setIsSubmitting(prev => ({ ...prev, [matchId]: true }));

    try {
      const cleanBill = billInput.trim();
      if (!cleanBill) {
        showToast("Please enter a valid bill number to lock vote.", "error");
        setIsSubmitting(prev => ({ ...prev, [matchId]: false }));
        return;
      }

      // Validate the bill number against orders and whitelisted bills
      let isValidBill = false;
      try {
        // 1. Check orders collection where 'id' field matches the bill number
        const ordersQuery = query(collection(db, 'orders'), where('id', '==', cleanBill));
        const ordersSnap = await getDocs(ordersQuery);
        if (!ordersSnap.empty) {
          isValidBill = true;
        } else {
          // 2. Check worldcup_valid_bills manual whitelist collection
          const validBillsQuery = query(collection(db, 'worldcup_valid_bills'), where('billNumber', '==', cleanBill));
          const validBillsSnap = await getDocs(validBillsQuery);
          if (!validBillsSnap.empty) {
            isValidBill = true;
          }
        }
      } catch (err) {
        console.error("Error validating bill number:", err);
      }

      if (!isValidBill) {
        showToast("Please enter a valid bill number to lock vote.", "error");
        setIsSubmitting(prev => ({ ...prev, [matchId]: false }));
        return;
      }

      // Check if this bill number has already voted on this match
      const billCheckQuery = query(
        collection(db, 'worldcup_predictions'),
        where('matchId', '==', matchId),
        where('billNumber', '==', cleanBill)
      );
      const billCheckSnap = await getDocs(billCheckQuery);
      if (!billCheckSnap.empty) {
        showToast("This bill number has already been used to vote on this match.", "error");
        setIsSubmitting(prev => ({ ...prev, [matchId]: false }));
        return;
      }

      // 1. Add prediction doc
      await addDoc(collection(db, 'worldcup_predictions'), {
        matchId,
        phone,
        name,
        billNumber: cleanBill,
        predictedWinner: selection,
        createdAt: Date.now()
      });

      // 2. Increment match votes count
      const matchRef = doc(db, 'worldcup_matches', matchId);
      const incrementField = selection === 'teamA' ? 'votesTeamA' : selection === 'teamB' ? 'votesTeamB' : 'votesDraw';
      await updateDoc(matchRef, {
        [incrementField]: increment(1)
      });

      // Save to localStorage
      localStorage.setItem('predict_user_bill', cleanBill);
      
      showToast("Prediction submitted successfully!");
    } catch (e) {
      console.error("Prediction error:", e);
      showToast("Failed to submit prediction.", "error");
    } finally {
      setIsSubmitting(prev => ({ ...prev, [matchId]: false }));
    }
  };

  // WhatsApp Prediction Share
  const sharePrediction = (match: any, prediction: string) => {
    const predStr = prediction === 'teamA' ? match.teamA : prediction === 'teamB' ? match.teamB : 'a Draw';
    const flagStr = prediction === 'teamA' ? (match.teamAFlag || '🏳️') : prediction === 'teamB' ? (match.teamBFlag || '🏳️') : '🤝';
    const text = `I just predicted ${flagStr} ${predStr} to win in the Chillies FIFA World Cup Predictor! 🏆 Predict matches, climb the leaderboard, and win free Shawarmas! 🌯 Challenge my prediction here: https://chilliesrestaurant.in/predict`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const maskPhone = (ph: string) => {
    if (!ph) return '';
    // If it's a bill number (numeric string under 10 digits)
    const isBill = /^\d+$/.test(ph) && ph.length < 10;
    if (isBill) {
      return `Bill #${ph}`;
    }
    if (ph.length < 4) return ph;
    return `${ph.slice(0, 2)}*****${ph.slice(-3)}`;
  };

  const getVotePercentages = (match: any) => {
    const vA = match.votesTeamA || 0;
    const vB = match.votesTeamB || 0;
    const vD = match.votesDraw || 0;
    const total = vA + vB + vD;
    if (total === 0) return { a: 33, b: 33, d: 34 };
    return {
      a: Math.round((vA / total) * 100),
      b: Math.round((vB / total) * 100),
      d: Math.round((vD / total) * 100)
    };
  };

  const getRelativeTimeStr = (matchDate: string, matchTime: string) => {
    const now = new Date();
    const kickoff = new Date(`${matchDate}T${matchTime || '00:00'}`);
    const diffMs = kickoff.getTime() - now.getTime();
    
    if (diffMs < 0) return '';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Starts in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    } else if (diffHours > 0) {
      return `Starts in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `Starts in ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`;
    }
  };

  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Real-time calculated stats
  const predictionsCount = Object.keys(userPredictions).length;
  const correctCount = matches.reduce((acc, m) => {
    if (m.status === 'finished' && userPredictions[m.id] === m.winner) return acc + 1;
    return acc;
  }, 0);
  const userRankIndex = leaderboard.findIndex(u => u.phone === phone);
  const userRank = userRankIndex !== -1 ? `#${userRankIndex + 1}` : 'unranked';

  // Filtered matches
  const filteredMatches = matches.filter(match => {
    if (matchFilter === 'all') return true;
    if (matchFilter === 'live') return match.status === 'live';
    if (matchFilter === 'upcoming') return match.status === 'upcoming';
    if (matchFilter === 'completed') return match.status === 'finished';
    return true;
  });

  // Podium computation for top 3
  const topThree = leaderboard.slice(0, 3);
  const remainingLeaderboard = leaderboard.slice(3);

  // Dynamic podium ordering (2nd on left, 1st in center, 3rd on right)
  const podiumList = [];
  if (topThree.length > 1) podiumList.push({ ...topThree[1], index: 1 }); // 2nd Place
  if (topThree.length > 0) podiumList.push({ ...topThree[0], index: 0 }); // 1st Place
  if (topThree.length > 2) podiumList.push({ ...topThree[2], index: 2 }); // 3rd Place

  return (
    <div className="relative min-h-screen font-sans text-stone-200 overflow-x-hidden bg-stone-950 pb-24">
      {/* CSS Keyframes injected for premium visual micro-animations */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall 3.8s linear forwards;
        }
        .text-glow-gold {
          text-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
        }
        .text-glow-emerald {
          text-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        }
        .text-glow-ruby {
          text-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
        }
        .shadow-glow-gold {
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.1);
        }
        .shadow-glow-live {
          box-shadow: 0 0 35px rgba(239, 68, 68, 0.12);
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
      `}</style>

      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] px-6 py-4 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center gap-3 animate-fade-in-up ${
          toast.type === 'success' 
            ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-400 shadow-[0_15px_40px_rgba(16,185,129,0.2)]'
            : 'bg-red-950/85 border-red-500/30 text-red-400 shadow-[0_15px_40px_rgba(239,68,68,0.2)]'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} className="animate-bounce" /> : <XCircle size={16} />}
          <span className="text-xs font-black uppercase tracking-widest font-sans">{toast.message}</span>
        </div>
      )}

      {/* Confetti Container */}
      {confetti.map(c => (
        <div 
          key={c.id} 
          style={{ 
            left: `${c.left}%`, 
            animationDelay: `${c.delay}s`, 
            backgroundColor: c.color 
          }}
          className="fixed -top-10 w-3 h-3 rounded-sm pointer-events-none z-[9999] animate-confetti"
        />
      ))}

      {/* Decorative soccer-themed background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-[#0c0c0c] to-stone-950/90 pointer-events-none z-0"></div>
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.06)_0%,_transparent_70%)] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-[radial-gradient(circle_at_bottom_left,_rgba(212,175,55,0.05)_0%,_transparent_70%)] rounded-full pointer-events-none"></div>

      {/* Floating Ambient Stadium Glows */}
      <div className="absolute top-1/4 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-gold-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 relative z-10">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-stone-500 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em] mb-8 bg-stone-900/40 px-5 py-3 rounded-xl border border-white/5 hover:border-gold-500/30 shadow-inner group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Chillies
        </button>

        {/* Header Block */}
        <div className="text-center space-y-4 mb-12">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-gold-500 to-amber-600 flex items-center justify-center mx-auto shadow-[0_15px_40px_rgba(212,175,55,0.25)] relative group animate-bounce-slow">
            <div className="absolute inset-0 border border-white/20 rounded-full"></div>
            <Trophy size={42} className="text-stone-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-white text-3xl md:text-5xl font-serif leading-none tracking-tight">
              FIFA World Cup <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-gold-400 to-amber-500 italic font-black text-glow-gold">Predictor</span>
            </h1>
            <p className="text-stone-500 text-xs md:text-sm uppercase tracking-[0.25em] font-black mt-2">Predict matches. Climb the Leaderboard. Win Premium Rewards.</p>
          </div>
        </div>

        {/* Login Prompt or Predict Panel */}
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto bg-stone-900/80 border border-white/5 rounded-[2.5rem] p-10 text-center shadow-2xl relative shadow-glow-gold">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="w-16 h-16 bg-stone-950 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Phone className="text-gold-500" size={24} />
            </div>
            <h3 className="text-xl font-serif text-white mb-2">Unlocking Predictions</h3>
            <p className="text-stone-500 text-xs leading-relaxed mb-8">Enter your mobile number to vote on World Cup matches. Stand a chance to top our scoreboard and win free shawarmas & discounts!</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="text" 
                placeholder="Enter Your Full Name" 
                value={nameInput} 
                onChange={e => setNameInput(e.target.value)} 
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-center text-white focus:outline-none focus:border-gold-500 tracking-wide text-sm shadow-inner transition-colors"
                required
              />
              <input 
                type="tel" 
                placeholder="Enter 10-Digit Mobile Number" 
                value={phoneInput} 
                onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-center text-white focus:outline-none focus:border-gold-500 tracking-wider font-mono text-sm shadow-inner transition-colors"
                required
              />
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-amber-600 via-gold-500 to-amber-600 text-stone-950 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-gold-500/10 hover:shadow-gold-500/25 active:scale-95 transition-all"
              >
                Enter Match Center
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* User welcome bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-stone-900/50 border border-white/5 rounded-3xl p-5 sm:px-8 gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span className="text-xs uppercase tracking-widest font-black text-stone-300">Welcome, <span className="text-gold-400 text-glow-gold font-serif capitalize">{name || 'Predictor'}</span>! <span className="text-stone-500 font-sans normal-case ml-2">(Account: {maskPhone(phone)})</span></span>
              </div>
              <button onClick={handleLogout} className="text-stone-500 hover:text-white uppercase tracking-widest text-[9px] font-black transition-colors bg-stone-950/40 border border-white/5 hover:border-red-500/20 px-4 py-2 rounded-xl">Sign Out</button>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-stone-900/80 border border-white/5 rounded-3xl p-5 text-center shadow-lg relative overflow-hidden flex flex-col justify-center gap-1 group">
                <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <Trophy size={18} className="text-gold-500 mx-auto mb-1 animate-pulse" />
                <span className="text-[8px] text-stone-500 uppercase tracking-widest font-black block">Your Score</span>
                <span className="text-xl sm:text-2xl font-serif text-white font-black text-glow-gold leading-none">{correctCount}</span>
                <span className="text-[7px] text-stone-600 font-bold uppercase tracking-widest">Points</span>
              </div>
              <div className="bg-stone-900/80 border border-white/5 rounded-3xl p-5 text-center shadow-lg relative overflow-hidden flex flex-col justify-center gap-1 group">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <TrendingUp size={18} className="text-emerald-400 mx-auto mb-1" />
                <span className="text-[8px] text-stone-500 uppercase tracking-widest font-black block">Predictions</span>
                <span className="text-xl sm:text-2xl font-serif text-white font-black text-glow-emerald leading-none">{predictionsCount}</span>
                <span className="text-[7px] text-stone-600 font-bold uppercase tracking-widest">Submitted</span>
              </div>
              <div className="bg-stone-900/80 border border-white/5 rounded-3xl p-5 text-center shadow-lg relative overflow-hidden flex flex-col justify-center gap-1 group">
                <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <Award size={18} className="text-amber-500 mx-auto mb-1" />
                <span className="text-[8px] text-stone-500 uppercase tracking-widest font-black block">Global Rank</span>
                <span className="text-xl sm:text-2xl font-serif text-white font-black text-glow-gold leading-none uppercase">{userRank}</span>
                <span className="text-[7px] text-stone-600 font-bold uppercase tracking-widest">Scoreboard</span>
              </div>
            </div>

            {/* Rules Accordion */}
            <div className="bg-stone-900/40 border border-white/5 rounded-3xl overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setRulesOpen(!rulesOpen)}
                className="w-full px-6 py-4 flex justify-between items-center text-stone-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2 text-xs uppercase tracking-widest font-black">
                  <Sparkles size={14} className="text-gold-500 animate-pulse" /> Game Rules & Exclusive Prizes
                </span>
                <ChevronRight size={16} className={`text-stone-500 transition-transform duration-300 ${rulesOpen ? 'rotate-90' : ''}`} />
              </button>
              {rulesOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-stone-800/40 text-xs text-stone-400 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-stone-950/40 rounded-2xl border border-white/5 space-y-1">
                      <div className="text-gold-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Zap size={12} /> 1. Cast Your Prediction
                      </div>
                      <p className="text-stone-500 leading-relaxed font-sans">Pick Team A, Team B, or a Draw for any upcoming fixture. Predictions are securely locked once the match kicks off!</p>
                    </div>
                    <div className="p-4 bg-stone-950/40 rounded-2xl border border-white/5 space-y-1">
                      <div className="text-gold-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Trophy size={12} /> 2. Gain Championship Points
                      </div>
                      <p className="text-stone-500 leading-relaxed font-sans">Earn 1 point for every correct match prediction. Stats are calculated in real-time as results are verified.</p>
                    </div>
                    <div className="p-4 bg-stone-950/40 rounded-2xl border border-white/5 space-y-1">
                      <div className="text-gold-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Award size={12} /> 3. Claim Free Food Vouchers
                      </div>
                      <p className="text-stone-500 leading-relaxed font-sans">Climb ranks to secure rewards: free shawarmas, flat order discounts, and double loyalty loyalty-point multipliers!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center border-b border-stone-900 pb-1">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveSubTab('matches')}
                  className={`pb-4 px-6 text-xs uppercase tracking-widest font-black border-b-2 transition-all ${activeSubTab === 'matches' ? 'border-gold-500 text-white' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
                >
                  World Cup Matches
                </button>
                <button 
                  onClick={() => setActiveSubTab('leaderboard')}
                  className={`pb-4 px-6 text-xs uppercase tracking-widest font-black border-b-2 transition-all ${activeSubTab === 'leaderboard' ? 'border-gold-500 text-white' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
                >
                  Leaderboard
                </button>
              </div>
            </div>

            {activeSubTab === 'matches' ? (
              <div className="space-y-6">
                {/* Match Sub-Filters */}
                <div className="flex flex-wrap gap-2 justify-center pb-2">
                  {[
                    { id: 'all', label: 'All Matches' },
                    { id: 'live', label: 'Live 🔥' },
                    { id: 'upcoming', label: 'Upcoming ⏳' },
                    { id: 'completed', label: 'Completed 🏁' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setMatchFilter(tab.id as any)}
                      className={`px-5 py-2.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${matchFilter === tab.id ? 'bg-gold-500 text-stone-950 border-gold-500 shadow-md font-bold' : 'border-white/5 bg-stone-900/40 text-stone-400 hover:text-white'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="text-center py-12 text-stone-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Matches...</div>
                ) : filteredMatches.length === 0 ? (
                  <div className="text-center py-16 text-stone-600 bg-stone-900/30 border border-white/5 rounded-[2.5rem] p-10 italic">No matches match this filter currently. Check back later!</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredMatches.map(match => {
                      const userPred = userPredictions[match.id];
                      const percentages = getVotePercentages(match);
                      const isUpcoming = match.status === 'upcoming';
                      const isLive = match.status === 'live';
                      const isFinished = match.status === 'finished';
                      const isVoteOpen = isLive;
                      
                      const selectedVal = selectedPrediction[match.id];
                      const confirmPanelActive = isVoteOpen && selectedVal && !userPred;
                      const loadingSubmit = isSubmitting[match.id];
                      const countdownText = isUpcoming ? getRelativeTimeStr(match.matchDate, match.matchTime) : '';

                      return (
                        <div key={match.id} className={`bg-stone-900/60 border ${isLive ? 'border-red-500/25 shadow-glow-live' : 'border-white/5'} rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between transition-all duration-500 hover:border-gold-500/20 group`}>
                          <div>
                            {/* Match Header Info */}
                            <div className="flex justify-between items-center mb-6">
                              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} className="text-gold-500" /> {match.matchDate}
                                <span className="text-stone-700">|</span>
                                <Clock size={12} className="text-gold-500" /> {match.matchTime}
                              </span>
                              {isLive ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-950 text-red-400 border border-red-800/30 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.25)]">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Live Now
                                </span>
                              ) : isFinished ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-800/30">
                                  Finished
                                </span>
                              ) : (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-stone-800/70 text-stone-400 border border-stone-700/30">
                                    Upcoming
                                  </span>
                                  {countdownText && (
                                    <span className="text-[8px] text-gold-500 font-mono tracking-wider text-glow-gold mt-1">{countdownText}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Teams Grid Representation */}
                            <div className="flex items-center justify-around gap-4 text-center my-6">
                              {/* Team A */}
                              <div className="flex flex-col items-center gap-3.5 flex-1 min-w-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-stone-950 border border-white/5 hover:border-gold-500/30 shadow-2xl flex items-center justify-center relative transition-all duration-500 overflow-hidden group-hover:scale-105">
                                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.04)_0%,_transparent_70%)]"></div>
                                  <span className="text-4xl select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:rotate-6">
                                    {match.teamAFlag || '🏳️'}
                                  </span>
                                </div>
                                <span className="text-white text-xs sm:text-sm font-serif font-black uppercase tracking-wider line-clamp-1">{match.teamA}</span>
                              </div>
                              
                              <div className="text-stone-700 font-sans italic text-sm font-light shrink-0">VS</div>
                              
                              {/* Team B */}
                              <div className="flex flex-col items-center gap-3.5 flex-1 min-w-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-stone-950 border border-white/5 hover:border-gold-500/30 shadow-2xl flex items-center justify-center relative transition-all duration-500 overflow-hidden group-hover:scale-105">
                                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.04)_0%,_transparent_70%)]"></div>
                                  <span className="text-4xl select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:-rotate-6">
                                    {match.teamBFlag || '🏳️'}
                                  </span>
                                </div>
                                 <span className="text-white text-xs sm:text-sm font-serif font-black uppercase tracking-wider line-clamp-1">{match.teamB}</span>
                              </div>
                            </div>
                          </div>

                          {isFinished && (
                            <div className="mt-6 p-6 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border border-gold-500/30 rounded-[2rem] text-center shadow-2xl relative overflow-hidden group/winner shadow-glow-gold">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl pointer-events-none group-hover/winner:bg-gold-500/15 transition-all duration-700"></div>
                              
                              <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Sparkles size={12} className="text-gold-400 animate-pulse" />
                                  <span className="text-[9px] text-gold-500 uppercase tracking-[0.25em] font-black text-glow-gold">Match Champion</span>
                                  <Sparkles size={12} className="text-gold-400 animate-pulse" />
                                </div>
                                
                                <div className="flex items-center justify-center gap-3 mt-1 select-none">
                                  {match.winner === 'teamA' && (
                                    <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform -rotate-12 transition-transform duration-500 group-hover/winner:rotate-0">
                                      {match.teamAFlag || '🏳️'}
                                    </span>
                                  )}
                                  {match.winner === 'teamB' && (
                                    <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform rotate-12 transition-transform duration-500 group-hover/winner:rotate-0">
                                      {match.teamBFlag || '🏳️'}
                                    </span>
                                  )}
                                  
                                  <h4 className="text-xl sm:text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-gold-400 to-amber-200 italic font-black uppercase tracking-wide text-glow-gold leading-none">
                                    {match.winner === 'teamA' ? match.teamA : match.winner === 'teamB' ? match.teamB : 'Draw Fixture'}
                                  </h4>
                                  
                                  {match.winner === 'draw' && (
                                    <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">🤝</span>
                                  )}
                                </div>
                                
                                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-[9px] font-black uppercase tracking-widest text-gold-400 text-glow-gold">
                                  <Trophy size={10} className="animate-bounce" />
                                  {match.winner === 'draw' ? 'No Winner Declared' : 'Official Winner'}
                                </div>

                                {/* Lucky Draw Winner Block */}
                                {match.luckyWinnerPhone && (
                                  <div className="mt-4 pt-4 border-t border-stone-850 w-full flex flex-col items-center gap-1.5 animate-fade-in">
                                    <span className="text-[8px] text-stone-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                                      <span>🎁 Lucky Draw Winner</span>
                                    </span>
                                    <span className="text-xs font-black text-white tracking-wide font-serif capitalize text-glow-gold">
                                      {match.luckyWinnerName && !match.luckyWinnerName.startsWith('Voter #')
                                        ? match.luckyWinnerName 
                                        : `Voter (${maskPhone(match.luckyWinnerPhone)})`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Prediction Controls Section */}
                          <div className="mt-6 pt-6 border-t border-stone-900/60 space-y-4">
                            {isVoteOpen && !userPred && (
                              <div className="space-y-3">
                                <p className="text-[9px] text-stone-500 uppercase tracking-widest font-black text-center mb-2">Predict Match Outcome</p>
                                <div className="grid grid-cols-3 gap-2">
                                  <button 
                                    onClick={() => setSelectedPrediction(p => ({ ...p, [match.id]: 'teamA' }))}
                                    className={`border rounded-xl p-3.5 transition-all text-[9px] font-black uppercase tracking-widest active:scale-95 whitespace-nowrap overflow-hidden text-ellipsis ${
                                      selectedVal === 'teamA' 
                                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-98' 
                                        : 'bg-stone-950 border-white/5 text-stone-400 hover:border-stone-700 hover:text-white'
                                    }`}
                                  >
                                    {match.teamA}
                                  </button>
                                  <button 
                                    onClick={() => setSelectedPrediction(p => ({ ...p, [match.id]: 'draw' }))}
                                    className={`border rounded-xl p-3.5 transition-all text-[9px] font-black uppercase tracking-widest active:scale-95 ${
                                      selectedVal === 'draw' 
                                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-98' 
                                        : 'bg-stone-950 border-white/5 text-stone-400 hover:border-stone-700 hover:text-white'
                                    }`}
                                  >
                                    Draw
                                  </button>
                                  <button 
                                    onClick={() => setSelectedPrediction(p => ({ ...p, [match.id]: 'teamB' }))}
                                    className={`border rounded-xl p-3.5 transition-all text-[9px] font-black uppercase tracking-widest active:scale-95 whitespace-nowrap overflow-hidden text-ellipsis ${
                                      selectedVal === 'teamB' 
                                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-98' 
                                        : 'bg-stone-950 border-white/5 text-stone-400 hover:border-stone-700 hover:text-white'
                                    }`}
                                  >
                                    {match.teamB}
                                  </button>
                                </div>

                                {/* Step 2 Interactive Confirmation Panel */}
                                {confirmPanelActive && (
                                  <div className="bg-gradient-to-r from-stone-950 to-stone-900 border border-gold-500/20 rounded-2xl p-5 flex flex-col gap-4 animate-fade-in-up mt-3">
                                    <div className="flex items-center justify-between border-b border-stone-850 pb-3">
                                      <div className="flex items-center gap-2">
                                        <Zap size={14} className="text-gold-400 animate-bounce" />
                                        <span className="text-[10px] text-stone-300 uppercase tracking-widest font-black">
                                          Confirm prediction: {selectedVal === 'teamA' ? match.teamA : selectedVal === 'teamB' ? match.teamB : 'Draw'}? 🎯
                                        </span>
                                      </div>
                                      <button 
                                        onClick={() => setSelectedPrediction(p => {
                                          const copy = { ...p };
                                          delete copy[match.id];
                                          return copy;
                                        })}
                                        className="text-[9px] text-stone-500 hover:text-red-400 uppercase font-black tracking-wider transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                      <div className="w-full sm:flex-1 relative">
                                        <input 
                                          type="number"
                                          placeholder="Enter Bill Number"
                                          value={billInput}
                                          onChange={e => setBillInput(e.target.value)}
                                          className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3.5 pl-4 text-white focus:outline-none focus:border-gold-500 tracking-wide font-mono text-xs shadow-inner"
                                          required
                                        />
                                      </div>
                                      <button 
                                        onClick={() => handleConfirmPredict(match.id)}
                                        disabled={loadingSubmit}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-4 bg-gradient-to-r from-amber-600 via-gold-500 to-amber-600 text-stone-950 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
                                      >
                                        {loadingSubmit ? (
                                          <Loader2 size={12} className="animate-spin text-stone-950" />
                                        ) : (
                                          <span>Lock Prediction ⚡</span>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {!isVoteOpen && !userPred && (
                              <div className="p-4 bg-stone-950/40 rounded-2xl border border-white/5 text-center space-y-1 mb-2">
                                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black flex items-center justify-center gap-1.5">
                                  <span>🔒 {isUpcoming ? 'Predictions Not Started Yet' : 'Match Ended - Predictions Locked'}</span>
                                </p>
                                <p className="text-[9px] text-gold-500 font-mono tracking-wider">
                                  {isUpcoming ? 'Voting opens as soon as the match is LIVE!' : 'Predictions are closed for this fixture.'}
                                </p>
                              </div>
                            )}

                            {(userPred || !isVoteOpen) && (
                              <div className="space-y-4 animate-fade-in">
                                {/* Aggregated Vote Breakdown percentages */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[9px] text-stone-500 font-bold uppercase tracking-widest">
                                    <span>Community Votes</span>
                                    <span className="text-gold-400 font-bold">Total: {(match.votesTeamA || 0) + (match.votesDraw || 0) + (match.votesTeamB || 0)}</span>
                                  </div>
                                  
                                  {/* Custom Colorful Votes Progress Bar */}
                                  <div className="h-3 rounded-full bg-stone-950 overflow-hidden flex shadow-inner border border-white/5">
                                    <div style={{ flexGrow: percentages.a, flexBasis: 0 }} className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-1000" title={`${match.teamA}: ${percentages.a}%`}></div>
                                    <div style={{ flexGrow: percentages.d, flexBasis: 0 }} className="bg-stone-700 h-full transition-all duration-1000" title={`Draw: ${percentages.d}%`}></div>
                                    <div style={{ flexGrow: percentages.b, flexBasis: 0 }} className="bg-gradient-to-r from-gold-500 to-amber-500 h-full transition-all duration-1000" title={`${match.teamB}: ${percentages.b}%`}></div>
                                  </div>
                                  <div className="flex justify-between text-[9px] font-mono font-bold">
                                    <span className="text-emerald-400">{match.teamA}: {percentages.a}%</span>
                                    <span className="text-stone-500">Draw: {percentages.d}%</span>
                                    <span className="text-gold-400">{match.teamB}: {percentages.b}%</span>
                                  </div>
                                </div>

                                {/* Selection Status Message */}
                                {userPred && (
                                  (() => {
                                    const isDrawPred = userPred === 'draw';
                                    const isTeamAPred = userPred === 'teamA';
                                    const predName = isTeamAPred ? match.teamA : userPred === 'teamB' ? match.teamB : 'Draw Match';
                                    const predFlag = isTeamAPred ? (match.teamAFlag || '🏳️') : userPred === 'teamB' ? (match.teamBFlag || '🏳️') : '🤝';
                                    
                                    const borderClass = isDrawPred ? 'border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]';
                                    const gradientClass = isDrawPred ? 'from-stone-950 via-amber-950/10 to-stone-950' : 'from-stone-950 via-emerald-950/10 to-stone-950';
                                    const glowTextClass = isDrawPred ? 'text-amber-400 text-glow-gold' : 'text-emerald-400 text-glow-emerald';

                                    return (
                                      <div className={`p-4 bg-gradient-to-r ${gradientClass} rounded-2xl border ${borderClass} mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner group/pred`}>
                                        <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center border border-white/5`}>
                                            <Zap size={14} className={isDrawPred ? 'text-amber-500' : 'text-emerald-400'} />
                                          </div>
                                          <div className="text-left">
                                            <span className="text-[8px] text-stone-500 uppercase tracking-widest font-black block mb-0.5">Your Locked Vote</span>
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-sm select-none">{predFlag}</span>
                                              <span className={`text-xs uppercase font-black tracking-wider ${glowTextClass}`}>{predName}</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <button 
                                          onClick={() => sharePrediction(match, userPred)}
                                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-905 hover:bg-gold-500/10 border border-white/5 hover:border-gold-500/30 text-stone-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 group-hover/pred:border-gold-500/20 shadow-md"
                                          title="Share prediction on WhatsApp"
                                        >
                                          <Share2 size={10} className="text-gold-500 animate-pulse" />
                                          <span>Share prediction 🚀</span>
                                        </button>
                                      </div>
                                    );
                                  })()
                                )}

                                {isFinished && (
                                  <div className="flex items-center justify-between p-3.5 bg-stone-950 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black">Match Winner</span>
                                    <span className="text-[10px] text-emerald-500 uppercase font-black tracking-widest text-glow-emerald flex items-center gap-1.5">
                                      {match.winner === 'teamA' ? match.teamA : match.winner === 'teamB' ? match.teamB : 'Draw'}
                                    </span>
                                  </div>
                                )}

                                {isFinished && userPred && (
                                  <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-all duration-500 ${match.winner === userPred ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.06)]' : 'bg-red-950/20 border-red-500/20 text-red-400'}`}>
                                    {match.winner === userPred ? (
                                      <>
                                        <CheckCircle2 size={18} className="shrink-0 text-emerald-400 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest tracking-[0.1em]">Nailed it! Correct Match Prediction! +1 Point 🎯</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle size={18} className="shrink-0 text-red-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest tracking-[0.1em]">Prediction Incorrect 😢</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Upgraded Leaderboard UI with Championship Olympic Podiums */
              <div className="max-w-3xl mx-auto space-y-8">
                {leaderboard.length > 0 ? (
                  <div className="space-y-8 animate-fade-in">
                    
                    {/* Olympic styled championship podium block */}
                    <div className="flex flex-row justify-center items-end gap-3 sm:gap-6 pt-10 pb-4 px-2">
                      {podiumList.map((user, idx) => {
                        const rankNum = user.index + 1;
                        const isFirst = rankNum === 1;
                        const isSecond = rankNum === 2;
                        const isThird = rankNum === 3;
                        const isCurrentUser = user.phone === phone;

                        let heightClass = 'h-36 sm:h-40';
                        let borderClass = 'border-amber-800/20';
                        let gradientClass = 'from-stone-900/60 to-amber-900/15';
                        let glowClass = 'text-amber-500';
                        let medalEmoji = '🥉';
                        let orderClass = 'order-3';

                        if (isFirst) {
                          heightClass = 'h-52 sm:h-56 shadow-glow-gold scale-102';
                          borderClass = 'border-gold-500/35';
                          gradientClass = 'from-stone-900/60 to-gold-500/12';
                          glowClass = 'text-gold-400 text-glow-gold font-black';
                          medalEmoji = '👑';
                          orderClass = 'order-2';
                        } else if (isSecond) {
                          heightClass = 'h-44 sm:h-48';
                          borderClass = 'border-stone-400/25';
                          gradientClass = 'from-stone-900/60 to-stone-400/10';
                          glowClass = 'text-stone-300';
                          medalEmoji = '🥈';
                          orderClass = 'order-1';
                        }

                        return (
                          <div 
                            key={idx} 
                            className={`flex-1 flex flex-col justify-end items-center text-center ${orderClass}`}
                          >
                            {/* Top Avatar badge with float effect */}
                            <div className="mb-2 shrink-0 flex flex-col items-center">
                              <span className="text-3xl select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] leading-none mb-1 animate-bounce-slow" style={{ animationDelay: `${rankNum * 0.4}s` }}>
                                {medalEmoji}
                              </span>
                              <span className={`text-[9px] font-mono font-bold tracking-wider ${isCurrentUser ? 'text-gold-400 font-black' : 'text-stone-400'}`}>
                                {maskPhone(user.phone)}
                              </span>
                            </div>

                            {/* Solid Podium Pillar */}
                            <div className={`w-full ${heightClass} bg-gradient-to-t ${gradientClass} border-t-2 border-x ${borderClass} rounded-t-[1.8rem] flex flex-col justify-between p-4 shadow-2xl relative overflow-hidden group`}>
                              <div className="absolute inset-0 bg-white/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                              
                              <div className="flex flex-col items-center pt-2">
                                <span className={`text-[9px] uppercase tracking-widest font-black text-stone-500`}>Score</span>
                                <span className={`text-2xl sm:text-3xl font-serif ${glowClass}`}>{user.score}</span>
                                <span className="text-[7px] text-stone-600 font-black uppercase tracking-widest">Points</span>
                              </div>

                              <div className="flex flex-col items-center pb-2">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-950 flex items-center justify-center text-xs font-black border ${
                                  isFirst ? 'border-gold-500/30 text-gold-400' : isSecond ? 'border-stone-400/20 text-stone-300' : 'border-amber-800/10 text-amber-500'
                                }`}>
                                  {rankNum}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Standard Remaining Ranks List */}
                    <div className="max-w-2xl mx-auto bg-stone-900/50 border border-white/5 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                      <div className="text-center space-y-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-stone-950 border border-white/5 flex items-center justify-center mx-auto text-stone-400"><Award size={18} /></div>
                        <h4 className="text-sm font-black uppercase tracking-widest font-sans text-stone-300">Remaining Contenders</h4>
                      </div>

                      <div className="divide-y divide-stone-850">
                        {remainingLeaderboard.map((user, idx) => {
                          const rankNum = idx + 4;
                          const isCurrentUser = user.phone === phone;
                          
                          return (
                            <div 
                              key={idx} 
                              className={`flex justify-between items-center py-4 px-4 rounded-2xl first:pt-4 last:pb-4 transition-all duration-300 ${
                                isCurrentUser ? 'bg-gold-500/5 border border-gold-500/20 my-2' : 'hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-full bg-stone-950 border border-white/5 text-stone-500 flex items-center justify-center font-bold text-xs">
                                  {rankNum}
                                </span>
                                <span className={`text-xs sm:text-sm font-mono font-bold ${isCurrentUser ? 'text-gold-400 text-glow-gold font-black' : 'text-stone-200'}`}>
                                  {maskPhone(user.phone)} {isCurrentUser && <span className="text-[8px] bg-gold-500 text-stone-950 px-2 py-0.5 rounded-md uppercase font-black tracking-widest font-sans ml-2">You</span>}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-black text-base sm:text-lg text-stone-400">{user.score}</span>
                                <span className="text-[9px] text-stone-600 font-black uppercase tracking-widest">Points</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto bg-stone-900/50 border border-white/5 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl text-center">
                    <p className="text-stone-600 italic py-8 bg-stone-950/30 border border-white/5 rounded-2xl">No completed predictions yet. Wait for a match to finish!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Premium Prediction Winner Celebration Popup */}
      {celebratingMatch && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-stone-950/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-stone-900 border-2 border-gold-500 rounded-[3rem] p-8 sm:p-12 max-w-md w-full text-center shadow-2xl relative overflow-hidden shadow-glow-gold animate-scale-in">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gold-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 via-gold-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-gold-500/25 relative group overflow-hidden animate-bounce-slow">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Trophy size={48} className="text-stone-950 stroke-[2.5]" />
            </div>

            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-center gap-1.5">
                <Sparkles size={14} className="text-gold-400 animate-pulse" />
                <span className="text-[10px] text-gold-500 uppercase tracking-[0.3em] font-black text-glow-gold">Prediction Winner</span>
                <Sparkles size={14} className="text-gold-400 animate-pulse" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif text-white uppercase tracking-tight">You Are A Winner!</h3>
              <p className="text-stone-400 text-xs sm:text-sm leading-relaxed font-sans font-light">
                Your prediction for the match between <span className="text-white font-bold">{celebratingMatch.teamA}</span> and <span className="text-white font-bold">{celebratingMatch.teamB}</span> was 100% correct!
              </p>
            </div>

            <div className="mt-8 mb-8 p-6 bg-stone-950 border border-stone-850 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-inner">
              <span className="text-[8px] text-stone-600 uppercase tracking-widest font-black block">Your Predicted Winner</span>
              <div className="flex items-center gap-2 font-serif text-lg font-black text-gold-400 text-glow-gold uppercase">
                {celebratingMatch.winner === 'teamA' ? (
                  <>
                    <span>{celebratingMatch.teamAFlag}</span>
                    <span>{celebratingMatch.teamA}</span>
                  </>
                ) : celebratingMatch.winner === 'teamB' ? (
                  <>
                    <span>{celebratingMatch.teamBFlag}</span>
                    <span>{celebratingMatch.teamB}</span>
                  </>
                ) : (
                  <>
                    <span>🤝</span>
                    <span>Draw Match</span>
                  </>
                )}
              </div>
              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-1">1 Point Added To Scoreboard 🚀</span>
            </div>

            <button 
              onClick={handleCloseCelebration}
              className="w-full bg-gradient-to-r from-amber-600 via-gold-500 to-amber-600 text-stone-950 font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-gold-500/10 hover:shadow-gold-500/25 active:scale-95 transition-all"
            >
              Claim Victory ⚡
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictPage;

