
import React from 'react';
import { Zap, PartyPopper } from 'lucide-react';

interface NotificationTickerProps {
  isFlashSaleActive: boolean;
  isHappyHourActive: boolean;
  flashSaleEndTime: string;
}

const NotificationTicker: React.FC<NotificationTickerProps> = ({ isFlashSaleActive, isHappyHourActive, flashSaleEndTime }) => {
  if (!isFlashSaleActive && !isHappyHourActive) return null;

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  };

  return (
    <div className="fixed top-0 left-0 w-full z-[60] bg-stone-950 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest overflow-hidden h-8 flex items-center border-b border-gold-500/20">
      <div className="animate-marquee whitespace-nowrap flex items-center gap-12 w-full">
        {/* Repeat content to ensure smooth loop */}
        {[...Array(6)].map((_, i) => (
          <React.Fragment key={i}>
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
            <span className="text-stone-700">///</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default NotificationTicker;
