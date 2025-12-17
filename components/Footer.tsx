import React from 'react';
import { Instagram, Facebook, Twitter, MapPin, Phone, Clock, Bike, ArrowUp } from 'lucide-react';

interface FooterProps {
    onOpenAdmin: () => void;
    onOpenTC: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenTC }) => {
    return (
        <footer id="contact" className="bg-stone-950 pt-16 md:pt-24 pb-12 border-t border-white/5 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="font-serif text-2xl text-white font-bold tracking-wider uppercase">Chillies<span className="text-gold-500">.</span></div>
                        <p className="text-stone-500 text-sm font-light leading-relaxed">Crafting culinary masterpieces that ignite the senses. Experience the perfect blend of tradition and innovation.</p>
                        <div className="flex gap-4">
                             {[Instagram, Facebook, Twitter].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-stone-500 hover:text-gold-400 transition-all border border-white/5"><Icon size={18} /></a>
                             ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-white font-serif text-lg">Visit Us</h4>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-sm text-stone-500"><MapPin size={18} className="shrink-0 text-gold-500" /><span>Valiyakulam, Alappuzha</span></li>
                            <li className="flex gap-3 text-sm text-stone-500"><Phone size={18} className="shrink-0 text-gold-500" /><span>+91 83010 32794</span></li>
                            <li className="flex gap-3 text-sm text-stone-500"><Clock size={18} className="shrink-0 text-gold-500" /><span>Open Daily: 07 AM - 12 PM</span></li>
                        </ul>
                    </div>

                    <div 
                        className="bg-stone-900/50 border border-gold-500/20 p-6 rounded-2xl relative overflow-hidden cursor-pointer hover:border-gold-500 transition-all"
                        onClick={onOpenTC}
                    >
                        <Bike className="absolute -right-4 -bottom-4 text-gold-500/5" size={100} />
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gold-500 text-stone-950 rounded-lg"><Bike size={20} /></div>
                            <span className="font-serif font-bold text-white text-lg">30 Min Delivery</span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed mb-4">Delivery within 30 minutes or get a reward on your next order!</p>
                        <span className="text-[10px] text-gold-500 font-bold uppercase tracking-widest border-b border-gold-500/50">View Policy</span>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-stone-600 text-[10px] tracking-widest uppercase">© {new Date().getFullYear()} Chillies Restaurant.</p>
                    <div className="flex items-center gap-8">
                        <span onClick={onOpenAdmin} className="text-[10px] text-stone-800 hover:text-stone-600 cursor-pointer uppercase font-bold tracking-widest">spread happiness</span>
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="p-2 bg-stone-900 rounded-full text-stone-500 hover:text-gold-400 border border-white/5 transition-all"><ArrowUp size={16} /></button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;