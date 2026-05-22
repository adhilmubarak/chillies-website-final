import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Search, CheckCircle, Award, Gift, Wifi, Flame, Copy, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { LoyaltyAccount } from '../types';

// WebAudioScratchSynth - Procedural sandbox sound effects engine
class WebAudioScratchSynth {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  constructor() {}

  private init() {
    if (this.ctx) return;
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    
    // Filter Node: band-pass to simulate scratch tone
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'bandpass';
    this.filterNode.frequency.value = 3000;
    this.filterNode.Q.value = 4.0;

    // Gain Node
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0;

    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
  }

  public startScratch() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) return;

    // Create 1-second white noise buffer
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    if (this.filterNode) {
      source.connect(this.filterNode);
    }
    
    source.start(0);
    this.noiseNode = source;
    this.isPlaying = true;
  }

  public scratch(speed: number) {
    if (!this.ctx || !this.gainNode || !this.filterNode) return;
    
    const targetGain = Math.min(speed * 0.12, 0.4);
    const targetFreq = 2200 + Math.min(speed * 300, 1600);
    
    const now = this.ctx.currentTime;
    this.gainNode.gain.setTargetAtTime(targetGain, now, 0.05);
    this.filterNode.frequency.setTargetAtTime(targetFreq, now, 0.05);
  }

  public stopScratch() {
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;
    this.gainNode.gain.setTargetAtTime(0, now, 0.08);
    
    setTimeout(() => {
      if (this.noiseNode && this.gainNode && this.gainNode.gain.value < 0.01) {
        try {
          this.noiseNode.stop();
          this.noiseNode.disconnect();
        } catch (e) {}
          this.noiseNode = null;
          this.isPlaying = false;
      }
    }, 120);
  }

  public playChime() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.4); // D6
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now); // A5
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.4); // A6

    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    osc1.connect(chimeGain);
    osc2.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.8);
    osc2.stop(now + 0.8);
  }
}

// GoldenTicketScratchCard component
interface GoldenTicketScratchCardProps {
  phone: string;
}

