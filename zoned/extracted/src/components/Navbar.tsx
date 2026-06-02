import { useState } from 'react';
import { Sparkles, User, ShieldCheck, HelpCircle } from 'lucide-react';

interface NavbarProps {
  onOpenTrialModal: () => void;
  onOpenUpgradeModal: () => void;
  userTier: 'free' | 'premium';
}

export default function Navbar({ onOpenTrialModal, onOpenUpgradeModal, userTier }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav border-b border-zon-dark/5 bg-zon-surface/90">
      <div className="flex justify-between items-center h-20 px-6 md:px-10 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-12">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <span className="text-2xl font-extrabold tracking-tighter text-zon-dark flex items-center gap-1.5">
              <span>Zoned</span>
              <span className="h-2 w-2 rounded-full bg-zon-lime animate-pulse"></span>
            </span>
          </a>

          {/* Nav Items */}
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="font-sans text-sm font-semibold tracking-wide text-zon-dark border-b-2 border-transparent hover:border-zon-primary pb-1 transition-all duration-200">
              Features
            </a>
            <a href="#simplicity" className="font-sans text-sm font-semibold tracking-wide text-zon-on-variant/80 hover:text-zon-primary transition-colors duration-200">
              Process
            </a>
            <a href="#testimonials" className="font-sans text-sm font-semibold tracking-wide text-zon-on-variant/80 hover:text-zon-primary transition-colors duration-200">
              Reviews
            </a>
            <a href="#pricing" className="font-sans text-sm font-semibold tracking-wide text-zon-on-variant/80 hover:text-zon-primary transition-colors duration-200">
              Pricing
            </a>
            <a href="#faq" className="font-sans text-sm font-semibold tracking-wide text-zon-on-variant/80 hover:text-zon-primary transition-colors duration-200">
              FAQ
            </a>
          </div>
        </div>

        {/* CTAs and Status */}
        <div className="flex items-center gap-4">
          {userTier === 'premium' ? (
            <span className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-zon-lime/25 text-zon-primary border border-zon-primary/20 animate-pulse-slow">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>PRO ACTIVE</span>
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-zon-surface-medium text-zon-dark/70 border border-zon-dark/10">
              <span>Trial Mode</span>
            </span>
          )}

          <button 
            onClick={userTier === 'free' ? onOpenUpgradeModal : undefined}
            className={`active:scale-95 px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest transition-all duration-300 ${
              userTier === 'premium'
                ? 'bg-zon-dark text-white hover:bg-zon-dark/80 cursor-default'
                : 'bg-zon-lime text-zon-primary hover:bg-zon-dark hover:text-zon-lime glow-lime-sm'
            }`}
          >
            {userTier === 'premium' ? 'Premium Active' : 'Upgrade to Pro'}
          </button>

          {/* User Profile avatar */}
          <div className="relative group/avatar cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-zon-dark text-zon-lime flex items-center justify-center font-bold text-xs border border-white/10 transition-transform duration-300 group-hover/avatar:scale-105">
              SC
            </div>
            
            {/* Minimal Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-zon-dark/5 opacity-0 pointer-events-none group-hover/avatar:opacity-100 group-hover/avatar:pointer-events-auto transition-all duration-300 transform origin-top-right scale-95 group-hover/avatar:scale-100 z-50">
              <div className="p-3 border-b border-zon-dark/5 mb-1.5">
                <p className="font-semibold text-xs text-zon-dark">Saumya Choudhuri</p>
                <p className="text-[10px] text-zon-on-variant truncate">saumya.choudhuri123@gmail.com</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <button onClick={onOpenTrialModal} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zon-dark hover:bg-zon-surface-low rounded-lg text-left">
                  <Sparkles className="h-3.5 w-3.5 text-zon-primary" />
                  <span>Session Preferences</span>
                </button>
                <div className="px-3 py-1.5 text-[10px] text-zon-on-variant/50 font-semibold uppercase tracking-wider">
                  Tier: {userTier === 'premium' ? 'PRO MEMBER' : 'FREE TRIAL'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
