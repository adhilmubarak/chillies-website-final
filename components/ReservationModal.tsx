
import React, { useState } from 'react';
import { X, Calendar, Clock, Users, User, MessageSquare, Send } from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowNotification: (message: string) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, onShowNotification }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    guests: '2',
    requests: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.date || !formData.time) return;

    // Format Time to 12h
    const formatTime12 = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
    };

    // Format Message
    let message = `*🥂 Table Reservation Request - CHILLIES RESTAURANT*\n\n`;
    message += `*Guest:* ${formData.name}\n`;
    message += `*Date:* ${formData.date}\n`;
    message += `*Time:* ${formatTime12(formData.time)}\n`;
    message += `*Party Size:* ${formData.guests} People\n`;
    if (formData.requests) {
        message += `*Special Request:* ${formData.requests}\n`;
    }
    message += `\n----------------------------\n`;
    message += `Please confirm availability.`;

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = "918301032794";
    
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    onShowNotification("Reservation request opened in WhatsApp");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-stone-900 border border-gold-500/30 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
        
        <div className="p-8 pb-4 flex justify-between items-center border-b border-white/5 bg-stone-950/50">
            <div>
                <h2 className="font-serif text-2xl text-white">Book a Table</h2>
                <p className="text-stone-400 text-xs mt-1">Reserve your spot for an unforgettable evening.</p>
            </div>
            <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                <X size={24} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Name */}
            <div className="space-y-2">
                <label className="text-xs text-stone-500 uppercase tracking-widest font-bold flex items-center gap-2">
                    <User size={14} className="text-gold-500"/> Name
                </label>
                <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Your Full Name"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-2">
                    <label className="text-xs text-stone-500 uppercase tracking-widest font-bold flex items-center gap-2">
                        <Calendar size={14} className="text-gold-500"/> Date
                    </label>
                    <input 
                        type="date" 
                        required
                        value={formData.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors [color-scheme:dark]"
                    />
                </div>

                {/* Time */}
                <div className="space-y-2">
                    <label className="text-xs text-stone-500 uppercase tracking-widest font-bold flex items-center gap-2">
                        <Clock size={14} className="text-gold-500"/> Time
                    </label>
                    <input 
                        type="time" 
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors [color-scheme:dark]"
                    />
                </div>
            </div>

            {/* Guests */}
            <div className="space-y-2">
                <label className="text-xs text-stone-500 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Users size={14} className="text-gold-500"/> No. of Guests
                </label>
                <select 
                    value={formData.guests}
                    onChange={(e) => setFormData({...formData, guests: e.target.value})}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors appearance-none"
                >
                    {[1,2,3,4,5,6,7,8,9,10, "10+"].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
                    ))}
                </select>
            </div>

            {/* Special Request */}
            <div className="space-y-2">
                <label className="text-xs text-stone-500 uppercase tracking-widest font-bold flex items-center gap-2">
                    <MessageSquare size={14} className="text-gold-500"/> Special Requests (Optional)
                </label>
                <textarea 
                    value={formData.requests}
                    onChange={(e) => setFormData({...formData, requests: e.target.value})}
                    placeholder="Anniversary, Birthday, Allergies..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors resize-none h-20"
                />
            </div>

            <button 
                type="submit"
                className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-stone-950 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:-translate-y-1"
            >
                <Send size={18} /> Request Reservation
            </button>

            <p className="text-[10px] text-center text-stone-600">
                Reservation is subject to availability. Confirmation will be sent via WhatsApp.
            </p>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal;
