"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useAuthModal } from "@/app/context/AuthModalContext";
import { UserHeader } from "@/app/components/UserHeader";
import { startRazorpayCheckout } from "@/app/utils/razorpayCheckout";

const processSteps = [
  {
    id: "01",
    title: "Set Your Zone",
    description:
      "Choose your objective and define the duration. Zoned handles the environment configuration.",
  },
  {
    id: "02",
    title: "Eliminate Noise",
    description: "One-click distraction blocking keeps your workspace minimal and clear.",
  },
  {
    id: "03",
    title: "Review & Refine",
    description: "End-of-session insights help you understand when you are most effective.",
  },
];

const testimonials = [
  {
    quote:
      "Zoned is not just a timer; it is a mental shift. My daily output has doubled since I started using the analytics suite.",
    name: "Sarah Chen",
    role: "Lead Architect, Nexus Design",
    tone: "light",
  },
  {
    quote:
      "The interface is so clean it actually calms my anxiety. Finally, a tool that respects my cognitive space.",
    name: "Marcus Thorne",
    role: "Fullstack Developer",
    tone: "dark",
  },
  {
    quote:
      "Precision with soul indeed. It's rare to find software that feels this premium and functional at the same time.",
    name: "Elena Rodriguez",
    role: "Author & Columnist",
    tone: "light",
  },
];

const faqItems = [
  {
    id: "faq-1",
    question: "How does Zoned improve focus?",
    answer:
      "Zoned uses neuro-scientifically backed interval techniques and a minimalist workspace UI to reduce the cognitive friction of starting and maintaining deep work periods. By eliminating visual tab clutter and tracking daily achievements, it establishes high-value momentum.",
  },
  {
    id: "faq-2",
    question: "Can I sync across my devices?",
    answer:
      "Yes! With a Premium membership, all active session targets, custom workspace preferences, sprint tasks, and historical focal logs are synchronized seamlessly, keeping you in sync on mobile, tablet, and desktop.",
  },
  {
    id: "faq-3",
    question: "Is there an API available?",
    answer:
      "Absolutely. Developers can query focus minutes, sprint statistics, task completion rates, and historical logs. Real-time active soundscape hooks are available for direct developer workflow automation.",
  },
];

