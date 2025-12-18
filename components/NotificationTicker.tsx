
import React from 'react';
import { Zap, PartyPopper, Lock, Clock } from 'lucide-react';

interface NotificationTickerProps {
  isFlashSaleActive: boolean;
  isHappyHourActive: boolean;
  flashSaleEndTime: string;
  isStoreOpen?: boolean;
  startTime?: string;
}

const NotificationTicker: React.FC<NotificationTickerProps> = ({ 
  isFlashSaleActive, 
  isHappyHourActive, 
  flashSaleEndTime,
  isStoreOpen = true,
  startTime = ''
}) => {
  if (isStoreOpen && !isFlashSaleActive && !isHappyHourActive) return null;

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours)) return timeStr;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  };

  const tickerClass = `fixed top-0 left-0 w-full z-[60] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest overflow-hidden h-8 flex items-center border-b transition-colors duration-500 ${
    !isStoreOpen 
      ? 'bg-red-950/90 border-red-500/30' 
      : 'bg-stone-950 border-gold-500/20'
  }`;

  return (
    <div className={tickerClass}>
      <div className="animate-marquee whitespace-nowrap flex items-center gap-12 w-full">
        {/* Repeat content to ensure smooth loop */}
        {[...Array(8)].map((_, i) => (
          <React.Fragment key={i}>
            {!isStoreOpen ? (
              <span className="flex items-center gap-2 text-red-400">
                <Lock size={12} className="animate-pulse" /> 
                Kitchen Currently Offline — We resume taking orders at {formatTime(startTime)}
              </span>
            ) : (
              <>
                {isFlashSaleActive && (
                  <span className="flex items-center gap-2 text-red-500">
                    <Zap size={12} fill="currentColor" /> 
                    Flash Sale Live! Ends at {formatTime(flashSaleEndTime)}
                  </span>
                )}
                {isHappyHourActive && (
                  <span className="flex items-center gap-2 text-purple-400">
                    <PartyPopper size={12} fill="currentColor" /> 
                    Happy Hour is ON! Grab exclusive deals now.
                  </span>
                )}
              </>
            )}
            <span className="text-stone-700">///</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default NotificationTicker;
