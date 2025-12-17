import React, { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';

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
  // Use explicit type cast to any to handle potential string | Blob mismatch from environment types
  const [imgSrc, setImgSrc] = useState<string | undefined>(src as any);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    // Reset state if src prop changes
    // Casting src to any to resolve string | Blob conflict
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
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 bg-stone-850 animate-pulse flex items-center justify-center z-0">
          <Utensils className="text-stone-700/50 w-1/4 h-1/4" />
        </div>
      )}
      <img
        {...props}
        src={imgSrc || fallbackSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default SafeImage;