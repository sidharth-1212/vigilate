import { ArrowRight, Check, Shield, Zap, FileText, CheckCircle, X, ScanSearch, BookOpen, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showSample, setShowSample] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthRoute = () => {
    const hasToken = !!localStorage.getItem('token');
    if (hasToken) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleUpgradeRoute = () => {
    const hasToken = !!localStorage.getItem('token');
    if (hasToken) {
      navigate('/dashboard?triggerCheckout=true');
    } else {
      navigate('/login?intent=purchase');
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white selection:bg-blue-500/30" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />

      {/* Glow blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.07) 0%, transparent 70%)' }} />
      
      {/* Hero Section */}
      <header className="relative container mx-auto px-6 pt-28 pb-36 text-center max-w-5xl">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs tracking-widest uppercase font-sans mb-10">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
          </span>
          Llama 3.3 · 70B · Legal Intelligence
        </div>

        <h1 style={{ fontFamily: "'Georgia', serif", letterSpacing: '-0.03em', lineHeight: '1.05' }} className="text-6xl md:text-8xl font-bold mb-7 text-white">
          Stop signing<br />
          <span style={{ WebkitTextStroke: '1px rgba(59,130,246,0.8)', color: 'transparent' }}>blind.</span>
        </h1>

        <p className="text-lg text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>
          Upload any contract, NDA, or terms of service. Vigilate extracts hidden red flags and translates legal language into plain English — in seconds.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={handleAuthRoute}
            className="group inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg shadow-blue-900/30 font-sans"
            style={{ fontFamily: "'system-ui', sans-serif" }}
          >
            Scan a Document
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => setShowSample(true)}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-base border border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/50 text-slate-300 transition-all duration-200 font-sans"
            style={{ fontFamily: "'system-ui', sans-serif" }}
          >
            <BookOpen className="w-4 h-4" />
            View Sample Report
          </button>
        </div>

        {/* Social proof strip */}
        <div className="mt-16 flex items-center justify-center gap-8 text-xs text-slate-600 font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-600" /> No credit card required</span>
          <span className="w-px h-3 bg-slate-700" />
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-blue-600" /> Documents never stored</span>
          <span className="w-px h-3 bg-slate-700" />
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-600" /> Results in under 30s</span>
        </div>
      </header>

      {/* Feature Pillars */}
      <section className="border-y border-slate-800/60 bg-slate-900/30 py-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-px bg-slate-800/40 rounded-2xl overflow-hidden border border-slate-800/40">
            {[
              {
                icon: <Zap className="w-5 h-5 text-blue-400" />,
                color: 'bg-blue-500/8 border-blue-800/30',
                iconBg: 'bg-blue-500/10 border border-blue-500/20',
                title: 'High-Speed Inference',
                desc: 'Powered by Llama 3.3 70B. Sub-second processing on documents up to 50,000 characters.'
              },
              {
                icon: <ScanSearch className="w-5 h-5 text-rose-400" />,
                color: 'bg-rose-500/5 border-rose-800/30',
                iconBg: 'bg-rose-500/10 border border-rose-500/20',
                title: 'Deep Clause Extraction',
                desc: 'Identifies non-competes, indemnity traps, and IP grabs that generic AI models overlook.'
              },
              {
                icon: <FileText className="w-5 h-5 text-emerald-400" />,
                color: 'bg-emerald-500/5 border-emerald-800/30',
                iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
                title: 'Professional Exports',
                desc: 'Pro members get formatted PDF and TXT reports ready to share with counsel.'
              }
            ].map((f, i) => (
              <div key={i} className="bg-[#0c1220] p-10 space-y-5 hover:bg-[#0e1525] transition-colors duration-300">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${f.iconBg}`}>{f.icon}</div>
                <h3 className="text-base font-semibold text-white tracking-tight" style={{ fontFamily: "'system-ui', sans-serif" }}>{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-blue-500 tracking-[0.2em] uppercase font-sans mb-3" style={{ fontFamily: "'system-ui', sans-serif" }}>Pricing</p>
            <h2 className="text-4xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Georgia', serif", letterSpacing: '-0.02em' }}>
              Deploy Vigilate
            </h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm font-sans leading-relaxed" style={{ fontFamily: "'system-ui', sans-serif" }}>
              Start auditing for free, or unlock enterprise-grade capacity for high-volume operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-8 flex flex-col hover:border-slate-700 transition-colors duration-300">
              <div className="mb-8">
                <p className="text-xs text-slate-500 tracking-widest uppercase font-sans mb-2" style={{ fontFamily: "'system-ui', sans-serif" }}>Reconnaissance</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-bold text-white" style={{ fontFamily: "'Georgia', serif" }}>$0</span>
                  <span className="text-slate-600 text-sm font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>/ forever</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>Essential legal intelligence for individuals and quick checks.</p>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {['5 AI scans per month', 'PDF & DOCX support', 'Risk scoring (1–10)', '24-hour audit history'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-400 font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>
                    <span className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-slate-500" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleAuthRoute}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3.5 rounded-xl transition text-sm font-sans"
                style={{ fontFamily: "'system-ui', sans-serif" }}
              >
                Start Scanning
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-[#0c1220] border border-blue-500/40 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-blue-950/30 md:-translate-y-3">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
              
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-blue-400 tracking-widest uppercase font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>Command Center</p>
                  <span className="text-[10px] bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-full tracking-widest uppercase font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>
                    ★ Most Popular
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-bold text-white" style={{ fontFamily: "'Georgia', serif" }}>$19</span>
                  <span className="text-slate-500 text-sm font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>/ month</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>Massive surveillance capacity for professionals and high-volume operations.</p>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {[
                  { text: 'Bypass daily scan limits', highlight: true },
                  { text: 'Deep clause extraction', highlight: false },
                  { text: 'Unlimited persistent history', highlight: false },
                  { text: 'PDF & TXT professional exports', highlight: false },
                  { text: 'Priority Llama-3.3 inference', highlight: false },
                ].map((item) => (
                  <li key={item.text} className={`flex items-center gap-3 text-sm font-sans ${item.highlight ? 'text-white' : 'text-slate-300'}`} style={{ fontFamily: "'system-ui', sans-serif" }}>
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-blue-400" />
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleUpgradeRoute}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-900/30 transition text-sm font-sans"
                style={{ fontFamily: "'system-ui', sans-serif" }}
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-slate-400">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold tracking-tight font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>Vigilate</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-600 font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>
              <a href="mailto:architechsystems.lk@gmail.com" className="hover:text-slate-400 transition">architechsystems.lk@gmail.com</a>
              <a href="/privacy" className="hover:text-slate-400 transition">Privacy Policy</a>
              <a href="/terms" className="hover:text-slate-400 transition">Terms of Service</a>
            </div>
          </div>
          <p className="text-center text-xs text-slate-700 max-w-2xl mx-auto leading-relaxed font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>
            Vigilate provides AI-assisted text analysis and clause extraction for informational purposes only. It does not constitute legal advice and no attorney-client relationship is formed. Always consult a qualified attorney before signing binding agreements. © 2026 Vigilate Intelligence.
          </p>
        </div>
      </footer>

      {/* Sample Report Modal */}
      {showSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && setShowSample(false)}>
          <div className="bg-[#0c1220] border border-slate-700/60 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0c1220]/90 sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2.5 mb-0.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <h2 className="text-base font-semibold text-white font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>Sample Analysis Report</h2>
                </div>
                <p className="text-xs text-slate-600 font-mono mt-0.5">Senior_Dev_Employment_Agreement_v2.pdf</p>
              </div>
              <button
                onClick={() => setShowSample(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto">

              {/* Risk Scorecard */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-sans mb-1" style={{ fontFamily: "'system-ui', sans-serif" }}>Risk Assessment</p>
                  <p className="text-red-400/70 text-xs font-mono">Critical vulnerabilities detected in clauses 4 and 9.</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-red-500 tabular-nums" style={{ fontFamily: "'Georgia', serif" }}>8</div>
                  <div className="text-xs text-slate-700 font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>/10 risk</div>
                </div>
              </div>

              <div className="space-y-8 text-slate-300 font-sans" style={{ fontFamily: "'system-ui', sans-serif" }}>

                <section>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-3 pb-2 border-b border-slate-800">Executive Summary</h3>
                  <p className="text-sm leading-relaxed text-slate-400">This document is a standard-form Employment Agreement for a Senior Software Engineering role. While compensation and equity vesting schedules are market-standard, the post-employment restrictive covenants are highly aggressive and heavily favor the employer.</p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-3 pb-2 border-b border-slate-800">Red Flags & Risks</h3>
                  <ul className="space-y-3">
                    {[
                      { title: 'Asymmetric IP Assignment (Page 4, Clause 4.2)', desc: 'The definition of "Company Intellectual Property" includes projects developed on your personal time using personal equipment, unless you can definitively prove the concept predated your start date.' },
                      { title: 'Predatory Non-Compete (Page 7, Clause 9.1)', desc: 'Prohibits you from working for any "competitor" globally for 24 months. The term "competitor" is vaguely defined as any company utilizing cloud infrastructure — effectively barring you from the tech sector.' },
                      { title: 'Uncapped Indemnification (Page 11, Clause 14)', desc: 'You agree to personally indemnify the employer against "any and all claims" arising from your code, bypassing corporate liability shields.' }
                    ].map((flag) => (
                      <li key={flag.title} className="bg-red-500/5 border-l-2 border-red-500/60 pl-4 pr-4 py-3.5 rounded-r-xl">
                        <strong className="text-red-400 text-xs block mb-1.5 font-semibold">{flag.title}</strong>
                        <p className="text-slate-400 text-xs leading-relaxed">{flag.desc}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-3 pb-2 border-b border-slate-800">Benefits & Rights</h3>
                  <ul className="space-y-2.5">
                    {[
                      { title: 'Equity Vesting (Page 2)', desc: 'Standard 4-year vesting with a 1-year cliff.' },
                      { title: 'Severance (Page 8)', desc: '3 months base salary upon termination without cause — slightly above industry average.' }
                    ].map((b) => (
                      <li key={b.title} className="flex items-start gap-3 text-xs text-slate-400">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        </span>
                        <div><strong className="text-slate-300">{b.title}:</strong> {b.desc}</div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-800 text-center">
                <button
                  onClick={handleAuthRoute}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-7 rounded-xl transition shadow-lg shadow-blue-900/20 text-sm"
                >
                  Analyze Your Document <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}