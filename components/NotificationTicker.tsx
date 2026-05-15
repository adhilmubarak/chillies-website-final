
import React from 'react';
import { Zap, PartyPopper, Lock, Clock, MessageSquare, Diamond } from 'lucide-react';

interface NotificationTickerProps {
  isFlashSaleActive: boolean;
  isHappyHourActive: boolean;
  flashSaleEndTime: string;
  isStoreOpen?: boolean;
  startTime?: string;
  announcement?: string;
  isAnnouncementActive?: boolean;
}

const NotificationTicker: React.FC<NotificationTickerProps> = ({ 
  isFlashSaleActive, 
  isHappyHourActive, 
  flashSaleEndTime,
  isStoreOpen = true,
  startTime = '',
  announcement = '',
  isAnnouncementActive = false
}) => {
  if (isStoreOpen && !isFlashSaleActive && !isHappyHourActive && !isAnnouncementActive) return null;

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours)) return timeStr;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  };

  const tickerClass = `fixed top-0 left-0 w-full z-[100] backdrop-blur-md text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] overflow-hidden h-10 flex items-center border-b shadow-lg transition-all duration-700 ${
    !isStoreOpen 
      ? 'bg-red-950/80 border-red-500/30 text-red-100' 
      : 'bg-stone-950/80 border-gold-500/20 text-white'
  }`;

  return (
    <div className={tickerClass}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_3s_infinite] pointer-events-none"></div>
      <div className="animate-marquee whitespace-nowrap flex items-center gap-16 w-full">
        {/* Repeat content to ensure smooth loop */}
        {[...Array(6)].map((_, i) => (
          <React.Fragment key={i}>
            {!isStoreOpen ? (
              <span className="flex items-center gap-3 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                <Lock size={14} className="animate-pulse" /> 
                Kitchen Offline — Resuming orders at <span className="text-white font-mono">{formatTime(startTime)}</span>
              </span>
            ) : (
              <>
                {isFlashSaleActive && (
                  <span className="flex items-center gap-3 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    <Zap size={14} fill="currentColor" className="animate-bounce" /> 
                    Flash Sale LIVE! <span className="text-white">Ends at {formatTime(flashSaleEndTime)}</span>
                  </span>
                )}
                {isHappyHourActive && (
                  <span className="flex items-center gap-3 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                    <PartyPopper size={14} fill="currentColor" /> 
                    Happy Hour ON! <span className="text-white">Exclusive Deals Active</span>
                  </span>
                )}
                {isAnnouncementActive && announcement && announcement.split('\n').map((line, idx) => line.trim() ? (
                  <React.Fragment key={idx}>
                     <span className="flex items-center gap-3 text-gold-500 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                       <MessageSquare size={14} fill="currentColor" /> 
                       {line}
                     </span>
                  </React.Fragment>
                ) : null)}
              </>
            )}
            <div className="flex items-center gap-4 opacity-30">
                <Diamond size={8} fill="currentColor" className="text-gold-500" />
                <div className="h-4 w-px bg-stone-700"></div>
                <Diamond size={8} fill="currentColor" className="text-gold-500" />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default NotificationTicker;
