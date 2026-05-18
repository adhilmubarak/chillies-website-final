import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, Sparkles, Volume2, Flame, Award, Copy, Check, Play, ShieldAlert, Gift } from 'lucide-react';

interface ScreamChallengeProps {}

export default React.forwardRef<unknown, ScreamChallengeProps>((props, ref) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'welcome' | 'permission' | 'countdown' | 'screaming' | 'result'>('welcome');
  const [phone, setPhone] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(5);
  const [currentDb, setCurrentDb] = useState(0);
  const [maxDb, setMaxDb] = useState(0);
  const [averageDb, setAverageDb] = useState(0);
  
  const [generatedCoupon, setGeneratedCoupon] = useState<{ code: string; value: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Audio state
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dbRecordsRef = useRef<number[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const [isValidating, setIsValidating] = useState(false);

  const handleStartSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit number');
      return;
    }
    setErrorMsg('');
    setIsValidating(true);

    try {
      const q = query(collection(db, 'coupons'), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      const alreadyPlayed = querySnapshot.docs.some(doc => doc.data().code?.startsWith('SCREAM-'));
      if (alreadyPlayed) {
        setErrorMsg('This WhatsApp number has already participated in the Scream Challenge! One discount per customer.');
        setIsValidating(false);
        return;
      }
    } catch (err) {
      console.error('Error validating scream history:', err);
    }

    setIsValidating(false);
    setGameState('permission');
  };

  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      setGameState('countdown');
      startCountdown();
    } catch (err) {
      console.error('Mic access denied:', err);
      setErrorMsg('Microphone access is required to play the scream challenge.');
    }
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(3);
    const interval = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(interval);
        setGameState('screaming');
        startScreamWindow();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const startScreamWindow = () => {
    dbRecordsRef.current = [];
    setTimeLeft(5);
    setMaxDb(0);
    
    // Start Web Audio loop
    measureAudio();

    let sec = 5;
    const interval = setInterval(() => {
      sec -= 1;
      setTimeLeft(sec);
      if (sec === 0) {
        clearInterval(interval);
        finishChallenge();
      }
    }, 1000);
  };

  const measureAudio = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkVolume = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Calculate realistic decibels (0 to 100 max range for UI mapping)
      // Standard human scream peaks around 90-100dB, we map microphone levels to match
      const dbVal = Math.min(Math.round((average / 140) * 100), 100);
      
      setCurrentDb(dbVal);
      dbRecordsRef.current.push(dbVal);
      setMaxDb(prev => Math.max(prev, dbVal));
      
      animationFrameRef.current = requestAnimationFrame(checkVolume);
    };
    
    animationFrameRef.current = requestAnimationFrame(checkVolume);
  };

  const finishChallenge = async () => {
    stopAudio();
    
    const records = dbRecordsRef.current;
    const max = Math.max(...records, 0);
    const sum = records.reduce((a, b) => a + b, 0);
    const avg = records.length ? Math.round(sum / records.length) : 0;
    
    setAverageDb(avg);
    setGameState('result');
    
    // Calculate Reward value based on Peak volume reached
    let discountValue = 0;
    if (max >= 85) {
      discountValue = 15; // Extreme Heat
    } else if (max >= 70) {
      discountValue = 10; // Hot Heat
    } else if (max >= 50) {
      discountValue = 5;  // Mild Heat
    }
    
    if (discountValue > 0) {
      // Dynamic Coupon Generation
      const codePart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const uniqueCode = `SCREAM-${discountValue}-${codePart}`;
      
      try {
        // Save to Firestore
        await addDoc(collection(db, 'coupons'), {
          code: uniqueCode,
          value: discountValue,
          type: 'percent',
          description: `Scream Challenge ${discountValue}% Discount`,
          expiry: Date.now() + (24 * 60 * 60 * 1000), // Valid for 24 hours
          phone: phone,
          createdAt: Date.now()
        });
        
        setGeneratedCoupon({ code: uniqueCode, value: discountValue });
      } catch (err) {
        console.error('Error saving coupon to Firestore:', err);
      }
    }
  };

  const copyCoupon = () => {
    if (!generatedCoupon) return;
    navigator.clipboard.writeText(generatedCoupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const retryGame = () => {
    setGameState('welcome');
    setCurrentDb(0);
    setMaxDb(0);
    setAverageDb(0);
    setGeneratedCoupon(null);
  };

  // UI styling based on current stoking intensity
  const getFlameColor = (val: number) => {
    if (val >= 85) return 'from-yellow-400 via-orange-500 to-red-600 scale-125';
    if (val >= 70) return 'from-amber-400 via-orange-500 to-red-500 scale-110';
    if (val >= 50) return 'from-gold-400 via-amber-500 to-orange-500 scale-100';
    return 'from-stone-700 via-stone-600 to-stone-500 scale-95';
  };

  return (
    <div className="min-h-screen bg-[#030303] text-stone-200 font-sans selection:bg-gold-500/30 selection:text-gold-200 relative overflow-hidden flex flex-col justify-between">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-gold-900/10 to-transparent"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(212,175,55,0.05)_0%,_transparent_60%)] opacity-70 blur-3xl"></div>
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Header */}
      <nav className="relative z-10 w-full bg-[#030303]/80 backdrop-blur-xl border-b border-white/[0.03] pb-4 pt-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-stone-900/50 hover:bg-stone-800 text-stone-400 hover:text-gold-400 rounded-full transition-all border border-white/5 shadow-inner group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <span className="font-serif text-lg md:text-xl text-stone-100 tracking-[0.3em] uppercase">
            Chillies <span className="text-gold-500 font-bold">Elite</span>
          </span>
          <div className="w-10"></div> {/* Balancer */}
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-6 py-12 flex flex-col justify-center relative z-10">
        
        {/* GAMESTATE: WELCOME */}
        {gameState === 'welcome' && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-gradient-to-r from-gold-500/10 to-transparent border-l-2 border-gold-500 text-gold-400 text-[10px] font-black uppercase tracking-[0.3em]">
                <Flame size={14} className="animate-pulse text-red-500" /> Limited Campaign
              </div>
              <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight">
                Scream For <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-600 italic font-medium pr-4">Shawarma!</span>
              </h1>
              <p className="text-stone-400 text-sm leading-relaxed max-w-xs mx-auto font-light">
                How hot can you handle? Scream at your screen to roast the virtual Chillies Shawarma spit and unlock up to <strong className="text-gold-400 font-bold">15% off</strong> instantly!
              </p>
            </div>

            {/* Display Tiers */}
            <div className="bg-[#0a0a0a]/90 border border-white/[0.05] rounded-3xl p-5 space-y-3.5 text-left shadow-2xl">
              <div className="text-[10px] text-stone-500 font-black uppercase tracking-widest text-center border-b border-white/[0.03] pb-2.5">Volume Reward Tiers</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gold-600"></div> Mild Roast (50+ dB)</span>
                <span className="text-gold-400 font-bold font-mono">5% OFF</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Hot Sizzle (70+ dB)</span>
                <span className="text-orange-400 font-bold font-mono">10% OFF</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div> Golden Crispy (85+ dB)</span>
                <span className="text-red-500 font-black font-mono">15% OFF</span>
              </div>
            </div>

            <form onSubmit={handleStartSetup} className="space-y-4">
              <div className="relative group">
                <input 
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="WHATSAPP NUMBER"
                  maxLength={10}
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl py-5 px-6 text-stone-100 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 text-center text-lg tracking-[0.25em] font-mono shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] font-black placeholder:text-stone-850"
                  required
                />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none"></div>
              </div>
              {errorMsg && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{errorMsg}</p>}
              
              <button 
                type="submit" 
                disabled={isValidating}
                className="w-full py-5 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-stone-950 font-black uppercase tracking-[0.25em] text-[11px] rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-[0_10px_30px_rgba(var(--brand-500-rgb,212,175,55),0.15)] disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></span>
                    Sizzling Profile...
                  </>
                ) : (
                  <>
                    <Play size={16} strokeWidth={2.5} /> Let's Play
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* GAMESTATE: REQUEST PERMISSION */}
        {gameState === 'permission' && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-500/5 border border-gold-500/20 mb-2 relative">
              <Volume2 size={32} className="text-gold-400 animate-pulse" />
              <div className="absolute inset-0 bg-gold-500/10 blur-xl rounded-full"></div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-white">Enable Microphone</h2>
              <p className="text-stone-400 text-sm leading-relaxed font-light max-w-xs mx-auto">
                We use your mic exclusively to measure your screaming decibels during the 5-second challenge. No audio is recorded or sent anywhere.
              </p>
            </div>
            {errorMsg && (
              <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4 flex gap-3 text-left">
                <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-red-300 leading-normal uppercase tracking-wider">{errorMsg}</p>
              </div>
            )}
            <button 
              onClick={requestMicrophone}
              className="w-full py-5 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-stone-950 font-black uppercase tracking-[0.25em] text-[11px] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(var(--brand-500-rgb,212,175,55),0.15)]"
            >
              Grant Access
            </button>
          </div>
        )}

        {/* GAMESTATE: COUNTDOWN */}
        {gameState === 'countdown' && (
          <div className="text-center space-y-6 animate-fade-in">
            <span className="text-[10px] text-stone-500 font-black uppercase tracking-[0.3em] block">Prepare Your Voice</span>
            <div className="w-40 h-40 rounded-full border border-white/5 flex items-center justify-center mx-auto relative bg-white/[0.01]">
              <span className="text-7xl font-serif text-gold-400 font-black animate-[scale-up_1s_infinite]">{countdown}</span>
              <div className="absolute inset-0 border-2 border-gold-500/30 rounded-full animate-ping"></div>
            </div>
            <p className="text-stone-400 text-xs uppercase tracking-widest font-bold animate-pulse mt-4">Deep breath in...</p>
          </div>
        )}

        {/* GAMESTATE: SCREAMING */}
        {gameState === 'screaming' && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="flex justify-between items-center px-4">
              <span className="text-red-500 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></div> SCREAM NOW!
              </span>
              <span className="text-stone-400 font-mono text-sm uppercase tracking-widest">Time: <strong className="text-white font-black">{timeLeft}s</strong></span>
            </div>

            {/* Giant Dynamic Stokes Flame */}
            <div className="h-64 flex items-center justify-center relative">
              {/* Outer Decibel Ring */}
              <div className="absolute w-56 h-56 rounded-full border border-white/5 flex items-center justify-center bg-stone-900/10">
                {/* SVG dynamic visualizer */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="112"
                    cy="112"
                    r="98"
                    className="stroke-[#050505]"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="112"
                    cy="112"
                    r="98"
                    className="stroke-gold-500 transition-all duration-100 ease-out"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 98}
                    strokeDashoffset={2 * Math.PI * 98 * (1 - currentDb / 100)}
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Shawarma Visualizer */}
              <div className={`transition-all duration-75 flex flex-col items-center justify-center z-10 ${currentDb >= 85 ? 'animate-bounce' : ''}`}>
                <div className="relative flex items-center justify-center">
                  <svg 
                    className="w-32 h-44 transition-all duration-100 drop-shadow-[0_0_25px_rgba(212,175,55,0.2)]" 
                    viewBox="0 0 100 150" 
                    style={{ 
                      transform: `scale(${1 + currentDb / 250})`, 
                      filter: currentDb > 70 ? 'url(#sizzleFilter)' : '' 
                    }}
                  >
                    <defs>
                      {/* Sizzle turbulence heat waves filter */}
                      <filter id="sizzleFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.95" numOctaves="1" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale={currentDb / 12} xChannelSelector="R" yChannelSelector="G" />
                      </filter>

                      {/* Roasted Shawarma meat base gradient */}
                      <linearGradient id="roastedMeatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#78350f" />
                        <stop offset="40%" stopColor="#d97706" />
                        <stop offset="70%" stopColor="#b45309" />
                        <stop offset="100%" stopColor="#92400e" />
                      </linearGradient>

                      {/* Glowing searing embers gradient */}
                      <linearGradient id="sizzlingGlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffd700" />
                        <stop offset="50%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                    </defs>

                    {/* Skewer / spit rod */}
                    <rect x="47" y="10" width="6" height="130" fill="#78716c" rx="3" />

                    {/* Drip disc plate */}
                    <ellipse cx="50" cy="130" rx="28" ry="6" fill="#44403c" />

                    {/* Raw/Neutral Meat Layer base */}
                    <path 
                      d="M 32 30 C 32 30, 50 18, 68 30 C 72 50, 78 95, 62 120 C 58 125, 42 125, 38 120 C 22 95, 28 50, 32 30 Z" 
                      fill="#57534e" 
                    />

                    {/* Juicy Roasted Meat Layer (fades in as they scream) */}
                    <path 
                      d="M 32 30 C 32 30, 50 18, 68 30 C 72 50, 78 95, 62 120 C 58 125, 42 125, 38 120 C 22 95, 28 50, 32 30 Z" 
                      fill="url(#roastedMeatGrad)"
                      opacity={currentDb > 0 ? Math.min(currentDb / 30, 1) : 0}
                      className="transition-opacity duration-300"
                    />

                    {/* Hot Sizzling Grilling Mark lines */}
                    <path d="M 34 45 Q 50 52, 66 45" stroke="#451a03" strokeWidth="3.5" fill="none" opacity={currentDb > 0 ? 0.8 : 0.2} />
                    <path d="M 32 65 Q 50 72, 68 65" stroke="#451a03" strokeWidth="3.5" fill="none" opacity={currentDb > 0 ? 0.8 : 0.2} />
                    <path d="M 32 85 Q 50 92, 68 85" stroke="#451a03" strokeWidth="3.5" fill="none" opacity={currentDb > 0 ? 0.8 : 0.2} />
                    <path d="M 34 105 Q 50 110, 66 105" stroke="#451a03" strokeWidth="3.5" fill="none" opacity={currentDb > 0 ? 0.8 : 0.2} />

                    {/* Searing Orange/Gold Heat glow overlay (grows with loudness) */}
                    <path 
                      d="M 32 30 C 32 30, 50 18, 68 30 C 72 50, 78 95, 62 120 C 58 125, 42 125, 38 120 C 22 95, 28 50, 32 30 Z" 
                      fill="url(#sizzlingGlowGrad)"
                      opacity={Math.min(currentDb / 100, 0.9)} 
                      className="transition-opacity duration-75 mix-blend-screen"
                    />
                  </svg>
                  
                  {/* Glowing background heat blur */}
                  {currentDb > 25 && (
                    <div 
                      className="absolute w-32 h-44 bg-gradient-to-t from-red-600 via-orange-500 to-gold-500 rounded-full blur-3xl opacity-30 z-[-1] transition-all duration-75"
                      style={{ transform: `scale(${currentDb / 40})` }}
                    />
                  )}
                </div>
                
                <div className="mt-6 font-mono text-3xl font-black text-white tracking-widest drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2">
                  <span>{currentDb}</span>
                  <span className="text-xs text-stone-500 uppercase tracking-widest font-bold">dB Sizzle</span>
                </div>
              </div>
            </div>

            {/* Max Decibel Record Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-stone-500 font-bold uppercase tracking-widest px-2">
                <span>Peak Sizzle reached</span>
                <span>{maxDb} dB</span>
              </div>
              <div className="w-full h-3 bg-[#050505] rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-gold-500 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${maxDb}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* GAMESTATE: RESULT */}
        {gameState === 'result' && (
          <div className="text-center space-y-8 animate-fade-in">
            {generatedCoupon ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-gradient-to-r from-green-500/10 to-transparent border-l-2 border-green-500 text-green-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                    <Award size={14} className="animate-bounce" /> Challenge Won
                  </div>
                  <h2 className="text-3xl font-serif text-white">Sizzling Golden Roast!</h2>
                  <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto font-light">
                    You roasted the Shawarma to a peak intensity of <strong className="text-white font-bold">{maxDb} dB</strong> (average: {averageDb} dB). Unlocked <strong className="text-gold-400 font-bold">{generatedCoupon.value}% OFF</strong> coupon!
                  </p>
                </div>

                {/* Highly aesthetic Golden Coupon Ticket Card */}
                <div className="relative w-full bg-[#050505] border border-white/10 p-8 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),0_0_40px_rgba(212,175,55,0.08)] group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.15)_0%,_transparent_70%)] rounded-full"></div>
                  
                  {/* Left & Right Ticket Cuts */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#030303] rounded-full border border-white/10 z-10"></div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#030303] rounded-full border border-white/10 z-10"></div>

                  <div className="space-y-6 relative z-10">
                    <div>
                      <span className="text-[10px] text-stone-500 font-black uppercase tracking-[0.35em] block mb-1">Coupon Issued</span>
                      <div className="font-mono text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-400 to-gold-600 tracking-[0.1em] drop-shadow-md">
                        {generatedCoupon.code}
                      </div>
                    </div>
                    
                    <div className="border-t border-dashed border-white/10 pt-4 flex justify-between items-center text-xs">
                      <span className="text-stone-400 font-light flex items-center gap-1.5"><Gift size={12} className="text-gold-500" /> {generatedCoupon.value}% Savings</span>
                      <span className="text-stone-500 uppercase tracking-widest text-[9px] font-bold">Expires: 24h</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={copyCoupon}
                    className="flex-1 py-5 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-stone-950 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(var(--brand-500-rgb,212,175,55),0.15)] transition-all active:scale-[0.98]"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                  
                  <button 
                    onClick={() => {
                      copyCoupon();
                      navigate('/');
                    }}
                    className="flex-1 py-5 bg-stone-900 border border-white/5 text-stone-300 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all hover:bg-stone-850"
                  >
                    Apply & Order
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-3xl font-serif text-white">Cold Spit...</h2>
                  <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto font-light">
                    You reached a peak volume of <strong className="text-white font-bold">{maxDb} dB</strong>. We require at least <strong className="text-gold-400 font-bold">50 dB</strong> of pure screaming power to sizzle the Shawarma!
                  </p>
                </div>

                <div className="w-24 h-24 rounded-full bg-stone-950 border border-white/5 flex items-center justify-center mx-auto mb-4">
                  <Volume2 size={36} className="text-stone-600" />
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={retryGame}
                    className="w-full py-5 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-stone-950 font-black uppercase tracking-[0.25em] text-[11px] rounded-2xl shadow-[0_10px_30px_rgba(var(--brand-500-rgb,212,175,55),0.15)]"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full py-5 bg-stone-900 border border-white/5 text-stone-400 font-bold uppercase tracking-widest text-[10px] rounded-2xl"
                  >
                    Return to Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="relative z-10 py-6 text-center text-[9px] text-stone-600 uppercase tracking-[0.2em] font-bold border-t border-white/[0.03]">
        &copy; 2026 Chillies Restaurant | Scream Challenge
      </footer>
    </div>
  );
});
