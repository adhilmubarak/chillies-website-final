import React, { useState } from 'react';
import { Star, MessageCircle, User, Phone, CheckCircle, ArrowLeft } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const FeedbackModal: React.FC = () => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || !customerName) return;
        
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'foodRatings'), {
                rating,
                comment,
                customerName,
                contactNumber,
                createdAt: Date.now()
            });
            setIsSuccess(true);
        } catch (error) {
            console.error("Error submitting rating: ", error);
            alert("Failed to submit feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-stone-900 border border-gold-500/20 rounded-[3rem] p-10 text-center shadow-2xl animate-fade-in-up">
                    <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-gold-500" />
                    </div>
                    <h2 className="text-3xl font-serif text-white mb-4">Thank You!</h2>
                    <p className="text-stone-400 text-sm leading-relaxed mb-8">
                        Your feedback is incredibly valuable to us and helps us maintain the highest standard of culinary excellence.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="px-8 py-4 bg-gold-500 text-stone-950 font-black uppercase tracking-widest text-xs rounded-2xl w-full shadow-xl hover:bg-gold-400 transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
            <button onClick={() => window.location.href = '/'} className="absolute top-6 left-6 md:top-10 md:left-10 text-stone-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                <ArrowLeft size={16} /> Home
            </button>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 blur-[100px] rounded-full pointer-events-none -mr-20 -mt-20"></div>

            <div className="max-w-md w-full bg-stone-900 border border-white/5 rounded-[3rem] p-8 md:p-10 shadow-2xl relative z-10 animate-fade-in-up mt-10 md:mt-0">
                <div className="text-center mb-10">
                    <span className="font-serif text-2xl text-gold-400 font-bold uppercase tracking-tighter block mb-2">CHILLIES.</span>
                    <h2 className="text-xl text-white font-serif">Customer Feedback</h2>
                    <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest mt-2">Rate Your Experience</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="p-1 transition-all hover:scale-110 active:scale-95"
                                >
                                    <Star 
                                        size={40} 
                                        className={(hoverRating || rating) >= star ? "fill-gold-500 text-gold-500 filter drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" : "text-stone-800"} 
                                    />
                                </button>
                            ))}
                        </div>
                        {rating === 0 && <span className="text-red-500 text-[10px] mt-2 font-bold select-none uppercase tracking-widest animate-pulse">Select a star rating</span>}
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Your Name" 
                                value={customerName}
                                required
                                onChange={e => setCustomerName(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:border-gold-500 outline-none transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                            <input 
                                type="tel" 
                                placeholder="Phone Number (Optional)" 
                                value={contactNumber}
                                onChange={e => setContactNumber(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:border-gold-500 outline-none transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <MessageCircle className="absolute left-4 top-4 text-stone-500" size={16} />
                            <textarea 
                                placeholder="Tell us about your food and experience..." 
                                value={comment}
                                required
                                onChange={e => setComment(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:border-gold-500 outline-none transition-colors h-32 resize-none"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting || rating === 0 || !customerName}
                        className="w-full bg-gold-500 text-stone-950 font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
