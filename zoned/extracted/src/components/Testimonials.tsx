import { Star } from 'lucide-react';
import { TestimonialItem } from '../types';

export default function Testimonials() {
  const testimonials: TestimonialItem[] = [
    {
      id: 'test-1',
      name: 'Sarah Chen',
      role: 'Lead Architect, Nexus Design',
      quote: "Zoned isn't just a timer; it's a mental shift. My daily output has doubled since I started using the analytics suite.",
      stars: 5,
      initials: 'SC',
      theme: 'light',
      avatarColor: 'bg-zon-surface-medium text-zon-dark border border-zon-dark/15'
    },
    {
      id: 'test-2',
      name: 'Marcus Thorne',
      role: 'Fullstack Developer',
      quote: "The interface is so clean it actually calms my anxiety. Finally, a tool that respects my cognitive space.",
      stars: 5,
      initials: 'MT',
      theme: 'dark',
      avatarColor: 'bg-zon-lime text-zon-primary font-extrabold border border-zon-primary/10'
    },
    {
      id: 'test-3',
      name: 'Elena Rodriguez',
      role: 'Author & Columnist',
      quote: "Precision with soul indeed. It’s rare to find software that feels this premium and functional at the same time.",
      stars: 5,
      initials: 'ER',
      theme: 'light',
      avatarColor: 'bg-purple-100 text-purple-700 border border-purple-200'
    }
  ];

  return (
    <section id="testimonials" className="py-24 px-6 max-w-[1440px] mx-auto overflow-hidden">
      {/* Testimonials Title */}
      <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center mb-16 tracking-tighter text-zon-dark bg-gradient-to-r from-zon-dark via-zon-dark to-zon-on-variant bg-clip-text text-transparent">
        Loved by Creators.
      </h2>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((test) => {
          const isDark = test.theme === 'dark';
          
          return (
            <div
              key={test.id}
              className={`p-8 sm:p-10 rounded-3xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between ${
                isDark
                  ? 'bg-zon-charcoal text-white shadow-2xl border border-white/5 shadow-zon-lime/5'
                  : 'bg-white text-zon-dark border border-zon-dark/5 shadow-lg shadow-zon-dark/[0.01]'
              }`}
            >
              <div>
                {/* Micro Reviews Stars */}
                <div className="flex gap-1 mb-6 text-zon-lite">
                  {Array.from({ length: test.stars }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4.5 w-4.5 ${
                        isDark ? 'fill-zon-lime text-zon-lime' : 'fill-zon-primary text-zon-primary'
                      }`}
                    />
                  ))}
                </div>

                {/* Quote Block */}
                <p className={`font-sans text-base sm:text-lg mb-8 leading-relaxed font-light ${isDark ? 'text-white/90' : 'text-zon-dark/95'}`}>
                  "{test.quote}"
                </p>
              </div>

              {/* Profile Block */}
              <div className="flex items-center gap-4 border-t pt-6 border-zon-dark/5">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs select-none ${test.avatarColor}`}>
                  {test.initials}
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-current leading-tight">
                    {test.name}
                  </h4>
                  <p className={`text-[11px] leading-tight ${isDark ? 'text-white/50' : 'text-zon-on-variant/75'}`}>
                    {test.role}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