export default function LandingPage() {
  const { user, checkFreeTrial, checkPremiumAccess } = useAuth();
  const { openLogin } = useAuthModal();
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");
  const [activeStep, setActiveStep] = useState(1);
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  const handleGoToClock = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const handleUpgradeClick = async () => {
    if (!user) {
      openLogin();
      return;
    }

    try {
      const checkoutData = await startRazorpayCheckout({
        uid: user.uid,
        email: user.email,
        username: user.displayName || "User",
      });

      const options = {
        key: checkoutData.keyId,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        order_id: checkoutData.orderId,
        name: "Zoned",
        description: `Premium Pro - ${billingCycle === "monthly" ? "Monthly" : "Annual"}`,
        handler: function (response: any) {
          window.location.href = "/billing/success";
        },
        modal: {
          ondismiss: function () {
            console.log("Payment cancelled");
          },
        },
      };

      if (window.Razorpay) {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    }
  };

  const isPremiumActive = checkPremiumAccess();
  const isTrialActive = checkFreeTrial();
  const statusLabel = isPremiumActive
    ? "PRO ACTIVE"
    : user
      ? isTrialActive
        ? "TRIAL MODE"
        : "TRIAL ENDED"
      : "Trial Mode";
  const premiumPrice = billingCycle === "monthly" ? 299 : 239;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (num: number) => num.toString().padStart(2, "0");
      setCurrentTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFaq = (id: string) => {
    setOpenFaqId((current) => (current === id ? null : id));
  };

  return (
    <main className="landing-root min-h-screen bg-zon-surface text-zon-dark antialiased relative overflow-x-hidden selection:bg-zon-lime selection:text-zon-primary">
      <nav className="fixed top-0 w-full z-50 glass-nav border-b border-zon-dark/5 bg-zon-surface/90">
        <div className="flex justify-between items-center h-20 px-6 md:px-10 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-12">
            <button onClick={handleGoToClock} className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
              <span className="text-2xl font-extrabold tracking-tight text-zon-dark flex items-center gap-1.5">
                <span>Zoned</span>
                <span className="h-2 w-2 rounded-full bg-zon-lime animate-pulse"></span>
              </span>
            </button>

            <div className="hidden md:flex gap-8 items-center">
              <a
                href="#simplicity"
                className="text-sm font-semibold tracking-wide text-zon-on-variant/80 hover:text-zon-primary transition-colors duration-200"
              >
                Features
              </a>
              <a
                href="#simplicity"
                className="text-sm font-semibold tracking-wide text-zon-on-variant/80 hover:text-zon-primary transition-colors duration-200"
              >
                Process
              </a>
              <a
                href="#testimonials"
                className="text-sm font-semibold tracking-wide text-zon-on-variant/80 hover:text-zon-primary transition-colors duration-200"
              >
                Reviews
              </a>
              <a
                href="#pricing"
                className="text-sm font-semibold tracking-wide text-zon-on-variant/80 hover:text-zon-primary transition-colors duration-200"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-sm font-semibold tracking-wide text-zon-on-variant/80 hover:text-zon-primary transition-colors duration-200"
              >
                FAQ
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-zon-lime/25 text-zon-primary border border-zon-primary/20 animate-pulse-slow uppercase tracking-[0.2em]">
              {statusLabel}
            </span>
            {!isPremiumActive && (
              <button
                onClick={handleUpgradeClick}
                className="active:scale-95 px-5 py-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest transition-all duration-300 bg-zon-lime text-zon-primary hover:bg-zon-dark hover:text-zon-lime glow-lime-sm"
              >
                Upgrade to Pro
              </button>
            )}
            <div className="hidden lg:block">
              <UserHeader />
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <section className="hero-gradient min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 relative overflow-hidden">
          <div className="soft-orb -top-40 -left-40"></div>
          <div className="soft-orb top-2/3 -right-40 opacity-60"></div>

          <div className="max-w-[850px] mx-auto z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zon-lime/10 text-zon-primary text-xs font-bold tracking-widest uppercase mb-6 border border-zon-lime/20">
              Precision Workspace V1.0
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-zon-dark tracking-tight leading-[1.05] mb-6">
              Time Management
              <br />
              <span className="text-zon-primary italic">Refined</span> by Design.
            </h1>

            <p className="text-base sm:text-lg text-zon-on-variant/80 max-w-[640px] mx-auto mb-10 leading-relaxed">
              The premium focus environment for high-performance professionals. Reduce cognitive load, enter the flow state, and reclaim your hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {isPremiumActive ? (
                <button
                  onClick={handleGoToClock}
                  className="w-full sm:w-auto px-8 py-4 bg-zon-lime text-zon-primary rounded-full font-bold text-sm tracking-wide shadow-lg shadow-zon-lime/20 hover:scale-105 active:scale-95 hover:bg-zon-dark hover:text-white transition-all duration-300"
                >
                  Open Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={handleGoToClock}
                    className="w-full sm:w-auto px-8 py-4 bg-zon-lime text-zon-primary rounded-full font-bold text-sm tracking-wide shadow-lg shadow-zon-lime/20 hover:scale-105 active:scale-95 hover:bg-zon-dark hover:text-white transition-all duration-300"
                  >
                    Start Free Trial
                  </button>
                  <button
                    onClick={handleUpgradeClick}
                    className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-zon-dark text-zon-dark rounded-full font-bold text-sm tracking-wide hover:bg-zon-dark hover:text-white active:scale-95 transition-all duration-300"
                  >
                    Upgrade to Pro
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="w-full max-w-[1200px] px-4 md:px-0 mt-8 relative group z-10">
            <div className="absolute -inset-4 bg-zon-lime/10 blur-[80px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

            <div className="relative bg-[#121212] rounded-[32px] p-4 md:p-8 shadow-[0_40px_60px_-15px_rgba(0,0,0,0.3)] border border-white/5 overflow-hidden">
              <div className="grid grid-cols-12 gap-6 items-stretch">
                <div className="col-span-12 lg:col-span-4 bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-left border border-white/10 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-zon-lime/5 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-zon-lime mb-1 block uppercase tracking-[0.2em]">
                        Precision Studio
                      </span>
                      <div className="text-white text-xs font-semibold opacity-60">
                        {isPremiumActive ? "Unlimited pro access" : "Trial: 7 days left"}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zon-lime/20 text-zon-lime flex items-center justify-center border border-zon-lime/30 animate-pulse">
                      <span className="text-xs font-bold">Z</span>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="p-4 bg-white/5 rounded-xl border border-zon-lime/20 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-zon-lime text-[10px] font-bold uppercase tracking-widest">
                          Active Session
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
                      </div>
                      <div className="text-white text-3xl sm:text-4xl font-extrabold digital-mono">
                        {currentTime}
                      </div>
                      <p className="text-[10px] text-white/40 mt-1 uppercase tracking-tight">
                        Synchronized with system time
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      {isPremiumActive ? (
                        <button
                          onClick={handleGoToClock}
                          className="w-full py-3 bg-zon-lime text-zon-primary rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-zon-dark transition-all duration-300 transform active:scale-95 shadow-lg shadow-zon-lime/5"
                        >
                          Open Dashboard
                        </button>
                      ) : (
                        <button
                          onClick={handleUpgradeClick}
                          className="w-full py-3 bg-zon-lime text-zon-primary rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-zon-dark transition-all duration-300 transform active:scale-95 shadow-lg shadow-zon-lime/5"
                        >
                          Upgrade to Pro
                        </button>
                      )}
                      <p className="text-[9px] text-white/40 mt-2 text-center uppercase tracking-widest">
                        Unlimited tasks and premium themes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-8 overflow-hidden rounded-2xl bg-black relative min-h-[380px] flex flex-col justify-end">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZlmnCO4Pj4qTzpd31nkXCN2mCROPnvmVEUao-vkMPuBn5FWN6C_uMYQepx1tbsP7JrZWJ5o5a23ELVv6Eu3KmYQgJ1L8QeHGoNvQxZhi4bsK5p8DdI11-Va-xsVGxK1zwg723GrRQiEhdswFsef_741tLNo_LLG11_xx8Y-Ni60SLSBhEfmGVjk4eUv5bg4Mm8s0kjX1dFEv2YZW022ptQyU8VDWYXfKm7ZA3n-6U6lfbnKf-MNxQAgu1mwvx7YCcUirKqNdfng3T"
                    alt="Zoned real-time analytics performance dashboard"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-[1.02] transition-transform duration-1000"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

                  <div className="relative p-6 sm:p-8 text-left z-10 pointer-events-none">
                    <span className="text-zon-lime text-[10px] font-bold mb-2.5 tracking-[0.25em] uppercase flex items-center gap-1.5">
                      Interactive Live Interface Demo
                    </span>
                    <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight max-w-[500px]">
                      Real-time Performance Metrics
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="simplicity" className="py-24 bg-zon-surface-low overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-12">
                <div>
                  <span className="inline-block px-3 py-1 bg-zon-lime/10 text-zon-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-zon-lime/20">
                    Workflow
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zon-dark leading-none">
                    Engineered for
                    <br />
                    <span className="text-zon-primary italic">Simplicity.</span>
                  </h2>
                </div>

                <div className="space-y-6">
                  {processSteps.map((step, index) => {
                    const isActive = activeStep === index + 1;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setActiveStep(index + 1)}
                        className={`w-full text-left flex gap-6 p-6 rounded-2xl transition-all duration-300 ${
                          isActive
                            ? "bg-white border-l-4 border-zon-lime shadow-xl shadow-zon-dark/[0.02] translate-x-1"
                            : "border-l-4 border-transparent hover:bg-white/40"
                        }`}
                      >
                        <span className={`text-xl sm:text-2xl font-black ${isActive ? "text-zon-primary" : "text-zon-primary/20"}`}>
                          {step.id}
                        </span>
                        <div className="space-y-1">
                          <h4 className="text-lg font-black text-zon-dark">{step.title}</h4>
                          <p className={`text-sm leading-relaxed ${isActive ? "text-zon-dark/80" : "text-zon-on-variant/70"}`}>
                            {step.description}
                          </p>
                          {isActive && (
                            <div className="pt-2 text-xs text-zon-primary font-bold uppercase tracking-widest">
                              Active Step
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-8 bg-zon-lime/5 blur-[80px] rounded-full opacity-50"></div>
                <div className="relative rounded-[32px] overflow-hidden shadow-2xl border border-zon-dark/5 aspect-[4/3]">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9dhUnTC06udu9lJOaf0k1MjvUuMl0rXA_IJrbgN4D7dLfq3-NAzf81pLZDtGs2P-w_5DEzaPYDGbQnTB8Zwwh5WuWBkOJ6EEgQCo9E-ICBbfEL6NJBTiF4ekD679J_0PghKvCtEppVuYWQ3EbZvNZJUaKSERaJnEEzsO2uy6rZ0cR1VDp43s9qUe0lBYAtD9jk-K1OlLlA05THxXThwwUcVxmsc-6HcQT5W_L6e5MKCCqWYkxhEoguRUt3q5JVECPUB6XWBihbMPH"
                    alt="Zoned modern elegant home office layout supporting flow"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-zon-dark/80 backdrop-blur border border-white/10 text-white flex justify-between items-center h-16">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-zon-lime text-zon-primary text-xs font-black">
                        {processSteps[activeStep - 1]?.id}
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zon-lime">Current Objective</p>
                        <p className="text-xs font-semibold">{processSteps[activeStep - 1]?.title}</p>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right">
                      <p className="text-[10px] text-white/50 uppercase tracking-tight">Active State</p>
                      <p className="text-xs font-medium text-white/90">Automated Control</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-24 px-6 max-w-[1440px] mx-auto overflow-hidden">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center mb-16 tracking-tight text-zon-dark">
            Loved by Creators.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((item) => {
              const isDark = item.tone === "dark";
              return (
                <div
                  key={item.name}
                  className={`p-8 sm:p-10 rounded-3xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between ${
                    isDark
                      ? "bg-zon-charcoal text-white shadow-2xl border border-white/5 shadow-zon-lime/5"
                      : "bg-white text-zon-dark border border-zon-dark/5 shadow-lg shadow-zon-dark/[0.01]"
                  }`}
                >
                  <p className={`text-base sm:text-lg mb-8 leading-relaxed font-light ${isDark ? "text-white/90" : "text-zon-dark/95"}`}>
                    "{item.quote}"
                  </p>
                  <div className="flex items-center gap-4 border-t pt-6 border-zon-dark/5">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs ${
                      isDark ? "bg-zon-lime text-zon-primary" : "bg-zon-surface-medium text-zon-dark"
                    }`}>
                      {item.name.split(" ").map((part) => part[0]).join("")}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-current leading-tight">{item.name}</h4>
                      <p className={`text-[11px] leading-tight ${isDark ? "text-white/50" : "text-zon-on-variant/75"}`}>
                        {item.role}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="pricing" className="py-24 px-6 bg-zon-charcoal text-white relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zon-lime/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-[1440px] mx-auto relative z-10">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 bg-white/10 text-zon-lime rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-white/5">
                Transparent Tiering
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
                Invest in your focus.
              </h2>
              <p className="text-white/60 text-sm sm:text-base max-w-[500px] mx-auto">
                Simple pricing for high-performance individuals.
              </p>

              <div className="flex items-center justify-center gap-3 mt-8">
                <span className={`text-xs font-bold transition-all ${billingCycle === "monthly" ? "text-zon-lime" : "text-white/50"}`}>
                  Billed Monthly
                </span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(billingCycle === "monthly" ? "annually" : "monthly")}
                  className="w-12 h-6.5 rounded-full bg-white/10 p-1 transition-all duration-300 relative border border-white/10 flex items-center"
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-zon-lime transition-all duration-300 ${
                      billingCycle === "annually" ? "translate-x-5.5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === "annually" ? "text-zon-lime" : "text-white/50"
                }`}>
                  <span>Billed Annually</span>
                  <span className="text-[9px] bg-zon-lime/20 text-zon-lime px-1.5 py-0.5 rounded-full font-black uppercase">
                    Save 20%
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto items-stretch mt-12">
              <div className="bg-white/5 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all duration-300">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black mb-2 text-white/90">Free Trial</h3>
                  <div className="text-4xl sm:text-5xl font-black mb-8 text-white flex items-baseline">
                    INR 0
                    <span className="text-xs sm:text-sm font-semibold opacity-40 ml-2">/ 7 days</span>
                  </div>
                  <ul className="space-y-4.5 mb-10 text-sm text-white/80">
                    <li>Core focus timer</li>
                    <li>Basic task management</li>
                    <li>Standard soundscapes</li>
                    <li className="line-through opacity-35">Advanced analytics</li>
                  </ul>
                </div>
                {isPremiumActive ? (
                  <button
                    onClick={handleGoToClock}
                    className="w-full py-4 rounded-full border border-white/20 hover:bg-white hover:text-zon-dark transition-all duration-300 font-bold text-sm uppercase tracking-wider active:scale-95"
                  >
                    Open Dashboard
                  </button>
                ) : (
                  <button
                    onClick={handleGoToClock}
                    className="w-full py-4 rounded-full border border-white/20 hover:bg-white hover:text-zon-dark transition-all duration-300 font-bold text-sm uppercase tracking-wider active:scale-95"
                  >
                    Start Free Trial
                  </button>
                )}
              </div>

              <div className="bg-zon-lime p-8 sm:p-10 rounded-3xl text-zon-dark shadow-[0_0_80px_rgba(201,255,59,0.15)] relative flex flex-col justify-between overflow-hidden border-2 border-zon-primary/20">
                <div className="absolute top-0 right-0 bg-zon-charcoal text-white px-5 py-2.5 rounded-bl-[18px] text-[10px] font-bold uppercase tracking-widest">
                  Recommended
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black mb-2">Premium Pro</h3>
                  <div className="text-4xl sm:text-5xl font-black mb-8 flex items-baseline">
                    INR {premiumPrice}
                    <span className="text-xs sm:text-sm font-semibold opacity-60 ml-2">/ month</span>
                  </div>
                  <ul className="space-y-4.5 mb-10 text-sm text-zon-dark/95">
                    <li>Unlimited sessions and tasks</li>
                    <li>Multi-device sync</li>
                    <li>Precision analytics suite</li>
                    <li>API access and integrations</li>
                  </ul>
                </div>

                <button
                  onClick={openLogin}
                  className="w-full py-4 rounded-full bg-zon-dark text-white hover:bg-white hover:text-zon-dark active:scale-95 transition-all duration-300 font-bold text-sm uppercase tracking-wider shadow-lg shadow-zon-dark/10"
                >
                  {isPremiumActive ? "Active Membership" : "Get Premium Now"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-24 px-6 max-w-[800px] mx-auto select-none">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center mb-16 tracking-tight text-zon-dark">
            Questions?
          </h2>

          <div className="space-y-4">
            {faqItems.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="border-b border-zon-dark/10 pb-4 transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex justify-between items-center text-left py-4 text-base sm:text-lg font-bold text-zon-dark hover:text-zon-primary transition-colors"
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`w-8 h-8 rounded-full bg-zon-surface-low text-zon-dark flex items-center justify-center transition-all duration-300 ${
                        isOpen ? "rotate-45 bg-zon-lime text-zon-primary" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-[220px] opacity-100 mt-2 mb-4" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="p-4 bg-zon-surface-low rounded-2xl border border-zon-dark/5">
                      <p className="text-sm sm:text-base leading-relaxed text-zon-on-variant/80 font-light">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-zon-dark/5 w-full py-16">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-16">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <span className="text-xl sm:text-2xl font-extrabold text-zon-dark block tracking-tight">Zoned</span>
              <p className="text-zon-on-variant/70 text-xs sm:text-sm max-w-[220px] leading-relaxed">
                Precision with Soul. Redefining human productivity.
              </p>
            </div>
            <div>
              <h5 className="text-xs font-bold text-zon-dark uppercase tracking-widest mb-4">Product</h5>
              <ul className="space-y-3 text-xs sm:text-sm text-zon-on-variant/80">
                <li><a href="#features" className="hover:text-zon-primary transition-colors duration-200">Features</a></li>
                <li><a href="#pricing" className="hover:text-zon-primary transition-colors duration-200">Pricing</a></li>
                <li><a href="#faq" className="hover:text-zon-primary transition-colors duration-200">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-bold text-zon-dark uppercase tracking-widest mb-4">Company</h5>
              <ul className="space-y-3 text-xs sm:text-sm text-zon-on-variant/80">
                <li><a href="#simplicity" className="hover:text-zon-primary transition-colors duration-200">Workflow</a></li>
                <li><a href="#testimonials" className="hover:text-zon-primary transition-colors duration-200">Testimonials</a></li>
                <li><a href="#pricing" className="hover:text-zon-primary transition-colors duration-200">Philosophy</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-bold text-zon-dark uppercase tracking-widest mb-4">Legal</h5>
              <ul className="space-y-3 text-xs sm:text-sm text-zon-on-variant/80">
                <li><a href="#faq" className="hover:text-zon-primary transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#faq" className="hover:text-zon-primary transition-colors duration-200">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-10 border-t border-zon-dark/5">
            <p className="text-xs text-zon-on-variant/60 font-medium">© 2026 Zoned. Precision with Soul.</p>
            <div className="flex gap-4 items-center">
              <button onClick={handleGoToClock} className="text-xs font-semibold text-zon-on-variant/70 hover:text-zon-primary transition-colors">Open Dashboard</button>
              <a href="#features" className="text-xs font-semibold text-zon-on-variant/70 hover:text-zon-primary">Features</a>
              <a href="#pricing" className="text-xs font-semibold text-zon-on-variant/70 hover:text-zon-primary">Pricing</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