const GoldenTicketScratchCard: React.FC<GoldenTicketScratchCardProps> = ({ phone }) => {
  const [isScratched, setIsScratched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [scratchedPercentage, setScratchedPercentage] = useState(0);
  const [isFaded, setIsFaded] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const synthRef = useRef<WebAudioScratchSynth | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const lastTime = useRef<number>(0);

  useEffect(() => {
    const isCompleted = localStorage.getItem('chillies_scratch_ticket_scratched_' + phone) === 'true';
    if (isCompleted) {
      setIsScratched(true);
      setIsFaded(true);
      setScratchedPercentage(100);
    } else {
      setIsScratched(false);
      setIsFaded(false);
      setScratchedPercentage(0);
    }
  }, [phone]);

  useEffect(() => {
    synthRef.current = new WebAudioScratchSynth();
    return () => {
      synthRef.current?.stopScratch();
    };
  }, []);

  useEffect(() => {
    if (isFaded) return;
    
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 380;
      const height = rect.height || 210;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#aa7c11');
      grad.addColorStop(0.15, '#ffe066');
      grad.addColorStop(0.3, '#aa7c11');
      grad.addColorStop(0.5, '#b8860b');
      grad.addColorStop(0.7, '#ffe066');
      grad.addColorStop(0.85, '#d4af37');
      grad.addColorStop(1, '#aa7c11');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i < height; i += 2) {
        ctx.beginPath();
        ctx.moveTo(0, i + Math.random() * 2);
        ctx.lineTo(width, i + Math.random() * 2);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let i = 0; i < 600; i++) {
        const px = Math.random() * width;
        const py = Math.random() * height;
        const size = Math.random() * 1.5;
        ctx.fillRect(px, py, size, size);
      }

      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 12, width - 24, height - 24);

      const drawFoilStar = (cx: number, cy: number, r: number) => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r + cx, -Math.sin((18 + i * 72) * Math.PI / 180) * r + cy);
          ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r/2.2) + cx, -Math.sin((54 + i * 72) * Math.PI / 180) * (r/2.2) + cy);
        }
        ctx.closePath();
        ctx.fill();
      };
      drawFoilStar(22, 22, 5);
      drawFoilStar(width - 22, 22, 5);
      drawFoilStar(22, height - 22, 5);
      drawFoilStar(width - 22, height - 22, 5);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.textAlign = 'center';
      ctx.fillText('CHILLIES ELITE VIP', width / 2, height / 2 - 25);

      ctx.font = 'italic italic bold 18px Georgia, serif';
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillText('Golden Ticket', width / 2, height / 2 + 2);

      ctx.font = 'bold 7.5px monospace';
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillText('⚡ SCRATCH TO REVEAL REWARD ⚡', width / 2, height / 2 + 25);
    }, 150);

    return () => clearTimeout(timer);
  }, [isFaded]);

  const checkScratchPercentage = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    
    const width = canvas.width;
    const height = canvas.height;
    const sampleSize = 24;
    let transparentCount = 0;
    
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    const stepX = Math.floor(width / sampleSize);
    const stepY = Math.floor(height / sampleSize);
    
    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const pixelX = x * stepX + Math.floor(stepX / 2);
        const pixelY = y * stepY + Math.floor(stepY / 2);
        const index = (pixelY * width + pixelX) * 4;
        const alpha = data[index + 3];
        if (alpha < 50) {
          transparentCount++;
        }
      }
    }
    
    return Math.round((transparentCount / (sampleSize * sampleSize)) * 100);
  };

  const createSparkle = (x: number, y: number) => {
    const newSparkle = {
      id: Math.random(),
      x,
      y,
      size: Math.random() * 8 + 5
    };
    setSparkles(prev => [...prev.slice(-12), newSparkle]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
    }, 800);
  };

  const triggerReveal = () => {
    if (isFaded) return;
    setIsFaded(true);
    setScratchedPercentage(100);
    
    if (audioEnabled && synthRef.current) {
      synthRef.current.playChime();
    }
    
    localStorage.setItem('chillies_scratch_ticket_scratched_' + phone, 'true');
    
    setTimeout(() => {
      setIsScratched(true);
    }, 700);
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isFaded) return;
    
    if (e.cancelable) {
      e.preventDefault();
    }

    if (audioEnabled && synthRef.current) {
      synthRef.current.startScratch();
    }
    
    const pos = getMousePos(e);
    if (!pos) return;
    
    setIsScratching(true);
    lastPos.current = pos;
    lastTime.current = Date.now();
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isScratching || isFaded) return;
    
    if (e.cancelable) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);
    if (!pos) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
    } else {
      ctx.moveTo(pos.x, pos.y);
    }
    
    ctx.lineWidth = 36;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (Math.random() < 0.35) {
      createSparkle(pos.x, pos.y);
    }

    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0 && lastPos.current) {
      const dx = pos.x - lastPos.current.x;
      const dy = pos.y - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist / dt;
      
      if (audioEnabled && synthRef.current) {
        synthRef.current.scratch(speed * 25);
      }
    }

    lastPos.current = pos;
    lastTime.current = now;

    if (Math.random() < 0.12) {
      const percent = checkScratchPercentage(canvas);
      setScratchedPercentage(percent);
      if (percent > 45) {
        triggerReveal();
      }
    }
  };

  const handleEnd = () => {
    setIsScratching(false);
    lastPos.current = null;
    
    if (synthRef.current) {
      synthRef.current.stopScratch();
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const percent = checkScratchPercentage(canvas);
      setScratchedPercentage(percent);
      if (percent > 45 && !isFaded) {
        triggerReveal();
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('ELITEGOLD50');
    setCopied(true);
    
    if (audioEnabled && synthRef.current) {
      synthRef.current.playChime();
    }
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleReset = () => {
    localStorage.removeItem('chillies_scratch_ticket_scratched_' + phone);
    setIsScratched(false);
    setIsFaded(false);
    setScratchedPercentage(0);
    setCopied(false);
  };

  return (
    <div className="w-full max-w-[380px] space-y-4">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes goldSweep {
          0% { transform: translateX(-150%) skewX(-25deg); }
          50% { transform: translateX(150%) skewX(-25deg); }
          100% { transform: translateX(150%) skewX(-25deg); }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0; transform: scale(0.2) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(180deg); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(212,175,55,0.2); box-shadow: 0 0 15px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.05); }
          50% { border-color: rgba(212,175,55,0.55); box-shadow: 0 0 25px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.2); }
        }
        .gold-sweep-active {
          animation: goldSweep 5s infinite ease-in-out;
        }
        .border-glow-active {
          animation: borderGlow 3s infinite ease-in-out;
        }
        .scratch-sparkle {
          animation: sparkleTwinkle 0.8s forwards ease-out;
        }
      `}} />

      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] tracking-[0.25em] text-stone-500 uppercase font-black">Elite Scratch Card</span>
        <div className="flex items-center gap-3">
          {!isFaded && (
            <span className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full font-mono text-stone-400 animate-pulse">
              Scratched: {scratchedPercentage}%
            </span>
          )}
          
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-stone-800 text-stone-400 hover:text-gold-400 transition-all flex items-center justify-center shadow-inner"
            title={audioEnabled ? "Mute scratch sounds" : "Unmute scratch sounds"}
          >
            {audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>
      </div>

      <div 
        className="relative w-full aspect-[1.8/1] md:aspect-[2/1] rounded-2xl overflow-hidden group select-none shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gold-950 via-[#070707] to-gold-950 border border-gold-500/30 rounded-2xl p-5 md:p-6 flex flex-col justify-between border-glow-active">
          <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0a0a0a] border border-gold-500/30 z-10"></div>
          <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0a0a0a] border border-gold-500/30 z-10"></div>

          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
            <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-gold-200/15 to-transparent gold-sweep-active"></div>
          </div>

          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-1.5">
              <Award size={15} className="text-gold-400" />
              <span className="text-[9px] tracking-[0.25em] font-serif text-gold-300 uppercase">Chillies VIP Privilege</span>
            </div>
            <span className="text-[7.5px] font-mono tracking-widest text-stone-500">TICKET #ELITE-{phone.slice(-4)}</span>
          </div>

          <div className="text-center my-auto py-1 relative z-10 flex flex-col items-center">
            <h3 className="text-[8.5px] uppercase tracking-[0.3em] text-stone-400 mb-0.5">Exclusive Reward Code</h3>
            <h2 className="text-xl md:text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-400 to-gold-100 font-black tracking-wide leading-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              FREE SHAWAPLATE + 15% OFF
            </h2>
            <p className="text-[8px] text-stone-500 mt-1 uppercase tracking-widest font-mono">Valid on your next dine-in or delivery order</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] relative z-10">
            <div className="text-left">
              <span className="block text-[7px] text-stone-500 uppercase tracking-widest font-mono">Promo Code</span>
              <span className="text-xs md:text-sm font-mono font-black text-white tracking-[0.15em]">ELITEGOLD50</span>
            </div>

            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-stone-950 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_5px_15px_rgba(212,175,55,0.2)] active:scale-95 duration-300"
            >
              {copied ? (
                <>
                  <CheckCircle size={11} strokeWidth={2.5} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={11} strokeWidth={2.5} />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>

        {!isScratched && (
          <canvas
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className={`absolute inset-0 w-full h-full rounded-2xl z-30 cursor-crosshair touch-none transition-opacity duration-700 ease-out ${isFaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          />
        )}

        {!isScratched && sparkles.map(s => (
          <span
            key={s.id}
            className="absolute pointer-events-none scratch-sparkle z-40 text-gold-300 font-bold"
            style={{
              left: s.x,
              top: s.y,
              fontSize: s.size,
            }}
          >
            ✦
          </span>
        ))}
      </div>

      {isScratched && (
        <div className="flex justify-center transition-all animate-fade-in">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-[8.5px] uppercase tracking-widest text-stone-500 hover:text-gold-400 transition-colors font-bold group"
          >
            <RefreshCw size={11} className="group-hover:rotate-180 transition-transform duration-500" />
            Scratch Again / Reset Foil
          </button>
        </div>
      )}
    </div>
  );
};




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
    <div className="min-h-screen bg-[#030303] text-stone-200 font-sans selection:bg-gold-500/30 selection:text-gold-200 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-gold-900/10 to-transparent"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(212,175,55,0.05)_0%,_transparent_60%)] opacity-70 blur-3xl"></div>
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/[0.03] pb-4 pt-6 px-6">
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

      <main className="max-w-[1000px] mx-auto pt-32 px-6 pb-24 relative z-10 flex flex-col md:flex-row gap-16 md:items-center min-h-[90vh]">
        
        {/* Left Side: Copy & Value Prop */}
        <div className="md:w-1/2 space-y-10 animate-fade-in">
            <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-gradient-to-r from-gold-500/10 to-transparent border-l-2 border-gold-500 text-gold-400 text-[10px] font-black uppercase tracking-[0.3em]">
                    <Sparkles size={14} className="animate-pulse" /> Exclusive Access
                </div>
                <h1 className="text-5xl md:text-[5rem] font-serif text-white leading-[1.1] tracking-tight drop-shadow-lg">
                    Elevate <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-600 italic font-medium pr-4">Every Bite.</span>
                </h1>
                <p className="text-stone-400 text-sm md:text-base leading-relaxed max-w-sm font-light">
                    Your WhatsApp number is your key to the Elite tier. Unlock seamless rewards, VIP privileges, and automated cashback on every order.
                </p>
            </div>

            {/* Scream Challenge Promotional Banner */}
            <div 
              onClick={() => navigate('/scream-challenge')}
              className="bg-gradient-to-br from-red-950/40 to-stone-900/60 border border-red-500/20 rounded-[2rem] p-6 hover:border-gold-500/40 transition-all cursor-pointer relative overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,_rgba(239,68,68,0.1)_0%,_transparent_70%)] rounded-full group-hover:opacity-100 transition-opacity"></div>
              <div className="space-y-1.5 max-w-[70%]">
                <span className="inline-flex items-center gap-1.5 text-red-500 text-[9px] font-black uppercase tracking-[0.25em]">
                  <Flame size={12} className="animate-pulse" /> Scream Challenge
                </span>
                <h4 className="text-stone-200 text-sm font-serif font-black tracking-wide">Scream For Spice & Save!</h4>
                <p className="text-stone-500 text-[10px] leading-normal font-light">Scream at your mic, stoke the flame, and win up to <strong className="text-gold-400 font-bold">15% off</strong> instantly.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform group-hover:border-gold-500/30">
                <Flame size={20} className="text-red-500 animate-pulse" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 pt-4">
                <div className="bg-stone-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-[2rem] hover:border-gold-500/30 transition-all group">
                    <Award size={26} className="text-gold-500 mb-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                    <h3 className="text-stone-200 font-bold mb-2 tracking-wide uppercase text-xs">Accumulate</h3>
                    <p className="text-stone-500 text-xs leading-relaxed">Earn 1 point instantly for every ₹10 spent on our premium menu.</p>
                </div>
                <div className="bg-stone-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-[2rem] hover:border-gold-500/30 transition-all group">
                    <Gift size={26} className="text-gold-500 mb-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                    <h3 className="text-stone-200 font-bold mb-2 tracking-wide uppercase text-xs">Indulge</h3>
                    <p className="text-stone-500 text-xs leading-relaxed">Redeem points for flat discounts. 1 Point = ₹1 Off. No limits.</p>
                </div>
            </div>
        </div>

        {/* Right Side: Interactive Terminal */}
        <div className="md:w-1/2 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/[0.05] p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden group/terminal">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.08)_0%,_transparent_70%)] rounded-full transition-all duration-1000 group-hover/terminal:opacity-100 opacity-50"></div>
                
                <h2 className="text-2xl font-serif text-stone-100 mb-3 tracking-wide">Access Portal</h2>
                <p className="text-stone-500 text-xs mb-8">Authenticate with your WhatsApp number</p>

                <form onSubmit={handleCheckBalance} className="space-y-6 relative z-10">
                    <div>
                        <div className="relative group">
                            <input 
                                type="tel" 
                                value={phoneInput} 
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setPhoneInput(val);
                                    setSearchedAccount(undefined);
                                    setIsEnrolling(false);
                                }} 
                                placeholder="10-DIGIT NUMBER"
                                maxLength={10}
                                className="w-full bg-[#050505] border border-white/10 rounded-2xl py-6 px-6 text-stone-100 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-center text-xl tracking-[0.3em] font-mono shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] font-black placeholder:text-stone-800"
                            />
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none"></div>
                        </div>
                    </div>
                    <button 
                        type="submit"
                        disabled={phoneInput.length !== 10}
                        className="w-full py-5 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 bg-[length:200%_auto] hover:bg-right text-stone-950 font-black uppercase tracking-[0.25em] text-[11px] rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(var(--brand-500-rgb,212,175,55),0.2)] disabled:shadow-none"
                    >
                        <Search size={16} strokeWidth={2.5} /> Verify Identity
                    </button>
                </form>

                {searchedAccount !== undefined && (
                    <div className={`mt-10 pt-10 border-t border-white/[0.05] transition-all animate-fade-in relative z-10`}>
                        {searchedAccount ? (
                            <div className="flex flex-col items-center gap-8 animate-fade-in w-full">
                                {/* The Ultra-Premium Elite Card */}
                                <div className="relative w-full max-w-[380px] aspect-[1.586/1] rounded-[1.5rem] p-6 md:p-8 border-[0.5px] border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1),0_0_50px_rgba(212,175,55,0.15)] overflow-hidden group hover:scale-[1.02] hover:-translate-y-2 transition-all duration-700 ease-out">
                                    
                                    {/* Ultra Deep Black Base with Subtle Warmth */}
                                    <div className="absolute inset-0 bg-[#050505] z-0"></div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-gold-900/20 via-black to-black z-0 opacity-80"></div>
                                    
                                    {/* Brushed Metal / Fine Grain Texture */}
                                    <div className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")', backgroundSize: '150px 150px' }}></div>
                                    
                                    {/* Ambient Glows */}
                                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,_rgba(212,175,55,0.25)_0%,_transparent_70%)] rounded-full mix-blend-screen z-0"></div>
                                    <div className="absolute bottom-[-30%] left-[-20%] w-[70%] h-[70%] bg-[radial-gradient(circle,_rgba(120,113,108,0.2)_0%,_transparent_70%)] rounded-full mix-blend-screen z-0"></div>
                                    
                                    {/* Card Edge Highlights (Metallic rim) */}
                                    <div className="absolute inset-0 rounded-[1.5rem] border-[1px] border-transparent bg-gradient-to-br from-gold-400/80 via-white/5 to-gold-600/30 mask-image:linear-gradient(white,white) pointer-events-none z-10" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '1px' }}></div>
                                    
                                    {/* Animated Continuous Sweep (Sheen) */}
                                    <div className="absolute inset-0 z-10 overflow-hidden rounded-[1.5rem] pointer-events-none">
                                      <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-gold-200/10 to-transparent skew-x-[-25deg] animate-[shimmer_6s_infinite_ease-in-out]"></div>
                                    </div>
                                    
                                    {/* Card Content Layer */}
                                    <div className="flex flex-col justify-between h-full relative z-20">
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                  <Award size={26} className="text-gold-300 relative z-10" strokeWidth={1.5} />
                                                  <div className="absolute inset-0 bg-gold-500 blur-md opacity-40 z-0"></div>
                                                </div>
                                                <span className="font-serif text-xl md:text-2xl text-stone-100 tracking-[0.25em] uppercase drop-shadow-md">Chillies</span>
                                            </div>
                                            
                                            {/* Holographic Elite Badge */}
                                            <div className="relative group/badge">
                                                <div className="absolute inset-0 bg-gradient-to-r from-gold-300 via-yellow-100 to-gold-600 blur-[4px] opacity-60 rounded-sm"></div>
                                                <span className="relative text-[9px] md:text-[10px] text-stone-950 font-black uppercase tracking-[0.3em] px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-br from-gold-200 via-gold-400 to-gold-600 rounded-sm shadow-inner flex items-center gap-1 overflow-hidden">
                                                    <span className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover/badge:animate-[shimmer_1.5s_infinite]"></span>
                                                    Elite
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Card Number & Chip */}
                                        <div className="mt-8 flex flex-col gap-3 text-left">
                                            <div className="flex items-center gap-5">
                                                {/* Ultra-Realistic Chip */}
                                                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-[#ffd700] via-[#daa520] to-[#b8860b] shadow-[inset_0_1px_3px_rgba(255,255,255,0.7),inset_0_-1px_4px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.6)] border border-[#8b6508] relative overflow-hidden flex items-center justify-center">
                                                    <div className="absolute top-[30%] left-0 w-full h-[1px] bg-black/30 shadow-[0_1px_0_rgba(255,255,255,0.3)]"></div>
                                                    <div className="absolute top-[70%] left-0 w-full h-[1px] bg-black/30 shadow-[0_1px_0_rgba(255,255,255,0.3)]"></div>
                                                    <div className="absolute left-[30%] top-0 w-[1px] h-full bg-black/30 shadow-[1px_0_0_rgba(255,255,255,0.3)]"></div>
                                                    <div className="absolute left-[70%] top-0 w-[1px] h-full bg-black/30 shadow-[1px_0_0_rgba(255,255,255,0.3)]"></div>
                                                    <div className="w-5 h-4 border border-black/20 rounded-sm bg-gradient-to-br from-white/10 to-transparent"></div>
                                                </div>
                                                {/* Contactless Symbol */}
                                                <Wifi size={28} className="text-stone-300/60 rotate-90 drop-shadow-md" strokeWidth={1.5} />
                                            </div>
                                            
                                            {/* Embossed Card Number */}
                                            <div className="font-mono text-[1.35rem] md:text-[1.65rem] mt-2 tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-stone-300 to-stone-500 font-black" style={{textShadow: '0px 2px 2px rgba(0,0,0,0.9), 0px -1px 1px rgba(255,255,255,0.1)'}}>
                                                {searchedAccount.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex justify-between items-end mt-4 pt-4 relative">
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                            <div className="text-left w-1/2 truncate pr-4">
                                                <span className="block text-[8px] md:text-[9px] text-stone-400 uppercase tracking-[0.2em] mb-1.5 font-medium">Cardholder</span>
                                                <span className="text-sm md:text-base font-black text-stone-100 tracking-[0.15em] uppercase drop-shadow-lg truncate block">
                                                    {searchedAccount.customerName || 'Loyal Diner'}
                                                </span>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <span className="block text-[8px] md:text-[9px] text-stone-400 uppercase tracking-[0.2em] mb-1 font-medium">Points</span>
                                                <span className="font-serif text-3xl md:text-[2.5rem] text-transparent bg-clip-text bg-gradient-to-b from-gold-200 via-gold-400 to-gold-600 font-black drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] leading-none italic relative">
                                                    {searchedAccount.points}
                                                    {/* Points Glow */}
                                                    <span className="absolute inset-0 bg-gold-500 blur-xl opacity-20 z-[-1]"></span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Hover Interactive Flare */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-30 pointer-events-none mix-blend-screen"></div>
                                </div>

                                <div className="w-full max-w-[380px] flex items-center justify-between gap-5 bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl">
                                   <div className="text-left flex-1 pl-2">
                                        <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold mb-1">Status: <span className="text-gold-400">Active</span></p>
                                        <p className="text-stone-300 text-sm leading-tight">Present this QR code in-store to redeem <strong className="text-white">₹{searchedAccount.points}</strong> instantly.</p>
                                   </div>
                                    
                                   <div className="bg-white p-2 rounded-xl shrink-0 shadow-[0_10px_20px_rgba(0,0,0,0.5),0_0_15px_rgba(212,175,55,0.15)] relative group cursor-pointer hover:scale-105 transition-transform duration-300">
                                        <div className="absolute inset-0 bg-gold-500 opacity-0 group-hover:opacity-20 rounded-xl transition-opacity blur-md"></div>
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${searchedAccount.id}&bgcolor=ffffff&color=000000&margin=0`} alt="Loyalty QR" className="w-16 h-16 rounded relative z-10" />
                                   </div>
                                </div>

                                {/* Gamified Golden Ticket Scratch Card Reward Component */}
                                <GoldenTicketScratchCard phone={searchedAccount.phone} />
                            </div>
                        ) : isEnrolling ? (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if(enrollName.trim()) {
                                    await onEnrollLoyalty(phoneInput, enrollName.trim());
                                    setIsEnrolling(false);
                                }
                            }} className="text-center space-y-6 animate-fade-in">
                                <div className="space-y-2 mb-2">
                                    <h3 className="text-white font-serif text-2xl">Initialize Profile</h3>
                                    <p className="text-stone-500 text-xs">You are one step away from Elite status.</p>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="CARDHOLDER NAME" 
                                    value={enrollName}
                                    onChange={e => setEnrollName(e.target.value)}
                                    required
                                    className="w-full bg-[#050505] border border-white/10 rounded-2xl py-5 px-6 text-stone-100 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] font-black text-center tracking-widest uppercase text-sm placeholder:text-stone-800"
                                />
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsEnrolling(false)} className="w-1/3 py-5 bg-white/5 hover:bg-white/10 text-stone-300 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all">Cancel</button>
                                    <button type="submit" className="w-2/3 py-5 bg-brand-500 text-stone-950 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all hover:bg-brand-400 shadow-[0_10px_30px_rgba(var(--brand-500-rgb,212,175,55),0.2)]">Mint Card</button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center space-y-6 animate-fade-in py-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-2">
                                    <Sparkles size={24} className="text-stone-500" />
                                </div>
                                <div className="space-y-2">
                                    <span className="block text-stone-300 text-base font-serif">Identity Not Found</span>
                                    <p className="text-stone-500 text-xs uppercase font-bold tracking-[0.2em]">Ready to claim your Elite Card?</p>
                                </div>
                                <button 
                                    onClick={() => setIsEnrolling(true)}
                                    className="w-full py-5 bg-gradient-to-r from-stone-800 to-stone-900 border border-brand-500/30 text-brand-500 hover:text-brand-400 hover:border-brand-500/60 transition-all font-black uppercase tracking-[0.25em] text-[11px] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                >
                                    Initialize Account
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
