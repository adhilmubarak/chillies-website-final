import React from 'react';
import { Quote } from 'lucide-react';

const Story: React.FC = () => {
  return (
    <section id="story" className="py-24 px-4 bg-stone-900 border-b border-white/5 relative overflow-hidden scroll-mt-24">
        {/* Decorative Background */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"></div>
        <div className="absolute -left-20 top-20 w-64 h-64 bg-gold-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -right-20 bottom-20 w-64 h-64 bg-gold-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-block animate-bounce-slow mb-6">
                <span className="text-5xl filter drop-shadow-lg">🌶</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-16 leading-tight">
                The Story of <span className="text-gold-500">Chillies</span>
            </h2>
            
            <div className="space-y-10 text-lg md:text-xl text-stone-400 font-light leading-relaxed">
                <p>
                    Founded in 2013, Chillies began as a small dream fueled by passion, flavor, and relentless hard work. What started with a simple idea—to serve food that warms the heart and excites the palate—quickly grew into a beloved destination for those who crave authentic taste and uncompromising quality.
                </p>

                <div className="py-10 relative">
                    <Quote className="absolute top-0 left-1/2 -translate-x-1/2 text-gold-500/10 w-24 h-24 transform -translate-y-4" />
                    <p className="font-serif text-2xl md:text-3xl text-gold-400 italic relative z-10">
                        From the very first day, our journey has been shaped by one belief:
                        <span className="block mt-4 text-white not-italic font-bold tracking-wide text-3xl">Hard work matters.</span>
                    </p>
                </div>

                <p>
                    Every recipe crafted, every shawarma rolled, every batch of fried chicken served carries the spirit of dedication that built Chillies. We didn’t grow overnight. We grew through early mornings, late nights, and a commitment to giving our customers nothing but the best.
                </p>

                <p>
                    Today, Chillies stands as a symbol of passion turned into flavor—where the heat of spices meets the warmth of service. Our mission remains unchanged: to serve food that speaks for itself and to create experiences that keep our customers coming back.
                </p>
                
                <div className="pt-10 border-t border-white/5 mt-12 inline-block">
                    <p className="text-2xl font-serif text-white">
                        Chillies is not just a restaurant.<br/>
                        <span className="text-gold-500 text-lg uppercase tracking-widest mt-2 block font-sans font-bold">It’s a story of persistence, flavor, and heart.</span>
                    </p>
                </div>
            </div>
        </div>
    </section>
  );
};

export default Story;