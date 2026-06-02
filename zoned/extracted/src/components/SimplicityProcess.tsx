import { useState } from 'react';
import { Shield, VolumeX, TrendingUp, Sparkles, CheckCircle } from 'lucide-react';

export default function SimplicityProcess() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      num: '01',
      title: 'Set Your Zone',
      desc: 'Choose your objective and define the duration. Zoned handles the environment configuration.',
      icon: Shield,
      benefit: 'Custom rules apply instantly'
    },
    {
      id: 2,
      num: '02',
      title: 'Eliminate Noise',
      desc: 'One-click distraction blocking across all your devices and browser tabs.',
      icon: VolumeX,
      benefit: 'All notifications muted'
    },
    {
      id: 3,
      num: '03',
      title: 'Review & Refine',
      desc: "End-of-session insights help you understand when you're most effective.",
      icon: TrendingUp,
      benefit: 'Smart recommendations generated'
    }
  ];

  return (
    <section id="simplicity" className="py-24 bg-zon-surface-low overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Steps Description Panel */}
          <div className="space-y-12">
            <div>
              <span className="inline-block px-3 py-1 bg-zon-lime/10 text-zon-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-zon-lime/20">
                Workflow
              </span>
              <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-zon-dark leading-none">
                Engineered for <br />
                <span className="text-zon-primary italic">Simplicity.</span>
              </h2>
            </div>

            <div className="space-y-6">
              {steps.map((step) => {
                const IconComponent = step.icon;
                const isActive = activeStep === step.id;
                
                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex gap-6 p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'bg-white border-l-4 border-zon-lime shadow-xl shadow-zon-dark/[0.02] transform translate-x-1'
                        : 'border-l-4 border-transparent hover:bg-white/40'
                    }`}
                  >
                    {/* Numbers */}
                    <span className={`text-xl sm:text-2xl font-black ${isActive ? 'text-zon-primary' : 'text-zon-primary/20'}`}>
                      {step.num}
                    </span>

                    {/* Content */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-sans text-lg font-black text-zon-dark">
                          {step.title}
                        </h4>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-zon-primary bg-zon-lime/20 px-1.5 py-0.5 rounded">
                            <CheckCircle className="h-3 w-3" />
                            <span>Active Step</span>
                          </span>
                        )}
                      </div>
                      <p className={`text-sm leading-relaxed ${isActive ? 'text-zon-dark/80' : 'text-zon-on-variant/70'}`}>
                        {step.desc}
                      </p>
                      
                      {/* Active Extra Info */}
                      {isActive && (
                        <div className="pt-2 flex items-center gap-2 text-xs text-zon-primary font-bold">
                          <IconComponent className="h-3.5 w-3.5" />
                          <span>{step.benefit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Lifestyle / Process Image Frame */}
          <div className="relative group">
            <div className="absolute -inset-8 bg-zon-lime/5 blur-[80px] rounded-full opacity-50"></div>
            
            <div className="relative rounded-[32px] overflow-hidden shadow-2xl border border-zon-dark/5 aspect-[4/3] sm:aspect-auto">
              {/* Process visualization hotlinked image with referrer policy constraint to comply with skill */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9dhUnTC06udu9lJOaf0k1MjvUuMl0rXA_IJrbgN4D7dLfq3-NAzf81pLZDtGs2P-w_5DEzaPYDGbQnTB8Zwwh5WuWBkOJ6EEgQCo9E-ICBbfEL6NJBTiF4ekD679J_0PghKvCtEppVuYWQ3EbZvNZJUaKSERaJnEEzsO2uy6rZ0cR1VDp43s9qUe0lBYAtD9jk-K1OlLlA05THxXThwwUcVxmsc-6HcQT5W_L6e5MKCCqWYkxhEoguRUt3q5JVECPUB6XWBihbMPH"
                alt="Zoned modern elegant home office layout supporting flow"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              
              {/* Overlay HUD displaying current step details dynamically inside the image space */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-zon-dark/80 backdrop-blur border border-white/10 text-white flex justify-between items-center h-16 pointer-events-none transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-zon-lime text-zon-primary text-xs font-black">
                    {steps[activeStep - 1].num}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zon-lime">Current Objective</p>
                    <p className="text-xs font-semibold">{steps[activeStep - 1].title}</p>
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
  );
}
