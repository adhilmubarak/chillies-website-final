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
  
  const [generatedCoupon, setGeneratedCoupon] = useState<{ code: string; value: number; isFreeItem?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
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
    
    // Calculate Reward based on Peak volume reached
    let discountValue = 0;
    let isFreeItem = false;

    if (max >= 85) {
      isFreeItem = true;
    } else if (max >= 70) {
      discountValue = 10; // Hot Heat
    } else if (max >= 50) {
      discountValue = 5;  // Mild Heat
    }
    
    if (isFreeItem) {
      const codePart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const uniqueCode = `FREE-ROLL-${codePart}`;
      
      try {
        // Save secure free item claim ticket to Firestore
        await addDoc(collection(db, 'coupons'), {
          code: uniqueCode,
          value: 100, // 100% equivalent
          type: 'free_item',
          description: `Scream Challenge Grand Winner - Free Shawarma Roll`,
          expiry: Date.now() + (24 * 60 * 60 * 1000), // Valid for 24 hours
          phone: phone,
          createdAt: Date.now()
        });
        
        setGeneratedCoupon({ code: uniqueCode, value: 100, isFreeItem: true });
      } catch (err) {
        console.error('Error saving free item claim pass to Firestore:', err);
      }
    } else if (discountValue > 0) {
      // Dynamic Discount Coupon Generation
      const codePart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const uniqueCode = `SCREAM-${discountValue}-${codePart}`;
      
      try {
        // Save standard discount to Firestore
        await addDoc(collection(db, 'coupons'), {
          code: uniqueCode,
          value: discountValue,
          type: 'percent',
          description: `Scream Challenge ${discountValue}% Discount`,
          expiry: Date.now() + (24 * 60 * 60 * 1000), // Valid for 24 hours
          phone: phone,
          createdAt: Date.now()
        });
        
        setGeneratedCoupon({ code: uniqueCode, value: discountValue, isFreeItem: false });
      } catch (err) {
        console.error('Error saving discount coupon to Firestore:', err);
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 italic font-black pr-4">Shawarma!</span>
              </h1>
              <p className="text-stone-400 text-sm leading-relaxed max-w-xs mx-auto font-light">
                How hot can you handle? Scream at your screen to roast the virtual Chillies Shawarma spit and unlock up to <strong className="text-gold-400 font-bold">15% off</strong> instantly!
              </p>
            </div>

            {/* Display Tiers */}
            <div className="bg-[#0a0a0a]/90 border border-white/[0.05] rounded-3xl p-5 space-y-3.5 text-left shadow-2xl">
              <div className="text-[10px] text-stone-500 font-black uppercase tracking-widest text-center border-b border-white/[0.03] pb-2.5">Volume Reward Tiers</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gold-600"></div> Mild Roast (59-69 dB)</span>
                <span className="text-gold-400 font-bold font-mono">5% OFF</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Hot Sizzle (70-84 dB)</span>
                <span className="text-orange-400 font-bold font-mono">10% OFF</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div> Golden Crispy (85+ dB)</span>
                <span className="text-red-500 font-black font-mono">FREE SHAWARMA ROLL!</span>
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

            {/* Instruction Card: How to Claim Your Gift */}
            <div className="bg-[#050505] border border-white/5 rounded-3xl p-5 text-left space-y-4 shadow-inner">
              <div className="flex items-center gap-2 text-gold-400 font-bold uppercase tracking-widest text-[9px] border-b border-white/[0.03] pb-2">
                <Gift size={12} className="text-red-500" /> How to Claim Your Gift
              </div>
              <ul className="space-y-3 text-stone-400 text-xs font-light">
                <li className="flex gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center text-[9px] font-black text-gold-500 shrink-0 mt-0.5 font-mono">1</span>
                  <span><strong>Scream & Win:</strong> Hit the stoke levels! Screaming louder awards higher tiers, up to a **Free Shawarma Roll** at 85+ dB.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center text-[9px] font-black text-gold-500 shrink-0 mt-0.5 font-mono">2</span>
                  <span><strong>Copy Your Code:</strong> The system immediately issues a secure custom code. Simply click **Copy Code** or **Copy Claim Pass**.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center text-[9px] font-black text-gold-500 shrink-0 mt-0.5 font-mono">3</span>
                  <span><strong>Checkout to Redeem:</strong> Go to your cart, add a **Shawarma Roll** (for the free gift), enter the code, and click **Apply**!</span>
                </li>
              </ul>
            </div>
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
          <div className="text-center space-y-8 animate-fade-in relative py-6">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent blur-3xl rounded-full pointer-events-none"></div>
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.35em] block animate-pulse">Prepare Your Lungs</span>
            <div className="w-48 h-48 rounded-full border border-white/[0.03] flex items-center justify-center mx-auto relative bg-[#0a0a0a]/80 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
              {/* Pulsing rings */}
              <div className="absolute inset-2 border border-dashed border-gold-500/20 rounded-full animate-spin [animation-duration:10s]"></div>
              <div className="absolute inset-0 border-2 border-orange-500/30 rounded-full animate-ping [animation-duration:1.5s]"></div>
              
              <span className="text-8xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-white via-gold-300 to-gold-500 font-black animate-[scale-up_1s_infinite] filter drop-shadow-[0_4px_12px_rgba(212,175,55,0.3)]">
                {countdown}
              </span>
            </div>
            <p className="text-stone-400 text-[10px] uppercase tracking-[0.25em] font-black animate-pulse mt-4">Deep breath in... prepare to roar!</p>
          </div>
        )}

        {/* GAMESTATE: SCREAMING */}
        {gameState === 'screaming' && (
          <div className="text-center space-y-8 animate-fade-in relative">
            <style>{`
              @keyframes float-spark {
                0% { transform: translateY(0) scale(1); opacity: 0; }
                30% { opacity: 0.8; }
                100% { transform: translateY(-180px) scale(0); opacity: 0; }
              }
              .animate-float-spark {
                animation: float-spark linear infinite;
              }
            `}</style>

            <div className="flex justify-between items-center px-4">
              <span className="text-red-500 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></div> SCREAM NOW!
              </span>
              <span className="text-stone-400 font-mono text-xs uppercase tracking-[0.2em] font-black">Time: <strong className="text-white font-black">{timeLeft}s</strong></span>
            </div>

            {/* Giant Dynamic Stokes Flame / Shawarma Grid */}
            <div className="h-72 flex items-center justify-center relative">
              {/* Floating Searing Spark Particles */}
              {currentDb > 25 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  {[...Array(10)].map((_, i) => {
                    const left = 20 + Math.random() * 60; // 20% to 80% width
                    const size = 3 + Math.random() * 5; // 3px to 8px
                    const delay = Math.random() * 1.5;
                    const duration = 1 + Math.random() * 1.2;
                    return (
                      <div 
                        key={i}
                        style={{
                          left: `${left}%`,
                          width: `${size}px`,
                          height: `${size}px`,
                          animationDelay: `${delay}s`,
                          animationDuration: `${duration}s`,
                        }}
                        className="absolute bottom-10 bg-gradient-to-r from-orange-400 to-gold-500 rounded-full animate-float-spark opacity-85"
                      />
                    );
                  })}
                </div>
              )}

              {/* Outer Decibel Ring */}
              <div className="absolute w-60 h-60 rounded-full border border-white/5 flex items-center justify-center bg-stone-900/10">
                {/* SVG dynamic visualizer */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="120"
                    cy="120"
                    r="104"
                    className="stroke-[#050505]"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="104"
                    className="stroke-brand-500 transition-all duration-100 ease-out"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 104}
                    strokeDashoffset={2 * Math.PI * 104 * (1 - currentDb / 100)}
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Shawarma Visualizer */}
              <div className={`transition-all duration-75 flex flex-col items-center justify-center z-10 ${currentDb >= 85 ? 'animate-bounce' : ''}`}>
                <div className="relative flex items-center justify-center">
                  <svg 
                    className="w-36 h-48 transition-all duration-100 drop-shadow-[0_0_35px_rgba(var(--brand-500-rgb,212,175,55),0.25)]" 
                    viewBox="0 0 100 150" 
                    style={{ 
                      transform: `scale(${1 + currentDb / 200})`, 
                      filter: currentDb > 70 ? 'url(#sizzleFilter)' : '' 
                    }}
                  >
                    <defs>
                      {/* Sizzle turbulence heat waves filter */}
                      <filter id="sizzleFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.95" numOctaves="1" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale={currentDb / 10} xChannelSelector="R" yChannelSelector="G" />
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
                      opacity={currentDb > 0 ? Math.min(currentDb / 25, 1) : 0}
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
                      opacity={Math.min(currentDb / 90, 0.95)} 
                      className="transition-opacity duration-75 mix-blend-screen"
                    />
                  </svg>
                  
                  {/* Glowing background heat blur */}
                  {currentDb > 20 && (
                    <div 
                      className="absolute w-36 h-48 bg-gradient-to-t from-red-600 via-orange-500 to-gold-500 rounded-full blur-3xl opacity-30 z-[-1] transition-all duration-75"
                      style={{ transform: `scale(${currentDb / 30})` }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Sound Wave Equalizer Bars */}
            <div className="flex items-end justify-center gap-1.5 h-12 mt-6">
              {[...Array(9)].map((_, i) => {
                const centerFactor = 1 - Math.abs(i - 4) / 5;
                const height = Math.max(8, Math.round(currentDb * centerFactor * (0.5 + Math.random() * 0.5)));
                return (
                  <div 
                    key={i} 
                    style={{ height: `${height}%` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-gold-500 transition-all duration-75 ease-out shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                  />
                );
              })}
            </div>

            {/* Decibel Display & Funny Spicy Comments */}
            <div className="space-y-1.5 text-center mt-4">
              <div className="font-mono text-3xl font-black text-white tracking-widest drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2">
                <span>{currentDb}</span>
                <span className="text-stone-500 uppercase tracking-widest font-black text-[10px]">dB Sizzle</span>
              </div>
              <p className="text-[10px] text-gold-400 font-black uppercase tracking-[0.15em] min-h-[1.5rem] transition-all animate-pulse">
                {currentDb === 0 && "Ready... Steady... Inhale!"}
                {currentDb > 0 && currentDb < 30 && "Whispering to the Shawarma won't sizzle it! LOUDER! 📣"}
                {currentDb >= 30 && currentDb < 55 && "Warm breeze... Turn up the volume! 🌶️"}
                {currentDb >= 55 && currentDb < 75 && "Getting spicy! Keep screaming! 🔥"}
                {currentDb >= 75 && currentDb < 85 && "Sizzling hot! Louder for maximum grill! 🥩"}
                {currentDb >= 85 && "GOLDEN CRISPY UNLOCKED! YOUR LUNGS ARE FIERY! 🏆🔥"}
              </p>
            </div>

            {/* Max Decibel Record Bar */}
            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-[10px] text-stone-500 font-bold uppercase tracking-widest px-2">
                <span>Peak Sizzle reached</span>
                <span>{maxDb} dB</span>
              </div>
              <div className="w-full h-3 bg-[#050505] rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-brand-600 to-orange-500 rounded-full transition-all duration-300"
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
                {generatedCoupon.isFreeItem ? (
                  <>
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-gradient-to-r from-yellow-500/10 to-transparent border-l-2 border-yellow-500 text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 animate-pulse">
                        <Award size={14} className="text-red-500 animate-bounce" /> Grand Prize Winner
                      </div>
                      <h2 className="text-3xl font-serif text-white">Legendary Spit Roaster!</h2>
                      <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto font-light">
                        You roasted the virtual spit with a mind-blowing peak intensity of <strong className="text-white font-bold">{maxDb} dB</strong>! You've unlocked a <strong className="text-amber-400 font-bold">FREE SHAWARMA ROLL!</strong>
                      </p>
                    </div>

                    {/* Highly aesthetic Golden Claim Ticket Card */}
                    <div className="relative w-full bg-gradient-to-br from-yellow-950/20 via-[#0a0a0a] to-[#0c0c0c] border border-yellow-500/30 p-8 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.05),0_0_40px_rgba(var(--brand-500-rgb,212,175,55),0.15)] group animate-pulse">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,_rgba(var(--brand-500-rgb,212,175,55),0.15)_0%,_transparent_70%)] rounded-full"></div>
                      
                      {/* Left & Right Ticket Cuts */}
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#030303] rounded-full border border-yellow-500/20 z-10"></div>
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#030303] rounded-full border border-yellow-500/20 z-10"></div>

                      <div className="space-y-6 relative z-10">
                        <div>
                          <span className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.35em] block mb-1">Grand Claim Pass</span>
                          <div className="font-mono text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-[0.1em] drop-shadow-md">
                            {generatedCoupon.code}
                          </div>
                        </div>
                        
                        <div className="border-t border-dashed border-yellow-500/25 pt-4 flex flex-col gap-2 text-xs">
                          <span className="text-stone-300 font-bold flex items-center justify-center gap-1.5"><Gift size={14} className="text-red-500" /> 1x Free Hot Shawarma Roll</span>
                          <span className="text-stone-500 uppercase tracking-widest text-[9px] font-black">Present this screen to cashiers/drivers to claim!</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-gradient-to-r from-green-500/10 to-transparent border-l-2 border-green-500 text-green-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                        <Award size={14} className="animate-bounce" /> Challenge Won
                      </div>
                      <h2 className="text-3xl font-serif text-white">Sizzling Golden Roast!</h2>
                      <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto font-light">
                        You roasted the Shawarma to a peak intensity of <strong className="text-white font-bold">{maxDb} dB</strong> (average: {averageDb} dB). Unlocked <strong className="text-amber-400 font-bold">{generatedCoupon.value}% OFF</strong> coupon!
                      </p>
                    </div>

                    {/* Highly aesthetic Golden Coupon Ticket Card */}
                    <div className="relative w-full bg-[#050505] border border-white/10 p-8 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),0_0_40px_rgba(var(--brand-500-rgb,212,175,55),0.08)] group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,_rgba(var(--brand-500-rgb,212,175,55),0.15)_0%,_transparent_70%)] rounded-full"></div>
                      
                      {/* Left & Right Ticket Cuts */}
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#030303] rounded-full border border-white/10 z-10"></div>
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#030303] rounded-full border border-white/10 z-10"></div>

                      <div className="space-y-6 relative z-10">
                        <div>
                          <span className="text-[10px] text-stone-500 font-black uppercase tracking-[0.35em] block mb-1">Coupon Issued</span>
                          <div className="font-mono text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-[0.1em] drop-shadow-md">
                            {generatedCoupon.code}
                          </div>
                        </div>
                        
                        <div className="border-t border-dashed border-white/10 pt-4 flex justify-between items-center text-xs">
                          <span className="text-stone-400 font-light flex items-center gap-1.5"><Gift size={12} className="text-amber-500" /> {generatedCoupon.value}% Savings</span>
                          <span className="text-stone-500 uppercase tracking-widest text-[9px] font-bold">Expires: 24h</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={copyCoupon}
                    className="flex-1 py-5 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-stone-950 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(var(--brand-500-rgb,212,175,55),0.15)] transition-all active:scale-[0.98]"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : (generatedCoupon.isFreeItem ? 'Copy Claim Pass' : 'Copy Code')}
                  </button>
                  
                  <button 
                    onClick={() => {
                      copyCoupon();
                      navigate('/');
                    }}
                    className="flex-1 py-5 bg-stone-900 border border-white/5 text-stone-300 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all hover:bg-stone-850"
                  >
                    {generatedCoupon.isFreeItem ? 'Return to Menu' : 'Apply & Order'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-3xl font-serif text-white">Cold Spit...</h2>
                  <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto font-light">
                    You reached a peak volume of <strong className="text-white font-bold">{maxDb} dB</strong>. We require at least <strong className="text-amber-400 font-bold">50 dB</strong> of pure screaming power to sizzle the Shawarma!
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

      {/* Funny & Sarcastic Terms and Conditions Modal */}
      {!acceptedTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6 overflow-y-auto">
          <div className="bg-[#0b0505] border border-red-500/20 max-w-md w-full rounded-[2.5rem] p-8 space-y-6 shadow-[0_0_80px_rgba(239,68,68,0.15)] animate-scale-up relative">
            {/* Glowing backdrop atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.2),transparent_70%)] pointer-events-none rounded-[2.5rem]"></div>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-red-500/10 blur-2xl rounded-full"></div>

            {/* Header Shield */}
            <div className="text-center relative z-10 space-y-2.5">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-650 to-orange-600 border border-white/10 text-stone-950 rounded-3xl mb-1.5 shadow-[0_8px_20px_rgba(239,68,68,0.25)] animate-pulse">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-2xl font-serif text-white tracking-wide">Dignity Waiver Contract</h2>
              <p className="text-gold-500 text-[9px] uppercase tracking-[0.25em] font-black">Official Chillies Scream Challenge Agreement</p>
              {/* Interactive Sarcastic Clauses */}
            <div className="relative z-10 bg-stone-950/80 border border-white/5 rounded-3xl p-5 max-h-[260px] overflow-y-auto space-y-4 scrollbar-thin">
              
              <div className="flex gap-3 items-start border-b border-white/[0.02] pb-3">
                <div className="w-6 h-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 font-mono">I</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-stone-200 text-[10px] uppercase tracking-wider">Clause I: The Public Spectacle Decree</h5>
                  <p className="leading-relaxed text-xs font-light text-stone-400">You grant full legal immunity to any neighbor, family member, roommate, or highly judgmental house cat who walks in on you shrieking at your phone like a startled banshee at 2 AM. If they film you and you go viral, you agree we get 50% of the ad revenue.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start border-b border-white/[0.02] pb-3">
                <div className="w-6 h-6 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 font-mono">II</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-stone-200 text-[10px] uppercase tracking-wider">Clause II: Liquid Damage Splash Zone</h5>
                  <p className="leading-relaxed text-xs font-light text-stone-400">High-decibel stoking inevitably turns your smartphone screen into a water park splash zone. Chillies Restaurant accepts ZERO liability for saliva-induced screen failure or moisture damage. Clean your screen immediately, you beautiful savage.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start border-b border-white/[0.02] pb-3">
                <div className="w-6 h-6 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 font-mono">III</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-stone-200 text-[10px] uppercase tracking-wider">Clause III: Squeaks, Cracks & seagull mimicry</h5>
                  <p className="leading-relaxed text-xs font-light text-stone-400">Should your voice crack, squeak like a deflating clown balloon, or resemble a startled seagull, you agree to wear your brief vocal embarrassment as a badge of honor. No refunds on fractured pride or dry throat mornings.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start border-b border-white/[0.02] pb-3">
                <div className="w-6 h-6 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 font-mono">IV</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-stone-200 text-[10px] uppercase tracking-wider">Clause IV: Temporary Soul Lease</h5>
                  <p className="leading-relaxed text-xs font-light text-stone-400">By ticking below, you temporarily lease the spiritual rights of your vocal cords to our virtual rotating meat spit. Cords will be returned after the game, or once the virtual spit reaches absolute golden-crispy perfection.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 bg-red-650/10 border border-red-500/20 text-red-450 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 font-mono">V</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-stone-200 text-[10px] uppercase tracking-wider">Clause V: Drool Pools & Hunger Traps</h5>
                  <p className="leading-relaxed text-xs font-light text-stone-400">We accept zero responsibility for keyboard short-circuits caused by drool pools triggered by our gorgeous stoking flame graphics. Side effects of playing include extreme immediate hunger and sudden impulse purchasing.</p>
                </div>
              </div>

            </div>

            {/* Checkbox gate */}
            <div className="relative z-10 bg-stone-950 border border-white/5 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="agree-vocal" 
                  className="w-4 h-4 rounded border-stone-800 bg-stone-900 text-red-500 focus:ring-0 cursor-pointer accent-red-500 shrink-0" 
                  onChange={(e) => {
                    const spitCheck = document.getElementById('agree-spit') as HTMLInputElement;
                    if (e.target.checked && spitCheck && spitCheck.checked) {
                      setTimeout(() => setAcceptedTerms(true), 250);
                    }
                  }}
                />
                <label htmlFor="agree-vocal" className="text-[9px] text-stone-400 font-bold uppercase tracking-wider cursor-pointer select-none">
                  I legally surrender my vocal dignity in exchange for roasted poultry
                </label>
              </div>

              <div className="flex items-center gap-3 border-t border-white/[0.03] pt-3">
                <input 
                  type="checkbox" 
                  id="agree-spit" 
                  className="w-4 h-4 rounded border-stone-800 bg-stone-900 text-red-500 focus:ring-0 cursor-pointer accent-red-500 shrink-0" 
                  onChange={(e) => {
                    const vocalCheck = document.getElementById('agree-vocal') as HTMLInputElement;
                    if (e.target.checked && vocalCheck && vocalCheck.checked) {
                      setTimeout(() => setAcceptedTerms(true), 250);
                    }
                  }}
                />
                <label htmlFor="agree-spit" className="text-[9px] text-stone-400 font-bold uppercase tracking-wider cursor-pointer select-none">
                  I promise NOT to shower my smartphone in high-decibel spit droplets
                </label>
              </div>
            </div>
            </div>
            
            {/* Action buttons */}
            <div className="relative z-10 flex gap-4">
              <button 
                onClick={() => navigate('/')}
                className="w-1/3 py-4 bg-stone-950 border border-white/5 text-stone-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-stone-900 active:scale-95"
              >
                Coward's Exit
              </button>
              <button 
                disabled 
                className="w-2/3 py-4 bg-stone-900/50 text-stone-600 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed border border-white/5 flex items-center justify-center gap-2"
              >
                Accept & Play (Tick BOTH boxes)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <footer className="relative z-10 py-6 text-center text-[9px] text-stone-600 uppercase tracking-[0.2em] font-bold border-t border-white/[0.03]">
        &copy; 2026 Chillies Restaurant | Scream Challenge
      </footer>
    </div>
  );
});
