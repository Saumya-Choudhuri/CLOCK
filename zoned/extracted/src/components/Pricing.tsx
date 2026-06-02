import { useState } from 'react';
import { Check, Lock, Sparkles, HelpCircle } from 'lucide-react';

interface PricingProps {
  onOpenTrialModal: () => void;
  onOpenUpgradeModal: () => void;
  userTier: 'free' | 'premium';
}

export default function Pricing({ onOpenTrialModal, onOpenUpgradeModal, userTier }: PricingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  const premiumPrice = billingCycle === 'monthly' ? 299 : 239;

  return (
    <section id="pricing" className="py-24 px-6 bg-zon-charcoal text-white relative overflow-hidden">
      {/* Background Soft atmospheric radial light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zon-lime/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 bg-white/10 text-zon-lime rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-white/5">
            Transparent Tiering
          </span>
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tighter">
            Invest in your focus.
          </h2>
          <p className="text-white/60 text-sm sm:text-base max-w-[500px] mx-auto">
            Simple pricing for high-performance individuals.
          </p>

          {/* Billing Toggle Interaction */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-xs font-bold transition-all ${billingCycle === 'monthly' ? 'text-zon-lime' : 'text-white/50'}`}>
              Billed Monthly
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
              className="w-12 h-6.5 rounded-full bg-white/10 p-1 transition-all duration-300 relative border border-white/10 flex items-center"
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-zon-lime transition-all duration-300 ${
                  billingCycle === 'annually' ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold transition-all flex items-center gap-1.5 ${billingCycle === 'annually' ? 'text-zon-lime' : 'text-white/50'}`}>
              <span>Billed Annually</span>
              <span className="text-[9px] bg-zon-lime/20 text-zon-lime px-1.5 py-0.5 rounded-full font-black uppercase">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto items-stretch mt-12">
          
          {/* Free Trial Deck */}
          <div className="bg-white/5 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all duration-300 relative">
            <div>
              <h3 className="text-xl sm:text-2xl font-black mb-2 text-white/90">
                Free Trial
              </h3>
              <div className="text-4xl sm:text-5xl font-black mb-8 text-white flex items-baseline">
                ₹0
                <span className="text-xs sm:text-sm font-semibold opacity-40 ml-2">
                  / 14 days
                </span>
              </div>

              <ul className="space-y-4.5 mb-10 text-sm text-white/80">
                <li className="flex items-center gap-3">
                  <Check className="h-4.5 w-4.5 text-zon-lime shrink-0" />
                  <span>Core Focus Timer</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4.5 w-4.5 text-zon-lime shrink-0" />
                  <span>Basic Task Management</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4.5 w-4.5 text-zon-lime shrink-0" />
                  <span>Standard Soundscapes</span>
                </li>
                <li className="flex items-center gap-3 opacity-35 select-none">
                  <Lock className="h-4.5 w-4.5 text-white/40 shrink-0" />
                  <span className="line-through">Advanced Analytics</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenTrialModal}
              disabled={userTier === 'premium'}
              className={`w-full py-4 rounded-full border border-white/20 hover:bg-white hover:text-zon-dark transition-all duration-300 font-bold text-sm select-none uppercase tracking-wider ${
                userTier === 'premium' ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
              }`}
            >
              {userTier === 'premium' ? 'Pro Pack Active' : 'Start Free Trial'}
            </button>
          </div>

          {/* Premium Deck */}
          <div className="bg-zon-lime p-8 sm:p-10 rounded-3xl text-zon-dark shadow-[0_0_80px_rgba(201,255,59,0.15)] relative flex flex-col justify-between overflow-hidden border-2 border-zon-primary-container group hover:scale-[1.01] transition-transform duration-300">
            {/* Recommended Pill Badge */}
            <div className="absolute top-0 right-0 bg-zon-charcoal text-white px-5 py-2.5 rounded-bl-[18px] text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-neutral-800 to-zon-charcoal">
              Recommended
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-1.5 text-zon-dark">
                <span>Premium Pro</span>
                <Sparkles className="h-5 w-5 fill-zon-primary text-zon-primary animate-pulse" />
              </h3>
              
              <div className="text-4xl sm:text-5xl font-black mb-8 flex items-baseline text-zon-dark">
                ₹{premiumPrice}
                <span className="text-xs sm:text-sm font-semibold opacity-60 ml-2">
                  / month
                </span>
              </div>

              <ul className="space-y-4.5 mb-10 text-sm text-zon-dark/95">
                <li className="flex items-center gap-3 font-semibold">
                  <Check className="h-4.5 w-4.5 stroke-[3px] text-zon-dark shrink-0" />
                  <span>Unlimited Sessions & Tasks</span>
                </li>
                <li className="flex items-center gap-3 font-semibold">
                  <Check className="h-4.5 w-4.5 stroke-[3px] text-zon-dark shrink-0" />
                  <span>Multi-device Sync</span>
                </li>
                <li className="flex items-center gap-3 font-semibold">
                  <Check className="h-4.5 w-4.5 stroke-[3px] text-zon-dark shrink-0" />
                  <span>Precision Analytics Suite</span>
                </li>
                <li className="flex items-center gap-3 font-semibold">
                  <Check className="h-4.5 w-4.5 stroke-[3px] text-zon-dark shrink-0" />
                  <span>API Access & Integrations</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenUpgradeModal}
              className="w-full py-4 rounded-full bg-zon-dark text-white hover:bg-white hover:text-zon-dark active:scale-95 transition-all duration-300 font-bold text-sm uppercase tracking-wider shadow-lg shadow-zon-dark/10"
            >
              {userTier === 'premium' ? 'Active Membership' : 'Get Premium Now'}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
