import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, increment, getDocs } from 'firebase/firestore';
import { Trophy, Phone, Calendar, Clock, CheckCircle2, XCircle, ChevronRight, Award, BarChart3, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PredictPage: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(() => localStorage.getItem('predict_user_phone') || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!phone);
  const [matches, setMatches] = useState<any[]>([]);
  const [userPredictions, setUserPredictions] = useState<Record<string, string>>({}); // matchId -> predictedWinner
  const [leaderboard, setLeaderboard] = useState<{ phone: string; score: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'matches' | 'leaderboard'>('matches');

  // Load matches
  useEffect(() => {
    const q = query(collection(db, 'worldcup_matches'));
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      // Sort upcoming matches first, then live, then finished
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();
    if (cleanPhone.length < 10) {
      alert("Please enter a valid phone number.");
      return;
    }
    localStorage.setItem('predict_user_phone', cleanPhone);
    setPhone(cleanPhone);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('predict_user_phone');
    setPhone('');
    setPhoneInput('');
    setIsLoggedIn(false);
    setUserPredictions({});
  };

  const handlePredict = async (matchId: string, selection: 'teamA' | 'teamB' | 'draw') => {
    if (!isLoggedIn || !phone) return;
    if (userPredictions[matchId]) return; // Already predicted

    try {
      // 1. Add prediction doc
      await addDoc(collection(db, 'worldcup_predictions'), {
        matchId,
        phone,
        predictedWinner: selection,
        createdAt: Date.now()
      });

      // 2. Increment match votes count
      const matchRef = doc(db, 'worldcup_matches', matchId);
      const incrementField = selection === 'teamA' ? 'votesTeamA' : selection === 'teamB' ? 'votesTeamB' : 'votesDraw';
      await updateDoc(matchRef, {
        [incrementField]: increment(1)
      });
      
      alert("Prediction submitted successfully!");
    } catch (e) {
      console.error("Prediction error:", e);
      alert("Failed to submit prediction.");
    }
  };

  const maskPhone = (ph: string) => {
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

  return (
    <div className="relative min-h-screen font-sans text-stone-200 overflow-x-hidden bg-stone-950 pb-24">
      {/* Decorative soccer-themed background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-[#0c0c0c] to-stone-950/90 pointer-events-none z-0"></div>
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08)_0%,_transparent_70%)] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_bottom_left,_rgba(212,175,55,0.06)_0%,_transparent_70%)] rounded-full pointer-events-none"></div>

      {/* Floating Trophy Animation Overlay */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 relative z-10">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-stone-500 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em] mb-8 bg-stone-900/40 px-5 py-3 rounded-xl border border-white/5"
        >
          <ArrowLeft size={14} /> Back to Chillies
        </button>

        {/* Header Block */}
        <div className="text-center space-y-4 mb-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-gold-500 to-amber-600 flex items-center justify-center mx-auto shadow-[0_15px_30px_rgba(212,175,55,0.25)] relative group animate-bounce-slow">
            <div className="absolute inset-0 border border-white/20 rounded-full"></div>
            <Trophy size={36} className="text-stone-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-white text-3xl md:text-5xl font-serif leading-none tracking-tight">
              FIFA World Cup <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-gold-400 to-amber-500 italic font-black">Predictor</span>
            </h1>
            <p className="text-stone-500 text-xs md:text-sm uppercase tracking-[0.25em] font-black mt-2">Predict matches. Climb the Leaderboard. Win Premium Rewards.</p>
          </div>
        </div>

        {/* Login Prompt or Predict Panel */}
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto bg-stone-900/80 border border-white/5 rounded-[2.5rem] p-10 text-center shadow-2xl relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="w-16 h-16 bg-stone-950 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Phone className="text-gold-500" size={24} />
            </div>
            <h3 className="text-xl font-serif text-white mb-2">Unlocking Predictions</h3>
            <p className="text-stone-500 text-xs leading-relaxed mb-8">Enter your mobile number to vote on World Cup matches. Stand a chance to top our scoreboard and win free shawarmas & discounts!</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="tel" 
                placeholder="Enter 10-Digit Mobile Number" 
                value={phoneInput} 
                onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-center text-white focus:outline-none focus:border-gold-500 tracking-wider font-mono text-sm"
                required
              />
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-amber-600 via-gold-500 to-amber-600 text-stone-950 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-gold-500/10 hover:shadow-gold-500/25 transition-all"
              >
                Enter Match Center
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            {/* User welcome bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-stone-900/50 border border-white/5 rounded-2xl p-4 sm:px-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs uppercase tracking-widest font-black text-stone-300">Predictor Account: <span className="font-mono text-gold-400">{maskPhone(phone)}</span></span>
              </div>
              <button onClick={handleLogout} className="text-stone-500 hover:text-white uppercase tracking-widest text-[9px] font-black transition-colors">Sign Out</button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center border-b border-stone-900/60 pb-1">
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
                {isLoading ? (
                  <div className="text-center py-12 text-stone-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Matches...</div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-12 text-stone-600 italic">No matches available. Please check back later.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {matches.map(match => {
                      const userPred = userPredictions[match.id];
                      const percentages = getVotePercentages(match);
                      const isUpcoming = match.status === 'upcoming';
                      const isLive = match.status === 'live';
                      const isFinished = match.status === 'finished';

                      return (
                        <div key={match.id} className={`bg-stone-900/60 border ${isLive ? 'border-red-500/25 shadow-[0_0_30px_rgba(239,68,68,0.05)]' : 'border-white/5'} rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group`}>
                          <div>
                            {/* Match Header Info */}
                            <div className="flex justify-between items-center mb-6">
                              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} className="text-gold-500" /> {match.matchDate}
                                <span className="text-stone-700">|</span>
                                <Clock size={12} className="text-gold-500" /> {match.matchTime}
                              </span>
                              {isLive ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-950 text-red-400 border border-red-800/30 animate-pulse">
                                  Live
                                </span>
                              ) : isFinished ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-800/30">
                                  Finished
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-stone-800 text-stone-400 border border-stone-700/30">
                                  Upcoming
                                </span>
                              )}
                            </div>

                            {/* Teams Grid Representation */}
                            <div className="flex items-center justify-around gap-4 text-center my-6">
                              <div className="flex flex-col items-center gap-2 flex-1">
                                <span className="text-4xl sm:text-5xl shrink-0 group-hover:scale-110 transition-transform duration-500">{match.teamAFlag}</span>
                                <span className="text-white text-xs sm:text-sm font-serif font-black uppercase tracking-wider line-clamp-1">{match.teamA}</span>
                              </div>
                              
                              <div className="text-stone-600 font-sans italic text-sm font-light shrink-0">VS</div>
                              
                              <div className="flex flex-col items-center gap-2 flex-1">
                                <span className="text-4xl sm:text-5xl shrink-0 group-hover:scale-110 transition-transform duration-500">{match.teamBFlag}</span>
                                <span className="text-white text-xs sm:text-sm font-serif font-black uppercase tracking-wider line-clamp-1">{match.teamB}</span>
                              </div>
                            </div>
                          </div>

                          {/* Prediction Controls Section */}
                          <div className="mt-6 pt-6 border-t border-stone-900/60 space-y-4">
                            {isUpcoming && !userPred && (
                              <div className="space-y-3">
                                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black text-center mb-2">Predict Match Outcome</p>
                                <div className="grid grid-cols-3 gap-2">
                                  <button 
                                    onClick={() => handlePredict(match.id, 'teamA')}
                                    className="bg-stone-950 hover:bg-gold-500/10 border border-white/5 hover:border-gold-500/40 rounded-xl p-3.5 transition-all text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-white active:scale-95"
                                  >
                                    {match.teamA}
                                  </button>
                                  <button 
                                    onClick={() => handlePredict(match.id, 'draw')}
                                    className="bg-stone-950 hover:bg-gold-500/10 border border-white/5 hover:border-gold-500/40 rounded-xl p-3.5 transition-all text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-white active:scale-95"
                                  >
                                    Draw
                                  </button>
                                  <button 
                                    onClick={() => handlePredict(match.id, 'teamB')}
                                    className="bg-stone-950 hover:bg-gold-500/10 border border-white/5 hover:border-gold-500/40 rounded-xl p-3.5 transition-all text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-white active:scale-95"
                                  >
                                    {match.teamB}
                                  </button>
                                </div>
                              </div>
                            )}

                            {(userPred || !isUpcoming) && (
                              <div className="space-y-4">
                                {/* Aggregated Vote Breakdown percentages */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[9px] text-stone-500 font-bold uppercase tracking-widest">
                                    <span>Community Votes</span>
                                    <span className="text-gold-400 font-bold">Total: {(match.votesTeamA || 0) + (match.votesDraw || 0) + (match.votesTeamB || 0)}</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-stone-950 overflow-hidden flex">
                                    <div style={{ width: `${percentages.a}%` }} className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-1000" title={`${match.teamA}: ${percentages.a}%`}></div>
                                    <div style={{ width: `${percentages.d}%` }} className="bg-stone-700 h-full transition-all duration-1000" title={`Draw: ${percentages.d}%`}></div>
                                    <div style={{ width: `${percentages.b}%` }} className="bg-gradient-to-r from-gold-500 to-amber-600 h-full transition-all duration-1000" title={`${match.teamB}: ${percentages.b}%`}></div>
                                  </div>
                                  <div className="flex justify-between text-[9px] font-mono text-stone-400 font-bold">
                                    <span>{match.teamA}: {percentages.a}%</span>
                                    <span>Draw: {percentages.d}%</span>
                                    <span>{match.teamB}: {percentages.b}%</span>
                                  </div>
                                </div>

                                {/* Selection Status Message */}
                                {userPred && (
                                  <div className="flex items-center justify-between p-3.5 bg-stone-950 rounded-xl border border-white/5 mt-2">
                                    <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black">Your Prediction</span>
                                    <span className="text-[10px] text-gold-500 uppercase font-black tracking-widest">
                                      {userPred === 'teamA' ? match.teamA : userPred === 'teamB' ? match.teamB : 'Draw'}
                                    </span>
                                  </div>
                                )}

                                {isFinished && (
                                  <div className="flex items-center justify-between p-3.5 bg-stone-950 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black">Match Winner</span>
                                    <span className="text-[10px] text-emerald-500 uppercase font-black tracking-widest flex items-center gap-1.5">
                                      {match.winner === 'teamA' ? match.teamA : match.winner === 'teamB' ? match.teamB : 'Draw'}
                                    </span>
                                  </div>
                                )}

                                {isFinished && userPred && (
                                  <div className={`p-4 rounded-xl flex items-center gap-3 border ${match.winner === userPred ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-red-950/20 border-red-500/20 text-red-400'}`}>
                                    {match.winner === userPred ? (
                                      <>
                                        <CheckCircle2 size={16} className="shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Correct Prediction! +1 Point</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle size={16} className="shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Incorrect Prediction</span>
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
              /* Leaderboard UI */
              <div className="max-w-2xl mx-auto bg-stone-900/50 border border-white/5 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl">
                <div className="text-center space-y-2 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center mx-auto text-gold-500"><Award size={24} /></div>
                  <h3 className="text-xl font-serif text-white">Top Predictors Leaderboard</h3>
                  <p className="text-stone-500 text-xs uppercase tracking-widest font-black">Points allocated for correct winner predictions</p>
                </div>

                <div className="divide-y divide-stone-850">
                  {leaderboard.map((user, idx) => (
                    <div key={idx} className="flex justify-between items-center py-4 first:pt-0 last:pb-0 group">
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0 ? 'bg-gradient-to-br from-amber-400 to-gold-500 text-stone-950 font-black' :
                          idx === 1 ? 'bg-stone-300 text-stone-950' :
                          idx === 2 ? 'bg-amber-800 text-stone-950' : 'bg-stone-950 text-stone-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-stone-200">{maskPhone(user.phone)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gold-400 font-serif font-black text-base sm:text-lg">{user.score}</span>
                        <span className="text-[9px] text-stone-600 font-black uppercase tracking-widest">Points</span>
                      </div>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-center text-stone-600 italic py-6">No completed predictions yet. Wait for a match to finish!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictPage;
