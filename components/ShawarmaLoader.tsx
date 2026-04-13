import React, { useState, useEffect } from 'react';

const ShawarmaLoader: React.FC = () => {
    const [bites, setBites] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setBites(b => (b + 1) % 4);
        }, 500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[999] bg-stone-950 flex flex-col items-center justify-center transition-opacity duration-500">
            <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Golden Glow effect */}
                <div className="absolute inset-0 bg-gold-500/20 blur-3xl rounded-full animate-pulse"></div>
                
                <svg className="w-24 h-32 relative z-10" viewBox="0 0 100 150">
                    <g>
                        {/* Meat filling */}
                        <path d="M25,50 C25,10 75,10 75,50 Z" fill="#92400e" className="drop-shadow-lg" />
                        <path d="M30,30 C40,40 60,20 70,30" stroke="#78350f" strokeWidth="3" fill="none" />
                        <path d="M40,20 C50,30 55,20 60,25" stroke="#78350f" strokeWidth="2" fill="none" />
                        
                        {/* Veggies */}
                        <circle cx="35" cy="35" r="8" fill="#22c55e" />
                        <circle cx="65" cy="38" r="6" fill="#ef4444" />
                        <circle cx="50" cy="25" r="7" fill="#fbbf24" />
                        
                        {/* Wrap base */}
                        <path d="M15,50 C30,65 70,65 85,50 L80,135 C80,150 20,150 20,135 Z" fill="#fde68a" />
                        {/* Wrap fold detail */}
                        <path d="M15,50 C40,80 85,50 85,50 C70,75 30,75 15,50 Z" fill="#fcd34d" />
                        
                        {/* Grill marks */}
                        <path d="M25,70 C40,85 60,85 75,70" fill="none" stroke="#d97706" strokeWidth="2" opacity="0.4" />
                        <path d="M28,90 C45,105 55,105 72,90" fill="none" stroke="#d97706" strokeWidth="2" opacity="0.25" />
                        <path d="M32,110 C45,120 55,120 68,110" fill="none" stroke="#d97706" strokeWidth="2" opacity="0.15" />
                    </g>
                    
                    {/* Biting Masks (Simulating teeth marks with background colored circles) */}
                    {bites > 0 && (
                        <g fill="#0c0a09">
                            <circle cx="50" cy="15" r="18" />
                            <circle cx="35" cy="12" r="16" />
                            <circle cx="65" cy="12" r="16" />
                        </g>
                    )}
                    {bites > 1 && (
                        <g fill="#0c0a09">
                            <circle cx="25" cy="30" r="16" />
                            <circle cx="75" cy="30" r="16" />
                            <circle cx="45" cy="28" r="15" />
                            <circle cx="60" cy="28" r="15" />
                        </g>
                    )}
                    {bites > 2 && (
                        <g fill="#0c0a09">
                            <circle cx="35" cy="45" r="18" />
                            <circle cx="65" cy="45" r="18" />
                            <circle cx="50" cy="48" r="20" />
                            <circle cx="15" cy="42" r="14" />
                            <circle cx="85" cy="42" r="14" />
                        </g>
                    )}
                </svg>
            </div>
            
            <div className="flex flex-col items-center gap-3 mt-6">
                <h2 className="text-gold-500 font-serif text-2xl tracking-[0.2em] uppercase font-bold animate-pulse">Unwrapping</h2>
                <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`w-1.5 h-1.5 bg-gold-500 rounded-full transition-opacity duration-300 ${bites >= i ? 'opacity-100' : 'opacity-20'}`}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShawarmaLoader;
