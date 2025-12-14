import React from 'react';
import { Instagram, Facebook, Twitter, MapPin, Phone, Clock, Bike, ArrowUp } from 'lucide-react';

interface FooterProps {
    onOpenAdmin: () => void;
    onOpenTC: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenTC }) => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer id="contact" className="bg-stone-950 pt-24 pb-12 border-t border-white/5 relative overflow-hidden scroll-mt-24">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"></div>
            
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 mb-20">
                    
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="font-serif text-2xl text-white font-bold tracking-wider uppercase">
                            Chillies<span className="text-gold-500">.</span>
                        </div>
                        <p className="text-stone-400 text-sm leading-relaxed font-light">
                            Crafting culinary masterpieces that ignite the senses. Experience the perfect blend of tradition and innovation.
                        </p>
                        <div className="flex gap-4">
                             {[Instagram, Facebook, Twitter].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-stone-900 border border-white/5 flex items-center justify-center text-stone-400 hover:bg-gold-500 hover:text-stone-950 hover:border-gold-500 transition-all duration-300 group">
                                    <Icon size={18} className="group-hover:scale-110 transition-transform" />
                                </a>
                             ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-white font-serif text-lg mb-6">Visit Us</h4>
                        <ul className="space-y-6">
                            <li className="flex gap-4 text-sm text-stone-400 group">
                                <div className="p-2 bg-stone-900 rounded-lg shrink-0 group-hover:text-gold-500 transition-colors">
                                    <MapPin size={18} />
                                </div>
                                <span className="leading-relaxed group-hover:text-stone-300 transition-colors">Chillies Restaurant,<br/>Valiyakulam, Alappuzha</span>
                            </li>
                            <li className="flex gap-4 text-sm text-stone-400 group">
                                <div className="p-2 bg-stone-900 rounded-lg shrink-0 group-hover:text-gold-500 transition-colors">
                                    <Phone size={18} />
                                </div>
                                <span className="group-hover:text-stone-300 transition-colors">+91 83010 32794</span>
                            </li>
                            <li className="flex gap-4 text-sm text-stone-400 group">
                                <div className="p-2 bg-stone-900 rounded-lg shrink-0 group-hover:text-gold-500 transition-colors">
                                    <Clock size={18} />
                                </div>
                                <span className="group-hover:text-stone-300 transition-colors">Mon - Sun: 07:00 AM - 12:00 PM</span>
                            </li>
                        </ul>
                    </div>

                    {/* Delivery Promise */}
                    <div>
                         <h4 className="text-white font-serif text-lg mb-6">We Promise</h4>
                        <div 
                            className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border-2 border-gold-500/40 p-6 rounded-xl relative overflow-hidden group cursor-pointer hover:border-gold-500 transition-all duration-500 shadow-[0_0_25px_-5px_rgba(212,175,55,0.15)] hover:shadow-[0_0_35px_-5px_rgba(212,175,55,0.3)] hover:-translate-y-1"
                            onClick={onOpenTC}
                        >
                            <div className="absolute -right-6 -top-6 text-gold-500/10 transform rotate-12 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                                <Bike size={110} />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 bg-gold-500 text-stone-950 rounded-lg shadow-lg shadow-gold-500/20 group-hover:animate-bounce-slow">
                                        <Bike size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <span className="font-serif font-bold text-white text-xl block leading-none">30 Min Delivery</span>
                                        <span className="text-[10px] text-gold-500 font-bold uppercase tracking-[0.2em] mt-1 block">Guaranteed</span>
                                    </div>
                                </div>
                                <p className="text-xs text-stone-400 mb-5 leading-relaxed font-light pr-2">
                                    Delivery within 30 minutes or you get a reward on your next order!
                                </p>
                                <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gold-500 group-hover:text-white transition-colors">
                                    <span>View Policy</span>
                                    <span className="w-6 h-[1px] bg-gold-500 group-hover:w-12 transition-all duration-300"></span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-stone-600 text-xs tracking-wider uppercase">
                        © {new Date().getFullYear()} Chillies Restaurant. All rights reserved.
                    </p>
                    
                    <div className="flex items-center gap-6">
                        <span 
                            onClick={onOpenAdmin}
                            className="text-[10px] text-stone-800 hover:text-stone-600 cursor-pointer select-none transition-colors uppercase tracking-widest font-bold"
                        >
                            Spread Happiness
                        </span>
                        <button 
                            onClick={scrollToTop}
                            className="p-2 bg-stone-900 border border-white/5 rounded-full text-stone-500 hover:text-gold-500 hover:border-gold-500 transition-all"
                        >
                            <ArrowUp size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;