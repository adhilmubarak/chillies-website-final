import React, { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
  priority?: boolean;
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  className, 
  containerClassName = "",
  fallbackSrc = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  priority = false,
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src as any);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    setImgSrc(src as any);
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
    <div className={`relative overflow-hidden bg-stone-900 ${containerClassName}`}>
      {/* Skeleton Shimmer Overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            <Utensils className="text-stone-800 w-1/4 h-1/4" />
        </div>
      )}
      
      <img
        {...props}
        src={imgSrc || fallbackSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`${className} transition-all duration-700 ease-out ${
          status === 'loaded' 
            ? 'opacity-100 blur-0 scale-100' 
            : 'opacity-0 blur-2xl scale-110'
        }`}
      />
    </div>
  );
};

export default SafeImage;