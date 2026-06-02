import { useState } from 'react';
import { Globe, Share2, ArrowRight } from 'lucide-react';

export default function Footer() {
  const [copyFeedback, setCopyFeedback] = useState(false);

  const simulateShare = () => {
    try {
      // Copy current site URL to clipboard for sharing
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch (e) {
      console.log('Clipboard sharing failed', e);
    }
  };

  return (
    <footer className="bg-white border-t border-zon-dark/5 w-full py-16">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        
        {/* Main Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-16">
          {/* Logo Brand Descriptor */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <span className="text-xl sm:text-2xl font-extrabold text-zon-dark block tracking-tighter">
              Zoned
            </span>
            <p className="text-zon-on-variant/70 text-xs sm:text-sm max-w-[220px] leading-relaxed">
              Precision with Soul. Redefining human productivity.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h5 className="text-xs font-bold text-zon-dark uppercase tracking-widest mb-4">
              Product
            </h5>
            <ul className="space-y-3 text-xs sm:text-sm text-zon-on-variant/80">
              <li>
                <a href="#features" className="hover:text-zon-primary transition-colors duration-200">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-zon-primary transition-colors duration-200">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-zon-primary transition-colors duration-200">
                  API Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h5 className="text-xs font-bold text-zon-dark uppercase tracking-widest mb-4">
              Company
            </h5>
            <ul className="space-y-3 text-xs sm:text-sm text-zon-on-variant/80">
              <li>
                <a href="#simplicity" className="hover:text-zon-primary transition-colors duration-200">
                  Workflow
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-zon-primary transition-colors duration-200">
                  Testimonials
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-zon-primary transition-colors duration-200">
                  Philosophy
                </a>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h5 className="text-xs font-bold text-zon-dark uppercase tracking-widest mb-4">
              Legal
            </h5>
            <ul className="space-y-3 text-xs sm:text-sm text-zon-on-variant/80">
              <li>
                <a href="#faq" className="hover:text-zon-primary transition-colors duration-200">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-zon-primary transition-colors duration-200">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-10 border-t border-zon-dark/5">
          <p className="text-xs text-zon-on-variant/60 font-medium">
            © 2026 Zoned. Precision with Soul.
          </p>

          <div className="flex gap-4 items-center">
            {/* Share Clipboard alert overlay */}
            {copyFeedback && (
              <span className="text-[10px] bg-zon-lime text-zon-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-widest animate-pulse border border-zon-primary/10">
                Workspace Shared Callback Copied!
              </span>
            )}
            
            <button
              onClick={() => alert('Language options are currently set to English (UTC).')}
              className="p-2 text-zon-on-variant/70 hover:text-zon-primary hover:bg-zon-surface-low rounded-full transition-colors relative"
              title="Change Language"
            >
              <Globe className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={simulateShare}
              className="p-2 text-zon-on-variant/70 hover:text-zon-primary hover:bg-zon-surface-low rounded-full transition-colors relative"
              title="Copy Share Link"
            >
              <Share2 className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
