import React, { useState } from 'react';
import { X, Check, ShieldCheck, CreditCard, Sparkles, CheckCircle, Flame } from 'lucide-react';

interface InteractiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'trial' | 'pro' | null;
  onActivatePremium: () => void;
  onSetObjectives: (target: string) => void;
}

export default function InteractiveModal({
  isOpen,
  onClose,
  type,
  onActivatePremium,
  onSetObjectives
}: InteractiveModalProps) {
  // Common state
  const [success, setSuccess] = useState(false);

  // Pro checkout state
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Trial state
  const [focusTarget, setFocusTarget] = useState('Coding & Architecture');
  const [dailyTarget, setDailyTarget] = useState('4 Sessions');
  const [soundscape, setSoundscape] = useState('Rainfall & Synths');

  if (!isOpen || !type) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon.trim().toUpperCase() === 'FLOWSTATE') {
      setDiscountPercent(50);
      setCouponApplied(true);
    } else {
      alert('Invalid coupon! Tip: Use code "FLOWSTATE" for a 50% premium discount.');
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber) {
      alert('Please fill out card details to proceed.');
      return;
    }
    // Simulate payment transaction
    setSuccess(true);
    onActivatePremium();
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 3200);
  };

  const handleTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    onSetObjectives(focusTarget);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop glassmorphic */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-zon-dark/70 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Main Card Frame */}
      <div className="relative bg-white text-zon-dark rounded-[32px] w-full max-w-[500px] shadow-2xl overflow-hidden border border-zon-dark/5 z-10 transition-transform duration-300 transform scale-100 animate-in fade-in zoom-in-95">
        
        {/* Banner header strip */}
        <div className="h-2.5 bg-zon-lime w-full" />

        {/* Closing Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-zon-surface-low text-zon-on-variant/50 hover:text-zon-dark transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* CONDITIONAL SUBVIEWS */}
        {success ? (
          /* SUCCESS CELEBRATION COMPONENT */
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6">
            <div className="h-16 w-16 bg-zon-lime/40 rounded-full flex items-center justify-center animate-bounce text-zon-primary border-2 border-zon-primary/20 shadow-lg shadow-zon-lime/20">
              <CheckCircle className="h-8 w-8 text-zon-primary" />
            </div>
            
            {type === 'pro' ? (
              <>
                <h3 className="font-sans text-2xl font-extrabold text-zon-dark">
                  Membership Active!
                </h3>
                <p className="text-sm font-sans text-zon-on-variant/80 leading-relaxed max-w-[320px]">
                  Thank you for subscribing to **Zoned Premium**. Your account is fully upgraded. Welcome to the flow state.
                </p>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zon-lime/20 text-zon-primary text-[10px] font-bold uppercase tracking-widest border border-zon-primary/15 animate-pulse-slow">
                  <Flame className="h-3.5 w-3.5" />
                  <span>Unlimited Pro Unlocked</span>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-sans text-2xl font-extrabold text-zon-dark">
                  Trial Profile Set!
                </h3>
                <p className="text-sm font-sans text-zon-on-variant/80 leading-relaxed max-w-[320px]">
                  Your Zoned focus engine has been customized for <strong className="text-zon-primary">{focusTarget}</strong>.
                </p>
                <p className="text-xs text-zon-on-variant/60">
                  Initializing distraction blockers...
                </p>
              </>
            )}
          </div>
        ) : type === 'trial' ? (
          /* TRIAL REGISTRATION */
          <div className="p-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-zon-primary animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-widest text-zon-primary">
                14-Day Free Trial Customizer
              </span>
            </div>
            <h3 className="font-sans text-xl sm:text-2xl font-black text-zon-dark mb-6 tracking-tight">
              Optimize your workspace.
            </h3>

            <form onSubmit={handleTrialSubmit} className="space-y-4">
              {/* Objective Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zon-on-variant tracking-wider">
                  Major Focus Objective
                </label>
                <select
                  value={focusTarget}
                  onChange={(e) => setFocusTarget(e.target.value)}
                  className="w-full bg-zon-surface-low border border-zon-dark/10 rounded-xl px-4 py-3 text-sm text-zon-dark font-semibold focus:outline-none focus:ring-1 focus:ring-zon-primary"
                >
                  <option value="Coding & Software Architecture">Coding & Software Architecture</option>
                  <option value="Professional Writing & Research">Professional Writing & Research</option>
                  <option value="UX/UI & Creative Design">UX/UI & Creative Design</option>
                  <option value="Deep Analytical Analysis">Deep Analytical Analysis</option>
                </select>
              </div>

              {/* Target Sessions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zon-on-variant tracking-wider">
                  Daily Sessions Target
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['2 Sessions', '4 Sessions', '8 Sessions'].map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => setDailyTarget(target)}
                      className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all text-center ${
                        dailyTarget === target
                          ? 'bg-zon-lime font-bold border-zon-primary text-zon-primary shadow'
                          : 'border-zon-dark/10 hover:border-zon-primary bg-zon-surface-low text-zon-dark'
                      }`}
                    >
                      {target}
                    </button>
                  ))}
                </div>
              </div>

              {/* soundscape picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zon-on-variant tracking-wider">
                  Select Ambient Backdrop
                </label>
                <select
                  value={soundscape}
                  onChange={(e) => setSoundscape(e.target.value)}
                  className="w-full bg-zon-surface-low border border-zon-dark/10 rounded-xl px-4 py-3 text-sm text-zon-dark font-semibold focus:outline-none"
                >
                  <option value="Rainfall & Synths">Rainfall & Ambient Synths</option>
                  <option value="Ocean Waves & White Noise">Ocean Waves & White Noise</option>
                  <option value="Binaural Alpha Waves">Binaural Alpha Waves (Cognitive State)</option>
                  <option value="Silent Absolute">Silent Absolute (Muted Environment)</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-zon-lime text-zon-primary hover:bg-zon-dark hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-lg shadow-zon-lime/5"
                >
                  Initialize Free Trial Workspace
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* PREMIUM PRO CHECKOUT MODAL */
          <div className="p-8">
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldCheck className="h-5 w-5 text-zon-primary animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-widest text-zon-primary">
                PRO CHECKOUT ENTRANCE
              </span>
            </div>
            <h3 className="font-sans text-xl sm:text-2xl font-black text-zon-dark mb-1 tracking-tight">
              Unlock the Ultimate Zone.
            </h3>
            <p className="text-xs text-zon-on-variant/70 mb-5">
              Secure billing gateway. Seamless 30-day money back guarantee.
            </p>

            {/* Price review */}
            <div className="p-4 bg-zon-surface-low rounded-xl border border-zon-dark/5 flex justify-between items-center mb-5">
              <div>
                <p className="text-[10px] text-zon-on-variant uppercase font-bold tracking-tight">Plan Selected</p>
                <p className="text-sm font-extrabold text-zon-dark">Premium Membership</p>
              </div>
              <div className="text-right">
                {couponApplied ? (
                  <>
                    <p className="text-xs line-through text-zon-on-variant/40">₹299/mo</p>
                    <p className="text-lg font-black text-zon-primary">₹149.50<span className="text-[10px] font-normal text-zon-on-variant">/mo</span></p>
                  </>
                ) : (
                  <p className="text-lg font-black text-zon-dark">₹299<span className="text-[10px] font-normal text-zon-on-variant">/mo</span></p>
                )}
              </div>
            </div>

            {/* Coupon Entry */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-5">
              <input
                placeholder="PROMO CODE"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                disabled={couponApplied}
                className="flex-1 bg-zon-surface-low border border-zon-dark/10 rounded-xl px-3 py-2 text-xs uppercase font-extrabold text-zon-dark placeholder:text-zon-on-variant/40 placeholder:font-semibold"
              />
              <button
                type="submit"
                disabled={couponApplied}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  couponApplied
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-zon-dark text-white hover:bg-zon-lime hover:text-zon-primary border border-transparent'
                }`}
              >
                {couponApplied ? 'Applied 50%' : 'Apply'}
              </button>
            </form>

            {/* Credit Card Details */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zon-on-point/50 uppercase tracking-widest text-zon-on-variant">
                  Name on card
                </label>
                <input
                  required
                  placeholder="e.g. Saumya Choudhuri"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-zon-surface-low border border-zon-dark/10 rounded-xl px-4 py-2.5 text-xs text-zon-dark font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zon-on-point/50 uppercase tracking-widest text-zon-on-variant">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    required
                    placeholder="4111 •••• •••• ••••"
                    value={cardNumber}
                    maxLength={19}
                    onChange={(e) => {
                      // Basic spacer formatting
                      const val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                      setCardNumber(val);
                    }}
                    className="w-full bg-zon-surface-low border border-zon-dark/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zon-dark font-semibold focus:outline-none"
                  />
                  <CreditCard className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zon-on-variant/40" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zon-on-point/50 uppercase tracking-widest text-zon-on-variant">
                    Expiry Date
                  </label>
                  <input
                    required
                    placeholder="MM / YY"
                    value={expiry}
                    maxLength={5}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full bg-zon-surface-low border border-zon-dark/10 rounded-xl px-4 py-2.5 text-xs text-zon-dark font-semibold focus:outline-none text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zon-on-point/50 uppercase tracking-widest text-zon-on-variant">
                    Cvv Code
                  </label>
                  <input
                    required
                    placeholder="•••"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full bg-zon-surface-low border border-zon-dark/10 rounded-xl px-4 py-2.5 text-xs text-zon-dark font-semibold focus:outline-none text-center"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-zon-lime text-zon-primary hover:bg-zon-dark hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-zon-lime/5"
                >
                  <Check className="h-4 w-4" />
                  <span>Authorize secure transaction</span>
                </button>
                <p className="text-[9px] text-zon-on-variant/50 text-center uppercase tracking-tight mt-2.5">
                  Secure checkout certified. 256-bit ssl protocol active.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
