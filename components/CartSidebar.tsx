
import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, Send, Bike, Store, User, CheckCircle, Clock, FileText, AlertCircle, Copy, Check, ArrowRight, ArrowLeft, MapPin, ExternalLink, Ticket, Tag, Printer } from 'lucide-react';
import { CartItem, Order, Coupon } from '../types';
import { printThermalBill } from '../App';
import SafeImage from './SafeImage';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClearCart: () => void;
  onShowNotification: (message: string) => void;
  onAddOrder: (order: Order) => void;
  onTrackOrder: () => void;
  coupons?: Coupon[];
}

const DELIVERY_FEE = 20;

const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemove,
  onClearCart,
  onShowNotification,
  onAddOrder,
  onTrackOrder,
  coupons = []
}) => {
  const [step, setStep] = useState<'cart' | 'details' | 'confirmation'>('cart');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({ name: false, contact: false, address: false });
  const [copied, setCopied] = useState(false);
  
  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  
  // Confirmation State
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [whatsappMsg, setWhatsappMsg] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
          discountAmount = (subtotal * appliedCoupon.value) / 100;
      } else {
          discountAmount = appliedCoupon.value;
      }
      discountAmount = Math.min(discountAmount, subtotal);
  }

  const deliveryCharge = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal - discountAmount + deliveryCharge;

  useEffect(() => {
    if (cartItems.length === 0 && step === 'details') {
        setStep('cart');
    }
  }, [cartItems.length, step]);

  const handleApplyCoupon = () => {
      if (!couponInput.trim()) return;
      const found = coupons.find(c => c.code === couponInput.trim().toUpperCase());
      if (found) {
          setAppliedCoupon(found);
          setCouponError('');
          onShowNotification('Coupon applied successfully!');
      } else {
          setAppliedCoupon(null);
          setCouponError('Invalid coupon code');
      }
  };

  const handleRemoveCoupon = () => {
      setAppliedCoupon(null);
      setCouponInput('');
      setCouponError('');
  };

  const getWhatsAppUrl = (msg: string) => {
    const phoneNumber = "918301032794";
    // Using api.whatsapp.com as it's often more reliable for web-to-app redirects
    return `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;
  };

  const handleWhatsAppCheckout = () => {
    if (cartItems.length === 0) return;
    const hasNameError = !customerName.trim();
    const hasContactError = !/^\d{10}$/.test(contactNumber.trim());
    const hasAddressError = orderType === 'delivery' && !address.trim();
    setErrors({ name: hasNameError, contact: hasContactError, address: hasAddressError });
    if (hasNameError || hasContactError || hasAddressError) return;

    // Generate a 6-char alphanumeric ID for shorter tracking links
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newOrderId = '';
    for (let i = 0; i < 6; i++) {
        newOrderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const now = new Date();
    const baseUrl = window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");
    const trackingLink = `${baseUrl}?tid=${newOrderId}`;

    const currentOrder: Order = {
        id: newOrderId,
        items: [...cartItems],
        subtotal: subtotal,
        discount: discountAmount,
        couponCode: appliedCoupon?.code || null,
        deliveryCharge: deliveryCharge,
        total,
        customerName: customerName,
        contactNumber: contactNumber,
        address: orderType === 'delivery' ? address : '',
        type: orderType,
        status: 'pending',
        timestamp: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
        date: now.toLocaleDateString(),
        createdAt: now.getTime(),
        trackingLink: trackingLink
    };

    setConfirmedOrder(currentOrder);
    onAddOrder(currentOrder);

    let message = `*New ${orderType === 'delivery' ? 'Delivery' : 'Pickup'} Order - CHILLIES*\n`;
    message += `*Order ID:* #${newOrderId}\n\n`;
    message += `👤 Name: ${customerName}\n📞 Contact: ${contactNumber}\n`;
    if (orderType === 'delivery') message += `📍 Address: ${address}\n\n`;
    cartItems.forEach((item) => { message += `▪ ${item.quantity} x ${item.name} (₹${item.price})\n`; });
    message += `\nSubtotal: ₹${subtotal.toFixed(2)}\n`;
    if (orderType === 'delivery') message += `Delivery Charge: ₹${deliveryCharge.toFixed(2)}\n`;
    if (appliedCoupon && discountAmount > 0) message += `Discount (${appliedCoupon.code}): -₹${discountAmount.toFixed(2)}\n`;
    message += `*TOTAL PAYABLE:* ₹${total.toFixed(2)}`;
    // Removed tracking link from WhatsApp message as requested

    setWhatsappMsg(message);
    setStep('confirmation');
    
    const url = getWhatsAppUrl(message);
    
    // Primary method: New tab. If blocked, secondary method: Same tab redirect.
    const win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
        setTimeout(() => {
            window.location.assign(url);
        }, 500);
    }
  };

  const handleClose = () => {
      if (step === 'confirmation') {
          onClearCart();
          setConfirmedOrder(null);
          setCustomerName('');
          setContactNumber('');
          setAddress('');
          setErrors({ name: false, contact: false, address: false });
          setAppliedCoupon(null);
          setCouponInput('');
          setStep('cart');
      }
      onClose();
  };

  const copyOrderDetails = () => {
      if (!confirmedOrder) return;
      const text = `Order #${confirmedOrder.id}\nTrack: ${confirmedOrder.trackingLink}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className={`fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={handleClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-stone-950/90 backdrop-blur-xl border-l border-white/5 z-[70] transform transition-transform duration-500 shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>

          {step === 'confirmation' && confirmedOrder ? (
              <div className="flex flex-col h-full animate-fade-in">
                  <div className="p-8 pb-4 flex justify-between items-center">
                      <button onClick={() => printThermalBill(confirmedOrder)} className="text-gold-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full flex items-center gap-2 text-[10px] uppercase font-black tracking-widest">
                          <Printer size={18} /> Print Receipt
                      </button>
                      <button onClick={handleClose} className="text-stone-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center px-8 text-center overflow-y-auto scrollbar-hide">
                      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 relative border border-green-500/20"><CheckCircle className="text-green-500 w-8 h-8" /></div>
                      <h2 className="font-serif text-3xl text-white mb-2">Order Created</h2>
                      <p className="text-stone-400 text-sm mb-8 leading-relaxed">If WhatsApp didn't open, use the button below to confirm your order.</p>

                      {/* Manual Trigger Failsafe */}
                      <button 
                        onClick={() => window.location.assign(getWhatsAppUrl(whatsappMsg))}
                        className="w-full py-5 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(22,163,74,0.3)] mb-8 active:scale-95 transition-all"
                      >
                        <Send size={18} /> Send to WhatsApp
                      </button>

                      <div className="w-full grid grid-cols-2 gap-3 mb-6 text-[10px]">
                          <div className="bg-stone-900/50 p-4 rounded-2xl border border-white/5"><Clock className="text-gold-500 mx-auto mb-2" size={18} /><span className="text-stone-500 uppercase block tracking-widest mb-1">Estimated</span><span className="text-white font-black">{confirmedOrder.type === 'delivery' ? '45-60 min' : '15-20 min'}</span></div>
                          <div className="bg-stone-900/50 p-4 rounded-2xl border border-white/5"><FileText className="text-gold-500 mx-auto mb-2" size={18} /><span className="text-stone-500 uppercase block tracking-widest mb-1">Reference</span><span className="text-white font-black">#{confirmedOrder.id}</span></div>
                      </div>

                      <div onClick={onTrackOrder} className="w-full bg-stone-900/50 p-4 rounded-2xl border border-white/5 mb-6 cursor-pointer group hover:border-gold-500/30 transition-all">
                          <div className="flex items-center justify-between mb-2"><span className="text-stone-500 text-[10px] uppercase tracking-widest font-black">Live Status Link</span><ExternalLink size={12} className="text-gold-500" /></div>
                          <div className="bg-black/40 rounded p-2.5 text-gold-400 font-mono text-[10px] truncate border border-white/5">{confirmedOrder.trackingLink}</div>
                      </div>

                      <div className="w-full bg-stone-900/80 rounded-2xl p-0 overflow-hidden border border-white/5 shadow-2xl relative mb-8">
                          <div className="bg-stone-800/50 p-4 border-b border-white/5 flex justify-between items-center"><span className="text-[10px] text-stone-500 font-black tracking-widest uppercase">{confirmedOrder.date} | {confirmedOrder.timestamp}</span><button onClick={copyOrderDetails} className="text-gold-500 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest">{copied ? <Check size={14} /> : <Copy size={14} />} Copy</button></div>
                          <div className="p-6 space-y-4 text-left">
                              <h4 className="text-stone-600 text-[9px] font-black uppercase tracking-[0.2em]">Bill Detail</h4>
                              <div className="space-y-3">
                                {confirmedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                          <SafeImage src={item.image} containerClassName="w-8 h-8 rounded-lg" className="w-full h-full object-cover" />
                                          <span className="text-stone-300 truncate text-xs"><span className="text-gold-500 font-black mr-1">{item.quantity}x</span> {item.name}</span>
                                        </div>
                                        <span className="text-stone-500 font-mono text-xs">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                              </div>
                              <div className="border-t border-dashed border-white/10 my-4"></div>
                              <div className="space-y-2">
                                  {confirmedOrder.deliveryCharge && <div className="flex justify-between text-xs text-stone-500"><span>Delivery</span><span>+₹{confirmedOrder.deliveryCharge.toFixed(2)}</span></div>}
                                  {confirmedOrder.discount && <div className="flex justify-between text-xs text-green-600"><span>Savings</span><span>-₹{confirmedOrder.discount.toFixed(2)}</span></div>}
                                  <div className="flex justify-between pt-2 text-xl font-serif text-white"><span>Total</span><span className="text-gold-400">₹{confirmedOrder.total.toFixed(2)}</span></div>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="p-8 border-t border-white/5 bg-stone-950/50"><button onClick={handleClose} className="w-full py-4 bg-gold-500 text-stone-950 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gold-400 transition-colors">Return to Menu</button></div>
              </div>
          ) : step === 'details' ? (
              <div className="flex flex-col h-full animate-fade-in">
                  <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-center bg-stone-950/50"><div className="flex items-center gap-4"><button onClick={() => setStep('cart')} className="text-stone-400"><ArrowLeft size={24} /></button><h2 className="font-serif text-2xl text-white">Details</h2></div><button onClick={handleClose} className="text-stone-500"><X size={24} /></button></div>
                  <div className="flex-1 p-8 space-y-8 overflow-y-auto scrollbar-hide">
                      <div className="bg-stone-900/50 border border-white/5 rounded-2xl p-6 flex justify-between items-end relative overflow-hidden"><div className="space-y-1"><span className="text-stone-300 text-sm block font-medium">{cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items Selected</span><span className="text-stone-400 text-[10px] font-black uppercase tracking-widest block flex items-center gap-1 mt-1">{orderType === 'delivery' ? <Bike size={12}/> : <Store size={12}/>} {orderType === 'delivery' ? 'Home Delivery' : 'Self Pickup'}</span></div><div className="text-right"><span className="text-gold-400 font-serif text-3xl font-bold">₹{total.toFixed(0)}</span></div></div>
                      <div className="space-y-5">
                        <h3 className="text-stone-600 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">Contact Details</h3>
                        <div className="space-y-3">
                            <input type="text" placeholder="Your Name" value={customerName} onChange={(e) => { setCustomerName(e.target.value); setErrors(p => ({...p, name: false})); }} className={`w-full bg-stone-900/50 border rounded-xl py-4 px-4 text-sm text-white focus:outline-none transition-all ${errors.name ? 'border-red-500' : 'border-stone-800 focus:border-gold-500'}`} />
                            <input type="tel" placeholder="WhatsApp Number" value={contactNumber} maxLength={10} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setContactNumber(val); setErrors(p => ({...p, contact: false})); }} className={`w-full bg-stone-900/50 border rounded-xl py-4 px-4 text-sm text-white focus:outline-none transition-all ${errors.contact ? 'border-red-500' : 'border-stone-800 focus:border-gold-500'}`} />
                        </div>
                        {orderType === 'delivery' && (
                            <div className="space-y-3 pt-4">
                                <h3 className="text-stone-600 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">Delivery Address</h3>
                                <textarea placeholder="Flat No., Landmark, Area..." value={address} onChange={(e) => { setAddress(e.target.value); setErrors(p => ({...p, address: false})); }} className={`w-full bg-stone-900/50 border rounded-xl py-4 px-4 text-sm text-white focus:outline-none h-24 resize-none transition-all ${errors.address ? 'border-red-500' : 'border-stone-800 focus:border-gold-500'}`} />
                            </div>
                        )}
                      </div>
                  </div>
                  <div className="p-8 border-t border-white/5 bg-stone-950/50 space-y-4"><div className="bg-gold-500/5 border border-gold-500/20 rounded-xl p-4 flex gap-3 items-start"><AlertCircle className="text-gold-500 shrink-0 mt-0.5" size={16} /><p className="text-[10px] text-stone-400 leading-relaxed uppercase tracking-wide">Final step: Press <strong>Send</strong> in the WhatsApp screen that opens next.</p></div><button onClick={handleWhatsAppCheckout} className="w-full py-5 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all"><Send size={18} /><span>Confirm via WhatsApp</span></button></div>
              </div>
          ) : (
            <>
                <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-center bg-stone-950/50"><h2 className="font-serif text-3xl text-white">Your Selection</h2><button onClick={handleClose} className="text-stone-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><X size={24} /></button></div>
                <div className="px-8 py-6 border-b border-white/5 bg-stone-950/30"><div className="grid grid-cols-2 gap-2 p-1 bg-stone-900/50 rounded-xl border border-white/5 shadow-inner"><button onClick={() => setOrderType('delivery')} className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest ${orderType === 'delivery' ? 'bg-gold-500 text-stone-950 shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}><Bike size={16} /><span>Delivery</span></button><button onClick={() => setOrderType('pickup')} className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest ${orderType === 'pickup' ? 'bg-gold-500 text-stone-950 shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}><Store size={16} /><span>Pickup</span></button></div></div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide min-h-0">
                    {cartItems.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-6 animate-fade-in"><ShoppingBag size={32} className="opacity-20" /><p className="font-light tracking-widest uppercase text-[10px]">Cart is empty</p><button onClick={() => { onClose(); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-gold-400 hover:text-gold-300 uppercase text-[10px] tracking-widest font-black border-b border-gold-400/30 pb-1 transition-all">Explore Menu</button></div>) : (cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center bg-stone-900/50 p-4 rounded-2xl border border-white/5 group hover:border-gold-500/20 transition-all">
                          <SafeImage src={item.image} containerClassName="w-16 h-16 rounded-xl shrink-0" className="w-full h-full object-cover" />
                          <div className="flex-grow min-w-0"><h4 className="text-stone-200 font-medium text-sm truncate">{item.name}</h4><p className="text-gold-400 text-xs mt-1 font-bold">₹{item.price}</p></div><div className="flex items-center bg-stone-950/50 rounded-xl border border-white/10 p-1"><button onClick={() => onUpdateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-white transition-colors"><Minus size={12} /></button><span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span><button onClick={() => onUpdateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-white transition-colors"><Plus size={12} /></button></div></div>)))}
                </div>
                {cartItems.length > 0 && (
                    <div className="p-8 bg-stone-950/50 border-t border-white/5 space-y-6">
                    <div className="space-y-2">{!appliedCoupon ? (<div className="flex gap-2"><div className="relative flex-grow"><input type="text" value={couponInput} onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }} placeholder="Coupon?" className="w-full bg-stone-900 border border-stone-800 rounded-xl py-3 pl-10 pr-3 text-[10px] text-white focus:outline-none focus:border-gold-500 uppercase tracking-widest" /><Ticket size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" /></div><button onClick={handleApplyCoupon} className="bg-stone-800 text-stone-300 hover:bg-gold-500 hover:text-black px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Apply</button></div>) : (<div className="flex items-center justify-between bg-gold-500/5 border border-gold-500/20 rounded-xl p-3.5"><div className="flex items-center gap-3"><Tag size={16} className="text-gold-500" /><div><span className="text-[10px] text-gold-500 font-black block uppercase tracking-widest">{appliedCoupon.code}</span><span className="text-[9px] text-stone-500 uppercase tracking-widest">Active Discount</span></div></div><button onClick={handleRemoveCoupon} className="text-stone-600 hover:text-red-500 transition-colors"><X size={16} /></button></div>)}{couponError && <p className="text-red-500 text-[9px] pl-1 font-bold uppercase tracking-widest">{couponError}</p>}</div>
                    <div className="space-y-3 text-stone-400 text-sm"><div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>{orderType === 'delivery' && (<div className="flex justify-between text-[10px] text-stone-500 font-black uppercase tracking-widest"><span>Delivery</span><span>+₹{DELIVERY_FEE.toFixed(2)}</span></div>)}{appliedCoupon && <div className="flex justify-between text-[10px] text-green-600 font-black uppercase tracking-widest"><span>Savings</span><span>-₹{discountAmount.toFixed(2)}</span></div>}<div className="flex justify-between pt-4 border-t border-white/10 text-2xl font-serif text-white"><span>Total</span><span className="text-gold-400">₹{total.toFixed(2)}</span></div></div>
                    <button onClick={() => setStep('details')} className="w-full py-5 bg-gold-500 text-stone-950 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all hover:bg-gold-400 shadow-xl active:scale-[0.98]"><span>Next Step</span><ArrowRight size={18} /></button>
                    </div>
                )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
