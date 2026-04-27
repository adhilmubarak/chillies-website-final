import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { MessageSquareWarning, Send, ArrowLeft, CheckCircle } from 'lucide-react';

const ComplaintsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    orderId: '',
    subject: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oid = params.get('oid');
    if (oid) {
        setFormData(prev => ({ ...prev, orderId: oid }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.subject || !formData.description) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const complaintsCol = collection(db, 'complaints');
      await addDoc(complaintsCol, {
        ...formData,
        status: 'open',
        createdAt: Date.now()
      });
      setIsSuccess(true);
      setFormData({ customerName: '', phone: '', orderId: '', subject: '', description: '' });
    } catch (err) {
      console.error("Error submitting complaint:", err);
      setError('Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-stone-900 p-8 rounded-3xl border border-white/10 max-w-md w-full text-center shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-green-500" />
            </div>
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-4 tracking-wide">Submitted <br/>Successfully</h2>
          <p className="text-stone-400 mb-8 leading-relaxed">Thank you for your feedback. Our team has received your complaint and will look into it immediately. We apologize for any inconvenience caused.</p>
          <a href="/" className="inline-flex items-center justify-center gap-2 w-full py-4 bg-gold-500 text-stone-950 font-black rounded-2xl uppercase tracking-widest hover:bg-gold-400 transition-colors">
             <ArrowLeft size={18} /> Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans overflow-y-auto pb-24 md:pb-0">
      {/* Header */}
      <div className="relative pt-12 pb-8 px-4 border-b border-white/10 bg-stone-900/50">
          <a href="/" className="absolute top-6 left-4 text-stone-400 hover:text-white transition-colors">
             <ArrowLeft size={24} />
          </a>
          <div className="flex flex-col items-center justify-center pt-4">
              <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mb-4">
                  <MessageSquareWarning size={32} className="text-brand-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 uppercase text-center">
                  Register Complaint
              </h1>
              <p className="text-stone-400 mt-2 text-center text-sm md:text-base max-w-md">We are committed to providing the best experience. If we fell short, please let us know.</p>
          </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
             <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-center">
               {error}
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-stone-400">Your Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-stone-900 border border-white/10 rounded-xl px-4 py-3 placeholder:text-stone-600 focus:outline-none focus:border-gold-500 transition-colors text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-stone-400">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                className="w-full bg-stone-900 border border-white/10 rounded-xl px-4 py-3 placeholder:text-stone-600 focus:outline-none focus:border-gold-500 transition-colors text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-bold text-stone-400">Order ID (Optional)</label>
            <input
              type="text"
              name="orderId"
              value={formData.orderId}
              onChange={handleChange}
              placeholder="e.g. 8f2a"
              className="w-full bg-stone-900 border border-white/10 rounded-xl px-4 py-3 placeholder:text-stone-600 focus:outline-none focus:border-gold-500 transition-colors text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-bold text-stone-400">Subject *</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full bg-stone-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors appearance-none"
              required
            >
              <option value="" disabled>Select a subject</option>
              <option value="Late Delivery">Late Delivery</option>
              <option value="Missing Items">Missing Items</option>
              <option value="Food Quality">Food Quality Issue</option>
              <option value="Wrong Order">Wrong Order Received</option>
              <option value="Staff Behavior">Staff Behavior</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-stone-400">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Please describe your issue in detail..."
                rows={5}
                className="w-full bg-stone-900 border border-white/10 rounded-xl px-4 py-3 placeholder:text-stone-600 focus:outline-none focus:border-gold-500 transition-colors text-white resize-none"
                required
              ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-stone-950 rounded-xl font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
               <div className="w-6 h-6 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <>
                 <Send size={18} className="group-hover:translate-x-1 -translate-y-1 transition-transform" /> Submit Complaint
               </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintsPage;
