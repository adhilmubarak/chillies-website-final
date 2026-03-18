import React, { useState, useEffect } from 'react';
import { Utensils, ImageOff } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  className, 
  containerClassName = "",
  fallbackSrc = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src || undefined);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    if (!src) {
        setImgSrc(undefined);
        setStatus('error');
        return;
    }
    setImgSrc(src as string);
    setStatus('loading');
  }, [src]);

  const handleError = () => {
    if (status !== 'error') {
      setImgSrc(fallbackSrc);
      setStatus('error');
    }
  };

  const handleLoad = () => {
    setStatus('loaded');
  };

  return (
    <div className={`relative overflow-hidden bg-stone-50 ${containerClassName}`}>
      {/* Premium Shimmer Loading State */}
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="shimmer-bg absolute inset-0 animate-shimmer"></div>
          <Utensils className="text-stone-800 w-1/4 h-1/4 animate-pulse opacity-20" />
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10 text-stone-700">
          <ImageOff size={24} className="mb-2 opacity-30" />
          <span className="text-[8px] uppercase tracking-widest font-black opacity-20">Link Broken</span>
        </div>
      )}

      <img
        {...props}
        src={imgSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} transition-all duration-700 ease-out ${
          status === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-sm'
        }`}
      />
    </div>
  );
};

export default SafeImage;