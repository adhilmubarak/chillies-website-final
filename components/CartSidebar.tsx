
import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, Send, Bike, Store, User, Phone, CheckCircle, Clock, FileText, AlertCircle, Copy, Check, ArrowRight, ArrowLeft, MapPin, ExternalLink, Ticket, Tag } from 'lucide-react';
import { CartItem, Order, Coupon } from '../types';

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
  const [confirmedOrder, setConfirmedOrder] = useState<{
      items: CartItem[];
      total: number;
      name: string;
      contact: string;
      type: 'delivery' | 'pickup';
      orderId: string;
      timestamp: string;
      discount?: number;
      couponCode?: string | null;
      deliveryCharge?: number;
      trackingLink?: string;
  } | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
          discountAmount = (subtotal * appliedCoupon.value) / 100;
      } else {
          discountAmount = appliedCoupon.value;
      }
      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);
  }

  const deliveryCharge = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal - discountAmount + deliveryCharge;

  // Reset to cart step if cart is emptied while in details view
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

  const handleProceedToDetails = () => {
      setStep('details');
  };

  const handleBackToCart = () => {
      setStep('cart');
  };

  const handleExploreMenu = () => {
    onClose();
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleWhatsAppCheckout = () => {
    if (cartItems.length === 0) return;

    // Validation
    const hasNameError = !customerName.trim();
    // Validate exactly 10 digits
    const hasContactError = !/^\d{10}$/.test(contactNumber.trim());
    const hasAddressError = orderType === 'delivery' && !address.trim();

    setErrors({ name: hasNameError, contact: hasContactError, address: hasAddressError });

    if (hasNameError || hasContactError || hasAddressError) {
      return;
    }

    // Generate Order ID: 1 Random Letter + 4 Random Digits (e.g. A1234)
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const newOrderId = `${randomLetter}${randomDigits}`;
    
    // Capture order details before opening WhatsApp
    const now = new Date();
    
    // Construct robust tracking link
    // Use URL API to ensure correct formatting of query parameters
    const baseUrl = window.location.origin + window.location.pathname;
    const urlObj = new URL(baseUrl);
    urlObj.searchParams.set('trackId', newOrderId);
    const trackingLink = urlObj.toString();

    // Construct order with safe address handling
    const currentOrder: Order = {
        id: newOrderId,
        items: [...cartItems],
        subtotal: subtotal,
        discount: discountAmount,
        couponCode: appliedCoupon?.code || null, // Ensure null if undefined for Firestore
        deliveryCharge: deliveryCharge,
        total,
        customerName: customerName,
        contactNumber: contactNumber,
        address: orderType === 'delivery' ? address : '', // Ensure string, never undefined
        type: orderType,
        status: 'pending',
        timestamp: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
        date: now.toLocaleDateString(),
        createdAt: now.getTime(),
        trackingLink: trackingLink // Persist to DB
    };

    // Update confirmed order state for UI
    setConfirmedOrder({
        items: currentOrder.items,
        total: currentOrder.total,
        name: currentOrder.customerName,
        contact: currentOrder.contactNumber,
        type: currentOrder.type,
        orderId: currentOrder.id,
        timestamp: currentOrder.timestamp,
        discount: discountAmount,
        couponCode: appliedCoupon?.code || null,
        deliveryCharge: deliveryCharge,
        trackingLink: trackingLink
    });
    
    // Add to global orders list
    onAddOrder(currentOrder);

    let message = `*New ${orderType === 'delivery' ? 'Delivery' : 'Pickup'} Order - CHILLIES RESTAURANT*\n`;
    message += `*Order ID:* #${newOrderId}\n\n`;
    
    message += `*Customer Details:*\n`;
    message += `👤 Name: ${customerName}\n`;
    message += `📞 Contact: ${contactNumber}\n`;
    if (orderType === 'delivery') {
        message += `📍 Address: ${address}\n\n`;
    } else {
        message += `\n`;
    }

    message += `*Order Summary:*\n`;
    cartItems.forEach((item) => {
      message += `▪ ${item.quantity} x ${item.name} (₹${item.price})\n`;
    });
    
    message += `\n----------------------------\n`;
    message += `Subtotal: ₹${subtotal.toFixed(2)}\n`;
    
    if (orderType === 'delivery') {
        message += `Delivery Charge: ₹${deliveryCharge.toFixed(2)}\n`;
    }

    if (appliedCoupon && discountAmount > 0) {
        message += `Discount (${appliedCoupon.code}): -₹${discountAmount.toFixed(2)}\n`;
    }
    message += `*TOTAL PAYABLE:* ₹${total.toFixed(2)}\n`;
    message += `----------------------------\n`;
    
    if (orderType === 'delivery') {
        message += `\n*Type:* Delivery 🛵\n`;
    } else {
        message += `\n*Type:* Pickup 🏪\n*Time:* [Please type preferred pickup time]\n`;
    }

    // Tracking link removed from WhatsApp message as requested

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = "918301032794";
    
    // Switch to confirmation view
    setStep('confirmation');
    
    // Slight delay to ensure UI updates before tab switch and trigger mocked service
    setTimeout(() => {
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
        
        // Mock sending SMS confirmation
        sendMockConfirmation(currentOrder);
    }, 500);
  };

  const sendMockConfirmation = (order: Order) => {
      if (!order) return;
      
      const estimatedTime = order.type === 'delivery' ? '45-60 mins' : '15-20 mins';
      
      // Simulate network delay
      setTimeout(() => {
          console.log(`
          %c[MOCK SMS SERVICE] ----------------------------------------
          To: ${order.contactNumber}
          Message:
          Hi ${order.customerName}, thank you for ordering from Chillies! 🌶️
          
          Order #${order.id} Confirmed.
          
          Summary:
          ${order.items.map(i => `${i.quantity}x ${i.name}`).join('\n')}
          
          Total: ₹${order.total.toFixed(2)}
          Estimated Delivery: ${estimatedTime}
          
          Track your order: https://chillies.com/track/${order.id}
          -------------------------------------------------------------
          `, 'color: #10B981; font-weight: bold;');
          
          onShowNotification(`Confirmation SMS sent to ${order.contactNumber}`);
      }, 2500);
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
      const text = `Order #${confirmedOrder.orderId}\nName: ${confirmedOrder.name}\nTotal: ₹${confirmedOrder.total.toFixed(2)}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-[60] transition-opacity duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-stone-950/90 backdrop-blur-xl border-l border-white/5 z-[70] transform transition-transform duration-500 shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full relative">
          
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>

          {/* === CONFIRMATION VIEW === */}
          {step === 'confirmation' && confirmedOrder ? (
              <div className="flex flex-col h-full animate-fade-in">
                  <div className="p-8 pb-4 flex justify-end">
                      <button onClick={handleClose} className="text-stone-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center px-8 text-center overflow-y-auto scrollbar-hide min-h-0">
                      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 relative">
                          <div className="absolute inset-0 rounded-full border border-green-500/20 animate-ping opacity-20"></div>
                          <CheckCircle className="text-green-500 w-10 h-10" />
                      </div>
                      
                      <h2 className="font-serif text-3xl text-white mb-2">Order Initiated</h2>
                      <p className="text-stone-400 text-sm mb-6 leading-relaxed">
                          Please complete the payment on WhatsApp to confirm your order. We've also sent an SMS confirmation to <strong>{confirmedOrder.contact}</strong>.
                      </p>

                      {/* Info Grid */}
                      <div className="w-full grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-stone-900/50 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gold-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                              <Clock className="text-gold-500 mb-2 relative z-10" size={20} />
                              <span className="text-stone-500 text-[10px] uppercase tracking-widest relative z-10">Est. Time</span>
                              <span className="text-white font-bold mt-1 text-sm relative z-10">
                                  {confirmedOrder.type === 'delivery' ? '45-60 min' : '15-20 min'}
                              </span>
                          </div>
                          <div className="bg-stone-900/50 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gold-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                              <FileText className="text-gold-500 mb-2 relative z-10" size={20} />
                              <span className="text-stone-500 text-[10px] uppercase tracking-widest relative z-10">Order ID</span>
                              <span className="text-white font-bold mt-1 text-sm relative z-10">#{confirmedOrder.orderId}</span>
                          </div>
                      </div>

                      {/* Tracking Link UI */}
                      <div 
                          onClick={onTrackOrder}
                          className="w-full bg-stone-900/50 p-4 rounded-xl border border-white/5 mb-6 cursor-pointer group hover:border-gold-500/30 transition-all"
                      >
                          <div className="flex items-center justify-between mb-2">
                               <span className="text-stone-500 text-[10px] uppercase tracking-widest font-bold">Track Order Status</span>
                               <ExternalLink size={12} className="text-gold-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="bg-black/40 rounded p-2 border border-white/5 flex items-center gap-2">
                               <span className="text-gold-400 font-mono text-xs truncate flex-1">
                                   {confirmedOrder.trackingLink || 'Tracking available'}
                               </span>
                          </div>
                      </div>

                      {/* Receipt Card */}
                      <div className="w-full bg-stone-900/80 rounded-t-xl p-0 overflow-hidden border border-white/5 shadow-2xl relative">
                          {/* Receipt Header */}
                          <div className="bg-stone-800/50 p-4 border-b border-white/5 flex justify-between items-center">
                              <span className="text-xs text-stone-400 font-mono">
                                  {new Date().toLocaleDateString()} • {confirmedOrder.timestamp}
                              </span>
                              <button 
                                onClick={copyOrderDetails}
                                className="text-gold-500 hover:text-gold-400 transition-colors p-1"
                                title="Copy Details"
                              >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                          </div>

                          {/* Items List */}
                          <div className="p-6 space-y-4">
                              <h4 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-4 text-left">Your Items</h4>
                              {confirmedOrder.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm">
                                      <div className="flex items-center gap-3 text-left overflow-hidden">
                                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover border border-white/10 shrink-0" />
                                          <div className="truncate">
                                              <span className="text-gold-500 font-bold mr-1">{item.quantity}x</span> 
                                              <span className="text-stone-300">{item.name}</span>
                                          </div>
                                      </div>
                                      <span className="text-stone-400 font-mono ml-2 shrink-0">₹{item.price * item.quantity}</span>
                                  </div>
                              ))}
                              
                              <div className="border-t border-dashed border-white/10 my-4"></div>
                              
                              <div className="space-y-2">
                                  {confirmedOrder.deliveryCharge && confirmedOrder.deliveryCharge > 0 && (
                                       <div className="flex justify-between text-xs text-stone-400">
                                            <span>Delivery Charge</span>
                                            <span>+₹{confirmedOrder.deliveryCharge.toFixed(2)}</span>
                                       </div>
                                  )}
                                  {confirmedOrder.discount && confirmedOrder.discount > 0 && (
                                      <div className="flex justify-between text-xs text-green-500">
                                          <span>Discount ({confirmedOrder.couponCode})</span>
                                          <span>-₹{confirmedOrder.discount.toFixed(2)}</span>
                                      </div>
                                  )}
                                  <div className="flex justify-between pt-2 text-lg font-serif text-white items-center">
                                      <span>Total</span>
                                      <span className="text-gold-400">₹{confirmedOrder.total.toFixed(2)}</span>
                                  </div>
                              </div>
                          </div>
                          
                          {/* Zigzag bottom edge css trick or simple border */}
                          <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                      </div>
                      
                      <p className="text-[10px] text-stone-600 mt-6 italic">
                          "One cannot think well, love well, sleep well, if one has not dined well."
                      </p>
                  </div>

                  <div className="p-8 border-t border-white/5 bg-stone-950/50">
                      <button
                          onClick={handleClose}
                          className="w-full py-4 bg-gold-500 text-stone-950 rounded-xl font-bold uppercase tracking-widest hover:bg-gold-400 transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                      >
                          Done & Close
                      </button>
                  </div>
              </div>
          ) : step === 'details' ? (
              // === STAGE 2: CUSTOMER DETAILS ===
              <div className="flex flex-col h-full animate-fade-in">
                  {/* Header */}
                  <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-center bg-stone-950/50">
                      <div className="flex items-center gap-4">
                        <button onClick={handleBackToCart} className="text-stone-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-full">
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="font-serif text-2xl text-white">Details</h2>
                      </div>
                      <button onClick={handleClose} className="text-stone-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 p-8 space-y-8 overflow-y-auto scrollbar-hide min-h-0">
                      {/* Summary Card */}
                      <div className="bg-stone-900/50 border border-white/5 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShoppingBag size={80} className="text-gold-500 transform rotate-12" />
                        </div>
                        <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-4">Order Summary</h3>
                        <div className="flex justify-between items-end relative z-10">
                            <div className="space-y-1">
                                <span className="text-stone-300 text-sm block font-medium">{cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items Selected</span>
                                <span className="text-stone-400 text-xs block flex items-center gap-1">
                                    {orderType === 'delivery' ? <Bike size={12}/> : <Store size={12}/>} 
                                    {orderType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
                                </span>
                            </div>
                            <div className="text-right">
                                {discountAmount > 0 && (
                                    <span className="text-stone-500 text-xs line-through block mb-1">₹ {subtotal.toFixed(0)}</span>
                                )}
                                <span className="text-gold-400 font-serif text-3xl font-bold">₹ {total.toFixed(0)}</span>
                            </div>
                        </div>
                      </div>

                      {/* Customer Details Inputs */}
                      <div className="space-y-4">
                        <h3 className="text-white text-sm font-bold flex items-center gap-2">
                            <User size={16} className="text-gold-500"/> Contact Information
                        </h3>
                        <div className="space-y-3">
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    placeholder="Full Name" 
                                    value={customerName}
                                    onChange={(e) => {
                                        setCustomerName(e.target.value);
                                        if(e.target.value) setErrors(prev => ({...prev, name: false}));
                                    }}
                                    className={`w-full bg-stone-900 border rounded-lg py-4 px-4 text-sm text-white placeholder-stone-600 focus:outline-none transition-all ${
                                        errors.name 
                                        ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 placeholder-red-300/50' 
                                        : 'border-stone-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50'
                                    }`}
                                />
                                {errors.name && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={16} />}
                            </div>
                            <div className="relative group">
                                <input 
                                    type="tel" 
                                    placeholder="WhatsApp Number (10 digits)" 
                                    value={contactNumber}
                                    maxLength={10}
                                    onChange={(e) => {
                                        // Restrict to digits only and max 10 chars
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setContactNumber(val);
                                        if(val.length === 10) setErrors(prev => ({...prev, contact: false}));
                                    }}
                                    className={`w-full bg-stone-900 border rounded-lg py-4 px-4 text-sm text-white placeholder-stone-600 focus:outline-none transition-all ${
                                        errors.contact 
                                        ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 placeholder-red-300/50' 
                                        : 'border-stone-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50'
                                    }`}
                                />
                                {errors.contact && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={16} />}
                            </div>
                        </div>

                        {/* Address Input - Only for Delivery */}
                        {orderType === 'delivery' && (
                            <div className="space-y-3 animate-fade-in pt-2">
                                <h3 className="text-white text-sm font-bold flex items-center gap-2">
                                    <MapPin size={16} className="text-gold-500"/> Delivery Address
                                </h3>
                                <div className="relative group">
                                    <textarea
                                        placeholder="Complete Address (House No, Street, Landmark)"
                                        value={address}
                                        onChange={(e) => {
                                            setAddress(e.target.value);
                                            if(e.target.value) setErrors(prev => ({...prev, address: false}));
                                        }}
                                        className={`w-full bg-stone-900 border rounded-lg py-4 px-4 text-sm text-white placeholder-stone-600 focus:outline-none transition-all resize-none h-24 ${
                                            errors.address
                                            ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 placeholder-red-300/50'
                                            : 'border-stone-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50'
                                        }`}
                                    />
                                     {errors.address && <AlertCircle className="absolute right-3 top-4 text-red-500" size={16} />}
                                </div>
                            </div>
                        )}
                      </div>
                  </div>

                  <div className="p-8 border-t border-white/5 bg-stone-950/50 space-y-4">
                      {/* Caution Message */}
                      <div className="bg-gold-500/10 border border-gold-500/20 rounded-lg p-3 flex gap-3 items-start">
                        <AlertCircle className="text-gold-500 shrink-0 mt-0.5" size={16} />
                        <p className="text-[10px] text-stone-300 leading-relaxed">
                            <strong className="text-gold-500 block mb-1">Important Step:</strong>
                            This will open WhatsApp with your order details pre-filled. Please <u>press the send button</u> in the chat to confirm your order.
                        </p>
                      </div>

                      <button
                        onClick={handleWhatsAppCheckout}
                        className="w-full py-5 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:-translate-y-1"
                    >
                        <Send size={18} />
                        <span>Place Order via WhatsApp</span>
                    </button>
                  </div>
              </div>
          ) : (
            // === STAGE 1: CART REVIEW ===
            <>
                {/* Header */}
                <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-center bg-stone-950/50">
                    <h2 className="font-serif text-3xl text-white">Your Selection</h2>
                    <button onClick={handleClose} className="text-stone-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                    <X size={24} />
                    </button>
                </div>

                {/* Order Type Selector (Top) */}
                <div className="px-8 py-6 border-b border-white/5 bg-stone-950/30">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-stone-900/50 rounded-xl border border-white/5">
                        <button
                            onClick={() => setOrderType('delivery')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 text-sm font-bold uppercase tracking-wide ${
                                orderType === 'delivery' 
                                ? 'bg-gold-500 text-stone-950 shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                                : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'
                            }`}
                        >
                            <Bike size={16} />
                            <span>Delivery</span>
                        </button>
                        <button
                            onClick={() => setOrderType('pickup')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 text-sm font-bold uppercase tracking-wide ${
                                orderType === 'pickup' 
                                ? 'bg-gold-500 text-stone-950 shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                                : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'
                            }`}
                        >
                            <Store size={16} />
                            <span>Pickup</span>
                        </button>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide min-h-0">
                    {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-6 animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-stone-900 flex items-center justify-center">
                            <ShoppingBag size={32} className="opacity-40" />
                        </div>
                        <p className="font-light">Your cart is currently empty.</p>
                        <button 
                            onClick={handleExploreMenu}
                            className="text-gold-400 hover:text-gold-300 uppercase text-xs tracking-widest font-bold border-b border-gold-400/50 pb-1"
                        >
                            Explore Menu
                        </button>
                    </div>
                    ) : (
                    cartItems.map((item) => (
                        <div key={item.id} className="group flex gap-4 items-center bg-stone-900/50 p-4 rounded-xl border border-white/5 hover:border-gold-500/20 transition-colors">
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                            <h4 className="text-stone-200 font-medium text-base truncate pr-2">{item.name}</h4>
                            <p className="text-gold-400 text-sm mt-1">₹ {item.price}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center bg-stone-950 rounded-lg border border-white/5 p-1">
                                <button
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 rounded-md transition-colors"
                                >
                                <Minus size={12} />
                                </button>
                                <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                                <button
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 rounded-md transition-colors"
                                >
                                <Plus size={12} />
                                </button>
                            </div>
                        </div>
                        </div>
                    ))
                    )}
                </div>

                {/* Footer & Checkout */}
                {cartItems.length > 0 && (
                    <div className="p-8 bg-stone-950/50 border-t border-white/5 space-y-6">
                    
                    {/* Discount Coupon Section */}
                    <div className="space-y-2">
                         {!appliedCoupon ? (
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <input 
                                        type="text" 
                                        value={couponInput}
                                        onChange={(e) => {
                                            setCouponInput(e.target.value.toUpperCase());
                                            setCouponError('');
                                        }}
                                        placeholder="Have a coupon code?"
                                        className="w-full bg-stone-900 border border-stone-800 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-gold-500 uppercase tracking-wide"
                                    />
                                    <Ticket size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                                </div>
                                <button 
                                    onClick={handleApplyCoupon}
                                    disabled={!couponInput}
                                    className="bg-stone-800 text-stone-300 hover:bg-gold-500 hover:text-black px-4 rounded-lg text-xs font-bold uppercase transition-colors disabled:opacity-50 disabled:hover:bg-stone-800 disabled:hover:text-stone-300"
                                >
                                    Apply
                                </button>
                            </div>
                         ) : (
                             <div className="flex items-center justify-between bg-gold-500/10 border border-gold-500/20 rounded-lg p-3">
                                 <div className="flex items-center gap-2">
                                     <Tag size={14} className="text-gold-500" />
                                     <div>
                                         <span className="text-xs text-gold-500 font-bold block">{appliedCoupon.code}</span>
                                         <span className="text-xs text-stone-400">
                                             {appliedCoupon.type === 'percent' ? `${appliedCoupon.value}% Off` : `₹${appliedCoupon.value} Off`} applied
                                         </span>
                                     </div>
                                 </div>
                                 <button onClick={handleRemoveCoupon} className="text-stone-500 hover:text-red-500 transition-colors p-1">
                                     <X size={14} />
                                 </button>
                             </div>
                         )}
                         {couponError && <p className="text-red-500 text-[10px] pl-1">{couponError}</p>}
                    </div>

                    <div className="space-y-3 text-stone-400 text-sm">
                        <div className="flex justify-between text-xs">
                            <span>Subtotal</span>
                            <span>₹ {subtotal.toFixed(2)}</span>
                        </div>
                        {orderType === 'delivery' && (
                             <div className="flex justify-between text-xs text-stone-400">
                                <span>Delivery Fee</span>
                                <span>+ ₹ {DELIVERY_FEE.toFixed(2)}</span>
                            </div>
                        )}
                        {appliedCoupon && discountAmount > 0 && (
                            <div className="flex justify-between text-xs text-green-500">
                                <span>Discount</span>
                                <span>- ₹ {discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-white/10 text-xl font-serif text-white">
                        <span>Total</span>
                        <span className="text-gold-400">₹ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleProceedToDetails}
                        className="w-full py-5 bg-gold-500 text-stone-950 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-gold-400 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:-translate-y-1"
                    >
                        <span>Proceed to Checkout</span>
                        <ArrowRight size={18} />
                    </button>
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
