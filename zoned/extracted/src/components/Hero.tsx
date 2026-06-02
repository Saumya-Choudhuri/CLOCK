import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, User, Eye, Sparkles } from 'lucide-react';

interface HeroProps {
  onOpenTrialModal: () => void;
  onOpenUpgradeModal: () => void;
  userTier: 'free' | 'premium';
}

export default function Hero({ onOpenTrialModal, onOpenUpgradeModal, userTier }: HeroProps) {
  const [currentTime, setCurrentTime] = useState('');

  // Update current time every second to show a living active clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (num: number) => num.toString().padStart(2, '0');
      setCurrentTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-gradient min-h-[920px] flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 relative overflow-hidden">
      {/* Background Soft Orbs */}
      <div className="soft-orb -top-40 -left-40"></div>
      <div className="soft-orb top-2/3 -right-40 opacity-60"></div>

      <div className="max-w-[850px] mx-auto z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Subtitle Accent */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zon-lime/10 text-zon-primary text-xs font-bold tracking-widest uppercase mb-6 border border-zon-lime/20">
          <Sparkles className="h-3.5 w-3.5 text-zon-lime" />
          <span>Precision Workspace V1.0</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl font-extrabold text-zon-dark tracking-tighter leading-[1.05] mb-6">
          Time Management <br />
          <span className="text-zon-primary italic bg-gradient-to-r from-zon-primary to-lime-600 bg-clip-text text-transparent">
            Refined
          </span>{' '}
          by Design.
        </h1>

        {/* Hero Subtitle */}
        <p className="font-sans text-base sm:text-lg text-zon-on-variant/80 max-w-[640px] mx-auto mb-10 leading-relaxed">
          The premium focus environment for high-performance professionals. Reduce cognitive load, enter the flow state, and reclaim your hours.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button
            onClick={onOpenTrialModal}
            className="w-full sm:w-auto px-8 py-4 bg-zon-lime text-zon-primary rounded-full font-bold text-sm tracking-wide shadow-lg shadow-zon-lime/20 hover:scale-105 active:scale-95 hover:bg-zon-dark hover:text-white transition-all duration-300"
          >
            Start Free Trial
          </button>
          <button
            onClick={onOpenUpgradeModal}
            className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-zon-dark text-zon-dark rounded-full font-bold text-sm tracking-wide hover:bg-zon-dark hover:text-white active:scale-95 transition-all duration-300"
          >
            {userTier === 'premium' ? 'Explore Premium' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>

      {/* Main Interactive Dashboard Preview */}
      <div className="w-full max-w-[1200px] px-4 md:px-0 mt-8 relative group z-10">
        <div className="absolute -inset-4 bg-zon-lime/10 blur-[80px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        
        <div className="relative bg-[#121212] rounded-[32px] p-4 md:p-8 shadow-[0_40px_60px_-15px_rgba(0,0,0,0.3)] border border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 gap-6 items-stretch">
            {/* Sidebar-like Preview (Interactive clock status) */}
            <div className="col-span-12 lg:col-span-4 bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-left border border-white/10 flex flex-col justify-between relative overflow-hidden group/sidebar">
              <div className="absolute top-0 right-0 w-32 h-32 bg-zon-lime/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <span className="text-[10px] sm:text-xs font-bold text-zon-lime mb-1 block uppercase tracking-[0.2em]">
                    Precision Studio
                  </span>
                  <div className="text-white text-xs font-semibold opacity-60">
                    {userTier === 'premium' ? 'Unlimited pro access' : 'Trial: 7 days left'}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-zon-lime/20 text-zon-lime flex items-center justify-center border border-zon-lime/30 animate-pulse">
                  <User className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                {/* Active Session Display */}
                <div className="p-4 bg-white/5 rounded-xl border border-zon-lime/20 relative overflow-hidden group/timer-display">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-zon-lime text-[10px] font-bold uppercase tracking-widest">
                      ACTIVE SESSION
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
                  </div>
                  <div className="text-white text-3xl sm:text-4xl font-extrabold digital-mono">
                    {currentTime || '00:00:00'}
                  </div>
                  <p className="text-[10px] text-white/40 mt-1 uppercase tracking-tight">
                    Synchronized with system time
                  </p>
                </div>

                {/* Bottom CTA block */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={onOpenUpgradeModal}
                    className="w-full py-3 bg-zon-lime text-zon-primary rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-zon-dark transition-all duration-300 transform active:scale-95 shadow-lg shadow-zon-lime/5"
                  >
                    {userTier === 'premium' ? 'Manage Membership' : 'Upgrade to Pro'}
                  </button>
                  <p className="text-[9px] text-white/40 mt-2 text-center uppercase tracking-widest">
                    Unlimited tasks & premium themes
                  </p>
                </div>
              </div>
            </div>

            {/* Main Preview Chart Area */}
            <div className="col-span-12 lg:col-span-8 overflow-hidden rounded-2xl bg-black relative min-h-[380px] flex flex-col justify-end">
              {/* Hotlinked reference image matching the requested design exactly */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZlmnCO4Pj4qTzpd31nkXCN2mCROPnvmVEUao-vkMPuBn5FWN6C_uMYQepx1tbsP7JrZWJ5o5a23ELVv6Eu3KmYQgJ1L8QeHGoNvQxZhi4bsK5p8DdI11-Va-xsVGxK1zwg723GrRQiEhdswFsef_741tLNo_LLG11_xx8Y-Ni60SLSBhEfmGVjk4eUv5bg4Mm8s0kjX1dFEv2YZW022ptQyU8VDWYXfKm7ZA3n-6U6lfbnKf-MNxQAgu1mwvx7YCcUirKqNdfng3T"
                alt="Zoned Real-time Analytics Performance Dashboard"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-[1.02] transition-transform duration-1000"
              />
              
              {/* Subtle visual gradient vignette overlay to ensure text is fully readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              
              <div className="relative p-6 sm:p-8 text-left z-10 pointer-events-none">
                <span className="text-zon-lime text-[10px] font-bold mb-2.5 tracking-[0.25em] uppercase flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Interactive Live Interface Demo</span>
                </span>
                <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tighter leading-tight max-w-[500px]">
                  Real-time Performance Metrics
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
